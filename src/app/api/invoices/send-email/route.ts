import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/services/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      to,
      customerName,
      invoiceNumber,
      amount,
      dueDate,
      pdfBase64,
      companyName,
      companyEmail,
    } = body

    // Validate required fields
    if (!to || !customerName || !invoiceNumber || !amount || !dueDate || !pdfBase64 || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Send the email
    const result = await emailService.sendInvoice({
      to,
      customerName,
      invoiceNumber,
      amount,
      dueDate,
      pdfBase64,
      companyName,
      companyEmail,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.id,
    })
  } catch (error) {
    console.error('Send invoice email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
