"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import SupervisionesFilters, { type FiltersState } from "./supervisiones-filters"
import SupervisionesTable from "./supervisiones-table"
import { supervisionesService, type Supervision, type Supervisor } from "@/services/supervisiones-service"
import { useToast } from "@/components/ui/use-toast"

export default function SupervisionesSearch() {
  // Estados para los filtros
  const [filters, setFilters] = useState<FiltersState>({
    ubigeo: null,
    codigoDna: "",
    fechaDesde: null,
    fechaHasta: null,
    supervisor: null,
  })

  // Estados para los resultados y carga
  const [supervisiones, setSupervisiones] = useState<Supervision[]>([])
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(25)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const { toast } = useToast()

  // Cargar supervisores al montar el componente
  useEffect(() => {
    async function loadSupervisores() {
      try {
        const data = await supervisionesService.getSupervisores()
        setSupervisores(data || [])
      } catch (error) {
        console.error("Error cargando supervisores:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los supervisores. Por favor, intente nuevamente.",
          variant: "destructive",
        })
        // Establecer un array vacío como fallback
        setSupervisores([])
      }
    }

    loadSupervisores()
  }, [toast])

  // Función para buscar supervisiones
  async function searchSupervisiones(newFilters?: FiltersState, page = 1) {
    const searchFilters = newFilters || filters

    setLoading(true)
    setError(null)
    setSearchPerformed(true)

    try {
      // Usar los nombres de parámetros correctos
      const result = await supervisionesService.searchSupervisiones({
        ubigeo: searchFilters.ubigeo,
        codigoDna: searchFilters.codigoDna,
        fechaDesde: searchFilters.fechaDesde,
        fechaHasta: searchFilters.fechaHasta,
        supervisor: searchFilters.supervisor,
        page,
        pageSize: recordsPerPage,
      })

      setSupervisiones(result.supervisiones || [])
      setTotalRecords(result.totalRecords || 0)
      setTotalPages(Math.ceil((result.totalRecords || 0) / recordsPerPage))
      setCurrentPage(page)
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

  // Función para manejar el cambio de página
  function handlePageChange(page: number) {
    // Volver a buscar con la nueva página
    searchSupervisiones(filters, page)
  }

  // Función para limpiar los filtros
  function handleClearFilters() {
    const emptyFilters = {
      ubigeo: null,
      codigoDna: "",
      fechaDesde: null,
      fechaHasta: null,
      supervisor: null,
    }

    setFilters(emptyFilters)
    setSupervisiones([])
    setSearchPerformed(false)
    setCurrentPage(1)
    setTotalRecords(0)
    setTotalPages(0)
  }

  // Función para manejar la búsqueda desde los filtros
  function handleSearch(newFilters: FiltersState) {
    setFilters(newFilters)
    setCurrentPage(1) // Resetear a la primera página
    searchSupervisiones(newFilters, 1)
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 fade-in">
        <h1 className="text-3xl font-bold text-gray-800">Directorio de las Supervisiones de las DEMUNA</h1>
        <p className="text-gray-600 mt-2">
          Visualice las supervisiones y seguimientos de supervisión de las DEMUNA
        </p>
      </div>
      {/* Sección de filtros */}
      <Card className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle>Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 bg-neutral-50">
          {error && <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mb-4">{error}</div>}
          <SupervisionesFilters
            supervisores={supervisores || []}
            loading={loading}
            onSearch={handleSearch}
            onClear={handleClearFilters}
          />
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
                <SupervisionesTable
                  supervisiones={supervisiones}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalRecords}
                  recordsPerPage={recordsPerPage}
                  onPageChange={handlePageChange}
                  isPublic={false}
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
