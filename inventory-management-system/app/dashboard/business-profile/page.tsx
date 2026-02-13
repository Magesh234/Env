"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Building2, 
  Briefcase, 
  CreditCard, 
  Users, 
  Store, 
  Shield, 
  Clock, 
  Calendar, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  X,
  TrendingUp,
  Award,
  Zap,
  Info,
  Package
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { auth_base_url, subscription_base_url } from "@/lib/api-config"

// --- API Configuration ---
const API_BASE_URL = auth_base_url
const BUSINESS_PROFILE_ENDPOINT = `${API_BASE_URL}/business/profile`
const PACKAGE_LIMITS_ENDPOINT = `${subscription_base_url}/packages`

// --- Business Profile Interface (100% PRESERVED) ---
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
  { value: "technology", label: "Technology" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "hospitality", label: "Hospitality" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
]


const PACKAGE_NAMES: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Starter',
  '22222222-2222-2222-2222-222222222222': 'Basic',
  '33333333-3333-3333-3333-333333333333': 'Pro',
  '44444444-4444-4444-4444-444444444444': 'Industrial',
  '55555555-5555-5555-5555-555555555555': 'Pro Max',
}

// Reverse mapping to get package ID from name
const PACKAGE_IDS: Record<string, string> = {
  'Starter': '11111111-1111-1111-1111-111111111111',
  'Basic': '22222222-2222-2222-2222-222222222222',
  'Pro': '33333333-3333-3333-3333-333333333333',
  'Industrial': '44444444-4444-4444-4444-444444444444',
  'Pro Max': '55555555-5555-5555-5555-555555555555',
}


