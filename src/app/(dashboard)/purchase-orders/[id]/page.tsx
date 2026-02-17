'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Package, CheckCircle2, Clock, AlertTriangle,
  FileText, Building2, Calendar, Truck, MoreHorizontal,
  Download, Printer, Ban, Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { 
  usePurchaseOrder, 
  useUpdatePurchaseOrderStatus, 
  useReceiveItems,
  useConvertToBill
} from '@/hooks/use-purchase-orders'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { OrderStatus } from '@/types/purchase-orders'
import { useToast } from '@/components/ui/toast'

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: Ban }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PurchaseOrderDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const toast = useToast()
  const { data: po, isLoading, error } = usePurchaseOrder(id)
  const updateStatusMutation = useUpdatePurchaseOrderStatus()
  const receiveItemsMutation = useReceiveItems()
  const convertToBillMutation = useConvertToBill()
  
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({})
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }
  
  if (error || !po) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Purchase order not found</p>
        <Button asChild variant="outline">
          <Link href="/purchase-orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }
  
  const status = statusConfig[po.status]
  const StatusIcon = status.icon
  
  // Calculate received percentage
  const totalQty = po.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  const receivedQty = po.items?.reduce((sum, item) => sum + item.quantity_received, 0) || 0
  const receivedPercent = totalQty > 0 ? (receivedQty / totalQty) * 100 : 0
  
  const handleConfirm = async () => {
    try {
      await updateStatusMutation.mutateAsync({ id: po.id, status: 'confirmed' })
      toast.success('Order confirmed')
    } catch (error) {
      toast.error('Failed to confirm order')
    }
  }
  
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    try {
      await updateStatusMutation.mutateAsync({ id: po.id, status: 'cancelled' })
      toast.success('Order cancelled')
    } catch (error) {
      toast.error('Failed to cancel order')
    }
  }
  
  const handleReceiveItems = async () => {
    const itemsToReceive = Object.entries(receiveQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        item_id: itemId,
        quantity_received: qty
      }))
    
    if (itemsToReceive.length === 0) {
      toast.error('Please enter quantities to receive')
      return
    }
    
    try {
      await receiveItemsMutation.mutateAsync({
        purchaseOrderId: po.id,
        items: itemsToReceive
      })
      toast.success('Items received')
      setShowReceiveDialog(false)
      setReceiveQuantities({})
    } catch (error) {
      toast.error('Failed to receive items')
    }
  }
  
  const handleConvertToBill = async () => {
    try {
      const billId = await convertToBillMutation.mutateAsync(po.id)
      toast.success('Bill created from purchase order')
      router.push(`/bills/${billId}`)
    } catch (error) {
      toast.error('Failed to create bill')
    }
  }
  
  // Initialize receive quantities
  const openReceiveDialog = () => {
    const initial: Record<string, number> = {}
    po.items?.forEach(item => {
      initial[item.id] = item.quantity - item.quantity_received
    })
    setReceiveQuantities(initial)
    setShowReceiveDialog(true)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/purchase-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{po.order_number}</h1>
              <Badge className={cn("text-sm", status.color)}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {po.contact?.display_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {po.status === 'draft' && (
            <Button onClick={handleConfirm}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Confirm Order
            </Button>
          )}
          
          {['confirmed', 'processing', 'partial'].includes(po.status) && (
            <Button onClick={openReceiveDialog}>
              <Truck className="mr-2 h-4 w-4" />
              Receive Items
            </Button>
          )}
          
          {po.status === 'completed' && !po.bill_id && (
            <Button onClick={handleConvertToBill} disabled={convertToBillMutation.isPending}>
              <Receipt className="mr-2 h-4 w-4" />
              {convertToBillMutation.isPending ? 'Creating...' : 'Create Bill'}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" />
                Print Order
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {po.status !== 'cancelled' && po.status !== 'completed' && (
                <DropdownMenuItem className="text-destructive" onClick={handleCancel}>
                  <Ban className="mr-2 h-4 w-4" />
                  Cancel Order
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Progress */}
      {['confirmed', 'processing', 'partial'].includes(po.status) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Receiving Progress</span>
              <span className="text-sm text-muted-foreground">
                {receivedQty} of {totalQty} items received ({Math.round(receivedPercent)}%)
              </span>
            </div>
            <Progress value={receivedPercent} className="h-2" />
          </CardContent>
        </Card>
      )}
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{po.items?.length || 0} items</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.description}</p>
                          {item.product?.sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {item.product.sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          item.quantity_received >= item.quantity 
                            ? 'text-green-600' 
                            : item.quantity_received > 0 
                              ? 'text-yellow-600' 
                              : ''
                        )}>
                          {item.quantity_received}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price, po.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.line_total, po.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Notes */}
          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(po.subtotal, po.currency)}</span>
              </div>
              {po.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatCurrency(po.discount_amount, po.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(po.tax_amount, po.currency)}</span>
              </div>
              {po.shipping_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(po.shipping_amount, po.currency)}</span>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(po.total, po.currency)}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{po.contact?.display_name}</p>
                  {po.contact?.email && (
                    <p className="text-sm text-muted-foreground">{po.contact.email}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(po.order_date)}</p>
                </div>
              </div>
              
              {po.expected_date && (
                <div className="flex items-start gap-3">
                  <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-medium">{formatDate(po.expected_date)}</p>
                  </div>
                </div>
              )}
              
              {po.vendor_ref && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor Reference</p>
                    <p className="font-medium">{po.vendor_ref}</p>
                  </div>
                </div>
              )}
              
              {po.warehouse && (
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Receiving Warehouse</p>
                    <p className="font-medium">{po.warehouse.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Receive Items Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receive Items</DialogTitle>
            <DialogDescription>
              Enter the quantities received for each item
            </DialogDescription>
          </DialogHeader>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Already Received</TableHead>
                <TableHead className="text-right w-[120px]">Receive Now</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items?.map((item) => {
                const remaining = item.quantity - item.quantity_received
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.description}</p>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.quantity_received}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min="0"
                        max={remaining}
                        value={receiveQuantities[item.id] || 0}
                        onChange={(e) => setReceiveQuantities({
                          ...receiveQuantities,
                          [item.id]: Math.min(Number(e.target.value), remaining)
                        })}
                        className="w-20 text-right"
                        disabled={remaining === 0}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReceiveItems} disabled={receiveItemsMutation.isPending}>
              {receiveItemsMutation.isPending ? 'Receiving...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
