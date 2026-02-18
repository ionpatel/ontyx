import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn(
      "animate-pulse bg-muted rounded",
      className
    )} />
  )
}

// Stat card skeleton
export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Shimmer className="h-8 w-32 mb-2" />
        <Shimmer className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

// Table row skeleton
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <Shimmer className="h-4 w-full max-w-[150px]" />
        </td>
      ))}
    </tr>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="flex border-b p-4 gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-4 w-24" />
        ))}
      </div>
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex p-4 gap-4 border-b last:border-0">
            {Array.from({ length: cols }).map((_, j) => (
              <Shimmer key={j} className="h-4 w-full max-w-[150px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Card list skeleton
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Shimmer className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-48" />
                <Shimmer className="h-3 w-32" />
              </div>
              <Shimmer className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Form skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-4 pt-4">
        <Shimmer className="h-10 w-24" />
        <Shimmer className="h-10 w-24" />
      </div>
    </div>
  )
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Shimmer className="h-8 w-48" />
        <Shimmer className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-10 w-28" />
        <Shimmer className="h-10 w-28" />
      </div>
    </div>
  )
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Shimmer className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={5} cols={4} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Shimmer className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <CardListSkeleton count={5} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Contact card skeleton
export function ContactCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Shimmer className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-36" />
            <Shimmer className="h-3 w-48" />
          </div>
          <Shimmer className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Invoice row skeleton
export function InvoiceRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <Shimmer className="h-10 w-10 rounded-lg" />
        <div className="space-y-1">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-3 w-32" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Shimmer className="h-4 w-20" />
        <Shimmer className="h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}

export { Shimmer }
