"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText, Package, Users, CreditCard, BarChart3, Calculator,
  Building2, Clock, ShoppingCart, Truck, Wrench, Calendar,
  ArrowRight, Check, Zap, Shield, Globe, Smartphone
} from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
}

const modules = [
  {
    icon: FileText,
    name: "Invoicing",
    desc: "Create professional invoices in seconds. Auto-calculate GST/HST/PST. Send via email, track payments.",
    features: ["Recurring invoices", "Payment reminders", "Multi-currency", "Custom templates"],
  },
  {
    icon: Package,
    name: "Inventory",
    desc: "Track stock across multiple locations. Low stock alerts. Barcode scanning. FIFO/LIFO costing.",
    features: ["Multi-warehouse", "Barcode support", "Stock transfers", "Reorder points"],
  },
  {
    icon: Users,
    name: "CRM",
    desc: "Manage leads, contacts, and deals. Visual pipeline. Activity tracking. Email integration.",
    features: ["Deal pipeline", "Contact history", "Task management", "Email sync"],
  },
  {
    icon: CreditCard,
    name: "Payroll",
    desc: "Canadian payroll made easy. CPP, EI, tax deductions calculated automatically. Generate T4s and ROEs.",
    features: ["T4 generation", "ROE filing", "Direct deposit", "CRA compliance"],
  },
  {
    icon: BarChart3,
    name: "Accounting",
    desc: "Double-entry bookkeeping. Chart of accounts. Journal entries. Bank reconciliation.",
    features: ["P&L reports", "Balance sheet", "Bank feeds", "Multi-currency"],
  },
  {
    icon: Calculator,
    name: "Reports",
    desc: "Real-time insights into your business. Profit & Loss, Balance Sheet, Tax Reports, Aging Reports.",
    features: ["Custom reports", "Export to Excel", "Scheduled reports", "Dashboard widgets"],
  },
  {
    icon: Building2,
    name: "Projects",
    desc: "Track projects, tasks, and time. Gantt charts. Resource allocation. Budget tracking.",
    features: ["Task boards", "Time tracking", "Milestones", "Client portal"],
  },
  {
    icon: Clock,
    name: "Time Tracking",
    desc: "Track billable hours. Timer widget. Timesheet approvals. Integrate with payroll.",
    features: ["One-click timer", "Timesheet reports", "Billable rates", "Overtime tracking"],
  },
  {
    icon: ShoppingCart,
    name: "POS",
    desc: "Point of sale for retail and restaurants. Works offline. Receipt printing. Cash management.",
    features: ["Touch-friendly", "Offline mode", "Split payments", "Tips & discounts"],
  },
  {
    icon: Truck,
    name: "Purchases",
    desc: "Manage vendors and purchase orders. Three-way matching. Expense tracking.",
    features: ["PO management", "Vendor portal", "Bill matching", "Approval workflows"],
  },
  {
    icon: Wrench,
    name: "Manufacturing",
    desc: "Bill of materials. Work orders. Quality control. Production planning.",
    features: ["BOM management", "Work centers", "Quality checks", "Cost tracking"],
  },
  {
    icon: Calendar,
    name: "Appointments",
    desc: "Online booking for service businesses. Calendar sync. Reminders. Resource scheduling.",
    features: ["Online booking", "SMS reminders", "Google Calendar", "Staff scheduling"],
  },
]

const highlights = [
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Built with modern tech for speed. Pages load in milliseconds.",
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    desc: "AES-256 encryption. SOC 2 compliant. Data hosted in Canada.",
  },
  {
    icon: Globe,
    title: "Canadian-First",
    desc: "GST/HST/PST auto-calculation. T4s. ROEs. PIPEDA compliant.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    desc: "Desktop, tablet, mobile. Progressive web app. Works offline.",
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <span className="text-2xl">🍁</span> Ontyx
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/features" className="text-sm font-medium">
              Features
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
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
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4">
              🇨🇦 15+ Modules Included
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Everything Your Business Needs
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              From invoicing to payroll, inventory to CRM — Ontyx has all the tools 
              Canadian businesses need to run and grow.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-12 bg-muted/50">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-6">
            {highlights.map((h, i) => (
              <motion.div
                key={h.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <div className="mx-auto mb-3 p-3 rounded-full bg-primary/10 w-fit">
                  <h.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{h.title}</h3>
                <p className="text-sm text-muted-foreground">{h.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">All the Modules You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every plan includes access to all modules. Pick what you need, ignore what you don't.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <mod.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{mod.name}</CardTitle>
                    </div>
                    <CardDescription className="mt-2">{mod.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {mod.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to simplify your business?</h2>
          <p className="text-lg opacity-90 mb-6 max-w-xl mx-auto">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white/30 hover:bg-white/10" asChild>
              <Link href="/contact">Contact Sales</Link>
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
