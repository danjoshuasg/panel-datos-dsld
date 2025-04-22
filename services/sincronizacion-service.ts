import { createClient } from "@/utils/supabase/client"
import type { Defensoria } from "@/services/defensorias-service"

// Interfaces
export interface DefensoriaSincronizacion extends Defensoria {
  estado_sisdna: string
  txt_campos_desactualizados: string | null
}

export interface EstadoSincronizacion {
  nid_estado: string
  nombre_estado: string
}

export interface SearchParams {
  ubigeo: string | null
  codigoDna: string
  estadoSincronizacion: string | null
  page: number
  pageSize: number
}

export interface SearchResult {
  defensorias: DefensoriaSincronizacion[]
  totalRecords: number
}

// Clase de servicio para sincronización
class SincronizacionService {
  private supabase = createClient()
  private cache: {
    estadosSincronizacion?: EstadoSincronizacion[]
    ubigeoNames: Record<string, string>
  } = {
    ubigeoNames: {},
  }

  // Obtener estados de sincronización
  async getEstadosSincronizacion(): Promise<EstadoSincronizacion[]> {
    // Usar caché si está disponible
    if (this.cache.estadosSincronizacion) {
      return this.cache.estadosSincronizacion
    }

    const { data, error } = await this.supabase.from("sincronizacion_estados").select("nid_estado, nombre_estado")

    if (error) throw new Error(`Error al cargar estados de sincronización: ${error.message}`)

    this.cache.estadosSincronizacion = data || []
    return data || []
  }

  // Aplicar filtros a una consulta
  private applyFilters(query: any, params: SearchParams) {
    let filteredQuery = query

    // Aplicar filtro de ubigeo
    if (params.ubigeo) {
      const ubigeoLength = params.ubigeo.replace(/0+$/, "").length

      if (ubigeoLength <= 2) {
        filteredQuery = filteredQuery.like("nid_ubigeo", params.ubigeo.substring(0, 2) + "%")
      } else if (ubigeoLength <= 4) {
        filteredQuery = filteredQuery.like("nid_ubigeo", params.ubigeo.substring(0, 4) + "%")
      } else {
        filteredQuery = filteredQuery.eq("nid_ubigeo", params.ubigeo)
      }
    }

    // Aplicar filtro de código DNA
    if (params.codigoDna) {
      filteredQuery = filteredQuery.ilike("codigo_dna", `%${params.codigoDna}%`)
    }

    // Aplicar filtro de estado de sincronización
    if (params.estadoSincronizacion && params.estadoSincronizacion !== "all") {
      filteredQuery = filteredQuery.eq("nid_estado_sisdna", params.estadoSincronizacion)
    }

    return filteredQuery
  }

  // Obtener conteo total de registros
  async getTotalRecords(params: SearchParams): Promise<number> {
    let countQuery = this.supabase.from("defensorias").select("*", { count: "exact", head: true })
    countQuery = this.applyFilters(countQuery, params)

    const { count, error } = await countQuery

    if (error) throw new Error(`Error al obtener conteo de registros: ${error.message}`)

    return count || 0
  }

