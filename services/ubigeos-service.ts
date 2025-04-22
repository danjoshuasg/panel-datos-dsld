import { createClient } from "@/utils/supabase/client"

// Interfaces
export interface Ubigeo {
  nid_ubigeo: number
  codigo_ubigeo: string
  txt_nombre: string
  txt_nivel: string
  codigo_padre: string | null
  created_at: string
  updated_at: string
}

// Clase de servicio para ubigeos
class UbigeosService {
  private supabase = createClient()

  // Cache para almacenar resultados de consultas previas
  private cache: {
    departamentos: Ubigeo[]
    provincias: Record<string, Ubigeo[]>
    distritos: Record<string, Ubigeo[]>
    ubigeoById: Record<string, Ubigeo>
  } = {
    departamentos: [],
    provincias: {},
    distritos: {},
    ubigeoById: {},
  }

  // Obtener departamentos
  async getDepartamentos(): Promise<Ubigeo[]> {
    // Si ya tenemos departamentos en caché, usarlos
    if (this.cache.departamentos.length > 0) {
      return this.cache.departamentos
    }

    try {
      const { data, error } = await this.supabase
        .from("ubigeos")
        .select("*")
        .eq("txt_nivel", "Departamento")
        .order("txt_nombre", { ascending: true })

      if (error) throw error

      // Guardar en caché y devolver
      this.cache.departamentos = data || []

      // También guardar en caché por ID para consultas rápidas
      data?.forEach((ubigeo) => {
        this.cache.ubigeoById[ubigeo.codigo_ubigeo] = ubigeo
      })

      return data || []
    } catch (err) {
      console.error("Error fetching departamentos:", err)
      throw new Error(`Error al cargar departamentos: ${(err as Error).message}`)
    }
  }

  // Obtener provincias por departamento
  async getProvinciasByDepartamento(departamentoId: string): Promise<Ubigeo[]> {
    if (!departamentoId) return []

    // Si ya tenemos provincias en caché para este departamento, usarlas
    if (this.cache.provincias[departamentoId]?.length > 0) {
      return this.cache.provincias[departamentoId]
    }

    try {
      const { data, error } = await this.supabase
        .from("ubigeos")
        .select("*")
        .eq("codigo_padre", departamentoId)
        .eq("txt_nivel", "Provincia")
        .order("txt_nombre", { ascending: true })

      if (error) throw error

      // Guardar en caché y devolver
      if (!this.cache.provincias[departamentoId]) {
        this.cache.provincias[departamentoId] = []
      }
      this.cache.provincias[departamentoId] = data || []

      // También guardar en caché por ID para consultas rápidas
      data?.forEach((ubigeo) => {
        this.cache.ubigeoById[ubigeo.codigo_ubigeo] = ubigeo
      })

      return data || []
    } catch (err) {
      console.error("Error fetching provincias:", err)
      throw new Error(`Error al cargar provincias: ${(err as Error).message}`)
    }
  }

  // Obtener distritos por provincia
  async getDistritosByProvincia(provinciaId: string): Promise<Ubigeo[]> {
    if (!provinciaId) return []

    // Si ya tenemos distritos en caché para esta provincia, usarlos
    if (this.cache.distritos[provinciaId]?.length > 0) {
      return this.cache.distritos[provinciaId]
    }

    try {
      const { data, error } = await this.supabase
        .from("ubigeos")
        .select("*")
        .eq("codigo_padre", provinciaId)
        .eq("txt_nivel", "Distrito")
        .order("txt_nombre", { ascending: true })

      if (error) throw error

      // Guardar en caché y devolver
      if (!this.cache.distritos[provinciaId]) {
        this.cache.distritos[provinciaId] = []
      }
      this.cache.distritos[provinciaId] = data || []

      // También guardar en caché por ID para consultas rápidas
      data?.forEach((ubigeo) => {
        this.cache.ubigeoById[ubigeo.codigo_ubigeo] = ubigeo
      })

      return data || []
    } catch (err) {
      console.error("Error fetching distritos:", err)
      throw new Error(`Error al cargar distritos: ${(err as Error).message}`)
    }
  }

  // Obtener un ubigeo por su código
  async getUbigeoById(codigo: string): Promise<Ubigeo | null> {
    if (!codigo) return null

    // Si ya tenemos este ubigeo en caché, usarlo
    if (this.cache.ubigeoById[codigo]) {
      return this.cache.ubigeoById[codigo]
    }

    try {
      const { data, error } = await this.supabase.from("ubigeos").select("*").eq("codigo_ubigeo", codigo).single()

      if (error) throw error

      // Guardar en caché y devolver
      if (data) {
        this.cache.ubigeoById[codigo] = data
      }

      return data || null
    } catch (err) {
      console.error(`Error fetching ubigeo ${codigo}:`, err)
      return null
    }
  }

  // Obtener información de región (departamento, provincia, distrito) para un código de ubigeo
  async getRegionInfo(ubigeoCode: string): Promise<{
    departamento: Ubigeo | null
    provincia: Ubigeo | null
    distrito: Ubigeo | null
  }> {
    if (!ubigeoCode) {
      return {
        departamento: null,
        provincia: null,
        distrito: null,
      }
    }

    try {
      // Extraer códigos
      const depCode = ubigeoCode.substring(0, 2) + "0000"
      const provCode = ubigeoCode.substring(0, 4) + "00"
      const distCode = ubigeoCode

      // Consultas en paralelo para mejorar rendimiento
      const [departamento, provincia, distrito] = await Promise.all([
        this.getUbigeoById(depCode),
        this.getUbigeoById(provCode),
        this.getUbigeoById(distCode),
      ])

      return {
        departamento,
        provincia,
        distrito,
      }
    } catch (err) {
      console.error("Error getting region info:", err)
      return {
        departamento: null,
        provincia: null,
        distrito: null,
      }
    }
  }

  // Limpiar caché
  clearCache() {
    this.cache = {
      departamentos: [],
      provincias: {},
      distritos: {},
      ubigeoById: {},
    }
  }
}

// Exportar una instancia única del servicio
export const ubigeosService = new UbigeosService()
