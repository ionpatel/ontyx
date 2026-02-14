"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InvoiceForm } from "@/components/modules/finance/invoice-form"
import { Invoice } from "@/types/finance"

export default function NewInvoicePage() {
  const router = useRouter()

  const handleSave = (invoice: Partial<Invoice>) => {
    // In a real app, this would save to the database
    console.log("Saving invoice:", invoice)
    // Simulate save
    setTimeout(() => {
      router.push("/invoices")
    }, 500)
  }

  const handleSend = (invoice: Partial<Invoice>) => {
    // In a real app, this would save and send the invoice
    console.log("Sending invoice:", invoice)
    setTimeout(() => {
      router.push("/invoices")
    }, 500)
  }

  const handlePreview = (invoice: Partial<Invoice>) => {
    // Open preview modal or navigate to preview page
    console.log("Preview:", invoice)
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
        onPreview={handlePreview}
      />
    </div>
  )
}
