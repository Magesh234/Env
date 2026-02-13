"use client"

import React, { useState } from 'react'
import { ArrowRight, Keyboard, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface ManualBarcodeEntryProps {
  onSubmit: (barcode: string) => void
  isProcessing?: boolean
}

// ─── HELPER ──────────────────────────────────────────────────────────────────

function validateEAN13(code: string): boolean {
  if (!/^\d{13}$/.test(code)) return false

  const digits = code.split('').map(Number)
  const checksum = digits
    .slice(0, 12)
    .reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 1 : 3), 0)

  return (10 - (checksum % 10)) % 10 === digits[12]
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function ManualBarcodeEntry({ onSubmit, isProcessing }: ManualBarcodeEntryProps) {
  const [barcode, setBarcode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()

    const code = barcode.trim()

    // Validation
    if (!code) {
      setError('Please enter a barcode')
      return
    }

    if (code.length < 8) {
      setError('Barcode too short (minimum 8 characters)')
      return
    }

    // Check EAN-13 validity (warning only, not blocking)
    if (code.length === 13 && !validateEAN13(code)) {
      setValidationWarning('This appears to be an invalid EAN-13 barcode')
    } else {
      setValidationWarning(null)
    }

    setError(null)
    onSubmit(code)
    setBarcode('')
  }

  const handleChange = (value: string) => {
    setBarcode(value)
    setError(null)
    setValidationWarning(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Keyboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-black text-lg">Manual Entry</h3>
          <p className="text-xs text-muted-foreground">
            Enter barcode manually if camera scan fails
          </p>
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manual-barcode" className="text-sm font-bold">
            Barcode Number
          </Label>
          <div className="flex gap-2">
            <Input
              id="manual-barcode"
              type="text"
              placeholder="e.g., 5901234000017"
              value={barcode}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 h-14 text-lg font-mono border-2 focus-visible:ring-emerald-500"
              autoComplete="off"
              autoFocus
              disabled={isProcessing}
            />
            <Button
              type="submit"
              disabled={!barcode.trim() || isProcessing}
              className="h-14 px-6 bg-emerald-600 hover:bg-emerald-700 font-black shrink-0"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600 dark:text-red-400 font-bold text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Warning */}
        {validationWarning && (
          <Alert className="border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-600 dark:text-amber-400 font-bold text-sm">
              {validationWarning}
            </AlertDescription>
          </Alert>
        )}

        {/* Info */}
        <Alert className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs font-medium">
            <strong>Supported formats:</strong> EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39
          </AlertDescription>
        </Alert>
      </form>

      {/* Quick Entry Buttons (Optional - Common Barcodes) */}
      <div className="pt-2">
        <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
          Quick Test (Sample Barcodes)
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: '5901234000017', label: 'Sample 1' },
            { code: '5901234000024', label: 'Sample 2' },
          ].map((sample) => (
            <Button
              key={sample.code}
              variant="outline"
              size="sm"
              onClick={() => {
                setBarcode(sample.code)
                setError(null)
                setValidationWarning(null)
              }}
              className="h-9 text-xs font-mono border-2"
            >
              {sample.label}: {sample.code}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}