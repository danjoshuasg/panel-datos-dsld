"use client"

import { useEffect, useRef } from "react"

interface PieChartProps {
  data: {
    label: string
    value: number
    color: string
  }[]
  width?: number
  height?: number
  title?: string
}

export default function PieChart({ data, width = 300, height = 300, title }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Limpiar el canvas
    ctx.clearRect(0, 0, width, height)

    // Calcular el total
    const total = data.reduce((sum, item) => sum + item.value, 0)
    if (total === 0) return

    // Dibujar el gráfico de pastel
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) * 0.8

    let startAngle = 0
    data.forEach((item) => {
      const sliceAngle = (2 * Math.PI * item.value) / total

      // Dibujar el sector
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      // Rellenar con el color
      ctx.fillStyle = item.color
      ctx.fill()

      // Dibujar el borde
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Actualizar el ángulo de inicio para el siguiente sector
      startAngle += sliceAngle
    })

    // Dibujar leyenda
    const legendY = height - 20
    let legendX = 20

    data.forEach((item) => {
      // Dibujar cuadrado de color
      ctx.fillStyle = item.color
      ctx.fillRect(legendX, legendY, 10, 10)
      ctx.strokeStyle = "#ffffff"
      ctx.strokeRect(legendX, legendY, 10, 10)

      // Dibujar texto
      ctx.fillStyle = "#333333"
      ctx.font = "10px Arial"
      ctx.fillText(`${item.label} (${((item.value / total) * 100).toFixed(1)}%)`, legendX + 15, legendY + 8)

      // Actualizar posición para el siguiente elemento
      legendX += ctx.measureText(`${item.label} (${((item.value / total) * 100).toFixed(1)}%)`).width + 30
    })
  }, [data, width, height])

  return (
    <div className="flex flex-col items-center">
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  )
}
