// ==========================================
// IMPORT / EXPORT UTILITIES
// ==========================================

/**
 * Parse CSV string into array of objects
 */
export function parseCSV<T extends Record<string, string>>(
  csvString: string,
  headerMap?: Record<string, string>
): T[] {
  const lines = csvString.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""))
  const mappedHeaders = headers.map(h => (headerMap?.[h] || h))

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: Record<string, string> = {}
    mappedHeaders.forEach((header, i) => {
      obj[header] = values[i]?.trim().replace(/^"|"$/g, "") || ""
    })
    return obj as T
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

/**
 * Convert array of objects to CSV string
 */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; header: string }[]
): string {
  if (data.length === 0) return ""

  const cols = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    header: key as string,
  }))

  const header = cols.map(c => `"${c.header}"`).join(",")
  const rows = data.map(row =>
    cols.map(c => {
      const val = row[c.key]
      const str = val === null || val === undefined ? "" : String(val)
      return `"${str.replace(/"/g, '""')}"`
    }).join(",")
  )

  return [header, ...rows].join("\n")
}

/**
 * Trigger browser download of a string as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/csv") {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download array as CSV
 */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
) {
  const csv = toCSV(data, columns)
  downloadFile(csv, filename, "text/csv")
}

/**
 * Read uploaded file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * Simple Excel XML export (works in all spreadsheet apps)
 */
export function toExcelXML<T extends Record<string, unknown>>(
  data: T[],
  sheetName: string = "Sheet1",
  columns?: { key: keyof T; header: string; type?: "string" | "number" | "date" }[]
): string {
  if (data.length === 0) return ""

  const cols = columns || Object.keys(data[0]).map(key => ({
    key: key as keyof T,
    header: key as string,
    type: "string" as const,
  }))

  const headerRow = cols.map(c =>
    `<Cell><Data ss:Type="String">${escapeXml(c.header)}</Data></Cell>`
  ).join("")

  const dataRows = data.map(row =>
    cols.map(c => {
      const val = row[c.key]
      const str = val === null || val === undefined ? "" : String(val)
      const type = c.type === "number" && !isNaN(Number(str)) ? "Number" : "String"
      return `<Cell><Data ss:Type="${type}">${escapeXml(str)}</Data></Cell>`
    }).join("")
  ).map(cells => `<Row>${cells}</Row>`).join("\n")

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Size="11"/>
      <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF" ss:Bold="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>
      <Row ss:StyleID="header">${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Download as Excel XML
 */
export function downloadExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName?: string,
  columns?: { key: keyof T; header: string; type?: "string" | "number" | "date" }[]
) {
  const xml = toExcelXML(data, sheetName, columns)
  downloadFile(xml, filename.endsWith(".xls") ? filename : `${filename}.xls`, "application/vnd.ms-excel")
}

/**
 * Generate simple PDF content (HTML-based, for window.print())
 */
export function generatePrintableHTML(options: {
  title: string
  companyName?: string
  content: string
  styles?: string
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${options.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: 700; color: #4F46E5; }
    .doc-title { font-size: 28px; font-weight: 700; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
    .total-row td { font-weight: 700; border-top: 2px solid #1a1a1a; }
    .text-right { text-align: right; }
    .mt-4 { margin-top: 16px; }
    .mb-4 { margin-bottom: 16px; }
    .text-muted { color: #6b7280; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media print { body { padding: 20px; } }
    ${options.styles || ""}
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${options.companyName || "Ontyx ERP"}</div>
    <div class="doc-title">${options.title}</div>
  </div>
  ${options.content}
</body>
</html>`
}

/**
 * Open printable document in new window
 */
export function printDocument(html: string) {
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

// CSV import field mappings
export const CONTACT_CSV_FIELDS = [
  { csvHeader: "Name", field: "name", required: true },
  { csvHeader: "Email", field: "email", required: false },
  { csvHeader: "Phone", field: "phone", required: false },
  { csvHeader: "Type", field: "type", required: false },
  { csvHeader: "Address", field: "address", required: false },
  { csvHeader: "City", field: "city", required: false },
  { csvHeader: "Country", field: "country", required: false },
  { csvHeader: "Tax ID", field: "taxId", required: false },
]

export const PRODUCT_CSV_FIELDS = [
  { csvHeader: "SKU", field: "sku", required: true },
  { csvHeader: "Name", field: "name", required: true },
  { csvHeader: "Description", field: "description", required: false },
  { csvHeader: "Category", field: "categoryName", required: false },
  { csvHeader: "Unit Price", field: "unitPrice", required: true },
  { csvHeader: "Cost Price", field: "costPrice", required: false },
  { csvHeader: "Stock Quantity", field: "stockQuantity", required: false },
  { csvHeader: "Reorder Level", field: "reorderLevel", required: false },
  { csvHeader: "Unit", field: "unit", required: false },
]

export const INVOICE_CSV_FIELDS = [
  { csvHeader: "Invoice Number", field: "invoiceNumber", required: true },
  { csvHeader: "Customer", field: "customerName", required: true },
  { csvHeader: "Email", field: "customerEmail", required: false },
  { csvHeader: "Issue Date", field: "issueDate", required: true },
  { csvHeader: "Due Date", field: "dueDate", required: true },
  { csvHeader: "Total", field: "total", required: true },
  { csvHeader: "Status", field: "status", required: false },
  { csvHeader: "Currency", field: "currency", required: false },
]
