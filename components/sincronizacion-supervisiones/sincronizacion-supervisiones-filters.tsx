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
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"
import type { EstadoSincronizacion } from "@/services/sincronizacion-supervisiones-service"

export interface FiltersState {
  ubigeo: string | null
  codigoDna: string
  fechaDesde: string | null
  fechaHasta: string | null
  supervisor: string | null
  estadoSincronizacion: string | null
}

interface SincronizacionSupervisionesFiltersProps {
  estadosSincronizacion?: EstadoSincronizacion[]
  supervisores?: { codigo_supervisor: number; nombre_supervisor: string }[]
  loading: boolean
  onSearch: (filters: FiltersState) => void
  onClear: () => void
}

export default function SincronizacionSupervisionesFilters({
  estadosSincronizacion = [],
  supervisores = [],
  loading,
  onSearch,
  onClear,
}: SincronizacionSupervisionesFiltersProps) {
  // Estados para los filtros
  const [selectedUbigeo, setSelectedUbigeo] = useState<string | null>(null)
  const [codigoDna, setCodigoDna] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [supervisor, setSupervisor] = useState<string | null>(null)
  const [estadoSincronizacion, setEstadoSincronizacion] = useState<string | null>(null)

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
    if (dateRange?.from && dateRange?.to) {
      const dateFrom = dateRange.from
      const dateTo = dateRange.to

      if (dateFrom > dateTo) {
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
      fechaDesde: dateRange?.from ? dateRange.from.toISOString().split("T")[0] : null,
      fechaHasta: dateRange?.to ? dateRange.to.toISOString().split("T")[0] : null,
      supervisor,
      estadoSincronizacion,
    })
  }

  // Función para limpiar los filtros
  function handleClearFilters() {
    // Reiniciar filtros
    setCodigoDna("")
    setDateRange(undefined)
    setSupervisor(null)
    setEstadoSincronizacion(null)

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
          <div className="space-y-2">
            <label htmlFor="date-range" className="text-sm font-medium text-[#9b0000]">
              Rango de Fechas
            </label>
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
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
                {Array.isArray(supervisores) &&
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

          {/* Filtro de estado de sincronización */}
          <div className="space-y-2">
            <label htmlFor="estado_sincronizacion" className="text-sm font-medium text-[#9b0000]">
              Estado SISDNA
            </label>
            <Select value={estadoSincronizacion || ""} onValueChange={setEstadoSincronizacion}>
              <SelectTrigger id="estado_sincronizacion" className="border-neutral-300 bg-white text-neutral-800">
                <SelectValue placeholder="Seleccione estado" className="text-neutral-500" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all" className="text-neutral-800 hover:bg-neutral-100">
                  Todos
                </SelectItem>
                {Array.isArray(estadosSincronizacion) &&
                  estadosSincronizacion.map((estado) => (
                    <SelectItem
                      key={estado.nid_estado}
                      value={estado.nid_estado}
                      className="text-neutral-800 hover:bg-neutral-100"
                    >
                      {estado.nombre_estado}
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
