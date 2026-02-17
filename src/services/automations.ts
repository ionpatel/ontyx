// Business Automation Engine
// Connects all Ontyx modules with smart triggers, workflows, and scheduled actions

import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ============================================================================
// AUTOMATION TYPES
// ============================================================================

export type AutomationTrigger = 
  | 'invoice_created' | 'invoice_overdue' | 'invoice_paid'
  | 'sales_order_confirmed' | 'sales_order_shipped'
  | 'purchase_order_created' | 'purchase_order_received'
  | 'stock_low' | 'stock_out'
  | 'contact_created' | 'contact_updated'
  | 'employee_hired' | 'employee_terminated'
  | 'leave_requested' | 'leave_approved' | 'leave_rejected'
  | 'ticket_created' | 'ticket_resolved'
  | 'appointment_scheduled' | 'appointment_reminder'
  | 'payment_received' | 'payment_failed'
  | 'subscription_created' | 'subscription_cancelled' | 'subscription_expiring'
  | 'quality_check_failed'
  | 'approval_needed' | 'approval_completed';

export type AutomationAction =
  | 'send_email' | 'send_notification'
  | 'create_invoice' | 'create_task' | 'create_ticket'
  | 'update_record' | 'create_record'
  | 'deduct_inventory' | 'create_purchase_order'
  | 'schedule_followup' | 'assign_to_user'
  | 'webhook' | 'custom_function';

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditions?: Record<string, any>;
  actions: {
    type: AutomationAction;
    config: Record<string, any>;
  }[];
  enabled: boolean;
}

// ============================================================================
// CROSS-MODULE LINKS (Smart References)
// ============================================================================

export async function getContactRelatedRecords(organizationId: string, contactId: string) {
  const [invoices, salesOrders, tickets, appointments, subscriptions] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, total, status, issue_date')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('issue_date', { ascending: false })
      .limit(10),
    supabase
      .from('sales_orders')
      .select('id, order_number, total, status, order_date')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('order_date', { ascending: false })
      .limit(10),
    supabase
      .from('helpdesk_tickets')
      .select('id, ticket_number, subject, status, priority, created_at')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('appointments')
      .select('id, title, start_time, status')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .order('start_time', { ascending: false })
      .limit(10),
    supabase
      .from('subscriptions')
      .select('id, status, start_date, plan:subscription_plans(name, price)')
      .eq('organization_id', organizationId)
      .eq('contact_id', contactId)
      .limit(5),
  ]);

  return {
    invoices: invoices.data || [],
    salesOrders: salesOrders.data || [],
    tickets: tickets.data || [],
    appointments: appointments.data || [],
    subscriptions: subscriptions.data || [],
    summary: {
      totalInvoiced: invoices.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0,
      openTickets: tickets.data?.filter(t => t.status !== 'closed').length || 0,
      activeSubscriptions: subscriptions.data?.filter(s => s.status === 'active').length || 0,
    }
  };
}

