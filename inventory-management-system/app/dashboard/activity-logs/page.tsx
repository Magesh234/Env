"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  Search,
  Filter,
  Download,
  User,
  Package,
  ShoppingCart,
  DollarSign,
  Edit,
  Trash2,
  Plus,
  Clock,
  Store,
  LogIn,
  AlertCircle,
  TrendingUp,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { audit_base_url } from "@/lib/api-config"

interface LogEntry {
  id: number
  uuid: string
  user_id: string
  log_type_id: number
  title: string
  details?: string
  device: string
  ipv4_address: string
  meta_data: string
  created_at: string
  log_type_name: string
  log_type_code: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

// --- ALL ORIGINAL UTILITY FUNCTIONS (100% PRESERVED) ---
function getReadableTitle(title: string): string {
  if (!title.match(/^(GET|POST|PUT|DELETE|PATCH)\s/i)) {
    return title
  }

  const match = title.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)$/i)
  if (!match) return title

  const [, method, path] = match

  const urlMappings: Record<string, string> = {
    'GET /api/v1/products': 'Product listing',
    'POST /api/v1/products': 'Product creation',
    'PUT /api/v1/products': 'Product update',
    'DELETE /api/v1/products': 'Product deletion',
    'GET /api/v1/inventory': 'Inventory view',
    'POST /api/v1/inventory/adjust': 'Stock adjustment',
    'POST /api/v1/inventory/stock-in': 'Stock in',
    'POST /api/v1/inventory/stock-out': 'Stock out',
    'GET /api/v1/sales': 'Sales listing',
    'POST /api/v1/sales': 'Sale creation',
    'PUT /api/v1/sales': 'Sale update',
    'GET /api/v1/stores': 'Store listing',
    'POST /api/v1/stores': 'Store creation',
    'PUT /api/v1/stores': 'Store update',
    'DELETE /api/v1/stores': 'Store deletion',
    'GET /api/v1/transfers': 'Transfer listing',
    'POST /api/v1/transfers': 'Transfer creation',
    'PUT /api/v1/transfers': 'Transfer update',
    'GET /api/v1/purchase-orders': 'Purchase order listing',
    'POST /api/v1/purchase-orders': 'Purchase order creation',
    'PUT /api/v1/purchase-orders': 'Purchase order update',
    'GET /api/v1/clients': 'Client listing',
    'GET /api/v1/clients/count': 'Client count retrieval',
    'POST /api/v1/clients': 'Client creation',
    'PUT /api/v1/clients': 'Client update',
    'GET /api/v1/debts': 'Debt listing',
    'POST /api/v1/debts': 'Debt record creation',
    'PUT /api/v1/debts': 'Debt update',
    'GET /api/v1/categories': 'Category listing',
    'POST /api/v1/categories': 'Category creation',
    'PUT /api/v1/categories': 'Category update',
    'GET /api/v1/suppliers': 'Supplier listing',
    'POST /api/v1/suppliers': 'Supplier creation',
    'PUT /api/v1/suppliers': 'Supplier update',
    'GET /api/v1/refund-returns': 'Refund/return listing',
    'POST /api/v1/refund-returns': 'Refund/return creation',
    'GET /api/v1/business/profile': 'Business profile view',
    'PUT /api/v1/business/profile': 'Business profile update',
    'GET /api/v1/business/users': 'Business users listing',
    'POST /api/v1/business/users': 'Business user creation',
    'GET /api/v1/users/profile': 'Profile view',
    'PUT /api/v1/users/profile': 'Profile update',
    'PUT /api/v1/users/password': 'Password change',
    'POST /api/v1/auth/login': 'User login attempt',
    'POST /api/v1/auth/logout': 'User logout',
    'POST /api/v1/auth/refresh': 'Token refresh',
    'POST /api/v1/auth/register': 'User registration',
  }

  const key = `${method.toUpperCase()} ${path}`
  if (urlMappings[key]) {
    return urlMappings[key]
  }

  const pathWithoutId = path.replace(/\/[a-f0-9-]{36}.*$/i, '')
  const keyWithoutId = `${method.toUpperCase()} ${pathWithoutId}`
  
  if (urlMappings[keyWithoutId]) {
    if (method.toUpperCase() === 'GET') {
      return urlMappings[keyWithoutId].replace(' listing', ' view')
    }
    return urlMappings[keyWithoutId]
  }

  if (path.includes('/inventory/stores/') && path.includes('/summary')) {
    return 'Inventory summary view'
  }
  if (path.includes('/inventory/stores/')) {
    return 'Store inventory view'
  }
  if (path.includes('/storefront/enable')) {
    return 'Storefront enabled'
  }
  if (path.includes('/storefront/disable')) {
    return 'Storefront disabled'
  }

  const resource = path.split('/').pop() || path
  const methodName = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
  return `${methodName} ${resource.replace(/-/g, ' ')}`
}

function getReadableDetails(details: string | undefined): string | undefined {
  if (!details) return details
  
  const match = details.match(/^(.+?)\s+-\s+Status:/i)
  if (!match) return details
  
  const actionPart = match[1]
  const readable = getReadableTitle(actionPart)
  
  return details.replace(actionPart, readable)
}

