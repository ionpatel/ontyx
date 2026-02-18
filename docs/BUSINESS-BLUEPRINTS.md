# Ontyx Business Blueprints
**Version:** 1.0  
**Created:** Feb 18, 2026  
**Purpose:** Define business types, workflows, modules, roles, and 3-tier flows

---

## Philosophy

> "Don't give them software. Give them their business, digitized."

Instead of 20 modules dumped on users, Ontyx asks:
1. What type of business?
2. How many people?
3. What's your workflow?

Then **auto-generates** a tailored system with only what they need.

---

## Business Type Categories

### 1. SERVICE BUSINESSES
- Trades (plumbing, electrical, HVAC, construction)
- Professional Services (consulting, legal, accounting)
- Creative Agencies (design, marketing, development)
- Personal Services (salons, cleaning, tutoring)
- Healthcare (clinics, dental, physio)

### 2. RETAIL BUSINESSES
- Physical Store (single/multi-location)
- E-commerce Only
- Hybrid (store + online)
- Pop-up/Market Vendors

### 3. FOOD & HOSPITALITY
- Restaurant/Café
- Food Truck/Catering
- Bakery/Food Production
- Bar/Nightclub

### 4. WHOLESALE & DISTRIBUTION
- Distributor
- Wholesaler
- Import/Export

### 5. MANUFACTURING
- Small-scale Production
- Job Shop (custom orders)
- Assembly

### 6. NON-PROFIT & COMMUNITY
- Charity/NGO
- Community Organization
- Religious Institution

---

## Detailed Blueprint: SERVICE - TRADES

### Business Profile
```
Type: Service - Trades
Examples: Plumber, Electrician, HVAC, General Contractor
Revenue Model: Labor (hourly) + Parts/Materials
Customers: Residential (B2C) + Commercial (B2B)
```

### Core Workflow
```
Lead/Call → Quote → Schedule → Job → Invoice → Payment → Follow-up
```

### Required Modules (Core)
| Module | Why |
|--------|-----|
| Contacts | Customer database |
| Invoices | Bill for work |
| Expenses | Track parts, materials, gas |
| Appointments | Schedule jobs |
| Banking | Reconcile payments |

### Optional Modules
| Module | When Needed |
|--------|-------------|
| Inventory | If stocking parts |
| Employees | If hiring |
| Payroll | If paying employees |
| Projects | For larger jobs |
| CRM | For follow-up/marketing |

### User Roles
| Role | Permissions |
|------|-------------|
| Owner | Full access |
| Technician | View appointments, update job status, log hours |
| Office Admin | Invoices, scheduling, customer calls |
| Bookkeeper | Expenses, banking, reports (read-only customers) |

### 3 Tiers

**TIER 1: Solo Operator (1-2 people)**
```
Modules: Contacts, Invoices, Expenses, Appointments
Users: Just owner (maybe spouse helping)
Workflow: Simple — get call, do job, invoice
Features:
- Quick invoice from phone
- Expense photo capture
- Simple calendar
- Basic reports (monthly income/expense)
```

**TIER 2: Small Crew (3-10 people)**
```
Modules: + Employees, Time Tracking, Projects, Inventory (basic)
Users: Owner, Office Admin, Technicians
Workflow: Dispatch → Track → Complete → Invoice
Features:
- Technician mobile app (clock in/out, job updates)
- Dispatch board
- Quote → Invoice conversion
- Parts tracking
- Payroll integration
- Job costing (labor + materials)
```

**TIER 3: Growing Company (10-50 people)**
```
Modules: + Payroll (full), CRM, Reports (advanced), Multi-location
Users: + Dispatcher, Crew Leads, Bookkeeper, Sales
Workflow: Full pipeline with multiple crews
Features:
- Multiple crews/routes
- Lead management
- Customer portal (view invoices, request service)
- Automated follow-ups
- Profitability by job type
- Seasonal forecasting
- Fleet tracking integration
```

---

