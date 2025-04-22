"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SupervisionSincronizacion } from "@/services/sincronizacion-supervisiones-service"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface SincronizacionSupervisionDetailsProps {
  supervision: SupervisionSincronizacion
}

export default function SincronizacionSupervisionDetails({ supervision }: SincronizacionSupervisionDetailsProps) {
  // Función para formatear la fecha
  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString)
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }

  // Función para obtener el color del estado
  function getEstadoColor(estado: string) {
    switch (estado.toUpperCase()) {
      case "ACTUALIZADA":
        return "bg-green-100 text-green-800 border-green-200"
      case "NO ACTUALIZADA":
        return "bg-red-100 text-red-800 border-red-200"
      case "FALTANTE":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Función para renderizar los campos desactualizados como badges
  function renderCamposDesactualizados(campos: string | null) {
    if (!campos) return <span className="text-gray-500">No hay campos desactualizados</span>

    // Dividir los campos por comas y eliminar espacios en blanco
    const camposList = campos.split(",").map((campo) => campo.trim())

    return (
      <div className="flex flex-wrap gap-2">
        {camposList.map((campo, index) => (
          <Badge key={index} variant="outline" className="bg-red-50 text-red-800 border-red-200">
            {campo}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="bg-neutral-100">
        <CardTitle className="text-lg">Detalles de la Supervisión</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Código DNA</h3>
            <p className="text-neutral-800">{supervision.codigo_dna}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Nombre DEMUNA</h3>
            <p className="text-neutral-800">{supervision.nombre_demuna || "No especificado"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Ubicación</h3>
            <p className="text-neutral-800">
              {supervision.departamento && supervision.provincia && supervision.distrito
                ? `${supervision.departamento} / ${supervision.provincia} / ${supervision.distrito}`
                : "No especificado"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Fecha</h3>
            <p className="text-neutral-800">{formatDate(supervision.fecha)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Supervisor</h3>
            <p className="text-neutral-800">{supervision.supervisor}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Modalidad</h3>
            <p className="text-neutral-800">{supervision.modalidad}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-500">Estado SISDNA</h3>
            <Badge variant="outline" className={getEstadoColor(supervision.estado_sisdna)}>
              {supervision.estado_sisdna}
            </Badge>
          </div>
        </div>

        {(supervision.estado_sisdna === "NO ACTUALIZADA" || supervision.estado_sisdna === "FALTANTE") && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">Campos desactualizados:</h3>
            {renderCamposDesactualizados(supervision.txt_campos_desactualizados)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
