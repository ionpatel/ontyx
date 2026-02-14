"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  MoreHorizontal, Eye, Edit, CheckCircle, Trash2, 
  ArrowUpDown, Search, Filter, Download, Clock, Ban
} from "lucide-react"
import { Bill, BillStatus } from "@/types/finance"
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

interface BillTableProps {
  bills: Bill[]
  onStatusChange?: (id: string, status: BillStatus) => void
  onDelete?: (id: string) => void
  onApprove?: (id: string) => void
  onPay?: (id: string) => void
}

const statusConfig: Record<BillStatus, { label: string; variant: string }> = {
  draft: { label: "Draft", variant: "draft" },
  pending: { label: "Pending", variant: "warning" },
  approved: { label: "Approved", variant: "sent" },
  paid: { label: "Paid", variant: "paid" },
  partial: { label: "Partial", variant: "partial" },
  overdue: { label: "Overdue", variant: "overdue" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

type SortField = "billNumber" | "vendorName" | "issueDate" | "dueDate" | "total" | "status"
type SortDirection = "asc" | "desc"

export function BillTable({ 
  bills, 
  onStatusChange, 
  onDelete, 
  onApprove,
  onPay 
}: BillTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<BillStatus | "all">("all")
  const [sortField, setSortField] = useState<SortField>("dueDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const filteredAndSortedBills = useMemo(() => {
    let result = bills

    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        bill =>
          bill.billNumber.toLowerCase().includes(searchLower) ||
          bill.vendorName.toLowerCase().includes(searchLower) ||
          (bill.reference?.toLowerCase().includes(searchLower) ?? false)
      )
    }

    if (statusFilter !== "all") {
      result = result.filter(bill => bill.status === statusFilter)
    }

    result = [...result].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "billNumber":
          comparison = a.billNumber.localeCompare(b.billNumber)
          break
        case "vendorName":
          comparison = a.vendorName.localeCompare(b.vendorName)
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
  }, [bills, search, statusFilter, sortField, sortDirection])

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
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedBills.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAndSortedBills.map(b => b.id)))
    }
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
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
              placeholder="Search bills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: BillStatus | "all") => setStatusFilter(v)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
              <Button variant="outline" size="sm" onClick={() => {
                selectedIds.forEach(id => onApprove?.(id))
                setSelectedIds(new Set())
              }}>
                Approve Selected
              </Button>
            </>
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
                  checked={selectedIds.size === filteredAndSortedBills.length && filteredAndSortedBills.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-input"
                />
              </TableHead>
              <TableHead><SortButton field="billNumber">Bill #</SortButton></TableHead>
              <TableHead><SortButton field="vendorName">Vendor</SortButton></TableHead>
              <TableHead>Reference</TableHead>
              <TableHead><SortButton field="dueDate">Due Date</SortButton></TableHead>
              <TableHead><SortButton field="status">Status</SortButton></TableHead>
              <TableHead className="text-right"><SortButton field="total">Amount</SortButton></TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No bills found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedBills.map((bill) => (
                <TableRow 
                  key={bill.id}
                  className={cn(selectedIds.has(bill.id) && "bg-muted/50")}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(bill.id)}
                      onChange={() => toggleSelect(bill.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                  </TableCell>
                  <TableCell>
                    <Link 
                      href={`/bills/${bill.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {bill.billNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{bill.vendorName}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {bill.reference || "—"}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      bill.status === "overdue" && "text-destructive font-medium"
                    )}>
                      {formatDate(bill.dueDate)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[bill.status].variant as any}>
                      {statusConfig[bill.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div className="font-medium">{formatCurrency(bill.total, bill.currency)}</div>
                      {bill.amountDue > 0 && bill.amountDue < bill.total && (
                        <div className="text-sm text-muted-foreground">
                          Due: {formatCurrency(bill.amountDue, bill.currency)}
                        </div>
                      )}
                    </div>
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
                          <Link href={`/bills/${bill.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/bills/${bill.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        {bill.status === "pending" && (
                          <DropdownMenuItem onClick={() => onApprove?.(bill.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                          </DropdownMenuItem>
                        )}
                        {bill.status === "approved" && (
                          <DropdownMenuItem onClick={() => onPay?.(bill.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Record Payment
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDelete?.(bill.id)}
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

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedBills.length} of {bills.length} bills
        </div>
      </div>
    </div>
  )
}
