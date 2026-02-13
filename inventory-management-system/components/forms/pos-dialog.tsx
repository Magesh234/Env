"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Trash2, Plus, Minus, ShoppingCart } from "lucide-react"

interface POSDialogProps {
  storeId: string
  storeName: string
  inventory: any[]
}

interface CartItem {
  id: string
  product_name: string
  sku: string
  price: number
  quantity: number
  available_stock: number
}

export function POSDialog({ storeId, storeName, inventory }: POSDialogProps) {
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [customerName, setCustomerName] = useState<string>("")

  const addToCart = (productId: string) => {
    const product = inventory.find((p) => p.id === productId)
    if (!product) return

    const existingItem = cart.find((item) => item.id === productId)
    if (existingItem) {
      if (existingItem.quantity < existingItem.available_stock) {
        setCart(cart.map((item) => (item.id === productId ? { ...item, quantity: item.quantity + 1 } : item)))
      }
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          product_name: product.product_name,
          sku: product.sku,
          price: product.selling_price,
          quantity: 1,
          available_stock: product.current_stock,
        },
      ])
    }
    setSelectedProduct("")
  }

  const updateQuantity = (productId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + change
            if (newQuantity <= 0) return null
            if (newQuantity > item.available_stock) return item
            return { ...item, quantity: newQuantity }
          }
          return item
        })
        .filter(Boolean) as CartItem[],
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.18
  const total = subtotal + tax

  const handleCheckout = () => {
    console.log("[v0] Processing sale:", {
      storeId,
      cart,
      paymentMethod,
      customerName,
      total,
    })
    setCart([])
    setCustomerName("")
    setPaymentMethod("cash")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CreditCard className="mr-2 h-4 w-4" />
          Point of Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold">Point of Sale - {storeName}</DialogTitle>
          <DialogDescription>Scan or select products to create a new sale</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-6 py-6">
            <div className="grid lg:grid-cols-[1fr,400px] gap-6 min-h-full">
              <div className="flex flex-col gap-4">
                {/* Product Search */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Product</Label>
                  <div className="flex gap-2">
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Search or scan product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory
                          .filter((item) => item.current_stock > 0)
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.product_name} - TZS {product.selling_price.toLocaleString()} (
                              {product.current_stock} in stock)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => selectedProduct && addToCart(selectedProduct)}
                      disabled={!selectedProduct}
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Access Products */}
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Access Products</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0">
                    <div className="h-full overflow-y-auto -mx-1 px-1">
                      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                        {inventory
                          .filter((item) => item.current_stock > 0)
                          .slice(0, 12)
                          .map((product) => (
                            <button
                              key={product.id}
                              onClick={() => addToCart(product.id)}
                              className="flex flex-col items-start gap-2 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors text-left"
                            >
                              <div className="w-full">
                                <p className="font-semibold text-sm line-clamp-2 mb-1">{product.product_name}</p>
                                <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                                <p className="text-base font-bold text-primary mb-2">
                                  TZS {product.selling_price.toLocaleString()}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {product.current_stock} in stock
                                </Badge>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col gap-4">
                {/* Shopping Cart */}
                <Card className="flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Cart ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[280px] overflow-y-auto -mx-1 px-1">
                      {cart.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm text-muted-foreground">Cart is empty</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {cart.map((item) => (
                            <div key={item.id} className="flex gap-3 p-3 rounded-lg border bg-card/50">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm mb-1 line-clamp-1">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground mb-2">{item.sku}</p>
                                <p className="text-sm font-bold text-primary">TZS {item.price.toLocaleString()}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 bg-transparent"
                                    onClick={() => updateQuantity(item.id, -1)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 bg-transparent"
                                    onClick={() => updateQuantity(item.id, 1)}
                                    disabled={item.quantity >= item.available_stock}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="font-bold text-sm">TZS {(item.price * item.quantity).toLocaleString()}</p>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => removeFromCart(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Checkout Section */}
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name" className="text-sm font-medium">
                        Customer Name (Optional)
                      </Label>
                      <Input
                        id="customer_name"
                        placeholder="Enter customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_method" className="text-sm font-medium">
                        Payment Method
                      </Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="payment_method">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-semibold">TZS {subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (18%):</span>
                        <span className="font-semibold">TZS {tax.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">TZS {total.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={handleCheckout} disabled={cart.length === 0}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Complete Sale - TZS {total.toLocaleString()}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
