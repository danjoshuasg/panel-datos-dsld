import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Supervisiones</h1>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-[#9b0000]" />
        <p className="mt-4 text-lg text-neutral-600">Cargando información...</p>
      </div>
    </div>
  )
}
