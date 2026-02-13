"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import type {
  Store,
  Product,
  Sale,
  Debt,
  InventorySummary,
  InventoryItem,
  StockMovement,
  AnalyticsFilters,
  TimeRange,
} from "./types"
import {
  fetchAllStores,
  fetchAllProducts,
  fetchStoreSales,
  fetchStoreDebts,
  fetchInventorySummary,
  fetchStoreInventory,
  fetchStockMovements,
} from "./dataFetchers"

interface AnalyticsContextType {
  // Data
  stores: Store[]
  products: Product[]
  sales: Sale[]
  debts: Debt[]
  inventory: InventoryItem[]
  inventorySummary: InventorySummary | null
  movements: StockMovement[]
  
  // Loading states
  isLoading: boolean
  isLoadingStore: boolean
  
  // Filters
  filters: AnalyticsFilters
  setFilters: (filters: AnalyticsFilters) => void
  
  // Actions
  loadAllData: () => Promise<void>
  loadStoreData: (storeId: string) => Promise<void>
  refreshData: () => Promise<void>
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

const TIME_RANGES: TimeRange[] = [
  { label: "Last 7 Days", value: "7d", days: 7 },
  { label: "Last 30 Days", value: "30d", days: 30 },
  { label: "Last 90 Days", value: "90d", days: 90 },
  { label: "Last 6 Months", value: "6m", days: 180 },
  { label: "Last Year", value: "1y", days: 365 },
  { label: "All Time", value: "all", days: Infinity },
]

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStore, setIsLoadingStore] = useState(false)
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: TIME_RANGES[2], // Default to 90 days
  })

  const loadAllData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [storesData, productsData] = await Promise.all([
        fetchAllStores(),
        fetchAllProducts(),
      ])
      
      setStores(storesData)
      setProducts(productsData)
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadStoreData = useCallback(async (storeId: string) => {
    setIsLoadingStore(true)
    try {
      const [salesData, debtsData, summaryData, inventoryData, movementsData] = await Promise.all([
        fetchStoreSales(storeId),
        fetchStoreDebts(storeId),
        fetchInventorySummary(storeId),
        fetchStoreInventory(storeId),
        fetchStockMovements(storeId),
      ])
      
      setSales(salesData)
      setDebts(debtsData)
      setInventorySummary(summaryData)
      setInventory(inventoryData)
      setMovements(movementsData)
    } catch (error) {
      console.error("Error loading store data:", error)
    } finally {
      setIsLoadingStore(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await loadAllData()
    if (filters.storeId) {
      await loadStoreData(filters.storeId)
    }
  }, [filters.storeId, loadAllData, loadStoreData])

  return (
    <AnalyticsContext.Provider
      value={{
        stores,
        products,
        sales,
        debts,
        inventory,
        inventorySummary,
        movements,
        isLoading,
        isLoadingStore,
        filters,
        setFilters,
        loadAllData,
        loadStoreData,
        refreshData,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider")
  }
  return context
}