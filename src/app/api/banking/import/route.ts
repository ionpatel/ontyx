import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const accountName = formData.get('accountName') as string

    if (!file || !accountName) {
      return NextResponse.json({ error: 'File and account name required' }, { status: 400 })
    }

    const content = await file.text()
    const transactions = parseStatementFile(content, file.name)

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions found in file' }, { status: 400 })
    }

    // Create or get bank account
    let { data: account } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('organization_id', member.organization_id)
      .eq('account_name', accountName)
      .single()

    if (!account) {
      const { data: newAccount, error: accountError } = await supabase
        .from('bank_accounts')
        .insert({
          organization_id: member.organization_id,
          account_name: accountName,
          institution_name: 'Manual Import',
          account_type: 'checking',
          currency: 'CAD',
          balance: 0,
          status: 'connected',
        })
        .select('id')
        .single()

      if (accountError) throw accountError
      account = newAccount
    }

    // Insert transactions
    const transactionRecords = transactions.map(t => ({
      bank_account_id: account!.id,
      transaction_date: t.date,
      description: t.description,
      amount: Math.round(t.amount * 100), // Store in cents
      raw_data: JSON.stringify(t),
      imported_at: new Date().toISOString(),
    }))

    const { error: insertError } = await supabase
      .from('bank_transactions')
      .insert(transactionRecords)

    if (insertError) throw insertError

    // Update account balance
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
    await supabase
      .from('bank_accounts')
      .update({ 
        balance: supabase.rpc('increment_balance', { amount: Math.round(totalAmount * 100) }),
        last_synced_at: new Date().toISOString()
      })
      .eq('id', account!.id)

    return NextResponse.json({ 
      success: true, 
      imported: transactions.length,
      accountId: account!.id
    })
  } catch (err: any) {
    console.error('Import error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

interface ParsedTransaction {
  date: string
  description: string
  amount: number
}

function parseStatementFile(content: string, filename: string): ParsedTransaction[] {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  if (extension === 'csv') {
    return parseCSV(content)
  } else if (extension === 'ofx' || extension === 'qfx') {
    return parseOFX(content)
  }
  
  return []
}

function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
  
  // Find column indices (handle various bank formats)
  const dateIdx = headers.findIndex(h => 
    h.includes('date') || h.includes('posted') || h.includes('trans')
  )
  const descIdx = headers.findIndex(h => 
    h.includes('description') || h.includes('memo') || h.includes('payee') || h.includes('details')
  )
  const amountIdx = headers.findIndex(h => 
    h.includes('amount') || h.includes('value')
  )
  const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('withdrawal'))
  const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('deposit'))

  if (dateIdx === -1) return []

  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length <= Math.max(dateIdx, descIdx, amountIdx, debitIdx, creditIdx)) continue

    const date = parseDate(values[dateIdx])
    if (!date) continue

    const description = descIdx >= 0 ? values[descIdx] : 'Unknown'
    
    let amount = 0
    if (amountIdx >= 0) {
      amount = parseFloat(values[amountIdx].replace(/[^0-9.-]/g, '')) || 0
    } else if (debitIdx >= 0 || creditIdx >= 0) {
      const debit = debitIdx >= 0 ? parseFloat(values[debitIdx].replace(/[^0-9.-]/g, '')) || 0 : 0
      const credit = creditIdx >= 0 ? parseFloat(values[creditIdx].replace(/[^0-9.-]/g, '')) || 0 : 0
      amount = credit - debit
    }

    if (amount !== 0) {
      transactions.push({ date, description, amount })
    }
  }

  return transactions
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())
  
  return values
}

function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  
  // Simple OFX parser (handles most Canadian bank exports)
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
  const matches = content.matchAll(stmtTrnRegex)
  
  for (const match of matches) {
    const block = match[1]
    
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/i)
    const amountMatch = block.match(/<TRNAMT>([+-]?\d+\.?\d*)/i)
    const memoMatch = block.match(/<MEMO>([^<]+)/i) || block.match(/<NAME>([^<]+)/i)
    
    if (dateMatch && amountMatch) {
      const dateStr = dateMatch[1]
      const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      const amount = parseFloat(amountMatch[1])
      const description = memoMatch ? memoMatch[1].trim() : 'Unknown'
      
      transactions.push({ date, description, amount })
    }
  }
  
  return transactions
}

function parseDate(value: string): string | null {
  const cleaned = value.trim().replace(/"/g, '')
  
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned
  
  // MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, a, b, year] = slashMatch
    // Assume MM/DD/YYYY (North American format)
    const month = a.padStart(2, '0')
    const day = b.padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Try Date.parse as fallback
  const parsed = Date.parse(cleaned)
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0]
  }
  
  return null
}
