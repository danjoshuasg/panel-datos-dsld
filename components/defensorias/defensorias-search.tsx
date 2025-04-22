"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import DefensoriasFilters, { type FiltersState } from "@/components/defensorias/defensorias-filters"
import DefensoriasTable from "@/components/defensorias/defensorias-table"
import {
  defensoriasService,
  type Defensoria,
  type EstadoAcreditacion,
  type ResponsableInfo,
} from "@/services/defensorias-service"

export default function DefensoriasSearch() {
  // Estados para los filtros
  const [filters, setFilters] = useState<FiltersState>({
    ubigeo: null,
    codigoDna: "",
    estadoAcreditacion: null,
  })

  // Estados para los resultados y carga
  const [defensorias, setDefensorias] = useState<Defensoria[]>([])
  const [estadosAcreditacion, setEstadosAcreditacion] = useState<EstadoAcreditacion[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingResponsables, setLoadingResponsables] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorResponsables, setErrorResponsables] = useState<string | null>(null)

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(25)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Estado para responsables
  const [responsables, setResponsables] = useState<Record<string, ResponsableInfo | null>>({})

  // Cargar estados de acreditación al montar el componente
  useEffect(() => {
    loadEstadosAcreditacion()
  }, [])

  // Función para cargar los estados de acreditación
  async function loadEstadosAcreditacion() {
    try {
      const data = await defensoriasService.getEstadosAcreditacion()
      setEstadosAcreditacion(data)
    } catch (err) {
      console.error("Error cargando estados de acreditación:", err)
      setError(
        "Error al cargar los estados de acreditación: " + (err instanceof Error ? err.message : "Error desconocido"),
      )
    }
  }

  // Función para buscar defensorías
  async function searchDefensorias(newFilters?: FiltersState) {
    const searchFilters = newFilters || filters

    setLoading(true)
    setError(null)
    setSearchPerformed(true)
    setResponsables({}) // Limpiar responsables anteriores

    try {
      // Usar el servicio para buscar defensorías
      const result = await defensoriasService.searchDefensorias({
        ubigeo: searchFilters.ubigeo,
        codigoDna: searchFilters.codigoDna,
        estadoAcreditacion: searchFilters.estadoAcreditacion,
        page: currentPage,
        pageSize: recordsPerPage,
      })

      setDefensorias(result.defensorias)
      setTotalRecords(result.totalRecords)
      setTotalPages(Math.ceil(result.totalRecords / recordsPerPage))

      // Si hay defensorías, cargar sus responsables
      if (result.defensorias.length > 0) {
        await loadResponsables(result.defensorias.map((d) => d.codigo_dna))
      }
    } catch (err) {
      console.error("Error buscando defensorías:", err)
      setError("Error al buscar defensorías: " + (err instanceof Error ? err.message : "Error desconocido"))
      setDefensorias([])
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar responsables
  async function loadResponsables(codigosDna: string[]) {
    if (codigosDna.length === 0) return

    try {
      setLoadingResponsables(true)
      setErrorResponsables(null)

      const result = await defensoriasService.loadResponsables(codigosDna)
      setResponsables(result)
    } catch (err) {
      console.error("Error cargando responsables:", err)
      setErrorResponsables("Error al cargar información de responsables")
    } finally {
      setLoadingResponsables(false)
    }
  }

  // Función para limpiar los filtros
  function clearFilters() {
    setFilters({
      ubigeo: null,
      codigoDna: "",
      estadoAcreditacion: null,
    })
    setDefensorias([])
    setSearchPerformed(false)
    setResponsables({})
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
          <DefensoriasFilters
            estadosAcreditacion={estadosAcreditacion}
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
            {loadingResponsables && (
              <div className="flex items-center text-sm font-normal text-white/80">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando información de responsables...
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
            defensorias.length > 0 ? (
              <div className="px-0 py-0">
                {errorResponsables && (
                  <div className="bg-yellow-50 p-3 mx-6 mt-6 rounded-md text-yellow-700 text-sm mb-4">
                    {errorResponsables}. Algunas funcionalidades pueden estar limitadas.
                  </div>
                )}
                <DefensoriasTable
                  defensorias={defensorias}
                  responsables={responsables}
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
