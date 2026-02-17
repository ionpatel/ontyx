import { createClient } from '@/lib/supabase/client';

export type IndustryType = 
  | 'pharmacy'
  | 'salon'
  | 'auto_shop'
  | 'clinic'
  | 'restaurant'
  | 'retail'
  | 'contractor'
  | 'wholesaler'
  | 'professional_services'
  | 'manufacturing';

export interface IndustryTemplate {
  industry: IndustryType;
  name: string;
  description: string;
  icon: string;
  color: string;
  modules: string[];
  chartOfAccounts: ChartOfAccountTemplate[];
  taxRates: TaxRateTemplate[];
  products?: ProductTemplate[];
  services?: ServiceTemplate[];
  settings: IndustrySettings;
  emailTemplates?: EmailTemplateConfig[];
  workflows?: WorkflowTemplate[];
}

interface ChartOfAccountTemplate {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subtype?: string;
}

interface TaxRateTemplate {
  name: string;
  rate: number;
  type: 'sales' | 'purchase' | 'both';
}

interface ProductTemplate {
  name: string;
  sku: string;
  category: string;
  price: number;
  cost?: number;
}

interface ServiceTemplate {
  name: string;
  category: string;
  duration?: number;
  price: number;
}

interface IndustrySettings {
  currency: string;
  dateFormat: string;
  fiscalYearStart: string;
  defaultPaymentTerms: number;
  invoicePrefix?: string;
  estimatePrefix?: string;
  poPrefix?: string;
  requiresAppointments: boolean;
  tracksInventory: boolean;
  hasFieldService: boolean;
  hasManufacturing: boolean;
  requiresHealthCompliance?: boolean;
}

interface EmailTemplateConfig {
  type: 'invoice' | 'reminder' | 'appointment' | 'welcome' | 'follow_up';
  subject: string;
  body: string;
}

interface WorkflowTemplate {
  name: string;
  trigger: string;
  actions: { type: string; config: Record<string, any> }[];
}

