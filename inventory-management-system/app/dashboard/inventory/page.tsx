"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Loader2, Package, ChevronLeft, ChevronRight, TrendingDown, AlertTriangle, Boxes, TrendingUp, ShieldCheck, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AddInventoryDialog } from "@/components/forms/add-inventory-dialog"
import { InventorySummaryCards } from "@/components/inventory/InventorySummaryCards"
import { InventoryList } from "@/components/inventory/InventoryList"
import { inventory_base_url } from "@/lib/api-config"
import { useStore } from "@/lib/store-context"

const API_BASE_URL = inventory_base_url
const ITEMS_PER_PAGE = 10

interface InventoryItem {
  id: string
  store_id: string
  product_id: string
  sku: string
  product_name: string
  current_stock: number
  reorder_level: number
  buying_price: number
  selling_price: number
  is_low_stock: boolean
  unit_of_measure: string
  inventory_value: number
}

interface Store {
  id: string
  store_name: string
}

interface InventorySummary {
  store_id: string
  total_products: number
  total_units: number
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
}

interface StockMovement {
  id: string
  store_id: string
  product_id: string
  movement_type: string
  quantity: number
  previous_stock: number
  new_stock: number
  unit_cost: number
  total_cost: number
  notes: string
  performed_at: string
}

interface StockFormState {
  quantity: string
  movementType: string
  unitCost: string
  notes: string
}

interface AdjustFormState {
  newStock: string
  reason: string
}

