export type DocumentCategory = "invoices" | "receipts" | "contracts" | "reports" | "tax" | "hr" | "general"
export type DocumentStatus = "active" | "archived" | "draft"

export interface DocumentFile {
  id: string
  name: string
  category: DocumentCategory
  status: DocumentStatus
  mimeType: string
  size: number
  url: string
  thumbnailUrl?: string
  tags: string[]
  description?: string
  version: number
  versions: DocumentVersion[]
  uploadedBy: string
  createdAt: string
  updatedAt: string
  linkedTo?: { type: "invoice" | "contact" | "po" | "employee"; id: string; name: string }
}

export interface DocumentVersion {
  id: string
  version: number
  name: string
  size: number
  url: string
  uploadedBy: string
  notes?: string
  createdAt: string
}

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string; icon: string }[] = [
  { value: "invoices", label: "Invoices", icon: "FileText" },
  { value: "receipts", label: "Receipts", icon: "Receipt" },
  { value: "contracts", label: "Contracts", icon: "FileSignature" },
  { value: "reports", label: "Reports", icon: "BarChart3" },
  { value: "tax", label: "Tax Documents", icon: "Calculator" },
  { value: "hr", label: "HR Documents", icon: "Users" },
  { value: "general", label: "General", icon: "Folder" },
]

