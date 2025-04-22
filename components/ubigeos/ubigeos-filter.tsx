"use client"

import { useEffect } from "react"

import { useState, useCallback, forwardRef, useImperativeHandle } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { ubigeosService, type Ubigeo } from "@/services/ubigeos-service"

// Interfaces
export interface UbigeosFilterRef {
  resetFilters: () => void
}

interface UbigeosFilterProps {
  onUbigeoSelected?: (ubigeoCode: string | null) => void
}

const UbigeosFilter = forwardRef<UbigeosFilterRef, UbigeosFilterProps>(({ onUbigeoSelected }, ref) => {
  // State para valores seleccionados
  const [selectedDepartamento, setSelectedDepartamento] = useState<string | null>(null)
  const [selectedProvincia, setSelectedProvincia] = useState<string | null>(null)
  const [selectedDistrito, setSelectedDistrito] = useState<string | null>(null)

  // State para opciones
  const [departamentos, setDepartamentos] = useState<Ubigeo[]>([])
  const [provincias, setProvincias] = useState<Ubigeo[]>([])
  const [distritos, setDistritos] = useState<Ubigeo[]>([])

  // Estados de carga
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(true)
  const [loadingProvincias, setLoadingProvincias] = useState(false)
  const [loadingDistritos, setLoadingDistritos] = useState(false)

  // Estado de error
  const [error, setError] = useState<string | null>(null)

  // Función para notificar cambios al componente padre
  const notificarCambio = useCallback(() => {
    if (onUbigeoSelected) {
      const codigoUbigeo = selectedDistrito || selectedProvincia || selectedDepartamento
      onUbigeoSelected(codigoUbigeo)
    }
  }, [onUbigeoSelected, selectedDepartamento, selectedProvincia, selectedDistrito])

  // Exponer métodos al componente padre
  useImperativeHandle(
    ref,
    () => ({
      resetFilters: () => {
        setSelectedDepartamento(null)
        setSelectedProvincia(null)
        setSelectedDistrito(null)
        setProvincias([])
        setDistritos([])
        notificarCambio()
      },
    }),
    [selectedDepartamento, selectedProvincia, selectedDistrito, notificarCambio],
  )

  // Función para cargar departamentos
  const fetchDepartamentos = useCallback(async () => {
    setLoadingDepartamentos(true)
    setError(null)

    try {
      const data = await ubigeosService.getDepartamentos()
      setDepartamentos(data)
    } catch (err) {
      console.error("Error fetching departamentos:", err)
      setError(`Error al cargar departamentos: ${(err as Error).message}`)
    } finally {
      setLoadingDepartamentos(false)
    }
  }, [])

  // Función para cargar provincias
  const fetchProvincias = useCallback(
    async (departamentoId: string) => {
      if (!departamentoId) {
        setProvincias([])
        return
      }

      setLoadingProvincias(true)
      setError(null)

      try {
        const data = await ubigeosService.getProvinciasByDepartamento(departamentoId)
        setProvincias(data)
        notificarCambio()
      } catch (err) {
        console.error("Error fetching provincias:", err)
        setError(`Error al cargar provincias: ${(err as Error).message}`)
      } finally {
        setLoadingProvincias(false)
      }
    },
    [notificarCambio],
  )

  // Función para cargar distritos
  const fetchDistritos = useCallback(
    async (provinciaId: string) => {
      if (!provinciaId) {
        setDistritos([])
        return
      }

      setLoadingDistritos(true)
      setError(null)

      try {
        const data = await ubigeosService.getDistritosByProvincia(provinciaId)
        setDistritos(data)
        notificarCambio()
      } catch (err) {
        console.error("Error fetching distritos:", err)
        setError(`Error al cargar distritos: ${(err as Error).message}`)
      } finally {
        setLoadingDistritos(false)
      }
    },
    [notificarCambio],
  )

  // Cargar departamentos al montar el componente
  useEffect(() => {
    fetchDepartamentos()
  }, [fetchDepartamentos])

  // Cargar provincias cuando se selecciona un departamento
  useEffect(() => {
    if (selectedDepartamento) {
      fetchProvincias(selectedDepartamento)
    } else {
      setProvincias([])
    }
  }, [selectedDepartamento, fetchProvincias])

  // Cargar distritos cuando se selecciona una provincia
  useEffect(() => {
    if (selectedProvincia) {
      fetchDistritos(selectedProvincia)
    } else {
      setDistritos([])
    }
  }, [selectedProvincia, fetchDistritos])

  // Manejar cambios en la selección
  const handleDepartamentoChange = (value: string) => {
    setSelectedDepartamento(value === "reset" ? null : value)
    setSelectedProvincia(null)
    setSelectedDistrito(null)
    setProvincias([])
    setDistritos([])
    notificarCambio()
  }

  const handleProvinciaChange = (value: string) => {
    setSelectedProvincia(value === "reset" ? null : value)
    setSelectedDistrito(null)
    setDistritos([])
    notificarCambio()
  }

  const handleDistritoChange = (value: string) => {
    setSelectedDistrito(value === "reset" ? null : value)
    notificarCambio()
  }

  // Función para reintentar la carga en caso de error
  const handleRetry = () => {
    setError(null)

    if (loadingDepartamentos || departamentos.length === 0) {
      fetchDepartamentos()
    } else if (selectedDepartamento && (loadingProvincias || provincias.length === 0)) {
      fetchProvincias(selectedDepartamento)
    } else if (selectedProvincia && (loadingDistritos || distritos.length === 0)) {
      fetchDistritos(selectedProvincia)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={handleRetry} className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded">
            Reintentar
          </button>
        </div>
      )}

      {/* Departamento Select */}
      <div className="space-y-2">
        <label htmlFor="departamento" className="text-sm font-medium text-neutral-800">
          Departamento
        </label>
        <Select
          value={selectedDepartamento || ""}
          onValueChange={handleDepartamentoChange}
          disabled={loadingDepartamentos}
        >
          <SelectTrigger id="departamento" className="w-full bg-white border-neutral-300 text-neutral-800">
            <SelectValue placeholder="Seleccione un departamento" className="text-neutral-500" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {loadingDepartamentos ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-neutral-800">Cargando...</span>
              </div>
            ) : departamentos.length === 0 ? (
              <div className="p-2 text-sm text-neutral-500">No hay departamentos disponibles</div>
            ) : (
              <>
                <SelectItem value="reset" className="text-neutral-800 hover:bg-neutral-100">
                  Todos los departamentos
                </SelectItem>
                {departamentos.map((dep) => (
                  <SelectItem
                    key={dep.codigo_ubigeo}
                    value={dep.codigo_ubigeo}
                    className="text-neutral-800 hover:bg-neutral-100"
                  >
                    {dep.txt_nombre}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Provincia Select */}
      <div className="space-y-2">
        <label htmlFor="provincia" className="text-sm font-medium text-neutral-800">
          Provincia
        </label>
        <Select
          value={selectedProvincia || ""}
          onValueChange={handleProvinciaChange}
          disabled={!selectedDepartamento || loadingProvincias}
        >
          <SelectTrigger id="provincia" className="w-full bg-white border-neutral-300 text-neutral-800">
            <SelectValue placeholder="Seleccione una provincia" className="text-neutral-500" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {loadingProvincias ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-neutral-800">Cargando...</span>
              </div>
            ) : !selectedDepartamento ? (
              <div className="p-2 text-sm text-neutral-500">Seleccione un departamento primero</div>
            ) : provincias.length === 0 ? (
              <div className="p-2 text-sm text-neutral-500">No hay provincias disponibles</div>
            ) : (
              <>
                <SelectItem value="reset" className="text-neutral-800 hover:bg-neutral-100">
                  Todas las provincias
                </SelectItem>
                {provincias.map((prov) => (
                  <SelectItem
                    key={prov.codigo_ubigeo}
                    value={prov.codigo_ubigeo}
                    className="text-neutral-800 hover:bg-neutral-100"
                  >
                    {prov.txt_nombre}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Distrito Select */}
      <div className="space-y-2">
        <label htmlFor="distrito" className="text-sm font-medium text-neutral-800">
          Distrito
        </label>
        <Select
          value={selectedDistrito || ""}
          onValueChange={handleDistritoChange}
          disabled={!selectedProvincia || loadingDistritos}
        >
          <SelectTrigger id="distrito" className="w-full bg-white border-neutral-300 text-neutral-800">
            <SelectValue placeholder="Seleccione un distrito" className="text-neutral-500" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {loadingDistritos ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-neutral-800">Cargando...</span>
              </div>
            ) : !selectedProvincia ? (
              <div className="p-2 text-sm text-neutral-500">Seleccione una provincia primero</div>
            ) : distritos.length === 0 ? (
              <div className="p-2 text-sm text-neutral-500">No hay distritos disponibles</div>
            ) : (
              <>
                <SelectItem value="reset" className="text-neutral-800 hover:bg-neutral-100">
                  Todos los distritos
                </SelectItem>
                {distritos.map((dist) => (
                  <SelectItem
                    key={dist.codigo_ubigeo}
                    value={dist.codigo_ubigeo}
                    className="text-neutral-800 hover:bg-neutral-100"
                  >
                    {dist.txt_nombre}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})

UbigeosFilter.displayName = "UbigeosFilter"

export default UbigeosFilter
