"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle } from "lucide-react"
import { inventory_base_url } from "@/lib/api-config"

const API_BASE_URL = inventory_base_url

interface Product {
  id: string
  sku: string
  product_name: string
  buying_price: number
  selling_price: number
  unit_of_measure: string
  reorder_level: number
  is_active: boolean
  track_inventory: boolean
}

interface EditProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductUpdated?: () => void
}

export function EditProductDialog({ product, open, onOpenChange, onProductUpdated }: EditProductDialogProps) {
  const [successOpen, setSuccessOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    sku: "",
    product_name: "",
    buying_price: "",
    selling_price: "",
    unit_of_measure: "",
    reorder_level: "0",
  })

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        product_name: product.product_name,
        buying_price: product.buying_price.toString(),
        selling_price: product.selling_price.toString(),
        unit_of_measure: product.unit_of_measure,
        reorder_level: product.reorder_level.toString(),
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setIsSubmitting(true)
    setError(null)

    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      if (!token) throw new Error("No access token found. Please login again.")

      const payload = {
        sku: formData.sku, // Include SKU in the payload
        product_name: formData.product_name,
        buying_price: parseFloat(formData.buying_price),
        selling_price: parseFloat(formData.selling_price),
        unit_of_measure: formData.unit_of_measure,
        reorder_level: parseInt(formData.reorder_level),
      }

      console.log("Updating product with payload:", payload) // Debug log

      const response = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "Failed to update product")
      }

      onOpenChange(false)
      setSuccessOpen(true)
      onProductUpdated?.()
    } catch (err) {
      console.error("Error updating product:", err)
      setError(err instanceof Error ? err.message : "Failed to update product")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information. SKU cannot be changed.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU Code</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">SKU cannot be modified</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_of_measure">Unit *</Label>
                <Select
                  value={formData.unit_of_measure}
                  onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="Cement 50kg"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buying_price">Buying Price *</Label>
                <Input
                  id="buying_price"
                  type="number"
                  step="0.01"
                  value={formData.buying_price}
                  onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                  placeholder="25000"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="selling_price">Selling Price *</Label>
                <Input
                  id="selling_price"
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  placeholder="30000"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <CheckCircle className="mx-auto text-green-500 h-12 w-12 mb-2" />
            <DialogTitle className="text-green-700">Product Updated Successfully!</DialogTitle>
            <DialogDescription>Your product has been updated.</DialogDescription>
          </DialogHeader>
          <div className="pt-4 flex justify-center">
            <Button onClick={() => setSuccessOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}