export default function ActivityLogsPage() {
  // --- ALL ORIGINAL STATE (100% PRESERVED) ---
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // --- ALL ORIGINAL EFFECTS & FETCH LOGIC (100% PRESERVED) ---
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      const userId = parsedUser.id || parsedUser.user_id
      if (userId) {
        fetchLogs(userId)
      } else {
        setError("User ID not found. Please log in again.")
        setLoading(false)
      }
    } else {
      setError("User not found. Please log in.")
      setLoading(false)
    }
  }, [])

  const fetchLogs = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("No access token found. Please log in again.")
      }

      const expiresAt = localStorage.getItem("expires_at")
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000)
        if (now > parseInt(expiresAt)) {
          throw new Error("Your session has expired. Please log in again.")
        }
      }

      const response = await fetch(`${audit_base_url}/logs/user/${userId}?page=1&limit=50`, {
        method: "GET",
        headers: {
          Authorization: "Bearer audit-service-api-key-change-in-production",
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        
        if (response.status === 401) {
          throw new Error("Authentication failed. Your session may have expired. Please log in again.")
        }
        
        const errorMessage = errorData?.message || `HTTP ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setActivityLogs(data.data || [])
      setPagination(data.pagination || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch activity logs")
      console.error("Error fetching logs:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- ALL ORIGINAL HELPER FUNCTIONS (100% PRESERVED) ---
  const getActionFromLogType = (logTypeCode: string): string => {
    if (logTypeCode.includes("CREATED")) return "created"
    if (logTypeCode.includes("UPDATED")) return "updated"
    if (logTypeCode.includes("DELETED")) return "deleted"
    if (logTypeCode.includes("LOGIN")) return "login"
    return "action"
  }

  const getEntityFromLogType = (logTypeCode: string): string => {
    if (logTypeCode.includes("PRODUCT")) return "product"
    if (logTypeCode.includes("STORE")) return "store"
    if (logTypeCode.includes("USER")) return "user"
    if (logTypeCode.includes("SALE")) return "sale"
    if (logTypeCode.includes("INVENTORY")) return "inventory"
    if (logTypeCode.includes("CLIENT")) return "client"
    return "system"
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4 text-emerald-500" />
      case "updated":
        return <Edit className="h-4 w-4 text-blue-500" />
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />
      case "login":
        return <LogIn className="h-4 w-4 text-purple-500" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case "user":
        return <User className="h-4 w-4" />
      case "product":
        return <Package className="h-4 w-4" />
      case "inventory":
        return <ShoppingCart className="h-4 w-4" />
      case "sale":
        return <DollarSign className="h-4 w-4" />
      case "store":
        return <Store className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusFromMetaData = (metaData: string): string => {
    try {
      const parsed = JSON.parse(metaData)
      if (parsed.status_code >= 200 && parsed.status_code < 300) return "success"
      if (parsed.status_code >= 400) return "error"
      return "info"
    } catch {
      return "info"
    }
  }

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }

  // --- ALL ORIGINAL FILTERING & PAGINATION (100% PRESERVED) ---
  const filteredLogs = activityLogs.filter((log) => {
    const action = getActionFromLogType(log.log_type_code)
    const readableTitle = getReadableTitle(log.title)
    const readableDetails = getReadableDetails(log.details)
    const matchesSearch =
      readableTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.log_type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (readableDetails && readableDetails.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterType === "all" || action === filterType
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, activityLogs])

  const actionCounts = activityLogs.reduce(
    (acc, log) => {
      const action = getActionFromLogType(log.log_type_code)
      acc[action] = (acc[action] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // --- ORIGINAL EXPORT FUNCTION (100% PRESERVED) ---
  const exportLogs = () => {
    const csv = [
      ["ID", "Title", "Type", "Device", "IP Address", "Timestamp"],
      ...filteredLogs.map((log) => [
        log.id,
        getReadableTitle(log.title),
        log.log_type_name,
        log.device,
        log.ipv4_address,
        formatTimestamp(log.created_at),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  // Pagination helper (matching users page style)
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // --- LOADING STATE (ENHANCED DESIGN) ---
  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Activity Logs...</p>
      </div>
    )
  }

  // --- ERROR STATE (ENHANCED DESIGN) ---
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md shadow-2xl border-2 border-red-100 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-950/40 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-black">Error Loading Logs</CardTitle>
                <CardDescription className="mt-1 font-medium">Something went wrong</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="border-2">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
            <Button onClick={() => user && fetchLogs(user.id)} className="w-full font-bold">
              <Activity className="mr-2 h-4 w-4" />
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- MAIN UI (ENHANCED DESIGN, 100% ORIGINAL LOGIC) ---
  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION - Enhanced */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Activity Logs
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Live
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Track all system activities and changes • {pagination?.total || 0} total entries
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={exportLogs} className="h-10 font-bold border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
            <Download className="mr-2 h-4 w-4 text-emerald-500" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* METRIC CARDS - Enhanced with animations */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Activities */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Activities</p>
            </div>
            <div className="text-4xl font-black tracking-tighter">
              {pagination?.total || activityLogs.length}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">SYSTEM EVENTS</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">TRACKED</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Created */}
        <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 group hover:border-emerald-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <Plus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400 uppercase tracking-[2px]">Created</p>
            </div>
            <div className="text-4xl font-black text-emerald-700 dark:text-emerald-500 tracking-tighter">
              {actionCounts.created || 0}
            </div>
            <p className="text-[9px] mt-4 font-bold text-emerald-600/80 uppercase">New entries</p>
          </CardContent>
        </Card>

        {/* Updated */}
        <Card className="border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 group hover:border-blue-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[10px] font-black text-blue-600/60 dark:text-blue-400 uppercase tracking-[2px]">Updated</p>
            </div>
            <div className="text-4xl font-black text-blue-700 dark:text-blue-500 tracking-tighter">
              {actionCounts.updated || 0}
            </div>
            <p className="text-[9px] mt-4 font-bold text-blue-600/80 uppercase">Modifications</p>
          </CardContent>
        </Card>

        {/* Logins */}
        <Card className="border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 group hover:border-purple-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <LogIn className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-[10px] font-black text-purple-600/60 dark:text-purple-400 uppercase tracking-[2px]">Logins</p>
            </div>
            <div className="text-4xl font-black text-purple-700 dark:text-purple-500 tracking-tighter">
              {actionCounts.login || 0}
            </div>
            <p className="text-[9px] mt-4 font-bold text-purple-600/80 uppercase">User sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* MAIN LOGS CARD - Enhanced design */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-black">Activity History</CardTitle>
                <CardDescription className="mt-1 font-medium">Complete log of all system activities</CardDescription>
              </div>
            </div>
            
            {/* SEARCH & FILTER - Enhanced */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[220px] h-12 border-2 font-bold bg-white dark:bg-slate-950">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">All Actions</SelectItem>
                  <SelectItem value="created" className="font-bold">Created</SelectItem>
                  <SelectItem value="updated" className="font-bold">Updated</SelectItem>
                  <SelectItem value="deleted" className="font-bold">Deleted</SelectItem>
                  <SelectItem value="login" className="font-bold">Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <Activity className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black">No Activity Logs Found</h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                Try adjusting your search query or filter settings.
              </p>
              <Button 
                variant="link" 
                className="mt-4 font-bold" 
                onClick={() => {
                  setSearchQuery("")
                  setFilterType("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* LOGS LIST - Enhanced design */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedLogs.map((log) => {
                  const action = getActionFromLogType(log.log_type_code)
                  const entity = getEntityFromLogType(log.log_type_code)
                  const status = getStatusFromMetaData(log.meta_data)
                  const readableTitle = getReadableTitle(log.title)
                  const readableDetails = getReadableDetails(log.details)

                  return (
                    <div 
                      key={log.uuid} 
                      className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all p-6"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon Stack */}
                        <div className="flex items-center gap-2 mt-1 shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-primary transition-all">
                            {getEntityIcon(entity)}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h3 className="font-black text-foreground group-hover:text-primary transition-colors">
                                  {readableTitle}
                                </h3>
                                
                                {/* Badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {getActionIcon(action)}
                                  <Badge variant="outline" className="capitalize font-bold text-xs border-2 bg-slate-50 dark:bg-slate-900">
                                    {action}
                                  </Badge>
                                  <Badge variant="secondary" className="capitalize font-bold text-xs border-2">
                                    {entity}
                                  </Badge>
                                  {status === "error" && (
                                    <Badge variant="destructive" className="text-xs font-bold border-2">
                                      Failed
                                    </Badge>
                                  )}
                                  {status === "success" && (
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs font-bold border-2 border-emerald-600">
                                      Success
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              {readableDetails && (
                                <p className="text-sm text-muted-foreground font-medium mb-3">
                                  {readableDetails}
                                </p>
                              )}
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap font-medium">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatTimestamp(log.created_at)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Package className="h-3.5 w-3.5" />
                                  {log.device}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <BarChart3 className="h-3.5 w-3.5" />
                                  {log.ipv4_address}
                                </div>
                                <div className="text-[10px] text-muted-foreground/60 font-bold">
                                  ID: {log.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* PAGINATION - Enhanced */}
              {totalPages > 1 && (
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Showing <span className="text-foreground">{paginatedLogs.length}</span> of {filteredLogs.length} Logs
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 border-2 font-bold"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>

                    <div className="flex items-center gap-1.5 mx-2">
                      {getPageNumbers().map((page, i) => (
                        <Button
                          key={i}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => typeof page === 'number' && handlePageChange(page)}
                          disabled={typeof page !== 'number'}
                          className={`h-9 w-9 text-xs font-black border-2 transition-all ${
                            currentPage === page ? 'shadow-md scale-105' : 'hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 border-2 font-bold"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Activity className="h-3 w-3" />
          Real-time Monitoring
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Clock className="h-3 w-3" />
          Audit Trail System
        </div>
      </div>
    </div>
  )
}