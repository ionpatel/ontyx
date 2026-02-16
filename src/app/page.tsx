"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  FileText, Receipt, Building2, BookOpen, BarChart3, Package,
  ShoppingCart, Users, Briefcase, Factory, FolderKanban, Wallet,
  UserCircle, ArrowRight, Check, Star, Zap, Shield, Globe,
  ChevronRight, Sparkles, TrendingUp, Clock, Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
}

/* ─── data ─── */
const modules = [
  { name: "Invoices", desc: "Create, send & track invoices", icon: FileText, color: "from-indigo-500 to-blue-500" },
  { name: "Bills", desc: "Manage vendor bills & payments", icon: Receipt, color: "from-rose-500 to-pink-500" },
  { name: "Banking", desc: "Bank feeds & reconciliation", icon: Building2, color: "from-emerald-500 to-teal-500" },
  { name: "Accounting", desc: "Chart of accounts & ledgers", icon: BookOpen, color: "from-violet-500 to-purple-500" },
  { name: "Reports", desc: "P&L, balance sheet & more", icon: BarChart3, color: "from-amber-500 to-orange-500" },
  { name: "Inventory", desc: "Products, stock & alerts", icon: Package, color: "from-cyan-500 to-sky-500" },
  { name: "Sales", desc: "Orders, quotes & fulfillment", icon: ShoppingCart, color: "from-green-500 to-emerald-500" },
  { name: "CRM", desc: "Pipeline, deals & leads", icon: Briefcase, color: "from-fuchsia-500 to-pink-500" },
  { name: "Contacts", desc: "Customers & vendors directory", icon: Users, color: "from-blue-500 to-indigo-500" },
  { name: "Manufacturing", desc: "Work orders & quality control", icon: Factory, color: "from-orange-500 to-red-500" },
  { name: "Projects", desc: "Tasks, time & milestones", icon: FolderKanban, color: "from-teal-500 to-cyan-500" },
  { name: "Payroll", desc: "Employee compensation & taxes", icon: Wallet, color: "from-pink-500 to-rose-500" },
  { name: "Employees", desc: "HR, org chart & directory", icon: UserCircle, color: "from-purple-500 to-violet-500" },
]

