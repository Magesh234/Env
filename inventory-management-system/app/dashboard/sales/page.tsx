"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, FileText, Loader2, CheckCircle2, FileDown, ChevronLeft, ChevronRight, X, Printer, AlertCircle, Store, AlertTriangle, ShieldAlert, TrendingUp, DollarSign, Clock, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreateSaleDialog } from "@/components/forms/create-sale-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useStore } from "@/lib/store-context"
import { printThermalReceipt } from '@/components/thermal-receipt-printer'
import { auth_base_url } from "@/lib/api-config"

import { inventory_base_url } from "@/lib/api-config"
const API_BASE = inventory_base_url
const API_AUTH = auth_base_url
const SALES_ENDPOINT = `${API_BASE}/sales`
const ITEMS_PER_PAGE = 10
const AUTO_CONFIRM_THRESHOLD = 2

interface Sale {
  id: string
  invoice_number: string
  store_id: string
  client_name: string
  sale_type: string
  payment_status: string
  invoice_status: string
  total_amount: number
  amount_paid: number
  balance_due: number
  invoice_date: string
  payment_method?: { String: string; Valid: boolean }
  created_at: string
}

interface SaleItem {
  id: string
  sale_id: string
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
  profit_amount: number
}

interface User {
  id: string
  email: string
  first_name: string
  last_name?: string
  middle_name?: string
  phone?: string
  primary_role: string
}

interface BusinessProfile {
  business_name: string
  business_type: string
}

// Auto-Confirm Warning Modal Component
function AutoConfirmWarningModal({ 
  isOpen, 
  onClose, 
  draftCount 
}: { 
  isOpen: boolean
  onClose: () => void
  draftCount: number
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Auto-Confirm Disabled</h2>
                <p className="text-sm text-white/90 mt-1">Rate limit protection active</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Too Many Unconfirmed Sales
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You have <strong className="font-bold">{draftCount} draft sales</strong> waiting for confirmation. 
                  Auto-confirmation has been disabled to prevent rate limiting issues.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">What this means:</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Sales must be confirmed manually to avoid API rate limits</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Click the "Confirm" button on each sale individually</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Auto-confirmation resumes when you have 2 or fewer drafts</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              <strong className="text-gray-900 dark:text-gray-100">💡 Tip:</strong> To avoid this in the future, 
              confirm sales as you create them or in small batches. This helps maintain system performance 
              and prevents authentication rate limits.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold"
          >
            Got it, I'll confirm manually
          </Button>
        </div>
      </div>
    </div>
  )
}

