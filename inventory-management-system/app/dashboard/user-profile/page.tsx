"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Clock, 
  Globe, 
  Calendar, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff,
  TrendingUp,
  Award,
  Info,
  X,
  Building2,
  Zap
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { auth_base_url } from "@/lib/api-config"

// --- API Configuration (100% PRESERVED) ---
const API_BASE_URL = auth_base_url
const PROFILE_ENDPOINT = `${API_BASE_URL}/users/profile`
const PASSWORD_ENDPOINT = `${API_BASE_URL}/users/password`

// --- User Profile Interface (100% PRESERVED) ---
interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  middle_name: string
  phone: string
  country: string
  primary_role: string
  account_type: string
  status: string
  email_verified: boolean
  phone_verified: boolean
  last_login_at: string
  last_password_change: string
  failed_login_attempts: number
  two_factor_enabled: boolean
  preferred_language: string
  timezone: string
  created_by: string
  created_at: string
  updated_at: string
}

export default function UserProfilePage() {
  // --- ALL ORIGINAL STATE (100% PRESERVED) ---
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // --- ALL ORIGINAL FUNCTIONS (100% PRESERVED) ---
  const fetchProfile = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found. Please login again.")
      }

      const response = await fetch(PROFILE_ENDPOINT, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(`Failed to fetch profile: ${errorBody.message || response.statusText}`)
      }

      const result = await response.json()
      
      if (result.data) {
        setProfile(result.data)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred while loading profile.")
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordError(null)
    
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found. Please login again.")
      }

      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters long")
      }

      const response = await fetch(PASSWORD_ENDPOINT, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }))
        throw new Error(errorBody.message || "Failed to change password")
      }

      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      
      setTimeout(() => {
        setIsPasswordDialogOpen(false)
        setPasswordSuccess(false)
      }, 2000)
      
    } catch (err) {
      console.error("Error changing password:", err)
      setPasswordError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsPasswordDialogOpen(open)
    if (!open) {
      setCurrentPassword("")
      setNewPassword("")
      setPasswordError(null)
      setPasswordSuccess(false)
      setShowCurrentPassword(false)
      setShowNewPassword(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // --- LOADING STATE (ENHANCED DESIGN) ---
  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-bold animate-pulse text-muted-foreground uppercase tracking-widest">Loading Profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION - Enhanced */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            User Profile
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none font-bold uppercase py-1">
              {profile?.status || 'Active'}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            View and manage your account information
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={isPasswordDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-10 font-bold border-2">
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <DialogHeader className="pt-4">
                <DialogTitle className="text-2xl font-black">Change Password</DialogTitle>
                <DialogDescription className="font-medium">
                  Update your account password. Make sure it's at least 8 characters long.
                </DialogDescription>
              </DialogHeader>
              
              {passwordSuccess ? (
                <Alert className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 border-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription className="text-emerald-800 dark:text-emerald-200 font-bold">
                    Password changed successfully!
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4 mt-4">
                  {passwordError && (
                    <Alert variant="destructive" className="border-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="font-medium">{passwordError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="font-bold">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                        disabled={isChangingPassword}
                        className="pr-10 h-11 border-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="font-bold">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 8 characters)"
                        required
                        minLength={8}
                        disabled={isChangingPassword}
                        className="pr-10 h-11 border-2"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                      disabled={isChangingPassword}
                      className="font-bold border-2"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isChangingPassword} className="font-bold">
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            className="h-10 font-bold border-2"
            onClick={fetchProfile}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ALERTS - Enhanced */}
      {error && (
        <Alert variant="destructive" className="relative border-2 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="pr-8 font-medium">{error}</AlertDescription>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-950"
            onClick={() => setError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {!profile && !error ? (
        <Card className="shadow-2xl border-2">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full w-fit mx-auto mb-6">
                <User className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-black mb-2">Profile Not Found</h3>
              <p className="text-muted-foreground mb-4 font-medium">
                Unable to load profile information
              </p>
              <Button onClick={fetchProfile} className="font-bold">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : profile ? (
        <>
          {/* METRIC CARDS - Enhanced with animations */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Account Status */}
            <Card className="bg-slate-950 border-none shadow-2xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield className="h-20 w-20" />
              </div>
              <CardContent className="pt-6 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-emerald-500/20 p-2 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Account Status</p>
                </div>
                <div className="text-3xl font-black tracking-tighter capitalize">
                  {profile.status}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-500">USER ACCOUNT</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-none font-black">ACTIVE</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Email Verification */}
            <Card className={`border-2 ${profile.email_verified ? 'border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-amber-100 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20'} transition-all`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${profile.email_verified ? 'bg-emerald-500/10' : 'bg-amber-500/10'} p-2 rounded-lg`}>
                    <Mail className={`h-4 w-4 ${profile.email_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-[2px] ${profile.email_verified ? 'text-emerald-600/60 dark:text-emerald-400' : 'text-amber-600/60 dark:text-amber-400'}`}>
                    Email Status
                  </p>
                </div>
                <div className={`text-2xl font-black tracking-tighter ${profile.email_verified ? 'text-emerald-700 dark:text-emerald-500' : 'text-amber-700 dark:text-amber-500'}`}>
                  {profile.email_verified ? 'Verified' : 'Unverified'}
                </div>
                <p className={`text-[9px] mt-4 font-bold uppercase ${profile.email_verified ? 'text-emerald-600/80' : 'text-amber-600/80'}`}>
                  Email Confirmation
                </p>
              </CardContent>
            </Card>

            {/* 2FA Status */}
            <Card className={`border-2 ${profile.two_factor_enabled ? 'border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'} transition-all`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${profile.two_factor_enabled ? 'bg-emerald-500/10' : 'bg-slate-500/10'} p-2 rounded-lg`}>
                    <Shield className={`h-4 w-4 ${profile.two_factor_enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`} />
                  </div>
                  <p className={`text-[10px] font-black uppercase tracking-[2px] ${profile.two_factor_enabled ? 'text-emerald-600/60 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    2FA Security
                  </p>
                </div>
                <div className={`text-3xl font-black tracking-tighter ${profile.two_factor_enabled ? 'text-emerald-700 dark:text-emerald-500' : 'text-foreground'}`}>
                  {profile.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </div>
                <p className={`text-[9px] mt-4 font-bold uppercase ${profile.two_factor_enabled ? 'text-emerald-600/80' : 'text-muted-foreground'}`}>
                  Two-Factor Auth
                </p>
              </CardContent>
            </Card>

            {/* Failed Attempts */}
            <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-red-500/10 p-2 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[2px]">Failed Logins</p>
                </div>
                <div className="text-4xl font-black text-foreground tracking-tighter">
                  {profile.failed_login_attempts}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 font-bold flex items-center gap-1">
                  <Info className="h-3 w-3 text-amber-500" /> Login attempts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* PROFILE CARDS - Enhanced design */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Full Name</label>
                  <p className="text-lg font-black text-foreground mt-1">
                    {profile.first_name} {profile.middle_name && `${profile.middle_name} `}{profile.last_name}
                  </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    Email Address
                  </label>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <p className="text-sm font-bold text-foreground break-all">{profile.email}</p>
                    {profile.email_verified ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 border-2 border-emerald-600 font-bold text-xs shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-2 font-bold text-xs shrink-0">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    Phone Number
                  </label>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <p className="text-sm font-bold text-foreground">{profile.phone}</p>
                    {profile.phone_verified ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 border-2 border-emerald-600 font-bold text-xs shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-2 font-bold text-xs shrink-0">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    Country
                  </label>
                  <p className="text-base font-bold text-foreground mt-1">{profile.country}</p>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Role</label>
                  <p className="text-lg font-black text-foreground mt-1 capitalize">
                    {formatRole(profile.primary_role)}
                  </p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Type</label>
                  <p className="text-base font-bold text-foreground mt-1 capitalize">{profile.account_type}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</label>
                  <div className="mt-2">
                    <Badge 
                      variant={profile.status === 'active' ? "default" : "secondary"} 
                      className={`font-bold text-xs border-2 capitalize ${
                        profile.status === 'active' 
                          ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600' 
                          : 'bg-slate-500 hover:bg-slate-600 border-slate-600'
                      }`}
                    >
                      {profile.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Two-Factor Authentication</label>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <p className="text-sm font-bold text-foreground">{profile.two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
                    {profile.two_factor_enabled ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 border-2 border-emerald-600 font-bold text-xs shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="border-2 font-bold text-xs shrink-0">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Language</label>
                  <p className="text-base font-bold text-foreground mt-1 uppercase">{profile.preferred_language}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Timezone</label>
                  <p className="text-base font-bold text-foreground mt-1">{profile.timezone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Activity Information */}
            <Card className="shadow-2xl border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
                <CardTitle className="flex items-center gap-2 text-xl font-black">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  Activity Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Last Login
                  </label>
                  <p className="text-sm font-bold text-foreground mt-2">{formatDate(profile.last_login_at)}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5" />
                    Last Password Change
                  </label>
                  <p className="text-sm font-bold text-foreground mt-2">{formatDate(profile.last_password_change)}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Created</label>
                  <p className="text-sm font-bold text-foreground mt-2">{formatDate(profile.created_at)}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Last Updated</label>
                  <p className="text-sm font-bold text-foreground mt-2">{formatDate(profile.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FOOTER INFO */}
          <div className="flex justify-center items-center gap-6 py-8 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
              <Shield className="h-3 w-3" />
              Secure Profile
            </div>
            <div className="h-1 w-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
              <Info className="h-3 w-3" />
              Account Management
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}