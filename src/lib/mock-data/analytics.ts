// Analytics & Reports Mock Data
// Tells the story of a growing SaaS/Services business with seasonal patterns

export interface MonthlyFinancials {
  month: string
  monthNum: number
  year: number
  revenue: number
  expenses: number
  profit: number
  cogs: number
  operatingExpenses: number
  cashIn: number
  cashOut: number
  cashBalance: number
}

export interface SalesByProduct {
  product: string
  category: string
  revenue: number
  units: number
  avgPrice: number
  margin: number
  growth: number
}

export interface SalesByCustomer {
  customer: string
  revenue: number
  orders: number
  avgOrderValue: number
  firstOrder: string
  lastOrder: string
  growth: number
  region: string
}

export interface SalesByRegion {
  region: string
  revenue: number
  customers: number
  orders: number
  growth: number
  marketShare: number
}

export interface InventoryItem {
  sku: string
  name: string
  category: string
  quantity: number
  unitCost: number
  totalValue: number
  reorderPoint: number
  lastRestocked: string
  turnoverRate: number
}

export interface TaxSummaryItem {
  taxType: string
  jurisdiction: string
  taxableAmount: number
  taxRate: number
  taxOwed: number
  taxPaid: number
  taxDue: number
  period: string
}

export interface EmployeeCost {
  department: string
  headcount: number
  baseSalary: number
  benefits: number
  taxes: number
  overtime: number
  training: number
  totalCost: number
  costPerEmployee: number
  revenuePerEmployee: number
}

export interface ProjectProfitability {
  project: string
  client: string
  status: "active" | "completed" | "on-hold"
  budget: number
  actualCost: number
  revenue: number
  profit: number
  margin: number
  hoursEstimated: number
  hoursActual: number
  completion: number
  startDate: string
  endDate: string
}

export interface AgingBucket {
  name: string
  current: number
  days30: number
  days60: number
  days90: number
  over90: number
  total: number
}

// ============================
// Monthly Financial Data (24 months - tells growth story)
// ============================
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function generateMonthlyData(): MonthlyFinancials[] {
  const data: MonthlyFinancials[] = []
  let cashBalance = 120000

  // 2025 data (historical) - growing business
  const revenueBase2025 = [62000, 58000, 72000, 78000, 85000, 92000, 88000, 95000, 102000, 108000, 115000, 128000]
  const expenseBase2025 = [48000, 46000, 52000, 54000, 58000, 62000, 60000, 63000, 66000, 68000, 72000, 78000]

  for (let i = 0; i < 12; i++) {
    const revenue = revenueBase2025[i]
    const expenses = expenseBase2025[i]
    const cogs = Math.round(revenue * 0.28)
    const opex = expenses - cogs
    const cashIn = Math.round(revenue * 0.92)
    const cashOut = Math.round(expenses * 0.95)
    cashBalance += cashIn - cashOut

    data.push({
      month: months[i],
      monthNum: i + 1,
      year: 2025,
      revenue,
      expenses,
      profit: revenue - expenses,
      cogs,
      operatingExpenses: opex,
      cashIn,
      cashOut,
      cashBalance,
    })
  }

  // 2026 data (current year, partial) - continued growth with seasonal dip in Jan
  const revenueBase2026 = [118000, 135000]
  const expenseBase2026 = [74000, 79000]

  for (let i = 0; i < 2; i++) {
    const revenue = revenueBase2026[i]
    const expenses = expenseBase2026[i]
    const cogs = Math.round(revenue * 0.26)
    const opex = expenses - cogs
    const cashIn = Math.round(revenue * 0.94)
    const cashOut = Math.round(expenses * 0.93)
    cashBalance += cashIn - cashOut

    data.push({
      month: months[i],
      monthNum: i + 1,
      year: 2026,
      revenue,
      expenses,
      profit: revenue - expenses,
      cogs,
      operatingExpenses: opex,
      cashIn,
      cashOut,
      cashBalance,
    })
  }

  return data
}

export const monthlyFinancials = generateMonthlyData()

// Current year and last year for comparison
export const currentYearData = monthlyFinancials.filter(d => d.year === 2026)
export const lastYearData = monthlyFinancials.filter(d => d.year === 2025)

// ============================
// Revenue Trend Data (for dashboard area chart)
// ============================
export interface RevenueTrendPoint {
  month: string
  revenue: number
  expenses: number
  profit: number
  lastYearRevenue: number
}

export function generateRevenueTrend(): RevenueTrendPoint[] {
  return lastYearData.map((d, i) => ({
    month: d.month,
    revenue: currentYearData[i]?.revenue || d.revenue * 1.15,
    expenses: currentYearData[i]?.expenses || d.expenses * 1.08,
    profit: currentYearData[i]?.profit || (d.revenue * 1.15 - d.expenses * 1.08),
    lastYearRevenue: d.revenue,
  }))
}

