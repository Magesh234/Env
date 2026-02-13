"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronDown,
  UserCog,
  Bell,
  Activity,
  Settings,
  TrendingUp,
  ArrowLeftRight,
  Truck,
  Building2,
  User,
  RotateCcw,
  ChevronLeft,
  Check,
  MapPin,
  ChevronRight,
  AlertTriangle,
  Info,
  Barcode,
  CheckCircle,
  Trash2,
  Zap,
  Crown,
  Sparkles,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavItemWithDropdown } from "@/components/nav-item-with-dropdown"
import { Badge } from "@/components/ui/badge"
import { notifications_base_url, inventory_base_url } from "@/lib/api-config"
import { FloatingPosButton } from "@/components/floating-pos-button"
import { StoreProvider, useStore } from "@/lib/store-context"
import { Input } from "@/components/ui/input"
import { InventoryCacheProvider } from '@/contexts/InventoryCacheContext'
import { Analytics } from "@vercel/analytics/next"

const API_BASE = notifications_base_url
const NOTIFICATIONS_ENDPOINT = `${API_BASE}/notifications`
const INVENTORY_API_BASE = inventory_base_url

interface User {
  id: string
  email: string
  first_name: string
  primary_role: string
}

interface StoreData {
  id: string
  store_name: string
  location?: string
  [key: string]: any
}

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

