/**
 * Email Service for Ontyx ERP
 * Handles transactional emails: invoices, receipts, reminders
 * 
 * Production: Uses Resend API (Canadian data residency available)
 * Demo: Logs emails, returns success
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EmailRecipient {
  email: string
  name?: string
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer  // Base64 or Buffer
  contentType: string
}

export interface SendEmailInput {
  to: EmailRecipient | EmailRecipient[]
  subject: string
  html: string
  text?: string
  from?: EmailRecipient
  replyTo?: string
  attachments?: EmailAttachment[]
  tags?: Record<string, string>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface InvoiceEmailData {
  invoiceNumber: string
  customerName: string
  customerEmail: string
  amount: number
  dueDate: string
  companyName: string
  companyEmail?: string
  viewLink?: string
  pdfAttachment?: EmailAttachment
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export function generateInvoiceEmailHtml(data: InvoiceEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(data.amount)

  const formattedDate = new Date(data.dueDate).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #DC2626; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${data.companyName}
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${data.customerName},
              </p>
              
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Please find attached invoice <strong>${data.invoiceNumber}</strong> for your records.
              </p>
              
              <!-- Invoice Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding-bottom: 8px;">Invoice Number</td>
                        <td align="right" style="color: #111827; font-size: 14px; font-weight: 600; padding-bottom: 8px;">${data.invoiceNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px; padding-bottom: 8px;">Amount Due</td>
                        <td align="right" style="color: #DC2626; font-size: 20px; font-weight: 700; padding-bottom: 8px;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Due Date</td>
                        <td align="right" style="color: #111827; font-size: 14px; font-weight: 600;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${data.viewLink ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${data.viewLink}" style="display: inline-block; background-color: #DC2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      View Invoice
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you have any questions about this invoice, please don't hesitate to contact us.
              </p>
              
              <p style="margin: 24px 0 0; color: #374151; font-size: 16px;">
                Thank you for your business!<br>
                <strong>${data.companyName}</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This email was sent by ${data.companyName}
                ${data.companyEmail ? `<br><a href="mailto:${data.companyEmail}" style="color: #6b7280;">${data.companyEmail}</a>` : ''}
              </p>
              <p style="margin: 16px 0 0; color: #9ca3af; font-size: 12px;">
                Powered by <a href="https://ontyx.vercel.app" style="color: #DC2626; text-decoration: none;">Ontyx</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function generateInvoiceEmailText(data: InvoiceEmailData): string {
  const formattedAmount = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(data.amount)

  return `
Hi ${data.customerName},

Please find attached invoice ${data.invoiceNumber} for your records.

Invoice Details:
- Invoice Number: ${data.invoiceNumber}
- Amount Due: ${formattedAmount}
- Due Date: ${new Date(data.dueDate).toLocaleDateString('en-CA')}

${data.viewLink ? `View Invoice: ${data.viewLink}` : ''}

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!
${data.companyName}
${data.companyEmail || ''}

---
Powered by Ontyx
  `.trim()
}

// ============================================================================
// SERVICE
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'invoices@ontyx.app'
const FROM_NAME = process.env.FROM_NAME || 'Ontyx'

export const emailService = {
  /**
   * Send a generic email
   */
  async send(input: SendEmailInput): Promise<EmailResult> {
    // Demo mode - log and return success
    if (!RESEND_API_KEY) {
      console.log('[Email Demo] Would send email:', {
        to: input.to,
        subject: input.subject,
        attachments: input.attachments?.length || 0,
      })
      return { 
        success: true, 
        messageId: `demo-${Date.now()}` 
      }
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: input.from 
            ? `${input.from.name} <${input.from.email}>`
            : `${FROM_NAME} <${FROM_EMAIL}>`,
          to: Array.isArray(input.to) 
            ? input.to.map(r => r.name ? `${r.name} <${r.email}>` : r.email)
            : input.to.name ? `${input.to.name} <${input.to.email}>` : input.to.email,
          subject: input.subject,
          html: input.html,
          text: input.text,
          reply_to: input.replyTo,
          attachments: input.attachments?.map(a => ({
            filename: a.filename,
            content: typeof a.content === 'string' ? a.content : a.content.toString('base64'),
          })),
          tags: input.tags ? Object.entries(input.tags).map(([name, value]) => ({ name, value })) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send email')
      }

      const data = await response.json()
      return { success: true, messageId: data.id }

    } catch (error: any) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Send an invoice email with PDF attachment
   */
  async sendInvoice(data: InvoiceEmailData): Promise<EmailResult> {
    const html = generateInvoiceEmailHtml(data)
    const text = generateInvoiceEmailText(data)

    return this.send({
      to: { email: data.customerEmail, name: data.customerName },
      subject: `Invoice ${data.invoiceNumber} from ${data.companyName}`,
      html,
      text,
      replyTo: data.companyEmail,
      attachments: data.pdfAttachment ? [data.pdfAttachment] : undefined,
      tags: {
        type: 'invoice',
        invoice_number: data.invoiceNumber,
      },
    })
  },

  /**
   * Send a payment receipt
   */
  async sendPaymentReceipt(data: {
    customerName: string
    customerEmail: string
    invoiceNumber: string
    paymentAmount: number
    paymentDate: string
    remainingBalance: number
    companyName: string
    companyEmail?: string
  }): Promise<EmailResult> {
    const formattedAmount = new Intl.NumberFormat('en-CA', {
      style: 'currency', currency: 'CAD'
    }).format(data.paymentAmount)

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f4f4f5; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px;">
    <h1 style="color: #059669; margin: 0 0 24px;">Payment Received ✓</h1>
    <p>Hi ${data.customerName},</p>
    <p>We've received your payment of <strong>${formattedAmount}</strong> for invoice ${data.invoiceNumber}.</p>
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0;"><strong>Payment Date:</strong> ${new Date(data.paymentDate).toLocaleDateString('en-CA')}</p>
      <p style="margin: 8px 0 0;"><strong>Amount:</strong> ${formattedAmount}</p>
      ${data.remainingBalance > 0 
        ? `<p style="margin: 8px 0 0;"><strong>Remaining Balance:</strong> ${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(data.remainingBalance)}</p>`
        : `<p style="margin: 8px 0 0; color: #059669;"><strong>Status:</strong> Paid in Full</p>`
      }
    </div>
    <p>Thank you for your business!</p>
    <p><strong>${data.companyName}</strong></p>
  </div>
</body>
</html>
    `.trim()

    return this.send({
      to: { email: data.customerEmail, name: data.customerName },
      subject: `Payment Receipt - ${data.invoiceNumber}`,
      html,
      replyTo: data.companyEmail,
      tags: { type: 'receipt', invoice_number: data.invoiceNumber },
    })
  },

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(data: {
    customerName: string
    customerEmail: string
    invoiceNumber: string
    amountDue: number
    dueDate: string
    daysOverdue: number
    companyName: string
    companyEmail?: string
    viewLink?: string
  }): Promise<EmailResult> {
    const formattedAmount = new Intl.NumberFormat('en-CA', {
      style: 'currency', currency: 'CAD'
    }).format(data.amountDue)

    const isOverdue = data.daysOverdue > 0
    const urgencyColor = isOverdue ? '#DC2626' : '#F59E0B'

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f4f4f5; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px;">
    <h1 style="color: ${urgencyColor}; margin: 0 0 24px;">
      ${isOverdue ? '⚠️ Payment Overdue' : '📋 Payment Reminder'}
    </h1>
    <p>Hi ${data.customerName},</p>
    <p>This is a ${isOverdue ? 'reminder that payment for' : 'friendly reminder about'} invoice <strong>${data.invoiceNumber}</strong>${isOverdue ? ` is now ${data.daysOverdue} days overdue` : ''}.</p>
    <div style="background: ${isOverdue ? '#FEF2F2' : '#FFFBEB'}; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid ${urgencyColor};">
      <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${urgencyColor};">${formattedAmount}</p>
      <p style="margin: 8px 0 0; color: #6b7280;">Due: ${new Date(data.dueDate).toLocaleDateString('en-CA')}</p>
    </div>
    ${data.viewLink ? `<p><a href="${data.viewLink}" style="color: #DC2626;">View Invoice →</a></p>` : ''}
    <p>If you've already sent payment, please disregard this notice.</p>
    <p>Thank you,<br><strong>${data.companyName}</strong></p>
  </div>
</body>
</html>
    `.trim()

    return this.send({
      to: { email: data.customerEmail, name: data.customerName },
      subject: isOverdue 
        ? `⚠️ Overdue: Invoice ${data.invoiceNumber} - ${formattedAmount}`
        : `Reminder: Invoice ${data.invoiceNumber} due soon`,
      html,
      replyTo: data.companyEmail,
      tags: { 
        type: isOverdue ? 'overdue_reminder' : 'payment_reminder',
        invoice_number: data.invoiceNumber,
      },
    })
  },
}

export default emailService
