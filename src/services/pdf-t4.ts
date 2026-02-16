/**
 * T4 PDF Generator
 * 
 * Generates T4 Statement of Remuneration Paid in CRA-style format
 */

import { jsPDF } from 'jspdf'
import { formatCurrency } from '@/lib/utils'
import type { T4Data } from './t4'

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  primary: '#1e3a5f',    // CRA blue
  text: '#000000',
  textMuted: '#666666',
  border: '#000000',
  background: '#f5f5f5',
  boxBg: '#e8e8e8',
}

// ============================================================================
// PDF GENERATION
// ============================================================================

export function generateT4PDF(data: T4Data): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = margin

  // -------------------------------------------------------------------------
  // HEADER
  // -------------------------------------------------------------------------
  
  // Title
  doc.setFontSize(16)
  doc.setTextColor(COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('T4', margin, y)
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'normal')
  doc.text('Statement of Remuneration Paid', margin + 12, y)
  
  doc.setFontSize(9)
  doc.text(`${data.taxYear}`, pageWidth - margin, y, { align: 'right' })
  
  y += 8
  
  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted)
  doc.text('État de la rémunération payée', margin, y)
  
  y += 10
  
  // -------------------------------------------------------------------------
  // EMPLOYER SECTION
  // -------------------------------------------------------------------------
  
  // Box outline
  doc.setDrawColor(COLORS.border)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, pageWidth - margin * 2, 25)
  
  // Employer name
  doc.setFontSize(7)
  doc.setTextColor(COLORS.textMuted)
  doc.text("Employer's name – Nom de l'employeur", margin + 2, y + 4)
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(data.employerName, margin + 2, y + 10)
  
  // Employer BN
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted)
  doc.text('54 Business Number / Numéro d\'entreprise', margin + 2, y + 16)
  
  doc.setFontSize(9)
  doc.setTextColor(COLORS.text)
  doc.text(data.employerBn || 'N/A', margin + 2, y + 21)
  
  // Address on right
  doc.setFontSize(7)
  doc.setTextColor(COLORS.textMuted)
  doc.text("Employer's address", pageWidth / 2, y + 4)
  
  doc.setFontSize(9)
  doc.setTextColor(COLORS.text)
  doc.text(data.employerAddress || '', pageWidth / 2, y + 10)
  
  y += 30
  
  // -------------------------------------------------------------------------
  // EMPLOYEE SECTION
  // -------------------------------------------------------------------------
  
  doc.rect(margin, y, pageWidth - margin * 2, 25)
  
  // Employee name
  doc.setFontSize(7)
  doc.setTextColor(COLORS.textMuted)
  doc.text("Employee's name and address – Nom et adresse de l'employé", margin + 2, y + 4)
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(data.employeeName, margin + 2, y + 10)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (data.employeeAddress) {
    doc.text(data.employeeAddress, margin + 2, y + 15)
  }
  doc.text(`${data.employeeCity}, ${data.employeeProvince} ${data.employeePostalCode}`, margin + 2, y + 20)
  
  // SIN
  doc.setFontSize(7)
  doc.setTextColor(COLORS.textMuted)
  doc.text('12 Social insurance number / Numéro d\'assurance sociale', pageWidth / 2 + 20, y + 4)
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(data.employeeSin, pageWidth / 2 + 20, y + 10)
  
  y += 30
  
  // -------------------------------------------------------------------------
  // INCOME BOXES (Main section)
  // -------------------------------------------------------------------------
  
  const boxWidth = (pageWidth - margin * 2) / 4
  const boxHeight = 18
  
  // Row 1: Employment income, CPP, EI, RPP
  drawBox(doc, margin, y, boxWidth, boxHeight, '14', 'Employment income', data.employmentIncome)
  drawBox(doc, margin + boxWidth, y, boxWidth, boxHeight, '16', 'CPP contributions', data.cppContributions)
  drawBox(doc, margin + boxWidth * 2, y, boxWidth, boxHeight, '18', 'EI premiums', data.eiPremiums)
  drawBox(doc, margin + boxWidth * 3, y, boxWidth, boxHeight, '20', 'RPP contributions', data.rppContributions)
  
  y += boxHeight
  
  // Row 2: Income tax, Pension adjustment, Union dues, Charitable
  drawBox(doc, margin, y, boxWidth, boxHeight, '22', 'Income tax deducted', data.incomeTaxDeducted)
  drawBox(doc, margin + boxWidth, y, boxWidth, boxHeight, '52', 'Pension adjustment', data.pensionAdjustment)
  drawBox(doc, margin + boxWidth * 2, y, boxWidth, boxHeight, '44', 'Union dues', data.unionDues)
  drawBox(doc, margin + boxWidth * 3, y, boxWidth, boxHeight, '46', 'Charitable donations', data.charitableDonations)
  
  y += boxHeight
  
  // Row 3: Province, Employment code, CPP2, blank
  drawBox(doc, margin, y, boxWidth, boxHeight, '10', 'Province of employment', data.provinceOfEmployment, true)
  drawBox(doc, margin + boxWidth, y, boxWidth, boxHeight, '29', 'Employment code', data.employmentCode || '', true)
  if (data.cpp2Contributions > 0) {
    drawBox(doc, margin + boxWidth * 2, y, boxWidth, boxHeight, '16A', 'CPP2 contributions', data.cpp2Contributions)
  } else {
    drawBox(doc, margin + boxWidth * 2, y, boxWidth, boxHeight, '16A', 'CPP2 contributions', 0)
  }
  
  y += boxHeight + 10
  
  // -------------------------------------------------------------------------
  // EXEMPTIONS
  // -------------------------------------------------------------------------
  
  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted)
  doc.text('28 Exempt / Exemptions:', margin, y)
  
  let exemptText = ''
  if (data.exemptCpp) exemptText += 'CPP/QPP '
  if (data.exemptEi) exemptText += 'EI/AE '
  if (data.exemptPpip) exemptText += 'PPIP/RPAP '
  if (!exemptText) exemptText = 'None'
  
  doc.setTextColor(COLORS.text)
  doc.text(exemptText, margin + 35, y)
  
  y += 15
  
  // -------------------------------------------------------------------------
  // FOOTER
  // -------------------------------------------------------------------------
  
  doc.setDrawColor(COLORS.border)
  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  
  y += 5
  
  doc.setFontSize(7)
  doc.setTextColor(COLORS.textMuted)
  doc.text('This is not an official CRA document. For tax filing, use the official T4 from your employer.', margin, y)
  
  doc.setFontSize(7)
  doc.text(`Generated by Ontyx ERP • ${new Date().toLocaleDateString('en-CA')}`, pageWidth - margin, y, { align: 'right' })
  
  // Download
  const fileName = `T4-${data.taxYear}-${data.employeeName.replace(/\s+/g, '-')}.pdf`
  doc.save(fileName)
}

