"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { CreatePurchaseOrderDialog } from "@/components/forms/create-purchase-order-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ShoppingBag, Search, TrendingUp, Clock, CheckCircle, Loader2, 
  Eye, Send, XCircle, Edit2, Package, FileDown, Plus, 
  AlertCircle, TrendingDown, Archive, BarChart3, Layers,
  ShieldCheck, Info, ArrowUpRight
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { inventory_base_url } from "@/lib/api-config"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip 
} from "recharts"

const API_BASE = inventory_base_url
const CHART_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#8b5cf6"]

interface PurchaseOrder {
  id: string
  po_number: string
  store_id: string
  store_name?: string
  supplier_id: string
  supplier_name?: string
  po_date: string
  order_date?: string
  expected_delivery_date: string | { Time: string; Valid: boolean }
  total_amount: number
  po_status: string
  status?: string
  received_date?: string
  received_at?: { Time: string; Valid: boolean }
  created_at: string
  items?: OrderItem[]
  total_items?: number
  received_quantity?: number
  total_quantity?: number
}

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  sku: string
  quantity_ordered: number
  quantity_received: number
  unit_price: number
}

interface ReceiveItem {
  product_id: string
  quantity_received: number
}

interface Store {
  id: string
  store_name: string
  location?: string | { String: string; Valid: boolean }
}

interface Supplier {
  id: string
  supplier_name: string
  contact_person?: string | { String: string; Valid: boolean }
}

