"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  Building2, Bell, Shield, Database, Save, Lock, Loader2, 
  RefreshCw, AlertCircle, Sparkles, CheckCircle2, Mail,
  Phone, MapPin, FileText, BarChart3, Activity, Cloud,
  Download, Upload, History, Settings2, User, Zap,
  Globe, CreditCard, AlertTriangle, Info, Package
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import ChangePasswordModal from "@/components/forms/change-password-modal"
import { auth_base_url, subscription_base_url } from "@/lib/api-config"

// --- API Configuration ---
const API_BASE_URL = auth_base_url
const BUSINESS_PROFILE_ENDPOINT = `${API_BASE_URL}/business/profile`
const PACKAGE_LIMITS_ENDPOINT = `${subscription_base_url}/packages`

// --- Business Profile Interface ---
interface BusinessProfile {
  id: string
  business_owner_id: string
  business_name: string
  business_type: string
  subscription_plan: string
  subscription_status: string
  max_stores: number
  max_users: number
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// --- Package Limits Interface ---
interface PackageLimits {
  products: number
  staff: number
  stores: number
}

const BUSINESS_TYPES = [
  { value: "technology", label: "Technology", icon: "💻" },
  { value: "retail", label: "Retail", icon: "🛍️" },
  { value: "healthcare", label: "Healthcare", icon: "🏥" },
  { value: "finance", label: "Finance", icon: "💰" },
  { value: "education", label: "Education", icon: "📚" },
  { value: "hospitality", label: "Hospitality", icon: "🏨" },
  { value: "manufacturing", label: "Manufacturing", icon: "🏭" },
  { value: "other", label: "Other", icon: "📋" },
]

// Package ID mapping
const PACKAGE_IDS: Record<string, string> = {
  'Starter': '11111111-1111-1111-1111-111111111111',
  'Basic': '22222222-2222-2222-2222-222222222222',
  'Pro': '33333333-3333-3333-3333-333333333333',
  'Industrial': '44444444-4444-4444-4444-444444444444',
  'Pro Max': '55555555-5555-5555-5555-555555555555',
}

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [paymentReminders, setPaymentReminders] = useState(true)

  // Business profile state
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [packageLimits, setPackageLimits] = useState<PackageLimits | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  
  // Business form state
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [businessEmail, setBusinessEmail] = useState("")
  const [businessPhone, setBusinessPhone] = useState("")
  const [businessTax, setBusinessTax] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  
  const [isSavingBusiness, setIsSavingBusiness] = useState(false)
  const [businessSaveError, setBusinessSaveError] = useState<string | null>(null)
  const [businessSaveSuccess, setBusinessSaveSuccess] = useState(false)

  // Function to fetch package limits
  const fetchPackageLimits = async (packageName: string) => {
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found.")
      }

      // Get package ID from package name
      const packageId = PACKAGE_IDS[packageName]
      
      if (!packageId) {
        console.warn(`Unknown package name: ${packageName}`)
        return null
      }

