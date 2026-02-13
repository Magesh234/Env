"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Loader2, Search, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { inventory_base_url } from "@/lib/api-config"
import { cn } from "@/lib/utils"

const API_BASE = inventory_base_url

interface Store {
  id: string
  store_name: string
  location?: string | { String: string; Valid: boolean }
}

interface Supplier {
  id: string
  supplier_name: string
  contact_person?: string | { String: string; Valid: boolean }
}

interface Product {
  id: string
  product_name: string
  buying_price: number
  selling_price: number
  sku: string
}

interface OrderItem {
  product_id: string
  product_name: string
  quantity_ordered: number
  unit_price: number
  tax_rate: number
  notes?: string
}

interface CreatePurchaseOrderDialogProps {
  onOrderCreated?: () => void
}

export function CreatePurchaseOrderDialog({ onOrderCreated }: CreatePurchaseOrderDialogProps) {
  const [open, setOpen] = useState(false)
  const [storeId, setStoreId] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [shippingCost, setShippingCost] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("")
  const [taxRate, setTaxRate] = useState("16")
  const [itemNotes, setItemNotes] = useState("")

  // Data from API
  const [stores, setStores] = useState<Store[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  
  // Loading states
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Popover and search states
  const [productPopoverOpen, setProductPopoverOpen] = useState(false)
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false)
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("")

  const { toast } = useToast()

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  // Helper function to safely extract string values
  const getStringValue = (value: any): string => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object" && value.Valid && value.String) return value.String
    return ""
  }

  const fetchStores = async () => {
    setIsLoadingStores(true)
    try {
      const token = getToken()
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${API_BASE}/stores`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch stores")

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setStores(result.data)
      }
    } catch (error) {
      console.error("Error fetching stores:", error)
      toast({
        title: "Error",
        description: "Failed to load stores",
        variant: "destructive",
      })
    } finally {
      setIsLoadingStores(false)
    }
  }

  const fetchSuppliers = async () => {
    setIsLoadingSuppliers(true)
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${API_BASE}/suppliers`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch suppliers")

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setSuppliers(result.data)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to load suppliers",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${API_BASE}/products`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch products")

      const result = await response.json()
      if (result.success && Array.isArray(result.data)) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchStores()
      fetchSuppliers()
      fetchProducts()
    }
  }, [open])

  const getFilteredProducts = () => {
    const query = productSearchQuery.toLowerCase()
    if (!query) return products
    
    return products.filter((product) => 
      product.product_name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    )
  }

  const getFilteredSuppliers = () => {
    const query = supplierSearchQuery.toLowerCase()
    if (!query) return suppliers
    
    return suppliers.filter((supplier) => 
      supplier.supplier_name.toLowerCase().includes(query) ||
      getStringValue(supplier.contact_person).toLowerCase().includes(query)
    )
  }

  const addItem = () => {
    if (!selectedProduct || !quantity) {
      toast({
        title: "Missing Information",
        description: "Please select a product and enter quantity",
        variant: "destructive",
      })
      return
    }

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const existingItem = items.find((item) => item.product_id === selectedProduct)
    if (existingItem) {
      setItems(
        items.map((item) =>
          item.product_id === selectedProduct
            ? { ...item, quantity_ordered: item.quantity_ordered + parseInt(quantity) }
            : item
        )
      )
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.product_name,
          quantity_ordered: parseInt(quantity),
          unit_price: product.buying_price,
          tax_rate: parseFloat(taxRate),
          notes: itemNotes || undefined,
        },
      ])
    }

    setSelectedProduct("")
    setQuantity("")
    setTaxRate("16")
    setItemNotes("")
  }

  const removeItem = (productId: string) => {
    setItems(items.filter((item) => item.product_id !== productId))
  }

  const calculateItemTotal = (item: OrderItem) => {
    const subtotal = item.quantity_ordered * item.unit_price
    const tax = subtotal * (item.tax_rate / 100)
    return subtotal + tax
  }

  const totalAmount = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!storeId || !supplierId || !expectedDate || items.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one item",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = getToken()
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        })
        return
      }

      const payload = {
        store_id: storeId,
        supplier_id: supplierId,
        expected_delivery_date: new Date(expectedDate).toISOString(),
        shipping_cost: shippingCost ? parseFloat(shippingCost) : 0,
        notes: notes || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity_ordered: item.quantity_ordered,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          notes: item.notes,
        })),
      }

      const response = await fetch(`${API_BASE}/purchase-orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || "Failed to create purchase order")
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: result.message || "Purchase order created successfully",
      })

      // Reset form
      setStoreId("")
      setSupplierId("")
      setExpectedDate("")
      setShippingCost("")
      setNotes("")
      setItems([])
      setSelectedProduct("")
      setProductSearchQuery("")
      setSupplierSearchQuery("")
      setOpen(false)

      // Refresh parent list
      if (onOrderCreated) {
        onOrderCreated()
      }
    } catch (error) {
      console.error("Error creating purchase order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase order",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>Order new stock from suppliers</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store">Destination Store *</Label>
              <Select value={storeId} onValueChange={setStoreId} required disabled={isLoadingStores}>
                <SelectTrigger id="store">
                  <SelectValue placeholder={isLoadingStores ? "Loading..." : "Select store"} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.store_name} {getStringValue(store.location) && `- ${getStringValue(store.location)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Popover open={supplierPopoverOpen} onOpenChange={(open) => {
                setSupplierPopoverOpen(open)
                if (!open) setSupplierSearchQuery("")
              }}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={supplierPopoverOpen}
                    className="w-full justify-between"
                    disabled={isLoadingSuppliers}
                  >
                    {supplierId ? (
                      (() => {
                        const selectedSupplier = suppliers.find((s) => s.id === supplierId)
                        return selectedSupplier ? selectedSupplier.supplier_name : "Select supplier"
                      })()
                    ) : (
                      isLoadingSuppliers ? "Loading..." : "Select supplier"
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search suppliers..." 
                      value={supplierSearchQuery}
                      onValueChange={setSupplierSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No supplier found.</CommandEmpty>
                      <CommandGroup>
                        {getFilteredSuppliers().map((supplier) => (
                          <CommandItem
                            key={supplier.id}
                            value={supplier.id}
                            onSelect={() => {
                              setSupplierId(supplier.id)
                              setSupplierPopoverOpen(false)
                            }}
                          >
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{supplier.supplier_name}</span>
                              {getStringValue(supplier.contact_person) && (
                                <span className="text-xs text-muted-foreground">
                                  Contact: {getStringValue(supplier.contact_person)}
                                </span>
                              )}
                            </div>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4",
                                supplierId === supplier.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected_date">Expected Delivery Date *</Label>
              <Input
                id="expected_date"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping_cost">Shipping Cost (Optional)</Label>
              <Input
                id="shipping_cost"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Add Products</Label>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                <Popover open={productPopoverOpen} onOpenChange={(open) => {
                  setProductPopoverOpen(open)
                  if (!open) setProductSearchQuery("")
                }}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productPopoverOpen}
                      className="w-full justify-between"
                      disabled={isLoadingProducts}
                    >
                      {selectedProduct ? (
                        (() => {
                          const product = products.find((p) => p.id === selectedProduct)
                          return product ? product.product_name : "Select product"
                        })()
                      ) : (
                        isLoadingProducts ? "Loading..." : "Select product"
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search products..." 
                        value={productSearchQuery}
                        onValueChange={setProductSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No product found.</CommandEmpty>
                        <CommandGroup>
                          {getFilteredProducts().map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.id}
                              onSelect={() => {
                                setSelectedProduct(product.id)
                                setProductPopoverOpen(false)
                              }}
                            >
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">{product.product_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {product.sku} - TZS {product.buying_price.toLocaleString()}
                                </span>
                              </div>
                              <Check
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  selectedProduct === product.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Input
                type="number"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="col-span-2"
                min="1"
              />
              <Input
                type="number"
                placeholder="Tax %"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="col-span-2"
                step="0.1"
                min="0"
              />
              <Input
                type="text"
                placeholder="Notes"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="col-span-2"
              />
              <Button 
                type="button" 
                onClick={addItem} 
                disabled={!selectedProduct || !quantity}
                className="col-span-1"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Order Items</Label>
              <div className="border rounded-lg divide-y">
                {items.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity_ordered} units × TZS {item.unit_price.toLocaleString()} + {item.tax_rate}% tax
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1">Note: {item.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">TZS {calculateItemTotal(item).toLocaleString()}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.product_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 bg-muted/50">
                  <div>
                    <p className="font-semibold">Total Amount</p>
                    <p className="text-xs text-muted-foreground">Including all taxes</p>
                  </div>
                  <p className="text-lg font-bold text-primary">TZS {totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleSubmit}
              disabled={!storeId || !supplierId || !expectedDate || items.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Purchase Order
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}