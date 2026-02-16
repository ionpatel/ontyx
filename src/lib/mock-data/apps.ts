export type AppCategory = "payment" | "accounting" | "communication" | "ecommerce" | "shipping" | "documents" | "analytics" | "automation"
export type AppStatus = "available" | "connected" | "coming_soon"

export interface Integration {
  id: string
  name: string
  description: string
  longDescription: string
  category: AppCategory
  status: AppStatus
  icon: string
  color: string
  features: string[]
  pricing: string
  website: string
  setupSteps?: string[]
}

export const APP_CATEGORIES: { value: AppCategory; label: string; description: string }[] = [
  { value: "payment", label: "Payment Processing", description: "Accept payments from customers" },
  { value: "accounting", label: "Accounting", description: "Sync with accounting software" },
  { value: "communication", label: "Communication", description: "Email, SMS & messaging" },
  { value: "ecommerce", label: "E-Commerce", description: "Online store connectors" },
  { value: "shipping", label: "Shipping & Logistics", description: "Shipping rate calculators & tracking" },
  { value: "documents", label: "Document Storage", description: "Cloud file storage & sync" },
  { value: "analytics", label: "Analytics", description: "Business intelligence tools" },
  { value: "automation", label: "Automation", description: "Workflow automation" },
]

export const mockIntegrations: Integration[] = [
  // Payment
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments online with the world's leading payment processor",
    longDescription: "Stripe powers online payments for millions of businesses. Connect your Ontyx account to accept credit cards, ACH transfers, and 135+ currencies. Automatically sync payments with invoices and reconcile your books.",
    category: "payment",
    status: "available",
    icon: "CreditCard",
    color: "#635BFF",
    features: ["Credit/debit card processing", "ACH & wire transfers", "135+ currency support", "Automatic invoice matching", "Refund management", "Subscription billing", "PCI compliant"],
    pricing: "2.9% + $0.30 per transaction",
    website: "https://stripe.com",
    setupSteps: ["Create Stripe account", "Connect API keys", "Configure webhooks", "Test with sandbox"],
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Accept PayPal payments and PayPal Credit from your customers",
    longDescription: "PayPal is the world's most popular digital wallet. Let customers pay invoices directly through PayPal, Venmo, or PayPal Credit. Funds appear in your account instantly.",
    category: "payment",
    status: "available",
    icon: "Wallet",
    color: "#003087",
    features: ["PayPal checkout", "Venmo payments", "PayPal Credit / Pay Later", "Invoice payment links", "Buyer protection", "International payments"],
    pricing: "2.99% + $0.49 per transaction",
    website: "https://paypal.com",
    setupSteps: ["Link PayPal Business account", "Configure IPN settings", "Enable payment methods"],
  },
  {
    id: "square",
    name: "Square",
    description: "In-person and online payment processing with POS integration",
    longDescription: "Square provides a complete payment ecosystem — from in-person card readers to online invoicing. Perfect for businesses that sell both online and in-store.",
    category: "payment",
    status: "available",
    icon: "Smartphone",
    color: "#006AFF",
    features: ["In-person card reader", "Online payments", "POS integration", "Tap to pay", "Invoice payments", "Inventory sync"],
    pricing: "2.6% + $0.10 per tap/dip/swipe",
    website: "https://squareup.com",
    setupSteps: ["Create Square Developer account", "Generate API credentials", "Configure locations"],
  },
  // Accounting
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    description: "Bi-directional sync with QuickBooks for seamless accounting",
    longDescription: "Keep your books in perfect sync. Ontyx automatically pushes invoices, bills, and payments to QuickBooks, and pulls chart of accounts and tax information back. No more double entry.",
    category: "accounting",
    status: "available",
    icon: "Calculator",
    color: "#2CA01C",
    features: ["2-way invoice sync", "Expense tracking", "Chart of accounts sync", "Tax code mapping", "Bank reconciliation", "Financial reports", "Multi-currency"],
    pricing: "Included with QuickBooks subscription",
    website: "https://quickbooks.intuit.com",
    setupSteps: ["Authorize QuickBooks account", "Map chart of accounts", "Configure sync settings", "Run initial sync"],
  },
  {
    id: "bank-feeds",
    name: "Bank Feed Import",
    description: "Import bank transactions directly from your financial institution",
    longDescription: "Connect your bank accounts to automatically import transactions. Ontyx uses OFX/QFX file import and direct bank feeds to keep your banking data up to date for reconciliation.",
    category: "accounting",
    status: "available",
    icon: "Landmark",
    color: "#1A1A2E",
    features: ["Direct bank connection", "OFX/QFX file import", "CSV bank statement import", "Auto-categorization", "Reconciliation rules", "Multi-account support"],
    pricing: "Free (included)",
    website: "#",
    setupSteps: ["Select your bank", "Verify account", "Set import schedule"],
  },
  // Communication
  {
    id: "email-templates",
    name: "Email Templates",
    description: "Professional email templates for invoices, quotes, and reminders",
    longDescription: "Create beautiful, branded email templates for all your business communications. Send invoices, quotes, payment reminders, and purchase orders with one click.",
    category: "communication",
    status: "connected",
    icon: "Mail",
    color: "#EA4335",
    features: ["Invoice email templates", "Quote email templates", "Payment reminders", "Custom branding", "SMTP configuration", "Email tracking", "Scheduled sending"],
    pricing: "Free (included)",
    website: "#",
  },
  {
    id: "sms-notifications",
    name: "SMS Notifications",
    description: "Send SMS alerts for payment reminders and order updates",
    longDescription: "Keep your customers informed with timely SMS notifications. Send payment reminders, order confirmations, shipping updates, and custom messages via Twilio integration.",
    category: "communication",
    status: "available",
    icon: "MessageSquare",
    color: "#F22F46",
    features: ["Payment reminders", "Order confirmations", "Shipping updates", "Custom messages", "Twilio integration", "Opt-in management", "Delivery tracking"],
    pricing: "Pay per message via Twilio",
    website: "https://twilio.com",
    setupSteps: ["Create Twilio account", "Add API credentials", "Configure phone number", "Set notification triggers"],
  },
  // E-commerce
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync products, orders, and inventory with your Shopify store",
    longDescription: "Connect your Shopify store to Ontyx for a unified view of your business. Sync products, pull orders automatically, and keep inventory levels accurate across all channels.",
    category: "ecommerce",
    status: "available",
    icon: "ShoppingBag",
    color: "#96BF48",
    features: ["Product sync", "Order import", "Inventory sync", "Customer sync", "Multi-location", "Variant support", "Webhook integration"],
    pricing: "Free connector (Shopify subscription required)",
    website: "https://shopify.com",
    setupSteps: ["Install Ontyx app on Shopify", "Authorize access", "Map products", "Enable auto-sync"],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    description: "Connect your WordPress WooCommerce store with Ontyx",
    longDescription: "Integrate your WooCommerce store with Ontyx ERP. Manage products, fulfill orders, and track inventory from a single dashboard. Perfect for WordPress-based shops.",
    category: "ecommerce",
    status: "available",
    icon: "Store",
    color: "#96588A",
    features: ["Product sync", "Order management", "Inventory tracking", "Customer data sync", "Tax calculation", "Shipping integration", "REST API"],
    pricing: "Free connector",
    website: "https://woocommerce.com",
    setupSteps: ["Generate WooCommerce API keys", "Enter store URL", "Configure sync options", "Test connection"],
  },
  // Shipping
  {
    id: "canada-post",
    name: "Canada Post",
    description: "Get real-time shipping rates and print labels through Canada Post",
    longDescription: "Integrate with Canada Post for domestic and international shipping. Get live rate quotes, generate shipping labels, and track packages — all from within Ontyx.",
    category: "shipping",
    status: "available",
    icon: "Truck",
    color: "#D71920",
    features: ["Real-time rate calculation", "Label generation", "Package tracking", "Pickup scheduling", "Domestic & international", "Insurance", "Returns management"],
    pricing: "Pay per shipment (Canada Post rates)",
    website: "https://canadapost.ca",
    setupSteps: ["Create Canada Post developer account", "Add API credentials", "Configure default package sizes"],
  },
  {
    id: "ups",
    name: "UPS",
    description: "Ship with UPS — rates, labels, and tracking integrated",
    longDescription: "Connect with UPS for enterprise-grade shipping. Compare service levels, generate labels, and provide customers with real-time tracking updates.",
    category: "shipping",
    status: "available",
    icon: "Package",
    color: "#351C15",
    features: ["Rate comparison", "Label printing", "Real-time tracking", "Multiple service levels", "International shipping", "Customs documentation", "Address validation"],
    pricing: "Pay per shipment (UPS rates)",
    website: "https://ups.com",
    setupSteps: ["Create UPS Developer account", "Connect OAuth credentials", "Set default preferences"],
  },
  {
    id: "fedex",
    name: "FedEx",
    description: "FedEx shipping integration with rate calculator and tracking",
    longDescription: "Integrate FedEx shipping directly into your workflow. Get instant rate quotes, print shipping labels, and automatically update order tracking information.",
    category: "shipping",
    status: "available",
    icon: "Plane",
    color: "#4D148C",
    features: ["Rate calculator", "Express & ground options", "Label generation", "Package tracking", "International shipping", "Saturday delivery", "Hold at location"],
    pricing: "Pay per shipment (FedEx rates)",
    website: "https://fedex.com",
    setupSteps: ["Register for FedEx API access", "Configure API keys", "Set shipping preferences"],
  },
  // Documents
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Store and sync your business documents with Google Drive",
    longDescription: "Automatically backup invoices, contracts, and reports to Google Drive. Access your business documents from anywhere and share them securely with your team.",
    category: "documents",
    status: "available",
    icon: "Cloud",
    color: "#4285F4",
    features: ["Auto-backup documents", "Folder organization", "File sharing", "Version history", "Search integration", "Google Docs editing", "15GB free storage"],
    pricing: "Free (15GB) / Google Workspace plans",
    website: "https://drive.google.com",
    setupSteps: ["Authorize Google account", "Select backup folder", "Configure auto-sync rules"],
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Sync files and documents with your Dropbox Business account",
    longDescription: "Keep your business files in sync with Dropbox. Automatically upload generated documents, share files with clients, and maintain a complete document history.",
    category: "documents",
    status: "available",
    icon: "HardDrive",
    color: "#0061FF",
    features: ["File sync", "Smart folder structure", "Sharing links", "Version history", "Team collaboration", "Offline access", "2GB free storage"],
    pricing: "Free (2GB) / Dropbox Business plans",
    website: "https://dropbox.com",
    setupSteps: ["Connect Dropbox account", "Choose sync folder", "Set upload preferences"],
  },
  // Analytics
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Track customer behavior on your invoices and client portal",
    longDescription: "Understand how customers interact with your invoices and client portal. Track views, payment conversions, and optimize your billing workflow.",
    category: "analytics",
    status: "coming_soon",
    icon: "TrendingUp",
    color: "#F9AB00",
    features: ["Invoice view tracking", "Payment conversion analytics", "Client portal usage", "Custom dashboards", "Event tracking"],
    pricing: "Free",
    website: "https://analytics.google.com",
  },
  // Automation
  {
    id: "zapier",
    name: "Zapier",
    description: "Connect Ontyx to 5,000+ apps with automated workflows",
    longDescription: "Build powerful automated workflows between Ontyx and thousands of other apps. Trigger actions when invoices are paid, contacts are created, or inventory reaches reorder levels.",
    category: "automation",
    status: "coming_soon",
    icon: "Zap",
    color: "#FF4A00",
    features: ["5,000+ app connections", "Custom triggers", "Multi-step workflows", "Filters & conditions", "Error handling"],
    pricing: "Free tier available / Paid plans from $19.99/mo",
    website: "https://zapier.com",
  },
]

export function getAppsByCategory(category: AppCategory): Integration[] {
  return mockIntegrations.filter(app => app.category === category)
}

export function getConnectedApps(): Integration[] {
  return mockIntegrations.filter(app => app.status === "connected")
}

export function getAppSummary() {
  return {
    total: mockIntegrations.length,
    available: mockIntegrations.filter(a => a.status === "available").length,
    connected: mockIntegrations.filter(a => a.status === "connected").length,
    comingSoon: mockIntegrations.filter(a => a.status === "coming_soon").length,
  }
}
