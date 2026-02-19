'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Save, Send, Loader2,
  User, Calendar, FileText, DollarSign, Percent
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useQuotes } from '@/hooks/use-quotes'
import { useContacts } from '@/hooks/use-contacts'
import { useProducts } from '@/hooks/use-inventory'
import { formatCurrency, cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
// Helper to get contact display info (works with both DB and app Contact types)
const getContactName = (contact: any) => contact.displayName || contact.display_name || contact.company || contact.name || ''
const getContactAddress = (contact: any) => {
  // Check for flat DB columns first
  if (contact.billingAddressLine1 || contact.billing_address_line1) {
    return [
      contact.billingAddressLine1 || contact.billing_address_line1,
      contact.billingCity || contact.billing_city,
      contact.billingState || contact.billing_state,
      contact.billingPostalCode || contact.billing_postal_code
    ].filter(Boolean).join(', ')
  }
  // Fall back to addresses array
  const billing = contact.addresses?.find((a: any) => a.type === 'billing' && a.isPrimary) || contact.addresses?.[0]
  if (!billing) return ''
  return [billing.line1, billing.city, billing.state, billing.postalCode].filter(Boolean).join(', ')
}
const isCustomer = (contact: any) => 
  contact.isCustomer || contact.is_customer || contact.type === 'customer' || contact.type === 'both'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
}

const TAX_RATES = [
  { value: 0, label: 'No Tax' },
  { value: 5, label: 'GST 5%' },
  { value: 13, label: 'HST 13% (ON)' },
  { value: 15, label: 'HST 15% (NS/NB/NL/PE)' },
  { value: 12, label: 'GST+PST 12% (BC)' },
  { value: 11, label: 'GST+PST 11% (SK)' },
  { value: 12, label: 'GST+PST 12% (MB)' },
  { value: 14.975, label: 'GST+QST 14.975% (QC)' },
]

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const duplicateId = searchParams.get('duplicate')
  
  const { createQuote, sendQuote } = useQuotes()
  const { contacts } = useContacts()
  const { products } = useProducts()
  const { success, error: showError } = useToast()

  const [saving, setSaving] = useState(false)
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    validDays: 30,
    terms: 'Payment due within 30 days of invoice.',
    notes: '',
  })

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 13 }
  ])

  const contact = contacts.find(c => c.id === selectedContact)

  // Calculate totals
  const calculateItemAmount = (item: LineItem) => {
    const base = item.quantity * item.unitPrice
    const discountAmount = base * (item.discount / 100)
    const afterDiscount = base - discountAmount
    const taxAmount = afterDiscount * (item.taxRate / 100)
    return afterDiscount + taxAmount
  }

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const discountTotal = items.reduce((sum, item) => {
    const base = item.quantity * item.unitPrice
    return sum + (base * item.discount / 100)
  }, 0)
  const taxTotal = items.reduce((sum, item) => {
    const base = item.quantity * item.unitPrice
    const afterDiscount = base - (base * item.discount / 100)
    return sum + (afterDiscount * item.taxRate / 100)
  }, 0)
  const total = subtotal - discountTotal + taxTotal

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 13 }
    ])
  }

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const addProductToQuote = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: product.name,
        quantity: 1,
        unitPrice: product.unitPrice || 0,
        discount: 0,
        taxRate: 13,
      }
    ])
  }

  const handleSave = async (sendAfterSave: boolean = false) => {
    if (!selectedContact) {
      showError('Missing Customer', 'Please select a customer')
      return
    }
    if (items.filter(i => i.description && i.unitPrice > 0).length === 0) {
      showError('No Items', 'Please add at least one item')
      return
    }

    setSaving(true)

    const quote = await createQuote({
      contact_id: selectedContact,
      customer_name: contact ? getContactName(contact) : '',
      customer_email: contact?.email,
      customer_phone: contact?.phone,
      customer_address: contact ? getContactAddress(contact) : '',
      title: formData.title || undefined,
      summary: formData.summary || undefined,
      valid_days: formData.validDays,
      terms: formData.terms || undefined,
      notes: formData.notes || undefined,
      items: items.filter(i => i.description && i.unitPrice > 0).map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
    })

    if (quote) {
      if (sendAfterSave) {
        await sendQuote(quote.id)
        success('Quote Sent', `Quote ${quote.quote_number} has been sent to ${contact?.email}`)
      } else {
        success('Quote Saved', `Quote ${quote.quote_number} has been saved as draft`)
      }
      router.push('/quotes')
    } else {
      showError('Error', 'Failed to create quote')
    }

    setSaving(false)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quotes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">New Quote</h1>
          <p className="text-muted-foreground">
            Create a professional quote for your customer
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Save & Send
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedContact} onValueChange={setSelectedContact}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.filter(c => isCustomer(c)).map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {getContactName(c)} {c.email && `(${c.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {contact && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium">{getContactName(contact)}</p>
                  {contact.email && <p>{contact.email}</p>}
                  {contact.phone && <p>{contact.phone}</p>}
                  {getContactAddress(contact) && (
                    <p className="text-muted-foreground mt-1">
                      {getContactAddress(contact)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Quote Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title (optional)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g., Website Development Proposal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid For</Label>
                  <Select 
                    value={formData.validDays.toString()} 
                    onValueChange={(v) => setFormData(f => ({ ...f, validDays: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Summary (optional)</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(f => ({ ...f, summary: e.target.value }))}
                  placeholder="Brief description of what this quote covers..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Items
                </CardTitle>
                {products.length > 0 && (
                  <Select onValueChange={addProductToQuote}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Add from catalog..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.slice(0, 20).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} - {formatCurrency(p.unitPrice || 0)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Description</TableHead>
                    <TableHead className="w-[10%]">Qty</TableHead>
                    <TableHead className="w-[15%]">Price</TableHead>
                    <TableHead className="w-[10%]">Discount</TableHead>
                    <TableHead className="w-[15%]">Tax</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount || ''}
                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-16"
                          />
                          <Percent className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={item.taxRate.toString()} 
                          onValueChange={(v) => updateItem(item.id, 'taxRate', parseFloat(v))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TAX_RATES.map(rate => (
                              <SelectItem key={rate.value} value={rate.value.toString()}>
                                {rate.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(calculateItemAmount(item))}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button variant="outline" onClick={addItem} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Line Item
              </Button>
            </CardContent>
          </Card>

          {/* Terms & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData(f => ({ ...f, terms: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Internal Notes (not visible to customer)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Notes for your team..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Quote Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(taxTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{items.filter(i => i.description).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid for</span>
                  <span>{formData.validDays} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm">💡 Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Add a compelling title to make your quote stand out</p>
              <p>• Include a summary to explain the value you're providing</p>
              <p>• Set appropriate validity period based on your business</p>
              <p>• Once accepted, you can convert to invoice with one click</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
