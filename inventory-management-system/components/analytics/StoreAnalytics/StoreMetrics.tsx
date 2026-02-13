"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, CheckCircle2, XCircle, TrendingUp, MapPin } from "lucide-react"
import { useAnalytics } from "@/lib/analytics/analyticsContext"

export default function StoreMetrics() {
  const { stores, isLoading } = useAnalytics()

  const activeStores = stores.filter((s) => s.is_active).length
  const inactiveStores = stores.length - activeStores

  // Group stores by region
  const regionCounts = stores.reduce((acc, store) => {
    const getStringValue = (field: any): string => {
      if (!field) return "Unknown"
      if (typeof field === "string") return field
      return field.Valid ? field.String : "Unknown"
    }

    const region = getStringValue(store.region)
    acc[region] = (acc[region] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]

  // Store type distribution
  const typeCounts = stores.reduce((acc, store) => {
    acc[store.store_type] = (acc[store.store_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Store Metrics</CardTitle>
              <p className="text-xs text-muted-foreground font-bold mt-1">Network Overview</p>
            </div>
          </div>
          <Badge className="bg-blue-500/10 text-blue-600 border-none font-black">
            {stores.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Total Stores */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
          <div>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Total Stores
            </p>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">{stores.length}</p>
          </div>
          <div className="bg-blue-500 p-3 rounded-xl">
            <Store className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Active vs Inactive */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Active</p>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{activeStores}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/20 rounded-xl border-2 border-slate-200 dark:border-slate-800">
            <div className="bg-slate-400 p-2 rounded-lg">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Inactive</p>
              <p className="text-2xl font-black text-slate-700 dark:text-slate-300">{inactiveStores}</p>
            </div>
          </div>
        </div>

        {/* Top Region */}
        {topRegion && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border-2 border-purple-200 dark:border-purple-800">
            <div className="bg-purple-500 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Top Region</p>
              <p className="text-lg font-black text-purple-700 dark:text-purple-300">{topRegion[0]}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                {topRegion[1]} {topRegion[1] === 1 ? "store" : "stores"}
              </p>
            </div>
          </div>
        )}

        {/* Store Types */}
        <div className="space-y-2">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Store Types</p>
          <div className="space-y-2">
            {Object.entries(typeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-primary">{count}</span>
                    <Badge variant="outline" className="text-xs font-bold">
                      {((count / stores.length) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Active Rate */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Activation Rate</span>
            <span className="text-sm font-black text-emerald-600">
              {stores.length > 0 ? ((activeStores / stores.length) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-1000 rounded-full"
              style={{ width: `${stores.length > 0 ? (activeStores / stores.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}