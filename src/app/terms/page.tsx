"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Shield, AlertTriangle, Scale, Mail } from "lucide-react"

export default function TermsPage() {
  const lastUpdated = "February 18, 2026"

  const sections = [
    { id: "acceptance", title: "Acceptance of Terms", icon: FileText },
    { id: "services", title: "Description of Services", icon: Shield },
    { id: "account", title: "Account Terms", icon: Shield },
    { id: "payment", title: "Payment Terms", icon: Scale },
    { id: "usage", title: "Acceptable Use", icon: AlertTriangle },
    { id: "data", title: "Data & Privacy", icon: Shield },
    { id: "intellectual", title: "Intellectual Property", icon: FileText },
    { id: "liability", title: "Limitation of Liability", icon: AlertTriangle },
    { id: "termination", title: "Termination", icon: AlertTriangle },
    { id: "changes", title: "Changes to Terms", icon: FileText },
    { id: "contact", title: "Contact Us", icon: Mail },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <span className="text-2xl">🍁</span> Ontyx
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
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

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents - Sticky Sidebar */}
            <Card className="lg:col-span-1 h-fit lg:sticky lg:top-8">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-sm">Contents</h3>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground py-1 transition-colors"
                    >
                      {section.title}
                    </a>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Content */}
            <div className="lg:col-span-3 prose prose-neutral dark:prose-invert max-w-none">
              <p className="lead text-lg text-muted-foreground">
                Welcome to Ontyx. By using our services, you agree to these terms. 
                Please read them carefully.
              </p>

              <section id="acceptance" className="scroll-mt-8">
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By accessing or using Ontyx ("Service"), you agree to be bound by these 
                  Terms of Service ("Terms"). If you disagree with any part of the terms, 
                  you may not access the Service.
                </p>
                <p>
                  These Terms apply to all visitors, users, and others who access or use 
                  the Service. By using Ontyx, you represent that you are at least 18 years 
                  old and have the legal capacity to enter into these Terms.
                </p>
              </section>

              <section id="services" className="scroll-mt-8">
                <h2>2. Description of Services</h2>
                <p>
                  Ontyx provides cloud-based business management software designed for 
                  Canadian small and medium businesses. Our services include but are not 
                  limited to:
                </p>
                <ul>
                  <li>Invoicing and billing management</li>
                  <li>Expense tracking and reporting</li>
                  <li>Inventory management</li>
                  <li>Customer relationship management (CRM)</li>
                  <li>Canadian tax compliance tools (GST/HST/PST)</li>
                  <li>Financial reporting and analytics</li>
                </ul>
                <p>
                  We reserve the right to modify, suspend, or discontinue any part of the 
                  Service at any time with reasonable notice.
                </p>
              </section>

              <section id="account" className="scroll-mt-8">
                <h2>3. Account Terms</h2>
                <h3>Registration</h3>
                <p>
                  To use Ontyx, you must create an account by providing accurate, complete, 
                  and current information. You are responsible for maintaining the security 
                  of your account credentials.
                </p>
                <h3>Account Security</h3>
                <p>
                  You are responsible for all activities that occur under your account. 
                  You must immediately notify us of any unauthorized use of your account 
                  or any other breach of security.
                </p>
                <h3>Business Information</h3>
                <p>
                  You agree to provide accurate business information, including your 
                  business name, address, and tax registration numbers as required for 
                  Canadian tax compliance features.
                </p>
              </section>

              <section id="payment" className="scroll-mt-8">
                <h2>4. Payment Terms</h2>
                <h3>Subscription Plans</h3>
                <p>
                  Ontyx offers various subscription plans including a free Starter tier 
                  and paid plans with additional features. Pricing is displayed in 
                  Canadian dollars (CAD) unless otherwise specified.
                </p>
                <h3>Billing</h3>
                <p>
                  Paid subscriptions are billed in advance on a monthly or annual basis. 
                  All fees are non-refundable except as required by law or as explicitly 
                  stated in these Terms.
                </p>
                <h3>Taxes</h3>
                <p>
                  All fees are exclusive of applicable taxes (GST/HST/PST). You are 
                  responsible for paying all taxes associated with your use of the Service.
                </p>
                <h3>Changes to Pricing</h3>
                <p>
                  We may change our pricing with 30 days' notice. Price changes will 
                  take effect at the start of the next billing cycle.
                </p>
              </section>

              <section id="usage" className="scroll-mt-8">
                <h2>5. Acceptable Use</h2>
                <p>You agree not to use Ontyx to:</p>
                <ul>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Transmit malicious code, viruses, or harmful data</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Use the Service for fraudulent purposes</li>
                  <li>Store or transmit illegal content</li>
                  <li>Resell or redistribute the Service without authorization</li>
                </ul>
                <p>
                  We reserve the right to suspend or terminate accounts that violate 
                  these acceptable use policies.
                </p>
              </section>

              <section id="data" className="scroll-mt-8">
                <h2>6. Data & Privacy</h2>
                <h3>Your Data</h3>
                <p>
                  You retain all rights to the data you upload to Ontyx ("Your Data"). 
                  You grant us a limited license to use Your Data solely to provide 
                  the Service to you.
                </p>
                <h3>Data Location</h3>
                <p>
                  Your Data is stored on servers located in Canada. We comply with 
                  Canadian privacy laws including PIPEDA (Personal Information Protection 
                  and Electronic Documents Act).
                </p>
                <h3>Privacy Policy</h3>
                <p>
                  Our collection and use of personal information is governed by our{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  , which is incorporated into these Terms by reference.
                </p>
                <h3>Data Export</h3>
                <p>
                  You may export Your Data at any time using our export features. 
                  Upon account termination, you will have 30 days to export Your Data 
                  before it is deleted.
                </p>
              </section>

              <section id="intellectual" className="scroll-mt-8">
                <h2>7. Intellectual Property</h2>
                <h3>Our Property</h3>
                <p>
                  Ontyx and its original content, features, and functionality are owned 
                  by Ontyx and are protected by international copyright, trademark, 
                  patent, trade secret, and other intellectual property laws.
                </p>
                <h3>Your Content</h3>
                <p>
                  You retain ownership of all content you create using the Service, 
                  including invoices, reports, and other business documents.
                </p>
                <h3>Feedback</h3>
                <p>
                  Any feedback, suggestions, or ideas you provide about the Service 
                  may be used by us without any obligation to you.
                </p>
              </section>

              <section id="liability" className="scroll-mt-8">
                <h2>8. Limitation of Liability</h2>
                <h3>Disclaimer</h3>
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES 
                  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
                  IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, 
                  OR NON-INFRINGEMENT.
                </p>
                <h3>Limitation</h3>
                <p>
                  IN NO EVENT SHALL ONTYX BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF 
                  PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                </p>
                <h3>Maximum Liability</h3>
                <p>
                  Our total liability for any claims under these Terms shall not exceed 
                  the amount you paid us in the 12 months prior to the claim.
                </p>
              </section>

              <section id="termination" className="scroll-mt-8">
                <h2>9. Termination</h2>
                <h3>By You</h3>
                <p>
                  You may terminate your account at any time through your account settings 
                  or by contacting us. Termination will take effect at the end of your 
                  current billing period.
                </p>
                <h3>By Us</h3>
                <p>
                  We may terminate or suspend your account immediately, without prior 
                  notice, for conduct that we believe violates these Terms or is harmful 
                  to other users, us, or third parties.
                </p>
                <h3>Effect of Termination</h3>
                <p>
                  Upon termination, your right to use the Service will immediately cease. 
                  You will have 30 days to export Your Data before it is permanently deleted.
                </p>
              </section>

              <section id="changes" className="scroll-mt-8">
                <h2>10. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will provide 
                  notice of any material changes by posting the new Terms on this page 
                  and updating the "Last updated" date.
                </p>
                <p>
                  Your continued use of the Service after any changes indicates your 
                  acceptance of the new Terms. If you do not agree to the new terms, 
                  please stop using the Service.
                </p>
              </section>

              <section id="contact" className="scroll-mt-8">
                <h2>11. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us:
                </p>
                <ul>
                  <li>Email: <a href="mailto:legal@ontyx.ca" className="text-primary">legal@ontyx.ca</a></li>
                  <li>Address: Toronto, Ontario, Canada</li>
                </ul>
                <p>
                  For general inquiries, visit our{" "}
                  <Link href="/contact" className="text-primary hover:underline">
                    Contact page
                  </Link>
                  .
                </p>
              </section>

              <hr className="my-8" />

              <p className="text-sm text-muted-foreground">
                By using Ontyx, you acknowledge that you have read, understood, and 
                agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-4 mb-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
          <p>© {new Date().getFullYear()} Ontyx. Built with 🍁 in Canada.</p>
        </div>
      </footer>
    </div>
  )
}
