"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { inventory_base_url } from '@/lib/api-config'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface CachedProduct {
  id: string
  product_id: string
  product_name: string
  sku: string
  barcode: string
  buying_price: number
  selling_price: number
  current_stock: number
  available_stock: number
  unit_of_measure: string
  image_id?: string
}

interface InventoryCache {
  barcodeMap: Map<string, CachedProduct>
  skuMap: Map<string, CachedProduct>
  lastUpdated: Date | null
  storeId: string | null
  isLoading: boolean
  error: string | null
}

interface InventoryCacheContextValue {
  cache: InventoryCache
  findProductByBarcode: (barcode: string) => CachedProduct | null
  findProductBySKU: (sku: string) => CachedProduct | null
  refreshCache: (storeId: string, force?: boolean) => Promise<void>
  clearCache: () => void
}

// ─── CONTEXT ─────────────────────────────────────────────────────────────────

const InventoryCacheContext = createContext<InventoryCacheContextValue | null>(null)

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function InventoryCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<InventoryCache>({
    barcodeMap: new Map(),
    skuMap: new Map(),
    lastUpdated: null,
    storeId: null,
    isLoading: false,
    error: null,
  })

  const getToken = useCallback(() => {
    return typeof window !== 'undefined'
      ? sessionStorage.getItem('access_token') || localStorage.getItem('access_token')
      : null
  }, [])

  // O(1) barcode lookup
  const findProductByBarcode = useCallback(
    (barcode: string): CachedProduct | null => {
      if (!barcode) return null
      return cache.barcodeMap.get(barcode.trim()) ?? null
    },
    [cache.barcodeMap]
  )

  // O(1) SKU lookup
  const findProductBySKU = useCallback(
    (sku: string): CachedProduct | null => {
      if (!sku) return null
      return cache.skuMap.get(sku.trim()) ?? null
    },
    [cache.skuMap]
  )

  const refreshCache = useCallback(
    async (storeId: string, force = false) => {
      const cacheAge = cache.lastUpdated
        ? Date.now() - cache.lastUpdated.getTime()
        : Infinity
      const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
      const isSameStore = cache.storeId === storeId

      if (!force && isSameStore && cacheAge < CACHE_TTL) {
        console.log('📦 Using cached inventory (age:', Math.round(cacheAge / 1000), 'seconds)')
        return
      }

      console.log('🔄 Refreshing inventory cache for store:', storeId)
      setCache((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const token = getToken()
        if (!token) throw new Error('No authentication token found')

        const response = await fetch(
          `${inventory_base_url}/inventory/stores/${storeId}?page=1&page_size=1000`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) throw new Error(`Failed to fetch inventory: ${response.status}`)

        const result = await response.json()
        if (!result.success || !result.data?.inventories) {
          throw new Error('Invalid API response format')
        }

        const inventories = result.data.inventories as any[]
        const barcodeMap = new Map<string, CachedProduct>()
        const skuMap = new Map<string, CachedProduct>()

        inventories.forEach((item) => {
          // ── FIX: cache ALL products regardless of stock level ──────────────
          // Zero-stock products still need to be found by barcode so the POS
          // can show the correct "Out of Stock" message instead of
          // "Product Not Found". Stock enforcement happens in handleBarcodeDetected.
          const product: CachedProduct = {
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            sku: item.sku,
            barcode: item.barcode || '',
            buying_price: item.buying_price || 0,
            selling_price: item.selling_price,
            current_stock: item.current_stock,
            available_stock: item.available_stock,
            unit_of_measure: item.unit_of_measure,
            image_id: item.image_id,
          }

          if (product.barcode?.trim()) {
            barcodeMap.set(product.barcode.trim(), product)
          }
          if (product.sku?.trim()) {
            skuMap.set(product.sku.trim(), product)
          }
        })

        console.log('✅ Cache updated:', {
          totalProducts: inventories.length,
          withBarcodes: barcodeMap.size,
          inStock: inventories.filter((i) => i.available_stock > 0).length,
          outOfStock: inventories.filter((i) => i.available_stock <= 0).length,
        })

        setCache({ barcodeMap, skuMap, lastUpdated: new Date(), storeId, isLoading: false, error: null })
      } catch (error: any) {
        console.error('❌ Cache refresh failed:', error)
        setCache((prev) => ({ ...prev, isLoading: false, error: error.message || 'Failed to load inventory' }))
      }
    },
    [cache.lastUpdated, cache.storeId, getToken]
  )

  const clearCache = useCallback(() => {
    setCache({ barcodeMap: new Map(), skuMap: new Map(), lastUpdated: null, storeId: null, isLoading: false, error: null })
  }, [])

  return (
    <InventoryCacheContext.Provider value={{ cache, findProductByBarcode, findProductBySKU, refreshCache, clearCache }}>
      {children}
    </InventoryCacheContext.Provider>
  )
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

export function useInventoryCache() {
  const context = useContext(InventoryCacheContext)
  if (!context) throw new Error('useInventoryCache must be used within InventoryCacheProvider')
  return context
}