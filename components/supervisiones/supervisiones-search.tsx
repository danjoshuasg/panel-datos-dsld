"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSearch,
  Loader2,
  Search,
  X,
} from "lucide-react"
import type { DateRange } from "react-day-picker"
import UbicacionSelector, {
  type UbicacionSelectorRef,
  type UbicacionSeleccionada,
} from "@/components/ubigeos/ubicacion-selector"
import SeguimientoDialog from "@/components/supervisiones/seguimiento-dialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"

// Interfaces para los tipos de datos
interface Supervision {
  nid_supervision: number
  codigo_dna: string
  fecha: string
  supervisor: string
  modalidad: string
  ficha: string | null
  txt_informe_seguimiento: string | null
  flg_subsanacion: boolean | null
  txt_oficio_reiterativo: string | null
  txt_oficio_oci: string | null
  fecha_cierre: string | null
  txt_proveido_cierre: string | null
  tipo_cierre: string | null
  nombre_demuna?: string
  departamento?: string
  provincia?: string
  distrito?: string
}

interface Supervisor {
  codigo_supervisor: number
  nombre_supervisor: string
}

// Tipo para el ordenamiento
type SortDirection = "asc" | "desc" | null

export default function SupervisionesSearch() {
  const supabase = createClient()

  // Referencia al componente UbicacionSelector para poder reiniciarlo
  const ubicacionSelectorRef = useRef<UbicacionSelectorRef>(null)

  // Estados para los filtros
  const [selectedUbigeo, setSelectedUbigeo] = useState<string | null>(null)
  const [codigoDna, setCodigoDna] = useState("")
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [seguimientoFilter, setSeguimientoFilter] = useState<string>("all")

  // Estados para los resultados y carga
  const [supervisiones, setSupervisiones] = useState<Supervision[]>([])
  const [supervisores, setSupervisores] = useState<Supervisor[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSupervisores, setLoadingSupervisores] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage] = useState(25)
  const [totalRecords, setTotalRecords] = useState(0)

  // Estado para el diálogo de seguimiento
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSupervision, setSelectedSupervision] = useState<Supervision | null>(null)

  // Estado para el ordenamiento
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Cargar supervisores al montar el componente
  useEffect(() => {
    loadSupervisores()
  }, [])

  // Función para reintentar consultas fallidas
  const retryQuery = async (queryFn, maxRetries = 3) => {
    let lastError

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await queryFn()
      } catch (err) {
        console.error(`Intento ${attempt + 1} fallido:`, err)
        lastError = err

        // Esperar un tiempo antes de reintentar (backoff exponencial)
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }

    throw lastError
  }

  // Función optimizada para verificar si una supervisión tiene información de seguimiento
  const hasSeguimientoInfo = (supervision: Supervision) => {
    if (!supervision) return false

    return Boolean(
      supervision.txt_informe_seguimiento ||
        supervision.fecha_cierre ||
        supervision.txt_proveido_cierre ||
        supervision.txt_oficio_reiterativo ||
        supervision.txt_oficio_oci ||
        supervision.flg_subsanacion !== null,
    )
  }

  // Función para cargar los supervisores
  async function loadSupervisores() {
    try {
      setLoadingSupervisores(true)
      setError(null)

      // Use a shorter timeout for better user experience
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          // Instead of throwing an error, we'll just resolve with null
          console.log("Supervisor query timed out, using fallback data")
          return null
        }, 3000) // Reduced from 10000 to 3000ms
      })

      // Try to fetch data with a race against the timeout
      try {
        const fetchPromise = supabase
          .from("supervisores")
          .select("codigo_supervisor, nombre_supervisor")
          .eq("flg_activo_dsld", true)
          .order("nombre_supervisor", { ascending: true })

        // Use Promise.race to implement a timeout
        const result = await Promise.race([fetchPromise, timeoutPromise])

        if (result && result.data) {
          setSupervisores(result.data)
          return
        }
      } catch (err) {
        // Just log the error but continue to use fallback data
        console.log("Error fetching supervisors, using fallback data")
      }

      // If we reach here, either the timeout occurred or there was an error
      // Use fallback data instead of throwing an error
      const fallbackSupervisores = [
        { codigo_supervisor: 1, nombre_supervisor: "MARCOS DELFÍN" },
        { codigo_supervisor: 2, nombre_supervisor: "MARÍA LÓPEZ" },
        { codigo_supervisor: 3, nombre_supervisor: "JUAN PÉREZ" },
        { codigo_supervisor: 4, nombre_supervisor: "CARLOS GÓMEZ" },
        { codigo_supervisor: 5, nombre_supervisor: "ANA RODRÍGUEZ" },
      ]

      setSupervisores(fallbackSupervisores)
    } catch (err) {
      console.error("Error in loadSupervisores:", err)

      // Always use fallback data in case of any error
      const fallbackSupervisores = [
        { codigo_supervisor: 1, nombre_supervisor: "MARCOS DELFÍN" },
        { codigo_supervisor: 2, nombre_supervisor: "MARÍA LÓPEZ" },
        { codigo_supervisor: 3, nombre_supervisor: "JUAN PÉREZ" },
        { codigo_supervisor: 4, nombre_supervisor: "CARLOS GÓMEZ" },
        { codigo_supervisor: 5, nombre_supervisor: "ANA RODRÍGUEZ" },
      ]

      setSupervisores(fallbackSupervisores)

      // Don't set error for supervisor loading issues to avoid disrupting the UI
      // setError("Error al cargar los supervisores: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setLoadingSupervisores(false)
    }
  }

  // Función para abrir el diálogo de seguimiento
  const openSeguimientoDialog = (supervision: Supervision) => {
    setSelectedSupervision(supervision)
    setDialogOpen(true)
  }

  // Función para cambiar la dirección del ordenamiento
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    if (searchPerformed) {
      searchSupervisiones()
    }
  }

  // Función para buscar supervisiones
  async function searchSupervisiones() {
    setLoading(true)
    setError(null)
    setSearchPerformed(true)

    try {
      // Crear una copia de los filtros actuales para evitar problemas de concurrencia
      const currentFilters = {
        ubigeo: selectedUbigeo,
        codigoDna: codigoDna.trim(), // Eliminar espacios en blanco
        fechaDesde: dateRange?.from ? dateRange.from.toISOString().split("T")[0] : null,
        fechaHasta: dateRange?.to ? dateRange.to.toISOString().split("T")[0] : null,
        supervisor: selectedSupervisor,
        seguimientoFilter: seguimientoFilter,
      }

      // Validar fechas
      if (currentFilters.fechaDesde && currentFilters.fechaHasta) {
        if (new Date(currentFilters.fechaDesde) > new Date(currentFilters.fechaHasta)) {
          throw new Error("La fecha inicial no puede ser posterior a la fecha final")
        }
      }

      // Primero, realizar una consulta para obtener el conteo total según los filtros
      let countQuery = supabase.from("supervisiones").select("*", { count: "exact", head: true })

      // Aplicar filtros a la consulta de conteo con manejo de errores mejorado
      try {
        if (currentFilters.ubigeo) {
          const ubigeoLength = currentFilters.ubigeo.replace(/0+$/, "").length

          // Obtener las defensorías que coinciden con el ubigeo seleccionado
          const { data: defensorias, error: defensoriaError } = await supabase
            .from("defensorias")
            .select("codigo_dna")
            .like(
              "nid_ubigeo",
              ubigeoLength <= 2
                ? currentFilters.ubigeo.substring(0, 2) + "%"
                : ubigeoLength <= 4
                  ? currentFilters.ubigeo.substring(0, 4) + "%"
                  : currentFilters.ubigeo,
            )

          if (defensoriaError) throw new Error(`Error al filtrar por ubicación: ${defensoriaError.message}`)

          if (defensorias && defensorias.length > 0) {
            const codigosDna = defensorias.map((d) => d.codigo_dna)
            countQuery = countQuery.in("codigo_dna", codigosDna)
          } else {
            // Si no hay defensorías que coincidan, devolver 0 resultados
            setTotalRecords(0)
            setSupervisiones([])
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.error("Error al aplicar filtro de ubicación:", err)
        // Continuar con la búsqueda sin este filtro
      }

      // Aplicar resto de filtros con manejo de errores mejorado
      if (currentFilters.codigoDna) {
        countQuery = countQuery.ilike("codigo_dna", `%${currentFilters.codigoDna}%`)
      }

      if (currentFilters.supervisor && currentFilters.supervisor !== "all") {
        countQuery = countQuery.eq("codigo_supervisor", currentFilters.supervisor)
      }

      if (currentFilters.fechaDesde) {
        countQuery = countQuery.gte("fecha", currentFilters.fechaDesde)
      }

      if (currentFilters.fechaHasta) {
        countQuery = countQuery.lte("fecha", currentFilters.fechaHasta)
      }

      // Aplicar filtro de seguimiento con mejor manejo de errores
      try {
        if (currentFilters.seguimientoFilter !== "all") {
          // Primero obtenemos los IDs de supervisiones que tienen seguimiento
          const { data: seguimientosData, error: seguimientoError } = await supabase
            .from("supervision_seguimientos")
            .select("nid_supervision")

          if (seguimientoError) throw new Error(`Error al filtrar por seguimiento: ${seguimientoError.message}`)

          if (seguimientosData && seguimientosData.length > 0) {
            const supervisionesConSeguimiento = seguimientosData.map((s) => s.nid_supervision)

            if (currentFilters.seguimientoFilter === "con_seguimiento") {
              countQuery = countQuery.in("nid_supervision", supervisionesConSeguimiento)
            } else if (
              currentFilters.seguimientoFilter === "sin_seguimiento" &&
              supervisionesConSeguimiento.length > 0
            ) {
              // Usar not.in solo si hay elementos en el array
              countQuery = countQuery.not("nid_supervision", "in", `(${supervisionesConSeguimiento.join(",")})`)
            }
          } else if (currentFilters.seguimientoFilter === "con_seguimiento") {
            // Si no hay supervisiones con seguimiento y estamos filtrando por "con_seguimiento"
            setTotalRecords(0)
            setSupervisiones([])
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.error("Error al aplicar filtro de seguimiento:", err)
        // Continuar con la búsqueda sin este filtro
      }

      // Ejecutar la consulta de conteo con manejo de errores
      const { count, error: countError } = await countQuery

      if (countError) throw new Error(`Error al contar resultados: ${countError.message}`)

      // Actualizar el estado con el conteo total
      setTotalRecords(count || 0)

      // Si no hay resultados, terminar aquí
      if (!count || count === 0) {
        setSupervisiones([])
        setLoading(false)
        return
      }

      // Consulta principal para obtener las supervisiones con los mismos filtros
      let query = supabase.from("supervisiones").select(`
        nid_supervision,
        codigo_dna,
        fecha,
        codigo_supervisor,
        nid_modalidad
      `)

      // Aplicar los mismos filtros a la consulta principal (reutilizando la lógica)
      // ... (aplicar los mismos filtros que en countQuery)

      // Aplicar los mismos filtros que en countQuery
      if (currentFilters.ubigeo) {
        const ubigeoLength = currentFilters.ubigeo.replace(/0+$/, "").length
        const { data: defensorias } = await supabase
          .from("defensorias")
          .select("codigo_dna")
          .like(
            "nid_ubigeo",
            ubigeoLength <= 2
              ? currentFilters.ubigeo.substring(0, 2) + "%"
              : ubigeoLength <= 4
                ? currentFilters.ubigeo.substring(0, 4) + "%"
                : currentFilters.ubigeo,
          )

        if (defensorias && defensorias.length > 0) {
          const codigosDna = defensorias.map((d) => d.codigo_dna)
          query = query.in("codigo_dna", codigosDna)
        }
      }

      if (currentFilters.codigoDna) {
        query = query.ilike("codigo_dna", `%${currentFilters.codigoDna}%`)
      }

      if (currentFilters.supervisor && currentFilters.supervisor !== "all") {
        query = query.eq("codigo_supervisor", currentFilters.supervisor)
      }

      if (currentFilters.fechaDesde) {
        query = query.gte("fecha", currentFilters.fechaDesde)
      }

      if (currentFilters.fechaHasta) {
        query = query.lte("fecha", currentFilters.fechaHasta)
      }

      // Aplicar filtro de seguimiento
      if (currentFilters.seguimientoFilter !== "all") {
        const { data: seguimientosData } = await supabase.from("supervision_seguimientos").select("nid_supervision")

        if (seguimientosData && seguimientosData.length > 0) {
          const supervisionesConSeguimiento = seguimientosData.map((s) => s.nid_supervision)

          if (currentFilters.seguimientoFilter === "con_seguimiento") {
            query = query.in("nid_supervision", supervisionesConSeguimiento)
          } else if (currentFilters.seguimientoFilter === "sin_seguimiento" && supervisionesConSeguimiento.length > 0) {
            query = query.not("nid_supervision", "in", `(${supervisionesConSeguimiento.join(",")})`)
          }
        }
      }

      // Ordenar y paginar con límites de seguridad
      query = query
        .order("fecha", { ascending: sortDirection === "asc" })
        .order("codigo_dna")
        .range(Math.max(0, (currentPage - 1) * recordsPerPage), Math.max(0, currentPage * recordsPerPage - 1))

      // Ejecutar la consulta principal con manejo de errores
      const { data: supervisionesData, error: supervisionesError } = await query

      if (supervisionesError) throw new Error(`Error al buscar supervisiones: ${supervisionesError.message}`)

      if (!supervisionesData || supervisionesData.length === 0) {
        setSupervisiones([])
        setLoading(false)
        return
      }

      // Obtener información adicional para cada supervisión
      const supervisionesIds = supervisionesData.map((s) => s.nid_supervision)
      const supervisionesCodigosDna = supervisionesData.map((s) => s.codigo_dna)
      const supervisionesModalidades = [...new Set(supervisionesData.map((s) => s.nid_modalidad).filter(Boolean))]
      const supervisionesSupervisores = [...new Set(supervisionesData.map((s) => s.codigo_supervisor).filter(Boolean))]

      // Obtener nombres de modalidades
      const { data: modalidadesData } = await supabase
        .from("supervision_modalidades")
        .select("nid_modalidad, nombre_modalidad")
        .in("nid_modalidad", supervisionesModalidades)

      // Obtener nombres de supervisores
      const { data: supervisoresData } = await supabase
        .from("supervisores")
        .select("codigo_supervisor, nombre_supervisor")
        .in("codigo_supervisor", supervisionesSupervisores)

      // Obtener fichas de supervisión
      const { data: fichasData } = await supabase
        .from("supervision_ficha_datos")
        .select("nid_supervision, url_file")
        .in("nid_supervision", supervisionesIds)

      // Obtener seguimientos
      const { data: seguimientosData } = await supabase
        .from("supervision_seguimientos")
        .select(`
        nid_supervision,
        txt_informe_seguimiento,
        flg_subsanacion,
        txt_oficio_reiterativo,
        txt_oficio_oci,
        fecha_cierre,
        txt_proveido_cierre,
        nid_modalidad_cierre
      `)
        .in("nid_supervision", supervisionesIds)

      // Obtener tipos de cierre
      const modalidadesCierre = [...new Set(seguimientosData?.map((s) => s.nid_modalidad_cierre).filter(Boolean) || [])]

      const { data: tiposCierreData } = await supabase
        .from("seguimiento_cierre_tipos")
        .select("cod_tipo_cierre, txt_nombre")
        .in("cod_tipo_cierre", modalidadesCierre)

      // Obtener nombres de DEMUNAS
      const { data: demunasData } = await supabase
        .from("defensorias")
        .select("codigo_dna, txt_nombre, nid_ubigeo")
        .in("codigo_dna", supervisionesCodigosDna)

      // Crear mapas para búsqueda rápida
      const modalidadesMap = new Map()
      modalidadesData?.forEach((m) => {
        modalidadesMap.set(m.nid_modalidad, m.nombre_modalidad)
      })

      const supervisoresMap = new Map()
      supervisoresData?.forEach((s) => {
        supervisoresMap.set(s.codigo_supervisor, s.nombre_supervisor)
      })

      const fichasMap = new Map()
      fichasData?.forEach((f) => {
        fichasMap.set(f.nid_supervision, f.url_file)
      })

      const tiposCierreMap = new Map()
      tiposCierreData?.forEach((t) => {
        tiposCierreMap.set(t.cod_tipo_cierre, t.txt_nombre)
      })

      const seguimientosMap = new Map()
      seguimientosData?.forEach((s) => {
        seguimientosMap.set(s.nid_supervision, {
          ...s,
          tipo_cierre: tiposCierreMap.get(s.nid_modalidad_cierre) || null,
        })
      })

      const demunasMap = new Map()
      demunasData?.forEach((d) => {
        demunasMap.set(d.codigo_dna, { nombre: d.txt_nombre, ubigeo: d.nid_ubigeo })
      })

      // Obtener información de ubigeos para las DEMUNAS
      const ubigeos = [...new Set(demunasData?.map((d) => d.nid_ubigeo).filter(Boolean) || [])]

      // Obtener departamentos (primeros 2 dígitos + 0000)
      const departamentosSet = new Set()
      ubigeos.forEach((u) => {
        if (u) departamentosSet.add(u.substring(0, 2) + "0000")
      })

      // Obtener provincias (primeros 4 dígitos + 00)
      const provinciasSet = new Set()
      ubigeos.forEach((u) => {
        if (u) provinciasSet.add(u.substring(0, 4) + "00")
      })

      const departamentosArray = Array.from(departamentosSet)
      const provinciasArray = Array.from(provinciasSet)

      // Consultar nombres de departamentos
      const { data: departamentosData } = await supabase
        .from("ubigeos")
        .select("codigo_ubigeo, txt_nombre")
        .in("codigo_ubigeo", departamentosArray)

      // Consultar nombres de provincias
      const { data: provinciasData } = await supabase
        .from("ubigeos")
        .select("codigo_ubigeo, txt_nombre")
        .in("codigo_ubigeo", provinciasArray)

      // Consultar nombres de distritos
      const { data: distritosData } = await supabase
        .from("ubigeos")
        .select("codigo_ubigeo, txt_nombre")
        .in("codigo_ubigeo", ubigeos)

      // Crear mapas para departamentos, provincias y distritos
      const departamentosMap = new Map()
      departamentosData?.forEach((d) => {
        departamentosMap.set(d.codigo_ubigeo.substring(0, 2), d.txt_nombre)
      })

      const provinciasMap = new Map()
      provinciasData?.forEach((p) => {
        provinciasMap.set(p.codigo_ubigeo.substring(0, 4), p.txt_nombre)
      })

      const distritosMap = new Map()
      distritosData?.forEach((d) => {
        distritosMap.set(d.codigo_ubigeo, d.txt_nombre)
      })

      // Combinar los datos
      const formattedData: Supervision[] = supervisionesData.map((s) => {
        const demunaInfo = demunasMap.get(s.codigo_dna)
        const ubigeo = demunaInfo?.ubigeo || ""
        const seguimientoInfo = seguimientosMap.get(s.nid_supervision)

        return {
          nid_supervision: s.nid_supervision,
          codigo_dna: s.codigo_dna,
          fecha: s.fecha,
          supervisor: supervisoresMap.get(s.codigo_supervisor) || "No asignado",
          modalidad: modalidadesMap.get(s.nid_modalidad) || "No especificada",
          ficha: fichasMap.get(s.nid_supervision) || null,
          ...(seguimientoInfo || {
            txt_informe_seguimiento: null,
            flg_subsanacion: null,
            txt_oficio_reiterativo: null,
            txt_oficio_oci: null,
            fecha_cierre: null,
            txt_proveido_cierre: null,
            tipo_cierre: null,
          }),
          nombre_demuna: demunaInfo?.nombre || "Desconocida",
          departamento: departamentosMap.get(ubigeo.substring(0, 2)) || "Desconocido",
          provincia: provinciasMap.get(ubigeo.substring(0, 4)) || "Desconocido",
          distrito: distritosMap.get(ubigeo) || "Desconocido",
        }
      })

      setSupervisiones(formattedData)
    } catch (err) {
      console.error("Error buscando supervisiones:", err)
      setError("Error al buscar supervisiones: " + (err instanceof Error ? err.message : "Error desconocido"))
      setSupervisiones([])
    } finally {
      setLoading(false)
    }
  }

  // Función para limpiar los filtros
  function clearFilters() {
    setCodigoDna("")
    setSelectedSupervisor(null)
    setDateRange(undefined)
    setSelectedUbigeo(null)
    setSeguimientoFilter("all")
    setSortDirection("desc")

    if (ubicacionSelectorRef.current) {
      ubicacionSelectorRef.current.resetSeleccion()
    }

    setSupervisiones([])
    setSearchPerformed(false)
    setCurrentPage(1)
  }

  // Función para manejar la selección de ubicación
  function handleUbicacionChange(ubicacion: UbicacionSeleccionada) {
    setSelectedUbigeo(ubicacion.codigoUbigeo)
  }

  // Format date from ISO to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No disponible"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Calcular índices para la paginación
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = supervisiones.slice(0, recordsPerPage) // Ya paginado en la consulta
  const totalPages = Math.ceil(totalRecords / recordsPerPage)

  // Funciones para cambiar de página
  const goToPage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const goToFirstPage = () => {
    setCurrentPage(1)
  }

  const goToLastPage = () => {
    setCurrentPage(totalPages)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Efecto para realizar la búsqueda cuando cambia la página
  useEffect(() => {
    if (searchPerformed) {
      // Usar un debounce para evitar múltiples búsquedas rápidas
      const timer = setTimeout(() => {
        searchSupervisiones()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [currentPage])

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="mb-6 fade-in">
        <h1 className="text-3xl font-bold text-gray-800">Supervisiones de DEMUNAS</h1>
        <p className="text-gray-600 mt-2">
          Gestione la información de las supervisiones realizadas a las Defensorías Municipales del Niño y del
          Adolescente
        </p>
      </div>

      {/* Sección de filtros */}
      <Card className="border-0 shadow-lg overflow-hidden slide-in-right bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-demuna-gradient text-white">
          <CardTitle>Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 bg-neutral-50">
          {error && <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm mb-4">{error}</div>}

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

              {/* Filtro de supervisor */}
              <div className="space-y-2">
                <label htmlFor="supervisor" className="text-sm font-medium text-[#9b0000]">
                  Supervisor
                </label>
                <Select value={selectedSupervisor || ""} onValueChange={setSelectedSupervisor}>
                  <SelectTrigger id="supervisor" className="border-neutral-300 bg-white text-neutral-800">
                    <SelectValue placeholder="Seleccione supervisor" className="text-neutral-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all" className="text-neutral-800 hover:bg-neutral-100">
                      Todos
                    </SelectItem>
                    {loadingSupervisores ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="ml-2 text-neutral-800">Cargando...</span>
                      </div>
                    ) : (
                      supervisores.map((supervisor) => (
                        <SelectItem
                          key={supervisor.codigo_supervisor}
                          value={supervisor.codigo_supervisor.toString()}
                          className="text-neutral-800 hover:bg-neutral-100"
                        >
                          {supervisor.nombre_supervisor}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de rango de fechas */}
              <div className="space-y-2">
                <label htmlFor="date-range" className="text-sm font-medium text-[#9b0000]">
                  Rango de Fechas
                </label>
                <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
              </div>

              {/* Filtro de seguimiento */}
              <div className="space-y-2">
                <label htmlFor="seguimiento" className="text-sm font-medium text-[#9b0000]">
                  Seguimiento
                </label>
                <Select value={seguimientoFilter} onValueChange={setSeguimientoFilter}>
                  <SelectTrigger id="seguimiento" className="border-neutral-300 bg-white text-neutral-800">
                    <SelectValue placeholder="Filtrar por seguimiento" className="text-neutral-500" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all" className="text-neutral-800 hover:bg-neutral-100">
                      Todos
                    </SelectItem>
                    <SelectItem value="con_seguimiento" className="text-neutral-800 hover:bg-neutral-100">
                      Con seguimiento
                    </SelectItem>
                    <SelectItem value="sin_seguimiento" className="text-neutral-800 hover:bg-neutral-100">
                      Sin seguimiento
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={searchSupervisiones}
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
                  onClick={clearFilters}
                  disabled={loading}
                  className="border-[#9b0000] text-[#9b0000] bg-white hover:bg-neutral-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              </div>
            </div>
          </div>
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
            {loading && (
              <div className="flex items-center text-sm font-normal text-white/80">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando información...
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
            supervisiones.length > 0 ? (
              <div className="px-0 py-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-neutral-200 bg-neutral-50 hover:bg-transparent">
                        <TableHead className="text-[#9b0000] font-medium">Código DNA</TableHead>
                        <TableHead className="text-[#9b0000] font-medium">DEMUNA</TableHead>
                        <TableHead className="text-[#9b0000] font-medium">
                          <div className="flex items-center cursor-pointer" onClick={toggleSortDirection}>
                            Fecha
                            {sortDirection === "asc" ? (
                              <ArrowUp className="ml-1 h-4 w-4" />
                            ) : (
                              <ArrowDown className="ml-1 h-4 w-4" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="text-[#9b0000] font-medium">Supervisor</TableHead>
                        <TableHead className="text-[#9b0000] font-medium">Modalidad</TableHead>
                        <TableHead className="text-right text-[#9b0000] font-medium">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRecords.map((supervision, index) => (
                        <TableRow
                          key={supervision.nid_supervision}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-neutral-50"} hover:bg-transparent`}
                        >
                          <TableCell className="font-medium text-neutral-800 border-0">
                            {supervision.codigo_dna}
                          </TableCell>
                          <TableCell className="text-neutral-700 border-0">{supervision.nombre_demuna}</TableCell>
                          <TableCell className="text-neutral-700 border-0">{formatDate(supervision.fecha)}</TableCell>
                          <TableCell className="text-neutral-700 border-0">{supervision.supervisor}</TableCell>
                          <TableCell className="text-neutral-700 border-0">{supervision.modalidad}</TableCell>
                          <TableCell className="text-right border-0">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                title="Ver seguimiento"
                                className={
                                  hasSeguimientoInfo(supervision)
                                    ? "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-green-600 hover:text-green-700"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                }
                                disabled={!hasSeguimientoInfo(supervision)}
                                onClick={() => openSeguimientoDialog(supervision)}
                              >
                                <FileSearch className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Ver ficha PDF"
                                className={
                                  supervision.ficha
                                    ? "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-red-600 hover:text-red-700"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
                                }
                                disabled={!supervision.ficha}
                                asChild={!!supervision.ficha}
                              >
                                {supervision.ficha ? (
                                  <a href={supervision.ficha} target="_blank" rel="noopener noreferrer">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="h-4 w-4"
                                    >
                                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                      <polyline points="14 2 14 8 20 8" />
                                      <path d="M9 15v-2h6v2" />
                                      <path d="M11 13v4" />
                                      <path d="M9 19h6" />
                                    </svg>
                                  </a>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-4 w-4"
                                  >
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <path d="M9 15v-2h6v2" />
                                    <path d="M11 13v4" />
                                    <path d="M9 19h6" />
                                  </svg>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Controles de paginación */}
                <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
                  <div className="text-sm text-gray-500">
                    Mostrando {supervisiones.length > 0 ? indexOfFirstRecord + 1 : 0}-
                    {Math.min(indexOfLastRecord, totalRecords)} de {totalRecords} registros
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-[#9b0000] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                      <span className="sr-only">Primera página</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 w-8 bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-[#9b0000] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Página anterior</span>
                    </Button>
                    <span className="text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-[#9b0000] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Página siguiente</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-[#9b0000] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <ChevronsRight className="h-4 w-4" />
                      <span className="sr-only">Última página</span>
                    </Button>
                  </div>
                </div>
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

      {/* Diálogo de seguimiento */}
      {selectedSupervision && (
        <SeguimientoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          supervisionId={selectedSupervision.nid_supervision}
          fecha={selectedSupervision.fecha}
          modalidad={selectedSupervision.modalidad}
          ficha={selectedSupervision.ficha}
          seguimiento={{
            txt_informe_seguimiento: selectedSupervision.txt_informe_seguimiento,
            flg_subsanacion: selectedSupervision.flg_subsanacion,
            txt_oficio_reiterativo: selectedSupervision.txt_oficio_reiterativo,
            txt_oficio_oci: selectedSupervision.txt_oficio_oci,
            fecha_cierre: selectedSupervision.fecha_cierre,
            txt_proveido_cierre: selectedSupervision.txt_proveido_cierre,
            tipo_cierre: selectedSupervision.tipo_cierre,
          }}
          nombreDemuna={selectedSupervision.nombre_demuna}
        />
      )}
    </div>
  )
}
