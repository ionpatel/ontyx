"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Eye, Database, Lock, Globe, Users, Mail, Settings } from "lucide-react"

export default function PrivacyPage() {
  const lastUpdated = "February 18, 2026"

  const sections = [
    { id: "overview", title: "Overview", icon: Shield },
    { id: "collection", title: "Information We Collect", icon: Database },
    { id: "use", title: "How We Use Information", icon: Settings },
    { id: "sharing", title: "Information Sharing", icon: Users },
    { id: "security", title: "Data Security", icon: Lock },
    { id: "retention", title: "Data Retention", icon: Database },
    { id: "rights", title: "Your Rights", icon: Eye },
    { id: "cookies", title: "Cookies & Tracking", icon: Globe },
    { id: "children", title: "Children's Privacy", icon: Users },
    { id: "international", title: "International Transfers", icon: Globe },
    { id: "changes", title: "Policy Changes", icon: Settings },
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
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">
                  Last updated: {lastUpdated}
                </p>
              </div>
            </div>
          </motion.div>

          {/* PIPEDA Notice */}
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Canadian Privacy Compliance</p>
                  <p className="text-sm text-muted-foreground">
                    Ontyx complies with PIPEDA (Personal Information Protection and Electronic 
                    Documents Act) and applicable provincial privacy legislation. Your data is 
                    stored in Canada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of Contents */}
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
                At Ontyx, we take your privacy seriously. This policy explains how we collect, 
                use, and protect your personal information.
              </p>

              <section id="overview" className="scroll-mt-8">
                <h2>1. Overview</h2>
                <p>
                  Ontyx ("we," "our," or "us") provides cloud-based business management software 
                  for Canadian businesses. This Privacy Policy describes how we collect, use, 
                  disclose, and safeguard your information when you use our service.
                </p>
                <p>
                  By using Ontyx, you consent to the data practices described in this policy. 
                  If you do not agree with the terms of this privacy policy, please do not 
                  access the service.
                </p>
              </section>

              <section id="collection" className="scroll-mt-8">
                <h2>2. Information We Collect</h2>
                
                <h3>Information You Provide</h3>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, password, phone number</li>
                  <li><strong>Business Information:</strong> Business name, address, industry, tax numbers (GST/HST)</li>
                  <li><strong>Financial Data:</strong> Invoices, expenses, inventory, customer records you create</li>
                  <li><strong>Payment Information:</strong> Billing address, payment method (processed by Stripe)</li>
                  <li><strong>Communications:</strong> Support requests, feedback, and correspondence</li>
                </ul>

                <h3>Information Collected Automatically</h3>
                <ul>
                  <li><strong>Usage Data:</strong> Features used, pages visited, actions taken</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                  <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                  <li><strong>Cookies:</strong> Session cookies, preference cookies (see Cookies section)</li>
                </ul>

                <h3>Information from Third Parties</h3>
                <ul>
                  <li><strong>OAuth Providers:</strong> If you sign in with Google, we receive your name and email</li>
                  <li><strong>Integrations:</strong> Data from connected services (banking, accounting software)</li>
                </ul>
              </section>

              <section id="use" className="scroll-mt-8">
                <h2>3. How We Use Your Information</h2>
                <p>We use collected information to:</p>
                <ul>
                  <li>Provide, maintain, and improve the Service</li>
                  <li>Process transactions and send related information</li>
                  <li>Send you technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze usage patterns and trends</li>
                  <li>Detect, investigate, and prevent fraudulent transactions</li>
                  <li>Personalize and improve your experience</li>
                  <li>Comply with legal obligations including tax reporting</li>
                </ul>

                <h3>Canadian Tax Compliance</h3>
                <p>
                  We use your business and transaction data to help you comply with Canadian 
                  tax requirements, including GST/HST/PST calculations and reporting. This 
                  data is processed only as necessary to provide these features.
                </p>
              </section>

              <section id="sharing" className="scroll-mt-8">
                <h2>4. Information Sharing</h2>
                <p>We do not sell your personal information. We may share information with:</p>

                <h3>Service Providers</h3>
                <ul>
                  <li><strong>Hosting:</strong> Supabase (database and authentication)</li>
                  <li><strong>Payments:</strong> Stripe (payment processing)</li>
                  <li><strong>Email:</strong> Resend (transactional emails)</li>
                  <li><strong>Analytics:</strong> Privacy-focused analytics tools</li>
                </ul>

                <h3>Legal Requirements</h3>
                <p>We may disclose information if required by law, court order, or government request.</p>

                <h3>Business Transfers</h3>
                <p>
                  In the event of a merger, acquisition, or sale of assets, your information 
                  may be transferred. We will notify you of any such change.
                </p>

                <h3>With Your Consent</h3>
                <p>We may share information with your explicit consent for purposes not covered here.</p>
              </section>

              <section id="security" className="scroll-mt-8">
                <h2>5. Data Security</h2>
                <p>We implement appropriate security measures including:</p>
                <ul>
                  <li><strong>Encryption:</strong> All data is encrypted in transit (TLS) and at rest</li>
                  <li><strong>Access Controls:</strong> Role-based access with audit logging</li>
                  <li><strong>Infrastructure:</strong> Secure, monitored cloud infrastructure</li>
                  <li><strong>Authentication:</strong> Secure password hashing, optional 2FA</li>
                  <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
                </ul>
                <p>
                  While we strive to protect your information, no method of transmission over 
                  the Internet is 100% secure. We cannot guarantee absolute security.
                </p>
              </section>

              <section id="retention" className="scroll-mt-8">
                <h2>6. Data Retention</h2>
                <p>We retain your information for as long as your account is active or as needed to:</p>
                <ul>
                  <li>Provide the Service to you</li>
                  <li>Comply with legal obligations (e.g., tax records for 7 years)</li>
                  <li>Resolve disputes and enforce agreements</li>
                </ul>
                <p>
                  Upon account deletion, we will delete or anonymize your data within 30 days, 
                  except where retention is required by law.
                </p>
              </section>

              <section id="rights" className="scroll-mt-8">
                <h2>7. Your Privacy Rights</h2>
                <p>Under PIPEDA and applicable provincial laws, you have the right to:</p>
                <ul>
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Export:</strong> Download your data in a portable format</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing</li>
                  <li><strong>Complain:</strong> File a complaint with the Privacy Commissioner of Canada</li>
                </ul>
                <p>
                  To exercise these rights, contact us at{" "}
                  <a href="mailto:privacy@ontyx.ca" className="text-primary">privacy@ontyx.ca</a>. 
                  We will respond within 30 days.
                </p>
              </section>

              <section id="cookies" className="scroll-mt-8">
                <h2>8. Cookies & Tracking</h2>
                <p>We use cookies and similar technologies for:</p>
                <ul>
                  <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Analytics Cookies:</strong> Understand how you use the Service</li>
                </ul>
                <p>
                  We do not use third-party advertising cookies. You can control cookies through 
                  your browser settings, but disabling essential cookies may affect functionality.
                </p>
              </section>

              <section id="children" className="scroll-mt-8">
                <h2>9. Children's Privacy</h2>
                <p>
                  Ontyx is not intended for use by individuals under 18 years of age. We do not 
                  knowingly collect personal information from children. If we learn we have 
                  collected information from a child, we will delete it immediately.
                </p>
              </section>

              <section id="international" className="scroll-mt-8">
                <h2>10. International Data Transfers</h2>
                <p>
                  Your data is primarily stored in Canada. Some of our service providers may 
                  process data in other countries. When transferring data internationally, 
                  we ensure appropriate safeguards are in place, including:
                </p>
                <ul>
                  <li>Standard contractual clauses</li>
                  <li>Data processing agreements</li>
                  <li>Compliance with applicable privacy laws</li>
                </ul>
              </section>

              <section id="changes" className="scroll-mt-8">
                <h2>11. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of 
                  any material changes by posting the new policy on this page and updating 
                  the "Last updated" date.
                </p>
                <p>
                  We encourage you to review this Privacy Policy periodically for any changes. 
                  Your continued use of the Service after changes constitutes acceptance of 
                  the updated policy.
                </p>
              </section>

              <section id="contact" className="scroll-mt-8">
                <h2>12. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy or our data practices, 
                  please contact our Privacy Officer:
                </p>
                <ul>
                  <li><strong>Email:</strong> <a href="mailto:privacy@ontyx.ca" className="text-primary">privacy@ontyx.ca</a></li>
                  <li><strong>Mail:</strong> Ontyx Privacy Officer, Toronto, Ontario, Canada</li>
                </ul>
                <p>
                  You may also contact the Office of the Privacy Commissioner of Canada at{" "}
                  <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="text-primary">
                    www.priv.gc.ca
                  </a>
                  .
                </p>
              </section>

              <hr className="my-8" />

              <p className="text-sm text-muted-foreground">
                Thank you for trusting Ontyx with your business data. We are committed to 
                protecting your privacy and being transparent about our data practices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          <div className="flex justify-center gap-4 mb-4">
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
          <p>© {new Date().getFullYear()} Ontyx. Built with 🍁 in Canada.</p>
        </div>
      </footer>
    </div>
  )
}
