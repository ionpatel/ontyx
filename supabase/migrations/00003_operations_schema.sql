-- Ontyx ERP - Operations Schema Migration
-- Products, Inventory, Sales Orders, Purchase Orders, Manufacturing

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE product_type AS ENUM ('physical', 'service', 'digital', 'bundle');
CREATE TYPE inventory_tracking AS ENUM ('none', 'quantity', 'serial', 'batch');
CREATE TYPE order_status AS ENUM ('draft', 'confirmed', 'processing', 'partial', 'completed', 'cancelled');
CREATE TYPE fulfillment_status AS ENUM ('unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered');
CREATE TYPE movement_type AS ENUM ('adjustment', 'transfer', 'receipt', 'shipment', 'production', 'scrap', 'return');
CREATE TYPE work_order_status AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled');

-- =============================================================================
-- PRODUCT CATEGORIES
-- =============================================================================

CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    
    -- Defaults
    default_tax_rate_id UUID REFERENCES tax_rates(id),
    default_revenue_account_id UUID REFERENCES chart_of_accounts(id),
    default_expense_account_id UUID REFERENCES chart_of_accounts(id),
    
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, slug)
);

CREATE INDEX idx_product_categories_org ON product_categories(organization_id);
CREATE INDEX idx_product_categories_parent ON product_categories(parent_id);

-- =============================================================================
-- PRODUCTS
-- =============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic info
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    product_type product_type DEFAULT 'physical',
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    
    -- Pricing
    currency currency_code DEFAULT 'USD',
    cost_price DECIMAL(19, 4),
    sell_price DECIMAL(19, 4),
    compare_at_price DECIMAL(19, 4),
    
    -- Tax
    tax_rate_id UUID REFERENCES tax_rates(id),
    is_taxable BOOLEAN DEFAULT true,
    
    -- Inventory
    track_inventory BOOLEAN DEFAULT true,
    inventory_tracking inventory_tracking DEFAULT 'quantity',
    
    -- Physical attributes
    weight DECIMAL(10, 4),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    length DECIMAL(10, 4),
    width DECIMAL(10, 4),
    height DECIMAL(10, 4),
    dimension_unit VARCHAR(10) DEFAULT 'cm',
    
    -- Stock settings
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER,
    
    -- Vendor
    default_vendor_id UUID REFERENCES contacts(id),
    vendor_sku VARCHAR(100),
    lead_time_days INTEGER,
    
    -- GL Accounts
    revenue_account_id UUID REFERENCES chart_of_accounts(id),
    cogs_account_id UUID REFERENCES chart_of_accounts(id),
    inventory_account_id UUID REFERENCES chart_of_accounts(id),
    
    -- Media
    images JSONB DEFAULT '[]',
    
    -- SEO / E-commerce
    slug VARCHAR(255),
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    -- Flags
    is_active BOOLEAN DEFAULT true,
    is_purchasable BOOLEAN DEFAULT true,
    is_sellable BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Tags
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, sku)
);

CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('english', name));

-- =============================================================================
-- PRODUCT VARIANTS
-- =============================================================================

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- Variant options (e.g., {"Size": "Large", "Color": "Red"})
    options JSONB DEFAULT '{}',
    
    -- Override pricing
    cost_price DECIMAL(19, 4),
    sell_price DECIMAL(19, 4),
    compare_at_price DECIMAL(19, 4),
    
    -- Override physical
    weight DECIMAL(10, 4),
    
    -- Barcode
    barcode VARCHAR(100),
    
    -- Media
    image_url TEXT,
    
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_barcode ON product_variants(barcode);

-- =============================================================================
-- WAREHOUSES
-- =============================================================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) DEFAULT 'US',
    
    -- Contact
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    
    -- Settings
    is_primary BOOLEAN DEFAULT false,
    allow_negative_stock BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, code)
);

CREATE INDEX idx_warehouses_org ON warehouses(organization_id);

-- =============================================================================
-- WAREHOUSE ZONES / BINS
-- =============================================================================

CREATE TABLE warehouse_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) DEFAULT 'storage', -- storage, receiving, shipping, staging
    
    parent_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
    
    -- Location path (e.g., "A-01-02")
    location_path VARCHAR(100),
    
    -- Capacity
    max_weight DECIMAL(10, 2),
    max_volume DECIMAL(10, 2),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouse_zones_warehouse ON warehouse_zones(warehouse_id);

-- =============================================================================
-- INVENTORY LEVELS
-- =============================================================================

