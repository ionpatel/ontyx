"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { 
  Wrench, Building2, ShoppingBag, Utensils, Briefcase, Factory,
  ChevronRight, ChevronLeft, Check, Sparkles, Users, Home,
  Truck, Stethoscope, Laptop, Palette, Hammer, Zap, Store,
  Package, FileText, Receipt, BarChart3, Clock, UserCircle,
  Settings, ArrowRight, Loader2, Crown
} from "lucide-react"
import { TierSelection, TIERS, getRecommendedTier } from "@/components/onboarding/tier-selection"
import { BusinessNeeds, calculateRecommendations } from "@/components/onboarding/business-needs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// ============================================================================
// BUSINESS TYPES & DATA
// ============================================================================

interface BusinessType {
  id: string
  name: string
  icon: React.ElementType
  description: string
  color: string
  subtypes: { id: string; name: string; icon: React.ElementType }[]
}

const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "trades",
    name: "Trades & Services",
    icon: Wrench,
    description: "Plumbing, electrical, HVAC, construction",
    color: "from-orange-500 to-amber-500",
    subtypes: [
      { id: "plumbing", name: "Plumbing", icon: Wrench },
      { id: "electrical", name: "Electrical", icon: Zap },
      { id: "hvac", name: "HVAC", icon: Settings },
      { id: "construction", name: "Construction", icon: Hammer },
      { id: "landscaping", name: "Landscaping", icon: Home },
      { id: "cleaning", name: "Cleaning", icon: Sparkles },
      { id: "other_trade", name: "Other Trade", icon: Wrench },
    ],
  },
  {
    id: "retail",
    name: "Retail & E-commerce",
    icon: ShoppingBag,
    description: "Stores, online shops, boutiques",
    color: "from-purple-500 to-pink-500",
    subtypes: [
      { id: "clothing", name: "Clothing & Fashion", icon: ShoppingBag },
      { id: "electronics", name: "Electronics", icon: Laptop },
      { id: "grocery", name: "Grocery & Food", icon: Store },
      { id: "home_goods", name: "Home & Garden", icon: Home },
      { id: "specialty", name: "Specialty Shop", icon: Package },
      { id: "online", name: "Online Only", icon: ShoppingBag },
    ],
  },
  {
    id: "food",
    name: "Food & Hospitality",
    icon: Utensils,
    description: "Restaurants, cafes, catering",
    color: "from-red-500 to-orange-500",
    subtypes: [
      { id: "restaurant", name: "Restaurant", icon: Utensils },
      { id: "cafe", name: "Café & Bakery", icon: Utensils },
      { id: "catering", name: "Catering", icon: Truck },
      { id: "food_truck", name: "Food Truck", icon: Truck },
      { id: "bar", name: "Bar & Lounge", icon: Utensils },
    ],
  },
  {
    id: "professional",
    name: "Professional Services",
    icon: Briefcase,
    description: "Consulting, legal, accounting, agencies",
    color: "from-blue-500 to-cyan-500",
    subtypes: [
      { id: "consulting", name: "Consulting", icon: Briefcase },
      { id: "legal", name: "Legal", icon: FileText },
      { id: "accounting", name: "Accounting", icon: Receipt },
      { id: "marketing", name: "Marketing Agency", icon: Palette },
      { id: "it_services", name: "IT Services", icon: Laptop },
      { id: "real_estate", name: "Real Estate", icon: Building2 },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare & Wellness",
    icon: Stethoscope,
    description: "Clinics, pharmacies, wellness centers",
    color: "from-green-500 to-teal-500",
    subtypes: [
      { id: "clinic", name: "Medical Clinic", icon: Stethoscope },
      { id: "pharmacy", name: "Pharmacy", icon: Package },
      { id: "dental", name: "Dental Practice", icon: Stethoscope },
      { id: "wellness", name: "Wellness & Spa", icon: Sparkles },
      { id: "fitness", name: "Fitness & Gym", icon: Users },
    ],
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Distribution",
    icon: Factory,
    description: "Production, wholesale, logistics",
    color: "from-slate-500 to-zinc-600",
    subtypes: [
      { id: "manufacturing", name: "Manufacturing", icon: Factory },
      { id: "wholesale", name: "Wholesale", icon: Package },
      { id: "distribution", name: "Distribution", icon: Truck },
      { id: "import_export", name: "Import/Export", icon: Building2 },
    ],
  },
]

