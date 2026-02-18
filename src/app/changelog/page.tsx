"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Bug, Zap, Shield } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4 },
  }),
}

const changelog = [
  {
    version: "1.0.0",
    date: "February 2026",
    title: "Official Launch 🚀",
    badge: "major",
    changes: [
      { type: "feature", text: "15 core modules: Invoicing, Inventory, CRM, Payroll, Accounting, and more" },
      { type: "feature", text: "Canadian tax compliance: GST/HST/PST auto-calculation" },
      { type: "feature", text: "Payroll with T4 and ROE generation" },
      { type: "feature", text: "Point of Sale system with offline support" },
      { type: "feature", text: "Multi-warehouse inventory management" },
      { type: "feature", text: "Bank connections via Plaid" },
      { type: "feature", text: "Tiered pricing: Starter, Professional, Enterprise" },
    ],
  },
  {
    version: "0.9.0",
    date: "January 2026",
    title: "Beta Release",
    badge: "beta",
    changes: [
      { type: "feature", text: "Business onboarding wizard with smart module recommendations" },
      { type: "feature", text: "Dashboard with key metrics and quick actions" },
      { type: "improvement", text: "Mobile-responsive design for all pages" },
      { type: "improvement", text: "Dark mode support" },
      { type: "fix", text: "Fixed invoice PDF generation on Safari" },
    ],
  },
  {
    version: "0.8.0",
    date: "December 2025",
    title: "Alpha Testing",
    badge: "alpha",
    changes: [
      { type: "feature", text: "Initial module implementations" },
      { type: "feature", text: "Supabase authentication and database" },
      { type: "feature", text: "Basic reporting (P&L, Balance Sheet)" },
      { type: "security", text: "SOC 2 compliance preparation" },
    ],
  },
]

const typeIcons = {
  feature: Sparkles,
  improvement: Zap,
  fix: Bug,
  security: Shield,
}

const typeColors = {
  feature: "text-green-600 dark:text-green-400",
  improvement: "text-blue-600 dark:text-blue-400",
  fix: "text-orange-600 dark:text-orange-400",
  security: "text-purple-600 dark:text-purple-400",
}

const badgeColors = {
  major: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  beta: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  alpha: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
}

export default function ChangelogPage() {
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
              📋 Product Updates
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Changelog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              New features, improvements, and fixes. We ship updates regularly 
              to make Ontyx better for Canadian businesses.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Changelog */}
      <section className="pb-16">
        <div className="container max-w-3xl">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border ml-3 md:ml-4" />
            
            {changelog.map((release, i) => (
              <motion.div
                key={release.version}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative pl-10 md:pl-12 pb-12"
              >
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 w-7 h-7 md:w-9 md:h-9 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-primary" />
                </div>
                
                {/* Content */}
                <div className="bg-card rounded-lg border p-6">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Badge variant="outline" className="font-mono">
                      v{release.version}
                    </Badge>
                    <Badge className={badgeColors[release.badge as keyof typeof badgeColors]}>
                      {release.badge.charAt(0).toUpperCase() + release.badge.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{release.date}</span>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-4">{release.title}</h2>
                  
                  <ul className="space-y-2">
                    {release.changes.map((change, j) => {
                      const Icon = typeIcons[change.type as keyof typeof typeIcons]
                      const color = typeColors[change.type as keyof typeof typeColors]
                      return (
                        <li key={j} className="flex items-start gap-3">
                          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${color}`} />
                          <span className="text-muted-foreground">{change.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6">
            Get notified when we ship new features. No spam, just product updates.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 px-4 py-2 rounded-md border bg-background"
            />
            <Button>Subscribe</Button>
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
