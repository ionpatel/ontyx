'use client'

import Link from 'next/link'
import { 
  ShoppingCart, MoreHorizontal, Edit, Trash2, Eye,
  Clock, CheckCircle, Truck, Package, XCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, cn } from '@/lib/utils'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  status: 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  itemCount: number
  createdAt: string
  expectedDate?: string
}

interface OrderCardProps {
  order: Order
  onEdit?: (order: Order) => void
  onDelete?: (order: Order) => void
  className?: string
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: 'Draft', icon: Clock, className: 'bg-slate-100 text-slate-700' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, className: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', icon: Package, className: 'bg-purple-100 text-purple-700' },
  shipped: { label: 'Shipped', icon: Truck, className: 'bg-cyan-100 text-cyan-700' },
  delivered: { label: 'Delivered', icon: CheckCircle, className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-red-100 text-red-700' },
}

export function OrderCard({ order, onEdit, onDelete, className }: OrderCardProps) {
  const status = statusConfig[order.status] || statusConfig.pending
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left side - Order info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/sales/${order.id}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {order.orderNumber}
                </Link>
                <Badge className={cn("text-xs", status.className)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {order.customerName}
              </p>

              {/* Details row */}
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="font-semibold text-lg">
                  {formatCurrency(order.total, 'CAD')}
                </span>
                <span className="text-muted-foreground">
                  {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {formatDate(order.createdAt)}
                </span>
              </div>

              {order.expectedDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expected: {formatDate(order.expectedDate)}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/sales/${order.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(order)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(order)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
