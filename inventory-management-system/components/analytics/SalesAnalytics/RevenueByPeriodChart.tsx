"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Calendar, TrendingUp } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processSalesOverview } from "@/lib/analytics/dataProcessors"
import { useState } from "react"
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

export default function RevenueByPeriodChart() {
  const { sales, isLoadingStore } = useAnalytics()
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month")

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
          <CardTitle>Revenue by Period</CardTitle>
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
          <CardTitle>Revenue by Period</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No revenue data available</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate growth trends
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const dataWithGrowth = salesData.map((item, index) => {
    const previousSales = index > 0 ? salesData[index - 1].sales : item.sales
    const growth = calculateGrowth(item.sales, previousSales)
    return { ...item, growth }
  })

  const totalRevenue = salesData.reduce((sum, d) => sum + d.sales, 0)
  const averageRevenue = salesData.length > 0 ? totalRevenue / salesData.length : 0
  const highestPeriod = salesData.reduce((max, curr) => (curr.sales > max.sales ? curr : max), salesData[0])
  const lowestPeriod = salesData.reduce((min, curr) => (curr.sales < min.sales ? curr : min), salesData[0])

  const getBarColor = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100
    if (percentage >= 80) return "#10b981"
    if (percentage >= 60) return "#3b82f6"
    if (percentage >= 40) return "#f59e0b"
    return "#ef4444"
  }

  const maxSales = Math.max(...salesData.map((d) => d.sales), 0)

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 rounded-lg shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Revenue by Period</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Time-Based Revenue Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-500/10 text-indigo-600 border-none font-black">
              {formatCurrency(totalRevenue)}
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
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">
              Total Revenue
            </p>
            <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">
              Average Period
            </p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {formatCurrency(averageRevenue)}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase mb-2">
              Best Period
            </p>
            <p className="text-sm font-black text-amber-700 dark:text-amber-300 truncate">
              {highestPeriod?.date}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
              {formatCurrency(highestPeriod?.sales || 0)}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-xl border-2 border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">
              Lowest Period
            </p>
            <p className="text-sm font-black text-slate-700 dark:text-slate-300 truncate">
              {lowestPeriod?.date}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-500 font-medium">
              {formatCurrency(lowestPeriod?.sales || 0)}
            </p>
          </div>
        </div>

        {/* Revenue Chart */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="revenue" className="font-bold">Revenue</TabsTrigger>
            <TabsTrigger value="transactions" className="font-bold">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis
                  dataKey="date"
                  className="text-xs font-bold"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  className="text-xs font-bold"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(value) => formatCurrency(value)}
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
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                  {salesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.sales, maxSales)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="transactions">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis
                  dataKey="date"
                  className="text-xs font-bold"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
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
                />
                <Bar dataKey="transactions" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Growth Indicator */}
        {dataWithGrowth.length > 1 && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm font-black text-muted-foreground uppercase mb-3">Period-over-Period Growth</p>
            <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <TrendingUp className={`h-5 w-5 ${dataWithGrowth[dataWithGrowth.length - 1].growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              <div className="flex-1">
                <p className="text-sm font-bold">Latest Period vs Previous</p>
                <p className="text-xs text-muted-foreground font-medium">
                  {salesData[salesData.length - 1]?.date} vs {salesData[salesData.length - 2]?.date}
                </p>
              </div>
              <p className={`text-2xl font-black ${dataWithGrowth[dataWithGrowth.length - 1].growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {dataWithGrowth[dataWithGrowth.length - 1].growth >= 0 ? '+' : ''}
                {dataWithGrowth[dataWithGrowth.length - 1].growth.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}