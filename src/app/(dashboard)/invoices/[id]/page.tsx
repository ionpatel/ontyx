"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, Edit, Loader2, Download, Printer, Send, CheckCircle, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, cn } from "@/lib/utils"
import { invoicesService, type Invoice } from "@/services/invoices"
import { downloadInvoicePDF, type InvoicePDFData } from "@/services/pdf"
import { useAuth } from "@/hooks/use-auth"
import { useOrganization } from "@/hooks/use-organization"
import { RecordPaymentDialog, type PaymentInput } from "@/components/modules/finance/record-payment-dialog"
import { getInvoicePDFBlob } from "@/services/pdf"
import { useToast } from "@/components/ui/toast"

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700" },
  viewed: { label: "Viewed", color: "bg-indigo-100 text-indigo-700" },
  partial: { label: "Partial", color: "bg-amber-100 text-amber-700" },
  paid: { label: "Paid", color: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700" },
}

// Helper to build tax breakdown for PDF
function buildTaxBreakdown(invoice: Invoice): Array<{ name: string; rate: number; amount: number }> {
  const breakdown: Array<{ name: string; rate: number; amount: number }> = []
  
  if (invoice.gstAmount && invoice.gstAmount > 0) {
    breakdown.push({ name: 'GST', rate: 0.05, amount: invoice.gstAmount })
  }
  if (invoice.hstAmount && invoice.hstAmount > 0) {
    breakdown.push({ name: 'HST', rate: 0.13, amount: invoice.hstAmount })
  }
  if (invoice.pstAmount && invoice.pstAmount > 0) {
    breakdown.push({ name: 'PST', rate: 0.07, amount: invoice.pstAmount })
  }
  if (invoice.qstAmount && invoice.qstAmount > 0) {
    breakdown.push({ name: 'QST', rate: 0.09975, amount: invoice.qstAmount })
  }
  
  // If no specific taxes, use generic tax
  if (breakdown.length === 0 && invoice.taxTotal > 0) {
    breakdown.push({ name: 'Tax', rate: invoice.taxTotal / invoice.subtotal, amount: invoice.taxTotal })
  }
  
  return breakdown
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { organizationId } = useAuth()
  const { organization } = useOrganization()
  const { success, error: showError, warning } = useToast()
  const invoiceId = params.id as string
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)

  useEffect(() => {
    if (!invoiceId) return
    
    const orgId = organizationId || 'demo'
    setLoading(true)
    
    invoicesService.getInvoice(invoiceId, orgId)
      .then(setInvoice)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [invoiceId, organizationId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Invoice not found</h2>
          <p className="text-muted-foreground mb-4">
            The invoice you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link href="/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </div>
    )
  }

  const status = statusConfig[invoice.status] || statusConfig.draft

  const handleDownloadPDF = () => {
    setActionLoading('download')
    
    try {
      // Build PDF data from invoice
      const pdfData: InvoicePDFData = {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        
        // Company details from org settings
        companyName: organization?.name || 'Your Company',
        companyAddress: organization?.addressLine1 || '',
        companyCity: organization?.city || '',
        companyProvince: organization?.province || 'ON',
        companyPostalCode: organization?.postalCode || '',
        companyPhone: organization?.phone,
        companyEmail: organization?.email,
        companyGstNumber: organization?.taxNumber,
        
        // Customer
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        customerAddress: invoice.billingAddress?.street,
        customerCity: invoice.billingAddress?.city,
        customerProvince: invoice.billingAddress?.province,
        customerPostalCode: invoice.billingAddress?.postalCode,
        
        // Items
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.amount,
        })),
        
        // Totals
        subtotal: invoice.subtotal,
        taxBreakdown: buildTaxBreakdown(invoice),
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.amountDue,
        
        notes: invoice.notes,
        terms: invoice.terms,
      }
      
      downloadInvoicePDF(pdfData)
    } catch (error) {
      console.error('PDF generation error:', error)
      showError('PDF Error', 'Failed to generate PDF')
    } finally {
      setActionLoading(null)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSend = async () => {
    if (!invoice.customerEmail) {
      warning('Missing Email', 'No customer email address. Please add an email to the customer.')
      return
    }

    setActionLoading('send')
    
    try {
      // Generate PDF blob
      const pdfBlob = getInvoicePDFBlob({
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        companyName: organization?.name || 'Your Company',
        companyAddress: organization?.addressLine1 || '',
        companyCity: organization?.city || '',
        companyProvince: organization?.province || 'ON',
        companyPostalCode: organization?.postalCode || '',
        companyPhone: organization?.phone,
        companyEmail: organization?.email,
        companyGstNumber: organization?.taxNumber,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        customerAddress: invoice.billingAddress?.street,
        customerCity: invoice.billingAddress?.city,
        customerProvince: invoice.billingAddress?.province,
        customerPostalCode: invoice.billingAddress?.postalCode,
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.amount,
        })),
        subtotal: invoice.subtotal,
        taxBreakdown: buildTaxBreakdown(invoice),
        total: invoice.total,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.amountDue,
        notes: invoice.notes,
        terms: invoice.terms,
      })

      // Convert blob to base64
      const pdfBuffer = await pdfBlob.arrayBuffer()
      const pdfBase64 = btoa(
        new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      // Send via API route
      const response = await fetch('/api/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoice.customerEmail,
          customerName: invoice.customerName,
          invoiceNumber: invoice.invoiceNumber,
          amount: formatCurrency(invoice.amountDue, 'CAD'),
          dueDate: new Date(invoice.dueDate).toLocaleDateString('en-CA'),
          pdfBase64,
          companyName: organization?.name || 'Your Company',
          companyEmail: organization?.email,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update invoice status to sent
        const orgId = organizationId || 'demo'
        await invoicesService.updateInvoiceStatus(invoice.id, 'sent', orgId)
        setInvoice(prev => prev ? { ...prev, status: 'sent', sentAt: new Date().toISOString() } : null)
        success('Invoice Sent', `Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail}`)
      } else {
        showError('Send Failed', result.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Send error:', error)
      showError('Send Failed', 'Failed to send invoice. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkPaid = async () => {
    setActionLoading('paid')
    try {
      const orgId = organizationId || 'demo'
      const today = new Date().toISOString().split('T')[0]
      await invoicesService.updateInvoiceStatus(invoice.id, 'paid', orgId, today)
      setInvoice(prev => prev ? { 
        ...prev, 
        status: 'paid', 
        amountPaid: prev.total, 
        amountDue: 0,
        paidDate: today,
      } : null)
      success('Invoice Paid', 'Invoice marked as fully paid')
    } catch (error) {
      console.error('Error marking paid:', error)
      showError('Update Failed', 'Failed to update invoice')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRecordPayment = async (payment: PaymentInput): Promise<boolean> => {
    const orgId = organizationId || 'demo'
    try {
      const success = await invoicesService.recordPayment(
        invoice.id, 
        payment.amount, 
        orgId, 
        payment.paymentDate
      )
      if (success) {
        // Update local state
        const newAmountPaid = invoice.amountPaid + payment.amount
        const newAmountDue = Math.max(0, invoice.total - newAmountPaid)
        setInvoice(prev => prev ? {
          ...prev,
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newAmountDue === 0 ? 'paid' : 'partial',
          paidDate: newAmountDue === 0 ? payment.paymentDate : prev.paidDate,
        } : null)
      }
      return success
    } catch (error) {
      console.error('Error recording payment:', error)
      return false
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
              <Badge className={cn("text-xs", status.color)}>{status.label}</Badge>
            </div>
            <p className="text-muted-foreground">{invoice.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handlePrint}
          >
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            disabled={actionLoading === 'download'}
          >
            {actionLoading === 'download' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/invoices/${invoice.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="print:shadow-none">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div>
            <CardTitle className="text-2xl text-primary">INVOICE</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Invoice # {invoice.invoiceNumber}
            </p>
          </div>
          <div className="text-right text-sm">
            <p><span className="text-muted-foreground">Issue Date:</span> {new Date(invoice.invoiceDate).toLocaleDateString('en-CA')}</p>
            <p><span className="text-muted-foreground">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString('en-CA')}</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Bill To */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2">BILL TO</h3>
              <p className="font-medium">{invoice.customerName}</p>
              {invoice.billingAddress && (
                <div className="text-sm text-muted-foreground">
                  <p>{invoice.billingAddress.street}</p>
                  <p>{invoice.billingAddress.city}, {invoice.billingAddress.province} {invoice.billingAddress.postalCode}</p>
                </div>
              )}
              {invoice.customerEmail && (
                <p className="text-sm text-muted-foreground mt-1">{invoice.customerEmail}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <p className="font-medium">{item.description}</p>
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice, 'CAD')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount, 'CAD')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal, 'CAD')}</span>
              </div>
              
              {invoice.gstAmount && invoice.gstAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (5%)</span>
                  <span>{formatCurrency(invoice.gstAmount, 'CAD')}</span>
                </div>
              )}
              {invoice.hstAmount && invoice.hstAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HST (13%)</span>
                  <span>{formatCurrency(invoice.hstAmount, 'CAD')}</span>
                </div>
              )}
              {invoice.pstAmount && invoice.pstAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">PST</span>
                  <span>{formatCurrency(invoice.pstAmount, 'CAD')}</span>
                </div>
              )}
              {invoice.qstAmount && invoice.qstAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">QST</span>
                  <span>{formatCurrency(invoice.qstAmount, 'CAD')}</span>
                </div>
              )}
              {invoice.taxTotal > 0 && !invoice.gstAmount && !invoice.hstAmount && !invoice.pstAmount && !invoice.qstAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(invoice.taxTotal, 'CAD')}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total, 'CAD')}</span>
              </div>
              
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Amount Paid</span>
                  <span>-{formatCurrency(invoice.amountPaid, 'CAD')}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-bold bg-primary text-primary-foreground p-3 rounded-lg -mx-3">
                <span>Balance Due</span>
                <span>{formatCurrency(invoice.amountDue, 'CAD')}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}

          {/* Terms */}
          {invoice.terms && (
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2">Terms & Conditions</h3>
              <p className="text-sm text-muted-foreground">{invoice.terms}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 print:hidden">
        {invoice.status === 'draft' && (
          <Button 
            onClick={handleSend}
            disabled={actionLoading === 'send'}
          >
            {actionLoading === 'send' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Invoice
          </Button>
        )}
        
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <>
            <Button 
              variant="outline"
              onClick={() => setShowPaymentDialog(true)}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
            <Button 
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleMarkPaid}
              disabled={actionLoading === 'paid'}
            >
              {actionLoading === 'paid' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark as Paid
            </Button>
          </>
        )}
      </div>

      {/* Payment Dialog */}
      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoiceNumber={invoice.invoiceNumber}
        customerName={invoice.customerName}
        totalAmount={invoice.total}
        amountDue={invoice.amountDue}
        onRecordPayment={handleRecordPayment}
      />
    </div>
  )
}
