"use client"

import { ExpandableTable } from "@/components/ui/expandable-table"
import SincronizacionDetails from "@/components/sincronizacion/sincronizacion-details"
import type { DefensoriaSincronizacion } from "@/services/sincronizacion-service"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface SincronizacionTableProps {
  defensorias: DefensoriaSincronizacion[]
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  onPageChange: (page: number) => void
}

export default function SincronizacionTable({
  defensorias,
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
}: SincronizacionTableProps) {
  // URL del sistema SISDNA
  const URL_SISDNA_DNA = "https://sisdna.mimp.gob.pe/sisdna-web/faces/dna/listado.xhtml#"

  const columns = [
    { header: "Código DNA", accessor: "codigo_dna" },
    { header: "Nombre DEMUNA", accessor: "txt_nombre" },
    { header: "Departamento", accessor: "departamento" },
    { header: "Provincia", accessor: "provincia" },
    { header: "Distrito", accessor: "distrito" },
    {
      header: "Estado SISDNA",
      accessor: (defensoria: DefensoriaSincronizacion) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            defensoria.estado_sisdna === "ACTUALIZADA" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {defensoria.estado_sisdna}
        </span>
      ),
    },
  ]

  const renderActions = (defensoria: DefensoriaSincronizacion) => (
    <div className="flex justify-end space-x-2">
      <Button
        variant="outline"
        size="icon"
        title="Actualizar en SISDNA"
        className={`bg-neutral-100 hover:bg-neutral-200 border-neutral-200 ${
          defensoria.estado_sisdna === "ACTUALIZADA"
            ? "text-gray-400 cursor-not-allowed"
            : "text-blue-600 hover:text-blue-700"
        }`}
        disabled={defensoria.estado_sisdna === "ACTUALIZADA"}
        asChild={defensoria.estado_sisdna !== "ACTUALIZADA"}
      >
        {defensoria.estado_sisdna !== "ACTUALIZADA" ? (
          <a href={URL_SISDNA_DNA} target="_blank" rel="noopener noreferrer">
            <RefreshCw className="h-4 w-4" />
          </a>
        ) : (
          <span>
            <RefreshCw className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  )

  const renderExpanded = (defensoria: DefensoriaSincronizacion) => (
    <SincronizacionDetails
      defensoriaCodigo={defensoria.codigo_dna}
      direccion={defensoria.txt_direccion}
      correo={defensoria.txt_correo}
      telefono={defensoria.txt_telefono}
      estadoSisdna={defensoria.estado_sisdna}
      camposDesactualizados={defensoria.txt_campos_desactualizados}
    />
  )

  return (
    <ExpandableTable
      data={defensorias}
      columns={columns}
      keyField="codigo_dna"
      renderExpanded={renderExpanded}
      actions={renderActions}
      currentPage={currentPage}
      totalPages={totalPages}
      totalRecords={totalRecords}
      recordsPerPage={recordsPerPage}
      onPageChange={onPageChange}
    />
  )
}
