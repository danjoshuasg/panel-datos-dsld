"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Función para alternar la expansión de una fila
  const toggleRowExpansion = (id: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
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

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-100">
              <TableHead className="w-[100px]">Código DNA</TableHead>
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead className="w-[200px]">Defensoría</TableHead>
              <TableHead className="w-[150px]">Ubicación</TableHead>
              <TableHead className="w-[150px]">Supervisor</TableHead>
              <TableHead className="w-[120px]">Modalidad</TableHead>
              <TableHead className="w-[150px]">Estado SISDNA</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supervisiones.map((supervision) => (
              <>
                <TableRow key={supervision.nid_supervision} className="hover:bg-neutral-50">
                  <TableCell className="font-medium">{supervision.codigo_dna}</TableCell>
                  <TableCell>{formatDate(supervision.fecha)}</TableCell>
                  <TableCell>{supervision.nombre_demuna || "No especificada"}</TableCell>
                  <TableCell>{supervision.ubicacion || "No especificada"}</TableCell>
                  <TableCell>{supervision.supervisor}</TableCell>
                  <TableCell>{supervision.modalidad}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(supervision.estado_sisdna)}>
                      {supervision.estado_sisdna || "No especificado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {/* Botón para expandir/colapsar detalles si hay campos desactualizados */}
                      {supervision.txt_campos_desactualizados &&
                        (supervision.estado_sisdna === "NO ACTUALIZADA" ||
                          supervision.estado_sisdna === "FALTANTE") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRowExpansion(supervision.nid_supervision)}
                            title="Ver campos desactualizados"
                          >
                            {expandedRows[supervision.nid_supervision] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      {/* Botón para ir al SISDNA */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(URL_SISDNA_SUPERVISIONES, "_blank")}
                        title="Ir al SISDNA"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {/* Fila expandible para mostrar campos desactualizados */}
                {expandedRows[supervision.nid_supervision] &&
                  supervision.txt_campos_desactualizados &&
                  (supervision.estado_sisdna === "NO ACTUALIZADA" || supervision.estado_sisdna === "FALTANTE") && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-neutral-50 p-4">
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
                      </TableCell>
                    </TableRow>
                  )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-between px-2">
        <div className="text-sm text-neutral-600">
          Mostrando {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)} a{" "}
          {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
