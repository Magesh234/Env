"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Store,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  Search,
  Calendar,
  Activity,
  Percent,
  CreditCard,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Edit,
} from "lucide-react"
import { AddProductDialog } from "@/components/forms/add-product-dialog"
import { RecordPaymentDialog } from "@/components/forms/record-payment-dialog"
import { AddInventoryDialog } from "@/components/forms/add-inventory-dialog"
import { CreateSaleDialog } from "@/components/forms/create-sale-dialog"
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { POSFullscreen } from "@/components/forms/pos-fullscreen"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { inventory_base_url } from "@/lib/api-config"

const API_BASE_URL = inventory_base_url
const COLORS = ["#5B7FDB", "#4ECDC4", "#7B68EE", "#FF6B9D", "#FFA07A", "#98D8C8"]

interface NullableField {
  String: string
  Valid: boolean
}

interface StoreData {
  id: string
  business_owner_id: string
  store_code: string
  store_name: string
  store_type: string
  description: NullableField | string
  address: NullableField | string
  city: NullableField | string
  region: NullableField | string
  postal_code: NullableField | string
  country: string
  phone: NullableField | string
  email: NullableField | string
  default_currency: string
  timezone: string
  tax_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface InventoryItem {
  id: string
  store_id: string
  product_name: string
  sku: string
  current_stock: number
  reorder_level: number
  selling_price: number
  buying_price: number
  is_low_stock: boolean
  [key: string]: any
}

interface Sale {
  id: string
  store_id: string
  invoice_number: string
  invoice_date: string
  client_name: string
  client_id: string
  total_amount: number
  amount_paid: number
  payment_status: string
  payment_method: string
  [key: string]: any
}

interface Debt {
  id: string
  store_id: string
  invoice_number: string
  client_name: string
  due_date: string
  total_amount: number
  amount_paid: number
  balance_due: number
  debt_status: string
  [key: string]: any
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  primary_role: string
  [key: string]: any
}

const getStringValue = (field: NullableField | string | undefined): string => {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field.Valid ? field.String : ''
}

const formatDate = (dateString: string | Date): string => {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleDateString()
  } catch {
    return 'Invalid date'
  }
}

const formatCurrency = (num: any): string => {
  const parsed = Number(num)
  return isNaN(parsed) ? 'TZS 0' : `TZS ${parsed.toLocaleString()}`
}

const formatCurrencySmart = (num: any): string => {
  const parsed = Number(num)
  if (isNaN(parsed)) return 'TZS 0'
  
  const abs = Math.abs(parsed)
  
  if (abs >= 1_000_000_000) {
    return `TZS ${(parsed / 1_000_000_000).toFixed(2)}B`
  } else if (abs >= 1_000_000) {
    return `TZS ${(parsed / 1_000_000).toFixed(2)}M`
  } else if (abs >= 1_000) {
    return `TZS ${(parsed / 1_000).toFixed(2)}K`
  } else {
    return `TZS ${parsed.toLocaleString()}`
  }
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground font-bold">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="font-bold"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="font-bold"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Hook for pagination
function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = items.slice(startIndex, endIndex)
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }
  
  useEffect(() => {
    setCurrentPage(1)
  }, [items.length])
  
  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
  }
}

