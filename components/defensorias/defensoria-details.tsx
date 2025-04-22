"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

interface ResponsableInfo {
  txt_nombres: string
  txt_apellidos: string
  txt_correo: string
  txt_telefono: string
}

interface DefensoriaDetailsProps {
  defensoriaCodigo: string
  direccion: string
  correo: string
  telefono: string
  estado: string
  responsable: ResponsableInfo | null
  onResponsableLoaded?: (responsable: ResponsableInfo | null) => void
}

export default function DefensoriaDetails({
  defensoriaCodigo,
  direccion,
  correo,
  telefono,
  estado,
  responsable,
  onResponsableLoaded,
}: DefensoriaDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="bg-white p-4 rounded-md grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm">
      {/* Información Organizacional */}
      <div className="bg-neutral-50 p-4 rounded-md">
        <h3 className="font-medium text-sm text-[#9b0000] mb-2">Información Organizacional</h3>
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-neutral-700">Dirección:</span>{" "}
            <span className="text-sm text-neutral-600">{direccion || "No disponible"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-700">Correo:</span>{" "}
            <span className="text-sm text-neutral-600">{correo || "No disponible"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-700">Teléfono:</span>{" "}
            <span className="text-sm text-neutral-600">{telefono || "No disponible"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-neutral-700">Estado:</span>{" "}
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                estado === "Acreditada"
                  ? "bg-green-100 text-green-800"
                  : estado === "No Acreditada"
                    ? "bg-red-100 text-red-800"
                    : estado === "No Operativa"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-neutral-100 text-neutral-800"
              }`}
            >
              {estado}
            </span>
          </div>
        </div>
      </div>

      {/* Información del Responsable */}
      <div className="bg-neutral-50 p-4 rounded-md">
        <h3 className="font-medium text-sm text-[#9b0000] mb-2">Información del Responsable</h3>
        {loading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#9b0000]" />
            <span className="text-sm text-neutral-700">Cargando información...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : responsable ? (
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-neutral-700">Nombres:</span>{" "}
              <span className="text-sm text-neutral-600">{responsable.txt_nombres || "No disponible"}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-700">Apellidos:</span>{" "}
              <span className="text-sm text-neutral-600">{responsable.txt_apellidos || "No disponible"}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-700">Teléfono:</span>{" "}
              <span className="text-sm text-neutral-600">{responsable.txt_telefono || "No disponible"}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-neutral-700">Correo:</span>{" "}
              <span className="text-sm text-neutral-600">{responsable.txt_correo || "No disponible"}</span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-500">No se encontró información del responsable</div>
        )}
      </div>
    </div>
  )
}
