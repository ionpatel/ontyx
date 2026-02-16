import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
  // Revenue
  totalRevenue: number
  revenueChange: number // percentage
  
  // Invoices
  outstandingInvoices: number
  outstandingAmount: number
  overdueCount: number
  overdueAmount: number
  
  // Sales
  totalOrders: number
  pendingOrders: number
  
  // Inventory
  totalProducts: number
  lowStockCount: number
  
  // Contacts
  totalCustomers: number
  totalVendors: number
  
  // Cash
  cashBalance: number
}

export interface RecentActivity {
  id: string
  type: 'invoice' | 'payment' | 'order' | 'customer' | 'product'
  title: string
  description: string
  amount?: number
  status?: string
  createdAt: string
}

export interface RecentInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  total: number
  amountDue: number
  status: string
  dueDate: string
}

export interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  orderDate: string
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoStats: DashboardStats = {
  totalRevenue: 125750.00,
  revenueChange: 12.5,
  outstandingInvoices: 8,
  outstandingAmount: 15420.00,
  overdueCount: 2,
  overdueAmount: 3250.00,
  totalOrders: 45,
  pendingOrders: 7,
  totalProducts: 156,
  lowStockCount: 12,
  totalCustomers: 89,
  totalVendors: 23,
  cashBalance: 48500.00,
}

const demoRecentInvoices: RecentInvoice[] = [
  { id: '1', invoiceNumber: 'INV-2024-0045', customerName: 'Maple Leaf Pharmacy', total: 2450.00, amountDue: 2450.00, status: 'sent', dueDate: '2024-02-28' },
  { id: '2', invoiceNumber: 'INV-2024-0044', customerName: 'Northern Health Clinic', total: 1890.50, amountDue: 0, status: 'paid', dueDate: '2024-02-20' },
  { id: '3', invoiceNumber: 'INV-2024-0043', customerName: 'PharmaCare Distribution', total: 5200.00, amountDue: 2600.00, status: 'partial', dueDate: '2024-02-25' },
  { id: '4', invoiceNumber: 'INV-2024-0042', customerName: 'City Medical Center', total: 3100.00, amountDue: 3100.00, status: 'overdue', dueDate: '2024-02-10' },
  { id: '5', invoiceNumber: 'INV-2024-0041', customerName: 'Wellness Plus Pharmacy', total: 980.00, amountDue: 0, status: 'paid', dueDate: '2024-02-15' },
]

const demoRecentOrders: RecentOrder[] = [
  { id: '1', orderNumber: 'SO-2024-0032', customerName: 'Maple Leaf Pharmacy', total: 3200.00, status: 'confirmed', orderDate: '2024-02-14' },
  { id: '2', orderNumber: 'SO-2024-0031', customerName: 'Northern Health Clinic', total: 1540.00, status: 'shipped', orderDate: '2024-02-13' },
  { id: '3', orderNumber: 'SO-2024-0030', customerName: 'PharmaCare Distribution', total: 8900.00, status: 'processing', orderDate: '2024-02-12' },
]

const demoActivity: RecentActivity[] = [
  { id: '1', type: 'payment', title: 'Payment received', description: 'Northern Health Clinic paid INV-2024-0044', amount: 1890.50, status: 'success', createdAt: '2024-02-14T14:30:00Z' },
  { id: '2', type: 'invoice', title: 'Invoice sent', description: 'INV-2024-0045 sent to Maple Leaf Pharmacy', amount: 2450.00, createdAt: '2024-02-14T11:00:00Z' },
  { id: '3', type: 'order', title: 'New order', description: 'SO-2024-0032 from Maple Leaf Pharmacy', amount: 3200.00, status: 'new', createdAt: '2024-02-14T09:15:00Z' },
  { id: '4', type: 'customer', title: 'New customer', description: 'Wellness Plus Pharmacy signed up', createdAt: '2024-02-13T16:45:00Z' },
  { id: '5', type: 'invoice', title: 'Invoice overdue', description: 'INV-2024-0042 is now overdue', amount: 3100.00, status: 'warning', createdAt: '2024-02-11T00:00:00Z' },
]

// ============================================================================
// SERVICE
// ============================================================================

export const dashboardService = {
  async getStats(organizationId: string): Promise<DashboardStats> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      return demoStats
    }

    try {
      // Fetch all stats in parallel
      const [invoices, orders, products, contacts] = await Promise.all([
        supabase.from('invoices').select('total, amount_paid, balance_due, status').eq('organization_id', organizationId),
        supabase.from('sales_orders').select('total, status').eq('organization_id', organizationId),
        supabase.from('products').select('id, stock_quantity, reorder_level').eq('organization_id', organizationId).eq('is_active', true),
        supabase.from('contacts').select('id, is_customer, is_vendor').eq('organization_id', organizationId).eq('is_active', true),
      ])

      const invoiceData = invoices.data || []
      const orderData = orders.data || []
      const productData = products.data || []
      const contactData = contacts.data || []

      // Calculate stats
      const paidInvoices = invoiceData.filter(i => i.status === 'paid')
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0)
      const outstanding = invoiceData.filter(i => (i.balance_due || 0) > 0)
      const overdue = invoiceData.filter(i => i.status === 'overdue')
      const pendingOrders = orderData.filter(o => ['draft', 'confirmed', 'processing'].includes(o.status))
      const lowStock = productData.filter(p => (p.stock_quantity || 0) <= (p.reorder_level || 0))

      return {
        totalRevenue,
        revenueChange: 0, // Would need historical data to calculate
        outstandingInvoices: outstanding.length,
        outstandingAmount: outstanding.reduce((sum, i) => sum + (i.balance_due || 0), 0),
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, i) => sum + (i.balance_due || 0), 0),
        totalOrders: orderData.length,
        pendingOrders: pendingOrders.length,
        totalProducts: productData.length,
        lowStockCount: lowStock.length,
        totalCustomers: contactData.filter(c => c.is_customer).length,
        totalVendors: contactData.filter(c => c.is_vendor).length,
        cashBalance: 0, // Would need bank accounts
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return demoStats
    }
  },

  async getRecentInvoices(organizationId: string, limit = 5): Promise<RecentInvoice[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      return demoRecentInvoices.slice(0, limit)
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, contact_id, total, balance_due, status, due_date, contacts!invoices_contact_id_fkey(display_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(row => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        customerName: (row.contacts as any)?.display_name || 'Unknown',
        total: row.total,
        amountDue: row.balance_due || 0,
        status: row.status,
        dueDate: row.due_date,
      }))
    } catch (error) {
      console.error('Error fetching recent invoices:', error)
      return demoRecentInvoices.slice(0, limit)
    }
  },

  async getRecentOrders(organizationId: string, limit = 5): Promise<RecentOrder[]> {
    const supabase = createClient()
    
    if (!supabase || !isSupabaseConfigured()) {
      return demoRecentOrders.slice(0, limit)
    }

    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('id, order_number, customer_id, total, status, order_date, contacts!sales_orders_customer_id_fkey(display_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(row => ({
        id: row.id,
        orderNumber: row.order_number,
        customerName: (row.contacts as any)?.display_name || 'Unknown',
        total: row.total,
        status: row.status,
        orderDate: row.order_date,
      }))
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      return demoRecentOrders.slice(0, limit)
    }
  },

  async getRecentActivity(organizationId: string, limit = 10): Promise<RecentActivity[]> {
    // For now, return demo data
    // In production, this would aggregate from audit_logs or activity table
    return demoActivity.slice(0, limit)
  },
}

export default dashboardService
