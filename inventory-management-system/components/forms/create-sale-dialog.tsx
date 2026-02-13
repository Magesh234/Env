"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, Trash2, Loader2, AlertCircle, Calendar, Search, UserPlus, 
  Store as StoreIcon, ShoppingCart, Package, Percent, Receipt,
  CreditCard, DollarSign, TrendingUp, CheckCircle2, Info,
  Tag, Users, Sparkles
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AddClientDialog } from "@/components/forms/add-client-dialog"
import { inventory_base_url } from "@/lib/api-config"
import { useStore } from "@/lib/store-context"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

const API_BASE = inventory_base_url

interface Product {
  id: string
  sku: string
  product_name: string
  selling_price: number
  buying_price: number
}

interface Client {
  id: string
  client_name?: string
  first_name?: { String: string; Valid: boolean }
  last_name?: { String: string; Valid: boolean }
  business_name?: { String: string; Valid: boolean }
}

interface SaleItem {
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
}

interface CreateSaleDialogProps {
  onSaleCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateSaleDialog({ onSaleCreated, trigger }: CreateSaleDialogProps) {
  const { selectedStore, storeName } = useStore()

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    client_id: "",
    sale_type: "cash",
    payment_method: "cash",
    amount_paid: "",
    payment_term_days: "21",
  })

  const [items, setItems] = useState<SaleItem[]>([])
  const [currentItem, setCurrentItem] = useState({
    product_id: "",
    quantity: "1",
    discount_percentage: "0",
    unit_price: "",
  })

  const [productOpen, setProductOpen] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)

  const getToken = () => {
    return sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
  }

  useEffect(() => {
    if (open) {
      fetchProducts()
      fetchClients()
    }
  }, [open])

  const fetchProducts = async () => {
    if (!selectedStore) {
      setProducts([])
      return
    }
    try {
      const token = getToken()
      if (!token) throw new Error("No access token found.")
      const response = await fetch(`${API_BASE}/stores/${selectedStore}/products`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const result = await response.json()
      let productsData = []
      if (result.success && Array.isArray(result.data)) {
        productsData = result.data
      } else if (Array.isArray(result)) {
        productsData = result
      } else if (result.data && Array.isArray(result.data)) {
        productsData = result.data
      }
      setProducts(productsData)
    } catch (error) {
      console.error("Error fetching products:", error)
      setProducts([])
    }
  }

  const fetchClients = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${API_BASE}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (result.success) {
        setClients(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const getClientName = (client: Client) => {
    if (client.client_name) return client.client_name
    
    let name = ""
    if (client.first_name?.Valid) name = client.first_name.String
    if (client.last_name?.Valid) {
      name += (name ? " " : "") + client.last_name.String
    }
    if (client.business_name?.Valid) return client.business_name.String
    
    return name || "Unknown Client"
  }

  const handleProductChange = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product) {
      setCurrentItem({
        ...currentItem,
        product_id: productId,
        unit_price: product.selling_price.toString(),
      })
    }
    setProductOpen(false)
  }

  const addItem = () => {
    const product = products.find((p) => p.id === currentItem.product_id)
    if (!product) {
      toast({
        title: "Error",
        description: "Please select a product",
        variant: "destructive",
      })
      return
    }

    const quantity = parseInt(currentItem.quantity)
    const discountPercentage = parseFloat(currentItem.discount_percentage)
    const unitPrice = currentItem.unit_price ? parseFloat(currentItem.unit_price) : product.selling_price

    if (quantity <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      })
      return
    }

    if (unitPrice <= 0) {
      toast({
        title: "Error",
        description: "Unit price must be greater than 0",
        variant: "destructive",
      })
      return
    }

    const subtotal = unitPrice * quantity
    const discountAmount = (subtotal * discountPercentage) / 100
    const total = subtotal - discountAmount

    const newItem: SaleItem = {
      product_id: product.id,
      product_name: product.product_name,
      sku: product.sku,
      buying_price: product.buying_price,
      selling_price: product.selling_price,
      unit_price: unitPrice,
      quantity,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      subtotal,
      total,
    }

    setItems([...items, newItem])
    setCurrentItem({ product_id: "", quantity: "1", discount_percentage: "0", unit_price: "" })
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const subtotalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalDiscount = items.reduce((sum, item) => sum + item.discount_amount, 0)
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0)

  const getAmountPaid = () => {
    if (formData.sale_type === "cash") {
      return totalAmount
    } else if (formData.sale_type === "credit") {
      return 0
    } else if (formData.sale_type === "partial") {
      return parseFloat(formData.amount_paid) || 0
    }
    return 0
  }

  const amountPaid = getAmountPaid()
  const balanceDue = totalAmount - amountPaid

  const calculateDueDate = () => {
    const days = parseInt(formData.payment_term_days) || 21
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + days)
    return dueDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getPaymentTermDescription = () => {
    const days = parseInt(formData.payment_term_days) || 21
    const commonTerms: { [key: number]: string } = {
      7: "Net 7 (1 week)",
      14: "Net 14 (2 weeks)",
      21: "Net 21 (3 weeks)",
      30: "Net 30 (1 month)",
      60: "Net 60 (2 months)",
      90: "Net 90 (3 months)",
    }
    return commonTerms[days] || `${days} days`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStore) {
      toast({
        title: "No Store Selected",
        description: "Please select a store from the dashboard first",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one item",
        variant: "destructive",
      })
      return
    }

    if ((formData.sale_type === "credit" || formData.sale_type === "partial") && !formData.client_id) {
      toast({
        title: "Validation Error",
        description: "Credit and partial sales require a client to be selected",
        variant: "destructive",
      })
      return
    }

    if (formData.sale_type === "partial") {
      const partialAmount = parseFloat(formData.amount_paid)
      if (!formData.amount_paid || partialAmount <= 0) {
        toast({
          title: "Validation Error",
          description: "Please enter the amount paid for partial payment",
          variant: "destructive",
        })
        return
      }
      if (partialAmount >= totalAmount) {
        toast({
          title: "Validation Error",
          description: "Partial payment must be less than total amount. Use 'Cash' for full payment.",
          variant: "destructive",
        })
        return
      }
    }

    if (formData.sale_type === "credit" || formData.sale_type === "partial") {
      const paymentTermDays = parseInt(formData.payment_term_days)
      if (paymentTermDays <= 0 || paymentTermDays > 365) {
        toast({
          title: "Validation Error",
          description: "Payment term must be between 1 and 365 days",
          variant: "destructive",
        })
        return
      }
    }

    setIsLoading(true)

    try {
      const token = getToken()
      if (!token) {
        throw new Error("No authentication token found")
      }

      const payload = {
        sale: {
          store_id: selectedStore,
          client_id: formData.client_id || undefined,
          sale_type: formData.sale_type,
          subtotal: subtotalAmount,
          tax_amount: 0,
          discount_amount: totalDiscount,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          payment_method: {
            String: formData.payment_method,
            Valid: true,
          },
        },
        items: items,
        payment_term_days: (formData.sale_type === "credit" || formData.sale_type === "partial") 
          ? parseInt(formData.payment_term_days) 
          : undefined,
      }

      const response = await fetch(`${API_BASE}/sales`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create sale")
      }

      const result = await response.json()

      toast({
        title: "Sale Created",
        description: `Sale ${result.data.invoice_number} created successfully at ${storeName}. ${
          (formData.sale_type === "credit" || formData.sale_type === "partial") 
            ? `Payment due in ${formData.payment_term_days} days.` 
            : ''
        }`,
      })

      setFormData({
        client_id: "",
        sale_type: "cash",
        payment_method: "cash",
        amount_paid: "",
        payment_term_days: "21",
      })
      setItems([])
      setOpen(false)
      onSaleCreated?.()
    } catch (error) {
      console.error("Error creating sale:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create sale",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === currentItem.product_id)
  const selectedClient = clients.find((c) => c.id === formData.client_id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-11 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-hidden flex flex-col border-none shadow-2xl">
        {/* PREMIUM HEADER */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />
        
        <DialogHeader className="pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
              <ShoppingCart className="h-7 w-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black flex items-center gap-2">
                Create New Sale
                <Badge variant="secondary" className="text-[9px] bg-emerald-500/10 text-emerald-600 border-none font-black uppercase">
                  Invoice
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                Generate Transaction & Process Payment
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STORE INDICATOR */}
            <Alert className={`border-2 ${selectedStore ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20"}`}>
              <StoreIcon className={`h-5 w-5 ${selectedStore ? "text-emerald-600" : "text-orange-600"}`} />
              <AlertDescription>
                {selectedStore ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-900 dark:text-emerald-300">Target Location:</span>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black">
                      {storeName}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">(Global Selection)</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="font-black text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      No Store Selected
                    </span>
                    <span className="text-xs font-medium">Please select a store from dashboard before creating sales</span>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* SALE DETAILS SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Sale Configuration</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* CLIENT SELECTION */}
                <div className="space-y-3">
                  <Label htmlFor="client_id" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Customer {(formData.sale_type === "credit" || formData.sale_type === "partial") && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="flex gap-2">
                    <Popover open={clientOpen} onOpenChange={setClientOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={clientOpen}
                          className="flex-1 justify-between h-12 border-2 font-bold"
                        >
                          {selectedClient ? getClientName(selectedClient) : "Walk-in customer"}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0 border-2 shadow-xl">
                        <Command>
                          <CommandInput placeholder="Search clients..." className="h-12 font-medium" />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                              No client found.
                            </CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="walk-in"
                                onSelect={() => {
                                  setFormData({ ...formData, client_id: "" })
                                  setClientOpen(false)
                                }}
                                className="font-bold cursor-pointer"
                              >
                                <Users className="mr-2 h-4 w-4 text-slate-400" />
                                Walk-in customer
                              </CommandItem>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={getClientName(client)}
                                  onSelect={() => {
                                    setFormData({ ...formData, client_id: client.id })
                                    setClientOpen(false)
                                  }}
                                  className="font-bold cursor-pointer"
                                >
                                  <Users className="mr-2 h-4 w-4 text-primary" />
                                  {getClientName(client)}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <AddClientDialog
                      onClientAdded={fetchClients}
                      trigger={
                        <Button type="button" variant="outline" size="icon" title="Add new client" className="h-12 w-12 border-2">
                          <UserPlus className="h-5 w-5" />
                        </Button>
                      }
                    />
                  </div>
                </div>

                {/* SALE TYPE */}
                <div className="space-y-3">
                  <Label htmlFor="sale_type" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Sale Type <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.sale_type} 
                    onValueChange={(value) => setFormData({ ...formData, sale_type: value, amount_paid: "" })}
                  >
                    <SelectTrigger className="h-12 border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="font-bold">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Cash (Full Payment)
                        </div>
                      </SelectItem>
                      <SelectItem value="credit" className="font-bold">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          Credit (Pay Later)
                        </div>
                      </SelectItem>
                      <SelectItem value="partial" className="font-bold">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-blue-500" />
                          Partial Payment
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* PAYMENT METHOD */}
                <div className="space-y-3">
                  <Label htmlFor="payment_method" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger className="h-12 border-2 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash" className="font-bold">💵 Cash</SelectItem>
                      <SelectItem value="mobile_money" className="font-bold">📱 Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer" className="font-bold">🏦 Bank Transfer</SelectItem>
                      <SelectItem value="card" className="font-bold">💳 Card</SelectItem>
                      <SelectItem value="credit" className="font-bold">📝 Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* PAYMENT TERMS */}
                {(formData.sale_type === "credit" || formData.sale_type === "partial") && (
                  <div className="col-span-2 space-y-3">
                    <Label htmlFor="payment_term_days" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Payment Terms (Days) <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        value={["7", "14", "21", "30", "60", "90"].includes(formData.payment_term_days) ? formData.payment_term_days : ""}
                        onValueChange={(value) => setFormData({ ...formData, payment_term_days: value })}
                      >
                        <SelectTrigger className="h-12 border-2 font-bold">
                          <SelectValue placeholder="Select preset term" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7" className="font-bold">Net 7 (1 week)</SelectItem>
                          <SelectItem value="14" className="font-bold">Net 14 (2 weeks)</SelectItem>
                          <SelectItem value="21" className="font-bold">Net 21 (3 weeks)</SelectItem>
                          <SelectItem value="30" className="font-bold">Net 30 (1 month)</SelectItem>
                          <SelectItem value="60" className="font-bold">Net 60 (2 months)</SelectItem>
                          <SelectItem value="90" className="font-bold">Net 90 (3 months)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="payment_term_days"
                        type="number"
                        placeholder="Or enter custom days"
                        value={formData.payment_term_days}
                        onChange={(e) => setFormData({ ...formData, payment_term_days: e.target.value })}
                        min="1"
                        max="365"
                        className="h-12 border-2 font-bold"
                      />
                    </div>
                    <Alert className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <AlertDescription className="font-bold text-blue-900 dark:text-blue-300">
                        Payment due by: <span className="text-blue-700 dark:text-blue-400">{calculateDueDate()}</span>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* PARTIAL PAYMENT AMOUNT */}
                {formData.sale_type === "partial" && (
                  <div className="col-span-2 space-y-3">
                    <Label htmlFor="amount_paid" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Amount Paid Now <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount_paid"
                      type="number"
                      placeholder="Enter amount being paid now"
                      value={formData.amount_paid}
                      onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                      min="0"
                      step="0.01"
                      max={totalAmount.toString()}
                      className="h-12 border-2 font-bold text-base"
                    />
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="font-bold">
                        Total: TZS {totalAmount.toLocaleString()}
                      </Badge>
                      {formData.amount_paid && parseFloat(formData.amount_paid) > 0 && (
                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800 font-bold">
                          Balance: TZS {(totalAmount - parseFloat(formData.amount_paid)).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PAYMENT INFO ALERT */}
              {(formData.sale_type === "credit" || formData.sale_type === "partial") && (
                <Alert className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <Info className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="font-bold text-amber-900 dark:text-amber-300">
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong className="text-amber-800 dark:text-amber-200">
                          {formData.sale_type === "credit" ? "Credit Sale:" : "Partial Payment:"}
                        </strong>{" "}
                        {formData.sale_type === "credit" 
                          ? "Full payment deferred. A debt record will be created."
                          : "Customer pays part now, remainder later. Balance will be tracked as debt."}
                      </div>
                      <Separator className="bg-amber-200 dark:bg-amber-800" />
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Payment Terms: <span className="font-black">{getPaymentTermDescription()}</span></div>
                        <div>Due Date: <span className="font-black">{calculateDueDate()}</span></div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* ITEMS SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Invoice Line Items</h3>
                {items.length > 0 && (
                  <Badge className="bg-purple-500/10 text-purple-600 border-none font-black">
                    {items.length} {items.length === 1 ? "Item" : "Items"}
                  </Badge>
                )}
              </div>

              {/* ADD ITEM FORM */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <Popover open={productOpen} onOpenChange={setProductOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={productOpen}
                        className="w-full justify-between h-12 border-2 font-bold"
                      >
                        {selectedProduct ? (
                          <span className="truncate">
                            {selectedProduct.product_name} - TZS {selectedProduct.selling_price.toLocaleString()}
                          </span>
                        ) : (
                          "Select product"
                        )}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0 border-2 shadow-xl">
                      <Command>
                        <CommandInput placeholder="Search products..." className="h-12 font-medium" />
                        <CommandList>
                          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            No product found.
                          </CommandEmpty>
                          <CommandGroup>
                            {products.map((product) => (
                              <CommandItem
                                key={product.id}
                                value={`${product.product_name} ${product.sku}`}
                                onSelect={() => handleProductChange(product.id)}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                                    <Package className="h-4 w-4 text-slate-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-black text-sm truncate">{product.product_name}</div>
                                    <div className="text-xs text-muted-foreground font-medium">
                                      SKU: {product.sku} • TZS {product.selling_price.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Unit Price"
                    value={currentItem.unit_price}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit_price: e.target.value })}
                    min="0"
                    step="0.01"
                    readOnly
                    className="h-12 border-2 bg-slate-100 dark:bg-slate-900 font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                    min="1"
                    className="h-12 border-2 font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Discount %"
                    value={currentItem.discount_percentage}
                    onChange={(e) => setCurrentItem({ ...currentItem, discount_percentage: e.target.value })}
                    min="0"
                    max="100"
                    step="0.1"
                    className="h-12 border-2 font-bold"
                  />
                </div>
                <div className="col-span-1">
                  <Button 
                    type="button" 
                    onClick={addItem} 
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* ITEMS TABLE */}
              {items.length > 0 && (
                <div className="border-2 border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-100 dark:bg-slate-900">
                        <TableRow className="hover:bg-transparent border-b-2">
                          <TableHead className="font-black uppercase text-[10px] tracking-widest">Product</TableHead>
                          <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Qty</TableHead>
                          <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Price</TableHead>
                          <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Discount</TableHead>
                          <TableHead className="text-right font-black uppercase text-[10px] tracking-widest">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-black text-sm">{item.product_name}</div>
                                <div className="text-xs text-muted-foreground font-mono font-bold">{item.sku}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-black">{item.quantity}</TableCell>
                            <TableCell className="text-right font-bold">TZS {item.unit_price.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {item.discount_percentage > 0 ? (
                                <div className="space-y-0.5">
                                  <div className="text-red-600 font-black text-xs">-{item.discount_percentage}%</div>
                                  <div className="text-xs text-muted-foreground font-bold">TZS {item.discount_amount.toLocaleString()}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-black text-base">TZS {item.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeItem(index)}
                                className="hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* SUMMARY SECTION */}
                  <div className="p-6 bg-slate-950 text-white space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Subtotal:</span>
                      <span className="font-black">TZS {subtotalAmount.toLocaleString()}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400 font-bold uppercase tracking-wider">Total Discount:</span>
                        <span className="font-black text-red-400">-TZS {totalDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <Separator className="bg-slate-700" />
                    <div className="flex justify-between text-2xl pt-2">
                      <span className="font-black uppercase tracking-wider">Total:</span>
                      <span className="font-black text-emerald-400">TZS {totalAmount.toLocaleString()}</span>
                    </div>
                    {(formData.sale_type === "partial" || formData.sale_type === "credit") && (
                      <>
                        <Separator className="bg-slate-700" />
                        <div className="flex justify-between text-sm">
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">Paid Now:</span>
                          <span className="font-black text-emerald-400">TZS {amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="text-orange-400 font-bold uppercase tracking-wider">Balance Due ({getPaymentTermDescription()}):</span>
                          <span className="font-black text-orange-400">TZS {balanceDue.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 pt-6 border-t-2 border-slate-200 dark:border-slate-800">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                disabled={isLoading}
                className="h-12 px-6 font-bold border-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={items.length === 0 || isLoading || !selectedStore}
                className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-bold shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Sale...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Create Sale Invoice
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}