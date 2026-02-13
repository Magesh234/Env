"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Package, ArrowRightLeft, CheckCircle, Clock, XCircle, Loader2, 
  AlertCircle, TrendingUp, Layers, ShieldCheck, Info, BarChart3,
  Search, FileDown, Archive, Truck, PackageCheck
} from "lucide-react"
import { CreateTransferDialog } from "@/components/forms/create-transfer-dialog"
import { inventory_base_url } from "@/lib/api-config"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip 
} from "recharts"

const API_BASE = inventory_base_url
const TRANSFERS_ENDPOINT = `${API_BASE}/transfers`
const CHART_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"]

interface TransferItem {
  id: string
  transfer_id: string
  product_id: string
  quantity_requested: number
  quantity_shipped: number
  quantity_received: number
  unit_cost: number
  notes: string
  product_name: string
  sku: string
  unit_price: number
}

interface Transfer {
  id: string
  transfer_number: string
  from_store_id: string
  to_store_id: string
  transfer_status: string
  requested_by: string
  requested_at: string
  notes: string
  from_store_name: string
  to_store_name: string
  items: TransferItem[]
  total_items: number
  total_value: number
  approved_by?: string
  approved_at?: string
  shipped_at?: string
  received_at?: string
  cancelled_at?: string
}

