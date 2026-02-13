"use client"

import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, ShoppingCart, Camera, Keyboard, RefreshCw,
  Package, AlertCircle, CheckCircle2, Loader2, Zap, ScanLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useInventoryCache } from '@/contexts/InventoryCacheContext'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { ScannerCamera } from './ScannerCamera'
import { ManualBarcodeEntry } from './ManualBarcodeEntry'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface CartItem {
  product_id: string
  product_name: string
  sku: string
  buying_price: number
  selling_price: number
  unit_price: number
  quantity: number
  discount_percentage: number
  discount_amount: number
  subtotal: number
  total: number
  available_stock: number
}

interface BarcodeScannerModeProps {
  storeId: string
  storeName: string
  cart: CartItem[]
  onAddToCart: (item: CartItem) => void
  onUpdateCartItem: (productId: string, updates: Partial<CartItem>) => void
  onExit: () => void
  onViewCart: () => void
}

interface LastScannedProduct {
  name: string
  price: number
  timestamp: number
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function BarcodeScannerMode({
  storeId,
  storeName,
  cart,
  onAddToCart,
  onUpdateCartItem,
  onExit,
  onViewCart,
}: BarcodeScannerModeProps) {
  const { toast } = useToast()
  const { cache, findProductByBarcode, refreshCache } = useInventoryCache()

  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [lastScannedProduct, setLastScannedProduct] = useState<LastScannedProduct | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load inventory cache on mount
  useEffect(() => {
    if (storeId) refreshCache(storeId, false)
  }, [storeId, refreshCache])

  // Handle barcode detection
  const handleBarcodeDetected = useCallback(
    (barcode: string) => {
      // DEBUG — open chrome://inspect on desktop to see mobile logs
      console.log('📷 Scanned:', JSON.stringify(barcode), '| length:', barcode.length)
      console.log('🗂️  Cache size:', cache.barcodeMap.size, '| first 5 keys:', [...cache.barcodeMap.keys()].slice(0, 5))

      const product = findProductByBarcode(barcode)

      if (!product) {
        toast({
          title: 'Product Not Found',
          description: `No product found with barcode: ${barcode}`,
          variant: 'destructive',
        })
        return
      }

      const existingCartItem = cart.find((item) => item.product_id === product.product_id)

      if (existingCartItem) {
        if (existingCartItem.quantity >= product.available_stock) {
          toast({
            title: 'Out of Stock',
            description: `Only ${product.available_stock} units available for ${product.product_name}`,
            variant: 'destructive',
          })
          return
        }

        const newQuantity = existingCartItem.quantity + 1
        const subtotal = existingCartItem.unit_price * newQuantity
        const discountAmount = (subtotal * existingCartItem.discount_percentage) / 100
        const total = subtotal - discountAmount

        onUpdateCartItem(product.product_id, { quantity: newQuantity, subtotal, discount_amount: discountAmount, total })
        toast({ title: '✓ Quantity Updated', description: `${product.product_name} (${newQuantity} in cart)`, duration: 2000 })
      } else {
        const subtotal = product.selling_price * 1
        const newCartItem: CartItem = {
          product_id: product.product_id,
          product_name: product.product_name,
          sku: product.sku,
          buying_price: product.buying_price,
          selling_price: product.selling_price,
          unit_price: product.selling_price,
          quantity: 1,
          discount_percentage: 0,
          discount_amount: 0,
          subtotal,
          total: subtotal,
          available_stock: product.available_stock,
        }
        onAddToCart(newCartItem)
        toast({ title: '✓ Added to Cart', description: product.product_name, duration: 2000 })
      }

      setLastScannedProduct({ name: product.product_name, price: product.selling_price, timestamp: Date.now() })
      setScanCount((prev) => prev + 1)
    },
    [findProductByBarcode, cart, onAddToCart, onUpdateCartItem, toast]
  )

  // ── THE FIX: destructure scannerContainerRef from the hook ────────────────
  const { isScanning, error, startScanning, stopScanning, resetError, scannerContainerRef } =
    useBarcodeScanner(handleBarcodeDetected, {
      scanDelay: 1000,
      enabled: mode === 'camera',
    })

  const handleManualEntry = useCallback((barcode: string) => {
    handleBarcodeDetected(barcode)
  }, [handleBarcodeDetected])

  const handleRefreshCache = async () => {
    setIsRefreshing(true)
    try {
      await refreshCache(storeId, true)
      toast({ title: 'Cache Refreshed', description: `Loaded ${cache.barcodeMap.size} products with barcodes` })
    } catch (error: any) {
      toast({ title: 'Refresh Failed', description: error.message, variant: 'destructive' })
    } finally {
      setIsRefreshing(false)
    }
  }

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 z-[9998] flex flex-col overflow-hidden">

      {/* ─── HEADER ─── */}
      <header className="h-20 border-b-2 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-8 shrink-0 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <Button variant="ghost" size="sm" onClick={onExit} className="gap-2 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-800 font-bold">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to POS</span>
          </Button>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <ScanLine className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Barcode Scanner</h1>
              <p className="text-xs text-muted-foreground font-bold">{storeName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <Package className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-bold">{cache.barcodeMap.size} products cached</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefreshCache} disabled={isRefreshing || cache.isLoading} className="border-2 font-bold">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
          <Button variant="default" size="sm" onClick={onViewCart} className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold relative">
            <ShoppingCart className="h-4 w-4" />
            <span>Cart</span>
            {cartItemCount > 0 && (
              <Badge className="ml-1 bg-white text-emerald-600 hover:bg-white font-black">{cartItemCount}</Badge>
            )}
          </Button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {cache.isLoading && (
            <Alert className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-600 dark:text-blue-400 font-bold">
                Loading inventory... This will only happen once.
              </AlertDescription>
            </Alert>
          )}

          {cache.error && (
            <Alert className="border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-600 dark:text-red-400 font-bold">{cache.error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <ScanLine className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Items Scanned</p>
                </div>
                <p className="text-3xl font-black text-emerald-600">{scanCount}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Cart Items</p>
                </div>
                <p className="text-3xl font-black text-blue-600">{cartItemCount}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-slate-200 dark:border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Cart Total</p>
                </div>
                <p className="text-2xl font-black text-amber-600">TZS {cartTotal.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800 max-w-md mx-auto">
            <button
              onClick={() => { setMode('camera'); resetError() }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'camera'
                  ? 'bg-white dark:bg-slate-950 shadow-lg border-2 border-emerald-500 text-emerald-600'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-muted-foreground border-2 border-transparent'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Camera Scan</span>
            </button>
            <button
              onClick={() => { setMode('manual'); stopScanning() }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'manual'
                  ? 'bg-white dark:bg-slate-950 shadow-lg border-2 border-blue-500 text-blue-600'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-muted-foreground border-2 border-transparent'
              }`}
            >
              <Keyboard className="h-4 w-4" />
              <span>Manual Entry</span>
            </button>
          </div>

          {/* Scanner / Manual Entry */}
          {mode === 'camera' ? (
            <ScannerCamera
              isScanning={isScanning}
              error={error}
              lastScannedProduct={lastScannedProduct}
              scannerContainerRef={scannerContainerRef}
              onStart={startScanning}
              onStop={stopScanning}
              onRetry={() => { resetError(); startScanning() }}
            />
          ) : (
            <ManualBarcodeEntry onSubmit={handleManualEntry} />
          )}

          <Alert className="border-2 border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-sm font-medium">
              <strong>How it works:</strong> Point your camera at any product barcode. Once detected,
              the product will automatically be added to your cart. Switch to Manual Entry if the
              barcode is damaged or unreadable.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}