CREATE TABLE inventory_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES warehouse_zones(id) ON DELETE SET NULL,
    
    -- Quantities
    on_hand INTEGER NOT NULL DEFAULT 0,
    available INTEGER NOT NULL DEFAULT 0, -- on_hand - committed
    committed INTEGER NOT NULL DEFAULT 0, -- Reserved for orders
    incoming INTEGER NOT NULL DEFAULT 0, -- Expected from POs
    
    -- Cost
    average_cost DECIMAL(19, 4),
    total_value DECIMAL(19, 4),
    
    -- Bin location
    bin_location VARCHAR(100),
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Either product_id or variant_id must be set
    CONSTRAINT check_product_or_variant CHECK (
        (product_id IS NOT NULL AND variant_id IS NULL) OR
        (variant_id IS NOT NULL)
    ),
    
    UNIQUE(product_id, variant_id, warehouse_id, zone_id)
);

CREATE INDEX idx_inventory_levels_org ON inventory_levels(organization_id);
CREATE INDEX idx_inventory_levels_product ON inventory_levels(product_id);
CREATE INDEX idx_inventory_levels_variant ON inventory_levels(variant_id);
CREATE INDEX idx_inventory_levels_warehouse ON inventory_levels(warehouse_id);

-- =============================================================================
-- INVENTORY MOVEMENTS
-- =============================================================================

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    movement_number VARCHAR(50) NOT NULL,
    movement_type movement_type NOT NULL,
    movement_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Product
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Location
    from_warehouse_id UUID REFERENCES warehouses(id),
    from_zone_id UUID REFERENCES warehouse_zones(id),
    to_warehouse_id UUID REFERENCES warehouses(id),
    to_zone_id UUID REFERENCES warehouse_zones(id),
    
    -- Quantity
    quantity INTEGER NOT NULL,
    
    -- Cost
    unit_cost DECIMAL(19, 4),
    total_cost DECIMAL(19, 4),
    
    -- Reference
    reference_type VARCHAR(50), -- sales_order, purchase_order, work_order, manual
    reference_id UUID,
    
    -- Tracking
    serial_numbers TEXT[],
    batch_number VARCHAR(100),
    expiry_date DATE,
    
    reason TEXT,
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, movement_number)
);

CREATE INDEX idx_inventory_movements_org ON inventory_movements(organization_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(movement_date DESC);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);

-- =============================================================================
-- SALES ORDERS
-- =============================================================================

CREATE TABLE sales_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    order_number VARCHAR(50) NOT NULL,
    reference VARCHAR(100),
    
    -- Customer
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    
    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    
    -- Status
    status order_status DEFAULT 'draft',
    fulfillment_status fulfillment_status DEFAULT 'unfulfilled',
    
    -- Amounts
    currency currency_code DEFAULT 'USD',
    subtotal DECIMAL(19, 4) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(19, 4) DEFAULT 0,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    shipping_amount DECIMAL(19, 4) DEFAULT 0,
    total DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    -- Addresses
    billing_address JSONB,
    shipping_address JSONB,
    
    -- Shipping
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),
    
    -- Fulfillment
    warehouse_id UUID REFERENCES warehouses(id),
    
    -- Payment
    payment_terms INTEGER DEFAULT 30,
    
    -- Additional
    notes TEXT,
    internal_notes TEXT,
    
    -- Linked invoice
    invoice_id UUID REFERENCES invoices(id),
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, order_number)
);

CREATE INDEX idx_sales_orders_org ON sales_orders(organization_id);
CREATE INDEX idx_sales_orders_contact ON sales_orders(contact_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date DESC);

-- =============================================================================
-- SALES ORDER ITEMS
-- =============================================================================

CREATE TABLE sales_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    
    description TEXT NOT NULL,
    quantity DECIMAL(19, 4) NOT NULL DEFAULT 1,
    quantity_fulfilled DECIMAL(19, 4) DEFAULT 0,
    unit_price DECIMAL(19, 4) NOT NULL,
    
    discount_amount DECIMAL(19, 4) DEFAULT 0,
    discount_percent DECIMAL(5, 2),
    
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    
    line_total DECIMAL(19, 4) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_order_items_order ON sales_order_items(sales_order_id);
CREATE INDEX idx_sales_order_items_product ON sales_order_items(product_id);

-- =============================================================================
-- PURCHASE ORDERS
-- =============================================================================

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    order_number VARCHAR(50) NOT NULL,
    vendor_ref VARCHAR(100),
    
    -- Vendor
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    
    -- Dates
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    
    -- Status
    status order_status DEFAULT 'draft',
    
    -- Amounts
    currency currency_code DEFAULT 'USD',
    subtotal DECIMAL(19, 4) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(19, 4) DEFAULT 0,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    shipping_amount DECIMAL(19, 4) DEFAULT 0,
    total DECIMAL(19, 4) NOT NULL DEFAULT 0,
    
    -- Shipping address
    ship_to_address JSONB,
    
    -- Receiving
    warehouse_id UUID REFERENCES warehouses(id),
    
    -- Approval
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    
    -- Additional
    notes TEXT,
    internal_notes TEXT,
    
    -- Linked bill
    bill_id UUID REFERENCES bills(id),
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, order_number)
);

