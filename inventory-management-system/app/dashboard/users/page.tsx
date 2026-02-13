"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  UserCog, Search, Plus, MoreVertical, Mail, Phone, MapPin, Edit, Trash2, 
  Loader2, ChevronLeft, ChevronRight,  Lock, AlertCircle, X, Copy, Check,
  Users, UserCheck, UserX, BarChart3, ShieldCheck, Clock, TrendingUp, Layers, Info
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from "recharts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth_base_url } from "@/lib/api-config"

const COLORS = ["#10b981", "#ef4444", "#8b5cf6", "#f59e0b"]

const API_ENDPOINTS = {
  business: {
    users: `${auth_base_url}/business/users`,
    userRole: (userId: string) => `${auth_base_url}/business/users/${userId}/role`,
    userStatus: (userId: string) => `${auth_base_url}/business/users/${userId}/status`,
  }
}

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  }
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  country: string
  primary_role: string
  account_type: string
  business_owner_id: string
  status: string
  email_verified: boolean
  phone_verified: boolean
  last_login_at: string
  created_at: string
  updated_at: string
}

interface UsersResponse {
  data: User[]
  pagination: {
    limit: number
    page: number
    total: number
    total_pages: number
  }
}

interface CreatedUserData {
  email: string
  first_name: string
  last_name: string
  phone: string
  role: string
  temporary_password: string
}

