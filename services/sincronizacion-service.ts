import { BaseService, type BaseSearchParams, type BaseSearchResult } from "@/lib/base-service"
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

export interface SearchParams extends BaseSearchParams {
  ubigeo: string | null
  codigoDna: string
  estadoSincronizacion: string | null
}

export interface SearchResult extends BaseSearchResult<DefensoriaSincronizacion> {
  defensorias: DefensoriaSincronizacion[]
}

// Clase de servicio para sincronización
class SincronizacionService extends BaseService<DefensoriaSincronizacion, SearchParams, SearchResult> {
  protected override initializeCache(): void {
    this.cache = {
      estadosSincronizacion: undefined,
    }
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

  // Implementación del método abstracto para aplicar filtros
  protected override applyFilters(query: any, params: SearchParams): any {
    let filteredQuery = this.applyUbigeoFilter(query, params.ubigeo)
    filteredQuery = this.applyCodigoDnaFilter(filteredQuery, params.codigoDna)

    // Aplicar filtro de estado de sincronización
    if (params.estadoSincronizacion && params.estadoSincronizacion !== "all") {
      filteredQuery = filteredQuery.eq("nid_estado_sisdna", params.estadoSincronizacion)
    }

    return filteredQuery
  }

  // Implementación del método abstracto para buscar defensorías
  public override async search(params: SearchParams): Promise<SearchResult> {
    try {
      // Obtener conteo total
      const totalRecords = await this.getTotalRecords("defensorias", params)

      // Calcular rangos para paginación
      const { from, to } = this.getPaginationRange(params.page, params.pageSize)

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
        return { defensorias: [], items: [], totalRecords }
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
        items: formattedDataWithRegions,
        totalRecords,
      }
    } catch (error) {
      console.error("Error en search:", error)
      throw error
    }
  }

  // Método de compatibilidad para mantener la API existente
  async searchDefensorias(params: SearchParams): Promise<SearchResult> {
    return this.search(params)
  }
}

// Exportar una instancia única del servicio
export const sincronizacionService = new SincronizacionService()
