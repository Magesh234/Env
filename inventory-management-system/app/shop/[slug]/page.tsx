"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  ShoppingCart,
  MapPin,
  Phone,
  Mail,
  Store,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  X,
  Heart,
  User,
  Menu,
  Star,
  TrendingUp,
  Shield,
  Truck,
} from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8082"

interface StorefrontTheme {
  theme_preset: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  text_color: string
  font_family: string
  layout: string
  header_style: string
}

interface StorefrontSettings {
  show_inventory: boolean
  allow_guest_checkout: boolean
  require_phone: boolean
  require_email: boolean
  delivery_enabled: boolean
  pickup_enabled: boolean
  show_prices: boolean
  accept_orders: boolean
  maintenance_mode: boolean
}

interface StorefrontData {
  store_name: string
  storefront_slug: string
  theme: StorefrontTheme
  storefront_settings: StorefrontSettings
  storefront_description?: string
  storefront_logo_url?: string
  storefront_banner_url?: string
  address?: string
  city?: string
  phone?: string
  email?: string
}

interface Product {
  id: string
  sku: string
  product_name: string
  selling_price: number
  unit_of_measure: string
  image_url: string
  current_stock: number
  category_name: string
  rating?: number
  reviews?: number
}

interface CartItem extends Product {
  quantity: number
}

// Fake products for demonstration
const FAKE_PRODUCTS: Product[] = [
  {
    id: "1",
    sku: "TECH-001",
    product_name: "Wireless Bluetooth Headphones",
    selling_price: 89000,
    unit_of_measure: "piece",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    current_stock: 24,
    category_name: "Electronics",
    rating: 4.5,
    reviews: 128,
  },
  {
    id: "2",
    sku: "FASH-002",
    product_name: "Premium Leather Wallet",
    selling_price: 45000,
    unit_of_measure: "piece",
    image_url: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80",
    current_stock: 15,
    category_name: "Fashion",
    rating: 4.8,
    reviews: 89,
  },
  {
    id: "3",
    sku: "HOME-003",
    product_name: "Smart LED Desk Lamp",
    selling_price: 65000,
    unit_of_measure: "piece",
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80",
    current_stock: 32,
    category_name: "Home & Living",
    rating: 4.6,
    reviews: 56,
  },
  {
    id: "4",
    sku: "TECH-004",
    product_name: "Portable Power Bank 20000mAh",
    selling_price: 55000,
    unit_of_measure: "piece",
    image_url: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80",
    current_stock: 41,
    category_name: "Electronics",
    rating: 4.7,
    reviews: 203,
  },
  {
    id: "5",
    sku: "FASH-005",
    product_name: "Classic Sunglasses",
    selling_price: 35000,
    unit_of_measure: "piece",
    image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80",
    current_stock: 28,
    category_name: "Fashion",
    rating: 4.4,
    reviews: 91,
  },
  {
    id: "6",
    sku: "HOME-006",
    product_name: "Stainless Steel Water Bottle",
    selling_price: 28000,
    unit_of_measure: "piece",
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80",
    current_stock: 67,
    category_name: "Home & Living",
    rating: 4.9,
    reviews: 145,
  },
  {
    id: "7",
    sku: "TECH-007",
    product_name: "Wireless Mouse & Keyboard Combo",
    selling_price: 72000,
    unit_of_measure: "set",
    image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80",
    current_stock: 19,
    category_name: "Electronics",
    rating: 4.5,
    reviews: 167,
  },
  {
    id: "8",
    sku: "FASH-008",
    product_name: "Designer Watch",
    selling_price: 125000,
    unit_of_measure: "piece",
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    current_stock: 12,
    category_name: "Fashion",
    rating: 4.8,
    reviews: 78,
  },
]

