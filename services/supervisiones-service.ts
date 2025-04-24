import { BaseService, type BaseSearchParams, type BaseSearchResult } from "@/lib/base-service"

// Interfaces
export interface Supervision {
  nid_supervision: number
  codigo_dna: string
  fecha: string
  supervisor: string
  modalidad: string
  ficha: string | null
  doc_seguimiento: string | null
  subsanacion: boolean | null
  doc_reiterativo: string | null
  doc_oci: string | null
  fecha_cierre: string | null
  doc_cierre: string | null
  tipo_cierre: string | null
  nombre_demuna?: string
  departamento?: string
  provincia?: string
  distrito?: string
}

export interface SupervisionRaw {
  nid_supervision: number
  codigo_dna: string
  fecha: string
  codigo_supervisor: number
  nid_modalidad: number
}

export interface Supervisor {
  codigo_supervisor: number
  nombre_supervisor: string
}

export interface Modalidad {
  nid_modalidad: number
  nombre_modalidad: string
}

export interface SupervisionesSearchParams extends BaseSearchParams {
  ubigeo?: string | null
  codigoDna?: string
  fechaDesde?: string | null
  fechaHasta?: string | null
  supervisor?: string | null
}

export interface SupervisionesSearchResult extends BaseSearchResult<Supervision> {
  supervisiones: Supervision[]
}

// Clase de servicio para supervisiones
class SupervisionesService extends BaseService<Supervision, SupervisionesSearchParams, SupervisionesSearchResult> {
  protected override initializeCache(): void {
    super.initializeCache()
    this.cache.supervisores = undefined
    this.cache.modalidades = undefined
    this.cache.seguimientos = {}
    this.cache.fichas = {}
    this.cache.demunasInfo = {}
  }

