"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Save, Send, Eye, Loader2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCustomers } from "@/hooks/use-contacts"
import { type CreateInvoiceInput } from "@/services/invoices"
import { downloadInvoicePDF, type InvoicePDFData } from "@/services/pdf"

// ============================================================================
// TYPES
// ============================================================================

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
}

interface InvoiceFormData {
  invoiceNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerAddress: string
  customerCity: string
  customerProvince: string
  customerPostalCode: string
  issueDate: string
  dueDate: string
  currency: string
  notes: string
  terms: string
}

interface InvoiceFormProps {
  invoice?: Partial<InvoiceFormData & { lineItems: LineItem[] }>
  onSave: (input: CreateInvoiceInput) => Promise<void>
  onSend?: (input: CreateInvoiceInput) => Promise<void>
  saving?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TAX_RATES = [
  { value: "0", label: "No Tax (0%)" },
  { value: "5", label: "GST (5%)" },
  { value: "7", label: "PST (7%)" },
  { value: "12", label: "GST+PST (12%)" },
  { value: "13", label: "HST ON (13%)" },
  { value: "15", label: "HST Atlantic (15%)" },
]

const PROVINCES = [
  { value: "ON", label: "Ontario" },
  { value: "QC", label: "Quebec" },
  { value: "BC", label: "British Columbia" },
  { value: "AB", label: "Alberta" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland" },
  { value: "PE", label: "Prince Edward Island" },
]

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0")
  return `INV-${year}-${random}`
}

const createEmptyLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unitPrice: 0,
  taxRate: 13, // Default to HST ON
  amount: 0,
})

// ============================================================================
// COMPONENT
// ============================================================================