export default function StoreManagementPage() {
  const params = useParams()
  const router = useRouter()
  const storeId = params.id as string

  const [store, setStore] = useState<StoreData | null>(null)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([])
  const [storeDebts, setStoreDebts] = useState<Debt[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showPOS, setShowPOS] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userLoaded, setUserLoaded] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setUserLoaded(true)
      } catch (err) {
        console.error("Error parsing user data:", err)
        setUserLoaded(true)
      }
    } else {
      setUserLoaded(true)
    }
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    if (!token) throw new Error("No access token found. Please login again.")
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    }
  }

  const isJsonResponse = (response: Response): boolean => {
    const contentType = response.headers.get("content-type")
    return contentType ? contentType.includes("application/json") : false
  }

  const fetchStoreData = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}`, { headers })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch store: ${response.status} ${response.statusText}`)
      }

      if (!isJsonResponse(response)) {
        throw new Error("Invalid response format from server")
      }

      const data = await response.json()
      if (!data.success) throw new Error(data.message || "Failed to fetch store data")
      setStore(data.data)
    } catch (err) {
      console.error("Error fetching store:", err)
      throw err
    }
  }

  const fetchInventory = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/inventory/stores/${storeId}`, { headers })

      if (!response.ok || !isJsonResponse(response)) {
        setInventory([])
        return
      }

      const data = await response.json()
      if (data.success && data.data && Array.isArray(data.data.inventories)) {
        setInventory(data.data.inventories)
      } else {
        setInventory([])
      }
    } catch {
      setInventory([])
    }
  }

  const fetchSales = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/sales?store_id=${storeId}`, { headers })

      if (!response.ok || !isJsonResponse(response)) {
        setRecentSales([])
        return
      }

      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        setRecentSales(data.data)
      } else {
        setRecentSales([])
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      setRecentSales([])
    }
  }

  const fetchDebts = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/debts?store_id=${storeId}`, { headers })

      if (!response.ok || !isJsonResponse(response)) {
        setStoreDebts([])
        return
      }

      const data = await response.json()
      if (data.success && data.data && Array.isArray(data.data.debts)) {
        setStoreDebts(data.data.debts)
      } else {
        setStoreDebts([])
      }
    } catch {
      setStoreDebts([])
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        await fetchStoreData()
        await Promise.all([fetchInventory(), fetchSales(), fetchDebts()])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load store data"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (storeId) loadData()
  }, [storeId])

  const safeInventory = Array.isArray(inventory) ? inventory : []
  const safeSales = Array.isArray(recentSales) ? recentSales : []
  const safeDebts = Array.isArray(storeDebts) ? storeDebts : []

  const lowStockCount = safeInventory.filter((item) => item.is_low_stock).length
  const totalValue = safeInventory.reduce((sum, item) => sum + (Number(item.current_stock) || 0) * (Number(item.selling_price) || 0), 0)
  const totalCost = safeInventory.reduce((sum, item) => sum + (Number(item.current_stock) || 0) * (Number(item.buying_price) || 0), 0)
  const potentialProfit = totalValue - totalCost
  const totalSales = safeSales.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0)
  const totalDebts = safeDebts.reduce((sum, debt) => sum + (Number(debt.balance_due) || 0), 0)
  const paidSales = safeSales.filter((sale) => sale.payment_status === "paid").length
  const uniqueClients = new Set(safeSales.map((sale) => sale.client_id)).size

  const dailySalesData = (() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    return last7Days.map(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const daySales = safeSales.filter(sale => {
        const saleDate = new Date(sale.invoice_date)
        return saleDate >= dayStart && saleDate <= dayEnd
      })

      const totalSales = daySales.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0)
      
      return {
        day: dayName,
        sales: totalSales,
        transactions: daySales.length
      }
    })
  })()

  const inventoryStatusData = [
    { name: "In Stock", value: safeInventory.filter((i) => !i.is_low_stock).length },
    { name: "Low Stock", value: lowStockCount },
  ]

  const paymentStatusData = [
    {
      name: "Paid",
      value: paidSales,
      amount: safeSales.filter((s) => s.payment_status === "paid").reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
    },
    {
      name: "Pending",
      value: safeSales.length - paidSales,
      amount: safeSales.filter((s) => s.payment_status === "pending").reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
    },
  ]

  const topSellingProducts = safeInventory
    .sort((a, b) => (Number(b.current_stock) * Number(b.selling_price)) - (Number(a.current_stock) * Number(a.selling_price)))
    .slice(0, 5)

  const filteredInventory = safeInventory.filter(
    (item) =>
      String(item.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.sku || '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const inventoryPagination = usePagination(filteredInventory, 10)
  const salesPagination = usePagination(safeSales, 10)
  const debtsPagination = usePagination(safeDebts, 10)

  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      await Promise.all([fetchStoreData(), fetchInventory(), fetchSales(), fetchDebts()])
    } finally {
      setIsLoading(false)
    }
  }

  const isStaff = user?.primary_role === "staff"

  const stockTurnover = (() => {
    if (totalCost === 0) return "N/A"
    const costOfGoodsSold = safeSales.reduce((sum, sale) => {
      return sum + (Number(sale.total_amount) || 0)
    }, 0)
    const averageInventoryCost = totalCost
    const turnover = averageInventoryCost > 0 ? (costOfGoodsSold / averageInventoryCost) : 0
    return turnover > 0 ? `${turnover.toFixed(1)}x` : "N/A"
  })()

  const collectionRate = (() => {
    const totalDebtAmount = safeDebts.reduce((sum, debt) => sum + (Number(debt.total_amount) || 0), 0)
    const totalPaidAmount = safeDebts.reduce((sum, debt) => sum + (Number(debt.amount_paid) || 0), 0)
    if (totalDebtAmount === 0) return "N/A"
    const rate = (totalPaidAmount / totalDebtAmount) * 100
    return `${rate.toFixed(1)}%`
  })()

  type StatCard = {
    id: string
    title: string
    icon: any
    value: string | number
    description: string
    color: string
    bgColor: string
    trend?: string
    change?: string
    restrictedRoles: string[]
  }

  const statCards: StatCard[] = [
    {
      id: "total-products",
      title: "Total Products",
      icon: Package,
      value: safeInventory.length,
      description: "Items in inventory",
      color: "#3b82f6",
      bgColor: "from-blue-500 to-blue-600",
      trend: "up",
      change: `${safeInventory.length} items`,
      restrictedRoles: []
    },
    {
      id: "inventory-value",
      title: "Inventory Value",
      icon: TrendingUp,
      value: formatCurrencySmart(totalValue),
      description: `Cost: ${formatCurrencySmart(totalCost)}`,
      color: "#10b981",
      bgColor: "from-emerald-500 to-emerald-600",
      trend: "up",
      change: "Total stock value",
      restrictedRoles: ["staff"]
    },
    {
      id: "low-stock",
      title: "Low Stock Items",
      icon: AlertTriangle,
      value: lowStockCount,
      description: `${safeInventory.length > 0 ? ((lowStockCount / safeInventory.length) * 100).toFixed(1) : 0}% of inventory`,
      color: lowStockCount > 0 ? "#f59e0b" : "#10b981",
      bgColor: lowStockCount > 0 ? "from-amber-500 to-amber-600" : "from-emerald-500 to-emerald-600",
      trend: lowStockCount > 0 ? "up" : "down",
      change: `${lowStockCount} items`,
      restrictedRoles: []
    },
    {
      id: "total-sales",
      title: "Total Sales",
      icon: ShoppingCart,
      value: formatCurrencySmart(totalSales),
      description: `${safeSales.length} transactions`,
      color: "#8b5cf6",
      bgColor: "from-purple-500 to-purple-600",
      trend: "up",
      change: "Revenue",
      restrictedRoles: ["staff"]
    },
    {
      id: "outstanding-debts",
      title: "Outstanding Debts",
      icon: DollarSign,
      value: formatCurrencySmart(totalDebts),
      description: `${safeDebts.length} pending payments`,
      color: "#ef4444",
      bgColor: "from-red-500 to-red-600",
      trend: "down",
      change: `${safeDebts.length} accounts`,
      restrictedRoles: ["staff"]
    },
    {
      id: "active-clients",
      title: "Active Clients",
      icon: Users,
      value: uniqueClients,
      description: "Unique customers",
      color: "#06b6d4",
      bgColor: "from-cyan-500 to-cyan-600",
      trend: "up",
      change: "Active",
      restrictedRoles: []
    },
    {
      id: "transactions",
      title: "Transactions",
      icon: Calendar,
      value: safeSales.length,
      description: `${paidSales} paid • ${safeSales.length - paidSales} pending`,
      color: "#f59e0b",
      bgColor: "from-amber-500 to-amber-600",
      trend: "up",
      change: "Total",
      restrictedRoles: ["staff"]
    },
    {
      id: "profit-potential",
      title: "Profit Potential",
      icon: Percent,
      value: formatCurrencySmart(potentialProfit),
      description: `${totalValue > 0 ? ((potentialProfit / totalValue) * 100).toFixed(1) : 0}% margin`,
      color: "#14b8a6",
      bgColor: "from-teal-500 to-teal-600",
      trend: "up",
      change: "Estimated",
      restrictedRoles: ["staff"]
    },
    {
      id: "avg-transaction",
      title: "Avg Transaction",
      icon: Activity,
      value: formatCurrencySmart(safeSales.length > 0 ? totalSales / safeSales.length : 0),
      description: "Per invoice",
      color: "#ec4899",
      bgColor: "from-pink-500 to-pink-600",
      trend: "up",
      change: "Average",
      restrictedRoles: ["staff"]
    },
    {
      id: "payment-rate",
      title: "Payment Rate",
      icon: TrendingUp,
      value: `${safeSales.length > 0 ? ((paidSales / safeSales.length) * 100).toFixed(1) : 0}%`,
      description: `${paidSales} of ${safeSales.length} paid`,
      color: "#10b981",
      bgColor: "from-emerald-500 to-emerald-600",
      trend: "up",
      change: "Success rate",
      restrictedRoles: ["staff"]
    },
    {
      id: "stock-turnover",
      title: "Stock Turnover",
      icon: Package,
      value: stockTurnover,
      description: "Based on sales data",
      color: "#3b82f6",
      bgColor: "from-blue-500 to-blue-600",
      trend: "up",
      change: "Efficiency",
      restrictedRoles: ["staff"]
    },
    {
      id: "collection-rate",
      title: "Collection Rate",
      icon: DollarSign,
      value: collectionRate,
      description: "Debt recovery",
      color: "#8b5cf6",
      bgColor: "from-purple-500 to-purple-600",
      trend: "up",
      change: "Recovery",
      restrictedRoles: ["staff"]
    }
  ]

  const visibleStatCards = statCards.filter(card => 
    !card.restrictedRoles.includes(user?.primary_role || "")
  )

  if (!userLoaded || isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Store...</p>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="p-6">
        <Card className="border-2 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-2xl font-black flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Error Loading Store
            </CardTitle>
            <CardDescription className="text-base">{error || "Store not found"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-bold">
                {error || `The store with ID "${storeId}" could not be found.`}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => router.back()} className="font-bold">Go Back</Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="font-bold">Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const storeAddress = getStringValue(store.address)
  const storeCity = getStringValue(store.city)
  const storeRegion = getStringValue(store.region)
  const storePhone = getStringValue(store.phone)
  const storeEmail = getStringValue(store.email)

  return (
    <div className="h-[calc(100vh-4rem)] overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-slate-600">
      <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
        {showPOS && (
          <POSFullscreen
            storeId={storeId}
            storeName={store.store_name}
            inventory={safeInventory}
            onClose={() => setShowPOS(false)}
          />
        )}

        {/* ENHANCED HEADER */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/60 rounded-xl shadow-lg">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              {store.store_name}
              <Badge 
                variant={store.is_active ? "default" : "secondary"}
                className={`text-xs font-bold uppercase py-1 ${
                  store.is_active 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-none animate-pulse" 
                    : "bg-slate-200 dark:bg-slate-800"
                }`}
              >
                {store.is_active ? "Active" : "Inactive"}
              </Badge>
            </h1>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              onClick={() => setShowPOS(true)}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-bold shadow-lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Point of Sale
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="font-bold border-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" className="font-bold border-2">
              <Edit className="h-4 w-4 mr-2" />
              Edit Store
            </Button>
          </div>
        </div>

        {/* PREMIUM STATS GRID */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {visibleStatCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.id}
                className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-2xl" />
                
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-black tracking-tighter text-foreground mb-2">
                    {stat.value}
                  </div>
                  {stat.trend && stat.change && (
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-black border-2 ${
                          stat.trend === "up"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        )}
                        {stat.change}
                      </Badge>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground font-medium">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CHARTS SECTION */}
        <div className="grid gap-6 lg:grid-cols-2">
          {!isStaff && (
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">Daily Sales Performance</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest">This Week</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailySalesData}>
                    <defs>
                      <linearGradient id="colorStoreSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" opacity={0.5} />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs font-bold" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                    />
                    <YAxis 
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
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      formatter={(value: number) => formatCurrencySmart(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorStoreSales)"
                      name="Sales"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Inventory Status</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Stock Distribution</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={inventoryStatusData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    fill="#8884d8" 
                    dataKey="value" 
                    label
                  >
                    {inventoryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#f59e0b"} />
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
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {!isStaff && (
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-lg">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Payment Status</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Invoice Breakdown</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name} (${entry.value})`}
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#ef4444"} />
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
                      formatter={(value: number, name: string, props: any) => [
                        `${value} invoices (${formatCurrencySmart(props.payload.amount)})`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg shadow-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Top Products by Value</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Highest Value Items</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {topSellingProducts.length > 0 ? (
                <div className="space-y-4">
                  {topSellingProducts.map((product, index) => {
                    const stock = Number(product.current_stock) || 0
                    const price = Number(product.selling_price) || 0
                    const value = stock * price
                    
                    return (
                      <div 
                        key={product.id} 
                        className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-black text-base truncate text-foreground">{product.product_name}</h4>
                            {!isStaff && <span className="text-base font-black ml-4 text-primary">{formatCurrencySmart(value)}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground font-bold">{stock} units in stock</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground font-medium">No inventory data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* TABS SECTION */}
        <Tabs defaultValue="inventory" className="space-y-4">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border-2 border-slate-200 dark:border-slate-800">
            <TabsTrigger value="inventory" className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="sales" className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
              Sales
            </TabsTrigger>
            <TabsTrigger value="debts" className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
              Debts
            </TabsTrigger>
            <TabsTrigger value="products" className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-black">Store Inventory</CardTitle>
                    <CardDescription className="mt-1 font-bold">
                      Showing {inventoryPagination.paginatedItems.length} of {filteredInventory.length} items
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search products..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="pl-8 font-medium border-2" 
                      />
                    </div>
                    <AddInventoryDialog onStockAdded={fetchInventory} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {inventoryPagination.paginatedItems.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2">
                            <TableHead className="font-black">SKU</TableHead>
                            <TableHead className="font-black">Product</TableHead>
                            <TableHead className="text-right font-black">Stock</TableHead>
                            <TableHead className="text-right font-black">Reorder Level</TableHead>
                            {!isStaff && <TableHead className="text-right font-black">Price</TableHead>}
                            {!isStaff && <TableHead className="text-right font-black">Value</TableHead>}
                            <TableHead className="font-black">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryPagination.paginatedItems.map((item) => {
                            const stock = Number(item.current_stock) || 0
                            const price = Number(item.selling_price) || 0
                            const reorder = Number(item.reorder_level) || 0
                            const value = stock * price
                            
                            return (
                              <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                                <TableCell className="font-mono text-sm font-bold">{String(item.sku)}</TableCell>
                                <TableCell className="font-bold">{String(item.product_name)}</TableCell>
                                <TableCell className="text-right font-black">{stock}</TableCell>
                                <TableCell className="text-right text-muted-foreground font-medium">{reorder}</TableCell>
                                {!isStaff && <TableCell className="text-right font-bold">{formatCurrency(price)}</TableCell>}
                                {!isStaff && <TableCell className="text-right font-black">{formatCurrency(value)}</TableCell>}
                                <TableCell>
                                  {item.is_low_stock ? (
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none font-black">
                                      Low Stock
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black">
                                      In Stock
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    {inventoryPagination.totalPages > 1 && (
                      <Pagination
                        currentPage={inventoryPagination.currentPage}
                        totalPages={inventoryPagination.totalPages}
                        onPageChange={inventoryPagination.goToPage}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      {searchTerm ? "No products found matching your search" : "No inventory items yet"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black">Recent Sales</CardTitle>
                    <CardDescription className="mt-1 font-bold">
                      Showing {salesPagination.paginatedItems.length} of {safeSales.length} transactions
                    </CardDescription>
                  </div>
                  <CreateSaleDialog onSaleCreated={fetchSales} />
                </div>
              </CardHeader>
              <CardContent>
                {salesPagination.paginatedItems.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2">
                            <TableHead className="font-black">Invoice #</TableHead>
                            <TableHead className="font-black">Date</TableHead>
                            <TableHead className="font-black">Client</TableHead>
                            {!isStaff && <TableHead className="text-right font-black">Amount</TableHead>}
                            {!isStaff && <TableHead className="text-right font-black">Paid</TableHead>}
                            <TableHead className="font-black">Payment</TableHead>
                            <TableHead className="font-black">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesPagination.paginatedItems.map((sale) => (
                            <TableRow key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                              <TableCell className="font-mono text-sm font-black">{String(sale.invoice_number)}</TableCell>
                              <TableCell className="font-medium">{formatDate(sale.invoice_date)}</TableCell>
                              <TableCell className="font-bold">{String(sale.client_name)}</TableCell>
                              {!isStaff && <TableCell className="text-right font-black">{formatCurrency(sale.total_amount)}</TableCell>}
                              {!isStaff && <TableCell className="text-right font-bold">{formatCurrency(sale.amount_paid)}</TableCell>}
                              <TableCell className="capitalize font-medium">{String(sale.payment_method).replace("_", " ")}</TableCell>
                              <TableCell>
                                <Badge 
                                  className={`font-black border-none ${
                                    sale.payment_status === "paid" 
                                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                                      : "bg-amber-500 hover:bg-amber-600 text-white"
                                  }`}
                                >
                                  {String(sale.payment_status)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {salesPagination.totalPages > 1 && (
                      <Pagination
                        currentPage={salesPagination.currentPage}
                        totalPages={salesPagination.totalPages}
                        onPageChange={salesPagination.goToPage}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No sales recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debts" className="space-y-4">
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black">Outstanding Debts</CardTitle>
                    <CardDescription className="mt-1 font-bold">
                      Showing {debtsPagination.paginatedItems.length} of {safeDebts.length} debts
                    </CardDescription>
                  </div>
                  {!isStaff && (
                    <Button variant="outline" size="sm" className="font-bold border-2">
                      Export Report
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {debtsPagination.paginatedItems.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2">
                            <TableHead className="font-black">Invoice #</TableHead>
                            <TableHead className="font-black">Client</TableHead>
                            <TableHead className="font-black">Due Date</TableHead>
                            {!isStaff && <TableHead className="text-right font-black">Total</TableHead>}
                            {!isStaff && <TableHead className="text-right font-black">Paid</TableHead>}
                            {!isStaff && <TableHead className="text-right font-black">Balance</TableHead>}
                            <TableHead className="font-black">Status</TableHead>
                            {!isStaff && <TableHead className="font-black">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {debtsPagination.paginatedItems.map((debt) => (
                            <TableRow key={debt.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                              <TableCell className="font-mono text-sm font-black">{String(debt.invoice_number)}</TableCell>
                              <TableCell className="font-bold">{String(debt.client_name)}</TableCell>
                              <TableCell className="font-medium">{formatDate(debt.due_date)}</TableCell>
                              {!isStaff && <TableCell className="text-right font-black">{formatCurrency(debt.total_amount)}</TableCell>}
                              {!isStaff && <TableCell className="text-right font-bold">{formatCurrency(debt.amount_paid)}</TableCell>}
                              {!isStaff && <TableCell className="text-right font-black text-red-500">{formatCurrency(debt.balance_due)}</TableCell>}
                              <TableCell>
                                <Badge 
                                  className={`font-black border-none ${
                                    debt.debt_status === "paid" 
                                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                                      : "bg-red-500 hover:bg-red-600 text-white"
                                  }`}
                                >
                                  {String(debt.debt_status)}
                                </Badge>
                              </TableCell>
                              {!isStaff && (
                                <TableCell>
                                  <RecordPaymentDialog 
                                    debtId={debt.id}
                                    balanceDue={debt.balance_due}
                                    onPaymentRecorded={fetchDebts}
                                  />
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {debtsPagination.totalPages > 1 && (
                      <Pagination
                        currentPage={debtsPagination.currentPage}
                        totalPages={debtsPagination.totalPages}
                        onPageChange={debtsPagination.goToPage}
                      />
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No outstanding debts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-black">Product Catalog</CardTitle>
                  <AddProductDialog onProductAdded={fetchInventory} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground font-medium">
                  Manage your product catalog from the Products page. This tab shows products available in this store.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}