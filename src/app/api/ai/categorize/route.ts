import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// AI-powered expense categorization using pattern matching and ML-like rules
// In production, this could call OpenAI/Claude for more sophisticated categorization

interface CategorizeRequest {
  description: string
  amount: number
  vendor?: string
  date?: string
}

interface CategorizeResponse {
  category: string
  confidence: number
  subcategory?: string
  taxDeductible: boolean
  suggestedTags: string[]
}

// Canadian business expense categories aligned with CRA guidelines
const CATEGORIES = {
  'Advertising & Marketing': {
    keywords: ['facebook', 'google ads', 'marketing', 'advertising', 'promotion', 'flyer', 'billboard', 'radio', 'tv ad', 'instagram', 'tiktok', 'linkedin'],
    taxDeductible: true,
    craLine: 8521
  },
  'Bank Charges': {
    keywords: ['bank fee', 'service charge', 'monthly fee', 'overdraft', 'nsf', 'wire fee', 'interac'],
    taxDeductible: true,
    craLine: 8710
  },
  'Business Insurance': {
    keywords: ['insurance', 'liability', 'malpractice', 'bonding'],
    taxDeductible: true,
    craLine: 8690
  },
  'Meals & Entertainment': {
    keywords: ['restaurant', 'cafe', 'uber eats', 'skip', 'doordash', 'starbucks', 'tim hortons', 'lunch', 'dinner', 'coffee', 'catering', 'business lunch'],
    taxDeductible: true, // 50% deductible in Canada
    deductionRate: 0.5,
    craLine: 8523
  },
  'Motor Vehicle': {
    keywords: ['gas', 'petro', 'esso', 'shell', 'parking', 'car wash', 'oil change', 'tire', 'auto repair', 'mechanic'],
    taxDeductible: true,
    craLine: 9281
  },
  'Office Expenses': {
    keywords: ['staples', 'office depot', 'paper', 'ink', 'toner', 'pen', 'supplies', 'printer'],
    taxDeductible: true,
    craLine: 8810
  },
  'Professional Fees': {
    keywords: ['lawyer', 'accountant', 'consultant', 'legal', 'audit', 'bookkeep', 'cpa', 'paralegal'],
    taxDeductible: true,
    craLine: 8860
  },
  'Rent': {
    keywords: ['rent', 'lease', 'landlord', 'property management'],
    taxDeductible: true,
    craLine: 8910
  },
  'Repairs & Maintenance': {
    keywords: ['repair', 'maintenance', 'fix', 'plumber', 'electrician', 'hvac', 'cleaning', 'janitorial'],
    taxDeductible: true,
    craLine: 8960
  },
  'Salaries & Wages': {
    keywords: ['payroll', 'salary', 'wage', 'bonus', 'ceridian', 'adp', 'paychex'],
    taxDeductible: true,
    craLine: 9060
  },
  'Software & Technology': {
    keywords: ['software', 'saas', 'subscription', 'adobe', 'microsoft', 'google workspace', 'zoom', 'slack', 'shopify', 'quickbooks', 'aws', 'hosting', 'domain'],
    taxDeductible: true,
    craLine: 8811
  },
  'Telephone & Internet': {
    keywords: ['phone', 'cell', 'mobile', 'rogers', 'bell', 'telus', 'fido', 'internet', 'wifi', 'data plan'],
    taxDeductible: true,
    craLine: 9220
  },
  'Travel': {
    keywords: ['flight', 'hotel', 'airbnb', 'uber', 'lyft', 'taxi', 'train', 'via rail', 'air canada', 'westjet', 'expedia', 'booking.com'],
    taxDeductible: true,
    craLine: 9200
  },
  'Utilities': {
    keywords: ['hydro', 'electricity', 'gas', 'water', 'enbridge', 'toronto hydro', 'bc hydro', 'fortis'],
    taxDeductible: true,
    craLine: 9220
  },
  'Cost of Goods Sold': {
    keywords: ['inventory', 'wholesale', 'supplier', 'stock', 'merchandise', 'raw material'],
    taxDeductible: true,
    craLine: 8320
  },
  'Shipping & Delivery': {
    keywords: ['fedex', 'ups', 'purolator', 'canada post', 'dhl', 'shipping', 'freight', 'courier'],
    taxDeductible: true,
    craLine: 8811
  },
  'Training & Education': {
    keywords: ['course', 'training', 'seminar', 'conference', 'workshop', 'certification', 'udemy', 'linkedin learning'],
    taxDeductible: true,
    craLine: 8811
  },
  'Other': {
    keywords: [],
    taxDeductible: true,
    craLine: 9270
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CategorizeRequest = await request.json()
    const { description, amount, vendor } = body

    const result = categorizeExpense(description, amount, vendor)

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function categorizeExpense(description: string, amount: number, vendor?: string): CategorizeResponse {
  const searchText = `${description} ${vendor || ''}`.toLowerCase()
  
  let bestMatch: { category: string; score: number } = { category: 'Other', score: 0 }
  
  for (const [category, config] of Object.entries(CATEGORIES)) {
    let score = 0
    
    for (const keyword of config.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        // Longer keywords get higher scores (more specific)
        score += keyword.length
      }
    }
    
    if (score > bestMatch.score) {
      bestMatch = { category, score }
    }
  }

  const categoryConfig = CATEGORIES[bestMatch.category as keyof typeof CATEGORIES]
  const confidence = Math.min(bestMatch.score / 15, 0.99) // Normalize to 0-0.99

  // Generate suggested tags
  const tags: string[] = []
  if (categoryConfig.taxDeductible) tags.push('tax-deductible')
  if ((categoryConfig as any).deductionRate === 0.5) tags.push('50%-deductible')
  if (amount > 500) tags.push('high-value')
  if (amount < 20) tags.push('petty-cash')
  
  return {
    category: bestMatch.category,
    confidence: confidence > 0 ? confidence : 0.3, // Minimum 30% confidence for Other
    taxDeductible: categoryConfig.taxDeductible,
    suggestedTags: tags
  }
}

// Batch categorization endpoint
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { expenses }: { expenses: CategorizeRequest[] } = await request.json()
    
    const results = expenses.map(exp => ({
      ...exp,
      ...categorizeExpense(exp.description, exp.amount, exp.vendor)
    }))

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
