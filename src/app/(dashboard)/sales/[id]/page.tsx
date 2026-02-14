"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Edit, Trash2, ShoppingCart, User, MapPin, CreditCard,
  Truck, Package, Clock, CheckCircle, FileText, Send
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { mockSalesOrders } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusConfig = {
  draft: { label: "Draft", variant: "outline" as const },
  confirmed: { label: "Confirmed", variant: "secondary" as const },
  processing: { label: "Processing", variant: "secondary" as const },
  shipped: { label: "Shipped", variant: "default" as const },
  delivered: { label: "Delivered", variant: "default" as const },
  cancelled: { label: "Cancelled", variant: "destructive" as const },
  returned: { label: "Returned", variant: "destructive" as const },
}

const paymentConfig = {
  pending: { label: "Pending", variant: "outline" as const },
  partial: { label: "Partial", variant: "secondary" as const },
  paid: { label: "Paid", variant: "default" as const },
  refunded: { label: "Refunded", variant: "destructive" as const },
}

export default function SalesOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const order = mockSalesOrders.find(o => o.id === params.id)

  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Order not found</h2>
          <p className="text-muted-foreground">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild className="mt-4">
            <Link href="/sales">Back to Sales</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this order?")) {
      router.push("/sales")
    }
  }

  const status = statusConfig[order.status]
  const payment = paymentConfig[order.paymentStatus]

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/sales">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={payment.variant}>{payment.label}</Badge>
            </div>
            <p className="text-muted-foreground">Order placed on {formatDate(order.orderDate)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status === "draft" && (
            <Button variant="outline">
              <Send className="mr-2 h-4 w-4" /> Confirm Order
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/sales/${order.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Order Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(order.total)}</div>
            {order.amountDue > 0 && (
              <p className="text-xs text-orange-500">Due: {formatCurrency(order.amountDue)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{order.items.length}</div>
            <p className="text-xs text-muted-foreground">
              {order.items.reduce((sum, i) => sum + i.quantity, 0)} total units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipping</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{order.shippingMethod}</div>
            {order.trackingNumber && (
              <p className="text-xs text-muted-foreground font-mono">{order.trackingNumber}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Delivery</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {order.expectedDelivery ? formatDate(order.expectedDelivery) : "-"}
            </div>
            {order.deliveredAt && (
              <p className="text-xs text-teal-500">Delivered: {formatDate(order.deliveredAt)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" /> Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
              {order.customerPhone && (
                <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}
              {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
            </p>
            <p>
              {order.shippingAddress.postalCode}, {order.shippingAddress.country}
            </p>
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            {order.shippedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipped</span>
                <span>{formatDate(order.shippedAt)}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivered</span>
                <span>{formatDate(order.deliveredAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Products included in this order</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Fulfillment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">
                    {item.discount > 0 ? `${item.discount}%` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  <TableCell>
                    {item.fulfilledQuantity === item.quantity ? (
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" /> Fulfilled
                      </Badge>
                    ) : item.backorderedQuantity > 0 ? (
                      <Badge variant="destructive">
                        Backordered ({item.backorderedQuantity})
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Order Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-teal-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.taxTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(order.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
              {order.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-teal-500">{formatCurrency(order.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Amount Due</span>
                    <span className={order.amountDue > 0 ? "text-orange-500" : "text-teal-500"}>
                      {formatCurrency(order.amountDue)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(order.notes || order.internalNotes) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
          {order.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{order.internalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
