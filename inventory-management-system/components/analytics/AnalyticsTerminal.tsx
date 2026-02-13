"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Package,
  ShoppingCart,
  CreditCard,
  Store as StoreIcon,
  RefreshCw,
  Download,
  Loader2,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useAnalytics, AnalyticsProvider } from "@/lib/analytics/analyticsContext"
import { useStore } from "@/lib/store-context"

import StoreGrowthChart from "./StoreAnalytics/StoreGrowthChart"
import StorePerformanceGrid from "./StoreAnalytics/StorePerformanceGrid"
import StoreMetrics from "./StoreAnalytics/StoreMetrics"
import ProductDistribution from "./ProductAnalytics/ProductDistribution"
import TopProductsChart from "./ProductAnalytics/TopProductsChart"
import ProductTrendsChart from "./ProductAnalytics/ProductTrendsChart"
import InventorySummaryCards from "./InventoryAnalytics/InventorySummaryCards"
import StockHealthChart from "./InventoryAnalytics/StockHealthChart"
import InventoryValueChart from "./InventoryAnalytics/InventoryValueChart"
import StockMovementFlow from "./InventoryAnalytics/StockMovementFlow"
import SalesOverviewChart from "./SalesAnalytics/SalesOverviewChart"
import SalesVelocityChart from "./SalesAnalytics/SalesVelocityChart"
import PaymentMethodsChart from "./SalesAnalytics/PaymentMethodsChart"
import RevenueByPeriodChart from "./SalesAnalytics/RevenueByPeriodChart"
import DebtOverviewChart from "./DebtAnalytics/DebtOverviewChart"
import DebtAgingChart from "./DebtAnalytics/DebtAgingChart"
import CollectionRateChart from "./DebtAnalytics/CollectionRateChart"
import ClientDebtChart from "./DebtAnalytics/ClientDebtChart"

function AnalyticsTerminalContent() {
  const { selectedStore, storeName, setSelectedStore, setStoreName } = useStore()
  const {
    stores,
    isLoading,
    isLoadingStore,
    filters,
    setFilters,
    loadAllData,
    loadStoreData,
    refreshData,
  } = useAnalytics()

  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  useEffect(() => {
    if (selectedStore) {
      loadStoreData(selectedStore)
      setFilters({ ...filters, storeId: selectedStore })
    }
  }, [selectedStore])

  const handleStoreChange = (storeId: string) => {
    const store = stores.find((s) => s.id === storeId)
    if (store) {
      setSelectedStore(storeId)
      setStoreName(store.store_name)
    }
  }

  const handleRefresh = async () => {
    await refreshData()
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export analytics data")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-bold">Loading Analytics Terminal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/60 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                Analytics Terminal
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1 animate-pulse">
                  Live
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                Advanced analytics and insights for {storeName || "all stores"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Store Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-2 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-lg">
            <StoreIcon className="h-4 w-4 text-primary" />
            <Select value={selectedStore || "all"} onValueChange={handleStoreChange}>
              <SelectTrigger className="w-[200px] border-none shadow-none font-bold">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold">All Stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id} className="font-bold">
                    {store.store_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-2 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-lg">
            <Calendar className="h-4 w-4 text-primary" />
            <Select
              value={filters.timeRange.value}
              onValueChange={(value) => {
                const timeRange = [
                  { label: "Last 7 Days", value: "7d", days: 7 },
                  { label: "Last 30 Days", value: "30d", days: 30 },
                  { label: "Last 90 Days", value: "90d", days: 90 },
                  { label: "Last 6 Months", value: "6m", days: 180 },
                  { label: "Last Year", value: "1y", days: 365 },
                  { label: "All Time", value: "all", days: Infinity },
                ].find((r) => r.value === value)
                if (timeRange) {
                  setFilters({ ...filters, timeRange })
                }
              }}
            >
              <SelectTrigger className="w-[160px] border-none shadow-none font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d" className="font-bold">Last 7 Days</SelectItem>
                <SelectItem value="30d" className="font-bold">Last 30 Days</SelectItem>
                <SelectItem value="90d" className="font-bold">Last 90 Days</SelectItem>
                <SelectItem value="6m" className="font-bold">Last 6 Months</SelectItem>
                <SelectItem value="1y" className="font-bold">Last Year</SelectItem>
                <SelectItem value="all" className="font-bold">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading || isLoadingStore}>
            <RefreshCw className={`h-4 w-4 ${(isLoading || isLoadingStore) ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border-2 border-slate-200 dark:border-slate-800 inline-flex">
          <TabsTrigger value="overview" className="font-bold gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="stores" className="font-bold gap-2">
            <StoreIcon className="h-4 w-4" />
            Stores
          </TabsTrigger>
          <TabsTrigger value="products" className="font-bold gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="inventory" className="font-bold gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="sales" className="font-bold gap-2">
            <ShoppingCart className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="debts" className="font-bold gap-2">
            <CreditCard className="h-4 w-4" />
            Debts
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <StoreMetrics />
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Stores</span>
                    <span className="text-2xl font-black">{stores.length}</span>
                  </div>
                  {selectedStore && <InventorySummaryCards />}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stores Tab */}
        <TabsContent value="stores" className="space-y-6">
          <div className="grid gap-6">
            <StoreGrowthChart />
            <StorePerformanceGrid />
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ProductDistribution />
            <TopProductsChart />
          </div>
          <ProductTrendsChart />
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          {!selectedStore ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Please select a store to view inventory analytics</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <InventorySummaryCards />
              <div className="grid gap-6 md:grid-cols-2">
                <StockHealthChart />
                <InventoryValueChart />
              </div>
              <StockMovementFlow />
            </>
          )}
        </TabsContent>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          {!selectedStore ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Please select a store to view sales analytics</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <SalesOverviewChart />
              <div className="grid gap-6 md:grid-cols-2">
                <SalesVelocityChart />
                <PaymentMethodsChart />
              </div>
              <RevenueByPeriodChart />
            </>
          )}
        </TabsContent>

        {/* Debts Tab */}
        <TabsContent value="debts" className="space-y-6">
          {!selectedStore ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Please select a store to view debt analytics</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <DebtOverviewChart />
                <CollectionRateChart />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <DebtAgingChart />
                <ClientDebtChart />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Main export with provider wrapper
export default function AnalyticsTerminal() {
  return (
    <AnalyticsProvider>
      <AnalyticsTerminalContent />
    </AnalyticsProvider>
  )
}