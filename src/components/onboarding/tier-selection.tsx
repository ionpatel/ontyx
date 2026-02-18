'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Check, Sparkles, Zap, Crown, Building2, Users,
  ChevronRight, ChevronLeft, Star, Shield, Headphones
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

export interface Tier {
  id: 'starter' | 'growth' | 'enterprise'
  name: string
  tagline: string
  price: number | 'custom'
  priceLabel: string
  description: string
  icon: React.ElementType
  color: string
  popular?: boolean
  features: string[]
  limits: {
    users: number | 'unlimited'
    invoices: number | 'unlimited'
    products: number | 'unlimited'
    storage: string
  }
  modules: string[]
}

export const TIERS: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect for solopreneurs',
    price: 0,
    priceLabel: 'Free forever',
    description: 'Everything you need to get started. No credit card required.',
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    features: [
      'Unlimited invoices',
      'Up to 50 contacts',
      'Basic reports',
      'Mobile app access',
      'Email support',
      'Canadian tax rates built-in',
    ],
    limits: {
      users: 1,
      invoices: 'unlimited',
      products: 50,
      storage: '1 GB',
    },
    modules: ['invoices', 'contacts', 'expenses', 'reports'],
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For growing teams',
    price: 29,
    priceLabel: '$29/month',
    description: 'Advanced features for businesses ready to scale.',
    icon: Sparkles,
    color: 'from-blue-500 to-indigo-500',
    popular: true,
    features: [
      'Everything in Starter',
      'Up to 5 team members',
      'Point of Sale (POS)',
      'Inventory management',
      'Recurring invoices',
      'Custom invoice templates',
      'Priority support',
      'API access',
    ],
    limits: {
      users: 5,
      invoices: 'unlimited',
      products: 500,
      storage: '10 GB',
    },
    modules: ['invoices', 'contacts', 'expenses', 'reports', 'pos', 'inventory', 'projects'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For established businesses',
    price: 'custom',
    priceLabel: 'Custom pricing',
    description: 'Full power for complex operations. Dedicated support.',
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Everything in Growth',
      'Unlimited team members',
      'Multi-location support',
      'Advanced manufacturing',
      'Custom workflows',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom integrations',
      'On-premise option',
    ],
    limits: {
      users: 'unlimited',
      invoices: 'unlimited',
      products: 'unlimited',
      storage: 'unlimited',
    },
    modules: ['invoices', 'contacts', 'expenses', 'reports', 'pos', 'inventory', 'projects', 'manufacturing', 'employees', 'payroll', 'appointments'],
  },
]

// ============================================================================
// TIER RECOMMENDATIONS
// ============================================================================

export function getRecommendedTier(businessSize: string, businessType: string): Tier['id'] {
  // Enterprise for medium+ businesses or manufacturing
  if (businessSize === 'medium' || businessType === 'manufacturing') {
    return 'enterprise'
  }
  
  // Growth for small teams or retail/food (need POS)
  if (businessSize === 'small' || ['retail', 'food'].includes(businessType)) {
    return 'growth'
  }
  
  // Starter for solo operators
  return 'starter'
}

// ============================================================================
// TIER SELECTION COMPONENT
// ============================================================================

interface TierSelectionProps {
  businessSize: string
  businessType: string
  selectedTier: Tier['id'] | null
  onSelect: (tierId: Tier['id']) => void
  onNext: () => void
  onBack: () => void
}

export function TierSelection({
  businessSize,
  businessType,
  selectedTier,
  onSelect,
  onNext,
  onBack,
}: TierSelectionProps) {
  const recommendedTierId = getRecommendedTier(businessSize, businessType)
  const [selected, setSelected] = useState<Tier['id'] | null>(selectedTier || recommendedTierId)

  const handleSelect = (tierId: Tier['id']) => {
    setSelected(tierId)
    onSelect(tierId)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
        <p className="text-muted-foreground text-lg">
          Start free, upgrade when you're ready. No commitments.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
        {TIERS.map((tier) => {
          const isSelected = selected === tier.id
          const isRecommended = recommendedTierId === tier.id
          const TierIcon = tier.icon

          return (
            <motion.div
              key={tier.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-200 relative overflow-hidden h-full",
                  isSelected 
                    ? "ring-2 ring-primary shadow-xl" 
                    : "hover:shadow-lg",
                  tier.popular && "border-primary"
                )}
                onClick={() => handleSelect(tier.id)}
              >
                {/* Popular badge */}
                {tier.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Recommended badge */}
                {isRecommended && !tier.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge variant="secondary" className="rounded-none rounded-bl-lg">
                      Recommended
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                    "bg-gradient-to-br text-white",
                    tier.color
                  )}>
                    <TierIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.tagline}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div>
                    {tier.price === 'custom' ? (
                      <span className="text-2xl font-bold">Contact us</span>
                    ) : tier.price === 0 ? (
                      <span className="text-3xl font-bold text-green-600">Free</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">${tier.price}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {tier.description}
                    </p>
                  </div>

                  {/* Limits */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{tier.limits.users === 'unlimited' ? '∞' : tier.limits.users} users</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{tier.limits.storage}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {tier.features.slice(0, 5).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {tier.features.length > 5 && (
                      <li className="text-sm text-muted-foreground pl-6">
                        +{tier.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(tier.id)
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Selected
                      </>
                    ) : (
                      `Choose ${tier.name}`
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Secure payments</span>
        </div>
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4" />
          <span>Canadian support</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span>Cancel anytime</span>
        </div>
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
          Continue with {selected ? TIERS.find(t => t.id === selected)?.name : ''}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
