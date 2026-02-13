"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, CreditCard, AlertCircle, Clock, Loader2, FileDown, ChevronLeft, ChevronRight, BarChart3, User, Phone, Calendar, TrendingUp, DollarSign, Layers, Info, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecordPaymentDialog } from "@/components/forms/record-payment-dialog"
import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { inventory_base_url } from "@/lib/api-config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

// --- ORIGINAL COLOR SCHEME & CONFIG (PRESERVED) ---
const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
const API_BASE = inventory_base_url
const DEBTS_ENDPOINT = `${API_BASE}/debts`

interface Debt {
  id: string
  debt_number: string
  invoice_number: string
  store_id: string
  client_id: string
  sale_id: string
  total_amount: number
  amount_paid: number
  balance_due: number
  due_date: string
  payment_terms?: { String: string; Valid: boolean }
  debt_status: string
  days_overdue: number
  days_remaining: number
  is_overdue: boolean
  days_until_due: string
  client_name: string
  client_phone: string
  client_email: string
  created_at: string
  updated_at: string
}

export default function DebtsPage() {
  // --- ORIGINAL STATE & LOGIC (100% PRESERVED) ---
  const [debts, setDebts] = useState<Debt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const getToken = () => sessionStorage.getItem("access_token") || localStorage.getItem("access_token")

  const fetchDebts = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const token = getToken()
      if (!token) {
        setFetchError("Authentication error: No access token found. Please log in.")
        return
      }
      const response = await fetch(DEBTS_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch debts: ${errorBody.error || response.statusText}`)
      }
      const result = await response.json()
      if (result.success && result.data?.debts && Array.isArray(result.data.debts)) {
        setDebts(result.data.debts)
      } else {
        setDebts([])
      }
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchDebts() }, [])

  // --- CALCULATIONS (PRESERVED) ---
  const totalDebts = debts.length
  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance_due, 0)
  const overdueDebts = debts.filter((d) => d.debt_status === "overdue").length
  const overdueAmount = debts.filter((d) => d.debt_status === "overdue").reduce((sum, d) => sum + d.balance_due, 0)
  const avgDaysOverdue =
    debts.filter((d) => d.days_overdue > 0).reduce((sum, d) => sum + d.days_overdue, 0) /
      debts.filter((d) => d.days_overdue > 0).length || 0

  const statusData = [
    { name: "Active", value: debts.filter((d) => d.debt_status === "active").length },
    { name: "Partial", value: debts.filter((d) => d.debt_status === "partial").length },
    { name: "Overdue", value: debts.filter((d) => d.debt_status === "overdue").length },
  ]

  const filteredDebts = debts.filter((debt) => {
    const matchesSearch =
      debt.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debt.debt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debt.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debt.client_phone.includes(searchQuery)
    const matchesFilter = statusFilter === "all" || debt.debt_status === statusFilter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredDebts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDebts = filteredDebts.slice(startIndex, endIndex)

  useEffect(() => { setCurrentPage(1) }, [searchQuery, statusFilter, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "overdue": return "destructive"
      case "partial": return "secondary"
      default: return "secondary"
    }
  }

  // --- PDF EXPORT (100% PRESERVED) ---
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) { alert('Please allow pop-ups to export PDF'); return; }
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    const totalAmount = filteredDebts.reduce((sum, debt) => sum + debt.total_amount, 0)
    const totalPaid = filteredDebts.reduce((sum, debt) => sum + debt.amount_paid, 0)
    const totalBalanceDue = filteredDebts.reduce((sum, debt) => sum + debt.balance_due, 0)
    const filteredOverdue = filteredDebts.filter((d) => d.debt_status === "overdue").length
    const filteredOverdueAmount = filteredDebts.filter((d) => d.debt_status === "overdue").reduce((sum, d) => sum + d.balance_due, 0)

    const htmlContent = `
      <!DOCTYPE html><html><head><title>Debt Management Report - ${currentDate}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
        th { background-color: #f3f4f6; padding: 10px; border: 1px solid #ddd; }
        td { padding: 8px; border: 1px solid #ddd; }
        .balance-due { color: #f97316; font-weight: 600; }
      </style></head><body>
      <div class="header"><h1>Debt Management Report</h1><p>Generated on ${currentDate}</p></div>
      <div class="summary">
        <div><strong>Total Debts:</strong> ${filteredDebts.length}</div>
        <div><strong>Balance:</strong> TZS ${totalBalanceDue.toLocaleString()}</div>
        <div style="color:red"><strong>Overdue:</strong> ${filteredOverdue}</div>
        <div><strong>Total Value:</strong> TZS ${totalAmount.toLocaleString()}</div>
      </div>
      <table><thead><tr><th>Debt #</th><th>Invoice #</th><th>Client</th><th>Phone</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th></tr></thead>
      <tbody>${filteredDebts.map(debt => `<tr><td>${debt.debt_number}</td><td>${debt.invoice_number}</td><td>${debt.client_name}</td><td>${debt.client_phone}</td><td>${debt.total_amount.toLocaleString()}</td><td>${debt.amount_paid.toLocaleString()}</td><td class="balance-due">${debt.balance_due.toLocaleString()}</td><td>${new Date(debt.due_date).toLocaleDateString()}</td><td>${debt.debt_status}</td></tr>`).join('')}</tbody></table>
      <script>window.onload = function() { window.print(); }</script></body></html>`
    printWindow.document.write(htmlContent); printWindow.document.close();
  }

  // Pagination helper (matching products page style)
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

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION - Enhanced with animations */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Debt Ledger
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Live
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Manage and reconcile outstanding client balances
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* ANALYTICS MODAL - Enhanced design */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 font-bold border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                <BarChart3 className="mr-2 h-4 w-4 text-emerald-500" />
                View Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-black">Debt Status Distribution</DialogTitle>
                <DialogDescription>Visual breakdown of current payment health across all accounts.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Collection Rate</p>
                  <p className="text-2xl font-black text-emerald-500">
                    {totalDebts > 0 ? ((debts.filter(d => d.debt_status === "active").length / totalDebts) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">At Risk</p>
                  <p className="text-2xl font-black text-red-500">{overdueDebts}</p>
                </div>
              </div>
              
              <div className="h-[300px] w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <DialogFooter className="mt-4">
                <Button className="w-full font-bold" variant="outline" onClick={handleExportPDF}>
                  Generate Detailed Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="h-10 font-bold border-2" onClick={handleExportPDF}>
            <FileDown className="mr-2 h-4 w-4" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* SUMMARY CARDS - Enhanced with animations */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Outstanding Balance - Premium dark card */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Outstanding Balance</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              <span className="text-lg font-normal text-slate-500 mr-2">TZS</span>
              {totalBalance.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">{totalDebts} ACTIVE ACCOUNTS</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">TRACKED</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Past Due Count */}
        <Card className="border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 group hover:border-red-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-[10px] font-black text-red-600/60 dark:text-red-400 uppercase tracking-[2px]">Past Due Count</p>
            </div>
            <div className="text-4xl font-black text-red-700 dark:text-red-500 tracking-tighter">
              {overdueDebts}
            </div>
            <div className="mt-4">
              <div className="w-full bg-red-200 dark:bg-red-900/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-red-600 h-full transition-all duration-1000" 
                  style={{ width: `${totalDebts > 0 ? (overdueDebts / totalDebts) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[9px] mt-2 font-bold text-red-600/80 uppercase">TZS {overdueAmount.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Average Delay */}
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Avg Delay</p>
            </div>
            <div className="text-4xl font-black text-foreground tracking-tighter">
              {avgDaysOverdue.toFixed(1)} <span className="text-sm font-medium opacity-60">Days</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <Info className="h-3 w-3 text-amber-500" /> Average collection cycle
            </p>
          </CardContent>
        </Card>

        {/* Portfolio Health */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-lg">
                  <Layers className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Portfolio Health</p>
                  <p className="text-xl font-black text-emerald-600">
                    {totalDebts > 0 ? ((statusData[0].value / totalDebts) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                <div style={{width: `${totalDebts > 0 ? (statusData[0].value/totalDebts)*100 : 0}%`}} className="bg-[#10b981] h-full transition-all duration-1000" />
                <div style={{width: `${totalDebts > 0 ? (statusData[1].value/totalDebts)*100 : 0}%`}} className="bg-[#f59e0b] h-full transition-all duration-1000" />
                <div style={{width: `${totalDebts > 0 ? (statusData[2].value/totalDebts)*100 : 0}%`}} className="bg-[#ef4444] h-full transition-all duration-1000" />
              </div>
            </div>
            <p className="text-[9px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Actively monitored accounts
            </p>
          </div>
        </Card>
      </div>

      {/* MAIN TABLE CARD - Enhanced design */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 w-full gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search client, invoice, or debt number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-emerald-500 font-medium"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-slate-950 border-2 font-bold">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">All Records</SelectItem>
                  <SelectItem value="active" className="font-bold">Active</SelectItem>
                  <SelectItem value="overdue" className="font-bold">Overdue</SelectItem>
                  <SelectItem value="partial" className="font-bold">Partial Payment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(Number(v))}>
                <SelectTrigger className="w-[100px] h-12 bg-white dark:bg-slate-950 border-2 font-bold text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 25, 50].map(n => <SelectItem key={n} value={n.toString()} className="font-bold">{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {fetchError && (
            <div className="m-6 p-6 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg border-2 border-red-100 dark:border-red-900">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-bold">Sync Error</p>
              </div>
              <p className="text-xs mb-4">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={fetchDebts} className="font-bold border-2">
                Retry Sync
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <DollarSign className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Debt Records...</p>
            </div>
          ) : paginatedDebts.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <Search className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black">No Results Found</h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                Try adjusting your search query or filters to find what you're looking for.
              </p>
              <Button 
                variant="link" 
                className="mt-4 font-bold" 
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent border-b-2">
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Account</TableHead>
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Client</TableHead>
                      <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Balance Due</TableHead>
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Due Date</TableHead>
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Status</TableHead>
                      <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDebts.map((debt) => (
                      <TableRow 
                        key={debt.id} 
                        className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800"
                      >
                        <TableCell>
                          <div className="font-mono font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {debt.debt_number}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter flex items-center gap-1 mt-1">
                            <span className="font-mono text-[8px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              INV: {debt.invoice_number}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border-2 border-slate-200 dark:border-slate-700 group-hover:border-primary transition-colors">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground">{debt.client_name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {debt.client_phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-black text-emerald-600 dark:text-emerald-400 flex flex-col items-end">
                            <span className="text-[10px] font-bold text-muted-foreground mb-0.5">BALANCE</span>
                            <span className="text-sm">TZS {debt.balance_due.toLocaleString()}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase mt-1">
                            Total: {debt.total_amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-[11px] font-bold flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(debt.due_date).toLocaleDateString()}
                          </div>
                          {debt.is_overdue && (
                            <div className="text-[10px] font-black text-red-600 bg-red-100 dark:bg-red-950/40 w-fit px-1.5 py-0.5 rounded mt-1 uppercase animate-pulse border border-red-200 dark:border-red-900">
                              {debt.days_overdue} Days Late
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getStatusColor(debt.debt_status)} 
                            className="font-bold shadow-sm uppercase text-[10px] border-2"
                          >
                            {debt.debt_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <RecordPaymentDialog
                            debtId={debt.id}
                            balanceDue={debt.balance_due}
                            onPaymentRecorded={fetchDebts}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION - Enhanced to match products page */}
              {totalPages > 1 && (
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Showing <span className="text-foreground">{paginatedDebts.length}</span> of {filteredDebts.length} Entries
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

      {/* FOOTER INFO - Matching products page */}
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