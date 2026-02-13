"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  ExternalLink, 
  Globe, 
  Palette, 
  Eye, 
  EyeOff, 
  Settings, 
  Power, 
  PowerOff,
  Plus,
  TrendingUp,
  Shield,
  Info,
  X,
  AlertCircle,
  CheckCircle2,
  Building2,
  Trash2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { AddStoreDialog } from "@/components/forms/add-store-dialog"
import { EditStoreDialog } from "@/components/forms/edit-store-dialog"
import { useToast } from "@/hooks/use-toast"
import { inventory_base_url } from "@/lib/api-config"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// --- ALL ORIGINAL HELPER FUNCTIONS (100% PRESERVED) ---
const extractValue = (field: any): string => {
  if (typeof field === "string") return field || ""
  if (field && typeof field === "object" && "String" in field) {
    return field.Valid ? field.String : ""
  }
  return ""
}

// --- ALL ORIGINAL INTERFACES (100% PRESERVED) ---
interface StoreData {
  id: string
  store_name: string
  store_code: string
  store_type: string
  description: string | { String: string; Valid: boolean }
  address: string | { String: string; Valid: boolean }
  city: string | { String: string; Valid: boolean }
  region: string | { String: string; Valid: boolean }
  postal_code: string | { String: string; Valid: boolean }
  country: string
  phone: string | { String: string; Valid: boolean }
  email: string | { String: string; Valid: boolean }
  default_currency: string
  timezone: string
  tax_rate: number
  is_active: boolean
  storefront_enabled: boolean
  storefront_slug: string | { String: string; Valid: boolean }
  created_at: string
  updated_at: string
}

interface NormalizedStore {
  id: string
  store_name: string
  store_code: string
  store_type: string
  description: string
  address: string
  city: string
  region: string
  postal_code: string
  country: string
  phone: string
  email: string
  default_currency: string
  timezone: string
  tax_rate: number
  is_active: boolean
  storefront_enabled: boolean
  storefront_slug: string
  created_at: string
  updated_at: string
}

type FilterTab = "all" | "active" | "inactive"

