import { createClient } from "@/utils/supabase/client"

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

export interface Supervisor {
  codigo_supervisor: number
  nombre_supervisor: string
}

export interface Modalidad {
  nid_modalidad: number
  nombre_modalidad: string
}

export interface SearchParams {
  ubigeo: string | null
  codigoDna: string
  fechaDesde: string | null
  fechaHasta: string | null
  supervisor: string | null
  page: number
  pageSize: number
}

export interface SearchResult {
  supervisiones: Supervision[]
  totalRecords: number
}

// Clase de servicio para supervisiones
class SupervisionesService {
  private supabase = createClient()
  private cache: {
    supervisores?: Supervisor[]
    modalidades?: Modalidad[]
  } = {}

  // Obtener supervisores
  async getSupervisores(): Promise<Supervisor[]> {
    // Usar caché si está disponible
    if (this.cache.supervisores) {
      return this.cache.supervisores
    }

    try {
      // En un entorno de producción, usaríamos esta consulta:
      // const { data, error } = await this.supabase
      //   .from("supervisores")
      //   .select("codigo_supervisor, nombre_supervisor")
      //   .eq("flg_activo_dsld", true)
      //   .order("nombre_supervisor", { ascending: true });
      // if (error) throw new Error(`Error al cargar supervisores: ${error.message}`);
      // this.cache.supervisores = data || [];
      // return data || [];

      // Para evitar errores con la tabla, usamos datos simulados temporalmente
      const supervisores: Supervisor[] = [
        { codigo_supervisor: 1, nombre_supervisor: "MARCOS DELFÍN" },
        { codigo_supervisor: 2, nombre_supervisor: "MARÍA LÓPEZ" },
        { codigo_supervisor: 3, nombre_supervisor: "JUAN PÉREZ" },
        { codigo_supervisor: 4, nombre_supervisor: "CARLOS GÓMEZ" },
        { codigo_supervisor: 5, nombre_supervisor: "ANA RODRÍGUEZ" },
      ]

      this.cache.supervisores = supervisores
      return supervisores
    } catch (error) {
      console.error("Error en getSupervisores:", error)
      throw error
    }
  }

  // Obtener modalidades de supervisión
  async getModalidades(): Promise<Modalidad[]> {
    // Usar caché si está disponible
    if (this.cache.modalidades) {
      return this.cache.modalidades
    }

    try {
      // En un entorno de producción, usaríamos esta consulta:
      // const { data, error } = await this.supabase
      //   .from("supervision_modalidades")
      //   .select("nid_modalidad, nombre_modalidad")
      //   .order("nombre_modalidad", { ascending: true });
      // if (error) throw new Error(`Error al cargar modalidades: ${error.message}`);
      // this.cache.modalidades = data || [];
      // return data || [];

      // Para evitar errores con la tabla, usamos datos simulados temporalmente
      const modalidades: Modalidad[] = [
        { nid_modalidad: 1, nombre_modalidad: "Ordinaria" },
        { nid_modalidad: 2, nombre_modalidad: "Extraordinaria" },
        { nid_modalidad: 3, nombre_modalidad: "Seguimiento" },
        { nid_modalidad: 4, nombre_modalidad: "Virtual" },
        { nid_modalidad: 5, nombre_modalidad: "Presencial" },
      ]

      this.cache.modalidades = modalidades
      return modalidades
    } catch (error) {
      console.error("Error en getModalidades:", error)

      // En caso de error, devolver datos básicos para que la aplicación siga funcionando
      const fallbackModalidades: Modalidad[] = [
        { nid_modalidad: 1, nombre_modalidad: "Ordinaria" },
        { nid_modalidad: 2, nombre_modalidad: "Extraordinaria" },
        { nid_modalidad: 3, nombre_modalidad: "Seguimiento" },
      ]

      this.cache.modalidades = fallbackModalidades
      return fallbackModalidades
    }
  }

  // Aplicar filtros a una consulta
  private applyFilters(query: any, params: SearchParams) {
    let filteredQuery = query

    // Aplicar filtro de ubigeo
    if (params.ubigeo) {
      // Obtener las defensorías que coinciden con el ubigeo seleccionado
      const ubigeoLength = params.ubigeo.replace(/0+$/, "").length

      if (ubigeoLength <= 2) {
        // Filtrar por departamento
        filteredQuery = filteredQuery.like("nid_ubigeo", params.ubigeo.substring(0, 2) + "%")
      } else if (ubigeoLength <= 4) {
        // Filtrar por provincia
        filteredQuery = filteredQuery.like("nid_ubigeo", params.ubigeo.substring(0, 4) + "%")
      } else {
        // Filtrar por distrito
        filteredQuery = filteredQuery.eq("nid_ubigeo", params.ubigeo)
      }
    }

    // Aplicar filtro de código DNA
    if (params.codigoDna) {
      filteredQuery = filteredQuery.ilike("codigo_dna", `%${params.codigoDna}%`)
    }

    // Aplicar filtro de fecha desde
    if (params.fechaDesde) {
      filteredQuery = filteredQuery.gte("fecha", params.fechaDesde)
    }

    // Aplicar filtro de fecha hasta
    if (params.fechaHasta) {
      filteredQuery = filteredQuery.lte("fecha", params.fechaHasta)
    }

    // Aplicar filtro de supervisor
    if (params.supervisor && params.supervisor !== "all") {
      filteredQuery = filteredQuery.eq("codigo_supervisor", params.supervisor)
    }

    return filteredQuery
  }

