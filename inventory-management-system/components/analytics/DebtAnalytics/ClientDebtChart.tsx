"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, AlertTriangle, TrendingDown } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
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

export default function ClientDebtChart() {
  const { debts, isLoadingStore } = useAnalytics()

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
          <CardTitle>Client Debt Analysis</CardTitle>
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
          <CardTitle>Client Debt Analysis</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No client debt data available</p>
        </CardContent>
      </Card>
    )
  }

  // Group debts by client
  const clientDebts = debts.reduce((acc, debt) => {
    const client = debt.client_name
    if (!acc[client]) {
      acc[client] = {
        client_name: client,
        total_debt: 0,
        total_outstanding: 0,
        total_paid: 0,
        debt_count: 0,
        overdue_count: 0,
        average_days_overdue: 0,
      }
    }

    acc[client].total_debt += Number(debt.total_amount) || 0
    acc[client].total_outstanding += Number(debt.balance_due) || 0
    acc[client].total_paid += Number(debt.amount_paid) || 0
    acc[client].debt_count += 1
    acc[client].overdue_count += debt.is_overdue ? 1 : 0
    acc[client].average_days_overdue += debt.days_overdue

    return acc
  }, {} as Record<string, any>)

  // Convert to array and calculate averages
  const clientData = Object.values(clientDebts).map((client: any) => ({
    ...client,
    average_days_overdue: Math.round(client.average_days_overdue / client.debt_count),
    payment_rate: client.total_debt > 0 ? (client.total_paid / client.total_debt) * 100 : 0,
  }))

  // Sort by outstanding debt (highest first)
  const topDebtors = clientData.sort((a, b) => b.total_outstanding - a.total_outstanding).slice(0, 10)

  const totalClients = clientData.length
  const clientsWithOverdue = clientData.filter((c) => c.overdue_count > 0).length
  const highRiskClients = clientData.filter((c) => c.average_days_overdue > 60).length

  const getBarColor = (paymentRate: number) => {
    if (paymentRate >= 75) return "#10b981"
    if (paymentRate >= 50) return "#3b82f6"
    if (paymentRate >= 25) return "#f59e0b"
    return "#ef4444"
  }

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Client Debt Analysis</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Per-Client Debt Breakdown</p>
            </div>
          </div>
          <Badge variant="outline" className="font-black border-2">
            {totalClients} Clients
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Client Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-600" />
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Total Clients</p>
            </div>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{totalClients}</p>
            <p className="text-xs text-purple-600 dark:text-purple-500 font-medium mt-1">with outstanding debt</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">With Overdue</p>
            </div>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{clientsWithOverdue}</p>
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-1">
              {totalClients > 0 ? ((clientsWithOverdue / totalClients) * 100).toFixed(1) : 0}% of clients
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">High Risk</p>
            </div>
            <p className="text-2xl font-black text-red-700 dark:text-red-300">{highRiskClients}</p>
            <p className="text-xs text-red-600 dark:text-red-500 font-medium mt-1">60+ days overdue</p>
          </div>
        </div>

        {/* Top Debtors Chart */}
        <div>
          <p className="text-sm font-black text-muted-foreground uppercase mb-4">Top 10 Debtors by Outstanding Amount</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topDebtors} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis
                type="number"
                className="text-xs font-bold"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis
                dataKey="client_name"
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
              <Bar dataKey="total_outstanding" radius={[0, 8, 8, 0]}>
                {topDebtors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.payment_rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Client Details List */}
        <div className="space-y-2">
          <p className="text-sm font-black text-muted-foreground uppercase mb-3">Client Debt Details</p>
          {topDebtors.map((client, index) => (
            <div
              key={client.client_name}
              className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`font-black ${
                      index === 0
                        ? "bg-red-500 text-white"
                        : index === 1
                        ? "bg-orange-500 text-white"
                        : index === 2
                        ? "bg-amber-500 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="text-sm font-bold">{client.client_name}</p>
                    <p className="text-xs text-muted-foreground font-medium">
                      {client.debt_count} {client.debt_count === 1 ? "debt" : "debts"} • Avg{" "}
                      {client.average_days_overdue} days overdue
                    </p>
                  </div>
                </div>
                {client.overdue_count > 0 && (
                  <Badge className="bg-red-500 text-white font-black text-xs">
                    {client.overdue_count} OVERDUE
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Outstanding</p>
                  <p className="text-sm font-black text-red-600">{formatCurrency(client.total_outstanding)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Total Debt</p>
                  <p className="text-sm font-black text-foreground">{formatCurrency(client.total_debt)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Payment Rate</p>
                  <p
                    className="text-sm font-black"
                    style={{ color: getBarColor(client.payment_rate) }}
                  >
                    {client.payment_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Payment Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${client.payment_rate}%`,
                      backgroundColor: getBarColor(client.payment_rate),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* High Risk Alert */}
        {highRiskClients > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-700 dark:text-red-400">High-Risk Clients Alert</p>
                <p className="text-xs text-red-600 dark:text-red-500 font-medium mt-1">
                  {highRiskClients} {highRiskClients === 1 ? "client has" : "clients have"} debts overdue by 60+ days.
                  Immediate follow-up recommended.
                </p>
              </div>
              <Badge className="bg-red-500 text-white font-black">URGENT</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}