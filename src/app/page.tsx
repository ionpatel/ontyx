"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  FileText, Receipt, Building2, BookOpen, BarChart3, Package,
  ShoppingCart, Users, Briefcase, Factory, FolderKanban, Wallet,
  UserCircle, ArrowRight, Check, Star, Zap, Shield, Globe,
  ChevronRight, Sparkles, TrendingUp, Clock, Heart, Menu, X,
  MapPin, Phone, Mail, Leaf
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

/* ─── Animation Helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

/* ─── Data ─── */
const modules = [
  { name: "Invoicing", desc: "Professional invoices with GST/HST", icon: FileText, href: "/invoices" },
  { name: "Accounting", desc: "Chart of accounts & tax reports", icon: BookOpen, href: "/accounting" },
  { name: "Inventory", desc: "Multi-warehouse stock control", icon: Package, href: "/inventory" },
  { name: "Payroll", desc: "CPP, EI & T4 generation", icon: Wallet, href: "/payroll" },
  { name: "CRM", desc: "Pipeline & customer management", icon: Briefcase, href: "/crm" },
  { name: "POS", desc: "In-store sales & Interac", icon: ShoppingCart, href: "/pos" },
  { name: "Projects", desc: "Tasks, time & billing", icon: FolderKanban, href: "/projects" },
  { name: "Reports", desc: "P&L, balance sheet & more", icon: BarChart3, href: "/reports" },
]