export default function PublicStorefrontPage({ params }: { params: { slug: string } }) {
  const slug = params.slug

  const [storefront, setStorefront] = useState<StorefrontData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [showWishlist, setShowWishlist] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  useEffect(() => {
    fetchStorefront()
    fetchProducts()
  }, [slug])

  const fetchStorefront = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/storefront/${slug}`)
      
      if (!response.ok) {
        throw new Error("Store not found or unavailable")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to load storefront")
      }

      setStorefront(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load storefront")
      console.error("Storefront fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/storefront/${slug}/products`)
      
      if (!response.ok) {
        // If API fails, use fake products as fallback
        console.log("Using fake products as fallback")
        setProducts(FAKE_PRODUCTS)
        return
      }

      const data = await response.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setProducts(data.data)
      } else {
        // Use fake products if no products returned
        setProducts(FAKE_PRODUCTS)
      }
    } catch (err) {
      console.error("Failed to load products:", err)
      // Use fake products as fallback
      setProducts(FAKE_PRODUCTS)
    }
  }

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.current_stock) }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = item.quantity + delta
            return { ...item, quantity: Math.max(0, Math.min(newQuantity, item.current_stock)) }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const newWishlist = new Set(prev)
      if (newWishlist.has(productId)) {
        newWishlist.delete(productId)
      } else {
        newWishlist.add(productId)
      }
      return newWishlist
    })
  }

  const handleCheckout = () => {
    setShowAuthModal(true)
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category_name)))]

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category_name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const wishlistProducts = products.filter((p) => wishlist.has(p.id))

  if (!storefront) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  const { theme, storefront_settings } = storefront

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 bg-white shadow-lg backdrop-blur-lg bg-opacity-95">
        <div className="border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Free Shipping on orders over TZS 100,000
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Secure Checkout
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {storefront.store_name}
                </h1>
                <p className="text-xs text-gray-500">{storefront.storefront_description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowWishlist(true)}
                className="relative hover:bg-red-50 transition-colors"
              >
                <Heart className={`h-5 w-5 ${wishlist.size > 0 ? "fill-red-500 text-red-500" : ""}`} />
                {wishlist.size > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {wishlist.size}
                  </span>
                )}
              </Button>

              <Button
                onClick={() => setShowCart(true)}
                className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Cart
                {cartItemCount > 0 && (
                  <span className="ml-2 bg-white text-blue-600 text-xs rounded-full px-2 py-0.5 font-bold">
                    {cartItemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90 z-10" />
        <img
          src={storefront.storefront_banner_url}
          alt="Store banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center text-center">
          <div className="space-y-6 px-4">
            <h2 className="text-5xl font-bold text-white drop-shadow-2xl">
              Welcome to {storefront.store_name}
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Discover amazing products at unbeatable prices
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg shadow-xl">
                Shop Now
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">Quick and reliable shipping to your doorstep</p>
            </div>
            <div className="text-center space-y-3">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg">Secure Payment</h3>
              <p className="text-gray-600 text-sm">Your transactions are safe and protected</p>
            </div>
            <div className="text-center space-y-3">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg">Quality Products</h3>
              <p className="text-gray-600 text-sm">Carefully curated items just for you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Search and Filter */}
        <div className="mb-12 space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-600">{filteredProducts.length} products found</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 bg-white"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        wishlist.has(product.id) ? "fill-red-500 text-red-500" : "text-gray-400"
                      }`}
                    />
                  </button>
                  {product.current_stock < 20 && (
                    <Badge className="absolute top-3 left-3 bg-red-500">Low Stock</Badge>
                  )}
                </div>

                <CardContent className="p-5 space-y-3">
                  <div>
                    <p className="text-xs text-blue-600 font-semibold mb-1">{product.category_name}</p>
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                      {product.product_name}
                    </h3>
                  </div>

                  {product.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating!)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({product.reviews})</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-blue-600">
                      TZS {product.selling_price.toLocaleString()}
                    </p>
                    {storefront_settings.show_inventory && (
                      <Badge variant={product.current_stock > 10 ? "default" : "secondary"}>
                        {product.current_stock} left
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => addToCart(product)}
                    disabled={product.current_stock === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.current_stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Shopping Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md h-full overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Shopping Cart</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCart(false)} className="text-white hover:bg-white/20">
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <p className="text-blue-100 mt-1">{cartItemCount} items</p>
            </div>

            <div className="p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">Your cart is empty</p>
                  <p className="text-gray-400 text-sm mt-2">Add some products to get started</p>
                </div>
              ) : (
                <>
                  {cart.map((item) => (
                    <Card key={item.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={item.image_url}
                            alt={item.product_name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1 space-y-2">
                            <h4 className="font-bold text-gray-900">{item.product_name}</h4>
                            <p className="text-sm text-gray-600">
                              TZS {item.selling_price.toLocaleString()} each
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-gray-200 rounded transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-blue-600">
                              TZS {(item.selling_price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <div className="border-t-2 pt-6 space-y-4 mt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>TZS {cartTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping:</span>
                        <span className="text-green-600 font-medium">Free</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                        <span>Total:</span>
                        <span className="text-blue-600">TZS {cartTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleCheckout}
                      className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Sidebar */}
      {showWishlist && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWishlist(false)} />
          <div className="relative w-full max-w-md h-full overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 p-6 bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Wishlist</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowWishlist(false)} className="text-white hover:bg-white/20">
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <p className="text-red-100 mt-1">{wishlist.size} items</p>
            </div>

            <div className="p-6 space-y-4">
              {wishlistProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg font-medium">Your wishlist is empty</p>
                  <p className="text-gray-400 text-sm mt-2">Save items you love for later</p>
                </div>
              ) : (
                wishlistProducts.map((product) => (
                  <Card key={product.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={product.image_url}
                          alt={product.product_name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{product.product_name}</h4>
                          <p className="text-blue-600 font-bold text-lg">
                            TZS {product.selling_price.toLocaleString()}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={() => {
                                addToCart(product)
                                toggleWishlist(product.id)
                              }}
                              size="sm"
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Add to Cart
                            </Button>
                            <Button
                              onClick={() => toggleWishlist(product.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-300 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <Card className="relative w-full max-w-md shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Sign In Required</h2>
                <p className="text-gray-600">Please sign in to complete your purchase</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    className="w-full py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full py-3"
                  />
                </div>

                <Button className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                  Sign In & Checkout
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="py-3">
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button variant="outline" className="py-3">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>
                </div>

                <div className="text-center text-sm">
                  <span className="text-gray-600">Don't have an account? </span>
                  <button className="text-blue-600 font-semibold hover:underline">
                    Sign up now
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Store className="h-6 w-6" />
                <span className="text-xl font-bold">{storefront.store_name}</span>
              </div>
              <p className="text-gray-400 text-sm">{storefront.storefront_description}</p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shop</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Customer Service</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                {storefront.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 flex-shrink-0" />
                    <span>{storefront.address}, {storefront.city}</span>
                  </li>
                )}
                {storefront.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    <span>{storefront.phone}</span>
                  </li>
                )}
                {storefront.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    <span>{storefront.email}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 {storefront.store_name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}