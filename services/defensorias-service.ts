import { createClient } from "@/utils/supabase/client"

// Interfaces
export interface Defensoria {
  codigo_dna: string
  txt_nombre: string
  tipo_demuna: string
  nid_ubigeo: string
  txt_direccion: string
  txt_telefono: string
  txt_correo: string
  estado_acreditacion: string
  nombre_ubigeo: string
  departamento?: string
  provincia?: string
  distrito?: string
}

export interface DefensoriaRaw {
  codigo_dna: string
  txt_nombre: string
  txt_tipo: string
  nid_ubigeo: string
  txt_direccion: string
  txt_telefono: string
  txt_correo: string
  nid_estado: string
}

export interface EstadoAcreditacion {
  clave_caracteristica: string
  valor_caracteristica: string
}

export interface Caracteristica {
  clave_caracteristica: string
  valor_caracteristica: string
}

export interface Ubigeo {
  codigo_ubigeo: string
  txt_nombre: string
}

export interface ResponsableInfo {
  txt_nombres: string
  txt_apellidos: string
  txt_correo: string
  txt_telefono: string
}

export interface SearchParams {
  ubigeo: string | null
  codigoDna: string
  estadoAcreditacion: string | null
  page: number
  pageSize: number
}

export interface SearchResult {
  defensorias: Defensoria[]
  totalRecords: number
}

// Clase de servicio para defensorías
class DefensoriasService {
  private supabase = createClient()
  private cache: {
    estadosAcreditacion?: EstadoAcreditacion[]
    responsables: Record<string, ResponsableInfo | null>
    ubigeoNames: Record<string, string>
  } = {
    responsables: {},
    ubigeoNames: {},
  }

