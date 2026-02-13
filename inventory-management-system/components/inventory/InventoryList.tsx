import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowUpCircle, ArrowDownCircle, History, Eye, Check, X, Edit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { inventory_base_url } from '@/lib/api-config'

interface InventoryItem {
  id: string
  store_id: string
  product_id: string
  sku: string
  product_name: string
  current_stock: number
  reorder_level: number
  buying_price: number
  selling_price: number
  is_low_stock: boolean
  unit_of_measure: string
  inventory_value: number
}

interface InventoryListProps {
  inventory: InventoryItem[]
  onStockIn: (item: InventoryItem) => void
  onStockOut: (item: InventoryItem) => void
  onAdjust: (item: InventoryItem) => void
  onViewHistory: (item: InventoryItem) => void
  onRefresh: () => void
}

export function InventoryList({
  inventory,
  onStockIn,
  onStockOut,
  onAdjust,
  onViewHistory,
  onRefresh
}: InventoryListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReasonModal, setShowReasonModal] = useState(false)
  const [reasonInput, setReasonInput] = useState('')
  const [pendingAdjustItem, setPendingAdjustItem] = useState<InventoryItem | null>(null)
  const [pendingEvent, setPendingEvent] = useState<any>(null)

  const getAuthToken = (): string | null => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  const handleViewDetails = (item: InventoryItem) => {
    router.push(`/dashboard/inventory/${item.product_id}?storeId=${item.store_id}`)
  }

  const startEditing = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(item.id)
    setEditValue(item.current_stock.toString())
  }

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(null)
    setEditValue('')
  }

  const handleStockAdjustment = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStock = parseInt(editValue)
    // Validation
    if (isNaN(newStock) || newStock < 0) {
      toast({
        title: "Invalid Stock",
        description: "Stock level must be a non-negative number",
        variant: "destructive"
      })
      return
    }
    if (newStock === item.current_stock) {
      setEditingId(null)
      return
    }
    setPendingAdjustItem(item)
    setPendingEvent(e)
    setShowReasonModal(true)
  }

  const submitStockAdjustment = async () => {
    if (!pendingAdjustItem) return
    const item = pendingAdjustItem
    const newStock = parseInt(editValue)
    const reason = reasonInput.trim() || 'ADJUSTMENT'
    try {
      setIsSubmitting(true)
      const token = getAuthToken()
      if (!token) throw new Error("No access token found")
      const response = await fetch(`${inventory_base_url}/inventory/adjust`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          store_id: item.store_id,
          product_id: item.product_id,
          new_stock: newStock,
          reason
        })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        const difference = newStock - item.current_stock
        toast({
          title: "Stock Adjusted",
          description: `${item.product_name}: ${difference > 0 ? '+' : ''}${difference} units`,
        })
        setEditingId(null)
        setEditValue('')
        onRefresh()
      } else {
        throw new Error(data.error || 'Failed to adjust stock')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
      setShowReasonModal(false)
      setReasonInput('')
      setPendingAdjustItem(null)
      setPendingEvent(null)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead className="text-right">Current Stock</TableHead>
            <TableHead className="text-right">Reorder Level</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => (
            <TableRow 
              key={item.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleViewDetails(item)}
            >
              <TableCell className="font-medium">{item.sku}</TableCell>
              <TableCell>{item.product_name}</TableCell>
              <TableCell className="text-right">
                {editingId === item.id ? (
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 h-8 text-right"
                      autoFocus
                      disabled={isSubmitting}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleStockAdjustment(item, e as any)
                        } else if (e.key === 'Escape') {
                          cancelEditing(e as any)
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => handleStockAdjustment(item, e)}
                      disabled={isSubmitting}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                          <Dialog open={showReasonModal} onOpenChange={(open) => { if (!open) setShowReasonModal(false) }}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Enter Reason for Adjustment</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <Input
                                  placeholder="Enter reason (optional)"
                                  value={reasonInput}
                                  onChange={e => setReasonInput(e.target.value)}
                                  disabled={isSubmitting}
                                  maxLength={100}
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button variant="outline" onClick={() => { setShowReasonModal(false); setReasonInput(''); }} disabled={isSubmitting}>Cancel</Button>
                                  <Button onClick={submitStockAdjustment} disabled={isSubmitting}>Submit</Button>
                                </div>
                                <div className="text-xs text-muted-foreground">You must fill a reason for Adjustment</div>
                              </div>
                            </DialogContent>
                          </Dialog>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={cancelEditing}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 group">
                    <span>
                      {item.current_stock} {item.unit_of_measure}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => startEditing(item, e)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">{item.reorder_level}</TableCell>
              <TableCell>
                {item.current_stock === 0 ? (
                  <Badge variant="destructive">Out of Stock</Badge>
                ) : item.is_low_stock ? (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    Low Stock
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    In Stock
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleViewDetails(item)
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onStockIn(item)
                    }}>
                      <ArrowUpCircle className="mr-2 h-4 w-4 text-green-600" />
                      Add Stock
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation()
                        onStockOut(item)
                      }}
                      disabled={item.current_stock === 0}
                    >
                      <ArrowDownCircle className="mr-2 h-4 w-4 text-red-600" />
                      Remove Stock
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      onViewHistory(item)
                    }}>
                      <History className="mr-2 h-4 w-4" />
                      View History
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}