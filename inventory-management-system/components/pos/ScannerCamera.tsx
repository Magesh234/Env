"use client"

import React from 'react'
import { Camera, CameraOff, Loader2, ScanLine } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ScannerCameraProps {
  isScanning: boolean
  error: string | null
  lastScannedProduct?: {
    name: string
    price: number
    timestamp: number
  } | null
  // NEW: the ref from the hook — this is what makes the camera actually mount
  scannerContainerRef: React.RefObject<HTMLDivElement | null>
  onStart: () => void
  onStop: () => void
  onRetry: () => void
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function ScannerCamera({
  isScanning,
  error,
  lastScannedProduct,
  scannerContainerRef,
  onStart,
  onStop,
  onRetry,
}: ScannerCameraProps) {
  const [isInitializing, setIsInitializing] = React.useState(false)

  React.useEffect(() => {
    if (isScanning || error) setIsInitializing(false)
  }, [isScanning, error])

  const handleStart = () => {
    setIsInitializing(true)
    onStart()
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* Camera Error */}
      {error && (
        <Alert className="border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
          <CameraOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600 dark:text-red-400 font-bold text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Camera Container */}
      <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-slate-800">

        {/*
          The ref is passed straight from useBarcodeScanner.
          The hook assigns the ID inside startScanning(), so the element is
          guaranteed to exist in the DOM before html5-qrcode ever tries to
          mount into it. This is the core fix.
        */}
        <div
          ref={scannerContainerRef}
          className="w-full rounded-2xl overflow-hidden bg-slate-950"
          style={{ minHeight: '300px' }}
        />

        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
            <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
            <div className="absolute left-8 right-8 top-1/2 h-0.5 bg-emerald-400/80 shadow-[0_0_15px_3px_rgba(52,211,153,0.6)] animate-scan-line" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-emerald-400 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full border border-emerald-400/30 flex items-center gap-2">
              <ScanLine className="h-3.5 w-3.5 animate-pulse" />
              <span>Scanning for barcode...</span>
            </div>
          </div>
        )}

        {/* Initializing State */}
        {isInitializing && !isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-4 z-10">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-7 w-7 text-emerald-400" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[3px] animate-pulse">
              Initializing Camera...
            </p>
          </div>
        )}

        {/* Error State Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-4 p-8 z-10">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <CameraOff className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-sm font-bold text-slate-300 text-center max-w-md">
              Unable to access camera
            </p>
            <Button onClick={onRetry} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              <Camera className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Last Scanned Product */}
      {lastScannedProduct && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <ScanLine className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                ✓ Added to Cart
              </p>
              <p className="text-sm font-bold text-foreground truncate">
                {lastScannedProduct.name}
              </p>
              <p className="text-xs font-bold text-muted-foreground">
                TZS {lastScannedProduct.price.toLocaleString()}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground font-mono">
                {new Date(lastScannedProduct.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        {!isScanning && !error && (
          <Button
            onClick={handleStart}
            disabled={isInitializing}
            className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {isInitializing ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Starting...</>
            ) : (
              <><Camera className="h-5 w-5 mr-2" />Start Scanning</>
            )}
          </Button>
        )}

        {isScanning && (
          <Button
            onClick={onStop}
            variant="outline"
            className="flex-1 h-14 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-base"
          >
            <CameraOff className="h-5 w-5 mr-2" />
            Stop Camera
          </Button>
        )}
      </div>

      <style jsx global>{`
        @keyframes scan-line {
          0%, 100% { transform: translateY(-80px); opacity: 0.6; }
          50%       { transform: translateY(80px);  opacity: 1;   }
        }
        .animate-scan-line {
          animation: scan-line 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}