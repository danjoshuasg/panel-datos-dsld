"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SincronizacionDetailsProps {
  defensoriaCodigo: string
  direccion: string
  correo: string
  telefono: string
  estadoSisdna: string
  camposDesactualizados: string | null
}

export default function SincronizacionDetails({
  defensoriaCodigo,
  direccion,
  correo,
  telefono,
  estadoSisdna,
  camposDesactualizados,
}: SincronizacionDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Procesar los campos desactualizados
  const camposArray = camposDesactualizados ? camposDesactualizados.split(",").map((campo) => campo.trim()) : []

  // Función para obtener el nombre amigable de un campo
  const getNombreCampo = (campo: string): string => {
    const mapaCampos: Record<string, string> = {
      TXT_DIRECCION: "Dirección",
      TXT_TELEFONO: "Teléfono",
      TXT_CORREO: "Correo electrónico",
      TXT_NOMBRES: "Nombres del responsable",
      TXT_APELLIDOS: "Apellidos del responsable",
      NID_ESTADO: "Estado de acreditación",
      TXT_TIPO: "Tipo de DEMUNA",
    }

    return mapaCampos[campo] || campo
  }

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      {/* Información de Campos Desactualizados */}
      <div className="bg-neutral-50 p-4 rounded-md w-full">
        <h3 className="font-medium text-sm text-[#9b0000] mb-2">Campos Desactualizados</h3>
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#9b0000]" />
            <span className="text-sm text-neutral-700">Cargando información...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : estadoSisdna === "NO ACTUALIZADA" && camposArray.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-neutral-600 mb-2">
              Los siguientes campos requieren actualización en el sistema SISDNA:
            </p>
            <div className="flex flex-wrap gap-2">
              {camposArray.map((campo, index) => (
                <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {getNombreCampo(campo)}
                </Badge>
              ))}
            </div>
          </div>
        ) : estadoSisdna === "NO ACTUALIZADA" ? (
          <div className="text-sm text-neutral-600">
            Se requiere actualización en el sistema SISDNA, pero no se especifican los campos.
          </div>
        ) : (
          <div className="text-sm text-green-600">
            Todos los campos están actualizados correctamente en el sistema SISDNA.
          </div>
        )}
      </div>
    </div>
  )
}
