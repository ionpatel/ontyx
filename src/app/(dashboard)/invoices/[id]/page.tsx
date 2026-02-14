"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InvoicePreview } from "@/components/modules/finance/invoice-preview"
import { mockInvoices } from "@/lib/mock-data"
import { Invoice, InvoiceStatus } from "@/types/finance"

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  // In a real app, this would fetch from API
  const invoice = mockInvoices.find(inv => inv.id === invoiceId)

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

  const handleSend = () => {
    // In a real app, this would trigger an email
    console.log("Sending invoice:", invoice.id)
    alert(`Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail}`)
  }

  const handleMarkPaid = () => {
    // In a real app, this would update the database
    console.log("Marking as paid:", invoice.id)
    alert(`Invoice ${invoice.invoiceNumber} marked as paid`)
    router.refresh()
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    console.log("Downloading PDF for:", invoice.id)
    alert("PDF download started...")
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
            <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">
              {invoice.customerName}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Invoice
          </Link>
        </Button>
      </div>

      {/* Invoice Preview */}
      <InvoicePreview
        invoice={invoice}
        onSend={handleSend}
        onMarkPaid={handleMarkPaid}
        onPrint={handlePrint}
        onDownload={handleDownload}
      />
    </div>
  )
}
