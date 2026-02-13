"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Target } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { calculateCollectionRate, processDebtTimeline } from "@/lib/analytics/dataProcessors"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function CollectionRateChart() {
  const { debts, isLoadingStore } = useAnalytics()

  const collectionRate = calculateCollectionRate(debts)
  const debtTimeline = processDebtTimeline(debts, "month")

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
          <CardTitle>Collection Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (debts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection Rate</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No collection data available</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate collection metrics
  const totalDebtValue = debts.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0)
  const totalPaid = debts.reduce((sum, d) => sum + (Number(d.amount_paid) || 0), 0)
  const totalOutstanding = debts.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0)
  const fullyPaidDebts = debts.filter((d) => Number(d.balance_due) === 0).length
  const partiallyPaidDebts = debts.filter(
    (d) => Number(d.amount_paid) > 0 && Number(d.balance_due) > 0
  ).length
  const unpaidDebts = debts.filter((d) => Number(d.amount_paid) === 0).length

  const paymentCompletionRate = debts.length > 0 ? (fullyPaidDebts / debts.length) * 100 : 0

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Collection Rate</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Recovery & Payment Metrics</p>
            </div>
          </div>
          <Badge
            className={`font-black text-base px-4 py-1 ${
              collectionRate >= 75
                ? "bg-emerald-500 text-white"
                : collectionRate >= 50
                ? "bg-amber-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {collectionRate.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Collection Rate Gauge */}
        <div className="relative">
          <div className="text-center mb-6">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Overall Collection Rate</p>
            <p className="text-6xl font-black text-emerald-600 mb-2">{collectionRate.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground font-medium">
              {formatCurrency(totalPaid)} collected of {formatCurrency(totalDebtValue)}
            </p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-6 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-3"
              style={{ width: `${collectionRate}%` }}
            >
              {collectionRate > 10 && (
                <span className="text-xs font-black text-white">{collectionRate.toFixed(0)}%</span>
              )}
            </div>
          </div>
        </div>

        {/* Collection Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Fully Paid</p>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{fullyPaidDebts}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-1">
              {paymentCompletionRate.toFixed(1)}% completion
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Partial</p>
            </div>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{partiallyPaidDebts}</p>
            <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-1">in progress</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20 rounded-xl border-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-slate-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Unpaid</p>
            </div>
            <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{unpaidDebts}</p>
            <p className="text-xs text-slate-600 dark:text-slate-500 font-medium mt-1">no payment</p>
          </div>
        </div>

        {/* Debt Timeline */}
        {debtTimeline.length > 0 && (
          <div>
            <p className="text-sm font-black text-muted-foreground uppercase mb-4">Debt Creation Timeline</p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={debtTimeline}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis
                  dataKey="period"
                  className="text-xs font-bold"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
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
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === "Amount") return formatCurrency(value)
                    return value
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="amount"
                  stroke="#ef4444"
                  strokeWidth={3}
                  name="Amount"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Count"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Collected</p>
            <p className="text-lg font-black text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Outstanding</p>
            <p className="text-lg font-black text-red-600">{formatCurrency(totalOutstanding)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Debt</p>
            <p className="text-lg font-black text-foreground">{formatCurrency(totalDebtValue)}</p>
          </div>
        </div>

        {/* Performance Indicator */}
        <div
          className={`p-4 rounded-xl border-2 ${
            collectionRate >= 75
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
              : collectionRate >= 50
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
              : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-bold ${
                  collectionRate >= 75
                    ? "text-emerald-700 dark:text-emerald-400"
                    : collectionRate >= 50
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                Collection Performance
              </p>
              <p
                className={`text-xs font-medium mt-1 ${
                  collectionRate >= 75
                    ? "text-emerald-600 dark:text-emerald-500"
                    : collectionRate >= 50
                    ? "text-amber-600 dark:text-amber-500"
                    : "text-red-600 dark:text-red-500"
                }`}
              >
                {collectionRate >= 75
                  ? "Excellent collection efficiency"
                  : collectionRate >= 50
                  ? "Good collection performance"
                  : "Collection improvement needed"}
              </p>
            </div>
            <Badge
              className={`font-black ${
                collectionRate >= 75
                  ? "bg-emerald-500 text-white"
                  : collectionRate >= 50
                  ? "bg-amber-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {collectionRate >= 75 ? "EXCELLENT" : collectionRate >= 50 ? "GOOD" : "NEEDS WORK"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}