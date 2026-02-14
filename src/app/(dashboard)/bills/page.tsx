"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Receipt, DollarSign, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BillTable } from "@/components/modules/finance/bill-table"
import { mockBills, getBillSummary } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
import { Bill, BillStatus } from "@/types/finance"

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>(mockBills)
  const summary = getBillSummary()

  const handleStatusChange = (id: string, status: BillStatus) => {
    setBills(prev =>
      prev.map(bill =>
        bill.id === id
          ? {
              ...bill,
              status,
              amountPaid: status === "paid" ? bill.total : bill.amountPaid,
              amountDue: status === "paid" ? 0 : bill.amountDue,
            }
          : bill
      )
    )
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this bill?")) {
      setBills(prev => prev.filter(bill => bill.id !== id))
    }
  }

  const handleApprove = (id: string) => {
    setBills(prev =>
      prev.map(bill =>
        bill.id === id
          ? {
              ...bill,
              status: "approved" as BillStatus,
              approvedAt: new Date().toISOString(),
              approvedBy: "Current User",
            }
          : bill
      )
    )
  }

  const handlePay = (id: string) => {
    setBills(prev =>
      prev.map(bill =>
        bill.id === id
          ? {
              ...bill,
              status: "paid" as BillStatus,
              amountPaid: bill.total,
              amountDue: 0,
            }
          : bill
      )
    )
  }

  const stats = [
    {
      title: "Total Payable",
      value: formatCurrency(summary.pending),
      icon: DollarSign,
      description: `${bills.filter(b => b.amountDue > 0).length} bills`,
    },
    {
      title: "Due This Week",
      value: formatCurrency(
        bills
          .filter(b => {
            const due = new Date(b.dueDate)
            const now = new Date()
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            return due <= weekFromNow && b.amountDue > 0
          })
          .reduce((sum, b) => sum + b.amountDue, 0)
      ),
      icon: Clock,
      description: "Upcoming payments",
    },
    {
      title: "Pending Approval",
      value: bills.filter(b => b.status === "pending").length.toString(),
      icon: AlertCircle,
      description: "Needs review",
      className: bills.filter(b => b.status === "pending").length > 0 ? "text-warning" : "",
    },
    {
      title: "Paid This Month",
      value: formatCurrency(summary.paid),
      icon: Receipt,
      description: `${bills.filter(b => b.status === "paid").length} bills`,
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="text-muted-foreground">
            Track and manage bills from your vendors
          </p>
        </div>
        <Button asChild>
          <Link href="/bills/new">
            <Plus className="mr-2 h-4 w-4" /> New Bill
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

      {/* Bills Table */}
      <Card>
        <CardContent className="pt-6">
          <BillTable
            bills={bills}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onApprove={handleApprove}
            onPay={handlePay}
          />
        </CardContent>
      </Card>
    </div>
  )
}
