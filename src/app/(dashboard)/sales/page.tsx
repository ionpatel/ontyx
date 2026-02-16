"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Plus, ShoppingCart, FileText, DollarSign, Clock, 
  TrendingUp, Package, Search, Filter, MoreHorizontal,
  Eye, Edit, Trash2, Send, CheckCircle, Truck, XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSalesOrders, useSalesStats } from "@/hooks/use-sales"
import { formatCurrency, cn } from "@/lib/utils"
import type { SalesOrder, SalesOrderStatus } from "@/types/operations"

const statusConfig: Record<SalesOrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  draft: { label: "Draft", variant: "secondary", color: "bg-slate-100 text-slate-700" },
  confirmed: { label: "Confirmed", variant: "default", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Processing", variant: "default", color: "bg-amber-100 text-amber-700" },
  shipped: { label: "Shipped", variant: "default", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Delivered", variant: "default", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", variant: "destructive", color: "bg-red-100 text-red-700" },
  returned: { label: "Returned", variant: "outline", color: "bg-orange-100 text-orange-700" },
}

const paymentStatusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  partial: { label: "Partial", color: "bg-blue-100 text-blue-700" },
  paid: { label: "Paid", color: "bg-green-100 text-green-700" },
  refunded: { label: "Refunded", color: "bg-red-100 text-red-700" },
}

export default function SalesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<SalesOrderStatus | "all">("all")
  
  const { orders, loading, error, updateOrderStatus, refetch } = useSalesOrders(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  )
  const { stats } = useSalesStats()

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerEmail?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleStatusChange = async (id: string, status: SalesOrderStatus) => {
    await updateOrderStatus(id, status)
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0, 'CAD'),
      icon: DollarSign,
      description: `${stats?.totalOrders || 0} total orders`,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Pending Orders",
      value: stats?.pendingOrders?.toString() || "0",
      icon: Clock,
      description: "Awaiting fulfillment",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Shipped",
      value: stats?.shippedOrders?.toString() || "0",
      icon: Truck,
      description: "In transit",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(stats?.avgOrderValue || 0, 'CAD'),
      icon: TrendingUp,
      description: "Per order",
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Sales</h1>
          <p className="text-text-secondary mt-1">
            Manage sales orders, quotes, and fulfillment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sales/quotes/new">
              <FileText className="mr-2 h-4 w-4" /> New Quote
            </Link>
          </Button>
          <Button asChild className="shadow-maple">
            <Link href="/sales/new">
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.iconBg)}>
                <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
              <p className="text-xs text-text-muted mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Sales Orders
              </CardTitle>
              <CardDescription>
                {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SalesOrderStatus | "all")}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Package className="h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary">No orders found</h3>
              <p className="text-text-muted mt-1">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first sales order to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/sales/new">
                    <Plus className="mr-2 h-4 w-4" /> Create Order
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background-secondary hover:bg-background-secondary">
                    <TableHead className="font-semibold">Order #</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Payment</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-surface-hover">
                      <TableCell>
                        <Link 
                          href={`/sales/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-text-primary">{order.customerName}</div>
                          <div className="text-sm text-text-muted">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {new Date(order.orderDate).toLocaleDateString('en-CA')}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", statusConfig[order.status].color)}>
                          {statusConfig[order.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-medium", paymentStatusConfig[order.paymentStatus].color)}>
                          {paymentStatusConfig[order.paymentStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-text-primary">
                        {formatCurrency(order.total, order.currency)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/sales/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/sales/${order.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Order
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            {order.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'confirmed')}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Confirm Order
                              </DropdownMenuItem>
                            )}
                            {order.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'processing')}>
                                <Package className="mr-2 h-4 w-4" /> Start Processing
                              </DropdownMenuItem>
                            )}
                            {order.status === 'processing' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')}>
                                <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                              </DropdownMenuItem>
                            )}
                            {order.status === 'shipped' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark as Delivered
                              </DropdownMenuItem>
                            )}
                            {!['cancelled', 'delivered', 'returned'].includes(order.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(order.id, 'cancelled')}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
