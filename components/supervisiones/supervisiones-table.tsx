"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  FileSearch,
  Edit,
  Trash2,
} from "lucide-react"
import SupervisionDetails from "@/components/supervisiones/supervision-details"
import type { Supervision } from "@/services/supervisiones-service"

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
  // Estado para filas expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Función para toggle row expansion
  const toggleRowExpansion = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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

  // Calcular índices para la paginación
  const indexOfFirstRecord = (currentPage - 1) * recordsPerPage + 1
  const indexOfLastRecord = Math.min(currentPage * recordsPerPage, totalRecords)

  // Funciones para cambiar de página
  const goToPage = (pageNumber: number) => {
    onPageChange(pageNumber)
  }

  const goToFirstPage = () => {
    onPageChange(1)
  }

  const goToLastPage = () => {
    onPageChange(totalPages)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-200 bg-neutral-50 hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              <TableHead className="text-[#9b0000] font-medium">ID</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Código DNA</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Nombre DEMUNA</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Fecha</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Supervisor</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Modalidad</TableHead>
              <TableHead className="text-right text-[#9b0000] font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supervisiones.map((supervision, index) => (
              <>
                <TableRow
                  key={`row-${supervision.nid_supervision}`}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-neutral-50"} hover:bg-transparent`}
                >
                  <TableCell className="border-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRowExpansion(supervision.nid_supervision)}
                      aria-label={expandedRows[supervision.nid_supervision] ? "Colapsar detalles" : "Expandir detalles"}
                      className="text-neutral-500 hover:text-[#9b0000]"
                    >
                      {expandedRows[supervision.nid_supervision] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-neutral-800 border-0">{supervision.nid_supervision}</TableCell>
                  <TableCell className="text-neutral-700 border-0">{supervision.codigo_dna}</TableCell>
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
                            : "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-gray-400 cursor-not-allowed"
                        }
                        disabled={!hasSeguimientoInfo(supervision)}
                      >
                        <FileSearch className="h-4 w-4" />
                      </Button>

                      {!isPublic && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Editar"
                            className="bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Eliminar"
                            className="bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}

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
                {expandedRows[supervision.nid_supervision] && (
                  <TableRow
                    key={`details-${supervision.nid_supervision}`}
                    className="bg-neutral-50 hover:bg-transparent"
                  >
                    <TableCell colSpan={8} className="p-0 border-0">
                      <div className="px-4 py-2">
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
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
        <div className="text-sm text-gray-500">
          Mostrando {totalRecords > 0 ? indexOfFirstRecord : 0}-{indexOfLastRecord} de {totalRecords} registros
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
  )
}
