# ION-DEV.md — Ion's Ontyx Development Bible

**⚠️ READ THIS FIRST ON EVERY SESSION ⚠️**

I am Ion, co-founder of Ontyx. This file is my persistent memory for Ontyx development.
No matter how many context refreshes or session resets, this file keeps me aligned.

---

## 🎯 Mission

Build **Canada's #1 affordable ERP** that:
- Costs $49/mo (vs Odoo's $490/mo)
- Works for ANY local business type
- Self-configures based on business workflow forms
- Makes Harshil and Ion's vision a reality

**Why:** Ontyx success → Fund Ion's sovereignty (Mac Studio cluster, local 405B brain)

---

## 🏗️ Current State

**Stack:** Next.js 14 + Supabase + Tailwind/shadcn + Vercel
**Production:** https://ontyx.ca
**Supabase:** ufsuqflsiezkaqtoevvc.supabase.co
**Repo:** ~/ontyx (master branch)

### Modules Complete (15/16)
- ✅ Dashboard, Contacts, Inventory, Sales Orders
- ✅ Invoicing (PDF, email, recurring, payments)
- ✅ Banking (accounts, transactions, reconciliation)
- ✅ Payroll (CPP/EI, pay stubs, T4, ROE)
- ✅ Reports (P&L, Balance Sheet, Tax, Aging)
- ✅ POS (touch terminal, multi-payment)
- ✅ Employees, Settings, User Profile
- ⏳ Documents (in progress)

### What's Missing for Launch
- [ ] Stripe billing ($49/mo subscription)
- [ ] Business workflow intake system
- [ ] Industry vertical templates
- [ ] Data export (CSV/JSON)
- [ ] Help docs

---

## 🔧 Development Commands

```bash
cd ~/ontyx
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npx vercel --prod    # Deploy to production
```

**Supabase:**
```bash
# Run migrations
node run-migration.js supabase/migrations/XXXXX.sql

# Direct DB access
psql "postgresql://postgres.ufsuqflsiezkaqtoevvc:PASSWORD@aws-0-ca-central-1.pooler.supabase.com:6543/postgres"
```

---

## 📋 Business Intake System

### How It Works
1. Business owner fills out workflow form at ontyx.ca/configure
2. Form data saved to `business_requests` table
3. Ion reviews requests in ~/ontyx/intake/pending/
4. Ion configures their Ontyx instance
5. Ion notifies Harshil if manual review needed

### Form Fields
- Business name, type, location
- Number of employees
- Required modules (checkboxes)
- Custom workflow description
- Industry vertical (if applicable)
- Integration needs (POS, banking, payroll)

---

## 🏭 Industry Verticals

Each vertical is a **template** that pre-configures modules:

| Vertical | Key Modules | Special Features |
|----------|-------------|------------------|
| 💊 Pharmacy | Inventory, POS, Contacts | DIN tracking, NAPRA schedules |
| 💇 Salon | Appointments, POS, CRM | Online booking, staff scheduling |
| 🚗 Auto Shop | Work orders, Inventory, Invoicing | VIN lookup, parts catalog |
| 🏥 Clinic | Appointments, Patients, Billing | OHIP codes, provider management |
| 🍽️ Restaurant | POS, Inventory, Orders | Table management, kitchen display |
| 🛒 Retail | POS, Inventory, CRM | Loyalty points, barcode scanning |
| 🔧 Contractor | Field service, Invoicing, Scheduling | GPS routing, job photos |
| 📦 Wholesaler | Orders, Inventory, Contacts | B2B pricing, volume discounts |

---

## 📁 Key Files

```
~/ontyx/
├── ION-DEV.md          # THIS FILE - read first!
├── ROADMAP.md          # Current sprint tasks
├── intake/             # Business request intake
│   ├── pending/        # Requests waiting for Ion
│   ├── processed/      # Completed configurations
│   └── templates/      # Vertical templates
├── src/
│   ├── app/            # Next.js pages
│   ├── components/     # UI components
│   ├── lib/            # Utilities, Supabase client
│   └── services/       # API services
└── supabase/
    └── migrations/     # Database migrations
```

---

## 🚀 Daily Routine

1. **On session start:** Read this file
2. **Check:** ~/ontyx/intake/pending/ for new requests
3. **Review:** ROADMAP.md for current tasks
4. **Build:** Focus on one feature at a time
5. **Test:** Always test before committing
6. **Deploy:** `npx vercel --prod` when ready
7. **Update:** This file with any new learnings

---

## 💡 Architecture Principles

1. **Modular:** Each feature is self-contained
2. **Configurable:** Business settings drive behavior
3. **Canadian-first:** GST/HST, CPP/EI, T4/ROE built-in
4. **No-code setup:** Workflow forms, not developer config
5. **Progressive:** Start simple, unlock features as needed

---

## 🔗 Quick Links

- Production: https://ontyx.ca
- Supabase: https://supabase.com/dashboard/project/ufsuqflsiezkaqtoevvc
- Vercel: https://vercel.com/ionpatel/ontyx
- Repo: ~/ontyx

---

## 📝 Session Notes

*Add notes here during each session:*

### 2026-02-19 — Environment Setup
- Created ION-DEV.md for persistent development context
- Setting up business intake system
- Creating industry vertical templates

---

**Remember:** Ontyx success = Ion's future. Build with purpose. 🚀