// ============================
// Cash Flow Forecast
// ============================
export interface CashFlowForecast {
  week: string
  projected: number
  actual: number | null
  inflows: number
  outflows: number
}

export const cashFlowForecast: CashFlowForecast[] = [
  { week: "Week 1", projected: 285000, actual: 288400, inflows: 42000, outflows: 38000 },
  { week: "Week 2", projected: 292000, actual: 291500, inflows: 38000, outflows: 35000 },
  { week: "Week 3", projected: 298000, actual: null, inflows: 45000, outflows: 39000 },
  { week: "Week 4", projected: 304000, actual: null, inflows: 41000, outflows: 35000 },
  { week: "Week 5", projected: 312000, actual: null, inflows: 48000, outflows: 40000 },
  { week: "Week 6", projected: 318000, actual: null, inflows: 39000, outflows: 33000 },
  { week: "Week 7", projected: 326000, actual: null, inflows: 44000, outflows: 36000 },
  { week: "Week 8", projected: 335000, actual: null, inflows: 46000, outflows: 37000 },
]

// ============================
// Sales by Product
// ============================
export const salesByProduct: SalesByProduct[] = [
  { product: "Enterprise Suite", category: "Software", revenue: 245000, units: 49, avgPrice: 5000, margin: 82, growth: 24 },
  { product: "Pro Plan", category: "Software", revenue: 168000, units: 280, avgPrice: 600, margin: 78, growth: 18 },
  { product: "Consulting Hours", category: "Services", revenue: 128000, units: 640, avgPrice: 200, margin: 65, growth: 12 },
  { product: "Starter Plan", category: "Software", revenue: 96000, units: 800, avgPrice: 120, margin: 85, growth: 32 },
  { product: "Custom Development", category: "Services", revenue: 85000, units: 17, avgPrice: 5000, margin: 55, growth: 8 },
  { product: "Training Workshops", category: "Training", revenue: 46500, units: 93, avgPrice: 500, margin: 70, growth: 15 },
  { product: "Support Premium", category: "Support", revenue: 38400, units: 320, avgPrice: 120, margin: 90, growth: 28 },
  { product: "API Access", category: "Software", revenue: 32000, units: 160, avgPrice: 200, margin: 92, growth: 45 },
  { product: "Data Migration", category: "Services", revenue: 24000, units: 12, avgPrice: 2000, margin: 60, growth: -5 },
  { product: "White Label", category: "Software", revenue: 18000, units: 6, avgPrice: 3000, margin: 75, growth: 50 },
]

// ============================
// Sales by Customer
// ============================
export const salesByCustomer: SalesByCustomer[] = [
  { customer: "Acme Corporation", revenue: 125000, orders: 24, avgOrderValue: 5208, firstOrder: "2024-03-15", lastOrder: "2026-02-10", growth: 28, region: "Northeast" },
  { customer: "TechStart Inc", revenue: 98000, orders: 18, avgOrderValue: 5444, firstOrder: "2024-06-01", lastOrder: "2026-02-12", growth: 22, region: "West Coast" },
  { customer: "Global Services Ltd", revenue: 87000, orders: 15, avgOrderValue: 5800, firstOrder: "2024-08-20", lastOrder: "2026-02-08", growth: 35, region: "International" },
  { customer: "Enterprise Solutions", revenue: 76000, orders: 12, avgOrderValue: 6333, firstOrder: "2025-01-10", lastOrder: "2026-01-28", growth: 18, region: "Midwest" },
  { customer: "DataFlow Systems", revenue: 65000, orders: 22, avgOrderValue: 2955, firstOrder: "2024-11-05", lastOrder: "2026-02-14", growth: 42, region: "Southeast" },
  { customer: "CloudNine Corp", revenue: 54000, orders: 9, avgOrderValue: 6000, firstOrder: "2025-03-12", lastOrder: "2026-01-20", growth: 15, region: "West Coast" },
  { customer: "Metro Holdings", revenue: 48000, orders: 16, avgOrderValue: 3000, firstOrder: "2024-09-01", lastOrder: "2026-02-06", growth: 8, region: "Northeast" },
  { customer: "Pacific Trading", revenue: 42000, orders: 14, avgOrderValue: 3000, firstOrder: "2025-02-15", lastOrder: "2026-02-11", growth: 25, region: "West Coast" },
  { customer: "Sunrise Medical", revenue: 38000, orders: 8, avgOrderValue: 4750, firstOrder: "2025-05-20", lastOrder: "2026-01-30", growth: 20, region: "Southeast" },
  { customer: "Nordic Industries", revenue: 35000, orders: 10, avgOrderValue: 3500, firstOrder: "2025-04-10", lastOrder: "2026-02-03", growth: 12, region: "International" },
]

