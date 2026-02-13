"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Camera, CameraOff, CheckCircle2, ChevronRight, Barcode,
  Loader2, Package, ScanLine, Send, SkipForward, AlertCircle,
  ListChecks, X, RefreshCw, Keyboard, ShieldCheck, Zap,
  ArrowRight, Clock, Check, Circle, ChevronLeft, Info
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"

import { inventory_base_url } from "@/lib/api-config"
import { useStore } from "@/lib/store-context"

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_BASE_URL = inventory_base_url

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Product {
  id: string
  sku: string
  product_name: string
  barcode?: { String: string; Valid: boolean } | string | null
  buying_price: number
  selling_price: number
  unit_of_measure: string
  is_active: boolean
  image_url?: string
  thumbnail_url?: string
  brand?: { String: string; Valid: boolean }
  store_id: string
}

interface ScannedEntry {
  product_id: string
  product_name: string
  sku: string
  barcode: string
  submitted: boolean
}

type ProductStatus = "pending" | "scanned" | "skipped" | "submitted"

interface QueueItem {
  product: Product
  status: ProductStatus
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getBarcodeString(barcode: Product["barcode"]): string {
  if (!barcode) return ""
  if (typeof barcode === "string") return barcode
  if (typeof barcode === "object" && "String" in barcode) {
    return barcode.Valid ? barcode.String : ""
  }
  return ""
}

function isProductMissingBarcode(product: Product): boolean {
  return getBarcodeString(product.barcode).trim() === ""
}

function validateEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false
  const digits = code.split("").map(Number)
  const checksum = digits.slice(0, 12).reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 1 : 3), 0)
  return (10 - (checksum % 10)) % 10 === digits[12]
}

// ─── SCANNER COMPONENT ───────────────────────────────────────────────────────
function BarcodeScanner({
  onDetected,
  onError,
  active,
}: {
  onDetected: (code: string) => void
  onError: (err: string) => void
  active: boolean
}) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<any>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const detectedRef = useRef(false)

  useEffect(() => {
    if (!active) return

    let mounted = true

    const initScanner = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode")
        if (!mounted || !scannerRef.current) return

        detectedRef.current = false
        const scannerId = "barcode-scanner-region"
        if (scannerRef.current) scannerRef.current.id = scannerId

        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
        })
        html5QrRef.current = scanner

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 280, height: 140 },
            aspectRatio: 1.7,
          },
          (decodedText) => {
            if (!detectedRef.current) {
              detectedRef.current = true
              onDetected(decodedText.trim())
            }
          },
          () => {} // suppress frame errors
        )

        if (mounted) setCameraReady(true)
      } catch (err: any) {
        if (mounted) {
          const msg = err?.message || "Camera access denied"
          onError(msg.includes("Permission") ? "Camera permission denied. Please allow camera access." : msg)
        }
      }
    }

    initScanner()

    return () => {
      mounted = false
      setCameraReady(false)
      if (html5QrRef.current) {
        html5QrRef.current.stop()
          .catch(() => {
          })
          .finally(() => {
            html5QrRef.current = null
          })
      }
    }
  }, [active, onDetected, onError])

  return (
    <div className="relative w-full">
      {/* Camera viewport */}
      <div
        ref={scannerRef}
        className="w-full rounded-2xl overflow-hidden bg-slate-950"
        style={{ minHeight: "240px" }}
      />

      {/* Scanning overlay */}
      {cameraReady && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
          {/* Corner brackets */}
          <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
          <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
          <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
          <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

          {/* Scanning line animation */}
          <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-emerald-400/80 shadow-[0_0_12px_2px_rgba(52,211,153,0.5)] animate-scan-line" />

          {/* Label */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-400/20">
            Scanning for barcode...
          </div>
        </div>
      )}

      {/* Loading state */}
      {!cameraReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 rounded-2xl gap-3" style={{ minHeight: "240px" }}>
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing Camera...</p>
        </div>
      )}
    </div>
  )
}

