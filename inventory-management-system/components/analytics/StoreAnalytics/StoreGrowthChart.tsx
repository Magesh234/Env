"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processStoreGrowth } from "@/lib/analytics/dataProcessors"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function StoreGrowthChart() {
  const { stores, isLoading } = useAnalytics()

  const growthData = processStoreGrowth(stores)

  // Calculate growth rate
  const calculateGrowthRate = () => {
    if (growthData.length < 2) return 0
    const first = growthData[0].cumulative
    const last = growthData[growthData.length - 1].cumulative
    return first > 0 ? (((last - first) / first) * 100).toFixed(1) : 0
  }

  const growthRate = calculateGrowthRate()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Growth Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (growthData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Growth Timeline</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No store growth data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Store Growth Timeline</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Expansion Over Time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-black border-2">
              {growthData.length} Periods
            </Badge>
            <Badge
              className={`font-black border-none ${
                Number(growthRate) > 0
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-600"
              }`}
            >
              {Number(growthRate) > 0 ? "+" : ""}
              {growthRate}% Growth
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={growthData}>
            <defs>
              <linearGradient id="colorStores" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" opacity={0.5} />
            <XAxis
              dataKey="month"
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
            <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
            <Area
              type="monotone"
              dataKey="stores"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorStores)"
              name="New Stores"
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCumulative)"
              name="Total Stores"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Earliest Store</p>
            <p className="text-lg font-black text-foreground">{growthData[0]?.month}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Latest Store</p>
            <p className="text-lg font-black text-foreground">
              {growthData[growthData.length - 1]?.month}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Peak Month</p>
            <p className="text-lg font-black text-foreground">
              {growthData.reduce((max, curr) => (curr.stores > max.stores ? curr : max), growthData[0])?.month}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}