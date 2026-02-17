"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Truck, Plus, Search, MoreHorizontal, 
  Clock, CheckCircle, Package, AlertTriangle,
  Edit, Trash2, Eye, Send, Loader2, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { formatCurrency, cn } from "@/lib/utils"
import { usePurchaseOrders, usePurchaseStats } from "@/hooks/use-purchases"
import type { OrderStatus } from "@/services/purchases"
import { useToast } from "@/components/ui/toast"

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: Edit },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: Send },
  processing: { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Clock },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700', icon: Package },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

export default function PurchasesPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const { orders, loading, updateStatus, deleteOrder, refetch } = usePurchaseOrders(
    statusFilter === 'all' ? undefined : { status: statusFilter }
  )
  const { stats } = usePurchaseStats()
  const { success, error: showError } = useToast()

  const [search, setSearch] = useState('')

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
      order.vendorRef?.toLowerCase().includes(search.toLowerCase())
    
    return matchesSearch
  })

  const handleConfirm = async (id: string) => {
    const ok = await updateStatus(id, 'confirmed')
    if (ok) {
      success('Confirmed', 'Purchase order has been confirmed')
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this purchase order?')) return
    
    const ok = await updateStatus(id, 'cancelled')
    if (ok) {
      success('Cancelled', 'Purchase order has been cancelled')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this purchase order? Only draft orders can be deleted.')) return
    
    const ok = await deleteOrder(id)
    if (ok) {
      success('Deleted', 'Purchase order removed')
    } else {
      showError('Error', 'Only draft orders can be deleted')
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage orders to vendors and suppliers
          </p>
        </div>
        <Button asChild>
          <Link href="/purchases/new">
            <Plus className="mr-2 h-4 w-4" /> New Purchase Order
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipt</CardTitle>
            <Package className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pendingReceipt || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.overdueOrders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalValue || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Purchase Orders</h3>
              <p className="text-muted-foreground mb-6">
                {search || statusFilter !== 'all'
                  ? 'No orders match your filters'
                  : 'Create your first purchase order to start ordering from vendors'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button asChild>
                  <Link href="/purchases/new">
                    <Plus className="mr-2 h-4 w-4" /> New Purchase Order
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status]
                  const StatusIcon = status.icon
                  const isOverdue = order.expectedDate && 
                    new Date(order.expectedDate) < new Date() &&
                    !['completed', 'cancelled'].includes(order.status)
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link href={`/purchases/${order.id}`} className="font-medium hover:text-primary">
                          {order.orderNumber}
                        </Link>
                        {order.vendorRef && (
                          <div className="text-xs text-muted-foreground">Ref: {order.vendorRef}</div>
                        )}
                      </TableCell>
                      <TableCell>{order.vendorName || '—'}</TableCell>
                      <TableCell>{formatDate(order.orderDate)}</TableCell>
                      <TableCell>
                        <span className={cn(isOverdue && "text-red-600 font-medium")}>
                          {formatDate(order.expectedDate)}
                        </span>
                        {isOverdue && (
                          <div className="text-xs text-red-600">Overdue</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs gap-1", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/purchases/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            {order.status === 'draft' && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/purchases/${order.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleConfirm(order.id)}>
                                  <Send className="mr-2 h-4 w-4" /> Confirm Order
                                </DropdownMenuItem>
                              </>
                            )}
                            {['confirmed', 'processing', 'partial'].includes(order.status) && (
                              <DropdownMenuItem asChild>
                                <Link href={`/purchases/${order.id}/receive`}>
                                  <Package className="mr-2 h-4 w-4" /> Receive Items
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {!['completed', 'cancelled'].includes(order.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleCancel(order.id)}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4" /> Cancel Order
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === 'draft' && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(order.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
