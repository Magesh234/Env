"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processStockMovementsByType, processStockMovementTimeline } from "@/lib/analytics/dataProcessors"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

export default function StockMovementFlow() {
  const { movements, isLoadingStore } = useAnalytics()
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day")

  const movementsByType = processStockMovementsByType(movements)
  const movementTimeline = processStockMovementTimeline(movements, groupBy)

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
          <CardTitle>Stock Movement Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (movements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Flow</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No stock movement data available</p>
        </CardContent>
      </Card>
    )
  }

  const totalIn = movements.filter((m) => m.quantity > 0).reduce((sum, m) => sum + m.quantity, 0)
  const totalOut = movements.filter((m) => m.quantity < 0).reduce((sum, m) => sum + Math.abs(m.quantity), 0)
  const netMovement = totalIn - totalOut

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-2 rounded-lg shadow-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Stock Movement Flow</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Inventory Movement Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-black border-2">
              {movements.length} Movements
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
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Inbound</p>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {totalIn.toLocaleString()}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-1">units received</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="h-5 w-5 text-red-600" />
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">Outbound</p>
            </div>
            <p className="text-2xl font-black text-red-700 dark:text-red-300">
              {totalOut.toLocaleString()}
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 font-medium mt-1">units dispatched</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Net Change</p>
            </div>
            <p className={`text-2xl font-black ${netMovement >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
              {netMovement >= 0 ? "+" : ""}{netMovement.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-1">units net</p>
          </div>
        </div>

        {/* Movement Timeline */}
        <div>
          <p className="text-sm font-black text-muted-foreground uppercase mb-4">Movement Timeline</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementTimeline}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
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
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
              <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={3} name="Inbound" />
              <Line type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={3} name="Outbound" />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} name="Net Change" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Movement by Type */}
        <div>
          <p className="text-sm font-black text-muted-foreground uppercase mb-4">Movement by Type</p>
          <div className="space-y-2">
            {movementsByType.map((type, index) => (
              <div
                key={type.type}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-black">
                    {type.type}
                  </Badge>
                  <div>
                    <p className="text-sm font-bold capitalize">{type.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {formatCurrency(type.value)} total value
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600">In: {type.in.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-600">Out: {type.out.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${type.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    Net: {type.net >= 0 ? "+" : ""}{type.net.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}