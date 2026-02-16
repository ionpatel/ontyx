"use client"

import { useState } from "react"
import { Loader2, DollarSign, CreditCard, Building2, Banknote, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethod = 
  | 'cash'
  | 'cheque'
  | 'e-transfer'
  | 'credit_card'
  | 'debit'
  | 'bank_transfer'
  | 'other'

export interface PaymentInput {
  amount: number
  paymentDate: string
  method: PaymentMethod
  reference?: string
  notes?: string
}

interface RecordPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceNumber: string
  customerName: string
  totalAmount: number
  amountDue: number
  onRecordPayment: (payment: PaymentInput) => Promise<boolean>
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'e-transfer', label: 'Interac e-Transfer', icon: Building2 },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'debit', label: 'Debit Card', icon: CreditCard },
  { value: 'cheque', label: 'Cheque', icon: Receipt },
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'bank_transfer', label: 'Bank Transfer / Wire', icon: Building2 },
  { value: 'other', label: 'Other', icon: DollarSign },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceNumber,
  customerName,
  totalAmount,
  amountDue,
  onRecordPayment,
}: RecordPaymentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [payment, setPayment] = useState<PaymentInput>({
    amount: amountDue,
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'e-transfer',
    reference: '',
    notes: '',
  })

  // Reset form when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPayment({
        amount: amountDue,
        paymentDate: new Date().toISOString().split('T')[0],
        method: 'e-transfer',
        reference: '',
        notes: '',
      })
      setError(null)
    }
    onOpenChange(open)
  }

  const handleSubmit = async () => {
    // Validation
    if (payment.amount <= 0) {
      setError('Payment amount must be greater than 0')
      return
    }
    if (payment.amount > amountDue) {
      setError(`Payment cannot exceed amount due (${formatCurrency(amountDue, 'CAD')})`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const success = await onRecordPayment(payment)
      if (success) {
        onOpenChange(false)
      } else {
        setError('Failed to record payment. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFullPayment = () => {
    setPayment(prev => ({ ...prev, amount: amountDue }))
  }

  const remainingAfterPayment = amountDue - payment.amount

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoiceNumber} from {customerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Summary */}
          <div className="flex justify-between items-center p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(amountDue, 'CAD')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Invoice Total</p>
              <p className="text-lg font-medium">
                {formatCurrency(totalAmount, 'CAD')}
              </p>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Payment Amount *</Label>
              <Button 
                type="button" 
                variant="link" 
                size="sm" 
                className="h-auto p-0 text-primary"
                onClick={handleFullPayment}
              >
                Pay full amount
              </Button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                min="0.01"
                max={amountDue}
                step="0.01"
                value={payment.amount}
                onChange={(e) => setPayment(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                className="pl-8"
              />
            </div>
            {remainingAfterPayment > 0 && payment.amount > 0 && (
              <p className="text-sm text-muted-foreground">
                Remaining after payment: {formatCurrency(remainingAfterPayment, 'CAD')}
              </p>
            )}
            {remainingAfterPayment === 0 && payment.amount > 0 && (
              <p className="text-sm text-green-600 font-medium">
                ✓ This will mark the invoice as fully paid
              </p>
            )}
          </div>

          {/* Payment Date & Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={payment.paymentDate}
                onChange={(e) => setPayment(prev => ({ 
                  ...prev, 
                  paymentDate: e.target.value 
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={payment.method}
                onValueChange={(v: PaymentMethod) => setPayment(prev => ({ 
                  ...prev, 
                  method: v 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <m.icon className="h-4 w-4" />
                        {m.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference / Transaction ID</Label>
            <Input
              id="reference"
              value={payment.reference}
              onChange={(e) => setPayment(prev => ({ 
                ...prev, 
                reference: e.target.value 
              }))}
              placeholder={
                payment.method === 'cheque' ? 'Cheque number' :
                payment.method === 'e-transfer' ? 'e-Transfer reference' :
                'Transaction ID'
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={payment.notes}
              onChange={(e) => setPayment(prev => ({ 
                ...prev, 
                notes: e.target.value 
              }))}
              placeholder="Add any notes about this payment..."
              rows={2}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || payment.amount <= 0}
            className="shadow-maple"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
