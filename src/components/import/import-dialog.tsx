'use client'

import { useState, useRef, useCallback } from 'react'
import { 
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle, 
  X, AlertCircle, ArrowRight, Shield, Loader2, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type ImportType = 'contacts' | 'products' | 'invoices' | 'expenses'

interface FieldMapping {
  field: string
  label: string
  required: boolean
  description?: string
  format?: string
}

interface DuplicateInfo {
  rowIndex: number
  field: string
  value: string
  existingId: string
}

interface ValidationError {
  rowIndex: number
  field: string
  message: string
}

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: ImportType
  onSuccess?: () => void
}

// Field definitions for each import type
const FIELD_MAPPINGS: Record<ImportType, FieldMapping[]> = {
  contacts: [
    { field: 'name', label: 'Name', required: true, description: 'Full name or company name' },
    { field: 'email', label: 'Email', required: false, format: 'email' },
    { field: 'phone', label: 'Phone', required: false, format: 'phone' },
    { field: 'company', label: 'Company', required: false },
    { field: 'address', label: 'Address', required: false },
    { field: 'city', label: 'City', required: false },
    { field: 'province', label: 'Province', required: false, description: 'e.g., ON, BC, QC' },
    { field: 'postal_code', label: 'Postal Code', required: false, format: 'postal' },
    { field: 'type', label: 'Type', required: false, description: 'customer, vendor, or both' },
    { field: 'notes', label: 'Notes', required: false },
  ],
  products: [
    { field: 'name', label: 'Product Name', required: true },
    { field: 'sku', label: 'SKU', required: false, description: 'Auto-generated if blank' },
    { field: 'description', label: 'Description', required: false },
    { field: 'price', label: 'Sell Price', required: true, format: 'currency' },
    { field: 'cost', label: 'Cost Price', required: false, format: 'currency' },
    { field: 'quantity', label: 'Stock Quantity', required: false, format: 'number' },
    { field: 'category', label: 'Category', required: false },
    { field: 'barcode', label: 'Barcode/UPC', required: false },
    { field: 'reorder_point', label: 'Reorder Level', required: false, format: 'number' },
  ],
  invoices: [
    { field: 'invoice_number', label: 'Invoice #', required: true },
    { field: 'customer_name', label: 'Customer Name', required: true },
    { field: 'date', label: 'Invoice Date', required: false, format: 'date' },
    { field: 'due_date', label: 'Due Date', required: false, format: 'date' },
    { field: 'total', label: 'Total Amount', required: true, format: 'currency' },
    { field: 'status', label: 'Status', required: false, description: 'draft, sent, paid, etc.' },
  ],
  expenses: [
    { field: 'date', label: 'Date', required: true, format: 'date' },
    { field: 'description', label: 'Description', required: true },
    { field: 'amount', label: 'Amount', required: true, format: 'currency' },
    { field: 'category', label: 'Category', required: false },
    { field: 'vendor', label: 'Vendor/Merchant', required: false },
    { field: 'payment_method', label: 'Payment Method', required: false },
    { field: 'receipt_number', label: 'Receipt #', required: false },
  ],
}

// Duplicate detection keys by type
const DUPLICATE_KEYS: Record<ImportType, string[]> = {
  contacts: ['email', 'name'],
  products: ['sku', 'name'],
  invoices: ['invoice_number'],
  expenses: ['date', 'amount', 'description'],
}

