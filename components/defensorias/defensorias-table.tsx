"use client"

import { ExpandableTable } from "@/components/ui/expandable-table"
import DefensoriaDetails from "@/components/defensorias/defensoria-details"
import type { Defensoria, ResponsableInfo } from "@/services/defensorias-service"
import { Button } from "@/components/ui/button"
import { FileSearch } from "lucide-react"

interface DefensoriasTableProps {
  defensorias: Defensoria[]
  responsables: Record<string, ResponsableInfo | null>
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  onPageChange: (page: number) => void
  isPublic?: boolean
}

export default function DefensoriasTable({
  defensorias,
  responsables,
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
  isPublic = true,
}: DefensoriasTableProps) {
  // Función para formatear el número de teléfono para WhatsApp
  const formatWhatsAppNumber = (phone: string | undefined) => {
    if (!phone) return ""
    const digits = phone.replace(/\D/g, "")
    if (digits.startsWith("51") && digits.length >= 11) return digits
    if (digits.length === 9) return "51" + digits
    return digits
  }

  const columns = [
    { header: "Código DNA", accessor: "codigo_dna" },
    { header: "Nombre DEMUNA", accessor: "txt_nombre" },
    { header: "Departamento", accessor: "departamento" },
    { header: "Provincia", accessor: "provincia" },
    { header: "Distrito", accessor: "distrito" },
    {
      header: "Estado",
      accessor: (defensoria: Defensoria) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            defensoria.estado_acreditacion === "Acreditada"
              ? "bg-green-100 text-green-800"
              : defensoria.estado_acreditacion === "No Acreditada"
                ? "bg-red-100 text-red-800"
                : defensoria.estado_acreditacion === "No Operativa"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-neutral-100 text-neutral-800"
          }`}
        >
          {defensoria.estado_acreditacion}
        </span>
      ),
    },
  ]

  const renderActions = (defensoria: Defensoria) => (
    <div className="flex justify-end space-x-2">
      <Button
        variant="outline"
        size="icon"
        title="Ver más"
        className="bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700 hover:text-[#9b0000]"
      >
        <FileSearch className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        title="Contactar por WhatsApp"
        className={
          responsables[defensoria.codigo_dna]?.txt_telefono
            ? "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-green-600 hover:text-green-700"
            : "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed"
        }
        disabled={!responsables[defensoria.codigo_dna]?.txt_telefono}
        asChild={!!responsables[defensoria.codigo_dna]?.txt_telefono}
      >
        {responsables[defensoria.codigo_dna]?.txt_telefono ? (
          <a
            href={`https://wa.me/${formatWhatsAppNumber(responsables[defensoria.codigo_dna]?.txt_telefono)}`}
            target="_blank"
            rel="noopener noreferrer"
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
              className="h-4 w-4"
            >
              <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
              <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
              <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
              <path d="M9.5 13.5c.5 1 1.5 1 2 1s1.5 0 2-1" />
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
            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
            <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
            <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
            <path d="M9.5 13.5c.5 1 1.5 1 2 1s1.5 0 2-1" />
          </svg>
        )}
      </Button>
    </div>
  )

  const renderExpanded = (defensoria: Defensoria) => (
    <DefensoriaDetails
      defensoriaCodigo={defensoria.codigo_dna}
      direccion={defensoria.txt_direccion}
      correo={defensoria.txt_correo}
      telefono={defensoria.txt_telefono}
      estado={defensoria.estado_acreditacion}
      responsable={responsables[defensoria.codigo_dna] || null}
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
