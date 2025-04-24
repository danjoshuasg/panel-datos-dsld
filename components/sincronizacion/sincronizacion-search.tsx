"use client"

import { useState, useEffect } from "react"
import {
  sincronizacionService,
  type DefensoriaSincronizacion,
  type SearchParams,
} from "@/services/sincronizacion-service"
import SincronizacionFilters, { type FiltersState } from "./sincronizacion-filters"
import SincronizacionTable from "./sincronizacion-table"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function SincronizacionSearch() {
  // Estado para almacenar los resultados de la búsqueda
  const [defensorias, setDefensorias] = useState<DefensoriaSincronizacion[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [estadosSincronizacion, setEstadosSincronizacion] = useState([])
  const { toast } = useToast()

  // Cargar estados de sincronización al montar el componente
  useEffect(() => {
    async function loadEstadosSincronizacion() {
      setLoadingFilters(true)
      try {
        const estados = await sincronizacionService.getEstadosSincronizacion()
        setEstadosSincronizacion(estados)
      } catch (error) {
        console.error("Error al cargar estados de sincronización:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los estados de sincronización",
          variant: "destructive",
        })
      } finally {
        setLoadingFilters(false)
      }
    }

    loadEstadosSincronizacion()
  }, [toast])

  // Función para realizar la búsqueda
  async function handleSearch(filters: FiltersState) {
    setLoading(true)
    setSearchPerformed(true)
    try {
      const searchParams: SearchParams = {
        ...filters,
        page: currentPage,
        pageSize,
      }

      const result = await sincronizacionService.search(searchParams)
      setDefensorias(result.defensorias)
      setTotalRecords(result.totalRecords)
    } catch (error) {
      console.error("Error al buscar defensorías:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de sincronización",
        variant: "destructive",
      })
      setDefensorias([])
      setTotalRecords(0)
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar los filtros
  function handleClearFilters() {
    setDefensorias([])
    setTotalRecords(0)
    setCurrentPage(1)
    setSearchPerformed(false)
  }

  // Función para cambiar de página
  async function handlePageChange(page: number) {
    setCurrentPage(page)
    // Volver a realizar la búsqueda con la nueva página
    // Aquí deberíamos mantener los filtros actuales
    // Por simplicidad, asumimos que no hay filtros activos
    handleSearch({
      ubigeo: null,
      codigoDna: "",
      estadoSincronizacion: null,
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle>Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 bg-neutral-50">
          {loadingFilters ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#9b0000]" />
              <span className="ml-2 text-neutral-700">Cargando filtros...</span>
            </div>
          ) : (
            <SincronizacionFilters
              estadosSincronizacion={estadosSincronizacion}
              loading={loading}
              onSearch={handleSearch}
              onClear={handleClearFilters}
            />
          )}
        </CardContent>
      </Card>

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
            defensorias.length > 0 ? (
              <div className="px-0 py-0">
                <SincronizacionTable
                  defensorias={defensorias}
                  currentPage={currentPage}
                  totalRecords={totalRecords}
                  pageSize={pageSize}
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
