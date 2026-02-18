'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Sparkles, Zap, Crown, X, ArrowRight, 
  Check, Star, Rocket, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ============================================================================
// TIER UPGRADE BANNER
// ============================================================================

interface TierUpgradeBannerProps {
  currentTier: 'starter' | 'growth' | 'enterprise'
  usage?: {
    users: { current: number; limit: number }
    products: { current: number; limit: number }
    storage: { current: number; limit: number } // in MB
  }
  onDismiss?: () => void
  className?: string
}

const tierConfig = {
  starter: {
    name: 'Starter',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    nextTier: 'Growth',
    benefits: [
      'Point of Sale for in-person sales',
      'Inventory management',
      'Up to 5 team members',
      'Recurring invoices',
    ],
  },
  growth: {
    name: 'Growth',
    icon: Sparkles,
    color: 'from-blue-500 to-indigo-500',
    nextTier: 'Enterprise',
    benefits: [
      'Unlimited team members',
      'Multi-location support',
      'Manufacturing features',
      'Dedicated support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    nextTier: null,
    benefits: [],
  },
}

export function TierUpgradeBanner({
  currentTier,
  usage,
  onDismiss,
  className,
}: TierUpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const config = tierConfig[currentTier]
  
  // Don't show for enterprise
  if (currentTier === 'enterprise' || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // Check if near limits
  const isNearLimit = usage && (
    (usage.users.current / usage.users.limit > 0.8) ||
    (usage.products.current / usage.products.limit > 0.8) ||
    (usage.storage.current / usage.storage.limit > 0.8)
  )

  return (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-gradient-to-r",
      currentTier === 'starter' ? "from-blue-50 to-indigo-50 border-blue-200" : "from-purple-50 to-pink-50 border-purple-200",
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              "bg-gradient-to-br text-white",
              config.color
            )}>
              <config.icon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {config.name} Plan
                </Badge>
                {isNearLimit && (
                  <Badge variant="destructive" className="text-xs">
                    Near Limits
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg">
                Upgrade to {config.nextTier} for more power
              </h3>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {config.benefits.slice(0, 3).map((benefit, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-green-500" />
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/settings/billing">
                Upgrade
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Usage indicators */}
        {usage && isNearLimit && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <UsageIndicator
              label="Team Members"
              current={usage.users.current}
              limit={usage.users.limit}
            />
            <UsageIndicator
              label="Products"
              current={usage.products.current}
              limit={usage.products.limit}
            />
            <UsageIndicator
              label="Storage"
              current={usage.storage.current}
              limit={usage.storage.limit}
              unit="MB"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UsageIndicator({
  label,
  current,
  limit,
  unit = '',
}: {
  label: string
  current: number
  limit: number
  unit?: string
}) {
  const percentage = Math.min((current / limit) * 100, 100)
  const isHigh = percentage > 80

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", isHigh && "text-amber-600")}>
          {current}{unit} / {limit}{unit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={cn("h-1.5", isHigh && "[&>div]:bg-amber-500")}
      />
    </div>
  )
}

// ============================================================================
// TIER FEATURES CARD
// ============================================================================

interface TierFeaturesCardProps {
  tier: 'starter' | 'growth' | 'enterprise'
  className?: string
}

export function TierFeaturesCard({ tier, className }: TierFeaturesCardProps) {
  const features = {
    starter: [
      { icon: Check, label: 'Unlimited invoices', available: true },
      { icon: Check, label: 'Basic reports', available: true },
      { icon: Check, label: 'Mobile access', available: true },
      { icon: X, label: 'Point of Sale', available: false },
      { icon: X, label: 'Inventory', available: false },
      { icon: X, label: 'Team members', available: false },
    ],
    growth: [
      { icon: Check, label: 'Everything in Starter', available: true },
      { icon: Check, label: 'Point of Sale', available: true },
      { icon: Check, label: 'Inventory (500 items)', available: true },
      { icon: Check, label: 'Up to 5 team members', available: true },
      { icon: X, label: 'Manufacturing', available: false },
      { icon: X, label: 'Multi-location', available: false },
    ],
    enterprise: [
      { icon: Check, label: 'Everything in Growth', available: true },
      { icon: Check, label: 'Unlimited everything', available: true },
      { icon: Check, label: 'Manufacturing', available: true },
      { icon: Check, label: 'Multi-location', available: true },
      { icon: Check, label: 'Custom integrations', available: true },
      { icon: Check, label: 'Dedicated support', available: true },
    ],
  }

  const config = tierConfig[tier]
  const tierFeatures = features[tier]

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-gradient-to-br text-white",
            config.color
          )}>
            <config.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{config.name} Plan</h3>
            <p className="text-xs text-muted-foreground">Your current plan</p>
          </div>
        </div>
        <div className="space-y-2">
          {tierFeatures.map((feature, i) => (
            <div 
              key={i} 
              className={cn(
                "flex items-center gap-2 text-sm",
                !feature.available && "text-muted-foreground"
              )}
            >
              <feature.icon className={cn(
                "h-4 w-4",
                feature.available ? "text-green-500" : "text-muted-foreground/50"
              )} />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
        {tier !== 'enterprise' && (
          <Button variant="outline" size="sm" className="w-full mt-4" asChild>
            <Link href="/settings/billing">
              <Rocket className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// WELCOME HERO FOR NEW USERS
// ============================================================================

interface WelcomeHeroProps {
  businessName: string
  tier: 'starter' | 'growth' | 'enterprise'
  onDismiss?: () => void
}

export function WelcomeHero({ businessName, tier, onDismiss }: WelcomeHeroProps) {
  const config = tierConfig[tier]

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <Badge className={cn("bg-gradient-to-r text-white", config.color)}>
                {config.name}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">
              Welcome to Ontyx, {businessName}!
            </h1>
            <p className="text-muted-foreground max-w-md">
              Your workspace is ready. Start by creating your first invoice or explore the features we've set up for you.
            </p>
            <div className="flex gap-3 pt-2">
              <Button asChild>
                <Link href="/invoices/new">
                  Create Invoice
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/settings">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Customize
                </Link>
              </Button>
            </div>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="icon" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
