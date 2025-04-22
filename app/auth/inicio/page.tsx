"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, FileText } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 fade-in">
        <h1 className="text-3xl font-bold text-gray-800">Bienvenido(a) al Panel de datos de las Defensorías</h1>
        <p className="text-gray-600 mt-2">{user?.name || user?.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] slide-up">
          <CardHeader className="bg-[#9b0000]/10 rounded-t-lg">
            <CardTitle className="flex items-center text-[#9b0000]">
              <Shield className="mr-2 h-5 w-5" />
              Defensorías
            </CardTitle>
            <CardDescription>Gestión de datos de las Defensorías Municipales del Niño y Adolescente</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-600">
              Acceda al directorio completo de las DEMUNA a nivel nacional, con información detallada sobre ubicación,
              responsables y estado de acreditación.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-[#9b0000] hover:bg-[#6b0000]">
              <Link href="/auth/dna">Ir a Defensorías</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card
          className="border border-gray-200 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] slide-up"
          style={{ animationDelay: "100ms" }}
        >
          <CardHeader className="bg-[#9b0000]/10 rounded-t-lg">
            <CardTitle className="flex items-center text-[#9b0000]">
              <FileText className="mr-2 h-5 w-5" />
              Supervisiones
            </CardTitle>
            <CardDescription>Seguimiento de supervisiones realizadas a las DEMUNA</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-gray-600">
              Consulte el registro de supervisiones realizadas, incluyendo fechas, responsables, hallazgos y
              recomendaciones para cada DEMUNA.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-[#9b0000] hover:bg-[#6b0000]">
              <Link href="/auth/supervisiones">Ir a Supervisiones</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
