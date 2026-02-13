"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, PieChart } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { processPaymentMethods } from "@/lib/analytics/dataProcessors"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"

const COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
]

export default function PaymentMethodsChart() {
  const { sales, isLoadingStore } = useAnalytics()

  const paymentData = processPaymentMethods(sales)

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
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (paymentData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No payment method data available</p>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = paymentData.reduce((sum, p) => sum + p.amount, 0)
  const totalCount = paymentData.reduce((sum, p) => sum + p.count, 0)

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Payment Methods</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Payment Distribution Analysis</p>
            </div>
          </div>
          <Badge variant="outline" className="font-black border-2">
            {totalCount} Transactions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={paymentData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ method, percentage }) => `${method}: ${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="amount"
            >
              {paymentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "2px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: any, name: string, props: any) => [
                formatCurrency(value),
                props.payload.method,
              ]}
            />
          </RechartsPieChart>
        </ResponsiveContainer>

        {/* Payment Method Details */}
        <div className="space-y-3 mt-6">
          {paymentData.map((method, index) => (
            <div
              key={method.method}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <p className="text-sm font-bold">{method.method}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {method.count} {method.count === 1 ? "transaction" : "transactions"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black" style={{ color: COLORS[index % COLORS.length] }}>
                  {formatCurrency(method.amount)}
                </p>
                <p className="text-xs font-bold text-muted-foreground">
                  {method.percentage.toFixed(1)}% of total
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Value</p>
            <p className="text-2xl font-black text-primary">{formatCurrency(totalAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Payment Types</p>
            <p className="text-2xl font-black text-foreground">{paymentData.length}</p>
          </div>
        </div>

        {/* Average per Method */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">
            Most Popular Method
          </p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-black text-blue-700 dark:text-blue-300">
              {paymentData[0]?.method || "N/A"}
            </p>
            <div className="text-right">
              <p className="text-sm font-black text-blue-600">
                {formatCurrency(paymentData[0]?.amount || 0)}
              </p>
              <p className="text-xs text-blue-500 font-medium">
                {paymentData[0]?.count || 0} transactions
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}