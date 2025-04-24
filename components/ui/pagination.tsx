"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, totalRecords, recordsPerPage, onPageChange }: PaginationProps) {
  // Ensure all values are valid numbers
  const safeCurrentPage = Number.isFinite(currentPage) ? currentPage : 1
  const safeRecordsPerPage = Number.isFinite(recordsPerPage) ? recordsPerPage : 10
  const safeTotalRecords = Number.isFinite(totalRecords) ? totalRecords : 0
  const safeTotalPages = Number.isFinite(totalPages) ? totalPages : 1

  // Calcular índices para la paginación con valores seguros
  const indexOfFirstRecord = safeTotalRecords > 0 ? (safeCurrentPage - 1) * safeRecordsPerPage + 1 : 0
  const indexOfLastRecord = Math.min(safeCurrentPage * safeRecordsPerPage, safeTotalRecords)

  // Update the functions to use safe values
  const goToFirstPage = () => onPageChange(1)
  const goToLastPage = () => onPageChange(safeTotalPages)
  const goToPreviousPage = () => safeCurrentPage > 1 && onPageChange(safeCurrentPage - 1)
  const goToNextPage = () => safeCurrentPage < safeTotalPages && onPageChange(safeCurrentPage + 1)

  // Also update the display text to use safe values
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
      <div className="text-sm text-gray-500">
        Mostrando {safeTotalRecords > 0 ? indexOfFirstRecord : 0}-{indexOfLastRecord} de {safeTotalRecords} registros
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToFirstPage}
          disabled={safeCurrentPage === 1}
          className="h-8 w-8 bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-[#9b0000] disabled:bg-gray-50 disabled:text-gray-400"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">Primera página</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousPage}
          disabled={safeCurrentPage === 1}
          className="h-8 w-8 bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-[#9b0000] disabled:bg-gray-50 disabled:text-gray-400"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Página anterior</span>
        </Button>
        <span className="text-sm text-gray-700">
          Página {safeCurrentPage} de {safeTotalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextPage}
          disabled={safeCurrentPage === safeTotalPages}
          className="h-8 w-8 bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-[#9b0000] disabled:bg-gray-50 disabled:text-gray-400"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Página siguiente</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goToLastPage}
          disabled={safeCurrentPage === safeTotalPages}
          className="h-8 w-8 bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700 hover:text-[#9b0000] disabled:bg-gray-50 disabled:text-gray-400"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Última página</span>
        </Button>
      </div>
    </div>
  )
}