  // Obtener estados de acreditación
  async getEstadosAcreditacion(): Promise<EstadoAcreditacion[]> {
    // Usar caché si está disponible
    if (this.cache.estadosAcreditacion) {
      return this.cache.estadosAcreditacion
    }

    const { data, error } = await this.supabase
      .from("defensorias_caracteristicas")
      .select("clave_caracteristica, valor_caracteristica")
      .in("clave_caracteristica", ["a", "b", "c"]) // Ajustar según los valores reales

    if (error) throw new Error(`Error al cargar estados de acreditación: ${error.message}`)

    this.cache.estadosAcreditacion = data || []
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

    // Aplicar filtro de estado de acreditación
    if (params.estadoAcreditacion && params.estadoAcreditacion !== "all") {
      filteredQuery = filteredQuery.eq("nid_estado", params.estadoAcreditacion)
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
          txt_tipo,
          nid_ubigeo,
          txt_direccion,
          txt_telefono,
          txt_correo,
          nid_estado
        `)
        .range(from, to)

      // Aplicar filtros
      query = this.applyFilters(query, params)

      const { data: defensoriasData, error: defensoriasError } = await query

      if (defensoriasError) throw new Error(`Error al buscar defensorías: ${defensoriasError.message}`)

      if (!defensoriasData || defensoriasData.length === 0) {
        return { defensorias: [], totalRecords }
      }

      // Extraer conjuntos únicos de tipos, estados y ubigeos
      const tiposSet = new Set<string>()
      const estadosSet = new Set<string>()
      const ubigeoSet = new Set<string>()

      defensoriasData.forEach((def: DefensoriaRaw) => {
        if (def.txt_tipo) tiposSet.add(def.txt_tipo)
        if (def.nid_estado) estadosSet.add(def.nid_estado)
        if (def.nid_ubigeo) ubigeoSet.add(def.nid_ubigeo)
      })

      // Convertir a arrays
      const tiposArray = Array.from(tiposSet)
      const estadosArray = Array.from(estadosSet)
      const ubigeosArray = Array.from(ubigeoSet)

      // Consultas en paralelo para mejorar rendimiento
      const [tiposData, estadosData, ubigeosData] = await Promise.all([
        this.getCaracteristicas(tiposArray),
        this.getCaracteristicas(estadosArray),
        this.getUbigeos(ubigeosArray),
      ])

      // Crear mapas para búsqueda rápida
      const tiposMap = new Map<string, string>()
      tiposData.forEach((tipo: Caracteristica) => {
        tiposMap.set(tipo.clave_caracteristica, tipo.valor_caracteristica)
      })

      const estadosMap = new Map<string, string>()
      estadosData.forEach((estado: Caracteristica) => {
        estadosMap.set(estado.clave_caracteristica, estado.valor_caracteristica)
      })

      const ubigeosMap = new Map<string, string>()
      ubigeosData.forEach((ubigeo: Ubigeo) => {
        ubigeosMap.set(ubigeo.codigo_ubigeo, ubigeo.txt_nombre)
        // Guardar en caché para futuras consultas
        this.cache.ubigeoNames[ubigeo.codigo_ubigeo] = ubigeo.txt_nombre
      })

      // Combinar los datos
      const formattedData: Defensoria[] = defensoriasData.map((def: DefensoriaRaw) => ({
        codigo_dna: def.codigo_dna,
        txt_nombre: def.txt_nombre,
        tipo_demuna: tiposMap.get(def.txt_tipo) || "",
        nid_ubigeo: def.nid_ubigeo,
        txt_direccion: def.txt_direccion || "",
        txt_telefono: def.txt_telefono || "",
        txt_correo: def.txt_correo || "",
        estado_acreditacion: estadosMap.get(def.nid_estado) || "",
        nombre_ubigeo: ubigeosMap.get(def.nid_ubigeo) || "",
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

  // Obtener características
  private async getCaracteristicas(claves: string[]): Promise<Caracteristica[]> {
    if (claves.length === 0) return []

    const { data, error } = await this.supabase
      .from("defensorias_caracteristicas")
      .select("clave_caracteristica, valor_caracteristica")
      .in("clave_caracteristica", claves)

    if (error) throw new Error(`Error al obtener características: ${error.message}`)

    return data || []
  }

  // Obtener ubigeos
  private async getUbigeos(codigos: string[]): Promise<Ubigeo[]> {
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
  private async enrichWithRegionInfo(defensorias: Defensoria[]): Promise<Defensoria[]> {
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

  // Cargar responsables para múltiples defensorías
  async loadResponsables(codigosDna: string[]): Promise<Record<string, ResponsableInfo | null>> {
    if (codigosDna.length === 0) return {}

    // Filtrar códigos que ya están en caché
    const codigosAConsultar = codigosDna.filter((codigo) => !this.cache.responsables[codigo])

    if (codigosAConsultar.length === 0) {
      // Todos los responsables están en caché
      const result: Record<string, ResponsableInfo | null> = {}
      codigosDna.forEach((codigo) => {
        result[codigo] = this.cache.responsables[codigo] || null
      })
      return result
    }

    try {
      // Consulta optimizada para obtener los responsables más recientes
      const { data, error } = await this.supabase
        .from("defensoria_personas")
        .select(`
          codigo_dna,
          txt_nombres,
          txt_apellidos,
          txt_correo,
          txt_telefono,
          fec_designacion
        `)
        .in("codigo_dna", codigosAConsultar)
        .eq("codigo_funcion", 1)
        .order("fec_designacion", { ascending: false })

      if (error) throw new Error(`Error al cargar responsables: ${error.message}`)

      // Procesar los datos para obtener el responsable más reciente por código DNA
      const responsablesMap: Record<string, ResponsableInfo> = {}

      if (data) {
        // Agrupar por código DNA
        const responsablesPorDna: Record<string, any[]> = {}

        data.forEach((item) => {
          if (!responsablesPorDna[item.codigo_dna]) {
            responsablesPorDna[item.codigo_dna] = []
          }
          responsablesPorDna[item.codigo_dna].push(item)
        })

        // Para cada DEMUNA, tomar el responsable con la fecha de designación más reciente
        Object.entries(responsablesPorDna).forEach(([codigo, responsables]) => {
          if (responsables.length > 0) {
            // Ordenar por fecha de designación (más reciente primero)
            responsables.sort((a, b) => {
              const fechaA = new Date(a.fec_designacion || 0).getTime()
              const fechaB = new Date(b.fec_designacion || 0).getTime()
              return fechaB - fechaA
            })

            // Tomar el primer elemento (el más reciente)
            const responsableMasReciente = responsables[0]

            responsablesMap[codigo] = {
              txt_nombres: responsableMasReciente.txt_nombres || "",
              txt_apellidos: responsableMasReciente.txt_apellidos || "",
              txt_correo: responsableMasReciente.txt_correo || "",
              txt_telefono: responsableMasReciente.txt_telefono || "",
            }

            // Actualizar caché
            this.cache.responsables[codigo] = responsablesMap[codigo]
          } else {
            // Marcar como null en caché para evitar consultas repetidas
            this.cache.responsables[codigo] = null
          }
        })
      }

      // Marcar como null en caché los códigos que no tienen responsable
      codigosAConsultar.forEach((codigo) => {
        if (!responsablesMap[codigo]) {
          this.cache.responsables[codigo] = null
        }
      })

      // Combinar resultados de caché y consulta
      const result: Record<string, ResponsableInfo | null> = {}
      codigosDna.forEach((codigo) => {
        if (codigosAConsultar.includes(codigo)) {
          result[codigo] = responsablesMap[codigo] || null
        } else {
          result[codigo] = this.cache.responsables[codigo] || null
        }
      })

      return result
    } catch (error) {
      console.error("Error en loadResponsables:", error)
      throw error
    }
  }
}

// Exportar una instancia única del servicio
export const defensoriasService = new DefensoriasService()
