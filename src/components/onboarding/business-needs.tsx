'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronRight, ChevronLeft, Check, HelpCircle,
  FileText, ShoppingCart, Package, Users, Clock,
  CreditCard, BarChart3, Truck, Factory, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// NEEDS QUESTIONNAIRE
// ============================================================================

interface NeedQuestion {
  id: string
  question: string
  description: string
  icon: React.ElementType
  options: {
    id: string
    label: string
    description?: string
    suggestsModules: string[]
    suggestsTier?: 'starter' | 'growth' | 'enterprise'
  }[]
  multiple?: boolean
}

const NEED_QUESTIONS: NeedQuestion[] = [
  {
    id: 'invoicing',
    question: 'How do you invoice customers?',
    description: 'We\'ll set up the right invoicing workflow for you',
    icon: FileText,
    options: [
      { 
        id: 'simple', 
        label: 'Simple invoices', 
        description: 'One-off invoices, manual tracking',
        suggestsModules: ['invoices'],
      },
      { 
        id: 'recurring', 
        label: 'Recurring invoices', 
        description: 'Subscriptions, retainers, memberships',
        suggestsModules: ['invoices'],
        suggestsTier: 'growth',
      },
      { 
        id: 'complex', 
        label: 'Complex billing', 
        description: 'Multiple currencies, progress billing, deposits',
        suggestsModules: ['invoices', 'projects'],
        suggestsTier: 'enterprise',
      },
    ],
  },
  {
    id: 'sales',
    question: 'How do you make sales?',
    description: 'We\'ll configure your sales channels',
    icon: ShoppingCart,
    multiple: true,
    options: [
      { 
        id: 'inperson', 
        label: 'In-person / At location', 
        description: 'Retail store, service location',
        suggestsModules: ['pos'],
        suggestsTier: 'growth',
      },
      { 
        id: 'quotes', 
        label: 'Quotes & Estimates', 
        description: 'Send quotes, convert to invoices',
        suggestsModules: ['invoices'],
      },
      { 
        id: 'online', 
        label: 'Online orders', 
        description: 'E-commerce, online bookings',
        suggestsModules: ['inventory', 'appointments'],
        suggestsTier: 'growth',
      },
      { 
        id: 'wholesale', 
        label: 'Wholesale / B2B', 
        description: 'Bulk orders, net terms',
        suggestsModules: ['inventory', 'contacts'],
        suggestsTier: 'enterprise',
      },
    ],
  },
  {
    id: 'inventory',
    question: 'Do you manage inventory?',
    description: 'Track products, stock levels, and costs',
    icon: Package,
    options: [
      { 
        id: 'no', 
        label: 'No inventory', 
        description: 'I sell services only',
        suggestsModules: [],
      },
      { 
        id: 'simple', 
        label: 'Simple tracking', 
        description: 'Under 100 products, single location',
        suggestsModules: ['inventory'],
      },
      { 
        id: 'multi', 
        label: 'Multiple locations', 
        description: 'Warehouses, transfers, reorder alerts',
        suggestsModules: ['inventory'],
        suggestsTier: 'growth',
      },
      { 
        id: 'manufacturing', 
        label: 'We manufacture', 
        description: 'Bill of materials, work orders',
        suggestsModules: ['inventory', 'manufacturing'],
        suggestsTier: 'enterprise',
      },
    ],
  },
  {
    id: 'team',
    question: 'How do you manage your team?',
    description: 'Set up employee and payroll features',
    icon: Users,
    options: [
      { 
        id: 'solo', 
        label: 'Just me', 
        description: 'No employees to manage',
        suggestsModules: [],
      },
      { 
        id: 'small', 
        label: 'Small team', 
        description: 'Track time, basic scheduling',
        suggestsModules: ['employees'],
        suggestsTier: 'growth',
      },
      { 
        id: 'payroll', 
        label: 'Need payroll', 
        description: 'Calculate pay, deductions, T4s',
        suggestsModules: ['employees', 'payroll'],
        suggestsTier: 'enterprise',
      },
    ],
  },
  {
    id: 'scheduling',
    question: 'Do you schedule appointments?',
    description: 'Calendar and booking features',
    icon: Calendar,
    options: [
      { 
        id: 'no', 
        label: 'No scheduling needed', 
        suggestsModules: [],
      },
      { 
        id: 'internal', 
        label: 'Internal scheduling', 
        description: 'Track my own calendar',
        suggestsModules: ['appointments'],
      },
      { 
        id: 'booking', 
        label: 'Customer bookings', 
        description: 'Online booking, reminders',
        suggestsModules: ['appointments'],
        suggestsTier: 'growth',
      },
    ],
  },
]