function InventoryPage() {
  // Use global store context instead of local state
  const { selectedStore, storeName } = useStore()
  
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterType, setFilterType] = useState<"all" | "low_stock" | "out_of_stock">("all")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null)
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [showStockInDialog, setShowStockInDialog] = useState<boolean>(false)
  const [showStockOutDialog, setShowStockOutDialog] = useState<boolean>(false)
  const [showAdjustDialog, setShowAdjustDialog] = useState<boolean>(false)
  const [showMovementsDialog, setShowMovementsDialog] = useState<boolean>(false)
  const { toast } = useToast()

  const [stockInForm, setStockInForm] = useState<StockFormState>({
    quantity: "",
    movementType: "PURCHASE",
    unitCost: "",
    notes: ""
  })

  const [stockOutForm, setStockOutForm] = useState<StockFormState>({
    quantity: "",
    movementType: "SALE",
    unitCost: "",
    notes: ""
  })

  const [adjustForm, setAdjustForm] = useState<AdjustFormState>({
    newStock: "",
    reason: ""
  })

  useEffect(() => {
    // Remove loadStores - we use global store context now
    // loadStores()
  }, [])

  useEffect(() => {
    if (selectedStore) {
      loadInventory()
      loadInventorySummary()
    }
  }, [selectedStore, filterType])

  const getAuthToken = (): string | null => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  // Remove loadStores function - not needed anymore

  const loadInventory = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const token = getAuthToken()
      if (!token) throw new Error("No access token found")

      const params = new URLSearchParams({
        page: '1',
        page_size: '1000'
      })
      
      if (filterType === "low_stock") params.append("low_stock", "true")
      else if (filterType === "out_of_stock") params.append("out_of_stock", "true")

      const response = await fetch(`${API_BASE_URL}/inventory/stores/${selectedStore}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to fetch inventory')
      
      const data = await response.json()
      if (data.success) {
        // The API returns all products for the store, even if stock is 0
        // This matches the Vite project behavior
        setInventory(data.data?.inventories || [])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      setInventory([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadInventorySummary = async (): Promise<void> => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/inventory/stores/${selectedStore}/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setInventorySummary(data.data)
        }
      }
    } catch (error) {
      console.error('Failed to load inventory summary:', error)
    }
  }

  const loadStockMovements = async (productId: string): Promise<void> => {
    try {
      const token = getAuthToken()
      if (!token) return

      const params = new URLSearchParams({
        store_id: selectedStore,
        product_id: productId,
        page_size: "20"
      })

      const response = await fetch(`${API_BASE_URL}/inventory/movements?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStockMovements(data.data?.movements || [])
        }
      }
    } catch (error) {
      console.error('Failed to load stock movements:', error)
    }
  }

  const handleStockIn = async (): Promise<void> => {
    if (!selectedProduct) return

    try {
      const token = getAuthToken()
      if (!token) throw new Error("No access token found")

      const response = await fetch(`${API_BASE_URL}/inventory/stock-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: selectedStore,
          product_id: selectedProduct.product_id,
          quantity: parseInt(stockInForm.quantity),
          movement_type: stockInForm.movementType,
          unit_cost: parseFloat(stockInForm.unitCost) || selectedProduct.buying_price,
          notes: stockInForm.notes
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Stock added successfully",
        })
        setShowStockInDialog(false)
        setStockInForm({ quantity: "", movementType: "PURCHASE", unitCost: "", notes: "" })
        loadInventory()
      } else {
        throw new Error(data.error || 'Failed to add stock')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleStockOut = async (): Promise<void> => {
    if (!selectedProduct) return

    try {
      const token = getAuthToken()
      if (!token) throw new Error("No access token found")

      const response = await fetch(`${API_BASE_URL}/inventory/stock-out`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: selectedStore,
          product_id: selectedProduct.product_id,
          quantity: parseInt(stockOutForm.quantity),
          movement_type: stockOutForm.movementType,
          unit_cost: parseFloat(stockOutForm.unitCost) || selectedProduct.buying_price,
          notes: stockOutForm.notes
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Stock removed successfully",
        })
        setShowStockOutDialog(false)
        setStockOutForm({ quantity: "", movementType: "SALE", unitCost: "", notes: "" })
        loadInventory()
      } else {
        throw new Error(data.error || 'Failed to remove stock')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleAdjustStock = async (): Promise<void> => {
    if (!selectedProduct) return

    try {
      const token = getAuthToken()
      if (!token) throw new Error("No access token found")

      const response = await fetch(`${API_BASE_URL}/inventory/adjust`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: selectedStore,
          product_id: selectedProduct.product_id,
          new_stock: parseInt(adjustForm.newStock),
          reason: adjustForm.reason
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: "Stock adjusted successfully",
        })
        setShowAdjustDialog(false)
        setAdjustForm({ newStock: "", reason: "" })
        loadInventory()
      } else {
        throw new Error(data.error || 'Failed to adjust stock')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const openStockInDialog = (product: InventoryItem): void => {
    setSelectedProduct(product)
    setStockInForm({ 
      quantity: "", 
      movementType: "PURCHASE", 
      unitCost: product.buying_price.toString(), 
      notes: "" 
    })
    setShowStockInDialog(true)
  }

  const openStockOutDialog = (product: InventoryItem): void => {
    setSelectedProduct(product)
    setStockOutForm({ 
      quantity: "", 
      movementType: "SALE", 
      unitCost: product.buying_price.toString(), 
      notes: "" 
    })
    setShowStockOutDialog(true)
  }

  const openAdjustDialog = (product: InventoryItem): void => {
    setSelectedProduct(product)
    setAdjustForm({ 
      newStock: product.current_stock.toString(), 
      reason: "" 
    })
    setShowAdjustDialog(true)
  }

  const openMovementsDialog = (product: InventoryItem): void => {
    setSelectedProduct(product)
    loadStockMovements(product.product_id)
    setShowMovementsDialog(true)
  }

  const filteredInventory = inventory.filter(
    (item) =>
      item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, selectedStore])

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentInventory = filteredInventory.slice(startIndex, endIndex)

  const lowStockCount = inventory.filter((item) => item.is_low_stock).length
  const outOfStockCount = inventory.filter((item) => item.current_stock === 0).length
  const totalInventoryValue = inventorySummary?.total_value || 0
  const totalUnits = inventorySummary?.total_units || 0

  const handleInventoryAdded = (): void => {
    // Refresh inventory immediately after stock is added
    loadInventory()
    loadInventorySummary()
  }

  // Pagination helper
  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* Check if store is selected */}
      {!selectedStore ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-12 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-full shadow-lg mb-6">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">No Store Selected</h2>
          <p className="text-muted-foreground max-w-sm">Please select a store from the header to view inventory management.</p>
        </div>
      ) : (
        <>
          {/* HEADER SECTION */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                Inventory Management
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
                  Live Stock
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Monitor and manage stock levels for{" "}
                <span className="font-bold text-foreground underline underline-offset-4 decoration-primary">{storeName || "your store"}</span>
              </p>
            </div>
            <AddInventoryDialog 
              onStockAdded={handleInventoryAdded}
            />
          </div>

          {/* METRIC CARDS SECTION */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Inventory Value */}
            <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="h-20 w-20" />
              </div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <Boxes className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Stock Value</p>
                </div>
                <div className="text-3xl font-black tracking-tighter">
                  <span className="text-lg font-normal text-slate-500 mr-2">TZS</span>
                  {totalInventoryValue.toLocaleString()}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-500">INVENTORY WORTH</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">{totalUnits} Units</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Alert */}
            <Card className="border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 group hover:border-amber-500 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-[10px] font-black text-amber-600/60 dark:text-amber-400 uppercase tracking-[2px]">Low Stock Alert</p>
                </div>
                <div className="text-4xl font-black text-amber-700 dark:text-amber-500 tracking-tighter">
                  {lowStockCount} <span className="text-sm font-medium opacity-60">Items</span>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-amber-200 dark:bg-amber-900/40 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-600 h-full transition-all duration-1000" 
                      style={{ width: `${(lowStockCount / (inventory.length || 1)) * 100}%` }} 
                    />
                  </div>
                  <p className="text-[9px] mt-2 font-bold text-amber-600/80">REORDER RECOMMENDED</p>
                </div>
              </CardContent>
            </Card>

            {/* Out of Stock */}
            <Card className="border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 group hover:border-red-500 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-red-500/10 p-2 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-[10px] font-black text-red-600/60 dark:text-red-400 uppercase tracking-[2px]">Out of Stock</p>
                </div>
                <div className="text-4xl font-black text-red-700 dark:text-red-500 tracking-tighter">
                  {outOfStockCount} <span className="text-sm font-medium opacity-60">Products</span>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-red-200 dark:bg-red-900/40 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-600 h-full transition-all duration-1000" 
                      style={{ width: `${(outOfStockCount / (inventory.length || 1)) * 100}%` }} 
                    />
                  </div>
                  <p className="text-[9px] mt-2 font-bold text-red-600/80">IMMEDIATE ACTION REQUIRED</p>
                </div>
              </CardContent>
            </Card>

            {/* Stock Health Score */}
            <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="bg-emerald-100 dark:bg-emerald-950/40 p-2 rounded-lg">
                      <Package className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Stock Health</p>
                      <p className="text-xl font-black text-emerald-600">
                        {(((inventory.length - outOfStockCount) / (inventory.length || 1)) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Available Items</span>
                      <span>{inventory.length - outOfStockCount} Products</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-1000" 
                        style={{ width: `${((inventory.length - outOfStockCount) / (inventory.length || 1)) * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-emerald-600/80 mt-4 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Inventory tracking active
                </p>
              </div>
            </Card>
          </div>

          {/* FILTER & INVENTORY TABLE */}
          <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
              <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                <div className="flex flex-1 w-full gap-4">
                  <div className="flex-1">
                    <Select value={filterType} onValueChange={(value) => setFilterType(value as "all" | "low_stock" | "out_of_stock")}>
                      <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="font-bold">All Items</SelectItem>
                        <SelectItem value="low_stock" className="font-bold">Low Stock Only</SelectItem>
                        <SelectItem value="out_of_stock" className="font-bold">Out of Stock Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search products by name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Inventory Data...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-center">
                  <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                    <Package className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-black">No Inventory Found</h3>
                  <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                    {searchQuery ? "No items match your search criteria" : "This store has no inventory yet"}
                  </p>
                  {searchQuery && (
                    <Button variant="link" className="mt-4 font-bold" onClick={() => setSearchQuery("")}>
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Inventory List Component */}
                  <div className="p-6">
                    <InventoryList 
                      inventory={currentInventory}
                      onStockIn={openStockInDialog}
                      onStockOut={openStockOutDialog}
                      onAdjust={openAdjustDialog}
                      onViewHistory={openMovementsDialog}
                      onRefresh={loadInventory}
                    />
                  </div>

                  {totalPages > 1 && (
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                        Showing <span className="text-foreground">{startIndex + 1}</span> to <span className="text-foreground">{Math.min(endIndex, filteredInventory.length)}</span> of {filteredInventory.length} items
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-2 font-bold"
                          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Prev
                        </Button>

                        <div className="flex items-center gap-1.5 mx-2">
                          {getPageNumbers().map((page, i) => (
                            <Button
                              key={i}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => typeof page === 'number' && setCurrentPage(page)}
                              disabled={typeof page !== 'number'}
                              className={`h-9 w-9 text-xs font-black border-2 transition-all ${
                                currentPage === page ? 'shadow-md scale-105' : 'hover:bg-slate-100'
                              }`}
                            >
                              {page}
                            </Button>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 border-2 font-bold"
                          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Stock In Dialog */}
          <Dialog open={showStockInDialog} onOpenChange={setShowStockInDialog}>
            <DialogContent className="border-none shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <DialogHeader className="pt-2">
                <DialogTitle className="text-2xl font-black">Add Stock - {selectedProduct?.product_name}</DialogTitle>
                <DialogDescription>Record incoming stock for this product</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-bold">Quantity *</Label>
                  <Input
                    type="number"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({...stockInForm, quantity: e.target.value})}
                    placeholder="Enter quantity"
                    className="h-11 border-2"
                  />
                </div>
                <div>
                  <Label className="font-bold">Movement Type *</Label>
                  <Select value={stockInForm.movementType} onValueChange={(v) => setStockInForm({...stockInForm, movementType: v})}>
                    <SelectTrigger className="h-11 border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PURCHASE" className="font-bold">Purchase</SelectItem>
                      <SelectItem value="TRANSFER_IN" className="font-bold">Transfer In</SelectItem>
                      <SelectItem value="RETURN" className="font-bold">Return</SelectItem>
                      <SelectItem value="COUNT" className="font-bold">Stock Count Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Unit Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stockInForm.unitCost}
                    onChange={(e) => setStockInForm({...stockInForm, unitCost: e.target.value})}
                    placeholder="Enter unit cost"
                    className="h-11 border-2"
                  />
                </div>
                <div>
                  <Label className="font-bold">Notes</Label>
                  <Textarea
                    value={stockInForm.notes}
                    onChange={(e) => setStockInForm({...stockInForm, notes: e.target.value})}
                    placeholder="Add any notes..."
                    className="border-2"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowStockInDialog(false)} className="font-bold border-2">Cancel</Button>
                <Button onClick={handleStockIn} disabled={!stockInForm.quantity} className="font-bold">Add Stock</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Stock Out Dialog */}
          <Dialog open={showStockOutDialog} onOpenChange={setShowStockOutDialog}>
            <DialogContent className="border-none shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <DialogHeader className="pt-2">
                <DialogTitle className="text-2xl font-black">Remove Stock - {selectedProduct?.product_name}</DialogTitle>
                <DialogDescription>Record outgoing stock for this product</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-bold">Quantity *</Label>
                  <Input
                    type="number"
                    value={stockOutForm.quantity}
                    onChange={(e) => setStockOutForm({...stockOutForm, quantity: e.target.value})}
                    placeholder="Enter quantity"
                    max={selectedProduct?.current_stock}
                    className="h-11 border-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1 font-bold">Available: {selectedProduct?.current_stock}</p>
                </div>
                <div>
                  <Label className="font-bold">Movement Type *</Label>
                  <Select value={stockOutForm.movementType} onValueChange={(v) => setStockOutForm({...stockOutForm, movementType: v})}>
                    <SelectTrigger className="h-11 border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALE" className="font-bold">Sale</SelectItem>
                      <SelectItem value="TRANSFER_OUT" className="font-bold">Transfer Out</SelectItem>
                      <SelectItem value="DAMAGE" className="font-bold">Damage/Loss</SelectItem>
                      <SelectItem value="REFUND" className="font-bold">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-bold">Unit Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stockOutForm.unitCost}
                    onChange={(e) => setStockOutForm({...stockOutForm, unitCost: e.target.value})}
                    placeholder="Enter unit cost"
                    className="h-11 border-2"
                  />
                </div>
                <div>
                  <Label className="font-bold">Notes</Label>
                  <Textarea
                    value={stockOutForm.notes}
                    onChange={(e) => setStockOutForm({...stockOutForm, notes: e.target.value})}
                    placeholder="Add any notes..."
                    className="border-2"
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowStockOutDialog(false)} className="font-bold border-2">Cancel</Button>
                <Button onClick={handleStockOut} disabled={!stockOutForm.quantity} className="font-bold">Remove Stock</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Adjust Stock Dialog */}
          <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
            <DialogContent className="border-none shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
              <DialogHeader className="pt-2">
                <DialogTitle className="text-2xl font-black">Adjust Stock - {selectedProduct?.product_name}</DialogTitle>
                <DialogDescription>Set a new stock level (current: {selectedProduct?.current_stock})</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="font-bold">New Stock Level *</Label>
                  <Input
                    type="number"
                    value={adjustForm.newStock}
                    onChange={(e) => setAdjustForm({...adjustForm, newStock: e.target.value})}
                    placeholder="Enter new stock level"
                    className="h-11 border-2"
                  />
                </div>
                <div>
                  <Label className="font-bold">Reason *</Label>
                  <Textarea
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                    placeholder="Explain why you're adjusting the stock..."
                    rows={3}
                    className="border-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1 font-bold">Minimum 5 characters required</p>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowAdjustDialog(false)} className="font-bold border-2">Cancel</Button>
                <Button onClick={handleAdjustStock} disabled={!adjustForm.newStock || adjustForm.reason.length < 5} className="font-bold">
                  Adjust Stock
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Stock Movements Dialog */}
          <Dialog open={showMovementsDialog} onOpenChange={setShowMovementsDialog}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto border-none shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <DialogHeader className="pt-2">
                <DialogTitle className="text-2xl font-black">Stock Movement History - {selectedProduct?.product_name}</DialogTitle>
                <DialogDescription>Recent stock movements for this product</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {stockMovements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-4">
                      <Package className="h-10 w-10 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground font-medium">No stock movements recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stockMovements.map((movement) => (
                      <div key={movement.id} className="border-2 rounded-xl p-4 hover:shadow-md transition-shadow bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={movement.quantity > 0 ? "default" : "secondary"} className="font-black">
                                {movement.movement_type}
                              </Badge>
                              <span className="text-sm font-black">
                                {movement.quantity > 0 ? '+' : ''}{movement.quantity} units
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground font-bold">
                              Stock: {movement.previous_stock} → {movement.new_stock}
                            </p>
                            {movement.notes && (
                              <p className="text-sm text-muted-foreground italic">{movement.notes}</p>
                            )}
                            {movement.unit_cost > 0 && (
                              <p className="text-sm text-muted-foreground font-bold">
                                Unit Cost: TZS {movement.unit_cost.toLocaleString()} | Total: TZS {movement.total_cost.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-xs text-muted-foreground font-bold">
                            <p>{new Date(movement.performed_at).toLocaleDateString()}</p>
                            <p>{new Date(movement.performed_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setShowMovementsDialog(false)} className="font-bold border-2">Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* FOOTER INFO */}
          <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
              <ShieldCheck className="h-3 w-3" />
              Secure Stock Tracking
            </div>
            <div className="h-1 w-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
              <Clock className="h-3 w-3" />
              Real-time Updates Active
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default InventoryPage