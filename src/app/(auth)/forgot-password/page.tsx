"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [error, setError] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    // Simulate API call - in production this would call Supabase
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
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
            {!submitted ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
                  <p className="text-text-secondary mt-2">
                    Enter your email address and we'll send you a link to reset your password.
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
                    <label className="text-sm font-medium">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                      <Input 
                        type="email" 
                        placeholder="you@company.com" 
                        className="pl-10 h-11"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Send Reset Link
                  </Button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="h-12 w-12 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <h2 className="text-xl font-bold mb-2">Check your email</h2>
                <p className="text-text-secondary mb-6">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-text-muted">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="text-primary hover:underline"
                  >
                    try again
                  </button>
                </p>
              </div>
            )}

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