// ==================== INDUSTRY TEMPLATES ====================

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    industry: 'pharmacy',
    name: 'Pharmacy',
    description: 'Drug inventory, DIN tracking, expiry management, controlled substances',
    icon: '💊',
    color: '#DC2626',
    modules: ['pharmacy', 'inventory', 'pos', 'invoices', 'contacts', 'reports', 'employees'],
    chartOfAccounts: [
      { code: '1000', name: 'Cash', type: 'asset', subtype: 'current' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'current' },
      { code: '1200', name: 'Drug Inventory', type: 'asset', subtype: 'current' },
      { code: '1210', name: 'OTC Inventory', type: 'asset', subtype: 'current' },
      { code: '1220', name: 'Prescription Inventory', type: 'asset', subtype: 'current' },
      { code: '1230', name: 'Controlled Substances Inventory', type: 'asset', subtype: 'current' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current' },
      { code: '2100', name: 'HST Payable', type: 'liability', subtype: 'current' },
      { code: '4000', name: 'Prescription Sales', type: 'revenue' },
      { code: '4100', name: 'OTC Sales', type: 'revenue' },
      { code: '4200', name: 'Front Store Sales', type: 'revenue' },
      { code: '5000', name: 'Cost of Drugs Sold', type: 'expense' },
      { code: '6000', name: 'Rent Expense', type: 'expense' },
      { code: '6100', name: 'Salaries Expense', type: 'expense' },
      { code: '6200', name: 'Insurance Expense', type: 'expense' },
    ],
    taxRates: [
      { name: 'HST 13%', rate: 13, type: 'both' },
      { name: 'Zero-rated (Rx)', rate: 0, type: 'sales' },
    ],
    settings: {
      currency: 'CAD',
      dateFormat: 'YYYY-MM-DD',
      fiscalYearStart: '01-01',
      defaultPaymentTerms: 30,
      invoicePrefix: 'RX-',
      requiresAppointments: false,
      tracksInventory: true,
      hasFieldService: false,
      hasManufacturing: false,
      requiresHealthCompliance: true,
    },
    workflows: [
      {
        name: 'Low Stock Alert',
        trigger: 'inventory_low',
        actions: [
          { type: 'email', config: { to: 'manager', template: 'low_stock' } },
          { type: 'create_po', config: { auto: false } },
        ],
      },
      {
        name: 'Expiry Alert',
        trigger: 'drug_expiring_soon',
        actions: [
          { type: 'email', config: { to: 'pharmacist', template: 'expiry_warning' } },
          { type: 'flag_item', config: { status: 'expiring' } },
        ],
      },
    ],
  },
  {
    industry: 'salon',
    name: 'Salon & Spa',
    description: 'Appointment booking, client management, staff scheduling, services',
    icon: '💇',
    color: '#EC4899',
    modules: ['salon', 'appointments', 'pos', 'invoices', 'contacts', 'reports', 'employees', 'marketing'],
    chartOfAccounts: [
      { code: '1000', name: 'Cash', type: 'asset', subtype: 'current' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'current' },
      { code: '1200', name: 'Product Inventory', type: 'asset', subtype: 'current' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current' },
      { code: '2100', name: 'HST Payable', type: 'liability', subtype: 'current' },
      { code: '2200', name: 'Gift Cards Liability', type: 'liability', subtype: 'current' },
      { code: '4000', name: 'Service Revenue', type: 'revenue' },
      { code: '4100', name: 'Product Sales', type: 'revenue' },
      { code: '4200', name: 'Tips Revenue', type: 'revenue' },
      { code: '5000', name: 'Product Cost', type: 'expense' },
      { code: '5100', name: 'Commission Expense', type: 'expense' },
      { code: '6000', name: 'Rent Expense', type: 'expense' },
      { code: '6100', name: 'Salaries Expense', type: 'expense' },
    ],
    taxRates: [
      { name: 'HST 13%', rate: 13, type: 'both' },
    ],
    services: [
      { name: "Women's Haircut", category: 'Hair', duration: 45, price: 65 },
      { name: "Men's Haircut", category: 'Hair', duration: 30, price: 35 },
      { name: 'Color & Highlights', category: 'Hair', duration: 120, price: 150 },
      { name: 'Blowout & Style', category: 'Hair', duration: 45, price: 55 },
      { name: 'Classic Manicure', category: 'Nails', duration: 30, price: 35 },
      { name: 'Gel Manicure', category: 'Nails', duration: 45, price: 50 },
      { name: 'Pedicure', category: 'Nails', duration: 60, price: 65 },
      { name: 'Deep Tissue Massage', category: 'Spa', duration: 60, price: 120 },
      { name: 'Swedish Massage', category: 'Spa', duration: 60, price: 100 },
      { name: 'Facial Treatment', category: 'Spa', duration: 75, price: 95 },
    ],
    settings: {
      currency: 'CAD',
      dateFormat: 'YYYY-MM-DD',
      fiscalYearStart: '01-01',
      defaultPaymentTerms: 0,
      invoicePrefix: 'SPA-',
      requiresAppointments: true,
      tracksInventory: true,
      hasFieldService: false,
      hasManufacturing: false,
    },
    emailTemplates: [
      {
        type: 'appointment',
        subject: 'Appointment Confirmation - {{business_name}}',
        body: 'Hi {{client_name}},\n\nYour appointment is confirmed:\n\n📅 {{date}} at {{time}}\n💇 {{service_name}} with {{staff_name}}\n📍 {{address}}\n\nSee you soon!\n\n{{business_name}}',
      },
      {
        type: 'reminder',
        subject: 'Reminder: Appointment Tomorrow',
        body: 'Hi {{client_name}},\n\nThis is a friendly reminder of your appointment tomorrow:\n\n📅 {{date}} at {{time}}\n💇 {{service_name}}\n\nNeed to reschedule? Reply to this email.\n\n{{business_name}}',
      },
    ],
  },
  {
    industry: 'auto_shop',
    name: 'Auto Repair Shop',
    description: 'Vehicle database, work orders, parts inventory, repair estimates',
    icon: '🚗',
    color: '#3B82F6',
    modules: ['auto-shop', 'inventory', 'invoices', 'contacts', 'reports', 'employees', 'purchase-orders'],
    chartOfAccounts: [
      { code: '1000', name: 'Cash', type: 'asset', subtype: 'current' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'current' },
      { code: '1200', name: 'Parts Inventory', type: 'asset', subtype: 'current' },
      { code: '1210', name: 'Fluids & Supplies', type: 'asset', subtype: 'current' },
      { code: '1500', name: 'Shop Equipment', type: 'asset', subtype: 'fixed' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current' },
      { code: '2100', name: 'HST Payable', type: 'liability', subtype: 'current' },
      { code: '4000', name: 'Labor Revenue', type: 'revenue' },
      { code: '4100', name: 'Parts Sales', type: 'revenue' },
      { code: '4200', name: 'Shop Supplies Revenue', type: 'revenue' },
      { code: '5000', name: 'Parts Cost', type: 'expense' },
      { code: '5100', name: 'Shop Supplies Cost', type: 'expense' },
      { code: '6000', name: 'Rent Expense', type: 'expense' },
      { code: '6100', name: 'Technician Wages', type: 'expense' },
      { code: '6200', name: 'Equipment Depreciation', type: 'expense' },
    ],
    taxRates: [
      { name: 'HST 13%', rate: 13, type: 'both' },
    ],
    services: [
      { name: 'Oil Change', category: 'Maintenance', duration: 30, price: 79.95 },
      { name: 'Tire Rotation', category: 'Tires', duration: 30, price: 39.95 },
      { name: 'Brake Inspection', category: 'Brakes', duration: 30, price: 49.95 },
      { name: 'Brake Pad Replacement', category: 'Brakes', duration: 90, price: 249.95 },
      { name: 'Battery Test & Replacement', category: 'Electrical', duration: 30, price: 29.95 },
      { name: 'A/C Recharge', category: 'Climate', duration: 60, price: 149.95 },
      { name: 'Wheel Alignment', category: 'Tires', duration: 60, price: 99.95 },
      { name: 'Engine Diagnostic', category: 'Engine', duration: 60, price: 99.95 },
    ],
    settings: {
      currency: 'CAD',
      dateFormat: 'YYYY-MM-DD',
      fiscalYearStart: '01-01',
      defaultPaymentTerms: 0,
      invoicePrefix: 'INV-',
      estimatePrefix: 'EST-',
      requiresAppointments: true,
      tracksInventory: true,
      hasFieldService: false,
      hasManufacturing: false,
    },
    workflows: [
      {
        name: 'Send Estimate',
        trigger: 'estimate_created',
        actions: [
          { type: 'email', config: { to: 'customer', template: 'estimate' } },
        ],
      },
      {
        name: 'Work Complete Notification',
        trigger: 'work_order_completed',
        actions: [
          { type: 'sms', config: { to: 'customer', template: 'ready_for_pickup' } },
        ],
      },
    ],
  },
  {
    industry: 'clinic',
    name: 'Medical Clinic',
    description: 'Patient records, OHIP billing, appointments, encounters, prescriptions',
    icon: '🏥',
    color: '#10B981',
    modules: ['clinic', 'appointments', 'invoices', 'contacts', 'reports', 'employees', 'documents'],
    chartOfAccounts: [
      { code: '1000', name: 'Cash', type: 'asset', subtype: 'current' },
      { code: '1100', name: 'OHIP Receivable', type: 'asset', subtype: 'current' },
      { code: '1110', name: 'Patient Receivable', type: 'asset', subtype: 'current' },
      { code: '1200', name: 'Medical Supplies', type: 'asset', subtype: 'current' },
      { code: '1500', name: 'Medical Equipment', type: 'asset', subtype: 'fixed' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current' },
      { code: '4000', name: 'OHIP Revenue', type: 'revenue' },
      { code: '4100', name: 'Non-Insured Services', type: 'revenue' },
      { code: '4200', name: 'WCB Revenue', type: 'revenue' },
      { code: '5000', name: 'Medical Supplies Cost', type: 'expense' },
      { code: '6000', name: 'Rent Expense', type: 'expense' },
      { code: '6100', name: 'Physician Fees', type: 'expense' },
      { code: '6200', name: 'Staff Salaries', type: 'expense' },
      { code: '6300', name: 'Malpractice Insurance', type: 'expense' },
    ],
    taxRates: [
      { name: 'HST 13%', rate: 13, type: 'both' },
      { name: 'Exempt (Medical)', rate: 0, type: 'sales' },
    ],
    settings: {
      currency: 'CAD',
      dateFormat: 'YYYY-MM-DD',
      fiscalYearStart: '01-01',
      defaultPaymentTerms: 30,
      invoicePrefix: 'MED-',
      requiresAppointments: true,
      tracksInventory: true,
      hasFieldService: false,
      hasManufacturing: false,
      requiresHealthCompliance: true,
    },
    emailTemplates: [
      {
        type: 'appointment',
        subject: 'Appointment Confirmation',
        body: 'Dear {{patient_name}},\n\nYour appointment is confirmed:\n\n📅 {{date}} at {{time}}\n👨‍⚕️ {{provider_name}}\n📍 {{address}}\n\nPlease bring your health card and arrive 10 minutes early.\n\n{{clinic_name}}',
      },
    ],
  },
  {
    industry: 'restaurant',
    name: 'Restaurant',
    description: 'Table management, POS, kitchen display, menu management, tips',
    icon: '🍽️',
    color: '#F59E0B',
    modules: ['pos', 'inventory', 'invoices', 'contacts', 'reports', 'employees', 'pos-restaurant'],
    chartOfAccounts: [
      { code: '1000', name: 'Cash', type: 'asset', subtype: 'current' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'current' },
      { code: '1200', name: 'Food Inventory', type: 'asset', subtype: 'current' },
      { code: '1210', name: 'Beverage Inventory', type: 'asset', subtype: 'current' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current' },
      { code: '2100', name: 'HST Payable', type: 'liability', subtype: 'current' },
      { code: '2200', name: 'Tips Payable', type: 'liability', subtype: 'current' },
      { code: '4000', name: 'Food Sales', type: 'revenue' },
      { code: '4100', name: 'Beverage Sales', type: 'revenue' },
      { code: '4200', name: 'Catering Revenue', type: 'revenue' },
      { code: '5000', name: 'Food Cost', type: 'expense' },
      { code: '5100', name: 'Beverage Cost', type: 'expense' },
      { code: '6000', name: 'Rent Expense', type: 'expense' },
      { code: '6100', name: 'Kitchen Wages', type: 'expense' },
      { code: '6110', name: 'Server Wages', type: 'expense' },
    ],
    taxRates: [
      { name: 'HST 13%', rate: 13, type: 'both' },
    ],
    settings: {
      currency: 'CAD',
      dateFormat: 'YYYY-MM-DD',
      fiscalYearStart: '01-01',
      defaultPaymentTerms: 0,
      requiresAppointments: false,
      tracksInventory: true,
      hasFieldService: false,
      hasManufacturing: false,
    },
  },
  {
    industry: 'contractor',
    name: 'Contractor',
    description: 'Job costing, estimates, project management, field service',
    icon: '🔧',
    color: '#6366F1',
    modules: ['projects', 'field-service', 'invoices', 'estimates', 'contacts', 'reports', 'employees', 'inventory'],
    chartOfAccounts: [
      { code: '1000', name: 'Cash', type: 'asset', subtype: 'current' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'current' },
      { code: '1200', name: 'Materials Inventory', type: 'asset', subtype: 'current' },
      { code: '1500', name: 'Equipment', type: 'asset', subtype: 'fixed' },
      { code: '1510', name: 'Vehicles', type: 'asset', subtype: 'fixed' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current' },
      { code: '2100', name: 'HST Payable', type: 'liability', subtype: 'current' },
      { code: '4000', name: 'Contract Revenue', type: 'revenue' },
      { code: '4100', name: 'Service Revenue', type: 'revenue' },
      { code: '5000', name: 'Materials Cost', type: 'expense' },
      { code: '5100', name: 'Subcontractor Cost', type: 'expense' },
      { code: '6000', name: 'Vehicle Expense', type: 'expense' },
      { code: '6100', name: 'Labor Cost', type: 'expense' },
      { code: '6200', name: 'Insurance Expense', type: 'expense' },
    ],
    taxRates: [
      { name: 'HST 13%', rate: 13, type: 'both' },
    ],
    settings: {
      currency: 'CAD',
      dateFormat: 'YYYY-MM-DD',
      fiscalYearStart: '01-01',
      defaultPaymentTerms: 30,
      invoicePrefix: 'INV-',
      estimatePrefix: 'EST-',
      requiresAppointments: true,
      tracksInventory: true,
      hasFieldService: true,
      hasManufacturing: false,
    },
  },
  {
    industry: 'retail',
    name: 'Retail Store',
    description: 'POS, inventory management, e-commerce, loyalty programs',
    icon: '🏪',
    color: '#8B5CF6',
    modules: ['pos', 'inventory', 'invoices', 'contacts', 'reports', 'employees', 'marketing'],
    chartOfAccounts: [
      { code: '1000', name: 'Cash', type: 'asset', subtype: 'current' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'current' },
      { code: '1200', name: 'Merchandise Inventory', type: 'asset', subtype: 'current' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current' },
      { code: '2100', name: 'HST Payable', type: 'liability', subtype: 'current' },
      { code: '4000', name: 'Sales Revenue', type: 'revenue' },
      { code: '4100', name: 'Gift Card Revenue', type: 'revenue' },
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
      { code: '6000', name: 'Rent Expense', type: 'expense' },
      { code: '6100', name: 'Salaries Expense', type: 'expense' },
      { code: '6200', name: 'Advertising Expense', type: 'expense' },
    ],
    taxRates: [
      { name: 'HST 13%', rate: 13, type: 'both' },
    ],
    settings: {
      currency: 'CAD',
      dateFormat: 'YYYY-MM-DD',
      fiscalYearStart: '01-01',
      defaultPaymentTerms: 0,
      invoicePrefix: 'REC-',
      requiresAppointments: false,
      tracksInventory: true,
      hasFieldService: false,
      hasManufacturing: false,
    },
  },
  {
    industry: 'wholesaler',
    name: 'Wholesaler',
    description: 'B2B pricing, bulk orders, multi-warehouse, customer portals',
    icon: '📦',
    color: '#14B8A6',
    modules: ['inventory', 'warehouses', 'invoices', 'purchase-orders', 'contacts', 'reports', 'employees', 'crm'],
    chartOfAccounts: [
      { code: '1000', name: 'Cash', type: 'asset', subtype: 'current' },
      { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'current' },
      { code: '1200', name: 'Inventory - Warehouse 1', type: 'asset', subtype: 'current' },
      { code: '1210', name: 'Inventory - Warehouse 2', type: 'asset', subtype: 'current' },
      { code: '2000', name: 'Accounts Payable', type: 'liability', subtype: 'current' },
      { code: '2100', name: 'HST Payable', type: 'liability', subtype: 'current' },
      { code: '4000', name: 'Wholesale Revenue', type: 'revenue' },
      { code: '4100', name: 'Shipping Revenue', type: 'revenue' },
      { code: '5000', name: 'Cost of Goods Sold', type: 'expense' },
      { code: '5100', name: 'Freight In', type: 'expense' },
      { code: '6000', name: 'Warehouse Rent', type: 'expense' },
      { code: '6100', name: 'Shipping Expense', type: 'expense' },
    ],
    taxRates: [
      { name: 'HST 13%', rate: 13, type: 'both' },
    ],
    settings: {
      currency: 'CAD',
      dateFormat: 'YYYY-MM-DD',
      fiscalYearStart: '01-01',
      defaultPaymentTerms: 30,
      invoicePrefix: 'WHL-',
      poPrefix: 'PO-',
      requiresAppointments: false,
      tracksInventory: true,
      hasFieldService: false,
      hasManufacturing: false,
    },
  },
];

class IndustryTemplateService {
  private supabase = createClient();

  getTemplates(): IndustryTemplate[] {
    return INDUSTRY_TEMPLATES;
  }

  getTemplate(industry: IndustryType): IndustryTemplate | undefined {
    return INDUSTRY_TEMPLATES.find(t => t.industry === industry);
  }

  async applyTemplate(organizationId: string, industry: IndustryType) {
    const template = this.getTemplate(industry);
    if (!template) throw new Error(`Template not found for industry: ${industry}`);

    // 1. Update organization with industry
    await this.supabase
      .from('organizations')
      .update({ 
        industry,
        settings: template.settings,
      })
      .eq('id', organizationId);

    // 2. Create chart of accounts
    if (template.chartOfAccounts.length > 0) {
      const accounts = template.chartOfAccounts.map(acc => ({
        organization_id: organizationId,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype,
        is_active: true,
      }));

      await this.supabase
        .from('chart_of_accounts')
        .upsert(accounts, { onConflict: 'organization_id,code' });
    }

    // 3. Create tax rates
    if (template.taxRates.length > 0) {
      const taxRates = template.taxRates.map(rate => ({
        organization_id: organizationId,
        name: rate.name,
        rate: rate.rate,
        type: rate.type,
        is_active: true,
      }));

      await this.supabase
        .from('tax_rates')
        .upsert(taxRates, { onConflict: 'organization_id,name' });
    }

    // 4. Create sample services if applicable
    if (template.services && template.services.length > 0) {
      const tableName = industry === 'salon' ? 'salon_services' : 
                        industry === 'auto_shop' ? 'auto_services' : null;

      if (tableName) {
        const services = template.services.map(svc => ({
          organization_id: organizationId,
          name: svc.name,
          category: svc.category,
          duration: svc.duration,
          price: svc.price,
          is_active: true,
        }));

        await this.supabase.from(tableName).insert(services);
      }
    }

    // 5. Initialize industry-specific data
    if (industry === 'clinic') {
      // Initialize OHIP codes
      const { clinicService } = await import('./clinic');
      await clinicService.initializeOHIPCodes(organizationId);
    }

    // 6. Create email templates
    if (template.emailTemplates && template.emailTemplates.length > 0) {
      const emailTemplates = template.emailTemplates.map(tmpl => ({
        organization_id: organizationId,
        type: tmpl.type,
        subject: tmpl.subject,
        body: tmpl.body,
        is_active: true,
      }));

      await this.supabase
        .from('email_templates')
        .insert(emailTemplates);
    }

    return { success: true, industry, modules: template.modules };
  }

  getModulesForIndustry(industry: IndustryType): string[] {
    const template = this.getTemplate(industry);
    return template?.modules || [];
  }
}

export const industryTemplateService = new IndustryTemplateService();