// ============================================================================
// COMPONENT
// ============================================================================

interface BusinessNeedsProps {
  businessType: string
  answers: Record<string, string | string[]>
  onAnswer: (questionId: string, answer: string | string[]) => void
  onNext: () => void
  onBack: () => void
}

export function BusinessNeeds({
  businessType,
  answers,
  onAnswer,
  onNext,
  onBack,
}: BusinessNeedsProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  
  // Filter questions relevant to business type
  const relevantQuestions = NEED_QUESTIONS.filter(q => {
    // Skip inventory for professional services
    if (q.id === 'inventory' && businessType === 'professional') return false
    // Skip manufacturing for most types
    if (q.id === 'manufacturing' && !['manufacturing', 'retail'].includes(businessType)) return false
    return true
  })

  const question = relevantQuestions[currentQuestion]
  const isLastQuestion = currentQuestion === relevantQuestions.length - 1
  const currentAnswer = answers[question?.id]

  const handleSelect = (optionId: string) => {
    if (question.multiple) {
      const current = (currentAnswer as string[]) || []
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId]
      onAnswer(question.id, updated)
    } else {
      onAnswer(question.id, optionId)
    }
  }

  const isSelected = (optionId: string) => {
    if (question.multiple) {
      return ((currentAnswer as string[]) || []).includes(optionId)
    }
    return currentAnswer === optionId
  }

  const canContinue = question.multiple 
    ? ((currentAnswer as string[]) || []).length > 0
    : !!currentAnswer

  const handleNext = () => {
    if (isLastQuestion) {
      onNext()
    } else {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestion === 0) {
      onBack()
    } else {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  if (!question) return null

  const QuestionIcon = question.icon

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {relevantQuestions.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === currentQuestion ? "w-8 bg-primary" : 
              i < currentQuestion ? "w-2 bg-primary" : "w-2 bg-muted"
            )}
          />
        ))}
      </div>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <QuestionIcon className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{question.question}</h1>
        <p className="text-muted-foreground">
          {question.description}
        </p>
        {question.multiple && (
          <Badge variant="secondary" className="mt-2">
            Select all that apply
          </Badge>
        )}
      </div>

      <div className="grid gap-3 max-w-2xl mx-auto">
        {question.options.map((option) => (
          <motion.div
            key={option.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200",
                isSelected(option.id)
                  ? "ring-2 ring-primary shadow-lg bg-primary/5" 
                  : "hover:shadow-md"
              )}
              onClick={() => handleSelect(option.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  isSelected(option.id) 
                    ? "border-primary bg-primary" 
                    : "border-muted-foreground/30"
                )}>
                  {isSelected(option.id) && (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{option.label}</p>
                  {option.description && (
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  )}
                </div>
                {option.suggestsTier === 'growth' && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    Growth
                  </Badge>
                )}
                {option.suggestsTier === 'enterprise' && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                    Enterprise
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={handleBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!canContinue}
          className="min-w-[200px]"
        >
          {isLastQuestion ? 'See Your Plan' : 'Continue'}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// HELPER: Calculate recommended modules and tier from answers
// ============================================================================

export function calculateRecommendations(answers: Record<string, string | string[]>): {
  modules: string[]
  tier: 'starter' | 'growth' | 'enterprise'
} {
  const modules = new Set<string>(['invoices', 'contacts', 'expenses', 'reports']) // Base modules
  let tier: 'starter' | 'growth' | 'enterprise' = 'starter'

  NEED_QUESTIONS.forEach(question => {
    const answer = answers[question.id]
    if (!answer) return

    const answerIds = Array.isArray(answer) ? answer : [answer]
    
    answerIds.forEach(answerId => {
      const option = question.options.find(o => o.id === answerId)
      if (!option) return

      option.suggestsModules.forEach(m => modules.add(m))
      
      if (option.suggestsTier === 'enterprise') {
        tier = 'enterprise'
      } else if (option.suggestsTier === 'growth' && tier !== 'enterprise') {
        tier = 'growth'
      }
    })
  })

  return {
    modules: Array.from(modules),
    tier,
  }
}
