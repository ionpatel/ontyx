"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Landmark,
  Calculator,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  Factory,
  Users,
  Target,
  FolderKanban,
  UserCircle,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Invoices", href: "/invoices", icon: FileText },
      { title: "Bills", href: "/bills", icon: Receipt },
      { title: "Banking", href: "/banking", icon: Landmark },
      { title: "Accounting", href: "/accounting", icon: Calculator },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Inventory", href: "/inventory", icon: Package },
      { title: "Warehouses", href: "/warehouses", icon: Warehouse },
      { title: "Sales", href: "/sales", icon: ShoppingCart },
      { title: "Purchases", href: "/purchases", icon: Truck },
      { title: "Manufacturing", href: "/manufacturing", icon: Factory },
    ],
  },
  {
    title: "Relations",
    items: [
      { title: "Contacts", href: "/contacts", icon: Users },
      { title: "CRM", href: "/crm", icon: Target },
      { title: "Projects", href: "/projects", icon: FolderKanban },
    ],
  },
  {
    title: "People",
    items: [
      { title: "Employees", href: "/employees", icon: UserCircle },
      { title: "Payroll", href: "/payroll", icon: Wallet },
      { title: "T4 Tax Slips", href: "/payroll/t4", icon: FileText },
    ],
  },
  {
    title: "Insights",
    items: [
      { title: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-primary-foreground font-display font-semibold text-lg">O</span>
            </div>
            <span className="text-xl font-display font-semibold tracking-tight text-slate-800">
              Onty<span className="text-primary">X</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary mx-auto shadow-sm">
            <span className="text-primary-foreground font-display font-semibold text-lg">O</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
        {navigation.map((group, index) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
            )}
            {collapsed && index > 0 && <Separator className="my-2" />}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                    {!collapsed && <span>{item.title}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings & Collapse */}
      <div className="border-t border-border p-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-5 w-5" />
          {!collapsed && <span>Settings</span>}
        </Link>
        
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={onToggle}
          className={cn("w-full mt-2", collapsed ? "justify-center" : "justify-start")}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
