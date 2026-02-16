import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" })
const poppins = Poppins({ 
  subsets: ["latin"], 
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
})

export const metadata: Metadata = {
  title: "Ontyx - Business, Unified",
  description: "The complete ERP platform for modern businesses. Accounting, Inventory, CRM, HR, and more.",
  keywords: ["ERP", "Business Software", "Accounting", "Inventory", "CRM", "Payroll"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
