import { Resend } from 'resend'

// ============================================================================
// EMAIL SERVICE - Send transactional emails via Resend
// ============================================================================

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface SendInvoiceEmailParams {
  to: string
  customerName: string
  invoiceNumber: string
  amount: string
  dueDate: string
  pdfBase64: string
  companyName: string
  companyEmail?: string
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function invoiceEmailHtml(params: SendInvoiceEmailParams): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${params.invoiceNumber}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${params.companyName}</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${params.customerName},</p>
    
    <p style="margin-bottom: 20px;">Please find attached invoice <strong>${params.invoiceNumber}</strong> for <strong>${params.amount}</strong>.</p>
    
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${params.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Amount Due:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #DC2626;">${params.amount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${params.dueDate}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin-bottom: 20px;">The invoice PDF is attached to this email for your records.</p>
    
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
      If you have any questions, please reply to this email${params.companyEmail ? ` or contact us at ${params.companyEmail}` : ''}.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      Sent via <a href="https://ontyx.ca" style="color: #DC2626;">Ontyx</a> — Business software made for Canada 🍁
    </p>
  </div>
</body>
</html>
`
}

function invoiceEmailText(params: SendInvoiceEmailParams): string {
  return `
${params.companyName}

Hi ${params.customerName},

Please find attached invoice ${params.invoiceNumber} for ${params.amount}.

Invoice Details:
- Invoice Number: ${params.invoiceNumber}
- Amount Due: ${params.amount}
- Due Date: ${params.dueDate}

The invoice PDF is attached to this email for your records.

If you have any questions, please reply to this email${params.companyEmail ? ` or contact us at ${params.companyEmail}` : ''}.

---
Sent via Ontyx — Business software made for Canada 🍁
https://ontyx.ca
`
}

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

export const emailService = {
  /**
   * Send an invoice email with PDF attachment
   */
  async sendInvoice(params: SendInvoiceEmailParams): Promise<EmailResult> {
    if (!resend) {
      console.warn('Resend not configured - RESEND_API_KEY missing')
      return { 
        success: false, 
        error: 'Email service not configured. Add RESEND_API_KEY to environment.' 
      }
    }

    try {
      const { data, error } = await resend.emails.send({
        from: `${params.companyName} <invoices@ontyx.ca>`,
        to: params.to,
        subject: `Invoice ${params.invoiceNumber} from ${params.companyName}`,
        html: invoiceEmailHtml(params),
        text: invoiceEmailText(params),
        attachments: [
          {
            filename: `Invoice-${params.invoiceNumber}.pdf`,
            content: params.pdfBase64,
          },
        ],
      })

      if (error) {
        console.error('Resend error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (err) {
      console.error('Email send error:', err)
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to send email' 
      }
    }
  },

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!resend
  },

  /**
   * Send a test email to verify configuration
   */
  async sendTest(to: string, companyName: string): Promise<EmailResult> {
    if (!resend) {
      return { success: false, error: 'Email service not configured' }
    }

    try {
      const { data, error } = await resend.emails.send({
        from: `${companyName} <invoices@ontyx.ca>`,
        to,
        subject: `Test Email from ${companyName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>✅ Email Configuration Working!</h2>
            <p>Your Ontyx email settings are configured correctly.</p>
            <p>You can now send invoices via email.</p>
          </div>
        `,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, id: data?.id }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to send test email' 
      }
    }
  },
}

export default emailService
