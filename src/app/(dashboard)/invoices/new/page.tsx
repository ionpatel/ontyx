"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InvoiceForm } from "@/components/modules/finance/invoice-form"
import { useInvoices } from "@/hooks/use-invoices"
import { type CreateInvoiceInput } from "@/services/invoices"

export default function NewInvoicePage() {
  const router = useRouter()
  const { createInvoice } = useInvoices()
  const [saving, setSaving] = useState(false)

  const handleSave = async (input: CreateInvoiceInput) => {
    setSaving(true)
    try {
      const invoice = await createInvoice(input)
      if (invoice) {
        router.push(`/invoices/${invoice.id}`)
      } else {
        alert("Failed to create invoice. Please try again.")
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      alert("Failed to create invoice. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async (input: CreateInvoiceInput) => {
    setSaving(true)
    try {
      const invoice = await createInvoice(input)
      if (invoice) {
        // In production: would also send email here
        alert(`Invoice ${invoice.invoiceNumber} created and ready to send!`)
        router.push(`/invoices/${invoice.id}`)
      }
    } catch (error) {
      console.error("Error creating invoice:", error)
      alert("Failed to create invoice.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground">
            Create a new invoice for your customer
          </p>
        </div>
      </div>

      {/* Form */}
      <InvoiceForm
        onSave={handleSave}
        onSend={handleSend}
        saving={saving}
      />
    </div>
  )
}
