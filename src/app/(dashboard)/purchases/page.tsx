'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Filter, FileText, Send, Package,
  MoreHorizontal, Eye, Edit, Trash2, Check, X,
  Clock, DollarSign, Truck, AlertCircle, RefreshCw,
  CheckCircle, XCircle, Receipt, ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { usePurchaseOrders, usePOStats } from '@/hooks/use-purchase-orders'
import { formatCurrency, cn, formatDate } from '@/lib/utils'
import type { POStatus } from '@/types/purchase-orders'

const statusConfig: Record<POStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  confirmed: { label: 'Confirmed', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700', icon: Package },
  received: { label: 'Received', color: 'bg-green-100 text-green-700', icon: Package },
  billed: { label: 'Billed', color: 'bg-purple-100 text-purple-700', icon: Receipt },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function PurchasesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all')

  const { orders, loading, sendPO, confirmPO, cancelPO, createBill, deletePO, refetch } = usePurchaseOrders(
    statusFilter !== 'all' ? statusFilter : undefined
  )
  const { stats } = usePOStats()

  const filteredOrders = orders.filter(order => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      order.po_number.toLowerCase().includes(q) ||
      order.vendor_name.toLowerCase().includes(q) ||
      order.vendor_email?.toLowerCase().includes(q)
    )
  })

  const handleSend = async (id: string) => {
    await sendPO(id)
  }

  const handleConfirm = async (id: string) => {
    await confirmPO(id)
  }

  const handleCancel = async (id: string) => {
    await cancelPO(id)
  }

  const handleCreateBill = async (id: string) => {
    const billId = await createBill(id)
    if (billId) {
      router.push(`/bills/${billId}`)
    }
  }

  const handleDelete = async (id: string) => {
    await deletePO(id)
  }

  const statCards = [
    {
      title: 'Total Orders',
      value: stats?.total || 0,
      icon: FileText,
      description: 'All time',
    },
    {
      title: 'Pending',
      value: stats?.pending || 0,
      icon: Clock,
      description: 'Awaiting delivery',
      alert: (stats?.pending || 0) > 0,
    },
    {
      title: 'Pending Value',
      value: formatCurrency(stats?.pending_value || 0),
      icon: DollarSign,
      description: 'To be received',
    },
    {
      title: 'Overdue',
      value: stats?.overdue || 0,
      icon: AlertCircle,
      description: 'Past expected date',
      alert: (stats?.overdue || 0) > 0,
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage orders to your vendors and suppliers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/purchases/new">
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={cn(stat.alert && "border-amber-200 bg-amber-50/50")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", stat.alert && "text-amber-600")}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as POStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="billed">Billed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Purchase Orders
          </CardTitle>
          <CardDescription>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Truck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No purchase orders found</h3>
              <p className="text-muted-foreground mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first purchase order'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link href="/purchases/new">
                    <Plus className="mr-2 h-4 w-4" /> Create Order
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const status = statusConfig[order.status]
                  const StatusIcon = status.icon
                  const isOverdue = order.expected_date && 
                    new Date(order.expected_date) < new Date() && 
                    !['received', 'billed', 'cancelled'].includes(order.status)

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/purchases/${order.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {order.po_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.vendor_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.vendor_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell className={cn(isOverdue && "text-red-600")}>
                        {order.expected_date ? formatDate(order.expected_date) : '—'}
                        {isOverdue && <AlertCircle className="inline ml-1 h-3 w-3" />}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
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
                              <Link href={`/purchases/${order.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            {order.status === 'draft' && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/purchases/${order.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSend(order.id)}>
                                  <Send className="mr-2 h-4 w-4" /> Send to Vendor
                                </DropdownMenuItem>
                              </>
                            )}
                            {order.status === 'sent' && (
                              <DropdownMenuItem onClick={() => handleConfirm(order.id)}>
                                <Check className="mr-2 h-4 w-4" /> Mark Confirmed
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'confirmed' || order.status === 'partial') && (
                              <DropdownMenuItem asChild>
                                <Link href={`/purchases/${order.id}/receive`}>
                                  <Package className="mr-2 h-4 w-4" /> Receive Items
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {order.status === 'received' && (
                              <DropdownMenuItem onClick={() => handleCreateBill(order.id)}>
                                <Receipt className="mr-2 h-4 w-4" /> Create Bill
                              </DropdownMenuItem>
                            )}
                            {order.status === 'billed' && order.bill_id && (
                              <DropdownMenuItem asChild>
                                <Link href={`/bills/${order.bill_id}`}>
                                  <Receipt className="mr-2 h-4 w-4" /> View Bill
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {!['received', 'billed', 'cancelled'].includes(order.status) && (
                              <DropdownMenuItem 
                                onClick={() => handleCancel(order.id)}
                                className="text-amber-600"
                              >
                                <X className="mr-2 h-4 w-4" /> Cancel Order
                              </DropdownMenuItem>
                            )}
                            {order.status === 'draft' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem 
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete {order.po_number}. 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(order.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
