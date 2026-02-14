"use client"

import { Invoice } from "@/types/finance"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Send, Printer, Mail, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface InvoicePreviewProps {
  invoice: Invoice
  onSend?: () => void
  onMarkPaid?: () => void
  onPrint?: () => void
  onDownload?: () => void
}

const statusConfig = {
  draft: { label: "Draft", icon: Clock, color: "text-muted-foreground" },
  sent: { label: "Sent", icon: Send, color: "text-blue-500" },
  viewed: { label: "Viewed", icon: Mail, color: "text-purple-500" },
  paid: { label: "Paid", icon: CheckCircle, color: "text-success" },
  partial: { label: "Partially Paid", icon: Clock, color: "text-warning" },
  overdue: { label: "Overdue", icon: AlertCircle, color: "text-destructive" },
  cancelled: { label: "Cancelled", icon: AlertCircle, color: "text-muted-foreground" },
}

export function InvoicePreview({ 
  invoice, 
  onSend, 
  onMarkPaid, 
  onPrint, 
  onDownload 
}: InvoicePreviewProps) {
  const StatusIcon = statusConfig[invoice.status].icon

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-5 w-5", statusConfig[invoice.status].color)} />
          <Badge variant={invoice.status as any}>
            {statusConfig[invoice.status].label}
          </Badge>
          {invoice.sentAt && (
            <span className="text-sm text-muted-foreground">
              Sent {formatDate(invoice.sentAt)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {onPrint && (
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          )}
          {invoice.status === "draft" && onSend && (
            <Button size="sm" onClick={onSend}>
              <Send className="mr-2 h-4 w-4" /> Send Invoice
            </Button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && onMarkPaid && (
            <Button size="sm" variant="success" onClick={onMarkPaid}>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="overflow-hidden">
        <CardContent className="p-8 md:p-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between gap-8 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">INVOICE</h1>
              <p className="text-xl text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold mb-2">
                {/* Company Logo/Name would go here */}
                <span className="text-primary">ONTYX</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>123 Business Street</p>
                <p>Suite 100</p>
                <p>New York, NY 10001</p>
                <p>invoices@ontyx.app</p>
              </div>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Bill To & Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Bill To
              </h3>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{invoice.customerName}</p>
                <p className="text-muted-foreground">{invoice.customerEmail}</p>
                {invoice.customerAddress && (
                  <p className="text-muted-foreground whitespace-pre-line">
                    {invoice.customerAddress}
                  </p>
                )}
              </div>
            </div>
            <div className="md:text-right">
              <div className="grid grid-cols-2 md:inline-grid md:grid-cols-[auto_auto] gap-x-8 gap-y-2 text-sm">
                <span className="text-muted-foreground">Issue Date:</span>
                <span className="font-medium">{formatDate(invoice.issueDate)}</span>
                
                <span className="text-muted-foreground">Due Date:</span>
                <span className={cn(
                  "font-medium",
                  invoice.status === "overdue" && "text-destructive"
                )}>
                  {formatDate(invoice.dueDate)}
                </span>
                
                {invoice.terms && (
                  <>
                    <span className="text-muted-foreground">Terms:</span>
                    <span className="font-medium">{invoice.terms}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <th className="text-left py-3 pr-4">Description</th>
                  <th className="text-right py-3 px-4 w-20">Qty</th>
                  <th className="text-right py-3 px-4 w-28">Unit Price</th>
                  <th className="text-right py-3 px-4 w-20">Tax</th>
                  <th className="text-right py-3 pl-4 w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-4 pr-4">
                      <span className="font-medium">{item.description}</span>
                    </td>
                    <td className="text-right py-4 px-4 text-muted-foreground">
                      {item.quantity}
                    </td>
                    <td className="text-right py-4 px-4 text-muted-foreground">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="text-right py-4 px-4 text-muted-foreground">
                      {item.taxRate}%
                    </td>
                    <td className="text-right py-4 pl-4 font-medium">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(invoice.taxTotal, invoice.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm text-success">
                    <span>Amount Paid</span>
                    <span>-{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Amount Due</span>
                    <span className={invoice.status === "overdue" ? "text-destructive" : ""}>
                      {formatCurrency(invoice.amountDue, invoice.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t pt-8">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Notes
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Thank you for your business!
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Questions? Email us at invoices@ontyx.app
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Activity</h3>
          <div className="space-y-4">
            {invoice.paidAt && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div>
                  <p className="font-medium">Invoice paid in full</p>
                  <p className="text-sm text-muted-foreground">{formatDate(invoice.paidAt)}</p>
                </div>
              </div>
            )}
            {invoice.viewedAt && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">Invoice viewed by customer</p>
                  <p className="text-sm text-muted-foreground">{formatDate(invoice.viewedAt)}</p>
                </div>
              </div>
            )}
            {invoice.sentAt && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Send className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Invoice sent to {invoice.customerEmail}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(invoice.sentAt)}</p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Invoice created</p>
                <p className="text-sm text-muted-foreground">{formatDate(invoice.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
