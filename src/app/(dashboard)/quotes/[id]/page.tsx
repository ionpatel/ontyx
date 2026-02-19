'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Send, Check, X, FileText, Edit, Trash2,
  Copy, ArrowRight, Clock, DollarSign, User, Calendar,
  MoreHorizontal, Loader2, CheckCircle, XCircle, Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { useQuote, useQuotes } from '@/hooks/use-quotes'
import { formatCurrency, cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import type { QuoteStatus } from '@/types/quotes'

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100', icon: Clock },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100', icon: FileText },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100', icon: Clock },
  converted: { label: 'Converted', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100', icon: ArrowRight },
}

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string
  
  const { quote, loading } = useQuote(quoteId)
  const { sendQuote, acceptQuote, rejectQuote, convertToInvoice, deleteQuote, refetch } = useQuotes()
  const { success, error: showError } = useToast()
  
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const loadQuote = () => {
    refetch()
    // Force a page reload to refresh the quote data
    router.refresh()
  }

  const handleSend = async () => {
    setActionLoading('send')
    const sent = await sendQuote(quoteId)
    if (sent) {
      success('Quote Sent', 'The quote has been sent to the customer')
      loadQuote()
    } else {
      showError('Error', 'Failed to send quote')
    }
    setActionLoading(null)
  }

  const handleAccept = async () => {
    setActionLoading('accept')
    const accepted = await acceptQuote(quoteId)
    if (accepted) {
      success('Quote Accepted', 'The quote has been marked as accepted')
      loadQuote()
    } else {
      showError('Error', 'Failed to accept quote')
    }
    setActionLoading(null)
  }

  const handleReject = async () => {
    setActionLoading('reject')
    const rejected = await rejectQuote(quoteId)
    if (rejected) {
      success('Quote Rejected', 'The quote has been marked as rejected')
      loadQuote()
    } else {
      showError('Error', 'Failed to reject quote')
    }
    setActionLoading(null)
    setShowRejectDialog(false)
  }

  const handleConvert = async () => {
    setActionLoading('convert')
    const invoiceId = await convertToInvoice(quoteId)
    if (invoiceId) {
      success('Invoice Created', 'Quote has been converted to an invoice')
      router.push(`/invoices/${invoiceId}`)
    } else {
      showError('Error', 'Failed to convert quote to invoice')
    }
    setActionLoading(null)
  }

  const handleDelete = async () => {
    setActionLoading('delete')
    const deleted = await deleteQuote(quoteId)
    if (deleted) {
      success('Quote Deleted', 'The quote has been deleted')
      router.push('/quotes')
    } else {
      showError('Error', 'Failed to delete quote')
    }
    setActionLoading(null)
    setShowDeleteDialog(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Quote not found</h2>
        <Button asChild>
          <Link href="/quotes">Back to Quotes</Link>
        </Button>
      </div>
    )
  }

  const status = statusConfig[quote.status]
  const StatusIcon = status.icon

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quotes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{quote.quote_number}</h1>
            <Badge className={cn('gap-1', status.color)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {quote.title || 'Quote'} for {quote.customer_name}
          </p>
        </div>
        
        <div className="flex gap-2">
          {quote.status === 'draft' && (
            <>
              <Button variant="outline" onClick={handleSend} disabled={actionLoading === 'send'}>
                {actionLoading === 'send' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Quote
              </Button>
              <Button asChild variant="outline">
                <Link href={`/quotes/new?duplicate=${quote.id}`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
            </>
          )}
          
          {quote.status === 'sent' && (
            <>
              <Button variant="outline" onClick={handleAccept} disabled={actionLoading === 'accept'}>
                {actionLoading === 'accept' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Mark Accepted
              </Button>
              <Button variant="outline" onClick={() => setShowRejectDialog(true)}>
                <X className="mr-2 h-4 w-4" /> Reject
              </Button>
            </>
          )}
          
          {quote.status === 'accepted' && (
            <Button onClick={handleConvert} disabled={actionLoading === 'convert'}>
              {actionLoading === 'convert' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              Convert to Invoice
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/quotes/new?duplicate=${quote.id}`}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-medium">{quote.customer_name}</p>
                {quote.customer_email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {quote.customer_email}
                  </p>
                )}
                {quote.customer_address && (
                  <p className="text-sm text-muted-foreground">{quote.customer_address}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(quote.items || []).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{item.taxRate}%</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Terms */}
          {quote.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.terms}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(quote.subtotal)}</span>
                </div>
                {quote.discount_total > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(quote.discount_total)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(quote.tax_total)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quote Date</span>
                <span>{new Date(quote.quote_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Until</span>
                <span>{new Date(quote.valid_until).toLocaleDateString()}</span>
              </div>
              {quote.sent_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span>{new Date(quote.sent_at).toLocaleDateString()}</span>
                </div>
              )}
              {quote.accepted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepted</span>
                  <span>{new Date(quote.accepted_at).toLocaleDateString()}</span>
                </div>
              )}
              {quote.converted_to_invoice_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <Link href={`/invoices/${quote.converted_to_invoice_id}`} className="text-primary hover:underline">
                    View Invoice
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {quote.quote_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {actionLoading === 'delete' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Quote</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this quote as rejected? You can still duplicate it to create a new quote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>
              {actionLoading === 'reject' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
