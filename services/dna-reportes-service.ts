import { createClient } from "@/utils/supabase/client"
import { defensoriasService } from "@/services/defensorias-service"

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
      // Obtener todas las defensorías con los filtros aplicados
      const result = await defensoriasService.searchDefensorias({
        ubigeo: filters.ubigeo,
        codigoDna: "",
        estadoAcreditacion: filters.estadoAcreditacion,
        page: 1,
        pageSize: 1000, // Un número grande para obtener todos los registros
      })

      const defensorias = result.defensorias
      const totalDefensorias = defensorias.length

      if (totalDefensorias === 0) {
        return this.getEmptyStats()
      }

      // Contar por estado de acreditación
      const estadosCount: Record<string, number> = {}
      defensorias.forEach((def) => {
        const estado = def.estado_acreditacion || "No especificado"
        estadosCount[estado] = (estadosCount[estado] || 0) + 1
      })

      // Contar por departamento
      const departamentosCount: Record<string, number> = {}
      defensorias.forEach((def) => {
        const departamento = def.departamento || "No especificado"
        departamentosCount[departamento] = (departamentosCount[departamento] || 0) + 1
      })

      // Contar por tipo de DEMUNA
      const tiposCount: Record<string, number> = {}
      defensorias.forEach((def) => {
        const tipo = def.tipo_demuna || "No especificado"
        tiposCount[tipo] = (tiposCount[tipo] || 0) + 1
      })

      // Preparar estadísticas por departamento
      const porDepartamento: DepartamentoStat[] = Object.entries(departamentosCount)
        .map(([departamento, cantidad]) => ({
          departamento,
          cantidad,
          porcentaje: (cantidad / totalDefensorias) * 100,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      // Preparar estadísticas por estado
      const porEstado: EstadoStat[] = Object.entries(estadosCount).map(([estado, cantidad]) => ({
        estado,
        cantidad,
        porcentaje: (cantidad / totalDefensorias) * 100,
        color: this.getColorForEstado(estado),
      }))

      // Preparar estadísticas por tipo
      const porTipo: TipoStat[] = Object.entries(tiposCount)
        .map(([tipo, cantidad]) => ({
          tipo,
          cantidad,
          porcentaje: (cantidad / totalDefensorias) * 100,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)

      return {
        totalDefensorias,
        acreditadas: estadosCount["Acreditada"] || 0,
        noAcreditadas: estadosCount["No Acreditada"] || 0,
        noOperativas: estadosCount["No Operativa"] || 0,
        porDepartamento,
        porEstado,
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
