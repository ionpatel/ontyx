# Database Schema Audit - Feb 17, 2026

## Actual Database Schema (from Supabase API)

### invoices
```
amount_due, amount_paid, ar_account_id, billing_address, contact_id, created_at, 
created_by, currency, discount_amount, discount_percent, due_date, footer, id, 
invoice_number, issue_date, notes, organization_id, paid_at, reference, 
revenue_account_id, sent_at, shipping_address, status, subtotal, tax_amount, 
terms, total, updated_at, viewed_at
```

### sales_orders
```
billing_address, contact_id, created_at, created_by, currency, discount_amount, 
expected_date, fulfillment_status, id, internal_notes, invoice_id, notes, 
order_date, order_number, organization_id, payment_terms, reference, 
shipping_address, shipping_amount, shipping_method, status, subtotal, tax_amount, 
total, tracking_number, updated_at, warehouse_id
```
**NOTE: NO amount_due/balance_due columns!**

### products
```
category_id, cogs_account_id, compare_at_price, cost_price, created_at, currency,
default_vendor_id, description, dimension_unit, height, id, images, 
inventory_account_id, inventory_tracking, is_active, is_featured, is_purchasable, 
is_sellable, is_taxable, lead_time_days, length, max_stock_level, meta_description,
meta_title, min_stock_level, name, organization_id, product_type, reorder_point, 
reorder_quantity, revenue_account_id, sell_price, sku, slug, tags, tax_rate_id, 
track_inventory, updated_at, vendor_sku, weight, weight_unit, width
```
**NOTE: NO stock_quantity! Use inventory_levels table instead**
**NOTE: reorder_point not reorder_level**

### inventory_levels (separate table!)
```
available, average_cost, bin_location, committed, id, incoming, on_hand, 
organization_id, product_id, total_value, updated_at, variant_id, warehouse_id, zone_id
```

### contacts
```
ap_account_id, ar_account_id, billing_address_line1, billing_address_line2, 
billing_city, billing_country, billing_postal_code, billing_state, company_name, 
created_at, credit_limit, currency, display_name, email, first_name, id, is_active,
is_customer, is_vendor, last_name, mobile, notes, organization_id, 
outstanding_payable, outstanding_receivable, payment_terms, phone, 
shipping_address_line1, shipping_address_line2, shipping_city, shipping_country, 
shipping_postal_code, shipping_state, tags, tax_id, type, updated_at, website
```

### users
```
avatar_url, created_at, email, full_name, id, last_login_at, locale, 
notifications_enabled, phone, status, theme, updated_at
```
**NOTE: full_name not first_name/last_name**
**NOTE: locale not language**

### organizations
```
address_line1, address_line2, city, country, created_at, currency, date_format, 
email, fiscal_year_start, id, logo_url, name, phone, plan, postal_code, slug, 
state, status, subscription_id, timezone, trial_ends_at, updated_at, website
```
**NOTE: NO tax_number/gst_number field!**

### organization_members
```
created_at, custom_permissions, department, id, invited_at, is_active, joined_at, 
organization_id, role, title, updated_at, user_id
```

---

## Known Mismatches to Fix

### 1. dashboard.ts - getStats()
**WRONG:**
```ts
products.select('id, stock_quantity, reorder_level')
```
**CORRECT:**
```ts
// Need to join with inventory_levels
// products doesn't have stock_quantity
// Use reorder_point not reorder_level
```

### 2. sales.ts - sales_orders
**WRONG:**
```ts
balance_due: total  // column doesn't exist
amount_due: total   // column doesn't exist
```
**FIX:** Remove these - sales_orders doesn't track payment

### 3. organization.ts
**WRONG:**
```ts
tax_number / gst_number  // column doesn't exist
```
**FIX:** Need to add column or remove from UI

### 4. user-profile.ts
**WRONG:**
```ts
language  // should be locale
firstName/lastName  // should be full_name
```

---

## Action Plan
1. Fix dashboard.ts - use inventory_levels join
2. Fix sales.ts - remove balance_due/amount_due
3. Fix organization.ts - handle missing tax_number
4. Verify all other services against actual schema