/**
 * Draw a labeled box with value
 */
function drawBox(
  doc: jsPDF, 
  x: number, 
  y: number, 
  width: number, 
  height: number,
  boxNum: string,
  label: string,
  value: number | string,
  isText: boolean = false
): void {
  // Box outline
  doc.setDrawColor(COLORS.border)
  doc.setLineWidth(0.2)
  doc.rect(x, y, width, height)
  
  // Box number
  doc.setFontSize(7)
  doc.setTextColor(COLORS.textMuted)
  doc.setFont('helvetica', 'bold')
  doc.text(boxNum, x + 2, y + 4)
  
  // Label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text(label, x + 8, y + 4)
  
  // Value
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  
  const displayValue = isText 
    ? String(value) 
    : (typeof value === 'number' && value > 0 ? formatCurrency(value, 'CAD') : '—')
  
  doc.text(displayValue, x + width - 3, y + 12, { align: 'right' })
}

/**
 * Generate all T4s as a single PDF
 */
export function generateAllT4sPDF(t4s: T4Data[], taxYear: number): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  t4s.forEach((t4, index) => {
    if (index > 0) {
      doc.addPage()
    }
    generateT4Page(doc, t4)
  })

  doc.save(`T4-${taxYear}-All-Employees.pdf`)
}

/**
 * Generate a single T4 page (for batch generation)
 */
function generateT4Page(doc: jsPDF, data: T4Data): void {
  // Same as generateT4PDF but without save
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15
  let y = margin

  // ... (same content as generateT4PDF)
  // Title
  doc.setFontSize(16)
  doc.setTextColor(COLORS.primary)
  doc.setFont('helvetica', 'bold')
  doc.text('T4', margin, y)
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'normal')
  doc.text('Statement of Remuneration Paid', margin + 12, y)
  
  doc.setFontSize(9)
  doc.text(`${data.taxYear}`, pageWidth - margin, y, { align: 'right' })
  
  y += 8
  
  doc.setFontSize(8)
  doc.setTextColor(COLORS.textMuted)
  doc.text('État de la rémunération payée', margin, y)
  
  y += 10
  
  // Employer section
  doc.setDrawColor(COLORS.border)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, pageWidth - margin * 2, 25)
  
  doc.setFontSize(7)
  doc.setTextColor(COLORS.textMuted)
  doc.text("Employer's name", margin + 2, y + 4)
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(data.employerName, margin + 2, y + 10)
  
  y += 30
  
  // Employee section
  doc.rect(margin, y, pageWidth - margin * 2, 25)
  
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(COLORS.textMuted)
  doc.text("Employee's name", margin + 2, y + 4)
  
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(data.employeeName, margin + 2, y + 10)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.employeeCity}, ${data.employeeProvince}`, margin + 2, y + 15)
  
  doc.setFontSize(7)
  doc.setTextColor(COLORS.textMuted)
  doc.text('12 SIN', pageWidth / 2 + 20, y + 4)
  doc.setFontSize(10)
  doc.setTextColor(COLORS.text)
  doc.setFont('helvetica', 'bold')
  doc.text(data.employeeSin, pageWidth / 2 + 20, y + 10)
  
  y += 30
  
  // Income boxes
  const boxWidth = (pageWidth - margin * 2) / 4
  const boxHeight = 18
  
  drawBox(doc, margin, y, boxWidth, boxHeight, '14', 'Employment income', data.employmentIncome)
  drawBox(doc, margin + boxWidth, y, boxWidth, boxHeight, '16', 'CPP contributions', data.cppContributions)
  drawBox(doc, margin + boxWidth * 2, y, boxWidth, boxHeight, '18', 'EI premiums', data.eiPremiums)
  drawBox(doc, margin + boxWidth * 3, y, boxWidth, boxHeight, '22', 'Income tax deducted', data.incomeTaxDeducted)
}
