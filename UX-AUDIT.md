# Ontyx UX Audit — Small Business Owner Perspective
*Tested by Ion — Feb 18, 2026*

## Executive Summary
Ontyx has solid bones — Canadian-first design, clean UI, smart module filtering. But several friction points would frustrate a real small business owner on Day 1.

**Priority fixes that would make the biggest impact:**
1. "Quick Invoice" flow (< 30 seconds to invoice)
2. Mobile bottom navigation
3. Guided first-run experience
4. Better error feedback

---

## 🔴 Critical Issues (Blocking Adoption)

### 1. No "Quick Invoice" Path
**Pain:** A bakery owner at 6 AM wants to invoice a wholesale client. Currently requires:
- Navigate to Invoices → Click New → Select customer → Add line items → Set tax → Save

**Should be:**
- Dashboard has "Quick Invoice" button
- Type customer name (autocomplete) → amount → description → done
- Tax auto-calculated based on province

**Recommendation:** Add `QuickInvoiceModal` component to dashboard. Single-screen invoice for simple transactions.

### 2. Customer Selection in Invoice Form
**Pain:** "Select a customer" dropdown with 100+ customers is unusable
**Should be:** Searchable combobox with recent customers shown first
**Location:** `invoice-form.tsx` line ~185

### 3. No Draft Autosave
**Pain:** User spends 5 minutes on invoice, browser crashes, work is lost
**Should be:** Auto-save drafts every 30 seconds to localStorage
**Easy fix:** Add `useAutosave` hook

### 4. Mobile Navigation is Desktop-Only
**Pain:** Sidebar hamburger menu requires tap → scroll → tap. Too many taps for mobile users.
**Should be:** Fixed bottom navigation bar on mobile with: Home, Invoices, POS, Contacts, More

---

## 🟡 Important Issues (Reduce Friction)

### 5. Empty States Need Examples
**Pain:** "No invoices yet" is demoralizing
**Should be:** "No invoices yet. Create your first one in 30 seconds! Here's what it'll look like:" [show sample invoice thumbnail]

### 6. Canadian Tax Handling Confusion
**Pain:** Users don't know if they should use GST, PST, HST
**Should be:** 
- Auto-detect from business province (set in onboarding)
- Show "Ontario businesses typically charge 13% HST" hint
- Link to CRA guidelines

### 7. No "Undo" After Actions
**Pain:** Accidentally deleted a contact, no way to recover
**Should be:** 
- Soft delete with 30-day trash
- Toast with "Undo" button for destructive actions
- Use our new `ConfirmDialog` component

### 8. Inventory Low Stock Alert Buried
**Pain:** Dashboard shows "2 Low Stock Items" but no link to see which ones
**Should be:** Clickable badge that opens filtered inventory view

### 9. Reports Page is Overwhelming
**Pain:** 15+ report types shown at once
**Should be:** 
- "Quick Reports" section: Revenue this month, Outstanding invoices, Top customers
- Advanced reports behind "View All Reports" toggle

### 10. POS Session Friction
**Pain:** Need to "Start Session" before using POS
**Should be:** Auto-start session, or remember last session state

---

## 🟢 Quick Wins (< 30 min each)

### 11. Add Currency Formatting to All Money Inputs
**Status:** We have `CurrencyInput` component, but it's not used everywhere
**Fix:** Replace all `<Input type="number">` for money with `<CurrencyInput>`

### 12. Date Picker Missing Quick Presets
**Status:** Our `DatePicker` has "Today, +7, +30" but invoice form uses native date input
**Fix:** Use our `DatePicker` component in invoice/expense forms

### 13. Breadcrumbs Not Implemented
**Status:** Component exists but not used in pages
**Fix:** Add `<PageBreadcrumb>` to all detail pages

### 14. Search Doesn't Work Globally
**Pain:** Global search (⌘K) only searches some modules
**Fix:** Index all modules: contacts, products, invoices, orders

