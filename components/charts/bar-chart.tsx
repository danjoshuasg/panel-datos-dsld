
"use client"
import { LucideIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Interface genérica para los datos
interface ChartDataItem {
  label: string
  value: number
}

// Props interface para el componente genérico
interface GenericBarChartProps {
  data: ChartDataItem[]
  loading: boolean
  title: string
  description?: string
  icon?: LucideIcon
  color?: string
  valueLabel?: string
  showFooter?: boolean
  totalItems?: number
  footerLabel?: string
}

export function GenericBarChart({ 
  data,
  loading,
  title,
  description,
  icon: Icon,
  color = "#9b0000",
  valueLabel = "Cantidad",
  showFooter = true,
  totalItems,
  footerLabel = "elementos"
}: GenericBarChartProps) {
  
  // Transformar datos al formato que espera Recharts
  const chartData = data.map(item => ({
    name: item.label,
    value: item.value
  }))

  // Configuración del gráfico
  const chartConfig = {
    value: {
      label: valueLabel,
      color: color,
    },
  } satisfies ChartConfig

  // Calcular el total para mostrar en el footer
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-0 shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-neutral-100">
        <CardTitle className="flex items-center text-lg">
          {Icon && <Icon className="h-5 w-5 mr-2" />}
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color }} />
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-[400px] text-neutral-500">
            No hay datos disponibles
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 20,
                right: 20,
                bottom: 60,
                left: 60,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip
                cursor={{ fill: `${color}20` }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    formatter={(value) => [`${value} ${footerLabel}`, valueLabel]}
                  />
                }
              />
              <Bar 
                dataKey="value" 
                fill="var(--color-value)" 
                radius={[8, 8, 0, 0]}
                label={{
                  position: 'top',
                  fontSize: 10,
                  fill: '#333333'
                }}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
      {!loading && showFooter && data.length > 0 && (
        <CardFooter className="flex-col items-start gap-2 text-sm bg-neutral-50">
          <div className="font-medium">
            Total: {total.toLocaleString()} {footerLabel}
          </div>
          {totalItems && totalItems > 0 && (
            <div className="text-muted-foreground">
              {((total / totalItems) * 100).toFixed(1)}% del total
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}