// ─── PRODUCT IMAGE ────────────────────────────────────────────────────────────
function ProductThumb({ product }: { product: Product }) {
  const url = product.thumbnail_url || product.image_url
  const [err, setErr] = useState(false)

  if (!url || err) {
    return (
      <div className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
        <Package className="h-7 w-7 text-slate-400" />
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={product.product_name}
      onError={() => setErr(true)}
      className="h-16 w-16 rounded-xl object-cover flex-shrink-0 shadow-md"
    />
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function BarcodeAssignmentPage() {
  // Core state
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  // Manual entry
  const [manualMode, setManualMode] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [manualError, setManualError] = useState<string | null>(null)

  // Batch / submit state
  const [scannedEntries, setScannedEntries] = useState<ScannedEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ success: number; failed: number } | null>(null)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  const { selectedStore, storeName } = useStore()

  // ── FETCH PRODUCTS ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!selectedStore) {
      setIsLoading(false)
      setQueue([])
      return
    }

    setIsLoading(true)
    setFetchError(null)
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      if (!token) throw new Error("No access token found.")

      const res = await fetch(`${API_BASE_URL}/stores/${selectedStore}/products`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Failed to fetch products")

      const result = await res.json()
      let data: Product[] = []
      if (result.success && Array.isArray(result.data)) data = result.data
      else if (Array.isArray(result)) data = result
      else if (Array.isArray(result.data)) data = result.data

      const missing = data.filter(isProductMissingBarcode)
      setAllProducts(missing)
      setQueue(missing.map((p) => ({ product: p, status: "pending" })))
      setCurrentIndex(0)
    } catch (err: any) {
      setFetchError(err.message || "Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }, [selectedStore])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── COMPUTED ────────────────────────────────────────────────────────────────
  const currentItem = queue[currentIndex] ?? null
  const pendingInBatch = scannedEntries.filter((e) => !e.submitted)
  const totalScanned = scannedEntries.length
  const totalSubmitted = scannedEntries.filter((e) => e.submitted).length
  const totalPending = queue.filter((q) => q.status === "pending").length
  const totalSkipped = queue.filter((q) => q.status === "skipped").length
  const progressPct = queue.length > 0
    ? Math.round((queue.filter((q) => q.status === "scanned" || q.status === "submitted").length / queue.length) * 100)
    : 0

  // ── SCANNER HANDLERS ────────────────────────────────────────────────────────
  const handleDetected = useCallback((code: string) => {
    setScannerActive(false)
    setScannedCode(code)
    setShowConfirm(true)
  }, [])

  const handleCameraError = useCallback((err: string) => {
    setCameraError(err)
    setScannerActive(false)
  }, [])

  const confirmBarcode = () => {
    if (!currentItem || !scannedCode) return
    const entry: ScannedEntry = {
      product_id: currentItem.product.id,
      product_name: currentItem.product.product_name,
      sku: currentItem.product.sku,
      barcode: scannedCode,
      submitted: false,
    }
    setScannedEntries((prev) => {
      const exists = prev.findIndex((e) => e.product_id === entry.product_id)
      if (exists >= 0) {
        const updated = [...prev]
        updated[exists] = entry
        return updated
      }
      return [...prev, entry]
    })
    setQueue((prev) => prev.map((item, i) => i === currentIndex ? { ...item, status: "scanned" } : item))
    setShowConfirm(false)
    setScannedCode(null)
    advanceToNext()
  }

  const rejectBarcode = () => {
    setShowConfirm(false)
    setScannedCode(null)
    setScannerActive(true)
  }

  // ── MANUAL ENTRY ────────────────────────────────────────────────────────────
  const handleManualSubmit = () => {
    const code = manualInput.trim()
    if (!code) return setManualError("Please enter a barcode.")
    if (code.length === 13 && !validateEAN13(code)) {
      setManualError("Invalid EAN-13 check digit. Please verify the barcode.")
      return
    }
    setManualError(null)
    handleDetected(code)
    setManualInput("")
    setManualMode(false)
  }

  // ── NAVIGATION ──────────────────────────────────────────────────────────────
  const advanceToNext = () => {
    const next = queue.findIndex((item, i) => i > currentIndex && item.status === "pending")
    if (next >= 0) {
      setCurrentIndex(next)
      setScannerActive(true)
    } else {
      setScannerActive(false)
    }
  }

  const skipCurrent = () => {
    setQueue((prev) => prev.map((item, i) => i === currentIndex ? { ...item, status: "skipped" } : item))
    setScannerActive(false)
    advanceToNext()
  }

  const jumpToProduct = (idx: number) => {
    if (queue[idx]?.status === "pending" || queue[idx]?.status === "skipped") {
      setScannerActive(false)
      setTimeout(() => {
        setCurrentIndex(idx)
        setQueue((prev) => prev.map((item, i) => i === idx ? { ...item, status: "pending" } : item))
        setScannerActive(true)
      }, 100)
    }
  }

  // ── SUBMIT BATCH ────────────────────────────────────────────────────────────
  const handleSubmitBatch = async () => {
    if (pendingInBatch.length === 0) return
    setIsSubmitting(true)
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      const payload = {
        updates: pendingInBatch.map((e) => ({ product_id: e.product_id, barcode: e.barcode })),
      }
      const res = await fetch(`${API_BASE_URL}/products/barcodes/bulk-update`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      const successCount = result?.data?.successful ?? pendingInBatch.length
      const failedCount = result?.data?.failed ?? 0

      setScannedEntries((prev) =>
        prev.map((e) => (!e.submitted ? { ...e, submitted: true } : e))
      )
      setQueue((prev) =>
        prev.map((item) => {
          const match = pendingInBatch.find((e) => e.product_id === item.product.id)
          return match ? { ...item, status: "submitted" } : item
        })
      )
      setSubmitResult({ success: successCount, failed: failedCount })
      setShowSubmitDialog(false)
    } catch (err: any) {
      setSubmitResult({ success: 0, failed: pendingInBatch.length })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── STATUS COLOR HELPERS ────────────────────────────────────────────────────
  const statusColor = (status: ProductStatus) => {
    if (status === "submitted") return "text-emerald-500"
    if (status === "scanned") return "text-blue-500"
    if (status === "skipped") return "text-amber-500"
    return "text-slate-400"
  }

  const statusIcon = (status: ProductStatus) => {
    if (status === "submitted") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
    if (status === "scanned") return <ScanLine className="h-3.5 w-3.5 text-blue-500" />
    if (status === "skipped") return <SkipForward className="h-3.5 w-3.5 text-amber-500" />
    return <Circle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NO STORE SELECTED
  if (!selectedStore) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-12 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-full shadow-lg mb-6">
          <Package className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">No Store Active</h2>
        <p className="text-muted-foreground max-w-sm">Please switch to a specific store from your organization dashboard to manage barcodes.</p>
      </div>
    )
  }

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-5">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <Barcode className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-emerald-500" />
        </div>
        <p className="text-sm font-black uppercase tracking-[3px] text-muted-foreground animate-pulse">Loading Product Queue...</p>
      </div>
    )
  }

  // ERROR STATE
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center p-8">
        <AlertCircle className="h-14 w-14 text-red-500" />
        <h2 className="text-xl font-black">Failed to Load Products</h2>
        <p className="text-muted-foreground text-sm">{fetchError}</p>
        <Button onClick={fetchProducts} className="font-bold mt-2">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    )
  }

  // ALL DONE STATE
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center p-8">
        <div className="bg-emerald-100 dark:bg-emerald-950/40 p-6 rounded-full">
          <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black">All Barcodes Assigned!</h2>
        <p className="text-muted-foreground text-sm max-w-sm">Every product in your catalog already has a barcode. Nothing left to assign.</p>
        <Button onClick={fetchProducts} variant="outline" className="font-bold mt-2 border-2">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>
    )
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-24 max-w-[1400px] mx-auto">

      {/* ── HEADER ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Barcode Assignment
            <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-black uppercase py-1 px-2">
              <Zap className="h-3 w-3 mr-1" /> Scanner
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Scanning for <span className="font-bold text-foreground">{storeName}</span> — <span className="font-bold text-foreground">{queue.length}</span> products missing barcodes
          </p>
        </div>

        {/* Submit batch CTA */}
        {pendingInBatch.length > 0 && (
          <Button
            onClick={() => setShowSubmitDialog(true)}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-lg shadow-emerald-500/20 gap-2"
          >
            <Send className="h-4 w-4" />
            Submit {pendingInBatch.length} Barcode{pendingInBatch.length > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-700 ease-out rounded-full"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: queue.length, color: "text-foreground", icon: <Package className="h-4 w-4" /> },
          { label: "Scanned", value: totalScanned, color: "text-blue-500", icon: <ScanLine className="h-4 w-4" /> },
          { label: "Submitted", value: totalSubmitted, color: "text-emerald-500", icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Remaining", value: totalPending, color: "text-slate-500", icon: <Clock className="h-4 w-4" /> },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-200 dark:border-slate-800">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`${stat.color}`}>{stat.icon}</span>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              </div>
              <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── SUCCESS BANNER ── */}
      {submitResult && (
        <Alert className={`border-2 ${submitResult.failed === 0 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-amber-500 bg-amber-50 dark:bg-amber-950/20"}`}>
          <CheckCircle2 className={`h-4 w-4 ${submitResult.failed === 0 ? "text-emerald-500" : "text-amber-500"}`} />
          <AlertDescription className="font-bold">
            {submitResult.failed === 0
              ? `✓ Successfully submitted ${submitResult.success} barcode${submitResult.success > 1 ? "s" : ""}!`
              : `Submitted ${submitResult.success} successfully, ${submitResult.failed} failed. You can retry the failed ones.`}
          </AlertDescription>
        </Alert>
      )}

      {/* ── MAIN LAYOUT: Sidebar + Scanner ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">

        {/* ── LEFT SIDEBAR: Queue ── */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                <h3 className="font-black text-sm uppercase tracking-wider">Product Queue</h3>
              </div>
              <Badge variant="outline" className="font-black text-xs">{queue.length} items</Badge>
            </div>
            {totalSkipped > 0 && (
              <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                <Info className="h-3 w-3" /> {totalSkipped} skipped — click to revisit
              </p>
            )}
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>
            {queue.map((item, idx) => {
              const isCurrent = idx === currentIndex
              const entry = scannedEntries.find((e) => e.product_id === item.product.id)
              return (
                <div
                  key={item.product.id}
                  onClick={() => jumpToProduct(idx)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 transition-all duration-150 ${
                    isCurrent
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500"
                      : item.status === "pending" || item.status === "skipped"
                      ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      : "opacity-60"
                  }`}
                >
                  <div className="flex-shrink-0">{statusIcon(item.status)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-black truncate ${isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                      {item.product.product_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{item.product.sku}</p>
                    {entry && (
                      <p className="text-[10px] text-blue-500 font-mono truncate">{entry.barcode}</p>
                    )}
                  </div>
                  {isCurrent && (
                    <div className="flex-shrink-0 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* ── RIGHT: Scanner Panel ── */}
        <div className="space-y-4">
          {currentItem ? (
            <>
              {/* Current product card */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                <div className="p-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <ProductThumb product={currentItem.product} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Product {currentIndex + 1} of {queue.length}
                        </span>
                        <Badge className="text-[8px] bg-amber-500/10 text-amber-600 border-none font-black uppercase">No Barcode</Badge>
                      </div>
                      <h2 className="text-xl font-black text-foreground leading-tight">{currentItem.product.product_name}</h2>
                      <p className="text-xs font-mono text-muted-foreground mt-1">{currentItem.product.sku}</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                        TZS {currentItem.product.selling_price.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Mode toggle */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={!manualMode ? "default" : "outline"}
                      size="sm"
                      className="flex-1 font-bold border-2 h-9"
                      onClick={() => { setManualMode(false); setCameraError(null); setScannerActive(true) }}
                    >
                      <Camera className="h-3.5 w-3.5 mr-1.5" /> Camera Scan
                    </Button>
                    <Button
                      variant={manualMode ? "default" : "outline"}
                      size="sm"
                      className="flex-1 font-bold border-2 h-9"
                      onClick={() => { setManualMode(true); setScannerActive(false) }}
                    >
                      <Keyboard className="h-3.5 w-3.5 mr-1.5" /> Manual Entry
                    </Button>
                  </div>

                  {/* Camera error */}
                  {cameraError && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 mb-4">
                      <CameraOff className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-red-600 text-xs font-bold">{cameraError}</AlertDescription>
                    </Alert>
                  )}

                  {/* SCANNER or MANUAL */}
                  {!manualMode ? (
                    <div className="space-y-3">
                      {!scannerActive ? (
                        <Button
                          className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-500/20"
                          onClick={() => { setCameraError(null); setScannerActive(true) }}
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Open Camera & Scan
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <BarcodeScanner
                            active={scannerActive}
                            onDetected={handleDetected}
                            onError={handleCameraError}
                          />
                          <Button
                            variant="outline"
                            className="w-full font-bold border-2 text-red-500 hover:bg-red-50"
                            onClick={() => setScannerActive(false)}
                          >
                            <CameraOff className="h-4 w-4 mr-2" /> Stop Camera
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter barcode (e.g. 5901234000017)"
                          value={manualInput}
                          onChange={(e) => { setManualInput(e.target.value); setManualError(null) }}
                          onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                          className="font-mono h-12 text-sm border-2 focus-visible:ring-emerald-500"
                          autoFocus
                        />
                        <Button
                          onClick={handleManualSubmit}
                          className="h-12 px-5 bg-emerald-600 hover:bg-emerald-700 font-black"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                      {manualError && (
                        <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" /> {manualError}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Supports EAN-13, UPC, Code 128 and any barcode format.
                      </p>
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-600 hover:bg-amber-50 font-bold flex-1"
                      onClick={skipCurrent}
                    >
                      <SkipForward className="h-3.5 w-3.5 mr-1.5" /> Skip for Now
                    </Button>
                    {pendingInBatch.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50 flex-1"
                        onClick={() => setShowSubmitDialog(true)}
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Submit {pendingInBatch.length} Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Already scanned (unsubmitted) preview */}
              {pendingInBatch.length > 0 && (
                <Card className="border-slate-200 dark:border-slate-800">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ScanLine className="h-4 w-4 text-blue-500" />
                      <h3 className="font-black text-sm uppercase tracking-wider">Ready to Submit</h3>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-600 border-none font-black">{pendingInBatch.length} pending</Badge>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingInBatch.map((entry) => (
                      <div key={entry.product_id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-xs font-black text-foreground">{entry.product_name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{entry.sku}</p>
                        </div>
                        <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-md">
                          {entry.barcode}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <Button
                      onClick={() => setShowSubmitDialog(true)}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-black shadow-lg shadow-emerald-500/20"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit All {pendingInBatch.length} Barcodes
                    </Button>
                  </div>
                </Card>
              )}
            </>
          ) : (
            /* ALL PRODUCTS PROCESSED */
            <Card className="border-slate-200 dark:border-slate-800 shadow-md">
              <CardContent className="py-20 flex flex-col items-center text-center gap-4">
                <div className="bg-emerald-100 dark:bg-emerald-950/40 p-6 rounded-full">
                  <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black">Queue Complete!</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  You've gone through all {queue.length} products.
                  {pendingInBatch.length > 0 && ` Don't forget to submit your ${pendingInBatch.length} scanned barcodes.`}
                  {totalSkipped > 0 && ` You skipped ${totalSkipped} — click them in the queue to revisit.`}
                </p>
                {pendingInBatch.length > 0 && (
                  <Button
                    onClick={() => setShowSubmitDialog(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 font-black px-8 h-12"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit {pendingInBatch.length} Remaining Barcodes
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── CONFIRM SCAN DIALOG ── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-[420px] border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 rounded-t-xl" />
          <DialogHeader className="pt-4">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Barcode Detected!
            </DialogTitle>
            <DialogDescription>Confirm this barcode is correct for the product shown.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Product info */}
            {currentItem && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <ProductThumb product={currentItem.product} />
                <div>
                  <p className="font-black text-sm">{currentItem.product.product_name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{currentItem.product.sku}</p>
                </div>
              </div>
            )}

            {/* Scanned code */}
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Scanned Barcode</p>
              <p className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-wider">
                {scannedCode}
              </p>
              {scannedCode && scannedCode.length === 13 && (
                <p className={`text-[10px] font-bold mt-1 ${validateEAN13(scannedCode) ? "text-emerald-600" : "text-amber-600"}`}>
                  {validateEAN13(scannedCode) ? "✓ Valid EAN-13" : "⚠ Non-standard format — proceed with caution"}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={rejectBarcode} className="flex-1 font-bold border-2 text-red-500 hover:bg-red-50">
              <X className="h-4 w-4 mr-1.5" /> Rescan
            </Button>
            <Button onClick={confirmBarcode} className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-black">
              <Check className="h-4 w-4 mr-1.5" /> Confirm & Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SUBMIT DIALOG ── */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-[480px] border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 rounded-t-xl" />
          <DialogHeader className="pt-4">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-500" />
              Submit Barcode Batch
            </DialogTitle>
            <DialogDescription>
              This will update <strong>{pendingInBatch.length}</strong> product{pendingInBatch.length !== 1 ? "s" : ""} in your inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[280px] overflow-y-auto space-y-2 py-2">
            {pendingInBatch.map((entry) => (
              <div key={entry.product_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                <div>
                  <p className="text-sm font-black">{entry.product_name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{entry.sku}</p>
                </div>
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">{entry.barcode}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={isSubmitting} className="flex-1 font-bold border-2">
              Cancel
            </Button>
            <Button
              onClick={handleSubmitBatch}
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-black"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Confirm & Submit</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FOOTER ── */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <ShieldCheck className="h-3 w-3" /> Secure Batch Update
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Barcode className="h-3 w-3" /> EAN-13 / UPC / Code128 Supported
        </div>
      </div>

      {/* ── TAILWIND ANIMATION ── */}
      <style jsx global>{`
        @keyframes scan-line {
          0%, 100% { transform: translateY(-60px); opacity: 0.6; }
          50% { transform: translateY(60px); opacity: 1; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}