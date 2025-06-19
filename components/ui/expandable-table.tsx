"use client"

import type React from "react"

import { Fragment, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"

interface Column<T> {
  header: string
  accessor: keyof T | ((item: T) => React.ReactNode)
}

export interface ExpandableTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField: keyof T
  renderExpanded: (item: T) => React.ReactNode
  actions?: (item: T) => React.ReactNode
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  onPageChange: (page: number) => void
}

export function ExpandableTable<T>({
  data,
  columns,
  keyField,
  renderExpanded,
  actions,
  currentPage,
  totalPages,
  totalRecords,
  recordsPerPage,
  onPageChange,
}: ExpandableTableProps<T>) {
  // Estado para filas expandidas
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  // Función para toggle row expansion
  const toggleRowExpansion = (key: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Función para obtener el valor de una celda
  const getCellValue = (item: T, accessor: keyof T | ((item: T) => React.ReactNode)) => {
    if (typeof accessor === "function") {
      return accessor(item)
    }
    return item[accessor]
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-neutral-200 bg-neutral-50 hover:bg-transparent">
              <TableHead className="w-10"></TableHead>
              {columns.map((column, index) => (
                <TableHead key={index} className="text-[#9b0000] font-medium">
                  {column.header}
                </TableHead>
              ))}
              {actions && <TableHead className="text-right text-[#9b0000] font-medium">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, rowIndex) => {
              const key = String(item[keyField])
              return (
                <Fragment key={key}>
                  <TableRow
                    key={key}
                    className={`${rowIndex % 2 === 0 ? "bg-white" : "bg-neutral-50"} hover:bg-transparent`}
                  >
                    <TableCell className="border-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRowExpansion(key)}
                        aria-label={expandedRows[key] ? "Colapsar detalles" : "Expandir detalles"}
                        className="text-neutral-500 hover:text-[#9b0000]"
                      >
                        {expandedRows[key] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                      {columns.map((column, colIndex) => (
                        <TableCell key={colIndex} className="text-neutral-700 border-0">
                          {String(getCellValue(item, column.accessor) ?? '')}
                        </TableCell>
                      ))}
                    {actions && <TableCell className="text-right border-0">{actions(item)}</TableCell>}
                  </TableRow>
                  {expandedRows[key] && (
                    <TableRow key={`expanded-${key}`} className="bg-neutral-50 hover:bg-transparent">
                      <TableCell colSpan={columns.length + (actions ? 2 : 1)} className="p-0 border-0">
                        <div className="px-4 py-2">{renderExpanded(item)}</div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        recordsPerPage={recordsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  )
}
