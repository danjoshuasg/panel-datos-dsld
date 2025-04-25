// services/dna-reportes-service.ts
import { createClient } from "@/utils/supabase/client"

// Interfaces para estadísticas
export interface DnaStats {
  totalDefensorias: number
  acreditadas: number
  noAcreditadas: number
  noOperativas: number
  porDepartamento: DepartamentoStat[]
  porEstado: EstadoStat[]
  porTipo: TipoStat[]
}

export interface DepartamentoStat {
  departamento: string
  cantidad: number
  porcentaje: number
}

export interface EstadoStat {
  estado: string
  cantidad: number
  porcentaje: number
  color: string
}

export interface TipoStat {
  tipo: string
  cantidad: number
  porcentaje: number
}

export interface FiltersState {
  ubigeo: string | null
  estadoAcreditacion: string | null
}

// Clase de servicio para reportes de DNA
class DnaReportesService {
  private supabase = createClient()

  // Obtener estadísticas generales
  async getStats(filters: FiltersState): Promise<DnaStats> {
    try {
      const supabase = createClient()

      // Primero, obtener el conteo total de defensorías
      let countQuery = supabase.from("defensorias").select("*", { count: "exact", head: true })

      // Aplicar filtros si existen
      if (filters.ubigeo) {
        const ubigeoLength = filters.ubigeo.replace(/0+$/, "").length
        if (ubigeoLength <= 2) {
          countQuery = countQuery.like("nid_ubigeo", filters.ubigeo.substring(0, 2) + "%")
        } else if (ubigeoLength <= 4) {
          countQuery = countQuery.like("nid_ubigeo", filters.ubigeo.substring(0, 4) + "%")
        } else {
          countQuery = countQuery.eq("nid_ubigeo", filters.ubigeo)
        }
      }

      if (filters.estadoAcreditacion && filters.estadoAcreditacion !== "all") {
        countQuery = countQuery.eq("nid_estado", filters.estadoAcreditacion)
      }

      const { count: totalDefensorias, error: countError } = await countQuery

      if (countError) {
        console.error("Error al obtener conteo total:", countError)
        return this.getEmptyStats()
      }

      // Obtener conteos por estado de acreditación
      const estadosPromises = ["a", "b", "c"].map(async (estadoId) => {
        let query = supabase.from("defensorias").select("*", { count: "exact", head: true }).eq("nid_estado", estadoId)

        // Aplicar filtro de ubigeo si existe
        if (filters.ubigeo) {
          const ubigeoLength = filters.ubigeo.replace(/0+$/, "").length
          if (ubigeoLength <= 2) {
            query = query.like("nid_ubigeo", filters.ubigeo.substring(0, 2) + "%")
          } else if (ubigeoLength <= 4) {
            query = query.like("nid_ubigeo", filters.ubigeo.substring(0, 4) + "%")
          } else {
            query = query.eq("nid_ubigeo", filters.ubigeo)
          }
        }

        const { count, error } = await query
        return { estadoId, count: count || 0, error }
      })

      const estadosResults = await Promise.all(estadosPromises)

      // Mapear los IDs de estado a nombres
      const estadosMap: Record<string, string> = {
        a: "No Operativa",
        b: "Acreditada",
        c: "No Acreditada",
      }

      // Construir los conteos por estado
      const acreditadas = estadosResults.find((r) => r.estadoId === "b")?.count || 0
      const noAcreditadas = estadosResults.find((r) => r.estadoId === "c")?.count || 0
      const noOperativas = estadosResults.find((r) => r.estadoId === "a")?.count || 0

      // Obtener estadísticas por departamento
      const { data: depData, error: depError } = await supabase
        .from("defensorias")
        .select("nid_ubigeo")
        .not("nid_ubigeo", "is", null)

      if (depError) {
        console.error("Error al obtener datos de departamentos:", depError)
        return {
          totalDefensorias: totalDefensorias || 0,
          acreditadas,
          noAcreditadas,
          noOperativas,
          porDepartamento: [],
          porEstado: [
            {
              estado: "Acreditada",
              cantidad: acreditadas,
              porcentaje: (acreditadas / (totalDefensorias || 1)) * 100,
              color: this.getColorForEstado("Acreditada"),
            },
            {
              estado: "No Acreditada",
              cantidad: noAcreditadas,
              porcentaje: (noAcreditadas / (totalDefensorias || 1)) * 100,
              color: this.getColorForEstado("No Acreditada"),
            },
            {
              estado: "No Operativa",
              cantidad: noOperativas,
              porcentaje: (noOperativas / (totalDefensorias || 1)) * 100,
              color: this.getColorForEstado("No Operativa"),
            },
          ],
          porTipo: [],
        }
      }

      // Procesar datos por departamento
      const departamentosCount: Record<string, number> = {}
      depData?.forEach((def) => {
        if (def.nid_ubigeo) {
          const depCode = def.nid_ubigeo.substring(0, 2)
          departamentosCount[depCode] = (departamentosCount[depCode] || 0) + 1
        }
      })

      // Obtener nombres de departamentos
      const depCodes = Object.keys(departamentosCount).map((code) => code + "0000")
      const { data: ubigeos } = await supabase
        .from("ubigeos")
        .select("codigo_ubigeo, txt_nombre")
        .in("codigo_ubigeo", depCodes)

      const ubigeosMap: Record<string, string> = {}
      ubigeos?.forEach((u) => {
        ubigeosMap[u.codigo_ubigeo.substring(0, 2)] = u.txt_nombre
      })

      // Construir estadísticas por departamento
      const porDepartamento = Object.entries(departamentosCount)
        .map(([depCode, cantidad]) => ({
          departamento: ubigeosMap[depCode] || `Departamento ${depCode}`,
          cantidad,
          porcentaje: (cantidad / (totalDefensorias || 1)) * 100,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      // Obtener estadísticas por tipo
      const { data: tiposData } = await supabase.from("defensorias").select("txt_tipo")

      const tiposCount: Record<string, number> = {}
      tiposData?.forEach((def) => {
        const tipo = def.txt_tipo || "No especificado"
        tiposCount[tipo] = (tiposCount[tipo] || 0) + 1
      })

      // Obtener nombres de tipos
      const tiposCodes = Object.keys(tiposCount)
      const { data: tiposInfo } = await supabase
        .from("defensorias_caracteristicas")
        .select("clave_caracteristica, valor_caracteristica")
        .in("clave_caracteristica", tiposCodes)

      const tiposMap: Record<string, string> = {}
      tiposInfo?.forEach((t) => {
        tiposMap[t.clave_caracteristica] = t.valor_caracteristica
      })

      // Construir estadísticas por tipo
      const porTipo = Object.entries(tiposCount)
        .map(([tipoCode, cantidad]) => ({
          tipo: tiposMap[tipoCode] || `Tipo ${tipoCode}`,
          cantidad,
          porcentaje: (cantidad / (totalDefensorias || 1)) * 100,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      return {
        totalDefensorias: totalDefensorias || 0,
        acreditadas,
        noAcreditadas,
        noOperativas,
        porDepartamento,
        porEstado: [
          {
            estado: "Acreditada",
            cantidad: acreditadas,
            porcentaje: (acreditadas / (totalDefensorias || 1)) * 100,
            color: this.getColorForEstado("Acreditada"),
          },
          {
            estado: "No Acreditada",
            cantidad: noAcreditadas,
            porcentaje: (noAcreditadas / (totalDefensorias || 1)) * 100,
            color: this.getColorForEstado("No Acreditada"),
          },
          {
            estado: "No Operativa",
            cantidad: noOperativas,
            porcentaje: (noOperativas / (totalDefensorias || 1)) * 100,
            color: this.getColorForEstado("No Operativa"),
          },
        ],
        porTipo,
      }
    } catch (error) {
      console.error("Error obteniendo estadísticas:", error)
      return this.getEmptyStats()
    }
  }

  // Obtener estadísticas vacías (para casos de error o sin datos)
  private getEmptyStats(): DnaStats {
    return {
      totalDefensorias: 0,
      acreditadas: 0,
      noAcreditadas: 0,
      noOperativas: 0,
      porDepartamento: [],
      porEstado: [],
      porTipo: [],
    }
  }

  // Obtener color para cada estado de acreditación
  private getColorForEstado(estado: string): string {
    switch (estado) {
      case "Acreditada":
        return "#10b981" // Verde
      case "No Acreditada":
        return "#ef4444" // Rojo
      case "No Operativa":
        return "#3b82f6" // Azul
      default:
        return "#9ca3af" // Gris
    }
  }

  // Obtener datos para el mapa de calor por departamento
  async getMapData(filters: FiltersState): Promise<any[]> {
    try {
      // Obtener estadísticas
      const stats = await this.getStats(filters)

      // Mapear departamentos a regiones del mapa
      return stats.porDepartamento.map((dep) => ({
        id: this.normalizeDepartamentoName(dep.departamento),
        value: dep.cantidad,
        tooltip: `${dep.departamento}: ${dep.cantidad} defensorías (${dep.porcentaje.toFixed(1)}%)`,
      }))
    } catch (error) {
      console.error("Error obteniendo datos del mapa:", error)
      return []
    }
  }

  // Normalizar nombres de departamentos para el mapa
  private normalizeDepartamentoName(name: string): string {
    const normalizeMap: Record<string, string> = {
      Lima: "lima",
      Arequipa: "arequipa",
      Cusco: "cusco",
      "La Libertad": "la-libertad",
      Piura: "piura",
      Cajamarca: "cajamarca",
      Puno: "puno",
      Junín: "junin",
      Lambayeque: "lambayeque",
      Áncash: "ancash",
      Loreto: "loreto",
      Ica: "ica",
      "San Martín": "san-martin",
      Huánuco: "huanuco",
      Ayacucho: "ayacucho",
      Ucayali: "ucayali",
      Apurímac: "apurimac",
      Amazonas: "amazonas",
      Tacna: "tacna",
      Pasco: "pasco",
      Tumbes: "tumbes",
      Moquegua: "moquegua",
      Huancavelica: "huancavelica",
      "Madre de Dios": "madre-de-dios",
      Callao: "callao",
    }

    return normalizeMap[name] || name.toLowerCase().replace(/\s+/g, "-")
  }
}

// Exportar una instancia única del servicio
export const dnaReportesService = new DnaReportesService()
