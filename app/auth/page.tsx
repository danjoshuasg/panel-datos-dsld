"use client"

import { useState, useRef } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { RecoverForm } from "@/components/auth/recover-form"
import { Shield, Users, BookOpen, Phone, FileSearch, ExternalLink, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

type AuthView = "login" | "register" | "recover"

export default function AuthPage() {
  const router = useRouter()
  const [view, setView] = useState<AuthView>("login")
  const containerRef = useRef<HTMLDivElement>(null)
  const { user, loading } = useAuth()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push("/auth/inicio")
    }
  }, [user, loading, router])

  // If still loading, show nothing to prevent flash
  if (loading) return null

  const switchView = (newView: AuthView) => {
    console.log("Switching view to:", newView)
    setView(newView)
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Panel informativo - Lado izquierdo */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-b from-[#9b0000] to-[#6b0000] text-white p-8 flex-col justify-between fade-in">
        <div className="w-full max-w-3xl mx-auto lg:max-w-4xl xl:max-w-5xl">
          <div className="mb-8">
            <p className="mt-2 text-gray-200 lg:text-lg">Accede a:</p>

            <button
              className="mt-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 rounded-lg w-full border border-white/20"
              onClick={() => router.push("/public/dna")}
            >
              <FileSearch className="h-5 w-5" />
              <span className="font-medium">Directorio Público DEMUNA</span>
              <ArrowRight className="h-4 w-4 ml-auto opacity-70" />
            </button>
          </div>

          <div className="space-y-6 lg:space-y-8">
            <div className="flex items-start space-x-4 slide-up">
              <div className="bg-white/10 p-3 rounded-full shrink-0">
                <Shield className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <div>
                <h3 className="font-medium text-lg lg:text-xl">Monitoreo de DEMUNA</h3>
                <p className="text-gray-200 mt-1 lg:text-lg">
                  Accede a datos estadísticos y reportes sobre las Defensorías Municipales del Niño y Adolescente a
                  nivel nacional.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 slide-up" style={{ animationDelay: "100ms" }}>
              <div className="bg-white/10 p-3 rounded-full shrink-0">
                <Users className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <div>
                <h3 className="font-medium text-lg lg:text-xl">Análisis de Datos</h3>
                <p className="text-gray-200 mt-1 lg:text-lg">
                  Visualiza indicadores de gestión, cobertura y atención de las DEMUNA en diferentes regiones del país.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 slide-up" style={{ animationDelay: "200ms" }}>
              <div className="bg-white/10 p-3 rounded-full shrink-0">
                <BookOpen className="h-6 w-6 lg:h-7 lg:w-7" />
              </div>
              <div>
                <h3 className="font-medium text-lg lg:text-xl">Reportes y Documentación</h3>
                <p className="text-gray-200 mt-1 lg:text-lg">
                  Accede a informes, documentos técnicos y recursos para el análisis de la situación de las DEMUNA.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-6 w-full">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Contacto: (01) 626-1600</span>
          </div>
          <p className="mt-2 text-sm text-gray-200">© 2025 Dirección de Sistemas Locales y Defensorías - MIMP</p>
        </div>
      </div>

      {/* Formularios de autenticación - Lado derecho */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-8 bg-white">
        {/* Directorio Público DEMUNA button for mobile */}
        <div className="w-full max-w-md mb-4 md:hidden">
          <button
            className="flex items-center gap-2 bg-[#9b0000] hover:bg-[#6b0000] transition-colors px-4 py-3 rounded-lg w-full text-white"
            onClick={() => router.push("/public/dna")}
          >
            <FileSearch className="h-5 w-5" />
            <span className="font-medium">Directorio Público DEMUNA</span>
            <ExternalLink className="h-4 w-4 ml-auto opacity-70" />
          </button>
        </div>
        <div ref={containerRef} className="w-full max-w-md">
          {view === "login" && <LoginForm onSwitchView={switchView} />}
          {view === "register" && <RegisterForm onSwitchView={switchView} />}
          {view === "recover" && <RecoverForm onSwitchView={switchView} />}
        </div>
      </div>
    </div>
  )
}
