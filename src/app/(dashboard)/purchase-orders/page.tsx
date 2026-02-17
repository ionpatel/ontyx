'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Package, Clock, CheckCircle2, 
  AlertTriangle, MoreHorizontal, Eye, Trash2, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { usePurchaseOrders, usePurchaseOrderSummary, useDeletePurchaseOrder, useUpdatePurchaseOrderStatus } from '@/hooks/use-purchase-orders'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { OrderStatus } from '@/types/purchase-orders'
import { useToast } from '@/components/ui/toast'

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: AlertTriangle }
}

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders()
  const { data: summary } = usePurchaseOrderSummary()
  const deleteMutation = useDeletePurchaseOrder()
  const updateStatusMutation = useUpdatePurchaseOrderStatus()
  
  // Filter POs
  const filteredOrders = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.contact?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.vendor_ref?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter
    
    return matchesSearch && matchesStatus
  })
  
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this purchase order?')) return
    
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Purchase order deleted')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    }
  }
  
  const handleConfirm = async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'confirmed' })
      toast.success('Purchase order confirmed')
    } catch (error) {
      toast.error('Failed to confirm order')
    }
  }
  
  const stats = [
    {
      title: 'Total Orders',
      value: summary?.total_orders || 0,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Draft',
      value: summary?.draft_count || 0,
      icon: FileText,
      color: 'text-slate-600'
    },
    {
      title: 'Pending Receipt',
      value: summary?.pending_count || 0,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Pending Value',
      value: formatCurrency(summary?.pending_value || 0, 'CAD'),
      icon: AlertTriangle,
      color: 'text-orange-600'
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage vendor orders and receiving
          </p>
        </div>
        <Button asChild>
          <Link href="/purchase-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No purchase orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((po) => {
                  const status = statusConfig[po.status]
                  return (
                    <TableRow 
                      key={po.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/purchase-orders/${po.id}`)}
                    >
                      <TableCell className="font-medium">
                        {po.order_number}
                        {po.vendor_ref && (
                          <span className="block text-xs text-muted-foreground">
                            Ref: {po.vendor_ref}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{po.contact?.display_name}</TableCell>
                      <TableCell>{formatDate(po.order_date)}</TableCell>
                      <TableCell>
                        {po.expected_date ? formatDate(po.expected_date) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-normal", status.color)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(po.total, po.currency)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/purchase-orders/${po.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {po.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleConfirm(po.id)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirm Order
                              </DropdownMenuItem>
                            )}
                            {po.status === 'draft' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(po.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
