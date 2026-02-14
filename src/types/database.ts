// Ontyx ERP - Database Types
// Auto-generated types matching Supabase schema

// =============================================================================
// ENUMS
// =============================================================================

export type OrgStatus = 'active' | 'suspended' | 'cancelled' | 'trial';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';
export type MemberRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR' | 'JPY' | 'CNY';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'void' | 'cancelled';
export type BillStatus = 'draft' | 'pending' | 'approved' | 'partial' | 'paid' | 'overdue' | 'void';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'other';
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type JournalStatus = 'draft' | 'posted' | 'void';
export type TransactionType = 'debit' | 'credit';
export type BankAccountType = 'checking' | 'savings' | 'credit_card' | 'loan' | 'other';

export type ProductType = 'physical' | 'service' | 'digital' | 'bundle';
export type InventoryTracking = 'none' | 'quantity' | 'serial' | 'batch';
export type OrderStatus = 'draft' | 'confirmed' | 'processing' | 'partial' | 'completed' | 'cancelled';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled' | 'shipped' | 'delivered';
export type MovementType = 'adjustment' | 'transfer' | 'receipt' | 'shipment' | 'production' | 'scrap' | 'return';
export type WorkOrderStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
export type OpportunityStatus = 'open' | 'won' | 'lost';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'freelance';
export type EmploymentStatus = 'active' | 'on_leave' | 'terminated' | 'resigned';
export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
export type PayrollStatus = 'draft' | 'processing' | 'approved' | 'paid' | 'cancelled';

// =============================================================================
// BASE TYPES
// =============================================================================

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// =============================================================================
// CORE MODULE
// =============================================================================

export interface Organization extends Timestamps {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  timezone: string;
  currency: CurrencyCode;
  fiscal_year_start: number;
  date_format: string;
  plan: string;
  trial_ends_at?: string;
  subscription_id?: string;
  status: OrgStatus;
}

export interface User extends Timestamps {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  theme: string;
  locale: string;
  notifications_enabled: boolean;
  status: UserStatus;
  last_login_at?: string;
}

export interface OrganizationMember extends Timestamps {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  title?: string;
  department?: string;
  custom_permissions: Record<string, boolean>;
  invited_at: string;
  joined_at?: string;
  is_active: boolean;
  // Relations
  organization?: Organization;
  user?: User;
}

export interface Role extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_system: boolean;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Setting extends Timestamps {
  id: string;
  organization_id: string;
  key: string;
  value: unknown;
}

export interface Attachment {
  id: string;
  organization_id: string;
  uploaded_by?: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

// =============================================================================
// FINANCE MODULE
// =============================================================================

export interface ChartOfAccount extends Timestamps {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  account_type: AccountType;
  parent_id?: string;
  is_system: boolean;
  is_active: boolean;
  balance: number;
}

export interface BankAccount extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  account_type: BankAccountType;
  account_number?: string;
  routing_number?: string;
  bank_name?: string;
  currency: CurrencyCode;
  current_balance: number;
  available_balance: number;
  gl_account_id?: string;
  plaid_account_id?: string;
  plaid_item_id?: string;
  last_sync_at?: string;
  is_primary: boolean;
  is_active: boolean;
}

export interface BankTransaction extends Timestamps {
  id: string;
  organization_id: string;
  bank_account_id: string;
  transaction_date: string;
  posted_date?: string;
  description: string;
  amount: number;
  transaction_type: TransactionType;
  running_balance?: number;
  external_id?: string;
  check_number?: string;
  category?: string;
  gl_account_id?: string;
  is_reconciled: boolean;
  reconciled_at?: string;
  matched_entity_type?: string;
  matched_entity_id?: string;
  is_manual: boolean;
}

export interface Contact extends Timestamps {
  id: string;
  organization_id: string;
  is_customer: boolean;
  is_vendor: boolean;
  type: 'company' | 'individual';
  company_name?: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country: string;
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country: string;
  currency: CurrencyCode;
  tax_id?: string;
  payment_terms: number;
  credit_limit?: number;
  ar_account_id?: string;
  ap_account_id?: string;
  outstanding_receivable: number;
  outstanding_payable: number;
  tags: string[];
  notes?: string;
  is_active: boolean;
}

