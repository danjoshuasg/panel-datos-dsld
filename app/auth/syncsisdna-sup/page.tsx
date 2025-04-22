"use client"

import SincronizacionSupervisionesSearch from "@/components/sincronizacion-supervisiones/sincronizacion-supervisiones-search"

export default function SyncSisdnaSupPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 fade-in">
        <h1 className="text-3xl font-bold text-gray-800">Sincronización SISDNA - Supervisiones</h1>
        <p className="text-gray-600 mt-2">
          Gestione la información de sincronización entre las supervisiones realizadas a las DEMUNA y el sistema SISDNA
        </p>
      </div>
      <SincronizacionSupervisionesSearch />
    </div>
  )
}
