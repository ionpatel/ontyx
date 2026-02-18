'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Zap, Search, User, DollarSign, FileText, 
  Send, Save, Loader2, Plus, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCustomers } from '@/hooks/use-contacts'
import { useInvoices } from '@/hooks/use-invoices'
import { useOrganization } from '@/hooks/use-organization'
import { cn, formatCurrency } from '@/lib/utils'

// Tax rates by province
const PROVINCE_TAX: Record<string, { rate: number; label: string }> = {
  ON: { rate: 13, label: 'HST 13%' },
  BC: { rate: 12, label: 'GST+PST 12%' },
  AB: { rate: 5, label: 'GST 5%' },
  SK: { rate: 11, label: 'GST+PST 11%' },
  MB: { rate: 12, label: 'GST+PST 12%' },
  QC: { rate: 14.975, label: 'GST+QST ~15%' },
  NB: { rate: 15, label: 'HST 15%' },
  NS: { rate: 15, label: 'HST 15%' },
  NL: { rate: 15, label: 'HST 15%' },
  PE: { rate: 15, label: 'HST 15%' },
  NT: { rate: 5, label: 'GST 5%' },
  YT: { rate: 5, label: 'GST 5%' },
  NU: { rate: 5, label: 'GST 5%' },
}

interface QuickInvoiceModalProps {
  trigger?: React.ReactNode
}

export function QuickInvoiceModal({ trigger }: QuickInvoiceModalProps) {
  const router = useRouter()
  const { contacts: customers, loading: customersLoading } = useCustomers()
  const { createInvoice } = useInvoices()
  const { organization } = useOrganization()
  
  const [open, setOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; email?: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')

  // Get default tax rate from organization province
  const province = organization?.province || 'ON'
  const taxInfo = PROVINCE_TAX[province] || PROVINCE_TAX.ON
  const taxRate = taxInfo.rate

  // Calculate totals
  const subtotal = parseFloat(amount) || 0
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedCustomer(null)
        setAmount('')
        setDescription('')
        setNewCustomerName('')
        setSuccess(false)
      }, 200)
    }
  }, [open])

  const handleSubmit = async (sendEmail: boolean = false) => {
    if (!selectedCustomer || !amount) return

    setSaving(true)
    try {
      const invoice = await createInvoice({
        customerId: selectedCustomer.id,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{
          description: description || 'Services',
          quantity: 1,
          unitPrice: subtotal,
          taxRate: taxRate,
        }],
        notes: '',
        paymentTerms: 'Net 30',
      })

      if (invoice) {
        setSuccess(true)
        setTimeout(() => {
          setOpen(false)
          router.push(`/invoices/${invoice.id}`)
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to create invoice:', error)
    } finally {
      setSaving(false)
    }
  }

  // Filter customers for search
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(newCustomerName.toLowerCase()) ||
    c.email?.toLowerCase().includes(newCustomerName.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Zap className="h-4 w-4" />
            Quick Invoice
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Invoice Created!</h3>
            <p className="text-muted-foreground mt-1">Redirecting...</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Invoice
              </DialogTitle>
              <DialogDescription>
                Create an invoice in seconds. Tax auto-calculated for {province}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label>Customer</Label>
                <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={customerOpen}
                      className="w-full justify-between font-normal"
                    >
                      {selectedCustomer ? (
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {selectedCustomer.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Search customers...</span>
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search customers..." 
                        value={newCustomerName}
                        onValueChange={setNewCustomerName}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="py-2 text-center text-sm">
                            <p className="text-muted-foreground">No customer found</p>
                            <Button
                              variant="link"
                              size="sm"
                              className="mt-1"
                              onClick={() => router.push('/contacts/new')}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add new customer
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Recent">
                          {filteredCustomers.slice(0, 5).map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => {
                                setSelectedCustomer({
                                  id: customer.id,
                                  name: customer.name,
                                  email: customer.email || undefined,
                                })
                                setCustomerOpen(false)
                              }}
                            >
                              <User className="mr-2 h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{customer.name}</span>
                                {customer.email && (
                                  <span className="text-xs text-muted-foreground">{customer.email}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label>Amount (before tax)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                    autoFocus
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="What is this invoice for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Totals Preview */}
              {subtotal > 0 && (
                <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal, 'CAD')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{taxInfo.label}</span>
                    <span>{formatCurrency(taxAmount, 'CAD')}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(total, 'CAD')}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={!selectedCustomer || !amount || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit(true)}
                disabled={!selectedCustomer || !amount || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Create & Send
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
