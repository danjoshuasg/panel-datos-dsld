"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Only protect nested routes, not /auth itself
  const isAuthRoot = pathname === "/auth"

  useEffect(() => {
    if (!loading && !user && !isAuthRoot) {
      router.push("/auth")
    }
  }, [user, loading, router, isAuthRoot])

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // If we're at /auth root, just render children (login page)
  if (isAuthRoot) {
    return <>{children}</>
  }

  // For nested routes, show loading or sidebar layout
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-[#9b0000]"></div>
          <p className="text-xl font-medium text-gray-700">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 gap-x-1">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
      <Toaster />
    </div>
  )
}