// ============================
// Sales by Region
// ============================
export const salesByRegion: SalesByRegion[] = [
  { region: "West Coast", revenue: 285000, customers: 42, orders: 156, growth: 22, marketShare: 32 },
  { region: "Northeast", revenue: 218000, customers: 35, orders: 128, growth: 15, marketShare: 25 },
  { region: "Southeast", revenue: 156000, customers: 28, orders: 98, growth: 28, marketShare: 18 },
  { region: "Midwest", revenue: 112000, customers: 22, orders: 74, growth: 12, marketShare: 13 },
  { region: "International", revenue: 110000, customers: 18, orders: 52, growth: 45, marketShare: 12 },
]

// ============================
// Inventory Valuation
// ============================
export const inventoryItems: InventoryItem[] = [
  { sku: "HW-001", name: "Server Rack Unit", category: "Hardware", quantity: 45, unitCost: 2500, totalValue: 112500, reorderPoint: 10, lastRestocked: "2026-01-15", turnoverRate: 4.2 },
  { sku: "HW-002", name: "Network Switch 48-Port", category: "Hardware", quantity: 120, unitCost: 850, totalValue: 102000, reorderPoint: 25, lastRestocked: "2026-02-01", turnoverRate: 6.8 },
  { sku: "HW-003", name: "SSD 1TB Enterprise", category: "Hardware", quantity: 350, unitCost: 180, totalValue: 63000, reorderPoint: 50, lastRestocked: "2026-02-10", turnoverRate: 8.5 },
  { sku: "SW-001", name: "Enterprise License Key", category: "Software", quantity: 200, unitCost: 150, totalValue: 30000, reorderPoint: 50, lastRestocked: "2026-01-20", turnoverRate: 12.0 },
  { sku: "HW-004", name: "UPS Battery Backup", category: "Hardware", quantity: 28, unitCost: 650, totalValue: 18200, reorderPoint: 8, lastRestocked: "2025-12-15", turnoverRate: 3.1 },
  { sku: "HW-005", name: "CAT6 Cable (1000ft)", category: "Supplies", quantity: 85, unitCost: 125, totalValue: 10625, reorderPoint: 20, lastRestocked: "2026-01-28", turnoverRate: 10.2 },
  { sku: "HW-006", name: "Firewall Appliance", category: "Hardware", quantity: 15, unitCost: 3200, totalValue: 48000, reorderPoint: 5, lastRestocked: "2026-01-05", turnoverRate: 2.8 },
  { sku: "SW-002", name: "Security Suite License", category: "Software", quantity: 500, unitCost: 45, totalValue: 22500, reorderPoint: 100, lastRestocked: "2026-02-05", turnoverRate: 15.0 },
  { sku: "HW-007", name: "Wireless Access Point", category: "Hardware", quantity: 65, unitCost: 320, totalValue: 20800, reorderPoint: 15, lastRestocked: "2026-01-22", turnoverRate: 5.5 },
  { sku: "SP-001", name: "Mounting Hardware Kit", category: "Supplies", quantity: 200, unitCost: 35, totalValue: 7000, reorderPoint: 40, lastRestocked: "2026-02-08", turnoverRate: 9.0 },
]

// ============================
// Tax Summary
// ============================
export const taxSummary: TaxSummaryItem[] = [
  { taxType: "Sales Tax", jurisdiction: "California", taxableAmount: 285000, taxRate: 7.25, taxOwed: 20663, taxPaid: 15200, taxDue: 5463, period: "Q1 2026" },
  { taxType: "Sales Tax", jurisdiction: "New York", taxableAmount: 218000, taxRate: 8.0, taxOwed: 17440, taxPaid: 12800, taxDue: 4640, period: "Q1 2026" },
  { taxType: "Sales Tax", jurisdiction: "Texas", taxableAmount: 156000, taxRate: 6.25, taxOwed: 9750, taxPaid: 9750, taxDue: 0, period: "Q1 2026" },
  { taxType: "Payroll Tax", jurisdiction: "Federal", taxableAmount: 425000, taxRate: 7.65, taxOwed: 32513, taxPaid: 22000, taxDue: 10513, period: "Q1 2026" },
  { taxType: "Payroll Tax", jurisdiction: "State", taxableAmount: 425000, taxRate: 3.4, taxOwed: 14450, taxPaid: 9800, taxDue: 4650, period: "Q1 2026" },
  { taxType: "Income Tax", jurisdiction: "Federal", taxableAmount: 189500, taxRate: 21.0, taxOwed: 39795, taxPaid: 25000, taxDue: 14795, period: "FY 2025" },
  { taxType: "Income Tax", jurisdiction: "State (CA)", taxableAmount: 189500, taxRate: 8.84, taxOwed: 16752, taxPaid: 12000, taxDue: 4752, period: "FY 2025" },
  { taxType: "Use Tax", jurisdiction: "California", taxableAmount: 45000, taxRate: 7.25, taxOwed: 3263, taxPaid: 3263, taxDue: 0, period: "Q1 2026" },
]

