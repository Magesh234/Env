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
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Loader2, 
  CheckCircle2,
  Truck,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Sparkles
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { inventory_base_url } from "@/lib/api-config"

interface AddSupplierDialogProps {
  onSupplierAdded?: () => void
  trigger?: React.ReactNode
}

export function AddSupplierDialog({ onSupplierAdded, trigger }: AddSupplierDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    supplier_name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem("access_token")

      if (!token) throw new Error("No access token found. Please login again.")

      const payload = {
        supplier_name: formData.supplier_name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      }

      const response = await fetch(`${inventory_base_url}/suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create supplier")
      }

      // ✅ Show toast
      toast({
        title: "Success",
        description: data.message || "Supplier created successfully",
      })

      // ✅ Show success modal
      setSuccessModal(true)

      // Reset form
      setFormData({
        supplier_name: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
      })

      setOpen(false)
      onSupplierAdded?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create supplier"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="h-11 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-hidden flex flex-col border-none shadow-2xl">
          {/* PREMIUM HEADER */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500" />
          
          <DialogHeader className="pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-3 rounded-xl shadow-lg">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black flex items-center gap-2">
                  Add New Supplier
                  <Badge variant="secondary" className="text-[9px] bg-cyan-500/10 text-cyan-600 border-none font-black uppercase">
                    Vendor
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                  Register Supplier & Contact Information
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            {/* SUPPLIER INFORMATION SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Supplier Information</h3>
              </div>

              <div className="space-y-3">
                <Label htmlFor="supplier_name" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Supplier Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="e.g., Acme Corporation, Global Supplies Ltd"
                  required
                  disabled={isSubmitting}
                  className="h-12 border-2 font-bold text-base"
                />
                <p className="text-xs text-muted-foreground font-medium">Official company or business name</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="contact_person" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Contact Person
                </Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="e.g., John Doe, Sales Manager"
                  disabled={isSubmitting}
                  className="h-12 border-2 font-bold"
                />
                <p className="text-xs text-muted-foreground font-medium">Primary contact at the supplier</p>
              </div>
            </div>

            {/* CONTACT DETAILS SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Contact Details</h3>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider">
                  Optional
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@acme.com"
                    disabled={isSubmitting}
                    className="h-12 border-2 font-bold"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0123"
                    disabled={isSubmitting}
                    className="h-12 border-2 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* LOCATION SECTION */}
            <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-black">Location Information</h3>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider">
                  Optional
                </Badge>
              </div>

              <div className="space-y-3">
                <Label htmlFor="address" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Business Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., 123 Main Street, Suite 100, City, State/Province, Country, ZIP/Postal Code"
                  rows={4}
                  disabled={isSubmitting}
                  className="border-2 font-medium resize-none"
                />
                <p className="text-xs text-muted-foreground font-medium">Complete physical or mailing address</p>
              </div>
            </div>

            {/* INFO ALERT */}
            <Alert className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <AlertDescription className="font-bold text-blue-900 dark:text-blue-300">
                <div className="space-y-1">
                  <div className="text-sm">💡 Tip: Complete supplier information helps with:</div>
                  <Separator className="my-2 bg-blue-200 dark:bg-blue-800" />
                  <ul className="text-xs space-y-1 ml-4 list-disc">
                    <li>Faster communication and order processing</li>
                    <li>Better tracking of supplier relationships</li>
                    <li>Organized purchase records and invoices</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

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
                type="submit" 
                disabled={isSubmitting}
                className="h-12 px-8 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 font-bold shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Supplier...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Create Supplier
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ SUCCESS MODAL - PREMIUM VERSION */}
      <Dialog open={successModal} onOpenChange={setSuccessModal}>
        <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
          
          <div className="text-center pt-8 pb-6 space-y-6">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-full shadow-lg">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                Supplier Created Successfully!
              </DialogTitle>
              <DialogDescription className="text-base font-bold">
                The new supplier has been added to your system
              </DialogDescription>
            </div>

            <Alert className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <Truck className="h-5 w-5 text-emerald-600" />
              <AlertDescription className="font-bold text-emerald-900 dark:text-emerald-300">
                <div className="flex items-center justify-center gap-2">
                  <span>Supplier is now available for purchase orders</span>
                </div>
              </AlertDescription>
            </Alert>

            <div className="pt-4">
              <Button 
                onClick={() => setSuccessModal(false)}
                className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-bold shadow-lg w-full"
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