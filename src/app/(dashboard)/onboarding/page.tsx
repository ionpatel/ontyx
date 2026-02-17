"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Building2, User, CreditCard, CheckCircle, 
  ArrowRight, ArrowLeft, Loader2, Upload, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useOrganization } from "@/hooks/use-organization"
import { useToast } from "@/components/ui/toast"

const PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
]

const INDUSTRIES = [
  'Retail',
  'Professional Services',
  'Healthcare',
  'Construction',
  'Manufacturing',
  'Food & Beverage',
  'Technology',
  'Real Estate',
  'Transportation',
  'Agriculture',
  'Other',
]

interface OnboardingData {
  // Step 1: Business Info
  businessName: string
  industry: string
  businessType: string
  
  // Step 2: Address
  addressLine1: string
  addressLine2: string
  city: string
  province: string
  postalCode: string
  phone: string
  email: string
  website: string
  
  // Step 3: Tax Info
  gstNumber: string
  pstNumber: string
  fiscalYearEnd: string
  
  // Step 4: Preferences
  currency: string
  timezone: string
  dateFormat: string
}

const STEPS = [
  { id: 1, title: 'Business Info', icon: Building2 },
  { id: 2, title: 'Address', icon: User },
  { id: 3, title: 'Tax Setup', icon: CreditCard },
  { id: 4, title: 'Complete', icon: CheckCircle },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { organizationId } = useAuth()
  const { organization, updateOrganization, loading: orgLoading } = useOrganization()
  const { success, error: showError } = useToast()
  
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    businessName: '',
    industry: '',
    businessType: 'sole_proprietorship',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: 'ON',
    postalCode: '',
    phone: '',
    email: '',
    website: '',
    gstNumber: '',
    pstNumber: '',
    fiscalYearEnd: '12',
    currency: 'CAD',
    timezone: 'America/Toronto',
    dateFormat: 'YYYY-MM-DD',
  })

  // Pre-fill from existing org data
  useEffect(() => {
    if (organization) {
      setData(prev => ({
        ...prev,
        businessName: organization.name || prev.businessName,
        addressLine1: organization.addressLine1 || prev.addressLine1,
        city: organization.city || prev.city,
        province: organization.province || prev.province,
        postalCode: organization.postalCode || prev.postalCode,
        phone: organization.phone || prev.phone,
        email: organization.email || prev.email,
        website: organization.website || prev.website,
        gstNumber: organization.taxNumber || prev.gstNumber,
      }))
    }
  }, [organization])

  const updateField = (field: keyof OnboardingData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const progress = (step / STEPS.length) * 100

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.businessName.trim().length > 0
      case 2:
        return data.city.trim().length > 0 && data.province.length > 0
      case 3:
        return true // Tax info is optional
      default:
        return true
    }
  }

  const handleNext = async () => {
    if (step < STEPS.length) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    
    try {
      // Save organization data
      const orgData = {
        name: data.businessName,
        industry: data.industry,
        businessType: data.businessType,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        website: data.website,
        taxNumber: data.gstNumber,
        pstNumber: data.pstNumber,
        fiscalYearEnd: data.fiscalYearEnd,
        currency: data.currency,
        timezone: data.timezone,
        onboardingComplete: true,
      }
      
      await updateOrganization(orgData)
      
      success('Welcome to Ontyx! 🎉', 'Your business is all set up')
      router.push('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      showError('Setup Failed', 'Please try again')
    } finally {
      setSaving(false)
    }
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Ontyx</h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your business in a few quick steps
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s) => {
              const Icon = s.icon
              const isActive = step === s.id
              const isComplete = step > s.id
              return (
                <div 
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2",
                    isActive && "text-primary font-medium",
                    isComplete && "text-green-600",
                    !isActive && !isComplete && "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                    isActive && "bg-primary text-primary-foreground",
                    isComplete && "bg-green-600 text-white",
                    !isActive && !isComplete && "bg-muted"
                  )}>
                    {isComplete ? <CheckCircle className="h-4 w-4" /> : s.id}
                  </div>
                  <span className="hidden sm:inline text-sm">{s.title}</span>
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Tell us about your business"}
              {step === 2 && "Business address"}
              {step === 3 && "Tax information"}
              {step === 4 && "You're all set!"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "This information will appear on your invoices"}
              {step === 2 && "Where is your business located?"}
              {step === 3 && "For Canadian tax compliance (GST/HST)"}
              {step === 4 && "Your business is ready to go"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Business Info */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Acme Corporation"
                    value={data.businessName}
                    onChange={(e) => updateField('businessName', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={data.industry}
                      onValueChange={(v) => updateField('industry', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map(ind => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select
                      value={data.businessType}
                      onValueChange={(v) => updateField('businessType', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                        <SelectItem value="nonprofit">Non-Profit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Address */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Street Address</Label>
                  <Input
                    id="addressLine1"
                    placeholder="123 Main Street"
                    value={data.addressLine1}
                    onChange={(e) => updateField('addressLine1', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Suite / Unit (Optional)</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Suite 100"
                    value={data.addressLine2}
                    onChange={(e) => updateField('addressLine2', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Toronto"
                      value={data.city}
                      onChange={(e) => updateField('city', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Select
                      value={data.province}
                      onValueChange={(v) => updateField('province', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map(p => (
                          <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="M5V 1A1"
                      value={data.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(416) 555-0123"
                      value={data.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="hello@acme.ca"
                      value={data.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Tax Info */}
            {step === 3 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    💡 If you're registered for GST/HST, enter your business number below. 
                    This will appear on your invoices and help with tax reporting.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST/HST Number</Label>
                  <Input
                    id="gstNumber"
                    placeholder="123456789 RT0001"
                    value={data.gstNumber}
                    onChange={(e) => updateField('gstNumber', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your 15-character CRA business number (e.g., 123456789 RT0001)
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pstNumber">PST Number (if applicable)</Label>
                    <Input
                      id="pstNumber"
                      placeholder="PST-1234-5678"
                      value={data.pstNumber}
                      onChange={(e) => updateField('pstNumber', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscalYearEnd">Fiscal Year End</Label>
                    <Select
                      value={data.fiscalYearEnd}
                      onValueChange={(v) => updateField('fiscalYearEnd', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">January</SelectItem>
                        <SelectItem value="2">February</SelectItem>
                        <SelectItem value="3">March</SelectItem>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="5">May</SelectItem>
                        <SelectItem value="6">June</SelectItem>
                        <SelectItem value="7">July</SelectItem>
                        <SelectItem value="8">August</SelectItem>
                        <SelectItem value="9">September</SelectItem>
                        <SelectItem value="10">October</SelectItem>
                        <SelectItem value="11">November</SelectItem>
                        <SelectItem value="12">December</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Complete */}
            {step === 4 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {data.businessName || 'Your business'} is ready!
                </h3>
                <p className="text-muted-foreground mb-6">
                  You can now create invoices, track expenses, run payroll, and more.
                </p>
                <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Create invoices</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Track expenses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Run payroll</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Generate reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Canadian tax compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">T4 & ROE generation</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          {step < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Get Started
            </Button>
          )}
        </div>

        {/* Skip */}
        {step < STEPS.length && (
          <div className="text-center mt-4">
            <Button 
              variant="link" 
              className="text-muted-foreground"
              onClick={() => router.push('/dashboard')}
            >
              Skip for now
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
