"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, X } from "lucide-react"
import UbicacionSelector, {
  type UbicacionSelectorRef,
  type UbicacionSeleccionada,
} from "@/components/ubigeos/ubicacion-selector"
import type { EstadoAcreditacion } from "@/services/defensorias-service"

export interface FiltersState {
  ubigeo: string | null
  codigoDna: string
  estadoAcreditacion: string | null
}

interface DefensoriasFiltersProps {
  estadosAcreditacion: EstadoAcreditacion[]
  loading: boolean
  onSearch: (filters: FiltersState) => void
  onClear: () => void
}

export default function DefensoriasFilters({
  estadosAcreditacion,
  loading,
  onSearch,
  onClear,
}: DefensoriasFiltersProps) {
  // Estados para los filtros
  const [selectedUbigeo, setSelectedUbigeo] = useState<string | null>(null)
  const [codigoDna, setCodigoDna] = useState("")
  const [estadoAcreditacion, setEstadoAcreditacion] = useState<string | null>(null)

  // Referencia al componente UbicacionSelector para poder reiniciarlo
  const ubicacionSelectorRef = useRef<UbicacionSelectorRef>(null)

  // Función para manejar la selección de ubicación
  function handleUbicacionChange(ubicacion: UbicacionSeleccionada) {
    setSelectedUbigeo(ubicacion.codigoUbigeo)
  }

  // Función para buscar
  function handleSearch() {
    onSearch({
      ubigeo: selectedUbigeo,
      codigoDna,
      estadoAcreditacion,
    })
  }

  // Función para limpiar los filtros
  function handleClearFilters() {
    // Reiniciar filtros de código y estado
    setCodigoDna("")
    setEstadoAcreditacion(null)

    // Reiniciar filtro de ubicación
    setSelectedUbigeo(null)

    // Llamar al método resetSeleccion del componente UbicacionSelector
    if (ubicacionSelectorRef.current) {
      ubicacionSelectorRef.current.resetSeleccion()
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
          <UbicacionSelector ref={ubicacionSelectorRef} onUbicacionChange={handleUbicacionChange} />
        </div>

        <div className="space-y-4 slide-up bg-white rounded-md p-4 shadow-sm" style={{ animationDelay: "200ms" }}>
          {/* Filtro de código DNA */}
          <div className="space-y-2">
            <label htmlFor="codigo_dna" className="text-sm font-medium text-[#9b0000]">
              Código DNA
            </label>
            <Input
              id="codigo_dna"
              value={codigoDna}
              onChange={(e) => setCodigoDna(e.target.value)}
              placeholder="Ingrese código DNA"
              className="border-neutral-300 focus:border-[#9b0000] focus:ring-[#9b0000] bg-white text-neutral-800 placeholder:text-neutral-500"
            />
          </div>

          {/* Filtro de estado de acreditación */}
          <div className="space-y-2">
            <label htmlFor="estado_acreditacion" className="text-sm font-medium text-[#9b0000]">
              Estado de Acreditación
            </label>
            <Select value={estadoAcreditacion || ""} onValueChange={setEstadoAcreditacion}>
              <SelectTrigger id="estado_acreditacion" className="border-neutral-300 bg-white text-neutral-800">
                <SelectValue placeholder="Seleccione estado" className="text-neutral-500" />
              </SelectTrigger>
              <SelectContent className="bg-white">
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
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
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
