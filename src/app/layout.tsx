import type { Metadata, Viewport } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"
import { ServiceWorkerRegister } from "@/components/service-worker-register"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" })
const poppins = Poppins({ 
  subsets: ["latin"], 
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
})

export const metadata: Metadata = {
  title: "Ontyx — Canada's Business OS",
  description: "Complete business management for Canadian local businesses. Inventory, invoicing, payroll, accounting, CRM — all in one.",
  keywords: ["ERP", "Business Software", "Accounting", "Inventory", "CRM", "Payroll", "Canada", "Canadian"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ontyx",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#DC2626",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-CA">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        {children}
        <ServiceWorkerRegister />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}
