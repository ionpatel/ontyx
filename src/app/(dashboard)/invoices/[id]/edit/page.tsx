"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InvoiceForm } from "@/components/modules/finance/invoice-form"
import { useInvoices } from "@/hooks/use-invoices"
import { invoicesService, type Invoice, type CreateInvoiceInput } from "@/services/invoices"
import { useAuth } from "@/components/providers/auth-provider"
import { useToast } from "@/components/ui/toast"

export default function EditInvoicePage() {
  const router = useRouter()
  const params = useParams()
  const invoiceId = params.id as string
  const { organizationId } = useAuth()
  const { updateInvoice } = useInvoices()
  const { success, error: showError } = useToast()
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!invoiceId || !organizationId) return
    
    setLoading(true)
    invoicesService.getInvoice(invoiceId, organizationId)
      .then(setInvoice)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [invoiceId, organizationId])

  const handleSave = async (input: CreateInvoiceInput) => {
    if (!invoice) return
    
    setSaving(true)
    try {
      const updated = await updateInvoice(invoice.id, input)
      if (updated) {
        success('Invoice Updated', 'Your changes have been saved')
        router.push(`/invoices/${invoice.id}`)
      } else {
        showError('Update Failed', 'Could not save changes')
      }
    } catch (error) {
      console.error("Error updating invoice:", error)
      showError('Update Failed', 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

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
            The invoice you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Convert invoice to form format
  const invoiceFormData = {
    contactId: invoice.contactId,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    notes: invoice.notes || '',
    terms: invoice.terms || '',
    lineItems: invoice.items.map(item => ({
      id: item.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate || 0,
      amount: item.amount,
    })),
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/invoices/${invoice.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
          <p className="text-muted-foreground">
            {invoice.invoiceNumber} • {invoice.customerName}
          </p>
        </div>
      </div>

      {/* Form */}
      <InvoiceForm
        invoice={invoiceFormData}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  )
}
