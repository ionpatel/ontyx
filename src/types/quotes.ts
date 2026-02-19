// Quote/Estimate Types for Ontyx

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted'

export interface QuoteLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number // percentage
  taxRate: number // percentage
  amount: number // calculated: (quantity * unitPrice) - discount + tax
}

export interface Quote {
  id: string
  organization_id: string
  quote_number: string
  
  // Customer
  contact_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  
  // Dates
  quote_date: string
  valid_until: string
  
  // Items & Totals
  items: QuoteLineItem[]
  subtotal: number
  discount_total: number
  tax_total: number
  total: number
  currency: string
  
  // Status
  status: QuoteStatus
  sent_at?: string
  viewed_at?: string
  accepted_at?: string
  rejected_at?: string
  rejection_reason?: string
  
  // Conversion
  converted_to_invoice_id?: string
  converted_at?: string
  
  // Content
  title?: string
  summary?: string
  terms?: string
  notes?: string
  
  // Metadata
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreateQuoteInput {
  contact_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  quote_date?: string
  valid_days?: number // defaults to 30
  title?: string
  summary?: string
  items: Omit<QuoteLineItem, 'id' | 'amount'>[]
  discount_total?: number
  terms?: string
  notes?: string
  currency?: string
}

export interface QuoteStats {
  total: number
  draft: number
  sent: number
  accepted: number
  rejected: number
  expired: number
  converted: number
  total_value: number
  accepted_value: number
  conversion_rate: number
}