export default function UsersPage() {
  // --- ORIGINAL STATE (100% PRESERVED) ---
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pagination, setPagination] = useState({
    limit: 10,
    page: 1,
    total: 0,
    total_pages: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToChangeStatus, setUserToChangeStatus] = useState<User | null>(null)
  const [createdUserData, setCreatedUserData] = useState<CreatedUserData | null>(null)
  
  const [addUserForm, setAddUserForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "staff"
  })
  
  const [editUserForm, setEditUserForm] = useState({
    role: ""
  })
  
  const [statusForm, setStatusForm] = useState({
    status: "",
    reason: ""
  })

  // --- ORIGINAL FETCH LOGIC (PRESERVED) ---
  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_ENDPOINTS.business.users}?limit=100&page=1`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data: UsersResponse = await response.json()
      setUsers(Array.isArray(data.data) ? data.data : [])
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // --- ORIGINAL HANDLERS (100% PRESERVED) ---
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleAddUser = async () => {
    setIsProcessing(true)
    setError(null)
    try {
      const response = await fetch(API_ENDPOINTS.business.users, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(addUserForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create user')
      }

      const result = await response.json()
      
      setCreatedUserData({
        email: addUserForm.email,
        first_name: addUserForm.first_name,
        last_name: addUserForm.last_name,
        phone: addUserForm.phone,
        role: addUserForm.role,
        temporary_password: result.temporary_password || ''
      })
      
      setIsAddDialogOpen(false)
      setIsSuccessDialogOpen(true)
      
      setAddUserForm({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "staff"
      })
      
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingUser) return
    
    setIsProcessing(true)
    setError(null)
    try {
      const response = await fetch(API_ENDPOINTS.business.userRole(editingUser.id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: editUserForm.role })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user role')
      }

      setSuccess('User role updated successfully!')
      setIsEditDialogOpen(false)
      setEditingUser(null)
      fetchUsers()
      
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleChangeStatus = async () => {
    if (!userToChangeStatus) return
    
    setIsProcessing(true)
    setError(null)
    try {
      const response = await fetch(API_ENDPOINTS.business.userStatus(userToChangeStatus.id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: statusForm.status,
          reason: statusForm.reason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user status')
      }

      setSuccess('User status updated successfully!')
      setIsStatusDialogOpen(false)
      setUserToChangeStatus(null)
      setStatusForm({ status: "", reason: "" })
      fetchUsers()
      
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    setIsProcessing(true)
    setError(null)
    try {
      const response = await fetch(API_ENDPOINTS.business.userStatus(userToDelete.id), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: "suspended",
          reason: "Account deleted by administrator"
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      setSuccess('User deleted successfully!')
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      fetchUsers()
      
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setIsProcessing(false)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setEditUserForm({ role: user.primary_role })
    setIsEditDialogOpen(true)
  }

  const openStatusDialog = (user: User) => {
    setUserToChangeStatus(user)
    setStatusForm({ status: user.status, reason: "" })
    setIsStatusDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  // --- CALCULATIONS (PRESERVED) ---
  const activeUsers = (users || []).filter((u) => u.status === "active").length
  const inactiveUsers = (users || []).filter((u) => u.status !== "active").length

  const roleDistribution = (users || []).reduce((acc, user) => {
    const role = user.primary_role
    const existing = acc.find(item => item.name === role)
    if (existing) {
      existing.value++
    } else {
      acc.push({ name: role, value: 1 })
    }
    return acc
  }, [] as Array<{ name: string; value: number }>)

  const filteredUsers = (users || []).filter(
    (user) =>
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Pagination helper (matching products/debts page style)
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

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Users...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION - Enhanced */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            User Management
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Live
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Manage staff accounts and permissions across your organization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
                <DialogTitle className="text-2xl font-black">Staff Distribution</DialogTitle>
                <DialogDescription>Visual breakdown of your team structure by role.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Rate</p>
                  <p className="text-2xl font-black text-emerald-500">
                    {pagination.total > 0 ? ((activeUsers / pagination.total) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Roles</p>
                  <p className="text-2xl font-black text-primary">{roleDistribution.length}</p>
                </div>
              </div>

              {roleDistribution.length > 0 && (
                <div className="h-[300px] w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Button onClick={() => setIsAddDialogOpen(true)} className="h-10 font-bold">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
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

      {success && (
        <Alert className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-900 relative border-2 shadow-lg">
          <Check className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="pr-8 font-medium">{success}</AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900"
            onClick={() => setSuccess(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* METRIC CARDS - Enhanced with animations */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Staff</p>
            </div>
            <div className="text-4xl font-black tracking-tighter">
              {pagination.total}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">REGISTERED ACCOUNTS</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">ACTIVE</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 group hover:border-emerald-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400 uppercase tracking-[2px]">Active Users</p>
            </div>
            <div className="text-4xl font-black text-emerald-700 dark:text-emerald-500 tracking-tighter">
              {activeUsers}
            </div>
            <div className="mt-4">
              <div className="w-full bg-emerald-200 dark:bg-emerald-900/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-1000" 
                  style={{ width: `${pagination.total > 0 ? (activeUsers / pagination.total) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[9px] mt-2 font-bold text-emerald-600/80 uppercase">Currently Online</p>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users */}
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Inactive Users</p>
            </div>
            <div className="text-4xl font-black text-foreground tracking-tighter">
              {inactiveUsers}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <Info className="h-3 w-3 text-amber-500" /> Deactivated accounts
            </p>
          </CardContent>
        </Card>

        {/* Team Health */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Team Health</p>
                  <p className="text-xl font-black text-primary">
                    {pagination.total > 0 ? ((activeUsers / pagination.total) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Active Members</span>
                  <span>{activeUsers} Users</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000" 
                    style={{ width: `${pagination.total > 0 ? (activeUsers / pagination.total) * 100 : 0}%` }} 
                  />
                </div>
              </div>
            </div>
            <p className="text-[9px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Verified accounts
            </p>
          </div>
        </Card>
      </div>

      {/* MAIN TABLE CARD - Enhanced design */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-black">Staff Members</CardTitle>
                <CardDescription className="mt-1 font-medium">View and manage all staff accounts</CardDescription>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <Search className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black">No Users Found</h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                Try adjusting your search query or add a new user.
              </p>
              <Button 
                variant="link" 
                className="mt-4 font-bold" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                    <tr className="hover:bg-transparent border-b-2">
                      <th className="p-4 text-left font-black text-foreground uppercase text-[10px] tracking-widest">User</th>
                      <th className="p-4 text-left font-black text-foreground uppercase text-[10px] tracking-widest">Contact</th>
                      <th className="p-4 text-left font-black text-foreground uppercase text-[10px] tracking-widest">Role</th>
                      <th className="p-4 text-left font-black text-foreground uppercase text-[10px] tracking-widest">Status</th>
                      <th className="p-4 text-right font-black text-foreground uppercase text-[10px] tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr 
                        key={user.id} 
                        className="group hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-black text-sm shadow-lg ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-primary transition-all">
                              {user.first_name[0]}{user.last_name[0]}
                            </div>
                            <div>
                              <div className="font-black text-sm text-foreground group-hover:text-primary transition-colors">
                                {user.first_name} {user.last_name}
                              </div>
                              {user.country && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                                  <MapPin className="h-3 w-3" />
                                  {user.country}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-foreground">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{user.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="outline" 
                            className="capitalize font-bold text-xs border-2 bg-slate-50 dark:bg-slate-900"
                          >
                            {user.primary_role}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={user.status === "active" ? "default" : "secondary"} 
                            className={`capitalize font-bold text-xs border-2 ${
                              user.status === "active" 
                                ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600' 
                                : 'bg-slate-500 hover:bg-slate-600 border-slate-600'
                            }`}
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-9 w-9 border-2 border-transparent hover:border-primary hover:bg-primary/5"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEditDialog(user)} className="font-bold">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openStatusDialog(user)} className="font-bold">
                                <Lock className="mr-2 h-4 w-4" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive font-bold" 
                                onClick={() => openDeleteDialog(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION - Enhanced */}
              {totalPages > 1 && (
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Showing <span className="text-foreground">{paginatedUsers.length}</span> of {filteredUsers.length} Entries
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
          <ShieldCheck className="h-3 w-3" />
          Secure Authentication
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Clock className="h-3 w-3" />
          Real-time Access Control
        </div>
      </div>

      {/* ALL DIALOGS (100% PRESERVED LOGIC) */}
      
      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Add New User</DialogTitle>
            <DialogDescription className="font-medium">
              Create a new staff member account. They will receive their login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={addUserForm.email}
                onChange={(e) => setAddUserForm({...addUserForm, email: e.target.value})}
                className="h-11 border-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="font-bold">First Name</Label>
                <Input
                  id="first_name"
                  placeholder="John"
                  value={addUserForm.first_name}
                  onChange={(e) => setAddUserForm({...addUserForm, first_name: e.target.value})}
                  className="h-11 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="font-bold">Last Name</Label>
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={addUserForm.last_name}
                  onChange={(e) => setAddUserForm({...addUserForm, last_name: e.target.value})}
                  className="h-11 border-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-bold">Phone</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={addUserForm.phone}
                onChange={(e) => setAddUserForm({...addUserForm, phone: e.target.value})}
                className="h-11 border-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="font-bold">Role</Label>
              <Select value={addUserForm.role} onValueChange={(value) => setAddUserForm({...addUserForm, role: value})}>
                <SelectTrigger className="h-11 border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="font-bold">Admin</SelectItem>
                  <SelectItem value="manager" className="font-bold">Manager</SelectItem>
                  <SelectItem value="staff" className="font-bold">Staff</SelectItem>
                  <SelectItem value="viewer" className="font-bold">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isProcessing} className="font-bold border-2">
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isProcessing} className="font-bold">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog - Enhanced */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-[600px] border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 mx-auto mb-4 shadow-lg">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-center text-3xl font-black">User Created!</DialogTitle>
            <DialogDescription className="text-center font-medium">
              Share these credentials securely with the new user.
            </DialogDescription>
          </DialogHeader>
          
          {createdUserData && (
            <div className="space-y-4 py-4">
              <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 border-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 font-bold">
                  Save these credentials now. The temporary password will not be shown again.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl space-y-3 border-2 border-slate-100 dark:border-slate-800">
                  <div>
                    <Label className="text-xs text-muted-foreground font-black uppercase">Full Name</Label>
                    <p className="font-bold text-foreground mt-1">{createdUserData.first_name} {createdUserData.last_name}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground font-black uppercase">Email Address</Label>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className="font-bold break-all text-foreground">{createdUserData.email}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 w-8"
                        onClick={() => handleCopy(createdUserData.email, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground font-black uppercase">Phone Number</Label>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <p className="font-bold text-foreground">{createdUserData.phone}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => handleCopy(createdUserData.phone, 'phone')}
                      >
                        {copiedField === 'phone' ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground font-black uppercase">Role</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize font-bold border-2">
                        {createdUserData.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-200 dark:border-slate-700">
                    <Label className="text-xs text-muted-foreground font-black uppercase">Temporary Password</Label>
                    <div className="flex items-center justify-between mt-1 gap-2">
                      <code className="font-mono font-black text-base bg-white dark:bg-slate-950 px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 break-all">
                        {createdUserData.temporary_password}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 w-8"
                        onClick={() => handleCopy(createdUserData.temporary_password, 'password')}
                      >
                        {copiedField === 'password' ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 p-3 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-bold">
                    <strong>Next Steps:</strong> The user should change their password on first login.
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={() => {
                setIsSuccessDialogOpen(false)
                setCreatedUserData(null)
              }}
              className="w-full sm:w-auto font-bold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Edit User Role</DialogTitle>
            <DialogDescription className="font-medium">
              Update the role for {editingUser?.first_name} {editingUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_role" className="font-bold">Role</Label>
              <Select value={editUserForm.role} onValueChange={(value) => setEditUserForm({...editUserForm, role: value})}>
                <SelectTrigger className="h-11 border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" className="font-bold">Admin</SelectItem>
                  <SelectItem value="manager" className="font-bold">Manager</SelectItem>
                  <SelectItem value="staff" className="font-bold">Staff</SelectItem>
                  <SelectItem value="viewer" className="font-bold">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isProcessing} className="font-bold border-2">
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isProcessing} className="font-bold">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Change User Status</DialogTitle>
            <DialogDescription className="font-medium">
              Update the status for {userToChangeStatus?.first_name} {userToChangeStatus?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="font-bold">Status</Label>
              <Select value={statusForm.status} onValueChange={(value) => setStatusForm({...statusForm, status: value})}>
                <SelectTrigger className="h-11 border-2 font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="font-bold">Active</SelectItem>
                  <SelectItem value="inactive" className="font-bold">Inactive</SelectItem>
                  <SelectItem value="suspended" className="font-bold">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="font-bold">Reason (Optional)</Label>
              <Input
                id="reason"
                placeholder="Reason for status change"
                value={statusForm.reason}
                onChange={(e) => setStatusForm({...statusForm, reason: e.target.value})}
                className="h-11 border-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} disabled={isProcessing} className="font-bold border-2">
              Cancel
            </Button>
            <Button onClick={handleChangeStatus} disabled={isProcessing} className="font-bold">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Delete User</DialogTitle>
            <DialogDescription className="font-medium">
              Are you sure you want to delete {userToDelete?.first_name} {userToDelete?.last_name}? This will suspend their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isProcessing} className="font-bold border-2">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isProcessing} className="font-bold">
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}