export async function getEmployeeRelatedRecords(organizationId: string, employeeId: string) {
  const [payslips, leaveRequests, appraisals, tickets] = await Promise.all([
    supabase
      .from('payslips')
      .select('id, pay_period_start, pay_period_end, gross_pay, net_pay, status')
      .eq('employee_id', employeeId)
      .order('pay_period_end', { ascending: false })
      .limit(12),
    supabase
      .from('leave_requests')
      .select('id, start_date, end_date, days_requested, status, leave_type:leave_types(name)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('appraisals')
      .select('id, review_period_start, review_period_end, overall_rating, status')
      .eq('employee_id', employeeId)
      .order('review_period_end', { ascending: false })
      .limit(5),
    supabase
      .from('helpdesk_tickets')
      .select('id, ticket_number, subject, status, created_at')
      .eq('organization_id', organizationId)
      .eq('assigned_to', employeeId)
      .eq('status', 'open')
      .limit(10),
  ]);

  return {
    payslips: payslips.data || [],
    leaveRequests: leaveRequests.data || [],
    appraisals: appraisals.data || [],
    assignedTickets: tickets.data || [],
    summary: {
      ytdEarnings: payslips.data?.reduce((sum, p) => sum + (p.gross_pay || 0), 0) || 0,
      pendingLeave: leaveRequests.data?.filter(l => l.status === 'pending').length || 0,
      lastRating: appraisals.data?.[0]?.overall_rating || null,
    }
  };
}

export async function getProductRelatedRecords(organizationId: string, productId: string) {
  const [stockLevels, salesHistory, purchaseHistory, qualityChecks] = await Promise.all([
    supabase
      .from('inventory_levels')
      .select('id, quantity, warehouse:warehouses(name)')
      .eq('product_id', productId),
    supabase
      .from('sales_order_items')
      .select('quantity, unit_price, sales_order:sales_orders(order_number, order_date, contact:contacts(name))')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('purchase_order_items')
      .select('quantity, unit_price, purchase_order:purchase_orders(po_number, order_date, vendor:contacts(name))')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('quality_checks')
      .select('id, check_number, status, inspection_date')
      .eq('product_id', productId)
      .order('inspection_date', { ascending: false })
      .limit(10),
  ]);

  const totalStock = stockLevels.data?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;

  return {
    stockLevels: stockLevels.data || [],
    salesHistory: salesHistory.data || [],
    purchaseHistory: purchaseHistory.data || [],
    qualityChecks: qualityChecks.data || [],
    summary: {
      totalStock,
      totalSold: salesHistory.data?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0,
      avgSalePrice: salesHistory.data?.length 
        ? salesHistory.data.reduce((sum, s) => sum + (s.unit_price || 0), 0) / salesHistory.data.length 
        : 0,
      qualityPassRate: qualityChecks.data?.length
        ? (qualityChecks.data.filter(q => q.status === 'passed').length / qualityChecks.data.length) * 100
        : 100,
    }
  };
}

// ============================================================================
// AUTOMATED WORKFLOWS
// ============================================================================

export async function convertSalesOrderToInvoice(organizationId: string, salesOrderId: string) {
  // Get sales order with items
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(`
      *,
      items:sales_order_items(*),
      contact:contacts(id, name, email)
    `)
    .eq('id', salesOrderId)
    .single();

  if (orderError || !order) throw new Error('Sales order not found');

  // Generate invoice number
  const { data: invNum } = await supabase.rpc('generate_invoice_number', { org_id: organizationId });

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      organization_id: organizationId,
      invoice_number: invNum || `INV-${Date.now()}`,
      contact_id: order.contact_id,
      sales_order_id: salesOrderId,
      issue_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Net 30
      subtotal: order.subtotal,
      tax_amount: order.tax_amount,
      total: order.total,
      amount_due: order.total,
      status: 'draft',
      notes: `Generated from Sales Order ${order.order_number}`,
    })
    .select()
    .single();

  if (invoiceError) throw invoiceError;

  // Create invoice items
  const invoiceItems = order.items.map((item: any, index: number) => ({
    invoice_id: invoice.id,
    product_id: item.product_id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    line_total: item.line_total,
    line_number: index + 1,
  }));

  await supabase.from('invoice_items').insert(invoiceItems);

  // Update sales order status
  await supabase
    .from('sales_orders')
    .update({ status: 'invoiced', invoice_id: invoice.id })
    .eq('id', salesOrderId);

  return invoice;
}

export async function processLeaveApproval(leaveRequestId: string, approved: boolean, reviewerId: string, notes?: string) {
  const { data: request, error } = await supabase
    .from('leave_requests')
    .select('*, employee:employees(id, first_name, last_name, email)')
    .eq('id', leaveRequestId)
    .single();

  if (error || !request) throw new Error('Leave request not found');

  // Update request status
  await supabase
    .from('leave_requests')
    .update({
      status: approved ? 'approved' : 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
    })
    .eq('id', leaveRequestId);

  // If approved, update leave balance
  if (approved) {
    const year = new Date(request.start_date).getFullYear();
    
    await supabase.rpc('update_leave_balance', {
      p_employee_id: request.employee_id,
      p_leave_type_id: request.leave_type_id,
      p_year: year,
      p_days_used: request.days_requested,
    });
  }

  return { success: true, approved };
}

export async function autoDeductInventory(organizationId: string, salesOrderId: string) {
  const { data: items } = await supabase
    .from('sales_order_items')
    .select('product_id, quantity')
    .eq('sales_order_id', salesOrderId);

  if (!items?.length) return;

  for (const item of items) {
    // Get default warehouse
    const { data: level } = await supabase
      .from('inventory_levels')
      .select('id, quantity')
      .eq('product_id', item.product_id)
      .gt('quantity', 0)
      .order('quantity', { ascending: false })
      .limit(1)
      .single();

    if (level) {
      await supabase
        .from('inventory_levels')
        .update({ quantity: level.quantity - item.quantity })
        .eq('id', level.id);

      // Log the movement
      await supabase.from('inventory_movements').insert({
        organization_id: organizationId,
        product_id: item.product_id,
        movement_type: 'out',
        quantity: item.quantity,
        reference_type: 'sales_order',
        reference_id: salesOrderId,
        notes: 'Auto-deducted from sales order',
      });
    }
  }
}

export async function createLowStockPurchaseOrder(organizationId: string, productId: string, vendorId: string) {
  const { data: product } = await supabase
    .from('products')
    .select('*, supplier_id')
    .eq('id', productId)
    .single();

  if (!product) throw new Error('Product not found');

  const reorderQty = product.reorder_quantity || 100;

  // Generate PO number
  const { data: poNum } = await supabase.rpc('generate_po_number', { org_id: organizationId });

  const { data: po } = await supabase
    .from('purchase_orders')
    .insert({
      organization_id: organizationId,
      po_number: poNum || `PO-${Date.now()}`,
      vendor_id: vendorId || product.supplier_id,
      order_date: new Date().toISOString(),
      expected_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      subtotal: reorderQty * (product.cost_price || 0),
      total: reorderQty * (product.cost_price || 0),
      status: 'draft',
      notes: `Auto-generated due to low stock alert`,
    })
    .select()
    .single();

  if (po) {
    await supabase.from('purchase_order_items').insert({
      purchase_order_id: po.id,
      product_id: productId,
      description: product.name,
      quantity: reorderQty,
      unit_price: product.cost_price || 0,
      line_total: reorderQty * (product.cost_price || 0),
    });
  }

  return po;
}