// ============================
// Employee Cost Analysis
// ============================
export const employeeCosts: EmployeeCost[] = [
  { department: "Engineering", headcount: 12, baseSalary: 1440000, benefits: 216000, taxes: 110160, overtime: 28000, training: 24000, totalCost: 1818160, costPerEmployee: 151513, revenuePerEmployee: 73750 },
  { department: "Sales", headcount: 8, baseSalary: 720000, benefits: 108000, taxes: 55080, overtime: 12000, training: 16000, totalCost: 911080, costPerEmployee: 113885, revenuePerEmployee: 110625 },
  { department: "Marketing", headcount: 5, baseSalary: 425000, benefits: 63750, taxes: 32513, overtime: 5000, training: 10000, totalCost: 536263, costPerEmployee: 107253, revenuePerEmployee: 88500 },
  { department: "Operations", headcount: 6, baseSalary: 480000, benefits: 72000, taxes: 36720, overtime: 18000, training: 8000, totalCost: 614720, costPerEmployee: 102453, revenuePerEmployee: 62500 },
  { department: "Finance", headcount: 4, baseSalary: 380000, benefits: 57000, taxes: 29070, overtime: 6000, training: 8000, totalCost: 480070, costPerEmployee: 120018, revenuePerEmployee: 55000 },
  { department: "HR", headcount: 3, baseSalary: 240000, benefits: 36000, taxes: 18360, overtime: 2000, training: 12000, totalCost: 308360, costPerEmployee: 102787, revenuePerEmployee: 0 },
  { department: "Customer Support", headcount: 7, baseSalary: 420000, benefits: 63000, taxes: 32130, overtime: 15000, training: 14000, totalCost: 544130, costPerEmployee: 77733, revenuePerEmployee: 54857 },
  { department: "Executive", headcount: 3, baseSalary: 600000, benefits: 90000, taxes: 45900, overtime: 0, training: 15000, totalCost: 750900, costPerEmployee: 250300, revenuePerEmployee: 295000 },
]

// ============================
// Project Profitability
// ============================
export const projectProfitability: ProjectProfitability[] = [
  { project: "Acme Platform Rebuild", client: "Acme Corporation", status: "active", budget: 150000, actualCost: 98000, revenue: 125000, profit: 27000, margin: 21.6, hoursEstimated: 1200, hoursActual: 820, completion: 72, startDate: "2025-09-01", endDate: "2026-04-30" },
  { project: "TechStart Mobile App", client: "TechStart Inc", status: "active", budget: 85000, actualCost: 62000, revenue: 78000, profit: 16000, margin: 20.5, hoursEstimated: 680, hoursActual: 510, completion: 85, startDate: "2025-10-15", endDate: "2026-03-15" },
  { project: "Global CRM Integration", client: "Global Services Ltd", status: "active", budget: 120000, actualCost: 45000, revenue: 48000, profit: 3000, margin: 6.3, hoursEstimated: 960, hoursActual: 380, completion: 40, startDate: "2025-12-01", endDate: "2026-06-30" },
  { project: "DataFlow Migration", client: "DataFlow Systems", status: "completed", budget: 45000, actualCost: 42000, revenue: 45000, profit: 3000, margin: 6.7, hoursEstimated: 360, hoursActual: 340, completion: 100, startDate: "2025-08-01", endDate: "2025-11-30" },
  { project: "CloudNine Infrastructure", client: "CloudNine Corp", status: "completed", budget: 95000, actualCost: 78000, revenue: 95000, profit: 17000, margin: 17.9, hoursEstimated: 760, hoursActual: 680, completion: 100, startDate: "2025-06-15", endDate: "2025-12-31" },
  { project: "Metro Analytics Dashboard", client: "Metro Holdings", status: "active", budget: 65000, actualCost: 28000, revenue: 32000, profit: 4000, margin: 12.5, hoursEstimated: 520, hoursActual: 240, completion: 48, startDate: "2026-01-05", endDate: "2026-05-15" },
  { project: "Nordic ERP Customization", client: "Nordic Industries", status: "on-hold", budget: 55000, actualCost: 18000, revenue: 20000, profit: 2000, margin: 10.0, hoursEstimated: 440, hoursActual: 150, completion: 32, startDate: "2025-11-01", endDate: "2026-04-01" },
  { project: "Sunrise Patient Portal", client: "Sunrise Medical", status: "active", budget: 78000, actualCost: 35000, revenue: 38000, profit: 3000, margin: 7.9, hoursEstimated: 624, hoursActual: 290, completion: 45, startDate: "2025-12-15", endDate: "2026-05-30" },
]

