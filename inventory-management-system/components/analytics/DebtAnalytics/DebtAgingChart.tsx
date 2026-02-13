"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processDebtAging } from "@/lib/analytics/dataProcessors"
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

const AGING_COLORS = {
  current: "#10b981",
  "31-60": "#f59e0b",
  "61-90": "#f97316",
  over90: "#ef4444",
}

export default function DebtAgingChart() {
  const { debts, isLoadingStore } = useAnalytics()

  const agingData = processDebtAging(debts)

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
          <CardTitle>Debt Aging</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (agingData.length === 0 || debts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt Aging</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No debt aging data available</p>
        </CardContent>
      </Card>
    )
  }

  const getBarColor = (range: string) => {
    if (range.includes("Current")) return AGING_COLORS.current
    if (range.includes("31-60")) return AGING_COLORS["31-60"]
    if (range.includes("61-90")) return AGING_COLORS["61-90"]
    return AGING_COLORS.over90
  }

  const totalAmount = agingData.reduce((sum, item) => sum + item.amount, 0)
  const criticalDebts = agingData.filter((item) => item.range.includes("90") || item.range.includes("61"))
  const criticalAmount = criticalDebts.reduce((sum, item) => sum + item.amount, 0)
  const criticalPercentage = totalAmount > 0 ? (criticalAmount / totalAmount) * 100 : 0

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Debt Aging Distribution</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Age-Based Debt Analysis</p>
            </div>
          </div>
          <Badge
            className={`font-black ${
              criticalPercentage > 50
                ? "bg-red-500 text-white"
                : criticalPercentage > 25
                ? "bg-orange-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            {debts.length} Accounts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Aging Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agingData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis
              dataKey="range"
              className="text-xs font-bold"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              angle={-15}
              textAnchor="end"
              height={60}
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
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {agingData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.range)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Aging Breakdown */}
        <div className="space-y-3">
          {agingData.map((item, index) => (
            <div
              key={item.range}
              className="flex items-center justify-between p-4 rounded-xl border-2 transition-shadow hover:shadow-md"
              style={{
                backgroundColor: `${getBarColor(item.range)}10`,
                borderColor: getBarColor(item.range),
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getBarColor(item.range) }}
                />
                <div>
                  <p className="text-sm font-bold">{item.range}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {item.count} {item.count === 1 ? "account" : "accounts"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black" style={{ color: getBarColor(item.range) }}>
                  {formatCurrency(item.amount)}
                </p>
                <p className="text-xs font-bold text-muted-foreground">{item.percentage.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>

        {/* Critical Status Alert */}
        {criticalPercentage > 25 && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700 dark:text-red-400">Critical Aging Alert</p>
                <p className="text-xs text-red-600 dark:text-red-500 font-medium mt-1">
                  {formatCurrency(criticalAmount)} ({criticalPercentage.toFixed(1)}%) in debts aged 60+ days
                </p>
              </div>
              <Badge className="bg-red-500 text-white font-black">ACTION REQUIRED</Badge>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Average Age</p>
            <p className="text-2xl font-black text-foreground">
              {debts.length > 0
                ? Math.round(debts.reduce((sum, d) => sum + d.days_overdue, 0) / debts.length)
                : 0}{" "}
              days
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Current Debts</p>
            <p className="text-2xl font-black text-emerald-600">
              {agingData.find((d) => d.range.includes("Current"))?.count || 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Overdue Debts</p>
            <p className="text-2xl font-black text-red-600">
              {debts.filter((d) => d.is_overdue).length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}