// ============================================================================
// SCHEDULED AUTOMATIONS (Call these from cron/scheduled functions)
// ============================================================================

export async function checkOverdueInvoices(organizationId: string) {
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, contact:contacts(name, email), total, due_date')
    .eq('organization_id', organizationId)
    .in('status', ['sent', 'viewed'])
    .lt('due_date', new Date().toISOString());

  // Update status to overdue
  if (overdueInvoices?.length) {
    const ids = overdueInvoices.map(inv => inv.id);
    await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .in('id', ids);
  }

  return overdueInvoices || [];
}

export async function checkLowStockProducts(organizationId: string) {
  const { data: lowStock } = await supabase
    .from('products')
    .select(`
      id, name, sku, reorder_point,
      stock:inventory_levels(quantity)
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  const alerts = lowStock?.filter(product => {
    const totalStock = product.stock?.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0) || 0;
    return totalStock <= (product.reorder_point || 10);
  }) || [];

  return alerts;
}

export async function processRecurringInvoices(organizationId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data: dueRecurring } = await supabase
    .from('recurring_invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .lte('next_invoice_date', today);

  const created = [];
  
  for (const recurring of dueRecurring || []) {
    // Create invoice from recurring template
    const { data: invNum } = await supabase.rpc('generate_invoice_number', { org_id: organizationId });
    
    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        organization_id: organizationId,
        invoice_number: invNum,
        contact_id: recurring.contact_id,
        issue_date: today,
        due_date: new Date(Date.now() + (recurring.payment_terms || 30) * 24 * 60 * 60 * 1000).toISOString(),
        subtotal: recurring.amount,
        tax_amount: recurring.tax_amount || 0,
        total: recurring.amount + (recurring.tax_amount || 0),
        amount_due: recurring.amount + (recurring.tax_amount || 0),
        status: 'draft',
        notes: `Auto-generated from recurring invoice`,
      })
      .select()
      .single();

    if (invoice) {
      created.push(invoice);

      // Calculate next invoice date
      let nextDate = new Date(recurring.next_invoice_date);
      switch (recurring.frequency) {
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'biweekly': nextDate.setDate(nextDate.getDate() + 14); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      // Update recurring record
      await supabase
        .from('recurring_invoices')
        .update({
          next_invoice_date: nextDate.toISOString().split('T')[0],
          last_generated: today,
          times_generated: (recurring.times_generated || 0) + 1,
        })
        .eq('id', recurring.id);
    }
  }

  return created;
}

export async function checkExpiringSubscriptions(organizationId: string, daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data: expiring } = await supabase
    .from('subscriptions')
    .select('*, contact:contacts(name, email), plan:subscription_plans(name)')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .lte('end_date', futureDate.toISOString())
    .gt('end_date', new Date().toISOString());

  return expiring || [];
}

export async function checkPendingApprovals(organizationId: string) {
  const { data: pending } = await supabase
    .from('approval_requests')
    .select(`
      *,
      current_step:approval_steps!current_step_id(approver:employees(first_name, last_name, email))
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  return pending || [];
}

// ============================================================================
// DASHBOARD INSIGHTS
// ============================================================================

export async function getBusinessInsights(organizationId: string) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const [
    overdueInvoices,
    lowStockProducts,
    pendingApprovals,
    openTickets,
    upcomingAppointments,
    pendingLeaveRequests,
    expiringSubscriptions,
    monthlyRevenue,
  ] = await Promise.all([
    checkOverdueInvoices(organizationId),
    checkLowStockProducts(organizationId),
    checkPendingApprovals(organizationId),
    supabase
      .from('helpdesk_tickets')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .in('status', ['open', 'in_progress']),
    supabase
      .from('appointments')
      .select('id, title, start_time, contact:contacts(name)')
      .eq('organization_id', organizationId)
      .gte('start_time', today.toISOString())
      .lte('start_time', new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('start_time')
      .limit(5),
    supabase
      .from('leave_requests')
      .select('id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('status', 'pending'),
    checkExpiringSubscriptions(organizationId),
    supabase
      .from('invoices')
      .select('total')
      .eq('organization_id', organizationId)
      .eq('status', 'paid')
      .gte('paid_at', startOfMonth.toISOString()),
  ]);

  return {
    alerts: {
      overdueInvoices: overdueInvoices.length,
      lowStockProducts: lowStockProducts.length,
      pendingApprovals: pendingApprovals.length,
      openTickets: openTickets.count || 0,
      pendingLeaveRequests: pendingLeaveRequests.count || 0,
      expiringSubscriptions: expiringSubscriptions.length,
    },
    upcoming: {
      appointments: upcomingAppointments.data || [],
    },
    metrics: {
      monthlyRevenue: monthlyRevenue.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0,
    },
    details: {
      overdueInvoices,
      lowStockProducts,
      expiringSubscriptions,
    }
  };
}
