"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useOrganization } from "@/hooks/use-organization"
import { AuthProvider, useAuth } from "@/components/providers/auth-provider"
import { 
  LayoutDashboard, FileText, Receipt, Building2, BookOpen,
  BarChart3, Package, ShoppingCart, Users, Briefcase,
  Settings, Menu, X, ChevronDown, LogOut, User,
  Factory, FolderKanban, Store, Truck,
  Clock, Wallet, UserCircle, Loader2
} from "lucide-react"
import { GlobalSearch } from '@/components/global-search'
import { ThemeToggle } from '@/components/theme-toggle'
import { KeyboardShortcuts, useNavigationShortcuts } from '@/components/keyboard-shortcuts'
import { NotificationCenter } from '@/components/notifications'
import { MobileBottomNav, MobileNavSpacer } from '@/components/mobile-nav'
import { cn } from "@/lib/utils"
import { usePlanAccess } from "@/hooks/use-plan-access"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ToastProvider } from "@/components/ui/toast"

// ============================================================================
// NAVIGATION CONFIG - Module-based
// ============================================================================

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  moduleId?: string // If set, only show if module is enabled
  badge?: string
}

interface NavSection {
  name: string
  items: NavItem[]
}

// Simplified navigation - fewer items, smart grouping
const getNavigation = (enabledModules: string[]): NavSection[] => {
  const allNav: NavSection[] = [
    {
      name: "Overview",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      name: "Money",
      items: [
        { name: "Invoices", href: "/invoices", icon: FileText, moduleId: "invoices" },
        { name: "Expenses", href: "/expenses", icon: Wallet, moduleId: "expenses" },
        { name: "Banking", href: "/banking", icon: Building2, moduleId: "banking" },
      ],
    },
    {
      name: "Sales",
      items: [
        { name: "Point of Sale", href: "/pos", icon: Store, moduleId: "pos" },
        { name: "Quotes", href: "/quotes", icon: FileText, moduleId: "quotes" },
        { name: "Sales Orders", href: "/sales", icon: ShoppingCart, moduleId: "sales" },
        { name: "Contacts", href: "/contacts", icon: Users, moduleId: "contacts" },
      ],
    },
    {
      name: "Operations",
      items: [
        { name: "Inventory", href: "/inventory", icon: Package, moduleId: "inventory" },
        { name: "Purchases", href: "/purchases", icon: Truck, moduleId: "purchases" },
        { name: "Projects", href: "/projects", icon: FolderKanban, moduleId: "projects" },
        { name: "Appointments", href: "/appointments", icon: Clock, moduleId: "appointments" },
        { name: "Manufacturing", href: "/manufacturing", icon: Factory, moduleId: "manufacturing" },
      ],
    },
    {
      name: "Team",
      items: [
        { name: "Employees", href: "/employees", icon: Briefcase, moduleId: "employees" },
        { name: "Payroll", href: "/payroll", icon: Wallet, moduleId: "payroll" },
        { name: "Time Off", href: "/time-off", icon: Clock, moduleId: "timeoff" },
      ],
    },
    {
      name: "Insights",
      items: [
        { name: "Reports", href: "/reports", icon: BarChart3, moduleId: "reports" },
      ],
    },
  ]

  // If no modules specified (legacy), show all
  if (!enabledModules || enabledModules.length === 0) {
    return allNav
  }

  // Filter sections based on enabled modules
  return allNav
    .map(section => ({
      ...section,
      items: section.items.filter(item => 
        !item.moduleId || enabledModules.includes(item.moduleId)
      ),
    }))
    .filter(section => section.items.length > 0)
}

// ============================================================================
// INNER LAYOUT
// ============================================================================

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, loading: profileLoading } = useUserProfile()
  const { organization, loading: orgLoading, needsOnboarding } = useOrganization()
  const { signOut, loading: authLoading, user } = useAuth()
  const { canAccessRoute, tier, loading: planLoading } = usePlanAccess()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  
  // Enable keyboard navigation shortcuts
  useNavigationShortcuts()

  // Redirect to onboarding if needed
  useEffect(() => {
    if (needsOnboarding && pathname !== '/onboarding') {
      router.push('/onboarding')
    }
  }, [needsOnboarding, pathname, router])

  // Check plan access for current route - redirect if unauthorized
  useEffect(() => {
    if (!planLoading && pathname && !canAccessRoute(pathname)) {
      // Redirect to dashboard with upgrade message
      router.push('/dashboard?upgrade=true')
    }
  }, [pathname, canAccessRoute, planLoading, router])

  // Get filtered navigation based on enabled modules
  const navigation = getNavigation(organization?.enabledModules || [])

  // Loading state
  const isLoadingUser = authLoading || profileLoading
  const userName = profile 
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.email 
    : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || '')
  const userRole = profile?.jobTitle || 'Member'
  const userInitials = profile 
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || profile.email?.[0]?.toUpperCase() || ''
    : (user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '')

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
      router.push('/login')
    }
  }

  // Show loading while checking onboarding
  if (orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 lg:static",
          collapsed ? "w-[70px]" : "w-[260px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b gap-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Ontyx"
              width={36}
              height={36}
              className="dark:invert"
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-lg leading-none">
                  {organization?.name || 'Ontyx'}
                </span>
                {organization?.businessType && (
                  <span className="text-xs text-muted-foreground capitalize">
                    {organization.businessType}
                  </span>
                )}
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex shrink-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu className={cn(
              "h-5 w-5 transition-all duration-300",
              !collapsed && "rotate-90 scale-0 opacity-0"
            )} />
            <X className={cn(
              "h-5 w-5 absolute transition-all duration-300",
              collapsed && "-rotate-90 scale-0 opacity-0"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-6 px-2">
            {navigation.map((section) => (
              <div key={section.name}>
                {!collapsed && (
                  <h4 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {section.name}
                  </h4>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          collapsed && "justify-center px-2"
                        )}
                        onClick={() => setSidebarOpen(false)}
                        title={collapsed ? item.name : undefined}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Settings Link */}
        <div className="border-t p-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground",
              pathname === '/settings' && "bg-primary text-primary-foreground",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="hidden md:block flex-1 max-w-md">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <KeyboardShortcuts />
            <ThemeToggle />
            <NotificationCenter />
            <Separator orientation="vertical" className="h-6" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={userName} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {isLoadingUser ? '' : userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    {isLoadingUser ? (
                      <>
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-16 bg-muted animate-pulse rounded mt-1" />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{userName}</p>
                        <p className="text-xs text-muted-foreground">{userRole}</p>
                      </>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 pb-20 md:pb-6">
            {children}
          </div>
          <MobileNavSpacer />
        </main>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </div>
  )
}

// ============================================================================
// MAIN LAYOUT
// ============================================================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </ToastProvider>
    </AuthProvider>
  )
}