export interface Invoice extends Timestamps {
  id: string;
  organization_id: string;
  invoice_number: string;
  reference?: string;
  contact_id: string;
  issue_date: string;
  due_date: string;
  currency: CurrencyCode;
  subtotal: number;
  discount_amount: number;
  discount_percent?: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  status: InvoiceStatus;
  billing_address?: Address;
  shipping_address?: Address;
  notes?: string;
  terms?: string;
  footer?: string;
  revenue_account_id?: string;
  ar_account_id?: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  created_by?: string;
  // Relations
  contact?: Contact;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  line_number: number;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent?: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  account_id?: string;
  created_at: string;
}

export interface Bill extends Timestamps {
  id: string;
  organization_id: string;
  bill_number: string;
  vendor_ref?: string;
  contact_id: string;
  bill_date: string;
  due_date: string;
  currency: CurrencyCode;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  status: BillStatus;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  expense_account_id?: string;
  ap_account_id?: string;
  paid_at?: string;
  created_by?: string;
  // Relations
  contact?: Contact;
  items?: BillItem[];
}

export interface BillItem {
  id: string;
  bill_id: string;
  line_number: number;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  account_id?: string;
  created_at: string;
}

export interface Payment extends Timestamps {
  id: string;
  organization_id: string;
  payment_number: string;
  payment_type: 'received' | 'made';
  payment_method: PaymentMethod;
  contact_id: string;
  bank_account_id?: string;
  currency: CurrencyCode;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
  created_by?: string;
  // Relations
  contact?: Contact;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  entity_type: 'invoice' | 'bill';
  entity_id: string;
  amount: number;
  created_at: string;
}

export interface JournalEntry extends Timestamps {
  id: string;
  organization_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference?: string;
  source_type?: string;
  source_id?: string;
  total_debit: number;
  total_credit: number;
  status: JournalStatus;
  posted_at?: string;
  posted_by?: string;
  created_by?: string;
  // Relations
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  description?: string;
  debit: number;
  credit: number;
  contact_id?: string;
  created_at: string;
  // Relations
  account?: ChartOfAccount;
}

export interface TaxRate extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  rate: number;
  is_compound: boolean;
  components: Array<{ name: string; rate: number }>;
  sales_tax_account_id?: string;
  purchase_tax_account_id?: string;
  is_active: boolean;
}

export interface RecurringInvoice extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  contact_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  start_date: string;
  end_date?: string;
  next_date?: string;
  invoice_template: Record<string, unknown>;
  is_active: boolean;
  last_generated_at?: string;
  total_generated: number;
}

// =============================================================================
// OPERATIONS MODULE
// =============================================================================

export interface ProductCategory extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  default_tax_rate_id?: string;
  default_revenue_account_id?: string;
  default_expense_account_id?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product extends Timestamps {
  id: string;
  organization_id: string;
  sku?: string;
  name: string;
  description?: string;
  product_type: ProductType;
  category_id?: string;
  currency: CurrencyCode;
  cost_price?: number;
  sell_price?: number;
  compare_at_price?: number;
  tax_rate_id?: string;
  is_taxable: boolean;
  track_inventory: boolean;
  inventory_tracking: InventoryTracking;
  weight?: number;
  weight_unit: string;
  length?: number;
  width?: number;
  height?: number;
  dimension_unit: string;
  reorder_point?: number;
  reorder_quantity?: number;
  min_stock_level: number;
  max_stock_level?: number;
  default_vendor_id?: string;
  vendor_sku?: string;
  lead_time_days?: number;
  revenue_account_id?: string;
  cogs_account_id?: string;
  inventory_account_id?: string;
  images: Array<{ url: string; alt?: string }>;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  is_purchasable: boolean;
  is_sellable: boolean;
  is_featured: boolean;
  tags: string[];
  // Relations
  variants?: ProductVariant[];
  category?: ProductCategory;
}

