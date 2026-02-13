"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { POSFullscreen } from "@/components/forms/pos-fullscreen"
import { inventory_base_url } from "@/lib/api-config"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/lib/store-context"

export default function POSPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { selectedStore } = useStore()
  const storeId = params.id as string
  
  const [store, setStore] = useState<any>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Watch for store changes and redirect to new store's POS
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) return

    const user = JSON.parse(userData)
    
    // Only auto-redirect for staff users
    if (user.primary_role === "staff" && selectedStore && selectedStore !== storeId) {
      router.push(`/dashboard/stores/${selectedStore}/pos`)
    }
  }, [selectedStore, storeId, router])

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const token = localStorage.getItem("access_token")
        
        if (!token) {
          throw new Error("No authentication token found")
        }

        // Fetch store details
        const storeResponse = await fetch(`${inventory_base_url}/stores/${storeId}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (!storeResponse.ok) {
          throw new Error(`Failed to fetch store: ${storeResponse.status}`)
        }

        const storeData = await storeResponse.json()
        console.log("Store data:", storeData)
        
        // Fetch ALL inventory items (handle pagination)
        let allInventory: any[] = []
        let currentPage = 1
        let totalPages = 1
        
        do {
          const inventoryResponse = await fetch(
            `${inventory_base_url}/inventory/stores/${storeId}?page=${currentPage}&page_size=100`,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )

          if (!inventoryResponse.ok) {
            throw new Error(`Failed to fetch inventory: ${inventoryResponse.status}`)
          }

          const inventoryData = await inventoryResponse.json()
          console.log(`Inventory data (page ${currentPage}):`, inventoryData)
          
          if (inventoryData.success && inventoryData.data) {
            // Handle paginated response
            if (inventoryData.data.inventories) {
              allInventory = [...allInventory, ...inventoryData.data.inventories]
              totalPages = inventoryData.data.total_pages || 1
            } else if (Array.isArray(inventoryData.data)) {
              // Handle non-paginated response
              allInventory = inventoryData.data
              break
            }
          }
          
          currentPage++
        } while (currentPage <= totalPages)
        
        console.log("Total inventory items loaded:", allInventory.length)
        
        if (storeData.success && storeData.data) {
          setStore(storeData.data)
        } else {
          throw new Error("Store not found or invalid response")
        }
        
        setInventory(allInventory)
        
      } catch (error) {
        console.error("Error fetching store data:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to load store data"
        setError(errorMessage)
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (storeId) {
      fetchStoreData()
    }
  }, [storeId, toast])

  const handleClose = () => {
    router.push(`/dashboard/stores/${storeId}`)
  }

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-sm text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Failed to Load POS</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {error || "Store not found"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry} variant="default">
              Try Again
            </Button>
            <Button onClick={handleClose} variant="outline">
              Back to Store
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <POSFullscreen
      storeId={storeId}
      storeName={store.store_name}
      inventory={inventory}
      onClose={handleClose}
    />
  )
}