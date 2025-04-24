"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import SincronizacionSupervisionesFilters, {
  type FiltersState,
} from "@/components/sincronizacion-supervisiones/sincronizacion-supervisiones-filters"
import SincronizacionSupervisionesTable from "@/components/sincronizacion-supervisiones/sincronizacion-supervisiones-table"
import {
  sincronizacionSupervisionesService,
  type SupervisionSincronizacion,
} from "@/services/sincronizacion-supervisiones-service"

export default function SincronizacionSupervisionesSearch() {
  // Estados para los datos de filtros
  const [supervisores, setSupervisores] = useState([])
  const [estadosSincronizacion, setEstadosSincronizacion] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Estados para los filtros
  const [filters, setFilters] = useState<FiltersState>({
    ubigeo: null,
    codigoDna: "",
    fechaDesde: null,
    fechaHasta: null,
    supervisor: null,
    estadoSincronizacion: null,
  })

  // Estados para los resultados y carga
  const [supervisiones, setSupervisiones] = useState<SupervisionSincronizacion[]>([])
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(25)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

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
      setSupervisores(supervisoresData || [])

      // Cargar estados de sincronización
      const estadosData = await sincronizacionSupervisionesService.getEstadosSincronizacion()
      setEstadosSincronizacion(estadosData || [])
    } catch (err) {
      console.error("Error cargando datos iniciales:", err)
      setError("Error al cargar datos iniciales: " + (err instanceof Error ? err.message : "Error desconocido"))
      // Inicializar con arrays vacíos en caso de error
      setSupervisores([])
      setEstadosSincronizacion([])
    } finally {
      setLoadingFilters(false)
    }
  }

  // Función para buscar supervisiones
  async function searchSupervisiones(newFilters?: FiltersState) {
    const searchFilters = newFilters || filters

    setLoading(true)
    setError(null)
    setSearchPerformed(true)

    try {
      // Usar el servicio para buscar supervisiones
      const result = await sincronizacionSupervisionesService.searchSupervisiones({
        ubigeo: searchFilters.ubigeo,
        codigoDna: searchFilters.codigoDna,
        fechaDesde: searchFilters.fechaDesde,
        fechaHasta: searchFilters.fechaHasta,
        supervisor: searchFilters.supervisor,
        estadoSincronizacion: searchFilters.estadoSincronizacion,
        page: currentPage,
        pageSize: recordsPerPage,
      })

      setSupervisiones(result.supervisiones || [])
      setTotalRecords(result.totalRecords || 0)
      setTotalPages(Math.ceil((result.totalRecords || 0) / recordsPerPage))
    } catch (err) {
      console.error("Error buscando supervisiones:", err)
      setError("Error al buscar supervisiones: " + (err instanceof Error ? err.message : "Error desconocido"))
      setSupervisiones([])
      setTotalRecords(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar los filtros
  function clearFilters() {
    setFilters({
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
    setTotalPages(0)
  }

  // Función para manejar cambios de página
  function handlePageChange(page: number) {
    setCurrentPage(page)
    // Volver a buscar con la nueva página
    searchSupervisiones()
  }

  // Función para manejar la búsqueda desde los filtros
  function handleSearch(newFilters: FiltersState) {
    setFilters(newFilters)
    setCurrentPage(1) // Resetear a la primera página
    searchSupervisiones(newFilters)
  }

  return (
    <div className="space-y-6">
      {/* Sección de filtros */}
      <Card className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle>Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 bg-neutral-50">
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
              onSearch={handleSearch}
              onClear={clearFilters}
            />
          )}
        </CardContent>
      </Card>

      {/* Sección de resultados */}
      <Card
        className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm"
        style={{ animationDelay: "100ms" }}
      >
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-neutral-50">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b0000]" />
              <span className="ml-2 text-neutral-700">Cargando resultados...</span>
            </div>
          ) : searchPerformed ? (
            supervisiones.length > 0 ? (
              <div className="px-0 py-0">
                <SincronizacionSupervisionesTable
                  supervisiones={supervisiones}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalRecords}
                  recordsPerPage={recordsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-600">
                No se encontraron supervisiones con los filtros seleccionados.
              </div>
            )
          ) : (
            <div className="text-center py-16 text-neutral-600">Utilice los filtros para buscar supervisiones.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
