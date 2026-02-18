"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ExternalLink } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4 },
  }),
}

const integrations = [
  {
    category: "Banking",
    items: [
      { name: "Plaid", desc: "Connect your Canadian bank accounts for automatic transaction import", status: "live" },
      { name: "Stripe", desc: "Accept credit card payments and manage subscriptions", status: "live" },
      { name: "Square", desc: "POS integration and payment processing", status: "coming" },
      { name: "PayPal", desc: "Accept PayPal payments on invoices", status: "coming" },
    ],
  },
  {
    category: "Accounting",
    items: [
      { name: "QuickBooks", desc: "Import/export data from QuickBooks Online", status: "live" },
      { name: "Xero", desc: "Sync contacts, invoices, and transactions", status: "coming" },
      { name: "Wave", desc: "Migrate your data from Wave Accounting", status: "coming" },
    ],
  },
  {
    category: "E-commerce",
    items: [
      { name: "Shopify", desc: "Sync orders, inventory, and customers", status: "live" },
      { name: "WooCommerce", desc: "Connect your WordPress store", status: "coming" },
      { name: "Amazon", desc: "Manage Amazon seller inventory and orders", status: "planned" },
    ],
  },
  {
    category: "Shipping",
    items: [
      { name: "Canada Post", desc: "Print shipping labels and track packages", status: "live" },
      { name: "Purolator", desc: "Commercial shipping integration", status: "coming" },
      { name: "UPS", desc: "Domestic and international shipping", status: "coming" },
      { name: "FedEx", desc: "Express and freight shipping", status: "planned" },
    ],
  },
  {
    category: "Productivity",
    items: [
      { name: "Google Workspace", desc: "Calendar sync, Gmail integration, Drive storage", status: "live" },
      { name: "Microsoft 365", desc: "Outlook calendar and email integration", status: "coming" },
      { name: "Slack", desc: "Get notifications and updates in Slack", status: "live" },
      { name: "Zapier", desc: "Connect to 5,000+ apps with automation", status: "live" },
    ],
  },
  {
    category: "Government",
    items: [
      { name: "CRA", desc: "File GST/HST returns and payroll remittances", status: "live" },
      { name: "Service Canada", desc: "Submit ROEs electronically", status: "live" },
      { name: "Revenu Québec", desc: "QST filing for Quebec businesses", status: "live" },
    ],
  },
]

const statusColors = {
  live: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  coming: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  planned: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
}

const statusLabels = {
  live: "Live",
  coming: "Coming Soon",
  planned: "Planned",
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <span className="text-2xl">🍁</span> Ontyx
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
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
              🔌 Connect Everything
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Integrations
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Connect Ontyx to the tools you already use. Banks, e-commerce, shipping, 
              and more — all working together seamlessly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Integrations by Category */}
      <section className="pb-16">
        <div className="container">
          {integrations.map((category, catIdx) => (
            <motion.div
              key={category.category}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={catIdx}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold mb-6">{category.category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.items.map((item, i) => (
                  <Card key={item.name} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <Badge variant="secondary" className={statusColors[item.status as keyof typeof statusColors]}>
                          {statusLabels[item.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{item.desc}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Build Your Own Integration</h2>
            <p className="text-muted-foreground mb-6">
              Need something custom? Our REST API gives you full access to your data. 
              Available on Professional and Enterprise plans.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/api-docs">
                  API Documentation <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register">
                  Get API Access <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to connect your tools?</h2>
          <p className="text-lg opacity-90 mb-6">
            Start your 14-day free trial and set up integrations in minutes.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Start Free Trial</Link>
          </Button>
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
