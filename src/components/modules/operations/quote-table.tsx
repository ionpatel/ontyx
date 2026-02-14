"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MoreHorizontal, Search, FileText, Edit, Eye, Trash2,
  Send, CheckCircle, Clock, XCircle, AlertTriangle, Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Quote, QuoteStatus } from "@/types/operations"
import { formatCurrency, formatDate } from "@/lib/utils"

interface QuoteTableProps {
  quotes: Quote[]
  onDelete?: (id: string) => void
  onSend?: (id: string) => void
  onConvert?: (id: string) => void
}

const statusConfig: Record<QuoteStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Draft", variant: "outline", icon: Clock },
  sent: { label: "Sent", variant: "secondary", icon: Send },
  accepted: { label: "Accepted", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  expired: { label: "Expired", variant: "destructive", icon: AlertTriangle },
}

export function QuoteTable({ quotes, onDelete, onSend, onConvert }: QuoteTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customerName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || q.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const isExpiringSoon = (validUntil: string) => {
    const days = Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days >= 0 && days <= 7
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No quotes found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote) => {
                const status = statusConfig[quote.status]
                const expiringSoon = isExpiringSoon(quote.validUntil) && quote.status === "sent"
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono font-medium">
                      <Link href={`/sales/quotes/${quote.id}`} className="hover:underline">
                        {quote.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{quote.customerName}</div>
                      <div className="text-sm text-muted-foreground">{quote.customerEmail}</div>
                    </TableCell>
                    <TableCell>
                      {quote.items.length} items
                      <span className="text-muted-foreground ml-1">
                        ({quote.items.reduce((sum, i) => sum + i.quantity, 0)} units)
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(quote.total)}
                      {quote.discount > 0 && (
                        <div className="text-xs text-teal-500">
                          -{formatCurrency(quote.discount)} discount
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={expiringSoon ? "text-orange-500 font-medium" : ""}>
                        {formatDate(quote.validUntil)}
                      </div>
                      {expiringSoon && (
                        <div className="text-xs text-orange-500">Expiring soon</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>
                        <status.icon className="mr-1 h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/quotes/${quote.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/sales/quotes/${quote.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {quote.status === "draft" && (
                            <DropdownMenuItem onClick={() => onSend?.(quote.id)}>
                              <Send className="mr-2 h-4 w-4" /> Send to Customer
                            </DropdownMenuItem>
                          )}
                          {quote.status === "accepted" && !quote.convertedOrderId && (
                            <DropdownMenuItem onClick={() => onConvert?.(quote.id)}>
                              <Copy className="mr-2 h-4 w-4" /> Convert to Order
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete?.(quote.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