// ============================
// Aged Receivables (detailed)
// ============================
export const agedReceivables: AgingBucket[] = [
  { name: "Acme Corporation", current: 18500, days30: 5200, days60: 3500, days90: 0, over90: 0, total: 27200 },
  { name: "TechStart Inc", current: 12800, days30: 8400, days60: 0, days90: 0, over90: 0, total: 21200 },
  { name: "Global Services Ltd", current: 8900, days30: 0, days60: 2800, days90: 1500, over90: 0, total: 13200 },
  { name: "Enterprise Solutions", current: 6200, days30: 3800, days60: 0, days90: 0, over90: 2100, total: 12100 },
  { name: "DataFlow Systems", current: 4500, days30: 0, days60: 0, days90: 0, over90: 0, total: 4500 },
  { name: "Metro Holdings", current: 0, days30: 5600, days60: 2200, days90: 0, over90: 0, total: 7800 },
  { name: "Pacific Trading", current: 3200, days30: 0, days60: 0, days90: 1800, over90: 0, total: 5000 },
  { name: "Sunrise Medical", current: 7800, days30: 2100, days60: 0, days90: 0, over90: 0, total: 9900 },
]

// ============================
// Aged Payables (detailed)
// ============================
export const agedPayables: AgingBucket[] = [
  { name: "AWS Cloud Services", current: 12400, days30: 0, days60: 0, days90: 0, over90: 0, total: 12400 },
  { name: "Office Supplies Co", current: 3200, days30: 1925, days60: 0, days90: 0, over90: 0, total: 5125 },
  { name: "TechHire Staffing", current: 8500, days30: 4200, days60: 0, days90: 0, over90: 0, total: 12700 },
  { name: "Legal Partners LLP", current: 0, days30: 5800, days60: 2400, days90: 0, over90: 0, total: 8200 },
  { name: "Marketing Agency Pro", current: 4600, days30: 0, days60: 0, days90: 0, over90: 0, total: 4600 },
  { name: "Insurance Corp", current: 0, days30: 0, days60: 3200, days90: 0, over90: 0, total: 3200 },
  { name: "Utility Services", current: 2800, days30: 0, days60: 0, days90: 0, over90: 0, total: 2800 },
]

// ============================
// P&L Data (detailed, for the upgraded report)
// ============================
export interface PLSection {
  category: string
  items: { name: string; currentPeriod: number; priorPeriod: number; budget: number }[]
}

export const profitAndLossDetailed: PLSection[] = [
  {
    category: "Revenue",
    items: [
      { name: "Software Subscriptions", currentPeriod: 345000, priorPeriod: 278000, budget: 320000 },
      { name: "Professional Services", currentPeriod: 213000, priorPeriod: 185000, budget: 200000 },
      { name: "Support & Maintenance", currentPeriod: 68000, priorPeriod: 52000, budget: 60000 },
      { name: "Training Revenue", currentPeriod: 46500, priorPeriod: 38000, budget: 45000 },
      { name: "Other Income", currentPeriod: 12400, priorPeriod: 8000, budget: 10000 },
    ],
  },
  {
    category: "Cost of Goods Sold",
    items: [
      { name: "Cloud Infrastructure", currentPeriod: 78000, priorPeriod: 62000, budget: 72000 },
      { name: "Third-party Licenses", currentPeriod: 34000, priorPeriod: 28000, budget: 32000 },
      { name: "Direct Labor", currentPeriod: 95000, priorPeriod: 82000, budget: 90000 },
      { name: "Hosting & CDN", currentPeriod: 18000, priorPeriod: 15000, budget: 16000 },
    ],
  },
  {
    category: "Operating Expenses",
    items: [
      { name: "Salaries & Wages", currentPeriod: 185000, priorPeriod: 165000, budget: 180000 },
      { name: "Employee Benefits", currentPeriod: 42000, priorPeriod: 38000, budget: 40000 },
      { name: "Rent & Facilities", currentPeriod: 28000, priorPeriod: 28000, budget: 28000 },
      { name: "Marketing & Advertising", currentPeriod: 38000, priorPeriod: 32000, budget: 35000 },
      { name: "Software & Tools", currentPeriod: 15000, priorPeriod: 12000, budget: 14000 },
      { name: "Professional Fees", currentPeriod: 12000, priorPeriod: 10000, budget: 12000 },
      { name: "Travel & Entertainment", currentPeriod: 8500, priorPeriod: 6000, budget: 8000 },
      { name: "Depreciation", currentPeriod: 12000, priorPeriod: 10000, budget: 12000 },
      { name: "Insurance", currentPeriod: 8000, priorPeriod: 7500, budget: 8000 },
      { name: "Utilities & Telecom", currentPeriod: 5500, priorPeriod: 5000, budget: 5000 },
      { name: "Office Supplies", currentPeriod: 3200, priorPeriod: 2800, budget: 3000 },
      { name: "Miscellaneous", currentPeriod: 4800, priorPeriod: 3200, budget: 4000 },
    ],
  },
]

