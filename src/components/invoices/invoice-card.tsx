"use client"

import Link from "next/link"
import { 
  FileText, Send, Eye, CheckCircle, AlertCircle, 
  CreditCard, MoreHorizontal, Trash2, ChevronRight
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, cn } from "@/lib/utils"
import type { Invoice, InvoiceStatus } from "@/services/invoices"

const statusConfig: Record<InvoiceStatus, { 
  label: string
  color: string
  icon: React.ElementType 
}> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Send },
  viewed: { label: "Viewed", color: "bg-indigo-100 text-indigo-700", icon: Eye },
  partial: { label: "Partial", color: "bg-amber-100 text-amber-700", icon: CreditCard },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: CheckCircle },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700", icon: Trash2 },
  void: { label: "Void", color: "bg-gray-100 text-gray-700", icon: Trash2 },
}

interface InvoiceCardProps {
  invoice: Invoice
  onAction?: (action: string, invoice: Invoice) => void
}

export function InvoiceCard({ invoice, onAction }: InvoiceCardProps) {
  const StatusIcon = statusConfig[invoice.status].icon
  const isOverdue = invoice.status === 'overdue' || (
    invoice.status !== 'paid' && 
    invoice.status !== 'cancelled' && 
    new Date(invoice.dueDate) < new Date()
  )

  return (
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      isOverdue && "border-red-200"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Link 
                href={`/invoices/${invoice.id}`}
                className="font-semibold text-primary hover:underline"
              >
                {invoice.invoiceNumber}
              </Link>
              <Badge className={cn("text-xs", statusConfig[invoice.status].color)}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig[invoice.status].label}
              </Badge>
            </div>

            {/* Customer */}
            <p className="font-medium text-sm truncate">{invoice.customerName}</p>
            
            {/* Dates */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Issued: {new Date(invoice.invoiceDate).toLocaleDateString('en-CA')}</span>
              <span className={cn(isOverdue && "text-red-600 font-medium")}>
                Due: {new Date(invoice.dueDate).toLocaleDateString('en-CA')}
                {isOverdue && " ⚠️"}
              </span>
            </div>
          </div>

          {/* Amount & Actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="font-bold text-lg">
                {formatCurrency(invoice.total, invoice.currency)}
              </p>
              {invoice.amountDue > 0 && invoice.amountDue < invoice.total && (
                <p className="text-xs text-amber-600">
                  Due: {formatCurrency(invoice.amountDue, invoice.currency)}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/invoices/${invoice.id}`}>
                  View
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAction?.('edit', invoice)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.('duplicate', invoice)}>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.('send', invoice)}>
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAction?.('download', invoice)}>
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mobile-friendly list of invoice cards
export function InvoiceCardList({ 
  invoices, 
  onAction 
}: { 
  invoices: Invoice[]
  onAction?: (action: string, invoice: Invoice) => void 
}) {
  if (invoices.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <InvoiceCard 
          key={invoice.id} 
          invoice={invoice} 
          onAction={onAction}
        />
      ))}
    </div>
  )
}
