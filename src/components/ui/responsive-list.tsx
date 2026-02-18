'use client'

import { ReactNode, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveListProps<T> {
  items: T[]
  renderCard: (item: T, index: number) => ReactNode
  renderRow: (item: T, index: number) => ReactNode
  tableHeader: ReactNode
  emptyState?: ReactNode
  className?: string
  cardClassName?: string
  breakpoint?: number // px at which to switch to cards
}

/**
 * Responsive list component that shows cards on mobile and table rows on desktop.
 * 
 * Usage:
 * <ResponsiveList
 *   items={invoices}
 *   tableHeader={<TableHeader>...</TableHeader>}
 *   renderRow={(invoice) => <TableRow>...</TableRow>}
 *   renderCard={(invoice) => <InvoiceCard invoice={invoice} />}
 *   emptyState={<NoInvoices />}
 * />
 */
export function ResponsiveList<T>({
  items,
  renderCard,
  renderRow,
  tableHeader,
  emptyState,
  className,
  cardClassName,
  breakpoint = 768, // md breakpoint
}: ResponsiveListProps<T>) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  if (isMobile) {
    return (
      <div className={cn("space-y-3", cardClassName)}>
        {items.map((item, index) => (
          <div key={index}>
            {renderCard(item, index)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <table className="w-full">
        {tableHeader}
        <tbody>
          {items.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Hook to detect if viewport is mobile
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

/**
 * Component that only renders on mobile
 */
export function MobileOnly({ 
  children, 
  breakpoint = 768 
}: { 
  children: ReactNode
  breakpoint?: number 
}) {
  const isMobile = useIsMobile(breakpoint)
  if (!isMobile) return null
  return <>{children}</>
}

/**
 * Component that only renders on desktop
 */
export function DesktopOnly({ 
  children, 
  breakpoint = 768 
}: { 
  children: ReactNode
  breakpoint?: number 
}) {
  const isMobile = useIsMobile(breakpoint)
  if (isMobile) return null
  return <>{children}</>
}
