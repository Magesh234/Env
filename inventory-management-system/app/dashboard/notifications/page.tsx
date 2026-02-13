"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, AlertTriangle, Info, CheckCircle, Package, DollarSign, 
  TrendingUp, Clock, Check, Loader2, Trash2, X, BarChart3,
  Search, ShieldCheck, Archive, Sparkles, ChevronLeft, ChevronRight
} from "lucide-react"
import { notifications_base_url } from "@/lib/api-config"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip 
} from "recharts"

const API_BASE = notifications_base_url
const NOTIFICATIONS_ENDPOINT = `${API_BASE}/notifications`
const ITEMS_PER_PAGE = 10
const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]

interface Notification {
  id: string
  business_owner_id: string
  title: string
  message: string
  type: string
  priority: string
  is_read: boolean
  action_url: string
  metadata: any
  created_at: string
}

interface NotificationStats {
  total: number
  unread: number
  read: number
  by_type: { [key: string]: number }
  by_priority: { [key: string]: number }
}

interface ToastNotification extends Notification {
  toastId: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const lastNotificationIdRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const fetchNotifications = async (isRead?: boolean) => {
    setIsLoading(true)
    setFetchError(null)

    try {
      const token = getToken()
      if (!token) {
        setFetchError("Authentication error: No access token found. Please log in.")
        return
      }

      let url = NOTIFICATIONS_ENDPOINT
      if (isRead !== undefined) {
        url += `?is_read=${isRead}`
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch notifications: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data && Array.isArray(result.data)) {
        setNotifications(result.data)
      } else {
        setNotifications([])
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setFetchError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/unread`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUnreadCount(result.unread_count)
        }
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setStats(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const checkForNewNotifications = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}?is_read=false`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data && Array.isArray(result.data)) {
          const newNotifications = result.data as Notification[]
          
          if (newNotifications.length > 0) {
            const latestNotification = newNotifications[0]
            
            if (lastNotificationIdRef.current !== latestNotification.id) {
              lastNotificationIdRef.current = latestNotification.id
              
              showToast(latestNotification)
              
              setNotifications(prev => {
                const exists = prev.find(n => n.id === latestNotification.id)
                if (!exists) {
                  return [latestNotification, ...prev]
                }
                return prev
              })
              
              fetchUnreadCount()
              fetchStats()
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking for new notifications:", error)
    }
  }

  const showToast = (notification: Notification) => {
    const toastId = `${notification.id}-${Date.now()}`
    const toastNotif: ToastNotification = { ...notification, toastId }
    
    setToastNotifications(prev => [...prev, toastNotif])
    
    setTimeout(() => {
      setToastNotifications(prev => prev.filter(n => n.toastId !== toastId))
    }, 3000)
  }

  const dismissToast = (toastId: string) => {
    setToastNotifications(prev => prev.filter(n => n.toastId !== toastId))
  }

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
    fetchStats()

    // Poll every 3 seconds for near real-time notifications
    pollingIntervalRef.current = setInterval(() => {
      checkForNewNotifications()
    }, 3000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      const token = getToken()
      if (!token) {
        alert("Authentication error: Please log in.")
        return
      }

      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
        )
        fetchUnreadCount()
        fetchStats()
      } else {
        const error = await response.json()
        alert(`Failed to mark as read: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error marking as read:", error)
      alert("Failed to mark notification as read")
    } finally {
      setActionLoading(null)
    }
  }

  const markAllAsRead = async () => {
    setActionLoading("mark-all")
    try {
      const token = getToken()
      if (!token) {
        alert("Authentication error: Please log in.")
        return
      }

      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/mark-all-read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        fetchStats()
      } else {
        const error = await response.json()
        alert(`Failed to mark all as read: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
      alert("Failed to mark all notifications as read")
    } finally {
      setActionLoading(null)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return

    setActionLoading(notificationId)
    try {
      const token = getToken()
      if (!token) {
        alert("Authentication error: Please log in.")
        return
      }

      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        fetchUnreadCount()
        fetchStats()
      } else {
        const error = await response.json()
        alert(`Failed to delete notification: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
      alert("Failed to delete notification")
    } finally {
      setActionLoading(null)
    }
  }

  const clearAllNotifications = async () => {
    if (!confirm("Are you sure you want to clear ALL notifications? This action cannot be undone.")) return

    setActionLoading("clear-all")
    try {
      const token = getToken()
      if (!token) {
        alert("Authentication error: Please log in.")
        return
      }

      const response = await fetch(`${NOTIFICATIONS_ENDPOINT}/clear-all`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
        fetchStats()
      } else {
        const error = await response.json()
        alert(`Failed to clear notifications: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error clearing notifications:", error)
      alert("Failed to clear all notifications")
    } finally {
      setActionLoading(null)
    }
  }

  const getIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes("warning") || lowerType.includes("alert") || lowerType.includes("low_stock")) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
    if (lowerType.includes("success") || lowerType.includes("completed") || lowerType.includes("payment")) {
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    }
    return <Info className="h-5 w-5 text-blue-500" />
  }

  const getCategoryIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes("inventory") || lowerType.includes("stock") || lowerType.includes("product")) {
      return <Package className="h-4 w-4" />
    }
    if (lowerType.includes("sale") || lowerType.includes("invoice")) {
      return <DollarSign className="h-4 w-4" />
    }
    if (lowerType.includes("debt") || lowerType.includes("payment")) {
      return <TrendingUp className="h-4 w-4" />
    }
    return <Bell className="h-4 w-4" />
  }

