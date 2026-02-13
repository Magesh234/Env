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
import { User, Mail, Phone, MapPin, AlertCircle, Calendar } from "lucide-react"
import { inventory_base_url } from "@/lib/api-config"

const API_BASE_URL = inventory_base_url

interface Supplier {
  id: string
  business_owner_id: string
  store_id: string
  supplier_code: string
  supplier_name: string
  contact_person: {
    String: string
    Valid: boolean
  }
  email: {
    String: string
    Valid: boolean
  }
  phone: {
    String: string
    Valid: boolean
  }
  address: {
    String: string
    Valid: boolean
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SupplierDetailsDialogProps {
  supplierId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupplierDetailsDialog({ supplierId, open, onOpenChange }: SupplierDetailsDialogProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (supplierId && open) {
      fetchSupplierDetails()
    }
  }, [supplierId, open])

  const fetchSupplierDetails = async () => {
    if (!supplierId) return

    setIsLoading(true)
    setError(null)

    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      if (!token) throw new Error("No access token found")

      const response = await fetch(`${API_BASE_URL}/suppliers/${supplierId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch supplier details")
      }

      setSupplier(result.data)
    } catch (err) {
      console.error("Error fetching supplier:", err)
      setError(err instanceof Error ? err.message : "Failed to load supplier details")
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to check if value exists and is not empty
  const hasValue = (field: { String: string; Valid: boolean }): boolean => {
    return field.Valid && field.String.trim() !== ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supplier Details</DialogTitle>
          <DialogDescription>Complete information about this supplier</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading supplier details...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mt-4">
            {error}
          </div>
        )}

        {supplier && !isLoading && (
          <div className="space-y-6">
            {/* Header Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">{supplier.supplier_name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{supplier.supplier_code}</p>
                </div>
                <Badge variant={supplier.is_active ? "default" : "secondary"}>
                  {supplier.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold text-sm">Contact Information</h4>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {hasValue(supplier.contact_person) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Contact Person</p>
                    <p className="text-sm font-medium">{supplier.contact_person.String}</p>
                  </div>
                )}
                
                {hasValue(supplier.email) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{supplier.email.String}</p>
                    </div>
                  </div>
                )}
                
                {hasValue(supplier.phone) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{supplier.phone.String}</p>
                    </div>
                  </div>
                )}
                
                {hasValue(supplier.address) && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{supplier.address.String}</p>
                    </div>
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {new Date(supplier.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">
                      {new Date(supplier.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}