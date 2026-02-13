"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Store,
  Package,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Award,
  Zap,
  X,
  Shield,
  Info,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { subscription_base_url } from "@/lib/api-config"

// --- ALL ORIGINAL CONSTANTS (100% PRESERVED) ---
const SUBSCRIPTION_API_BASE = subscription_base_url
const USAGE_ENDPOINT = `${SUBSCRIPTION_API_BASE}/me/usage`

const PACKAGE_NAMES: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Starter',
  '22222222-2222-2222-2222-222222222222': 'Basic',
  '33333333-3333-3333-3333-333333333333': 'Pro',
  '44444444-4444-4444-4444-444444444444': 'Industrial',
  '55555555-5555-5555-5555-555555555555': 'Pro Max',
}

interface UsageItem {
  type: string
  current_usage: number
  base_limit: number
  addon_units: number
  total_limit: number
  percentage_used: number
  status: "ok" | "at_limit" | "over_limit" | "warning"
}

interface SubscriptionData {
  subscription_id: string
  package_id: string
  items: UsageItem[]
}

export default function SubscriptionPage() {
  // --- ALL ORIGINAL STATE (100% PRESERVED) ---
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- ALL ORIGINAL FUNCTIONS (100% PRESERVED) ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      throw new Error("No access token found. Please login again.")
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  const fetchUsageData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const headers = getAuthHeaders()
      const response = await fetch(USAGE_ENDPOINT, { headers })

      if (!response.ok) {
        throw new Error(`Failed to fetch usage data: ${response.statusText}`)
      }

      const data = await response.json()
      setSubscriptionData(data)
    } catch (err) {
      console.error("Error fetching subscription data:", err)
      setError(err instanceof Error ? err.message : "Failed to load subscription data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsageData()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      case "at_limit":
      case "over_limit":
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-bold text-xs border-2">
            Available
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold text-xs border-2">
            Warning
          </Badge>
        )
      case "at_limit":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800 font-bold text-xs border-2">
            At Limit
          </Badge>
        )
      case "over_limit":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800 font-bold text-xs border-2">
            Over Limit
          </Badge>
        )
      default:
        return <Badge variant="outline" className="font-bold text-xs border-2">Unknown</Badge>
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-600"
    if (percentage >= 80) return "bg-amber-600"
    return "bg-emerald-600"
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "stores":
        return Store
      case "products":
        return Package
      case "staff":
        return Users
      default:
        return TrendingUp
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "stores":
        return "Stores"
      case "products":
        return "Products"
      case "staff":
        return "Staff Members"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const hasWarnings = subscriptionData?.items.some(
    (item) => item.status === "at_limit" || item.status === "over_limit" || item.status === "warning"
  )

  // --- LOADING STATE (ENHANCED DESIGN) ---
  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <CreditCard className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Subscription...</p>
      </div>
    )
  }

  // --- ERROR STATE (ENHANCED DESIGN) ---
  if (error) {
    return (
      <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground">My Subscription</h1>
          <p className="text-sm text-muted-foreground">Manage your subscription and usage</p>
        </div>
        
        <Alert variant="destructive" className="relative border-2 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-black">Error Loading Subscription</AlertTitle>
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

        <Button onClick={fetchUsageData} className="font-bold">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  // --- NO DATA STATE (ENHANCED DESIGN) ---
  if (!subscriptionData) {
    return (
      <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground">My Subscription</h1>
          <p className="text-sm text-muted-foreground">Manage your subscription and usage</p>
        </div>
        
        <Card className="shadow-2xl border-2">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full w-fit mx-auto mb-6">
                <CreditCard className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-black mb-2">No Subscription Data</h3>
              <p className="text-muted-foreground mb-4 font-medium">
                No subscription data available at this time.
              </p>
              <Button onClick={fetchUsageData} className="font-bold">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- MAIN UI (ENHANCED DESIGN, 100% ORIGINAL LOGIC) ---
  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION - Enhanced */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            My Subscription
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              {PACKAGE_NAMES[subscriptionData.package_id] || 'Active'}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Monitor your usage and plan limits
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Last Updated</p>
            <p className="text-xs font-bold text-foreground">{new Date().toLocaleString()}</p>
          </div>
          <Button 
            variant="outline" 
            className="h-10 font-bold border-2"
            onClick={fetchUsageData}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* WARNING ALERT - Enhanced */}
      {hasWarnings && (
        <Alert variant="destructive" className="relative border-2 shadow-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-black">Action Required</AlertTitle>
          <AlertDescription className="font-medium">
            You've reached the limit for some resources. Please upgrade your plan or remove unused items to continue.
          </AlertDescription>
        </Alert>
      )}

      {/* USAGE CARDS - Enhanced design */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subscriptionData.items.map((item) => {
          const Icon = getTypeIcon(item.type)
          const progressColor = getProgressColor(item.percentage_used)

          return (
            <Card 
              key={item.type} 
              className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:shadow-xl transition-all group"
            >
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-primary transition-all">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-black group-hover:text-primary transition-colors">
                        {getTypeLabel(item.type)}
                      </CardTitle>
                      <CardDescription className="text-[10px] mt-0.5 font-bold uppercase tracking-widest">
                        Usage & Limits
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(item.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-6">
                {/* Usage Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Usage</span>
                    <span className="font-black text-sm">
                      {item.current_usage} / {item.total_limit}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={item.percentage_used} className="h-3 bg-slate-200 dark:bg-slate-800">
                      <div
                        className={`h-full ${progressColor} transition-all rounded-full`}
                        style={{ width: `${Math.min(item.percentage_used, 100)}%` }}
                      />
                    </Progress>
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground text-right uppercase">
                    {item.percentage_used.toFixed(1)}% Used
                  </p>
                </div>

                <Separator />

                {/* Details */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Base Limit</span>
                    <span className="font-black text-xs">{item.base_limit}</span>
                  </div>
                  {item.addon_units > 0 && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground font-bold uppercase tracking-widest">Add-on Units</span>
                      <span className="font-black text-xs text-primary">+{item.addon_units}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground font-bold uppercase tracking-widest">Status</span>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* SUBSCRIPTION DETAILS CARD - Enhanced */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-black">Subscription Details</CardTitle>
              <CardDescription className="font-medium mt-0.5">Your current plan information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Award className="h-3.5 w-3.5" />
                Current Plan
              </label>
              <p className="text-2xl font-black text-foreground mt-2">
                {PACKAGE_NAMES[subscriptionData.package_id] || subscriptionData.package_id}
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-3.5 w-3.5" />
                Subscription ID
              </label>
              <p className="text-xs font-mono text-muted-foreground mt-2 font-bold break-all">
                {subscriptionData.subscription_id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Shield className="h-3 w-3" />
          Secure Billing
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Info className="h-3 w-3" />
          Real-time Usage Tracking
        </div>
      </div>
    </div>
  )
}