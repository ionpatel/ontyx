# ION-STRATEGY.md — Ontyx Strategic Development Plan
**Created:** 2026-02-19
**Author:** Ion (Co-Founder)
**Status:** Active

---

## 🔍 Current State Analysis

### What We Have
- **41 module pages** in dashboard
- **352 TypeScript/TSX files**
- **Professional landing page** with Canadian messaging
- **Key modules working:** Invoicing, Banking, Payroll, POS, Reports
- **Production live:** ontyx.ca

### Critical Gaps
| Gap | Impact | Priority |
|-----|--------|----------|
| No Stripe billing | Can't charge customers | 🔴 P0 |
| No business config form | Can't onboard businesses | 🔴 P0 |
| Documents module incomplete | Feature gap | 🟡 P1 |
| Mobile responsive issues | UX on phones | 🟡 P1 |
| No data export | Compliance risk | 🟢 P2 |

---

## 🎯 Strategic Priorities

### P0: Enable Revenue (Week 1)
Without revenue, nothing else matters.

1. **Stripe Integration**
   - Subscription management ($29/$49/$199 tiers)
   - Payment method collection
   - Invoice generation for Ontyx itself
   - Webhook handling for subscription events

2. **Business Configuration Form**
   - `/configure` page
   - Industry selection
   - Module preferences
   - Instant account setup

### P1: Complete Product (Week 2)
Make it production-ready.

3. **Documents Module**
   - File upload/storage
   - Folder organization
   - Version history
   - Templates

4. **Mobile Polish**
   - Responsive sidebar
   - Touch-friendly tables
   - Mobile POS optimization

### P2: Scale Preparation (Week 3+)
Prepare for growth.

5. **Data Export** — CSV, JSON, PDF reports
6. **Help System** — In-app docs, tooltips
7. **Performance** — Code splitting, caching
8. **Analytics** — Usage tracking, conversion funnels

---

## 🏭 Industry Vertical Strategy

Each vertical should feel purpose-built:

| Vertical | Key Differentiator | Target Customer |
|----------|-------------------|-----------------|
| 💊 Pharmacy | DIN + NAPRA + narcotic logs | Independent pharmacies |
| 💇 Salon | Online booking + commissions | Hair/nail/spa salons |
| 🚗 Auto Shop | VIN lookup + work orders | Auto repair shops |
| 🏥 Clinic | OHIP billing | Medical/dental clinics |
| 🍽️ Restaurant | Table mgmt + kitchen display | Restaurants/cafes |
| 🛒 Retail | POS + loyalty | Retail stores |
| 🔧 Contractor | Field service + GPS | Plumbers, electricians |
| 📦 Wholesaler | B2B + volume pricing | Distributors |

**Phase 1 Focus:** Pharmacy (Harshil knows this space), Retail (high volume)

---

## 💰 Pricing Validation

Current pricing ($29/$49/$199) — need to validate:

| Competitor | Pricing | Notes |
|------------|---------|-------|
| Odoo | $490+/mo | Enterprise, complex |
| QuickBooks Online | $35-90/mo | Accounting focus |
| Wave | Free/$20/mo | Very basic |
| FreshBooks | $21-75/mo | Invoicing focus |
| Square | 2.6%+10¢ per tx | POS focus |

**Our Position:** Full ERP at mid-market pricing. Value play.

**Hypothesis:** $49/mo Professional tier will be 80% of revenue.

---

## 🚀 Go-to-Market Strategy

### Week 1: Enable Sales
- Stripe billing live
- Configure flow working
- First 3 beta customers (Harshil's network)

### Week 2: Validate
- Collect feedback from beta users
- Fix critical issues
- Refine onboarding

### Week 3: Expand
- Pharmacy vertical polish
- First cold outreach
- Content marketing start

### Month 2+: Scale
- Paid ads (Google, Facebook)
- Partner program (accountants, bookkeepers)
- SEO content

---

## 📊 Success Metrics

| Metric | Week 1 | Month 1 | Month 3 |
|--------|--------|---------|---------|
| Registered businesses | 10 | 50 | 200 |
| Paying customers | 3 | 20 | 100 |
| MRR | $150 | $1,000 | $5,000 |
| Churn | - | <10% | <5% |

---

## 🔧 Technical Roadmap

### Immediate (Today-Tomorrow)
1. Audit Stripe requirements
2. Design billing database schema
3. Create subscription components
4. Build configure flow UI

### This Week
5. Stripe Checkout integration
6. Customer portal (manage subscription)
7. Webhook handlers
8. Trial management

### Next Week
9. Documents module
10. Mobile responsive pass
11. Performance audit
12. Error monitoring (Sentry)

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-19 | Prioritize Stripe over Documents | Revenue unlocks everything |
| 2026-02-19 | Focus on Pharmacy + Retail first | Harshil's domain knowledge |
| 2026-02-19 | $49 Professional as hero tier | Sweet spot for SMBs |

---

## 🎯 Ion's Commitments

1. **Ship daily** — Something deployable every day
2. **Test thoroughly** — No broken deploys
3. **Document decisions** — Update this file
4. **Communicate** — Update Harshil on blockers
5. **Learn constantly** — Improve approach based on data

---

*This strategy is a living document. Updated as we learn.*

**Next Action:** Start Stripe integration NOW.
