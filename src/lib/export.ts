/**
 * Export utilities for Ontyx
 * Handles CSV and data export functionality
 */

// ============================================================================
// CSV EXPORT
// ============================================================================

interface CSVColumn {
  header: string
  key: string
  format?: (value: any) => string
}

/**
 * Convert an array of objects to CSV string
 */
export function toCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumn[]
): string {
  if (data.length === 0) return ''
  
  // Header row
  const headers = columns.map(col => escapeCSV(col.header))
  
  // Data rows
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key]
      const formatted = col.format ? col.format(value) : String(value ?? '')
      return escapeCSV(formatted)
    })
  )
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Trigger a file download in the browser
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv;charset=utf-8;'
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Download data as CSV
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  columns: CSVColumn[],
  filename: string
): void {
  const csv = toCSV(data, columns)
  downloadFile(csv, filename, 'text/csv;charset=utf-8;')
}

// ============================================================================
// INVOICE EXPORT
// ============================================================================

import type { Invoice } from '@/services/invoices'

const INVOICE_COLUMNS: CSVColumn[] = [
  { header: 'Invoice Number', key: 'invoiceNumber' },
  { header: 'Customer', key: 'customerName' },
  { header: 'Customer Email', key: 'customerEmail' },
  { header: 'Issue Date', key: 'invoiceDate' },
  { header: 'Due Date', key: 'dueDate' },
  { header: 'Status', key: 'status' },
  { header: 'Subtotal', key: 'subtotal', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'GST', key: 'gstAmount', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'HST', key: 'hstAmount', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'PST', key: 'pstAmount', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'QST', key: 'qstAmount', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Tax Total', key: 'taxTotal', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Total', key: 'total', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Amount Paid', key: 'amountPaid', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Amount Due', key: 'amountDue', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Currency', key: 'currency' },
]

/**
 * Export invoices to CSV
 */
export function exportInvoicesToCSV(invoices: Invoice[], filename?: string): void {
  const date = new Date().toISOString().split('T')[0]
  downloadCSV(invoices, INVOICE_COLUMNS, filename || `invoices-${date}.csv`)
}

// ============================================================================
// CONTACT EXPORT
// ============================================================================

import type { Contact } from '@/services/contacts'

const CONTACT_COLUMNS: CSVColumn[] = [
  { header: 'Name', key: 'name' },
  { header: 'Type', key: 'type' },
  { header: 'Company', key: 'company' },
  { header: 'Email', key: 'email' },
  { header: 'Phone', key: 'phone' },
  { header: 'Street', key: 'address', format: (v) => v?.street || '' },
  { header: 'City', key: 'address', format: (v) => v?.city || '' },
  { header: 'Province', key: 'address', format: (v) => v?.province || '' },
  { header: 'Postal Code', key: 'address', format: (v) => v?.postalCode || '' },
  { header: 'Country', key: 'address', format: (v) => v?.country || 'CA' },
  { header: 'Tax Number', key: 'taxNumber' },
  { header: 'Notes', key: 'notes' },
]

/**
 * Export contacts to CSV
 */
export function exportContactsToCSV(contacts: Contact[], filename?: string): void {
  const date = new Date().toISOString().split('T')[0]
  downloadCSV(contacts, CONTACT_COLUMNS, filename || `contacts-${date}.csv`)
}

// ============================================================================
// PAYROLL EXPORT
// ============================================================================

const PAYROLL_COLUMNS: CSVColumn[] = [
  { header: 'Employee Name', key: 'employeeName' },
  { header: 'Pay Period Start', key: 'periodStart' },
  { header: 'Pay Period End', key: 'periodEnd' },
  { header: 'Pay Date', key: 'payDate' },
  { header: 'Gross Pay', key: 'grossPay', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'CPP', key: 'cpp', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'EI', key: 'ei', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Federal Tax', key: 'federalTax', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Provincial Tax', key: 'provincialTax', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Total Deductions', key: 'totalDeductions', format: (v) => v?.toFixed(2) || '0.00' },
  { header: 'Net Pay', key: 'netPay', format: (v) => v?.toFixed(2) || '0.00' },
]

/**
 * Export payroll data to CSV
 */
export function exportPayrollToCSV(payroll: any[], filename?: string): void {
  const date = new Date().toISOString().split('T')[0]
  downloadCSV(payroll, PAYROLL_COLUMNS, filename || `payroll-${date}.csv`)
}
