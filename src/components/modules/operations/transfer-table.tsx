"use client"

import { useState } from "react"
import Link from "next/link"
import {
  MoreHorizontal, Search, ArrowRight, Eye, CheckCircle,
  Clock, Truck, XCircle, Package
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
import { StockTransfer, TransferStatus } from "@/types/operations"
import { formatDate } from "@/lib/utils"

interface TransferTableProps {
  transfers: StockTransfer[]
  onApprove?: (id: string) => void
  onComplete?: (id: string) => void
  onCancel?: (id: string) => void
}

const statusConfig: Record<TransferStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  in_transit: { label: "In Transit", variant: "secondary", icon: Truck },
  completed: { label: "Completed", variant: "default", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
}

export function TransferTable({ transfers, onApprove, onComplete, onCancel }: TransferTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredTransfers = transfers.filter(t => {
    const matchesSearch = t.transferNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.fromWarehouseName.toLowerCase().includes(search.toLowerCase()) ||
      t.toWarehouseName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transfers..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer #</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No transfers found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransfers.map((transfer) => {
                const status = statusConfig[transfer.status]
                return (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-mono font-medium">
                      <Link href={`/warehouses/transfers/${transfer.id}`} className="hover:underline">
                        {transfer.transferNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{transfer.fromWarehouseName}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{transfer.toWarehouseName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{transfer.totalItems} items</span>
                      <span className="text-muted-foreground ml-1">({transfer.totalQuantity} units)</span>
                    </TableCell>
                    <TableCell>
                      <div>{formatDate(transfer.requestedAt)}</div>
                      <div className="text-xs text-muted-foreground">by {transfer.requestedBy}</div>
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
                            <Link href={`/warehouses/transfers/${transfer.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          {transfer.status === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onApprove?.(transfer.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onCancel?.(transfer.id)}
                                className="text-destructive"
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Cancel
                              </DropdownMenuItem>
                            </>
                          )}
                          {transfer.status === "in_transit" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => onComplete?.(transfer.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
                              </DropdownMenuItem>
                            </>
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
      </div>
    </div>
  )
}
