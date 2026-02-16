"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState("")

  const passwordStrength = React.useMemo(() => {
    if (!password) return null
    if (password.length < 6) return { label: "Too short", color: "bg-error", width: "33%" }
    if (password.length < 8) return { label: "Weak", color: "bg-warning", width: "50%" }
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { label: "Strong", color: "bg-success", width: "100%" }
    }
    return { label: "Medium", color: "bg-warning", width: "66%" }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    
    setLoading(true)
    
    // Simulate API call - in production this would call Supabase
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <Image 
            src="/logo.png" 
            alt="Ontyx" 
            width={40} 
            height={40}
            className="rounded-lg"
          />
          <span className="text-xl font-bold tracking-tight">Ontyx</span>
        </Link>

        <Card>
          <CardContent className="pt-6">
            {!success ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
                  <p className="text-text-secondary mt-2">
                    Your new password must be at least 8 characters long.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-error-light text-error text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password" 
                        className="pl-10 pr-10 h-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordStrength && (
                      <div className="flex items-center gap-2">
                        <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength.color} transition-all`}
                            style={{ width: passwordStrength.width }}
                          />
                        </div>
                        <span className="text-xs text-text-muted">{passwordStrength.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password" 
                        className="pl-10 pr-10 h-11"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-error">Passwords do not match</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    disabled={loading || password !== confirmPassword}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Reset Password
                  </Button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="h-12 w-12 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <h2 className="text-xl font-bold mb-2">Password updated!</h2>
                <p className="text-text-secondary mb-6">
                  Your password has been successfully reset. You'll be redirected to the login page shortly.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
