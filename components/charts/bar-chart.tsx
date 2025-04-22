"use client"

import { useEffect, useRef } from "react"

interface BarChartProps {
  data: {
    label: string
    value: number
    color?: string
  }[]
  width?: number
  height?: number
  title?: string
  maxBars?: number
}

export default function BarChart({ data, width = 600, height = 300, title, maxBars = 10 }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, width, height)

    // Limitar el número de barras
    const limitedData = data.slice(0, maxBars)

    // Calcular dimensiones
    const padding = { top: 20, right: 20, bottom: 60, left: 60 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Encontrar el valor máximo
    const maxValue = Math.max(...limitedData.map((item) => item.value))
    const valueScale = chartHeight / (maxValue || 1)

    // Calcular ancho de las barras
    const barWidth = chartWidth / limitedData.length / 1.5
    const barSpacing = chartWidth / limitedData.length - barWidth

    // Dibujar ejes
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 1
    ctx.stroke()

    // Dibujar barras
    limitedData.forEach((item, index) => {
      const x = padding.left + index * (barWidth + barSpacing) + barSpacing / 2
      const barHeight = item.value * valueScale
      const y = height - padding.bottom - barHeight

      // Dibujar la barra
      ctx.fillStyle = item.color || "#9b0000"
      ctx.fillRect(x, y, barWidth, barHeight)

      // Dibujar el valor encima de la barra
      ctx.fillStyle = "#333333"
      ctx.font = "10px Arial"
      ctx.textAlign = "center"
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5)

      // Dibujar la etiqueta debajo de la barra
      ctx.save()
      ctx.translate(x + barWidth / 2, height - padding.bottom + 10)
      ctx.rotate(Math.PI / 4) // Rotar 45 grados
      ctx.textAlign = "left"
      ctx.fillText(item.label, 0, 0)
      ctx.restore()
    })

    // Dibujar escala en el eje Y
    const numYTicks = 5
    for (let i = 0; i <= numYTicks; i++) {
      const value = (maxValue / numYTicks) * i
      const y = height - padding.bottom - value * valueScale

      // Dibujar línea de cuadrícula
      ctx.beginPath()
      ctx.moveTo(padding.left - 5, y)
      ctx.lineTo(padding.left, y)
      ctx.strokeStyle = "#333333"
      ctx.lineWidth = 1
      ctx.stroke()

      // Dibujar valor
      ctx.fillStyle = "#333333"
      ctx.font = "10px Arial"
      ctx.textAlign = "right"
      ctx.fillText(Math.round(value).toString(), padding.left - 10, y + 3)
    }
  }, [data, width, height, maxBars])

  return (
    <div className="flex flex-col items-center">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  )
}
