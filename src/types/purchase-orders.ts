// Purchase Order Types for Ontyx

export type POStatus = 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'billed' | 'cancelled'

export interface POLineItem {
  id: string
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  received_qty: number
  amount: number
}

export interface PurchaseOrder {
  id: string
  organization_id: string
  po_number: string
  
  // Vendor
  vendor_id: string
  vendor_name: string
  vendor_email?: string
  vendor_phone?: string
  vendor_address?: string
  
  // Dates
  order_date: string
  expected_date?: string
  received_date?: string
  
  // Items & Totals
  items: POLineItem[]
  subtotal: number
  tax_total: number
  shipping: number
  total: number
  currency: string
  
  // Status
  status: POStatus
  sent_at?: string
  confirmed_at?: string
  
  // Receiving
  receiving_notes?: string
  
  // Billing
  bill_id?: string
  billed_at?: string
  
  // Shipping
  shipping_method?: string
  tracking_number?: string
  
  // Extra
  notes?: string
  internal_notes?: string
  
  // Metadata
  created_by?: string
  created_at: string
  updated_at: string
}

export interface CreatePOInput {
  vendor_id: string
  vendor_name: string
  vendor_email?: string
  order_date?: string
  expected_date?: string
  items: Omit<POLineItem, 'id' | 'amount' | 'received_qty'>[]
  shipping?: number
  shipping_method?: string
  notes?: string
  internal_notes?: string
}

export interface POStats {
  total: number
  draft: number
  pending: number // sent + confirmed
  received: number
  total_value: number
  pending_value: number
  overdue: number
}

export interface ReceiveItemInput {
  line_item_id: string
  quantity: number
  notes?: string
}
