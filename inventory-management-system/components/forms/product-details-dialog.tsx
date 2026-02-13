"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { inventory_base_url } from "@/lib/api-config"

const API_BASE_URL = inventory_base_url

interface Product {
  id: string
  sku: string
  product_name: string
  description?: string
  barcode?: string
  category_id?: string
  buying_price: number
  selling_price: number
  wholesale_price?: number
  minimum_selling_price?: number
  unit_of_measure: string
  reorder_level: number
  is_active: boolean
  track_inventory: boolean
  created_at: string
  updated_at: string
}

interface ProductDetailsDialogProps {
  productId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductDetailsDialog({ productId, open, onOpenChange }: ProductDetailsDialogProps) {
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (productId && open) {
      fetchProductDetails()
    }
  }, [productId, open])

  const fetchProductDetails = async () => {
    if (!productId) return

    setIsLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      if (!token) throw new Error("No access token found")

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch product details")
      }

      setProduct(result.data)
    } catch (err) {
      console.error("Error fetching product:", err)
      setError(err instanceof Error ? err.message : "Failed to load product details")
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to safely convert value to string
  const safeString = (value: any): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === 'object') return ""
    return String(value)
  }

  // Helper function to safely convert to number
  const safeNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Helper function to check if value exists and is not empty
  const hasValue = (value: any): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    if (typeof value === 'number' && isNaN(value)) return false
    if (typeof value === 'object') return false
    return true
  }

  // Safe calculation of profit margin
  const getProfitMargin = (): string | null => {
    if (!product) return null
    const buying = safeNumber(product.buying_price)
    const selling = safeNumber(product.selling_price)
    if (buying === 0 || selling === 0) return null
    return ((selling - buying) / selling * 100).toFixed(2)
  }

  // Safe calculation of profit per unit
  const getProfitPerUnit = (): number | null => {
    if (!product) return null
    const buying = safeNumber(product.buying_price)
    const selling = safeNumber(product.selling_price)
    if (buying === 0 || selling === 0) return null
    return selling - buying
  }

  const profitMargin = getProfitMargin()
  const profitPerUnit = getProfitPerUnit()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
          <DialogDescription>Complete information about this product</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading product details...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mt-4">
            {error}
          </div>
        )}

        {product && !isLoading && (
          <div className="space-y-6">
            {/* Header Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{safeString(product.product_name)}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{safeString(product.sku)}</p>
                </div>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {hasValue(product.description) && (
                <p className="text-sm text-muted-foreground mt-2">{safeString(product.description)}</p>
              )}
            </div>

            <Separator />

            {/* Pricing Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Pricing</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {hasValue(product.buying_price) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Buying Price</p>
                    <p className="text-sm font-medium">TZS {safeNumber(product.buying_price).toLocaleString()}</p>
                  </div>
                )}
                {hasValue(product.selling_price) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Selling Price</p>
                    <p className="text-sm font-medium">TZS {safeNumber(product.selling_price).toLocaleString()}</p>
                  </div>
                )}
                {hasValue(product.wholesale_price) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Wholesale Price</p>
                    <p className="text-sm font-medium">TZS {safeNumber(product.wholesale_price).toLocaleString()}</p>
                  </div>
                )}
                {hasValue(product.minimum_selling_price) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Minimum Price</p>
                    <p className="text-sm font-medium">TZS {safeNumber(product.minimum_selling_price).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {profitMargin !== null && profitPerUnit !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-xs text-green-600 font-medium">Profit Margin</p>
                      <p className="text-lg font-bold text-green-700">{profitMargin}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-green-600">Profit per Unit</p>
                      <p className="text-sm font-semibold text-green-700">
                        TZS {profitPerUnit.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Inventory Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Inventory</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {hasValue(product.unit_of_measure) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Unit of Measure</p>
                    <p className="text-sm font-medium uppercase">{safeString(product.unit_of_measure)}</p>
                  </div>
                )}
                {hasValue(product.reorder_level) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Reorder Level</p>
                    <p className="text-sm font-medium">{safeString(product.reorder_level)}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Track Inventory</p>
                  <p className="text-sm font-medium">{product.track_inventory ? "Yes" : "No"}</p>
                </div>
                {hasValue(product.barcode) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Barcode</p>
                    <p className="text-sm font-medium font-mono">{safeString(product.barcode)}</p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Additional Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Additional Information</h4>
              </div>

              <div className="space-y-2 text-sm">
                {hasValue(product.created_at) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {hasValue(product.updated_at) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">
                      {new Date(product.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}