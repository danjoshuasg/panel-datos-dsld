import { createClient } from "@/utils/supabase/client"

// Interfaces
export interface SupervisionSincronizacion {
  nid_supervision: number
  codigo_dna: string
  fecha: string
  supervisor: string
  modalidad: string
  estado_sisdna: string
  txt_campos_desactualizados: string | null
  nombre_demuna?: string
  ubicacion?: string
}

export interface EstadoSincronizacion {
  nid_estado: string
  nombre_estado: string
}

export interface SearchParams {
  ubigeo: string | null
  codigoDna: string
  fechaDesde: string | null
  fechaHasta: string | null
  supervisor: string | null
  estadoSincronizacion: string | null
  page: number
  pageSize: number
}

export interface SearchResult {
  supervisiones: SupervisionSincronizacion[]
  totalRecords: number
}

// Clase de servicio para sincronización de supervisiones
class SincronizacionSupervisionesService {
  private supabase = createClient()
  private cache: {
    estadosSincronizacion?: EstadoSincronizacion[]
    supervisores?: { codigo_supervisor: number; nombre_supervisor: string }[]
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

    try {
      const { data, error } = await this.supabase.from("sincronizacion_estados").select("nid_estado, nombre_estado")

      if (error) throw new Error(`Error al cargar estados de sincronización: ${error.message}`)

      this.cache.estadosSincronizacion = data || []
      return data || []
    } catch (error) {
      console.error("Error al cargar estados de sincronización:", error)

      // Datos de respaldo en caso de error
      const fallbackData = [
        { nid_estado: "1", nombre_estado: "ACTUALIZADA" },
        { nid_estado: "2", nombre_estado: "NO ACTUALIZADA" },
        { nid_estado: "3", nombre_estado: "FALTANTE" },
      ]

      this.cache.estadosSincronizacion = fallbackData
      return fallbackData
    }
  }