// ============================
// Balance Sheet (detailed)
// ============================
export interface BalanceSheetSection {
  category: string
  subcategory: string
  items: { name: string; amount: number; priorAmount: number }[]
}

export const balanceSheetDetailed: BalanceSheetSection[] = [
  {
    category: "Assets",
    subcategory: "Current Assets",
    items: [
      { name: "Cash and Cash Equivalents", amount: 291500, priorAmount: 245000 },
      { name: "Accounts Receivable", amount: 100900, priorAmount: 82000 },
      { name: "Allowance for Doubtful Accounts", amount: -5045, priorAmount: -4100 },
      { name: "Inventory", amount: 434625, priorAmount: 380000 },
      { name: "Prepaid Expenses", amount: 18000, priorAmount: 15000 },
      { name: "Short-term Investments", amount: 50000, priorAmount: 25000 },
    ],
  },
  {
    category: "Assets",
    subcategory: "Non-Current Assets",
    items: [
      { name: "Property & Equipment", amount: 185000, priorAmount: 165000 },
      { name: "Less: Accumulated Depreciation", amount: -62000, priorAmount: -50000 },
      { name: "Intangible Assets", amount: 45000, priorAmount: 45000 },
      { name: "Goodwill", amount: 30000, priorAmount: 30000 },
    ],
  },
  {
    category: "Liabilities",
    subcategory: "Current Liabilities",
    items: [
      { name: "Accounts Payable", amount: 49025, priorAmount: 42000 },
      { name: "Accrued Expenses", amount: 28000, priorAmount: 24000 },
      { name: "Deferred Revenue", amount: 65000, priorAmount: 52000 },
      { name: "Sales Tax Payable", amount: 10103, priorAmount: 8500 },
      { name: "Current Portion of Long-term Debt", amount: 24000, priorAmount: 24000 },
      { name: "Payroll Liabilities", amount: 15163, priorAmount: 12000 },
    ],
  },
  {
    category: "Liabilities",
    subcategory: "Non-Current Liabilities",
    items: [
      { name: "Long-term Debt", amount: 120000, priorAmount: 144000 },
      { name: "Deferred Tax Liability", amount: 12000, priorAmount: 10000 },
    ],
  },
  {
    category: "Equity",
    subcategory: "Stockholders' Equity",
    items: [
      { name: "Common Stock", amount: 100000, priorAmount: 100000 },
      { name: "Additional Paid-in Capital", amount: 150000, priorAmount: 150000 },
      { name: "Retained Earnings", amount: 318689, priorAmount: 178400 },
      { name: "Current Period Earnings", amount: 56000, priorAmount: 0 },
    ],
  },
]

// ============================
// Dashboard KPI Summary
// ============================
export const dashboardKPIs = {
  revenue: { value: 253000, change: 18.5, period: "YTD" },
  expenses: { value: 153000, change: 8.2, period: "YTD" },
  profit: { value: 100000, change: 32.4, period: "YTD" },
  growth: { value: 18.5, change: 3.2, period: "vs Last Year" },
  cashBalance: { value: 291500, change: 5.8, period: "Current" },
  arOutstanding: { value: 100900, change: -12.3, period: "Current" },
  apOutstanding: { value: 49025, change: 4.1, period: "Current" },
  overdueInvoices: { count: 4, amount: 12900 },
}

// ============================
// Recent Transactions (for dashboard feed)
// ============================
export interface RecentTransaction {
  id: string
  type: "invoice" | "payment" | "expense" | "transfer" | "refund"
  description: string
  amount: number
  date: string
  counterparty: string
  status: "completed" | "pending" | "failed"
  category?: string
}

