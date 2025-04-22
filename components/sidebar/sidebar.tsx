"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronRight,
  Home,
  FileText,
  BarChart3,
  Database,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  ChevronLeft,
  ChevronRightIcon,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  submenu?: NavItem[]
}

interface SidebarProps {
  isCollapsed: boolean
  toggleCollapse: () => void
}

export function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    Defensorías: true,
    Supervisiones: false,
    "Datos SISDNA": false,
  })
  const pathname = usePathname()
  const { toast } = useToast()
  const { logout, user } = useAuth()

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente.",
      variant: "default",
    })
    logout()
  }

  const navItems: NavItem[] = [
    {
      title: "Inicio",
      href: "/auth/inicio",
      icon: Home,
    },
    {
      title: "Defensorías",
      href: "#",
      icon: Shield,
      submenu: [
        {
          title: "Directorio",
          href: "/auth/dna",
          icon: FileText,
        },
        {
          title: "Reportes",
          href: "/auth/dna-reportes",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Supervisiones",
      href: "#",
      icon: FileText,
      submenu: [
        {
          title: "Directorio",
          href: "/auth/supervisiones",
          icon: FileText,
        },
        {
          title: "Reportes",
          href: "/auth/sup-reportes",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Datos SISDNA",
      href: "#",
      icon: Database,
      submenu: [
        {
          title: "Defensorías",
          href: "/auth/syncsisdna-dna",
          icon: Shield,
        },
        {
          title: "Supervisiones",
          href: "/auth/syncsisdna-sup",
          icon: FileText,
        },
      ],
    },
  ]

  const toggleSubmenu = (title: string) => {
    if (!isCollapsed) {
      setExpandedItems((prev) => ({
        ...prev,
        [title]: !prev[title],
      }))
    }
  }

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-white border-gray-200">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-12" : "w-44"
        } transition-all duration-300 ease-in-out bg-gradient-to-b from-[#9b0000] to-[#6b0000] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-40 md:z-0 inset-y-0 left-0 md:inset-auto`}
      >
        <div className="flex flex-col h-full relative">
          {/* Collapse toggle button */}
          <button
            onClick={toggleCollapse}
            className="absolute -right-2 top-20 bg-[#9b0000] text-white rounded-full p-1 shadow-md border border-[#8b0000] hidden md:flex"
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? <ChevronRightIcon className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          {/* Sidebar header */}
          <div
            className={`flex items-center h-auto py-3 px-2 border-b border-[#8b0000] ${isCollapsed ? "justify-center" : "px-3"}`}
          >
            {isCollapsed ? (
              <div className="flex justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="bg-[#8b0000] p-1.5 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-xs">Dan Santivañez</p>
                  <p className="text-white/80 text-xs">Administrador</p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${isCollapsed ? "px-1" : "px-2"} py-3 overflow-y-auto`}>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.title}>
                  {item.submenu ? (
                    <div className="space-y-1">
                      <button
                        onClick={() => toggleSubmenu(item.title)}
                        className={`flex items-center w-full ${isCollapsed ? "justify-center px-1" : "px-2"} py-1.5 text-xs font-medium rounded-md transition-colors ${
                          expandedItems[item.title]
                            ? "bg-[#8b0000] text-white"
                            : "text-white/90 hover:bg-[#8b0000] hover:text-white"
                        }`}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <item.icon className="h-4 w-4 min-w-4" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-1.5 truncate">{item.title}</span>
                            {expandedItems[item.title] ? (
                              <ChevronDown className="h-3 w-3 ml-auto" />
                            ) : (
                              <ChevronRight className="h-3 w-3 ml-auto" />
                            )}
                          </>
                        )}
                      </button>

                      {expandedItems[item.title] && !isCollapsed && (
                        <ul className="pl-4 space-y-1">
                          {item.submenu.map((subitem) => (
                            <li key={subitem.title}>
                              <Link
                                href={subitem.href}
                                className={`flex items-center px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  isActive(subitem.href)
                                    ? "bg-[#7b0000] text-white"
                                    : "text-white/80 hover:bg-[#8b0000] hover:text-white"
                                }`}
                                onClick={() => setIsOpen(false)}
                              >
                                <subitem.icon className="h-3 w-3 mr-1.5" />
                                <span className="truncate">{subitem.title}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center ${isCollapsed ? "justify-center px-1" : "px-2"} py-1.5 text-xs font-medium rounded-md transition-colors ${
                        isActive(item.href)
                          ? "bg-[#7b0000] text-white"
                          : "text-white/90 hover:bg-[#8b0000] hover:text-white"
                      }`}
                      onClick={() => setIsOpen(false)}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 min-w-4" />
                      {!isCollapsed && <span className="ml-1.5 truncate">{item.title}</span>}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar footer */}
          <div className={`p-2 ${isCollapsed ? "px-1" : "p-2"} border-t border-[#8b0000]`}>
            <Button
              variant="ghost"
              className={`w-full ${isCollapsed ? "justify-center px-1 py-1" : "justify-start py-1"} bg-[#7b0000] text-white border-[#8b0000] hover:bg-[#6b0000] hover:text-white text-xs`}
              onClick={handleLogout}
              title={isCollapsed ? "Cerrar sesión" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span className="ml-1.5">Cerrar sesión</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
