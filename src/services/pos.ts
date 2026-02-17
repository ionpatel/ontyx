// POS (Point of Sale) Service
import { createClient } from '@/lib/supabase/client';
import type {
  POSSession,
  POSTransaction,
  POSTransactionItem,
  POSPayment,
  POSCashMovement,
  CreatePOSSessionInput,
  ClosePOSSessionInput,
  CreatePOSTransactionInput,
  POSCashMovementInput,
  POSSessionSummary,
  POSDailySummary,
} from '@/types/pos';

const supabase = createClient();

// ============ Sessions ============

export async function getOpenSession(organizationId: string): Promise<POSSession | null> {
  const { data, error } = await supabase
    .from('pos_sessions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getSessions(
  organizationId: string,
  options?: { limit?: number; offset?: number; status?: 'open' | 'closed' }
): Promise<{ sessions: POSSession[]; count: number }> {
  let query = supabase
    .from('pos_sessions')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('opened_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { sessions: data || [], count: count || 0 };
}

export async function getSession(sessionId: string): Promise<POSSession | null> {
  const { data, error } = await supabase
    .from('pos_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function openSession(
  organizationId: string,
  userId: string,
  input: CreatePOSSessionInput
): Promise<POSSession> {
  // Check if there's already an open session
  const existingOpen = await getOpenSession(organizationId);
  if (existingOpen) {
    throw new Error('There is already an open session. Please close it first.');
  }

  // Generate session number
  const { data: sessionNum } = await supabase.rpc('generate_pos_session_number', {
    org_id: organizationId,
  });

  const { data, error } = await supabase
    .from('pos_sessions')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      session_number: sessionNum || `SES-${Date.now()}`,
      register_name: input.register_name || 'Register 1',
      opening_cash: input.opening_cash,
      opening_notes: input.opening_notes,
      status: 'open',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function closeSession(
  sessionId: string,
  input: ClosePOSSessionInput
): Promise<POSSession> {
  // Calculate expected cash
  const summary = await getSessionSummary(sessionId);
  const session = await getSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Get cash movements
  const { data: movements } = await supabase
    .from('pos_cash_movements')
    .select('movement_type, amount')
    .eq('session_id', sessionId);

  let cashMovementsNet = 0;
  movements?.forEach((m) => {
    cashMovementsNet += m.movement_type === 'in' ? m.amount : -m.amount;
  });

  const expectedCash = session.opening_cash + summary.cash_sales + cashMovementsNet;
  const cashDifference = input.closing_cash - expectedCash;

  const { data, error } = await supabase
    .from('pos_sessions')
    .update({
      status: 'closed',
      closing_cash: input.closing_cash,
      expected_cash: expectedCash,
      cash_difference: cashDifference,
      closing_notes: input.closing_notes,
      closed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionSummary(sessionId: string): Promise<POSSessionSummary> {
  // Get all completed transactions for this session
  const { data: transactions, error } = await supabase
    .from('pos_transactions')
    .select(`
      *,
      items:pos_transaction_items(*),
      payments:pos_payments(*)
    `)
    .eq('session_id', sessionId);

  if (error) throw error;

  let summary: POSSessionSummary = {
    total_transactions: 0,
    total_sales: 0,
    total_refunds: 0,
    net_sales: 0,
    cash_sales: 0,
    card_sales: 0,
    other_sales: 0,
    total_tax: 0,
    total_discounts: 0,
    items_sold: 0,
    average_transaction: 0,
  };

  transactions?.forEach((tx) => {
    if (tx.status === 'voided') return;

    summary.total_transactions++;

    if (tx.status === 'refunded') {
      summary.total_refunds += tx.total;
    } else {
      summary.total_sales += tx.total;
    }

    summary.total_tax += tx.tax_amount;
    summary.total_discounts += tx.discount_amount;

    // Count items
    tx.items?.forEach((item: POSTransactionItem) => {
      summary.items_sold += item.quantity;
    });

    // Sum by payment method
    tx.payments?.forEach((payment: POSPayment) => {
      if (payment.payment_method === 'cash') {
        summary.cash_sales += payment.amount;
      } else if (['debit', 'credit', 'interac'].includes(payment.payment_method)) {
        summary.card_sales += payment.amount;
      } else {
        summary.other_sales += payment.amount;
      }
    });
  });

  summary.net_sales = summary.total_sales - summary.total_refunds;
  summary.average_transaction =
    summary.total_transactions > 0 ? summary.net_sales / summary.total_transactions : 0;

  return summary;
}

// ============ Transactions ============

export async function getTransactions(
  organizationId: string,
  options?: {
    sessionId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ transactions: POSTransaction[]; count: number }> {
  let query = supabase
    .from('pos_transactions')
    .select(
      `
      *,
      items:pos_transaction_items(*),
      payments:pos_payments(*)
    `,
      { count: 'exact' }
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (options?.sessionId) {
    query = query.eq('session_id', options.sessionId);
  }
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  if (options?.endDate) {
    query = query.lte('created_at', options.endDate);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { transactions: data || [], count: count || 0 };
}

export async function getTransaction(transactionId: string): Promise<POSTransaction | null> {
  const { data, error } = await supabase
    .from('pos_transactions')
    .select(
      `
      *,
      items:pos_transaction_items(*),
      payments:pos_payments(*),
      customer:contacts(id, name, email)
    `
    )
    .eq('id', transactionId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createTransaction(
  organizationId: string,
  input: CreatePOSTransactionInput
): Promise<POSTransaction> {
  // Generate transaction number
  const { data: txNum } = await supabase.rpc('generate_pos_transaction_number', {
    org_id: organizationId,
  });

  // Calculate totals
  let subtotal = 0;
  let taxAmount = 0;
  const itemsWithTotals = input.items.map((item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const discountAmt = itemSubtotal * ((item.discount_percent || 0) / 100);
    const taxableAmount = itemSubtotal - discountAmt;
    const itemTax = taxableAmount * ((item.tax_rate || 0) / 100);
    const lineTotal = taxableAmount + itemTax;

    subtotal += itemSubtotal - discountAmt;
    taxAmount += itemTax;

    return {
      ...item,
      discount_amount: discountAmt,
      tax_amount: itemTax,
      line_total: lineTotal,
    };
  });

  const discountAmount = input.discount_amount || 0;
  const total = subtotal + taxAmount - discountAmount;

  // Calculate amount paid
  const amountPaid = input.payments.reduce((sum, p) => sum + p.amount, 0);
  const changeGiven = Math.max(0, amountPaid - total);

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from('pos_transactions')
    .insert({
      organization_id: organizationId,
      session_id: input.session_id,
      customer_id: input.customer_id,
      transaction_number: txNum || `POS-${Date.now()}`,
      status: 'completed',
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
      payment_status: amountPaid >= total ? 'paid' : 'partial',
      amount_paid: amountPaid,
      change_given: changeGiven,
      notes: input.notes,
    })
    .select()
    .single();

  if (txError) throw txError;

  // Create transaction items
  const { error: itemsError } = await supabase.from('pos_transaction_items').insert(
    itemsWithTotals.map((item) => ({
      transaction_id: transaction.id,
      product_id: item.product_id,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent || 0,
      discount_amount: item.discount_amount,
      tax_rate: item.tax_rate || 0,
      tax_amount: item.tax_amount,
      line_total: item.line_total,
    }))
  );

  if (itemsError) throw itemsError;

  // Create payments
  const { error: paymentsError } = await supabase.from('pos_payments').insert(
    input.payments.map((payment) => ({
      transaction_id: transaction.id,
      payment_method: payment.payment_method,
      amount: payment.amount,
      card_type: payment.card_type,
      card_last_four: payment.card_last_four,
      authorization_code: payment.authorization_code,
      reference_number: payment.reference_number,
    }))
  );

  if (paymentsError) throw paymentsError;

  // Update inventory (decrease stock)
  for (const item of input.items) {
    if (item.product_id) {
      await supabase.rpc('decrease_product_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }
  }

  return getTransaction(transaction.id) as Promise<POSTransaction>;
}

export async function voidTransaction(transactionId: string): Promise<POSTransaction> {
  const transaction = await getTransaction(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  if (transaction.status === 'voided') {
    throw new Error('Transaction is already voided');
  }

  // Restore inventory
  for (const item of transaction.items || []) {
    if (item.product_id) {
      await supabase.rpc('increase_product_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }
  }

  const { data, error } = await supabase
    .from('pos_transactions')
    .update({ status: 'voided' })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function refundTransaction(
  transactionId: string,
  refundItems?: { item_id: string; quantity: number }[]
): Promise<POSTransaction> {
  const transaction = await getTransaction(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  if (transaction.status !== 'completed') {
    throw new Error('Can only refund completed transactions');
  }

  // TODO: Implement partial refunds with refundItems
  // For now, full refund only

  // Restore inventory
  for (const item of transaction.items || []) {
    if (item.product_id) {
      await supabase.rpc('increase_product_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }
  }

  const { data, error } = await supabase
    .from('pos_transactions')
    .update({
      status: 'refunded',
      payment_status: 'refunded',
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ Cash Movements ============

export async function getCashMovements(sessionId: string): Promise<POSCashMovement[]> {
  const { data, error } = await supabase
    .from('pos_cash_movements')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addCashMovement(
  userId: string,
  input: POSCashMovementInput
): Promise<POSCashMovement> {
  const { data, error } = await supabase
    .from('pos_cash_movements')
    .insert({
      session_id: input.session_id,
      user_id: userId,
      movement_type: input.movement_type,
      amount: input.amount,
      reason: input.reason,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ Reports ============

export async function getDailySummary(
  organizationId: string,
  date: string
): Promise<POSDailySummary> {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;

  const { data: transactions, error } = await supabase
    .from('pos_transactions')
    .select(
      `
      *,
      payments:pos_payments(*)
    `
    )
    .eq('organization_id', organizationId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (error) throw error;

  const summary: POSDailySummary = {
    date,
    transactions: 0,
    gross_sales: 0,
    refunds: 0,
    net_sales: 0,
    tax_collected: 0,
    discounts_given: 0,
    cash_collected: 0,
    card_collected: 0,
  };

  transactions?.forEach((tx) => {
    if (tx.status === 'voided') return;

    summary.transactions++;

    if (tx.status === 'refunded') {
      summary.refunds += tx.total;
    } else {
      summary.gross_sales += tx.total;
    }

    summary.tax_collected += tx.tax_amount;
    summary.discounts_given += tx.discount_amount;

    tx.payments?.forEach((payment: POSPayment) => {
      if (payment.payment_method === 'cash') {
        summary.cash_collected += payment.amount;
      } else {
        summary.card_collected += payment.amount;
      }
    });
  });

  summary.net_sales = summary.gross_sales - summary.refunds;

  return summary;
}

// ============ Product Search ============

export async function searchProducts(
  organizationId: string,
  query: string
): Promise<
  {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    price: number;
    stock_quantity: number;
    image_url: string | null;
    tax_rate: number;
  }[]
> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, barcode, price, stock_quantity, image_url, tax_rate')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`)
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function getProductByBarcode(
  organizationId: string,
  barcode: string
): Promise<{
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  tax_rate: number;
} | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, barcode, price, stock_quantity, image_url, tax_rate')
    .eq('organization_id', organizationId)
    .eq('barcode', barcode)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
