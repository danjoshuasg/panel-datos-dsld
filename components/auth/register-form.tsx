"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, AtSign, Lock, ArrowRight, UserPlus, CheckCircle, ArrowLeft } from "lucide-react"

interface RegisterFormProps {
  onSwitchView: (view: "login" | "register" | "recover") => void
}

export function RegisterForm({ onSwitchView }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [emailError, setEmailError] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  const validateEmail = (email: string) => {
    if (!email.endsWith("@mimp.gob.pe")) {
      setEmailError("Solo se permiten correos con dominio @mimp.gob.pe")
      return false
    }
    setEmailError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      return
    }

    setIsLoading(true)
    setIsPulsing(true)

    // Reset pulse animation after it completes
    setTimeout(() => setIsPulsing(false), 300)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    setIsSuccess(true)

    // Here you would handle actual registration logic
    console.log("Register with:", { name, email, password })
  }

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-8 rounded-2xl border border-gray-200/50 shadow-xl backdrop-blur-sm backdrop-filter relative overflow-hidden fade-in">
      {/* Efecto glass con elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gray-200/20 blur-xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-gray-200/20 blur-xl"></div>
      </div>
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#9b0000] rounded-full flex items-center justify-center scale-in">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 slide-up">Crear Cuenta</h1>
          <p className="mt-2 text-gray-600 slide-up">Acceso al Panel de Datos de las DEMUNA</p>
        </div>

        <style jsx>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #333 !important;
            caret-color: #333;
          }
        `}</style>

        {!isSuccess ? (
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2 staggered-item staggered-item-1">
                <Label htmlFor="name" className="text-gray-700">
                  Nombre Completo
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="border-gray-300 pl-10 text-gray-900 bg-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 staggered-item staggered-item-2">
                <Label htmlFor="email" className="text-gray-700">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <AtSign className="h-5 w-5" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (emailError) validateEmail(e.target.value)
                    }}
                    placeholder="usuario@mimp.gob.pe"
                    className={`border-gray-300 pl-10 text-gray-900 bg-white placeholder:text-gray-400 ${
                      emailError ? "border-red-500" : ""
                    }`}
                    required
                  />
                </div>
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
              </div>

              <div className="space-y-2 staggered-item staggered-item-3">
                <Label htmlFor="password" className="text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-gray-300 pl-10 text-gray-900 bg-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className={`w-full bg-[#9b0000] hover:bg-[#6b0000] text-white staggered-item staggered-item-4 ${isPulsing ? "pulse" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Crear cuenta <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600 staggered-item staggered-item-5">
                ¿Ya tienes una cuenta?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm font-medium text-[#9b0000] hover:text-[#6b0000]"
                  onClick={() => {
                    console.log("Sign in clicked from register")
                    onSwitchView("login")
                  }}
                >
                  Iniciar sesión
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6 scale-in">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-gray-800">Verifica tu correo</h3>
                <p className="text-gray-600">
                  Hemos enviado un enlace de confirmación a <span className="font-medium text-gray-900">{email}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full border-gray-300 bg-white text-gray-700 hover:bg-white hover:border-gray-400 hover:text-gray-900 transition-colors slide-up"
              onClick={() => {
                console.log("Back to login clicked from register")
                onSwitchView("login")
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
