import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#9b0000] to-[#6b0000] flex flex-col items-center justify-center text-white">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-white"></div>
          </div>
        </div>
        <h2 className="text-xl font-medium mt-2">Cargando Directorio DEMUNA</h2>
        <p className="text-white/80 text-sm">Por favor espere un momento...</p>
      </div>
    </div>
  )
}
