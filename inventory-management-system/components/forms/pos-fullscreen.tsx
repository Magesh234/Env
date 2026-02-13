"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CreditCard,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  X,
  Search,
  Loader2,
  UserPlus,
  CheckCircle2,
  Package,
  DollarSign,
  Users,
  Sparkles,
  Zap,
  AlertCircle,
  Printer,
  Calendar,
  Info,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  Smartphone,
  Building2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AddClientDialog } from "@/components/forms/add-client-dialog"
import { inventory_base_url, auth_base_url } from "@/lib/api-config"
import { image_base_url } from "@/lib/api-config"
import { printThermalReceipt } from '@/components/thermal-receipt-printer'
import { BarcodeScannerMode } from '@/components/pos/BarcodeScannerMode'

const API_BASE = inventory_base_url
const API_AUTH = auth_base_url
const IMAGE_API_URL = `${image_base_url}/images`
const PRODUCTS_API_URL = `${inventory_base_url}/public/products`

interface ProductImageProps {
  imageId?: string;
  productName: string;
  className?: string;
}

function ProductImage({ imageId, productName, className = "h-16 w-full" }: ProductImageProps) {
  const [presignedImageUrl, setPresignedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (!imageId) {
        setImageLoading(false);
        setImageError(true);
        return;
      }

      const finalUrl = `${IMAGE_API_URL}/${imageId}/presigned-url?expiration=1440`;

      try {
        const accessToken = localStorage.getItem('access_token');
        const sessionToken = localStorage.getItem('session_token');
        
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        if (sessionToken) {
          headers['X-Session-Token'] = sessionToken;
        }

        const response = await fetch(finalUrl, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data?.presigned_url) {
          setPresignedImageUrl(data.data.presigned_url);
          setImageError(false);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        setImageError(true);
      } finally {
        setImageLoading(false);
      }
    };

    fetchPresignedUrl();
  }, [imageId]);

  if (imageLoading) {
    return (
      <div className={`${className} rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center object-cover border-2 border-slate-200 dark:border-slate-700`}>
        <div className="relative">
          <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (imageError || !presignedImageUrl) {
    return (
      <div className={`${className} rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center object-cover border-2 border-slate-200 dark:border-slate-700`}>
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={presignedImageUrl}
      alt={productName}
      className={`${className} rounded-xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm`}
      onError={() => setImageError(true)}
    />
  );
}

const fetchProductDetails = async (productId: string): Promise<{ image_id?: string } | null> => {
  try {
    const accessToken = localStorage.getItem('access_token');
    const sessionToken = localStorage.getItem('session_token');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (sessionToken) {
      headers['X-Session-Token'] = sessionToken;
    }

    const response = await fetch(`${PRODUCTS_API_URL}/${productId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return {
        image_id: data.data.image_id
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching product details for ${productId}:`, error);
    return null;
  }
};

interface POSFullscreenProps {
  storeId: string
  storeName: string
  inventory: any[]
  onClose: () => void
}

interface CartItem {
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
  available_stock: number
}

interface Client {
  id: string
  client_name?: string
  first_name?: { String: string; Valid: boolean }
  last_name?: { String: string; Valid: boolean }
  business_name?: { String: string; Valid: boolean }
}

interface SuccessModalState {
  isOpen: boolean
  invoiceNumber: string
  saleData: any | null
}

interface BusinessProfile {
  business_name: string
  business_type: string
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

export function POSFullscreen({ storeId, storeName, inventory, onClose }: POSFullscreenProps) {
  const { toast } = useToast()
  const router = useRouter()
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [saleType, setSaleType] = useState<string>("cash")
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [clients, setClients] = useState<Client[]>([])
  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [paymentTermDays, setPaymentTermDays] = useState<string>("21")
  const [amountPaidInput, setAmountPaidInput] = useState<string>("")
  const [scannerMode, setScannerMode] = useState(false)
  const [successModal, setSuccessModal] = useState<SuccessModalState>({
    isOpen: false,
    invoiceNumber: "",
    saleData: null,
  })
  const [activeView, setActiveView] = useState<"products" | "cart">("products")
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isPrintingReceipt, setIsPrintingReceipt] = useState(false)
  const [expandCart, setExpandCart] = useState(false)
  
  // New state for collapsible configuration
  const [configExpanded, setConfigExpanded] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState<string>("")
  const [showClientDropdown, setShowClientDropdown] = useState(false)

  const getToken = () => {
    return typeof window !== "undefined"
      ? sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      : null
  }

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

  const fetchSaleByInvoice = async (invoiceNumber: string) => {
    try {
      const token = getToken()
      if (!token) return null

      const response = await fetch(`${API_BASE}/sales/invoice?invoice_number=${invoiceNumber}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          return result.data
        }
      }
      return null
    } catch (error) {
      console.error("Error fetching sale by invoice:", error)
      return null
    }
  }

    const updateCartItem = (productId: string, updates: Partial<CartItem>) => {
    setCart(cart.map(item => 
      item.product_id === productId 
        ? { ...item, ...updates }
        : item
    ))
  }

  const handlePrintReceipt = async () => {
    if (!successModal.saleData) {
      toast({
        title: "Error",
        description: "Sale data not available for printing",
        variant: "destructive",
      })
      return
    }

    setIsPrintingReceipt(true)

    try {
      const { sale, items } = successModal.saleData

      let servedBy = "Staff"
      if (userProfile) {
        servedBy = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.email
      }

      const receiptData = {
        businessName: businessProfile?.business_name || "RETAIL STORE",
        businessPhone: userProfile?.phone || "",
        businessEmail: userProfile?.email || "",
        invoice_number: sale.invoice_number,
        invoice_date: sale.invoice_date,
        client_name: sale.client_name,
        payment_method: sale.payment_method,
        total_amount: sale.total_amount,
        amount_paid: sale.amount_paid,
        balance_due: sale.balance_due,
        items: items.map((item: any) => ({
          product_name: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          total: item.total
        })),
        served_by: servedBy
      }

      printThermalReceipt(receiptData, '80mm')
      
      toast({
        title: "Receipt Sent to Printer",
        description: "Thermal receipt is being printed",
      })
    } catch (error) {
      console.error("Error printing receipt:", error)
      toast({
        title: "Print Error",
        description: "Failed to print receipt",
        variant: "destructive",
      })
    } finally {
      setIsPrintingReceipt(false)
    }
  }

  const refreshInventoryStock = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch(`${API_BASE}/stores/${storeId}/inventory`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const inventoryData = Array.isArray(result.data) ? result.data : result.data.inventory || []
          
          const enrichedProducts = await Promise.all(
            inventoryData.map(async (product: any) => {
              const productId = product.product_id || product.id;
              
              if (!productId) {
                return product;
              }
              
              const productDetails = await fetchProductDetails(productId);
              
              return {
                ...product,
                image_id: productDetails?.image_id || product.image_id
              };
            })
          );
          
          setInventoryItems(enrichedProducts)
        }
      }
    } catch (error) {
      console.error("Error refreshing inventory:", error)
    }
  }

  useEffect(() => {
    const enrichInventoryWithImages = async () => {
      if (inventory && inventory.length > 0) {
        const enrichedProducts = await Promise.all(
          inventory.map(async (product: any) => {
            const productId = product.product_id || product.id;
            
            if (!productId) {
              return product;
            }
            
            const productDetails = await fetchProductDetails(productId);
            
            return {
              ...product,
              image_id: productDetails?.image_id || product.image_id
            };
          })
        );
        
        setInventoryItems(enrichedProducts);
      }
    };

    enrichInventoryWithImages();
    fetchClients();
    fetchBusinessProfile();
    fetchUserProfile();
  }, [inventory]);

  // Auto-expand configuration when credit or partial is selected
  useEffect(() => {
    if (saleType === "credit" || saleType === "partial") {
      setConfigExpanded(true)
    }
  }, [saleType])

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true)
      const token = getToken()
      if (!token) throw new Error("No auth token")

      const response = await fetch(`${API_BASE}/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setClients(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to fetch clients",
        variant: "destructive",
      })
    } finally {
      setIsLoadingClients(false)
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

  const addToCart = (inventoryItemId: string) => {
    const inventoryItem = inventoryItems.find((item) => item.id === inventoryItemId)

    if (!inventoryItem) {
      toast({
        title: "Error",
        description: "Product not found in inventory",
        variant: "destructive",
      })
      return
    }

    const productId = inventoryItem.product_id

    if (!productId) {
      console.error("Inventory item missing product_id:", inventoryItem)
      toast({
        title: "Error",
        description: "Product ID is missing from inventory",
        variant: "destructive",
      })
      return
    }

    const existingItem = cart.find((item) => item.product_id === productId)

    if (existingItem) {
      if (existingItem.quantity < inventoryItem.current_stock) {
        setCart(
          cart.map((item) => {
            if (item.product_id === productId) {
              const newQuantity = item.quantity + 1
              const subtotal = item.unit_price * newQuantity
              const discountAmount = (subtotal * item.discount_percentage) / 100
              const total = subtotal - discountAmount

              return {
                ...item,
                quantity: newQuantity,
                subtotal,
                discount_amount: discountAmount,
                total,
              }
            }
            return item
          }),
        )
      } else {
        toast({
          title: "Error",
          description: "Not enough stock available",
          variant: "destructive",
        })
      }
    } else {
      const subtotal = inventoryItem.selling_price * 1
      const discountAmount = 0
      const total = subtotal - discountAmount

      const newCartItem: CartItem = {
        product_id: productId,
        product_name: inventoryItem.product_name,
        sku: inventoryItem.sku,
        buying_price: inventoryItem.buying_price || 0,
        selling_price: inventoryItem.selling_price,
        unit_price: inventoryItem.selling_price,
        quantity: 1,
        discount_percentage: 0,
        discount_amount: 0,
        subtotal,
        total,
        available_stock: inventoryItem.current_stock,
      }

      setCart([...cart, newCartItem])
    }
  }

  const updateQuantity = (productId: string, change: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.product_id === productId) {
            const newQuantity = item.quantity + change

            if (newQuantity <= 0) return null

            if (newQuantity > item.available_stock) {
              toast({
                title: "Error",
                description: "Not enough stock",
                variant: "destructive",
              })
              return item
            }

            const subtotal = item.unit_price * newQuantity
            const discountAmount = (subtotal * item.discount_percentage) / 100
            const total = subtotal - discountAmount

            return {
              ...item,
              quantity: newQuantity,
              subtotal,
              discount_amount: discountAmount,
              total,
            }
          }
          return item
        })
        .filter(Boolean) as CartItem[],
    )
  }

  const updateItemDiscount = (productId: string, discount: number) => {
    if (discount < 0 || discount > 100) return

    setCart(
      cart.map((item) => {
        if (item.product_id === productId) {
          const discountAmount = (item.subtotal * discount) / 100
          const total = item.subtotal - discountAmount

          return {
            ...item,
            discount_percentage: discount,
            discount_amount: discountAmount,
            total,
          }
        }
        return item
      }),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product_id !== productId))
  }

  const subtotalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const totalDiscount = cart.reduce((sum, item) => sum + item.discount_amount, 0)
  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0)

  // Calculate amount paid based on sale type
  const getAmountPaid = () => {
    if (saleType === "cash") {
      return totalAmount
    } else if (saleType === "credit") {
      return 0
    } else if (saleType === "partial") {
      return parseFloat(amountPaidInput) || 0
    }
    return 0
  }

  const amountPaid = getAmountPaid()
  const balanceDue = totalAmount - amountPaid

  const calculateDueDate = () => {
    const days = parseInt(paymentTermDays) || 21
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + days)
    return dueDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getPaymentTermDescription = () => {
    const days = parseInt(paymentTermDays) || 21
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

  const handleCheckout = async () => {
    if (!storeId) {
      toast({
        title: "Error",
        description: "Store ID is missing",
        variant: "destructive",
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Cart is empty",
        variant: "destructive",
      })
      return
    }

    if ((saleType === "credit" || saleType === "partial") && !selectedClientId) {
      toast({
        title: "Error",
        description: "Credit and partial sales require a client",
        variant: "destructive",
      })
      return
    }

    if (saleType === "partial") {
      const partialAmount = parseFloat(amountPaidInput)
      if (!amountPaidInput || partialAmount <= 0) {
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

    if (saleType === "credit" || saleType === "partial") {
      const paymentTermDaysNum = parseInt(paymentTermDays)
      if (paymentTermDaysNum <= 0 || paymentTermDaysNum > 365) {
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
          store_id: storeId,
          client_id: selectedClientId || undefined,
          sale_type: saleType,
          subtotal: subtotalAmount,
          tax_amount: 0,
          discount_amount: totalDiscount,
          total_amount: totalAmount,
          amount_paid: amountPaid,
          payment_method: {
            String: paymentMethod,
            Valid: true,
          },
        },
        items: cart.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          buying_price: item.buying_price,
          selling_price: item.selling_price,
          unit_price: item.unit_price,
          quantity: item.quantity,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_amount,
          subtotal: item.subtotal,
          total: item.total,
        })),
        payment_term_days: (saleType === "credit" || saleType === "partial") 
          ? parseInt(paymentTermDays) 
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
        throw new Error(errorData.error || errorData.message || "Failed to create sale")
      }

      const result = await response.json()
      const invoiceNumber = result.data?.invoice_number || "created"

      const saleData = await fetchSaleByInvoice(invoiceNumber)

      setSuccessModal({
        isOpen: true,
        invoiceNumber,
        saleData,
      })

      setCart([])
      setSaleType("cash")
      setPaymentMethod("cash")
      setSelectedClientId("")
      setPaymentTermDays("21")
      setAmountPaidInput("")
      setClientSearchQuery("")
      setConfigExpanded(false)
      
      await refreshInventoryStock()
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

  const filteredInventory = inventoryItems.filter(
    (item) =>
      item.current_stock > 0 &&
      (item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Filter clients based on search
  const filteredClients = clients.filter((client) =>
    getClientName(client).toLowerCase().includes(clientSearchQuery.toLowerCase())
  )

  // Get selected client info
  const selectedClient = clients.find(c => c.id === selectedClientId)
  const selectedClientName = selectedClient ? getClientName(selectedClient) : ""

  // Get payment method display info
  const getPaymentMethodInfo = () => {
    const methods: { [key: string]: { label: string; icon: string } } = {
      cash: { label: 'Cash', icon: '💵' },
      mobile_money: { label: 'M-Money', icon: '📱' },
      bank_transfer: { label: 'Bank', icon: '🏦' },
      card: { label: 'Card', icon: '💳' },
      credit: { label: 'Credit', icon: '📝' },
    }
    return methods[paymentMethod] || methods.cash
  }

    if (scannerMode) {
    return (
      <BarcodeScannerMode
        storeId={storeId}
        storeName={storeName}
        cart={cart}
        onAddToCart={(item) => setCart([...cart, item])}
        onUpdateCartItem={updateCartItem}
        onExit={() => setScannerMode(false)}
        onViewCart={() => setScannerMode(false)}
      />
    )
  }

  return (
    <div className="fixed inset-0 left-0 right-0 top-0 bottom-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 z-[9998] flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="h-16 sm:h-20 border-b-2 border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <div className="min-w-0 flex-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Point of Sale
                <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-none font-black uppercase hidden sm:inline-flex">
                  Live
                </Badge>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-bold hidden sm:block">{storeName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4 relative z-10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setExpandCart(!expandCart)} 
            className="relative hidden lg:flex border-2 font-bold h-10 gap-2"
            title={expandCart ? "Collapse Cart" : "Expand Cart"}
          >
            {expandCart ? (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="hidden xl:inline">Collapse</span>
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden xl:inline">Expand</span>
              </>
            )}
          </Button>
          <Button
            variant={scannerMode ? "default" : "outline"}
            size="sm"
            onClick={() => setScannerMode(!scannerMode)}
            className={`gap-2 font-bold h-10 border-2 ${
              scannerMode 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' 
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">{scannerMode ? 'Scanning...' : 'Scan Mode'}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setActiveView("cart")} 
            className="relative lg:hidden border-2 font-bold h-10"
          >
            <ShoppingCart className="h-4 w-4" />
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-emerald-500 border-2 border-white dark:border-slate-950 font-black">
                {cart.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2 text-muted-foreground hover:text-foreground border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-800 font-bold h-10"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Close POS</span>
          </Button>
        </div>
      </header>

      {/* MOBILE TAB NAVIGATION */}
      <div className="lg:hidden border-b-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-lg">
        <div className="flex">
          <button
            onClick={() => setActiveView("products")}
            className={`flex-1 py-4 px-4 text-sm font-black border-b-4 transition-all ${
              activeView === "products"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <Package className="h-5 w-5 inline mr-2" />
            <span className="hidden xs:inline">Products</span>
          </button>
          <button
            onClick={() => setActiveView("cart")}
            className={`flex-1 py-4 px-4 text-sm font-black border-b-4 transition-all relative ${
              activeView === "cart"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-slate-900"
            }`}
          >
            <ShoppingCart className="h-5 w-5 inline mr-2" />
            <span className="hidden xs:inline">Cart</span>
            {cart.length > 0 && (
              <Badge className="ml-2 h-5 min-w-5 px-1.5 text-xs bg-emerald-500 font-black">
                {cart.length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-0">
        {/* PRODUCTS SECTION */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 min-w-0 ${
            activeView === "products" ? "block" : "hidden lg:flex"
          } lg:border-r-2 lg:border-slate-200 lg:dark:border-slate-800`}
        >
          {/* Search Bar */}
          <div className="p-6 border-b-2 border-slate-200 dark:border-slate-800 shrink-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-lg">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 focus-visible:ring-primary font-bold text-base shadow-sm"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-slate-600">
            {filteredInventory.length > 0 ? (
              <div className={`grid gap-4 ${
                expandCart 
                  ? "grid-cols-1 sm:grid-cols-2" 
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
              }`}>
                {filteredInventory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item.id)}
                    className="group flex flex-col items-start gap-3 p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 hover:border-primary/50 hover:shadow-2xl transition-all text-left relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent transition-all rounded-2xl pointer-events-none" />
                    
                    <div className="w-full space-y-3 relative z-10">
                      {/* Image with Stock Badge on Top Right */}
                      <div className="relative">
                        <ProductImage 
                          imageId={item.image_id} 
                          productName={item.product_name}
                          className="h-32 w-full"
                        />
                        {/* STOCK BADGE - MOVED TO TOP RIGHT */}
                        <Badge className="absolute top-2 right-2 bg-emerald-500 hover:bg-emerald-600 font-black text-xs border-2 border-white dark:border-slate-950 shadow-lg">
                          {item.current_stock} in stock
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="font-black text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {item.product_name}
                        </p>
                        <Badge variant="outline" className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 font-bold border-2">
                          {item.sku}
                        </Badge>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Price</p>
                          <p className="text-xl font-black text-primary">
                            TZS {item.selling_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full py-12">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                    <Package className="h-10 w-10 text-slate-400" />
                  </div>
                  <p className="text-xl font-black text-foreground">No products found</p>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">Try adjusting your search criteria</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CART SECTION */}
        <div
          className={`w-full flex flex-col bg-white dark:bg-slate-950 shadow-2xl overflow-hidden transition-all duration-300 ${
            expandCart 
              ? "lg:w-[720px] xl:w-[800px]" 
              : "lg:w-[580px] xl:w-[640px]"
          } ${
            activeView === "cart" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Cart Header */}
          <div className="p-6 border-b-2 border-slate-200 dark:border-slate-800 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shrink-0">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-black truncate">Shopping Cart</h2>
                <p className="text-sm text-muted-foreground font-bold">
                  {cart.length} {cart.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </div>

          {/* COLLAPSIBLE SALE CONFIGURATION */}
          <div className="border-b-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0 max-h-[50vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* COLLAPSED VIEW - Summary */}
            {!configExpanded && (
              <button
                onClick={() => setConfigExpanded(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm">Sale Config:</span>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                    {saleType.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="font-bold text-xs flex items-center gap-1">
                    {paymentMethod === 'cash' && <DollarSign className="h-3 w-3" />}
                    {paymentMethod === 'mobile_money' && <Smartphone className="h-3 w-3" />}
                    {paymentMethod === 'card' && <CreditCard className="h-3 w-3" />}
                    {paymentMethod === 'bank_transfer' && <Building2 className="h-3 w-3" />}
                    {getPaymentMethodInfo().label}
                  </Badge>
                  {selectedClientId && (
                    <Badge variant="outline" className="font-bold text-xs max-w-[150px] truncate flex items-center gap-1">
                      <Users className="h-3 w-3" /> {selectedClientName}
                    </Badge>
                  )}
                  {(saleType === "credit" || saleType === "partial") && !selectedClientId && (
                    <Badge variant="destructive" className="font-bold text-xs animate-pulse">
                      ⚠️ Customer Required
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            )}

            {/* EXPANDED VIEW - Full Configuration */}
            {configExpanded && (
              <div className="p-5 space-y-5">
                {/* Header with Collapse Button */}
                <div className="flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 pb-3">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="font-black text-base">Sale Configuration</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfigExpanded(false)}
                    className="h-8 gap-2 font-bold text-xs"
                  >
                    Collapse <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>

                {/* SALE TYPE - Segmented Control */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-primary" />
                    Sale Type
                  </Label>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-800">
                    {[
                      { value: 'cash', label: 'Cash', Icon: DollarSign },
                      { value: 'credit', label: 'Credit', Icon: CreditCard },
                      { value: 'partial', label: 'Partial', Icon: Zap }
                    ].map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        onClick={() => {
                          setSaleType(value)
                          setAmountPaidInput("")
                        }}
                        className={`py-2 px-2 rounded-lg font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 ${
                          saleType === value
                            ? 'bg-white dark:bg-slate-950 shadow-lg border-2 border-primary text-primary scale-[1.02]'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-muted-foreground border-2 border-transparent'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* PAYMENT METHOD - Icon Cards Grid */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                    Payment Method
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'cash', label: 'Cash', Icon: DollarSign },
                      { value: 'mobile_money', label: 'M-Money', Icon: Smartphone },
                      { value: 'card', label: 'Card', Icon: CreditCard },
                      { value: 'bank_transfer', label: 'Bank', Icon: Building2 },
                    ].map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        onClick={() => setPaymentMethod(value)}
                        className={`p-2 rounded-lg border-2 font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === value
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-white border-primary shadow-lg scale-[1.02]'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-md text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="uppercase">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CUSTOMER SELECTION - Search with Autocomplete */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Customer
                    {(saleType === "credit" || saleType === "partial") && (
                      <span className="text-red-500 text-sm">*</span>
                    )}
                  </Label>
                  
                  {!selectedClientId ? (
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search customer..."
                            value={clientSearchQuery}
                            onChange={(e) => {
                              setClientSearchQuery(e.target.value)
                              setShowClientDropdown(true)
                            }}
                            onFocus={() => setShowClientDropdown(true)}
                            className="h-10 pl-10 pr-4 border-2 font-bold bg-white dark:bg-slate-950"
                            disabled={isLoadingClients}
                          />
                        </div>
                        <AddClientDialog
                          onClientAdded={fetchClients}
                          trigger={
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon"
                              className="h-10 w-10 shrink-0 border-2"
                              title="Add new customer"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                      
                      {/* Dropdown Results */}
                      {showClientDropdown && clientSearchQuery && filteredClients.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-h-60 overflow-auto z-50">
                          {filteredClients.map((client) => (
                            <button
                              key={client.id}
                              onClick={() => {
                                setSelectedClientId(client.id)
                                setClientSearchQuery("")
                                setShowClientDropdown(false)
                              }}
                              className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-slate-100 dark:border-slate-800 font-bold text-sm transition-colors flex items-center gap-2"
                            >
                              <Users className="h-4 w-4 text-primary" />
                              {getClientName(client)}
                            </button>
                          ))}
                        </div>
                      )}

                      {showClientDropdown && clientSearchQuery && filteredClients.length === 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 z-50">
                          <p className="text-sm text-muted-foreground text-center font-medium">
                            No customers found
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Selected Customer Chip */
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate text-emerald-900 dark:text-emerald-100">
                          {selectedClientName}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          Selected Customer
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClientId("")
                          setClientSearchQuery("")
                        }}
                        className="h-8 w-8 p-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* PAYMENT TERMS - Quick Select Buttons + Custom Input */}
                {(saleType === "credit" || saleType === "partial") && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Payment Terms (Days) <span className="text-red-500">*</span>
                    </Label>
                    
                    {/* Quick Presets */}
                    <div className="grid grid-cols-3 gap-2">
                      {[7, 14, 21, 30, 60, 90].map((days) => (
                        <button
                          key={days}
                          onClick={() => setPaymentTermDays(days.toString())}
                          className={`py-2.5 px-2 rounded-lg font-bold text-xs border-2 transition-all ${
                            paymentTermDays === days.toString()
                              ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]'
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/50 text-foreground'
                          }`}
                        >
                          {days} days
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Input */}
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                        Custom:
                      </Label>
                      <Input
                        type="number"
                        placeholder="Enter days"
                        value={paymentTermDays}
                        onChange={(e) => setPaymentTermDays(e.target.value)}
                        className="h-10 border-2 font-bold text-sm"
                        min="1"
                        max="365"
                      />
                      <span className="text-xs font-bold text-muted-foreground">days</span>
                    </div>

                    <Alert className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        Due Date: <span className="text-blue-700 dark:text-blue-400">{calculateDueDate()}</span>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* PARTIAL PAYMENT AMOUNT */}
                {saleType === "partial" && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="amount_paid" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Amount Paid Now <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount_paid"
                      type="number"
                      placeholder="Enter amount being paid now"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      min="0"
                      step="0.01"
                      max={totalAmount.toString()}
                      className="h-11 border-2 font-bold text-base"
                    />
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <Badge variant="outline" className="font-bold text-[10px]">
                        Total: TZS {totalAmount.toLocaleString()}
                      </Badge>
                      {amountPaidInput && parseFloat(amountPaidInput) > 0 && (
                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800 font-bold text-[10px]">
                          Balance: TZS {(totalAmount - parseFloat(amountPaidInput)).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* CREDIT/PARTIAL INFO ALERT */}
                {(saleType === "credit" || saleType === "partial") && (
                  <Alert className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      {saleType === "credit" 
                        ? `Full payment deferred. ${getPaymentTermDescription()} to pay TZS ${totalAmount.toLocaleString()}`
                        : `Partial payment tracked. Balance of TZS ${balanceDue.toLocaleString()} due in ${getPaymentTermDescription()}`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {cart.length === 0 ? (
              <div className="flex items-center justify-center h-full py-12 px-4">
                <div className="text-center">
                  <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-xl font-black text-foreground">Cart is empty</p>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">Select products to begin</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveView("products")}
                    className="mt-6 lg:hidden font-bold border-2"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Browse Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {cart.map((item) => (
                  <Card
                    key={item.product_id}
                    className="overflow-hidden border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-base line-clamp-2">{item.product_name}</p>
                          <Badge variant="outline" className="mt-1 text-[10px] font-mono font-bold border-2">
                            {item.sku}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0 -mr-2 border-2 border-transparent hover:border-red-200 dark:hover:border-red-900"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border-2 border-slate-200 dark:border-slate-800">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 hover:bg-white dark:hover:bg-slate-950"
                            onClick={() => updateQuantity(item.product_id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-10 text-center text-base font-black">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 hover:bg-white dark:hover:bg-slate-950"
                            onClick={() => updateQuantity(item.product_id, 1)}
                            disabled={item.quantity >= item.available_stock}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Unit Price</p>
                          <p className="text-base font-black">TZS {item.unit_price.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Label htmlFor={`discount-${item.product_id}`} className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            Discount %
                          </Label>
                          <Input
                            id={`discount-${item.product_id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.discount_percentage}
                            onChange={(e) =>
                              updateItemDiscount(item.product_id, Number.parseFloat(e.target.value) || 0)
                            }
                            className="h-10 text-sm mt-1 bg-white dark:bg-slate-950 font-bold border-2"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Total</p>
                          <p className="text-xl font-black text-primary">TZS {item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary & Checkout */}
          <div className="border-t-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 backdrop-blur-sm p-6 shrink-0 space-y-4 shadow-2xl">
            <div className="space-y-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-bold">Subtotal</span>
                <span className="font-black text-base">TZS {subtotalAmount.toLocaleString()}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                  <span className="font-bold">Discount</span>
                  <span className="font-black">-TZS {totalDiscount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-base font-black">Total</span>
                <span className="text-2xl font-black text-primary">TZS {totalAmount.toLocaleString()}</span>
              </div>
              
              {/* SHOW PAYMENT BREAKDOWN FOR CREDIT/PARTIAL */}
              {(saleType === "credit" || saleType === "partial") && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Paid Now</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">TZS {amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-600 dark:text-orange-400 font-bold">Balance Due</span>
                    <span className="font-black text-orange-600 dark:text-orange-400 text-lg">TZS {balanceDue.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <Button
              className="w-full h-14 text-lg font-black gap-3 shadow-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 relative overflow-hidden group"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full transition-transform duration-1000" />
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Processing Sale...
                </>
              ) : (
                <>
                  <Zap className="h-6 w-6" />
                  Complete Sale
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-md border-2 border-emerald-200 dark:border-emerald-900 shadow-2xl animate-in zoom-in duration-300">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl animate-bounce">
                    <CheckCircle2 className="h-14 w-14 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="h-8 w-8 text-amber-400 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  Sale Successful!
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  Your transaction has been completed successfully.
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-inner">
                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mb-3">Invoice Number</p>
                <p className="text-2xl font-mono font-black break-all text-foreground">{successModal.invoiceNumber}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSuccessModal({ isOpen: false, invoiceNumber: "", saleData: null })
                    window.location.reload()
                  }}
                  className="font-bold border-2"
                >
                  Close
                </Button>
                
                <Button
                  onClick={handlePrintReceipt}
                  disabled={isPrintingReceipt || !successModal.saleData}
                  className="font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600"
                >
                  {isPrintingReceipt ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => {
                    setSuccessModal({ isOpen: false, invoiceNumber: "", saleData: null })
                    window.location.href = `/dashboard/stores/${storeId}/pos`
                  }}
                  className="font-bold bg-gradient-to-r from-primary to-primary/80"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}