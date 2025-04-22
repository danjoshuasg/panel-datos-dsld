"use client"

import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { ubigeosService, type Ubigeo } from "@/services/ubigeos-service"

// Interfaces
export interface UbicacionSeleccionada {
  departamento: string | null
  provincia: string | null
  distrito: string | null
  codigoUbigeo: string | null // Código del nivel más específico seleccionado
  nombreCompleto: string // Representación textual completa (ej: "Lima / Lima / Miraflores")
}

export interface UbicacionSelectorProps {
  onUbicacionChange?: (ubicacion: UbicacionSeleccionada) => void
  className?: string
  initialUbicacion?: Partial<UbicacionSeleccionada>
  showLabels?: boolean
  required?: boolean
  disabled?: boolean
}

export interface UbicacionSelectorRef {
  resetSeleccion: () => void
  getUbicacionActual: () => UbicacionSeleccionada
  setUbicacion: (ubicacion: Partial<UbicacionSeleccionada>) => Promise<boolean>
}

const UbicacionSelector = forwardRef<UbicacionSelectorRef, UbicacionSelectorProps>(
  (
    { onUbicacionChange, className = "", initialUbicacion, showLabels = true, required = false, disabled = false },
    ref,
  ) => {
    // State para valores seleccionados
    const [selectedDepartamento, setSelectedDepartamento] = useState<string | null>(
      initialUbicacion?.departamento || null,
    )
    const [selectedProvincia, setSelectedProvincia] = useState<string | null>(initialUbicacion?.provincia || null)
    const [selectedDistrito, setSelectedDistrito] = useState<string | null>(initialUbicacion?.distrito || null)

    // State para nombres de ubicaciones seleccionadas
    const [departamentoNombre, setDepartamentoNombre] = useState<string>("")
    const [provinciaNombre, setProvinciaNombre] = useState<string>("")
    const [distritoNombre, setDistritoNombre] = useState<string>("")

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

    // Controladores de aborto para cancelar solicitudes pendientes
    const abortControllersRef = useRef<{
      departamentos?: AbortController
      provincias?: AbortController
      distritos?: AbortController
    }>({})

    // Función para construir el nombre completo de la ubicación
    const construirNombreCompleto = useCallback(() => {
      const partes = []
      if (departamentoNombre) partes.push(departamentoNombre)
      if (provinciaNombre) partes.push(provinciaNombre)
      if (distritoNombre) partes.push(distritoNombre)
      return partes.join(" / ")
    }, [departamentoNombre, provinciaNombre, distritoNombre])

    // Función para notificar cambios al componente padre
    const notificarCambio = useCallback(() => {
      if (onUbicacionChange) {
        const codigoUbigeo = selectedDistrito || selectedProvincia || selectedDepartamento
        onUbicacionChange({
          departamento: selectedDepartamento,
          provincia: selectedProvincia,
          distrito: selectedDistrito,
          codigoUbigeo,
          nombreCompleto: construirNombreCompleto(),
        })
      }
    }, [onUbicacionChange, selectedDepartamento, selectedProvincia, selectedDistrito, construirNombreCompleto])

    // Exponer métodos al componente padre
    useImperativeHandle(
      ref,
      () => ({
        resetSeleccion: () => {
          setSelectedDepartamento(null)
          setSelectedProvincia(null)
          setSelectedDistrito(null)
          setDepartamentoNombre("")
          setProvinciaNombre("")
          setDistritoNombre("")
          setProvincias([])
          setDistritos([])
          notificarCambio()
        },
        getUbicacionActual: () => {
          const codigoUbigeo = selectedDistrito || selectedProvincia || selectedDepartamento
          return {
            departamento: selectedDepartamento,
            provincia: selectedProvincia,
            distrito: selectedDistrito,
            codigoUbigeo,
            nombreCompleto: construirNombreCompleto(),
          }
        },
        setUbicacion: async (ubicacion: Partial<UbicacionSeleccionada>) => {
          try {
            // Primero establecemos el departamento si existe
            if (ubicacion.departamento) {
              setSelectedDepartamento(ubicacion.departamento)
              // Buscar el nombre del departamento
              const depData = await ubigeosService.getDepartamentos()
              const dep = depData.find((d) => d.codigo_ubigeo === ubicacion.departamento)
              if (dep) {
                setDepartamentoNombre(dep.txt_nombre)
              }

              // Si hay provincia, cargar provincias y establecer la seleccionada
              if (ubicacion.provincia) {
                const provData = await ubigeosService.getProvinciasByDepartamento(ubicacion.departamento)
                setProvincias(provData)
                setSelectedProvincia(ubicacion.provincia)

                const prov = provData.find((p) => p.codigo_ubigeo === ubicacion.provincia)
                if (prov) {
                  setProvinciaNombre(prov.txt_nombre)
                }

                // Si hay distrito, cargar distritos y establecer el seleccionado
                if (ubicacion.distrito) {
                  const distData = await ubigeosService.getDistritosByProvincia(ubicacion.provincia)
                  setDistritos(distData)
                  setSelectedDistrito(ubicacion.distrito)

                  const dist = distData.find((d) => d.codigo_ubigeo === ubicacion.distrito)
                  if (dist) {
                    setDistritoNombre(dist.txt_nombre)
                  }
                }
              }

              // Notificar cambio después de establecer todo
              setTimeout(notificarCambio, 0)
              return true
            }
            return false
          } catch (error) {
            console.error("Error al establecer ubicación:", error)
            return false
          }
        },
      }),
      [selectedDepartamento, selectedProvincia, selectedDistrito, construirNombreCompleto, notificarCambio],
    )

    // Función para cargar departamentos
    const fetchDepartamentos = useCallback(async () => {
      setLoadingDepartamentos(true)
      setError(null)

      // Cancelar solicitud anterior si existe
      if (abortControllersRef.current.departamentos) {
        abortControllersRef.current.departamentos.abort()
      }

      // Crear nuevo controlador de aborto
      const abortController = new AbortController()
      abortControllersRef.current.departamentos = abortController

      try {
        // Establecer un timeout para la solicitud
        const timeoutId = setTimeout(() => {
          abortController.abort()
          setError("Tiempo de espera agotado al cargar departamentos. Intente nuevamente.")
          setLoadingDepartamentos(false)
        }, 10000) // 10 segundos de timeout

        const data = await ubigeosService.getDepartamentos()
        clearTimeout(timeoutId)

        setDepartamentos(data)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error fetching departamentos:", err)
          setError(`Error al cargar departamentos: ${(err as Error).message}`)
        }
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

        // Cancelar solicitud anterior si existe
        if (abortControllersRef.current.provincias) {
          abortControllersRef.current.provincias.abort()
        }

        // Crear nuevo controlador de aborto
        const abortController = new AbortController()
        abortControllersRef.current.provincias = abortController

        try {
          // Establecer un timeout para la solicitud
          const timeoutId = setTimeout(() => {
            abortController.abort()
            setError("Tiempo de espera agotado al cargar provincias. Intente nuevamente.")
            setLoadingProvincias(false)
          }, 10000) // 10 segundos de timeout

          const data = await ubigeosService.getProvinciasByDepartamento(departamentoId)
          clearTimeout(timeoutId)

          setProvincias(data)

          // Buscar el nombre del departamento seleccionado
          const depSeleccionado = departamentos.find((dep) => dep.codigo_ubigeo === departamentoId)
          if (depSeleccionado) {
            setDepartamentoNombre(depSeleccionado.txt_nombre)
          }

          // Notificar cambio
          setTimeout(notificarCambio, 0)
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            console.error("Error fetching provincias:", err)
            setError(`Error al cargar provincias: ${(err as Error).message}`)
          }
        } finally {
          setLoadingProvincias(false)
        }
      },
      [departamentos, notificarCambio],
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

        // Cancelar solicitud anterior si existe
        if (abortControllersRef.current.distritos) {
          abortControllersRef.current.distritos.abort()
        }

        // Crear nuevo controlador de aborto
        const abortController = new AbortController()
        abortControllersRef.current.distritos = abortController

        try {
          // Establecer un timeout para la solicitud
          const timeoutId = setTimeout(() => {
            abortController.abort()
            setError("Tiempo de espera agotado al cargar distritos. Intente nuevamente.")
            setLoadingDistritos(false)
          }, 10000) // 10 segundos de timeout

          const data = await ubigeosService.getDistritosByProvincia(provinciaId)
          clearTimeout(timeoutId)

          setDistritos(data)

          // Buscar el nombre de la provincia seleccionada
          const provSeleccionada = provincias.find((prov) => prov.codigo_ubigeo === provinciaId)
          if (provSeleccionada) {
            setProvinciaNombre(provSeleccionada.txt_nombre)
          }

          // Notificar cambio
          setTimeout(notificarCambio, 0)
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            console.error("Error fetching distritos:", err)
            setError(`Error al cargar distritos: ${(err as Error).message}`)
          }
        } finally {
          setLoadingDistritos(false)
        }
      },
      [provincias, notificarCambio],
    )

    // Cargar departamentos al montar el componente
    useEffect(() => {
      fetchDepartamentos()

      // Limpiar controladores de aborto al desmontar
      return () => {
        Object.values(abortControllersRef.current).forEach((controller) => {
          controller?.abort()
        })
      }
    }, [fetchDepartamentos])

    // Cargar provincias cuando se selecciona un departamento
    useEffect(() => {
      if (selectedDepartamento) {
        fetchProvincias(selectedDepartamento)
      } else {
        setProvincias([])
        setProvinciaNombre("")
      }
    }, [selectedDepartamento, fetchProvincias])

    // Cargar distritos cuando se selecciona una provincia
    useEffect(() => {
      if (selectedProvincia) {
        fetchDistritos(selectedProvincia)
      } else {
        setDistritos([])
        setDistritoNombre("")
      }
    }, [selectedProvincia, fetchDistritos])

    // Manejar cambios en la selección
    const handleDepartamentoChange = (value: string) => {
      if (value === "reset") {
        setSelectedDepartamento(null)
        setSelectedProvincia(null)
        setSelectedDistrito(null)
        setDepartamentoNombre("")
        setProvinciaNombre("")
        setDistritoNombre("")
        setDistritos([])
        setProvincias([])
        notificarCambio()
        return
      }

      if (value !== selectedDepartamento) {
        setSelectedDepartamento(value)
        // Resetear provincia y distrito solo cuando cambia el departamento
        setSelectedProvincia(null)
        setSelectedDistrito(null)
        setProvinciaNombre("")
        setDistritoNombre("")
        setDistritos([])
      }
    }

    const handleProvinciaChange = (value: string) => {
      if (value === "reset") {
        setSelectedProvincia(null)
        setSelectedDistrito(null)
        setProvinciaNombre("")
        setDistritoNombre("")
        setDistritos([])
        notificarCambio()
        return
      }

      if (value !== selectedProvincia) {
        setSelectedProvincia(value)
        // Resetear distrito solo cuando cambia la provincia
        setSelectedDistrito(null)
        setDistritoNombre("")
      }
    }

    const handleDistritoChange = (value: string) => {
      if (value === "reset") {
        setSelectedDistrito(null)
        setDistritoNombre("")
        notificarCambio()
        return
      }

      setSelectedDistrito(value)

      // Buscar el nombre del distrito seleccionado
      const distSeleccionado = distritos.find((dist) => dist.codigo_ubigeo === value)
      if (distSeleccionado) {
        setDistritoNombre(distSeleccionado.txt_nombre)
      }

      // Notificar cambio
      setTimeout(notificarCambio, 0)
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
      <div className={`space-y-4 ${className}`}>
        {error && (
          <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={handleRetry} className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded">
              Reintentar
            </button>
          </div>
        )}

        <div className="space-y-4">
          {/* Departamento Select */}
          <div className="space-y-2">
            {showLabels && (
              <label htmlFor="departamento" className="text-sm font-medium text-neutral-800">
                Departamento {required && <span className="text-[#9b0000]">*</span>}
              </label>
            )}
            <Select
              value={selectedDepartamento || ""}
              onValueChange={handleDepartamentoChange}
              disabled={loadingDepartamentos || disabled}
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
                      Seleccione un departamento
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
            {showLabels && (
              <label htmlFor="provincia" className="text-sm font-medium text-neutral-800">
                Provincia {required && <span className="text-[#9b0000]">*</span>}
              </label>
            )}
            <Select
              value={selectedProvincia || ""}
              onValueChange={handleProvinciaChange}
              disabled={!selectedDepartamento || loadingProvincias || disabled}
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
                      Seleccione una provincia
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
            {showLabels && (
              <label htmlFor="distrito" className="text-sm font-medium text-neutral-800">
                Distrito {required && <span className="text-[#9b0000]">*</span>}
              </label>
            )}
            <Select
              value={selectedDistrito || ""}
              onValueChange={handleDistritoChange}
              disabled={!selectedProvincia || loadingDistritos || disabled}
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
                      Seleccione un distrito
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
      </div>
    )
  },
)

UbicacionSelector.displayName = "UbicacionSelector"

export default UbicacionSelector
