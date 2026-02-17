/**
 * PDF Generation Service for Ontyx ERP
 * Generates professional PDF invoices with Canadian tax breakdown
 * Supports customizable templates with branding options
 */

import { jsPDF } from 'jspdf'
import { formatCurrency } from '@/lib/utils'
import type { InvoiceTemplate } from './invoice-templates'

// ============================================================================
// TYPES
// ============================================================================

export interface InvoicePDFData {
  // Invoice details
  invoiceNumber: string
  issueDate: string
  dueDate: string
  status: string
  
  // Company (seller)
  companyName: string
  companyAddress: string
  companyCity: string
  companyProvince: string
  companyPostalCode: string
  companyPhone?: string
  companyEmail?: string
  companyGstNumber?: string
  companyLogoUrl?: string
  
  // Customer (buyer)
  customerName: string
  customerAddress?: string
  customerCity?: string
  customerProvince?: string
  customerPostalCode?: string
  customerEmail?: string
  
  // Line items
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  
  // Totals
  subtotal: number
  taxBreakdown: Array<{
    name: string  // e.g., "GST", "PST", "HST", "QST"
    rate: number  // e.g., 0.05 for 5%
    amount: number
  }>
  total: number
  amountPaid: number
  balanceDue: number
  
  // Optional
  notes?: string
  terms?: string
  
  // Template (optional - uses defaults if not provided)
  template?: Partial<InvoiceTemplate>
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_COLORS = {
  primary: '#DC2626',      // Maple red
  primaryDark: '#B91C1C',
  text: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
}

// Build colors from template or use defaults
function getColors(template?: Partial<InvoiceTemplate>) {
  return {
    primary: template?.primaryColor || DEFAULT_COLORS.primary,
    primaryDark: darkenColor(template?.primaryColor || DEFAULT_COLORS.primary, 0.15),
    text: template?.secondaryColor || DEFAULT_COLORS.text,
    textMuted: '#6b7280',
    border: '#e5e7eb',
    background: '#f9fafb',
  }
}

// Darken a hex color by a percentage
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(255 * percent)
  const R = Math.max((num >> 16) - amt, 0)
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0)
  const B = Math.max((num & 0x0000FF) - amt, 0)
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

const FONTS = {
  regular: 'helvetica',
  bold: 'helvetica',
}

// ============================================================================
// PDF GENERATION
// ============================================================================

// Helper to load image as base64 with format detection
async function loadImageAsBase64(url: string): Promise<{ data: string; format: string } | null> {
  try {
    console.log('[PDF] Loading logo from:', url)
    const response = await fetch(url, { mode: 'cors' })
    
    if (!response.ok) {
      console.error('[PDF] Failed to fetch logo:', response.status)
      return null
    }
    
    const blob = await response.blob()
    const mimeType = blob.type || 'image/png'
    
    // Determine format from mime type
    let format = 'PNG'
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      format = 'JPEG'
    } else if (mimeType.includes('png')) {
      format = 'PNG'
    } else if (mimeType.includes('gif')) {
      format = 'GIF'
    } else if (mimeType.includes('webp')) {
      format = 'WEBP'
    }
    
    console.log('[PDF] Logo loaded, format:', format, 'size:', blob.size)
    
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        console.log('[PDF] Logo converted to base64, length:', result?.length)
        resolve({ data: result, format })
      }
      reader.onerror = () => {
        console.error('[PDF] FileReader error')
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('[PDF] Logo load exception:', err)
    return null
  }
}

export async function generateInvoicePDFAsync(data: InvoicePDFData): Promise<jsPDF> {
  // Pre-load logo if provided
  let logoData: { data: string; format: string } | null = null
  if (data.companyLogoUrl) {
    console.log('[PDF] Attempting to load company logo:', data.companyLogoUrl)
    logoData = await loadImageAsBase64(data.companyLogoUrl)
  }
  return generateInvoicePDFWithLogo(data, logoData)
}

export function generateInvoicePDF(data: InvoicePDFData): jsPDF {
  // Sync version without logo (for backwards compatibility)
  return generateInvoicePDFWithLogo(data, null)
}

