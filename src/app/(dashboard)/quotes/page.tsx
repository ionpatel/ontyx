'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Filter, FileText, Send, Check, X,
  MoreHorizontal, Eye, Edit, Trash2, Copy, ArrowRight,
  Clock, DollarSign, TrendingUp, AlertCircle, RefreshCw,
  CheckCircle, XCircle, FileDown
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
import { useQuotes, useQuoteStats } from '@/hooks/use-quotes'
import { formatCurrency, cn, formatDate } from '@/lib/utils'
import type { QuoteStatus } from '@/types/quotes'

const statusConfig: Record<QuoteStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-indigo-100 text-indigo-700', icon: Eye },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-amber-100 text-amber-700', icon: Clock },
  converted: { label: 'Converted', color: 'bg-purple-100 text-purple-700', icon: ArrowRight },
}

export default function QuotesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all')

  const { quotes, loading, sendQuote, acceptQuote, rejectQuote, convertToInvoice, deleteQuote, refetch } = useQuotes(
    statusFilter !== 'all' ? statusFilter : undefined
  )
  const { stats } = useQuoteStats()

  const filteredQuotes = quotes.filter(quote => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      quote.quote_number.toLowerCase().includes(q) ||
      quote.customer_name.toLowerCase().includes(q) ||
      quote.customer_email?.toLowerCase().includes(q) ||
      quote.title?.toLowerCase().includes(q)
    )
  })

  const handleSend = async (id: string) => {
    await sendQuote(id)
  }

  const handleAccept = async (id: string) => {
    await acceptQuote(id)
  }

  const handleReject = async (id: string) => {
    await rejectQuote(id)
  }

  const handleConvert = async (id: string) => {
    const invoiceId = await convertToInvoice(id)
    if (invoiceId) {
      router.push(`/invoices/${invoiceId}`)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteQuote(id)
  }

  const statCards = [
    {
      title: 'Total Quotes',
      value: stats?.total || 0,
      icon: FileText,
      description: 'All time',
    },
    {
      title: 'Pending',
      value: (stats?.sent || 0) + (stats?.draft || 0),
      icon: Clock,
      description: 'Awaiting response',
      alert: (stats?.sent || 0) > 0,
    },
    {
      title: 'Accepted Value',
      value: formatCurrency(stats?.accepted_value || 0),
      icon: DollarSign,
      description: `${stats?.accepted || 0} quotes`,
    },
    {
      title: 'Conversion Rate',
      value: `${(stats?.conversion_rate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      description: 'Accepted / Total',
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">
            Create and manage customer quotes & estimates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/quotes/new">
              <Plus className="mr-2 h-4 w-4" /> New Quote
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
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuoteStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Quotes
          </CardTitle>
          <CardDescription>
            {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No quotes found</h3>
              <p className="text-muted-foreground mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first quote to get started'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link href="/quotes/new">
                    <Plus className="mr-2 h-4 w-4" /> Create Quote
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const status = statusConfig[quote.status]
                  const StatusIcon = status.icon
                  const isExpired = new Date(quote.valid_until) < new Date() && 
                    !['accepted', 'rejected', 'converted', 'expired'].includes(quote.status)

                  return (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {quote.quote_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{quote.customer_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {quote.customer_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {quote.title || '—'}
                      </TableCell>
                      <TableCell>{formatDate(quote.quote_date)}</TableCell>
                      <TableCell className={cn(isExpired && "text-red-600")}>
                        {formatDate(quote.valid_until)}
                        {isExpired && <AlertCircle className="inline ml-1 h-3 w-3" />}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(quote.total, quote.currency)}
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
                              <Link href={`/quotes/${quote.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            {quote.status === 'draft' && (
                              <>
                                <DropdownMenuItem asChild>
                                  <Link href={`/quotes/${quote.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSend(quote.id)}>
                                  <Send className="mr-2 h-4 w-4" /> Send to Customer
                                </DropdownMenuItem>
                              </>
                            )}
                            {(quote.status === 'sent' || quote.status === 'viewed') && (
                              <>
                                <DropdownMenuItem onClick={() => handleAccept(quote.id)}>
                                  <Check className="mr-2 h-4 w-4" /> Mark Accepted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(quote.id)}>
                                  <X className="mr-2 h-4 w-4" /> Mark Rejected
                                </DropdownMenuItem>
                              </>
                            )}
                            {quote.status === 'accepted' && (
                              <DropdownMenuItem onClick={() => handleConvert(quote.id)}>
                                <ArrowRight className="mr-2 h-4 w-4" /> Convert to Invoice
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'converted' && quote.converted_to_invoice_id && (
                              <DropdownMenuItem asChild>
                                <Link href={`/invoices/${quote.converted_to_invoice_id}`}>
                                  <FileText className="mr-2 h-4 w-4" /> View Invoice
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/quotes/new?duplicate=${quote.id}`}>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </Link>
                            </DropdownMenuItem>
                            {(quote.status === 'draft' || quote.status === 'rejected') && (
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
                                    <AlertDialogTitle>Delete Quote?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete quote {quote.quote_number}. 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(quote.id)}
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
