'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ElementType
  iconBg?: string
  iconColor?: string
  change?: number // Percentage change
  trend?: 'up' | 'down' | 'neutral'
  alert?: boolean
  className?: string
  onClick?: () => void
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  change,
  trend,
  alert,
  className,
  onClick,
}: StatCardProps) {
  // Determine trend from change if not provided
  const actualTrend = trend || (
    change === undefined ? undefined :
    change > 0 ? 'up' :
    change < 0 ? 'down' : 'neutral'
  )

  const TrendIcon = actualTrend === 'up' ? TrendingUp :
                    actualTrend === 'down' ? TrendingDown : Minus

  return (
    <Card
      className={cn(
        "transition-all",
        onClick && "cursor-pointer hover:shadow-md",
        alert && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn("p-2 rounded-lg", iconBg)}>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold",
          alert ? "text-red-600" : "text-foreground"
        )}>
          {value}
        </div>
        <div className="flex items-center justify-between mt-1">
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {change !== undefined && actualTrend && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                actualTrend === 'up' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                actualTrend === 'down' && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                actualTrend === 'neutral' && "bg-gray-100 text-gray-700"
              )}
            >
              <TrendIcon className="h-3 w-3 mr-1" />
              {Math.abs(change)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Compact stat for inline display
interface CompactStatProps {
  label: string
  value: string | number
  icon?: React.ElementType
  iconColor?: string
  className?: string
}

export function CompactStat({
  label,
  value,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  className,
}: CompactStatProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {Icon && (
        <div className="p-2 rounded-lg bg-muted">
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      )}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  )
}

// Stats grid wrapper
interface StatsGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function StatsGrid({
  children,
  columns = 4,
  className,
}: StatsGridProps) {
  const colClasses = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={cn(
      "grid gap-4",
      colClasses[columns],
      className
    )}>
      {children}
    </div>
  )
}