// Sale Detail Modal Component
function SaleDetailModal({ 
  sale, 
  isOpen, 
  onClose,
  businessProfile,
  userProfile
}: { 
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
  businessProfile: BusinessProfile | null
  userProfile: User | null
}) {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const fetchSaleItems = async () => {
    if (!sale) return
    
    setLoadingItems(true)
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${SALES_ENDPOINT}/${sale.id}/items`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          setSaleItems(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching sale items:", error)
    } finally {
      setLoadingItems(false)
    }
  }

  useEffect(() => {
    if (isOpen && sale) {
      fetchSaleItems()
    }
  }, [isOpen, sale])

  if (!isOpen || !sale) return null

  // THERMAL RECEIPT PRINT HANDLER
  const handlePrintThermalReceipt = () => {
    if (!sale || saleItems.length === 0) {
      alert('Please wait for sale details to load')
      return
    }

    // Get served by info
    let servedBy = "Staff"
    if (userProfile) {
      servedBy = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.email
    }

    // Prepare data for thermal receipt
    const receiptData = {
      // Business info from API
      businessName: businessProfile?.business_name || "RETAIL STORE",
      businessPhone: userProfile?.phone || "",
      businessEmail: userProfile?.email || "",
      
      // Sale info
      invoice_number: sale.invoice_number,
      invoice_date: sale.invoice_date,
      client_name: sale.client_name,
      payment_method: sale.payment_method,
      
      // Financial
      total_amount: sale.total_amount,
      amount_paid: sale.amount_paid,
      balance_due: sale.balance_due,
      
      // Items
      items: saleItems.map(item => ({
        product_name: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        total: item.total
      })),
      
      // Additional info
      served_by: servedBy
    }

    // Print thermal receipt (80mm is standard)
    printThermalReceipt(receiptData, '80mm')
  }

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow pop-ups to print PDF')
      return
    }

    const invoiceDate = new Date(sale.invoice_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${sale.invoice_number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              background-color: #f5f5f5;
              color: #333;
            }
            .invoice-container {
              background-color: white;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #3b82f6;
            }
            .company-info h1 {
              font-size: 28px;
              color: #3b82f6;
              margin-bottom: 5px;
            }
            .company-info p {
              font-size: 12px;
              color: #666;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details div {
              margin-bottom: 8px;
              font-size: 13px;
            }
            .invoice-details strong {
              color: #333;
            }
            .section-title {
              font-size: 12px;
              font-weight: 600;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            .client-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-bottom: 40px;
              padding: 20px;
              background-color: #f9fafb;
              border-radius: 6px;
            }
            .info-block {
              font-size: 13px;
            }
            .info-block strong {
              display: block;
              font-size: 14px;
              margin-bottom: 5px;
              color: #333;
            }
            .info-block p {
              color: #666;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th {
              background-color: #3b82f6;
              color: white;
              padding: 12px 10px;
              text-align: left;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin: 30px 0 20px;
            }
            .summary-box {
              width: 350px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            .summary-row.total {
              border-bottom: 2px solid #333;
              border-top: 2px solid #333;
              font-weight: 700;
              font-size: 15px;
              color: #3b82f6;
              padding: 15px 0;
            }
            .summary-row strong {
              font-weight: 600;
            }
            .badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
              text-transform: capitalize;
            }
            .badge-paid {
              background-color: #dcfce7;
              color: #166534;
            }
            .badge-partial {
              background-color: #fef3c7;
              color: #92400e;
            }
            .badge-unpaid {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .badge-confirmed {
              background-color: #dcfce7;
              color: #166534;
            }
            .badge-draft {
              background-color: #f3f4f6;
              color: #6b7280;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #999;
            }
            .items-table {
              margin-top: 30px;
              margin-bottom: 30px;
            }
            @media print {
              body {
                padding: 0;
                background-color: white;
              }
              .invoice-container {
                box-shadow: none;
                max-width: 100%;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="company-info">
                <h1>INVOICE</h1>
                <p>${businessProfile?.business_name || 'Sales Management System'}</p>
              </div>
              <div class="invoice-details">
                <div><strong>Invoice #:</strong> ${sale.invoice_number}</div>
                <div><strong>Date:</strong> ${invoiceDate}</div>
              </div>
            </div>

            <div class="client-info">
              <div class="info-block">
                <strong>Bill To:</strong>
                <p>${sale.client_name}</p>
              </div>
              <div class="info-block">
                <strong>Sale Details:</strong>
                <p><strong>Type:</strong> ${sale.sale_type}</p>
                <p><strong>Payment Method:</strong> ${sale.payment_method?.String ? sale.payment_method.String.replace(/_/g, ' ') : 'Cash'}</p>
              </div>
            </div>

            <div class="items-table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Discount</th>
                    <th class="text-right">Total (TZS)</th>
                  </tr>
                </thead>
                <tbody>
                  ${saleItems.map(item => `
                    <tr>
                      <td>${item.product_name}</td>
                      <td>${item.sku}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right">${item.unit_price.toLocaleString()}</td>
                      <td class="text-right">${item.discount_amount > 0 ? item.discount_amount.toLocaleString() : '-'}</td>
                      <td class="text-right">${item.total.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="summary-section">
              <div class="summary-box">
                <div class="summary-row">
                  <strong>Subtotal:</strong>
                  <span>TZS ${sale.total_amount.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                  <strong>Amount Paid:</strong>
                  <span>TZS ${sale.amount_paid.toLocaleString()}</span>
                </div>
                <div class="summary-row total">
                  <strong>Balance Due:</strong>
                  <span>TZS ${sale.balance_due.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
              <div style="padding: 15px; background-color: #f9fafb; border-radius: 6px;">
                <div class="section-title">Payment Status</div>
                <div class="badge badge-${sale.payment_status === 'paid' ? 'paid' : sale.payment_status === 'partial' ? 'partial' : 'unpaid'}">
                  ${sale.payment_status}
                </div>
              </div>
              <div style="padding: 15px; background-color: #f9fafb; border-radius: 6px;">
                <div class="section-title">Invoice Status</div>
                <div class="badge badge-${sale.invoice_status === 'confirmed' ? 'confirmed' : sale.invoice_status === 'draft' ? 'draft' : 'unpaid'}">
                  ${sale.invoice_status}
                </div>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p style="margin-top: 10px;">This invoice was generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin-top: 5px; font-size: 10px; color: #ccc;">Press Ctrl+P (Cmd+P on Mac) to print or save as PDF</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-slate-200 dark:border-slate-800">
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 px-6 py-4 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Invoice Details</h2>
            <p className="text-sm text-muted-foreground mt-1 font-bold">Invoice #{sale.invoice_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Invoice Number</label>
              <p className="text-lg font-mono font-black text-foreground">{sale.invoice_number}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Invoice Date</label>
              <p className="text-lg font-bold text-foreground">
                {new Date(sale.invoice_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Client Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground font-bold">Client Name:</span>
                <span className="text-sm font-black text-foreground">{sale.client_name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Sale Information</h3>
            <div className="space-y-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground font-bold">Sale Type:</span>
                <span className="text-sm font-black text-foreground capitalize">{sale.sale_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground font-bold">Payment Method:</span>
                <span className="text-sm font-black text-foreground capitalize">
                  {sale.payment_method?.String ? sale.payment_method.String.replace(/_/g, ' ') : 'Cash'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Items Sold</h3>
            {loadingItems ? (
              <div className="text-center py-8">
                <div className="relative inline-block">
                  <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mt-3 font-bold">Loading items...</p>
              </div>
            ) : saleItems.length > 0 ? (
              <div className="border-2 border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900">
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">Item</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest">SKU</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Qty</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Unit Price</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Discount</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleItems.map((item) => (
                      <TableRow key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                        <TableCell className="text-sm font-black text-foreground">{item.product_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono font-bold">{item.sku}</TableCell>
                        <TableCell className="text-sm text-center font-black">{item.quantity}</TableCell>
                        <TableCell className="text-sm text-right font-bold">TZS {item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-right font-bold">
                          {item.discount_amount > 0 ? `TZS ${item.discount_amount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-right font-black text-emerald-600 dark:text-emerald-400">TZS {item.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-bold">No items found</p>
              </div>
            )}
          </div>

          <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Financial Summary</h3>
            <div className="space-y-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-slate-300 dark:border-slate-700">
                <span className="text-sm text-muted-foreground font-bold">Total Amount:</span>
                <span className="text-lg font-black text-foreground">TZS {sale.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-300 dark:border-slate-700">
                <span className="text-sm text-muted-foreground font-bold">Amount Paid:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">TZS {sale.amount_paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 bg-white dark:bg-slate-950 rounded-lg p-3 border-2 border-slate-200 dark:border-slate-700">
                <span className="text-sm font-black text-foreground">Balance Due:</span>
                <span className="text-lg font-black text-red-600 dark:text-red-400">TZS {sale.balance_due.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Payment Status</label>
              <Badge
                variant={
                  sale.payment_status === 'paid'
                    ? 'default'
                    : sale.payment_status === 'partial'
                      ? 'secondary'
                      : 'destructive'
                }
                className="text-xs py-1.5 px-3 w-fit font-black uppercase"
              >
                {sale.payment_status}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Invoice Status</label>
              <Badge
                variant={
                  sale.invoice_status === 'confirmed' ? 'default' : sale.invoice_status === 'draft' ? 'secondary' : 'destructive'
                }
                className="text-xs py-1.5 px-3 w-fit font-black uppercase"
              >
                {sale.invoice_status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-800 px-6 py-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} className="font-bold border-2">
            Close
          </Button>
          
          <Button 
            onClick={handlePrintThermalReceipt} 
            className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700" 
            disabled={loadingItems}
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          
          <Button 
            onClick={handlePrintPDF} 
            variant="outline"
            className="gap-2 font-bold border-2" 
            disabled={loadingItems}
          >
            <FileDown className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const { selectedStore, storeName } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false)
  const [draftSalesCount, setDraftSalesCount] = useState(0)
  const [userRole, setUserRole] = useState<string>("")
  const [shouldFetch, setShouldFetch] = useState(false)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const { toast } = useToast()

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  // Fetch business profile
  const fetchBusinessProfile = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${API_AUTH}/business/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setBusinessProfile({
            business_name: result.data.business_name,
            business_type: result.data.business_type
          })
        }
      }
    } catch (error) {
      console.error("Error fetching business profile:", error)
    }
  }

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${API_AUTH}/users/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setUserProfile(result.data)
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  // Get user role and fetch profiles on mount
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user: User = JSON.parse(userData)
      setUserRole(user.primary_role)
      
      if (user.primary_role !== "staff") {
        setShouldFetch(true)
      }
    }

    // Fetch business and user profiles for receipts
    fetchBusinessProfile()
    fetchUserProfile()
  }, [])

  const fetchSales = async () => {
    if (!selectedStore) {
      setIsLoading(false)
      setSales([])
      return
    }

    setIsLoading(true)
    setFetchError(null)

    try {
      const token = getToken()
      if (!token) {
        setFetchError("Authentication error: No access token found. Please log in.")
        return
      }

      const fetchUrl = `${API_BASE}/stores/${selectedStore}/sales`

      const response = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch sales: ${errorBody.error || response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const salesData = Array.isArray(result.data) ? result.data : result.data.sales || []
        setSales(salesData)
        
        // AUTO-CONFIRM DRAFT SALES
        const draftSales = salesData.filter((sale: Sale) => sale.invoice_status === 'draft')
        
        if (draftSales.length > 0) {
          if (draftSales.length <= AUTO_CONFIRM_THRESHOLD) {
            await autoConfirmDraftSales(draftSales)
          } else {
            setDraftSalesCount(draftSales.length)
            setIsWarningModalOpen(true)
            toast({
              title: "Auto-Confirm Disabled",
              description: `${draftSales.length} draft sales found. Please confirm manually to avoid rate limits.`,
              variant: "destructive",
            })
          }
        }
      } else {
        setSales([])
      }
    } catch (error) {
      console.error("Error fetching sales:", error)
      setFetchError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const autoConfirmDraftSales = async (draftSales: Sale[]) => {
    const token = getToken()
    if (!token) return

    for (const sale of draftSales) {
      try {
        const response = await fetch(`${SALES_ENDPOINT}/${sale.id}/confirm`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          toast({
            title: "Sale Auto-Confirmed",
            description: `Invoice ${sale.invoice_number} confirmed automatically`,
          })
        }
      } catch (error) {
        console.error(`Error auto-confirming sale ${sale.id}:`, error)
      }
    }

    setTimeout(() => fetchSales(), 1000)
  }

  const confirmSale = async (saleId: string) => {
    setConfirmingId(saleId)
    try {
      const token = getToken()
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`${SALES_ENDPOINT}/${saleId}/confirm`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || "Failed to confirm sale")
      }

      const result = await response.json()

      toast({
        title: "Sale Confirmed",
        description: result.message || "Sale has been confirmed and inventory updated",
      })

      if (userRole === "staff") {
        setTimeout(() => {
          setSales([])
          setShouldFetch(false)
          toast({
            title: "Sales Cleared",
            description: "Your confirmed sale has been processed successfully",
          })
        }, 10000)
      } else {
        await fetchSales()
      }
    } catch (error) {
      console.error("Error confirming sale:", error)
      toast({
        title: "Confirmation Failed",
        description: error instanceof Error ? error.message : "Failed to confirm sale",
        variant: "destructive",
      })
    } finally {
      setConfirmingId(null)
    }
  }

  const openSaleModal = (sale: Sale) => {
    setSelectedSale(sale)
    setIsModalOpen(true)
  }

  const closeSaleModal = () => {
    setIsModalOpen(false)
    setSelectedSale(null)
  }

  const handleSaleCreated = async () => {
    if (userRole === "staff") {
      setShouldFetch(true)
      await fetchSales()
    } else {
      await fetchSales()
    }
  }

  useEffect(() => {
    if (shouldFetch) {
      fetchSales()
    }
  }, [shouldFetch])

  useEffect(() => {
    if (selectedStore) {
      fetchSales()
    }
  }, [selectedStore])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredSales = sales.filter(
    (sale) =>
      sale.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.client_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentSales = filteredSales.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "default"
      case "partial":
        return "secondary"
      case "unpaid":
      case "overdue":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "draft":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getPaymentMethodDisplay = (paymentMethod?: { String: string; Valid: boolean }) => {
    if (paymentMethod?.Valid && paymentMethod.String) {
      return paymentMethod.String.replace(/_/g, " ")
    }
    return "cash"
  }

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF')
      return
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
    const totalPaidAmount = filteredSales.reduce((sum, sale) => sum + sale.amount_paid, 0)
    const totalBalanceDue = filteredSales.reduce((sum, sale) => sum + sale.balance_due, 0)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales & Invoices Report - ${currentDate}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px solid #333;
            }
            .header h1 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            .header p {
              font-size: 12px;
              color: #666;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f9fafb;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-label {
              font-size: 10px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 16px;
              font-weight: 600;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
            }
            th {
              background-color: #f3f4f6;
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #ddd;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .text-right {
              text-align: right;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              font-weight: 500;
            }
            .badge-paid {
              background-color: #dcfce7;
              color: #166534;
            }
            .badge-partial {
              background-color: #fef3c7;
              color: #92400e;
            }
            .badge-unpaid {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .badge-confirmed {
              background-color: #dcfce7;
              color: #166534;
            }
            .badge-draft {
              background-color: #f3f4f6;
              color: #6b7280;
            }
            .badge-cancelled {
              background-color: #fee2e2;
              color: #991b1b;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            @media print {
              body {
                padding: 10px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales & Invoices Report</h1>
            <p>Generated on ${currentDate}</p>
            <p>Total Records: ${filteredSales.length}</p>
          </div>

          <div class="summary">
            <div class="summary-item">
              <div class="summary-label">Total Sales</div>
              <div class="summary-value">TZS ${totalSalesAmount.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Paid</div>
              <div class="summary-value">TZS ${totalPaidAmount.toLocaleString()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Balance Due</div>
              <div class="summary-value">TZS ${totalBalanceDue.toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Client</th>
                <th>Payment Method</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Paid</th>
                <th class="text-right">Balance</th>
                <th>Payment Status</th>
                <th>Invoice Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => {
        const paymentStatusClass = sale.payment_status === 'paid' ? 'badge-paid' :
          sale.payment_status === 'partial' ? 'badge-partial' : 'badge-unpaid';
        const invoiceStatusClass = sale.invoice_status === 'confirmed' ? 'badge-confirmed' :
          sale.invoice_status === 'draft' ? 'badge-draft' : 'badge-cancelled';

        return `
                  <tr>
                    <td>${sale.invoice_number}</td>
                    <td>${new Date(sale.invoice_date).toLocaleDateString()}</td>
                    <td>${sale.client_name}</td>
                    <td class="capitalize">${getPaymentMethodDisplay(sale.payment_method)}</td>
                    <td class="text-right">TZS ${sale.total_amount.toLocaleString()}</td>
                    <td class="text-right">TZS ${sale.amount_paid.toLocaleString()}</td>
                    <td class="text-right">TZS ${sale.balance_due.toLocaleString()}</td>
                    <td>
                      <span class="badge ${paymentStatusClass}">
                        ${sale.payment_status}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${invoiceStatusClass}">
                        ${sale.invoice_status}
                      </span>
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>This report was generated automatically from the sales management system.</p>
            <p style="margin-top: 20px;" class="no-print">Press Ctrl+P (Cmd+P on Mac) to print or save as PDF</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

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

  const StaffEmptyState = () => (
    <div className="text-center py-16">
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 border-2 border-blue-200 dark:border-blue-800">
        <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-xl font-black mb-2 text-foreground tracking-tight">Ready to Make a Sale</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto font-medium">
        Create a new sale to get started. Your sales will appear here temporarily for confirmation.
      </p>
      <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="text-sm font-black text-amber-900 dark:text-amber-100 mb-1">Staff Access Notice</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Sales will only be visible when you create them and will disappear after confirmation. 
              This ensures data security and role-based access control.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
  
  if (!selectedStore) {
    return (
      <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Sales & Invoices</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">Manage sales transactions</p>
          </div>
        </div>
        <Card className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-full shadow-lg mb-6 border-2 border-slate-200 dark:border-slate-800">
              <Store className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-foreground">No Store Active</h3>
            <p className="text-muted-foreground max-w-sm font-medium">Please select a store from the header to view sales.</p>
          </div>
        </Card>
      </div>
    )
  }

  const totalSalesAmount = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalPaidAmount = filteredSales.reduce((sum, sale) => sum + sale.amount_paid, 0)
  const totalBalanceDue = filteredSales.reduce((sum, sale) => sum + sale.balance_due, 0)

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            Sales & Invoices
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              Live
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
            {userRole === "staff" 
              ? "Create and confirm your sales transactions" 
              : <>Managing transactions for <span className="font-black text-foreground underline underline-offset-4 decoration-primary">{storeName}</span></>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userRole !== "staff" && sales.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="h-10 font-bold border-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <FileDown className="mr-2 h-4 w-4 text-emerald-500" />
              Export PDF
            </Button>
          )}
          <CreateSaleDialog onSaleCreated={handleSaleCreated} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-20 w-20" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total Sales</p>
            </div>
            <div className="text-3xl font-black tracking-tighter">
              <span className="text-lg font-normal text-slate-500 mr-2">TZS</span>
              {totalSalesAmount.toLocaleString()}
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500">GROSS REVENUE</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">All Sales</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 group hover:border-green-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-500/10 p-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-[10px] font-black text-green-600/60 dark:text-green-400 uppercase tracking-[2px]">Total Paid</p>
            </div>
            <div className="text-4xl font-black text-green-700 dark:text-green-500 tracking-tighter">
              <span className="text-lg font-normal opacity-60 mr-2">TZS</span>
              {totalPaidAmount.toLocaleString()}
            </div>
            <div className="mt-4">
              <div className="w-full bg-green-200 dark:bg-green-900/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-green-600 h-full transition-all duration-1000" 
                  style={{ width: `${totalSalesAmount > 0 ? (totalPaidAmount / totalSalesAmount) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[9px] mt-2 font-bold text-green-600/80 uppercase tracking-widest">Collected Amount</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 group hover:border-red-500 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-[10px] font-black text-red-600/60 dark:text-red-400 uppercase tracking-[2px]">Balance Due</p>
            </div>
            <div className="text-4xl font-black text-red-700 dark:text-red-500 tracking-tighter">
              <span className="text-lg font-normal opacity-60 mr-2">TZS</span>
              {totalBalanceDue.toLocaleString()}
            </div>
            <div className="mt-4">
              <div className="w-full bg-red-200 dark:bg-red-900/40 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-red-600 h-full transition-all duration-1000" 
                  style={{ width: `${totalSalesAmount > 0 ? (totalBalanceDue / totalSalesAmount) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[9px] mt-2 font-bold text-red-600/80 uppercase tracking-widest">Outstanding Payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
        <div className="border-b-2 border-slate-100 dark:border-slate-800 p-6">
          <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by invoice number or client name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 focus-visible:ring-primary font-medium"
              />
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {fetchError && (
            <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 m-6 rounded-lg text-sm font-bold flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <span>{fetchError}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-bold border-2"
                onClick={fetchSales}
              >
                Retry
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Sales Data...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            userRole === "staff" ? (
              <StaffEmptyState />
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-6 border-2 border-slate-200 dark:border-slate-700">
                  <Search className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-black text-foreground">No Sales Found</h3>
                <p className="text-muted-foreground max-w-xs mt-2 font-medium">
                  {searchQuery ? "Try adjusting your search query" : "Get started by creating your first sale"}
                </p>
                {searchQuery && (
                  <Button variant="link" className="mt-4 font-bold" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            )
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                    <TableRow className="hover:bg-transparent border-b-2">
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Invoice #</TableHead>
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Date</TableHead>
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Client</TableHead>
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Payment Method</TableHead>
                      <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Amount</TableHead>
                      <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Paid</TableHead>
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Payment</TableHead>
                      <TableHead className="font-black text-foreground uppercase text-[10px] tracking-widest">Status</TableHead>
                      <TableHead className="text-right font-black text-foreground uppercase text-[10px] tracking-widest">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentSales.map((sale) => (
                      <TableRow 
                        key={sale.id} 
                        className="group cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800"
                        onClick={() => openSaleModal(sale)}
                      >
                        <TableCell className="font-mono text-xs font-black text-foreground">{sale.invoice_number}</TableCell>
                        <TableCell className="text-xs font-bold text-muted-foreground">{new Date(sale.invoice_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs font-black text-foreground">{sale.client_name}</TableCell>
                        <TableCell className="capitalize text-xs font-bold text-muted-foreground">
                          {getPaymentMethodDisplay(sale.payment_method)}
                        </TableCell>
                        <TableCell className="text-right font-black text-xs text-foreground">
                          TZS {sale.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          TZS {sale.amount_paid.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getPaymentStatusColor(sale.payment_status)} 
                            className="text-[8px] uppercase font-black px-1.5 py-0.5 border-none"
                          >
                            {sale.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getInvoiceStatusColor(sale.invoice_status)} 
                            className="text-[8px] uppercase font-black px-1.5 py-0.5 border-none"
                          >
                            {sale.invoice_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            {sale.invoice_status === "draft" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  confirmSale(sale.id)
                                }}
                                disabled={confirmingId === sale.id}
                                className="h-7 text-xs px-2 font-bold border-2"
                              >
                                {confirmingId === sale.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Confirm
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openSaleModal(sale)
                              }}
                              className="h-7 text-xs px-2 font-bold"
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                    Showing <span className="text-foreground">{currentSales.length}</span> of {filteredSales.length} Entries
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-9 border-2 font-bold"
                      onClick={goToPreviousPage}
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
                          onClick={() => typeof page === 'number' && goToPage(page)}
                          disabled={typeof page !== 'number'}
                          className={`h-9 w-9 text-xs font-black border-2 transition-all ${
                            currentPage === page ? 'shadow-md scale-105' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
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
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <ShieldCheck className="h-3 w-3" />
          Secure Transactions
        </div>
        <div className="h-1 w-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <Clock className="h-3 w-3" />
          Real-time Updates
        </div>
      </div>

      <SaleDetailModal 
        sale={selectedSale} 
        isOpen={isModalOpen} 
        onClose={closeSaleModal}
        businessProfile={businessProfile}
        userProfile={userProfile}
      />
      <AutoConfirmWarningModal 
        isOpen={isWarningModalOpen} 
        onClose={() => setIsWarningModalOpen(false)}
        draftCount={draftSalesCount}
      />
    </div>
  )
}