"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  MoreHorizontal, Eye, Edit, Send, Copy, Trash2, 
  ArrowUpDown, ChevronDown, Search, Filter, Download,
  CheckCircle, Mail
} from "lucide-react"
import { Invoice, InvoiceStatus } from "@/types/finance"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
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

interface InvoiceTableProps {
  invoices: Invoice[]
  onStatusChange?: (id: string, status: InvoiceStatus) => void
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
  onSend?: (id: string) => void
}

const statusConfig: Record<InvoiceStatus, { label: string; variant: string }> = {
  draft: { label: "Draft", variant: "draft" },
  sent: { label: "Sent", variant: "sent" },
  viewed: { label: "Viewed", variant: "viewed" },
  paid: { label: "Paid", variant: "paid" },
  partial: { label: "Partial", variant: "partial" },
  overdue: { label: "Overdue", variant: "overdue" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

type SortField = "invoiceNumber" | "customerName" | "issueDate" | "dueDate" | "total" | "status"
type SortDirection = "asc" | "desc"

export function InvoiceTable({ 
  invoices, 
  onStatusChange, 
  onDelete, 
  onDuplicate,
  onSend 
}: InvoiceTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all")
  const [sortField, setSortField] = useState<SortField>("issueDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredAndSortedInvoices = useMemo(() => {
    let result = invoices

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        inv =>
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.customerName.toLowerCase().includes(searchLower) ||
          inv.customerEmail.toLowerCase().includes(searchLower)
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter(inv => inv.status === statusFilter)
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "invoiceNumber":
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber)
          break
        case "customerName":
          comparison = a.customerName.localeCompare(b.customerName)
          break
        case "issueDate":
          comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
          break
        case "dueDate":
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          break
        case "total":
          comparison = a.total - b.total
          break
        case "status":
          comparison = a.status.localeCompare(b.status)
          break
      }
      return sortDirection === "asc" ? comparison : -comparison
    })

    return result
  }, [invoices, search, statusFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedInvoices.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSortedInvoices.map(i => i.id)))
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=open]:bg-accent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: InvoiceStatus | "all") => setStatusFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
          )}
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filteredAndSortedInvoices.length && filteredAndSortedInvoices.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-input"
                />
              </TableHead>
              <TableHead><SortButton field="invoiceNumber">Invoice</SortButton></TableHead>
              <TableHead><SortButton field="customerName">Customer</SortButton></TableHead>
              <TableHead><SortButton field="issueDate">Issue Date</SortButton></TableHead>
              <TableHead><SortButton field="dueDate">Due Date</SortButton></TableHead>
              <TableHead><SortButton field="status">Status</SortButton></TableHead>
              <TableHead className="text-right"><SortButton field="total">Amount</SortButton></TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedInvoices.map((invoice) => (
                <TableRow 
                  key={invoice.id}
                  className={cn(selectedIds.has(invoice.id) && "bg-muted/50")}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invoice.id)}
                      onChange={() => toggleSelect(invoice.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                  </TableCell>
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
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-sm text-muted-foreground">{invoice.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      invoice.status === "overdue" && "text-destructive font-medium"
                    )}>
                      {formatDate(invoice.dueDate)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[invoice.status].variant as any}>
                      {statusConfig[invoice.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</div>
                      {invoice.amountDue > 0 && invoice.amountDue < invoice.total && (
                        <div className="text-sm text-muted-foreground">
                          Due: {formatCurrency(invoice.amountDue, invoice.currency)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${invoice.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${invoice.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        {invoice.status === "draft" && (
                          <DropdownMenuItem onClick={() => onSend?.(invoice.id)}>
                            <Send className="mr-2 h-4 w-4" /> Send
                          </DropdownMenuItem>
                        )}
                        {invoice.status !== "paid" && (
                          <DropdownMenuItem onClick={() => onStatusChange?.(invoice.id, "paid")}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDuplicate?.(invoice.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${invoice.id}/send`}>
                            <Mail className="mr-2 h-4 w-4" /> Send Email
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDelete?.(invoice.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedInvoices.length} of {invoices.length} invoices
        </div>
      </div>
    </div>
  )
}
