"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Store } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { inventory_base_url } from "@/lib/api-config"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  is_active: z.boolean().default(true),
})

type StoreFormValues = z.infer<typeof storeFormSchema>

interface EditStoreDialogProps {
  storeId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStoreUpdated: () => void
}

const STORE_TYPES = [
  "Retail",
  "Warehouse",
  "Distribution Center",
  "Showroom",
  "Pop-up Store",
  "Online",
  "Outlet",
  "Flagship",
]

const CURRENCIES = [
  { code: "KES", name: "Kenyan Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "ZAR", name: "South African Rand" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
]

const TIMEZONES = [
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
]

export function EditStoreDialog({ storeId, open, onOpenChange, onStoreUpdated }: EditStoreDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      store_name: "",
      store_code: "",
      store_type: "Retail",
      description: "",
      address: "",
      city: "",
      region: "",
      postal_code: "",
      country: "Kenya",
      phone: "",
      email: "",
      default_currency: "KES",
      timezone: "Africa/Nairobi",
      tax_rate: 0,
      is_active: true,
    },
  })

  // Helper function to extract value from old format
  const extractValue = (field: any): string => {
    if (typeof field === "string") return field || ""
    if (field && typeof field === "object" && "String" in field) {
      return field.Valid ? field.String : ""
    }
    return ""
  }

  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!storeId || !open) return

      try {
        setIsFetching(true)
        const token = localStorage.getItem("access_token")

        if (!token) {
          throw new Error("No access token found")
        }

        const response = await fetch(`${inventory_base_url}/stores/${storeId}/details`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch store details")
        }

        const store = data.data

        // Populate form with normalized values
        form.reset({
          store_name: store.store_name || "",
          store_code: store.store_code || "",
          store_type: store.store_type || "Retail",
          description: extractValue(store.description),
          address: extractValue(store.address),
          city: extractValue(store.city),
          region: extractValue(store.region),
          postal_code: extractValue(store.postal_code),
          country: store.country || "Kenya",
          phone: extractValue(store.phone),
          email: extractValue(store.email),
          default_currency: store.default_currency || "KES",
          timezone: store.timezone || "Africa/Nairobi",
          tax_rate: store.tax_rate || 0,
          is_active: store.is_active ?? true,
        })
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load store details",
        })
        onOpenChange(false)
      } finally {
        setIsFetching(false)
      }
    }

    fetchStoreDetails()
  }, [storeId, open, form, toast, onOpenChange])

  const onSubmit = async (values: StoreFormValues) => {
    if (!storeId) return

    try {
      setIsLoading(true)
      const token = localStorage.getItem("access_token")

      if (!token) {
        throw new Error("No access token found")
      }

      const response = await fetch(`${inventory_base_url}/stores/${storeId}/details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update store")
      }

      toast({
        title: "Success",
        description: "Store updated successfully",
      })

      onOpenChange(false)
      onStoreUpdated()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update store",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Edit Store Details
          </DialogTitle>
          <DialogDescription>
            Update store information, location details, and settings
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="store_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Main Branch" {...field} />
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
                          <FormLabel>Store Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="MAIN-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="store_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select store type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STORE_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description of the store"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+254 712 345 678" {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="store@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="location" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Nairobi" {...field} />
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
                          <FormLabel>Region/State</FormLabel>
                          <FormControl>
                            <Input placeholder="Nairobi County" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="00100" {...field} />
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
                          <FormLabel>Country *</FormLabel>
                          <FormControl>
                            <Input placeholder="Kenya" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="default_currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Currency *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CURRENCIES.map((currency) => (
                                <SelectItem key={currency.code} value={currency.code}>
                                  {currency.code} - {currency.name}
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
                          <FormLabel>Timezone *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIMEZONES.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
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
                        <FormLabel>Tax Rate (%) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="16.00"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Default tax rate for this store</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Store Status</FormLabel>
                          <FormDescription>
                            Enable or disable this store location
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Store"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}