"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { 
  Search, FileText, Loader2, CheckCircle2, FileDown, ChevronLeft, 
  ChevronRight, X, Printer, AlertCircle, XCircle, Clock, CheckCheck,
  RotateCcw, DollarSign, TrendingDown, Package, ArrowUpRight,
  Filter, Boxes, ShieldCheck, Info
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { inventory_base_url } from "@/lib/api-config"

const API_BASE = inventory_base_url
const REFUND_RETURNS_ENDPOINT = `${API_BASE}/refund-returns`
const SALES_ENDPOINT = `${API_BASE}/sales`
const ITEMS_PER_PAGE = 10

interface RefundReturn {
  id: string
  business_owner_id: string
  store_id: string
  sale_id: string
  client_id: string | null
  refund_number: string
  invoice_number: string
  transaction_type: "refund" | "return"
  reason: string
  reason_category: string
  total_amount: number
  refund_amount: number
  restocking_fee: number
  status: "pending" | "approved" | "processing" | "completed" | "rejected" | "cancelled"
  refund_method: { String: string; Valid: boolean }
  refund_reference: { String: string; Valid: boolean }
  customer_notes: { String: string; Valid: boolean }
  internal_notes: { String: string; Valid: boolean }
  requested_by: string
  requested_at: string
  approved_by: string | null
  approved_at: { Time: string; Valid: boolean }
  processed_by: string | null
  processed_at: { Time: string; Valid: boolean }
  completed_by: string | null
  completed_at: { Time: string; Valid: boolean }
  rejected_by: string | null
  rejected_at: { Time: string; Valid: boolean }
  rejection_reason: { String: string; Valid: boolean }
  created_at: string
  updated_at: string
  client_name: string
  store_name: string
  items: RefundReturnItem[]
  total_items: number
  total_quantity: number
  restocked_quantity: number
}

interface RefundReturnItem {
  id: string
  refund_return_id: string
  sale_item_id: string
  product_id: string
  product_name: string
  sku: string
  quantity_returned: number
  quantity_restocked: number
  unit_price: number
  total_amount: number
  refund_amount: number
  item_condition: string
  can_restock: boolean
  item_reason: { String: string; Valid: boolean }
  created_at: string
  original_quantity: number
  unit_of_measure: string
  buying_price: number
}

interface Sale {
  id: string
  invoice_number: string
  store_id: string
}

// SUCCESS MODAL COMPONENT
function SuccessModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  icon: Icon = CheckCircle2,
  autoCloseDelay = 3000 
}: { 
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  icon?: any
  autoCloseDelay?: number
}) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose, autoCloseDelay])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300 border-2 border-emerald-500/20">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative bg-emerald-500/10 p-4 rounded-full">
              <Icon className="h-12 w-12 text-emerald-600 animate-in zoom-in duration-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground font-medium">{message}</p>
          </div>
          
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 animate-progress" 
              style={{ 
                animation: `progress ${autoCloseDelay}ms linear forwards` 
              }}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

