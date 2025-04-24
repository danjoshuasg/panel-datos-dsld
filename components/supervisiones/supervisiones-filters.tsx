"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, X, Calendar } from "lucide-react"
import UbicacionSelector, {
  type UbicacionSelectorRef,
  type UbicacionSeleccionada,
} from "@/components/ubigeos/ubicacion-selector"
import type { Supervisor } from "@/services/supervisiones-service"

export interface FiltersState {
  ubigeo: string | null
  codigoDna: string
  fechaDesde: string | null
  fechaHasta: string | null
  supervisor: string | null
}

interface SupervisionesFiltersProps {
  supervisores: Supervisor[]
  loading: boolean
  onSearch: (filters: FiltersState) => void
  onClear: () => void
}

export default function SupervisionesFilters({ supervisores, loading, onSearch, onClear }: SupervisionesFiltersProps) {
  // Estados para los filtros
  const [selectedUbigeo, setSelectedUbigeo] = useState<string | null>(null)
  const [codigoDna, setCodigoDna] = useState("")
  const [fechaDesde, setFechaDesde] = useState<string | null>(null)
  const [fechaHasta, setFechaHasta] = useState<string | null>(null)
  const [supervisor, setSupervisor] = useState<string | null>(null)

  // Referencia al componente UbicacionSelector para poder reiniciarlo
  const ubicacionSelectorRef = useRef<UbicacionSelectorRef>(null)

  // Función para manejar la selección de ubicación
  function handleUbicacionChange(ubicacion: UbicacionSeleccionada) {
    setSelectedUbigeo(ubicacion.codigoUbigeo)
  }

  // Agregar estado para manejar errores de validación
  const [error, setError] = useState<string | null>(null)

  // Función para buscar
  function handleSearch() {
    // Validar fechas antes de buscar
    if (fechaDesde && fechaHasta) {
      const dateDesde = new Date(fechaDesde)
      const dateHasta = new Date(fechaHasta)

      if (dateDesde > dateHasta) {
        // Mostrar error de validación
        setError("La fecha inicial no puede ser posterior a la fecha final")
        return
      }
    }

    // Limpiar error si existe
    setError(null)

    onSearch({
      ubigeo: selectedUbigeo,
      codigoDna: codigoDna.trim(), // Eliminar espacios en blanco
      fechaDesde,
      fechaHasta,
      supervisor,
    })
  }

  // Función para limpiar los filtros
  function handleClearFilters() {
    // Reiniciar filtros
    setCodigoDna("")
    setFechaDesde(null)
    setFechaHasta(null)
    setSupervisor(null)

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

          {/* Filtros de fecha */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="fecha_desde" className="text-sm font-medium text-[#9b0000]">
                Fecha desde
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <Input
                  id="fecha_desde"
                  type="date"
                  value={fechaDesde || ""}
                  onChange={(e) => setFechaDesde(e.target.value || null)}
                  className="border-neutral-300 pl-10 text-neutral-800 bg-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="fecha_hasta" className="text-sm font-medium text-[#9b0000]">
                Fecha hasta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <Input
                  id="fecha_hasta"
                  type="date"
                  value={fechaHasta || ""}
                  onChange={(e) => setFechaHasta(e.target.value || null)}
                  className="border-neutral-300 pl-10 text-neutral-800 bg-white"
                />
              </div>
            </div>
          </div>

          {error && <div className="bg-red-50 p-2 rounded-md text-red-600 text-sm mt-2">{error}</div>}

          {/* Filtro de supervisor */}
          <div className="space-y-2">
            <label htmlFor="supervisor" className="text-sm font-medium text-[#9b0000]">
              Supervisor
            </label>
            <Select value={supervisor || ""} onValueChange={setSupervisor}>
              <SelectTrigger id="supervisor" className="border-neutral-300 bg-white text-neutral-800">
                <SelectValue placeholder="Seleccione supervisor" className="text-neutral-500" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-neutral-800 hover:bg-neutral-100">
                  Todos
                </SelectItem>
                {supervisores &&
                  supervisores.map((sup) => (
                    <SelectItem
                      key={sup.codigo_supervisor}
                      value={sup.codigo_supervisor.toString()}
                      className="text-neutral-800 hover:bg-neutral-100"
                    >
                      {sup.nombre_supervisor}
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
