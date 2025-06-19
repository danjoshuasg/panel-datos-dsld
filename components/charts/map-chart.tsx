// Resumen detallado del Componente MapChart:
// MapChart es un Componente Cliente de React (indicado por "use client") para Next.js, diseñado para renderizar un mapa SVG interactivo de las regiones de Perú. Su propósito es visualizar datos numéricos asociados a regiones específicas, aplicando colores en una escala de gradiente rojo según la intensidad de los valores, y mostrando tooltips con información adicional al interactuar con el mapa. A continuación, se detalla cada entidad y función clave:

// - "use client": Directiva de Next.js que marca este componente como Cliente, habilitando funcionalidades del lado del cliente como hooks de React (useEffect, useRef) y eventos del navegador (mouseenter, mousemove). Esto asegura que el componente se ejecute en el entorno del navegador, necesario para la manipulación dinámica del DOM y la interacción del usuario.

// - MapChartProps (Interface): Define la estructura de las props del componente. Incluye un arreglo 'data' con objetos que contienen 'id' (identificador único de región), 'value' (valor numérico para la escala de color) y 'tooltip' (texto opcional para el tooltip). También permite personalizar 'width', 'height' (dimensiones del SVG) y 'title' (título opcional del mapa).

// - svgRef (useRef<SVGSVGElement>): Referencia al elemento SVG del DOM, utilizada para acceder directamente a los elementos <path> (regiones) y manipular sus atributos (como el color de relleno) o asignar eventos. Permite una interacción eficiente con el mapa sin necesidad de re-renderizados.

// - tooltipRef (useRef<HTMLDivElement>): Referencia al div del tooltip, usado para controlar su visibilidad, contenido y posición dinámica en respuesta a los eventos del ratón. Este enfoque evita la creación/destrucción repetitiva del elemento en el DOM.

// - useEffect: Hook que ejecuta la lógica principal del componente tras el montaje o cuando cambia la prop 'data'. Realiza las siguientes tareas:
//   1. Valida la existencia de svgRef y datos para evitar errores.
//   2. Crea un Map (valueMap) para búsquedas rápidas de datos por ID de región, optimizando el acceso a valores y tooltips.
//   3. Calcula el valor máximo (maxValue) para normalizar la escala de colores.
//   4. Itera sobre los elementos <path> del SVG, asignando colores según la intensidad (valor de la región dividido por maxValue) y configurando tooltips si están disponibles.
//   5. Añade eventos (mouseenter, mouseleave, mousemove) a cada región para controlar la visualización y movimiento del tooltip.
//   6. Aplica un color gris por defecto (#e5e7eb) a regiones sin datos.
//   7. Devuelve una función de limpieza que elimina los event listeners al desmontar el componente, evitando fugas de memoria.

// - showTooltip (Función): Muestra el tooltip cuando el ratón entra en una región. Extrae el texto del atributo 'data-tooltip' del elemento SVG, actualiza el contenido del tooltipRef, lo hace visible y lo posiciona llamando a moveTooltip.

// - hideTooltip (Función): Oculta el tooltip al salir el ratón de una región, estableciendo la propiedad 'display' de tooltipRef a 'none'.

// - moveTooltip (Función): Actualiza la posición del tooltip para seguir al cursor, offset por 10px en X e Y para mejor visibilidad. Usa las coordenadas del evento (pageX, pageY) para un posicionamiento absoluto.

// - getColorForIntensity (Función): Genera un color RGB basado en la intensidad (0 a 1). Crea un gradiente rojo donde valores más altos producen rojos más oscuros, reduciendo los componentes verde y azul, y ajustando el rojo para mantener la visibilidad.

// - JSX: Estructura del componente:
//   - Un contenedor <div> con clases Tailwind para centrar el contenido y posicionar el tooltip de forma absoluta.
//   - Un título opcional (<h3>) renderizado si se proporciona la prop 'title'.
//   - Un elemento <svg> con dimensiones configurables (width, height) y un viewBox fijo (0 0 800 800) para mantener la proporción del mapa.
//   - Múltiples elementos <path> que representan las regiones de Perú, cada uno con un ID único y coordenadas simplificadas para visualización. Los caminos están predefinidos para simplicidad.
//   - Un <div> para el tooltip, inicialmente oculto (display: none), con estilos Tailwind para un diseño limpio y posicionamiento absoluto.

// - Lógica General: El componente combina datos de entrada con un mapa SVG estático para crear una visualización interactiva. La escala de colores refleja la magnitud de los valores, los tooltips proporcionan contexto adicional, y los eventos del ratón aseguran una experiencia de usuario fluida. La limpieza de eventos y la optimización con Map garantizan un rendimiento eficiente.

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