  const getCategoryName = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes("inventory") || lowerType.includes("stock") || lowerType.includes("product")) {
      return "inventory"
    }
    if (lowerType.includes("sale") || lowerType.includes("invoice")) {
      return "sales"
    }
    if (lowerType.includes("debt") || lowerType.includes("payment")) {
      return "debts"
    }
    return "general"
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900"
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    }
  }

  const warningsCount = notifications.filter((n) => n.priority === "high" || n.type.includes("warning")).length
  const todayCount = notifications.filter((n) => {
    const notifDate = new Date(n.created_at)
    const today = new Date()
    return notifDate.toDateString() === today.toDateString()
  }).length

  const filteredNotifications = notifications.filter(
    (notif) =>
      notif.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE)
  const paginatedNotifications = filteredNotifications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const paginatedUnread = filteredNotifications.filter(n => !n.is_read).slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const paginatedInventory = filteredNotifications.filter(n => getCategoryName(n.type) === "inventory").slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const paginatedSales = filteredNotifications.filter(n => getCategoryName(n.type) === "sales").slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

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

  const renderNotification = (notification: Notification) => (
    <div
      key={notification.id}
      className={`group flex items-start gap-4 p-5 border-2 rounded-xl transition-all duration-300 hover:shadow-lg ${
        !notification.is_read 
          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 hover:border-blue-400" 
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
      }`}
    >
      <div className="mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-foreground">{notification.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 font-medium">{notification.message}</p>
          </div>
          <div className="flex items-center gap-2">
            {!notification.is_read && (
              <Badge variant="default" className="bg-blue-500 text-white border-none font-black text-[8px] uppercase px-2 py-0">
                <Sparkles className="h-3 w-3 mr-1" />
                New
              </Badge>
            )}
            {notification.priority && (
              <Badge variant="outline" className={`${getPriorityColor(notification.priority)} font-black text-[8px] uppercase`}>
                {notification.priority}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs font-bold">
          <div className="flex items-center gap-1 text-muted-foreground">
            {getCategoryIcon(notification.type)}
            <span className="capitalize">{getCategoryName(notification.type)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {getTimeAgo(notification.created_at)}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          {!notification.is_read && (
            <Button
              size="sm"
              variant="default"
              className="h-8 font-bold"
              onClick={() => markAsRead(notification.id)}
              disabled={actionLoading === notification.id}
            >
              {actionLoading === notification.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Mark Read
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 font-bold border-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={() => deleteNotification(notification.id)}
            disabled={actionLoading === notification.id}
          >
            {actionLoading === notification.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* Toast Notifications Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toastNotifications.map((toast) => (
          <div
            key={toast.toastId}
            className="pointer-events-auto bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-[400px] animate-in slide-in-from-right-5 duration-300 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800">{getIcon(toast.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-black text-sm text-foreground">{toast.title}</h4>
                  <button
                    onClick={() => dismissToast(toast.toastId)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 font-medium">
                  {toast.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {toast.priority === "high" && (
                    <Badge variant="outline" className={`${getPriorityColor(toast.priority)} text-xs font-black`}>
                      High Priority
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground font-bold">Just now</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Notifications
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Live Updates
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Stay updated with system activities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 font-bold border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                <BarChart3 className="mr-2 h-4 w-4 text-emerald-500" />
                Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-black">Notification Analytics</DialogTitle>
                <DialogDescription>Distribution of your notifications</DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Read Rate</p>
                  <p className="text-2xl font-black text-emerald-500">{(((stats?.read || 0)/(stats?.total || 1))*100).toFixed(0)}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">High Priority</p>
                  <p className="text-2xl font-black text-red-500">{warningsCount}</p>
                </div>
              </div>

              <div className="h-[300px] w-full mt-6">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={[
                        { name: 'Read', value: stats?.read || 0 }, 
                        { name: 'Unread', value: unreadCount },
                      ]} 
                      innerRadius={70} 
                      outerRadius={95} 
                      paddingAngle={8} 
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
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

          <Button
            variant="outline"
            className="h-10 font-bold border-2"
            onClick={markAllAsRead}
            disabled={actionLoading === "mark-all" || unreadCount === 0}
          >
            {actionLoading === "mark-all" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Mark All Read
          </Button>
          <Button
            variant="outline"
            className="h-10 font-bold border-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={clearAllNotifications}
            disabled={actionLoading === "clear-all" || notifications.length === 0}
          >
            {actionLoading === "clear-all" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Clear All
          </Button>
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Notifications */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bell className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Bell className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              {stats?.total || notifications.length}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">All notifications</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Unread */}
        <Card className="border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 group hover:border-blue-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[10px] font-black text-blue-600/60 dark:text-blue-400 uppercase tracking-[2px]">Unread</p>
            </div>
            <div className="text-4xl font-black text-blue-700 dark:text-blue-500 tracking-tighter">
              {unreadCount}
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-blue-600/80">Needs attention</p>
              <div className="w-full bg-blue-200 dark:bg-blue-900/40 h-1.5 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-blue-600 h-full transition-all duration-1000" 
                  style={{ width: `${(unreadCount / (notifications.length || 1)) * 100}%` }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        <Card className="border-yellow-100 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-[10px] font-black text-yellow-600/60 dark:text-yellow-400 uppercase tracking-[2px]">Warnings</p>
            </div>
            <div className="text-4xl font-black text-yellow-700 dark:text-yellow-500 tracking-tighter">
              {warningsCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" /> Requires action
            </p>
          </CardContent>
        </Card>

        {/* Today */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-lg">
                  <Clock className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Today</p>
                  <p className="text-xl font-black text-emerald-600">{todayCount}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Recent Updates</span>
                  <span>{todayCount} items</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(todayCount/(notifications.length || 1))*100}%` }} />
                </div>
              </div>
            </div>
            <p className="text-[9px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1">
              <Info className="h-3 w-3" /> Last 24 hours
            </p>
          </div>
        </Card>
      </div>

      {/* ERROR STATE */}
      {fetchError && (
        <Card className="border-red-500 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="font-black text-lg text-red-700 dark:text-red-500 mb-2">Error Loading Notifications</p>
              <p className="text-sm text-muted-foreground mb-4">{fetchError}</p>
              <Button variant="outline" onClick={() => fetchNotifications()} className="font-bold border-2">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MAIN NOTIFICATIONS CARD */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-black">Recent Notifications</CardTitle>
              <CardDescription className="font-medium mt-1">View and manage all system notifications and alerts</CardDescription>
            </div>
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Bell className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                {searchTerm ? (
                  <Search className="h-10 w-10 text-slate-400" />
                ) : (
                  <Bell className="h-10 w-10 text-slate-400" />
                )}
              </div>
              <h3 className="text-xl font-black">
                {searchTerm ? "No Results Found" : "No Notifications"}
              </h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                {searchTerm 
                  ? "Try adjusting your search query" 
                  : "You're all caught up!"}
              </p>
              {searchTerm && (
                <Button variant="link" className="mt-4 font-bold" onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
                  All ({filteredNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
                  Unread ({filteredNotifications.filter(n => !n.is_read).length})
                </TabsTrigger>
                <TabsTrigger value="inventory" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
                  Inventory ({filteredNotifications.filter(n => getCategoryName(n.type) === "inventory").length})
                </TabsTrigger>
                <TabsTrigger value="sales" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 font-bold rounded-lg">
                  Sales ({filteredNotifications.filter(n => getCategoryName(n.type) === "sales").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {paginatedNotifications.length === 0 ? (
                  <div className="text-center py-20">
                    <Archive className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                    <p className="font-black text-muted-foreground">No notifications on this page</p>
                  </div>
                ) : (
                  paginatedNotifications.map(renderNotification)
                )}
              </TabsContent>

              <TabsContent value="unread" className="space-y-4">
                {paginatedUnread.length === 0 ? (
                  <div className="text-center py-20">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-black mb-2">All Caught Up!</h3>
                    <p className="text-muted-foreground font-medium">No unread notifications</p>
                  </div>
                ) : (
                  paginatedUnread.map(renderNotification)
                )}
              </TabsContent>

              <TabsContent value="inventory" className="space-y-4">
                {paginatedInventory.length === 0 ? (
                  <div className="text-center py-20">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-black mb-2">No Inventory Notifications</h3>
                    <p className="text-muted-foreground font-medium">No inventory updates at this time</p>
                  </div>
                ) : (
                  paginatedInventory.map(renderNotification)
                )}
              </TabsContent>

              <TabsContent value="sales" className="space-y-4">
                {paginatedSales.length === 0 ? (
                  <div className="text-center py-20">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-black mb-2">No Sales Notifications</h3>
                    <p className="text-muted-foreground font-medium">No sales updates at this time</p>
                  </div>
                ) : (
                  paginatedSales.map(renderNotification)
                )}
              </TabsContent>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredNotifications.length)} of {filteredNotifications.length}
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
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <ShieldCheck className="h-3 w-3" />
          Secure Notifications
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