"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Plus, 
  Loader2, 
  AlertCircle, 
  Search, 
  Package, 
  Store as StoreIcon,
  TrendingUp,
  DollarSign,
  FileText,
  Hash,
  CheckCircle2,
  Sparkles,
  BarChart3
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { inventory_base_url } from "@/lib/api-config"
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
import { useStore } from "@/lib/store-context"

const API_BASE = inventory_base_url

interface Product {
  id: string
  sku: string
  product_name: string
  current_stock: number
  reorder_level: number
  buying_price: number
}

interface AddInventoryDialogProps {
  onStockAdded?: () => void
  trigger?: React.ReactNode
}

export function AddInventoryDialog({ onStockAdded, trigger }: AddInventoryDialogProps) {
  // Get global store selection
  const { selectedStore, storeName } = useStore()

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productOpen, setProductOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    unit_cost: "",
    reference_number: "",
    notes: "",
    movement_type: "PURCHASE",
    reference_type: "MANUAL",
    reference_id: "",
  })

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  useEffect(() => {
    if (open) {
      fetchProducts()
    }
  }, [open])

  const fetchProducts = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setProducts(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      setFormData({ 
        ...formData, 
        product_id: productId,
        unit_cost: product.buying_price.toString()
      })
    }
    setProductOpen(false)
  }

  const handleSubmit = async () => {
    // Check if store is selected globally
    if (!selectedStore) {
      toast({
        title: "No Store Selected",
        description: "Please select a store from the dashboard first",
        variant: "destructive",
      })
      return
    }

    if (!formData.product_id) {
      toast({
        title: "Validation Error",
        description: "Please select a product",
        variant: "destructive",
      })
      return
    }

    const quantity = parseInt(formData.quantity)
    if (!quantity || quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      })
      return
    }

    const unitCost = parseFloat(formData.unit_cost)
    if (!unitCost || unitCost < 0) {
      toast({
        title: "Validation Error",
        description: "Unit cost must be a valid positive number",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const token = getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }

      const payload = {
        store_id: selectedStore, // Use global store
        product_id: formData.product_id,
        quantity: quantity,
        movement_type: formData.movement_type,
        unit_cost: unitCost,
        notes: formData.notes || undefined,
        reference_type: formData.reference_type,
        reference_id: formData.reference_id || "00000000-0000-0000-0000-000000000000",
      }

      const response = await fetch(`${API_BASE}/inventory/stock-in`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to add stock")
      }

      const result = await response.json()

      toast({
        title: "Stock Added",
        description: `Successfully added ${quantity} units to ${selectedProduct?.product_name} at ${storeName}`,
      })

      // Reset form
      setFormData({
        product_id: "",
        quantity: "",
        unit_cost: "",
        reference_number: "",
        notes: "",
        movement_type: "PURCHASE",
        reference_type: "MANUAL",
        reference_id: "",
      })
      setOpen(false)
      onStockAdded?.()
    } catch (error) {
      console.error("Error adding stock:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add stock",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalCost = formData.quantity && formData.unit_cost 
    ? (parseInt(formData.quantity) * parseFloat(formData.unit_cost)).toLocaleString()
    : "0"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-11 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-hidden flex flex-col border-none shadow-2xl">
        {/* PREMIUM HEADER */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500" />
        
        <DialogHeader className="pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-3 rounded-xl shadow-lg">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black flex items-center gap-2">
                Add Stock
                <Badge variant="secondary" className="text-[9px] bg-teal-500/10 text-teal-600 border-none font-black uppercase">
                  Stock In
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                Receive Inventory & Update Stock Levels
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* STORE INDICATOR */}
          <Alert className={`border-2 ${selectedStore ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20"}`}>
            <StoreIcon className={`h-5 w-5 ${selectedStore ? "text-emerald-600" : "text-orange-600"}`} />
            <AlertDescription>
              {selectedStore ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-emerald-900 dark:text-emerald-300">Target Location:</span>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black">
                    {storeName}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">(Global Selection)</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <span className="font-black text-orange-700 dark:text-orange-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    No Store Selected
                  </span>
                  <span className="text-xs font-medium">Please select a store from dashboard before adding stock</span>
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* PRODUCT SELECTION SECTION */}
          <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-black">Product Selection</h3>
            </div>

            <div className="space-y-3">
              <Label htmlFor="product" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Select Product <span className="text-red-500">*</span>
              </Label>
              <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productOpen}
                    className="w-full justify-between h-14 border-2 font-bold"
                  >
                    {selectedProduct ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-black text-base">{selectedProduct.product_name}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                          <span className="font-mono">{selectedProduct.sku}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Current: {selectedProduct.current_stock} units</span>
                          {selectedProduct.current_stock <= selectedProduct.reorder_level && (
                            <Badge className="bg-orange-500/10 text-orange-600 border-none font-black text-[9px]">
                              ⚠ LOW STOCK
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      "Select product to restock"
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[700px] p-0 border-2 shadow-xl">
                  <Command>
                    <CommandInput placeholder="Search by product name or SKU..." className="h-12 font-medium" />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                        No product found.
                      </CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`${product.product_name} ${product.sku}`}
                            onSelect={() => handleProductChange(product.id)}
                            className="cursor-pointer p-4"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                                <Package className="h-5 w-5 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-black text-sm truncate">{product.product_name}</div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium mt-1">
                                  <span className="font-mono">SKU: {product.sku}</span>
                                  <Separator orientation="vertical" className="h-3" />
                                  <span>Stock: {product.current_stock}</span>
                                  {product.current_stock <= product.reorder_level && (
                                    <Badge className="bg-orange-500/10 text-orange-600 border-none font-black text-[9px]">
                                      ⚠ LOW
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* QUANTITY & COST SECTION */}
          <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-black">Quantity & Costing</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="quantity" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  Quantity Received <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  min="1"
                  className="h-12 border-2 font-bold text-base"
                />
                <p className="text-xs text-muted-foreground font-medium">Number of units to add to inventory</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="unit_cost" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Unit Cost (TZS) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="unit_cost"
                  type="number"
                  placeholder="Cost per unit"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                  min="0"
                  step="0.01"
                  readOnly
                  className="h-12 border-2 font-bold text-base bg-slate-100 dark:bg-slate-900"
                />
                <p className="text-xs text-muted-foreground font-medium">Buying price from product settings</p>
              </div>
            </div>

            {/* TOTAL COST PREVIEW */}
            {formData.quantity && formData.unit_cost && (
              <Alert className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <AlertDescription>
                  <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                    <span>Total Purchase Cost:</span>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black text-base px-4 py-1">
                      TZS {totalCost}
                    </Badge>
                  </div>
                  <Separator className="my-2 bg-emerald-200 dark:bg-emerald-800" />
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>Quantity: <span className="font-black">{formData.quantity} units</span></div>
                    <div>Unit Cost: <span className="font-black">TZS {parseFloat(formData.unit_cost).toLocaleString()}</span></div>
                    <div>Total: <span className="font-black">TZS {totalCost}</span></div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* REFERENCE & NOTES SECTION */}
          <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-black">Additional Information</h3>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider">
                Optional
              </Badge>
            </div>

            <div className="space-y-3">
              <Label htmlFor="reference_number" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Reference Number
              </Label>
              <Input
                id="reference_number"
                placeholder="e.g., PO-12345, Invoice #INV-2024-001"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                className="h-12 border-2 font-bold"
              />
              <p className="text-xs text-muted-foreground font-medium">Purchase order or invoice reference</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this stock receipt (supplier info, condition, etc.)"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="border-2 font-medium resize-none"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end gap-3 pt-6 border-t-2 border-slate-200 dark:border-slate-800">
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
              onClick={handleSubmit} 
              disabled={isLoading || !selectedStore}
              className="h-12 px-8 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 font-bold shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Adding Stock...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Add Stock to Inventory
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}