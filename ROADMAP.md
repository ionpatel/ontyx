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
- [ ] **Organization Settings Page**
  - Company name, logo upload
  - Address, phone, email
  - GST/HST number for invoices
  - Default currency, timezone
- [ ] **Google OAuth** - complete backend setup
- [ ] **Email verification** - working flow
- [ ] **User profile page** - name, avatar, preferences

### Week 2: Complete Invoice Flow
- [ ] **Email invoices** - send PDF via email
- [ ] **Payment recording** - mark partial/full payments
- [ ] **Invoice templates** - customizable branding
- [ ] **Recurring invoices** - auto-generate monthly

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
**Organization Settings Page** - needed so invoices show real company info

## Quick Wins Queue
1. Org settings page (company info for invoices)
2. Email invoice sending
3. Payment recording on invoices
4. User profile page

---

## Progress Log

### Feb 16, 2026
- ✅ Fixed demo mode (organizationId='demo' check)
- ✅ PDF invoice generation working
- ✅ Invoice creation flow complete
- ✅ Contacts CRUD working
- 🔄 Starting org settings page
