"use client"

import { 
  DollarSign, FileText, TrendingUp, TrendingDown,
  ArrowUpRight, Users, AlertCircle, Clock,
  Package, Activity, ShoppingCart, Building2,
  CheckCircle, Send, Eye, CreditCard, Plus,
  Receipt, Truck, UserPlus, Calendar, Zap
} from "lucide-react"
import Link from "next/link"
import { BusinessInsights } from './insights'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { formatCurrency, cn } from "@/lib/utils"
import { useDashboardStats, useRecentInvoices, useRecentOrders, useRecentActivity } from "@/hooks/use-dashboard"
import { QuickInvoiceModal } from "@/components/quick-invoice-modal"
import { TierUpgradeBanner, WelcomeHero } from "@/components/dashboard/tier-banner"
import { useOrganization } from "@/hooks/use-organization"

const invoiceStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  viewed: { label: "Viewed", color: "bg-indigo-100 text-indigo-700", icon: Eye },
  partial: { label: "Partial", color: "bg-amber-100 text-amber-700", icon: CreditCard },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertCircle },
}

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", color: "bg-amber-100 text-amber-700" },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-700" },
}

export default function DashboardPage() {
  const { stats, loading: statsLoading } = useDashboardStats()
  const { invoices, loading: invoicesLoading } = useRecentInvoices(5)
  const { orders, loading: ordersLoading } = useRecentOrders(5)
  const { activity, loading: activityLoading } = useRecentActivity(8)
  const { organization } = useOrganization()
  
  // Get tier from organization (default to starter)
  const currentTier = (organization?.tier as 'starter' | 'growth' | 'enterprise') || 'starter'
  const isNewUser = organization && !organization.onboardingCompleted

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0, 'CAD'),
      change: stats?.revenueChange ? `+${stats.revenueChange}%` : null,
      changeType: "positive" as const,
      icon: DollarSign,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Outstanding",
      value: formatCurrency(stats?.outstandingAmount || 0, 'CAD'),
      subtitle: `${stats?.outstandingInvoices || 0} invoices`,
      icon: FileText,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders?.toString() || "0",
      subtitle: `${stats?.totalOrders || 0} total orders`,
      icon: ShoppingCart,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockCount?.toString() || "0",
      subtitle: `${stats?.totalProducts || 0} products`,
      icon: Package,
      iconBg: stats?.lowStockCount && stats.lowStockCount > 0 ? "bg-red-100" : "bg-primary-light",
      iconColor: stats?.lowStockCount && stats.lowStockCount > 0 ? "text-red-600" : "text-primary",
      alert: stats?.lowStockCount && stats.lowStockCount > 0,
    },
  ]

  const quickStats = [
    { label: "Customers", value: stats?.totalCustomers || 0, icon: Users },
    { label: "Vendors", value: stats?.totalVendors || 0, icon: Building2 },
    { label: "Overdue", value: stats?.overdueCount || 0, icon: AlertCircle, alert: (stats?.overdueCount || 0) > 0 },
  ]

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      invoice: <FileText className="h-4 w-4" />,
      payment: <DollarSign className="h-4 w-4" />,
      order: <ShoppingCart className="h-4 w-4" />,
      customer: <Users className="h-4 w-4" />,
      product: <Package className="h-4 w-4" />,
    }
    return icons[type] || <Activity className="h-4 w-4" />
  }

  const getActivityColor = (status?: string) => {
    if (status === 'success') return 'bg-green-100 text-green-600'
    if (status === 'warning') return 'bg-amber-100 text-amber-600'
    if (status === 'new') return 'bg-blue-100 text-blue-600'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Welcome Hero for New Users */}
      {isNewUser && organization?.name && (
        <WelcomeHero 
          businessName={organization.name} 
          tier={currentTier}
        />
      )}

      {/* Tier Upgrade Banner (only for starter/growth) */}
      {!isNewUser && currentTier !== 'enterprise' && (
        <TierUpgradeBanner currentTier={currentTier} />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/reports">View Reports</Link>
          </Button>
          <Button asChild className="shadow-maple">
            <Link href="/invoices/new">
              <FileText className="mr-2 h-4 w-4" /> New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar - Like Odoo */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap flex items-center gap-2">
              <Zap className="h-4 w-4" /> Quick Actions:
            </span>
            <QuickInvoiceModal 
              trigger={
                <Button variant="default" size="sm" className="whitespace-nowrap bg-green-600 hover:bg-green-700">
                  <Zap className="h-3 w-3 mr-1" /> Quick Invoice
                </Button>
              }
            />
            <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
              <Link href="/invoices/new"><Plus className="h-3 w-3 mr-1" /> Full Invoice</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
              <Link href="/sales/new"><ShoppingCart className="h-3 w-3 mr-1" /> Sale</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
              <Link href="/purchases/new"><Truck className="h-3 w-3 mr-1" /> Purchase</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
              <Link href="/contacts/new"><UserPlus className="h-3 w-3 mr-1" /> Contact</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
              <Link href="/appointments/new"><Calendar className="h-3 w-3 mr-1" /> Appointment</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
              <Link href="/pos"><Receipt className="h-3 w-3 mr-1" /> Open POS</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Insights & Alerts */}
      <BusinessInsights />

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className={cn(
              "border-border hover:shadow-md transition-shadow",
              stat.alert && "border-red-200"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.iconBg)}>
                <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <div className="flex items-center justify-between mt-1">
                {stat.subtitle && (
                  <p className="text-xs text-text-muted">{stat.subtitle}</p>
                )}
                {stat.change && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stat.change}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-border">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn(
                "p-3 rounded-lg",
                stat.alert ? "bg-red-100" : "bg-primary-light"
              )}>
                <stat.icon className={cn(
                  "h-5 w-5",
                  stat.alert ? "text-red-600" : "text-primary"
                )} />
              </div>
              <div>
                <p className="text-sm text-text-muted">{stat.label}</p>
                <p className={cn(
                  "text-2xl font-bold",
                  stat.alert ? "text-red-600" : "text-text-primary"
                )}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent Invoices
              </CardTitle>
              <CardDescription>Your latest invoice activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <FileText className="h-10 w-10 text-text-muted mb-3" />
                <p className="text-text-muted">No invoices yet</p>
                <Button asChild className="mt-3" size="sm">
                  <Link href="/invoices/new">Create Invoice</Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const status = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.draft
                    const StatusIcon = status.icon
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Link href={`/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-text-secondary">{invoice.customerName}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", status.color)}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total, 'CAD')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className={cn("p-2 rounded-lg h-fit", getActivityColor(item.status))}>
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                      <p className="text-xs text-text-muted truncate">{item.description}</p>
                      {item.amount && (
                        <p className="text-xs font-medium text-text-secondary mt-0.5">
                          {formatCurrency(item.amount, 'CAD')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest sales orders</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/sales">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <ShoppingCart className="h-10 w-10 text-text-muted mb-3" />
              <p className="text-text-muted">No orders yet</p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/sales/new">Create Order</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const status = orderStatusConfig[order.status] || orderStatusConfig.draft
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/sales/${order.id}`} className="font-medium text-primary hover:underline">
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-text-secondary">{order.customerName}</TableCell>
                      <TableCell className="text-text-muted">
                        {new Date(order.orderDate).toLocaleDateString('en-CA')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total, 'CAD')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