export function InvoiceForm({ invoice, onSave, onSend, saving }: InvoiceFormProps) {
  const router = useRouter()
  const { contacts: customers, loading: contactsLoading } = useCustomers()
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: invoice?.invoiceNumber || generateInvoiceNumber(),
    customerId: invoice?.customerId || "",
    customerName: invoice?.customerName || "",
    customerEmail: invoice?.customerEmail || "",
    customerAddress: invoice?.customerAddress || "",
    customerCity: invoice?.customerCity || "",
    customerProvince: invoice?.customerProvince || "ON",
    customerPostalCode: invoice?.customerPostalCode || "",
    issueDate: invoice?.issueDate || new Date().toISOString().split("T")[0],
    dueDate: invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: invoice?.currency || "CAD",
    notes: invoice?.notes || "",
    terms: invoice?.terms || "Payment due within 30 days of invoice date.",
  })

  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.lineItems?.length ? invoice.lineItems : [createEmptyLineItem()]
  )

  const [totals, setTotals] = useState({ subtotal: 0, taxTotal: 0, total: 0 })

  // Calculate totals when line items change
  useEffect(() => {
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

    // Only update if values actually changed
    const newTotal = { subtotal, taxTotal, total: subtotal + taxTotal }
    if (newTotal.subtotal !== totals.subtotal || newTotal.taxTotal !== totals.taxTotal) {
      setLineItems(updatedItems)
      setTotals(newTotal)
    }
  }, [lineItems.map(i => `${i.quantity}-${i.unitPrice}-${i.taxRate}`).join(",")])

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email || "",
        customerAddress: customer.street || "",
        customerCity: customer.city || "",
        customerProvince: customer.province || "ON",
        customerPostalCode: customer.postalCode || "",
      }))
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
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

  const buildInput = (): CreateInvoiceInput => ({
    customerId: formData.customerId,
    invoiceDate: formData.issueDate,
    dueDate: formData.dueDate,
    paymentTerms: formData.terms,
    notes: formData.notes,
    items: lineItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  })

  const handleSave = async () => {
    if (!formData.customerId) {
      alert("Please select a customer")
      return
    }
    if (lineItems.every(i => !i.description)) {
      alert("Please add at least one line item")
      return
    }
    await onSave(buildInput())
  }

  const handleSend = async () => {
    if (!formData.customerId) {
      alert("Please select a customer")
      return
    }
    if (onSend) {
      await onSend(buildInput())
    }
  }

  const handlePreview = () => {
    setShowPreview(true)
  }

  const handleDownloadPDF = () => {
    const pdfData: InvoicePDFData = {
      invoiceNumber: formData.invoiceNumber,
      issueDate: formData.issueDate,
      dueDate: formData.dueDate,
      status: 'draft',
      companyName: 'Your Company', // Would come from org settings
      companyAddress: '123 Business St',
      companyCity: 'Toronto',
      companyProvince: 'ON',
      companyPostalCode: 'M5V 1A1',
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerAddress: formData.customerAddress,
      customerCity: formData.customerCity,
      customerProvince: formData.customerProvince,
      customerPostalCode: formData.customerPostalCode,
      items: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.amount,
      })),
      subtotal: totals.subtotal,
      taxBreakdown: [{
        name: formData.customerProvince === 'ON' ? 'HST' : 'Tax',
        rate: lineItems[0]?.taxRate / 100 || 0.13,
        amount: totals.taxTotal,
      }],
      total: totals.total,
      amountPaid: 0,
      balanceDue: totals.total,
      notes: formData.notes,
      terms: formData.terms,
    }
    downloadInvoicePDF(pdfData)
  }

  // customers already filtered by useCustomers() hook

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
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
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
          </CardContent>
        </Card>

        {/* Right Column - Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bill To</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select 
                value={formData.customerId} 
                onValueChange={handleCustomerChange}
                disabled={contactsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={contactsLoading ? "Loading..." : "Select a customer"} />
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.customerAddress}
                  onChange={e => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                  placeholder="Street address"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.customerCity}
                  onChange={e => setFormData(prev => ({ ...prev, customerCity: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Province</Label>
                <Select 
                  value={formData.customerProvince} 
                  onValueChange={v => setFormData(prev => ({ ...prev, customerProvince: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={formData.customerPostalCode}
                  onChange={e => setFormData(prev => ({ ...prev, customerPostalCode: e.target.value }))}
                  placeholder="A1A 1A1"
                />
              </div>
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
                    step="1"
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
              <span className="text-primary">{formatCurrency(totals.total, formData.currency)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes for the customer..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea
              value={formData.terms}
              onChange={e => setFormData(prev => ({ ...prev, terms: e.target.value }))}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            Download PDF
          </Button>
          <Button variant="secondary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          {onSend && (
            <Button onClick={handleSend} disabled={saving} className="shadow-maple">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Invoice
            </Button>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 p-6 bg-white rounded-lg border">
            {/* Invoice Header */}
            <div className="flex justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                <p className="text-muted-foreground">{formData.invoiceNumber}</p>
              </div>
              <div className="text-right text-sm">
                <p>Issue Date: {formData.issueDate}</p>
                <p>Due Date: {formData.dueDate}</p>
              </div>
            </div>
            
            {/* Bill To */}
            <div>
              <p className="text-sm font-semibold text-primary mb-1">BILL TO</p>
              <p className="font-medium">{formData.customerName || "—"}</p>
              <p className="text-sm text-muted-foreground">{formData.customerEmail}</p>
              <p className="text-sm text-muted-foreground">
                {[formData.customerAddress, formData.customerCity, formData.customerProvince, formData.customerPostalCode].filter(Boolean).join(", ")}
              </p>
            </div>

            {/* Line Items */}
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Description</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.description || "—"}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2">{formatCurrency(item.unitPrice, formData.currency)}</td>
                    <td className="text-right py-2">{formatCurrency(item.amount, formData.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal, formData.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(totals.taxTotal, formData.currency)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(totals.total, formData.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {formData.notes && (
              <div>
                <p className="text-sm font-semibold mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{formData.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
