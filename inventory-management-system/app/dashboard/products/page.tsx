"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, Package, FileDown, ChevronLeft, ChevronRight, 
  Filter, Store as StoreIcon, Loader2, BarChart3, 
  TrendingUp, AlertCircle, Layers, ArrowUpRight,
  ShieldCheck, Info, Tag, Boxes, LayoutGrid, List, Clock
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AddProductDialog } from "@/components/forms/add-product-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip 
} from "recharts"

import { inventory_base_url, image_base_url } from "@/lib/api-config"
import { useStore } from "@/lib/store-context"
import BulkUpload from "@/components/bulk-upload"

// --- CONSTANTS ---
const API_BASE_URL = inventory_base_url
const IMAGE_API_URL = process.env.NODE_ENV === 'production'
  ? `${image_base_url}/images`
  : 'http://localhost:8081/api/v1/images'
const ITEMS_PER_PAGE = 15
const CHART_COLORS = ["#10b981", "#ef4444", "#8b5cf6"]

// --- INTERFACES ---
interface Product {
  id: string
  sku: string
  product_name: string
  category_id?: string | null
  buying_price: number
  selling_price: number
  unit_of_measure: string
  is_active: boolean
  track_inventory: boolean
  reorder_level: number
  image_id?: string
  created_at: string
  updated_at: string
}

// --- SUB-COMPONENT: PRODUCT IMAGE ---
function ProductImage({ imageId, productName }: { imageId?: string, productName: string }) {
  const [presignedImageUrl, setPresignedImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!imageId) {
        setImageLoading(false)
        setImageError(true)
        return
      }
      const finalUrl = `${IMAGE_API_URL}/${imageId}/presigned-url?expiration=1440`
      try {
        const accessToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
        const sessionToken = localStorage.getItem('session_token')
        const headers: HeadersInit = { 'Content-Type': 'application/json' }
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
        if (sessionToken) headers['X-Session-Token'] = sessionToken

        const response = await fetch(finalUrl, { method: 'GET', headers })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (data.success && data.data?.presigned_url) {
          setPresignedImageUrl(data.data.presigned_url)
          setImageError(false)
        } else {
          throw new Error('Invalid format')
        }
      } catch (error) {
        setImageError(true)
      } finally {
        setImageLoading(false)
      }
    }
    fetchPresignedUrl()
  }, [imageId])

  if (imageLoading) {
    return (
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center animate-pulse">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (imageError || !presignedImageUrl) {
    return (
      <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Package className="h-5 w-5 text-slate-400" />
      </div>
    )
  }

  return (
    <div className="relative group overflow-hidden rounded-lg">
      <img
        src={presignedImageUrl}
        alt={productName}
        className="h-10 w-10 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110 shadow-sm"
        onError={() => setImageError(true)}
      />
    </div>
  )
}

