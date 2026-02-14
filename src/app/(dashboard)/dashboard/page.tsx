"use client"

import { 
  DollarSign, FileText, Receipt, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Users, AlertCircle, Clock,
  Factory, FolderKanban, CheckCircle2, Package, Activity
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { 
  mockInvoices, mockBills, mockBankAccounts, 
  getInvoiceSummary, getBillSummary, getBankingSummary,
  mockWorkOrders, mockProjects, mockTasks,
  getManufacturingSummary, getProjectsSummary,
  recentActivity
} from "@/lib/mock-data"

export default function DashboardPage() {
  const invoiceSummary = getInvoiceSummary()
  const billSummary = getBillSummary()
  const bankingSummary = getBankingSummary()
  const manufacturingSummary = getManufacturingSummary()
  const projectsSummary = getProjectsSummary()

  const recentInvoices = mockInvoices.slice(0, 5)
  const overdueInvoices = mockInvoices.filter(i => i.status === "overdue")
  const activeWorkOrders = mockWorkOrders.filter(wo => wo.status === "in_progress").slice(0, 3)
  const activeTasks = mockTasks.filter(t => t.status === "in_progress" || t.status === "review").slice(0, 4)

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(215000),
      change: "+12.5%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Outstanding Invoices",
      value: formatCurrency(invoiceSummary.outstanding),
      subtitle: `${mockInvoices.filter(i => i.amountDue > 0).length} invoices`,
      icon: FileText,
    },
    {
      title: "Active Work Orders",
      value: manufacturingSummary.activeWorkOrders.toString(),
      subtitle: `${manufacturingSummary.totalUnitsPlanned} units planned`,
      icon: Factory,
    },
    {
      title: "Cash Balance",
      value: formatCurrency(bankingSummary.totalBalance),
      change: "+5.2%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ]

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      invoice: <FileText className="h-4 w-4" />,
      payment: <DollarSign className="h-4 w-4" />,
      order: <Package className="h-4 w-4" />,
      customer: <Users className="h-4 w-4" />,
      product: <Package className="h-4 w-4" />,
      expense: <Receipt className="h-4 w-4" />,
    }
    return icons[type] || <Activity className="h-4 w-4" />
  }

  const getActivityColor = (status?: string) => {
    if (status === "success") return "bg-green-500"
    if (status === "failed") return "bg-red-500"
    return "bg-blue-500"
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/invoices/new">New Invoice</Link>
          </Button>
          <Button asChild>
            <Link href="/reports">View Reports</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className={cn(
                  "text-xs flex items-center gap-1",
                  stat.changeType === "positive" ? "text-green-500" : "text-destructive"
                )}>
                  {stat.changeType === "positive" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {stat.change} from last month
                </p>
              )}
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}
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
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest invoices and their status</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
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
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link href={`/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status as any}>{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Alerts */}
          {overdueInvoices.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle className="text-base">Overdue Invoices</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {overdueInvoices.length} invoice{overdueInvoices.length > 1 ? "s" : ""} overdue totaling{" "}
                  <span className="font-semibold text-destructive">
                    {formatCurrency(overdueInvoices.reduce((sum, i) => sum + i.amountDue, 0))}
                  </span>
                </p>
                <Button variant="destructive" size="sm" className="w-full" asChild>
                  <Link href="/invoices?status=overdue">View Overdue</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={cn("mt-1 p-1.5 rounded-full", getActivityColor(activity.status))}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    )}
                    {activity.amount && (
                      <p className="text-xs font-medium text-primary">{formatCurrency(activity.amount)}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bank Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockBankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                    <p className="text-xs text-muted-foreground">{account.bankName}</p>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrency(account.balance)}</span>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/banking">View Banking</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Manufacturing & Projects */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Manufacturing Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Manufacturing
              </CardTitle>
              <CardDescription>Active work orders and production status</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manufacturing">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-2xl font-bold">{manufacturingSummary.activeWorkOrders}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-2xl font-bold">{manufacturingSummary.plannedWorkOrders}</p>
                <p className="text-xs text-muted-foreground">Planned</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-2xl font-bold">{manufacturingSummary.avgUtilization}%</p>
                <p className="text-xs text-muted-foreground">Utilization</p>
              </div>
            </div>
            <div className="space-y-3">
              {activeWorkOrders.map((wo) => (
                <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Link href={`/manufacturing/work-orders/${wo.id}`} className="font-medium text-primary hover:underline">
                      {wo.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">{wo.productName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{wo.quantityCompleted}/{wo.quantity}</p>
                      <Progress value={(wo.quantityCompleted / wo.quantity) * 100} className="w-20 h-1.5" />
                    </div>
                    <Badge variant={wo.priority === "high" || wo.priority === "urgent" ? "destructive" : "secondary"} className="capitalize">
                      {wo.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projects Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Projects
              </CardTitle>
              <CardDescription>Active projects and task progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-2xl font-bold">{projectsSummary.activeProjects}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-2xl font-bold">{projectsSummary.activeTasks}</p>
                <p className="text-xs text-muted-foreground">Tasks</p>
              </div>
              <div className="p-3 rounded-lg bg-accent/50">
                <p className="text-2xl font-bold">{projectsSummary.thisWeekHours}h</p>
                <p className="text-xs text-muted-foreground">This Week</p>
              </div>
            </div>
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {task.assigneeName ? getInitials(task.assigneeName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.projectName}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize text-xs">
                    {task.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
