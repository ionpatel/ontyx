"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, ShoppingCart, FileText, DollarSign, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesOrderTable } from "@/components/modules/operations/sales-order-table"
import { QuoteTable } from "@/components/modules/operations/quote-table"
import { mockSalesOrders, mockQuotes, getSalesSummary } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/utils"
import { SalesOrder, SalesOrderStatus, Quote, QuoteStatus } from "@/types/operations"

export default function SalesPage() {
  const [orders, setOrders] = useState<SalesOrder[]>(mockSalesOrders)
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes)
  const summary = getSalesSummary()

  const handleDeleteOrder = (id: string) => {
    if (confirm("Are you sure you want to delete this order?")) {
      setOrders(prev => prev.filter(o => o.id !== id))
    }
  }

  const handleOrderStatusChange = (id: string, status: SalesOrderStatus) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === id
          ? {
              ...o,
              status,
              updatedAt: new Date().toISOString(),
              ...(status === "shipped" ? { shippedAt: new Date().toISOString() } : {}),
              ...(status === "delivered" ? { deliveredAt: new Date().toISOString() } : {}),
            }
          : o
      )
    )
  }

  const handleDeleteQuote = (id: string) => {
    if (confirm("Are you sure you want to delete this quote?")) {
      setQuotes(prev => prev.filter(q => q.id !== id))
    }
  }

  const handleSendQuote = (id: string) => {
    setQuotes(prev =>
      prev.map(q =>
        q.id === id
          ? { ...q, status: "sent" as QuoteStatus, sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : q
      )
    )
  }

  const handleConvertQuote = (id: string) => {
    const quote = quotes.find(q => q.id === id)
    if (!quote) return

    // Create new order from quote
    const newOrder: SalesOrder = {
      id: crypto.randomUUID(),
      orderNumber: `SO-2024-${String(orders.length + 1).padStart(3, "0")}`,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      shippingAddress: { street: "", city: "", postalCode: "", country: "USA" },
      status: "draft",
      paymentStatus: "pending",
      items: quote.items.map(i => ({
        ...i,
        fulfilledQuantity: 0,
        backorderedQuantity: 0,
      })),
      subtotal: quote.subtotal,
      taxTotal: quote.taxTotal,
      shippingCost: 0,
      discount: quote.discount,
      total: quote.total,
      amountPaid: 0,
      amountDue: quote.total,
      currency: quote.currency,
      shippingMethod: "standard",
      quoteId: quote.id,
      orderDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setOrders(prev => [newOrder, ...prev])
    setQuotes(prev =>
      prev.map(q =>
        q.id === id
          ? { ...q, convertedOrderId: newOrder.id, updatedAt: new Date().toISOString() }
          : q
      )
    )
  }

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: DollarSign,
      description: `From ${orders.filter(o => o.paymentStatus === "paid").length} paid orders`,
    },
    {
      title: "Pending Orders",
      value: summary.pendingOrders.toString(),
      icon: Clock,
      description: "Awaiting fulfillment",
      className: summary.pendingOrders > 0 ? "text-orange-500" : "",
    },
    {
      title: "Open Quotes",
      value: summary.pendingQuotes.toString(),
      icon: FileText,
      description: "Awaiting response",
    },
    {
      title: "Conversion Rate",
      value: `${Math.round((quotes.filter(q => q.status === "accepted").length / Math.max(quotes.length, 1)) * 100)}%`,
      icon: TrendingUp,
      description: "Quote to order",
      className: "text-teal-500",
    },
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">
            Manage sales orders, quotes, and fulfillment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sales/quotes/new">
              <FileText className="mr-2 h-4 w-4" /> New Quote
            </Link>
          </Button>
          <Button asChild>
            <Link href="/sales/new">
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Link>
          </Button>
        </div>
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

      {/* Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <FileText className="mr-2 h-4 w-4" />
            Quotes ({quotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardContent className="pt-6">
              <SalesOrderTable
                orders={orders}
                onDelete={handleDeleteOrder}
                onStatusChange={handleOrderStatusChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          <Card>
            <CardContent className="pt-6">
              <QuoteTable
                quotes={quotes}
                onDelete={handleDeleteQuote}
                onSend={handleSendQuote}
                onConvert={handleConvertQuote}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