export const mockDocuments: DocumentFile[] = [
  {
    id: "doc-001",
    name: "Invoice_INV-2025-001.pdf",
    category: "invoices",
    status: "active",
    mimeType: "application/pdf",
    size: 245000,
    url: "/documents/invoice-001.pdf",
    tags: ["invoice", "customer-a"],
    description: "Invoice for January services",
    version: 2,
    versions: [
      { id: "dv-001", version: 1, name: "Invoice_INV-2025-001_v1.pdf", size: 230000, url: "/documents/invoice-001-v1.pdf", uploadedBy: "Admin", createdAt: "2025-01-15T10:00:00Z" },
      { id: "dv-002", version: 2, name: "Invoice_INV-2025-001.pdf", size: 245000, url: "/documents/invoice-001.pdf", uploadedBy: "Admin", notes: "Updated line items", createdAt: "2025-01-16T14:00:00Z" },
    ],
    uploadedBy: "Admin",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-16T14:00:00Z",
    linkedTo: { type: "invoice", id: "inv-001", name: "INV-2025-001" },
  },
  {
    id: "doc-002",
    name: "Contract_AcmeSupplies_2025.pdf",
    category: "contracts",
    status: "active",
    mimeType: "application/pdf",
    size: 1200000,
    url: "/documents/contract-acme-2025.pdf",
    tags: ["contract", "vendor", "2025"],
    description: "Annual supply agreement with Acme Supplies",
    version: 1,
    versions: [
      { id: "dv-003", version: 1, name: "Contract_AcmeSupplies_2025.pdf", size: 1200000, url: "/documents/contract-acme-2025.pdf", uploadedBy: "Admin", createdAt: "2025-01-05T09:00:00Z" },
    ],
    uploadedBy: "Admin",
    createdAt: "2025-01-05T09:00:00Z",
    updatedAt: "2025-01-05T09:00:00Z",
    linkedTo: { type: "contact", id: "v-001", name: "Acme Supplies Co." },
  },
  {
    id: "doc-003",
    name: "Q4_2024_Financial_Report.xlsx",
    category: "reports",
    status: "active",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 850000,
    url: "/documents/q4-2024-report.xlsx",
    tags: ["report", "financial", "q4", "2024"],
    description: "Quarterly financial report Q4 2024",
    version: 3,
    versions: [
      { id: "dv-004", version: 1, name: "Q4_2024_Financial_Report_v1.xlsx", size: 780000, url: "/documents/q4-2024-report-v1.xlsx", uploadedBy: "Finance Team", createdAt: "2025-01-10T08:00:00Z" },
      { id: "dv-005", version: 2, name: "Q4_2024_Financial_Report_v2.xlsx", size: 820000, url: "/documents/q4-2024-report-v2.xlsx", uploadedBy: "Finance Team", notes: "Added depreciation", createdAt: "2025-01-12T11:00:00Z" },
      { id: "dv-006", version: 3, name: "Q4_2024_Financial_Report.xlsx", size: 850000, url: "/documents/q4-2024-report.xlsx", uploadedBy: "CFO", notes: "Final approved version", createdAt: "2025-01-14T16:00:00Z" },
    ],
    uploadedBy: "Finance Team",
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-01-14T16:00:00Z",
  },
  {
    id: "doc-004",
    name: "T4_Summary_2024.pdf",
    category: "tax",
    status: "active",
    mimeType: "application/pdf",
    size: 320000,
    url: "/documents/t4-summary-2024.pdf",
    tags: ["tax", "t4", "2024", "payroll"],
    description: "T4 Summary for CRA filing",
    version: 1,
    versions: [
      { id: "dv-007", version: 1, name: "T4_Summary_2024.pdf", size: 320000, url: "/documents/t4-summary-2024.pdf", uploadedBy: "HR", createdAt: "2025-02-01T10:00:00Z" },
    ],
    uploadedBy: "HR",
    createdAt: "2025-02-01T10:00:00Z",
    updatedAt: "2025-02-01T10:00:00Z",
  },
  {
    id: "doc-005",
    name: "Employee_Handbook_2025.pdf",
    category: "hr",
    status: "active",
    mimeType: "application/pdf",
    size: 2400000,
    url: "/documents/employee-handbook-2025.pdf",
    tags: ["hr", "handbook", "policy"],
    description: "Updated employee handbook for 2025",
    version: 1,
    versions: [
      { id: "dv-008", version: 1, name: "Employee_Handbook_2025.pdf", size: 2400000, url: "/documents/employee-handbook-2025.pdf", uploadedBy: "HR", createdAt: "2025-01-02T09:00:00Z" },
    ],
    uploadedBy: "HR",
    createdAt: "2025-01-02T09:00:00Z",
    updatedAt: "2025-01-02T09:00:00Z",
  },
  {
    id: "doc-006",
    name: "Receipt_CanadaPost_Feb2025.png",
    category: "receipts",
    status: "active",
    mimeType: "image/png",
    size: 180000,
    url: "/documents/receipt-cp-feb2025.png",
    thumbnailUrl: "/documents/receipt-cp-feb2025-thumb.png",
    tags: ["receipt", "shipping", "canada-post"],
    description: "Shipping receipt for February batch",
    version: 1,
    versions: [
      { id: "dv-009", version: 1, name: "Receipt_CanadaPost_Feb2025.png", size: 180000, url: "/documents/receipt-cp-feb2025.png", uploadedBy: "Operations", createdAt: "2025-02-10T13:00:00Z" },
    ],
    uploadedBy: "Operations",
    createdAt: "2025-02-10T13:00:00Z",
    updatedAt: "2025-02-10T13:00:00Z",
  },
  {
    id: "doc-007",
    name: "Warehouse_Lease_Agreement.pdf",
    category: "contracts",
    status: "active",
    mimeType: "application/pdf",
    size: 3100000,
    url: "/documents/warehouse-lease.pdf",
    tags: ["contract", "lease", "warehouse"],
    description: "Main warehouse lease agreement 2024-2027",
    version: 1,
    versions: [
      { id: "dv-010", version: 1, name: "Warehouse_Lease_Agreement.pdf", size: 3100000, url: "/documents/warehouse-lease.pdf", uploadedBy: "Legal", createdAt: "2024-06-15T10:00:00Z" },
    ],
    uploadedBy: "Legal",
    createdAt: "2024-06-15T10:00:00Z",
    updatedAt: "2024-06-15T10:00:00Z",
  },
  {
    id: "doc-008",
    name: "PO_Backup_Jan2025.zip",
    category: "general",
    status: "archived",
    mimeType: "application/zip",
    size: 5600000,
    url: "/documents/po-backup-jan2025.zip",
    tags: ["backup", "purchase-orders", "archive"],
    description: "Monthly PO backup archive",
    version: 1,
    versions: [
      { id: "dv-011", version: 1, name: "PO_Backup_Jan2025.zip", size: 5600000, url: "/documents/po-backup-jan2025.zip", uploadedBy: "System", createdAt: "2025-02-01T00:00:00Z" },
    ],
    uploadedBy: "System",
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2025-02-01T00:00:00Z",
  },
]

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getDocumentSummary() {
  const total = mockDocuments.length
  const active = mockDocuments.filter(d => d.status === "active").length
  const archived = mockDocuments.filter(d => d.status === "archived").length
  const totalSize = mockDocuments.reduce((sum, d) => sum + d.size, 0)
  const byCategory = DOCUMENT_CATEGORIES.map(cat => ({
    ...cat,
    count: mockDocuments.filter(d => d.category === cat.value).length,
  }))
  return { total, active, archived, totalSize, byCategory }
}
