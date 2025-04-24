"use client"

import { ExpandableTable } from "@/components/ui/expandable-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { SupervisionSincronizacion } from "@/services/sincronizacion-supervisiones-service"

interface SincronizacionSupervisionesTableProps {
  supervisiones: SupervisionSincronizacion[]
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  onPageChange: (page: number) => void
}

export default function SincronizacionSupervisionesTable({
  supervisiones,
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
}: SincronizacionSupervisionesTableProps) {
  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTUALIZADA":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "NO ACTUALIZADA":
      case "FALTANTE":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Función para dividir los campos desactualizados en un array
  const splitOutdatedFields = (fields: string | null) => {
    if (!fields) return []
    return fields.split(",").map((field) => field.trim())
  }

  // URL del SISDNA para supervisiones
  const URL_SISDNA_SUPERVISIONES = "https://sisdna.mimp.gob.pe/sisdna-web/faces/supervision/listado.xhtml#"

  const columns = [
    { header: "Código DNA", accessor: "codigo_dna", className: "w-[100px]" },
    {
      header: "Fecha",
      accessor: (supervision: SupervisionSincronizacion) => formatDate(supervision.fecha),
      className: "w-[120px]",
    },
    { header: "Defensoría", accessor: "nombre_demuna", className: "w-[200px]" },
    { header: "Ubicación", accessor: "ubicacion", className: "w-[150px]" },
    { header: "Supervisor", accessor: "supervisor", className: "w-[150px]" },
    { header: "Modalidad", accessor: "modalidad", className: "w-[120px]" },
    {
      header: "Estado SISDNA",
      accessor: (supervision: SupervisionSincronizacion) => (
        <Badge className={getStatusColor(supervision.estado_sisdna)}>
          {supervision.estado_sisdna || "No especificado"}
        </Badge>
      ),
      className: "w-[150px]",
    },
  ]

  const renderActions = (supervision: SupervisionSincronizacion) => (
    <div className="flex justify-end space-x-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.open(URL_SISDNA_SUPERVISIONES, "_blank")}
        title="Ir al SISDNA"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  )

  const renderExpanded = (supervision: SupervisionSincronizacion) => {
    if (
      !supervision.txt_campos_desactualizados ||
      (supervision.estado_sisdna !== "NO ACTUALIZADA" && supervision.estado_sisdna !== "FALTANTE")
    ) {
      return null
    }

    return (
      <div className="rounded-md border border-neutral-200 p-3">
        <h4 className="mb-2 text-sm font-medium text-neutral-700">Campos desactualizados:</h4>
        <div className="flex flex-wrap gap-2">
          {splitOutdatedFields(supervision.txt_campos_desactualizados).map((field, index) => (
            <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {field}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  return (
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
      headerClassName="bg-neutral-100"
    />
  )
}