export interface ProductVariant extends Timestamps {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  cost_price?: number;
  sell_price?: number;
  compare_at_price?: number;
  weight?: number;
  barcode?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Warehouse extends Timestamps {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  is_primary: boolean;
  allow_negative_stock: boolean;
  is_active: boolean;
}

export interface WarehouseZone extends Timestamps {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  zone_type: 'storage' | 'receiving' | 'shipping' | 'staging';
  parent_id?: string;
  location_path?: string;
  max_weight?: number;
  max_volume?: number;
  is_active: boolean;
}

export interface InventoryLevel {
  id: string;
  organization_id: string;
  product_id?: string;
  variant_id?: string;
  warehouse_id: string;
  zone_id?: string;
  on_hand: number;
  available: number;
  committed: number;
  incoming: number;
  average_cost?: number;
  total_value?: number;
  bin_location?: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  organization_id: string;
  movement_number: string;
  movement_type: MovementType;
  movement_date: string;
  product_id?: string;
  variant_id?: string;
  from_warehouse_id?: string;
  from_zone_id?: string;
  to_warehouse_id?: string;
  to_zone_id?: string;
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  serial_numbers: string[];
  batch_number?: string;
  expiry_date?: string;
  reason?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface SalesOrder extends Timestamps {
  id: string;
  organization_id: string;
  order_number: string;
  reference?: string;
  contact_id: string;
  order_date: string;
  expected_date?: string;
  status: OrderStatus;
  fulfillment_status: FulfillmentStatus;
  currency: CurrencyCode;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total: number;
  billing_address?: Address;
  shipping_address?: Address;
  shipping_method?: string;
  tracking_number?: string;
  warehouse_id?: string;
  payment_terms: number;
  notes?: string;
  internal_notes?: string;
  invoice_id?: string;
  created_by?: string;
  // Relations
  contact?: Contact;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  line_number: number;
  product_id?: string;
  variant_id?: string;
  description: string;
  quantity: number;
  quantity_fulfilled: number;
  unit_price: number;
  discount_amount: number;
  discount_percent?: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  created_at: string;
}

export interface PurchaseOrder extends Timestamps {
  id: string;
  organization_id: string;
  order_number: string;
  vendor_ref?: string;
  contact_id: string;
  order_date: string;
  expected_date?: string;
  status: OrderStatus;
  currency: CurrencyCode;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total: number;
  ship_to_address?: Address;
  warehouse_id?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  internal_notes?: string;
  bill_id?: string;
  created_by?: string;
  // Relations
  contact?: Contact;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  line_number: number;
  product_id?: string;
  variant_id?: string;
  description: string;
  quantity: number;
  quantity_received: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  created_at: string;
}

export interface BOM extends Timestamps {
  id: string;
  organization_id: string;
  bom_number: string;
  name: string;
  product_id: string;
  variant_id?: string;
  output_quantity: number;
  version: number;
  is_active: boolean;
  estimated_cost?: number;
  estimated_time_minutes?: number;
  notes?: string;
  created_by?: string;
  // Relations
  items?: BOMItem[];
  product?: Product;
}

export interface BOMItem {
  id: string;
  bom_id: string;
  line_number: number;
  product_id: string;
  variant_id?: string;
  quantity: number;
  unit_cost?: number;
  scrap_percent: number;
  notes?: string;
  created_at: string;
}

export interface WorkOrder extends Timestamps {
  id: string;
  organization_id: string;
  work_order_number: string;
  bom_id: string;
  quantity_to_produce: number;
  quantity_produced: number;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  status: WorkOrderStatus;
  warehouse_id?: string;
  assigned_to?: string;
  estimated_cost?: number;
  actual_cost?: number;
  notes?: string;
  created_by?: string;
  // Relations
  bom?: BOM;
}

// =============================================================================
// RELATIONS MODULE (CRM)
// =============================================================================

export interface PipelineStage extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  probability: number;
  sort_order: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  is_active: boolean;
}

export interface Lead extends Timestamps {
  id: string;
  organization_id: string;
  source?: string;
  campaign?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  website?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  status: LeadStatus;
  score: number;
  assigned_to?: string;
  notes?: string;
  converted_at?: string;
  converted_to_contact_id?: string;
  converted_to_opportunity_id?: string;
  last_activity_at?: string;
  next_follow_up?: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  created_by?: string;
}

export interface Opportunity extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  contact_id?: string;
  lead_id?: string;
  stage_id?: string;
  probability: number;
  currency: CurrencyCode;
  amount?: number;
  expected_revenue?: number;
  expected_close?: string;
  actual_close?: string;
  status: OpportunityStatus;
  lost_reason?: string;
  assigned_to?: string;
  description?: string;
  next_step?: string;
  last_activity_at?: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  created_by?: string;
  // Relations
  contact?: Contact;
  stage?: PipelineStage;
}

