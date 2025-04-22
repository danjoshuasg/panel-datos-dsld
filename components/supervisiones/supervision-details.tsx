"use client"

import { useState } from "react"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

// Actualizar la interfaz SupervisionSeguimiento para incluir tipo_cierre
interface SupervisionSeguimiento {
  txt_informe_seguimiento: string | null
  flg_subsanacion: boolean
  txt_oficio_reiterativo: string | null
  txt_oficio_oci: string | null
  fecha_cierre: string | null
  txt_proveido_cierre: string | null
  tipo_cierre: string | null
}

interface SupervisionDetailsProps {
  supervisionId: number
  fecha: string
  modalidad: string
  ficha: string | null
  seguimiento: SupervisionSeguimiento | null
}

// Actualizar el componente SupervisionDetails para mostrar la información solicitada
export default function SupervisionDetails({
  supervisionId,
  fecha,
  modalidad,
  ficha,
  seguimiento,
}: SupervisionDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      {/* Información de Seguimiento */}
      <div>
        <h3 className="font-medium text-sm text-gray-500 mb-2">Información de Seguimiento</h3>
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">Cargando información...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : seguimiento &&
          (seguimiento.txt_informe_seguimiento || seguimiento.fecha_cierre || seguimiento.txt_proveido_cierre) ? (
          <div className="space-y-2">
            {seguimiento.txt_informe_seguimiento && (
              <div>
                <span className="text-sm font-medium">Informe de Seguimiento:</span>{" "}
                <span className="text-sm">{seguimiento.txt_informe_seguimiento}</span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium">Subsanación:</span>{" "}
              <span className="flex items-center">
                {seguimiento.flg_subsanacion ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Subsanado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">No subsanado</span>
                  </>
                )}
              </span>
            </div>
            {seguimiento.txt_oficio_reiterativo && (
              <div>
                <span className="text-sm font-medium">Oficio Reiterativo:</span>{" "}
                <span className="text-sm">{seguimiento.txt_oficio_reiterativo}</span>
              </div>
            )}
            {seguimiento.txt_oficio_oci && (
              <div>
                <span className="text-sm font-medium">Oficio OCI:</span>{" "}
                <span className="text-sm">{seguimiento.txt_oficio_oci}</span>
              </div>
            )}
            {seguimiento.fecha_cierre && (
              <div>
                <span className="text-sm font-medium">Fecha de Cierre:</span>{" "}
                <span className="text-sm">{formatDate(seguimiento.fecha_cierre)}</span>
              </div>
            )}
            {seguimiento.txt_proveido_cierre && (
              <div>
                <span className="text-sm font-medium">Documento de Cierre:</span>{" "}
                <span className="text-sm">{seguimiento.txt_proveido_cierre}</span>
              </div>
            )}
            {seguimiento.tipo_cierre && (
              <div>
                <span className="text-sm font-medium">Modalidad de Cierre:</span>{" "}
                <span className="text-sm">{seguimiento.tipo_cierre}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No se encontró información de seguimiento para esta supervisión</div>
        )}
      </div>
    </div>
  )
}