// Detail Modal Component
function RefundReturnDetailModal({ 
  refundReturn, 
  isOpen, 
  onClose,
  onStatusChange
}: { 
  refundReturn: RefundReturn | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: () => void
}) {
  const [actionLoading, setActionLoading] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [showApprovalForm, setShowApprovalForm] = useState(false)
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [refundMethod, setRefundMethod] = useState("cash")
  const [refundReference, setRefundReference] = useState("")
  const [showProcessForm, setShowProcessForm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successConfig, setSuccessConfig] = useState({ title: "", message: "", icon: CheckCircle2 })
  const { toast } = useToast()

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const handleApprove = async () => {
    if (!refundReturn) return
    setActionLoading(true)

    try {
      const token = getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${REFUND_RETURNS_ENDPOINT}/${refundReturn.id}/approve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approval_notes: approvalNotes }),
      })

      if (!response.ok) throw new Error("Failed to approve")

      // Close the detail modal immediately
      onClose()
      
      // Show success modal
      setSuccessConfig({
        title: "Approved Successfully!",
        message: `Refund/return #${refundReturn.refund_number} has been approved and is ready for processing.`,
        icon: CheckCircle2
      })
      setShowSuccessModal(true)
      setShowApprovalForm(false)
      setApprovalNotes("")
      onStatusChange()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!refundReturn) return
    if (rejectionReason.length < 10) {
      toast({
        title: "Error",
        description: "Rejection reason must be at least 10 characters",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)

    try {
      const token = getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${REFUND_RETURNS_ENDPOINT}/${refundReturn.id}/reject`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejection_reason: rejectionReason }),
      })

      if (!response.ok) throw new Error("Failed to reject")

      // Close the detail modal immediately
      onClose()
      
      // Show success modal
      setSuccessConfig({
        title: "Request Rejected",
        message: `Refund/return #${refundReturn.refund_number} has been rejected.`,
        icon: XCircle
      })
      setShowSuccessModal(true)
      setShowRejectionForm(false)
      setRejectionReason("")
      onStatusChange()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleProcess = async () => {
    if (!refundReturn) return
    setActionLoading(true)

    try {
      const token = getToken()
      if (!token) throw new Error("No authentication token")

      const payload = {
        refund_method: refundMethod,
        refund_reference: refundReference,
        processing_notes: "",
        items: refundReturn.items.map(item => ({
          item_id: item.id,
          quantity_restocked: item.quantity_returned,
          can_restock: item.can_restock,
        })),
      }

      const response = await fetch(`${REFUND_RETURNS_ENDPOINT}/${refundReturn.id}/process`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || "Failed to process")
      }

      // Close the detail modal immediately
      onClose()
      
      // Show success modal
      setSuccessConfig({
        title: "Processed Successfully!",
        message: `Refund of TZS ${refundReturn.refund_amount.toLocaleString()} has been processed via ${refundMethod}.`,
        icon: CheckCheck
      })
      setShowSuccessModal(true)
      setShowProcessForm(false)
      onStatusChange()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!refundReturn) return
    setActionLoading(true)

    try {
      const token = getToken()
      if (!token) throw new Error("No authentication token")

      const response = await fetch(`${REFUND_RETURNS_ENDPOINT}/${refundReturn.id}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to cancel")

      // Close the detail modal immediately
      onClose()
      
      // Show success modal
      setSuccessConfig({
        title: "Request Cancelled",
        message: `Refund/return #${refundReturn.refund_number} has been cancelled.`,
        icon: X
      })
      setShowSuccessModal(true)
      onStatusChange()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (!isOpen || !refundReturn) return null

  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    approved: { color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
    processing: { color: "bg-purple-100 text-purple-800", icon: Loader2 },
    completed: { color: "bg-green-100 text-green-800", icon: CheckCheck },
    rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
    cancelled: { color: "bg-gray-100 text-gray-800", icon: X },
  }

  const config = statusConfig[refundReturn.status]

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{refundReturn.transaction_type.toUpperCase()} #{refundReturn.refund_number}</DialogTitle>
            <DialogDescription className="text-sm font-medium">
              Invoice: {refundReturn.invoice_number} • Store: {refundReturn.store_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status and Key Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-500 uppercase font-black">Status</Label>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color} mt-1`}>
                  <config.icon className="h-4 w-4" />
                  {refundReturn.status}
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 uppercase font-black">Type</Label>
                <p className="text-sm font-medium capitalize mt-1">{refundReturn.transaction_type}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 uppercase font-black">Reason</Label>
                <p className="text-sm capitalize mt-1">{refundReturn.reason_category}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500 uppercase font-black">Requested</Label>
                <p className="text-sm mt-1">
                  {new Date(refundReturn.requested_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Amounts */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2 border-2 border-slate-100 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 font-bold">Total Amount:</span>
                <span className="text-sm font-black">TZS {refundReturn.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 font-bold">Restocking Fee:</span>
                <span className="text-sm font-black">TZS {refundReturn.restocking_fee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-black">Refund Amount:</span>
                <span className="text-sm font-black text-emerald-600">TZS {refundReturn.refund_amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label className="text-sm font-black">Items</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                      <TableHead className="text-xs font-black">Product</TableHead>
                      <TableHead className="text-xs text-center font-black">Qty</TableHead>
                      <TableHead className="text-xs font-black">Condition</TableHead>
                      <TableHead className="text-xs text-right font-black">Refund</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refundReturn.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-sm text-center font-bold">{item.quantity_returned}</TableCell>
                        <TableCell className="text-sm capitalize">{item.item_condition}</TableCell>
                        <TableCell className="text-sm text-right font-bold text-emerald-600">TZS {item.refund_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-2 gap-4">
              {refundReturn.customer_notes.Valid && (
                <div>
                  <Label className="text-xs text-gray-500 uppercase font-black">Customer Notes</Label>
                  <p className="text-sm mt-1 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-100 dark:border-blue-900">{refundReturn.customer_notes.String}</p>
                </div>
              )}
              {refundReturn.internal_notes.Valid && (
                <div>
                  <Label className="text-xs text-gray-500 uppercase font-black">Internal Notes</Label>
                  <p className="text-sm mt-1 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-100 dark:border-yellow-900">{refundReturn.internal_notes.String}</p>
                </div>
              )}
            </div>

            {/* Action Forms */}
            {refundReturn.status === "pending" && (
              <>
                {!showApprovalForm && !showRejectionForm && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowApprovalForm(true)}
                      className="flex-1 font-bold"
                      variant="default"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => setShowRejectionForm(true)}
                      className="flex-1 font-bold"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {showApprovalForm && (
                  <div className="space-y-2 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg border-2 border-emerald-200 dark:border-emerald-900">
                    <Label className="text-sm font-black">Approval Notes (optional)</Label>
                    <Textarea
                      placeholder="Add any notes..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="h-20 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex-1 font-bold"
                        variant="default"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Confirm Approval
                      </Button>
                      <Button
                        onClick={() => setShowApprovalForm(false)}
                        variant="outline"
                        className="font-bold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {showRejectionForm && (
                  <div className="space-y-2 bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border-2 border-red-200 dark:border-red-900">
                    <Label className="text-sm font-black">Rejection Reason (minimum 10 characters)</Label>
                    <Textarea
                      placeholder="Explain why this is being rejected..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="h-20 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReject}
                        disabled={actionLoading || rejectionReason.length < 10}
                        className="flex-1 font-bold"
                        variant="destructive"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Confirm Rejection
                      </Button>
                      <Button
                        onClick={() => setShowRejectionForm(false)}
                        variant="outline"
                        className="font-bold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {refundReturn.status === "approved" && (
              <>
                {!showProcessForm && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowProcessForm(true)}
                      className="flex-1 font-bold"
                      variant="default"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Process
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="flex-1 font-bold"
                      variant="outline"
                    >
                      Cancel Request
                    </Button>
                  </div>
                )}

                {showProcessForm && (
                  <div className="space-y-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-900">
                    <div className="space-y-2">
                      <Label htmlFor="method" className="text-sm font-black">Refund Method</Label>
                      <Select value={refundMethod} onValueChange={setRefundMethod}>
                        <SelectTrigger id="method" className="text-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash" className="font-bold">Cash</SelectItem>
                          <SelectItem value="mobile_money" className="font-bold">Mobile Money</SelectItem>
                          <SelectItem value="bank_transfer" className="font-bold">Bank Transfer</SelectItem>
                          <SelectItem value="store_credit" className="font-bold">Store Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ref" className="text-sm font-black">Reference Number (optional)</Label>
                      <Input
                        id="ref"
                        placeholder="e.g., transaction ID, check number"
                        value={refundReference}
                        onChange={(e) => setRefundReference(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleProcess}
                        disabled={actionLoading}
                        className="flex-1 font-bold"
                        variant="default"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Process Refund/Return
                      </Button>
                      <Button
                        onClick={() => setShowProcessForm(false)}
                        variant="outline"
                        className="font-bold"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={successConfig.title}
        message={successConfig.message}
        icon={successConfig.icon}
      />
    </>
  )
}

// Create Dialog (keeping original logic)
function CreateRefundReturnDialog({ onCreated }: { onCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [saleID, setSaleID] = useState("")
  const [transactionType, setTransactionType] = useState("return")
  const [reasonCategory, setReasonCategory] = useState("damaged")
  const [reason, setReason] = useState("")
  const [customerNotes, setCustomerNotes] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [restockingFee, setRestockingFee] = useState(0)
  const [items, setItems] = useState<any[]>([])
  const [saleItems, setSaleItems] = useState<any[]>([])
  const [loadingSaleItems, setLoadingSaleItems] = useState(false)
  const [saleNotFound, setSaleNotFound] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { toast } = useToast()

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const fetchSaleByInvoice = async (invoice: string) => {
    if (!invoice.trim()) {
      setSaleItems([])
      setItems([])
      setSaleID("")
      setSaleNotFound(false)
      return
    }

    setLoadingSaleItems(true)
    setSaleNotFound(false)

    try {
      const token = getToken()
      if (!token) throw new Error("No token")

      const url = `${SALES_ENDPOINT}?invoice_number=${encodeURIComponent(invoice)}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch sale")

      const result = await response.json()
      
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const sale = result.data[0]
        setSaleID(sale.id)
        await fetchSaleItems(sale.id)
      } else {
        setSaleNotFound(true)
        setSaleItems([])
        setItems([])
        setSaleID("")
        toast({
          title: "Sale Not Found",
          description: `No sale found with invoice number: ${invoice}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      setSaleNotFound(true)
      setSaleItems([])
      setItems([])
      setSaleID("")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch sale",
        variant: "destructive",
      })
    } finally {
      setLoadingSaleItems(false)
    }
  }

  const fetchSaleItems = async (saleId: string) => {
    if (!saleId) return

    try {
      const token = getToken()
      if (!token) throw new Error("No token")

      const response = await fetch(`${SALES_ENDPOINT}/${saleId}/items`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          setSaleItems(result.data)
          setItems(
            result.data.map((item: any) => ({
              sale_item_id: item.id,
              quantity_returned: 0,
              item_condition: "good",
              item_reason: "",
            }))
          )
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sale items",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) {
      toast({ title: "Error", description: "Please enter an invoice number", variant: "destructive" })
      return
    }
    if (!saleID) {
      toast({ title: "Error", description: "Please search for a valid invoice first", variant: "destructive" })
      return
    }
    if (!reason.trim()) {
      toast({ title: "Error", description: "Please provide a reason for the return/refund", variant: "destructive" })
      return
    }
    if (items.every(i => i.quantity_returned === 0)) {
      toast({ title: "Error", description: "Please select at least one item to return", variant: "destructive" })
      return
    }

    setIsLoading(true)

    try {
      const token = getToken()
      if (!token) throw new Error("No token")

      const payload = {
        sale_id: saleID,
        transaction_type: transactionType,
        reason,
        reason_category: reasonCategory,
        restocking_fee: parseFloat(restockingFee.toString()),
        customer_notes: customerNotes,
        internal_notes: internalNotes,
        items: items.filter(i => i.quantity_returned > 0),
      }

      const response = await fetch(REFUND_RETURNS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create refund/return request")
      }

      setShowSuccessModal(true)
      
      // Reset form
      setTimeout(() => {
        setIsOpen(false)
        setInvoiceNumber("")
        setSaleID("")
        setSaleItems([])
        setItems([])
        setReason("")
        setCustomerNotes("")
        setInternalNotes("")
        setRestockingFee(0)
        setSaleNotFound(false)
        onCreated()
      }, 3000)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create refund/return",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Button onClick={() => setIsOpen(true)} className="h-10 font-bold">
          <Plus className="h-4 w-4 mr-2" />
          Create Return/Refund
        </Button>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Create Refund/Return Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice" className="font-black">Invoice Number</Label>
              <div className="flex gap-2">
                <Input
                  id="invoice"
                  placeholder="Enter invoice number (e.g., INV-fb20-20251006-0015)"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="text-sm flex-1"
                />
                <Button
                  onClick={() => fetchSaleByInvoice(invoiceNumber)}
                  disabled={!invoiceNumber.trim() || loadingSaleItems}
                  variant="outline"
                  className="h-10 font-bold"
                >
                  {loadingSaleItems ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {saleNotFound && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium">
                Sale not found. Please check the invoice number and try again.
              </div>
            )}

            {loadingSaleItems && (
              <div className="text-center py-2 text-sm text-gray-600 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sale items...
              </div>
            )}

            {saleItems.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-black">Items from Sale (Sale ID: {saleID})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {items.map((item, idx) => {
                    const saleItem = saleItems.find(si => si.id === item.sale_item_id)
                    return (
                      <div key={idx} className="p-3 border rounded-lg space-y-2 bg-slate-50 dark:bg-slate-900">
                        <div className="font-sm font-black">{saleItem?.product_name}</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs font-black">Qty Returned</Label>
                            <Input
                              type="number"
                              min=""
                              max={saleItem?.quantity}
                              value={item.quantity_returned}
                              onChange={(e) => {
                                const newItems = [...items]
                                newItems[idx].quantity_returned = parseInt(e.target.value) || 0
                                setItems(newItems)
                              }}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-black">Condition</Label>
                            <Select value={item.item_condition} onValueChange={(val) => {
                              const newItems = [...items]
                              newItems[idx].item_condition = val
                              setItems(newItems)
                            }}>
                              <SelectTrigger className="text-sm font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="good" className="font-bold">Good</SelectItem>
                                <SelectItem value="damaged" className="font-bold">Damaged</SelectItem>
                                <SelectItem value="defective" className="font-bold">Defective</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-black">Reason</Label>
                            <Input
                              placeholder="Why returned"
                              value={item.item_reason}
                              onChange={(e) => {
                                const newItems = [...items]
                                newItems[idx].item_reason = e.target.value
                                setItems(newItems)
                              }}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="font-black">Transaction Type</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger id="type" className="text-sm font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund" className="font-bold">Refund</SelectItem>
                    <SelectItem value="return" className="font-bold">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="font-black">Reason Category</Label>
                <Select value={reasonCategory} onValueChange={setReasonCategory}>
                  <SelectTrigger id="category" className="text-sm font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defective" className="font-bold">Defective</SelectItem>
                    <SelectItem value="damaged" className="font-bold">Damaged</SelectItem>
                    <SelectItem value="wrong_item" className="font-bold">Wrong Item</SelectItem>
                    <SelectItem value="customer_request" className="font-bold">Customer Request</SelectItem>
                    <SelectItem value="other" className="font-bold">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="font-black">Reason Description</Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for return/refund..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-20 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee" className="font-black">Restocking Fee</Label>
              <Input
                id="fee"
                type="number"
                min="0"
                value={restockingFee}
                onChange={(e) => setRestockingFee(parseFloat(e.target.value) || 0)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cNotes" className="font-black">Customer Notes</Label>
              <Textarea
                id="cNotes"
                placeholder="Customer's comments..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="h-16 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iNotes" className="font-black">Internal Notes</Label>
              <Textarea
                id="iNotes"
                placeholder="Internal notes for staff..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="h-16 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={isLoading || !saleID} className="flex-1 font-bold">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Request
              </Button>
              <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1 font-bold">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Request Created!"
        message="Your refund/return request has been successfully created and is pending approval."
        icon={CheckCircle2}
      />
    </>
  )
}

export default function RefundsReturnsPage() {
  const [refundReturns, setRefundReturns] = useState<RefundReturn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRefundReturn, setSelectedRefundReturn] = useState<RefundReturn | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const { toast } = useToast()

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const fetchRefundReturns = async () => {
    setIsLoading(true)
    setFetchError(null)

    try {
      const token = getToken()
      if (!token) {
        setFetchError("Authentication error: No access token found. Please log in.")
        return
      }

      let url = `${REFUND_RETURNS_ENDPOINT}?page=1&page_size=100`
      if (filterStatus && filterStatus !== "all") url += `&status=${filterStatus}`
      if (filterType && filterType !== "all") url += `&transaction_type=${filterType}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data && Array.isArray(result.data.refund_returns)) {
        setRefundReturns(result.data.refund_returns)
      } else {
        setRefundReturns([])
      }
    } catch (error) {
      console.error("Error fetching refund/returns:", error)
      setFetchError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const openDetailModal = (refundReturn: RefundReturn) => {
    setSelectedRefundReturn(refundReturn)
    setIsModalOpen(true)
  }

  const closeDetailModal = () => {
    setIsModalOpen(false)
    setSelectedRefundReturn(null)
  }

  useEffect(() => {
    fetchRefundReturns()
  }, [filterStatus, filterType])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredData = refundReturns.filter(
    (rr) =>
      rr.refund_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rr.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rr.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentItems = filteredData.slice(startIndex, endIndex)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-none"
      case "approved": return "bg-blue-500/10 text-blue-600 border-none"
      case "processing": return "bg-purple-500/10 text-purple-600 border-none"
      case "completed": return "bg-emerald-500/10 text-emerald-600 border-none"
      case "rejected": return "bg-red-500/10 text-red-600 border-none"
      case "cancelled": return "bg-slate-500/10 text-slate-600 border-none"
      default: return "bg-slate-100 dark:bg-slate-800 text-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    return type === "refund" 
      ? "bg-red-500/10 text-red-600 border-none" 
      : "bg-blue-500/10 text-blue-600 border-none"
  }

  const getReasonCategoryColor = (category: string) => {
    switch (category) {
      case "defective": return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400"
      case "damaged": return "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400"
      case "wrong_item": return "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400"
      case "customer_request": return "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
      default: return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400"
    }
  }

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Please allow pop-ups to export PDF")
      return
    }

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const totalRefundAmount = filteredData.reduce((sum, rr) => sum + rr.refund_amount, 0)
    const totalReturnValue = filteredData.reduce((sum, rr) => sum + rr.total_amount, 0)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Refunds & Returns Report - ${currentDate}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #333; }
            .header h1 { font-size: 24px; margin-bottom: 5px; font-weight: 900; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; }
            .summary-item { text-align: center; }
            .summary-label { font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 5px; font-weight: 900; }
            .summary-value { font-size: 16px; font-weight: 900; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background-color: #f3f4f6; padding: 10px 8px; text-align: left; font-weight: 900; border: 1px solid #ddd; text-transform: uppercase; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
            .badge-pending { background-color: #fef3c7; color: #92400e; }
            .badge-approved { background-color: #dbeafe; color: #1e40af; }
            .badge-processing { background-color: #e9d5ff; color: #6b21a8; }
            .badge-completed { background-color: #dcfce7; color: #166534; }
            .badge-rejected { background-color: #fee2e2; color: #991b1b; }
            .badge-cancelled { background-color: #f3f4f6; color: #374151; }
            .badge-refund { background-color: #fee2e2; color: #991b1b; }
            .badge-return { background-color: #dbeafe; color: #1e40af; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
            @media print { body { padding: 10px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Refunds & Returns Report</h1>
            <p>Generated on ${currentDate}</p>
            <p>Total Records: ${filteredData.length}</p>
          </div>
          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Returned Value</div>
              <div class="summary-value">TZS ${totalReturnValue.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Refunded</div>
              <div class="summary-value">TZS ${totalRefundAmount.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Requests</div>
              <div class="summary-value">${filteredData.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Refund #</th>
                <th>Invoice #</th>
                <th>Type</th>
                <th>Reason</th>
                <th class="text-center">Items</th>
                <th class="text-right">Total Amount</th>
                <th class="text-right">Refund</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map(rr => `
                <tr>
                  <td>${rr.refund_number}</td>
                  <td>${rr.invoice_number}</td>
                  <td><span class="badge badge-${rr.transaction_type}">${rr.transaction_type}</span></td>
                  <td class="capitalize">${rr.reason_category}</td>
                  <td class="text-center">${rr.total_items}</td>
                  <td class="text-right">TZS ${rr.total_amount.toLocaleString()}</td>
                  <td class="text-right">TZS ${rr.refund_amount.toLocaleString()}</td>
                  <td><span class="badge badge-${rr.status}">${rr.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>This report was generated automatically from the refunds & returns management system.</p>
            <p style="margin-top: 20px;" class="no-print">Press Ctrl+P (Cmd+P on Mac) to print or save as PDF</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Analytics Metrics
  const totalRefundValue = refundReturns.reduce((sum, rr) => sum + rr.refund_amount, 0)
  const pendingCount = refundReturns.filter(rr => rr.status === 'pending').length
  const completedCount = refundReturns.filter(rr => rr.status === 'completed').length

  const getPageNumbers = () => {
    const pages = []
    const maxPagesToShow = 5
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return pages
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Returns & Refunds
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Active
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
            Manage return and refund requests with precision
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {refundReturns.length > 0 && (
            <Button variant="outline" className="h-10 font-bold border-2" onClick={handleExportPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          )}
          <CreateRefundReturnDialog onCreated={fetchRefundReturns} />
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Refunded */}
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingDown className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Refunded</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              <span className="text-lg font-normal text-slate-500 mr-2">TZS</span>
              {totalRefundValue.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">LIFETIME VALUE</span>
              <Badge className="bg-red-500/10 text-red-400 border-none font-black">Returns</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="border-yellow-100 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20 group hover:border-yellow-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-[10px] font-black text-yellow-600/60 dark:text-yellow-400 uppercase tracking-[2px]">Pending Review</p>
            </div>
            <div className="text-4xl font-black text-yellow-700 dark:text-yellow-500 tracking-tighter">
              {pendingCount} <span className="text-sm font-medium opacity-60">Requests</span>
            </div>
            <div className="mt-4">
               <div className="w-full bg-yellow-200 dark:bg-yellow-900/40 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-yellow-600 h-full transition-all duration-1000" 
                    style={{ width: `${(pendingCount / (refundReturns.length || 1)) * 100}%` }} 
                  />
               </div>
               <p className="text-[9px] mt-2 font-bold text-yellow-600/80 uppercase">REQUIRES ACTION</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed */}
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/10 p-2 rounded-lg">
                <CheckCheck className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Completed</p>
            </div>
            <div className="text-4xl font-black text-foreground tracking-tighter">
              {completedCount}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" /> Successfully Processed
            </p>
          </CardContent>
        </Card>

        {/* Total Requests */}
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 flex flex-col justify-between h-full bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="bg-blue-100 dark:bg-blue-950/40 p-2 rounded-lg">
                  <RotateCcw className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase">Total Requests</p>
                  <p className="text-xl font-black text-blue-600">{refundReturns.length}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span>{((completedCount/(refundReturns.length || 1))*100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                   <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${(completedCount/(refundReturns.length || 1))*100}%` }} />
                </div>
              </div>
            </div>
            <p className="text-[9px] font-bold text-blue-600/80 mt-4 flex items-center gap-1">
              <Info className="h-3 w-3" /> All-time statistics
            </p>
          </div>
        </Card>
      </div>

      {/* FILTER & TABLE SECTION */}
      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 w-full gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by refund number, invoice, or client..." 
                  className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-slate-950 border-2 font-bold">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">All Status</SelectItem>
                  <SelectItem value="pending" className="font-bold">Pending</SelectItem>
                  <SelectItem value="approved" className="font-bold">Approved</SelectItem>
                  <SelectItem value="processing" className="font-bold">Processing</SelectItem>
                  <SelectItem value="completed" className="font-bold">Completed</SelectItem>
                  <SelectItem value="rejected" className="font-bold">Rejected</SelectItem>
                  <SelectItem value="cancelled" className="font-bold">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] h-12 bg-white dark:bg-slate-950 border-2 font-bold">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-bold">All Types</SelectItem>
                  <SelectItem value="refund" className="font-bold">Refund</SelectItem>
                  <SelectItem value="return" className="font-bold">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {fetchError && (
            <div className="m-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <div className="flex-1">{fetchError}</div>
              <Button variant="outline" size="sm" className="font-bold border-2" onClick={fetchRefundReturns}>
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <RotateCcw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Refunds & Returns...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black">No Refunds/Returns Found</h3>
              <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                {searchQuery ? "Try adjusting your search or filters" : "Get started by creating your first return/refund request"}
              </p>
              <Button variant="link" className="mt-4 font-bold" onClick={() => { setSearchQuery(""); setFilterStatus("all"); setFilterType("all"); }}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Refund #</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Invoice #</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Type</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Client</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Reason</TableHead>
                    <TableHead className="text-center font-black text-foreground uppercase text-[10px] tracking-widest">Items</TableHead>
                    <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Amount</TableHead>
                    <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Refund</TableHead>
                    <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((rr) => (
                    <TableRow 
                      key={rr.id} 
                      className="group cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800"
                      onClick={() => openDetailModal(rr)}
                    >
                      <TableCell className="font-mono text-xs font-black text-foreground">{rr.refund_number}</TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">{rr.invoice_number}</TableCell>
                      <TableCell>
                        <Badge className={`text-[8px] uppercase font-black px-1.5 py-0 ${getTypeColor(rr.transaction_type)}`}>
                          {rr.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{rr.client_name || "Walk-in"}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-black ${getReasonCategoryColor(rr.reason_category)}`}>
                          {rr.reason_category.replace(/_/g, " ").toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold">{rr.total_items}</TableCell>
                      <TableCell className="text-right font-bold text-xs">
                        TZS {rr.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-xs text-emerald-600 dark:text-emerald-400 font-black">
                        TZS {rr.refund_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[8px] capitalize font-black px-1.5 py-0 ${getStatusColor(rr.status)}`}>
                          {rr.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* FOOTER & PAGINATION */}
          {!isLoading && totalPages > 1 && (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Showing <span className="text-foreground">{currentItems.length}</span> of {filteredData.length} Entries
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 border-2 font-bold"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>

                <div className="flex items-center gap-1.5 mx-2">
                  {getPageNumbers().map((page, i) => (
                    <Button
                      key={i}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={typeof page !== 'number'}
                      className={`h-9 w-9 text-xs font-black border-2 transition-all ${
                        currentPage === page ? 'shadow-md scale-105' : 'hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 border-2 font-bold"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FOOTER INFO */}
      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <ShieldCheck className="h-3 w-3" />
          Secure Transactions
        </div>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Clock className="h-3 w-3" />
          Real-time Processing
        </div>
      </div>

      {/* Detail Modal */}
      <RefundReturnDetailModal
        refundReturn={selectedRefundReturn}
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        onStatusChange={fetchRefundReturns}
      />
    </div>
  )
}