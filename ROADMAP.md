# Ontyx Production Roadmap
**Goal:** Complete Canadian ERP ready for real businesses  
**Owner:** Ion (24/7 autonomous development)  
**Started:** Feb 16, 2026

---

## Phase 2: Core Modules ✅ COMPLETE
- [x] Inventory management
- [x] Contacts (customers/vendors)
- [x] Sales orders
- [x] Invoicing with PDF generation
- [x] Dashboard with real stats
- [x] Demo mode working

## Phase 3: Business Operations (Current Sprint)

### Week 1: Auth & Settings (Priority)
- [x] **Organization Settings Page** ✅
  - Company name, logo upload
  - Address, phone, email
  - GST/HST number for invoices
  - Default currency, timezone
- [x] **User profile page** ✅
  - Avatar upload
  - Name, phone, job title
  - Timezone preference
  - Password change
- [ ] **Google OAuth** - complete backend setup
- [ ] **Email verification** - working flow

### Week 2: Complete Invoice Flow
- [x] **Email invoices** ✅ - send PDF via Resend
- [x] **Payment recording** ✅ - mark partial/full payments
- [x] **Recurring invoices** ✅ - schedule auto-generation
- [ ] **Invoice templates** - customizable branding

### Week 3: Banking & Payments
- [x] **Bank accounts CRUD** ✅ - add, edit, delete accounts
- [x] **Manual transactions** ✅ - record deposits & payments
- [x] **Transaction categorization** ✅ - assign categories
- [x] **Reconciliation** ✅ - mark transactions reconciled
- [x] **Banking summary** ✅ - totals, inflow/outflow
- [ ] **Plaid integration** - connect Canadian banks (auto-import)
- [ ] **Bank reconciliation v2** - auto-match with invoices/bills

### Week 4: Canadian Payroll ✅ COMPLETE
- [x] **Employee profiles** ✅ - SIN, tax info, pay rate (migration ready)
- [x] **Pay runs** ✅ - calculate CPP/EI deductions
- [x] **Pay stubs** ✅ - generate PDF stubs
- [x] **T4 generation** ✅ - year-end tax slips
- [x] **ROE export** ✅ - Record of Employment for Service Canada

## Phase 4: Reports & Analytics
- [ ] **Profit & Loss** - income vs expenses
- [ ] **Balance Sheet** - assets, liabilities, equity
- [ ] **Cash Flow** - money in/out over time
- [ ] **Tax Summary** - GST/HST collected vs paid
- [ ] **Accounts Aging** - overdue invoices/bills
- [ ] **Export to CSV/PDF**

## Phase 5: Polish & Launch
- [ ] **Multi-user** - invite team members with roles
- [ ] **Audit log** - track all changes
- [ ] **Data backup** - export everything
- [ ] **Stripe billing** - subscription management
- [ ] **Onboarding wizard** - setup flow for new users
- [ ] **Help docs** - in-app guidance
- [ ] **Mobile responsive** - works on phone/tablet

---

## Current Focus
**Phase 4: Reports** - P&L, Balance Sheet, Cash Flow, Tax Summary

## Quick Wins Queue
1. ~~Org settings page~~ ✅
2. ~~Email invoice sending~~ ✅
3. ~~Payment recording~~ ✅
4. ~~User profile page~~ ✅
5. ~~Recurring invoices~~ ✅
6. ~~Invoice templates~~ ✅
7. ~~Banking module~~ ✅ (manual transactions, categorization, reconciliation)
8. ~~Canadian Payroll~~ ✅ (CPP/EI, pay runs, T4)
9. ~~ROE export~~ ✅
10. P&L Report
11. Balance Sheet
12. Cash Flow Report
13. Plaid integration (auto-import from banks)

---

## Progress Log

### Feb 17, 2026
- ✅ Banking module COMPLETE (service, hooks, UI)
  - Bank accounts CRUD
  - Manual transactions (deposits/payments)
  - Transaction categorization
  - Reconciliation workflow
  - Summary stats (inflow/outflow)
- ✅ ROE (Record of Employment) COMPLETE
  - Generate ROE from payroll data
  - All CRA reason codes supported
  - Insurable earnings by pay period
  - Employee/employer info blocks
  - Draft → Submitted workflow
- ✅ Employees table migration (SIN, tax info, compensation)
- ✅ Email domain verified (ontyx.ca via Resend)
- ✅ PDF invoice layout fixed (logo alignment)
- ✅ Invoice edit fixed (column name mismatches)
- ✅ Domain live at ontyx.ca

### Feb 16, 2026
- ✅ Fixed demo mode (organizationId='demo' check)
- ✅ PDF invoice generation working
- ✅ Invoice creation flow complete
- ✅ Contacts CRUD working
- ✅ Organization settings page complete (Company, Billing, Alerts, Account tabs)
- ✅ Email invoice sending (Resend API integration)
- ✅ User profile page with avatar, name, password change
- ✅ Recurring invoices with full CRUD UI
- ✅ Toast notifications (replaced primitive alerts)
- ✅ Database migration for recurring_invoices table
- ✅ Removed demo mode entirely (3,465 lines)
- ✅ Schema audit - aligned all services with actual DB columns
- ✅ Auth loading flash fixed (event-driven auth)
- ✅ Pay runs, pay stubs, T4 generation