export interface Activity extends Timestamps {
  id: string;
  organization_id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  entity_type?: string;
  entity_id?: string;
  subject?: string;
  description?: string;
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  assigned_to?: string;
  outcome?: string;
  created_by?: string;
}

export interface Project extends Timestamps {
  id: string;
  organization_id: string;
  code?: string;
  name: string;
  description?: string;
  contact_id?: string;
  opportunity_id?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  actual_start?: string;
  actual_end?: string;
  currency: CurrencyCode;
  budget_amount?: number;
  actual_amount: number;
  estimated_hours?: number;
  actual_hours: number;
  is_billable: boolean;
  billing_method: 'fixed' | 'hourly' | 'milestone';
  hourly_rate?: number;
  project_manager_id?: string;
  progress_percent: number;
  color: string;
  tags: string[];
  created_by?: string;
  // Relations
  contact?: Contact;
  milestones?: ProjectMilestone[];
  tasks?: Task[];
}

export interface ProjectMilestone extends Timestamps {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  due_date?: string;
  completed_at?: string;
  is_billable: boolean;
  amount?: number;
  invoice_id?: string;
  sort_order: number;
}

export interface Task extends Timestamps {
  id: string;
  organization_id: string;
  project_id?: string;
  milestone_id?: string;
  parent_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours: number;
  assigned_to?: string;
  progress_percent: number;
  tags: string[];
  sort_order: number;
  created_by?: string;
  // Relations
  subtasks?: Task[];
  assignee?: User;
}

export interface TimeEntry extends Timestamps {
  id: string;
  organization_id: string;
  user_id: string;
  project_id?: string;
  task_id?: string;
  entry_date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  description?: string;
  is_billable: boolean;
  hourly_rate?: number;
  total_amount?: number;
  is_invoiced: boolean;
  invoice_id?: string;
}

// =============================================================================
// HR MODULE
// =============================================================================

export interface Department extends Timestamps {
  id: string;
  organization_id: string;
  code?: string;
  name: string;
  description?: string;
  parent_id?: string;
  manager_id?: string;
  expense_account_id?: string;
  is_active: boolean;
}

export interface Employee extends Timestamps {
  id: string;
  organization_id: string;
  user_id?: string;
  employee_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  department_id?: string;
  job_title?: string;
  employment_type: EmploymentType;
  employment_status: EmploymentStatus;
  manager_id?: string;
  hire_date: string;
  probation_end_date?: string;
  termination_date?: string;
  work_hours_per_week: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  tax_id?: string;
  tax_filing_status?: string;
  tax_withholding_allowances: number;
  avatar_url?: string;
  bio?: string;
  custom_fields: Record<string, unknown>;
  // Relations
  department?: Department;
  manager?: Employee;
  user?: User;
}

export interface EmployeeCompensation extends Timestamps {
  id: string;
  employee_id: string;
  effective_date: string;
  end_date?: string;
  pay_type: 'salary' | 'hourly';
  pay_frequency: PayFrequency;
  currency: CurrencyCode;
  amount: number;
  overtime_eligible: boolean;
  overtime_rate: number;
  notes?: string;
}

