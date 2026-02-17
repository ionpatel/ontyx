// Purchase Orders Types

export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'partial' | 'completed' | 'cancelled'

export interface PurchaseOrder {
  id: string
  organization_id: string
  order_number: string
  vendor_ref?: string
  contact_id: string
  order_date: string
  expected_date?: string
  status: OrderStatus
  currency: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  shipping_amount: number
  total: number
  ship_to_address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  warehouse_id?: string
  approved_by?: string
  approved_at?: string
  notes?: string
  internal_notes?: string
  bill_id?: string
  created_by?: string
  created_at: string
  updated_at: string
  // Joined data
  contact?: {
    id: string
    display_name: string
    email?: string
    phone?: string
  }
  warehouse?: {
    id: string
    name: string
    code: string
  }
  items?: PurchaseOrderItem[]
  items_count?: number
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  line_number: number
  product_id?: string
  variant_id?: string
  description: string
  quantity: number
  quantity_received: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  line_total: number
  created_at: string
  // Joined
  product?: {
    id: string
    name: string
    sku?: string
  }
}

export interface CreatePurchaseOrderInput {
  contact_id: string
  order_date?: string
  expected_date?: string
  vendor_ref?: string
  currency?: string
  warehouse_id?: string
  ship_to_address?: PurchaseOrder['ship_to_address']
  notes?: string
  internal_notes?: string
  items: CreatePurchaseOrderItemInput[]
}

export interface CreatePurchaseOrderItemInput {
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  tax_rate?: number
}

export interface UpdatePurchaseOrderInput {
  vendor_ref?: string
  expected_date?: string
  warehouse_id?: string
  ship_to_address?: PurchaseOrder['ship_to_address']
  notes?: string
  internal_notes?: string
}

export interface PurchaseOrderSummary {
  total_orders: number
  draft_count: number
  pending_count: number
  completed_count: number
  total_value: number
  pending_value: number
}
