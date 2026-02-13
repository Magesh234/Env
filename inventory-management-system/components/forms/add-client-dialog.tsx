"use client"

import type React from "react"
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
import { 
  Plus, 
  Loader2, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  DollarSign,
  CheckCircle2,
  AlertCircle,
  User,
  Sparkles
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { inventory_base_url } from "@/lib/api-config"

// --- API Configuration ---
const API_BASE_URL = inventory_base_url
const CLIENTS_ENDPOINT = `${API_BASE_URL}/clients`

// New Client Payload Structure
interface NewClientPayload {
    client_type: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    credit_limit: number;
}

interface AddClientDialogProps {
  onClientAdded?: () => void
  trigger?: React.ReactNode
}

export function AddClientDialog({ onClientAdded, trigger }: AddClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const initialFormData: Omit<NewClientPayload, 'credit_limit'> & { credit_limit: string } = {
    client_type: "individual",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    credit_limit: "",
  }
  const [formData, setFormData] = useState(initialFormData)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setFormError(null)

    // Construct the payload, ensuring credit_limit is a number
    const payload: NewClientPayload = {
      ...formData,
      credit_limit: parseFloat(formData.credit_limit) || 0,
    }

    try {
      // Get the access token from storage
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found. Cannot create client.")
      }

      const response = await fetch(CLIENTS_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Client creation failed: ${errorBody.message || response.statusText}`)
      }

      // Success
      console.log("Client created successfully.")
      setFormData(initialFormData)
      setOpen(false)
      onClientAdded?.()

    } catch (err) {
      console.error("Error creating client:", err)
      setFormError(err instanceof Error ? err.message : "An unexpected error occurred during client creation.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData({ ...formData, [id]: value })
  }

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, client_type: value })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="h-11 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-hidden flex flex-col border-none shadow-2xl">
        {/* PREMIUM HEADER */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        
        <DialogHeader className="pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <div>
              <DialogTitle className="text-3xl font-black flex items-center gap-2">
                Add New Customer
                <Badge variant="secondary" className="text-[9px] bg-blue-500/10 text-blue-600 border-none font-black uppercase">
                  Client
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                Register Customer & Set Credit Terms
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* ERROR ALERT */}
          {formError && (
            <Alert className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="font-bold text-red-900 dark:text-red-300">
                {formError}
              </AlertDescription>
            </Alert>
          )}

          {/* CLIENT TYPE SECTION */}
          <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-black">Client Type</h3>
            </div>

            <div className="space-y-3">
              <Label htmlFor="client_type" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Account Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.client_type}
                onValueChange={handleSelectChange}
                required
              >
                <SelectTrigger className="h-12 border-2 font-bold">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual" className="font-bold">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      Individual Customer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PERSONAL INFORMATION SECTION */}
          <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-black">Personal Information</h3>
            </div>

            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="first_name" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="Brian"
                  required
                  className="h-12 border-2 font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="last_name" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Otieno"
                  required
                  className="h-12 border-2 font-bold"
                />
              </div>
            </div>
          </div>

          {/* CONTACT INFORMATION SECTION */}
          <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-black">Contact Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Phone */}
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+254711223344"
                  required
                  className="h-12 border-2 font-bold"
                />
              </div>

              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="brian.otieno@example.com"
                  required
                  className="h-12 border-2 font-bold"
                />
              </div>
            </div>
          </div>

          {/* LOCATION INFORMATION SECTION */}
          <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-black">Location Information</h3>
            </div>

            {/* Address and City */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="address" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Kilimani"
                  className="h-12 border-2 font-bold"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="city" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Nairobi"
                  className="h-12 border-2 font-bold"
                />
              </div>
            </div>
          </div>

          {/* CREDIT SETTINGS SECTION */}
          <div className="p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-black">Credit Terms</h3>
            </div>

            <div className="space-y-3">
              <Label htmlFor="credit_limit" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
                Maximum Credit Limit (TZS) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="credit_limit"
                type="text"
                inputMode="numeric"
                value={formData.credit_limit}
                onChange={handleInputChange}
                placeholder="50000"
                required
                className="h-12 border-2 font-bold text-base"
              />
              <Alert className="border-2 border-amber-200 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-950/30">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs font-bold text-amber-900 dark:text-amber-300">
                  Maximum amount this customer can owe at any time. Set to 0 for cash-only customers.
                </AlertDescription>
              </Alert>
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
              disabled={isSubmitting}
              className="h-12 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 font-bold shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Customer...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Create Customer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}