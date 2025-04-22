"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, RefreshCw } from "lucide-react"
import SincronizacionDetails from "@/components/sincronizacion/sincronizacion-details"
import type { DefensoriaSincronizacion } from "@/services/sincronizacion-service"

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
  // Estado para filas expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Función para toggle row expansion
  const toggleRowExpansion = (codigo: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [codigo]: !prev[codigo],
    }))
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

  // URL del sistema SISDNA
  const URL_SISDNA_DNA = "https://sisdna.mimp.gob.pe/sisdna-web/faces/dna/listado.xhtml#"

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
              <TableHead className="text-[#9b0000] font-medium">Estado SISDNA</TableHead>
              <TableHead className="text-right text-[#9b0000] font-medium">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {defensorias.map((defensoria, index) => (
              <>
                <TableRow
                  key={`row-${defensoria.codigo_dna}`}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-neutral-50"} hover:bg-transparent`}
                >
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
                        defensoria.estado_sisdna === "ACTUALIZADA"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {defensoria.estado_sisdna}
                    </span>
                  </TableCell>
                  <TableCell className="text-right border-0">
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
                  </TableCell>
                </TableRow>
                {expandedRows[defensoria.codigo_dna] && (
                  <TableRow key={`details-${defensoria.codigo_dna}`} className="bg-neutral-50 hover:bg-transparent">
                    <TableCell colSpan={8} className="p-0 border-0">
                      <div className="px-4 py-2">
                        <SincronizacionDetails
                          defensoriaCodigo={defensoria.codigo_dna}
                          direccion={defensoria.txt_direccion}
                          correo={defensoria.txt_correo}
                          telefono={defensoria.txt_telefono}
                          estadoSisdna={defensoria.estado_sisdna}
                          camposDesactualizados={defensoria.txt_campos_desactualizados}
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
