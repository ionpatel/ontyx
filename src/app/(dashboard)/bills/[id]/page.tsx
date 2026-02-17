'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Receipt, CheckCircle2, Clock, AlertCircle,
  Building2, Calendar, CreditCard, MoreHorizontal,
  Download, Printer, Ban
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { useBill, useUpdateBillStatus, useRecordBillPayment } from '@/hooks/use-bills'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { BillStatus } from '@/types/bills'
import { useToast } from '@/components/ui/toast'

const statusConfig: Record<BillStatus, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: Receipt },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  void: { label: 'Void', color: 'bg-gray-100 text-gray-700', icon: Ban }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function BillDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const toast = useToast()
  const { data: bill, isLoading, error } = useBill(id)
  const updateStatusMutation = useUpdateBillStatus()
  const recordPaymentMutation = useRecordBillPayment()
  
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }
  
  if (error || !bill) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Bill not found</p>
        <Button asChild variant="outline">
          <Link href="/bills">Back to Bills</Link>
        </Button>
      </div>
    )
  }
  
  const status = statusConfig[bill.status]
  const StatusIcon = status.icon
  const isOverdue = bill.status === 'overdue' || 
    (['pending', 'approved', 'partial'].includes(bill.status) && new Date(bill.due_date) < new Date())
  
  const handleApprove = async () => {
    try {
      await updateStatusMutation.mutateAsync({ id: bill.id, status: 'approved' })
      toast.success('Bill approved')
    } catch (error) {
      toast.error('Failed to approve bill')
    }
  }
  
  const handleVoid = async () => {
    if (!confirm('Are you sure you want to void this bill?')) return
    try {
      await updateStatusMutation.mutateAsync({ id: bill.id, status: 'void' })
      toast.success('Bill voided')
    } catch (error) {
      toast.error('Failed to void bill')
    }
  }
  
  const openPaymentDialog = () => {
    setPaymentAmount(bill.amount_due.toString())
    setShowPaymentDialog(true)
  }
  
  const handleRecordPayment = async () => {
    if (!paymentAmount) return
    
    try {
      await recordPaymentMutation.mutateAsync({
        id: bill.id,
        amount: parseFloat(paymentAmount)
      })
      toast.success('Payment recorded')
      setShowPaymentDialog(false)
      setPaymentAmount('')
    } catch (error) {
      toast.error('Failed to record payment')
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bills">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{bill.bill_number}</h1>
              <Badge className={cn("text-sm", status.color)}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {isOverdue && bill.status !== 'overdue' ? 'Overdue' : status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {bill.contact?.display_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {bill.status === 'pending' && (
            <Button onClick={handleApprove}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
          )}
          
          {['pending', 'approved', 'partial'].includes(bill.status) && (
            <Button onClick={openPaymentDialog}>
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
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
                Print Bill
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {bill.status !== 'void' && bill.status !== 'paid' && (
                <DropdownMenuItem className="text-destructive" onClick={handleVoid}>
                  <Ban className="mr-2 h-4 w-4" />
                  Void Bill
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bill Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>{bill.items?.length || 0} items</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.description}</p>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unit_price, bill.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.tax_rate}%
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.line_total, bill.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {/* Notes */}
          {bill.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{bill.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(bill.subtotal, bill.currency)}</span>
              </div>
              {bill.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-{formatCurrency(bill.discount_amount, bill.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(bill.tax_amount, bill.currency)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(bill.total, bill.currency)}</span>
              </div>
              {bill.amount_paid > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid</span>
                  <span>-{formatCurrency(bill.amount_paid, bill.currency)}</span>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between font-semibold text-lg">
                <span>Amount Due</span>
                <span className={cn(isOverdue && 'text-red-600')}>
                  {formatCurrency(bill.amount_due, bill.currency)}
                </span>
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
                  <p className="font-medium">{bill.contact?.display_name}</p>
                  {bill.contact?.email && (
                    <p className="text-sm text-muted-foreground">{bill.contact.email}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Bill Date</p>
                  <p className="font-medium">{formatDate(bill.bill_date)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className={cn("font-medium", isOverdue && "text-red-600")}>
                    {formatDate(bill.due_date)}
                    {isOverdue && " (Overdue)"}
                  </p>
                </div>
              </div>
              
              {bill.vendor_ref && (
                <div className="flex items-start gap-3">
                  <Receipt className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor Reference</p>
                    <p className="font-medium">{bill.vendor_ref}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter the payment amount for this bill
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={bill.amount_due}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Amount due: {formatCurrency(bill.amount_due, bill.currency)}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordPaymentMutation.isPending}>
              {recordPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
