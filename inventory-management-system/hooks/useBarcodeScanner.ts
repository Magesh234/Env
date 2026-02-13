"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ScanResult {
  code: string
  timestamp: number
}

interface UseBarcodeScanner {
  isScanning: boolean
  error: string | null
  lastScan: ScanResult | null
  startScanning: () => void
  stopScanning: () => void
  resetError: () => void
  scannerContainerRef: React.RefObject<HTMLDivElement | null>
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

export function useBarcodeScanner(
  onDetected: (code: string) => void,
  options?: {
    scanDelay?: number
    enabled?: boolean
  }
): UseBarcodeScanner {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)

  const scannerContainerRef = useRef<HTMLDivElement | null>(null)
  const html5QrRef = useRef<any>(null)
  const lastScanTimeRef = useRef<number>(0)
  const lastScannedCodeRef = useRef<string>('') // Track WHICH barcode (not just "any scan")
  const isMountedRef = useRef(true)

  // Reduced to 250ms - prevents camera "double-read" but allows fast intentional scans
  // Cashier can scan ~4 items per second (realistic speed)
  const scanDelay = options?.scanDelay ?? 250
  const enabled = options?.enabled ?? true

  // ── START ──────────────────────────────────────────────────────────────────
  const startScanning = useCallback(async () => {
    if (!enabled || isScanning) return
    if (!scannerContainerRef.current) {
      setError('Scanner container not found. Please try again.')
      return
    }

    try {
      setError(null)
      lastScannedCodeRef.current = '' // Reset on start

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')
      if (!isMountedRef.current) return

      // Assign the ID dynamically — guarantees the element exists before mounting
      const scannerId = 'barcode-reader-container'
      scannerContainerRef.current.id = scannerId

      const scanner = new Html5Qrcode(scannerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
        ],
        verbose: false,
      })

      html5QrRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 140 }, // narrow box = faster lock, works in low light
          aspectRatio: 1.7,
        },
        (decodedText: string) => {
          const now = Date.now()
          const code = decodedText.trim()

          // ── SMART DUPLICATE PREVENTION ──────────────────────────────────
          // ONLY block if it's the SAME barcode within the scanDelay window
          // This prevents camera "stutter" (reading same barcode 10x in 100ms)
          // BUT allows intentional re-scans (cashier scanning bread 5 times)
          
          const isSameBarcodeAsLastScan = code === lastScannedCodeRef.current
          const timeSinceLastScan = now - lastScanTimeRef.current

          if (isSameBarcodeAsLastScan && timeSinceLastScan < scanDelay) {
            // Camera is still reading the same barcode continuously - ignore this frame
            return
          }

          // ── VALID SCAN ──────────────────────────────────────────────────
          // Either:
          // 1. Different barcode (scan different product)
          // 2. Same barcode but enough time passed (cashier intentionally scanned again)
          
          lastScanTimeRef.current = now
          lastScannedCodeRef.current = code

          const scanResult = { code, timestamp: now }
          setLastScan(scanResult)
          onDetected(code)

          // Beep
          if (typeof window !== 'undefined' && window.AudioContext) {
            try {
              const ctx = new AudioContext()
              const osc = ctx.createOscillator()
              const gain = ctx.createGain()
              osc.connect(gain)
              gain.connect(ctx.destination)
              osc.frequency.value = 800
              osc.type = 'sine'
              gain.gain.value = 0.3
              osc.start(ctx.currentTime)
              osc.stop(ctx.currentTime + 0.1)
            } catch (_) {}
          }
        },
        () => {} // suppress per-frame errors
      )

      if (isMountedRef.current) setIsScanning(true)
    } catch (err: any) {
      if (isMountedRef.current) {
        const msg: string = err?.message ?? ''
        const friendly = msg.includes('Permission')
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : msg.includes('NotFoundError')
          ? 'No camera found. Please connect a camera and try again.'
          : 'Failed to start camera. Please check your device settings.'
        setError(friendly)
        setIsScanning(false)
      }
    }
  }, [enabled, isScanning, onDetected, scanDelay])

  // ── STOP ───────────────────────────────────────────────────────────────────
  const stopScanning = useCallback(async () => {
    if (html5QrRef.current) {
      await html5QrRef.current
        .stop()
        .catch(() => {})
        .finally(() => {
          html5QrRef.current = null
        })
    }
    setIsScanning(false)
    lastScannedCodeRef.current = ''
  }, [])

  // ── RESET ERROR ────────────────────────────────────────────────────────────
  const resetError = useCallback(() => setError(null), [])

  // ── CLEANUP ON UNMOUNT ─────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (html5QrRef.current) {
        html5QrRef.current
          .stop()
          .catch(() => {})
          .finally(() => { html5QrRef.current = null })
      }
    }
  }, [])

  // ── AUTO-STOP IF DISABLED ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled && isScanning) stopScanning()
  }, [enabled, isScanning, stopScanning])

  return {
    isScanning,
    error,
    lastScan,
    startScanning,
    stopScanning,
    resetError,
    scannerContainerRef,
  }
}