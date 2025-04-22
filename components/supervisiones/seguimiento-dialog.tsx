"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, XCircle } from "lucide-react"

interface SupervisionSeguimiento {
  txt_informe_seguimiento: string | null
  flg_subsanacion: boolean | null
  txt_oficio_reiterativo: string | null
  txt_oficio_oci: string | null
  fecha_cierre: string | null
  txt_proveido_cierre: string | null
  tipo_cierre: string | null
}

interface SeguimientoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supervisionId: number
  fecha: string
  modalidad: string
  ficha: string | null
  seguimiento: SupervisionSeguimiento | null
  nombreDemuna: string
}

export default function SeguimientoDialog({
  open,
  onOpenChange,
  supervisionId,
  fecha,
  modalidad,
  ficha,
  seguimiento,
  nombreDemuna,
}: SeguimientoDialogProps) {
  // Format date from ISO to readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Dato no encontrado"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Función para mostrar valor o "Dato no encontrado"
  const showValueOrDefault = (value: string | null | undefined) => {
    return value ? value : <span className="text-gray-400">Dato no encontrado</span>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Información de Seguimiento - {nombreDemuna}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Información básica simplificada: solo fecha y ficha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha</p>
              <p className="text-sm">{formatDate(fecha)}</p>
            </div>
            {ficha && (
              <div className="flex flex-col sm:items-end">
                <p className="text-sm font-medium text-gray-500">Ficha</p>
                <a
                  href={ficha}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-600 hover:underline flex items-center"
                >
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
                    className="h-4 w-4 mr-1"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M9 15v-2h6v2" />
                    <path d="M11 13v4" />
                    <path d="M9 19h6" />
                  </svg>
                  Ver ficha PDF
                </a>
              </div>
            )}
          </div>

          {/* Información de Seguimiento - formato optimizado */}
          <div className="space-y-3">
            {/* 1. Informe de Seguimiento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <p className="text-sm font-medium text-gray-500">1. Informe de Seguimiento</p>
              <p className="text-sm sm:col-span-2">{showValueOrDefault(seguimiento?.txt_informe_seguimiento)}</p>
            </div>

            {/* 2. Subsanación */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <p className="text-sm font-medium text-gray-500">2. Subsanación</p>
              <div className="sm:col-span-2">
                {seguimiento?.flg_subsanacion === true ? (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Subsanado</span>
                  </div>
                ) : seguimiento?.flg_subsanacion === false ? (
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">No subsanado</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Dato no encontrado</span>
                )}
              </div>
            </div>

            {/* 3. Oficio Reiterativo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <p className="text-sm font-medium text-gray-500">3. Oficio Reiterativo</p>
              <p className="text-sm sm:col-span-2">{showValueOrDefault(seguimiento?.txt_oficio_reiterativo)}</p>
            </div>

            {/* 4. Oficio OCI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <p className="text-sm font-medium text-gray-500">4. Oficio OCI</p>
              <p className="text-sm sm:col-span-2">{showValueOrDefault(seguimiento?.txt_oficio_oci)}</p>
            </div>

            {/* 5. Fecha de Cierre */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <p className="text-sm font-medium text-gray-500">5. Fecha de Cierre</p>
              <p className="text-sm sm:col-span-2">
                {seguimiento?.fecha_cierre ? (
                  formatDate(seguimiento.fecha_cierre)
                ) : (
                  <span className="text-gray-400">Dato no encontrado</span>
                )}
              </p>
            </div>

            {/* 6. Proveído de Cierre */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <p className="text-sm font-medium text-gray-500">6. Proveído de Cierre</p>
              <p className="text-sm sm:col-span-2">{showValueOrDefault(seguimiento?.txt_proveido_cierre)}</p>
            </div>

            {/* 7. Tipo de Cierre */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <p className="text-sm font-medium text-gray-500">7. Tipo de Cierre</p>
              <p className="text-sm sm:col-span-2">{showValueOrDefault(seguimiento?.tipo_cierre)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