function generateInvoicePDFWithLogo(data: InvoicePDFData, logoData: { data: string; format: string } | null): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',  // 8.5" x 11" - Canadian standard
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = margin
  
  // Get colors from template
  const COLORS = getColors(data.template)
  
  // Template settings with defaults
  const template = {
    logoPosition: data.template?.logoPosition || 'left',
    logoSize: data.template?.logoSize || 'medium',
    fontStyle: data.template?.fontStyle || 'modern',
    footerText: data.template?.footerText || 'Thank you for your business!',
    paymentInstructions: data.template?.paymentInstructions || '',
    thankYouMessage: data.template?.thankYouMessage || '',
    showLogo: data.template?.showLogo ?? true,
    showCompanyAddress: data.template?.showCompanyAddress ?? true,
    showPaymentTerms: data.template?.showPaymentTerms ?? true,
  }
  
  // Logo size in mm
  const logoSizes = { small: 20, medium: 28, large: 36 }
  const logoHeight = logoSizes[template.logoSize]

  // -------------------------------------------------------------------------
  // HEADER WITH LOGO
  // -------------------------------------------------------------------------
  
  let logoAdded = false
  
  // Try to add logo image if available
  if (template.showLogo && logoData) {
    try {
      console.log('[PDF] Adding logo to PDF, format:', logoData.format)
      const logoX = template.logoPosition === 'center' 
        ? (pageWidth - logoHeight) / 2 
        : template.logoPosition === 'right' 
          ? pageWidth - margin - logoHeight 
          : margin
      
      doc.addImage(logoData.data, logoData.format, logoX, y - 5, logoHeight, logoHeight)
      logoAdded = true
      console.log('[PDF] Logo added successfully at x:', logoX, 'y:', y - 5)
      
      // Position INVOICE text on opposite side of logo
      doc.setFontSize(28)
      doc.setTextColor(COLORS.text)
      doc.setFont(FONTS.bold, 'bold')
      if (template.logoPosition === 'left') {
        doc.text('INVOICE', pageWidth - margin, y + 10, { align: 'right' })
      } else if (template.logoPosition === 'right') {
        doc.text('INVOICE', margin, y + 10)
      } else {
        doc.text('INVOICE', pageWidth / 2, y + logoHeight + 5, { align: 'center' })
      }
      
      y += logoHeight + 5
    } catch (err) {
      console.error('Failed to add logo:', err)
      logoAdded = false
    }
  }
  
  // Fallback: show company name as text if no logo
  if (!logoAdded) {
    if (template.logoPosition === 'center') {
      doc.setFontSize(24)
      doc.setTextColor(COLORS.primary)
      doc.setFont(FONTS.bold, 'bold')
      doc.text(data.companyName, pageWidth / 2, y, { align: 'center' })
      
      doc.setFontSize(28)
      doc.setTextColor(COLORS.text)
      doc.text('INVOICE', pageWidth / 2, y + 12, { align: 'center' })
      y += 20
    } else if (template.logoPosition === 'right') {
      doc.setFontSize(32)
      doc.setTextColor(COLORS.text)
      doc.text('INVOICE', margin, y)
      
      doc.setFontSize(24)
      doc.setTextColor(COLORS.primary)
      doc.setFont(FONTS.bold, 'bold')
      doc.text(data.companyName, pageWidth - margin, y, { align: 'right' })
    } else {
      doc.setFontSize(24)
      doc.setTextColor(COLORS.primary)
      doc.setFont(FONTS.bold, 'bold')
      doc.text(data.companyName, margin, y)
      
      doc.setFontSize(32)
      doc.setTextColor(COLORS.text)
      doc.text('INVOICE', pageWidth - margin, y, { align: 'right' })
    }
  }
  
  y += 12
  
  // Company details
  doc.setFontSize(9)
  doc.setTextColor(COLORS.textMuted)
  doc.setFont(FONTS.regular, 'normal')
  
  const companyLines = [
    data.companyAddress,
    `${data.companyCity}, ${data.companyProvince} ${data.companyPostalCode}`,
    data.companyPhone,
    data.companyEmail,
    data.companyGstNumber ? `GST/HST: ${data.companyGstNumber}` : null,
  ].filter(Boolean)
  
  companyLines.forEach(line => {
    doc.text(line as string, margin, y)
    y += 4
  })
  
  // Invoice details (right side)
  let rightY = margin + 12
  doc.setFontSize(10)
  
  const invoiceDetails = [
    { label: 'Invoice #', value: data.invoiceNumber },
    { label: 'Issue Date', value: formatDate(data.issueDate) },
    { label: 'Due Date', value: formatDate(data.dueDate) },
  ]
  
  invoiceDetails.forEach(detail => {
    doc.setTextColor(COLORS.textMuted)
    doc.text(detail.label + ':', pageWidth - margin - 50, rightY)
    doc.setTextColor(COLORS.text)
    doc.setFont(FONTS.bold, 'bold')
    doc.text(detail.value, pageWidth - margin, rightY, { align: 'right' })
    doc.setFont(FONTS.regular, 'normal')
    rightY += 5
  })
  
  y = Math.max(y, rightY) + 10
  
  // -------------------------------------------------------------------------
  // BILL TO
  // -------------------------------------------------------------------------
  
  // Section divider
  doc.setDrawColor(COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.primary)
  doc.setFont(FONTS.bold, 'bold')
  doc.text('BILL TO', margin, y)
  y += 5
  
  doc.setFontSize(11)
  doc.setTextColor(COLORS.text)
  doc.text(data.customerName, margin, y)
  y += 5
  
  doc.setFontSize(9)
  doc.setTextColor(COLORS.textMuted)
  doc.setFont(FONTS.regular, 'normal')
  
  const customerLines = [
    data.customerAddress,
    data.customerCity && data.customerProvince 
      ? `${data.customerCity}, ${data.customerProvince} ${data.customerPostalCode || ''}`
      : null,
    data.customerEmail,
  ].filter(Boolean)
  
  customerLines.forEach(line => {
    doc.text(line as string, margin, y)
    y += 4
  })
  
  y += 10
  
  // -------------------------------------------------------------------------
  // LINE ITEMS TABLE
  // -------------------------------------------------------------------------
  
  // Table header background
  doc.setFillColor(COLORS.background)
  doc.rect(margin, y - 2, pageWidth - (margin * 2), 8, 'F')
  
  // Table header
  doc.setFontSize(9)
  doc.setTextColor(COLORS.text)
  doc.setFont(FONTS.bold, 'bold')
  
  const colX = {
    description: margin + 2,
    qty: pageWidth - margin - 70,
    price: pageWidth - margin - 45,
    total: pageWidth - margin - 2,
  }
  
  doc.text('Description', colX.description, y + 3)
  doc.text('Qty', colX.qty, y + 3, { align: 'right' })
  doc.text('Unit Price', colX.price, y + 3, { align: 'right' })
  doc.text('Amount', colX.total, y + 3, { align: 'right' })
  
  y += 10
  
  // Table rows
  doc.setFont(FONTS.regular, 'normal')
  doc.setFontSize(9)
  
  data.items.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 1) {
      doc.setFillColor('#fafafa')
      doc.rect(margin, y - 3, pageWidth - (margin * 2), 7, 'F')
    }
    
    doc.setTextColor(COLORS.text)
    doc.text(truncateText(item.description, 60), colX.description, y)
    doc.text(item.quantity.toString(), colX.qty, y, { align: 'right' })
    doc.text(formatCurrency(item.unitPrice, 'CAD'), colX.price, y, { align: 'right' })
    doc.text(formatCurrency(item.total, 'CAD'), colX.total, y, { align: 'right' })
    
    y += 7
    
    // Add page break if needed
    if (y > pageHeight - 80) {
      doc.addPage()
      y = margin
    }
  })
  
  y += 5
  
  // Table bottom border
  doc.setDrawColor(COLORS.border)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10
  
  // -------------------------------------------------------------------------
  // TOTALS
  // -------------------------------------------------------------------------
  
  const totalsX = pageWidth - margin - 50
  
  // Subtotal
  doc.setFontSize(10)
  doc.setTextColor(COLORS.textMuted)
  doc.text('Subtotal', totalsX, y)
  doc.setTextColor(COLORS.text)
  doc.text(formatCurrency(data.subtotal, 'CAD'), pageWidth - margin, y, { align: 'right' })
  y += 6
  
  // Tax breakdown
  data.taxBreakdown.forEach(tax => {
    doc.setTextColor(COLORS.textMuted)
    doc.text(`${tax.name} (${(tax.rate * 100).toFixed(2)}%)`, totalsX, y)
    doc.setTextColor(COLORS.text)
    doc.text(formatCurrency(tax.amount, 'CAD'), pageWidth - margin, y, { align: 'right' })
    y += 6
  })
  
  // Total
  doc.setDrawColor(COLORS.border)
  doc.line(totalsX - 5, y - 2, pageWidth - margin, y - 2)
  y += 4
  
  doc.setFontSize(12)
  doc.setFont(FONTS.bold, 'bold')
  doc.setTextColor(COLORS.text)
  doc.text('Total', totalsX, y)
  doc.text(formatCurrency(data.total, 'CAD'), pageWidth - margin, y, { align: 'right' })
  y += 8
  
  // Amount paid
  if (data.amountPaid > 0) {
    doc.setFontSize(10)
    doc.setFont(FONTS.regular, 'normal')
    doc.setTextColor(COLORS.textMuted)
    doc.text('Amount Paid', totalsX, y)
    doc.setTextColor('#059669') // Green
    doc.text(`-${formatCurrency(data.amountPaid, 'CAD')}`, pageWidth - margin, y, { align: 'right' })
    y += 6
  }
  
  // Balance due
  doc.setFillColor(COLORS.primary)
  doc.rect(totalsX - 8, y - 4, pageWidth - margin - totalsX + 10, 10, 'F')
  
  doc.setFontSize(11)
  doc.setFont(FONTS.bold, 'bold')
  doc.setTextColor('#ffffff')
  doc.text('Balance Due', totalsX - 4, y + 2)
  doc.text(formatCurrency(data.balanceDue, 'CAD'), pageWidth - margin - 2, y + 2, { align: 'right' })
  
  y += 20
  
  // -------------------------------------------------------------------------
  // NOTES & TERMS
  // -------------------------------------------------------------------------
  
  if (data.notes) {
    doc.setFontSize(9)
    doc.setTextColor(COLORS.primary)
    doc.setFont(FONTS.bold, 'bold')
    doc.text('Notes', margin, y)
    y += 5
    
    doc.setTextColor(COLORS.textMuted)
    doc.setFont(FONTS.regular, 'normal')
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - (margin * 2))
    doc.text(noteLines, margin, y)
    y += noteLines.length * 4 + 5
  }
  
  // Payment Instructions from template
  const paymentInstructions = template.paymentInstructions || data.terms
  if (paymentInstructions && template.showPaymentTerms) {
    doc.setFontSize(9)
    doc.setTextColor(COLORS.primary)
    doc.setFont(FONTS.bold, 'bold')
    doc.text('Payment Instructions', margin, y)
    y += 5
    
    doc.setTextColor(COLORS.textMuted)
    doc.setFont(FONTS.regular, 'normal')
    const termLines = doc.splitTextToSize(paymentInstructions, pageWidth - (margin * 2))
    doc.text(termLines, margin, y)
    y += termLines.length * 4 + 5
  }
  
  // Thank you message from template
  if (template.thankYouMessage) {
    doc.setFontSize(10)
    doc.setTextColor(COLORS.primary)
    doc.setFont(FONTS.regular, 'italic')
    doc.text(template.thankYouMessage, pageWidth / 2, y + 5, { align: 'center' })
    y += 10
  }
  
  // -------------------------------------------------------------------------
  // FOOTER
  // -------------------------------------------------------------------------
  
  // Custom footer text from template
  const footerText = template.footerText || 'Thank you for your business!'
  
  doc.setFontSize(9)
  doc.setTextColor(COLORS.textMuted)
  doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: 'center' })
  
  doc.setFontSize(7)
  doc.text(
    'Generated by Ontyx ERP • ontyx.vercel.app',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )
  
  return doc
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

// ============================================================================
// DOWNLOAD / PREVIEW
// ============================================================================

export async function downloadInvoicePDF(data: InvoicePDFData): Promise<void> {
  const doc = await generateInvoicePDFAsync(data)
  doc.save(`${data.invoiceNumber}.pdf`)
}

export async function previewInvoicePDF(data: InvoicePDFData): Promise<string> {
  const doc = await generateInvoicePDFAsync(data)
  return doc.output('datauristring')
}

export async function getInvoicePDFBlob(data: InvoicePDFData): Promise<Blob> {
  const doc = await generateInvoicePDFAsync(data)
  return doc.output('blob')
}
