"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"

export default function InventorySummaryCards() {
  const { inventorySummary, inventory, isLoadingStore } = useAnalytics()

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      // Billions
      return `TSh ${(amount / 1000000000).toFixed(1)}B`
    } else if (amount >= 1000000) {
      // Millions
      return `TSh ${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      // Thousands
      return `TSh ${(amount / 1000).toFixed(1)}K`
    }
    return `TSh ${amount}`
  }

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat("en-TZ", {
      style: "currency",
      currency: "TZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoadingStore) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!inventorySummary) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No inventory data available</p>
        </CardContent>
      </Card>
    )
  }

  const stockHealthPercentage = inventorySummary.total_products > 0
    ? ((inventorySummary.total_products - inventorySummary.low_stock_count - inventorySummary.out_of_stock_count) /
        inventorySummary.total_products) *
      100
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Value */}
      <Card className="shadow-lg border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-lg flex-shrink-0">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none font-black text-xs flex-shrink-0">
              VALUE
            </Badge>
          </div>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1 truncate">
            Total Inventory Value
          </p>
          <p 
            className="text-2xl font-black text-emerald-700 dark:text-emerald-300" 
            title={formatCurrencyFull(inventorySummary.total_value)}
          >
            {formatCurrency(inventorySummary.total_value)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-2 truncate">
            {inventorySummary.total_units.toLocaleString()} total units
          </p>
        </CardContent>
      </Card>

      {/* Total Products */}
      <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="bg-blue-500 p-2.5 rounded-xl shadow-lg flex-shrink-0">
              <Package className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-none font-black text-xs flex-shrink-0">
              PRODUCTS
            </Badge>
          </div>
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1 truncate">
            Product Count
          </p>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{inventorySummary.total_products}</p>
          <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-2 truncate">
            Unique SKUs in stock
          </p>
        </CardContent>
      </Card>

      {/* Low Stock */}
      <Card className="shadow-lg border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="bg-orange-500 p-2.5 rounded-xl shadow-lg flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-none font-black text-xs flex-shrink-0">
              WARNING
            </Badge>
          </div>
          <p className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-1 truncate">
            Low Stock Items
          </p>
          <p className="text-2xl font-black text-orange-700 dark:text-orange-300">
            {inventorySummary.low_stock_count}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-orange-200 dark:bg-orange-900/50 h-1.5 rounded-full overflow-hidden min-w-0">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    inventorySummary.total_products > 0
                      ? (inventorySummary.low_stock_count / inventorySummary.total_products) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-xs font-black text-orange-600 dark:text-orange-500 flex-shrink-0">
              {inventorySummary.total_products > 0
                ? ((inventorySummary.low_stock_count / inventorySummary.total_products) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Out of Stock */}
      <Card className="shadow-lg border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="bg-red-500 p-2.5 rounded-xl shadow-lg flex-shrink-0">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-none font-black text-xs flex-shrink-0">
              CRITICAL
            </Badge>
          </div>
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1 truncate">
            Out of Stock
          </p>
          <p className="text-2xl font-black text-red-700 dark:text-red-300">
            {inventorySummary.out_of_stock_count}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-red-200 dark:bg-red-900/50 h-1.5 rounded-full overflow-hidden min-w-0">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${
                    inventorySummary.total_products > 0
                      ? (inventorySummary.out_of_stock_count / inventorySummary.total_products) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className="text-xs font-black text-red-600 dark:text-red-500 flex-shrink-0">
              {inventorySummary.total_products > 0
                ? ((inventorySummary.out_of_stock_count / inventorySummary.total_products) * 100).toFixed(1)
                : 0}
              %
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stock Health Overall */}
      <Card className="shadow-lg border-2 border-slate-200 dark:border-slate-800 md:col-span-2 lg:col-span-4 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="bg-primary p-2.5 rounded-xl shadow-lg flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black truncate">Overall Stock Health</p>
                <p className="text-xs text-muted-foreground font-medium truncate">Inventory status overview</p>
              </div>
            </div>
            <Badge
              className={`font-black text-base px-4 py-1 flex-shrink-0 ${
                stockHealthPercentage >= 80
                  ? "bg-emerald-500 text-white"
                  : stockHealthPercentage >= 60
                  ? "bg-amber-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {stockHealthPercentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-28 sm:w-32 text-sm font-bold text-muted-foreground flex-shrink-0 truncate">Healthy Stock:</div>
              <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden min-w-0">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${stockHealthPercentage}%` }}
                />
              </div>
              <span className="text-sm font-black w-16 sm:w-20 text-right flex-shrink-0 truncate">
                {inventorySummary.total_products -
                  inventorySummary.low_stock_count -
                  inventorySummary.out_of_stock_count}{" "}
                items
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 sm:w-32 text-sm font-bold text-muted-foreground flex-shrink-0 truncate">Low Stock:</div>
              <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden min-w-0">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${
                      inventorySummary.total_products > 0
                        ? (inventorySummary.low_stock_count / inventorySummary.total_products) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-black w-16 sm:w-20 text-right flex-shrink-0 truncate">{inventorySummary.low_stock_count} items</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 sm:w-32 text-sm font-bold text-muted-foreground flex-shrink-0 truncate">Out of Stock:</div>
              <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden min-w-0">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${
                      inventorySummary.total_products > 0
                        ? (inventorySummary.out_of_stock_count / inventorySummary.total_products) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="text-sm font-black w-16 sm:w-20 text-right flex-shrink-0 truncate">{inventorySummary.out_of_stock_count} items</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