  // Obtener conteo total de registros
  async getTotalRecords(params: SearchParams): Promise<number> {
    try {
      // En un entorno de producción, usaríamos esta consulta:
      // let countQuery = this.supabase.from("supervisiones").select("*", { count: "exact", head: true })
      // countQuery = this.applyFilters(countQuery, params)
      // const { count, error } = await countQuery
      // if (error) throw new Error(`Error al obtener conteo de registros: ${error.message}`)
      // return count || 0

      // Para evitar errores con la tabla, usamos datos simulados temporalmente
      // Simulamos una búsqueda para obtener el conteo
      const result = await this.searchSupervisiones(params)
      return result.totalRecords
    } catch (error) {
      console.error("Error en getTotalRecords:", error)
      // En caso de error, devolvemos un valor por defecto
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

      // Simulamos un tiempo de carga (reducido para mejor experiencia)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Para fines de demostración, devolvemos datos simulados
      const supervisiones: Supervision[] = [
        {
          nid_supervision: 1,
          codigo_dna: "DNA-001",
          fecha: "2023-05-15",
          supervisor: "MARCOS DELFÍN",
          modalidad: "Ordinaria",
          ficha: "https://example.com/ficha1.pdf",
          doc_seguimiento: "INF-001-2023",
          subsanacion: true,
          doc_reiterativo: null,
          doc_oci: null,
          fecha_cierre: "2023-06-20",
          doc_cierre: "PROV-001-2023",
          tipo_cierre: "Subsanado",
          nombre_demuna: "DEMUNA Lima Centro",
          departamento: "Lima",
          provincia: "Lima",
          distrito: "Lima",
        },
        {
          nid_supervision: 2,
          codigo_dna: "DNA-002",
          fecha: "2023-06-20",
          supervisor: "MARCOS DELFÍN",
          modalidad: "Extraordinaria",
          ficha: "https://example.com/ficha2.pdf",
          doc_seguimiento: "INF-002-2023",
          subsanacion: false,
          doc_reiterativo: "OFI-001-2023",
          doc_oci: "OCI-001-2023",
          fecha_cierre: null,
          doc_cierre: null,
          tipo_cierre: null,
          nombre_demuna: "DEMUNA Miraflores",
          departamento: "Lima",
          provincia: "Lima",
          distrito: "Miraflores",
        },
        {
          nid_supervision: 3,
          codigo_dna: "DNA-003",
          fecha: "2023-07-10",
          supervisor: "MARÍA LÓPEZ",
          modalidad: "Seguimiento",
          ficha: null,
          doc_seguimiento: null,
          subsanacion: null,
          doc_reiterativo: null,
          doc_oci: null,
          fecha_cierre: null,
          doc_cierre: null,
          tipo_cierre: null,
          nombre_demuna: "DEMUNA San Isidro",
          departamento: "Lima",
          provincia: "Lima",
          distrito: "San Isidro",
        },
        {
          nid_supervision: 4,
          codigo_dna: "DNA-004",
          fecha: "2023-08-05",
          supervisor: "JUAN PÉREZ",
          modalidad: "Ordinaria",
          ficha: "https://example.com/ficha4.pdf",
          doc_seguimiento: "INF-004-2023",
          subsanacion: true,
          doc_reiterativo: null,
          doc_oci: null,
          fecha_cierre: "2023-09-15",
          doc_cierre: "PROV-002-2023",
          tipo_cierre: "Subsanado",
          nombre_demuna: "DEMUNA Surco",
          departamento: "Lima",
          provincia: "Lima",
          distrito: "Santiago de Surco",
        },
        {
          nid_supervision: 5,
          codigo_dna: "DNA-005",
          fecha: "2023-09-12",
          supervisor: "CARLOS GÓMEZ",
          modalidad: "Extraordinaria",
          ficha: "https://example.com/ficha5.pdf",
          doc_seguimiento: null,
          subsanacion: null,
          doc_reiterativo: null,
          doc_oci: null,
          fecha_cierre: null,
          doc_cierre: null,
          tipo_cierre: null,
          nombre_demuna: "DEMUNA San Borja",
          departamento: "Lima",
          provincia: "Lima",
          distrito: "San Borja",
        },
        // Agregar más datos de ejemplo para probar la paginación
        {
          nid_supervision: 6,
          codigo_dna: "DNA-006",
          fecha: "2023-10-05",
          supervisor: "ANA RODRÍGUEZ",
          modalidad: "Ordinaria",
          ficha: "https://example.com/ficha6.pdf",
          doc_seguimiento: "INF-006-2023",
          subsanacion: true,
          doc_reiterativo: null,
          doc_oci: null,
          fecha_cierre: "2023-11-10",
          doc_cierre: "PROV-003-2023",
          tipo_cierre: "Subsanado",
          nombre_demuna: "DEMUNA Barranco",
          departamento: "Lima",
          provincia: "Lima",
          distrito: "Barranco",
        },
        {
          nid_supervision: 7,
          codigo_dna: "DNA-007",
          fecha: "2023-11-15",
          supervisor: "JUAN PÉREZ",
          modalidad: "Seguimiento",
          ficha: "https://example.com/ficha7.pdf",
          doc_seguimiento: null,
          subsanacion: null,
          doc_reiterativo: null,
          doc_oci: null,
          fecha_cierre: null,
          doc_cierre: null,
          tipo_cierre: null,
          nombre_demuna: "DEMUNA Chorrillos",
          departamento: "Lima",
          provincia: "Lima",
          distrito: "Chorrillos",
        },
      ]

      // Aplicar filtros de manera más robusta
      let filteredSupervisiones = [...supervisiones]

      // Filtrar por código DNA
      if (params.codigoDna) {
        const codigoSearch = params.codigoDna.toLowerCase().trim()
        filteredSupervisiones = filteredSupervisiones.filter((sup) =>
          sup.codigo_dna.toLowerCase().includes(codigoSearch),
        )
      }

      // Filtrar por fecha desde
      if (params.fechaDesde) {
        try {
          const fromDate = new Date(params.fechaDesde)
          filteredSupervisiones = filteredSupervisiones.filter((sup) => new Date(sup.fecha) >= fromDate)
        } catch (err) {
          console.error("Error al filtrar por fecha desde:", err)
          // Continuar sin aplicar este filtro
        }
      }

      // Filtrar por fecha hasta
      if (params.fechaHasta) {
        try {
          const toDate = new Date(params.fechaHasta)
          // Ajustar la fecha hasta el final del día
          toDate.setHours(23, 59, 59, 999)
          filteredSupervisiones = filteredSupervisiones.filter((sup) => new Date(sup.fecha) <= toDate)
        } catch (err) {
          console.error("Error al filtrar por fecha hasta:", err)
          // Continuar sin aplicar este filtro
        }
      }

      // Filtrar por supervisor
      if (params.supervisor && params.supervisor !== "all") {
        filteredSupervisiones = filteredSupervisiones.filter((sup) => sup.supervisor.includes(params.supervisor || ""))
      }

      // Filtrar por ubigeo (simulado)
      if (params.ubigeo) {
        // En un entorno real, esto se haría con una consulta a la base de datos
        // Aquí simulamos el filtrado por departamento, provincia o distrito
        const ubigeoLength = params.ubigeo.replace(/0+$/, "").length

        if (ubigeoLength <= 2) {
          // Filtrar por departamento (primeros 2 dígitos)
          const depCode = params.ubigeo.substring(0, 2)
          filteredSupervisiones = filteredSupervisiones.filter(
            (sup) => sup.departamento && sup.departamento.toLowerCase() === "lima",
          )
        } else if (ubigeoLength <= 4) {
          // Filtrar por provincia (primeros 4 dígitos)
          const provCode = params.ubigeo.substring(0, 4)
          filteredSupervisiones = filteredSupervisiones.filter(
            (sup) => sup.provincia && sup.provincia.toLowerCase() === "lima",
          )
        } else {
          // Filtrar por distrito (código completo)
          filteredSupervisiones = filteredSupervisiones.filter(
            (sup) => sup.distrito && sup.distrito.toLowerCase() === "lima",
          )
        }
      }

      // Calcular paginación de manera segura
      const totalRecords = filteredSupervisiones.length
      const start = Math.max(0, (params.page - 1) * params.pageSize)
      const end = Math.min(start + params.pageSize, totalRecords)
      const paginatedSupervisiones = filteredSupervisiones.slice(start, end)

      return {
        supervisiones: paginatedSupervisiones,
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
export const supervisionesService = new SupervisionesService()
