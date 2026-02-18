# Ontyx QA Audit — Ion's Plumbing & HVAC Ltd
**Date:** Feb 18, 2026  
**Tester:** Ion (as small Canadian trades business owner)  
**Goal:** Test every module as a real user would

---

## Test Scenario
I'm running "Ion's Plumbing & HVAC Ltd" in Toronto, ON.
- 3 employees (me + 2 technicians)
- Service-based business (hourly + parts)
- Need to invoice customers, track inventory, run payroll

---

## 1. SETUP & ONBOARDING

### Organization Settings
- [ ] Company name saves correctly
- [ ] Logo upload works
- [ ] Address fields complete (Canadian format)
- [ ] GST/HST number field exists and saves
- [ ] Default currency (CAD) works
- [ ] Timezone (America/Toronto) works

### User Profile
- [ ] Avatar upload works
- [ ] Name/phone saves
- [ ] Password change works

**Issues Found:**
(none yet)

---

## 2. CONTACTS MODULE

### Add Customer
- [ ] Create new customer works
- [ ] All fields save (name, email, phone, address)
- [ ] Customer appears in list
- [ ] Can edit customer
- [ ] Can delete customer

### Add Vendor
- [ ] Create vendor works
- [ ] Vendor type distinction clear

**Issues Found:**
(none yet)

---

## 3. INVENTORY MODULE

### Add Product
- [ ] Create product works
- [ ] SKU field works
- [ ] Price/cost fields work
- [ ] Quantity tracking works
- [ ] Low stock threshold works

### Add Service
- [ ] Can add service (non-physical)
- [ ] Hourly rate works

**Issues Found:**
(none yet)

---

## 4. INVOICING FLOW

### Create Invoice
- [ ] Select customer works
- [ ] Add line items works
- [ ] Tax calculation correct (13% HST for Ontario)
- [ ] Subtotal/total correct
- [ ] Save draft works
- [ ] Send invoice works (email)
- [ ] PDF generates correctly
- [ ] PDF includes GST/HST number

### Payment Recording
- [ ] Mark partial payment
- [ ] Mark full payment
- [ ] Payment history visible

**Issues Found:**
(none yet)

---

## 5. POS MODULE

### Open Session
- [ ] Open session works
- [ ] Starting cash field works

### Make Sale
- [ ] Add product to cart
- [ ] Quantity adjustment works
- [ ] Payment methods work (cash, card)
- [ ] Receipt generates
- [ ] Transaction recorded

### Close Session
- [ ] Cash count works
- [ ] Session summary correct

**Issues Found:**
(none yet)

---

## 6. PAYROLL MODULE

### Add Employee
- [ ] Employee profile creates
- [ ] SIN field works (masked?)
- [ ] Pay rate saves
- [ ] Tax province correct

### Run Payroll
- [ ] Pay run creates
- [ ] CPP calculation correct
- [ ] EI calculation correct
- [ ] Income tax calculation correct
- [ ] Pay stub generates

### Year-End
- [ ] T4 generates
- [ ] ROE generates

**Issues Found:**
(none yet)

---

## 7. REPORTS MODULE

### Financial Reports
- [ ] P&L generates
- [ ] Balance Sheet generates
- [ ] Tax Summary generates
- [ ] Accounts Aging generates

**Issues Found:**
(none yet)

---

## 8. OTHER MODULES

### Expenses
- [ ] Add expense works
- [ ] Receipt upload works
- [ ] Categorization works

### Banking
- [ ] Add bank account works
- [ ] Manual transaction works
- [ ] Reconciliation works

### Sales Orders
- [ ] Create order works
- [ ] Convert to invoice works

### Appointments
- [ ] Create appointment works
- [ ] Calendar view works

### Time Off
- [ ] Request time off works
- [ ] Approval flow works

### CRM
- [ ] Pipeline view works
- [ ] Lead tracking works

### Documents
- [ ] File upload works
- [ ] Organization works

**Issues Found:**
(none yet)

---

## SUMMARY

### 🔴 Critical Issues (Blockers)

**1. No Default Product Categories**
- **Location:** Inventory → Add Product → Category dropdown
- **Issue:** Dropdown is empty for new users
- **Impact:** Users CANNOT add products (category is required)
- **Fix:** Add default categories on org creation (General, Parts, Services, etc.)

**2. Silent Form Validation Failure**
- **Location:** Inventory → Add Product → Save
- **Issue:** Clicking "Save Product" with missing category does nothing
- **Impact:** User confusion, thinks system is broken
- **Fix:** Show validation errors ("Please select a category")

**3. /contacts/new Route Broken**
- **Location:** Direct URL `/contacts/new`
- **Issue:** Shows "Contact not found" instead of create form
- **Impact:** Dashboard quick-action "Contact" link may be broken
- **Fix:** Handle `/new` route properly in contacts page

### 🟡 Major Issues (Must Fix)

**4. No Service Item Type**
- **Location:** Inventory → Add Product
- **Issue:** Only physical products supported (has stock tracking)
- **Impact:** Service businesses can't add "Plumbing Service - 1hr" 
- **Fix:** Add "Product Type" toggle (Physical/Service) that hides stock fields

**5. Missing Address Fields in Contact**
- **Location:** Contacts → Add Contact modal
- **Issue:** No street address, postal code, notes fields
- **Impact:** Incomplete customer records for invoicing
- **Fix:** Add full address fields to contact form

### 🟢 Minor Issues (Nice to Fix)

**6. Province Dropdown Missing Territories**
- **Location:** Settings, Contacts
- **Issue:** Missing NWT, Yukon, Nunavut
- **Fix:** Add all Canadian territories

**7. Inventory Value Shows USD Symbol**
- **Location:** Inventory stats card
- **Issue:** Shows "$0.00" not "CA$0.00" (inconsistent)
- **Fix:** Use consistent CAD formatting

### ✅ What Works Well

1. **Settings page** - Clean UI, GST/HST field, timezone presets
2. **Contact creation** - Modal flow works, saves correctly
3. **Dashboard** - Stats update in real-time
4. **13% HST Ontario** - Pre-selected in tax dropdowns
5. **Search (Cmd+K)** - Present and functional
6. **Navigation** - Clean sidebar, all modules visible

### 📊 Test Coverage

| Module | Tested | Status |
|--------|--------|--------|
| Settings | ✅ | Working |
| Contacts | ✅ | Works (via list, not /new) |
| Inventory | ✅ | **BLOCKED** (no categories) |
| Invoices | ⏳ | Pending |
| POS | ⏳ | Pending |
| Payroll | ⏳ | Pending |
| Reports | ⏳ | Pending |
| Banking | ⏳ | Pending |
| Employees | ⏳ | Pending |

---

## Priority Fix Order

1. **CRITICAL:** Add default categories + show validation errors
2. **CRITICAL:** Fix /contacts/new route
3. **HIGH:** Add Service item type
4. **HIGH:** Complete contact address fields
5. **MEDIUM:** Add territories to province lists
6. **LOW:** Currency formatting consistency

---

*Audit by Ion | Feb 18, 2026 | Testing as "Ion's Plumbing & HVAC Ltd"*