  // Obtener supervisores
  async getSupervisores(): Promise<Supervisor[]> {
    // Usar caché si está disponible
    if (this.cache.supervisores) {
      return this.cache.supervisores
    }

    try {
      const { data, error } = await this.supabase
        .from("supervisores")
        .select("codigo_supervisor, nombre_supervisor")
        .eq("flg_activo_dsld", true)
        .order("nombre_supervisor", { ascending: true })

      if (error) throw new Error(`Error al cargar supervisores: ${error.message}`)

      this.cache.supervisores = data || []
      return data || []
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

  // Obtener modalidades de supervisión
  async getModalidades(): Promise<Modalidad[]> {
    // Usar caché si está disponible
    if (this.cache.modalidades) {
      return this.cache.modalidades
    }

    try {
      const { data, error } = await this.supabase
        .from("supervision_modalidades")
        .select("nid_modalidad, nombre_modalidad")
        .order("nombre_modalidad", { ascending: true })

      if (error) throw new Error(`Error al cargar modalidades: ${error.message}`)

      this.cache.modalidades = data || []
      return data || []
    } catch (error) {
      console.error("Error en getModalidades:", error)

      // Datos de respaldo en caso de error
      const fallbackModalidades = [
        { nid_modalidad: 1, nombre_modalidad: "Ordinaria" },
        { nid_modalidad: 2, nombre_modalidad: "Extraordinaria" },
        { nid_modalidad: 3, nombre_modalidad: "Seguimiento" },
      ]

      this.cache.modalidades = fallbackModalidades
      return fallbackModalidades
    }
  }

  // Aplicar filtros a una consulta
  protected override applyFilters(query: any, params: SupervisionesSearchParams): any {
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

    return filteredQuery
  }

  // Buscar supervisiones con paginación
  async search(params: SupervisionesSearchParams): Promise<SupervisionesSearchResult> {
    try {
      // Validar parámetros
      if (params.page < 1) params.page = 1
      if (params.pageSize < 1) params.pageSize = 25
      if (params.pageSize > 100) params.pageSize = 100

      // Validar fechas
      if (params.fechaDesde && params.fechaHasta) {
        if (new Date(params.fechaDesde) > new Date(params.fechaHasta)) {
          throw new Error("La fecha inicial no puede ser posterior a la fecha final")
        }
      }

      // Si hay filtro de ubigeo, primero obtenemos las defensorías que coinciden
      let codigosDnaFiltrados: string[] | null = null
      if (params.ubigeo) {
        const ubigeoLength = params.ubigeo.replace(/0+$/, "").length

        let ubigeoQuery = this.supabase.from("defensorias").select("codigo_dna")

        if (ubigeoLength <= 2) {
          ubigeoQuery = ubigeoQuery.like("nid_ubigeo", params.ubigeo.substring(0, 2) + "%")
        } else if (ubigeoLength <= 4) {
          ubigeoQuery = ubigeoQuery.like("nid_ubigeo", params.ubigeo.substring(0, 4) + "%")
        } else {
          ubigeoQuery = ubigeoQuery.eq("nid_ubigeo", params.ubigeo)
        }

        const { data: defensorias, error } = await ubigeoQuery

        if (error) throw new Error(`Error al filtrar por ubicación: ${error.message}`)

        if (!defensorias || defensorias.length === 0) {
          // Si no hay defensorías que coincidan, devolver resultado vacío
          return {
            supervisiones: [],
            items: [],
            totalRecords: 0,
          }
        }

        codigosDnaFiltrados = defensorias.map((d) => d.codigo_dna)
      }

      // Construir la consulta base
      let query = this.supabase.from("supervisiones").select(`
        nid_supervision,
        codigo_dna,
        fecha,
        codigo_supervisor,
        nid_modalidad
      `)

      // Aplicar filtros comunes
      query = this.applyFilters(query, params)

      // Aplicar filtro de códigos DNA si se filtró por ubigeo
      if (codigosDnaFiltrados) {
        query = query.in("codigo_dna", codigosDnaFiltrados)
      }

      // Obtener conteo total - AQUÍ ESTÁ EL PROBLEMA
      let totalRecords = 0
      try {
        // Crear una nueva consulta para el conteo para evitar problemas con la consulta original
        let countQuery = this.supabase.from("supervisiones").select("nid_supervision", { count: "exact", head: true })

        // Aplicar los mismos filtros a la consulta de conteo
        countQuery = this.applyFilters(countQuery, params)

        // Aplicar filtro de códigos DNA si se filtró por ubigeo
        if (codigosDnaFiltrados) {
          countQuery = countQuery.in("codigo_dna", codigosDnaFiltrados)
        }

        const { count, error: countError } = await countQuery

        if (countError) {
          console.error("Error al obtener conteo:", countError)
          // En lugar de lanzar un error, manejamos el caso con un valor predeterminado
          totalRecords = 0
        } else {
          totalRecords = count || 0
        }
      } catch (error) {
        console.error("Error al obtener conteo de registros:", error)
        // Manejamos el error de manera más robusta
        totalRecords = 0
      }

      // Si no hay resultados, terminar aquí
      if (totalRecords === 0) {
        return {
          supervisiones: [],
          items: [],
          totalRecords: 0,
        }
      }

      // Aplicar paginación
      const { from, to } = this.getPaginationRange(params.page, params.pageSize)
      query = query.range(from, to).order("fecha", { ascending: false })

      // Ejecutar la consulta
      const { data: supervisionesData, error: supervisionesError } = await query

      if (supervisionesError) throw new Error(`Error al buscar supervisiones: ${supervisionesError.message}`)

      if (!supervisionesData || supervisionesData.length === 0) {
        return {
          supervisiones: [],
          items: [],
          totalRecords,
        }
      }

      // Obtener información adicional para cada supervisión
      const supervisionesIds = supervisionesData.map((s) => s.nid_supervision)
      const supervisionesCodigosDna = supervisionesData.map((s) => s.codigo_dna)
      const supervisionesModalidades = [...new Set(supervisionesData.map((s) => s.nid_modalidad).filter(Boolean))]
      const supervisionesSupervisores = [...new Set(supervisionesData.map((s) => s.codigo_supervisor).filter(Boolean))]

      // Consultas en paralelo para mejorar rendimiento
      const [modalidadesData, supervisoresData, fichasData, seguimientosData, demunasData] = await Promise.all([
        // Obtener nombres de modalidades
        this.supabase
          .from("supervision_modalidades")
          .select("nid_modalidad, nombre_modalidad")
          .in("nid_modalidad", supervisionesModalidades),

        // Obtener nombres de supervisores
        this.supabase
          .from("supervisores")
          .select("codigo_supervisor, nombre_supervisor")
          .in("codigo_supervisor", supervisionesSupervisores),

        // Obtener fichas de supervisión
        this.supabase
          .from("supervision_ficha_datos")
          .select("nid_supervision, url_file")
          .in("nid_supervision", supervisionesIds),

        // Obtener seguimientos
        this.supabase
          .from("supervision_seguimientos")
          .select(`
            nid_supervision,
            txt_informe_seguimiento,
            flg_subsanacion,
            txt_oficio_reiterativo,
            txt_oficio_oci,
            fecha_cierre,
            txt_proveido_cierre,
            nid_modalidad_cierre
          `)
          .in("nid_supervision", supervisionesIds),

        // Obtener nombres de DEMUNAS
        this.supabase
          .from("defensorias")
          .select("codigo_dna, txt_nombre, nid_ubigeo")
          .in("codigo_dna", supervisionesCodigosDna),
      ])

      // Obtener tipos de cierre
      const modalidadesCierre = [
        ...new Set(seguimientosData.data?.map((s) => s.nid_modalidad_cierre).filter(Boolean) || []),
      ]

      const { data: tiposCierreData } = await this.supabase
        .from("seguimiento_cierre_tipos")
        .select("cod_tipo_cierre, txt_nombre")
        .in("cod_tipo_cierre", modalidadesCierre)

      // Crear mapas para búsqueda rápida
      const modalidadesMap = new Map()
      modalidadesData.data?.forEach((m) => {
        modalidadesMap.set(m.nid_modalidad, m.nombre_modalidad)
      })

      const supervisoresMap = new Map()
      supervisoresData.data?.forEach((s) => {
        supervisoresMap.set(s.codigo_supervisor, s.nombre_supervisor)
      })

      const fichasMap = new Map()
      fichasData.data?.forEach((f) => {
        fichasMap.set(f.nid_supervision, f.url_file)
      })

      const tiposCierreMap = new Map()
      tiposCierreData?.forEach((t) => {
        tiposCierreMap.set(t.cod_tipo_cierre, t.txt_nombre)
      })

      const seguimientosMap = new Map()
      seguimientosData.data?.forEach((s) => {
        seguimientosMap.set(s.nid_supervision, {
          ...s,
          tipo_cierre: tiposCierreMap.get(s.nid_modalidad_cierre) || null,
        })
      })

      const demunasMap = new Map()
      demunasData.data?.forEach((d) => {
        demunasMap.set(d.codigo_dna, { nombre: d.txt_nombre, ubigeo: d.nid_ubigeo })
      })

      // Obtener información de ubigeos para las DEMUNAS
      const ubigeos = [...new Set(demunasData.data?.map((d) => d.nid_ubigeo).filter(Boolean) || [])]

      // Obtener departamentos, provincias y distritos
      const depCodes = new Set()
      const provCodes = new Set()

      ubigeos.forEach((u) => {
        if (u) {
          depCodes.add(u.substring(0, 2) + "0000")
          provCodes.add(u.substring(0, 4) + "00")
        }
      })

      const [departamentosData, provinciasData, distritosData] = await Promise.all([
        this.getUbigeos(Array.from(depCodes)),
        this.getUbigeos(Array.from(provCodes)),
        this.getUbigeos(ubigeos),
      ])

      // Crear mapas para departamentos, provincias y distritos
      const departamentosMap = new Map()
      departamentosData.forEach((d) => {
        departamentosMap.set(d.codigo_ubigeo.substring(0, 2), d.txt_nombre)
      })

      const provinciasMap = new Map()
      provinciasData.forEach((p) => {
        provinciasMap.set(p.codigo_ubigeo.substring(0, 4), p.txt_nombre)
      })

      const distritosMap = new Map()
      distritosData.forEach((d) => {
        distritosMap.set(d.codigo_ubigeo, d.txt_nombre)
      })

      // Combinar los datos
      const formattedData: Supervision[] = supervisionesData.map((s) => {
        const demunaInfo = demunasMap.get(s.codigo_dna)
        const ubigeo = demunaInfo?.ubigeo || ""
        const seguimientoInfo = seguimientosMap.get(s.nid_supervision)

        return {
          nid_supervision: s.nid_supervision,
          codigo_dna: s.codigo_dna,
          fecha: s.fecha,
          supervisor: supervisoresMap.get(s.codigo_supervisor) || "No asignado",
          modalidad: modalidadesMap.get(s.nid_modalidad) || "No especificada",
          ficha: fichasMap.get(s.nid_supervision) || null,
          doc_seguimiento: seguimientoInfo?.txt_informe_seguimiento || null,
          subsanacion: seguimientoInfo?.flg_subsanacion || null,
          doc_reiterativo: seguimientoInfo?.txt_oficio_reiterativo || null,
          doc_oci: seguimientoInfo?.txt_oficio_oci || null,
          fecha_cierre: seguimientoInfo?.fecha_cierre || null,
          doc_cierre: seguimientoInfo?.txt_proveido_cierre || null,
          tipo_cierre: seguimientoInfo?.tipo_cierre || null,
          nombre_demuna: demunaInfo?.nombre || "Desconocida",
          departamento: ubigeo ? departamentosMap.get(ubigeo.substring(0, 2)) || "Desconocido" : "Desconocido",
          provincia: ubigeo ? provinciasMap.get(ubigeo.substring(0, 4)) || "Desconocido" : "Desconocido",
          distrito: ubigeo ? distritosMap.get(ubigeo) || "Desconocido" : "Desconocido",
        }
      })

      return {
        supervisiones: formattedData,
        items: formattedData,
        totalRecords,
      }
    } catch (error) {
      console.error("Error en searchSupervisiones:", error)
      throw error
    }
  }

  // Método para mantener compatibilidad con el código existente
  async searchSupervisiones(params: SupervisionesSearchParams): Promise<SupervisionesSearchResult> {
    return this.search(params)
  }
}

// Exportar una instancia única del servicio
export const supervisionesService = new SupervisionesService()