  // Obtener supervisores
  async getSupervisores() {
    // Usar caché si está disponible
    if (this.cache.supervisores) {
      return this.cache.supervisores
    }

    try {
      // Crear una promesa con timeout para evitar esperas largas
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => {
          console.log("Supervisor query timed out, using fallback data")
          return null
        }, 3000)
      })

      try {
        const fetchPromise = this.supabase
          .from("supervisores")
          .select("codigo_supervisor, nombre_supervisor")
          .eq("flg_activo_dsld", true)
          .order("nombre_supervisor", { ascending: true })

        const result = await Promise.race([fetchPromise, timeoutPromise])

        if (result && result.data) {
          this.cache.supervisores = result.data
          return result.data
        }
      } catch (err) {
        console.log("Error fetching supervisors, using fallback data")
      }

      // Datos de respaldo
      const fallbackSupervisores = [
        { codigo_supervisor: 1, nombre_supervisor: "MARCOS DELFÍN" },
        { codigo_supervisor: 2, nombre_supervisor: "MARÍA LÓPEZ" },
        { codigo_supervisor: 3, nombre_supervisor: "JUAN PÉREZ" },
      ]

      this.cache.supervisores = fallbackSupervisores
      return fallbackSupervisores
    } catch (error) {
      console.error("Error en getSupervisores:", error)

      // Datos de respaldo en caso de error
      const fallbackSupervisores = [
        { codigo_supervisor: 1, nombre_supervisor: "MARCOS DELFÍN" },
        { codigo_supervisor: 2, nombre_supervisor: "MARÍA LÓPEZ" },
        { codigo_supervisor: 3, nombre_supervisor: "JUAN PÉREZ" },
      ]

      this.cache.supervisores = fallbackSupervisores
      return fallbackSupervisores
    }
  }

  // Aplicar filtros a una consulta
  private applyFilters(query: any, params: SearchParams) {
    let filteredQuery = query

    // Aplicar filtro de código DNA
    if (params.codigoDna) {
      filteredQuery = filteredQuery.ilike("codigo_dna", `%${params.codigoDna}%`)
    }

    // Aplicar filtro de supervisor
    if (params.supervisor && params.supervisor !== "all") {
      filteredQuery = filteredQuery.eq("codigo_supervisor", params.supervisor)
    }

    // Aplicar filtro de fecha desde
    if (params.fechaDesde) {
      filteredQuery = filteredQuery.gte("fecha", params.fechaDesde)
    }

    // Aplicar filtro de fecha hasta
    if (params.fechaHasta) {
      filteredQuery = filteredQuery.lte("fecha", params.fechaHasta)
    }

    // Aplicar filtro de estado de sincronización
    if (params.estadoSincronizacion && params.estadoSincronizacion !== "all") {
      filteredQuery = filteredQuery.eq("nid_estado_sisdna", params.estadoSincronizacion)
    }

    return filteredQuery
  }

  // Obtener conteo total de registros
  async getTotalRecords(params: SearchParams): Promise<number> {
    try {
      let query = this.supabase.from("supervisiones").select("*", { count: "exact", head: true })

      // Aplicar filtros
      query = this.applyFilters(query, params)

      // Si hay filtro de ubigeo, aplicarlo de manera especial
      if (params.ubigeo) {
        // Primero obtenemos las defensorías que coinciden con el ubigeo
        const ubigeoLength = params.ubigeo.replace(/0+$/, "").length

        const { data: defensorias } = await this.supabase
          .from("defensorias")
          .select("codigo_dna")
          .like(
            "nid_ubigeo",
            ubigeoLength <= 2
              ? params.ubigeo.substring(0, 2) + "%"
              : ubigeoLength <= 4
                ? params.ubigeo.substring(0, 4) + "%"
                : params.ubigeo,
          )

        if (defensorias && defensorias.length > 0) {
          const codigosDna = defensorias.map((d) => d.codigo_dna)
          query = query.in("codigo_dna", codigosDna)
        } else {
          // Si no hay defensorías que coincidan, devolver 0 resultados
          return 0
        }
      }

      const { count, error } = await query

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error("Error en getTotalRecords:", error)
      return 0
    }
  }

  // Buscar supervisiones con paginación
  async searchSupervisiones(params: SearchParams): Promise<SearchResult> {
    try {
      // Validar parámetros de entrada
      if (params.page < 1) params.page = 1
      if (params.pageSize < 1) params.pageSize = 25
      if (params.pageSize > 100) params.pageSize = 100 // Limitar tamaño máximo de página

      // Validar fechas
      if (params.fechaDesde && params.fechaHasta) {
        if (new Date(params.fechaDesde) > new Date(params.fechaHasta)) {
          throw new Error("La fecha inicial no puede ser posterior a la fecha final")
        }
      }

      // Obtener el conteo total de registros primero
      const totalRecords = await this.getTotalRecords(params)

      // Si no hay resultados, terminar aquí
      if (totalRecords === 0) {
        return {
          supervisiones: [],
          totalRecords: 0,
        }
      }

      // Construir la consulta base para obtener los datos
      let query = this.supabase.from("supervisiones").select(`
          nid_supervision,
          codigo_dna,
          fecha,
          codigo_supervisor,
          nid_modalidad,
          nid_estado_sisdna,
          txt_campos_desactualizados
        `)

      // Aplicar filtros comunes
      query = this.applyFilters(query, params)

      // Si hay filtro de ubigeo, aplicarlo de manera especial
      if (params.ubigeo) {
        // Primero obtenemos las defensorías que coinciden con el ubigeo
        const ubigeoLength = params.ubigeo.replace(/0+$/, "").length

        const { data: defensorias } = await this.supabase
          .from("defensorias")
          .select("codigo_dna")
          .like(
            "nid_ubigeo",
            ubigeoLength <= 2
              ? params.ubigeo.substring(0, 2) + "%"
              : ubigeoLength <= 4
                ? params.ubigeo.substring(0, 4) + "%"
                : params.ubigeo,
          )

        if (defensorias && defensorias.length > 0) {
          const codigosDna = defensorias.map((d) => d.codigo_dna)
          query = query.in("codigo_dna", codigosDna)
        } else {
          // Si no hay defensorías que coincidan, devolver 0 resultados
          return {
            supervisiones: [],
            totalRecords: 0,
          }
        }
      }

      // Aplicar paginación y ordenamiento
      query = query
        .order("fecha", { ascending: false })
        .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1)

      // Ejecutar la consulta
      const { data: supervisionesData, error } = await query

      if (error) throw error

      if (!supervisionesData || supervisionesData.length === 0) {
        return {
          supervisiones: [],
          totalRecords: 0,
        }
      }

      // Obtener información adicional para cada supervisión
      const supervisionesIds = supervisionesData.map((s) => s.nid_supervision)
      const supervisionesCodigosDna = supervisionesData.map((s) => s.codigo_dna)
      const supervisionesModalidades = [...new Set(supervisionesData.map((s) => s.nid_modalidad).filter(Boolean))]
      const supervisionesSupervisores = [...new Set(supervisionesData.map((s) => s.codigo_supervisor).filter(Boolean))]
      const supervisionesEstados = [...new Set(supervisionesData.map((s) => s.nid_estado_sisdna).filter(Boolean))]

      // Obtener nombres de modalidades
      const { data: modalidadesData } = await this.supabase
        .from("supervision_modalidades")
        .select("nid_modalidad, nombre_modalidad")
        .in("nid_modalidad", supervisionesModalidades)

      // Obtener nombres de supervisores
      const { data: supervisoresData } = await this.supabase
        .from("supervisores")
        .select("codigo_supervisor, nombre_supervisor")
        .in("codigo_supervisor", supervisionesSupervisores)

      // Obtener nombres de estados
      const { data: estadosData } = await this.supabase
        .from("sincronizacion_estados")
        .select("nid_estado, nombre_estado")
        .in("nid_estado", supervisionesEstados)

      // Obtener nombres de DEMUNAS
      const { data: demunasData } = await this.supabase
        .from("defensorias")
        .select("codigo_dna, txt_nombre, nid_ubigeo")
        .in("codigo_dna", supervisionesCodigosDna)

      // Crear mapas para búsqueda rápida
      const modalidadesMap = new Map()
      modalidadesData?.forEach((m) => {
        modalidadesMap.set(m.nid_modalidad, m.nombre_modalidad)
      })

      const supervisoresMap = new Map()
      supervisoresData?.forEach((s) => {
        supervisoresMap.set(s.codigo_supervisor, s.nombre_supervisor)
      })

      const estadosMap = new Map()
      estadosData?.forEach((e) => {
        estadosMap.set(e.nid_estado, e.nombre_estado)
      })

      const demunasMap = new Map()
      demunasData?.forEach((d) => {
        demunasMap.set(d.codigo_dna, { nombre: d.txt_nombre, ubigeo: d.nid_ubigeo })
      })

      // Obtener información de ubicación para cada DEMUNA
      const ubicacionesPromises =
        demunasData?.map(async (demuna) => {
          if (!demuna.nid_ubigeo) return { codigo_dna: demuna.codigo_dna, ubicacion: "No especificada" }

          // Obtener los ubigeos necesarios (departamento, provincia, distrito)
          const codigoDepartamento = demuna.nid_ubigeo.substring(0, 2) + "0000"
          const codigoProvincia = demuna.nid_ubigeo.substring(0, 4) + "00"
          const codigoDistrito = demuna.nid_ubigeo

          const { data: ubigeos } = await this.supabase
            .from("ubigeos")
            .select("codigo_ubigeo, txt_nombre")
            .in("codigo_ubigeo", [codigoDepartamento, codigoProvincia, codigoDistrito])

          if (!ubigeos || ubigeos.length === 0) {
            return { codigo_dna: demuna.codigo_dna, ubicacion: "No especificada" }
          }

          // Crear un mapa para los ubigeos
          const ubigeosMap = new Map()
          ubigeos.forEach((u) => {
            ubigeosMap.set(u.codigo_ubigeo, u.txt_nombre)
          })

          // Construir la cadena de ubicación
          const departamento = ubigeosMap.get(codigoDepartamento) || "No especificado"
          const provincia = ubigeosMap.get(codigoProvincia) || "No especificada"
          const distrito = ubigeosMap.get(codigoDistrito) || "No especificado"

          const ubicacion = `${departamento} / ${provincia} / ${distrito}`

          return { codigo_dna: demuna.codigo_dna, ubicacion }
        }) || []

      // Esperar a que todas las promesas de ubicación se resuelvan
      const ubicaciones = await Promise.all(ubicacionesPromises)

      // Crear un mapa de ubicaciones
      const ubicacionesMap = new Map()
      ubicaciones.forEach((u) => {
        ubicacionesMap.set(u.codigo_dna, u.ubicacion)
      })

      // Combinar los datos
      const supervisiones: SupervisionSincronizacion[] = supervisionesData.map((s) => {
        const demunaInfo = demunasMap.get(s.codigo_dna)

        return {
          nid_supervision: s.nid_supervision,
          codigo_dna: s.codigo_dna,
          fecha: s.fecha,
          supervisor: supervisoresMap.get(s.codigo_supervisor) || "No asignado",
          modalidad: modalidadesMap.get(s.nid_modalidad) || "No especificada",
          estado_sisdna: estadosMap.get(s.nid_estado_sisdna) || "No especificado",
          txt_campos_desactualizados: s.txt_campos_desactualizados,
          nombre_demuna: demunaInfo?.nombre || "No especificada",
          ubicacion: ubicacionesMap.get(s.codigo_dna) || "No especificada",
        }
      })

      return {
        supervisiones,
        totalRecords,
      }
    } catch (error) {
      console.error("Error en searchSupervisiones:", error)
      // En caso de error, devolver un resultado vacío pero válido
      return {
        supervisiones: [],
        totalRecords: 0,
      }
    }
  }
}

// Exportar una instancia única del servicio
export const sincronizacionSupervisionesService = new SincronizacionSupervisionesService()
