"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, Users, Phone, Mail, MapPin, Loader2, RefreshCw, FileDown, 
  ChevronLeft, ChevronRight, Edit, Eye, DollarSign, X, TrendingUp,
  AlertCircle, ShieldCheck, Clock, UserCheck, UserX, Building2,
  CreditCard, Wallet, ArrowUpRight, Info, Briefcase
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip 
} from "recharts"
import { inventory_base_url } from "@/lib/api-config"

// --- API Configuration ---
const API_BASE_URL = inventory_base_url
const CLIENTS_ENDPOINT = `${API_BASE_URL}/clients`
const ITEMS_PER_PAGE = 10
const CHART_COLORS = ["#10b981", "#ef4444", "#8b5cf6"]

// Utility to handle nullable string fields from the backend
interface NullableString {
  String: string
  Valid: boolean
}
const safeString = (ns: NullableString | undefined): string => (ns?.Valid ? ns.String : "-")

// --- Client Data Interface (Based on API Response) ---
interface Client {
  id: string
  client_code: string
  client_type: string
  first_name: NullableString
  last_name: NullableString
  business_name: NullableString
  email: NullableString
  phone: string
  address: NullableString
  city: NullableString
  credit_limit: number
  total_debt: number
  is_active: boolean
  created_at: string
}

interface Debt {
  id: string
  debt_number: string
  invoice_number: string
  total_amount: number
  amount_paid: number
  balance_due: number
  due_date: string
  debt_status: string
  days_overdue: number
  created_at: string
}

interface CreateClientForm {
  client_type: "individual" | "business"
  first_name?: string
  last_name?: string
  business_name?: string
  email?: string
  phone: string
  address?: string
  city?: string
  credit_limit: number
}

