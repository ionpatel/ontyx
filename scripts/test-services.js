#!/usr/bin/env node
/**
 * Ontyx Service Tests
 * Tests each backend service against live Supabase
 * Run: node scripts/test-services.js
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://ufsuqflsiezkaqtoevvc.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmc3VxZmxzaWV6a2FxdG9ldnZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIwNTExNiwiZXhwIjoyMDg2NzgxMTE2fQ.OXH-8E0VUmaaAVRUiE7jYf912QlFfSDpHWazvZq4G8g'

// Test user/org IDs
const TEST_USER_ID = 'cdd6e8b3-cdb5-4471-9f1b-2bdd3ef371e0'
const TEST_ORG_ID = '0f576694-fd2d-450d-98f4-4e0d997774d0'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Test results
const results = { passed: 0, failed: 0, tests: [] }

function log(msg) { console.log(msg) }
function pass(name) { results.passed++; results.tests.push({ name, status: '✅' }); log(`  ✅ ${name}`) }
function fail(name, err) { results.failed++; results.tests.push({ name, status: '❌', error: err }); log(`  ❌ ${name}: ${err}`) }

// ============================================================================
// TEST SUITES
// ============================================================================

async function testUsers() {
  log('\n📋 USERS TABLE')
  
  // Test: Get user by ID
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, status')
      .eq('id', TEST_USER_ID)
      .single()
    
    if (error) throw error
    if (!data) throw new Error('No user found')
    if (data.email !== 'harshilpatel1522@gmail.com') throw new Error('Wrong email')
    pass('Get user by ID')
  } catch (e) {
    fail('Get user by ID', e.message)
  }

  // Test: Update user profile
  try {
    const { error } = await supabase
      .from('users')
      .update({ theme: 'light', updated_at: new Date().toISOString() })
      .eq('id', TEST_USER_ID)
    
    if (error) throw error
    pass('Update user profile')
  } catch (e) {
    fail('Update user profile', e.message)
  }
}

async function testOrganizations() {
  log('\n🏢 ORGANIZATIONS TABLE')
  
  // Test: Get organization
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, currency, status')
      .eq('id', TEST_ORG_ID)
      .single()
    
    if (error) throw error
    if (!data) throw new Error('No org found')
    pass(`Get organization: ${data.name}`)
  } catch (e) {
    fail('Get organization', e.message)
  }

  // Test: Update organization
  try {
    const { error } = await supabase
      .from('organizations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', TEST_ORG_ID)
    
    if (error) throw error
    pass('Update organization')
  } catch (e) {
    fail('Update organization', e.message)
  }
}

async function testOrganizationMembers() {
  log('\n👥 ORGANIZATION_MEMBERS TABLE')
  
  // Test: Get membership
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization_id, user_id, role, is_active')
      .eq('user_id', TEST_USER_ID)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    if (!data) throw new Error('No membership found')
    if (data.organization_id !== TEST_ORG_ID) throw new Error('Wrong org ID')
    pass(`Get membership: role=${data.role}`)
  } catch (e) {
    fail('Get membership', e.message)
  }
}

async function testContacts() {
  log('\n📇 CONTACTS TABLE')
  
  let testContactId = null

  // Test: Create contact
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        organization_id: TEST_ORG_ID,
        display_name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-1234',
        is_customer: true,
        is_vendor: false,
        is_active: true,
      })
      .select()
      .single()
    
    if (error) throw error
    testContactId = data.id
    pass(`Create contact: ${data.display_name}`)
  } catch (e) {
    fail('Create contact', e.message)
  }

  // Test: List contacts
  try {
    const { data, error, count } = await supabase
      .from('contacts')
      .select('id, display_name, email', { count: 'exact' })
      .eq('organization_id', TEST_ORG_ID)
      .eq('is_active', true)
    
    if (error) throw error
    pass(`List contacts: ${count || data?.length || 0} found`)
  } catch (e) {
    fail('List contacts', e.message)
  }

  // Test: Update contact
  if (testContactId) {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ phone: '555-5678', updated_at: new Date().toISOString() })
        .eq('id', testContactId)
      
      if (error) throw error
      pass('Update contact')
    } catch (e) {
      fail('Update contact', e.message)
    }
  }

  // Test: Delete contact (cleanup)
  if (testContactId) {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', testContactId)
      
      if (error) throw error
      pass('Delete contact')
    } catch (e) {
      fail('Delete contact', e.message)
    }
  }
}

async function testProducts() {
  log('\n📦 PRODUCTS TABLE')
  
  let testProductId = null

  // Test: Create product
  try {
    const { data, error } = await supabase
      .from('products')
      .insert({
        organization_id: TEST_ORG_ID,
        name: 'Test Product',
        sku: `TEST-${Date.now()}`,
        sell_price: 99.99,
        cost_price: 50.00,
        is_active: true,
        is_sellable: true,
        track_inventory: true,
        reorder_point: 10,
        reorder_quantity: 50,
      })
      .select()
      .single()
    
    if (error) throw error
    testProductId = data.id
    pass(`Create product: ${data.name}`)
  } catch (e) {
    fail('Create product', e.message)
  }

  // Test: List products
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, sell_price')
      .eq('organization_id', TEST_ORG_ID)
      .eq('is_active', true)
      .limit(10)
    
    if (error) throw error
    pass(`List products: ${data?.length || 0} found`)
  } catch (e) {
    fail('List products', e.message)
  }

  // Test: Get product with inventory
  if (testProductId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, inventory_levels(on_hand, available)')
        .eq('id', testProductId)
        .single()
      
      if (error) throw error
      pass('Get product with inventory join')
    } catch (e) {
      fail('Get product with inventory join', e.message)
    }
  }

  // Cleanup
  if (testProductId) {
    try {
      await supabase.from('products').delete().eq('id', testProductId)
      pass('Delete product')
    } catch (e) {
      fail('Delete product', e.message)
    }
  }
}

async function testInvoices() {
  log('\n🧾 INVOICES TABLE')
  
  let testContactId = null
  let testInvoiceId = null

  // Setup: Create test contact first
  try {
    const { data } = await supabase
      .from('contacts')
      .insert({
        organization_id: TEST_ORG_ID,
        display_name: 'Invoice Test Customer',
        email: 'invoice-test@example.com',
        is_customer: true,
        is_active: true,
      })
      .select()
      .single()
    testContactId = data?.id
  } catch (e) {
    log(`  ⚠️ Could not create test contact: ${e.message}`)
  }

  // Test: Create invoice
  if (testContactId) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          organization_id: TEST_ORG_ID,
          invoice_number: `INV-TEST-${Date.now()}`,
          contact_id: testContactId,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          status: 'draft',
          subtotal: 100,
          tax_amount: 13,
          total: 113,
          amount_paid: 0,
          amount_due: 113,
          currency: 'CAD',
        })
        .select()
        .single()
      
      if (error) throw error
      testInvoiceId = data.id
      pass(`Create invoice: ${data.invoice_number}`)
    } catch (e) {
      fail('Create invoice', e.message)
    }
  } else {
    fail('Create invoice', 'No test contact')
  }

  // Test: List invoices
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, total, status')
      .eq('organization_id', TEST_ORG_ID)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    pass(`List invoices: ${data?.length || 0} found`)
  } catch (e) {
    fail('List invoices', e.message)
  }

  // Test: Get invoice with contact join
  if (testInvoiceId) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, contact:contacts(display_name, email)')
        .eq('id', testInvoiceId)
        .single()
      
      if (error) throw error
      if (!data.contact) throw new Error('Contact join failed')
      pass('Get invoice with contact join')
    } catch (e) {
      fail('Get invoice with contact join', e.message)
    }
  }

  // Test: Update invoice status
  if (testInvoiceId) {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', testInvoiceId)
      
      if (error) throw error
      pass('Update invoice status')
    } catch (e) {
      fail('Update invoice status', e.message)
    }
  }

  // Cleanup
  if (testInvoiceId) {
    await supabase.from('invoices').delete().eq('id', testInvoiceId)
  }
  if (testContactId) {
    await supabase.from('contacts').delete().eq('id', testContactId)
  }
  pass('Cleanup invoice test data')
}

async function testSalesOrders() {
  log('\n🛒 SALES_ORDERS TABLE')
  
  let testContactId = null
  let testOrderId = null

  // Setup
  try {
    const { data } = await supabase
      .from('contacts')
      .insert({
        organization_id: TEST_ORG_ID,
        display_name: 'Sales Test Customer',
        email: 'sales-test@example.com',
        is_customer: true,
        is_active: true,
      })
      .select()
      .single()
    testContactId = data?.id
  } catch (e) {
    log(`  ⚠️ Could not create test contact`)
  }

  // Test: Create sales order
  if (testContactId) {
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .insert({
          organization_id: TEST_ORG_ID,
          order_number: `SO-TEST-${Date.now()}`,
          contact_id: testContactId,
          order_date: new Date().toISOString().split('T')[0],
          status: 'draft',
          subtotal: 200,
          tax_amount: 26,
          total: 226,
          currency: 'CAD',
        })
        .select()
        .single()
      
      if (error) throw error
      testOrderId = data.id
      pass(`Create sales order: ${data.order_number}`)
    } catch (e) {
      fail('Create sales order', e.message)
    }
  }

  // Test: List sales orders
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('id, order_number, total, status')
      .eq('organization_id', TEST_ORG_ID)
      .limit(10)
    
    if (error) throw error
    pass(`List sales orders: ${data?.length || 0} found`)
  } catch (e) {
    fail('List sales orders', e.message)
  }

  // Test: Get order with contact join
  if (testOrderId) {
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('*, customer:contacts(display_name)')
        .eq('id', testOrderId)
        .single()
      
      if (error) throw error
      pass('Get sales order with contact join')
    } catch (e) {
      fail('Get sales order with contact join', e.message)
    }
  }

  // Cleanup
  if (testOrderId) {
    await supabase.from('sales_orders').delete().eq('id', testOrderId)
  }
  if (testContactId) {
    await supabase.from('contacts').delete().eq('id', testContactId)
  }
  pass('Cleanup sales order test data')
}

async function testInventoryLevels() {
  log('\n📊 INVENTORY_LEVELS TABLE')
  
  let testProductId = null

  // Setup
  try {
    const { data } = await supabase
      .from('products')
      .insert({
        organization_id: TEST_ORG_ID,
        name: 'Inventory Test Product',
        sku: `INV-TEST-${Date.now()}`,
        sell_price: 50,
        is_active: true,
        track_inventory: true,
      })
      .select()
      .single()
    testProductId = data?.id
  } catch (e) {
    log(`  ⚠️ Could not create test product`)
  }

  // Test: Create inventory level
  if (testProductId) {
    try {
      const { data, error } = await supabase
        .from('inventory_levels')
        .insert({
          organization_id: TEST_ORG_ID,
          product_id: testProductId,
          on_hand: 100,
          available: 100,
          committed: 0,
        })
        .select()
        .single()
      
      if (error) throw error
      pass(`Create inventory level: on_hand=${data.on_hand}`)
    } catch (e) {
      fail('Create inventory level', e.message)
    }
  }

  // Test: Query products with inventory
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, name, sku,
        inventory_levels(on_hand, available)
      `)
      .eq('organization_id', TEST_ORG_ID)
      .eq('is_active', true)
      .limit(5)
    
    if (error) throw error
    pass('Query products with inventory join')
  } catch (e) {
    fail('Query products with inventory join', e.message)
  }

  // Cleanup
  if (testProductId) {
    await supabase.from('inventory_levels').delete().eq('product_id', testProductId)
    await supabase.from('products').delete().eq('id', testProductId)
  }
  pass('Cleanup inventory test data')
}

async function testDashboardQueries() {
  log('\n📈 DASHBOARD QUERIES')
  
  // Test: Invoice stats
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('total, amount_paid, amount_due, status')
      .eq('organization_id', TEST_ORG_ID)
    
    if (error) throw error
    pass(`Invoice stats query: ${data?.length || 0} invoices`)
  } catch (e) {
    fail('Invoice stats query', e.message)
  }

  // Test: Sales order stats
  try {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('total, status')
      .eq('organization_id', TEST_ORG_ID)
    
    if (error) throw error
    pass(`Sales order stats: ${data?.length || 0} orders`)
  } catch (e) {
    fail('Sales order stats', e.message)
  }

  // Test: Product count with inventory
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, reorder_point')
      .eq('organization_id', TEST_ORG_ID)
      .eq('is_active', true)
    
    if (error) throw error
    pass(`Product count: ${data?.length || 0} products`)
  } catch (e) {
    fail('Product count', e.message)
  }

  // Test: Contact counts
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, is_customer, is_vendor')
      .eq('organization_id', TEST_ORG_ID)
      .eq('is_active', true)
    
    if (error) throw error
    const customers = data?.filter(c => c.is_customer).length || 0
    const vendors = data?.filter(c => c.is_vendor).length || 0
    pass(`Contact counts: ${customers} customers, ${vendors} vendors`)
  } catch (e) {
    fail('Contact counts', e.message)
  }
}

async function testPayroll() {
  log('\n💰 PAYROLL TABLES')
  
  // Test: Query payroll_runs
  try {
    const { data, error } = await supabase
      .from('payroll_runs')
      .select('id, pay_date, status, total_gross, total_net')
      .eq('organization_id', TEST_ORG_ID)
      .limit(5)
    
    if (error) throw error
    pass(`Payroll runs: ${data?.length || 0} found`)
  } catch (e) {
    fail('Payroll runs query', e.message)
  }

  // Test: Query employees
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email, employment_status')
      .eq('organization_id', TEST_ORG_ID)
      .limit(5)
    
    if (error) throw error
    pass(`Employees: ${data?.length || 0} found`)
  } catch (e) {
    fail('Employees query', e.message)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('  ONTYX SERVICE TESTS')
  console.log('  Testing against:', SUPABASE_URL)
  console.log('  Test Org:', TEST_ORG_ID)
  console.log('═══════════════════════════════════════════════════════════════')

  await testUsers()
  await testOrganizations()
  await testOrganizationMembers()
  await testContacts()
  await testProducts()
  await testInvoices()
  await testSalesOrders()
  await testInventoryLevels()
  await testDashboardQueries()
  await testPayroll()

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log(`  RESULTS: ${results.passed} passed, ${results.failed} failed`)
  console.log('═══════════════════════════════════════════════════════════════')
  
  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.tests.filter(t => t.status === '❌').forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`)
    })
  }

  process.exit(results.failed > 0 ? 1 : 0)
}

runTests().catch(err => {
  console.error('Test runner error:', err)
  process.exit(1)
})