export default function BusinessProfilePage() {
  // --- ALL ORIGINAL STATE (100% PRESERVED) ---
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [packageLimits, setPackageLimits] = useState<PackageLimits | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [businessType, setBusinessType] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // --- Fetch Package Limits ---
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

  // --- ALL ORIGINAL FUNCTIONS (100% PRESERVED) ---
  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found. Please login again.")
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
        throw new Error(`Failed to fetch profile: ${errorBody.message || response.statusText}`)
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
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error fetching business profile:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred while loading profile.")
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleProfileUpdate = async () => {
    setIsUpdating(true)
    setUpdateError(null)
    
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found. Please login again.")
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

      setUpdateSuccess(true)
      await fetchProfile()
      
      setTimeout(() => {
        setIsEditDialogOpen(false)
        setUpdateSuccess(false)
      }, 2000)
      
    } catch (err) {
      console.error("Error updating business profile:", err)
      setUpdateError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      if (profile) {
        setBusinessName(profile.business_name || "")
        setBusinessType(profile.business_type || "")
      }
      setUpdateError(null)
      setUpdateSuccess(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return "Invalid Date"
    }
  }

  const formatBusinessType = (type: string | null | undefined) => {
    if (!type) return "Not specified"
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getSubscriptionBadgeVariant = (plan: string | null | undefined) => {
    if (!plan) return 'outline'
    switch (plan.toLowerCase()) {
      case 'premium':
        return 'default'
      case 'basic':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusBadgeVariant = (status: string | null | undefined) => {
    if (!status) return 'outline'
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'suspended':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Use package limits if available, otherwise fall back to profile limits
  const displayMaxStores = packageLimits?.stores ?? profile?.max_stores ?? "N/A"
  const displayMaxUsers = packageLimits?.staff ?? profile?.max_users ?? "N/A"
  const displayMaxProducts = packageLimits?.products ?? "N/A"

  // --- LOADING STATE (ENHANCED DESIGN) ---
  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Business Profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION - Enhanced */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Business Profile
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              {profile?.is_active ? "Active" : "Inactive"}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            View and manage your business information
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={isEditDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 font-bold border-2" disabled={!profile}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-black">Edit Business Profile</DialogTitle>
                <DialogDescription className="font-medium">
                  Update your business name and type.
                </DialogDescription>
              </DialogHeader>
              
              {updateSuccess ? (
                <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 border-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800 dark:text-emerald-200 font-bold">
                    Business profile updated successfully!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4 mt-4">
                  {updateError && (
                    <Alert variant="destructive" className="border-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-medium">{updateError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-name" className="font-bold">Business Name</Label>
                    <Input
                      id="business-name"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Enter business name"
                      disabled={isUpdating}
                      className="h-11 border-2"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business-type" className="font-bold">Business Type</Label>
                    <Select
                      value={businessType}
                      onValueChange={setBusinessType}
                      disabled={isUpdating}
                    >
                      <SelectTrigger id="business-type" className="h-11 border-2 font-bold">
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="font-bold">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                      disabled={isUpdating}
                      className="font-bold border-2"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleProfileUpdate} disabled={isUpdating} className="font-bold">
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            className="h-10 font-bold border-2"
            onClick={fetchProfile}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
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

      {!profile && !error ? (
        <Card className="shadow-2xl border-2">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full w-fit mx-auto mb-6">
                <Building2 className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-black mb-2">Business Profile Not Found</h3>
              <p className="text-muted-foreground mb-4 font-medium">
                Unable to load business profile information
              </p>
              <Button onClick={fetchProfile} className="font-bold">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : profile ? (
        <>
          {/* METRIC CARDS - Enhanced with animations */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Subscription Plan */}
            <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Award className="h-20 w-20" />
              </div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Plan</p>
                </div>
                <div className="text-3xl font-black tracking-tighter capitalize">
                  {profile.subscription_plan || "N/A"}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-500">SUBSCRIPTION</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">
                    {profile.subscription_status?.toUpperCase() || "N/A"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Max Stores */}
            <Card className="border-primary/20 bg-primary/5 group hover:border-primary/50 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Max Stores</p>
                </div>
                <div className="text-4xl font-black text-primary tracking-tighter">
                  {displayMaxStores}
                </div>
                <p className="text-[9px] mt-4 font-bold text-muted-foreground uppercase">Store Limit</p>
              </CardContent>
            </Card>

            {/* Max Users */}
            <Card className="border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 group hover:border-blue-500 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-[10px] font-black text-blue-600/60 dark:text-blue-400 uppercase tracking-[2px]">Max Users</p>
                </div>
                <div className="text-4xl font-black text-blue-700 dark:text-blue-500 tracking-tighter">
                  {displayMaxUsers}
                </div>
                <p className="text-[9px] mt-4 font-bold text-blue-600/80 uppercase">User Limit</p>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className={`border-2 ${profile.is_active ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20'} transition-all`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${profile.is_active ? 'bg-emerald-500/10' : 'bg-red-500/10'} p-2 rounded-lg`}>
                    {profile.is_active ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-[2px] ${profile.is_active ? 'text-emerald-600/60 dark:text-emerald-400' : 'text-red-600/60 dark:text-red-400'}`}>
                    Status
                  </p>
                </div>
                <div className={`text-3xl font-black tracking-tighter ${profile.is_active ? 'text-emerald-700 dark:text-emerald-500' : 'text-red-700 dark:text-red-500'}`}>
                  {profile.is_active ? "Active" : "Inactive"}
                </div>
                <p className={`text-[9px] mt-4 font-bold uppercase ${profile.is_active ? 'text-emerald-600/80' : 'text-red-600/80'}`}>
                  Account Status
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PROFILE CARDS - Enhanced design */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Business Information */}
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Business Name</label>
                  <p className="text-lg font-black text-foreground mt-1">{profile.business_name || "N/A"}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    Business Type
                  </label>
                  <p className="text-base font-bold text-foreground mt-1 capitalize">{formatBusinessType(profile.business_type)}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" />
                    Status
                  </label>
                  <div className="mt-2">
                    <Badge 
                      variant={profile.is_active ? "default" : "secondary"} 
                      className={`font-bold text-xs border-2 ${profile.is_active ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600' : 'bg-slate-500 hover:bg-slate-600 border-slate-600'}`}
                    >
                      {profile.is_active ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Information */}
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subscription Plan</label>
                  <div className="mt-2">
                    <Badge variant={getSubscriptionBadgeVariant(profile.subscription_plan)} className="font-bold text-xs border-2 capitalize">
                      <Award className="h-3 w-3 mr-1" />
                      {profile.subscription_plan || "N/A"}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subscription Status</label>
                  <div className="mt-2">
                    <Badge variant={getStatusBadgeVariant(profile.subscription_status)} className="font-bold text-xs border-2 capitalize">
                      <Zap className="h-3 w-3 mr-1" />
                      {profile.subscription_status || "N/A"}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Store className="h-3.5 w-3.5" />
                    Maximum Stores
                  </label>
                  <p className="text-base font-bold text-foreground mt-1">{displayMaxStores}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Users className="h-3.5 w-3.5" />
                    Maximum Users
                  </label>
                  <p className="text-base font-bold text-foreground mt-1">{displayMaxUsers}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Package className="h-3.5 w-3.5" />
                    Maximum Products
                  </label>
                  <p className="text-base font-bold text-foreground mt-1">{displayMaxProducts}</p>
                </div>
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card className="md:col-span-2 shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Account Created
                    </label>
                    <p className="text-sm font-bold text-foreground mt-2">{formatDate(profile.created_at)}</p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Last Updated
                    </label>
                    <p className="text-sm font-bold text-foreground mt-2">{formatDate(profile.updated_at)}</p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Business ID</label>
                    <p className="text-xs mt-2 font-mono text-muted-foreground font-bold break-all">{profile.id || "N/A"}</p>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Owner ID</label>
                    <p className="text-xs mt-2 font-mono text-muted-foreground font-bold break-all">{profile.business_owner_id || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FOOTER INFO */}
          <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
              <Shield className="h-3 w-3" />
              Secure Business Profile
            </div>
            <div className="h-1 w-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
              <Info className="h-3 w-3" />
              Real-time Data
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}