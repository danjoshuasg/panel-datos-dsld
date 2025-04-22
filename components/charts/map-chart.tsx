"use client"

import { useEffect, useRef } from "react"

interface MapChartProps {
  data: {
    id: string
    value: number
    tooltip?: string
  }[]
  width?: number
  height?: number
  title?: string
}

export default function MapChart({ data, width = 500, height = 400, title }: MapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return

    // Crear un mapa de valores por región
    const valueMap = new Map<string, { value: number; tooltip?: string }>()
    data.forEach((item) => {
      valueMap.set(item.id, { value: item.value, tooltip: item.tooltip })
    })

    // Encontrar el valor máximo para la escala de colores
    const maxValue = Math.max(...data.map((item) => item.value))

    // Obtener todas las regiones del mapa
    const regions = svgRef.current.querySelectorAll("path")

    // Aplicar colores basados en los valores
    regions.forEach((region) => {
      const id = region.getAttribute("id")
      if (!id) return

      const regionData = valueMap.get(id)
      if (regionData) {
        // Calcular intensidad del color basado en el valor
        const intensity = regionData.value / maxValue
        const color = getColorForIntensity(intensity)

        // Aplicar color
        region.setAttribute("fill", color)

        // Agregar tooltip
        if (regionData.tooltip) {
          region.setAttribute("data-tooltip", regionData.tooltip)
        }

        // Agregar eventos para mostrar/ocultar tooltip
        region.addEventListener("mouseenter", showTooltip)
        region.addEventListener("mouseleave", hideTooltip)
        region.addEventListener("mousemove", moveTooltip)
      } else {
        // Color por defecto para regiones sin datos
        region.setAttribute("fill", "#e5e7eb")
      }
    })

    // Función para mostrar tooltip
    function showTooltip(event: MouseEvent) {
      if (!tooltipRef.current) return
      const target = event.target as SVGPathElement
      const tooltip = target.getAttribute("data-tooltip")
      if (tooltip) {
        tooltipRef.current.textContent = tooltip
        tooltipRef.current.style.display = "block"
        moveTooltip(event)
      }
    }

    // Función para ocultar tooltip
    function hideTooltip() {
      if (!tooltipRef.current) return
      tooltipRef.current.style.display = "none"
    }

    // Función para mover tooltip
    function moveTooltip(event: MouseEvent) {
      if (!tooltipRef.current) return
      tooltipRef.current.style.left = `${event.pageX + 10}px`
      tooltipRef.current.style.top = `${event.pageY + 10}px`
    }

    // Función para obtener color basado en intensidad
    function getColorForIntensity(intensity: number): string {
      // Escala de rojo (más intenso = más oscuro)
      const r = Math.floor(255 - intensity * 155)
      const g = Math.floor(255 - intensity * 255)
      const b = Math.floor(255 - intensity * 255)
      return `rgb(${r}, ${g}, ${b})`
    }

    // Limpiar eventos al desmontar
    return () => {
      regions.forEach((region) => {
        region.removeEventListener("mouseenter", showTooltip)
        region.removeEventListener("mouseleave", hideTooltip)
        region.removeEventListener("mousemove", moveTooltip)
      })
    }
  }, [data])

  return (
    <div className="flex flex-col items-center relative">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <svg ref={svgRef} width={width} height={height} viewBox="0 0 800 800">
        {/* Mapa simplificado de Perú con regiones */}
        <path id="lima" d="M400,400 L450,350 L500,400 L450,450 Z" stroke="#000" strokeWidth="1" />
        <path id="arequipa" d="M350,450 L400,400 L450,450 L400,500 Z" stroke="#000" strokeWidth="1" />
        <path id="cusco" d="M450,350 L500,300 L550,350 L500,400 Z" stroke="#000" strokeWidth="1" />
        <path id="la-libertad" d="M350,350 L400,300 L450,350 L400,400 Z" stroke="#000" strokeWidth="1" />
        <path id="piura" d="M300,300 L350,250 L400,300 L350,350 Z" stroke="#000" strokeWidth="1" />
        <path id="cajamarca" d="M350,250 L400,200 L450,250 L400,300 Z" stroke="#000" strokeWidth="1" />
        <path id="puno" d="M500,400 L550,350 L600,400 L550,450 Z" stroke="#000" strokeWidth="1" />
        <path id="junin" d="M400,300 L450,250 L500,300 L450,350 Z" stroke="#000" strokeWidth="1" />
        <path id="lambayeque" d="M300,250 L350,200 L400,250 L350,300 Z" stroke="#000" strokeWidth="1" />
        <path id="ancash" d="M350,300 L400,250 L450,300 L400,350 Z" stroke="#000" strokeWidth="1" />
        <path id="loreto" d="M450,200 L500,150 L550,200 L500,250 Z" stroke="#000" strokeWidth="1" />
        <path id="ica" d="M350,400 L400,350 L450,400 L400,450 Z" stroke="#000" strokeWidth="1" />
        <path id="san-martin" d="M400,200 L450,150 L500,200 L450,250 Z" stroke="#000" strokeWidth="1" />
        <path id="huanuco" d="M400,250 L450,200 L500,250 L450,300 Z" stroke="#000" strokeWidth="1" />
        <path id="ayacucho" d="M400,350 L450,300 L500,350 L450,400 Z" stroke="#000" strokeWidth="1" />
        <path id="ucayali" d="M500,250 L550,200 L600,250 L550,300 Z" stroke="#000" strokeWidth="1" />
        <path id="apurimac" d="M450,400 L500,350 L550,400 L500,450 Z" stroke="#000" strokeWidth="1" />
        <path id="amazonas" d="M350,200 L400,150 L450,200 L400,250 Z" stroke="#000" strokeWidth="1" />
        <path id="tacna" d="M400,500 L450,450 L500,500 L450,550 Z" stroke="#000" strokeWidth="1" />
        <path id="pasco" d="M450,300 L500,250 L550,300 L500,350 Z" stroke="#000" strokeWidth="1" />
        <path id="tumbes" d="M250,250 L300,200 L350,250 L300,300 Z" stroke="#000" strokeWidth="1" />
        <path id="moquegua" d="M400,450 L450,400 L500,450 L450,500 Z" stroke="#000" strokeWidth="1" />
        <path id="huancavelica" d="M400,400 L450,350 L500,400 L450,450 Z" stroke="#000" strokeWidth="1" />
        <path id="madre-de-dios" d="M550,300 L600,250 L650,300 L600,350 Z" stroke="#000" strokeWidth="1" />
        <path id="callao" d="M380,380 L390,370 L400,380 L390,390 Z" stroke="#000" strokeWidth="1" />
      </svg>
      <div
        ref={tooltipRef}
        className="absolute hidden bg-white p-2 rounded shadow-md border border-gray-200 text-sm z-10 pointer-events-none"
      ></div>
    </div>
  )
}
