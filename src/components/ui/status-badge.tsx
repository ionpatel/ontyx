'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  CheckCircle, Clock, AlertCircle, XCircle, Send, Eye,
  CreditCard, FileText, Truck, Package, Play, Pause,
  Ban, HelpCircle, RefreshCw
} from 'lucide-react'

type StatusType = 
  // Invoice statuses
  | 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'void'
  // Order statuses  
  | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered'
  // General statuses
  | 'active' | 'inactive' | 'completed' | 'in_progress' | 'on_hold'
  // Custom
  | string

interface StatusConfig {
  label: string
  icon: React.ElementType
  className: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Invoice statuses
  draft: { label: 'Draft', icon: FileText, className: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300' },
  sent: { label: 'Sent', icon: Send, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  viewed: { label: 'Viewed', icon: Eye, className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  partial: { label: 'Partial', icon: CreditCard, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  paid: { label: 'Paid', icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  overdue: { label: 'Overdue', icon: AlertCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  void: { label: 'Void', icon: Ban, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  
  // Order statuses
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  processing: { label: 'Processing', icon: RefreshCw, className: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  shipped: { label: 'Shipped', icon: Truck, className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  delivered: { label: 'Delivered', icon: Package, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  
  // General statuses
  active: { label: 'Active', icon: Play, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  inactive: { label: 'Inactive', icon: Pause, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  completed: { label: 'Completed', icon: CheckCircle, className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  in_progress: { label: 'In Progress', icon: RefreshCw, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  on_hold: { label: 'On Hold', icon: Pause, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
}

interface StatusBadgeProps {
  status: StatusType
  showIcon?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function StatusBadge({
  status,
  showIcon = true,
  size = 'default',
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    icon: HelpCircle,
    className: 'bg-gray-100 text-gray-700',
  }

  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    default: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium inline-flex items-center gap-1",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  )
}

// Dot-style status indicator
interface StatusDotProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  label?: string
  pulse?: boolean
  className?: string
}

const DOT_COLORS = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-400',
}

export function StatusDot({
  status,
  label,
  pulse = false,
  className,
}: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative flex h-2.5 w-2.5">
        {pulse && (
          <span className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
            DOT_COLORS[status]
          )} />
        )}
        <span className={cn(
          "relative inline-flex rounded-full h-2.5 w-2.5",
          DOT_COLORS[status]
        )} />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </span>
  )
}
