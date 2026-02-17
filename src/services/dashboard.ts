import { createClient } from '@/lib/supabase/client'

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
  totalRevenue: number
  revenueChange: number
  outstandingInvoices: number
  outstandingAmount: number
  overdueCount: number
  overdueAmount: number
  totalOrders: number
  pendingOrders: number
  totalProducts: number
  lowStockCount: number
  totalCustomers: number
  totalVendors: number
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
// SERVICE
// ============================================================================

export const dashboardService = {
  async getStats(organizationId: string): Promise<DashboardStats> {
    const supabase = createClient()

    try {
      const [invoices, orders, products, contacts] = await Promise.all([
        supabase.from('invoices').select('total, amount_paid, amount_due, status').eq('organization_id', organizationId),
        supabase.from('sales_orders').select('total, status').eq('organization_id', organizationId),
        supabase.from('products').select('id, stock_quantity, reorder_level').eq('organization_id', organizationId).eq('is_active', true),
        supabase.from('contacts').select('id, is_customer, is_vendor').eq('organization_id', organizationId).eq('is_active', true),
      ])

      const invoiceData = invoices.data || []
      const orderData = orders.data || []
      const productData = products.data || []
      const contactData = contacts.data || []

      const paidInvoices = invoiceData.filter(i => i.status === 'paid')
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0)
      const outstanding = invoiceData.filter(i => (i.amount_due || 0) > 0)
      const overdue = invoiceData.filter(i => i.status === 'overdue')
      const pendingOrders = orderData.filter(o => ['draft', 'confirmed', 'processing'].includes(o.status))
      const lowStock = productData.filter(p => (p.stock_quantity || 0) <= (p.reorder_level || 0))

      return {
        totalRevenue,
        revenueChange: 0,
        outstandingInvoices: outstanding.length,
        outstandingAmount: outstanding.reduce((sum, i) => sum + (i.amount_due || 0), 0),
        overdueCount: overdue.length,
        overdueAmount: overdue.reduce((sum, i) => sum + (i.amount_due || 0), 0),
        totalOrders: orderData.length,
        pendingOrders: pendingOrders.length,
        totalProducts: productData.length,
        lowStockCount: lowStock.length,
        totalCustomers: contactData.filter(c => c.is_customer).length,
        totalVendors: contactData.filter(c => c.is_vendor).length,
        cashBalance: 0,
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        totalRevenue: 0, revenueChange: 0, outstandingInvoices: 0, outstandingAmount: 0,
        overdueCount: 0, overdueAmount: 0, totalOrders: 0, pendingOrders: 0,
        totalProducts: 0, lowStockCount: 0, totalCustomers: 0, totalVendors: 0, cashBalance: 0,
      }
    }
  },

  async getRecentInvoices(organizationId: string, limit = 5): Promise<RecentInvoice[]> {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, contact_id, total, amount_due, status, due_date, contact:contacts(display_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(row => ({
        id: row.id,
        invoiceNumber: row.invoice_number,
        customerName: (row.contact as any)?.display_name || 'Unknown',
        total: row.total,
        amountDue: row.amount_due || 0,
        status: row.status,
        dueDate: row.due_date,
      }))
    } catch (error) {
      console.error('Error fetching recent invoices:', error)
      return []
    }
  },

  async getRecentOrders(organizationId: string, limit = 5): Promise<RecentOrder[]> {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('id, order_number, contact_id, total, status, order_date, contact:contacts(display_name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(row => ({
        id: row.id,
        orderNumber: row.order_number,
        customerName: (row.contact as any)?.display_name || 'Unknown',
        total: row.total,
        status: row.status,
        orderDate: row.order_date,
      }))
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      return []
    }
  },

  async getRecentActivity(organizationId: string, limit = 10): Promise<RecentActivity[]> {
    // TODO: Implement activity log from audit_logs table
    return []
  },
}

export default dashboardService
