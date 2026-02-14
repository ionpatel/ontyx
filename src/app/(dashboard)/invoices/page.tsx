"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, FileText, DollarSign, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceTable } from "@/components/modules/finance/invoice-table"
import { mockInvoices, getInvoiceSummary } from "@/lib/mock-data"
import { formatCurrency, formatCompactNumber } from "@/lib/utils"
import { Invoice, InvoiceStatus } from "@/types/finance"

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
  const summary = getInvoiceSummary()

  const handleStatusChange = (id: string, status: InvoiceStatus) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === id
          ? {
              ...inv,
              status,
              amountPaid: status === "paid" ? inv.total : inv.amountPaid,
              amountDue: status === "paid" ? 0 : inv.amountDue,
              paidAt: status === "paid" ? new Date().toISOString() : inv.paidAt,
            }
          : inv
      )
    )
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      setInvoices(prev => prev.filter(inv => inv.id !== id))
    }
  }

  const handleDuplicate = (id: string) => {
    const original = invoices.find(inv => inv.id === id)
    if (original) {
      const duplicated: Invoice = {
        ...original,
        id: crypto.randomUUID(),
        invoiceNumber: `${original.invoiceNumber}-COPY`,
        status: "draft",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amountPaid: 0,
        amountDue: original.total,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sentAt: undefined,
        viewedAt: undefined,
        paidAt: undefined,
      }
      setInvoices(prev => [duplicated, ...prev])
    }
  }

  const handleSend = (id: string) => {
    setInvoices(prev =>
      prev.map(inv =>
        inv.id === id
          ? {
              ...inv,
              status: "sent" as InvoiceStatus,
              sentAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : inv
      )
    )
  }

  const stats = [
    {
      title: "Total Outstanding",
      value: formatCurrency(summary.outstanding),
      icon: DollarSign,
      description: `${invoices.filter(i => i.amountDue > 0).length} invoices`,
    },
    {
      title: "Overdue",
      value: formatCurrency(summary.overdue),
      icon: AlertCircle,
      description: `${invoices.filter(i => i.status === "overdue").length} invoices`,
      className: summary.overdue > 0 ? "text-destructive" : "",
    },
    {
      title: "Paid This Month",
      value: formatCurrency(summary.paid),
      icon: FileText,
      description: `${invoices.filter(i => i.status === "paid").length} invoices`,
    },
    {
      title: "Draft",
      value: invoices.filter(i => i.status === "draft").length.toString(),
      icon: Clock,
      description: "Pending to send",
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage invoices for your customers
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.className || ""}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="pt-6">
          <InvoiceTable
            invoices={invoices}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onSend={handleSend}
          />
        </CardContent>
      </Card>
    </div>
  )
}
