'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

// Map of path segments to friendly names
const PATH_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  invoices: 'Invoices',
  contacts: 'Contacts',
  inventory: 'Inventory',
  pos: 'Point of Sale',
  sales: 'Sales',
  expenses: 'Expenses',
  banking: 'Banking',
  projects: 'Projects',
  employees: 'Employees',
  payroll: 'Payroll',
  reports: 'Reports',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
  profile: 'Profile',
  team: 'Team',
  billing: 'Billing',
  accounting: 'Accounting',
  appointments: 'Appointments',
  manufacturing: 'Manufacturing',
  crm: 'CRM',
}

export function Breadcrumb({ items, className, showHome = true }: BreadcrumbProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const segments = pathname?.split('/').filter(Boolean) || []
    const crumbs: BreadcrumbItem[] = []

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip UUID-like segments (detail pages)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
      
      if (!isUUID) {
        crumbs.push({
          label: PATH_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: index < segments.length - 1 ? currentPath : undefined,
        })
      } else {
        // For detail pages, just show "Details" or similar
        crumbs.push({
          label: 'Details',
          href: undefined,
        })
      }
    })

    return crumbs
  })()

  if (breadcrumbs.length === 0) return null

  return (
    <nav 
      className={cn("flex items-center text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
    >
      {showHome && (
        <>
          <Link 
            href="/dashboard" 
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
        </>
      )}
      
      {breadcrumbs.map((crumb, index) => (
        <span key={index} className="flex items-center">
          {crumb.href ? (
            <Link 
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-2" />
          )}
        </span>
      ))}
    </nav>
  )
}

// Simpler inline breadcrumb for page headers
export function PageBreadcrumb({ 
  parent, 
  current 
}: { 
  parent?: { label: string; href: string }
  current: string 
}) {
  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-2">
      <Link href="/dashboard" className="hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {parent && (
        <>
          <ChevronRight className="h-3.5 w-3.5 mx-1.5" />
          <Link href={parent.href} className="hover:text-foreground">
            {parent.label}
          </Link>
        </>
      )}
      <ChevronRight className="h-3.5 w-3.5 mx-1.5" />
      <span className="text-foreground">{current}</span>
    </nav>
  )
}