interface UpdateClientForm {
  first_name?: string
  last_name?: string
  business_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  credit_limit?: number
  is_active?: boolean
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalClients, setTotalClients] = useState(0)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDebtsDialogOpen, setIsDebtsDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientDebts, setClientDebts] = useState<Debt[]>([])
  const [isLoadingDebts, setIsLoadingDebts] = useState(false)

  // Form states
  const [createForm, setCreateForm] = useState<CreateClientForm>({
    client_type: "individual",
    phone: "",
    credit_limit: 0,
  })
  const [updateForm, setUpdateForm] = useState<UpdateClientForm>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get auth token
  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  // Fetch total clients count
  const fetchTotalCount = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${CLIENTS_ENDPOINT}/count`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.total_clients !== undefined) {
          setTotalClients(result.data.total_clients)
        }
      }
    } catch (err) {
      console.error("Error fetching total count:", err)
    }
  }, [])

  // Fetch clients
  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = getToken()
      
      if (!token) {
        throw new Error("Authentication error: No access token found. Please login again.")
      }

      // Build query params
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (filterType !== "all") params.append("client_type", filterType)
      if (filterStatus !== "all") params.append("is_active", filterStatus === "active" ? "true" : "false")

      const url = `${CLIENTS_ENDPOINT}${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch clients: ${errorBody.message || response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setClients(result.data)
      } else {
        setClients([])
      }
    } catch (err) {
      console.error("Error fetching clients:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred while loading clients.")
      setClients([])
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, filterType, filterStatus])

  // Fetch client debts
  const fetchClientDebts = async (clientId: string) => {
    setIsLoadingDebts(true)
    try {
      const token = getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${CLIENTS_ENDPOINT}/${clientId}/debts`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch debts")

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setClientDebts(result.data)
      } else {
        setClientDebts([])
      }
    } catch (err) {
      console.error("Error fetching debts:", err)
      setClientDebts([])
    } finally {
      setIsLoadingDebts(false)
    }
  }

  // Create client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const token = getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(CLIENTS_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.error || "Failed to create client")
      }

      const result = await response.json()
      if (result.success) {
        setIsAddDialogOpen(false)
        fetchClients()
        fetchTotalCount()
        // Reset form
        setCreateForm({
          client_type: "individual",
          phone: "",
          credit_limit: 0,
        })
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create client")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update client
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) return

    setIsSubmitting(true)
    try {
      const token = getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${CLIENTS_ENDPOINT}/${selectedClient.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateForm),
      })

      if (!response.ok) {
        const errorBody = await response.json()
        throw new Error(errorBody.error || "Failed to update client")
      }

      const result = await response.json()
      if (result.success) {
        setIsEditDialogOpen(false)
        fetchClients()
        setUpdateForm({})
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update client")
    } finally {
      setIsSubmitting(false)
    }
  }

  // View client details
  const handleViewClient = async (clientId: string) => {
    try {
      const token = getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${CLIENTS_ENDPOINT}/${clientId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch client details")

      const result = await response.json()
      if (result.success && result.data) {
        setSelectedClient(result.data)
        setIsViewDialogOpen(true)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load client details")
    }
  }

  // Open edit dialog
  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setUpdateForm({
      first_name: safeString(client.first_name) !== "-" ? safeString(client.first_name) : undefined,
      last_name: safeString(client.last_name) !== "-" ? safeString(client.last_name) : undefined,
      business_name: safeString(client.business_name) !== "-" ? safeString(client.business_name) : undefined,
      email: safeString(client.email) !== "-" ? safeString(client.email) : undefined,
      phone: client.phone,
      address: safeString(client.address) !== "-" ? safeString(client.address) : undefined,
      city: safeString(client.city) !== "-" ? safeString(client.city) : undefined,
      credit_limit: client.credit_limit,
      is_active: client.is_active,
    })
    setIsEditDialogOpen(true)
  }

  // Open debts dialog
  const handleViewDebts = (client: Client) => {
    setSelectedClient(client)
    setIsDebtsDialogOpen(true)
    fetchClientDebts(client.id)
  }

  useEffect(() => {
    fetchClients()
    fetchTotalCount()
  }, [fetchClients, fetchTotalCount])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, filterStatus])

  // Filtered clients
  const filteredClients = clients

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentClients = filteredClients.slice(startIndex, endIndex)

  const formatCurrency = (amount: number) => `TZS ${amount.toLocaleString()}`

  // Pagination helper (matching products page logic)
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

  // Analytics Metrics
  const totalDebt = clients.reduce((sum, c) => sum + c.total_debt, 0)
  const totalCreditLimit = clients.reduce((sum, c) => sum + c.credit_limit, 0)
  const activeCount = clients.filter(c => c.is_active).length
  const businessCount = clients.filter(c => c.client_type === 'business').length
  const clientsWithDebt = clients.filter(c => c.total_debt > 0).length

  // PDF Export
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
          <title>Client Database Report - ${currentDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #333; }
            .header h1 { font-size: 24px; margin-bottom: 5px; }
            .header p { font-size: 12px; color: #666; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; }
            .summary-item { text-align: center; }
            .summary-label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 4px; }
            .summary-value { font-size: 16px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th { background-color: #f3f4f6; padding: 10px 8px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .text-right { text-align: right; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 500; }
            .badge-active { background-color: #dcfce7; color: #166534; }
            .badge-inactive { background-color: #f3f4f6; color: #6b7280; }
            .text-red { color: #dc2626; font-weight: 600; }
            .text-green { color: #16a34a; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
            @media print { body { padding: 10px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Client Database Report</h1>
            <p>Generated on ${currentDate}</p>
          </div>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Clients</div>
              <div class="summary-value">${filteredClients.length}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Active Clients</div>
              <div class="summary-value">${activeCount}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Debt</div>
              <div class="summary-value">TZS ${totalDebt.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Credit Limit</div>
              <div class="summary-value">TZS ${totalCreditLimit.toLocaleString()}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Client Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Location</th>
                <th class="text-right">Total Debt</th>
                <th class="text-right">Credit Limit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClients.map(client => {
                const fullName = safeString(client.first_name) + " " + safeString(client.last_name)
                const name = client.client_type === 'business' ? safeString(client.business_name) : fullName
                const location = safeString(client.city) || safeString(client.address)
                const debtClass = client.total_debt > 0 ? "text-red" : "text-green"
                
                return `
                  <tr>
                    <td>${client.client_code}</td>
                    <td>
                      ${name}
                      ${client.client_type === 'business' && fullName.trim() !== '- -' ? `<br><span style="font-size: 9px; color: #666;">(${fullName.trim()})</span>` : ''}
                    </td>
                    <td style="text-transform: capitalize;">${client.client_type}</td>
                    <td>
                      ${client.phone}
                      ${safeString(client.email) !== '-' ? `<br><span style="font-size: 9px; color: #666;">${safeString(client.email)}</span>` : ''}
                    </td>
                    <td>${location}</td>
                    <td class="text-right ${debtClass}">TZS ${client.total_debt.toLocaleString()}</td>
                    <td class="text-right">TZS ${client.credit_limit.toLocaleString()}</td>
                    <td>
                      <span class="badge ${client.is_active ? 'badge-active' : 'badge-inactive'}">
                        ${client.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>This report was generated automatically from the client database system.</p>
            <p style="margin-top: 20px;" class="no-print">Press Ctrl+P (Cmd+P on Mac) to print or save as PDF</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
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
            Customer Database
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Live
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Managing <span className="font-bold text-foreground underline underline-offset-4 decoration-primary">{totalClients}</span> total customer records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 font-bold border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                <TrendingUp className="mr-2 h-4 w-4 text-emerald-500" />
                Customer Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-black">Customer Portfolio Analysis</DialogTitle>
                <DialogDescription>Visual distribution of your customer base and credit status.</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Rate</p>
                  <p className="text-2xl font-black text-emerald-500">{((activeCount/clients.length)*100 || 0).toFixed(0)}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Debt Holders</p>
                  <p className="text-2xl font-black text-red-500">{clientsWithDebt}</p>
                </div>
              </div>

              <div className="h-[300px] w-full mt-6">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Active', value: activeCount }, 
                        { name: 'With Debt', value: clientsWithDebt },
                        { name: 'Inactive', value: clients.length - activeCount }
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
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 font-bold shadow-lg">
                <Users className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Add New Customer</DialogTitle>
                <DialogDescription>Create a new customer record in your database.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client_type" className="font-bold">Customer Type</Label>
                  <Select
                    value={createForm.client_type}
                    onValueChange={(value: "individual" | "business") =>
                      setCreateForm({ ...createForm, client_type: value })
                    }
                  >
                    <SelectTrigger className="h-11 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {createForm.client_type === "individual" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="font-bold">First Name *</Label>
                      <Input
                        id="first_name"
                        required
                        className="h-11 border-2"
                        value={createForm.first_name || ""}
                        onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="font-bold">Last Name *</Label>
                      <Input
                        id="last_name"
                        required
                        className="h-11 border-2"
                        value={createForm.last_name || ""}
                        onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="font-bold">Business Name *</Label>
                    <Input
                      id="business_name"
                      required
                      className="h-11 border-2"
                      value={createForm.business_name || ""}
                      onChange={(e) => setCreateForm({ ...createForm, business_name: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-bold">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      className="h-11 border-2"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="h-11 border-2"
                      value={createForm.email || ""}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-bold">City</Label>
                    <Input
                      id="city"
                      className="h-11 border-2"
                      value={createForm.city || ""}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="font-bold">Address</Label>
                    <Input
                      id="address"
                      className="h-11 border-2"
                      value={createForm.address || ""}
                      onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credit_limit" className="font-bold">Credit Limit (TZS)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    min="0"
                    className="h-11 border-2"
                    value={createForm.credit_limit}
                    onChange={(e) => setCreateForm({ ...createForm, credit_limit: Number(e.target.value) })}
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="font-bold">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Client
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Credit Exposure */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CreditCard className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Wallet className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Credit Limit</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              <span className="text-lg font-normal text-slate-500 mr-2">TZS</span>
              {totalCreditLimit.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">AVAILABLE EXPOSURE</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Debt */}
        <Card className="border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 group hover:border-red-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-[10px] font-black text-red-600/60 dark:text-red-400 uppercase tracking-[2px]">Total Debt</p>
            </div>
            <div className="text-4xl font-black text-red-700 dark:text-red-500 tracking-tighter">
              TZS {totalDebt.toLocaleString()}
            </div>
            <div className="mt-4">
               <div className="w-full bg-red-200 dark:bg-red-900/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-600 h-full transition-all duration-1000" 
                    style={{ width: `${(clientsWithDebt / (clients.length || 1)) * 100}%` }} 
                  />
               </div>
               <p className="text-[9px] mt-2 font-bold text-red-600/80">{clientsWithDebt} CUSTOMERS WITH OUTSTANDING DEBT</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Clients */}
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <UserCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Active Customers</p>
            </div>
            <div className="text-4xl font-black text-foreground tracking-tighter">
              {activeCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> {((activeCount/clients.length)*100 || 0).toFixed(0)}% of Total Portfolio
            </p>
          </CardContent>
        </Card>

        {/* Business vs Individual */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-purple-100 dark:bg-purple-950/40 p-2 rounded-lg">
                  <Building2 className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Customer Mix</p>
                  <p className="text-xl font-black text-purple-600">{businessCount} B2B</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Business Clients</span>
                  <span>{businessCount} Accounts</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                   <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${(businessCount/clients.length)*100}%` }} />
                </div>
              </div>
            </div>
            <p className="text-[9px] font-bold text-purple-600/80 mt-4 flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {clients.length - businessCount} Individual Customers
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
                  placeholder="Search by name, phone, email, or code..." 
                  className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-slate-950 border-2 font-bold">
                  <SelectValue placeholder="Client Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">All Types</SelectItem>
                  <SelectItem value="individual" className="font-bold">Individual</SelectItem>
                  <SelectItem value="business" className="font-bold">Business</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-slate-950 border-2 font-bold">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">All Status</SelectItem>
                  <SelectItem value="active" className="font-bold">Active</SelectItem>
                  <SelectItem value="inactive" className="font-bold">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" size="icon" onClick={fetchClients} disabled={isLoading} className="h-12 w-12 border-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <Alert className="m-6 border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700 dark:text-red-400 font-medium">
                {error}
                <Button variant="link" size="sm" onClick={fetchClients} disabled={isLoading} className="ml-2 h-auto p-0 font-bold">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Client Data...</p>
            </div>
          ) : currentClients.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <Search className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black">No Customers Found</h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                {searchQuery ? "Try adjusting your search filters" : "Get started by adding your first client"}
              </p>
              <Button variant="link" className="mt-4 font-bold" onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterStatus("all"); }}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Code</TableHead>
                    <TableHead className="w-[300px] font-black text-foreground uppercase text-[10px] tracking-widest">Customer Identity</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Type</TableHead>
                    <TableHead className="hidden md:table-cell font-black text-foreground uppercase text-[10px] tracking-widest">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell font-black text-foreground uppercase text-[10px] tracking-widest">Location</TableHead>
                    <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Total Debt</TableHead>
                    <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Credit Limit</TableHead>
                    <TableHead className="text-center font-black text-foreground uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentClients.map((client) => {
                    const fullName = safeString(client.first_name) + " " + safeString(client.last_name)
                    const name = client.client_type === 'business' ? safeString(client.business_name) : fullName
                    const location = safeString(client.city) || safeString(client.address)
                    const debtClass = client.total_debt > 0 ? "text-red-500 font-semibold" : "text-green-600"

                    return (
                      <TableRow 
                        key={client.id}
                        className="group cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800"
                      >
                        <TableCell>
                          <span className="font-mono text-[10px] font-black text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                            {client.client_code}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                              {client.client_type === 'business' ? (
                                <Building2 className="h-5 w-5 text-slate-400" />
                              ) : (
                                <Users className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="font-black text-sm text-foreground group-hover:text-primary transition-colors leading-none">
                                {name}
                              </div>
                              {client.client_type === 'business' && fullName.trim() !== '- -' && (
                                <p className="text-[10px] text-muted-foreground font-bold">Contact: {fullName.trim()}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="capitalize text-[8px] uppercase font-black px-2 py-0 border-none bg-slate-500/10 text-slate-600 dark:text-slate-400">
                            {client.client_type}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-medium">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {client.phone}
                            </div>
                            {safeString(client.email) !== '-' && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {safeString(client.email)}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                            <MapPin className="h-3 w-3" />
                            {location}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-muted-foreground mb-0.5">OUTSTANDING</span>
                            <span className={`font-black ${debtClass}`}>
                              TZS {client.total_debt.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-muted-foreground mb-0.5">MAX LIMIT</span>
                            <span className="font-black text-foreground">
                              TZS {client.credit_limit.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant={client.is_active ? "outline" : "secondary"} className={`text-[8px] uppercase font-black px-2 py-1 border-none ${client.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                            {client.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewClient(client.id)
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditClient(client)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDebts(client)
                              }}
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* FOOTER & PAGINATION */}
          {!isLoading && totalPages > 1 && (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Showing <span className="text-foreground">{currentClients.length}</span> of {filteredClients.length} Entries
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

      {/* View Client Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <DialogHeader className="pt-4">
            <DialogTitle className="text-2xl font-black">Client Details</DialogTitle>
            <DialogDescription>Complete client information and history</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Client Code</Label>
                  <p className="font-mono font-black text-lg mt-1">{selectedClient.client_code}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Client Type</Label>
                  <p className="capitalize font-black text-lg mt-1">{selectedClient.client_type}</p>
                </div>
              </div>

              {selectedClient.client_type === 'individual' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">First Name</Label>
                    <p className="font-bold text-foreground mt-1">{safeString(selectedClient.first_name)}</p>
                  </div>
                  <div>
                    <Label className="text-[10px] font-black text-muted-foreground uppercase">Last Name</Label>
                    <p className="font-bold text-foreground mt-1">{safeString(selectedClient.last_name)}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Business Name</Label>
                  <p className="font-bold text-foreground mt-1">{safeString(selectedClient.business_name)}</p>
                  {safeString(selectedClient.first_name) !== '-' && (
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                      Contact: {safeString(selectedClient.first_name)} {safeString(selectedClient.last_name)}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Phone</Label>
                  <p className="font-bold text-foreground mt-1">{selectedClient.phone}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Email</Label>
                  <p className="font-bold text-foreground mt-1">{safeString(selectedClient.email)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">City</Label>
                  <p className="font-bold text-foreground mt-1">{safeString(selectedClient.city)}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Address</Label>
                  <p className="font-bold text-foreground mt-1">{safeString(selectedClient.address)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase">Credit Limit</Label>
                  <p className="font-black text-2xl text-emerald-600 mt-1">{formatCurrency(selectedClient.credit_limit)}</p>
                </div>
                <div className={`p-4 rounded-lg border ${selectedClient.total_debt > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900' : 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900'}`}>
                  <Label className={`text-[10px] font-black uppercase ${selectedClient.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>Total Debt</Label>
                  <p className={`font-black text-2xl mt-1 ${selectedClient.total_debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedClient.total_debt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Status</Label>
                  <div className="mt-2">
                    <Badge variant={selectedClient.is_active ? "default" : "secondary"} className="font-black">
                      {selectedClient.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] font-black text-muted-foreground uppercase">Created At</Label>
                  <p className="font-bold text-foreground mt-2">{new Date(selectedClient.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="font-bold">Close</Button>
            <Button onClick={() => {
              if (selectedClient) {
                setIsViewDialogOpen(false)
                handleEditClient(selectedClient)
              }
            }} className="font-bold">
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          <DialogHeader className="pt-4">
            <DialogTitle className="text-2xl font-black">Edit Client</DialogTitle>
            <DialogDescription>Update client information and settings</DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-black">Client Code: <span className="font-mono text-primary">{selectedClient.client_code}</span></p>
                <p className="text-sm text-muted-foreground capitalize font-bold">Type: {selectedClient.client_type}</p>
              </div>

              {selectedClient.client_type === "individual" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_first_name" className="font-bold">First Name</Label>
                    <Input
                      id="edit_first_name"
                      className="h-11 border-2"
                      value={updateForm.first_name || ""}
                      onChange={(e) => setUpdateForm({ ...updateForm, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_last_name" className="font-bold">Last Name</Label>
                    <Input
                      id="edit_last_name"
                      className="h-11 border-2"
                      value={updateForm.last_name || ""}
                      onChange={(e) => setUpdateForm({ ...updateForm, last_name: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit_business_name" className="font-bold">Business Name</Label>
                  <Input
                    id="edit_business_name"
                    className="h-11 border-2"
                    value={updateForm.business_name || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, business_name: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_phone" className="font-bold">Phone Number</Label>
                  <Input
                    id="edit_phone"
                    type="tel"
                    className="h-11 border-2"
                    value={updateForm.phone || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_email" className="font-bold">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    className="h-11 border-2"
                    value={updateForm.email || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_city" className="font-bold">City</Label>
                  <Input
                    id="edit_city"
                    className="h-11 border-2"
                    value={updateForm.city || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_address" className="font-bold">Address</Label>
                  <Input
                    id="edit_address"
                    className="h-11 border-2"
                    value={updateForm.address || ""}
                    onChange={(e) => setUpdateForm({ ...updateForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_credit_limit" className="font-bold">Credit Limit (TZS)</Label>
                <Input
                  id="edit_credit_limit"
                  type="number"
                  min="0"
                  className="h-11 border-2"
                  value={updateForm.credit_limit || 0}
                  onChange={(e) => setUpdateForm({ ...updateForm, credit_limit: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_is_active" className="font-bold">Status</Label>
                <Select
                  value={updateForm.is_active ? "active" : "inactive"}
                  onValueChange={(value) => setUpdateForm({ ...updateForm, is_active: value === "active" })}
                >
                  <SelectTrigger className="h-11 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="font-bold">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Update Client
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Debts Dialog */}
      <Dialog open={isDebtsDialogOpen} onOpenChange={setIsDebtsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <DialogHeader className="pt-4">
            <DialogTitle className="text-2xl font-black">Client Debts</DialogTitle>
            <DialogDescription>
              {selectedClient && (
                <>
                  Outstanding debt records for {selectedClient.client_type === 'business' 
                    ? safeString(selectedClient.business_name) 
                    : `${safeString(selectedClient.first_name)} ${safeString(selectedClient.last_name)}`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDebts ? (
            <div className="text-center py-12">
              <div className="relative mx-auto mb-4">
                <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <DollarSign className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              </div>
              <p className="text-muted-foreground font-bold">Loading debt records...</p>
            </div>
          ) : clientDebts.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-emerald-100 dark:bg-emerald-950/20 p-6 rounded-full mx-auto mb-4 w-fit">
                <DollarSign className="h-12 w-12 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black mb-2">No Outstanding Debts</h3>
              <p className="text-muted-foreground font-medium">This client has a clean financial record</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg font-black">Debt Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase">Total Records</Label>
                      <p className="text-3xl font-black mt-2">{clientDebts.length}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 text-center">
                      <Label className="text-[10px] font-black text-blue-600 uppercase">Total Amount</Label>
                      <p className="text-3xl font-black text-blue-600 mt-2">
                        {formatCurrency(clientDebts.reduce((sum, d) => sum + d.total_amount, 0))}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 text-center">
                      <Label className="text-[10px] font-black text-red-600 uppercase">Balance Due</Label>
                      <p className="text-3xl font-black text-red-600 mt-2">
                        {formatCurrency(clientDebts.reduce((sum, d) => sum + d.balance_due, 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="overflow-x-auto border-2 rounded-lg">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px]">Debt #</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Invoice #</TableHead>
                      <TableHead className="text-right font-black uppercase text-[10px]">Total Amount</TableHead>
                      <TableHead className="text-right font-black uppercase text-[10px]">Amount Paid</TableHead>
                      <TableHead className="text-right font-black uppercase text-[10px]">Balance Due</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Due Date</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Days Overdue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientDebts.map((debt) => (
                      <TableRow key={debt.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell className="font-mono text-xs font-bold">{debt.debt_number}</TableCell>
                        <TableCell className="font-mono text-xs font-bold">{debt.invoice_number}</TableCell>
                        <TableCell className="text-right font-black">
                          {formatCurrency(debt.total_amount)}
                        </TableCell>
                        <TableCell className="text-right font-black text-green-600">
                          {formatCurrency(debt.amount_paid)}
                        </TableCell>
                        <TableCell className="text-right font-black text-red-600">
                          {formatCurrency(debt.balance_due)}
                        </TableCell>
                        <TableCell className="text-xs font-bold">
                          {new Date(debt.due_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              debt.debt_status === 'paid' ? 'default' : 
                              debt.debt_status === 'overdue' ? 'destructive' : 
                              'secondary'
                            }
                            className="text-[10px] font-black uppercase"
                          >
                            {debt.debt_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {debt.days_overdue > 0 ? (
                            <span className="text-red-600 font-black text-sm">{debt.days_overdue} days</span>
                          ) : (
                            <span className="text-muted-foreground font-bold">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDebtsDialogOpen(false)} className="font-bold">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}