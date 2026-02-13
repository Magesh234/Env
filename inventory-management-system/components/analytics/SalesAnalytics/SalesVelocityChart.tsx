"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, TrendingUp, Clock } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processSalesOverview } from "@/lib/analytics/dataProcessors"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

export default function SalesVelocityChart() {
  const { sales, isLoadingStore } = useAnalytics()

  const dailySales = processSalesOverview(sales, "day")

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
          <CardTitle>Sales Velocity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (sales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Velocity</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No sales velocity data available</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate velocity metrics
  const totalSales = sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)
  const totalTransactions = sales.length
  const averagePerSale = totalTransactions > 0 ? totalSales / totalTransactions : 0

  // Calculate days with sales
  const uniqueDates = new Set(sales.map((s) => s.invoice_date.split("T")[0]))
  const daysWithSales = uniqueDates.size
  const dailyAverage = daysWithSales > 0 ? totalSales / daysWithSales : 0
  const transactionsPerDay = daysWithSales > 0 ? totalTransactions / daysWithSales : 0

  // Get top 10 days by sales
  const topDays = [...dailySales]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10)

  const getBarColor = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100
    if (percentage >= 80) return "#10b981"
    if (percentage >= 50) return "#3b82f6"
    if (percentage >= 30) return "#f59e0b"
    return "#ef4444"
  }

  const maxSales = Math.max(...topDays.map((d) => d.sales), 0)

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Sales Velocity</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Sales Speed & Frequency</p>
            </div>
          </div>
          <Badge variant="outline" className="font-black border-2">
            {totalTransactions} Sales
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Velocity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Daily Average</p>
            </div>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {formatCurrency(dailyAverage)}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-1">
              per day
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Transactions/Day</p>
            </div>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">
              {transactionsPerDay.toFixed(1)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-1">
              average
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Avg Sale Value</p>
            </div>
            <p className="text-xl font-black text-purple-700 dark:text-purple-300">
              {formatCurrency(averagePerSale)}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-500 font-medium mt-1">
              per transaction
            </p>
          </div>
        </div>

        {/* Top Days Chart */}
        <div>
          <p className="text-sm font-black text-muted-foreground uppercase mb-4">Top 10 Sales Days</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topDays} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis
                type="number"
                className="text-xs font-bold"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis
                dataKey="date"
                type="category"
                width={120}
                className="text-xs font-bold"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Bar dataKey="sales" radius={[0, 8, 8, 0]}>
                {topDays.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.sales, maxSales)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Active Days</p>
            <p className="text-2xl font-black text-foreground">{daysWithSales}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">days with sales</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Velocity Score</p>
            <p className="text-2xl font-black text-orange-600">
              {((transactionsPerDay / 10) * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground font-medium mt-1">sales frequency</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}