export interface PayrollRun extends Timestamps {
  id: string;
  organization_id: string;
  run_number: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  status: PayrollStatus;
  currency: CurrencyCode;
  total_gross: number;
  total_deductions: number;
  total_employer_taxes: number;
  total_net: number;
  approved_by?: string;
  approved_at?: string;
  processed_at?: string;
  notes?: string;
  created_by?: string;
  // Relations
  payslips?: Payslip[];
}

export interface Payslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  regular_hours: number;
  regular_pay: number;
  overtime_hours: number;
  overtime_pay: number;
  bonus: number;
  commission: number;
  other_earnings: number;
  gross_pay: number;
  deductions: Array<{ name: string; amount: number; type: string }>;
  total_deductions: number;
  taxes: Array<{ name: string; amount: number; type: string }>;
  total_taxes: number;
  employer_contributions: Array<{ name: string; amount: number }>;
  total_employer_contributions: number;
  net_pay: number;
  payment_method: PaymentMethod;
  bank_account_last4?: string;
  ytd_gross?: number;
  ytd_taxes?: number;
  ytd_deductions?: number;
  ytd_net?: number;
  notes?: string;
  created_at: string;
  // Relations
  employee?: Employee;
}

export interface AttendanceRecord extends Timestamps {
  id: string;
  organization_id: string;
  employee_id: string;
  record_date: string;
  clock_in?: string;
  clock_out?: string;
  break_start?: string;
  break_end?: string;
  work_hours?: number;
  break_hours?: number;
  overtime_hours?: number;
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
  notes?: string;
  approved_by?: string;
  approved_at?: string;
}

export interface LeaveType extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  code?: string;
  description?: string;
  is_paid: boolean;
  accrual_days_per_year?: number;
  max_carry_forward?: number;
  color: string;
  is_active: boolean;
}

export interface LeaveRequest extends Timestamps {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  start_half_day: boolean;
  end_half_day: boolean;
  total_days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  // Relations
  leave_type?: LeaveType;
  employee?: Employee;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  entitled_days: number;
  carried_forward: number;
  taken_days: number;
  pending_days: number;
  balance_days: number;
  updated_at: string;
}

// =============================================================================
// DATABASE SCHEMA TYPE (for Supabase client)
// =============================================================================

