"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Plus, RefreshCw, Pause, Play, Trash2, Edit, 
  Loader2, Calendar, DollarSign, Users, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"
import { useRecurringInvoices } from "@/hooks/use-recurring-invoices"
import { useCustomers } from "@/hooks/use-contacts"
import type { RecurringFrequency, CreateRecurringInput, RecurringInvoice } from "@/services/recurring-invoices"

// Line item type for the form
interface RecurringInvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
}

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
]

const PROVINCES = [
  { value: 'ON', label: 'Ontario (HST 13%)' },
  { value: 'BC', label: 'British Columbia (GST 5% + PST 7%)' },
  { value: 'AB', label: 'Alberta (GST 5%)' },
  { value: 'QC', label: 'Quebec (GST 5% + QST 9.975%)' },
  { value: 'MB', label: 'Manitoba (GST 5% + PST 7%)' },
  { value: 'SK', label: 'Saskatchewan (GST 5% + PST 6%)' },
  { value: 'NS', label: 'Nova Scotia (HST 15%)' },
  { value: 'NB', label: 'New Brunswick (HST 15%)' },
  { value: 'NL', label: 'Newfoundland (HST 15%)' },
  { value: 'PE', label: 'PEI (HST 15%)' },
]

export default function RecurringInvoicesPage() {
  const { 
    recurringInvoices, 
    loading, 
    stats, 
    createRecurring, 
    toggleActive, 
    deleteRecurring 
  } = useRecurringInvoices()
  const { contacts: customers } = useCustomers()
  
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // Form state for new recurring invoice
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    frequency: 'monthly' as RecurringFrequency,
    startDate: new Date().toISOString().split('T')[0],
    daysUntilDue: 30,
    taxProvince: 'ON',
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }] as RecurringInvoiceItem[],
  })

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerEmail: customer.email || '',
      }))
    }
  }

  const updateItem = (index: number, field: keyof RecurringInvoiceItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      // Recalculate amount
      newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice
      return { ...prev, items: newItems }
    })
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const subtotal = formData.items.reduce((sum, item) => sum + item.amount, 0)

  const handleCreate = async () => {
    if (!formData.customerId || formData.items.length === 0 || subtotal === 0) return
    
    setCreating(true)
    
    const input: CreateRecurringInput = {
      customerId: formData.customerId,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail || undefined,
      items: formData.items,
      subtotal,
      taxProvince: formData.taxProvince,
      frequency: formData.frequency,
      startDate: formData.startDate,
      daysUntilDue: formData.daysUntilDue,
      notes: formData.notes || undefined,
    }
    
    const created = await createRecurring(input)
    
    if (created) {
      setShowCreate(false)
      // Reset form
      setFormData({
        customerId: '',
        customerName: '',
        customerEmail: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        daysUntilDue: 30,
        taxProvince: 'ON',
        notes: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
      })
    }
    
    setCreating(false)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Invoices</h1>
          <p className="text-muted-foreground">
            Automatically generate invoices on a schedule
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="shadow-maple">
              <Plus className="mr-2 h-4 w-4" /> New Recurring
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Recurring Invoice</DialogTitle>
              <DialogDescription>
                Set up automatic invoice generation for a customer
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={formData.customerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Schedule */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select 
                    value={formData.frequency} 
                    onValueChange={(v: RecurringFrequency) => setFormData(prev => ({ ...prev, frequency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms (Days)</Label>
                  <Select 
                    value={formData.daysUntilDue.toString()} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, daysUntilDue: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Due on Receipt</SelectItem>
                      <SelectItem value="15">Net 15</SelectItem>
                      <SelectItem value="30">Net 30</SelectItem>
                      <SelectItem value="45">Net 45</SelectItem>
                      <SelectItem value="60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Tax Province */}
              <div className="space-y-2">
                <Label>Tax Province</Label>
                <Select 
                  value={formData.taxProvince} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, taxProvince: v }))}
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
              
              {/* Line Items */}
              <div className="space-y-4">
                <Label>Line Items *</Label>
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-24 text-right pt-2 font-medium">
                      {formatCurrency(item.amount, 'CAD')}
                    </div>
                    {formData.items.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
                
                <div className="flex justify-end pt-2">
                  <div className="text-right">
                    <span className="text-muted-foreground">Subtotal: </span>
                    <span className="font-bold text-lg">{formatCurrency(subtotal, 'CAD')}</span>
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes to include on each invoice..."
                  rows={2}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={creating || !formData.customerId || subtotal === 0}
                className="shadow-maple"
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Recurring Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recurring</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Pause className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.paused}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue, 'CAD')}</div>
            <p className="text-xs text-muted-foreground">From monthly recurring</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Recurring Invoices</CardTitle>
          <CardDescription>
            Manage your automatic invoice schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recurringInvoices.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No recurring invoices</h3>
              <p className="text-muted-foreground mb-4">
                Create your first recurring invoice to automate billing
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Recurring Invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringInvoices.map(recurring => (
                  <TableRow key={recurring.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{recurring.customerName}</p>
                        {recurring.customerEmail && (
                          <p className="text-sm text-muted-foreground">{recurring.customerEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(recurring.subtotal, 'CAD')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {FREQUENCIES.find(f => f.value === recurring.frequency)?.label || recurring.frequency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(recurring.nextDate).toLocaleDateString('en-CA')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {recurring.status === 'active' ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleActive(recurring.id)}
                          title={recurring.status === 'active' ? 'Pause' : 'Activate'}
                        >
                          {recurring.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete recurring invoice?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will stop all future invoice generation for {recurring.customerName}.
                                Past invoices will not be affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteRecurring(recurring.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