export function ImportDialog({ open, onOpenChange, type, onSuccess }: ImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: number; failed: number; skipped: number }>({ success: 0, failed: 0, skipped: 0 })
  const [checking, setChecking] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fieldMappings = FIELD_MAPPINGS[type]
  const typeLabels: Record<ImportType, string> = {
    contacts: 'Contacts',
    products: 'Products',
    invoices: 'Invoices',
    expenses: 'Expenses',
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setRows([])
    setHeaders([])
    setMappings({})
    setDuplicates([])
    setErrors([])
    setSkipDuplicates(true)
    setProgress(0)
    setResults({ success: 0, failed: 0, skipped: 0 })
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  // Security: Sanitize string input
  const sanitizeString = (str: string): string => {
    if (!str) return ''
    return str
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"`;\\]/g, '') // Remove potential injection chars
      .replace(/javascript:/gi, '') // Remove JS protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
      .slice(0, 1000) // Limit length
  }

  // Parse CSV with proper handling
  const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }

    // Parse header row
    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine).map(h => sanitizeString(h.toLowerCase().trim()))

    // Parse data rows
    const rows: Record<string, string>[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: Record<string, string> = {}
      headers.forEach((header, idx) => {
        row[header] = sanitizeString(values[idx] || '')
      })
      // Skip completely empty rows
      if (Object.values(row).some(v => v.trim())) {
        rows.push(row)
      }
    }

    return { headers, rows }
  }

  // Parse a single CSV line handling quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  // Validate file
  const validateFile = (file: File): string | null => {
    const MAX_SIZE = 5 * 1024 * 1024 // 5MB
    const ALLOWED_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain']
    const ALLOWED_EXTENSIONS = ['.csv', '.txt']

    if (file.size > MAX_SIZE) {
      return 'File too large. Maximum size is 5MB.'
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Invalid file type. Please upload a CSV file.'
    }

    // Additional check for suspicious content will be done after reading
    return null
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const error = validateFile(selectedFile)
    if (error) {
      alert(error)
      return
    }

    const text = await selectedFile.text()

    // Security check for suspicious content
    const suspiciousPatterns = [
      /=cmd\|/i, /=\|cmd/i, // Excel formula injection
      /@SUM\(/i, /=HYPERLINK/i, // Excel formulas
      /<script/i, /javascript:/i, // JS injection
      /\x00/, // Null bytes
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        alert('File contains potentially malicious content. Please check your file.')
        return
      }
    }

    const { headers: parsedHeaders, rows: parsedRows } = parseCSV(text)

    if (parsedHeaders.length === 0 || parsedRows.length === 0) {
      alert('File appears to be empty or invalid.')
      return
    }

    setFile(selectedFile)
    setHeaders(parsedHeaders)
    setRows(parsedRows)

    // Auto-map columns based on field names
    const autoMappings: Record<string, string> = {}
    fieldMappings.forEach(fm => {
      const match = parsedHeaders.find(h => 
        h === fm.field ||
        h.includes(fm.field) ||
        fm.field.includes(h) ||
        h.replace(/[_-]/g, '').includes(fm.field.replace(/[_-]/g, ''))
      )
      if (match) {
        autoMappings[match] = fm.field
      }
    })
    setMappings(autoMappings)
    setStep('mapping')
  }

  // Check for duplicates against existing data
  const checkDuplicates = async () => {
    setChecking(true)
    const duplicateKeys = DUPLICATE_KEYS[type]
    const found: DuplicateInfo[] = []
    const validationErrors: ValidationError[] = []

    try {
      // Build request with mapped data
      const mappedRows = rows.map((row, idx) => {
        const mapped: Record<string, string> = {}
        Object.entries(mappings).forEach(([source, target]) => {
          mapped[target] = row[source]
        })
        return { ...mapped, _rowIndex: idx }
      })

      // Validate each row
      mappedRows.forEach((row, idx) => {
        fieldMappings.forEach(fm => {
          if (fm.required && !row[fm.field]?.trim()) {
            validationErrors.push({
              rowIndex: idx,
              field: fm.field,
              message: `${fm.label} is required`,
            })
          }
          // Format validation
          if (row[fm.field] && fm.format) {
            const value = row[fm.field]
            switch (fm.format) {
              case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                  validationErrors.push({ rowIndex: idx, field: fm.field, message: 'Invalid email format' })
                }
                break
              case 'phone':
                if (!/^[\d\s\-\+\(\)\.]+$/.test(value)) {
                  validationErrors.push({ rowIndex: idx, field: fm.field, message: 'Invalid phone format' })
                }
                break
              case 'currency':
                if (isNaN(parseFloat(value.replace(/[^0-9.-]/g, '')))) {
                  validationErrors.push({ rowIndex: idx, field: fm.field, message: 'Invalid number' })
                }
                break
              case 'date':
                if (isNaN(Date.parse(value))) {
                  validationErrors.push({ rowIndex: idx, field: fm.field, message: 'Invalid date format' })
                }
                break
            }
          }
        })
      })

      // Check for duplicates via API
      const response = await fetch(`/api/import/${type}/check-duplicates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: mappedRows, keys: duplicateKeys }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.duplicates) {
          found.push(...data.duplicates)
        }
      }
    } catch (err) {
      console.error('Duplicate check error:', err)
    }

    setDuplicates(found)
    setErrors(validationErrors)
    setChecking(false)
    setStep('preview')
  }

  // Perform import
  const performImport = async () => {
    setStep('importing')
    setProgress(0)

    const duplicateRows = new Set(duplicates.map(d => d.rowIndex))
    const errorRows = new Set(errors.map(e => e.rowIndex))

    const rowsToImport = rows
      .map((row, idx) => ({ row, idx }))
      .filter(({ idx }) => {
        if (errorRows.has(idx)) return false
        if (skipDuplicates && duplicateRows.has(idx)) return false
        return true
      })

    let success = 0
    let failed = 0
    const skipped = rows.length - rowsToImport.length

    // Import in batches
    const batchSize = 50
    for (let i = 0; i < rowsToImport.length; i += batchSize) {
      const batch = rowsToImport.slice(i, i + batchSize)
      const mappedBatch = batch.map(({ row }) => {
        const mapped: Record<string, string> = {}
        Object.entries(mappings).forEach(([source, target]) => {
          mapped[target] = row[source]
        })
        return mapped
      })

      try {
        const response = await fetch(`/api/import/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rows: mappedBatch.map(row => {
              // Transform back to expected format
              const transformed: Record<string, string> = {}
              Object.entries(row).forEach(([key, value]) => {
                transformed[key] = value
              })
              return transformed
            }),
            mappings: Object.entries(mappings).map(([source, target]) => ({
              sourceColumn: source,
              targetField: target,
            })),
          }),
        })

        if (response.ok) {
          const result = await response.json()
          success += result.success || batch.length
          failed += result.failed || 0
        } else {
          failed += batch.length
        }
      } catch (err) {
        failed += batch.length
      }

      setProgress(Math.round(((i + batch.length) / rowsToImport.length) * 100))
    }

    setResults({ success, failed, skipped })
    setStep('complete')
  }

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div 
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Upload CSV File</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop or click to select
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Select File
        </Button>
      </div>

      <div className="rounded-lg bg-muted/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-medium text-sm">Security & Format</h4>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>• CSV format with headers in first row</li>
              <li>• Maximum 5MB file size</li>
              <li>• Files are scanned for malicious content</li>
              <li>• Duplicates will be detected before import</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h4 className="font-medium text-sm mb-2">Expected Fields for {typeLabels[type]}</h4>
        <div className="flex flex-wrap gap-2">
          {fieldMappings.map(fm => (
            <Badge 
              key={fm.field} 
              variant={fm.required ? "default" : "outline"}
              className="text-xs"
            >
              {fm.label}
              {fm.required && <span className="ml-1 text-red-300">*</span>}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )

  const renderMappingStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            <FileSpreadsheet className="inline h-4 w-4 mr-1" />
            {file?.name} • {rows.length} rows detected
          </p>
        </div>
      </div>

      <div className="max-h-[400px] overflow-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">CSV Column</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[200px]">Map to Field</TableHead>
              <TableHead>Sample Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map(header => (
              <TableRow key={header}>
                <TableCell className="font-mono text-sm">{header}</TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Select
                    value={mappings[header] || 'skip'}
                    onValueChange={(value) => {
                      setMappings(prev => ({
                        ...prev,
                        [header]: value === 'skip' ? '' : value,
                      }))
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Skip" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">— Skip —</SelectItem>
                      {fieldMappings.map(fm => (
                        <SelectItem key={fm.field} value={fm.field}>
                          {fm.label}
                          {fm.required && ' *'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {rows[0]?.[header] || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4" />
        <span>Fields marked with * are required. Unmapped columns will be skipped.</span>
      </div>
    </div>
  )

  const renderPreviewStep = () => {
    const duplicateRows = new Set(duplicates.map(d => d.rowIndex))
    const errorRows = new Set(errors.map(e => e.rowIndex))
    const cleanRows = rows.filter((_, idx) => !duplicateRows.has(idx) && !errorRows.has(idx))

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{cleanRows.length}</div>
            <div className="text-xs text-muted-foreground">Ready to Import</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{duplicates.length}</div>
            <div className="text-xs text-muted-foreground">Duplicates Found</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{errors.length}</div>
            <div className="text-xs text-muted-foreground">Validation Errors</div>
          </div>
        </div>

        {/* Duplicates Warning */}
        {duplicates.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800 dark:text-amber-200">Duplicates Detected</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {duplicates.length} row(s) match existing records in your database.
                </p>
                <div className="mt-3 max-h-32 overflow-auto">
                  {duplicates.slice(0, 5).map((dup, i) => (
                    <div key={i} className="text-xs text-amber-600 py-1">
                      Row {dup.rowIndex + 2}: "{dup.value}" matches existing {dup.field}
                    </div>
                  ))}
                  {duplicates.length > 5 && (
                    <div className="text-xs text-amber-600 py-1">
                      ...and {duplicates.length - 5} more
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Checkbox 
                    id="skipDupes" 
                    checked={skipDuplicates}
                    onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
                  />
                  <Label htmlFor="skipDupes" className="text-sm text-amber-700">
                    Skip duplicates (don't import)
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-800 dark:text-red-200">Validation Errors</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {errors.length} issue(s) found. These rows will be skipped.
                </p>
                <div className="mt-3 max-h-32 overflow-auto">
                  {errors.slice(0, 5).map((err, i) => (
                    <div key={i} className="text-xs text-red-600 py-1">
                      Row {err.rowIndex + 2}: {err.message}
                    </div>
                  ))}
                  {errors.length > 5 && (
                    <div className="text-xs text-red-600 py-1">
                      ...and {errors.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Table */}
        <div className="max-h-[200px] overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                {Object.values(mappings).filter(Boolean).slice(0, 4).map(field => (
                  <TableHead key={field} className="capitalize">
                    {fieldMappings.find(f => f.field === field)?.label || field}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 10).map((row, idx) => {
                const isDupe = duplicateRows.has(idx)
                const hasError = errorRows.has(idx)
                return (
                  <TableRow 
                    key={idx}
                    className={cn(
                      isDupe && 'bg-amber-50 dark:bg-amber-950/20',
                      hasError && 'bg-red-50 dark:bg-red-950/20'
                    )}
                  >
                    <TableCell className="text-xs">{idx + 2}</TableCell>
                    <TableCell>
                      {hasError ? (
                        <Badge variant="destructive" className="text-xs">Error</Badge>
                      ) : isDupe ? (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">Duplicate</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-700 text-xs">OK</Badge>
                      )}
                    </TableCell>
                    {Object.entries(mappings).filter(([, v]) => v).slice(0, 4).map(([source]) => (
                      <TableCell key={source} className="text-sm truncate max-w-[150px]">
                        {row[source] || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        {rows.length > 10 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing first 10 of {rows.length} rows
          </p>
        )}
      </div>
    )
  }

  const renderImportingStep = () => (
    <div className="py-8 text-center space-y-4">
      <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
      <h3 className="font-semibold">Importing {typeLabels[type]}...</h3>
      <Progress value={progress} className="w-full max-w-sm mx-auto" />
      <p className="text-sm text-muted-foreground">{progress}% complete</p>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="py-8 text-center space-y-4">
      <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
      <h3 className="text-xl font-semibold">Import Complete!</h3>
      
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-bold text-green-600">{results.success}</div>
          <div className="text-xs text-muted-foreground">Imported</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-bold text-amber-600">{results.skipped}</div>
          <div className="text-xs text-muted-foreground">Skipped</div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-2xl font-bold text-red-600">{results.failed}</div>
          <div className="text-xs text-muted-foreground">Failed</div>
        </div>
      </div>
    </div>
  )

  const canProceedFromMapping = () => {
    const requiredFields = fieldMappings.filter(f => f.required).map(f => f.field)
    const mappedFields = Object.values(mappings).filter(Boolean)
    return requiredFields.every(rf => mappedFields.includes(rf))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import {typeLabels[type]}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file to import data.'}
            {step === 'mapping' && 'Map CSV columns to database fields.'}
            {step === 'preview' && 'Review data before importing.'}
            {step === 'importing' && 'Please wait while data is being imported.'}
            {step === 'complete' && 'Your import has been processed.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'upload' && renderUploadStep()}
          {step === 'mapping' && renderMappingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
          
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>Back</Button>
              <Button 
                onClick={checkDuplicates} 
                disabled={!canProceedFromMapping() || checking}
              >
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Check & Preview'
                )}
              </Button>
            </>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
              <Button onClick={performImport} disabled={rows.length === 0}>
                Import {rows.length - (skipDuplicates ? duplicates.length : 0) - errors.length} Rows
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={() => {
              handleClose()
              onSuccess?.()
            }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
