"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, X, Zap, Building2, Rocket, HelpCircle, ArrowRight } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
}

const plans = [
  {
    name: "Starter",
    icon: Zap,
    price: "$29",
    period: "/month",
    yearly: "$290/year (save $58)",
    desc: "For small businesses getting started",
    features: [
      { text: "Unlimited users", included: true },
      { text: "Invoicing & payments", included: true },
      { text: "Basic inventory (1 location)", included: true },
      { text: "Contacts management", included: true },
      { text: "GST/HST reports", included: true },
      { text: "Email support", included: true },
      { text: "Multi-warehouse", included: false },
      { text: "Payroll with T4s", included: false },
      { text: "API access", included: false },
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    icon: Building2,
    price: "$49",
    period: "/month",
    yearly: "$490/year (save $98)",
    desc: "For growing Canadian businesses",
    features: [
      { text: "Unlimited users", included: true },
      { text: "Invoicing & payments", included: true },
      { text: "Multi-warehouse inventory", included: true },
      { text: "Full accounting suite", included: true },
      { text: "CRM & sales pipeline", included: true },
      { text: "Payroll with T4s", included: true },
      { text: "Projects & time tracking", included: true },
      { text: "Priority support", included: true },
      { text: "API access", included: false },
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    icon: Rocket,
    price: "$199",
    period: "/month",
    yearly: "$1,990/year (save $398)",
    desc: "For large organizations",
    features: [
      { text: "Unlimited users", included: true },
      { text: "Everything in Professional", included: true },
      { text: "Website builder", included: true },
      { text: "POS system", included: true },
      { text: "AI insights & forecasting", included: true },
      { text: "Custom integrations", included: true },
      { text: "Full API access", included: true },
      { text: "White-label option", included: true },
      { text: "Dedicated support manager", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

const faqs = [
  {
    q: "Is there a free trial?",
    a: "Yes! All plans come with a 14-day free trial. No credit card required. You get full access to all features during the trial period.",
  },
  {
    q: "Can I change plans later?",
    a: "Absolutely. You can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at your next billing cycle.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, American Express), as well as direct bank transfers for annual Enterprise plans. All payments are processed securely through Stripe.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. We use bank-level encryption (AES-256) for all data at rest and in transit. Our infrastructure is hosted on AWS Canada (Montreal region) to ensure your data stays in Canada.",
  },
  {
    q: "Do you offer discounts for non-profits?",
    a: "Yes! Registered Canadian non-profits and charities receive 25% off any plan. Contact our sales team with your registration number to apply.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "You can export all your data at any time in CSV or JSON format. After cancellation, we retain your data for 30 days before permanent deletion, giving you time to reactivate if needed.",
  },
  {
    q: "Is GST/HST included in the price?",
    a: "Prices shown are before tax. Applicable Canadian taxes (GST/HST/QST) will be added based on your province at checkout.",
  },
]

const comparisonFeatures = [
  { feature: "Users", starter: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
  { feature: "Invoices/month", starter: "100", pro: "Unlimited", enterprise: "Unlimited" },
  { feature: "Inventory locations", starter: "1", pro: "5", enterprise: "Unlimited" },
  { feature: "Bank connections", starter: "1", pro: "5", enterprise: "Unlimited" },
  { feature: "File storage", starter: "5 GB", pro: "50 GB", enterprise: "500 GB" },
  { feature: "API calls/month", starter: "—", pro: "10,000", enterprise: "Unlimited" },
  { feature: "Support response", starter: "48 hours", pro: "24 hours", enterprise: "4 hours" },
  { feature: "Data retention", starter: "2 years", pro: "7 years", enterprise: "Unlimited" },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <span className="text-2xl">🍁</span> Ontyx
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium">
              Pricing
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 text-center">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4">
              🇨🇦 Built for Canadian Businesses
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
              90% cheaper than Odoo. No hidden fees. Cancel anytime.
            </p>
            <p className="text-sm text-muted-foreground">
              All plans include a <strong>14-day free trial</strong> — no credit card required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i}
              >
                <Card className={`relative h-full flex flex-col ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-2 p-2 rounded-lg bg-muted w-fit">
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                      <p className="text-xs text-muted-foreground mt-1">{plan.yearly}</p>
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f.text} className="flex items-center gap-2 text-sm">
                          {f.included ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                          )}
                          <span className={f.included ? "" : "text-muted-foreground/50"}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link href={plan.name === "Enterprise" ? "/contact" : "/register"}>
                        {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include: 🇨🇦 Canadian tax compliance • Bank connections • Email support • Free updates
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-8">Compare Plans</h2>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 font-medium">Starter</th>
                  <th className="text-center py-3 px-4 font-medium bg-primary/5">Professional</th>
                  <th className="text-center py-3 px-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.feature} className="border-b">
                    <td className="py-3 px-4 text-muted-foreground">{row.feature}</td>
                    <td className="text-center py-3 px-4">{row.starter}</td>
                    <td className="text-center py-3 px-4 bg-primary/5 font-medium">{row.pro}</td>
                    <td className="text-center py-3 px-4">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <div className="text-center mb-8">
            <HelpCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to streamline your business?</h2>
          <p className="text-lg opacity-90 mb-6">
            Join 10,000+ Canadian businesses using Ontyx
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white/30 hover:bg-white/10" asChild>
              <Link href="/#demo">Watch Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Ontyx. Built with 🍁 in Canada.</p>
        </div>
      </footer>
    </div>
  )
}