export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> };
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> };
      organization_members: { Row: OrganizationMember; Insert: Partial<OrganizationMember>; Update: Partial<OrganizationMember> };
      roles: { Row: Role; Insert: Partial<Role>; Update: Partial<Role> };
      permissions: { Row: Permission; Insert: Partial<Permission>; Update: Partial<Permission> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
      settings: { Row: Setting; Insert: Partial<Setting>; Update: Partial<Setting> };
      attachments: { Row: Attachment; Insert: Partial<Attachment>; Update: Partial<Attachment> };
      chart_of_accounts: { Row: ChartOfAccount; Insert: Partial<ChartOfAccount>; Update: Partial<ChartOfAccount> };
      bank_accounts: { Row: BankAccount; Insert: Partial<BankAccount>; Update: Partial<BankAccount> };
      bank_transactions: { Row: BankTransaction; Insert: Partial<BankTransaction>; Update: Partial<BankTransaction> };
      contacts: { Row: Contact; Insert: Partial<Contact>; Update: Partial<Contact> };
      invoices: { Row: Invoice; Insert: Partial<Invoice>; Update: Partial<Invoice> };
      invoice_items: { Row: InvoiceItem; Insert: Partial<InvoiceItem>; Update: Partial<InvoiceItem> };
      bills: { Row: Bill; Insert: Partial<Bill>; Update: Partial<Bill> };
      bill_items: { Row: BillItem; Insert: Partial<BillItem>; Update: Partial<BillItem> };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
      payment_allocations: { Row: PaymentAllocation; Insert: Partial<PaymentAllocation>; Update: Partial<PaymentAllocation> };
      journal_entries: { Row: JournalEntry; Insert: Partial<JournalEntry>; Update: Partial<JournalEntry> };
      journal_entry_lines: { Row: JournalEntryLine; Insert: Partial<JournalEntryLine>; Update: Partial<JournalEntryLine> };
      tax_rates: { Row: TaxRate; Insert: Partial<TaxRate>; Update: Partial<TaxRate> };
      recurring_invoices: { Row: RecurringInvoice; Insert: Partial<RecurringInvoice>; Update: Partial<RecurringInvoice> };
      product_categories: { Row: ProductCategory; Insert: Partial<ProductCategory>; Update: Partial<ProductCategory> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      product_variants: { Row: ProductVariant; Insert: Partial<ProductVariant>; Update: Partial<ProductVariant> };
      warehouses: { Row: Warehouse; Insert: Partial<Warehouse>; Update: Partial<Warehouse> };
      warehouse_zones: { Row: WarehouseZone; Insert: Partial<WarehouseZone>; Update: Partial<WarehouseZone> };
      inventory_levels: { Row: InventoryLevel; Insert: Partial<InventoryLevel>; Update: Partial<InventoryLevel> };
      inventory_movements: { Row: InventoryMovement; Insert: Partial<InventoryMovement>; Update: Partial<InventoryMovement> };
      sales_orders: { Row: SalesOrder; Insert: Partial<SalesOrder>; Update: Partial<SalesOrder> };
      sales_order_items: { Row: SalesOrderItem; Insert: Partial<SalesOrderItem>; Update: Partial<SalesOrderItem> };
      purchase_orders: { Row: PurchaseOrder; Insert: Partial<PurchaseOrder>; Update: Partial<PurchaseOrder> };
      purchase_order_items: { Row: PurchaseOrderItem; Insert: Partial<PurchaseOrderItem>; Update: Partial<PurchaseOrderItem> };
      boms: { Row: BOM; Insert: Partial<BOM>; Update: Partial<BOM> };
      bom_items: { Row: BOMItem; Insert: Partial<BOMItem>; Update: Partial<BOMItem> };
      work_orders: { Row: WorkOrder; Insert: Partial<WorkOrder>; Update: Partial<WorkOrder> };
      pipeline_stages: { Row: PipelineStage; Insert: Partial<PipelineStage>; Update: Partial<PipelineStage> };
      leads: { Row: Lead; Insert: Partial<Lead>; Update: Partial<Lead> };
      opportunities: { Row: Opportunity; Insert: Partial<Opportunity>; Update: Partial<Opportunity> };
      activities: { Row: Activity; Insert: Partial<Activity>; Update: Partial<Activity> };
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> };
      project_milestones: { Row: ProjectMilestone; Insert: Partial<ProjectMilestone>; Update: Partial<ProjectMilestone> };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
      time_entries: { Row: TimeEntry; Insert: Partial<TimeEntry>; Update: Partial<TimeEntry> };
      departments: { Row: Department; Insert: Partial<Department>; Update: Partial<Department> };
      employees: { Row: Employee; Insert: Partial<Employee>; Update: Partial<Employee> };
      employee_compensation: { Row: EmployeeCompensation; Insert: Partial<EmployeeCompensation>; Update: Partial<EmployeeCompensation> };
      payroll_runs: { Row: PayrollRun; Insert: Partial<PayrollRun>; Update: Partial<PayrollRun> };
      payslips: { Row: Payslip; Insert: Partial<Payslip>; Update: Partial<Payslip> };
      attendance_records: { Row: AttendanceRecord; Insert: Partial<AttendanceRecord>; Update: Partial<AttendanceRecord> };
      leave_types: { Row: LeaveType; Insert: Partial<LeaveType>; Update: Partial<LeaveType> };
      leave_requests: { Row: LeaveRequest; Insert: Partial<LeaveRequest>; Update: Partial<LeaveRequest> };
      leave_balances: { Row: LeaveBalance; Insert: Partial<LeaveBalance>; Update: Partial<LeaveBalance> };
    };
  };
}
