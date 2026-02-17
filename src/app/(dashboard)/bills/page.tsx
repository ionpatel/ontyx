'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Receipt, DollarSign, Clock, AlertCircle,
  MoreHorizontal, Eye, Trash2, CheckCircle2, CreditCard
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
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useBills, useBillSummary, useDeleteBill, useUpdateBillStatus, useRecordBillPayment } from '@/hooks/use-bills'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { BillStatus } from '@/types/bills'
import { useToast } from '@/components/ui/toast'

const statusConfig: Record<BillStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  void: { label: 'Void', color: 'bg-gray-100 text-gray-700' }
}

export default function BillsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  
  const toast = useToast()
  const { data: bills = [], isLoading } = useBills()
  const { data: summary } = useBillSummary()
  const deleteMutation = useDeleteBill()
  const updateStatusMutation = useUpdateBillStatus()
  const recordPaymentMutation = useRecordBillPayment()
  
  // Filter bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.contact?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendor_ref?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter
    
    return matchesSearch && matchesStatus
  })
  
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bill?')) return
    
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Bill deleted')
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    }
  }
  
  const handleApprove = async (id: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: 'approved' })
      toast.success('Bill approved')
    } catch (error) {
      toast.error('Failed to approve bill')
    }
  }
  
  const openPaymentDialog = (id: string, amountDue: number) => {
    setSelectedBillId(id)
    setPaymentAmount(amountDue.toString())
    setShowPaymentDialog(true)
  }
  
  const handleRecordPayment = async () => {
    if (!selectedBillId || !paymentAmount) return
    
    try {
      await recordPaymentMutation.mutateAsync({
        id: selectedBillId,
        amount: parseFloat(paymentAmount)
      })
      toast.success('Payment recorded')
      setShowPaymentDialog(false)
      setSelectedBillId(null)
      setPaymentAmount('')
    } catch (error) {
      toast.error('Failed to record payment')
    }
  }
  
  const stats = [
    {
      title: 'Total Payable',
      value: formatCurrency(summary?.total_payable || 0, 'CAD'),
      icon: Receipt,
      color: 'text-blue-600'
    },
    {
      title: 'Pending',
      value: summary?.pending_count || 0,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Overdue',
      value: summary?.overdue_count || 0,
      icon: AlertCircle,
      color: 'text-red-600'
    },
    {
      title: 'Overdue Amount',
      value: formatCurrency(summary?.overdue_amount || 0, 'CAD'),
      icon: DollarSign,
      color: 'text-red-600'
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="text-muted-foreground">
            Manage vendor bills and accounts payable
          </p>
        </div>
        <Button asChild>
          <Link href="/bills/new">
            <Plus className="mr-2 h-4 w-4" />
            New Bill
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
            placeholder="Search bills..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
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
              ) : filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No bills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((bill) => {
                  const status = statusConfig[bill.status]
                  const isOverdue = bill.status === 'overdue' || 
                    (bill.status === 'pending' && new Date(bill.due_date) < new Date())
                  
                  return (
                    <TableRow 
                      key={bill.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/bills/${bill.id}`)}
                    >
                      <TableCell className="font-medium">
                        {bill.bill_number}
                        {bill.vendor_ref && (
                          <span className="block text-xs text-muted-foreground">
                            Ref: {bill.vendor_ref}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{bill.contact?.display_name}</TableCell>
                      <TableCell>{formatDate(bill.bill_date)}</TableCell>
                      <TableCell className={cn(isOverdue && 'text-red-600 font-medium')}>
                        {formatDate(bill.due_date)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("font-normal", status.color)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(bill.amount_due, bill.currency)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/bills/${bill.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {bill.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleApprove(bill.id)}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {['pending', 'approved', 'partial'].includes(bill.status) && (
                              <DropdownMenuItem onClick={() => openPaymentDialog(bill.id, bill.amount_due)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            {bill.status === 'draft' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(bill.id)}
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
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
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
