"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Calendar } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processProductTrends } from "@/lib/analytics/dataProcessors"
import { useState } from "react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function ProductTrendsChart() {
  const { products, isLoading } = useAnalytics()
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month")

  const trendsData = processProductTrends(products, groupBy)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Creation Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (trendsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Creation Trends</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No product trend data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-2 rounded-lg shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Product Creation Trends</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Product Growth Over Time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-black border-2">
              {trendsData.reduce((sum, d) => sum + d.count, 0)} Products
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
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={trendsData}>
            <defs>
              <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" opacity={0.5} />
            <XAxis
              dataKey="period"
              className="text-xs font-bold"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis className="text-xs font-bold" tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "2px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{ fontWeight: "bold", marginBottom: "8px" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorProducts)"
              name="Products Created"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Products</p>
            <p className="text-2xl font-black text-indigo-600">
              {trendsData.reduce((sum, d) => sum + d.count, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Peak Period</p>
            <p className="text-sm font-black text-foreground">
              {trendsData.reduce((max, curr) => (curr.count > max.count ? curr : max), trendsData[0])?.period}
            </p>
            <p className="text-xs text-indigo-600 font-bold">
              {trendsData.reduce((max, curr) => (curr.count > max.count ? curr : max), trendsData[0])?.count} products
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Average per Period</p>
            <p className="text-2xl font-black text-indigo-600">
              {(trendsData.reduce((sum, d) => sum + d.count, 0) / trendsData.length).toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Active Periods</p>
            <p className="text-2xl font-black text-indigo-600">{trendsData.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}