"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"

export default function InventoryValueChart() {
  const { inventory, inventorySummary, isLoadingStore } = useAnalytics()

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
          <CardTitle>Inventory Valuation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!inventorySummary || inventory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Valuation</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No inventory valuation data available</p>
        </CardContent>
      </Card>
    )
  }

  // Sort inventory by value (highest to lowest)
  const topValueProducts = [...inventory]
    .sort((a, b) => b.inventory_value - a.inventory_value)
    .slice(0, 10)

  const totalValue = inventorySummary.total_value
  const averageValue = inventory.length > 0 ? totalValue / inventory.length : 0

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Inventory Valuation</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Top Value Products</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black">
            {formatCurrency(totalValue)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">
              Total Value
            </p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalValue)}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-1">
              {inventorySummary.total_units.toLocaleString()} units
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-2">
              Average Value
            </p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {formatCurrency(averageValue)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-1">
              per product
            </p>
          </div>
        </div>

        {/* Top Value Products List */}
        <div className="space-y-2">
          <p className="text-sm font-black text-muted-foreground uppercase mb-3">Top 10 by Value</p>
          {topValueProducts.map((product, index) => {
            const valuePercentage = (product.inventory_value / totalValue) * 100

            return (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all"
              >
                <Badge
                  className={`font-black ${
                    index === 0
                      ? "bg-amber-500 text-white"
                      : index === 1
                      ? "bg-slate-400 text-white"
                      : index === 2
                      ? "bg-orange-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  #{index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{product.product_name}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {product.current_stock} units @ {formatCurrency(product.selling_price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">
                    {formatCurrency(product.inventory_value)}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">{valuePercentage.toFixed(1)}%</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Value Distribution Bar */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">
              Top 10 Contribution
            </span>
            <span className="text-xs font-black text-foreground">
              {((topValueProducts.reduce((sum, p) => sum + p.inventory_value, 0) / totalValue) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-1000 flex items-center justify-end"
              style={{
                width: `${((topValueProducts.reduce((sum, p) => sum + p.inventory_value, 0) / totalValue) * 100).toFixed(1)}%`,
              }}
            >
              <TrendingUp className="h-3 w-3 text-white mr-1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-2 text-center">
            {formatCurrency(topValueProducts.reduce((sum, p) => sum + p.inventory_value, 0))} of {formatCurrency(totalValue)} total
          </p>
        </div>
      </CardContent>
    </Card>
  )
}