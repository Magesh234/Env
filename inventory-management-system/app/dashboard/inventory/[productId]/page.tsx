"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import { inventory_base_url } from '@/lib/api-config'
import { useStore } from '@/lib/store-context'
import { useToast } from "@/components/ui/use-toast"

interface StockMovement {
  id: string
  movement_type: string
  quantity: number
  previous_stock: number
  new_stock: number
  unit_cost: number
  total_cost: number
  notes: string
  performed_at: string
  performed_by: string
}

interface InventoryDetail {
  id: string
  store_id: string
  product_id: string
  current_stock: number
  reserved_stock: number
  available_stock: number
  store_reorder_level?: number | { Int32: number; Valid: boolean }
  shelf_location?: string | { String: string; Valid: boolean }
  last_stock_update: string
  sku?: string
  product_name?: string
  buying_price?: number
  selling_price?: number
  reorder_level?: number
  unit_of_measure?: string
  category_name?: string
  is_low_stock?: boolean
  inventory_value?: number
}

interface InventoryDetailPageProps {
  params: { productId: string }
  searchParams: { storeId?: string }
}

export default function InventoryDetailPage({ params, searchParams }: InventoryDetailPageProps) {
  const router = useRouter()
  const { selectedStore, storeName } = useStore()
  const { toast } = useToast()
  
  const productId = params.productId
  const storeId = searchParams?.storeId || selectedStore

  const [inventory, setInventory] = useState<InventoryDetail | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMovements, setIsLoadingMovements] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (storeId && productId) {
      setError(null)
      fetchInventoryDetail()
      fetchStockMovements()
    } else {
      setError(`Missing ${!storeId ? 'store ID' : ''} ${!productId ? 'product ID' : ''}`)
      setIsLoading(false)
    }
  }, [storeId, productId])

  const getAuthToken = (): string | null => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const fetchInventoryDetail = async () => {
    if (!storeId || !productId) return

    try {
      setIsLoading(true)
      const token = getAuthToken()
      if (!token) throw new Error("No access token found")

      const inventoryUrl = `${inventory_base_url}/inventory/stores/${storeId}/products/${productId}`
      
      const response = await fetch(inventoryUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setInventory(data.data)
        setError(null)
        await fetchProductDetails(productId, data.data)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProductDetails = async (productId: string, inventoryData: InventoryDetail) => {
    try {
      const token = getAuthToken()
      if (!token) return

      const productUrl = `${inventory_base_url}/products/${productId}`
      
      const response = await fetch(productUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data) {
          const product = data.data
          
          const reorderLevel = typeof inventoryData.store_reorder_level === 'object' && inventoryData.store_reorder_level?.Valid
            ? inventoryData.store_reorder_level.Int32 
            : (typeof inventoryData.store_reorder_level === 'number' ? inventoryData.store_reorder_level : product.reorder_level || 0)
          
          const isLowStock = inventoryData.current_stock <= reorderLevel
          const inventoryValue = inventoryData.current_stock * (product.buying_price || 0)
          
          setInventory(prev => prev ? {
            ...prev,
            sku: product.sku,
            product_name: product.name,
            buying_price: product.buying_price,
            selling_price: product.selling_price,
            reorder_level: product.reorder_level,
            unit_of_measure: product.unit_of_measure || 'units',
            category_name: product.category_name,
            is_low_stock: isLowStock,
            inventory_value: inventoryValue,
          } : null)
        }
      }
    } catch (err) {
      console.error('Failed to fetch product details:', err)
    }
  }

  const fetchStockMovements = async () => {
    if (!storeId || !productId) return

    try {
      setIsLoadingMovements(true)
      const token = getAuthToken()
      if (!token) return

      const movementsUrl = `${inventory_base_url}/inventory/movements?store_id=${storeId}&product_id=${productId}&page_size=50`
      
      const response = await fetch(movementsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.data?.movements) {
          setMovements(data.data.movements)
        }
      }
    } catch (err) {
      console.error('Failed to fetch stock movements:', err)
    } finally {
      setIsLoadingMovements(false)
    }
  }

  const getMovementTypeIcon = (type: string) => {
    const incomingTypes = ['PURCHASE', 'TRANSFER_IN', 'RETURN', 'COUNT', 'ADJUSTMENT']
    return incomingTypes.includes(type) ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    )
  }

  const getMovementTypeBadge = (type: string) => {
    const badgeMap: Record<string, { variant: string; label: string }> = {
      PURCHASE: { variant: 'default', label: 'Purchase' },
      SALE: { variant: 'destructive', label: 'Sale' },
      TRANSFER_IN: { variant: 'default', label: 'Transfer In' },
      TRANSFER_OUT: { variant: 'destructive', label: 'Transfer Out' },
      ADJUSTMENT: { variant: 'outline', label: 'Adjustment' },
      DAMAGE: { variant: 'destructive', label: 'Damage' },
      RETURN: { variant: 'default', label: 'Return' },
      REFUND: { variant: 'destructive', label: 'Refund' },
      COUNT: { variant: 'outline', label: 'Count' },
    }

    const config = badgeMap[type] || { variant: 'outline', label: type }
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
        {getMovementTypeIcon(type)}
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStockStatusBadge = (inventory: InventoryDetail) => {
    if (inventory.current_stock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>
      )
    }
    if (inventory.is_low_stock) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 flex items-center gap-1 w-fit">
          <TrendingDown className="h-3 w-3" />
          Low Stock
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-green-500 text-green-700 flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" />
        In Stock
      </Badge>
    )
  }

  const getReorderLevel = (inventory: InventoryDetail): number => {
    if (typeof inventory.store_reorder_level === 'number') {
      return inventory.store_reorder_level
    }
    if (typeof inventory.store_reorder_level === 'object' && inventory.store_reorder_level?.Valid) {
      return inventory.store_reorder_level.Int32
    }
    return inventory.reorder_level || 0
  }

  const getShelfLocation = (inventory: InventoryDetail): string | null => {
    if (typeof inventory.shelf_location === 'string') {
      return inventory.shelf_location
    }
    if (typeof inventory.shelf_location === 'object' && inventory.shelf_location?.Valid) {
      return inventory.shelf_location.String
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-muted-foreground">Loading inventory details...</p>
      </div>
    )
  }

  if (error || !inventory) {
    return (
      <div className="p-6">
        <Card className="p-16 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Inventory</h3>
          <p className="text-muted-foreground mb-4">{error || 'Inventory not found'}</p>
          <Button onClick={() => router.push('/dashboard/inventory')}>
            Back to Inventory
          </Button>
        </Card>
      </div>
    )
  }

  const shelfLocation = getShelfLocation(inventory)
  const reorderLevel = getReorderLevel(inventory)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/inventory')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
      </div>

      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {inventory.product_name || 'Product Details'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {inventory.sku && `SKU: ${inventory.sku} | `}
              Store: <span className="font-semibold">{storeName || 'Unknown'}</span>
            </p>
          </div>
          {getStockStatusBadge(inventory)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventory.current_stock}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                {inventory.unit_of_measure || 'units'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {inventory.available_stock}
            </div>
            <p className="text-xs text-muted-foreground">Ready for sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {inventory.reserved_stock}
            </div>
            <p className="text-xs text-muted-foreground">Pending orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Level</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reorderLevel}
            </div>
            <p className="text-xs text-muted-foreground">Minimum stock threshold</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {inventory.category_name && (
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{inventory.category_name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Unit of Measure</p>
            <p className="font-medium">{inventory.unit_of_measure || 'units'}</p>
          </div>
          {inventory.selling_price !== undefined && (
            <div>
              <p className="text-sm text-muted-foreground">Selling Price</p>
              <p className="font-medium">TZS {inventory.selling_price.toLocaleString()}</p>
            </div>
          )}
          {inventory.inventory_value !== undefined && (
            <div>
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <p className="font-medium">TZS {inventory.inventory_value.toLocaleString()}</p>
            </div>
          )}
          {shelfLocation && (
            <div>
              <p className="text-sm text-muted-foreground">Shelf Location</p>
              <p className="font-medium">{shelfLocation}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-medium">{formatDate(inventory.last_stock_update)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMovements ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock movements recorded
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Previous</TableHead>
                    <TableHead className="text-right">New</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(movement.performed_at)}
                        </div>
                      </TableCell>
                      <TableCell>{getMovementTypeBadge(movement.movement_type)}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {movement.quantity > 0 ? '+' : ''}
                        {movement.quantity}
                      </TableCell>
                      <TableCell className="text-right">{movement.previous_stock}</TableCell>
                      <TableCell className="text-right font-medium">
                        {movement.new_stock}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}