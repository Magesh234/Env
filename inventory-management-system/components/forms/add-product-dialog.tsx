"use client"

import { useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  CheckCircle, 
  RefreshCw, 
  Upload, 
  X, 
  Store as StoreIcon, 
  AlertCircle,
  Package,
  DollarSign,
  BarChart3,
  Image as ImageIcon,
  Tag,
  Sparkles,
  CheckCircle2
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { inventory_base_url } from "@/lib/api-config"
import { useStore } from "@/lib/store-context"

const API_BASE_URL = inventory_base_url 

interface AddProductDialogProps {
  onProductAdded?: () => void
  trigger?: React.ReactNode
}

// Generate a truly unique SKU using timestamp + random string
const generateUniqueSKU = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  const extraRandom = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `SKU-${timestamp}-${randomPart}${extraRandom}`
}

export function AddProductDialog({ onProductAdded, trigger }: AddProductDialogProps) {
  // Get global store selection
  const { selectedStore, storeName } = useStore()

  const [open, setOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    sku: generateUniqueSKU(),
    product_name: "",
    buying_price: "",
    selling_price: "",
    unit_of_measure: "",
    reorder_level: "0",
    track_inventory: true,
  })

  const handleRegenerateSKU = () => {
    setFormData({ ...formData, sku: generateUniqueSKU() })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setError(null)

    // Reset input
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Check if store is selected globally
      if (!selectedStore) {
        setError("Please select a store from the dashboard first")
        setIsSubmitting(false)
        return
      }

      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      if (!token) throw new Error("No access token found. Please login again.")

      // Validate required fields
      if (!formData.sku) throw new Error("SKU is required")
      if (!formData.product_name) throw new Error("Product name is required")
      if (!formData.unit_of_measure) throw new Error("Unit of measure is required")
      if (!formData.buying_price) throw new Error("Buying price is required")
      if (!formData.selling_price) throw new Error("Selling price is required")

      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData()
      
      // Add all form fields
      formDataToSend.append("sku", formData.sku)
      formDataToSend.append("product_name", formData.product_name)
      formDataToSend.append("buying_price", formData.buying_price)
      formDataToSend.append("selling_price", formData.selling_price)
      formDataToSend.append("unit_of_measure", formData.unit_of_measure)
      
      // Ensure reorder_level is always sent as a valid number
      const reorderLevel = formData.reorder_level === "" ? "0" : formData.reorder_level
      formDataToSend.append("reorder_level", reorderLevel)
      
      // Ensure track_inventory is sent as string boolean
      formDataToSend.append("track_inventory", formData.track_inventory ? "true" : "false")
      
      // Add image if selected
      if (imageFile) {
        formDataToSend.append("product_image", imageFile)
      }

      // Add store_ids as JSON array
      formDataToSend.append("store_ids", JSON.stringify([selectedStore]))

      console.log("Sending product data:", {
        sku: formData.sku,
        product_name: formData.product_name,
        buying_price: formData.buying_price,
        selling_price: formData.selling_price,
        unit_of_measure: formData.unit_of_measure,
        reorder_level: reorderLevel,
        track_inventory: formData.track_inventory,
        has_image: !!imageFile,
        image_name: imageFile?.name || 'N/A',
        image_size: imageFile?.size || 0,
        store_id: selectedStore,
        store_name: storeName
      })

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Don't set Content-Type header - browser will set it automatically with boundary
        },
        body: formDataToSend,
      })

      // Handle response
      let result
      const contentType = response.headers.get("content-type")
      
      if (contentType && contentType.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`)
      }

      console.log("Response:", result)

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || `Failed to create product (${response.status})`)
      }

      // Reset form
      setFormData({
        sku: generateUniqueSKU(),
        product_name: "",
        buying_price: "",
        selling_price: "",
        unit_of_measure: "",
        reorder_level: "0",
        track_inventory: true,
      })
      setImageFile(null)
      setImagePreview(null)
      setOpen(false)
      setSuccessOpen(true)
      onProductAdded?.()
    } catch (err) {
      console.error("Error creating product:", err)
      setError(err instanceof Error ? err.message : "Failed to create product")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="h-11 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-hidden flex flex-col border-none shadow-2xl">
          {/* PREMIUM HEADER */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <DialogHeader className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black flex items-center gap-2">
                  Add New Product
                  <Badge variant="secondary" className="text-[9px] bg-indigo-500/10 text-indigo-600 border-none font-black uppercase">
                    Inventory
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                  Register Product & Set Pricing
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
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
                    <span className="text-xs font-medium">Please select a store from dashboard before adding products</span>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* ERROR ALERT */}
            {error && (
              <Alert className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="font-bold text-red-900 dark:text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* IMAGE UPLOAD SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-2 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Product Image</h3>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider">
                  Optional
                </Badge>
              </div>

              <div className="flex items-start gap-6">
                {imagePreview ? (
                  <div className="relative group">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-40 h-40 object-cover rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Badge className="bg-white/90 text-black font-bold">Click X to remove</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="w-40 h-40 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 hover:border-primary/50 transition-colors">
                    <Upload className="h-10 w-10 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-500">No image</span>
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <Label htmlFor="product_image" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    Upload Product Photo
                  </Label>
                  <Input
                    id="product_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                    className="h-12 border-2 font-bold cursor-pointer file:mr-4 file:h-10 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20"
                  />
                  <Alert className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      Supported formats: JPG, PNG, WEBP • Max size: 10MB
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>

            {/* PRODUCT IDENTIFICATION SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                  <Tag className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Product Identification</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="sku" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    SKU Code (Auto-generated) <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                      disabled={isSubmitting}
                      className="flex-1 h-12 border-2 font-bold font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleRegenerateSKU}
                      disabled={isSubmitting}
                      title="Generate new SKU"
                      className="h-12 w-12 border-2"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Unique identifier for tracking</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="unit_of_measure" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Unit of Measure <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.unit_of_measure}
                    onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-12 border-2 font-bold">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs" className="font-bold">📦 Pieces</SelectItem>
                      <SelectItem value="kg" className="font-bold">⚖️ Kilograms</SelectItem>
                      <SelectItem value="liters" className="font-bold">🫗 Liters</SelectItem>
                      <SelectItem value="meters" className="font-bold">📏 Meters</SelectItem>
                      <SelectItem value="boxes" className="font-bold">📦 Boxes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="product_name" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="e.g., Cement 50kg, Premium Paint 5L"
                  required
                  disabled={isSubmitting}
                  className="h-12 border-2 font-bold text-base"
                />
              </div>
            </div>

            {/* PRICING SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Pricing Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="buying_price" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Buying Price (Cost) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="buying_price"
                    type="number"
                    step="0.01"
                    value={formData.buying_price}
                    onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                    placeholder="25000"
                    required
                    disabled={isSubmitting}
                    className="h-12 border-2 font-bold text-base"
                  />
                  <p className="text-xs text-muted-foreground font-medium">Your purchase/cost price</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="selling_price" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Selling Price (Retail) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="30000"
                    required
                    disabled={isSubmitting}
                    className="h-12 border-2 font-bold text-base"
                  />
                  <p className="text-xs text-muted-foreground font-medium">Customer retail price</p>
                </div>
              </div>

              {/* Profit Margin Preview */}
              {formData.buying_price && formData.selling_price && (
                <Alert className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-300">
                      <span>Profit Margin:</span>
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black text-sm">
                        TZS {(parseFloat(formData.selling_price) - parseFloat(formData.buying_price)).toLocaleString()} 
                        ({(((parseFloat(formData.selling_price) - parseFloat(formData.buying_price)) / parseFloat(formData.buying_price)) * 100).toFixed(1)}%)
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* INVENTORY MANAGEMENT SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Inventory Settings</h3>
              </div>

              <div className="space-y-3">
                <Label htmlFor="reorder_level" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Reorder Alert Level
                </Label>
                <Input
                  id="reorder_level"
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  placeholder="0"
                  disabled={isSubmitting}
                  className="h-12 border-2 font-bold"
                />
                <Alert className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Get notified when stock falls below this quantity
                  </AlertDescription>
                </Alert>
              </div>

              <Separator className="bg-slate-200 dark:bg-slate-800" />

              <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <Checkbox 
                  id="track_inventory"
                  checked={formData.track_inventory}
                  onCheckedChange={(checked) => setFormData({ ...formData, track_inventory: checked as boolean })}
                  disabled={isSubmitting}
                  className="h-5 w-5"
                />
                <Label 
                  htmlFor="track_inventory" 
                  className="text-sm font-black cursor-pointer flex-1"
                >
                  Enable inventory tracking for this product
                </Label>
                {formData.track_inventory && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-3 pt-6 border-t-2 border-slate-200 dark:border-slate-800">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                disabled={isSubmitting}
                className="h-12 px-6 font-bold border-2"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !formData.sku || !selectedStore}
                className="h-12 px-8 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 font-bold shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Creating Product...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Create Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS DIALOG - PREMIUM VERSION */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
          
          <div className="text-center pt-8 pb-6 space-y-6">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-full shadow-lg">
                <CheckCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                Product Added Successfully!
              </DialogTitle>
              <DialogDescription className="text-base font-bold">
                Your new product has been registered in the inventory
              </DialogDescription>
            </div>

            <Alert className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <StoreIcon className="h-5 w-5 text-emerald-600" />
              <AlertDescription className="font-bold text-emerald-900 dark:text-emerald-300">
                <div className="flex items-center justify-center gap-2">
                  <span>Location:</span>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black">
                    {storeName}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            <div className="pt-4">
              <Button 
                onClick={() => setSuccessOpen(false)}
                className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-bold shadow-lg"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}