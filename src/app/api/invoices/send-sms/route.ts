import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// SMS/WhatsApp invoice delivery using Twilio
// Can also integrate with:
// - MessageBird for WhatsApp Business API
// - Vonage for SMS
// - Plivo for cost-effective SMS

interface SendSMSRequest {
  invoiceId: string
  phoneNumber: string
  method: 'sms' | 'whatsapp'
  message?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const body: SendSMSRequest = await request.json()
    const { invoiceId, phoneNumber, method, message } = body

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        contact:contacts(display_name, phone, email),
        organization:organizations(name, phone)
      `)
      .eq('id', invoiceId)
      .eq('organization_id', member.organization_id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Format phone number for Canada/US
    const formattedPhone = formatPhoneNumber(phoneNumber)
    if (!formattedPhone) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }

    // Generate short payment link
    const paymentLink = await generatePaymentLink(invoice, supabase)

    // Build message
    const invoiceAmount = (invoice.total / 100).toFixed(2)
    const businessName = invoice.organization?.name || 'Your business'
    const customerName = invoice.contact?.display_name?.split(' ')[0] || 'there'
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-CA') : 'upon receipt'

    const defaultMessage = method === 'whatsapp'
      ? `Hi ${customerName}! 👋\n\nYou have a new invoice from *${businessName}*:\n\n📄 Invoice #${invoice.invoice_number}\n💰 Amount: *CA$${invoiceAmount}*\n📅 Due: ${dueDate}\n\n👉 Pay now: ${paymentLink}\n\nQuestions? Reply to this message.`
      : `${businessName}: Invoice #${invoice.invoice_number} for CA$${invoiceAmount} due ${dueDate}. Pay: ${paymentLink}`

    const finalMessage = message || defaultMessage

    // Send via Twilio (or mock for development)
    const twilioResult = await sendViaTwilio(formattedPhone, finalMessage, method)

    if (!twilioResult.success) {
      return NextResponse.json({ error: twilioResult.error }, { status: 500 })
    }

    // Log the send
    await supabase.from('invoice_notifications').insert({
      invoice_id: invoiceId,
      notification_type: method,
      recipient: formattedPhone,
      message: finalMessage,
      status: 'sent',
      external_id: twilioResult.messageId,
      sent_at: new Date().toISOString(),
    })

    // Update invoice status if still draft
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', invoiceId)
    }

    return NextResponse.json({ 
      success: true, 
      messageId: twilioResult.messageId,
      method,
      recipient: formattedPhone
    })
  } catch (err: any) {
    console.error('SMS send error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Handle Canadian/US numbers
  if (digits.length === 10) {
    return `+1${digits}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  // International number with country code
  if (digits.length > 10) {
    return `+${digits}`
  }
  
  return null
}

async function generatePaymentLink(invoice: any, supabase: any): Promise<string> {
  // Generate a short, secure payment link
  // In production, this would create a Stripe payment link or similar
  
  const token = Buffer.from(`${invoice.id}:${Date.now()}`).toString('base64url').slice(0, 12)
  
  // Store the token for verification
  await supabase.from('payment_links').insert({
    invoice_id: invoice.id,
    token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    created_at: new Date().toISOString()
  }).onConflict('invoice_id').ignore() // Don't fail if exists

  // Return the payment URL (would be your domain in production)
  return `https://pay.ontyx.ca/i/${token}`
}

async function sendViaTwilio(
  to: string, 
  message: string, 
  method: 'sms' | 'whatsapp'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const twilioPhone = method === 'whatsapp' 
    ? process.env.TWILIO_WHATSAPP_NUMBER 
    : process.env.TWILIO_PHONE_NUMBER

  // If Twilio not configured, simulate success for development
  if (!accountSid || !authToken || !twilioPhone) {
    console.log(`[DEV] Would send ${method} to ${to}: ${message.slice(0, 50)}...`)
    return { success: true, messageId: `mock_${Date.now()}` }
  }

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    
    const formData = new URLSearchParams()
    formData.append('To', method === 'whatsapp' ? `whatsapp:${to}` : to)
    formData.append('From', method === 'whatsapp' ? `whatsapp:${twilioPhone}` : twilioPhone)
    formData.append('Body', message)

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, messageId: data.sid }
    } else {
      return { success: false, error: data.message || 'Twilio error' }
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
