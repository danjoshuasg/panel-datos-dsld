"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import Cookies from "js-cookie"

type User = {
  email: string
  name?: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: (onLogoutStart?: () => void) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for session in cookies
        const authCookie = Cookies.get("auth_session")

        if (authCookie) {
          try {
            const userData = JSON.parse(authCookie)
            setUser(userData)
            setLoading(false)
            return
          } catch (e) {
            console.error("Error parsing auth cookie:", e)
          }
        }

        // If no cookie or parsing failed, check Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          const userData = {
            email: session.user.email || "",
            name: session.user.user_metadata.name,
          }
          setUser(userData)

          // Set cookie for future checks
          Cookies.set("auth_session", JSON.stringify(userData), { expires: 7 })
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const userData = {
          email: session.user.email || "",
          name: session.user.user_metadata.name,
        }
        setUser(userData)

        // Update cookie
        Cookies.set("auth_session", JSON.stringify(userData), { expires: 7 })
      } else {
        setUser(null)
        Cookies.remove("auth_session")
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log("Iniciando proceso de login...")

      // Añadir un retraso de 5ms antes de procesar el login
      await new Promise((resolve) => setTimeout(resolve, 5))
      console.log("Procesando credenciales después de 5ms de retraso...")

      // For demo purposes, check hardcoded credentials
      if (email === "sisdna@mimp.gob.pe" && password === "M1mp.2025") {
        console.log("Credenciales válidas, preparando sesión...")

        // Simulate successful login
        const userData = { email, name: "Administrador SISDNA" }
        setUser(userData)

        // Set cookie for session persistence
        Cookies.set("auth_session", JSON.stringify(userData), { expires: 7 })

        console.log("Sesión iniciada correctamente")
        return { success: true, message: "Inicio de sesión exitoso" }
      } else if (email !== "sisdna@mimp.gob.pe") {
        console.log("Correo electrónico no registrado")
        return { success: false, message: "El correo electrónico no está registrado" }
      } else {
        console.log("Contraseña incorrecta")
        return { success: false, message: "Contraseña incorrecta" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Error al iniciar sesión" }
    } finally {
      setLoading(false)
    }
  }

  const logout = async (onLogoutStart?: () => void) => {
    try {
      setLoading(true)

      // Ejecutar callback si existe
      if (onLogoutStart) {
        onLogoutStart()
      }

      // In a real app: await supabase.auth.signOut()
      setUser(null)

      // Remove auth cookie
      Cookies.remove("auth_session")

      router.push("/auth")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
