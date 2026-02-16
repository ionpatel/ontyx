/**
 * Ontyx ERP - Seed Script
 * Creates initial organization, warehouse, categories, and sample products
 * 
 * Usage: node scripts/seed.js <user-email>
 */

const { Client } = require('pg');

const client = new Client({
  host: 'db.ufsuqflsiezkaqtoevvc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD || '15022003H@rsh!l',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const userEmail = process.argv[2];
  
  if (!userEmail) {
    console.log('Usage: node scripts/seed.js <user-email>');
    console.log('Example: node scripts/seed.js harshil@example.com');
    process.exit(1);
  }

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Create Organization
    console.log('📦 Creating organization...');
    const orgResult = await client.query(`
      INSERT INTO organizations (name, slug, email, country, timezone, currency, plan, status)
      VALUES ('Demo Company', 'demo-company', $1, 'CA', 'America/Toronto', 'CAD', 'professional', 'active')
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
      RETURNING id, name
    `, [userEmail]);
    const orgId = orgResult.rows[0].id;
    console.log(`   ✅ Organization: ${orgResult.rows[0].name} (${orgId})`);

    // 2. Check if user exists in auth.users and create profile
    console.log('\n👤 Setting up user...');
    const userResult = await client.query(`
      SELECT id FROM auth.users WHERE email = $1
    `, [userEmail]);
    
    let userId = null;
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log(`   ✅ Found existing user: ${userId}`);
      
      // Ensure user profile exists
      await client.query(`
        INSERT INTO users (id, email, full_name, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT (id) DO NOTHING
      `, [userId, userEmail, userEmail.split('@')[0]]);
      
      // Add user to organization
      await client.query(`
        INSERT INTO organization_members (organization_id, user_id, role, is_active, joined_at)
        VALUES ($1, $2, 'owner', true, NOW())
        ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner', is_active = true
      `, [orgId, userId]);
      console.log(`   ✅ Added as organization owner`);
    } else {
      console.log(`   ⚠️  User ${userEmail} not found in auth.users`);
      console.log(`   → Sign up at the app first, then re-run this script`);
    }

    // 3. Create Default Warehouse
    console.log('\n🏭 Creating warehouse...');
    const warehouseResult = await client.query(`
      INSERT INTO warehouses (organization_id, code, name, city, country, is_primary, is_active)
      VALUES ($1, 'MAIN', 'Main Warehouse', 'Toronto', 'CA', true, true)
      ON CONFLICT (organization_id, code) DO UPDATE SET updated_at = NOW()
      RETURNING id, name
    `, [orgId]);
    const warehouseId = warehouseResult.rows[0].id;
    console.log(`   ✅ Warehouse: ${warehouseResult.rows[0].name}`);

    // 4. Create Categories
    console.log('\n📁 Creating categories...');
    const categories = [
      { name: 'Electronics', slug: 'electronics', desc: 'Electronic devices and components' },
      { name: 'Pharmaceuticals', slug: 'pharmaceuticals', desc: 'Medications and health products' },
      { name: 'Office Supplies', slug: 'office-supplies', desc: 'Office and stationery items' },
      { name: 'Raw Materials', slug: 'raw-materials', desc: 'Manufacturing inputs' },
    ];

    const categoryIds = {};
    for (const cat of categories) {
      const result = await client.query(`
        INSERT INTO product_categories (organization_id, name, slug, description, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (organization_id, slug) DO UPDATE SET updated_at = NOW()
        RETURNING id, name
      `, [orgId, cat.name, cat.slug, cat.desc]);
      categoryIds[cat.slug] = result.rows[0].id;
      console.log(`   ✅ ${cat.name}`);
    }

    // 5. Create Sample Products
    console.log('\n📦 Creating products...');
    const products = [
      { sku: 'PHAR-001', name: 'Acetaminophen 500mg', cat: 'pharmaceuticals', cost: 8.50, price: 12.99, stock: 2450 },
      { sku: 'PHAR-002', name: 'Ibuprofen 400mg', cat: 'pharmaceuticals', cost: 10.25, price: 15.99, stock: 1820 },
      { sku: 'PHAR-003', name: 'Amoxicillin 250mg', cat: 'pharmaceuticals', cost: 15.00, price: 24.99, stock: 890 },
      { sku: 'ELEC-001', name: 'USB-C Cable 2m', cat: 'electronics', cost: 12.00, price: 24.99, stock: 856 },
      { sku: 'ELEC-002', name: 'Wireless Mouse', cat: 'electronics', cost: 22.00, price: 39.99, stock: 234 },
      { sku: 'ELEC-003', name: 'Bluetooth Keyboard', cat: 'electronics', cost: 35.00, price: 59.99, stock: 156 },
      { sku: 'OFF-001', name: 'A4 Copy Paper (500 sheets)', cat: 'office-supplies', cost: 5.50, price: 8.99, stock: 3200 },
      { sku: 'OFF-002', name: 'Ballpoint Pens (12 pack)', cat: 'office-supplies', cost: 3.00, price: 6.99, stock: 1500 },
      { sku: 'RAW-001', name: 'Steel Rod 10mm', cat: 'raw-materials', cost: 32.00, price: 45.00, stock: 450 },
      { sku: 'RAW-002', name: 'Aluminum Sheet 2mm', cat: 'raw-materials', cost: 28.00, price: 42.00, stock: 320 },
    ];

    for (const prod of products) {
      const result = await client.query(`
        INSERT INTO products (
          organization_id, sku, name, category_id, 
          cost_price, sell_price, reorder_point, reorder_quantity,
          is_active, is_taxable
        )
        VALUES ($1, $2, $3, $4, $5, $6, 50, 100, true, true)
        ON CONFLICT (organization_id, sku) DO UPDATE SET 
          cost_price = $5, sell_price = $6, updated_at = NOW()
        RETURNING id, name
      `, [orgId, prod.sku, prod.name, categoryIds[prod.cat], prod.cost, prod.price]);
      
      const productId = result.rows[0].id;
      
      // Create inventory level (delete existing first, then insert)
      await client.query(`
        DELETE FROM inventory_levels 
        WHERE organization_id = $1 AND product_id = $2 AND warehouse_id = $3
      `, [orgId, productId, warehouseId]);
      
      await client.query(`
        INSERT INTO inventory_levels (organization_id, product_id, warehouse_id, on_hand, available)
        VALUES ($1, $2, $3, $4, $4)
      `, [orgId, productId, warehouseId, prod.stock]);
      
      console.log(`   ✅ ${prod.name} (${prod.stock} in stock)`);
    }

    // 6. Create Chart of Accounts (basic)
    console.log('\n💰 Creating chart of accounts...');
    const accounts = [
      { code: '1000', name: 'Cash', type: 'asset' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset' },
      { code: '1200', name: 'Inventory', type: 'asset' },
      { code: '2000', name: 'Accounts Payable', type: 'liability' },
      { code: '3000', name: 'Owner Equity', type: 'equity' },
      { code: '4000', name: 'Sales Revenue', type: 'revenue' },
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
      { code: '6000', name: 'Operating Expenses', type: 'expense' },
    ];

    for (const acc of accounts) {
      await client.query(`
        INSERT INTO chart_of_accounts (organization_id, code, name, account_type, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (organization_id, code) DO NOTHING
      `, [orgId, acc.code, acc.name, acc.type]);
    }
    console.log(`   ✅ Created ${accounts.length} accounts`);

    console.log('\n🎉 Seed complete!');
    console.log('\n📋 Summary:');
    console.log(`   Organization: Demo Company`);
    console.log(`   Warehouse: Main Warehouse (Toronto)`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Accounts: ${accounts.length}`);
    
    if (!userId) {
      console.log('\n⚠️  Next steps:');
      console.log(`   1. Sign up at the app with email: ${userEmail}`);
      console.log(`   2. Re-run: node scripts/seed.js ${userEmail}`);
    } else {
      console.log('\n✅ You can now log in and see real data!');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

seed();
