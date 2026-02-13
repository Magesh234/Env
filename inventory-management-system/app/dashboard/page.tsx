"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Store as StoreIcon,
  Sparkles,
  Zap,
  Target,
  Award,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react"
import {
  BarChart,
  Bar,
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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { inventory_base_url } from "@/lib/api-config"
import { useStore } from "@/lib/store-context"

// --- ALL ORIGINAL CONSTANTS & TYPES (100% PRESERVED) ---
const API_BASE_URL = inventory_base_url
const COLORS = ["#5B7FDB", "#4ECDC4", "#7B68EE", "#FF6B9D", "#FFA07A", "#98D8C8"]

interface DashboardStats {
  totalProducts: number
  totalSales: number
  totalClients: number
  totalDebts: number
  lowStockCount: number
  recentSales: number
  avgTransaction: number
  profitMargin: number
}

interface Store {
  id: string
  store_name: string
  [key: string]: any
}

interface Sale {
  id: string
  store_id: string
  total_amount: number
  amount_paid: number
  payment_status: string
  payment_method: string
  invoice_date: string
  [key: string]: any
}

interface Debt {
  id: string
  store_id: string
  balance_due: number
  [key: string]: any
}

interface InventoryItem {
  id: string
  is_low_stock: boolean
  current_stock: number
  selling_price: number
  product_name: string
  product_id: string
  [key: string]: any
}

interface Client {
  id: string
  [key: string]: any
}

interface Product {
  id: string
  name: string
  category?: string
  [key: string]: any
}

// --- ALL ORIGINAL FUNCTIONS (100% PRESERVED) ---
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

export default function DashboardPage() {
  const { selectedStore, setSelectedStore, storeName, setStoreName } = useStore()

  // --- ALL ORIGINAL STATE (100% PRESERVED) ---
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    totalClients: 0,
    totalDebts: 0,
    lowStockCount: 0,
    recentSales: 0,
    avgTransaction: 0,
    profitMargin: 0,
  })
  const [user, setUser] = useState<any>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // --- ALL ORIGINAL HELPER FUNCTIONS (100% PRESERVED) ---
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

  const fetchStores = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/stores`, { headers })
      
      if (!response.ok || !isJsonResponse(response)) {
        setStores([])
        return
      }

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setStores(data.data)
        
        if (data.data.length > 0 && !selectedStore) {
          setSelectedStore(data.data[0].id)
          setStoreName(data.data[0].store_name)
        }
      } else {
        setStores([])
      }
    } catch {
      setStores([])
    }
  }

  const fetchSales = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/sales`, { headers })

      if (!response.ok || !isJsonResponse(response)) {
        setSales([])
        return
      }

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setSales(data.data)
      } else {
        setSales([])
      }
    } catch {
      setSales([])
    }
  }

  const fetchDebts = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/debts`, { headers })

      if (!response.ok || !isJsonResponse(response)) {
        setDebts([])
        return
      }

      const data = await response.json()
      if (data.success && data.data && Array.isArray(data.data.debts)) {
        setDebts(data.data.debts)
      } else {
        setDebts([])
      }
    } catch {
      setDebts([])
    }
  }

  const fetchInventory = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/inventory`, { headers })

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

  const fetchClients = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/clients`, { headers })

      if (!response.ok || !isJsonResponse(response)) {
        setClients([])
        return
      }

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setClients(data.data)
      } else {
        setClients([])
      }
    } catch {
      setClients([])
    }
  }

  const fetchProducts = async () => {
    try {
      const headers = getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/products`, { headers })

      if (!response.ok || !isJsonResponse(response)) {
        setProducts([])
        return
      }

      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data)
      } else {
        setProducts([])
      }
    } catch {
      setProducts([])
    }
  }

  const handleStoreChange = (storeId: string) => {
    const store = stores.find(s => s.id === storeId)
    if (store) {
      setSelectedStore(storeId)
      setStoreName(store.store_name)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      const userData = localStorage.getItem("user")
      if (userData) {
        setUser(JSON.parse(userData))
      }

      try {
        await Promise.all([
          fetchStores(),
          fetchSales(),
          fetchDebts(),
          fetchInventory(),
          fetchClients(),
          fetchProducts(),
        ])
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const totalSalesAmount = sales.reduce((sum, sale) => sum + (Number(sale.total_amount) || 0), 0)
    const totalDebtsAmount = debts.reduce((sum, debt) => sum + (Number(debt.balance_due) || 0), 0)
    const totalPaid = sales.reduce((sum, sale) => sum + (Number(sale.amount_paid) || 0), 0)
    const lowStock = inventory.filter((item) => item.is_low_stock).length
    const avgTrans = sales.length > 0 ? totalSalesAmount / sales.length : 0
    const profit = totalPaid - (totalPaid * 0.8)
    const margin = totalPaid > 0 ? (profit / totalPaid) * 100 : 0

    setStats({
      totalProducts: products.length,
      totalSales: totalSalesAmount,
      totalClients: clients.length,
      totalDebts: totalDebtsAmount,
      lowStockCount: lowStock,
      recentSales: sales.length,
      avgTransaction: avgTrans,
      profitMargin: margin,
    })
  }, [sales, debts, inventory, clients, products])

  const salesTrendData = (() => {
    const monthlyData: { [key: string]: { sales: number, count: number } } = {}
    
    sales.forEach(sale => {
      if (sale.invoice_date) {
        const date = new Date(sale.invoice_date)
        const monthKey = date.toLocaleString('en-US', { month: 'short' })
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { sales: 0, count: 0 }
        }
        
        monthlyData[monthKey].sales += Number(sale.total_amount) || 0
        monthlyData[monthKey].count += 1
      }
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      sales: data.sales,
      profit: data.sales * 0.2,
      expenses: data.sales * 0.8,
    }))
  })()

  const categoryDistribution = (() => {
    const categoryTotals: { [key: string]: number } = {}
    
    inventory.forEach(item => {
      const product = products.find(p => p.id === item.product_id)
      const category = product?.category || "Uncategorized"
      const value = (Number(item.current_stock) || 0) * (Number(item.selling_price) || 0)
      
      categoryTotals[category] = (categoryTotals[category] || 0) + value
    })

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
    
    if (total === 0) return []

    return Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name,
        value: Math.round((amount / total) * 100),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  })()

  const storePerformance = stores.map((store) => {
    const storeSales = sales.filter((s) => s.store_id === store.id)
    const storeDebts = debts.filter((d) => d.store_id === store.id)
    return {
      name: store.store_name,
      sales: storeSales.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0),
      debts: storeDebts.reduce((sum, d) => sum + (Number(d.balance_due) || 0), 0),
      transactions: storeSales.length,
    }
  })

  const topProducts = inventory
    .map(item => ({
      ...item,
      totalValue: (Number(item.current_stock) || 0) * (Number(item.selling_price) || 0)
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5)
    .map((item) => {
      const itemSales = sales.filter(s => 
        s.items?.some((i: any) => i.product_id === item.product_id)
      )
      const recentSales = itemSales.slice(-5).length
      const olderSales = itemSales.slice(0, -5).length
      const growth = olderSales > 0 ? ((recentSales - olderSales) / olderSales) * 100 : 0

      return {
        name: item.product_name,
        sold: Number(item.current_stock) || 0,
        revenue: item.totalValue,
        growth,
      }
    })

  const paymentMethodData = [
    { 
      name: "Cash", 
      value: sales.filter(s => s.payment_method === "cash").length,
      amount: sales.filter(s => s.payment_method === "cash").reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)
    },
    { 
      name: "Bank Transfer", 
      value: sales.filter(s => s.payment_method === "bank_transfer").length,
      amount: sales.filter(s => s.payment_method === "bank_transfer").reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)
    },
    { 
      name: "Credit", 
      value: sales.filter(s => s.payment_method === "credit").length,
      amount: sales.filter(s => s.payment_method === "credit").reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0)
    },
  ].filter(item => item.value > 0)

  const allStatCards = [
    {
      title: "Total Revenue",
      value: formatCurrencySmart(stats.totalSales),
      icon: DollarSign,
      description: "Total sales revenue",
      color: "#10b981",
      bgColor: "from-emerald-500 to-emerald-600",
      trend: "up",
      change: "From all transactions",
      restrictedRoles: ["staff"],
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: Package,
      description: "Active in catalog",
      color: "#3b82f6",
      bgColor: "from-blue-500 to-blue-600",
      trend: "up",
      change: `${stats.totalProducts} items`,
      restrictedRoles: [],
    },
    {
      title: "Active Clients",
      value: stats.totalClients,
      icon: Users,
      description: "Registered customers",
      color: "#8b5cf6",
      bgColor: "from-purple-500 to-purple-600",
      trend: "up",
      change: `${stats.totalClients} clients`,
      restrictedRoles: [],
    },
    {
      title: "Outstanding Debts",
      value: formatCurrencySmart(stats.totalDebts),
      icon: CreditCard,
      description: "Pending payments",
      color: "#ef4444",
      bgColor: "from-red-500 to-red-600",
      trend: "down",
      change: `${debts.length} accounts`,
      restrictedRoles: ["staff"],
    },
    {
      title: "Transactions",
      value: stats.recentSales,
      icon: ShoppingCart,
      description: "Total invoices",
      color: "#f59e0b",
      bgColor: "from-amber-500 to-amber-600",
      trend: "up",
      change: `${stats.recentSales} sales`,
      restrictedRoles: ["staff"],
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      description: "Need restocking",
      color: stats.lowStockCount > 0 ? "#f59e0b" : "#10b981",
      bgColor: stats.lowStockCount > 0 ? "from-amber-500 to-amber-600" : "from-emerald-500 to-emerald-600",
      trend: stats.lowStockCount > 0 ? "up" : "down",
      change: `${stats.lowStockCount} items`,
      restrictedRoles: [],
    },
    {
      title: "Avg Transaction",
      value: formatCurrencySmart(stats.avgTransaction),
      icon: TrendingUp,
      description: "Per invoice",
      color: "#06b6d4",
      bgColor: "from-cyan-500 to-cyan-600",
      trend: "up",
      change: "Average value",
      restrictedRoles: ["staff"],
    },
    {
      title: "Profit Margin",
      value: `${stats.profitMargin.toFixed(1)}%`,
      icon: Activity,
      description: "Estimated margin",
      color: "#14b8a6",
      bgColor: "from-teal-500 to-teal-600",
      trend: "up",
      change: "Based on payments",
      restrictedRoles: ["staff"],
    },
  ]

  const statCards = allStatCards.filter(card => {
    const userRole = user?.primary_role || ""
    return !card.restrictedRoles.includes(userRole)
  })

  // --- LOADING STATE (ENHANCED DESIGN) ---
  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-slate-600">
      <div className="p-6 space-y-6 max-w-[1800px] mx-auto">
        {/* ENHANCED HEADER */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              Dashboard
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1 animate-pulse">
                Live
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Welcome back, <span className="font-bold">{user?.first_name || "User"}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-2 rounded-xl border-2 border-slate-200 dark:border-slate-800 shadow-lg">
              <StoreIcon className="h-4 w-4 text-primary" />
              <Select value={selectedStore} onValueChange={handleStoreChange}>
                <SelectTrigger className="w-[200px] border-none shadow-none font-bold">
                  <SelectValue placeholder="Select store">
                    {storeName || "Select store"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id} className="font-bold">
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStore && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black text-[10px]">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* PREMIUM STATS GRID */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={stat.title}
                className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:scale-105"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Decorative Circle */}
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
                  <div className="flex items-center gap-2">
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
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium">{stat.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CHARTS SECTION */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Analysis Chart */}
          {salesTrendData.length > 0 && (
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black">Revenue Analysis</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Monthly Performance</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black border-2">
                    {salesTrendData.length} Months
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={salesTrendData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B7FDB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#5B7FDB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
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
                    <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#5B7FDB"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      name="Sales"
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="#4ECDC4"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorProfit)"
                      name="Profit"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Store Performance Chart */}
          {storePerformance.length > 0 && (
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg shadow-lg">
                    <StoreIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Store Performance</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Revenue vs Debts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={storePerformance} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" opacity={0.5} />
                    <XAxis 
                      dataKey="name" 
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
                    <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                    <Bar dataKey="sales" fill="#5B7FDB" name="Revenue" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="debts" fill="#FF6B9D" name="Debts" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* PIE CHARTS SECTION */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Distribution */}
          {categoryDistribution.length > 0 && (
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                    <PieChartIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Categories</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">By Inventory Value</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.value}%`}
                    >
                      {categoryDistribution.map((entry, index) => (
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
                      formatter={(value: number, name: string, props: any) => [
                        `${value}% (${formatCurrencySmart(props.payload.amount)})`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryDistribution.slice(0, 3).map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx] }} />
                        <span className="text-foreground font-bold truncate">{cat.name}</span>
                      </div>
                      <span className="font-black text-primary">{cat.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Methods */}
          {paymentMethodData.length > 0 && (
            <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg shadow-lg">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Payment Methods</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Transaction Distribution</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.value}`}
                    >
                      {paymentMethodData.map((entry, index) => (
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
                      formatter={(value: number, name: string, props: any) => [
                        `${value} (${formatCurrencySmart(props.payload.amount)})`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {paymentMethodData.map((method, idx) => (
                    <div key={method.name} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx] }} />
                        <span className="text-foreground font-bold">{method.name}</span>
                      </div>
                      <span className="font-black text-primary">{formatCurrencySmart(method.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* TOP PRODUCTS */}
        {topProducts.length > 0 && (
          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary to-primary/60 p-2 rounded-lg shadow-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Top Products</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">By Inventory Value</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs font-black border-2">
                  Top {topProducts.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-black text-base truncate text-foreground">{product.name}</h4>
                        <span className="text-base font-black ml-4 text-primary">{formatCurrencySmart(product.revenue)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-bold">{product.sold} units</span>
                        <Separator orientation="vertical" className="h-3" />
                        <div
                          className={`flex items-center gap-1 font-black ${
                            product.growth > 0 
                              ? "text-emerald-600 dark:text-emerald-400" 
                              : product.growth < 0 
                              ? "text-red-600 dark:text-red-400" 
                              : "text-muted-foreground"
                          }`}
                        >
                          {product.growth > 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : product.growth < 0 ? (
                            <ArrowDownRight className="h-3 w-3" />
                          ) : null}
                          {product.growth !== 0 ? `${Math.abs(product.growth).toFixed(1)}%` : "No trend"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* EMPTY STATE */}
        {sales.length === 0 && products.length === 0 && (
          <Card className="shadow-2xl border-2">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full w-fit mx-auto mb-6">
                <Package className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-black mb-2">No Data Available</h3>
              <p className="text-muted-foreground font-medium">
                Start by adding products and recording sales to see your dashboard come to life.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}