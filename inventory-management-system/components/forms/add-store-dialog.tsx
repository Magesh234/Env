"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, AlertCircle, CheckCircle2, RefreshCw, Store, 
  Building2, MapPin, Settings2, Globe, Phone, Mail,
  Hash, FileText, DollarSign, Clock, Sparkles, Info,
  Tag, Navigation
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { inventory_base_url } from "@/lib/api-config"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface AddStoreDialogProps {
  onStoreAdded?: () => void
  disabled?: boolean
}

// Generate a unique Store Code (max 20 characters for DB limit)
const generateUniqueStoreCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6)
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `STR-${timestamp}-${randomPart}`
}

// Generate a unique subdomain from store name
const generateSubdomain = (storeName: string): string => {
  let subdomain = storeName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  subdomain = subdomain.substring(0, 15)
  const uniqueSuffix = Date.now().toString(36).slice(-4)
  
  return `${subdomain}-${uniqueSuffix}`
}

const storeFormSchema = z.object({
  store_name: z.string().min(1, "Store name is required"),
  store_code: z.string().min(1, "Store code is required"),
  store_type: z.string().min(1, "Store type is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  default_currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  tax_rate: z.coerce.number().min(0, "Tax rate must be positive").max(100, "Tax rate cannot exceed 100"),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

const STORE_TYPES = [
  { value: "retail", label: "Retail", icon: "🏪" },
  { value: "wholesale", label: "Wholesale", icon: "📦" },
  { value: "warehouse", label: "Warehouse", icon: "🏭" },
  { value: "other", label: "Other", icon: "🏢" },
]

const CURRENCIES = [
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
]

const TIMEZONES = [
  { value: "Africa/Dar_es_Salaam", label: "Africa/Dar es Salaam", abbr: "EAT" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi", abbr: "EAT" },
  { value: "Africa/Kampala", label: "Africa/Kampala", abbr: "EAT" },
  { value: "Africa/Lagos", label: "Africa/Lagos", abbr: "WAT" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg", abbr: "SAST" },
]

export function AddStoreDialog({ onStoreAdded, disabled }: AddStoreDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successModal, setSuccessModal] = useState(false)

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      store_name: "",
      store_code: generateUniqueStoreCode(),
      store_type: "retail",
      description: "",
      address: "",
      city: "",
      region: "",
      postal_code: "",
      country: "Tanzania",
      phone: "",
      email: "",
      default_currency: "TZS",
      timezone: "Africa/Dar_es_Salaam",
      tax_rate: 18.0,
    },
  })

  const handleRegenerateStoreCode = () => {
    form.setValue("store_code", generateUniqueStoreCode())
  }

  const onSubmit = async (values: StoreFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      if (!token) throw new Error("No access token found. Please login again.")

      const payload: any = {
        store_code: values.store_code,
        store_name: values.store_name,
        store_type: values.store_type,
        country: values.country,
        default_currency: values.default_currency,
        timezone: values.timezone,
        tax_rate: values.tax_rate,
        subdomain: generateSubdomain(values.store_name),
        is_active: true,
      }

      if (values.description) payload.description = values.description
      if (values.address) payload.address = values.address
      if (values.city) payload.city = values.city
      if (values.region) payload.region = values.region
      if (values.postal_code) payload.postal_code = values.postal_code
      if (values.phone) payload.phone = values.phone
      if (values.email) payload.email = values.email

      const response = await fetch(`${inventory_base_url}/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to create store")
      }

      form.reset({
        store_name: "",
        store_code: generateUniqueStoreCode(),
        store_type: "retail",
        description: "",
        address: "",
        city: "",
        region: "",
        postal_code: "",
        country: "Tanzania",
        phone: "",
        email: "",
        default_currency: "TZS",
        timezone: "Africa/Dar_es_Salaam",
        tax_rate: 18.0,
      })

      setOpen(false)
      setSuccessModal(true)
      onStoreAdded?.()
    } catch (err) {
      console.error("Store creation error:", err)
      setError(err instanceof Error ? err.message : "Failed to create store")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            disabled={disabled}
            className="h-11 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Store
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-hidden flex flex-col border-none shadow-2xl">
          {/* PREMIUM HEADER */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <DialogHeader className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black flex items-center gap-2">
                  Add New Store
                  <Badge variant="secondary" className="text-[9px] bg-blue-500/10 text-blue-600 border-none font-black uppercase">
                    Location
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                  Expand Your Business Network
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {error && (
              <Alert variant="destructive" className="mb-6 border-2">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="font-bold">{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border-2 border-slate-200 dark:border-slate-800 h-auto">
                    <TabsTrigger 
                      value="basic" 
                      className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg rounded-lg py-3 flex items-center gap-2"
                    >
                      <Store className="h-4 w-4" />
                      Basic Info
                    </TabsTrigger>
                    <TabsTrigger 
                      value="location" 
                      className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg rounded-lg py-3 flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Location
                    </TabsTrigger>
                    <TabsTrigger 
                      value="settings" 
                      className="font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-lg rounded-lg py-3 flex items-center gap-2"
                    >
                      <Settings2 className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  {/* BASIC INFO TAB */}
                  <TabsContent value="basic" className="space-y-6 mt-6">
                    <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-black">Essential Information</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="store_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                              <Tag className="h-4 w-4 text-primary" />
                              Store Name <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Main Branch" 
                                {...field} 
                                disabled={isLoading}
                                className="h-12 border-2 font-bold text-base"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="store_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                              <Hash className="h-4 w-4 text-primary" />
                              Store Code <span className="text-red-500">*</span>
                            </FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input 
                                  placeholder="STR-XXX" 
                                  {...field} 
                                  disabled={isLoading} 
                                  className="flex-1 h-12 border-2 font-mono font-bold"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleRegenerateStoreCode}
                                disabled={isLoading}
                                title="Generate new Store Code"
                                className="h-12 w-12 border-2"
                              >
                                <RefreshCw className="h-5 w-5" />
                              </Button>
                            </div>
                            <FormDescription className="text-xs font-medium flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Unique identifier for this store location
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="store_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                              <Store className="h-4 w-4 text-primary" />
                              Store Type <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 font-bold">
                                  <SelectValue placeholder="Select store type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {STORE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value} className="font-bold">
                                    <span className="flex items-center gap-2">
                                      <span>{type.icon}</span>
                                      {type.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              Description
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of the store location and purpose"
                                className="resize-none border-2 font-medium min-h-[100px]"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+255 XXX XXX XXX" 
                                  {...field} 
                                  disabled={isLoading}
                                  className="h-12 border-2 font-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <Mail className="h-4 w-4 text-primary" />
                                Email Address
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="email" 
                                  placeholder="store@example.com" 
                                  {...field} 
                                  disabled={isLoading}
                                  className="h-12 border-2 font-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* LOCATION TAB */}
                  <TabsContent value="location" className="space-y-6 mt-6">
                    <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-black">Physical Address</h3>
                      </div>

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                              <Navigation className="h-4 w-4 text-primary" />
                              Street Address
                            </FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123 Main Street, Building A" 
                                {...field} 
                                disabled={isLoading}
                                className="h-12 border-2 font-medium"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" />
                                City
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Dar es Salaam" 
                                  {...field} 
                                  disabled={isLoading}
                                  className="h-12 border-2 font-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Region/State
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Dar es Salaam Region" 
                                  {...field} 
                                  disabled={isLoading}
                                  className="h-12 border-2 font-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="postal_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <Hash className="h-4 w-4 text-primary" />
                                Postal Code
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="00000" 
                                  {...field} 
                                  disabled={isLoading}
                                  className="h-12 border-2 font-medium"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <Globe className="h-4 w-4 text-primary" />
                                Country <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Tanzania" 
                                  {...field} 
                                  disabled={isLoading}
                                  className="h-12 border-2 font-bold"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Alert className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <Info className="h-5 w-5 text-blue-600" />
                        <AlertDescription className="font-bold text-blue-900 dark:text-blue-300">
                          Location details help with regional reporting and logistics planning.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>

                  {/* SETTINGS TAB */}
                  <TabsContent value="settings" className="space-y-6 mt-6">
                    <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg">
                          <Settings2 className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-black">Operational Configuration</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="default_currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                Default Currency <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                <FormControl>
                                  <SelectTrigger className="h-12 border-2 font-bold">
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CURRENCIES.map((currency) => (
                                    <SelectItem key={currency.code} value={currency.code} className="font-bold">
                                      <span className="flex items-center gap-2">
                                        <span className="text-lg">{currency.symbol}</span>
                                        {currency.code} - {currency.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="timezone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                Timezone <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                <FormControl>
                                  <SelectTrigger className="h-12 border-2 font-bold">
                                    <SelectValue placeholder="Select timezone" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIMEZONES.map((tz) => (
                                    <SelectItem key={tz.value} value={tz.value} className="font-bold">
                                      <div className="flex items-center justify-between w-full gap-2">
                                        <span>{tz.label}</span>
                                        <Badge variant="outline" className="text-[9px] font-black">
                                          {tz.abbr}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="tax_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-primary" />
                              Tax Rate (%) <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="18.00"
                                {...field}
                                disabled={isLoading}
                                className="h-12 border-2 font-bold text-base"
                              />
                            </FormControl>
                            <FormDescription className="text-xs font-medium flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Default tax rate applied to transactions at this location
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Alert className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                        <Settings2 className="h-5 w-5 text-amber-600" />
                        <AlertDescription className="font-bold text-amber-900 dark:text-amber-300">
                          These settings affect pricing, reporting, and time-based operations for this store.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="pt-6 border-t-2 border-slate-200 dark:border-slate-800">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpen(false)} 
                    disabled={isLoading}
                    className="h-12 px-6 font-bold border-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="h-12 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 font-bold shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Creating Store...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Create Store
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS MODAL - ENHANCED */}
      <Dialog open={successModal} onOpenChange={setSuccessModal}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
          
          <div className="flex flex-col items-center justify-center space-y-6 py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-full shadow-2xl">
                <CheckCircle2 className="text-white h-16 w-16" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <DialogTitle className="text-3xl font-black">Store Created!</DialogTitle>
              <DialogDescription className="text-base font-medium">
                Your new store location has been successfully added to the network.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800 font-black text-xs uppercase">
                <Sparkles className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Badge variant="outline" className="font-black text-xs">
                Ready for Operations
              </Badge>
            </div>

            <Button 
              onClick={() => setSuccessModal(false)}
              className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-bold shadow-lg"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Got It!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}