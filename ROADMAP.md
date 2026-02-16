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
- [ ] **Plaid integration** - connect Canadian banks
- [ ] **Bank transactions** - import & categorize
- [ ] **Payment methods** - track how customers pay
- [ ] **Bank reconciliation** - match transactions

### Week 4: Canadian Payroll
- [ ] **Employee profiles** - SIN, tax info, pay rate
- [ ] **Pay runs** - calculate CPP/EI deductions
- [ ] **Pay stubs** - generate PDF stubs
- [ ] **T4 generation** - year-end tax slips
- [ ] **ROE export** - Record of Employment

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
**Banking Integration** - connect Canadian banks via Plaid

## Quick Wins Queue
1. ~~Org settings page~~ ✅
2. ~~Email invoice sending~~ ✅
3. ~~Payment recording~~ ✅
4. ~~User profile page~~ ✅
5. ~~Recurring invoices~~ ✅
6. Invoice templates (branding)
7. Banking/Plaid integration
8. Canadian Payroll (CPP/EI)

---

## Progress Log

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
- 🔄 Building banking/Plaid integration