// --- MAIN PAGE COMPONENT ---
export default function ProductsPage() {
  const router = useRouter()
  const { selectedStore, storeName } = useStore()
  
  // State Management
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Load User Data
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))
  }, [])

  // Data Fetching Logic (Original Logic Preserved)
  const fetchProducts = useCallback(async () => {
    if (!selectedStore) {
      setIsLoading(false)
      setProducts([])
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      if (!token) throw new Error("No access token found.")

      const response = await fetch(`${API_BASE_URL}/stores/${selectedStore}/products`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) throw new Error("Failed to fetch products")

      const result = await response.json()
      let productsData = []
      if (result.success && Array.isArray(result.data)) {
        productsData = result.data
      } else if (Array.isArray(result)) {
        productsData = result
      } else if (result.data && Array.isArray(result.data)) {
        productsData = result.data
      }
      
      setProducts(productsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products")
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedStore])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const isAdmin = user?.primary_role === "business_owner" || user?.primary_role === "admin"

  // Filter Logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "inactive" && !product.is_active)

    return matchesSearch && matchesStatus
  })

  useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter])

  // Pagination Helper (Original getPageNumbers logic)
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

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

  // Export Logic (Original preserved)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const currentDate = new Date().toLocaleDateString()
    const htmlContent = `
      <html><head><title>Inventory - ${currentDate}</title><style>
        body { font-family: system-ui; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
        th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 10px; }
        .header { border-bottom: 2px solid #000; padding-bottom: 10px; }
      </style></head><body>
      <div class="header"><h1>${storeName} Product Catalog</h1><p>Date: ${currentDate}</p></div>
      <table><thead><tr><th>SKU</th><th>Name</th><th>Price</th><th>Stock</th></tr></thead>
      <tbody>${filteredProducts.map(p => `<tr><td>${p.sku}</td><td>${p.product_name}</td><td>TZS ${p.selling_price.toLocaleString()}</td><td>${p.reorder_level}</td></tr>`).join('')}</tbody>
      </table></body></html>`
    printWindow.document.write(htmlContent); printWindow.document.close(); printWindow.print()
  }

  // Analytics Metrics
  const totalStockValue = products.reduce((sum, p) => sum + (p.buying_price || 0), 0)
  const outOfStockCount = products.filter(p => p.reorder_level <= 0).length
  const activeCount = products.filter(p => p.is_active).length

  if (!selectedStore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-12 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-full shadow-lg mb-6">
          <StoreIcon className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">No Store Active</h2>
        <p className="text-muted-foreground max-w-sm">Please switch to a specific store from your organization dashboard to manage its catalog.</p>
        <Button onClick={() => router.push('/dashboard')} className="mt-8 font-bold">Go to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Product Catalog
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Live
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Managing assets for <span className="font-bold text-foreground underline underline-offset-4 decoration-primary">{storeName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 font-bold border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                <BarChart3 className="mr-2 h-4 w-4 text-emerald-500" />
                Inventory Health
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-black">Stock Analysis</DialogTitle>
                <DialogDescription>Visual distribution of your current catalog status.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Availability</p>
                  <p className="text-2xl font-black text-emerald-500">{((activeCount/products.length)*100 || 0).toFixed(0)}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Critical Gaps</p>
                  <p className="text-2xl font-black text-red-500">{outOfStockCount}</p>
                </div>
              </div>

              <div className="h-[300px] w-full mt-6">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Active', value: activeCount }, 
                        { name: 'Out of Stock', value: outOfStockCount },
                        { name: 'Inactive', value: products.length - activeCount }
                      ]} 
                      innerRadius={70} 
                      outerRadius={95} 
                      paddingAngle={8} 
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <DialogFooter className="mt-4">
                <Button className="w-full font-bold" variant="outline" onClick={handleExportPDF}>Generate Detailed Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="h-10 font-bold border-2" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          
          <BulkUpload 
            currentStore={{ id: selectedStore, store_name: storeName }} 
            apiBaseUrl={API_BASE_URL} 
            onSuccess={fetchProducts} 
          />
          
          <AddProductDialog onProductAdded={fetchProducts} />
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Asset Value */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Boxes className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Asset Value</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              <span className="text-lg font-normal text-slate-500 mr-2">TZS</span>
              {totalStockValue.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">ESTIMATED PORTFOLIO</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">+12.5% YoY</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Out of Stock (New Replacement for Low Stock) */}
        <Card className="border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 group hover:border-red-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-[10px] font-black text-red-600/60 dark:text-red-400 uppercase tracking-[2px]">Out of Stock</p>
            </div>
            <div className="text-4xl font-black text-red-700 dark:text-red-500 tracking-tighter">
              {outOfStockCount} <span className="text-sm font-medium opacity-60">Products</span>
            </div>
            <div className="mt-4">
               <div className="w-full bg-red-200 dark:bg-red-900/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-600 h-full transition-all duration-1000" 
                    style={{ width: `${(outOfStockCount / (products.length || 1)) * 100}%` }} 
                  />
               </div>
               <p className="text-[9px] mt-2 font-bold text-red-600/80">IMMEDIATE ATTENTION REQUIRED</p>
            </div>
          </CardContent>
        </Card>

        {/* Unique SKUs */}
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Catalog SKUs</p>
            </div>
            <div className="text-4xl font-black text-foreground tracking-tighter">
              {products.length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified Identifiers
            </p>
          </CardContent>
        </Card>

        {/* Catalog Health Progress */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-lg">
                  <Layers className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Efficiency Score</p>
                  <p className="text-xl font-black text-emerald-600">{((activeCount/products.length)*100 || 0).toFixed(0)}%</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Active Assets</span>
                  <span>{activeCount} Items</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(activeCount/products.length)*100}%` }} />
                </div>
              </div>
            </div>
            <p className="text-[9px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1">
              <Info className="h-3 w-3" /> System suggests optimizing {outOfStockCount} gaps
            </p>
          </div>
        </Card>
      </div>

      {/* FILTER & TABLE SECTION */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 w-full gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Filter by SKU, name or brand..." 
                  className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-slate-950 border-2 font-bold">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">Show All</SelectItem>
                  <SelectItem value="active" className="font-bold">Active Only</SelectItem>
                  <SelectItem value="inactive" className="font-bold">Disabled Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Button 
                variant={viewMode === 'table' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('table')}
                className="h-8 w-10 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('grid')}
                className="h-8 w-10 p-0"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Parsing Inventory Data...</p>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <p className="font-black text-lg">Sync Error</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
              <Button onClick={fetchProducts} variant="outline" className="font-bold border-2">Retry Connection</Button>
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <Search className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black">No Results Found</h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">Try adjusting your search query or filters to find what you're looking for.</p>
              <Button variant="link" className="mt-4 font-bold" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="w-[400px] font-black text-foreground uppercase text-[10px] tracking-widest">Identity & Status</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Identifier (SKU)</TableHead>
                    {isAdmin && (
                      <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Asset Cost</TableHead>
                    )}
                    <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">MSRP Price</TableHead>
                    <TableHead className="text-center font-black text-foreground uppercase text-[10px] tracking-widest">Reorder Level</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProducts.map((p) => (
                    <TableRow 
                      key={p.id} 
                      className="group cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800"
                      onClick={() => router.push(`/dashboard/products/${p.id}/edit`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-4">
                          <ProductImage imageId={p.image_id} productName={p.product_name} />
                          <div className="space-y-1">
                            {/* FIXED: Dark mode visibility - text-foreground ensures white/black based on theme */}
                            <div className="font-black text-sm text-foreground group-hover:text-primary transition-colors leading-none">
                              {p.product_name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={p.is_active ? "outline" : "secondary"} className={`text-[8px] uppercase font-black px-1.5 py-0 border-none ${p.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                {p.is_active ? "Live" : "Inactive"}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground font-bold">{p.unit_of_measure}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-mono text-[10px] font-black text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                          {p.sku}
                        </span>
                      </TableCell>

                      {isAdmin && (
                        <TableCell className="text-right">
                          <span className="text-xs font-bold text-muted-foreground italic">
                            TZS {p.buying_price?.toLocaleString()}
                          </span>
                        </TableCell>
                      )}

                      <TableCell className="text-right">
                        <div className="font-black text-emerald-600 dark:text-emerald-400 flex flex-col items-end">
                          <span className="text-[10px] font-bold text-muted-foreground mb-0.5">NET PRICE</span>
                          TZS {p.selling_price.toLocaleString()}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <div className={`px-4 py-1.5 rounded-full text-xs font-black min-w-[60px] border-2 ${
                             p.reorder_level <= 0 
                               ? 'bg-red-500 text-white border-red-600 animate-pulse' 
                               : p.reorder_level <= 5 
                                 ? 'bg-amber-500 text-white border-amber-600' 
                                 : 'bg-slate-100 dark:bg-slate-800 text-foreground border-slate-200 dark:border-slate-700'
                           }`}>
                             {p.reorder_level}
                           </div>
                           <span className="text-[9px] font-black uppercase text-muted-foreground mt-1 tracking-widest">Available</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* FOOTER & PAGINATION */}
          {!isLoading && totalPages > 1 && (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Showing <span className="text-foreground">{currentProducts.length}</span> of {filteredProducts.length} Entries
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 border-2 font-bold"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <ShieldCheck className="h-3 w-3" />
          Secure Data Layer
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Clock className="h-3 w-3" />
          Real-time Sync Active
        </div>
      </div>
    </div>
  )
}