import { ReactNode } from 'react'
import Link from 'next/link'
import { 
  FileText, Package, Users, ShoppingCart, 
  Receipt, Calendar, FolderKanban, Building2,
  Plus, Search, Inbox
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: 'invoice' | 'product' | 'contact' | 'order' | 'expense' | 'appointment' | 'project' | 'search' | 'inbox' | React.ElementType
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
  children?: ReactNode
}

const iconMap = {
  invoice: FileText,
  product: Package,
  contact: Users,
  order: ShoppingCart,
  expense: Receipt,
  appointment: Calendar,
  project: FolderKanban,
  search: Search,
  inbox: Inbox,
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  const Icon = typeof icon === 'string' ? iconMap[icon] || Inbox : icon

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Button asChild>
            <Link href={actionHref}>
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel}
            </Link>
          </Button>
        ) : (
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )
      )}
      {children}
    </div>
  )
}

// Pre-configured empty states for common modules
export function NoInvoices() {
  return (
    <EmptyState
      icon="invoice"
      title="No invoices yet"
      description="Create your first invoice to start tracking revenue"
      actionLabel="Create Invoice"
      actionHref="/invoices/new"
    />
  )
}

export function NoProducts() {
  return (
    <EmptyState
      icon="product"
      title="No products yet"
      description="Add products to your inventory to start selling"
      actionLabel="Add Product"
      actionHref="/inventory/new"
    />
  )
}

export function NoContacts() {
  return (
    <EmptyState
      icon="contact"
      title="No contacts yet"
      description="Add customers and vendors to your network"
      actionLabel="Add Contact"
      actionHref="/contacts/new"
    />
  )
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}"`}
    />
  )
}

export function NoAppointments() {
  return (
    <EmptyState
      icon="appointment"
      title="No appointments scheduled"
      description="Schedule appointments to manage your time"
      actionLabel="Schedule Appointment"
      actionHref="/appointments/new"
    />
  )
}

export function NoProjects() {
  return (
    <EmptyState
      icon="project"
      title="No projects yet"
      description="Create a project to organize your work"
      actionLabel="New Project"
      actionHref="/projects/new"
    />
  )
}
