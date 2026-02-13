"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, AlertTriangle, DollarSign, Users } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"

export default function DebtOverviewChart() {
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
          <CardTitle>Debt Overview</CardTitle>
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
          <CardTitle>Debt Overview</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No debt data available</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate debt metrics
  const totalOutstanding = debts.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0)
  const totalDebtValue = debts.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0)
  const totalPaid = debts.reduce((sum, d) => sum + (Number(d.amount_paid) || 0), 0)
  const overdueDebts = debts.filter((d) => d.is_overdue)
  const overdueAmount = overdueDebts.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0)
  const uniqueClients = new Set(debts.map((d) => d.client_name)).size

  const collectionRate = totalDebtValue > 0 ? (totalPaid / totalDebtValue) * 100 : 0
  const overduePercentage = totalOutstanding > 0 ? (overdueAmount / totalOutstanding) * 100 : 0

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg shadow-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Debt Overview</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Outstanding Receivables Summary</p>
            </div>
          </div>
          <Badge
            className={`font-black text-base px-4 py-1 ${
              overduePercentage > 50
                ? "bg-red-500 text-white"
                : overduePercentage > 25
                ? "bg-orange-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            {debts.length} Debts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Primary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 rounded-xl border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-500 p-3 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Total Outstanding
                </p>
                <p className="text-3xl font-black text-red-700 dark:text-red-300">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
              <div className="flex justify-between text-xs">
                <span className="text-red-600 dark:text-red-400 font-bold">Total Debt Value</span>
                <span className="text-red-700 dark:text-red-300 font-black">
                  {formatCurrency(totalDebtValue)}
                </span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-red-600 dark:text-red-400 font-bold">Total Paid</span>
                <span className="text-red-700 dark:text-red-300 font-black">{formatCurrency(totalPaid)}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 rounded-xl border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-500 p-3 rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Overdue Amount
                </p>
                <p className="text-3xl font-black text-amber-700 dark:text-amber-300">
                  {formatCurrency(overdueAmount)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
              <div className="flex justify-between text-xs">
                <span className="text-amber-600 dark:text-amber-400 font-bold">Overdue Debts</span>
                <span className="text-amber-700 dark:text-amber-300 font-black">{overdueDebts.length}</span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-amber-600 dark:text-amber-400 font-bold">% of Total</span>
                <span className="text-amber-700 dark:text-amber-300 font-black">
                  {overduePercentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Clients</p>
            </div>
            <p className="text-2xl font-black text-foreground">{uniqueClients}</p>
            <p className="text-xs text-muted-foreground font-medium mt-1">unique debtors</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase">Avg Debt</p>
            </div>
            <p className="text-2xl font-black text-foreground">
              {formatCurrency(debts.length > 0 ? totalOutstanding / debts.length : 0)}
            </p>
            <p className="text-xs text-muted-foreground font-medium mt-1">per account</p>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Collection Rate</p>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {collectionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-1">of total debt</p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Overdue Rate</p>
            </div>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {debts.length > 0 ? ((overdueDebts.length / debts.length) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-1">of accounts</p>
          </div>
        </div>

        {/* Collection Progress Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-muted-foreground uppercase">Collection Progress</p>
            <p className="text-sm font-black text-emerald-600">{collectionRate.toFixed(1)}%</p>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-4 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
              style={{ width: `${collectionRate}%` }}
            >
              {collectionRate > 15 && (
                <span className="text-xs font-black text-white">{collectionRate.toFixed(0)}%</span>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-muted-foreground">
            <span>Paid: {formatCurrency(totalPaid)}</span>
            <span>Outstanding: {formatCurrency(totalOutstanding)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}