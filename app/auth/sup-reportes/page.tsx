export default function SupReportesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 fade-in">Reportes & estadísticas de las supervisiones</h1>
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg w-full slide-up">
          <p className="text-gray-600 mb-6">
            Esta sección está en desarrollo. Próximamente podrá acceder a reportes estadísticos detallados sobre las
            supervisiones realizadas a las Defensorías Municipales del Niño y Adolescente.
          </p>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#9b0000] w-1/4 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Progreso: 25%</p>
        </div>
      </div>
    </div>
  )
}
