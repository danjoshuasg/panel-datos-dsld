"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import SincronizacionSupervisionesFilters, { type FiltersState } from "./sincronizacion-supervisiones-filters"
import SincronizacionSupervisionesTable from "./sincronizacion-supervisiones-table"
import { sincronizacionSupervisionesService } from "@/services/sincronizacion-supervisiones-service"
import { Loader2 } from "lucide-react"

export default function SincronizacionSupervisionesSearch() {
  // Estados para los resultados y carga
  const [supervisiones, setSupervisiones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchPerformed, setSearchPerformed] = useState(false)

  // Estados para los datos de filtros
  const [supervisores, setSupervisores] = useState([])
  const [estadosSincronizacion, setEstadosSincronizacion] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(25)
  const [totalRecords, setTotalRecords] = useState(0)

  // Estado para los filtros actuales
  const [currentFilters, setCurrentFilters] = useState<FiltersState>({
    ubigeo: null,
    codigoDna: "",
    fechaDesde: null,
    fechaHasta: null,
    supervisor: null,
    estadoSincronizacion: null,
  })

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadInitialData()
  }, [])

  // Función para cargar datos iniciales (supervisores y estados)
  async function loadInitialData() {
    setLoadingFilters(true)
    try {
      // Cargar supervisores
      const supervisoresData = await sincronizacionSupervisionesService.getSupervisores()
      setSupervisores(supervisoresData)

      // Cargar estados de sincronización
      const estadosData = await sincronizacionSupervisionesService.getEstadosSincronizacion()
      setEstadosSincronizacion(estadosData)
    } catch (err) {
      console.error("Error cargando datos iniciales:", err)
      setError("Error al cargar datos iniciales: " + (err instanceof Error ? err.message : "Error desconocido"))
    } finally {
      setLoadingFilters(false)
    }
  }

  // Función para buscar supervisiones
  async function searchSupervisiones(filters: FiltersState) {
    setLoading(true)
    setError(null)
    setSearchPerformed(true)
    setCurrentFilters(filters)

    try {
      const result = await sincronizacionSupervisionesService.searchSupervisiones({
        ...filters,
        page: currentPage,
        pageSize: recordsPerPage,
      })

      setSupervisiones(result.supervisiones)
      setTotalRecords(result.totalRecords)
    } catch (err) {
      console.error("Error buscando supervisiones:", err)
      setError("Error al buscar supervisiones: " + (err instanceof Error ? err.message : "Error desconocido"))
      setSupervisiones([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar los filtros
  function clearFilters() {
    setCurrentFilters({
      ubigeo: null,
      codigoDna: "",
      fechaDesde: null,
      fechaHasta: null,
      supervisor: null,
      estadoSincronizacion: null,
    })
    setSupervisiones([])
    setSearchPerformed(false)
    setCurrentPage(1)
    setTotalRecords(0)
  }

  // Función para cambiar de página
  function handlePageChange(page: number) {
    setCurrentPage(page)
  }

  // Efecto para realizar la búsqueda cuando cambia la página
  useEffect(() => {
    if (searchPerformed) {
      searchSupervisiones(currentFilters)
    }
  }, [currentPage])

  // Calcular el número total de páginas
  const totalPages = Math.ceil(totalRecords / recordsPerPage)

  return (
    <div className="space-y-6">
      {/* Sección de filtros */}
      <Card className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle>Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-neutral-50">
          {error && <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mb-4">{error}</div>}

          {loadingFilters ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b0000]" />
              <span className="ml-2 text-neutral-700">Cargando filtros...</span>
            </div>
          ) : (
            <SincronizacionSupervisionesFilters
              estadosSincronizacion={estadosSincronizacion}
              supervisores={supervisores}
              loading={loading}
              onSearch={searchSupervisiones}
              onClear={clearFilters}
            />
          )}
        </CardContent>
      </Card>

      {/* Sección de resultados */}
      <Card className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle className="flex items-center justify-between">
            <span>Resultados</span>
            {loading && (
              <div className="flex items-center text-sm font-normal text-white/80">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando información...
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-neutral-50">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b0000]" />
              <span className="ml-2 text-neutral-700">Cargando resultados...</span>
            </div>
          ) : searchPerformed ? (
            <SincronizacionSupervisionesTable
              supervisiones={supervisiones}
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              recordsPerPage={recordsPerPage}
              onPageChange={handlePageChange}
            />
          ) : (
            <div className="text-center py-16 text-neutral-600">Utilice los filtros para buscar supervisiones.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
