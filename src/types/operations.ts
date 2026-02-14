// ==========================================
// INVENTORY TYPES
// ==========================================

export type ProductStatus = "active" | "inactive" | "discontinued" | "out_of_stock"
export type StockMovementType = "in" | "out" | "adjustment" | "transfer"

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  productCount: number
  isActive: boolean
  createdAt: string
}

export interface Product {
  id: string
  sku: string
  barcode?: string
  name: string
  description?: string
  categoryId: string
  categoryName: string
  status: ProductStatus
  unitPrice: number
  costPrice: number
  taxRate: number
  stockQuantity: number
  reorderLevel: number
  reorderQuantity: number
  unit: string
  weight?: number
  dimensions?: { length: number; width: number; height: number }
  imageUrl?: string
  tags?: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  type: StockMovementType
  quantity: number
  previousStock: number
  newStock: number
  reference?: string
  notes?: string
  createdAt: string
  createdBy: string
}

// ==========================================
// WAREHOUSE TYPES
// ==========================================

export type WarehouseStatus = "active" | "inactive" | "maintenance"
export type TransferStatus = "pending" | "in_transit" | "completed" | "cancelled"

export interface Warehouse {
  id: string
  code: string
  name: string
  address: string
  city: string
  country: string
  status: WarehouseStatus
  capacity: number
  usedCapacity: number
  managerId?: string
  managerName?: string
  phone?: string
  email?: string
  zones: WarehouseZone[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface WarehouseZone {
  id: string
  warehouseId: string
  name: string
  code: string
  type: "storage" | "picking" | "receiving" | "shipping" | "staging"
  binLocations: BinLocation[]
  capacity: number
  usedCapacity: number
  isActive: boolean
}

export interface BinLocation {
  id: string
  zoneId: string
  code: string
  aisle: string
  rack: string
  shelf: string
  bin: string
  capacity: number
  currentStock: number
  productId?: string
  productName?: string
  isAvailable: boolean
}

export interface StockTransfer {
  id: string
  transferNumber: string
  fromWarehouseId: string
  fromWarehouseName: string
  toWarehouseId: string
  toWarehouseName: string
  status: TransferStatus
  items: TransferItem[]
  totalItems: number
  totalQuantity: number
  notes?: string
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface TransferItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  fromBinId?: string
  toBinId?: string
}

// ==========================================
// SALES TYPES
// ==========================================

export type SalesOrderStatus = "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned"
export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired"
export type ShippingMethod = "standard" | "express" | "overnight" | "pickup"
export type PaymentStatus = "pending" | "partial" | "paid" | "refunded"

export interface SalesOrder {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  shippingAddress: Address
  billingAddress?: Address
  status: SalesOrderStatus
  paymentStatus: PaymentStatus
  items: SalesOrderItem[]
  subtotal: number
  taxTotal: number
  shippingCost: number
  discount: number
  total: number
  amountPaid: number
  amountDue: number
  currency: string
  shippingMethod: ShippingMethod
  trackingNumber?: string
  notes?: string
  internalNotes?: string
  quoteId?: string
  invoiceId?: string
  warehouseId?: string
  orderDate: string
  expectedDelivery?: string
  shippedAt?: string
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

export interface SalesOrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
  total: number
  fulfilledQuantity: number
  backorderedQuantity: number
}

export interface Quote {
  id: string
  quoteNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  status: QuoteStatus
  items: QuoteItem[]
  subtotal: number
  taxTotal: number
  discount: number
  total: number
  currency: string
  validUntil: string
  notes?: string
  terms?: string
  convertedOrderId?: string
  createdAt: string
  updatedAt: string
  sentAt?: string
}

export interface QuoteItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount: number
  total: number
}

export interface Address {
  street: string
  city: string
  state?: string
  postalCode: string
  country: string
}

// ==========================================
// PURCHASES TYPES
// ==========================================

export type PurchaseOrderStatus = "draft" | "sent" | "confirmed" | "partial" | "received" | "cancelled"
export type ReceivingStatus = "pending" | "partial" | "complete"

export interface Vendor {
  id: string
  code: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  contactName?: string
  paymentTerms: string
  currency: string
  taxId?: string
  rating?: number
  notes?: string
  isActive: boolean
  totalOrders: number
  totalSpent: number
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  vendorName: string
  vendorEmail?: string
  status: PurchaseOrderStatus
  receivingStatus: ReceivingStatus
  items: PurchaseOrderItem[]
  subtotal: number
  taxTotal: number
  shippingCost: number
  total: number
  amountPaid: number
  currency: string
  warehouseId: string
  warehouseName: string
  expectedDelivery?: string
  notes?: string
  internalNotes?: string
  orderDate: string
  sentAt?: string
  confirmedAt?: string
  receivedAt?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface PurchaseOrderItem {
  id: string
  productId: string
  productName: string
  sku: string
  quantity: number
  receivedQuantity: number
  unitCost: number
  taxRate: number
  total: number
}

export interface GoodsReceipt {
  id: string
  receiptNumber: string
  purchaseOrderId: string
  poNumber: string
  vendorId: string
  vendorName: string
  warehouseId: string
  warehouseName: string
  items: GoodsReceiptItem[]
  totalQuantity: number
  notes?: string
  receivedBy: string
  receivedAt: string
  createdAt: string
}

export interface GoodsReceiptItem {
  id: string
  productId: string
  productName: string
  sku: string
  orderedQuantity: number
  receivedQuantity: number
  binLocationId?: string
  condition: "good" | "damaged" | "rejected"
  notes?: string
}

// ==========================================
// REORDER TYPES
// ==========================================

export interface ReorderSuggestion {
  id: string
  productId: string
  productName: string
  sku: string
  currentStock: number
  reorderLevel: number
  reorderQuantity: number
  preferredVendorId?: string
  preferredVendorName?: string
  lastOrderDate?: string
  avgLeadTime?: number
  priority: "critical" | "high" | "medium" | "low"
}
