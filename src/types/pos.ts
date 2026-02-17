// POS (Point of Sale) Types

export interface POSSession {
  id: string;
  organization_id: string;
  user_id: string;
  session_number: string;
  register_name: string;
  status: 'open' | 'closed';
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  cash_difference: number | null;
  opened_at: string;
  closed_at: string | null;
  opening_notes: string | null;
  closing_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  user?: {
    email: string;
    full_name?: string;
  };
}

export interface POSTransaction {
  id: string;
  organization_id: string;
  session_id: string | null;
  customer_id: string | null;
  transaction_number: string;
  status: 'pending' | 'completed' | 'voided' | 'refunded';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  gst_amount: number;
  pst_amount: number;
  hst_amount: number;
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  amount_paid: number;
  change_given: number;
  invoice_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: POSTransactionItem[];
  payments?: POSPayment[];
  customer?: {
    id: string;
    name: string;
    email: string | null;
  };
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  created_at: string;
  // UI state
  product?: {
    id: string;
    name: string;
    sku: string;
    image_url?: string;
  };
}

export interface POSPayment {
  id: string;
  transaction_id: string;
  payment_method: PaymentMethod;
  amount: number;
  card_type: string | null;
  card_last_four: string | null;
  authorization_code: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'interac' | 'gift_card' | 'store_credit' | 'other';

export interface POSCashMovement {
  id: string;
  session_id: string;
  user_id: string;
  movement_type: 'in' | 'out';
  amount: number;
  reason: string;
  notes: string | null;
  created_at: string;
}

// Cart types (client-side state)
export interface CartItem {
  id: string; // temporary ID for cart
  product_id: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
  image_url?: string;
}

export interface Cart {
  items: CartItem[];
  customer_id: string | null;
  customer_name: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes: string | null;
}

// Input types
export interface CreatePOSSessionInput {
  register_name?: string;
  opening_cash: number;
  opening_notes?: string;
}

export interface ClosePOSSessionInput {
  closing_cash: number;
  closing_notes?: string;
}

export interface CreatePOSTransactionInput {
  session_id?: string;
  customer_id?: string;
  items: {
    product_id?: string;
    name: string;
    sku?: string;
    barcode?: string;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
    tax_rate?: number;
  }[];
  payments: {
    payment_method: PaymentMethod;
    amount: number;
    card_type?: string;
    card_last_four?: string;
    authorization_code?: string;
    reference_number?: string;
  }[];
  discount_amount?: number;
  notes?: string;
}

export interface POSCashMovementInput {
  session_id: string;
  movement_type: 'in' | 'out';
  amount: number;
  reason: string;
  notes?: string;
}

// Report types
export interface POSSessionSummary {
  total_transactions: number;
  total_sales: number;
  total_refunds: number;
  net_sales: number;
  cash_sales: number;
  card_sales: number;
  other_sales: number;
  total_tax: number;
  total_discounts: number;
  items_sold: number;
  average_transaction: number;
}

export interface POSDailySummary {
  date: string;
  transactions: number;
  gross_sales: number;
  refunds: number;
  net_sales: number;
  tax_collected: number;
  discounts_given: number;
  cash_collected: number;
  card_collected: number;
}
