import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: number | string
  description?: string
  icon?: React.ReactNode
  color?: string
  percentage?: number
  isLoading?: boolean
}

export default function StatsCard({
  title,
  value,
  description,
  icon,
  color = "#9b0000",
  percentage,
  isLoading = false,
}: StatsCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">{title}</p>
            {isLoading ? (
              <div className="h-8 w-24 bg-neutral-200 animate-pulse rounded mt-1"></div>
            ) : (
              <h3 className="text-2xl font-bold mt-1" style={{ color }}>
                {value}
              </h3>
            )}
            {description && <p className="text-xs text-neutral-500 mt-1">{description}</p>}
            {percentage !== undefined && (
              <div className="flex items-center mt-2">
                <div className={`text-xs font-medium ${percentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {percentage >= 0 ? "+" : ""}
                  {percentage.toFixed(1)}%
                </div>
                <span className="text-xs text-neutral-500 ml-1">vs. promedio nacional</span>
              </div>
            )}
          </div>
          {icon && (
            <div
              className="p-3 rounded-full"
              style={{ backgroundColor: `${color}20` }} // Color con 20% de opacidad
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
