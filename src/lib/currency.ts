// ==========================================
// MULTI-CURRENCY SUPPORT
// ==========================================

export type CurrencyCode = "CAD" | "USD" | "EUR" | "GBP" | "INR"

export interface Currency {
  code: CurrencyCode
  name: string
  symbol: string
  locale: string
  decimalPlaces: number
  flag: string
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "CA$", locale: "en-CA", decimalPlaces: 2, flag: "🇨🇦" },
  USD: { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US", decimalPlaces: 2, flag: "🇺🇸" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE", decimalPlaces: 2, flag: "🇪🇺" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB", decimalPlaces: 2, flag: "🇬🇧" },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", locale: "en-IN", decimalPlaces: 2, flag: "🇮🇳" },
}

export const CURRENCY_LIST = Object.values(CURRENCIES)

// Mock exchange rates (base: USD)
const MOCK_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  CAD: 1.36,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.12,
}

export interface ExchangeRates {
  base: CurrencyCode
  date: string
  rates: Record<CurrencyCode, number>
}

let cachedRates: ExchangeRates | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

/**
 * Fetch exchange rates (uses mock data, can be replaced with real API)
 */
export async function fetchExchangeRates(base: CurrencyCode = "USD"): Promise<ExchangeRates> {
  const now = Date.now()

  if (cachedRates && cachedRates.base === base && now - cacheTimestamp < CACHE_DURATION) {
    return cachedRates
  }

  // In production, replace with real API call:
  // const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`)
  // const data = await res.json()

  const baseRate = MOCK_RATES[base]
  const rates: Record<CurrencyCode, number> = {} as Record<CurrencyCode, number>

  for (const [code, rate] of Object.entries(MOCK_RATES)) {
    rates[code as CurrencyCode] = Number((rate / baseRate).toFixed(6))
  }

  cachedRates = {
    base,
    date: new Date().toISOString().split("T")[0],
    rates,
  }
  cacheTimestamp = now

  return cachedRates
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  if (from === to) return amount

  const rates = await fetchExchangeRates("USD")
  const fromRate = rates.rates[from]
  const toRate = rates.rates[to]

  // Convert: amount in FROM → USD → TO
  const usdAmount = amount / fromRate
  return Number((usdAmount * toRate).toFixed(2))
}

/**
 * Synchronous conversion using cached rates
 */
export function convertCurrencySync(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount

  const fromRate = MOCK_RATES[from]
  const toRate = MOCK_RATES[to]

  const usdAmount = amount / fromRate
  return Number((usdAmount * toRate).toFixed(2))
}

/**
 * Format amount in the given currency
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: CurrencyCode = "USD"
): string {
  const currency = CURRENCIES[currencyCode]
  return new Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  }).format(amount)
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return 1

  const fromRate = MOCK_RATES[from]
  const toRate = MOCK_RATES[to]

  return Number((toRate / fromRate).toFixed(6))
}

/**
 * Format a rate display string
 */
export function formatExchangeRate(from: CurrencyCode, to: CurrencyCode): string {
  const rate = getExchangeRate(from, to)
  return `1 ${from} = ${rate} ${to}`
}

/**
 * Parse a currency string back to number
 */
export function parseCurrencyString(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "")
  return parseFloat(cleaned) || 0
}
