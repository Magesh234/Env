"use client"

import { useState } from "react"
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
import { inventory_base_url } from "@/lib/api-config"

const API_BASE_URL = inventory_base_url

interface Product {
  id: string
  sku: string
  product_name: string
}

interface DeleteProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductDeleted?: () => void
}

export function DeleteProductDialog({ product, open, onOpenChange, onProductDeleted }: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!product) {
      console.error("❌ No product provided")
      return
    }

    console.log("🟢 Delete initiated for product:", product)
    setIsDeleting(true)

    try {
      // Check for token
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      console.log("🔑 Token found:", !!token)
      if (token) {
        console.log("🔑 Token (first 20 chars):", token.substring(0, 20) + "...")
      }

      if (!token) throw new Error("No access token found. Please login again.")

      // Construct the URL
      const deleteUrl = `${API_BASE_URL}/products/${product.id}`
      console.log("📍 Delete URL:", deleteUrl)

      // Prepare request payload
      const requestPayload = {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
      console.log("📦 Request payload:", {
        method: requestPayload.method,
        headers: {
          Authorization: requestPayload.headers.Authorization.substring(0, 20) + "...",
          "Content-Type": requestPayload.headers["Content-Type"],
        },
      })

      // Make the request
      console.log("📤 Sending DELETE request...")
      const response = await fetch(deleteUrl, requestPayload)

      console.log("📥 Response status:", response.status)
      console.log("📥 Response status text:", response.statusText)
      console.log("📥 Response headers:", {
        contentType: response.headers.get("content-type"),
        cacheControl: response.headers.get("cache-control"),
      })

      const result = await response.json()
      console.log("📥 Response body:", result)

      if (!response.ok) {
        console.error("❌ Response not OK:", {
          status: response.status,
          success: result.success,
          error: result.error,
          message: result.message,
        })
        throw new Error(result.error || result.message || `Failed to delete product (${response.status})`)
      }

      if (!result.success) {
        console.error("❌ Success flag is false:", result)
        throw new Error(result.error || result.message || "Server returned success: false")
      }

      console.log("✅ Product deleted successfully")
      console.log("🔄 Closing dialog and calling onProductDeleted callback...")
      
      // Close dialog first
      onOpenChange(false)
      
      // Call the callback to refresh products
      console.log("📞 Calling onProductDeleted callback...")
      if (onProductDeleted) {
        console.log("📞 Callback exists, executing now...")
        onProductDeleted()
      } else {
        console.warn("⚠️ No onProductDeleted callback provided")
      }
      
    } catch (err) {
      console.error("❌ Error during deletion:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product"
      console.error("❌ Error message:", errorMessage)
      alert(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!product) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark "<strong>{product.product_name}</strong>" (SKU: {product.sku}) as inactive.
            The product will no longer appear in active product lists, but historical data will be preserved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Deleting..." : "Delete Product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}