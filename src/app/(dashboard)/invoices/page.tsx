"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Plus, FileText, DollarSign, AlertCircle, Clock, 
  Send, CheckCircle, MoreHorizontal, Search, Filter,
  Eye, Edit, Trash2, Copy, Download, CreditCard, RefreshCw,
  FileDown
} from "lucide-react"
import { exportInvoicesToCSV } from "@/lib/export"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useInvoices, useInvoiceStats } from "@/hooks/use-invoices"
import type { InvoiceStatus } from "@/services/invoices"
import { formatCurrency, cn } from "@/lib/utils"

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  viewed: { label: "Viewed", color: "bg-indigo-100 text-indigo-700", icon: Eye },
  partial: { label: "Partial", color: "bg-amber-100 text-amber-700", icon: CreditCard },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: Trash2 },
  void: { label: "Void", color: "bg-gray-100 text-gray-700", icon: Trash2 },
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all")
  
  const { invoices, loading, updateInvoiceStatus } = useInvoices(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  )
  const { stats } = useInvoiceStats()

  const filteredInvoices = invoices.filter(invoice => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        invoice.invoiceNumber.toLowerCase().includes(q) ||
        invoice.customerName.toLowerCase().includes(q) ||
        invoice.customerEmail?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    await updateInvoiceStatus(id, status)
  }

  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue || 0, 'CAD'),
      icon: DollarSign,
      description: `${stats?.totalInvoices || 0} invoices`,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Outstanding",
      value: formatCurrency(stats?.totalOutstanding || 0, 'CAD'),
      icon: Clock,
      description: "Unpaid amount",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Overdue",
      value: formatCurrency(stats?.overdueAmount || 0, 'CAD'),
      icon: AlertCircle,
      description: `${stats?.overdueCount || 0} invoice${(stats?.overdueCount || 0) !== 1 ? 's' : ''}`,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      alert: (stats?.overdueCount || 0) > 0,
    },
    {
      title: "Collected",
      value: formatCurrency(stats?.totalPaid || 0, 'CAD'),
      icon: CheckCircle,
      description: "Paid invoices",
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Invoices</h1>
          <p className="text-text-secondary mt-1">
            Create and manage customer invoices
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportInvoicesToCSV(invoices)}
            disabled={invoices.length === 0}
          >
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" asChild>
            <Link href="/invoices/recurring">
              <RefreshCw className="mr-2 h-4 w-4" /> Recurring
            </Link>
          </Button>
          <Button asChild className="shadow-maple">
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title} 
            className={cn(
              "border-border hover:shadow-md transition-shadow",
              stat.alert && "border-red-200 bg-red-50/50"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.iconBg)}>
                <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                stat.alert ? "text-red-600" : "text-text-primary"
              )}>
                {stat.value}
              </div>
              <p className="text-xs text-text-muted mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Invoices
              </CardTitle>
              <CardDescription>
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
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
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-primary">No invoices found</h3>
              <p className="text-text-muted mt-1">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first invoice to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/invoices/new">
                    <Plus className="mr-2 h-4 w-4" /> Create Invoice
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background-secondary hover:bg-background-secondary">
                    <TableHead className="font-semibold">Invoice #</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Issue Date</TableHead>
                    <TableHead className="font-semibold">Due Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="text-right font-semibold">Balance</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const StatusIcon = statusConfig[invoice.status].icon
                    const isOverdue = invoice.status === 'overdue' || (
                      invoice.status !== 'paid' && 
                      invoice.status !== 'cancelled' && 
                      new Date(invoice.dueDate) < new Date()
                    )
                    
                    return (
                      <TableRow key={invoice.id} className="hover:bg-surface-hover">
                        <TableCell>
                          <Link 
                            href={`/invoices/${invoice.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-text-primary">{invoice.customerName}</div>
                            <div className="text-sm text-text-muted">{invoice.customerEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {new Date(invoice.invoiceDate).toLocaleDateString('en-CA')}
                        </TableCell>
                        <TableCell className={cn(
                          "text-text-secondary",
                          isOverdue && "text-red-600 font-medium"
                        )}>
                          {new Date(invoice.dueDate).toLocaleDateString('en-CA')}
                          {isOverdue && <AlertCircle className="inline ml-1 h-3 w-3" />}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("font-medium", statusConfig[invoice.status].color)}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[invoice.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-text-primary">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-semibold",
                          invoice.amountDue > 0 ? "text-amber-600" : "text-green-600"
                        )}>
                          {formatCurrency(invoice.amountDue, invoice.currency)}
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
                                <Link href={`/invoices/${invoice.id}`}>
                                  <Eye className="mr-2 h-4 w-4" /> View Invoice
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/invoices/${invoice.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" /> Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                              {invoice.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'sent')}>
                                  <Send className="mr-2 h-4 w-4" /> Mark as Sent
                                </DropdownMenuItem>
                              )}
                              {(invoice.status === 'sent' || invoice.status === 'partial' || invoice.status === 'overdue') && (
                                <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'paid')}>
                                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleStatusChange(invoice.id, 'cancelled')}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Cancel Invoice
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
