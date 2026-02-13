"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Mail, 
  Lock, 
  Key, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  Eye, 
  EyeOff,
  ArrowLeft,
  Info,
  Building2
} from "lucide-react"
import { API_ENDPOINTS } from "@/lib/api-config"

interface ResetCredentials {
  email: string
  verification_code: string
  temporary_password: string
  expires_at: string
}

export default function PasswordResetPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [resetCredentials, setResetCredentials] = useState<ResetCredentials | null>(null)
  const [showTempPassword, setShowTempPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<any>(null)
  const [loadingInstructions, setLoadingInstructions] = useState(true)

  // Fetch instructions on component mount
  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.auth.resetInstructions}`)
        if (response.ok) {
          const data = await response.json()
          setInstructions(data)
        }
      } catch (err) {
        console.error("Failed to fetch instructions:", err)
      } finally {
        setLoadingInstructions(false)
      }
    }
    fetchInstructions()
  }, [])

  const handleInitiateReset = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.auth.initiateReset, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to initiate reset: ${response.statusText}`)
      }

      const result = await response.json()
      
      setResetCredentials(result.data)
      setShowModal(true)
    } catch (err) {
      console.error("Reset initiation error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueToReset = () => {
    if (resetCredentials) {
      setVerificationCode(resetCredentials.verification_code)
      setTemporaryPassword(resetCredentials.temporary_password)
    }
    setShowModal(false)
    setStep(2)
  }

  const handleCompleteReset = async () => {
    if (!verificationCode || !temporaryPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.auth.completeReset, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          verification_code: verificationCode,
          temporary_password: temporaryPassword,
          new_password: newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to reset password: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setStep(3)
      }
    } catch (err) {
      console.error("Password reset error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getExpiryTime = () => {
    if (!resetCredentials) return ""
    const expiryDate = new Date(resetCredentials.expires_at)
    return expiryDate.toLocaleTimeString()
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action()
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Credentials Modal */}
      {showModal && resetCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg border-2 border-orange-500 shadow-2xl animate-in fade-in zoom-in duration-300">
            <CardHeader className="bg-orange-50 border-b border-orange-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-orange-900">Save These Credentials!</CardTitle>
                  <CardDescription className="text-orange-700 font-medium">
                    You'll need them to reset your password
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <Alert className="bg-amber-50 border-amber-300">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 font-medium">
                  These credentials expire in 15 minutes and will NOT be shown again!
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {/* Verification Code */}
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <Label className="text-xs text-slate-600 mb-2 block">Verification Code</Label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-2xl font-bold tracking-widest text-slate-900 flex-1">
                      {resetCredentials.verification_code}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(resetCredentials.verification_code, "code")}
                      className="shrink-0"
                    >
                      {copiedField === "code" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Temporary Password */}
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <Label className="text-xs text-slate-600 mb-2 block">Temporary Password</Label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-xl font-bold tracking-wide text-slate-900 flex-1">
                      {resetCredentials.temporary_password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(resetCredentials.temporary_password, "password")}
                      className="shrink-0"
                    >
                      {copiedField === "password" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expiry Info */}
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Info className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Expires at: <strong>{getExpiryTime()}</strong></span>
                </div>
              </div>

              <Button 
                onClick={handleContinueToReset}
                className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                I've Saved These - Continue to Reset
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Left side - Branding & Instructions */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">IMS</h2>
              <p className="text-sm text-muted-foreground">Inventory Management</p>
            </div>
          </div>

          {/* Main heading */}
          <div className="space-y-6 max-w-md mb-8">
            <h1 className="text-4xl font-bold leading-tight text-balance">Password Reset</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Secure your account with a new password. Follow the steps to reset your credentials safely.
            </p>
          </div>

          {/* Instructions */}
          {instructions && (
            <div className="space-y-4 max-w-md">
              {/* Important Notes */}
              {instructions.notes && instructions.notes.length > 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <p className="font-semibold mb-2">Important:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {instructions.notes.map((note: string, index: number) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Steps */}
              <div className="space-y-4">
                {instructions.steps && instructions.steps.map((step: any, index: number) => (
                  <div key={index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{step.step}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{step.action}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {step.description}
                      </p>
                      {step.warning && (
                        <p className="text-orange-600 text-xs mt-1 font-medium">
                          ⚠ {step.warning}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingInstructions && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading instructions...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-sm text-muted-foreground">© 2025 IMS. All rights reserved.</div>
      </div>

      {/* Right side - Reset Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">IMS</h2>
              <p className="text-xs text-muted-foreground">Inventory Management</p>
            </div>
          </div>

          {/* Main Card */}
          <Card className="border-border shadow-xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-3">
                {step > 1 && step < 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                    className="shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold">
                    {step === 1 && "Reset Password"}
                    {step === 2 && "Create New Password"}
                    {step === 3 && "Success!"}
                  </CardTitle>
                  <CardDescription>
                    {step === 1 && "Enter your email to receive reset credentials"}
                    {step === 2 && "Enter your credentials and new password"}
                    {step === 3 && "Your password has been reset successfully"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Step 1: Email Input */}
              {step === 1 && (
                <div className="space-y-5">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleInitiateReset)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleInitiateReset}
                    className="w-full h-11 text-base font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Reset Credentials...
                      </>
                    ) : (
                      "Send Reset Credentials"
                    )}
                  </Button>

                  <div className="pt-4 border-t text-center">
                    <Button
                      variant="link"
                      onClick={() => router.push("/")}
                      className="text-sm"
                    >
                      Back to Login
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Reset Password Form */}
              {step === 2 && (
                <div className="space-y-5">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                      Enter the verification code and temporary password you received
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="verification-code" className="text-sm font-medium">
                      Verification Code (6 digits)
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="pl-10 tracking-widest font-mono"
                        maxLength={6}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temp-password" className="text-sm font-medium">
                      Temporary Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="temp-password"
                        type={showTempPassword ? "text" : "password"}
                        placeholder="Enter temporary password"
                        value={temporaryPassword}
                        onChange={(e) => setTemporaryPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowTempPassword(!showTempPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showTempPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, handleCompleteReset)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleCompleteReset}
                    className="w-full h-11 text-base font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <div className="space-y-6 text-center py-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900">
                      Password Reset Successful!
                    </h3>
                    <p className="text-slate-600">
                      You can now login with your new password
                    </p>
                  </div>

                  <Button 
                    onClick={() => router.push("/")}
                    className="w-full h-11 text-base font-medium"
                  >
                    Continue to Login
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile Instructions */}
          {step === 1 && instructions && (
            <div className="lg:hidden mt-6">
              <details className="group">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground inline-flex items-center gap-2 mb-4">
                  <Info className="h-4 w-4" />
                  {instructions.title}
                </summary>
                <div className="mt-4 p-5 bg-white rounded-lg border text-left space-y-4 text-sm shadow-sm">
                  {/* Important Notes */}
                  {instructions.notes && instructions.notes.length > 0 && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <p className="font-semibold mb-2">Important:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {instructions.notes.map((note: string, index: number) => (
                            <li key={index}>{note}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Steps */}
                  {instructions.steps && instructions.steps.map((step: any, index: number) => (
                    <div key={index} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{step.step}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{step.action}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {step.description}
                        </p>
                        {step.warning && (
                          <p className="text-orange-600 text-xs mt-1 font-medium">
                            ⚠ {step.warning}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}