import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { inventory_base_url } from "@/lib/api-config"

const API_BASE = inventory_base_url

interface RecordPaymentDialogProps {
  debtId: string
  balanceDue: number
  onPaymentRecorded: () => void
}

// Generate a simple transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `TXN-${timestamp}-${random}`
}

export function RecordPaymentDialog({ debtId, balanceDue, onPaymentRecorded }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    amount_paid: "",
    payment_method: "cash",
    reference: "",
    notes: "",
  })

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const handleSubmit = async () => {
    setError(null)
    setSuccess(false)

    const amountPaid = parseFloat(formData.amount_paid)

    // Validation
    if (isNaN(amountPaid) || amountPaid <= 0) {
      setError("Please enter a valid payment amount")
      return
    }

    if (amountPaid > balanceDue) {
      setError(`Payment amount cannot exceed balance due (TZS ${balanceDue.toLocaleString()})`)
      return
    }

    setIsSubmitting(true)

    try {
      const token = getToken()
      if (!token) {
        setError("Authentication error: Please log in again")
        return
      }

      // Generate transaction ID automatically
      const transactionId = generateTransactionId()

      const response = await fetch(`${API_BASE}/debts/${debtId}/pay`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount_paid: amountPaid,
          payment_method: formData.payment_method,
          reference: formData.reference || undefined,
          transaction_id: transactionId, // Auto-generated
          notes: formData.notes || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to record payment")
      }

      if (result.success) {
        setSuccess(true)
        // Reset form
        setFormData({
          amount_paid: "",
          payment_method: "cash",
          reference: "",
          notes: "",
        })
        
        // Call callback to refresh debts list
        onPaymentRecorded()

        // Close dialog after short delay
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen)
      if (!newOpen) {
        // Reset form when closing
        setFormData({
          amount_paid: "",
          payment_method: "cash",
          reference: "",
          notes: "",
        })
        setError(null)
        setSuccess(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <DollarSign className="h-4 w-4 mr-1" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for this debt. Balance due: <span className="font-semibold text-orange-600">TZS {balanceDue.toLocaleString()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Payment recorded successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount_paid">
              Payment Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount_paid"
              type="number"
              step="0.01"
              min="0"
              max={balanceDue}
              placeholder="Enter amount"
              value={formData.amount_paid}
              onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Maximum: TZS {balanceDue.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="payment_method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Payment Reference (Optional)</Label>
            <Input
              id="reference"
              placeholder="e.g., Receipt #123"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes about this payment"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Note:</strong> A transaction ID will be automatically generated for this payment.
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Record Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}