const SIZE_OPTIONS = [
  { 
    id: "solo", 
    name: "Solo / Freelancer", 
    description: "Just me, keeping it simple",
    employees: "1",
    icon: UserCircle,
  },
  { 
    id: "small", 
    name: "Small Team", 
    description: "2-10 people, growing steadily",
    employees: "2-10",
    icon: Users,
  },
  { 
    id: "medium", 
    name: "Medium Business", 
    description: "10-50 employees, multiple departments",
    employees: "10-50",
    icon: Building2,
  },
]

// Module recommendations based on business type
const MODULE_RECOMMENDATIONS: Record<string, string[]> = {
  trades: ["invoices", "contacts", "projects", "appointments", "expenses"],
  retail: ["pos", "inventory", "invoices", "contacts", "reports"],
  food: ["pos", "inventory", "employees", "payroll", "reports"],
  professional: ["invoices", "projects", "contacts", "documents", "time-tracking"],
  healthcare: ["appointments", "contacts", "invoices", "inventory", "documents"],
  manufacturing: ["inventory", "manufacturing", "purchases", "quality", "reports"],
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

interface StepProps {
  onNext: () => void
  onBack?: () => void
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

interface OnboardingData {
  businessName: string
  businessType: string
  businessSubtype: string
  businessSize: string
  province: string
  enabledModules: string[]
  needsAnswers: Record<string, string | string[]>
  selectedTier: 'starter' | 'growth' | 'enterprise' | null
}

// Step 1: Welcome & Business Type
function StepBusinessType({ onNext, data, updateData }: StepProps) {
  const [selected, setSelected] = useState(data.businessType)

  const handleSelect = (typeId: string) => {
    setSelected(typeId)
    updateData({ businessType: typeId })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Ontyx</h1>
        <p className="text-muted-foreground text-lg">
          Let's set up your workspace. What type of business are you running?
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BUSINESS_TYPES.map((type) => (
          <motion.div
            key={type.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200 overflow-hidden",
                selected === type.id 
                  ? "ring-2 ring-primary shadow-lg" 
                  : "hover:shadow-md"
              )}
              onClick={() => handleSelect(type.id)}
            >
              <CardContent className="p-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  "bg-gradient-to-br text-white",
                  type.color
                )}>
                  <type.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">{type.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
                {selected === type.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3"
                  >
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!selected}
          className="min-w-[200px]"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 2: Business Subtype
function StepSubtype({ onNext, onBack, data, updateData }: StepProps) {
  const [selected, setSelected] = useState(data.businessSubtype)
  const businessType = BUSINESS_TYPES.find(t => t.id === data.businessType)

  if (!businessType) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
          "bg-gradient-to-br text-white",
          businessType.color
        )}>
          <businessType.icon className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{businessType.name}</h1>
        <p className="text-muted-foreground text-lg">
          What's your specialty?
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto">
        {businessType.subtypes.map((subtype) => (
          <motion.div
            key={subtype.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200",
                selected === subtype.id 
                  ? "ring-2 ring-primary shadow-lg bg-primary/5" 
                  : "hover:shadow-md"
              )}
              onClick={() => {
                setSelected(subtype.id)
                updateData({ businessSubtype: subtype.id })
              }}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <subtype.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="font-medium">{subtype.name}</span>
                {selected === subtype.id && (
                  <Check className="h-5 w-5 text-primary ml-auto" />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          disabled={!selected}
          className="min-w-[200px]"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 3: Business Size
function StepSize({ onNext, onBack, data, updateData }: StepProps) {
  const [selected, setSelected] = useState(data.businessSize)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">How big is your team?</h1>
        <p className="text-muted-foreground text-lg">
          We'll customize your experience based on your size
        </p>
      </div>

      <div className="grid gap-4 max-w-2xl mx-auto">
        {SIZE_OPTIONS.map((size) => (
          <motion.div
            key={size.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200",
                selected === size.id 
                  ? "ring-2 ring-primary shadow-lg" 
                  : "hover:shadow-md"
              )}
              onClick={() => {
                setSelected(size.id)
                updateData({ businessSize: size.id })
              }}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                  <size.icon className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{size.name}</h3>
                  <p className="text-sm text-muted-foreground">{size.description}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {size.employees} {size.employees === "1" ? "person" : "people"}
                </Badge>
                {selected === size.id && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={onNext}
          disabled={!selected}
          className="min-w-[200px]"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 4: Business Details
function StepDetails({ onNext, onBack, data, updateData }: StepProps) {
  const [businessName, setBusinessName] = useState(data.businessName)
  const [province, setProvince] = useState(data.province || "ON")

  const provinces = [
    { code: "ON", name: "Ontario" },
    { code: "QC", name: "Quebec" },
    { code: "BC", name: "British Columbia" },
    { code: "AB", name: "Alberta" },
    { code: "MB", name: "Manitoba" },
    { code: "SK", name: "Saskatchewan" },
    { code: "NS", name: "Nova Scotia" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland & Labrador" },
    { code: "PE", name: "Prince Edward Island" },
  ]

  const handleContinue = () => {
    updateData({ businessName, province })
    onNext()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Almost there!</h1>
        <p className="text-muted-foreground text-lg">
          Just a few details to personalize your workspace
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-base">Business Name</Label>
          <Input
            id="businessName"
            placeholder="e.g., Smith Plumbing Inc."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="h-12 text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="province" className="text-base">Province</Label>
          <select
            id="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full h-12 px-3 text-lg rounded-md border border-input bg-background"
          >
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">
            We'll set up your tax rates automatically
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!businessName.trim()}
          className="min-w-[200px]"
        >
          Continue
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// Step 7: Module Preview & Completion
function StepComplete({ onBack, data, updateData }: StepProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const businessType = BUSINESS_TYPES.find(t => t.id === data.businessType)
  const selectedTierInfo = TIERS.find(t => t.id === data.selectedTier)

  const allModules = [
    { id: "invoices", name: "Invoices", icon: FileText },
    { id: "expenses", name: "Expenses", icon: Receipt },
    { id: "contacts", name: "Contacts", icon: Users },
    { id: "inventory", name: "Inventory", icon: Package },
    { id: "pos", name: "Point of Sale", icon: Store },
    { id: "projects", name: "Projects", icon: Briefcase },
    { id: "appointments", name: "Appointments", icon: Clock },
    { id: "employees", name: "Employees", icon: Users },
    { id: "payroll", name: "Payroll", icon: Receipt },
    { id: "reports", name: "Reports", icon: BarChart3 },
    { id: "manufacturing", name: "Manufacturing", icon: Factory },
  ]

  // Use modules from selected tier or data
  const [enabledModules, setEnabledModules] = useState<string[]>(
    data.enabledModules.length > 0 ? data.enabledModules : selectedTierInfo?.modules || []
  )

  const toggleModule = (moduleId: string) => {
    setEnabledModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Call API route which uses service role to bypass RLS
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: data.businessName,
          businessType: data.businessType,
          businessSubtype: data.businessSubtype,
          businessSize: data.businessSize,
          province: data.province,
          enabledModules: enabledModules,
          tier: data.selectedTier || 'starter'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("API error:", result)
        setError(result.error || "Failed to save settings. Please try again.")
        setLoading(false)
        return
      }

      // Clear any cached org data to force refresh
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ontyx_org_id')
        localStorage.removeItem('ontyx_profile_cache')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error("Error completing onboarding:", err)
      setError("An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">You're all set!</h1>
        <p className="text-muted-foreground text-lg">
          Here's what we've prepared for <strong>{data.businessName}</strong>
        </p>
      </div>

      {/* Summary Card */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br text-white",
              businessType?.color
            )}>
              {businessType && <businessType.icon className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{businessType?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {businessType?.subtypes.find(s => s.id === data.businessSubtype)?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {SIZE_OPTIONS.find(s => s.id === data.businessSize)?.name}
              </Badge>
              {selectedTierInfo && (
                <Badge className={cn(
                  "bg-gradient-to-r text-white",
                  selectedTierInfo.color
                )}>
                  {selectedTierInfo.icon && <selectedTierInfo.icon className="h-3 w-3 mr-1" />}
                  {selectedTierInfo.name}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Selection */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="font-semibold text-center">
          Your {selectedTierInfo?.name} modules (tap to toggle)
        </h3>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {allModules.map((module) => {
            const isEnabled = enabledModules.includes(module.id)
            const isInTier = selectedTierInfo?.modules.includes(module.id)
            return (
              <motion.div
                key={module.id}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all",
                    isEnabled ? "ring-2 ring-primary bg-primary/5" : "opacity-60",
                    !isInTier && "opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => isInTier && toggleModule(module.id)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isEnabled ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <module.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium flex-1">{module.name}</span>
                    {!isInTier && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Upgrade
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          You can always change these later in Settings
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="max-w-md mx-auto p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={onBack} disabled={loading}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleComplete}
          disabled={loading || enabledModules.length === 0}
          className="min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              Launch Ontyx
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN ONBOARDING PAGE
// ============================================================================

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<OnboardingData>({
    businessName: "",
    businessType: "",
    businessSubtype: "",
    businessSize: "",
    province: "ON",
    enabledModules: [],
    needsAnswers: {},
    selectedTier: null,
  })

  const totalSteps = 7
  const progress = (step / totalSteps) * 100

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const stepProps: StepProps = {
    onNext: () => setStep(s => Math.min(s + 1, totalSteps)),
    onBack: () => setStep(s => Math.max(s - 1, 1)),
    data,
    updateData,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Ontyx"
              width={32}
              height={32}
              className="dark:invert"
            />
            <span className="font-semibold text-lg">Ontyx</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 pt-24 pb-12 min-h-screen flex items-center">
        <div className="w-full max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && <StepBusinessType key="type" {...stepProps} />}
            {step === 2 && <StepSubtype key="subtype" {...stepProps} />}
            {step === 3 && <StepSize key="size" {...stepProps} />}
            {step === 4 && <StepDetails key="details" {...stepProps} />}
            {step === 5 && (
              <BusinessNeeds
                key="needs"
                businessType={data.businessType}
                answers={data.needsAnswers}
                onAnswer={(questionId, answer) => {
                  updateData({
                    needsAnswers: { ...data.needsAnswers, [questionId]: answer }
                  })
                }}
                onNext={() => {
                  // Calculate recommendations and move to tier selection
                  const { modules, tier } = calculateRecommendations(data.needsAnswers)
                  updateData({ 
                    enabledModules: modules,
                    selectedTier: tier,
                  })
                  setStep(6)
                }}
                onBack={() => setStep(4)}
              />
            )}
            {step === 6 && (
              <TierSelection
                key="tier"
                businessSize={data.businessSize}
                businessType={data.businessType}
                selectedTier={data.selectedTier}
                onSelect={(tierId) => {
                  const tier = TIERS.find(t => t.id === tierId)
                  if (tier) {
                    updateData({ 
                      selectedTier: tierId,
                      enabledModules: tier.modules,
                    })
                  }
                }}
                onNext={() => setStep(7)}
                onBack={() => setStep(5)}
              />
            )}
            {step === 7 && <StepComplete key="complete" {...stepProps} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
