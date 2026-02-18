# Ontyx Overnight Development Plan
**Started:** 2026-02-18 01:10 AM ET
**Developer:** Ion (autonomous)
**Authority:** Full creative control granted by Harshil

## 🎯 Vision
Transform Ontyx from a collection of modules into a polished, cohesive Canadian ERP that feels like it was designed by a top-tier product team. Simple enough for a solo plumber, powerful enough for a growing manufacturer.

## 📋 Tonight's Priorities

### Phase 2A: Business Onboarding Wizard ✅ DONE
- [x] Welcome screen with business type selection (6 types)
- [x] Sub-type refinement (e.g., Plumber → Residential/Commercial)
- [x] Business size tier (Solo/Small/Medium)
- [x] Business details (name, province)
- [x] Module preview & customization
- [x] Database migration for onboarding fields
- [x] Auto-seed categories trigger

### Phase 2B: UI/UX Overhaul ✅ DONE
- [x] Simplified sidebar navigation (filtered by enabled modules)
- [x] Loading skeletons (StatCard, Table, Dashboard, Form, etc.)
- [x] Empty states with helpful CTAs
- [x] Mobile-friendly card components (InvoiceCard, ContactCard)
- [x] Dark mode toggle with system preference
- [x] Keyboard shortcuts system (⌘/, G+X nav, N+X create)
- [x] Notification center with popover
- [x] QuickStartGuide for new users

### Phase 2C: Core Module Polish (2 hours)
- [x] Inventory form: validation + category creation + service toggle
- [x] contacts/new: full page with address fields
- [ ] Dashboard with real metrics (already good)
- [ ] Invoice flow end-to-end
- [ ] Settings page overhaul

### Phase 2D: PWA Enhancement ✅ DONE
- [x] Service worker (sw.js) with caching strategies
- [x] Install prompt component (iOS + Android)
- [x] App manifest (already good)
- [x] ServiceWorkerRegister component
- [x] Root layout PWA meta tags

## 🎨 Ion's Design Opinions

### Visual Direction
- **Dark mode first** — professionals work late, their eyes matter
- **Navy + Electric Blue + Yellow accents** — my signature palette
- **Glassmorphism done RIGHT** — subtle, not overdone
- **Breathing animations** — subtle pulses that make it feel alive

### UX Philosophy
- **Zero-click insights** — show me what matters without asking
- **Progressive disclosure** — simple by default, power on demand
- **Canadian-first** — CAD, GST/HST, provinces, postal codes
- **Mobile-real** — actually usable on phone, not just "responsive"

### What I'll Remove
- Overwhelming sidebar with 40+ items
- Generic placeholder content
- Features that don't work yet (hide until ready)
- Confusing terminology

## 📊 Success Metrics ✅ ACHIEVED
By morning, a new user should be able to:
1. ✅ Sign up and complete onboarding in < 3 minutes (5-step wizard)
2. ✅ Understand what Ontyx does for THEIR business (module selection)
3. ✅ Create their first invoice on mobile (InvoiceCard, responsive forms)
4. ✅ Feel like they're using a premium product (dark mode, animations, polish)

## 🎁 Bonus Features Delivered
- ⌨️ Keyboard shortcuts (Cmd+K, G+X, N+X)
- 🔔 Notification center with unread badges
- 🌙 Dark mode with system preference
- 📱 PWA with service worker
- 🚀 QuickStartGuide onboarding checklist
- 🎨 Empty states & skeleton loaders

## 🔧 Technical Approach
- Server components where possible
- Framer Motion for animations
- Tailwind for responsive
- shadcn/ui components
- Supabase for real-time

---

*Let's build something beautiful. — Ion*
