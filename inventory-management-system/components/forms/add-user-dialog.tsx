"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Loader2, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  UserPlus,
  Mail,
  Phone,
  Shield,
  User,
  Sparkles,
  Lock,
  Info
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { API_ENDPOINTS, getAuthHeaders } from "@/lib/api-config"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated?: () => void
}

interface CreateUserResponse {
  message: string
  note: string
  temporary_password: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    phone: string
    primary_role: string
    status: string
  }
}

export function AddUserDialog({ open, onOpenChange, onUserCreated }: AddUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<CreateUserResponse | null>(null)
  const [passwordCopied, setPasswordCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "staff"
  })

  // Debug logging
  useEffect(() => {
    console.log('Dialog open:', open)
    console.log('Success data:', successData)
  }, [open, successData])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleCopyPassword = async () => {
    if (successData?.temporary_password) {
      try {
        await navigator.clipboard.writeText(successData.temporary_password)
        setPasswordCopied(true)
        setTimeout(() => setPasswordCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy password:', err)
      }
    }
  }

  const handleClose = () => {
    const hadSuccessData = !!successData
    
    // Reset all state
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "staff"
    })
    setError(null)
    setSuccessData(null)
    setPasswordCopied(false)
    setIsLoading(false)
    
    // Close the dialog
    onOpenChange(false)
    
    // Call onUserCreated AFTER closing if we had success
    if (hadSuccessData && onUserCreated) {
      // Use setTimeout to ensure this happens after the dialog closes
      setTimeout(() => {
        onUserCreated()
      }, 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log('Submitting form data:', formData)
      
      const response = await fetch(API_ENDPOINTS.users.create, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Failed to create user')
      }

      const data: CreateUserResponse = await response.json()
      console.log('Success response:', data)
      
      // Set success data - this should trigger the view change
      setSuccessData(data)
      console.log('Success data set, should show password view now')
      
    } catch (err) {
      console.error('Request error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't allow dialog to close while loading
  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      if (!newOpen) {
        handleClose()
      }
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600'
      case 'manager':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'staff':
        return 'bg-green-500 hover:bg-green-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-hidden flex flex-col border-none shadow-2xl">
        {!successData ? (
          <>
            {/* PREMIUM HEADER - FORM VIEW */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            
            <DialogHeader className="pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-3 rounded-xl shadow-lg">
                  <UserPlus className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black flex items-center gap-2">
                    Add New User
                    <Badge variant="secondary" className="text-[9px] bg-violet-500/10 text-violet-600 border-none font-black uppercase">
                      Staff
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                    Create Account & Set Permissions
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              {/* ERROR ALERT */}
              {error && (
                <Alert className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="font-bold text-red-900 dark:text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* PERSONAL INFORMATION SECTION */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-black">Personal Information</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="first_name" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="first_name"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      required
                      disabled={isLoading}
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
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 border-2 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* CONTACT INFORMATION SECTION */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-black">Contact Details</h3>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 border-2 font-bold"
                  />
                  <p className="text-xs text-muted-foreground font-medium">Used for login and notifications</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254722334455"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-12 border-2 font-bold"
                  />
                </div>
              </div>

              {/* ROLE & PERMISSIONS SECTION */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-black">Role & Permissions</h3>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="role" className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    User Role <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange('role', value)}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-12 border-2 font-bold">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff" className="font-bold">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-500" />
                          Staff Member
                        </div>
                      </SelectItem>
                      <SelectItem value="manager" className="font-bold">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          Manager
                        </div>
                      </SelectItem>
                      <SelectItem value="admin" className="font-bold">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          Administrator
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Alert className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-xs font-bold text-blue-900 dark:text-blue-300">
                      <div className="space-y-1">
                        <div><strong>Staff:</strong> Basic access to sales and inventory</div>
                        <div><strong>Manager:</strong> Full store management access</div>
                        <div><strong>Admin:</strong> Complete system access & user management</div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 pt-6 border-t-2 border-slate-200 dark:border-slate-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isLoading}
                  className="h-12 px-6 font-bold border-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-12 px-8 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 font-bold shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Create User Account
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* PREMIUM HEADER - SUCCESS VIEW */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500" />
            
            <DialogHeader className="pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    User Created Successfully!
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase tracking-widest">
                    Secure Credentials Generated
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              {/* SUCCESS MESSAGE */}
              <Alert className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="font-bold text-emerald-900 dark:text-emerald-300">
                  {successData.message}
                </AlertDescription>
              </Alert>

              {/* USER DETAILS SECTION */}
              <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-black">Account Details</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Full Name:</span>
                    <span className="font-black text-base">{successData.user.first_name} {successData.user.last_name}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Email:</span>
                    <span className="font-bold text-sm">{successData.user.email}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Phone:</span>
                    <span className="font-bold text-sm">{successData.user.phone}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Role:</span>
                    <Badge className={`${getRoleBadgeColor(successData.user.primary_role)} text-white border-none font-black`}>
                      {successData.user.primary_role.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Status:</span>
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-black">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {successData.user.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* TEMPORARY PASSWORD SECTION */}
              <div className="p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-2 rounded-lg">
                    <Lock className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-amber-900 dark:text-amber-300">Temporary Password</h3>
                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-none font-black text-[9px]">
                    CONFIDENTIAL
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 border-2 border-amber-300 dark:border-amber-700 rounded-lg text-xl font-mono font-black text-amber-900 dark:text-amber-300 tracking-wider">
                      {successData.temporary_password}
                    </code>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      onClick={handleCopyPassword}
                      className="shrink-0 h-14 px-6 border-2 font-bold"
                    >
                      {passwordCopied ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Alert className="border-2 border-amber-200 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-950/30">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      {successData.note}
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {/* SECURITY NOTICE */}
              <Alert className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="font-bold text-red-900 dark:text-red-300">
                  <div className="space-y-2">
                    <div className="font-black text-sm">⚠️ Important Security Notice</div>
                    <Separator className="bg-red-200 dark:bg-red-800" />
                    <ul className="text-xs space-y-1 ml-4 list-disc">
                      <li>Share this password securely with the user (encrypted message, in person)</li>
                      <li>User can log in immediately with this temporary password</li>
                      <li>Encourage the user to change their password on first login</li>
                      <li>Do not share passwords via unsecured channels (SMS, email, chat)</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            <div className="px-6 pb-6">
              <Button 
                onClick={handleClose} 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-bold shadow-lg"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}