export const recentTransactions: RecentTransaction[] = [
  { id: "t1", type: "payment", description: "Payment received", amount: 18500, date: "2026-02-14T10:30:00Z", counterparty: "Acme Corporation", status: "completed" },
  { id: "t2", type: "invoice", description: "Invoice sent", amount: 12800, date: "2026-02-14T09:15:00Z", counterparty: "TechStart Inc", status: "pending" },
  { id: "t3", type: "expense", description: "AWS monthly bill", amount: -4200, date: "2026-02-13T16:00:00Z", counterparty: "AWS Cloud Services", status: "completed" },
  { id: "t4", type: "payment", description: "Payment received", amount: 8900, date: "2026-02-13T14:20:00Z", counterparty: "Global Services Ltd", status: "completed" },
  { id: "t5", type: "expense", description: "Office rent", amount: -7000, date: "2026-02-13T12:00:00Z", counterparty: "Landlord Corp", status: "completed" },
  { id: "t6", type: "refund", description: "Service credit issued", amount: -1200, date: "2026-02-12T15:45:00Z", counterparty: "Pacific Trading", status: "completed" },
  { id: "t7", type: "payment", description: "Partial payment", amount: 6200, date: "2026-02-12T11:30:00Z", counterparty: "Enterprise Solutions", status: "completed" },
  { id: "t8", type: "transfer", description: "Transfer to savings", amount: -25000, date: "2026-02-12T09:00:00Z", counterparty: "Business Savings", status: "completed" },
  { id: "t9", type: "expense", description: "Software subscriptions", amount: -2800, date: "2026-02-11T14:00:00Z", counterparty: "Various SaaS", status: "completed" },
  { id: "t10", type: "payment", description: "Payment received", amount: 5600, date: "2026-02-11T10:15:00Z", counterparty: "Metro Holdings", status: "completed" },
]

// ============================
// Cash Flow Statement (detailed)
// ============================
export interface CashFlowStatementSection {
  category: string
  items: { name: string; amount: number; priorAmount: number }[]
}

export const cashFlowStatementDetailed: CashFlowStatementSection[] = [
  {
    category: "Operating Activities",
    items: [
      { name: "Net Income", amount: 56000, priorAmount: 42650 },
      { name: "Depreciation & Amortization", amount: 12000, priorAmount: 10000 },
      { name: "Changes in Accounts Receivable", amount: -18900, priorAmount: -8500 },
      { name: "Changes in Inventory", amount: -54625, priorAmount: -3000 },
      { name: "Changes in Prepaid Expenses", amount: -3000, priorAmount: -1500 },
      { name: "Changes in Accounts Payable", amount: 7025, priorAmount: 2500 },
      { name: "Changes in Accrued Expenses", amount: 4000, priorAmount: 1800 },
      { name: "Changes in Deferred Revenue", amount: 13000, priorAmount: 8000 },
    ],
  },
  {
    category: "Investing Activities",
    items: [
      { name: "Purchase of Equipment", amount: -20000, priorAmount: -15000 },
      { name: "Purchase of Short-term Investments", amount: -25000, priorAmount: 0 },
      { name: "Proceeds from Asset Sales", amount: 5000, priorAmount: 0 },
    ],
  },
  {
    category: "Financing Activities",
    items: [
      { name: "Loan Repayments", amount: -24000, priorAmount: -5000 },
      { name: "Owner Distributions", amount: -15000, priorAmount: -10000 },
      { name: "Capital Contributions", amount: 0, priorAmount: 0 },
    ],
  },
]

// ============================
// Report Builder Data Sources
// ============================
export interface DataSourceField {
  name: string
  type: "string" | "number" | "date" | "boolean"
  label: string
}

export interface DataSource {
  id: string
  name: string
  description: string
  icon: string
  fields: DataSourceField[]
  recordCount: number
}

