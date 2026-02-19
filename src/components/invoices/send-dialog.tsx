'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Send, Phone, Loader2, Check, AlertCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface SendInvoiceDialogProps {
  invoice: {
    id: string
    invoice_number: string
    total: number
    contact?: {
      display_name?: string
      email?: string
      phone?: string
    }
  }
  onSent?: () => void
}

export function SendInvoiceDialog({ invoice, onSent }: SendInvoiceDialogProps) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<'email' | 'sms' | 'whatsapp'>('email')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [email, setEmail] = useState(invoice.contact?.email || '')
  const [phone, setPhone] = useState(invoice.contact?.phone || '')
  const [customMessage, setCustomMessage] = useState('')

  const handleSend = async () => {
    setSending(true)
    setError(null)
    
    try {
      let endpoint = ''
      let body: any = {}
      
      if (method === 'email') {
        endpoint = '/api/invoices/send-email'
        body = { invoiceId: invoice.id, email, message: customMessage || undefined }
      } else {
        endpoint = '/api/invoices/send-sms'
        body = { 
          invoiceId: invoice.id, 
          phoneNumber: phone, 
          method: method, // 'sms' or 'whatsapp'
          message: customMessage || undefined 
        }
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send')
      }

      setSent(true)
      setTimeout(() => {
        setOpen(false)
        setSent(false)
        onSent?.()
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const formatAmount = (cents: number) => {
    return new Intl.NumberFormat('en-CA', { 
      style: 'currency', 
      currency: 'CAD' 
    }).format(cents / 100)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Send className="h-4 w-4 mr-2" />
          Send Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Invoice #{invoice.invoice_number}</DialogTitle>
          <DialogDescription>
            {formatAmount(invoice.total)} to {invoice.contact?.display_name || 'Customer'}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-semibold text-lg">Invoice Sent!</p>
            <p className="text-muted-foreground">
              {method === 'email' ? 'Email' : method === 'whatsapp' ? 'WhatsApp message' : 'SMS'} delivered successfully
            </p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={method} onValueChange={(v: any) => setMethod(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email" className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  WhatsApp
                  <Badge variant="secondary" className="ml-1 text-[10px] py-0">New</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="sms" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="phone-sms">Phone Number</Label>
                  <Input
                    id="phone-sms"
                    type="tel"
                    placeholder="(416) 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Canadian/US numbers only. Standard SMS rates may apply to recipient.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="whatsapp" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="phone-wa">WhatsApp Number</Label>
                  <Input
                    id="phone-wa"
                    type="tel"
                    placeholder="(416) 555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Customer will receive a formatted message with payment link.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="message">Custom Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder={method === 'email' 
                  ? "Add a personal note to the invoice email..."
                  : "Custom message (leave blank for default)..."}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {method !== 'email' && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Preview:</p>
                <p className="text-muted-foreground text-xs">
                  {method === 'whatsapp' 
                    ? `Hi ${invoice.contact?.display_name?.split(' ')[0] || 'there'}! 👋 You have a new invoice for ${formatAmount(invoice.total)}...`
                    : `Invoice #${invoice.invoice_number} for ${formatAmount(invoice.total)}. Pay online: pay.ontyx.ca/...`}
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleSend} 
                disabled={sending || (method === 'email' ? !email : !phone)}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send via {method === 'email' ? 'Email' : method === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
