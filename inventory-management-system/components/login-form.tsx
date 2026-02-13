"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_ENDPOINTS, inventory_base_url } from "@/lib/api-config"

interface LoginResponse {
  data: {
    user: {
      id: string
      email: string
      first_name: string
      last_name: string
      middle_name?: string
      phone?: string
      country?: string
      primary_role: string
      account_type: string
      status: string
      email_verified: boolean
      phone_verified: boolean
      last_login_at?: string
      last_password_change?: string
      failed_login_attempts: number
      two_factor_enabled: boolean
      preferred_language: string
      timezone: string
      created_at: string
      updated_at: string
    }
    access_token: string
    refresh_token: string
    expires_at: number
  }
  message: string
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Login failed: ${response.statusText}`)
      }

      const result: LoginResponse = await response.json()

      // Store auth data in localStorage
      localStorage.setItem("access_token", result.data.access_token)
      localStorage.setItem("refresh_token", result.data.refresh_token)
      localStorage.setItem("user", JSON.stringify(result.data.user))
      localStorage.setItem("expires_at", result.data.expires_at.toString())

      // Check if user is staff and redirect to POS
      if (result.data.user.primary_role === "staff") {
        try {
          const storesResponse = await fetch(`${inventory_base_url}/stores`, {
            headers: {
              "Authorization": `Bearer ${result.data.access_token}`,
              "Content-Type": "application/json",
            },
          })

          if (storesResponse.ok) {
            const storesData = await storesResponse.json()
            
            if (storesData.success && storesData.data && storesData.data.length > 0) {
              const firstStoreId = storesData.data[0].id
              router.push(`/dashboard/stores/${firstStoreId}/pos`)
              return
            }
          }
        } catch (err) {
          console.error("Error fetching stores:", err)
        }
      }

      router.push("/dashboard")
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .form-input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: white;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
        .form-input:focus {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(99, 102, 241, 0.6);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          outline: none;
        }
        .form-input:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .submit-btn {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 4px 20px rgba(99,102,241,0.25);
          transition: all 0.25s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 0 0 1px rgba(99,102,241,0.5), 0 8px 30px rgba(99,102,241,0.4);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .pw-toggle {
          color: rgba(255,255,255,0.25);
          transition: color 0.2s;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .pw-toggle:hover { color: rgba(255,255,255,0.6); }
        .form-label {
          color: rgba(255,255,255,0.5);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* ERROR ALERT */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/8">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {/* EMAIL FIELD */}
        <div className="space-y-2.5">
          <label className="form-label block">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input w-full h-12 rounded-xl px-4 pl-11 text-sm"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </div>

        {/* PASSWORD FIELD */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="form-label">Password</label>
            <span
              className="text-[11px] font-bold text-indigo-400/50 cursor-default select-none"
              title="Contact your administrator to reset your password"
            >
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input w-full h-12 rounded-xl px-4 pl-11 pr-12 text-sm"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="pw-toggle absolute right-4 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword 
                ? <EyeOff className="h-4 w-4" /> 
                : <Eye className="h-4 w-4" />
              }
            </button>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="submit-btn w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* SECURITY NOTE */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="h-px flex-1 bg-white/[0.05]" />
          <p className="text-[11px] text-white/20 font-medium px-3">
            Powered By GROWSOFT
          </p>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>
      </form>
    </>
  )
}