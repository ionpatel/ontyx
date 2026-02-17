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
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background: #111827; padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">${params.companyName}</h1>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background: #DC2626; color: white; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Invoice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="background: #ffffff; padding: 40px;">
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hello ${params.customerName},
              </p>
              
              <p style="margin: 0 0 32px; font-size: 16px; color: #374151; line-height: 1.6;">
                Please find your invoice attached. Here's a quick summary:
              </p>
              
              <!-- Invoice Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Invoice Number</span>
                        </td>
                        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #111827; font-size: 14px; font-weight: 600;">${params.invoiceNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 14px;">Due Date</span>
                        </td>
                        <td align="right" style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #111827; font-size: 14px; font-weight: 600;">${params.dueDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 0 0;">
                          <span style="color: #6b7280; font-size: 14px;">Amount Due</span>
                        </td>
                        <td align="right" style="padding: 16px 0 0;">
                          <span style="color: #DC2626; font-size: 24px; font-weight: 700;">${params.amount}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; padding: 16px 24px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #DC2626;">
                      <span style="color: #991b1b; font-size: 14px; font-weight: 500;">📎 The PDF invoice is attached to this email</span>
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0; font-size: 15px; color: #6b7280; line-height: 1.6;">
                If you have any questions about this invoice, please don't hesitate to reach out${params.companyEmail ? ` at <a href="mailto:${params.companyEmail}" style="color: #DC2626; text-decoration: none;">${params.companyEmail}</a>` : ''}.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; font-size: 14px; color: #374151; font-weight: 600;">${params.companyName}</p>
                    <p style="margin: 0; font-size: 13px; color: #9ca3af;">Thank you for your business</p>
                  </td>
                  <td align="right" valign="bottom">
                    <a href="https://ontyx.ca" style="font-size: 12px; color: #9ca3af; text-decoration: none;">Powered by <span style="color: #DC2626; font-weight: 600;">Ontyx</span></a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
        <!-- Sub-footer -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding: 24px 20px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                This email was sent by ${params.companyName} via Ontyx.<br>
                🍁 Business software made for Canada
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
`
}

function invoiceEmailText(params: SendInvoiceEmailParams): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${params.companyName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hello ${params.customerName},

Please find your invoice attached. Here's a quick summary:

┌─────────────────────────────────────────────────┐
│  INVOICE DETAILS                                │
├─────────────────────────────────────────────────┤
│  Invoice Number:  ${params.invoiceNumber.padEnd(29)}│
│  Due Date:        ${params.dueDate.padEnd(29)}│
│  Amount Due:      ${params.amount.padEnd(29)}│
└─────────────────────────────────────────────────┘

📎 The PDF invoice is attached to this email.

If you have any questions about this invoice, please don't hesitate to reach out${params.companyEmail ? ` at ${params.companyEmail}` : ''}.

Thank you for your business!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${params.companyName}
Powered by Ontyx · https://ontyx.ca
🍁 Business software made for Canada
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
