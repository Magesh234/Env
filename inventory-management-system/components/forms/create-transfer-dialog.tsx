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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, Trash2, Search, Check } from "lucide-react"
import { inventory_base_url } from "@/lib/api-config"
import { cn } from "@/lib/utils"

const API_BASE = inventory_base_url
const STORES_ENDPOINT = `${API_BASE}/stores`
const PRODUCTS_ENDPOINT = `${API_BASE}/products`
const TRANSFERS_ENDPOINT = `${API_BASE}/transfers`

interface Store {
  id: string
  store_name: string
  location?: string
}

interface Product {
  id: string
  product_name: string
  sku: string
  selling_price: number
  buying_price: number
}

interface TransferItem {
  product_id: string
  quantity_requested: number
  notes: string
}

interface CreateTransferDialogProps {
  onTransferCreated?: () => void
}

export function CreateTransferDialog({ onTransferCreated }: CreateTransferDialogProps) {
  const [open, setOpen] = useState(false)
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingStores, setIsLoadingStores] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productPopovers, setProductPopovers] = useState<{ [key: number]: boolean }>({})
  const [searchQueries, setSearchQueries] = useState<{ [key: number]: string }>({})

  const [fromStoreId, setFromStoreId] = useState("")
  const [toStoreId, setToStoreId] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<TransferItem[]>([
    { product_id: "", quantity_requested: 1, notes: "" },
  ])

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const setProductPopoverOpen = (index: number, open: boolean) => {
    setProductPopovers((prev) => ({ ...prev, [index]: open }))
    if (!open) {
      setSearchQueries((prev) => ({ ...prev, [index]: "" }))
    }
  }

  const isProductPopoverOpen = (index: number) => {
    return productPopovers[index] || false
  }

  const fetchStores = async () => {
    setIsLoadingStores(true)
    try {
      const token = getToken()
      if (!token) {
        alert("Authentication error: Please log in.")
        return
      }

      const response = await fetch(STORES_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch stores")
      }

      const result = await response.json()
      if (result.success && result.data) {
        setStores(Array.isArray(result.data) ? result.data : result.data.stores || [])
      }
    } catch (error) {
      console.error("Error fetching stores:", error)
      alert("Failed to load stores. Please try again.")
    } finally {
      setIsLoadingStores(false)
    }
  }

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const token = getToken()
      if (!token) {
        alert("Authentication error: Please log in.")
        return
      }

      const response = await fetch(PRODUCTS_ENDPOINT, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }

      const result = await response.json()
      if (result.success && result.data) {
        setProducts(Array.isArray(result.data) ? result.data : result.data.products || [])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      alert("Failed to load products. Please try again.")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchStores()
      fetchProducts()
    }
  }, [open])

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity_requested: 1, notes: "" }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof TransferItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTransfer()
  }

  const createTransfer = async () => {
    setIsSubmitting(true)

    try {
      const token = getToken()
      if (!token) {
        alert("Authentication error: Please log in.")
        return
      }

      if (!fromStoreId || !toStoreId) {
        alert("Please select both source and destination stores")
        return
      }

      if (fromStoreId === toStoreId) {
        alert("Source and destination stores must be different")
        return
      }

      const validItems = items.filter((item) => item.product_id && item.quantity_requested > 0)
      if (validItems.length === 0) {
        alert("Please add at least one valid product with quantity")
        return
      }

      const payload = {
        from_store_id: fromStoreId,
        to_store_id: toStoreId,
        notes: notes || "Inter-store transfer request",
        items: validItems,
      }

      const response = await fetch(TRANSFERS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to create transfer: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()
      if (result.success) {
        alert("Transfer created successfully!")
        setOpen(false)
        resetForm()
        if (onTransferCreated) {
          onTransferCreated()
        }
      }
    } catch (error) {
      console.error("Error creating transfer:", error)
      alert(error instanceof Error ? error.message : "Failed to create transfer")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFromStoreId("")
    setToStoreId("")
    setNotes("")
    setItems([{ product_id: "", quantity_requested: 1, notes: "" }])
    setSearchQueries({})
  }

  const getFilteredProducts = (index: number) => {
    const query = searchQueries[index]?.toLowerCase() || ""
    if (!query) return products
    
    return products.filter((product) => 
      product.product_name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Stock Transfer</DialogTitle>
          <DialogDescription>Transfer inventory between stores. Fill in the details below.</DialogDescription>
        </DialogHeader>
        <div>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_store">From Store *</Label>
                {isLoadingStores ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading stores...
                  </div>
                ) : (
                  <Select value={fromStoreId} onValueChange={setFromStoreId} required>
                    <SelectTrigger id="from_store">
                      <SelectValue placeholder="Select source store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.store_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_store">To Store *</Label>
                {isLoadingStores ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading stores...
                  </div>
                ) : (
                  <Select value={toStoreId} onValueChange={setToStoreId} required>
                    <SelectTrigger id="to_store">
                      <SelectValue placeholder="Select destination store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id} disabled={store.id === fromStoreId}>
                          {store.store_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Transfer Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about this transfer"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Transfer Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {isLoadingProducts ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading products...
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Item {index + 1}</Label>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`product-${index}`}>Product *</Label>
                        <Popover open={isProductPopoverOpen(index)} onOpenChange={(open) => setProductPopoverOpen(index, open)}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isProductPopoverOpen(index)}
                              className="w-full justify-between"
                            >
                              {item.product_id ? (
                                (() => {
                                  const selectedProduct = products.find((p) => p.id === item.product_id)
                                  return selectedProduct
                                    ? `${selectedProduct.product_name} - TZS ${selectedProduct.selling_price.toLocaleString()}`
                                    : "Select product"
                                })()
                              ) : (
                                "Select product"
                              )}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command shouldFilter={false}>
                              <CommandInput 
                                placeholder="Search products..." 
                                value={searchQueries[index] || ""}
                                onValueChange={(value) => {
                                  setSearchQueries((prev) => ({ ...prev, [index]: value }))
                                }}
                              />
                              <CommandList>
                                <CommandEmpty>No product found.</CommandEmpty>
                                <CommandGroup>
                                  {getFilteredProducts(index).map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={product.id}
                                      onSelect={() => {
                                        handleItemChange(index, "product_id", product.id)
                                        setProductPopoverOpen(index, false)
                                      }}
                                    >
                                      <div className="flex flex-col flex-1">
                                        <span className="font-medium">{product.product_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {product.sku} - TZS {product.selling_price.toLocaleString()}
                                        </span>
                                      </div>
                                      <Check
                                        className={cn(
                                          "ml-2 h-4 w-4",
                                          item.product_id === product.id ? "opacity-100" : "opacity-0"
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

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            placeholder="Enter quantity"
                            value={item.quantity_requested}
                            onChange={(e) =>
                              handleItemChange(index, "quantity_requested", parseInt(e.target.value) || 0)
                            }
                            required
                            min="1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`item-notes-${index}`}>Item Notes</Label>
                          <Input
                            id={`item-notes-${index}`}
                            placeholder="Optional notes"
                            value={item.notes}
                            onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={createTransfer} disabled={isSubmitting || isLoadingStores || isLoadingProducts}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Transfer"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}