export default function StockTransferPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const fetchTransfers = async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      const token = getToken()
      if (!token) {
        setFetchError("Authentication error: No access token found. Please log in.")
        return
      }

      const response = await fetch(TRANSFERS_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch transfers: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data?.transfers && Array.isArray(result.data.transfers)) {
        setTransfers(result.data.transfers)
      } else {
        setTransfers([])
      }
    } catch (error) {
      console.error("Error fetching transfers:", error)
      setFetchError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransferAction = async (transferId: string, action: string) => {
    setActionLoading(`${transferId}-${action}`)

    try {
      const token = getToken()
      if (!token) {
        alert("Authentication error: Please log in.")
        return
      }

      // Find the transfer to get its items
      const transfer = transfers.find((t) => t.id === transferId)
      let requestBody: any = {}

      // Ship and receive actions require items in the request body
      if (action === "ship" && transfer) {
        requestBody = {
          items: transfer.items.map((item) => ({
            product_id: item.product_id,
            quantity_shipped: item.quantity_requested,
          })),
        }
      } else if (action === "receive" && transfer) {
        requestBody = {
          items: transfer.items.map((item) => ({
            product_id: item.product_id,
            quantity_received: item.quantity_shipped,
          })),
        }
      }

      const response = await fetch(`${TRANSFERS_ENDPOINT}/${transferId}/${action}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to ${action} transfer: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()
      if (result.success) {
        alert(`Transfer ${action}ed successfully!`)
        fetchTransfers()
      }
    } catch (error) {
      console.error(`Error ${action}ing transfer:`, error)
      alert(error instanceof Error ? error.message : `Failed to ${action} transfer`)
    } finally {
      setActionLoading(null)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [])

  const pendingCount = transfers.filter((t) => t.transfer_status === "pending").length
  const approvedCount = transfers.filter((t) => t.transfer_status === "approved").length
  const inTransitCount = transfers.filter((t) => t.transfer_status === "in_transit").length
  const completedCount = transfers.filter((t) => t.transfer_status === "completed").length
  const cancelledCount = transfers.filter((t) => t.transfer_status === "cancelled").length
  const totalValue = transfers.reduce((sum, t) => sum + t.total_value, 0)

  const filteredTransfers = transfers.filter(
    (transfer) =>
      transfer.transfer_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.from_store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_store_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase px-2 py-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-none font-black text-[8px] uppercase px-2 py-0">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-none font-black text-[8px] uppercase px-2 py-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "in_transit":
        return (
          <Badge variant="default" className="bg-purple-500/10 text-purple-500 border-none font-black text-[8px] uppercase px-2 py-0">
            <ArrowRightLeft className="h-3 w-3 mr-1" />
            In Transit
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-none font-black text-[8px] uppercase px-2 py-0">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="font-black text-[8px] uppercase">{status}</Badge>
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
          <title>Stock Transfers Report - ${currentDate}</title>
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
            <h1>Stock Transfers Report</h1>
            <p>Generated on ${currentDate}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>From Store</th>
                <th>To Store</th>
                <th>Items</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransfers.map(transfer => `
                <tr>
                  <td>${transfer.transfer_number}</td>
                  <td>${transfer.from_store_name}</td>
                  <td>${transfer.to_store_name}</td>
                  <td>${transfer.total_items}</td>
                  <td>TZS ${transfer.total_value.toLocaleString()}</td>
                  <td>${transfer.transfer_status}</td>
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

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Stock Transfer
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Logistics
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Manage inventory transfers between stores
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 font-bold border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                <BarChart3 className="mr-2 h-4 w-4 text-emerald-500" />
                Transfer Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-black">Transfer Distribution</DialogTitle>
                <DialogDescription>Visual breakdown of transfer statuses</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Completion Rate</p>
                  <p className="text-2xl font-black text-emerald-500">{((completedCount/transfers.length)*100 || 0).toFixed(0)}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">In Progress</p>
                  <p className="text-2xl font-black text-blue-500">{inTransitCount + approvedCount}</p>
                </div>
              </div>

              <div className="h-[300px] w-full mt-6">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Completed', value: completedCount }, 
                        { name: 'Pending', value: pendingCount },
                        { name: 'In Transit', value: inTransitCount },
                        { name: 'Cancelled', value: cancelledCount }
                      ]} 
                      innerRadius={70} 
                      outerRadius={95} 
                      paddingAngle={8} 
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#ef4444" />
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

          {transfers.length > 0 && (
            <Button variant="outline" className="h-10 font-bold border-2" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
          
          <CreateTransferDialog onTransferCreated={fetchTransfers} />
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Transfers */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Package className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Package className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Transfers</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              {transfers.length}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">TZS {totalValue.toLocaleString()}</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval */}
        <Card className="border-orange-100 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20 group hover:border-orange-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-500/10 p-2 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-[10px] font-black text-orange-600/60 dark:text-orange-400 uppercase tracking-[2px]">Pending Approval</p>
            </div>
            <div className="text-4xl font-black text-orange-700 dark:text-orange-500 tracking-tighter">
              {pendingCount}
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-orange-600/80">Awaiting approval</p>
              <div className="w-full bg-orange-200 dark:bg-orange-900/40 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-orange-600 h-full transition-all duration-1000" 
                  style={{ width: `${(pendingCount / (transfers.length || 1)) * 100}%` }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Transit */}
        <Card className="border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-purple-500/10 p-2 rounded-lg">
                <Truck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-[10px] font-black text-purple-600/60 dark:text-purple-400 uppercase tracking-[2px]">In Transit</p>
            </div>
            <div className="text-4xl font-black text-purple-700 dark:text-purple-500 tracking-tighter">
              {inTransitCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3 text-purple-500" /> Being transferred
            </p>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Completed</p>
                  <p className="text-xl font-black text-emerald-600">{completedCount}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span>{((completedCount/transfers.length)*100 || 0).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(completedCount/transfers.length)*100}%` }} />
                </div>
              </div>
            </div>
            <p className="text-[9px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1">
              <Info className="h-3 w-3" /> Successfully transferred
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
              <p className="font-black text-lg text-red-700 dark:text-red-500 mb-2">Error Loading Transfers</p>
              <p className="text-sm text-muted-foreground mb-4">{fetchError}</p>
              <Button variant="outline" onClick={fetchTransfers} className="font-bold border-2">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MAIN TABLE CARD */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black">Transfer History</CardTitle>
              <CardDescription className="font-medium mt-1">View and manage all stock transfers between stores</CardDescription>
            </div>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by transfer number or store..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium"
              />
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
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Transfers...</p>
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                {searchTerm ? (
                  <Search className="h-10 w-10 text-slate-400" />
                ) : (
                  <Package className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <h3 className="text-xl font-black">
                {searchTerm ? "No Results Found" : "No Transfers Found"}
              </h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                {searchTerm 
                  ? "Try adjusting your search query" 
                  : "Create your first transfer to get started"}
              </p>
              {searchTerm && (
                <Button variant="link" className="mt-4 font-bold" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Transfer #</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Products</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">From Store</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">To Store</TableHead>
                    <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Total Items</TableHead>
                    <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Total Value</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Requested Date</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => (
                    <TableRow 
                      key={transfer.id} 
                      className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800"
                    >
                      <TableCell>
                        <span className="font-mono text-sm font-black text-foreground">{transfer.transfer_number}</span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs space-y-1">
                          {transfer.items.map((item) => (
                            <div key={item.id} className="text-xs font-medium text-muted-foreground">
                              <span className="font-bold text-foreground">{item.product_name}</span>
                              <span className="font-mono text-[10px] mx-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {item.sku}
                              </span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-black">x {item.quantity_requested}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-foreground">{transfer.from_store_name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-foreground">{transfer.to_store_name}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-black text-foreground">{transfer.total_items}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-black text-emerald-600 dark:text-emerald-400">
                          TZS {transfer.total_value.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-muted-foreground">
                          {new Date(transfer.requested_at).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(transfer.transfer_status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {transfer.transfer_status === "pending" && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="h-8 font-bold"
                                onClick={() => handleTransferAction(transfer.id, "approve")}
                                disabled={actionLoading === `${transfer.id}-approve`}
                              >
                                {actionLoading === `${transfer.id}-approve` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 font-bold border-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => handleTransferAction(transfer.id, "cancel")}
                                disabled={actionLoading === `${transfer.id}-cancel`}
                              >
                                {actionLoading === `${transfer.id}-cancel` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Cancel"
                                )}
                              </Button>
                            </>
                          )}
                          {transfer.transfer_status === "approved" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 font-bold"
                              onClick={() => handleTransferAction(transfer.id, "ship")}
                              disabled={actionLoading === `${transfer.id}-ship`}
                            >
                              {actionLoading === `${transfer.id}-ship` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Truck className="h-3 w-3 mr-1" />
                                  Ship
                                </>
                              )}
                            </Button>
                          )}
                          {transfer.transfer_status === "in_transit" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 font-bold"
                              onClick={() => handleTransferAction(transfer.id, "receive")}
                              disabled={actionLoading === `${transfer.id}-receive`}
                            >
                              {actionLoading === `${transfer.id}-receive` ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <PackageCheck className="h-3 w-3 mr-1" />
                                  Receive
                                </>
                              )}
                            </Button>
                          )}
                          {transfer.transfer_status === "completed" && (
                            <Button variant="outline" size="sm" className="h-8 font-bold border-2">
                              View Details
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <ShieldCheck className="h-3 w-3" />
          Secure Transfer System
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Clock className="h-3 w-3" />
          Real-time Tracking
        </div>
      </div>
    </div>
  )
}
