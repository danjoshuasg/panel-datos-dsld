import { createClient } from "@/utils/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"

// Interfaz genérica para parámetros de búsqueda con paginación
export interface BaseSearchParams {
  page: number
  pageSize: number
}

// Interfaz genérica para resultados de búsqueda
export interface BaseSearchResult<T> {
  items: T[]
  totalRecords: number
}

// Clase base abstracta para servicios
export abstract class BaseService<T, P extends BaseSearchParams, R = BaseSearchResult<T>> {
  protected supabase: SupabaseClient
  protected cache: Record<string, any> = {}
  protected ubigeoCache: Record<string, string> = {}
  protected caracteristicasCache: Record<string, string> = {}

  constructor() {
    this.supabase = createClient()
    this.initializeCache()
  }

  // Método para inicializar la caché específica del servicio
  protected initializeCache(): void {
    // Implementación por defecto vacía, las clases hijas pueden sobrescribirlo
  }

  // Método abstracto para aplicar filtros específicos del servicio
  protected abstract applyFilters(query: any, params: P): any

  // Método abstracto para buscar entidades
  public abstract search(params: P): Promise<R>

  // Método para aplicar filtro de ubigeo
  protected applyUbigeoFilter(query: any, ubigeo: string | null): any {
    if (!ubigeo) return query

    const ubigeoLength = ubigeo.replace(/0+$/, "").length

    if (ubigeoLength <= 2) {
      return query.like("nid_ubigeo", ubigeo.substring(0, 2) + "%")
    } else if (ubigeoLength <= 4) {
      return query.like("nid_ubigeo", ubigeo.substring(0, 4) + "%")
    } else {
      return query.eq("nid_ubigeo", ubigeo)
    }
  }

  // Método para aplicar filtro de código DNA
  protected applyCodigoDnaFilter(query: any, codigoDna: string | null): any {
    if (!codigoDna) return query
    return query.ilike("codigo_dna", `%${codigoDna}%`)
  }

  // Método para obtener conteo total de registros
  protected async getTotalRecords(tableName: string, params: P): Promise<number> {
    let countQuery = this.supabase.from(tableName).select("*", { count: "exact", head: true })
    countQuery = this.applyFilters(countQuery, params)

    const { count, error } = await countQuery

    if (error) throw new Error(`Error al obtener conteo de registros: ${error.message}`)

    return count || 0
  }

  // Método para obtener características desde la tabla de características
  protected async getCaracteristicas(
    claves: string[],
  ): Promise<Array<{ clave_caracteristica: string; valor_caracteristica: string }>> {
    if (claves.length === 0) return []

    // Filtrar claves que ya están en caché
    const clavesAConsultar = claves.filter((clave) => !this.caracteristicasCache[clave])

    if (clavesAConsultar.length === 0) {
      // Todas las claves están en caché, construir resultado desde caché
      return claves.map((clave) => ({
        clave_caracteristica: clave,
        valor_caracteristica: this.caracteristicasCache[clave] || "",
      }))
    }

    const { data, error } = await this.supabase
      .from("defensorias_caracteristicas")
      .select("clave_caracteristica, valor_caracteristica")
      .in("clave_caracteristica", clavesAConsultar)

    if (error)
      throw new Error(`Error al obtener características: ${error.message}`)

      // Actualizar caché con nuevos datos
    ;(data || []).forEach((caracteristica) => {
      this.caracteristicasCache[caracteristica.clave_caracteristica] = caracteristica.valor_caracteristica
    })

    // Combinar resultados de caché y consulta
    const cachedCaracteristicas = claves
      .filter((clave) => !clavesAConsultar.includes(clave))
      .map((clave) => ({
        clave_caracteristica: clave,
        valor_caracteristica: this.caracteristicasCache[clave] || "",
      }))

    return [...(data || []), ...cachedCaracteristicas]
  }

  // Método para obtener ubigeos
  protected async getUbigeos(codigos: string[]): Promise<any[]> {
    if (codigos.length === 0) return []

    // Filtrar códigos que ya están en caché
    const codigosAConsultar = codigos.filter((codigo) => !this.ubigeoCache[codigo])

    if (codigosAConsultar.length === 0) {
      // Todos los códigos están en caché, construir resultado desde caché
      return codigos.map((codigo) => ({
        codigo_ubigeo: codigo,
        txt_nombre: this.ubigeoCache[codigo] || "",
      }))
    }

    const { data, error } = await this.supabase
      .from("ubigeos")
      .select("codigo_ubigeo, txt_nombre")
      .in("codigo_ubigeo", codigosAConsultar)

    if (error)
      throw new Error(`Error al obtener ubigeos: ${error.message}`)

      // Actualizar caché con nuevos datos
    ;(data || []).forEach((ubigeo) => {
      this.ubigeoCache[ubigeo.codigo_ubigeo] = ubigeo.txt_nombre
    })

    // Combinar resultados de caché y consulta
    const cachedUbigeos = codigos
      .filter((codigo) => !codigosAConsultar.includes(codigo))
      .map((codigo) => ({
        codigo_ubigeo: codigo,
        txt_nombre: this.ubigeoCache[codigo] || "",
      }))

    return [...(data || []), ...cachedUbigeos]
  }

  // Método para enriquecer entidades con información de región
  protected async enrichWithRegionInfo<E extends { nid_ubigeo: string; nombre_ubigeo?: string }>(
    entities: E[],
  ): Promise<(E & { departamento?: string; provincia?: string; distrito?: string })[]> {
    if (entities.length === 0) return []

    // Extraer códigos únicos de departamento y provincia
    const depCodes = new Set<string>()
    const provCodes = new Set<string>()

    entities.forEach((entity) => {
      if (entity.nid_ubigeo) {
        const depCode = entity.nid_ubigeo.substring(0, 2) + "0000"
        const provCode = entity.nid_ubigeo.substring(0, 4) + "00"
        depCodes.add(depCode)
        provCodes.add(provCode)
      }
    })

    // Consultar en paralelo
    const [departamentos, provincias] = await Promise.all([
      this.getUbigeos(Array.from(depCodes)),
      this.getUbigeos(Array.from(provCodes)),
    ])

    // Crear mapas para búsqueda rápida
    const depMap = new Map<string, string>()
    departamentos.forEach((dep) => {
      depMap.set(dep.codigo_ubigeo, dep.txt_nombre)
    })

    const provMap = new Map<string, string>()
    provincias.forEach((prov) => {
      provMap.set(prov.codigo_ubigeo, prov.txt_nombre)
    })

    // Enriquecer datos
    return entities.map((entity) => {
      if (!entity.nid_ubigeo) {
        return {
          ...entity,
          departamento: "Desconocido",
          provincia: "Desconocido",
          distrito: entity.nombre_ubigeo || "Desconocido",
        }
      }

      const depCode = entity.nid_ubigeo.substring(0, 2) + "0000"
      const provCode = entity.nid_ubigeo.substring(0, 4) + "00"

      return {
        ...entity,
        departamento: depMap.get(depCode) || "Desconocido",
        provincia: provMap.get(provCode) || "Desconocido",
        distrito: entity.nombre_ubigeo || "Desconocido",
      }
    })
  }

  // Método para calcular rangos de paginación
  protected getPaginationRange(page: number, pageSize: number): { from: number; to: number } {
    const from = Math.max(0, (page - 1) * pageSize)
    const to = from + pageSize - 1
    return { from, to }
  }
}
