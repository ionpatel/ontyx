"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useUserProfile } from "@/hooks/use-user-profile"
import { AuthProvider, useAuth } from "@/components/providers/auth-provider"
import { 
  LayoutDashboard, FileText, Receipt, Building2, BookOpen,
  BarChart3, Package, ShoppingCart, Users, Briefcase,
  Settings, Menu, X, ChevronDown, LogOut, User,
  Bell, Search, Moon, Sun, Factory, FolderKanban, 
  Layers, CheckCircle2, ClipboardList, Clock, Wallet, UserCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const navigation = [
  {
    name: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    name: "Finance",
    items: [
      { name: "Invoices", href: "/invoices", icon: FileText, badge: 2 },
      { name: "Bills", href: "/bills", icon: Receipt },
      { name: "Banking", href: "/banking", icon: Building2 },
      { name: "Accounting", href: "/accounting", icon: BookOpen },
      { name: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    name: "Operations",
    items: [
      { name: "Inventory", href: "/inventory", icon: Package },
      { name: "Sales", href: "/sales", icon: ShoppingCart },
      { name: "Purchases", href: "/purchases", icon: Layers },
      { name: "Manufacturing", href: "/manufacturing", icon: Factory },
    ],
  },
  {
    name: "Relations",
    items: [
      { name: "Contacts", href: "/contacts", icon: Users },
      { name: "Projects", href: "/projects", icon: FolderKanban },
    ],
  },
  {
    name: "HR",
    items: [
      { name: "Employees", href: "/employees", icon: Briefcase },
      { name: "Payroll", href: "/payroll", icon: Wallet },
      { name: "Time Tracking", href: "/time-tracking", icon: Clock },
    ],
  },
]

// ============================================================================
// INNER LAYOUT - Uses auth context (must be INSIDE AuthProvider)
// ============================================================================
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { profile } = useUserProfile()
  const { signOut, loading: authLoading, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  // Get user display info
  const userName = profile ? `${profile.firstName} ${profile.lastName}`.trim() || profile.email : (authLoading ? 'Loading...' : 'Guest')
  const userRole = profile?.jobTitle || 'Member'
  const userInitials = profile 
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'
    : (authLoading ? '...' : 'G')

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (err) {
      console.error('Logout error:', err)
      router.push('/login')
    }
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
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Ontyx"
              width={32}
              height={32}
              className="dark:invert"
            />
            {!collapsed && (
              <span className="text-xl font-bold tracking-tight">Ontyx</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
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
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          collapsed && "justify-center px-2"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto">
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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === '/settings' && "bg-primary text-primary-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="w-[300px] pl-9"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    {profile?.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={userName} />}
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{userRole}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN LAYOUT - Wraps with providers FIRST, then renders inner layout
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
