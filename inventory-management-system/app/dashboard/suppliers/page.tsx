"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, FileDown, Truck, Phone, Mail, TrendingUp, Package, DollarSign, Loader2, ChevronLeft, ChevronRight, Eye, ShieldCheck, Clock, Users, AlertCircle } from "lucide-react"
import { AddSupplierDialog } from "@/components/forms/add-supplier-dialog"
import { SupplierDetailsDialog } from "@/components/forms/supplier-details-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { inventory_base_url } from "@/lib/api-config"

const ITEMS_PER_PAGE = 10

interface SupplierData {
  id: string
  business_owner_id: string
  store_id: string
  supplier_code: string
  supplier_name: string
  contact_person: {
    String: string
    Valid: boolean
  }
  email: {
    String: string
    Valid: boolean
  }
  phone: {
    String: string
    Valid: boolean
  }
  address: {
    String: string
    Valid: boolean
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function SuppliersPage() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<SupplierData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  
  // Dialog states
  const [detailsSupplierId, setDetailsSupplierId] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("No access token found. Please login again.")
      }

      const response = await fetch(`${inventory_base_url}/suppliers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch suppliers")
      }

      setSuppliers(data.data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load suppliers"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleSupplierAdded = () => {
    toast({
      title: "Success",
      description: "Supplier created successfully",
    })
    fetchSuppliers()
  }

  // Handle View Details
  const handleViewDetails = (supplierId: string) => {
    setDetailsSupplierId(supplierId)
    setDetailsDialogOpen(true)
  }

  // Filter suppliers based on search query and status
  const filteredSuppliers = suppliers.filter((supplier) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = 
      supplier.supplier_name.toLowerCase().includes(query) ||
      supplier.supplier_code.toLowerCase().includes(query) ||
      (supplier.contact_person.Valid && supplier.contact_person.String.toLowerCase().includes(query)) ||
      (supplier.email.Valid && supplier.email.String.toLowerCase().includes(query))
    
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && supplier.is_active) ||
      (statusFilter === "inactive" && !supplier.is_active)

    return matchesSearch && matchesStatus
  })

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentSuppliers = filteredSuppliers.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const handlePageClick = (pageNum: number) => {
    setCurrentPage(pageNum)
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  // PDF Export Function
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
          <title>Supplier Report - ${currentDate}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .header h1 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            .header p {
              font-size: 12px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th {
              background-color: #f3f4f6;
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #ddd;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 500;
            }
            .badge-active {
              background-color: #dcfce7;
              color: #166534;
            }
            .badge-inactive {
              background-color: #f3f4f6;
              color: #6b7280;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body {
                padding: 10px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Supplier Report</h1>
            <p>Generated on ${currentDate}</p>
            <p>Total Suppliers: ${filteredSuppliers.length}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Supplier Code</th>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSuppliers.map(supplier => `
                <tr>
                  <td>${supplier.supplier_code}</td>
                  <td>${supplier.supplier_name}</td>
                  <td>${supplier.contact_person.Valid ? supplier.contact_person.String : 'N/A'}</td>
                  <td>${supplier.email.Valid ? supplier.email.String : 'N/A'}</td>
                  <td>${supplier.phone.Valid ? supplier.phone.String : 'N/A'}</td>
                  <td>
                    <span class="badge ${supplier.is_active ? 'badge-active' : 'badge-inactive'}">
                      ${supplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This report was generated automatically from the supplier management system.</p>
            <p style="margin-top: 20px;" class="no-print">Press Ctrl+P (Cmd+P on Mac) to print or save as PDF</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Calculate stats
  const activeSuppliers = suppliers.filter(s => s.is_active).length
  const inactiveSuppliers = suppliers.length - activeSuppliers
  const thisMonthSuppliers = suppliers.filter(s => {
    const created = new Date(s.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Supplier Management
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Active Network
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Manage your suppliers and track their <span className="font-bold text-foreground underline underline-offset-4 decoration-primary">performance</span>
          </p>
        </div>
        <div className="flex gap-3">
          {suppliers.length > 0 && (
            <Button 
              variant="outline" 
              onClick={handleExportPDF}
              className="h-10 font-bold border-2"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
          <AddSupplierDialog onSupplierAdded={handleSupplierAdded} />
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Suppliers */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Truck className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Suppliers</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              {suppliers.length}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">SUPPLY NETWORK</span>
              <Badge className="bg-blue-500/10 text-blue-400 border-none font-black">{activeSuppliers} Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active Suppliers */}
        <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 group hover:border-emerald-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400 uppercase tracking-[2px]">Active Suppliers</p>
            </div>
            <div className="text-4xl font-black text-emerald-700 dark:text-emerald-500 tracking-tighter">
              {activeSuppliers} <span className="text-sm font-medium opacity-60">Partners</span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-emerald-200 dark:bg-emerald-900/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-1000" 
                  style={{ width: `${suppliers.length > 0 ? (activeSuppliers / suppliers.length) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[9px] mt-2 font-bold text-emerald-600/80">
                {suppliers.length > 0 ? Math.round((activeSuppliers / suppliers.length) * 100) : 0}% ACTIVE RATE
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Suppliers */}
        <Card className="border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 group hover:border-amber-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-amber-500/10 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-[10px] font-black text-amber-600/60 dark:text-amber-400 uppercase tracking-[2px]">Inactive Suppliers</p>
            </div>
            <div className="text-4xl font-black text-amber-700 dark:text-amber-500 tracking-tighter">
              {inactiveSuppliers} <span className="text-sm font-medium opacity-60">Need Review</span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-amber-200 dark:bg-amber-900/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-600 h-full transition-all duration-1000" 
                  style={{ width: `${suppliers.length > 0 ? (inactiveSuppliers / suppliers.length) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[9px] mt-2 font-bold text-amber-600/80">REQUIRES ATTENTION</p>
            </div>
          </CardContent>
        </Card>

        {/* New This Month */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-purple-100 dark:bg-purple-950/40 p-2 rounded-lg">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">This Month</p>
                  <p className="text-xl font-black text-purple-600">
                    {thisMonthSuppliers}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">New Suppliers</span>
                  <span>{thisMonthSuppliers} Onboarded</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full transition-all duration-1000" 
                    style={{ width: `${suppliers.length > 0 ? Math.min((thisMonthSuppliers / suppliers.length) * 100, 100) : 0}%` }} 
                  />
                </div>
              </div>
            </div>
            <p className="text-[9px] font-bold text-purple-600/80 mt-4 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Network expansion
            </p>
          </div>
        </Card>
      </div>

      {/* SUPPLIERS TABLE */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black">All Suppliers</CardTitle>
              <CardDescription className="text-sm font-medium">View and manage all your supplier relationships</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {/* Search and Filters */}
          <div className="space-y-4 p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search suppliers by name, code, or contact..." 
                  className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 font-bold border-2"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-slate-200 dark:border-slate-800">
                <div className="flex-1">
                  <Label className="text-xs font-black mb-2 block uppercase tracking-wider">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-bold">All Suppliers</SelectItem>
                      <SelectItem value="active" className="font-bold">Active Only</SelectItem>
                      <SelectItem value="inactive" className="font-bold">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStatusFilter("all")
                      setSearchQuery("")
                    }}
                    className="h-11 font-bold"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {(statusFilter !== "all" || searchQuery) && (
              <div className="flex gap-2 items-center">
                <span className="text-xs font-black text-muted-foreground uppercase">Active filters:</span>
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="font-bold">
                    Status: {statusFilter}
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="font-bold">
                    Search: "{searchQuery}"
                  </Badge>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Truck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Suppliers...</p>
            </div>
          ) : error ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <p className="font-black text-lg">Error Loading Data</p>
                <p className="text-muted-foreground text-sm">{error}</p>
              </div>
              <Button onClick={fetchSuppliers} variant="outline" className="font-bold border-2">
                Retry Connection
              </Button>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <Truck className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black">
                {searchQuery || statusFilter !== "all" ? "No Suppliers Found" : "No Suppliers Yet"}
              </h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search criteria or filters" 
                  : "Get started by adding your first supplier to the network"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <div className="mt-6">
                  <AddSupplierDialog onSupplierAdded={handleSupplierAdded} />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                    <tr className="border-b-2">
                      <th className="text-left p-4 text-[10px] font-black text-foreground uppercase tracking-widest">Supplier</th>
                      <th className="text-left p-4 text-[10px] font-black text-foreground uppercase tracking-widest">Code</th>
                      <th className="text-left p-4 text-[10px] font-black text-foreground uppercase tracking-widest">Contact</th>
                      <th className="text-left p-4 text-[10px] font-black text-foreground uppercase tracking-widest">Email</th>
                      <th className="text-left p-4 text-[10px] font-black text-foreground uppercase tracking-widest">Phone</th>
                      <th className="text-left p-4 text-[10px] font-black text-foreground uppercase tracking-widest">Status</th>
                      <th className="text-left p-4 text-[10px] font-black text-foreground uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{supplier.supplier_name}</p>
                            <p className="text-xs text-muted-foreground font-bold">
                              Added {new Date(supplier.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-mono text-[10px] font-black bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            {supplier.supplier_code}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-foreground">
                            {supplier.contact_person.Valid ? supplier.contact_person.String : "N/A"}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">
                              {supplier.email.Valid ? supplier.email.String : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{supplier.phone.Valid ? supplier.phone.String : "N/A"}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={supplier.is_active ? "default" : "secondary"} 
                            className={`font-black text-[8px] uppercase px-2.5 py-1 border-none ${
                              supplier.is_active 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {supplier.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 font-bold hover:bg-primary/10"
                            onClick={() => handleViewDetails(supplier.id)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Showing <span className="text-foreground">{startIndex + 1}</span> to <span className="text-foreground">{Math.min(endIndex, filteredSuppliers.length)}</span> of {filteredSuppliers.length} suppliers
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-2 font-bold"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Prev
                    </Button>

                    <div className="flex items-center gap-1.5 mx-2">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-xs font-bold">...</span>
                        ) : (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageClick(page as number)}
                            className={`h-9 w-9 text-xs font-black border-2 transition-all ${
                              currentPage === page ? 'shadow-md scale-105' : 'hover:bg-slate-100'
                            }`}
                          >
                            {page}
                          </Button>
                        )
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-2 font-bold"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Supplier Details Dialog */}
      <SupplierDetailsDialog
        supplierId={detailsSupplierId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <ShieldCheck className="h-3 w-3" />
          Secure Supplier Data
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