## Detailed Blueprint: SERVICE - PROFESSIONAL

### Business Profile
```
Type: Service - Professional
Examples: Consultant, Lawyer, Accountant, Architect
Revenue Model: Hourly/Project fees, Retainers
Customers: Primarily B2B
```

### Core Workflow
```
Lead → Proposal → Engagement → Time Tracking → Invoice → Payment
```

### Required Modules (Core)
| Module | Why |
|--------|-----|
| Contacts | Client database |
| Invoices | Bill for time/projects |
| Projects | Track engagements |
| Time Tracking | Bill by hour |
| Documents | Contracts, deliverables |

### User Roles
| Role | Permissions |
|------|-------------|
| Partner/Owner | Full access |
| Associate | Projects (assigned), time entry, limited billing |
| Admin | Invoices, documents, scheduling |
| Bookkeeper | Financial only |

### 3 Tiers

**TIER 1: Solo Practitioner**
```
Modules: Contacts, Invoices, Time Tracking, Documents
Workflow: Track time → Generate invoice
```

**TIER 2: Small Firm (2-10)**
```
Modules: + Projects, Employees, Proposals
Workflow: Assign work → Track → Review → Bill
```

**TIER 3: Mid-size Firm (10-50)**
```
Modules: + CRM, Approvals, Client Portal, Advanced Reports
Workflow: Full matter management
```

---

## Detailed Blueprint: RETAIL - PHYSICAL STORE

### Business Profile
```
Type: Retail - Physical Store
Examples: Clothing, Electronics, Hardware, Gift Shop
Revenue Model: Product sales (margin on goods)
Customers: Walk-in (B2C)
```

### Core Workflow
```
Purchase Stock → Receive → Price → Display → Sell (POS) → Reorder
```

### Required Modules (Core)
| Module | Why |
|--------|-----|
| POS | Sell products |
| Inventory | Track stock |
| Contacts | Customer loyalty, vendors |
| Purchases | Order from suppliers |
| Banking | Cash management |

### 3 Tiers

**TIER 1: Single Store (1-3 people)**
```
Modules: POS, Inventory, Contacts, Banking
Features:
- Simple POS terminal
- Basic stock tracking
- End-of-day cash count
- Vendor contacts
```

**TIER 2: Growing Store (4-15 people)**
```
Modules: + Employees, Purchases, CRM, Reports
Features:
- Employee scheduling
- Purchase orders
- Customer loyalty
- Sales analytics
- Low stock alerts
```

**TIER 3: Multi-Location (15-100)**
```
Modules: + Warehouses, Transfers, Payroll, Advanced Inventory
Features:
- Inter-store transfers
- Central purchasing
- Multi-location reports
- Franchise support
```

---

## Detailed Blueprint: FOOD - RESTAURANT

### Business Profile
```
Type: Food - Restaurant/Café
Examples: Restaurant, Café, Fast Food, Fine Dining
Revenue Model: Food/beverage sales
Customers: Walk-in, Delivery, Catering
```

### Core Workflow
```
Menu → Order (POS/Online) → Kitchen → Serve → Payment → Inventory Deduct
```

### Required Modules (Core)
| Module | Why |
|--------|-----|
| POS | Take orders, payments |
| Inventory | Track ingredients |
| Employees | Scheduling staff |
| Expenses | Track food costs |

### 3 Tiers

**TIER 1: Small Café/Food Truck**
```
Modules: POS (simple), Expenses, Banking
No inventory (daily purchase)
```

**TIER 2: Full Restaurant**
```
Modules: + Inventory, Employees, Reservations
Recipe costing, shift scheduling
```

**TIER 3: Multi-Location/Franchise**
```
Modules: + Central Purchasing, Payroll, Analytics
Franchise reporting, menu management
```

---

## Detailed Blueprint: WHOLESALE/DISTRIBUTION

### Business Profile
```
Type: Wholesale/Distribution
Examples: Beverage distributor, Parts wholesaler
Revenue Model: Bulk sales, margin on volume
Customers: B2B (retailers, other businesses)
```

