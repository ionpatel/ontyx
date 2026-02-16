/**
 * Pay Stub PDF Generator
 * 
 * Generates professional pay stub PDFs with Canadian payroll breakdown
 */

import { jsPDF } from 'jspdf'
import { formatCurrency } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export interface PayStubData {
  // Employee
  employeeName: string
  employeeEmail?: string
  
  // Company (optional)
  companyName?: string
  companyAddress?: string
  
  // Period
  payDate: string
  periodStart: string
  periodEnd: string
  
  // Earnings
  regularHours: number
  regularPay: number
  overtimeHours: number
  overtimePay: number
  otherEarnings: number
  grossPay: number
  
  // Deductions
  cpp: number
  cpp2: number
  ei: number
  federalTax: number
  provincialTax: number
  otherDeductions: number
  totalDeductions: number
  
  // Net
  netPay: number
  
  // YTD
  ytdGross: number
  ytdCpp: number
  ytdEi: number
  ytdNet: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  primary: '#DC2626',
  text: '#1f2937',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  green: '#059669',
  red: '#dc2626',
}

// ============================================================================
// PDF GENERATION
// ============================================================================

export function generatePayStubPDF(data: PayStubData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = margin

  // -------------------------------------------------------------------------
  // HEADER
  // -------------------------------------------------------------------------
  
  doc.setFontSize(24)
  doc.setTextColor(COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('PAY STUB', margin, y)
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'normal')
  doc.text('CONFIDENTIAL', pageWidth - margin, y, { align: 'right' })
  
  y += 15
  
  // Company name if provided
  if (data.companyName) {
    doc.setFontSize(12)
    doc.setTextColor(COLORS.text)
    doc.setFont('helvetica', 'bold')
    doc.text(data.companyName, margin, y)
    y += 5
    
    if (data.companyAddress) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(COLORS.textMuted)
      doc.text(data.companyAddress, margin, y)
      y += 5
    }
    y += 5
  }
  
  // Divider
  doc.setDrawColor(COLORS.border)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10
  
  // -------------------------------------------------------------------------
  // EMPLOYEE INFO & PAY PERIOD
  // -------------------------------------------------------------------------
  
  // Employee name
  doc.setFontSize(10)
  doc.setTextColor(COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('EMPLOYEE', margin, y)
  y += 5
  
  doc.setFontSize(14)
  doc.setTextColor(COLORS.text)
  doc.text(data.employeeName, margin, y)
  y += 5
  
  if (data.employeeEmail) {
    doc.setFontSize(9)
    doc.setTextColor(COLORS.textMuted)
    doc.setFont('helvetica', 'normal')
    doc.text(data.employeeEmail, margin, y)
  }
  
  // Pay period info (right side)
  let rightY = y - 15
  doc.setFontSize(9)
  doc.setTextColor(COLORS.textMuted)
  doc.setFont('helvetica', 'normal')
  
  doc.text('Pay Date:', pageWidth - margin - 50, rightY)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(formatDate(data.payDate), pageWidth - margin, rightY, { align: 'right' })
  
  if (data.periodStart && data.periodEnd) {
    rightY += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(COLORS.textMuted)
    doc.text('Period:', pageWidth - margin - 50, rightY)
    doc.setTextColor(COLORS.text)
    doc.text(`${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`, pageWidth - margin, rightY, { align: 'right' })
  }
  
  y += 15
  
  // -------------------------------------------------------------------------
  // EARNINGS & DEDUCTIONS TABLES
  // -------------------------------------------------------------------------
  
  const tableStartY = y
  const colMid = pageWidth / 2 - 5
  
  // EARNINGS (left side)
  doc.setFillColor(COLORS.background)
  doc.rect(margin, y - 2, colMid - margin - 5, 8, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text('EARNINGS', margin + 3, y + 3)
  doc.text('Amount', colMid - 10, y + 3, { align: 'right' })
  
  y += 12
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  // Regular pay
  doc.setTextColor(COLORS.textMuted)
  doc.text(`Regular Pay (${data.regularHours.toFixed(1)} hrs)`, margin + 3, y)
  doc.setTextColor(COLORS.text)
  doc.text(formatCurrency(data.regularPay, 'CAD'), colMid - 10, y, { align: 'right' })
  y += 6
  
  // Overtime
  if (data.overtimePay > 0) {
    doc.setTextColor(COLORS.textMuted)
    doc.text(`Overtime (${data.overtimeHours.toFixed(1)} hrs)`, margin + 3, y)
    doc.setTextColor(COLORS.text)
    doc.text(formatCurrency(data.overtimePay, 'CAD'), colMid - 10, y, { align: 'right' })
    y += 6
  }
  
  // Other earnings
  if (data.otherEarnings > 0) {
    doc.setTextColor(COLORS.textMuted)
    doc.text('Other Earnings', margin + 3, y)
    doc.setTextColor(COLORS.text)
    doc.text(formatCurrency(data.otherEarnings, 'CAD'), colMid - 10, y, { align: 'right' })
    y += 6
  }
  
  // Earnings total
  doc.setDrawColor(COLORS.border)
  doc.line(margin + 3, y, colMid - 10, y)
  y += 5
  
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.green)
  doc.text('Gross Pay', margin + 3, y)
  doc.text(formatCurrency(data.grossPay, 'CAD'), colMid - 10, y, { align: 'right' })
  
  // DEDUCTIONS (right side)
  let dedY = tableStartY
  
  doc.setFillColor(COLORS.background)
  doc.rect(colMid + 5, dedY - 2, pageWidth - margin - colMid - 5, 8, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text('DEDUCTIONS', colMid + 8, dedY + 3)
  doc.text('Amount', pageWidth - margin - 3, dedY + 3, { align: 'right' })
  
  dedY += 12
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  // CPP
  doc.setTextColor(COLORS.textMuted)
  doc.text('CPP', colMid + 8, dedY)
  doc.setTextColor(COLORS.red)
  doc.text(`-${formatCurrency(data.cpp, 'CAD')}`, pageWidth - margin - 3, dedY, { align: 'right' })
  dedY += 6
  
  // CPP2
  if (data.cpp2 > 0) {
    doc.setTextColor(COLORS.textMuted)
    doc.text('CPP2 (Enhanced)', colMid + 8, dedY)
    doc.setTextColor(COLORS.red)
    doc.text(`-${formatCurrency(data.cpp2, 'CAD')}`, pageWidth - margin - 3, dedY, { align: 'right' })
    dedY += 6
  }
  
  // EI
  doc.setTextColor(COLORS.textMuted)
  doc.text('EI', colMid + 8, dedY)
  doc.setTextColor(COLORS.red)
  doc.text(`-${formatCurrency(data.ei, 'CAD')}`, pageWidth - margin - 3, dedY, { align: 'right' })
  dedY += 6
  
  // Federal Tax
  doc.setTextColor(COLORS.textMuted)
  doc.text('Federal Tax', colMid + 8, dedY)
  doc.setTextColor(COLORS.red)
  doc.text(`-${formatCurrency(data.federalTax, 'CAD')}`, pageWidth - margin - 3, dedY, { align: 'right' })
  dedY += 6
  
  // Provincial Tax
  doc.setTextColor(COLORS.textMuted)
  doc.text('Provincial Tax', colMid + 8, dedY)
  doc.setTextColor(COLORS.red)
  doc.text(`-${formatCurrency(data.provincialTax, 'CAD')}`, pageWidth - margin - 3, dedY, { align: 'right' })
  dedY += 6
  
  // Other deductions
  if (data.otherDeductions > 0) {
    doc.setTextColor(COLORS.textMuted)
    doc.text('Other Deductions', colMid + 8, dedY)
    doc.setTextColor(COLORS.red)
    doc.text(`-${formatCurrency(data.otherDeductions, 'CAD')}`, pageWidth - margin - 3, dedY, { align: 'right' })
    dedY += 6
  }
  
  // Deductions total
  doc.setDrawColor(COLORS.border)
  doc.line(colMid + 8, dedY, pageWidth - margin - 3, dedY)
  dedY += 5
  
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(COLORS.red)
  doc.text('Total Deductions', colMid + 8, dedY)
  doc.text(`-${formatCurrency(data.totalDeductions, 'CAD')}`, pageWidth - margin - 3, dedY, { align: 'right' })
  
  // Move to next section
  y = Math.max(y, dedY) + 20
  
  // -------------------------------------------------------------------------
  // NET PAY (highlighted box)
  // -------------------------------------------------------------------------
  
  doc.setFillColor(COLORS.primary)
  doc.rect(margin, y - 5, pageWidth - (margin * 2), 20, 'F')
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#ffffff')
  doc.text('NET PAY', margin + 10, y + 5)
  doc.setFontSize(18)
  doc.text(formatCurrency(data.netPay, 'CAD'), pageWidth - margin - 10, y + 5, { align: 'right' })
  
  y += 25
  
  // -------------------------------------------------------------------------
  // YTD SUMMARY
  // -------------------------------------------------------------------------
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('YEAR-TO-DATE SUMMARY', margin, y)
  y += 8
  
  doc.setFillColor(COLORS.background)
  doc.rect(margin, y - 2, pageWidth - (margin * 2), 30, 'F')
  
  const ytdColWidth = (pageWidth - (margin * 2)) / 4
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted)
  
  // YTD Gross
  doc.text('YTD Gross', margin + 5, y + 5)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(data.ytdGross, 'CAD'), margin + 5, y + 12)
  
  // YTD CPP
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted)
  doc.text('YTD CPP', margin + ytdColWidth + 5, y + 5)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(data.ytdCpp, 'CAD'), margin + ytdColWidth + 5, y + 12)
  
  // YTD EI
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted)
  doc.text('YTD EI', margin + ytdColWidth * 2 + 5, y + 5)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(data.ytdEi, 'CAD'), margin + ytdColWidth * 2 + 5, y + 12)
  
  // YTD Net
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted)
  doc.text('YTD Net', margin + ytdColWidth * 3 + 5, y + 5)
  doc.setTextColor(COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(data.ytdNet, 'CAD'), margin + ytdColWidth * 3 + 5, y + 12)
  
  y += 40
  
  // -------------------------------------------------------------------------
  // FOOTER
  // -------------------------------------------------------------------------
  
  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'This pay stub is for informational purposes. Please retain for your records.',
    pageWidth / 2,
    y,
    { align: 'center' }
  )
  
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-CA')} • Ontyx ERP`,
    pageWidth / 2,
    y + 5,
    { align: 'center' }
  )
  
  // Download
  const fileName = `paystub-${data.employeeName.replace(/\s+/g, '-').toLowerCase()}-${formatDateForFile(data.payDate)}.pdf`
  doc.save(fileName)
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateForFile(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  try {
    return new Date(dateStr).toISOString().split('T')[0]
  } catch {
    return dateStr
  }
}
