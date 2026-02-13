"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChart, Package } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processProductDistribution } from "@/lib/analytics/dataProcessors"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
]

export default function ProductDistribution() {
  const { products, isLoading } = useAnalytics()

  const distributionData = processProductDistribution(products)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (distributionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Distribution</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No product data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Product Distribution</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">By Category</p>
            </div>
          </div>
          <Badge variant="outline" className="font-black border-2">
            {products.length} Products
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={distributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {distributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "2px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any, name: string, props: any) => [
                `${value} products (${props.payload.percentage.toFixed(1)}%)`,
                props.payload.category,
              ]}
            />
          </RechartsPieChart>
        </ResponsiveContainer>

        {/* Category List */}
        <div className="mt-6 space-y-2">
          {distributionData.map((item, index) => (
            <div
              key={item.category}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <p className="text-sm font-bold">{item.category}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {formatCurrency(item.value)} total value
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">{item.count}</p>
                <p className="text-xs text-muted-foreground font-bold">{item.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Categories</p>
            <p className="text-2xl font-black text-foreground">{distributionData.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Value</p>
            <p className="text-2xl font-black text-primary">
              {formatCurrency(distributionData.reduce((sum, item) => sum + item.value, 0))}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}