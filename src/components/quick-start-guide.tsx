'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Check, ChevronRight, Building2, Users, FileText, 
  Package, CreditCard, Settings, Sparkles, ArrowRight, Database
} from 'lucide-react'
import { SampleDataLoader } from './sample-data-loader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  action: string
}

const STEPS: Step[] = [
  {
    id: 'company',
    title: 'Set up your company',
    description: 'Add your business name, logo, and address',
    icon: Building2,
    href: '/settings',
    action: 'Go to Settings',
  },
  {
    id: 'contact',
    title: 'Add your first contact',
    description: 'Create a customer or vendor to get started',
    icon: Users,
    href: '/contacts/new',
    action: 'Add Contact',
  },
  {
    id: 'product',
    title: 'Add products or services',
    description: 'Set up your inventory or service offerings',
    icon: Package,
    href: '/inventory/new',
    action: 'Add Item',
  },
  {
    id: 'invoice',
    title: 'Create your first invoice',
    description: 'Send a professional invoice to a customer',
    icon: FileText,
    href: '/invoices/new',
    action: 'Create Invoice',
  },
  {
    id: 'payment',
    title: 'Set up payments',
    description: 'Configure how you want to accept payments',
    icon: CreditCard,
    href: '/settings/billing',
    action: 'Configure',
  },
]

interface QuickStartGuideProps {
  completedSteps?: string[]
  onComplete?: (stepId: string) => void
  onDismiss?: () => void
  className?: string
}

export function QuickStartGuide({
  completedSteps = [],
  onComplete,
  onDismiss,
  className,
}: QuickStartGuideProps) {
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(true)

  // Check local storage for dismissed state
  useEffect(() => {
    const isDismissed = localStorage.getItem('quick-start-dismissed')
    if (isDismissed) setDismissed(true)
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('quick-start-dismissed', 'true')
    onDismiss?.()
  }

  const completedCount = completedSteps.length
  const progress = (completedCount / STEPS.length) * 100

  // Don't show if dismissed or all steps complete
  if (dismissed || completedCount === STEPS.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={className}
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Getting Started</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {completedCount} of {STEPS.length} steps complete
                </p>
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
          <Progress value={progress} className="h-2 mt-3" />
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-2 pb-4">
                <div className="space-y-2">
                  {STEPS.map((step, index) => {
                    const isCompleted = completedSteps.includes(step.id)
                    const isNext = !isCompleted && 
                      completedSteps.length === index

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-lg transition-colors",
                          isCompleted ? "bg-green-50 dark:bg-green-950/20" : 
                          isNext ? "bg-primary/5" : "bg-muted/50",
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          isCompleted ? "bg-green-500" : 
                          isNext ? "bg-primary" : "bg-muted"
                        )}>
                          {isCompleted ? (
                            <Check className="h-4 w-4 text-white" />
                          ) : (
                            <step.icon className={cn(
                              "h-4 w-4",
                              isNext ? "text-primary-foreground" : "text-muted-foreground"
                            )} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium text-sm",
                            isCompleted && "line-through text-muted-foreground"
                          )}>
                            {step.title}
                          </p>
                          {!isCompleted && (
                            <p className="text-xs text-muted-foreground truncate">
                              {step.description}
                            </p>
                          )}
                        </div>
                        {!isCompleted && (
                          <Button 
                            variant={isNext ? "default" : "outline"} 
                            size="sm"
                            asChild
                          >
                            <Link href={step.href}>
                              {step.action}
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Sample Data Option */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-dashed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Want to explore first?</p>
                        <p className="text-xs text-muted-foreground">Load sample data to see how everything works</p>
                      </div>
                    </div>
                    <SampleDataLoader 
                      trigger={
                        <Button variant="outline" size="sm">
                          Load Samples
                        </Button>
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    You can always access this from Settings
                  </p>
                  <Button variant="link" size="sm" onClick={handleDismiss}>
                    Skip for now <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}

// Compact version for sidebar
export function QuickStartBadge({ 
  completedSteps = [] 
}: { 
  completedSteps: string[] 
}) {
  const remaining = STEPS.length - completedSteps.length

  if (remaining === 0) return null

  return (
    <Link href="/settings">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          {remaining} step{remaining !== 1 ? 's' : ''} left
        </span>
      </div>
    </Link>
  )
}
