# Ontyx Overnight Development Plan
**Started:** 2026-02-18 01:10 AM ET
**Developer:** Ion (autonomous)
**Authority:** Full creative control granted by Harshil

## 🎯 Vision
Transform Ontyx from a collection of modules into a polished, cohesive Canadian ERP that feels like it was designed by a top-tier product team. Simple enough for a solo plumber, powerful enough for a growing manufacturer.

## 📋 Tonight's Priorities

### Phase 2A: Business Onboarding Wizard (2-3 hours)
- [ ] Welcome screen with business type selection
- [ ] Sub-type refinement (e.g., Plumber → Residential/Commercial)
- [ ] Business size tier (Solo/Small/Corporate)
- [ ] Smart questions based on type
- [ ] Module preview & customization
- [ ] Database setup with defaults

### Phase 2B: UI/UX Overhaul (2-3 hours)
- [ ] Consistent design tokens (colors, spacing, shadows)
- [ ] Responsive navigation (mobile hamburger, tablet sidebar, desktop full)
- [ ] Card-based layouts that work on all screens
- [ ] Loading states and skeletons
- [ ] Empty states with helpful CTAs
- [ ] Micro-interactions (hover, focus, transitions)

### Phase 2C: Core Module Polish (2 hours)
- [ ] Dashboard with real metrics
- [ ] Invoice flow end-to-end
- [ ] Contact improvements
- [ ] Settings page overhaul

### Phase 2D: PWA Enhancement (1 hour)
- [ ] Service worker for offline
- [ ] Install prompt component
- [ ] App manifest polish
- [ ] Splash screen

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

## 📊 Success Metrics
By morning, a new user should be able to:
1. Sign up and complete onboarding in < 3 minutes
2. Understand what Ontyx does for THEIR business
3. Create their first invoice on mobile
4. Feel like they're using a premium product

## 🔧 Technical Approach
- Server components where possible
- Framer Motion for animations
- Tailwind for responsive
- shadcn/ui components
- Supabase for real-time

---

*Let's build something beautiful. — Ion*
