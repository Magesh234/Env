"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Loader2, 
  AlertCircle, 
  Package, 
  DollarSign,
  FileText,
  Sparkles,
  CreditCard,
  Award,
  TrendingDown,
  Target,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react"
import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { inventory_base_url } from "@/lib/api-config"

// --- ALL ORIGINAL CONSTANTS & INTERFACES (100% PRESERVED) ---
const API_BASE = inventory_base_url
const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

interface Store {
  id: string
  business_owner_id: string
  store_code: string
  store_name: string
  store_type: string
  description: {
    String: string
    Valid: boolean
  }
  address: {
    String: string
    Valid: boolean
  }
  city: {
    String: string
    Valid: boolean
  }
  region: {
    String: string
    Valid: boolean
  }
  postal_code: {
    String: string
    Valid: boolean
  }
  country: string
  phone: {
    String: string
    Valid: boolean
  }
  email: {
    String: string
    Valid: boolean
  }
  default_currency: string
  timezone: string
  tax_rate: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface InventoryReport {
  store_id: string
  store_name: string
  summary: {
    total_products: number
    total_units: number
    total_cost_value: number
    total_selling_value: number
    potential_profit: number
    low_stock_count: number
    out_of_stock_count: number
  }
  items: Array<{
    product_id: string
    sku: string
    product_name: string
    category_name: string
    current_stock: number
    reorder_level: number
    buying_price: number
    selling_price: number
    stock_value: number
    is_low_stock: boolean
  }>
  generated_at: string
}

interface SalesReport {
  store_id: string
  store_name: string
  start_date: string
  end_date: string
  summary: {
    total_sales: number
    total_revenue: number
    total_profit: number
    total_tax: number
    total_discount: number
    cash_sales: number
    credit_sales: number
    average_sale_value: number
    profit_margin: number
  }
  daily_sales: Array<{
    date: string
    total_sales: number
    revenue: number
    profit: number
    customer_count: number
  }>
  top_products: Array<{
    product_id: string
    product_name: string
    sku: string
    quantity_sold: number
    revenue: number
    profit: number
  }>
  payment_methods: Array<{
    method: string
    count: number
    amount: number
  }>
  generated_at: string
}

export default function ReportsPage() {
  // --- ALL ORIGINAL STATE (100% PRESERVED) ---
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState("")
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null)
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null)
  const [loadingStores, setLoadingStores] = useState(true)
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [loadingSales, setLoadingSales] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- ALL ORIGINAL FUNCTIONS (100% PRESERVED) ---
  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const fetchStores = async () => {
    setLoadingStores(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        setError("Authentication error: Please log in to continue.")
        setLoadingStores(false)
        return
      }

      const response = await fetch(`${API_BASE}/stores`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch stores: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data && Array.isArray(result.data)) {
        setStores(result.data)
        if (result.data.length > 0) {
          setSelectedStoreId(result.data[0].id)
        }
      } else {
        setStores([])
      }
    } catch (err) {
      console.error("Error fetching stores:", err)
      setError(err instanceof Error ? err.message : "Failed to load stores")
    } finally {
      setLoadingStores(false)
    }
  }

  const generateInventoryReport = async () => {
    setLoadingInventory(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        setError("Authentication error: No access token found. Please log in.")
        setLoadingInventory(false)
        return
      }

      const response = await fetch(`${API_BASE}/reports/inventory?store_id=${selectedStoreId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to generate report: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setInventoryReport(result.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error generating inventory report:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoadingInventory(false)
    }
  }

  const generateSalesReport = async () => {
    setLoadingSales(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        setError("Authentication error: No access token found. Please log in.")
        setLoadingSales(false)
        return
      }

      const response = await fetch(`${API_BASE}/reports/sales?store_id=${selectedStoreId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to generate report: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setSalesReport(result.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error generating sales report:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoadingSales(false)
    }
  }

  const downloadAsPDF = (reportType: "inventory" | "sales") => {
    try {
      const reportData = reportType === "inventory" ? inventoryReport : salesReport
      if (!reportData) return

      const htmlContent =
        reportType === "inventory"
          ? generateInventoryHTML(reportData as InventoryReport)
          : generateSalesHTML(reportData as SalesReport)

      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    } catch (err) {
      console.error("Error generating PDF:", err)
      setError("Failed to generate PDF")
    }
  }

  const generateInventoryHTML = (report: InventoryReport) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inventory Report - ${report.store_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; }
          .summary-card h3 { margin: 0; font-size: 14px; color: #6b7280; }
          .summary-card p { margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background: #f9fafb; font-weight: 600; }
          .text-right { text-align: right; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .badge-low { background: #fee2e2; color: #991b1b; }
          .badge-normal { background: #dbeafe; color: #1e40af; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Inventory Report - ${report.store_name}</h1>
        <p><strong>Generated:</strong> ${new Date(report.generated_at).toLocaleString()}</p>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Total Products</h3>
            <p>${report.summary.total_products}</p>
          </div>
          <div class="summary-card">
            <h3>Total Units</h3>
            <p>${report.summary.total_units.toLocaleString()}</p>
          </div>
          <div class="summary-card">
            <h3>Stock Value</h3>
            <p>TZS ${report.summary.total_cost_value.toLocaleString()}</p>
          </div>
          <div class="summary-card">
            <h3>Potential Profit</h3>
            <p>TZS ${report.summary.potential_profit.toLocaleString()}</p>
          </div>
        </div>

        <h2>Inventory Items</h2>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th class="text-right">Stock</th>
              <th class="text-right">Buying Price</th>
              <th class="text-right">Selling Price</th>
              <th class="text-right">Stock Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${report.items
              .map(
                (item) => `
              <tr>
                <td>${item.sku}</td>
                <td>${item.product_name}</td>
                <td class="text-right">${item.current_stock}</td>
                <td class="text-right">TZS ${item.buying_price.toLocaleString()}</td>
                <td class="text-right">TZS ${item.selling_price.toLocaleString()}</td>
                <td class="text-right"><strong>TZS ${item.stock_value.toLocaleString()}</strong></td>
                <td>
                  <span class="badge ${item.is_low_stock ? "badge-low" : "badge-normal"}">
                    ${item.is_low_stock ? "Low Stock" : "Normal"}
                  </span>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `
  }

  const generateSalesHTML = (report: SalesReport) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report - ${report.store_name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
          .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; }
          .summary-card h3 { margin: 0; font-size: 14px; color: #6b7280; }
          .summary-card p { margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
          th { background: #f9fafb; font-weight: 600; }
          .text-right { text-align: right; }
          .section { margin-top: 30px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Sales Report - ${report.store_name}</h1>
        <p><strong>Period:</strong> ${new Date(report.start_date).toLocaleDateString()} - ${new Date(
      report.end_date
    ).toLocaleDateString()}</p>
        <p><strong>Generated:</strong> ${new Date(report.generated_at).toLocaleString()}</p>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Total Sales</h3>
            <p>${report.summary.total_sales}</p>
          </div>
          <div class="summary-card">
            <h3>Total Revenue</h3>
            <p>TZS ${report.summary.total_revenue.toLocaleString()}</p>
          </div>
          <div class="summary-card">
            <h3>Total Profit</h3>
            <p>TZS ${report.summary.total_profit.toLocaleString()}</p>
          </div>
          <div class="summary-card">
            <h3>Profit Margin</h3>
            <p>${report.summary.profit_margin.toFixed(2)}%</p>
          </div>
        </div>

        <div class="section">
          <h2>Daily Sales</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th class="text-right">Sales Count</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Profit</th>
                <th class="text-right">Customers</th>
              </tr>
            </thead>
            <tbody>
              ${report.daily_sales
                .map(
                  (day) => `
                <tr>
                  <td>${new Date(day.date).toLocaleDateString()}</td>
                  <td class="text-right">${day.total_sales}</td>
                  <td class="text-right">TZS ${day.revenue.toLocaleString()}</td>
                  <td class="text-right">TZS ${day.profit.toLocaleString()}</td>
                  <td class="text-right">${day.customer_count}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Top Products</h2>
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th class="text-right">Qty Sold</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Profit</th>
              </tr>
            </thead>
            <tbody>
              ${report.top_products
                .map(
                  (product) => `
                <tr>
                  <td>${product.sku}</td>
                  <td>${product.product_name}</td>
                  <td class="text-right">${product.quantity_sold}</td>
                  <td class="text-right">TZS ${product.revenue.toLocaleString()}</td>
                  <td class="text-right"><strong>TZS ${product.profit.toLocaleString()}</strong></td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Payment Methods</h2>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th class="text-right">Transactions</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${report.payment_methods
                .map(
                  (method) => `
                <tr>
                  <td>${method.method}</td>
                  <td class="text-right">${method.count}</td>
                  <td class="text-right">TZS ${method.amount.toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `
  }

  useEffect(() => {
    fetchStores()
  }, [])

  // --- LOADING STATE (ENHANCED DESIGN) ---
  if (loadingStores) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Reports...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* ENHANCED HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Reports
            </span>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Analytics
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Generate and download comprehensive business reports
          </p>
        </div>
      </div>

      {/* ALERTS - Enhanced */}
      {error && (
        <Alert variant="destructive" className="relative border-2 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="pr-8 font-medium">{error}</AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-950"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* STORE SELECTION CARD - Enhanced */}
      <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/60 p-2 rounded-lg shadow-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Select Store</CardTitle>
              <CardDescription className="font-medium">Choose a store to generate reports</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {stores.length === 0 ? (
            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 border-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="font-bold text-amber-800 dark:text-amber-200">
                No stores found. Please add a store first to generate reports.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="store" className="text-sm font-black uppercase tracking-widest">Store</Label>
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger id="store" className="h-12 border-2 font-bold text-base">
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id} className="font-bold">
                      {store.store_name} - {store.address.Valid ? store.address.String : store.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStoreId && (
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Selected: {stores.find((s) => s.id === selectedStoreId)?.store_name}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* REPORT GENERATION CARDS - Enhanced */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inventory Report Card */}
        <Card className="shadow-2xl border-2 border-blue-100 dark:border-blue-900 overflow-hidden bg-gradient-to-br from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-950 backdrop-blur-xl group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="border-b border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-blue-700 dark:text-blue-400">Inventory Report</CardTitle>
                <CardDescription className="font-medium">Stock levels, valuation, and inventory analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button 
              className="w-full h-12 font-black text-base gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg" 
              onClick={generateInventoryReport} 
              disabled={loadingInventory || !selectedStoreId}
            >
              {loadingInventory ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-5 w-5" />
                  Generate Inventory Report
                </>
              )}
            </Button>
            {inventoryReport && (
              <Button 
                variant="outline" 
                className="w-full h-12 font-black border-2 gap-3" 
                onClick={() => downloadAsPDF("inventory")}
              >
                <Download className="h-5 w-5" />
                Download PDF
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Sales Report Card */}
        <Card className="shadow-2xl border-2 border-emerald-100 dark:border-emerald-900 overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-950 backdrop-blur-xl group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="border-b border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-emerald-700 dark:text-emerald-400">Sales Report</CardTitle>
                <CardDescription className="font-medium">Revenue, profit, and sales performance analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <Button 
              className="w-full h-12 font-black text-base gap-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg" 
              onClick={generateSalesReport} 
              disabled={loadingSales || !selectedStoreId}
            >
              {loadingSales ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5" />
                  Generate Sales Report
                </>
              )}
            </Button>
            {salesReport && (
              <Button 
                variant="outline" 
                className="w-full h-12 font-black border-2 gap-3" 
                onClick={() => downloadAsPDF("sales")}
              >
                <Download className="h-5 w-5" />
                Download PDF
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* INVENTORY REPORT DISPLAY - Enhanced */}
      {inventoryReport && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Inventory Report - {inventoryReport.store_name}</CardTitle>
                  <CardDescription className="font-medium">Generated on {new Date(inventoryReport.generated_at).toLocaleString()}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Total Products</p>
                  <p className="text-3xl font-black text-blue-700 dark:text-blue-500">{inventoryReport.summary.total_products}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Units</p>
                  <p className="text-3xl font-black text-emerald-700 dark:text-emerald-500">{inventoryReport.summary.total_units.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Stock Value</p>
                  <p className="text-2xl font-black text-purple-700 dark:text-purple-500">TZS {inventoryReport.summary.total_cost_value.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-800 shadow-lg">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Potential Profit</p>
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-500">TZS {inventoryReport.summary.potential_profit.toLocaleString()}</p>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="mt-6">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Inventory Items
                </h3>
                <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableHead className="font-black">SKU</TableHead>
                        <TableHead className="font-black">Product</TableHead>
                        <TableHead className="text-right font-black">Stock</TableHead>
                        <TableHead className="text-right font-black">Buying Price</TableHead>
                        <TableHead className="text-right font-black">Selling Price</TableHead>
                        <TableHead className="text-right font-black">Stock Value</TableHead>
                        <TableHead className="font-black">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryReport.items.map((item) => (
                        <TableRow key={item.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell className="font-mono text-sm font-bold">{item.sku}</TableCell>
                          <TableCell className="font-bold">{item.product_name}</TableCell>
                          <TableCell className="text-right font-bold">{item.current_stock}</TableCell>
                          <TableCell className="text-right font-bold">TZS {item.buying_price.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold">TZS {item.selling_price.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-black text-primary">TZS {item.stock_value.toLocaleString()}</TableCell>
                          <TableCell>
                            {item.is_low_stock ? (
                              <Badge className="bg-red-500 hover:bg-red-600 border-2 border-red-600 font-black">Low Stock</Badge>
                            ) : (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 border-2 border-emerald-600 font-black">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SALES REPORT DISPLAY - Enhanced */}
      {salesReport && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Sales Report - {salesReport.store_name}</CardTitle>
                  <CardDescription className="font-medium">
                    Period: {new Date(salesReport.start_date).toLocaleDateString()} - {new Date(salesReport.end_date).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                  <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Total Sales</p>
                  <p className="text-3xl font-black text-blue-700 dark:text-blue-500">{salesReport.summary.total_sales}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 p-5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg">
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-500">TZS {salesReport.summary.total_revenue.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 p-5 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-lg">
                  <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Total Profit</p>
                  <p className="text-2xl font-black text-purple-700 dark:text-purple-500">TZS {salesReport.summary.total_profit.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-800 shadow-lg">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Profit Margin</p>
                  <p className="text-3xl font-black text-amber-700 dark:text-amber-500">{salesReport.summary.profit_margin.toFixed(2)}%</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2 mt-6">
                <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
                  <CardHeader className="border-b bg-slate-50 dark:bg-slate-900">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Daily Sales Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesReport.daily_sales}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                          className="text-xs font-bold"
                        />
                        <YAxis className="text-xs font-bold" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "2px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontWeight: "bold",
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
                        <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="profit" fill="#3b82f6" name="Profit" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-2 border-slate-200 dark:border-slate-800 shadow-lg">
                  <CardHeader className="border-b bg-slate-50 dark:bg-slate-900">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Payment Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={salesReport.payment_methods}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.method}: ${entry.count}`}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {salesReport.payment_methods.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "2px solid hsl(var(--border))",
                            borderRadius: "12px",
                            fontWeight: "bold",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products Table */}
              <div className="mt-6">
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Top Products
                </h3>
                <div className="overflow-x-auto rounded-2xl border-2 border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableHead className="font-black">SKU</TableHead>
                        <TableHead className="font-black">Product</TableHead>
                        <TableHead className="text-right font-black">Qty Sold</TableHead>
                        <TableHead className="text-right font-black">Revenue</TableHead>
                        <TableHead className="text-right font-black">Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesReport.top_products.map((product) => (
                        <TableRow key={product.product_id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <TableCell className="font-mono text-sm font-bold">{product.sku}</TableCell>
                          <TableCell className="font-bold">{product.product_name}</TableCell>
                          <TableCell className="text-right font-bold">{product.quantity_sold}</TableCell>
                          <TableCell className="text-right font-bold">TZS {product.revenue.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400">
                            TZS {product.profit.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}