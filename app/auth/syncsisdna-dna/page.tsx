"use client"

import SincronizacionSearch from "@/components/sincronizacion/sincronizacion-search"

export default function SyncSisdnaDnaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 fade-in">
        <h1 className="text-3xl font-bold text-gray-800">Sincronización SISDNA - Defensorías</h1>
        <p className="text-gray-600 mt-2">
          Gestione la información de sincronización entre las Defensorías Municipales del Niño y del Adolescente y el
          sistema SISDNA
        </p>
      </div>
      <SincronizacionSearch />
    </div>
  )
}
