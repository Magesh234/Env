"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Package } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processStockHealth } from "@/lib/analytics/dataProcessors"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

const COLORS = {
  in_stock: "#10b981",
  low_stock: "#f59e0b",
  out_of_stock: "#ef4444",
}

export default function StockHealthChart() {
  const { inventory, isLoadingStore } = useAnalytics()

  const stockHealth = processStockHealth(inventory)

  const chartData = [
    { name: "In Stock", value: stockHealth.in_stock, color: COLORS.in_stock },
    { name: "Low Stock", value: stockHealth.low_stock, color: COLORS.low_stock },
    { name: "Out of Stock", value: stockHealth.out_of_stock, color: COLORS.out_of_stock },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoadingStore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Health Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (inventory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Health Distribution</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No stock data available</p>
        </CardContent>
      </Card>
    )
  }

  const totalItems = stockHealth.in_stock + stockHealth.low_stock + stockHealth.out_of_stock

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-2 rounded-lg shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Stock Health Distribution</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Inventory Status Breakdown</p>
            </div>
          </div>
          <Badge variant="outline" className="font-black border-2">
            {totalItems} Items
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
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
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Status Breakdown */}
        <div className="space-y-3 mt-6">
          {/* In Stock */}
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-emerald-500 rounded" />
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">In Stock</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">
                  Healthy inventory levels
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {stockHealth.in_stock}
              </p>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
                {totalItems > 0 ? ((stockHealth.in_stock / totalItems) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Low Stock */}
          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-amber-500 rounded" />
              <div>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400">Low Stock</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                  Needs reordering soon
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300">
                {stockHealth.low_stock}
              </p>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-500">
                {totalItems > 0 ? ((stockHealth.low_stock / totalItems) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>

          {/* Out of Stock */}
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Out of Stock</p>
                <p className="text-xs text-red-600 dark:text-red-500 font-medium">
                  Immediate action required
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-red-700 dark:text-red-300">
                {stockHealth.out_of_stock}
              </p>
              <p className="text-xs font-bold text-red-600 dark:text-red-500">
                {totalItems > 0 ? ((stockHealth.out_of_stock / totalItems) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Total Value */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Total Inventory Value</p>
          <p className="text-3xl font-black text-primary">{formatCurrency(stockHealth.total_value)}</p>
        </div>
      </CardContent>
    </Card>
  )
}