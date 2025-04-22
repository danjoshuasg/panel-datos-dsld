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
} from "lucide-react"
import DefensoriaDetails from "@/components/defensorias/defensoria-details"
import type { Defensoria, ResponsableInfo } from "@/services/defensorias-service"
import React from "react"

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
  // Estado para filas expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Función para toggle row expansion
  const toggleRowExpansion = (codigo: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [codigo]: !prev[codigo],
    }))
  }

  // Función para formatear el número de teléfono para WhatsApp
  const formatWhatsAppNumber = (phone: string | undefined) => {
    if (!phone) return ""

    // Eliminar todos los caracteres no numéricos
    const digits = phone.replace(/\D/g, "")

    // Si el número ya tiene el código de país, devolverlo tal cual
    if (digits.startsWith("51") && digits.length >= 11) {
      return digits
    }

    // Si el número tiene 9 dígitos (formato peruano), añadir el código de país
    if (digits.length === 9) {
      return "51" + digits
    }

    // En otros casos, devolver los dígitos tal cual
    return digits
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
              <TableHead className="text-[#9b0000] font-medium">Código DNA</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Nombre DEMUNA</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Departamento</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Provincia</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Distrito</TableHead>
              <TableHead className="text-[#9b0000] font-medium">Estado</TableHead>
              <TableHead className="text-right text-[#9b0000] font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defensorias.map((defensoria, index) => (
              <React.Fragment key={`fragment-${defensoria.codigo_dna}`}>
                <TableRow className={`${index % 2 === 0 ? "bg-white" : "bg-neutral-50"} hover:bg-transparent`}>
                  <TableCell className="border-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRowExpansion(defensoria.codigo_dna)}
                      aria-label={expandedRows[defensoria.codigo_dna] ? "Colapsar detalles" : "Expandir detalles"}
                      className="text-neutral-500 hover:text-[#9b0000]"
                    >
                      {expandedRows[defensoria.codigo_dna] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium text-neutral-800 border-0">{defensoria.codigo_dna}</TableCell>
                  <TableCell className="text-neutral-700 border-0">{defensoria.txt_nombre}</TableCell>
                  <TableCell className="text-neutral-700 border-0">{defensoria.departamento}</TableCell>
                  <TableCell className="text-neutral-700 border-0">{defensoria.provincia}</TableCell>
                  <TableCell className="text-neutral-700 border-0">{defensoria.distrito}</TableCell>
                  <TableCell className="border-0">
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
                  </TableCell>
                  <TableCell className="text-right border-0">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Ver más"
                        className="bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700 hover:text-[#9b0000]"
                      >
                        <FileSearch className="h-4 w-4" />
                      </Button>

                      {/* Los botones de editar y eliminar han sido removidos */}

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
                            href={`https://wa.me/${formatWhatsAppNumber(
                              responsables[defensoria.codigo_dna]?.txt_telefono,
                            )}`}
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
                  </TableCell>
                </TableRow>
                {expandedRows[defensoria.codigo_dna] && (
                  <TableRow key={`details-${defensoria.codigo_dna}`} className="bg-neutral-50 hover:bg-transparent">
                    <TableCell colSpan={8} className="p-0 border-0">
                      <div className="px-4 py-2">
                        <DefensoriaDetails
                          defensoriaCodigo={defensoria.codigo_dna}
                          direccion={defensoria.txt_direccion}
                          correo={defensoria.txt_correo}
                          telefono={defensoria.txt_telefono}
                          estado={defensoria.estado_acreditacion}
                          responsable={responsables[defensoria.codigo_dna] || null}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
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