  // Buscar defensorías con paginación
  async searchDefensorias(params: SearchParams): Promise<SearchResult> {
    try {
      // Obtener conteo total
      const totalRecords = await this.getTotalRecords(params)

      // Calcular rangos para paginación
      const from = (params.page - 1) * params.pageSize
      const to = from + params.pageSize - 1

      // Consulta principal con paginación
      let query = this.supabase
        .from("defensorias")
        .select(`
          codigo_dna,
          txt_nombre,
          nid_ubigeo,
          txt_direccion,
          txt_telefono,
          txt_correo,
          nid_estado_sisdna,
          txt_campos_desactualizados
        `)
        .range(from, to)

      // Aplicar filtros
      query = this.applyFilters(query, params)

      const { data: defensoriasData, error: defensoriasError } = await query

      if (defensoriasError) throw new Error(`Error al buscar defensorías: ${defensoriasError.message}`)

      if (!defensoriasData || defensoriasData.length === 0) {
        return { defensorias: [], totalRecords }
      }

      // Extraer conjuntos únicos de estados y ubigeos
      const estadosSet = new Set<string>()
      const ubigeoSet = new Set<string>()

      defensoriasData.forEach((def: any) => {
        if (def.nid_estado_sisdna) estadosSet.add(def.nid_estado_sisdna)
        if (def.nid_ubigeo) ubigeoSet.add(def.nid_ubigeo)
      })

      // Convertir a arrays
      const estadosArray = Array.from(estadosSet)
      const ubigeosArray = Array.from(ubigeoSet)

      // Consultas en paralelo para mejorar rendimiento
      const [estadosData, ubigeosData] = await Promise.all([
        this.getEstadosSincronizacion(),
        this.getUbigeos(ubigeosArray),
      ])

      // Crear mapas para búsqueda rápida
      const estadosMap = new Map<string, string>()
      estadosData.forEach((estado: EstadoSincronizacion) => {
        estadosMap.set(estado.nid_estado, estado.nombre_estado)
      })

      const ubigeosMap = new Map<string, string>()
      ubigeosData.forEach((ubigeo: any) => {
        ubigeosMap.set(ubigeo.codigo_ubigeo, ubigeo.txt_nombre)
        // Guardar en caché para futuras consultas
        this.cache.ubigeoNames[ubigeo.codigo_ubigeo] = ubigeo.txt_nombre
      })

      // Combinar los datos
      const formattedData: DefensoriaSincronizacion[] = defensoriasData.map((def: any) => ({
        codigo_dna: def.codigo_dna,
        txt_nombre: def.txt_nombre,
        tipo_demuna: "", // No necesario para esta vista
        nid_ubigeo: def.nid_ubigeo,
        txt_direccion: def.txt_direccion || "",
        txt_telefono: def.txt_telefono || "",
        txt_correo: def.txt_correo || "",
        estado_acreditacion: "", // No necesario para esta vista
        nombre_ubigeo: ubigeosMap.get(def.nid_ubigeo) || "",
        estado_sisdna: estadosMap.get(def.nid_estado_sisdna) || "NO ACTUALIZADA",
        txt_campos_desactualizados: def.txt_campos_desactualizados,
      }))

      // Enriquecer con información de departamento y provincia
      const formattedDataWithRegions = await this.enrichWithRegionInfo(formattedData)

      return {
        defensorias: formattedDataWithRegions,
        totalRecords,
      }
    } catch (error) {
      console.error("Error en searchDefensorias:", error)
      throw error
    }
  }

  // Obtener ubigeos
  private async getUbigeos(codigos: string[]): Promise<any[]> {
    if (codigos.length === 0) return []

    // Filtrar códigos que ya están en caché
    const codigosAConsultar = codigos.filter((codigo) => !this.cache.ubigeoNames[codigo])

    if (codigosAConsultar.length === 0) {
      // Todos los códigos están en caché, construir resultado desde caché
      return codigos.map((codigo) => ({
        codigo_ubigeo: codigo,
        txt_nombre: this.cache.ubigeoNames[codigo] || "",
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
      this.cache.ubigeoNames[ubigeo.codigo_ubigeo] = ubigeo.txt_nombre
    })

    // Combinar resultados de caché y consulta
    const cachedUbigeos = codigos
      .filter((codigo) => !codigosAConsultar.includes(codigo))
      .map((codigo) => ({
        codigo_ubigeo: codigo,
        txt_nombre: this.cache.ubigeoNames[codigo] || "",
      }))

    return [...(data || []), ...cachedUbigeos]
  }

  // Enriquecer defensorías con información de región
  private async enrichWithRegionInfo(defensorias: DefensoriaSincronizacion[]): Promise<DefensoriaSincronizacion[]> {
    // Extraer códigos únicos de departamento y provincia
    const depCodes = new Set<string>()
    const provCodes = new Set<string>()

    defensorias.forEach((def) => {
      const depCode = def.nid_ubigeo.substring(0, 2) + "0000"
      const provCode = def.nid_ubigeo.substring(0, 4) + "00"
      depCodes.add(depCode)
      provCodes.add(provCode)
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
    return defensorias.map((def) => {
      const depCode = def.nid_ubigeo.substring(0, 2) + "0000"
      const provCode = def.nid_ubigeo.substring(0, 4) + "00"

      return {
        ...def,
        departamento: depMap.get(depCode) || "Desconocido",
        provincia: provMap.get(provCode) || "Desconocido",
        distrito: def.nombre_ubigeo,
      }
    })
  }
}

// Exportar una instancia única del servicio
export const sincronizacionService = new SincronizacionService()
