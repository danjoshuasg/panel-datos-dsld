"use client"

import { useState, useEffect } from "react"

import { TrendingUp, Loader2, BarChart3, PieChartIcon, MapPin, Award, AlertTriangle, Ban } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import ReportesFilters, { type FiltersState } from "@/components/dna-reportes/reportes-filters"
import StatsCard from "@/components/dna-reportes/stats-card"
import PieChart from "@/components/charts/pie-chart"
import {GenericBarChart} from "@/components/charts/bar-chart"
import MapChart from "@/components/charts/map-chart"
import { defensoriasService, type EstadoAcreditacion } from "@/services/defensorias-service"
import { dnaReportesService, type DnaStats } from "@/services/dna-reportes-service"

export default function DnaReportesPage() {
  // Estados para los filtros
  const [filters, setFilters] = useState<FiltersState>({
    ubigeo: null,
    estadoAcreditacion: null,
  })

  // Estados para los datos y carga
  const [estadosAcreditacion, setEstadosAcreditacion] = useState<EstadoAcreditacion[]>([])
  const [stats, setStats] = useState<DnaStats | null>(null)
  const [mapData, setMapData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar estados de acreditación al montar el componente
  useEffect(() => {
    loadInitialData()
  }, [])

  // Función para cargar datos iniciales
  async function loadInitialData() {
    try {
      // Cargar estados de acreditación
      const data = await defensoriasService.getEstadosAcreditacion()
      setEstadosAcreditacion(data)

      // Cargar estadísticas iniciales (sin filtros)
      await generateReports({
        ubigeo: null,
        estadoAcreditacion: null,
      })
    } catch (err) {
      console.error("Error cargando datos iniciales:", err)
      setError("Error al cargar los datos iniciales: " + (err instanceof Error ? err.message : "Error desconocido"))
    } finally {
      setInitialLoading(false)
    }
  }

  // Función para generar reportes
  async function generateReports(newFilters: FiltersState) {
    setLoading(true)
    setError(null)
    setFilters(newFilters)

    try {
      // Obtener estadísticas
      const statsData = await dnaReportesService.getStats(newFilters)
      setStats(statsData)

      // Obtener datos del mapa
      const mapData = await dnaReportesService.getMapData(newFilters)
      setMapData(mapData)
    } catch (err) {
      console.error("Error generando reportes:", err)
      setError("Error al generar reportes: " + (err instanceof Error ? err.message : "Error desconocido"))
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar los filtros
  function clearFilters() {
    // Generar reportes sin filtros
    generateReports({
      ubigeo: null,
      estadoAcreditacion: null,
    })
  }

  // Preparar datos para gráficos
  const pieChartData = stats
    ? [
        { label: "Acreditadas", value: stats.acreditadas, color: "#10b981" },
        { label: "No Acreditadas", value: stats.noAcreditadas, color: "#ef4444" },
        { label: "No Operativas", value: stats.noOperativas, color: "#3b82f6" },
      ]
    : []
  
  const barChartData = stats
    ? stats.porDepartamento.slice(0, 10).map((dep) => ({
        label: dep.departamento,
        value: dep.cantidad,
      }))
    : []


  const tipoChartData = stats
    ? stats.porTipo.slice(0, 10).map((tipo, index) => ({
        label: tipo.tipo,
        value: tipo.cantidad,
      }))
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 fade-in">
        <h1 className="text-3xl font-bold text-gray-800">Reportes y Estadísticas de DEMUNA</h1>
        <p className="text-gray-600 mt-2">
          Visualice datos estadísticos sobre las Defensorías Municipales del Niño y del Adolescente
        </p>
      </div>

      {/* Sección de filtros */}
      <Card className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm mb-6">
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle>Filtros de reportes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 bg-neutral-50">
          {error && <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mb-4">{error}</div>}
          {initialLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b0000]" />
              <span className="ml-2 text-neutral-700">Cargando filtros...</span>
            </div>
          ) : (
            <ReportesFilters
              estadosAcreditacion={estadosAcreditacion}
              loading={loading}
              onSearch={generateReports}
              onClear={clearFilters}
            />
          )}
        </CardContent>
      </Card>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total de Defensorías"
          value={stats?.totalDefensorias || 0}
          icon={<MapPin className="h-6 w-6 text-[#9b0000]" />}
          isLoading={loading}
        />
        <StatsCard
          title="Acreditadas"
          value={stats?.acreditadas || 0}
          icon={<Award className="h-6 w-6 text-[#10b981]" />}
          color="#10b981"
          percentage={
            stats?.totalDefensorias
              ? (stats.acreditadas / stats.totalDefensorias) * 100 - 50 // Ejemplo: comparación con promedio
              : 0
          }
          isLoading={loading}
        />
        <StatsCard
          title="No Acreditadas"
          value={stats?.noAcreditadas || 0}
          icon={<AlertTriangle className="h-6 w-6 text-[#ef4444]" />}
          color="#ef4444"
          isLoading={loading}
        />
        <StatsCard
          title="No Operativas"
          value={stats?.noOperativas || 0}
          icon={<Ban className="h-6 w-6 text-[#3b82f6]" />}
          color="#3b82f6"
          isLoading={loading}
        />
      </div>

      {/* Gráficos */}

      {/* PIE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-neutral-100">
            <CardTitle className="flex items-center text-lg">
              <PieChartIcon className="h-5 w-5 mr-2" />
              Distribución por Estado de Acreditación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex justify-center">
            {loading ? (
              <div className="flex justify-center items-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#9b0000]" />
              </div>
            ) : stats?.totalDefensorias === 0 ? (
              <div className="flex justify-center items-center h-[300px] text-neutral-500">
                No hay datos disponibles
              </div>
            ) : (
              <PieChart data={pieChartData} width={300} height={300} />
            )}
          </CardContent>
        </Card>

      {/* BARCHART DEPARTAMENTO */}
        <GenericBarChart
          data={barChartData}
          loading={loading}
          title="Distribución por Departamento (Top 10)"
          description="Departamentos con más defensorías"
          icon={BarChart3}
          color="#9b0000"
          valueLabel="Cantidad"
          showFooter={true}
          totalItems={stats?.totalDefensorias}
          footerLabel="defensorías"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-neutral-100">
            <CardTitle className="flex items-center text-lg">
              <MapPin className="h-5 w-5 mr-2" />
              Distribución Geográfica
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex justify-center">
            {loading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#9b0000]" />
              </div>
            ) : stats?.totalDefensorias === 0 ? (
              <div className="flex justify-center items-center h-[400px] text-neutral-500">
                No hay datos disponibles
              </div>
            ) : (
              <MapChart data={mapData} width={400} height={400} />
            )}
          </CardContent>
        </Card>
        <GenericBarChart
          data={tipoChartData}
          loading={loading}
          title="Distribución por Tipo de DEMUNA (Top 10)"
          description="Mostrando los 10 tipos más frecuentes"
          icon={BarChart3}
          color="#9b0000"
          valueLabel="Cantidad"
          showFooter={true}
          totalItems={stats?.totalDefensorias}
          footerLabel="defensorías"
        />

      </div>
    </div>
  )
}