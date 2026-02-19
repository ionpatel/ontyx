'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Circle, ChevronRight, X,
  Building2, Users, Package, FileText, CreditCard,
  Settings, Upload, Sparkles, Rocket
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  isComplete: boolean
  priority: 'required' | 'recommended' | 'optional'
}

export function GettingStartedChecklist() {
  const { organizationId, user, loading: authLoading } = useAuth()
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (!organizationId || authLoading) return

    const checkProgress = async () => {
      setLoading(true)
      const supabase = createClient()

      // Check organization settings
      const { data: org } = await supabase
        .from('organizations')
        .select('name, logo_url, address, phone, email, province')
        .eq('id', organizationId)
        .single()

      const hasCompanyInfo = !!(org?.name && org?.address && org?.phone)

      // Check contacts
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      const hasContacts = (contactCount || 0) > 0

      // Check products
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      const hasProducts = (productCount || 0) > 0

      // Check invoices
      const { count: invoiceCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      const hasInvoices = (invoiceCount || 0) > 0

      // Check bank accounts
      const { count: bankCount } = await supabase
        .from('bank_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      const hasBankAccount = (bankCount || 0) > 0

      // Check team members
      const { count: memberCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      const hasTeam = (memberCount || 0) > 1 // More than just the owner

      // Build checklist
      const checklist: ChecklistItem[] = [
        {
          id: 'company',
          title: 'Complete company profile',
          description: 'Add your business name, address, and logo',
          icon: Building2,
          href: '/settings/company',
          isComplete: hasCompanyInfo,
          priority: 'required',
        },
        {
          id: 'contacts',
          title: 'Add your first customer',
          description: 'Import or create contacts to start invoicing',
          icon: Users,
          href: '/contacts',
          isComplete: hasContacts,
          priority: 'required',
        },
        {
          id: 'products',
          title: 'Set up products or services',
          description: 'Add what you sell to quickly create invoices',
          icon: Package,
          href: '/inventory',
          isComplete: hasProducts,
          priority: 'recommended',
        },
        {
          id: 'invoice',
          title: 'Create your first invoice',
          description: 'Send a professional invoice in minutes',
          icon: FileText,
          href: '/invoices/new',
          isComplete: hasInvoices,
          priority: 'required',
        },
        {
          id: 'bank',
          title: 'Connect a bank account',
          description: 'Track income and expenses automatically',
          icon: CreditCard,
          href: '/banking',
          isComplete: hasBankAccount,
          priority: 'recommended',
        },
        {
          id: 'team',
          title: 'Invite team members',
          description: 'Add employees with role-based access',
          icon: Users,
          href: '/settings/team',
          isComplete: hasTeam,
          priority: 'optional',
        },
      ]

      setItems(checklist)
      setLoading(false)

      // Check if user has dismissed this before (store in localStorage)
      const dismissedKey = `ontyx_getting_started_dismissed_${organizationId}`
      const wasDismissed = localStorage.getItem(dismissedKey)
      
      // Only show if not all required items are complete
      const allRequiredComplete = checklist
        .filter(item => item.priority === 'required')
        .every(item => item.isComplete)
      
      if (wasDismissed === 'true' && allRequiredComplete) {
        setDismissed(true)
      }
    }

    checkProgress()
  }, [organizationId, authLoading])

  const handleDismiss = () => {
    if (organizationId) {
      localStorage.setItem(`ontyx_getting_started_dismissed_${organizationId}`, 'true')
    }
    setDismissed(true)
  }

  const completedCount = items.filter(item => item.isComplete).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const requiredItems = items.filter(item => item.priority === 'required')
  const recommendedItems = items.filter(item => item.priority === 'recommended')
  const optionalItems = items.filter(item => item.priority === 'optional')

  const allRequiredComplete = requiredItems.every(item => item.isComplete)

  if (loading || authLoading || dismissed) return null

  // Don't show if all required items are complete
  if (allRequiredComplete) return null

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Getting Started
                <Badge variant="outline" className="ml-2 text-xs">
                  {completedCount}/{totalCount}
                </Badge>
              </CardTitle>
              <CardDescription>
                Complete these steps to set up your business
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
            {allRequiredComplete && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Setup progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {/* Required Steps */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Required Steps
            </p>
            {requiredItems.map(item => (
              <ChecklistItemRow key={item.id} item={item} />
            ))}
          </div>

          {/* Recommended Steps */}
          {recommendedItems.length > 0 && (
            <div className="space-y-2 mt-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Recommended
              </p>
              {recommendedItems.map(item => (
                <ChecklistItemRow key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* Optional Steps */}
          {optionalItems.length > 0 && !optionalItems.every(i => i.isComplete) && (
            <div className="space-y-2 mt-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Optional
              </p>
              {optionalItems.filter(i => !i.isComplete).map(item => (
                <ChecklistItemRow key={item.id} item={item} />
              ))}
            </div>
          )}

          {/* All Complete Message */}
          {progress === 100 && (
            <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    All set! 🎉
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You're ready to run your business with Ontyx.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg transition-colors group",
        item.isComplete 
          ? "bg-muted/30 hover:bg-muted/50" 
          : "bg-muted/50 hover:bg-muted"
      )}
    >
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
        item.isComplete 
          ? "bg-green-100 dark:bg-green-900/30" 
          : "bg-primary/10"
      )}>
        {item.isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <Icon className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium",
          item.isComplete && "line-through text-muted-foreground"
        )}>
          {item.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {item.description}
        </p>
      </div>
      <ChevronRight className={cn(
        "h-5 w-5 text-muted-foreground transition-transform",
        !item.isComplete && "group-hover:translate-x-1"
      )} />
    </Link>
  )
}
