"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, DollarSign, ShoppingCart } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processSalesOverview } from "@/lib/analytics/dataProcessors"
import { useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function SalesOverviewChart() {
  const { sales, isLoadingStore } = useAnalytics()
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")

  const salesData = processSalesOverview(sales, groupBy)

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
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (salesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No sales data available</p>
        </CardContent>
      </Card>
    )
  }

  const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0)
  const totalTransactions = salesData.reduce((sum, d) => sum + d.transactions, 0)
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0
  const peakPeriod = salesData.reduce((max, curr) => (curr.sales > max.sales ? curr : max), salesData[0])

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Sales Revenue Overview</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Revenue Trends & Patterns</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black">
              {formatCurrency(totalSales)}
            </Badge>
            <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
              <SelectTrigger className="w-[120px] font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day" className="font-bold">Daily</SelectItem>
                <SelectItem value="week" className="font-bold">Weekly</SelectItem>
                <SelectItem value="month" className="font-bold">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Sales</p>
            </div>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalSales)}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Transactions</p>
            </div>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">
              {totalTransactions.toLocaleString()}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Avg Transaction</p>
            </div>
            <p className="text-xl font-black text-purple-700 dark:text-purple-300">
              {formatCurrency(averageTransaction)}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Peak Period</p>
            </div>
            <p className="text-sm font-black text-amber-700 dark:text-amber-300 truncate">
              {peakPeriod?.date}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
              {formatCurrency(peakPeriod?.sales || 0)}
            </p>
          </div>
        </div>

        {/* Sales Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={salesData}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" opacity={0.5} />
            <XAxis
              dataKey="date"
              className="text-xs font-bold"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              className="text-xs font-bold"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
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
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any, name: string) => {
                if (name === "Revenue") return formatCurrency(value)
                return value
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSales)"
              name="Revenue"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="transactions"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTransactions)"
              name="Transactions"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}