      const response = await fetch(`${PACKAGE_LIMITS_ENDPOINT}/${packageId}/limits`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch package limits: ${errorBody.message || response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && result.limits) {
        setPackageLimits(result.limits)
      }
    } catch (err) {
      console.error("Error fetching package limits:", err)
      // Don't set error state here, as this is secondary data
      setPackageLimits(null)
    }
  }

  // Function to fetch business profile
  const fetchBusinessProfile = async () => {
    setIsLoadingProfile(true)
    setProfileError(null)
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found.")
      }

      const response = await fetch(BUSINESS_PROFILE_ENDPOINT, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(errorBody.message || "Failed to fetch business profile")
      }

      const result = await response.json()
      
      if (result.data) {
        setProfile(result.data)
        setBusinessName(result.data.business_name || "")
        setBusinessType(result.data.business_type || "")
        
        // Fetch package limits based on subscription plan
        if (result.data.subscription_plan) {
          await fetchPackageLimits(result.data.subscription_plan)
        }
      }
    } catch (err) {
      console.error("Error fetching business profile:", err)
      setProfileError(err instanceof Error ? err.message : "Failed to load business profile")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  // Fetch profile on mount
  useEffect(() => {
    fetchBusinessProfile()
  }, [])

  // Function to save business information
  const handleSaveBusinessInfo = async () => {
    setIsSavingBusiness(true)
    setBusinessSaveError(null)
    setBusinessSaveSuccess(false)
    
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found.")
      }

      if (businessName.trim().length < 2) {
        throw new Error("Business name must be at least 2 characters long")
      }

      const response = await fetch(BUSINESS_PROFILE_ENDPOINT, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: businessName.trim(),
          business_type: businessType,
        }),
      })
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(errorBody.message || "Failed to update business profile")
      }

      setBusinessSaveSuccess(true)
      await fetchBusinessProfile()
      
      setTimeout(() => {
        setBusinessSaveSuccess(false)
      }, 3000)
      
    } catch (err) {
      console.error("Error updating business profile:", err)
      setBusinessSaveError(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setIsSavingBusiness(false)
    }
  }

  // Use package limits if available, otherwise fall back to profile limits
  const displayMaxStores = packageLimits?.stores ?? profile?.max_stores ?? 0
  const displayMaxUsers = packageLimits?.staff ?? profile?.max_users ?? 0
  const displayMaxProducts = packageLimits?.products ?? 0

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* ENHANCED HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              System Settings
            </span>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1 animate-pulse">
              Control Panel
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Configure your workspace preferences and security
          </p>
        </div>
        
        {!isLoadingProfile && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBusinessProfile}
            className="h-10 font-bold border-2 hover:bg-primary/5"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        )}
      </div>

      {/* STATUS METRICS */}
      {profile && !isLoadingProfile && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-emerald-500/10 p-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400 uppercase tracking-[2px]">Account Status</p>
              </div>
              <div className="text-3xl font-black text-emerald-700 dark:text-emerald-500 tracking-tighter">
                {profile.is_active ? "Active" : "Inactive"}
              </div>
              <p className="text-[9px] mt-3 font-bold text-emerald-600/80 flex items-center gap-1">
                <Activity className="h-3 w-3" /> System operational
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-[10px] font-black text-blue-600/60 dark:text-blue-400 uppercase tracking-[2px]">Store Capacity</p>
              </div>
              <div className="text-3xl font-black text-blue-700 dark:text-blue-500 tracking-tighter">
                {displayMaxStores} <span className="text-sm font-medium opacity-60">Stores</span>
              </div>
              <p className="text-[9px] mt-3 font-bold text-blue-600/80">ALLOCATION LIMIT</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-purple-500/10 p-2 rounded-lg">
                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-[10px] font-black text-purple-600/60 dark:text-purple-400 uppercase tracking-[2px]">User Slots</p>
              </div>
              <div className="text-3xl font-black text-purple-700 dark:text-purple-500 tracking-tighter">
                {displayMaxUsers} <span className="text-sm font-medium opacity-60">Users</span>
              </div>
              <p className="text-[9px] mt-3 font-bold text-purple-600/80">TEAM SIZE CAP</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-[10px] font-black text-amber-600/60 dark:text-amber-400 uppercase tracking-[2px]">Subscription</p>
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-500 tracking-tighter capitalize">
                {profile.subscription_plan}
              </div>
              <p className="text-[9px] mt-3 font-bold text-amber-600/80 uppercase">{profile.subscription_status}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TABS SECTION */}
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border-2 border-slate-200 dark:border-slate-800 h-auto flex-wrap justify-start gap-1">
          <TabsTrigger 
            value="business" 
            className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Business Info
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="security" 
            className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="backup" 
            className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg rounded-lg px-4 py-2 flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Backup & Export
          </TabsTrigger>
        </TabsList>

        {/* BUSINESS INFO TAB */}
        <TabsContent value="business" className="space-y-6">
          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Business Information</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Organization Identity & Contact</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {isLoadingProfile ? (
                <div className="py-32 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <BarChart3 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Profile...</p>
                </div>
              ) : profileError ? (
                <Alert variant="destructive" className="border-2">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="font-bold">{profileError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  {businessSaveSuccess && (
                    <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <AlertDescription className="font-bold">
                        Business information updated successfully!
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {businessSaveError && (
                    <Alert variant="destructive" className="border-2">
                      <AlertCircle className="h-5 w-5" />
                      <AlertDescription className="font-bold">{businessSaveError}</AlertDescription>
                    </Alert>
                  )}

                  {/* PACKAGE LIMITS OVERVIEW */}
                  {packageLimits && (
                    <div className="grid gap-4 md:grid-cols-3 p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Max Stores</Label>
                        </div>
                        <p className="text-2xl font-black text-primary">{displayMaxStores}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Max Users</Label>
                        </div>
                        <p className="text-2xl font-black text-primary">{displayMaxUsers}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Max Products</Label>
                        </div>
                        <p className="text-2xl font-black text-primary">{displayMaxProducts}</p>
                      </div>
                    </div>
                  )}

                  {/* FORM FIELDS WITH ICONS */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="business-name" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Business Name
                      </Label>
                      <div className="relative">
                        <Input 
                          id="business-name" 
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          disabled={isSavingBusiness}
                          className="h-12 border-2 font-bold text-base pl-4 focus-visible:ring-primary"
                          placeholder="Enter business name"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="business-type" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        Business Type
                      </Label>
                      <Select
                        value={businessType}
                        onValueChange={setBusinessType}
                        disabled={isSavingBusiness}
                      >
                        <SelectTrigger id="business-type" className="h-12 border-2 font-bold">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="font-bold">
                              <span className="flex items-center gap-2">
                                <span>{type.icon}</span>
                                {type.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Label htmlFor="business-email" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        Business Email
                      </Label>
                      <Input 
                        id="business-email" 
                        type="email" 
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="info@business.com"
                        disabled={isSavingBusiness}
                        className="h-12 border-2 font-medium"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="business-phone" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        Phone Number
                      </Label>
                      <Input 
                        id="business-phone" 
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        placeholder="+1234567890"
                        disabled={isSavingBusiness}
                        className="h-12 border-2 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="business-tax" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Tax Identification Number
                    </Label>
                    <Input 
                      id="business-tax" 
                      value={businessTax}
                      onChange={(e) => setBusinessTax(e.target.value)}
                      placeholder="123-456-789"
                      disabled={isSavingBusiness}
                      className="h-12 border-2 font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="business-address" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Physical Address
                    </Label>
                    <Textarea 
                      id="business-address" 
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      placeholder="123 Main Street, City, State 12345"
                      disabled={isSavingBusiness}
                      className="min-h-[100px] border-2 font-medium resize-none"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <Button 
                      onClick={handleSaveBusinessInfo} 
                      disabled={isSavingBusiness}
                      className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-bold shadow-lg"
                    >
                      {isSavingBusiness ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-5 w-5" />
                          Save Business Profile
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Notification Preferences</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Alert & Communication Settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:shadow-lg transition-all group">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="email-notifications" className="text-base font-black flex items-center gap-2 cursor-pointer group-hover:text-primary transition-colors">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground font-medium">Receive system alerts via email</p>
                  </div>
                  <Switch 
                    id="email-notifications" 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:shadow-lg transition-all group">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="low-stock-alerts" className="text-base font-black flex items-center gap-2 cursor-pointer group-hover:text-primary transition-colors">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Low Stock Alerts
                    </Label>
                    <p className="text-sm text-muted-foreground font-medium">Get notified when inventory levels are critical</p>
                  </div>
                  <Switch 
                    id="low-stock-alerts" 
                    checked={lowStockAlerts} 
                    onCheckedChange={setLowStockAlerts}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:shadow-lg transition-all group">
                  <div className="space-y-1 flex-1">
                    <Label htmlFor="payment-reminders" className="text-base font-black flex items-center gap-2 cursor-pointer group-hover:text-primary transition-colors">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      Payment Reminders
                    </Label>
                    <p className="text-sm text-muted-foreground font-medium">Automated reminders for overdue invoices</p>
                  </div>
                  <Switch 
                    id="payment-reminders" 
                    checked={paymentReminders} 
                    onCheckedChange={setPaymentReminders}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <Label htmlFor="notification-email" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Primary Notification Email
                </Label>
                <Input 
                  id="notification-email" 
                  type="email" 
                  defaultValue="admin@hardwarestore.com"
                  className="h-12 border-2 font-medium"
                />
              </div>

              <div className="pt-4">
                <Button className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 font-bold shadow-lg">
                  <Save className="mr-2 h-5 w-5" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Security Settings</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Authentication & Access Control</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Password Section */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black mb-2">Password Management</h3>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                      Update your password regularly to maintain account security
                    </p>
                    <ChangePasswordModal 
                      trigger={
                        <Button className="h-11 font-bold border-2">
                          <Lock className="mr-2 h-4 w-4" />
                          Change Password
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>

              {/* 2FA Section */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-black">Two-Factor Authentication</h3>
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-[9px] font-black uppercase">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                      Add an extra layer of security with OTP verification
                    </p>
                    <Button variant="outline" className="h-11 font-bold border-2">
                      <Zap className="mr-2 h-4 w-4" />
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black mb-2">Active Sessions</h3>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                      Monitor and manage devices where you're currently logged in
                    </p>
                    <Button variant="outline" className="h-11 font-bold border-2">
                      <Settings2 className="mr-2 h-4 w-4" />
                      View All Sessions
                    </Button>
                  </div>
                </div>
              </div>

              {/* Security Info Alert */}
              <Alert className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                <Info className="h-5 w-5 text-blue-600" />
                <AlertDescription className="font-bold text-blue-900 dark:text-blue-300">
                  Your account security is monitored 24/7. Any suspicious activity will trigger immediate alerts.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BACKUP TAB */}
        <TabsContent value="backup" className="space-y-6">
          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Backup & Export</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Data Management & Recovery</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Export Data Section */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                    <Download className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black mb-2">Export System Data</h3>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                      Download your complete data in various formats for external use
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" className="h-11 font-bold border-2">
                        <FileText className="mr-2 h-4 w-4" />
                        Export as CSV
                      </Button>
                      <Button variant="outline" className="h-11 font-bold border-2">
                        <Database className="mr-2 h-4 w-4" />
                        Export as JSON
                      </Button>
                      <Button variant="outline" className="h-11 font-bold border-2">
                        <FileText className="mr-2 h-4 w-4" />
                        Export as PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automatic Backup Section */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <Cloud className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-black">Automatic Backups</h3>
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[9px] font-black uppercase">
                        Enabled
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 font-medium">
                      Configure scheduled backups to secure your data automatically
                    </p>
                    <Button className="h-11 font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                      <Settings2 className="mr-2 h-4 w-4" />
                      Configure Schedule
                    </Button>
                  </div>
                </div>
              </div>

              {/* Last Backup Section */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black mb-2">Backup History</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div>
                          <p className="text-sm font-black">Last Successful Backup</p>
                          <p className="text-xs text-muted-foreground font-medium">October 1, 2024 at 11:30 PM</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[9px] uppercase">
                          Complete
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="h-11 font-bold border-2">
                      <Upload className="mr-2 h-4 w-4" />
                      Restore from Backup
                    </Button>
                  </div>
                </div>
              </div>

              {/* Warning Alert */}
              <Alert className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <AlertDescription className="font-bold text-amber-900 dark:text-amber-300">
                  Restoring from backup will overwrite current data. Ensure you have the correct backup file before proceeding.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Shield className="h-3 w-3" />
          Encrypted Connection
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Activity className="h-3 w-3" />
          System Stable
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <CheckCircle2 className="h-3 w-3" />
          All Services Operational
        </div>
      </div>
    </div>
  )
}