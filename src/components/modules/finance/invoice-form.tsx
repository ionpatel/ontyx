"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Calculator, Save, Send, Eye } from "lucide-react"
import { Invoice, InvoiceLineItem, Contact } from "@/types/finance"
import { formatCurrency, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mockContacts } from "@/lib/mock-data"

interface InvoiceFormProps {
  invoice?: Partial<Invoice>
  onSave: (invoice: Partial<Invoice>) => void
  onSend?: (invoice: Partial<Invoice>) => void
  onPreview?: (invoice: Partial<Invoice>) => void
}

const TAX_RATES = [
  { value: "0", label: "No Tax (0%)" },
  { value: "5", label: "5%" },
  { value: "10", label: "10%" },
  { value: "13", label: "HST (13%)" },
  { value: "15", label: "15%" },
  { value: "20", label: "VAT (20%)" },
]

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
  return `INV-${year}-${random}`
}

const createEmptyLineItem = (): InvoiceLineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unitPrice: 0,
  taxRate: 10,
  amount: 0,
})

export function InvoiceForm({ invoice, onSave, onSend, onPreview }: InvoiceFormProps) {
  const router = useRouter()
  const isEditing = !!invoice?.id

  const [formData, setFormData] = useState({
    invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
    customerId: invoice?.customerId || "",
    customerName: invoice?.customerName || "",
    customerEmail: invoice?.customerEmail || "",
    customerAddress: invoice?.customerAddress || "",
    issueDate: invoice?.issueDate || new Date().toISOString().split("T")[0],
    dueDate: invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: invoice?.currency || "USD",
    notes: invoice?.notes || "",
    terms: invoice?.terms || "Net 30",
  })

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    invoice?.lineItems?.length ? invoice.lineItems : [createEmptyLineItem()]
  )

  const [totals, setTotals] = useState({ subtotal: 0, taxTotal: 0, total: 0 })

  // Recalculate line item amount and totals
  const calculateTotals = useCallback(() => {
    let subtotal = 0
    let taxTotal = 0

    const updatedItems = lineItems.map(item => {
      const baseAmount = item.quantity * item.unitPrice
      const taxAmount = baseAmount * (item.taxRate / 100)
      const amount = baseAmount + taxAmount
      subtotal += baseAmount
      taxTotal += taxAmount
      return { ...item, amount }
    })

    setLineItems(updatedItems)
    setTotals({
      subtotal,
      taxTotal,
      total: subtotal + taxTotal,
    })
  }, [lineItems])

  useEffect(() => {
    // Debounced recalculation
    const timer = setTimeout(calculateTotals, 100)
    return () => clearTimeout(timer)
  }, [lineItems.map(i => `${i.quantity}-${i.unitPrice}-${i.taxRate}`).join(",")])

  const handleCustomerChange = (customerId: string) => {
    const customer = mockContacts.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email || "",
        customerAddress: [customer.address, customer.city, customer.country].filter(Boolean).join(", "),
      }))
    }
  }

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    setLineItems(items => {
      const newItems = [...items]
      newItems[index] = { ...newItems[index], [field]: value }
      return newItems
    })
  }

  const addLineItem = () => {
    setLineItems(items => [...items, createEmptyLineItem()])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(items => items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = (action: "save" | "send") => {
    const invoiceData: Partial<Invoice> = {
      ...invoice,
      ...formData,
      lineItems,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      total: totals.total,
      amountPaid: invoice?.amountPaid || 0,
      amountDue: totals.total - (invoice?.amountPaid || 0),
      status: action === "send" ? "sent" : (invoice?.status || "draft"),
    }

    if (action === "send" && onSend) {
      onSend(invoiceData)
    } else {
      onSave(invoiceData)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "s") {
          e.preventDefault()
          handleSubmit("save")
        } else if (e.key === "Enter") {
          e.preventDefault()
          handleSubmit("send")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [formData, lineItems, totals])

  const customers = mockContacts.filter(c => c.type === "customer" || c.type === "both")

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={e => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={v => setFormData(prev => ({ ...prev, currency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={e => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Payment Terms</Label>
              <Select 
                value={formData.terms} 
                onValueChange={v => setFormData(prev => ({ ...prev, terms: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="Net 15">Net 15</SelectItem>
                  <SelectItem value="Net 30">Net 30</SelectItem>
                  <SelectItem value="Net 45">Net 45</SelectItem>
                  <SelectItem value="Net 60">Net 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bill To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select 
                value={formData.customerId} 
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={e => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address</Label>
              <Textarea
                id="customerAddress"
                value={formData.customerAddress}
                onChange={e => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header Row */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-2">
              <div className="col-span-5">Description</div>
              <div className="col-span-1 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2">Tax</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1"></div>
            </div>

            {/* Line Items */}
            {lineItems.map((item, index) => (
              <div 
                key={item.id} 
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border bg-muted/30"
              >
                <div className="md:col-span-5">
                  <Label className="md:hidden mb-2 block">Description</Label>
                  <Input
                    value={item.description}
                    onChange={e => updateLineItem(index, "description", e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="md:col-span-1">
                  <Label className="md:hidden mb-2 block">Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={e => updateLineItem(index, "quantity", parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="md:hidden mb-2 block">Unit Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => updateLineItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="md:hidden mb-2 block">Tax Rate</Label>
                  <Select
                    value={item.taxRate.toString()}
                    onValueChange={v => updateLineItem(index, "taxRate", parseFloat(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_RATES.map(rate => (
                        <SelectItem key={rate.value} value={rate.value}>
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1 flex items-center justify-end">
                  <span className="text-sm font-medium">
                    {formatCurrency(item.amount, formData.currency)}
                  </span>
                </div>
                <div className="md:col-span-1 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItem(index)}
                    disabled={lineItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addLineItem} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Line Item
            </Button>
          </div>
        </CardContent>

        {/* Totals */}
        <CardFooter className="flex flex-col items-end space-y-2 border-t pt-6">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal, formData.currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(totals.taxTotal, formData.currency)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(totals.total, formData.currency)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes or payment instructions for the customer..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {onPreview && (
            <Button variant="outline" onClick={() => onPreview({ ...formData, lineItems, ...totals })}>
              <Eye className="mr-2 h-4 w-4" /> Preview
            </Button>
          )}
          <Button variant="secondary" onClick={() => handleSubmit("save")}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
            <span className="ml-2 text-xs text-muted-foreground">(⌘S)</span>
          </Button>
          {onSend && (
            <Button onClick={() => handleSubmit("send")}>
              <Send className="mr-2 h-4 w-4" /> Send Invoice
              <span className="ml-2 text-xs text-muted-foreground">(⌘↵)</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