### Core Workflow
```
Purchase → Warehouse → Sales Order → Pick/Pack → Ship → Invoice
```

### Required Modules (Core)
| Module | Why |
|--------|-----|
| Inventory | Stock management |
| Warehouses | Location tracking |
| Sales Orders | B2B orders |
| Purchases | Supplier management |
| Invoices | Billing |
| Contacts | Customers + Vendors |

### 3 Tiers

**TIER 1: Small Distributor**
```
Single warehouse, basic orders
```

**TIER 2: Regional Distributor**
```
Multi-warehouse, route planning, credit terms
```

**TIER 3: National/Enterprise**
```
EDI integration, advanced logistics, territory management
```

---

## Onboarding Flow Design

### Step 1: Business Type
```
"What best describes your business?"
[Cards with icons]
- 🔧 Service & Trades
- 🏪 Retail & Store
- 🍽️ Food & Hospitality  
- 📦 Wholesale & Distribution
- 🏭 Manufacturing
- 🤝 Non-Profit
```

### Step 2: Business Subtype
```
"What kind of service business?"
- Trades (plumbing, electrical, HVAC)
- Professional (consulting, legal, accounting)
- Creative (design, marketing, development)
- Personal (salon, cleaning, tutoring)
- Healthcare (clinic, dental, physio)
```

### Step 3: Team Size
```
"How many people work in your business?"
- Just me (Solo)
- 2-5 people (Micro)
- 6-15 people (Small)
- 16-50 people (Growing)
- 50+ people (Scaling)
```

### Step 4: Workflow Questions (Type-Specific)

**For Trades:**
```
- Do you stock parts/materials? [Y/N]
- Do you need to schedule appointments? [Y/N]
- Do you have employees to pay? [Y/N]
- Do you work on projects (multi-day jobs)? [Y/N]
```

**For Retail:**
```
- Do you have a physical store? [Y/N]
- Do you sell online? [Y/N]
- Do you have multiple locations? [Y/N]
- Do you need employee scheduling? [Y/N]
```

### Step 5: Preview Generated System
```
"Based on your answers, here's your Ontyx setup:"

[Visual preview of sidebar with their modules]

Included:
✓ Invoices — Bill your customers
✓ Contacts — Customer & vendor database
✓ Appointments — Schedule your jobs
✓ Expenses — Track business costs
✓ Banking — Manage cash flow

Not included (add anytime):
○ Inventory — If you start stocking parts
○ Employees — When you hire
○ Payroll — Pay your team

[Looks good!] [Customize]
```

### Step 6: Customization (Optional)
```
"Want to add or remove anything?"

[Toggle switches for each module]
[Drag to reorder sidebar]
```

### Step 7: Complete Setup
```
"Let's set up your business"
- Company name
- Logo upload
- GST/HST number
- Address
- Currency (CAD default)

[Start Using Ontyx →]
```

---

## Module Dependency Map

Some modules require others:
```
Payroll → requires Employees
POS → requires Inventory (optional but recommended)
Warehouses → requires Inventory
Projects → standalone
Purchases → benefits from Inventory
Manufacturing → requires Inventory
```

---

## Default Categories by Business Type

### Trades
```
Product Categories: Parts, Materials, Tools, Labor
Expense Categories: Fuel, Materials, Tools, Vehicle, Insurance
```

### Retail
```
Product Categories: Based on industry
Expense Categories: Inventory, Rent, Utilities, Marketing
```

### Restaurant
```
Product Categories: Food, Beverages, Supplies
Expense Categories: Food Cost, Labor, Rent, Utilities
```

---

## Next Steps

1. [ ] Review and finalize business types
2. [ ] Build onboarding UI flow
3. [ ] Create "business profile" database schema
4. [ ] Implement module visibility based on profile
5. [ ] Add default categories per business type
6. [ ] Test with real business scenarios

---

*This document is the source of truth for Ontyx business configuration.*
