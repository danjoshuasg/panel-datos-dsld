"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, X } from "lucide-react"
import UbigeosFilter, { type UbigeosFilterRef } from "@/components/ubigeos/ubigeos-filter"
import type { EstadoAcreditacion } from "@/services/defensorias-service"

export interface FiltersState {
  ubigeo: string | null
  estadoAcreditacion: string | null
}

interface ReportesFiltersProps {
  estadosAcreditacion: EstadoAcreditacion[]
  loading: boolean
  onSearch: (filters: FiltersState) => void
  onClear: () => void
}

export default function ReportesFilters({ estadosAcreditacion, loading, onSearch, onClear }: ReportesFiltersProps) {
  // Estados para los filtros
  const [selectedUbigeo, setSelectedUbigeo] = useState<string | null>(null)
  const [estadoAcreditacion, setEstadoAcreditacion] = useState<string | null>(null)

  // Referencia al componente UbigeosFilter para poder reiniciarlo
  const ubigeosFilterRef = useRef<UbigeosFilterRef>(null)

  // Función para manejar la selección de ubigeo desde el componente UbigeosFilter
  function handleUbigeoSelected(ubigeoCode: string | null) {
    setSelectedUbigeo(ubigeoCode)
  }

  // Función para manejar cambios en el estado de acreditación
  function handleEstadoAcreditacionChange(value: string) {
    // If se selecciona "all" o "none", reiniciar el filtro
    if (value === "all" || value === "none") {
      setEstadoAcreditacion(null)
    } else {
      setEstadoAcreditacion(value)
    }
  }

  // Función para buscar
  function handleSearch() {
    onSearch({
      ubigeo: selectedUbigeo,
      estadoAcreditacion,
    })
  }

  // Función para limpiar los filtros
  function handleClearFilters() {
    // Reiniciar filtros de código y estado
    setEstadoAcreditacion(null)

    // Reiniciar filtro de ubicación
    setSelectedUbigeo(null)

    // Llamar al método resetFilters del componente UbigeosFilter
    if (ubigeosFilterRef.current) {
      ubigeosFilterRef.current.resetFilters()
    }

    // Notificar al componente padre
    onClear()
  }

  return (
    <div className="space-y-6 bg-neutral-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Filtro de ubicación */}
        <div className="slide-up bg-white rounded-md p-4 shadow-sm" style={{ animationDelay: "100ms" }}>
          <h3 className="text-sm font-medium mb-2 text-[#9b0000]">Ubicación</h3>
          <UbigeosFilter ref={ubigeosFilterRef} onUbigeoSelected={handleUbigeoSelected} />
        </div>

        <div className="space-y-4 slide-up bg-white rounded-md p-4 shadow-sm" style={{ animationDelay: "200ms" }}>
          {/* Filtro de estado de acreditación */}
          <div className="space-y-2">
            <label htmlFor="estado_acreditacion" className="text-sm font-medium text-[#9b0000]">
              Estado de Acreditación
            </label>
            <Select value={estadoAcreditacion || ""} onValueChange={handleEstadoAcreditacionChange}>
              <SelectTrigger id="estado_acreditacion" className="border-neutral-300 bg-white text-neutral-800">
                <SelectValue placeholder="Seleccione estado" className="text-neutral-500" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="none" className="text-neutral-800 hover:bg-neutral-100">
                  Seleccione estado
                </SelectItem>
                <SelectItem value="all" className="text-neutral-800 hover:bg-neutral-100">
                  Todos
                </SelectItem>
                {estadosAcreditacion.map((estado) => (
                  <SelectItem
                    key={estado.clave_caracteristica}
                    value={estado.clave_caracteristica}
                    className="text-neutral-800 hover:bg-neutral-100"
                  >
                    {estado.valor_caracteristica}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-2 pt-4">
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="flex-1 bg-[#9b0000] hover:bg-[#6b0000] transition-colors text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Generar Reportes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={loading}
              className="border-[#9b0000] text-[#9b0000] bg-white hover:bg-neutral-50"
            >
              <X className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
