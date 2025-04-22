"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import SincronizacionFilters, { type FiltersState } from "@/components/sincronizacion/sincronizacion-filters"
import SincronizacionTable from "@/components/sincronizacion/sincronizacion-table"
import {
  sincronizacionService,
  type DefensoriaSincronizacion,
  type EstadoSincronizacion,
} from "@/services/sincronizacion-service"

export default function SincronizacionSearch() {
  // Estados para los filtros
  const [filters, setFilters] = useState<FiltersState>({
    ubigeo: null,
    codigoDna: "",
    estadoSincronizacion: null,
  })

  // Estados para los resultados y carga
  const [defensorias, setDefensorias] = useState<DefensoriaSincronizacion[]>([])
  const [estadosSincronizacion, setEstadosSincronizacion] = useState<EstadoSincronizacion[]>([])
  const [loading, setLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(25)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Cargar estados de sincronización al montar el componente
  useEffect(() => {
    loadEstadosSincronizacion()
  }, [])

  // Función para cargar los estados de sincronización
  async function loadEstadosSincronizacion() {
    try {
      const data = await sincronizacionService.getEstadosSincronizacion()
      setEstadosSincronizacion(data)
    } catch (err) {
      console.error("Error cargando estados de sincronización:", err)
      setError(
        "Error al cargar los estados de sincronización: " + (err instanceof Error ? err.message : "Error desconocido"),
      )
    }
  }

  // Función para buscar defensorías
  async function searchDefensorias(newFilters?: FiltersState) {
    const searchFilters = newFilters || filters

    setLoading(true)
    setError(null)
    setSearchPerformed(true)

    try {
      // Usar el servicio para buscar defensorías
      const result = await sincronizacionService.searchDefensorias({
        ubigeo: searchFilters.ubigeo,
        codigoDna: searchFilters.codigoDna,
        estadoSincronizacion: searchFilters.estadoSincronizacion,
        page: currentPage,
        pageSize: recordsPerPage,
      })

      setDefensorias(result.defensorias)
      setTotalRecords(result.totalRecords)
      setTotalPages(Math.ceil(result.totalRecords / recordsPerPage))
    } catch (err) {
      console.error("Error buscando defensorías:", err)
      setError("Error al buscar defensorías: " + (err instanceof Error ? err.message : "Error desconocido"))
      setDefensorias([])
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar los filtros
  function clearFilters() {
    setFilters({
      ubigeo: null,
      codigoDna: "",
      estadoSincronizacion: null,
    })
    setDefensorias([])
    setSearchPerformed(false)
    setCurrentPage(1)
  }

  // Función para manejar cambios de página
  function handlePageChange(page: number) {
    setCurrentPage(page)
    // Volver a buscar con la nueva página
    searchDefensorias()
  }

  // Función para manejar la búsqueda desde los filtros
  function handleSearch(newFilters: FiltersState) {
    setFilters(newFilters)
    setCurrentPage(1) // Resetear a la primera página
    searchDefensorias(newFilters)
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
          <SincronizacionFilters
            estadosSincronizacion={estadosSincronizacion}
            loading={loading}
            onSearch={handleSearch}
            onClear={clearFilters}
          />
        </CardContent>
      </Card>

      {/* Sección de resultados */}
      <Card
        className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm"
        style={{ animationDelay: "100ms" }}
      >
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle className="flex items-center justify-between">
            <span>Resultados</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-neutral-50">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b0000]" />
              <span className="ml-2 text-neutral-700">Cargando resultados...</span>
            </div>
          ) : searchPerformed ? (
            defensorias.length > 0 ? (
              <div className="px-0 py-0">
                <SincronizacionTable
                  defensorias={defensorias}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalRecords}
                  recordsPerPage={recordsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : (
              <div className="text-center py-16 text-neutral-600">
                No se encontraron defensorías con los filtros seleccionados.
              </div>
            )
          ) : (
            <div className="text-center py-16 text-neutral-600">Utilice los filtros para buscar defensorías.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