export default function StoresPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // --- ALL ORIGINAL STATE (100% PRESERVED) ---
  const [stores, setStores] = useState<NormalizedStore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStore, setSelectedStore] = useState<NormalizedStore | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showActivationDialog, setShowActivationDialog] = useState(false)
  const [activationAction, setActivationAction] = useState<'activate' | 'deactivate'>('activate')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isTogglingActivation, setIsTogglingActivation] = useState(false)
  const [storefrontUrl, setStorefrontUrl] = useState<string>("")
  const [isTogglingStorefront, setIsTogglingStorefront] = useState(false)
  const [editStoreId, setEditStoreId] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [filterTab, setFilterTab] = useState<FilterTab>("active")

  // --- ALL ORIGINAL FUNCTIONS (100% PRESERVED) ---
  const normalizeStore = (store: StoreData): NormalizedStore => {
    return {
      id: store.id,
      store_name: store.store_name,
      store_code: store.store_code,
      store_type: store.store_type,
      description: extractValue(store.description),
      address: extractValue(store.address),
      city: extractValue(store.city),
      region: extractValue(store.region),
      postal_code: extractValue(store.postal_code),
      country: store.country,
      phone: extractValue(store.phone),
      email: extractValue(store.email),
      default_currency: store.default_currency,
      timezone: store.timezone,
      tax_rate: store.tax_rate,
      is_active: store.is_active,
      storefront_enabled: store.storefront_enabled,
      storefront_slug: extractValue(store.storefront_slug),
      created_at: store.created_at,
      updated_at: store.updated_at,
    }
  }

  const fetchStores = async (filter: FilterTab = filterTab) => {
    try {
      setIsLoading(true)
      setError(null)

      const token = localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("No access token found. Please login again.")
      }

      let endpoint = `${inventory_base_url}/stores`
      if (filter === "active") {
        endpoint = `${inventory_base_url}/stores/active`
      } else if (filter === "inactive") {
        endpoint = `${inventory_base_url}/stores/inactive`
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch stores")
      }

      const normalizedStores = (data.data || []).map((store: StoreData) => normalizeStore(store))
      setStores(normalizedStores)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load stores"
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

  const handleDeleteStore = async () => {
    if (!selectedStore) return

    try {
      setIsDeleting(true)
      const token = localStorage.getItem("access_token")

      const response = await fetch(`${inventory_base_url}/stores/${selectedStore.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete store")
      }

      toast({
        title: "Success",
        description: "Store deleted successfully",
      })

      setShowDeleteDialog(false)
      setSelectedStore(null)
      fetchStores()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete store",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleActivation = async () => {
    if (!selectedStore) return

    try {
      setIsTogglingActivation(true)
      const token = localStorage.getItem("access_token")
      const endpoint = activationAction === 'activate' ? 'activate' : 'deactivate'

      const response = await fetch(`${inventory_base_url}/stores/${selectedStore.id}/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${endpoint} store`)
      }

      toast({
        title: "Success",
        description: `Store ${activationAction}d successfully`,
      })

      setShowActivationDialog(false)
      setSelectedStore(null)
      fetchStores()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update store status",
      })
    } finally {
      setIsTogglingActivation(false)
    }
  }

  const openActivationDialog = (store: NormalizedStore, action: 'activate' | 'deactivate', e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedStore(store)
    setActivationAction(action)
    setShowActivationDialog(true)
  }

  const toggleStorefront = async (store: NormalizedStore, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setIsTogglingStorefront(true)
      const token = localStorage.getItem("access_token")
      const endpoint = store.storefront_enabled ? "disable" : "enable"

      const response = await fetch(`${inventory_base_url}/stores/${store.id}/storefront/${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Failed to ${endpoint} storefront`)
      }

      toast({
        title: "Success",
        description: `Storefront ${endpoint}d successfully`,
      })

      if (endpoint === "enable") {
        const returnedUrl = data.data?.storefront_url || ""
        const slug = returnedUrl.split("/").pop() || store.storefront_slug
        const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000"
        setStorefrontUrl(`${baseUrl}/${slug}`)
      }

      await fetchStores()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle storefront",
      })
    } finally {
      setIsTogglingStorefront(false)
    }
  }

  const handleManageTheme = (storeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/dashboard/stores/${storeId}/theme`)
  }

  const handleViewStorefront = (store: NormalizedStore, e: React.MouseEvent) => {
    e.stopPropagation()
    if (store.storefront_slug) {
      const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000"
      window.open(`${baseUrl}/shop/${store.storefront_slug}`, '_blank')
    }
  }

  const handleEditStore = (storeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditStoreId(storeId)
    setShowEditDialog(true)
  }

  const handleStoreClick = (storeId: string) => {
    router.push(`/dashboard/stores/${storeId}`)
  }

  const handleFilterChange = (value: string) => {
    const newFilter = value as FilterTab
    setFilterTab(newFilter)
    fetchStores(newFilter)
  }

  useEffect(() => {
    fetchStores()
  }, [])

  const handleStoreAdded = () => {
    toast({
      title: "Success",
      description: "Store created successfully",
    })
    fetchStores()
  }

  const handleStoreUpdated = () => {
    fetchStores()
  }

  const activeCount = stores.filter(s => s.is_active).length
  const inactiveCount = stores.filter(s => !s.is_active).length
  const totalCount = stores.length

  // --- LOADING STATE (ENHANCED DESIGN) ---
  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Store className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Stores...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION - Enhanced */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Stores
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              {totalCount} Total
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Manage your store locations and storefronts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AddStoreDialog onStoreAdded={handleStoreAdded} />
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

      {/* METRIC CARDS - Enhanced with animations */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Stores */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Store className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Stores</p>
            </div>
            <div className="text-4xl font-black tracking-tighter">
              {totalCount}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">ALL LOCATIONS</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">TRACKED</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Active Stores */}
        <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 group hover:border-emerald-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400 uppercase tracking-[2px]">Active Stores</p>
            </div>
            <div className="text-4xl font-black text-emerald-700 dark:text-emerald-500 tracking-tighter">
              {activeCount}
            </div>
            <div className="mt-4">
              <div className="w-full bg-emerald-200 dark:bg-emerald-900/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-1000" 
                  style={{ width: `${totalCount > 0 ? (activeCount / totalCount) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[9px] mt-2 font-bold text-emerald-600/80 uppercase">Operational</p>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Stores */}
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-slate-500/10 p-2 rounded-lg">
                <PowerOff className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Inactive Stores</p>
            </div>
            <div className="text-4xl font-black text-foreground tracking-tighter">
              {inactiveCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <Info className="h-3 w-3 text-amber-500" /> Temporarily disabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FILTER TABS - Enhanced */}
      <Tabs value={filterTab} onValueChange={handleFilterChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 h-12 bg-slate-100 dark:bg-slate-900 p-1">
          <TabsTrigger value="all" className="font-bold text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
            All Stores
            {filterTab === "all" && totalCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-black">
                {totalCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="font-bold text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
            Active
            {filterTab === "active" && activeCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-black">
                {activeCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive" className="font-bold text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950">
            Inactive
            {filterTab === "inactive" && inactiveCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-black">
                {inactiveCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* STORES GRID OR EMPTY STATE */}
      {stores.length === 0 ? (
        <Card className="shadow-2xl border-2">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full w-fit mx-auto mb-6">
                <Store className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-black mb-2">
                {filterTab === "all" ? "No stores yet" : 
                 filterTab === "active" ? "No active stores" : 
                 "No inactive stores"}
              </h3>
              <p className="text-muted-foreground mb-4 font-medium">
                {filterTab === "all" ? "Get started by creating your first store location" :
                 filterTab === "active" ? "All your stores are currently inactive" :
                 "All your stores are currently active"}
              </p>
              {filterTab === "all" && <AddStoreDialog onStoreAdded={handleStoreAdded} />}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {stores.map((store) => (
            <Card
              key={store.id}
              className={`shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl hover:shadow-xl transition-all group cursor-pointer ${
                !store.is_active ? "border-dashed border-2" : ""
              }`}
              onClick={() => handleStoreClick(store.id)}
            >
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-black text-sm shadow-lg ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-primary transition-all">
                      {store.store_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-black group-hover:text-primary transition-colors flex items-center gap-2">
                        {store.store_name}
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 flex-wrap">
                        <span>Code: {store.store_code}</span>
                        <span>• {store.store_type}</span>
                        {store.storefront_enabled && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-2">
                            <Globe className="h-2.5 w-2.5 mr-0.5" />
                            Online
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={store.is_active ? "default" : "secondary"} 
                    className={`font-bold text-xs border-2 ${
                      store.is_active 
                        ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600' 
                        : 'bg-slate-500 hover:bg-slate-600 border-slate-600'
                    }`}
                  >
                    {store.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pt-6">
                {store.description && (
                  <p className="text-sm text-muted-foreground font-medium line-clamp-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {store.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="line-clamp-1 font-medium">
                      {store.address || store.city || store.region ? (
                        <>
                          {store.address && `${store.address}`}
                          {store.city && `${store.address ? ', ' : ''}${store.city}`}
                          {store.region && `${(store.address || store.city) ? ', ' : ''}${store.region}`}
                        </>
                      ) : (
                        <span className="text-muted-foreground">No address</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="font-medium">{store.phone || <span className="text-muted-foreground">No phone</span>}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="line-clamp-1 font-medium">{store.email || <span className="text-muted-foreground">No email</span>}</span>
                  </div>
                </div>
                
                <div className="pt-2 space-y-2">
                  {/* Activation/Deactivation Button */}
                  <div className="flex gap-2">
                    {store.is_active ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 border-2"
                        onClick={(e) => openActivationDialog(store, 'deactivate', e)}
                      >
                        <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                        Deactivate Store
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 text-xs font-bold text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20 border-2"
                        onClick={(e) => openActivationDialog(store, 'activate', e)}
                      >
                        <Power className="h-3.5 w-3.5 mr-1.5" />
                        Activate Store
                      </Button>
                    )}
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9 text-xs font-bold border-2"
                      onClick={(e) => handleEditStore(store.id, e)}
                    >
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-9 text-xs px-4 font-bold border-2 border-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedStore(store)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Shield className="h-3 w-3" />
          Store Management
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Info className="h-3 w-3" />
          Multi-location Support
        </div>
      </div>

      {/* ALL DIALOGS (100% PRESERVED LOGIC) */}
      
      {/* Edit Store Dialog */}
      <EditStoreDialog
        storeId={editStoreId}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onStoreUpdated={handleStoreUpdated}
      />

      {/* Activation/Deactivation Confirmation Dialog */}
      <AlertDialog open={showActivationDialog} onOpenChange={setShowActivationDialog}>
        <AlertDialogContent className="border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">
              {activationAction === 'activate' ? 'Activate Store' : 'Deactivate Store'}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              {activationAction === 'activate' ? (
                <>
                  Are you sure you want to activate "{selectedStore?.store_name}"? 
                  The store will become operational and visible to your team.
                </>
              ) : (
                <>
                  Are you sure you want to deactivate "{selectedStore?.store_name}"? 
                  The store will be temporarily disabled but data will be preserved. 
                  {selectedStore?.storefront_enabled && (
                    <span className="block mt-2 text-orange-600 font-bold">
                      The online storefront will also be disabled.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isTogglingActivation} className="font-bold border-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActivation}
              disabled={isTogglingActivation}
              className={`font-bold ${activationAction === 'activate' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {isTogglingActivation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {activationAction === 'activate' ? 'Activating...' : 'Deactivating...'}
                </>
              ) : (
                <>
                  {activationAction === 'activate' ? 'Activate Store' : 'Deactivate Store'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">Delete Store</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              Are you sure you want to delete "{selectedStore?.store_name}"? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="font-bold border-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStore}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 font-bold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Store"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Storefront URL Success Dialog */}
      {storefrontUrl && (
        <Dialog open={!!storefrontUrl} onOpenChange={() => setStorefrontUrl("")}>
          <DialogContent className="border-none shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
            <DialogHeader className="pt-4">
              <DialogTitle className="text-2xl font-black">Storefront Enabled Successfully! 🎉</DialogTitle>
              <DialogDescription className="font-medium">
                Your storefront is now live! Share this URL with your customers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800">
                <p className="text-sm font-mono break-all font-bold">{storefrontUrl}</p>
              </div>
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border-2 border-blue-200 dark:border-blue-900">
                <p className="font-bold mb-2">You can now:</p>
                <ul className="list-disc list-inside space-y-1 font-medium">
                  <li>Share this link with your customers</li>
                  <li>Customize your store theme</li>
                  <li>View your storefront using the "View" button</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(storefrontUrl)
                  toast({
                    title: "Copied!",
                    description: "Storefront URL copied to clipboard",
                  })
                }}
                className="font-bold"
              >
                Copy URL
              </Button>
              <Button 
                onClick={() => window.open(storefrontUrl, '_blank')} 
                variant="outline"
                className="font-bold border-2"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Storefront
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}