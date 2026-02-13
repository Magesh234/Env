"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, TrendingUp, Package, ShoppingCart, CreditCard, DollarSign } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"
import { useEffect, useState } from "react"
import { fetchStoreSales, fetchStoreInventory, fetchStoreDebts } from "@/lib/analytics/dataFetchers"
import type { Sale, InventoryItem, Debt } from "@/lib/analytics/types"

interface StorePerformance {
  store_id: string
  store_name: string
  total_sales: number
  sales_count: number
  inventory_value: number
  product_count: number
  total_debts: number
  debt_count: number
}

export default function StorePerformanceGrid() {
  const { stores, isLoading } = useAnalytics()
  const [performanceData, setPerformanceData] = useState<StorePerformance[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadPerformanceData() {
      if (stores.length === 0) return

      setLoading(true)
      try {
        const results = await Promise.all(
          stores.map(async (store) => {
            const [sales, inventory, debts] = await Promise.all([
              fetchStoreSales(store.id),
              fetchStoreInventory(store.id),
              fetchStoreDebts(store.id),
            ])

            return {
              store_id: store.id,
              store_name: store.store_name,
              total_sales: sales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
              sales_count: sales.length,
              inventory_value: inventory.reduce((sum, i) => sum + (Number(i.inventory_value) || 0), 0),
              product_count: inventory.length,
              total_debts: debts.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0),
              debt_count: debts.length,
            }
          })
        )

        setPerformanceData(results.sort((a, b) => b.total_sales - a.total_sales))
      } catch (error) {
        console.error("Error loading performance data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPerformanceData()
  }, [stores])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (performanceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No performance data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-lg">
              <BarChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Store Performance Comparison</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Multi-Store Analytics</p>
            </div>
          </div>
          <Badge variant="outline" className="font-black border-2">
            {performanceData.length} Stores
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {performanceData.map((store, index) => (
            <div
              key={store.store_id}
              className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                index === 0
                  ? "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-300 dark:border-amber-700"
                  : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Store Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <Badge className="bg-amber-500 text-white border-none font-black">
                      #1 TOP
                    </Badge>
                  )}
                  {index > 0 && (
                    <span className="text-lg font-black text-muted-foreground">#{index + 1}</span>
                  )}
                  <h3 className="text-lg font-black">{store.store_name}</h3>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Sales */}
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-emerald-500/10 p-1.5 rounded">
                      <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Sales</p>
                  </div>
                  <p className="text-lg font-black text-emerald-600">{formatCurrency(store.total_sales)}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    {store.sales_count} transactions
                  </p>
                </div>

                {/* Inventory */}
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-500/10 p-1.5 rounded">
                      <Package className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Inventory</p>
                  </div>
                  <p className="text-lg font-black text-blue-600">{formatCurrency(store.inventory_value)}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    {store.product_count} products
                  </p>
                </div>

                {/* Debts */}
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-orange-500/10 p-1.5 rounded">
                      <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Debts</p>
                  </div>
                  <p className="text-lg font-black text-orange-600">{formatCurrency(store.total_debts)}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">
                    {store.debt_count} accounts
                  </p>
                </div>

                {/* Average Sale */}
                <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-purple-500/10 p-1.5 rounded">
                      <DollarSign className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Avg Sale</p>
                  </div>
                  <p className="text-lg font-black text-purple-600">
                    {formatCurrency(store.sales_count > 0 ? store.total_sales / store.sales_count : 0)}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-1">per transaction</p>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground">Performance Score</span>
                  <span className="text-xs font-black text-foreground">
                    {((store.total_sales / (performanceData[0]?.total_sales || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 rounded-full ${
                      index === 0 ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-primary"
                    }`}
                    style={{
                      width: `${((store.total_sales / (performanceData[0]?.total_sales || 1)) * 100).toFixed(0)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Sales</p>
            <p className="text-lg font-black text-emerald-600">
              {formatCurrency(performanceData.reduce((sum, s) => sum + s.total_sales, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Inventory</p>
            <p className="text-lg font-black text-blue-600">
              {formatCurrency(performanceData.reduce((sum, s) => sum + s.inventory_value, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Debts</p>
            <p className="text-lg font-black text-orange-600">
              {formatCurrency(performanceData.reduce((sum, s) => sum + s.total_debts, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Avg per Store</p>
            <p className="text-lg font-black text-purple-600">
              {formatCurrency(
                performanceData.length > 0
                  ? performanceData.reduce((sum, s) => sum + s.total_sales, 0) / performanceData.length
                  : 0
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}