const pricing = [
  {
    name: "Starter",
    price: "$29",
    desc: "Perfect for small businesses getting started",
    features: ["Up to 5 users", "Invoicing & billing", "Basic inventory", "Banking & reconciliation", "Standard reports", "Email support"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "$49",
    desc: "For growing teams that need more power",
    features: ["Up to 25 users", "Everything in Starter", "CRM & pipeline", "Manufacturing", "Projects & time tracking", "Advanced analytics", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    desc: "Full suite for large organizations",
    features: ["Unlimited users", "Everything in Professional", "Custom workflows", "API access", "Multi-currency", "Audit trail", "Dedicated account manager", "SSO & advanced security"],
    cta: "Contact Sales",
    popular: false,
  },
]

const testimonials = [
  {
    quote: "Ontyx replaced 4 separate tools for us. Our accounting, inventory, and CRM finally talk to each other.",
    author: "Sarah Chen",
    role: "CFO, TechVista Inc.",
    avatar: "SC",
  },
  {
    quote: "The manufacturing module alone saved us 15 hours a week. The work order tracking is incredibly intuitive.",
    author: "Marcus Rodriguez",
    role: "VP Operations, BuildRight Co.",
    avatar: "MR",
  },
  {
    quote: "We went from spreadsheet chaos to a single source of truth. Our team actually enjoys using it.",
    author: "Emily Watson",
    role: "Founder, GreenLeaf Commerce",
    avatar: "EW",
  },
]

const stats = [
  { value: "10K+", label: "Businesses" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "Rating" },
  { value: "<2min", label: "Setup" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white overflow-hidden">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0f1a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-black text-white text-lg">O</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Ontyx
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-white/70 hover:text-white hover:bg-white/5">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
              <Link href="/register">
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[128px] animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/15 blur-[128px] animate-pulse animation-delay-500" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative max-w-5xl mx-auto text-center px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-6 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-4 py-1.5 text-sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Now in Open Beta — Free 14-day trial
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]"
            >
              <span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                Business,
              </span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-400 bg-clip-text text-transparent animate-gradient-x">
                Unified.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-6 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed"
            >
              One platform for accounting, inventory, CRM, manufacturing,
              payroll, and everything in between. Built for teams that refuse
              to settle for fragmented tools.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" asChild className="h-13 px-8 text-base bg-indigo-500 hover:bg-indigo-600 shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02]">
                <Link href="/register">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-13 px-8 text-base border-white/10 text-white/80 hover:bg-white/5 hover:text-white">
                <Link href="/dashboard">
                  Live Demo <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Social proof strip */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-16 flex items-center justify-center gap-8 md:gap-12"
            >
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-xs md:text-sm text-white/40 mt-0.5">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge className="mb-4 bg-teal-500/10 text-teal-300 border-teal-500/20">
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                13 Modules, One Platform
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-bold tracking-tight">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
                run your business
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-4 text-white/50 max-w-2xl mx-auto text-lg">
              From invoicing your first customer to managing a 200-person factory floor — Ontyx scales with you.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {modules.map((m, i) => (
              <motion.div key={m.name} variants={fadeUp} custom={i}>
                <Card className="bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="pt-6 pb-5">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <m.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-white mb-1">{m.name}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{m.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Highlight Strip ─── */}
      <section className="py-16 border-y border-white/5 bg-gradient-to-r from-indigo-500/5 via-transparent to-teal-500/5">
        <div className="max-w-7xl mx-auto px-6 grid gap-8 md:grid-cols-3">
          {[
            { icon: Shield, title: "Bank-Grade Security", desc: "SOC 2 compliant with end-to-end encryption and role-based access control." },
            { icon: Globe, title: "Multi-Currency", desc: "Handle transactions in 150+ currencies with real-time exchange rates." },
            { icon: TrendingUp, title: "Real-Time Analytics", desc: "Live dashboards that update as your business moves. No waiting for reports." },
          ].map((item) => (
            <div key={item.title} className="flex gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <item.icon className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold tracking-tight">
              Simple, transparent pricing
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-white/50 text-lg">
              No hidden fees. No surprises. Cancel anytime.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
            className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto"
          >
            {pricing.map((plan, i) => (
              <motion.div key={plan.name} variants={fadeUp} custom={i}>
                <Card className={`relative h-full ${
                  plan.popular
                    ? "bg-gradient-to-b from-indigo-500/10 to-transparent border-indigo-500/30 shadow-xl shadow-indigo-500/10"
                    : "bg-white/[0.03] border-white/[0.06]"
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-500/30">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-8 pb-6">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-white/40">/mo</span>
                    </div>
                    <p className="mt-2 text-sm text-white/40">{plan.desc}</p>

                    <ul className="mt-8 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                          <Check className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      asChild
                      className={`w-full mt-8 ${
                        plan.popular
                          ? "bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/25"
                          : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                      }`}
                    >
                      <Link href="/register">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-24 md:py-32 bg-gradient-to-b from-transparent via-indigo-500/[0.03] to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold tracking-tight">
              Loved by teams everywhere
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-white/50 text-lg">
              Join thousands of businesses already on Ontyx
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
                <Card className="bg-white/[0.03] border-white/[0.06] h-full">
                  <CardContent className="pt-6 pb-5">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-white/70 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center text-sm font-bold text-white">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{t.author}</div>
                        <div className="text-xs text-white/40">{t.role}</div>
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
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready to unify your business?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-4 text-white/50 text-lg max-w-xl mx-auto">
              Start your 14-day free trial today. No credit card required.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-8 flex items-center justify-center gap-4">
              <Button size="lg" asChild className="h-13 px-8 text-base bg-indigo-500 hover:bg-indigo-600 shadow-xl shadow-indigo-500/25">
                <Link href="/register">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-5">
            {/* Brand */}
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center">
                  <span className="font-black text-white text-sm">O</span>
                </div>
                <span className="text-lg font-bold text-white">Ontyx</span>
              </Link>
              <p className="text-sm text-white/40 max-w-xs leading-relaxed">
                The complete ERP platform for modern businesses. Accounting, inventory, CRM, manufacturing, and more — all in one place.
              </p>
            </div>

            {/* Links */}
            {[
              { title: "Product", links: [["Features", "#features"], ["Pricing", "#pricing"], ["Integrations", "#"], ["Changelog", "#"]] },
              { title: "Company", links: [["About", "#"], ["Careers", "#"], ["Blog", "#"], ["Contact", "#"]] },
              { title: "Legal", links: [["Privacy", "#"], ["Terms", "#"], ["Security", "#"]] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Ontyx Technologies Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs text-white/30">
              Made with <Heart className="h-3 w-3 mx-0.5 text-red-400 fill-red-400" /> for modern businesses
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
