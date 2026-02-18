'use client'

import { ReactNode } from 'react'
import { HelpCircle, Info, AlertCircle, Lightbulb } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type HelpTipVariant = 'help' | 'info' | 'warning' | 'tip'

interface HelpTipProps {
  children: ReactNode
  variant?: HelpTipVariant
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  className?: string
  iconClassName?: string
}

const variantConfig: Record<HelpTipVariant, {
  icon: React.ElementType
  iconColor: string
  bgColor: string
}> = {
  help: {
    icon: HelpCircle,
    iconColor: 'text-muted-foreground hover:text-foreground',
    bgColor: '',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  tip: {
    icon: Lightbulb,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
  },
}

export function HelpTip({
  children,
  variant = 'help',
  side = 'top',
  align = 'center',
  className,
  iconClassName,
}: HelpTipProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full p-0.5 transition-colors",
              config.iconColor,
              iconClassName
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">Help</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            "max-w-xs text-sm",
            config.bgColor,
            className
          )}
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Inline help text with icon
interface HelpTextProps {
  children: ReactNode
  variant?: HelpTipVariant
  className?: string
}

export function HelpText({
  children,
  variant = 'info',
  className,
}: HelpTextProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className={cn(
      "flex items-start gap-2 text-sm rounded-lg p-3",
      config.bgColor,
      className
    )}>
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.iconColor)} />
      <div className="text-muted-foreground">{children}</div>
    </div>
  )
}

// Label with help tooltip
interface LabelWithHelpProps {
  label: string
  help: ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export function LabelWithHelp({
  label,
  help,
  htmlFor,
  required,
  className,
}: LabelWithHelpProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <HelpTip>{help}</HelpTip>
    </div>
  )
}
