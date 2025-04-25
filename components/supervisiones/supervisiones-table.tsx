"use client"

import { ExpandableTable } from "@/components/ui/expandable-table"
import SupervisionDetails from "@/components/supervisiones/supervision-details"
import type { Supervision } from "@/services/supervisiones-service"
import { Button } from "@/components/ui/button"

interface SupervisionesTableProps {
  supervisiones: Supervision[]
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  onPageChange: (page: number) => void
  isPublic?: boolean
}

export default function SupervisionesTable({
  supervisiones,
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  isPublic = false,
}: SupervisionesTableProps) {
  // Modificar la función formatDate para manejar correctamente la zona horaria
  const formatDate = (dateString: string) => {
    // Crear la fecha asegurando que se interprete como UTC y luego se convierta a local
    const date = new Date(dateString + "T00:00:00Z")
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC", // Forzar interpretación UTC
    })
  }

  // Verificar si una supervisión tiene información de seguimiento
  const hasSeguimientoInfo = (supervision: Supervision) => {
    return (
      supervision.doc_seguimiento ||
      supervision.fecha_cierre ||
      supervision.doc_cierre ||
      supervision.doc_reiterativo ||
      supervision.doc_oci ||
      supervision.subsanacion !== null
    )
  }

  // Obtener el estado de seguimiento para mostrar en la tabla
  const getSeguimientoStatus = (supervision: Supervision) => {
    if (supervision.fecha_cierre) {
      return <span className="text-green-600 font-medium">Cerrado</span>
    } else if (supervision.subsanacion === true) {
      return <span className="text-blue-600 font-medium">Subsanado</span>
    } else if (supervision.subsanacion === false) {
      return <span className="text-orange-600 font-medium">No Subsanado</span>
    } else if (supervision.doc_seguimiento) {
      return <span className="text-purple-600 font-medium">En Seguimiento</span>
    } else {
      return <span className="text-gray-400">Sin Seguimiento</span>
    }
  }

  const columns = [
    { header: "Código DNA", accessor: "codigo_dna", className: "text-[#9b0000] font-medium" },
    { header: "Nombre DEMUNA", accessor: "nombre_demuna", className: "text-[#9b0000] font-medium" },
    {
      header: "Fecha",
      accessor: (supervision: Supervision) => formatDate(supervision.fecha),
      className: "text-[#9b0000] font-medium",
    },
    { header: "Supervisor", accessor: "supervisor", className: "text-[#9b0000] font-medium" },
    { header: "Modalidad", accessor: "modalidad", className: "text-[#9b0000] font-medium" },
    {
      header: "Seguimiento",
      accessor: (supervision: Supervision) => getSeguimientoStatus(supervision),
      className: "text-[#9b0000] font-medium",
    },
  ]

  const renderActions = (supervision: Supervision) => (
    <div className="flex justify-end space-x-2">
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
  )

  const renderExpanded = (supervision: Supervision) => (
    <SupervisionDetails
      nid_supervision={supervision.nid_supervision}
      fecha={supervision.fecha}
      modalidad={supervision.modalidad}
      supervisor={supervision.supervisor}
      ficha={supervision.ficha}
      doc_seguimiento={supervision.doc_seguimiento}
      subsanacion={supervision.subsanacion}
      doc_reiterativo={supervision.doc_reiterativo}
      doc_oci={supervision.doc_oci}
      fecha_cierre={supervision.fecha_cierre}
      doc_cierre={supervision.doc_cierre}
      tipo_cierre={supervision.tipo_cierre}
    />
  )

  return (
    <div className="space-y-4">
      <ExpandableTable
        data={supervisiones}
        columns={columns}
        keyField="nid_supervision"
        renderExpanded={renderExpanded}
        actions={renderActions}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  )
}