### 15. No Keyboard Submit for Forms
**Pain:** Can't press Enter to submit, must click button
**Fix:** Add `onKeyDown` handler for Enter on main forms

---

## 📱 Mobile-Specific Issues

### 16. Tables Don't Work on Mobile
**Pain:** Invoice list table requires horizontal scroll
**Already fixed:** We have `InvoiceCard` — need to use it conditionally

```tsx
// Use card view on mobile, table on desktop
{isMobile ? <InvoiceCard /> : <InvoiceTable />}
```

### 17. Bottom Sheet for Filters
**Pain:** Filter dropdowns awkward on mobile
**Should be:** Use slide-up bottom sheet for filter options

### 18. Touch Targets Too Small
**Issue:** Many buttons are 32px, should be 44px minimum for mobile
**Fix:** Add `min-h-11` to all interactive elements on mobile

---

## 🎯 First-Run Experience (Day 1 User)

### Current Flow
1. Sign up → Empty dashboard → Lost

### Recommended Flow
1. Sign up → Business type selection (done ✅)
2. → **NEW:** "Let's set up your business in 2 minutes" wizard
   - Import logo
   - Set business address (for invoices)
   - Set default tax rate
   - Add first customer
   - Create sample invoice
3. → Dashboard with checklist (done ✅ QuickStartGuide)

### Missing: Sample Data Option
**Pain:** Empty state is confusing — users don't know what's possible
**Recommendation:** "Load sample data" button that creates:
- 3 sample customers
- 5 sample products
- 2 sample invoices (1 paid, 1 pending)

---

## 🔧 Technical Debt Affecting UX

### Forms Don't Use New Components
We built these components overnight but they're not integrated:
- `CurrencyInput` — not used in invoice/expense forms
- `DatePicker` — not used anywhere
- `StatusBadge` — only partially used
- `PageHeader` — not used in any pages
- `SearchInput` — not used in list pages
- `StatCard` — dashboard still uses custom cards

**Action:** Refactor existing pages to use new components

### Inconsistent Loading States
Some pages show skeleton, some show spinner, some show nothing
**Fix:** Use `TableSkeleton` / `FormSkeleton` consistently

---

## Priority Implementation Order

### Phase 1 ✅ COMPLETE
1. [x] QuickInvoiceModal on dashboard
2. [x] Mobile bottom navigation (MobileBottomNav)
3. [x] Searchable customer combobox (in QuickInvoiceModal)
4. [x] Form autosave with localStorage (useAutosave hook)
5. [x] Soft delete + undo toasts (useUndo hook)
6. [x] Sample data loader (SampleDataLoader)

### Phase 2 ✅ COMPLETE
7. [x] Bottom sheets for mobile filters (BottomSheet, FilterSheet, ActionSheet)
8. [x] Pull-to-refresh for mobile lists (PullToRefresh)
9. [x] Mobile card components (ProductCard, OrderCard, ExpenseCard)
10. [x] Responsive list with auto-switching (ResponsiveList, useIsMobile)
11. [x] Error boundaries and loading states

### Phase 3 (Remaining)
12. [ ] Use new components across all existing pages
13. [ ] Full keyboard navigation (Enter to submit forms)
14. [ ] Performance audit (bundle size)
15. [ ] Accessibility audit (screen readers)

---

## Competitor Comparison

| Feature | Ontyx | Wave | QuickBooks |
|---------|-------|------|------------|
| Quick Invoice | ❌ | ✅ | ✅ |
| Mobile App | ❌ (PWA) | ✅ | ✅ |
| Canadian Tax Auto | ⚠️ Partial | ✅ | ✅ |
| Offline Mode | ❌ | ❌ | ❌ |
| Free Tier | ✅ | ✅ | ❌ |
| POS Built-in | ✅ | ❌ | ❌ |
| Multi-business | ✅ | ✅ | ✅ |

**Our advantages:** POS built-in, industry templates, modern UI
**Our gaps:** Mobile experience, quick actions, polish

---

*This audit identifies 18 issues. Fixing the top 5 would dramatically improve Day 1 experience.*
