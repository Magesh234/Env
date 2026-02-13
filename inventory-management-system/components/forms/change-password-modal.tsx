import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { auth_base_url } from "@/lib/api-config"

// API Configuration
const PASSWORD_ENDPOINT = `${auth_base_url}/users/password`

interface ChangePasswordModalProps {
  trigger?: React.ReactNode
  onPasswordChanged?: () => void
}

export default function ChangePasswordModal({ trigger, onPasswordChanged }: ChangePasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Function to handle password change
  const handlePasswordChange = async () => {
    setIsChangingPassword(true)
    setPasswordError(null)
    
    try {
      const token = sessionStorage.getItem("access_token") || localStorage.getItem("access_token")
      
      if (!token) {
        throw new Error("Authentication error: No access token found. Please login again.")
      }

      // Validate password length
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

      // Success
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      
      // Call callback if provided
      if (onPasswordChanged) {
        onPasswordChanged()
      }
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setIsOpen(false)
        setPasswordSuccess(false)
      }, 2000)
      
    } catch (err) {
      console.error("Error changing password:", err)
      setPasswordError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setCurrentPassword("")
      setNewPassword("")
      setPasswordError(null)
      setPasswordSuccess(false)
      setShowCurrentPassword(false)
      setShowNewPassword(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Update your account password. Make sure it's at least 8 characters long.
          </DialogDescription>
        </DialogHeader>
        
        {passwordSuccess ? (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Password changed successfully!
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 mt-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={isChangingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 8 characters)"
                  disabled={isChangingPassword}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordChange} 
                disabled={isChangingPassword || !currentPassword || !newPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}