CREATE INDEX idx_purchase_orders_org ON purchase_orders(organization_id);
CREATE INDEX idx_purchase_orders_contact ON purchase_orders(contact_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date DESC);

-- =============================================================================
-- PURCHASE ORDER ITEMS
-- =============================================================================

CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    
    description TEXT NOT NULL,
    quantity DECIMAL(19, 4) NOT NULL DEFAULT 1,
    quantity_received DECIMAL(19, 4) DEFAULT 0,
    unit_price DECIMAL(19, 4) NOT NULL,
    
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    
    line_total DECIMAL(19, 4) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);

-- =============================================================================
-- BILL OF MATERIALS (BOMs)
-- =============================================================================

CREATE TABLE boms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    bom_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    
    -- Output product
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id),
    output_quantity DECIMAL(19, 4) NOT NULL DEFAULT 1,
    
    -- Version
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    -- Cost
    estimated_cost DECIMAL(19, 4),
    estimated_time_minutes INTEGER,
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, bom_number)
);

CREATE INDEX idx_boms_org ON boms(organization_id);
CREATE INDEX idx_boms_product ON boms(product_id);

-- =============================================================================
-- BOM ITEMS (Components)
-- =============================================================================

CREATE TABLE bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
    
    line_number INTEGER NOT NULL,
    
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    
    quantity DECIMAL(19, 4) NOT NULL DEFAULT 1,
    unit_cost DECIMAL(19, 4),
    
    -- Scrap percentage
    scrap_percent DECIMAL(5, 2) DEFAULT 0,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_product ON bom_items(product_id);

-- =============================================================================
-- WORK ORDERS
-- =============================================================================

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    work_order_number VARCHAR(50) NOT NULL,
    
    bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE RESTRICT,
    
    -- Quantity
    quantity_to_produce DECIMAL(19, 4) NOT NULL DEFAULT 1,
    quantity_produced DECIMAL(19, 4) DEFAULT 0,
    
    -- Dates
    scheduled_start DATE,
    scheduled_end DATE,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    
    -- Status
    status work_order_status DEFAULT 'draft',
    
    -- Location
    warehouse_id UUID REFERENCES warehouses(id),
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    -- Costs
    estimated_cost DECIMAL(19, 4),
    actual_cost DECIMAL(19, 4),
    
    notes TEXT,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, work_order_number)
);

CREATE INDEX idx_work_orders_org ON work_orders(organization_id);
CREATE INDEX idx_work_orders_bom ON work_orders(bom_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org access for product_categories" ON product_categories
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for products" ON products
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for product_variants" ON product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products
            WHERE products.id = product_variants.product_id
            AND user_has_org_access(products.organization_id)
        )
    );

CREATE POLICY "Org access for warehouses" ON warehouses
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for warehouse_zones" ON warehouse_zones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM warehouses
            WHERE warehouses.id = warehouse_zones.warehouse_id
            AND user_has_org_access(warehouses.organization_id)
        )
    );

CREATE POLICY "Org access for inventory_levels" ON inventory_levels
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for inventory_movements" ON inventory_movements
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for sales_orders" ON sales_orders
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for sales_order_items" ON sales_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_orders
            WHERE sales_orders.id = sales_order_items.sales_order_id
            AND user_has_org_access(sales_orders.organization_id)
        )
    );

CREATE POLICY "Org access for purchase_orders" ON purchase_orders
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for purchase_order_items" ON purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM purchase_orders
            WHERE purchase_orders.id = purchase_order_items.purchase_order_id
            AND user_has_org_access(purchase_orders.organization_id)
        )
    );

CREATE POLICY "Org access for boms" ON boms
    FOR ALL USING (user_has_org_access(organization_id));

CREATE POLICY "Org access for bom_items" ON bom_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM boms
            WHERE boms.id = bom_items.bom_id
            AND user_has_org_access(boms.organization_id)
        )
    );

CREATE POLICY "Org access for work_orders" ON work_orders
    FOR ALL USING (user_has_org_access(organization_id));

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER set_updated_at_product_categories BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_product_variants BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_warehouses BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_warehouse_zones BEFORE UPDATE ON warehouse_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_sales_orders BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_purchase_orders BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_boms BEFORE UPDATE ON boms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_work_orders BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
