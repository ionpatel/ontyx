'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Lock, Sparkles, Zap, ArrowRight, Check, 
  Crown, Rocket, Building2, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog'
import { PlanTier, FeatureKey, getMinimumPlan, PLAN_FEATURES } from '@/lib/plan-features'

interface UpgradePromptProps {
  feature: FeatureKey
  currentTier: PlanTier
  onClose?: () => void
  isModal?: boolean
}

const PLAN_DETAILS: Record<PlanTier, {
  name: string
  price: number
  icon: React.ElementType
  color: string
  description: string
  highlight: string
}> = {
  starter: {
    name: 'Starter',
    price: 29,
    icon: Zap,
    color: 'text-blue-600',
    description: 'Everything you need to get started',
    highlight: 'Unlimited users',
  },
  growth: {
    name: 'Professional',
    price: 49,
    icon: Rocket,
    color: 'text-purple-600',
    description: 'Complete business operating system',
    highlight: 'Most popular',
  },
  enterprise: {
    name: 'Enterprise',
    price: 199,
    icon: Crown,
    color: 'text-amber-600',
    description: 'For scaling organizations',
    highlight: 'White-label available',
  },
}

const FEATURE_NAMES: Partial<Record<FeatureKey, { name: string; description: string }>> = {
  pos: { 
    name: 'Point of Sale', 
    description: 'In-store sales, Interac payments, receipt printing' 
  },
  crm: { 
    name: 'CRM & Sales Pipeline', 
    description: 'Lead tracking, deal management, sales forecasting' 
  },
  projects: { 
    name: 'Project Management', 
    description: 'Tasks, milestones, time tracking, billing' 
  },
  payroll: { 
    name: 'Canadian Payroll', 
    description: 'CPP, EI, T4 generation, direct deposit' 
  },
  appointments: { 
    name: 'Appointment Scheduling', 
    description: 'Online booking, reminders, calendar sync' 
  },
  helpdesk: { 
    name: 'Help Desk & Tickets', 
    description: 'Customer support, ticket tracking, SLAs' 
  },
  manufacturing: { 
    name: 'Manufacturing', 
    description: 'BOMs, work orders, MRP planning' 
  },
  field_service: { 
    name: 'Field Service', 
    description: 'Dispatch, GPS routing, mobile app' 
  },
  purchases: { 
    name: 'Purchase Orders', 
    description: 'Vendor management, receiving, AP' 
  },
  multi_warehouse: { 
    name: 'Multi-Warehouse', 
    description: 'Multiple locations, transfers, stock levels' 
  },
  multi_currency: { 
    name: 'Multi-Currency', 
    description: 'USD, EUR, automatic exchange rates' 
  },
  api_access: { 
    name: 'API Access', 
    description: 'REST API, webhooks, integrations' 
  },
  ai_insights: { 
    name: 'AI Insights', 
    description: 'Predictive analytics, anomaly detection' 
  },
}

export function UpgradePrompt({ feature, currentTier, onClose, isModal = false }: UpgradePromptProps) {
  const router = useRouter()
  const requiredTier = getMinimumPlan(feature)
  const planDetails = PLAN_DETAILS[requiredTier]
  const featureInfo = FEATURE_NAMES[feature]
  const PlanIcon = planDetails.icon

  const content = (
    <div className="space-y-6">
      {/* Feature Lock Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">
            {featureInfo?.name || 'This Feature'} Requires an Upgrade
          </h2>
          <p className="text-muted-foreground mt-1">
            {featureInfo?.description || 'This feature is not available on your current plan.'}
          </p>
        </div>
      </div>

      {/* Upgrade Card */}
      <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlanIcon className={`h-6 w-6 ${planDetails.color}`} />
              <CardTitle>{planDetails.name} Plan</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {planDetails.highlight}
            </Badge>
          </div>
          <CardDescription>{planDetails.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pricing */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${planDetails.price}</span>
            <span className="text-muted-foreground">/month</span>
            <Badge variant="outline" className="ml-2">Flat rate • No per-user fees</Badge>
          </div>

          {/* Key Features */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Includes:</p>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_FEATURES[requiredTier].slice(0, 8).map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value Props */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span><strong>All apps included</strong> — no per-module pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span><strong>Built for Canada</strong> — GST/HST, CPP/EI, T4s, ROE included</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span><strong>No setup fees</strong> — unlimited support & free hosting</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" className="flex-1" asChild>
          <Link href="/settings/billing">
            <Rocket className="mr-2 h-4 w-4" />
            Upgrade to {planDetails.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="flex-1"
          onClick={() => onClose ? onClose() : router.push('/dashboard')}
        >
          Maybe Later
        </Button>
      </div>

      {/* Trust Badge */}
      <p className="text-center text-xs text-muted-foreground">
        🇨🇦 Trusted by 10,000+ Canadian businesses • 14-day free trial • Cancel anytime
      </p>
    </div>
  )

  if (isModal) {
    return (
      <Dialog open onOpenChange={() => onClose?.()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="sr-only">
            <DialogTitle>Upgrade Required</DialogTitle>
            <DialogDescription>This feature requires a plan upgrade.</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {content}
      </div>
    </div>
  )
}

// Full page version for route blocking
export function UpgradeRequiredPage({ 
  feature, 
  currentTier 
}: { 
  feature: FeatureKey
  currentTier: PlanTier 
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-lg w-full">
        <UpgradePrompt feature={feature} currentTier={currentTier} />
      </div>
    </div>
  )
}
