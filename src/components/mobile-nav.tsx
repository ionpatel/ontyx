'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, FileText, Store, Users, 
  MoreHorizontal, Plus, Package, Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { QuickInvoiceModal } from './quick-invoice-modal'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
}

const mainNavItems: NavItem[] = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'POS', href: '/pos', icon: Store },
  { name: 'Contacts', href: '/contacts', icon: Users },
]

const moreNavItems: NavItem[] = [
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              "text-xs font-medium transition-colors",
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 mb-1",
              isActive(item.href) && "text-primary"
            )} />
            {item.name}
          </Link>
        ))}

        {/* More Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                "text-xs font-medium text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5 mb-1" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 pb-6">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Floating Quick Invoice Button */}
      <QuickInvoiceModal
        trigger={
          <Button
            size="icon"
            className="absolute -top-6 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        }
      />
    </nav>
  )
}

// Add padding to main content to account for bottom nav
export function MobileNavSpacer() {
  return <div className="h-16 md:hidden" />
}
