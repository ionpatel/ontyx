'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Full page loading spinner
 */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}

/**
 * Inline loading spinner
 */
export function InlineLoader({ 
  size = 'default',
  className 
}: { 
  size?: 'sm' | 'default' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} />
  )
}

/**
 * Button loading state (replaces button content)
 */
export function ButtonLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <>
      <Loader2 className="h-4 w-4 animate-spin mr-2" />
      {text}
    </>
  )
}

/**
 * Skeleton loader for text content
 */
export function TextSkeleton({ 
  lines = 1,
  className 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={cn(
            "h-4 bg-muted rounded animate-pulse",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton loader for avatar
 */
export function AvatarSkeleton({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn("rounded-full bg-muted animate-pulse", sizeClasses[size])} />
  )
}

/**
 * Skeleton loader for card
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-full bg-muted rounded animate-pulse" />
      <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
    </div>
  )
}

/**
 * Skeleton loader for stat card
 */
export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="mt-2 space-y-1">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

/**
 * Skeleton loader for table row
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  )
}

/**
 * Skeleton loader for full table
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={cn("rounded-md border", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Skeleton loader for form
 */
export function FormSkeleton({ 
  fields = 4,
  className 
}: { 
  fields?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
      </div>
    </div>
  )
}

/**
 * List of card skeletons
 */
export function CardListSkeleton({ 
  count = 3,
  className 
}: { 
  count?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Grid of stat skeletons
 */
export function StatsGridSkeleton({ 
  count = 4,
  className 
}: { 
  count?: number
  className?: string 
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatSkeleton key={i} />
      ))}
    </div>
  )
}