interface Product {
  id: string
  product_name: string
  buying_price: number
  selling_price: number
  sku: string
}

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null)
  const [receiveDialog, setReceiveDialog] = useState(false)
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([])
  const { toast } = useToast()

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const normalizePurchaseOrder = (order: any): PurchaseOrder => {
    const getDate = (dateField: any): string => {
      if (!dateField) return ""
      if (typeof dateField === "string") return dateField
      if (dateField.Time && dateField.Valid) return dateField.Time
      return ""
    }

    const getStatus = (order: any): string => {
      return order.po_status || order.status || "unknown"
    }

    return {
      ...order,
      order_date: order.order_date || order.po_date || order.created_at,
      po_date: order.po_date || order.order_date || order.created_at,
      status: getStatus(order),
      po_status: getStatus(order),
      expected_delivery_date: getDate(order.expected_delivery_date),
      received_date: order.received_date || getDate(order.received_at),
    }
  }

  const fetchPurchaseOrders = async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      const token = getToken()
      if (!token) {
        setFetchError("Authentication error: No access token found. Please log in.")
        return
      }

      const response = await fetch(`${API_BASE}/purchase-orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch purchase orders: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data && Array.isArray(result.data.purchase_orders)) {
        const normalizedOrders = result.data.purchase_orders.map(normalizePurchaseOrder)
        setPurchaseOrders(normalizedOrders)
      } else if (result.success && Array.isArray(result.data)) {
        const normalizedOrders = result.data.map(normalizePurchaseOrder)
        setPurchaseOrders(normalizedOrders)
      } else {
        setPurchaseOrders([])
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error)
      setFetchError(error instanceof Error ? error.message : "An unexpected error occurred")
      toast({
        title: "Error",
        description: "Failed to load purchase orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  const handleApprove = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE}/purchase-orders/${orderId}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to approve purchase order")
      }

      toast({
        title: "Success",
        description: "Purchase order approved successfully",
      })
      fetchPurchaseOrders()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve order",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSend = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE}/purchase-orders/${orderId}/send`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ send_email: true }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send purchase order")
      }

      toast({
        title: "Success",
        description: "Purchase order sent to supplier",
      })
      fetchPurchaseOrders()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send order",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openReceiveDialog = async (order: PurchaseOrder) => {
    setSelectedOrder(order)
    
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE}/purchase-orders/${order.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const result = await response.json()
      
      if (result.success && result.data && result.data.items) {
        setReceiveItems(
          result.data.items.map((item: OrderItem) => ({
            product_id: item.product_id,
            quantity_received: item.quantity_ordered - item.quantity_received,
          }))
        )
      }
    } catch (error) {
      console.error("Error fetching order details:", error)
    }
    
    setReceiveDialog(true)
  }

  const handleReceive = async () => {
    if (!selectedOrder) return

    setActionLoading(selectedOrder.id)
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE}/purchase-orders/${selectedOrder.id}/receive`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: receiveItems }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to receive purchase order")
      }

      toast({
        title: "Success",
        description: "Purchase order received and inventory updated",
      })
      setReceiveDialog(false)
      fetchPurchaseOrders()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to receive order",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this purchase order?")) return

    setActionLoading(orderId)
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE}/purchase-orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel purchase order")
      }

      toast({
        title: "Success",
        description: "Purchase order cancelled",
      })
      fetchPurchaseOrders()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel order",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getOrderStatus = (order: PurchaseOrder): string => {
    return order.po_status || order.status || "unknown"
  }

  const filteredOrders = purchaseOrders.filter(
    (order) =>
      order.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.store_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const draftOrders = purchaseOrders.filter((po) => getOrderStatus(po) === "draft")
  const pendingOrders = purchaseOrders.filter((po) => getOrderStatus(po) === "pending")
  const confirmedOrders = purchaseOrders.filter((po) => ["confirmed", "approved", "sent"].includes(getOrderStatus(po)))
  const receivedOrders = purchaseOrders.filter((po) => getOrderStatus(po) === "received")
  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0)
  const pendingValue = [...draftOrders, ...pendingOrders].reduce((sum, po) => sum + po.total_amount, 0)

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return <Badge variant="secondary" className="bg-gray-500/10 text-gray-500 border-none font-black text-[8px] uppercase px-2 py-0">Draft</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-none font-black text-[8px] uppercase px-2 py-0">Pending</Badge>
      case "confirmed":
      case "approved":
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none font-black text-[8px] uppercase px-2 py-0">Approved</Badge>
      case "sent":
        return <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 border-none font-black text-[8px] uppercase px-2 py-0">Sent</Badge>
      case "received":
        return <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase px-2 py-0">Received</Badge>
      case "cancelled":
        return <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-none font-black text-[8px] uppercase px-2 py-0">Cancelled</Badge>
      default:
        return <Badge variant="secondary" className="font-black text-[8px] uppercase">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return "N/A"
    }
  }

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF')
      return
    }

    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Orders Report - ${currentDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #333; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th { background-color: #f3f4f6; padding: 10px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9fafb; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Purchase Orders Report</h1>
            <p>Generated on ${currentDate}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Store</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => `
                <tr>
                  <td>${order.po_number}</td>
                  <td>${formatDate(order.po_date)}</td>
                  <td>${order.supplier_name || 'N/A'}</td>
                  <td>${order.store_name || 'N/A'}</td>
                  <td>TZS ${order.total_amount.toLocaleString()}</td>
                  <td>${getOrderStatus(order)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const renderActionButtons = (order: PurchaseOrder) => {
    const status = getOrderStatus(order)
    const isProcessing = actionLoading === order.id

    if (status === "draft") {
      return (
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={() => handleApprove(order.id)} disabled={isProcessing} className="h-8 font-bold">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
          <Button variant="outline" size="sm" disabled={isProcessing} className="h-8 w-8 p-0 border-2">
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    if (status === "pending") {
      return (
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={() => handleApprove(order.id)} disabled={isProcessing} className="h-8 font-bold">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCancel(order.id)} disabled={isProcessing} className="h-8 font-bold border-2">
            Reject
          </Button>
        </div>
      )
    }

    if (status === "confirmed" || status === "approved") {
      return (
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={() => handleSend(order.id)} disabled={isProcessing} className="h-8 font-bold">
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" />Send</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleCancel(order.id)} disabled={isProcessing} className="h-8 w-8 p-0 border-2">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    if (status === "sent") {
      return (
        <Button variant="default" size="sm" onClick={() => openReceiveDialog(order)} disabled={isProcessing} className="h-8 font-bold">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Package className="h-4 w-4 mr-1" />Receive</>}
        </Button>
      )
    }

    return (
      <Button variant="outline" size="sm" className="h-8 font-bold border-2">
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Purchase Orders
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Procurement
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Manage supplier orders and inventory procurement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 font-bold border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                <BarChart3 className="mr-2 h-4 w-4 text-emerald-500" />
                Order Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-black">Order Distribution</DialogTitle>
                <DialogDescription>Visual breakdown of purchase order statuses</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Completion Rate</p>
                  <p className="text-2xl font-black text-emerald-500">{((receivedOrders.length/purchaseOrders.length)*100 || 0).toFixed(0)}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Orders</p>
                  <p className="text-2xl font-black text-blue-500">{confirmedOrders.length}</p>
                </div>
              </div>

              <div className="h-[300px] w-full mt-6">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Received', value: receivedOrders.length }, 
                        { name: 'Draft/Pending', value: draftOrders.length + pendingOrders.length },
                        { name: 'Approved', value: confirmedOrders.length }
                      ]} 
                      innerRadius={70} 
                      outerRadius={95} 
                      paddingAngle={8} 
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#3b82f6" />
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DialogContent>
          </Dialog>

          {purchaseOrders.length > 0 && (
            <Button variant="outline" className="h-10 font-bold border-2" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
          
          <CreatePurchaseOrderDialog onOrderCreated={fetchPurchaseOrders} />
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShoppingBag className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <ShoppingBag className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Orders</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              {purchaseOrders.length}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">ALL TIME PROCUREMENT</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending/Draft */}
        <Card className="border-yellow-100 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20 group hover:border-yellow-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-[10px] font-black text-yellow-600/60 dark:text-yellow-400 uppercase tracking-[2px]">Pending/Draft</p>
            </div>
            <div className="text-4xl font-black text-yellow-700 dark:text-yellow-500 tracking-tighter">
              {draftOrders.length + pendingOrders.length}
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-yellow-600/80">TZS {(pendingValue / 1000000).toFixed(2)}M value</p>
              <div className="w-full bg-yellow-200 dark:bg-yellow-900/40 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-yellow-600 h-full transition-all duration-1000" 
                  style={{ width: `${((draftOrders.length + pendingOrders.length) / (purchaseOrders.length || 1)) * 100}%` }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved */}
        <Card className="border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[10px] font-black text-blue-600/60 dark:text-blue-400 uppercase tracking-[2px]">Approved</p>
            </div>
            <div className="text-4xl font-black text-blue-700 dark:text-blue-500 tracking-tighter">
              {confirmedOrders.length}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <Send className="h-3 w-3 text-blue-500" /> Awaiting delivery
            </p>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Total Value</p>
                  <p className="text-xl font-black text-emerald-600">TZS {(totalValue / 1000000).toFixed(2)}M</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">All Orders</span>
                  <span>{purchaseOrders.length} POs</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
            <p className="text-[9px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1">
              <Info className="h-3 w-3" /> Cumulative procurement spend
            </p>
          </div>
        </Card>
      </div>

      {/* ERROR STATE */}
      {fetchError && (
        <Card className="border-red-500 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="font-black text-lg text-red-700 dark:text-red-500 mb-2">Error Loading Purchase Orders</p>
              <p className="text-sm text-muted-foreground mb-4">{fetchError}</p>
              <Button variant="outline" onClick={fetchPurchaseOrders} className="font-bold border-2">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LOADING STATE */}
      {isLoading ? (
        <Card className="shadow-2xl border-slate-200 dark:border-slate-800">
          <CardContent className="py-32">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Purchase Orders...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
              All Orders
            </TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
              Draft ({draftOrders.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
              Approved ({confirmedOrders.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
              Received ({receivedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="text-2xl font-black">All Purchase Orders</CardTitle>
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by PO number, supplier, or store..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">PO Number</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Date</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Supplier</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Store</TableHead>
                        <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Total Amount</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Expected Date</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Status</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-32">
                            <div className="flex flex-col items-center gap-4">
                              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full">
                                <Search className="h-10 w-10 text-slate-400" />
                              </div>
                              <div>
                                <h3 className="text-xl font-black">No Purchase Orders Found</h3>
                                <p className="text-muted-foreground mt-2">Try adjusting your search filters</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow key={order.id} className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800">
                            <TableCell>
                              <span className="font-mono text-sm font-black text-foreground">{order.po_number}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-bold text-muted-foreground">{formatDate(order.po_date)}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-bold text-foreground">{order.supplier_name || "N/A"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground font-medium">{order.store_name || "N/A"}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-black text-emerald-600 dark:text-emerald-400">
                                TZS {order.total_amount.toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-bold text-muted-foreground">
                                {formatDate(
                                  typeof order.expected_delivery_date === "string"
                                    ? order.expected_delivery_date
                                    : order.expected_delivery_date?.Time || ""
                                )}
                              </span>
                            </TableCell>
                            <TableCell>{getStatusBadge(getOrderStatus(order))}</TableCell>
                            <TableCell>{renderActionButtons(order)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-2xl font-black">Draft Purchase Orders</CardTitle>
                <CardDescription className="font-medium">Orders in draft status</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">PO Number</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Date</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Supplier</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Store</TableHead>
                        <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Total Amount</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {draftOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-20">
                            <div className="flex flex-col items-center gap-3">
                              <Archive className="h-10 w-10 text-slate-400" />
                              <p className="font-black text-muted-foreground">No draft orders</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        draftOrders.map((order) => (
                          <TableRow key={order.id} className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b">
                            <TableCell className="font-mono text-sm font-black text-foreground">{order.po_number}</TableCell>
                            <TableCell className="text-xs font-bold text-muted-foreground">{formatDate(order.po_date)}</TableCell>
                            <TableCell className="font-bold text-foreground">{order.supplier_name || "N/A"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground font-medium">{order.store_name || "N/A"}</TableCell>
                            <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400">
                              TZS {order.total_amount.toLocaleString()}
                            </TableCell>
                            <TableCell>{renderActionButtons(order)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-2xl font-black">Pending Purchase Orders</CardTitle>
                <CardDescription className="font-medium">Orders awaiting approval</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">PO Number</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Date</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Supplier</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Store</TableHead>
                        <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Total Amount</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-20">
                            <div className="flex flex-col items-center gap-3">
                              <Clock className="h-10 w-10 text-slate-400" />
                              <p className="font-black text-muted-foreground">No pending orders</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingOrders.map((order) => (
                          <TableRow key={order.id} className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b">
                            <TableCell className="font-mono text-sm font-black text-foreground">{order.po_number}</TableCell>
                            <TableCell className="text-xs font-bold text-muted-foreground">{formatDate(order.po_date)}</TableCell>
                            <TableCell className="font-bold text-foreground">{order.supplier_name || "N/A"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground font-medium">{order.store_name || "N/A"}</TableCell>
                            <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400">
                              TZS {order.total_amount.toLocaleString()}
                            </TableCell>
                            <TableCell>{renderActionButtons(order)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-2xl font-black">Approved Purchase Orders</CardTitle>
                <CardDescription className="font-medium">Orders approved and awaiting delivery</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">PO Number</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Supplier</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Store</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Expected Date</TableHead>
                        <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Total Amount</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-20">
                            <div className="flex flex-col items-center gap-3">
                              <CheckCircle className="h-10 w-10 text-slate-400" />
                              <p className="font-black text-muted-foreground">No approved orders</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        confirmedOrders.map((order) => (
                          <TableRow key={order.id} className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b">
                            <TableCell className="font-mono text-sm font-black text-foreground">{order.po_number}</TableCell>
                            <TableCell className="font-bold text-foreground">{order.supplier_name || "N/A"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground font-medium">{order.store_name || "N/A"}</TableCell>
                            <TableCell className="text-xs font-bold text-muted-foreground">
                              {formatDate(
                                typeof order.expected_delivery_date === "string"
                                  ? order.expected_delivery_date
                                  : order.expected_delivery_date?.Time || ""
                              )}
                            </TableCell>
                            <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400">
                              TZS {order.total_amount.toLocaleString()}
                            </TableCell>
                            <TableCell>{renderActionButtons(order)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-2xl font-black">Received Purchase Orders</CardTitle>
                <CardDescription className="font-medium">Completed orders</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                      <TableRow className="hover:bg-transparent border-b-2">
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">PO Number</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Supplier</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Store</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Received Date</TableHead>
                        <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Total Amount</TableHead>
                        <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receivedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-20">
                            <div className="flex flex-col items-center gap-3">
                              <Package className="h-10 w-10 text-slate-400" />
                              <p className="font-black text-muted-foreground">No received orders</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        receivedOrders.map((order) => (
                          <TableRow key={order.id} className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b">
                            <TableCell className="font-mono text-sm font-black text-foreground">{order.po_number}</TableCell>
                            <TableCell className="font-bold text-foreground">{order.supplier_name || "N/A"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground font-medium">{order.store_name || "N/A"}</TableCell>
                            <TableCell className="text-xs font-bold text-muted-foreground">{formatDate(order.received_date || "")}</TableCell>
                            <TableCell className="text-right font-black text-emerald-600 dark:text-emerald-400">
                              TZS {order.total_amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="h-8 font-bold border-2">
                                <Eye className="h-4 w-4 mr-1" />
                                View Receipt
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* RECEIVE DIALOG */}
      <Dialog open={receiveDialog} onOpenChange={setReceiveDialog}>
        <DialogContent className="max-w-2xl border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <DialogHeader className="pt-4">
            <DialogTitle className="text-2xl font-black">Receive Purchase Order</DialogTitle>
            <DialogDescription className="font-medium">
              Confirm quantities received for {selectedOrder?.po_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {receiveItems.map((item, index) => (
              <div key={item.product_id} className="grid grid-cols-3 gap-4 items-center border-b pb-4 border-slate-100 dark:border-slate-800">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground font-bold uppercase">Product ID</Label>
                  <p className="text-sm font-black text-foreground">{item.product_id}</p>
                </div>
                <div>
                  <Label htmlFor={`qty-${index}`} className="text-xs font-bold uppercase">Qty Received</Label>
                  <Input
                    id={`qty-${index}`}
                    type="number"
                    min="0"
                    value={item.quantity_received}
                    onChange={(e) => {
                      const newItems = [...receiveItems]
                      newItems[index].quantity_received = parseInt(e.target.value) || 0
                      setReceiveItems(newItems)
                    }}
                    className="mt-1 border-2 font-bold"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReceiveDialog(false)} className="font-bold border-2">
              Cancel
            </Button>
            <Button onClick={handleReceive} disabled={!!actionLoading} className="font-bold">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <ShieldCheck className="h-3 w-3" />
          Secure Procurement
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Clock className="h-3 w-3" />
          Real-time Updates
        </div>
      </div>
    </div>
  )
}