interface ToastNotification extends Notification {
  toastId: string
  dismissTime: number
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { selectedStore, setSelectedStore, storeName, setStoreName } = useStore()
  const [user, setUser] = useState<User | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isStoreSwitcherOpen, setIsStoreSwitcherOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [stores, setStores] = useState<StoreData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([])
  const lastNotificationIdRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const toastTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({})
  const hoveredToastRef = useRef<string | null>(null)
  const shownNotificationIdsRef = useRef<Set<string>>(new Set())
  const audioEnabledRef = useRef(false)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // ─── FIX 1: Unified token getter — checks sessionStorage first, then localStorage ───
  const getToken = useCallback((): string | null => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }, [])

  // ─── FIX 1: Central auth-error handler — clears all tokens and routes to login ───
  const handleAuthError = useCallback(() => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("access_token")
    router.push("/")
  }, [router])

  // ─── FIX 1: authFetch — wraps every API call; auto-redirects on 401 (expired token) ───
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const token = getToken()
      if (!token) {
        handleAuthError()
        throw new Error("No access token")
      }
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          ...(options.headers ?? {}),
        },
      })
      if (response.status === 401) {
        handleAuthError()
        throw new Error("Session expired")
      }
      return response
    },
    [getToken, handleAuthError]
  )

  useEffect(() => {
    const enableAudio = () => {
      if (!audioEnabledRef.current) {
        audioElementRef.current = new Audio("/mixkit-correct-answer-tone-2870.wav")
        audioElementRef.current.volume = 0.5
        audioElementRef.current.load()
        audioEnabledRef.current = true
        document.removeEventListener("click", enableAudio)
        document.removeEventListener("keydown", enableAudio)
        document.removeEventListener("touchstart", enableAudio)
      }
    }
    document.addEventListener("click", enableAudio)
    document.addEventListener("keydown", enableAudio)
    document.addEventListener("touchstart", enableAudio)
    return () => {
      document.removeEventListener("click", enableAudio)
      document.removeEventListener("keydown", enableAudio)
      document.removeEventListener("touchstart", enableAudio)
    }
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/eruda'
    document.body.appendChild(script)
    script.onload = () => {
      // @ts-ignore
      window.eruda.init()
    }
  }, [])

  // ─── FIX 1: Use unified getToken() for initial auth check (not raw localStorage) ───
  useEffect(() => {
    const token = getToken()
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/")
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch {
      // Corrupted user data — treat as logged out
      handleAuthError()
    }
  }, [router, getToken, handleAuthError])

  const isJsonResponse = (response: Response): boolean => {
    const contentType = response.headers.get("content-type")
    return contentType ? contentType.includes("application/json") : false
  }

  // ─── All fetch functions now use authFetch so any 401 auto-redirects to login ───

  const fetchStores = async () => {
    try {
      const response = await authFetch(`${INVENTORY_API_BASE}/stores`)
      if (!response.ok || !isJsonResponse(response)) {
        setStores([])
        return
      }
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setStores(data.data)
        if (data.data.length > 0 && !selectedStore) {
          setSelectedStore(data.data[0].id)
          setStoreName(data.data[0].store_name)
        }
      } else {
        setStores([])
      }
    } catch {
      setStores([])
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const response = await authFetch(`${NOTIFICATIONS_ENDPOINT}/unread`)
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

  const playNotificationSound = () => {
    try {
      if (audioElementRef.current && audioEnabledRef.current) {
        const audio = audioElementRef.current.cloneNode() as HTMLAudioElement
        audio.volume = 0.5
        const playPromise = audio.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Audio playback failed:", error)
          })
        }
      } else {
        const audio = new Audio("/mixkit-correct-answer-tone-2870.wav")
        audio.volume = 0.5
        audio.play().catch(() => {})
      }
    } catch (e) {
      console.error("Audio error:", e)
    }
  }

  const checkForNewNotifications = async () => {
    try {
      const response = await authFetch(`${NOTIFICATIONS_ENDPOINT}?is_read=false`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data && Array.isArray(result.data)) {
          const allUnreadNotifications = result.data as Notification[]
          const newNotifications = allUnreadNotifications.filter(
            (notif) => !shownNotificationIdsRef.current.has(notif.id)
          )
          if (newNotifications.length > 0) {
            newNotifications.forEach((notif) => {
              showToast(notif)
              shownNotificationIdsRef.current.add(notif.id)
            })
            playNotificationSound()
            fetchUnreadCount()
          }
        }
      }
    } catch (error) {
      console.error("Error checking for new notifications:", error)
    }
  }

  const showToast = (notification: Notification) => {
    const toastId = `${notification.id}-${Date.now()}`
    const dismissTime = Date.now() + 5000
    const toastNotif: ToastNotification = { ...notification, toastId, dismissTime }
    setToastNotifications(prev => [...prev, toastNotif])
    toastTimersRef.current[toastId] = setTimeout(() => {
      if (hoveredToastRef.current !== toastId) {
        dismissToast(toastId)
      }
    }, 5000)
  }

  const dismissToast = (toastId: string) => {
    setToastNotifications(prev => prev.filter(n => n.toastId !== toastId))
    if (toastTimersRef.current[toastId]) {
      clearTimeout(toastTimersRef.current[toastId])
      delete toastTimersRef.current[toastId]
    }
  }

  const handleToastHover = (toastId: string, isHovering: boolean) => {
    if (isHovering) {
      hoveredToastRef.current = toastId
      if (toastTimersRef.current[toastId]) {
        clearTimeout(toastTimersRef.current[toastId])
        delete toastTimersRef.current[toastId]
      }
    } else {
      hoveredToastRef.current = null
      toastTimersRef.current[toastId] = setTimeout(() => {
        dismissToast(toastId)
      }, 1500)
    }
  }

  const markAsRead = async (notificationId: string, toastId: string) => {
    try {
      const response = await authFetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}/read`, {
        method: "PATCH",
      })
      if (response.ok) {
        dismissToast(toastId)
        fetchUnreadCount()
      }
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string, toastId: string) => {
    try {
      const response = await authFetch(`${NOTIFICATIONS_ENDPOINT}/${notificationId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        dismissToast(toastId)
        fetchUnreadCount()
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
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

  useEffect(() => {
    if (user) {
      fetchStores()
      fetchUnreadCount()
      pollingIntervalRef.current = setInterval(() => {
        checkForNewNotifications()
      }, 3000)
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
        Object.values(toastTimersRef.current).forEach(clearTimeout)
      }
    }
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("user")
    sessionStorage.removeItem("access_token")
    router.push("/")
  }

  const handleStoreSelect = (store: StoreData) => {
    setSelectedStore(store.id)
    setStoreName(store.store_name)
    setIsStoreSwitcherOpen(false)
    setSearchQuery("")
  }

  const filteredStores = stores.filter(store =>
    store.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (store.location && store.location.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["business_owner", "admin", "manager"] },
    { name: "Stores", href: "/dashboard/stores", icon: Store, roles: ["business_owner", "admin", "manager"] },
    { name: "Products", href: "/dashboard/products", icon: Package, roles: ["business_owner", "admin", "manager", "staff"] },
    { name: "Inventory", href: "/dashboard/inventory", icon: ShoppingCart, roles: ["business_owner", "admin", "manager"] },
    { name: "Sales", href: "/dashboard/sales", icon: FileText, roles: ["business_owner", "admin", "manager", "staff"] },
    { name: "Debts", href: "/dashboard/debts", icon: CreditCard, roles: ["business_owner", "admin", "manager"] },
    { name: "Customer", href: "/dashboard/clients", icon: Users, roles: ["business_owner", "admin", "manager", "staff"] },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["business_owner", "admin", "manager"] },
    { name: "Suppliers", href: "/dashboard/suppliers", icon: Truck, roles: ["business_owner", "admin", "manager", "staff"] },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3, roles: ["business_owner", "admin", "manager"] },
    { name: "Stock Transfer", href: "/dashboard/stock-transfer", icon: ArrowLeftRight, roles: ["business_owner", "admin", "manager", "staff"] },
    { name: "Barcode Assignment", href: "/dashboard/products/barcodes", icon: Barcode, roles: ["business_owner", "admin", "manager"] },
    { name: "Purchase Orders", href: "/dashboard/purchase-orders", icon: TrendingUp, roles: ["business_owner", "admin", "manager"] },
    { name: "Returns & Refunds", href: "/dashboard/returns", icon: RotateCcw, roles: ["business_owner", "admin", "manager", "staff"] },
    { name: "User Management", href: "/dashboard/users", icon: UserCog, roles: ["business_owner", "admin"] },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      roles: ["business_owner", "admin", "manager", "staff"],
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: "Activity Logs", href: "/dashboard/activity-logs", icon: Activity, roles: ["business_owner", "admin"] },
    { name: "Business Profile", href: "/dashboard/business-profile", icon: Building2, roles: ["business_owner"] },
    { name: "My Subscription", href: "/dashboard/subscription", icon: CreditCard, roles: ["business_owner"] },
    { name: "User Profile", href: "/dashboard/user-profile", icon: User, roles: ["business_owner", "admin", "manager", "staff"] },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, roles: ["business_owner", "admin"] },
  ]

  const filteredNavigation = navigation.filter((item) => item.roles.includes(user?.primary_role || ""))

  const getRoleBadgeConfig = (role: string) => {
    switch (role) {
      case "business_owner": return { icon: Crown, label: "Owner", color: "bg-gradient-to-r from-blue-500 to-cyan-500" }
      case "admin": return { icon: Zap, label: "Admin", color: "bg-gradient-to-r from-purple-500 to-pink-500" }
      case "manager": return { icon: Sparkles, label: "Manager", color: "bg-gradient-to-r from-emerald-500 to-green-500" }
      default: return { icon: User, label: "Staff", color: "bg-gradient-to-r from-slate-500 to-slate-600" }
    }
  }

  const roleBadge = user ? getRoleBadgeConfig(user.primary_role) : null

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Global Toast Notifications */}
      <div className="fixed top-20 right-4 z-[100] space-y-3 max-w-md">
        {toastNotifications.map((toast) => (
          <div
            key={toast.toastId}
            onMouseEnter={() => handleToastHover(toast.toastId, true)}
            onMouseLeave={() => handleToastHover(toast.toastId, false)}
            onClick={() => router.push("/dashboard/notifications")}
            className="bg-card border-2 border-border rounded-xl shadow-2xl p-4 cursor-pointer hover:shadow-3xl transition-all duration-200 hover:scale-[1.02] animate-in slide-in-from-right-5"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0">{getIcon(toast.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{toast.title}</h4>
                  {toast.priority === "high" && (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-[10px] h-5">
                      High
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{toast.message}</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={(e) => { e.stopPropagation(); markAsRead(toast.id, toast.toastId) }}
                  >
                    <Check className="h-3 w-3 mr-1" />Read
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(toast.id, toast.toastId) }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 ml-auto"
                    onClick={(e) => { e.stopPropagation(); dismissToast(toast.toastId) }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-background via-background to-muted/20 backdrop-blur-xl supports-[backdrop-filter]:bg-background/95 border-b shadow-sm z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-black text-sm">IMS</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <span className="font-black text-base tracking-tight">Inventory</span>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/notifications")}
                className="relative h-10 w-10 hover:bg-primary/10"
              >
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[9px] font-black bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-500 hover:to-pink-500 border-2 border-background animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              </Button>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-primary/10"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/*
        ─── FIX 2: Store Switcher Panel ───────────────────────────────────────────
        z-[60]: sits above the sidebar (z-40) and the mobile overlay (z-30 / z-[55])
        so it is never occluded or blurred out on mobile.
      */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-br from-background via-background to-muted/10 border-r-2 shadow-2xl z-[60] transition-transform duration-500 ease-out ${
          isStoreSwitcherOpen ? "translate-x-0" : "-translate-x-80"
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="relative h-28 px-6 flex flex-col justify-center border-b-2 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <Store className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">Store Locations</h2>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        {stores.length} Active
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsStoreSwitcherOpen(false)}
                  className="h-9 w-9 hover:bg-background/80 rounded-xl"
                  title="Collapse"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-5 border-b bg-muted/20">
            <div className="relative group">
              <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-background border-2 focus-visible:ring-primary font-medium rounded-xl"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30">
            {filteredStores.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Store className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">No stores found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = store.id === selectedStore
                return (
                  <button
                    key={store.id}
                    onClick={() => handleStoreSelect(store)}
                    className={`w-full text-left rounded-xl p-4 transition-all duration-300 group relative overflow-hidden ${
                      isSelected
                        ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-xl scale-[1.02] border-2 border-primary"
                        : "bg-card hover:bg-accent/50 border-2 border-border hover:border-primary/40 hover:shadow-lg"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-foreground/10 rounded-full blur-2xl" />
                    )}
                    <div className="flex items-start gap-3 relative z-10">
                      <div
                        className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          isSelected
                            ? "bg-primary-foreground/20 shadow-lg"
                            : "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110"
                        }`}
                      >
                        <Store className={`h-5 w-5 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className={`font-black text-sm truncate tracking-tight ${isSelected ? "text-primary-foreground" : "text-foreground"}`}>
                            {store.store_name}
                          </h3>
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <div className="h-6 w-6 rounded-lg bg-primary-foreground/20 flex items-center justify-center animate-pulse">
                                <Check className="h-3.5 w-3.5 text-primary-foreground font-bold" />
                              </div>
                            </div>
                          )}
                        </div>
                        {store.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className={`h-3 w-3 flex-shrink-0 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                            <p className={`text-xs truncate font-medium ${isSelected ? "text-primary-foreground/90" : "text-muted-foreground"}`}>
                              {store.location}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="p-5 border-t-2 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-muted-foreground uppercase tracking-wider">Active Store</span>
              <span className="text-foreground font-black">{storeName || "None"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 h-full w-72 bg-gradient-to-b from-background via-background to-muted/5 border-r-2 z-40 flex flex-col transition-all duration-500 shadow-xl ${
          isStoreSwitcherOpen ? "lg:left-80 left-0" : "left-0"
        } ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="h-14 px-5 flex items-center justify-between border-b-2 flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-xs">IMS</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight">Inventory</h1>
              <div className="flex items-center gap-1.5">
                {roleBadge && (
                  <>
                    <roleBadge.icon className="h-2.5 w-2.5 text-primary" />
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{roleBadge.label}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="hidden lg:block relative z-10">
            <ThemeToggle />
          </div>
        </div>

        <div className="px-4 py-4 border-b-2">
          <Button
            variant="outline"
            onClick={() => setIsStoreSwitcherOpen(!isStoreSwitcherOpen)}
            className="w-full justify-between h-auto p-4 hover:bg-accent/50 group relative overflow-hidden border-2 rounded-xl transition-all duration-300 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Current Store</p>
                <p className="text-sm font-black truncate tracking-tight">{storeName || "Select Store"}</p>
              </div>
            </div>
            <div className="relative z-10">
              {isStoreSwitcherOpen
                ? <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              }
            </div>
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30">
          {filteredNavigation.map((item) => (
            <NavItemWithDropdown
              key={item.name}
              name={item.name}
              href={item.href}
              icon={item.icon}
              badge={item.badge}
              onItemClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="flex-shrink-0 p-2 border-t-2 bg-gradient-to-r from-muted/30 to-transparent">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-auto p-2 hover:bg-accent/50 rounded-xl group transition-all duration-300 hover:shadow-md border-2 border-transparent hover:border-border">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative">
                    <div className={`h-9 w-9 rounded-xl ${roleBadge?.color} flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                      {user?.first_name[0]}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-background" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-xs font-black truncate tracking-tight">{user?.first_name}</p>
                    <p className="text-[9px] text-muted-foreground truncate font-bold uppercase tracking-wider">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border-2 shadow-2xl">
              <DropdownMenuLabel className="font-black">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/user-profile")} className="font-bold cursor-pointer">
                <User className="mr-2 h-4 w-4" />Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="font-bold cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="font-bold cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                <LogOut className="mr-2 h-4 w-4" />Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-500 ${isStoreSwitcherOpen ? "lg:pl-[608px]" : "lg:pl-72"} pt-16 lg:pt-0`}>
        <main className="min-h-screen">{children}</main>
      </div>

      {/*
        ─── FIX 2: Overlays ──────────────────────────────────────────────────────
        Two separate overlays so neither panel is obscured by its own backdrop.

        Sidebar overlay (z-30): only mounts when sidebar is open AND store switcher
        is closed, so the switcher panel is never covered by this backdrop.

        Switcher overlay (z-[55]): sits between the switcher (z-[60]) and everything
        else; tapping it closes the switcher panel.
      */}
      {isSidebarOpen && !isStoreSwitcherOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {isStoreSwitcherOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsStoreSwitcherOpen(false)}
        />
      )}

      <FloatingPosButton />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <InventoryCacheProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </InventoryCacheProvider>
    </StoreProvider>
  )
}