const pricing = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    desc: "For small businesses getting started",
    features: [
      "Unlimited users",
      "Invoicing & payments",
      "Basic inventory (1 location)",
      "Contacts management",
      "GST/HST reports",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$49",
    period: "/month",
    desc: "For growing Canadian businesses",
    features: [
      "Everything in Starter",
      "Multi-warehouse inventory",
      "Full accounting suite",
      "CRM & sales pipeline",
      "Payroll with T4s",
      "Projects & time tracking",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    desc: "For large organizations",
    features: [
      "Everything in Professional",
      "Website builder",
      "POS system",
      "AI insights & forecasting",
      "Custom integrations",
      "API access",
      "White-label option",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

const testimonials = [
  {
    quote: "Finally, an ERP that understands Canadian tax. GST/HST reports that actually work!",
    author: "Sarah Chen",
    role: "Owner, Maple Leaf Pharmacy",
    location: "Toronto, ON",
    avatar: "SC",
  },
  {
    quote: "We switched from Odoo and saved over $50,000 per year. Same features, fraction of the cost.",
    author: "Marcus Rodriguez",
    role: "CFO, BuildRight Construction",
    location: "Vancouver, BC",
    avatar: "MR",
  },
  {
    quote: "The payroll module handles CPP, EI, and provincial taxes perfectly. T4s generated in seconds.",
    author: "Emily Watson",
    role: "HR Director, Northern Foods",
    location: "Calgary, AB",
    avatar: "EW",
  },
]

const stats = [
  { value: "10K+", label: "Canadian Businesses" },
  { value: "99.9%", label: "Uptime" },
  { value: "$2M+", label: "Processed Daily" },
  { value: "4.9★", label: "Rating" },
]

const canadianFeatures = [
  { icon: Receipt, title: "GST/HST/PST Ready", desc: "Automatic tax calculation for every province and territory" },
  { icon: Wallet, title: "Canadian Payroll", desc: "CPP, EI, provincial taxes, T4s, and ROE generation" },
  { icon: Building2, title: "Canadian Banks", desc: "Connect RBC, TD, BMO, Scotiabank, CIBC & more" },
  { icon: Shield, title: "PIPEDA Compliant", desc: "Your data stays in Canada, protected by Canadian privacy law" },
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image 
              src="/logo-original.jpg" 
              alt="Ontyx" 
              width={40} 
              height={40}
              className="rounded-lg"
            />
            <span className="text-xl font-bold tracking-tight text-text-primary">
              Ontyx
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-text-secondary hover:text-text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-text-secondary hover:text-text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="text-text-secondary hover:text-text-primary transition-colors">Testimonials</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-border bg-background px-4 py-4 space-y-4"
          >
            <a href="#features" className="block py-2 text-text-secondary">Features</a>
            <a href="#pricing" className="block py-2 text-text-secondary">Pricing</a>
            <a href="#testimonials" className="block py-2 text-text-secondary">Testimonials</a>
            <div className="pt-4 border-t border-border space-y-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light via-background to-background" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary-light px-4 py-1.5">
                <Leaf className="mr-1.5 h-3.5 w-3.5" />
                Built for Canadian Businesses
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              <span className="text-text-primary">Your Business.</span>
              <br />
              <span className="text-primary">One Platform.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
            >
              Invoicing, inventory, payroll, accounting, CRM — everything Canadian 
              businesses need. <span className="text-text-primary font-medium">90% cheaper than Odoo.</span>
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Button size="lg" asChild className="w-full sm:w-auto h-12 px-8 text-base shadow-maple-lg hover:shadow-maple-md transition-shadow">
                <Link href="/register">
                  Start 14-Day Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 px-8 text-base">
                <Link href="/dashboard">
                  View Live Demo <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.p 
              variants={fadeUp} 
              custom={4}
              className="mt-4 text-sm text-text-muted"
            >
              No credit card required • Setup in under 2 minutes
            </motion.p>

            {/* Stats */}
            <motion.div
              variants={fadeUp}
              custom={5}
              className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            >
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-text-primary">{s.value}</div>
                  <div className="text-sm text-text-muted mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Canadian Features Strip ─── */}
      <section className="py-12 bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {canadianFeatures.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{item.title}</h4>
                  <p className="text-sm text-text-secondary mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Modules ─── */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything You Need to Run Your Business
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-text-secondary max-w-2xl mx-auto text-lg">
              16 integrated modules. One login. Zero headaches.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {modules.map((m, i) => (
              <motion.div key={m.name} variants={fadeUp} custom={i}>
                <Link href={m.href}>
                  <Card hover className="h-full">
                    <CardContent className="pt-6 pb-5">
                      <div className="h-10 w-10 rounded-lg bg-primary-light flex items-center justify-center mb-4">
                        <m.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-text-primary mb-1">{m.name}</h3>
                      <p className="text-sm text-text-secondary">{m.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Explore All 16 Modules <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 md:py-28 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold tracking-tight">
              Simple, Transparent Pricing
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-text-secondary text-lg">
              Flat monthly fee. Unlimited users. No surprises.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto"
          >
            {pricing.map((plan, i) => (
              <motion.div key={plan.name} variants={fadeUp} custom={i}>
                <Card className={`relative h-full ${plan.popular ? "border-primary shadow-maple-lg" : ""}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-8 pb-6">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-text-muted">{plan.period}</span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{plan.desc}</p>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span className="text-text-secondary">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full mt-6"
                    >
                      <Link href="/register">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <p className="text-center text-sm text-text-muted mt-8">
            All plans include: 🇨🇦 Canadian tax compliance • Bank connections • Email support • Free updates
          </p>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold tracking-tight">
              Trusted by Canadian Businesses
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-text-secondary text-lg">
              From coast to coast, businesses choose Ontyx
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3"
          >
            {testimonials.map((t, i) => (
              <motion.div key={t.author} variants={fadeUp} custom={i}>
                <Card className="h-full">
                  <CardContent className="pt-6 pb-5">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-text-secondary leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{t.author}</div>
                        <div className="text-xs text-text-muted">{t.role}</div>
                        <div className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {t.location}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Simplify Your Business?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto">
              Join 10,000+ Canadian businesses already on Ontyx. Start your free trial today.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto h-12 px-8 text-base">
                <Link href="/register">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 px-8 text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link href="/contact">
                  Talk to Sales
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-12 md:py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-5">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <Image 
                  src="/logo-original.jpg" 
                  alt="Ontyx" 
                  width={32} 
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-lg font-bold">Ontyx</span>
              </Link>
              <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
                The complete business management platform for Canadian local businesses. 
                Built with 🇨🇦 in Canada.
              </p>
              <div className="mt-4 space-y-2 text-sm text-text-muted">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> hello@ontyx.ca
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> 1-800-ONTYX-CA
                </div>
              </div>
            </div>

            {/* Links */}
            {[
              { title: "Product", links: [["Features", "#features"], ["Pricing", "#pricing"], ["Integrations", "/integrations"], ["Changelog", "/changelog"]] },
              { title: "Company", links: [["About", "/about"], ["Careers", "/careers"], ["Blog", "/blog"], ["Contact", "/contact"]] },
              { title: "Legal", links: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Security", "/security"], ["PIPEDA", "/pipeda"]] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-text-muted">
              © {new Date().getFullYear()} Ontyx Technologies Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              Made with <Heart className="h-3 w-3 mx-0.5 text-primary fill-primary" /> in Canada 🍁
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