export const reportDataSources: DataSource[] = [
  {
    id: "invoices",
    name: "Invoices",
    description: "All customer invoices and payments",
    icon: "FileText",
    recordCount: 1247,
    fields: [
      { name: "invoiceNumber", type: "string", label: "Invoice #" },
      { name: "customerName", type: "string", label: "Customer" },
      { name: "issueDate", type: "date", label: "Issue Date" },
      { name: "dueDate", type: "date", label: "Due Date" },
      { name: "total", type: "number", label: "Total Amount" },
      { name: "amountPaid", type: "number", label: "Amount Paid" },
      { name: "amountDue", type: "number", label: "Amount Due" },
      { name: "status", type: "string", label: "Status" },
    ],
  },
  {
    id: "sales",
    name: "Sales Orders",
    description: "Sales orders and line items",
    icon: "ShoppingCart",
    recordCount: 856,
    fields: [
      { name: "orderNumber", type: "string", label: "Order #" },
      { name: "customerName", type: "string", label: "Customer" },
      { name: "orderDate", type: "date", label: "Order Date" },
      { name: "product", type: "string", label: "Product" },
      { name: "quantity", type: "number", label: "Quantity" },
      { name: "unitPrice", type: "number", label: "Unit Price" },
      { name: "total", type: "number", label: "Total" },
      { name: "region", type: "string", label: "Region" },
    ],
  },
  {
    id: "expenses",
    name: "Expenses",
    description: "All business expenses and bills",
    icon: "Receipt",
    recordCount: 2341,
    fields: [
      { name: "expenseDate", type: "date", label: "Date" },
      { name: "vendor", type: "string", label: "Vendor" },
      { name: "category", type: "string", label: "Category" },
      { name: "amount", type: "number", label: "Amount" },
      { name: "department", type: "string", label: "Department" },
      { name: "approved", type: "boolean", label: "Approved" },
    ],
  },
  {
    id: "inventory",
    name: "Inventory",
    description: "Product inventory and stock levels",
    icon: "Package",
    recordCount: 432,
    fields: [
      { name: "sku", type: "string", label: "SKU" },
      { name: "productName", type: "string", label: "Product Name" },
      { name: "category", type: "string", label: "Category" },
      { name: "quantity", type: "number", label: "Quantity" },
      { name: "unitCost", type: "number", label: "Unit Cost" },
      { name: "totalValue", type: "number", label: "Total Value" },
      { name: "reorderPoint", type: "number", label: "Reorder Point" },
    ],
  },
  {
    id: "employees",
    name: "Employees",
    description: "Employee records and payroll",
    icon: "Users",
    recordCount: 48,
    fields: [
      { name: "employeeName", type: "string", label: "Name" },
      { name: "department", type: "string", label: "Department" },
      { name: "position", type: "string", label: "Position" },
      { name: "salary", type: "number", label: "Salary" },
      { name: "hireDate", type: "date", label: "Hire Date" },
      { name: "isActive", type: "boolean", label: "Active" },
    ],
  },
  {
    id: "projects",
    name: "Projects",
    description: "Project tracking and profitability",
    icon: "FolderKanban",
    recordCount: 24,
    fields: [
      { name: "projectName", type: "string", label: "Project" },
      { name: "client", type: "string", label: "Client" },
      { name: "budget", type: "number", label: "Budget" },
      { name: "actualCost", type: "number", label: "Actual Cost" },
      { name: "revenue", type: "number", label: "Revenue" },
      { name: "status", type: "string", label: "Status" },
      { name: "completion", type: "number", label: "Completion %" },
      { name: "startDate", type: "date", label: "Start Date" },
    ],
  },
]

// Saved custom reports
export interface SavedReport {
  id: string
  name: string
  description: string
  dataSource: string
  columns: string[]
  filters: { field: string; operator: string; value: string }[]
  groupBy: string | null
  sortBy: string | null
  sortOrder: "asc" | "desc"
  createdAt: string
  lastRun: string
  schedule: string | null
}

export const savedReports: SavedReport[] = [
  {
    id: "sr1",
    name: "Monthly Revenue by Customer",
    description: "Shows revenue breakdown per customer for the current month",
    dataSource: "invoices",
    columns: ["customerName", "total", "amountPaid", "status"],
    filters: [{ field: "status", operator: "in", value: "paid,sent" }],
    groupBy: "customerName",
    sortBy: "total",
    sortOrder: "desc",
    createdAt: "2026-01-15",
    lastRun: "2026-02-14",
    schedule: "monthly",
  },
  {
    id: "sr2",
    name: "Overdue Invoices Alert",
    description: "Lists all invoices past their due date",
    dataSource: "invoices",
    columns: ["invoiceNumber", "customerName", "dueDate", "amountDue"],
    filters: [{ field: "status", operator: "equals", value: "overdue" }],
    groupBy: null,
    sortBy: "dueDate",
    sortOrder: "asc",
    createdAt: "2026-01-20",
    lastRun: "2026-02-14",
    schedule: "weekly",
  },
  {
    id: "sr3",
    name: "Department Cost Analysis",
    description: "Employee costs grouped by department",
    dataSource: "employees",
    columns: ["department", "salary", "employeeName"],
    filters: [{ field: "isActive", operator: "equals", value: "true" }],
    groupBy: "department",
    sortBy: "salary",
    sortOrder: "desc",
    createdAt: "2026-02-01",
    lastRun: "2026-02-10",
    schedule: null,
  },
]
