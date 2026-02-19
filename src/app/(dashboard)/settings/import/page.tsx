'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, Users, Package, FileText, Receipt, CheckCircle2, AlertCircle, ArrowRight, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

type ImportType = 'contacts' | 'products' | 'invoices' | 'expenses'
type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

interface ColumnMapping {
  sourceColumn: string
  targetField: string
}

interface ParsedData {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
}

const IMPORT_TYPES = [
  { id: 'contacts', label: 'Customers & Contacts', icon: Users, description: 'Import your customer list' },
  { id: 'products', label: 'Products & Inventory', icon: Package, description: 'Import products with stock levels' },
  { id: 'invoices', label: 'Historical Invoices', icon: FileText, description: 'Import past invoices for records' },
  { id: 'expenses', label: 'Expenses', icon: Receipt, description: 'Import expense history' },
] as const

const TARGET_FIELDS: Record<ImportType, { field: string; label: string; required: boolean }[]> = {
  contacts: [
    { field: 'name', label: 'Contact Name', required: true },
    { field: 'email', label: 'Email', required: false },
    { field: 'phone', label: 'Phone', required: false },
    { field: 'company', label: 'Company', required: false },
    { field: 'address', label: 'Address', required: false },
    { field: 'city', label: 'City', required: false },
    { field: 'province', label: 'Province', required: false },
    { field: 'postal_code', label: 'Postal Code', required: false },
    { field: 'type', label: 'Type (customer/vendor)', required: false },
    { field: 'notes', label: 'Notes', required: false },
  ],
  products: [
    { field: 'name', label: 'Product Name', required: true },
    { field: 'sku', label: 'SKU', required: false },
    { field: 'description', label: 'Description', required: false },
    { field: 'price', label: 'Sell Price', required: true },
    { field: 'cost', label: 'Cost Price', required: false },
    { field: 'quantity', label: 'Stock Quantity', required: false },
    { field: 'category', label: 'Category', required: false },
    { field: 'barcode', label: 'Barcode/UPC', required: false },
    { field: 'reorder_point', label: 'Reorder Point', required: false },
  ],
  invoices: [
    { field: 'invoice_number', label: 'Invoice Number', required: true },
    { field: 'customer_name', label: 'Customer Name', required: true },
    { field: 'date', label: 'Invoice Date', required: true },
    { field: 'due_date', label: 'Due Date', required: false },
    { field: 'total', label: 'Total Amount', required: true },
    { field: 'status', label: 'Status', required: false },
    { field: 'items', label: 'Line Items', required: false },
  ],
  expenses: [
    { field: 'date', label: 'Date', required: true },
    { field: 'description', label: 'Description', required: true },
    { field: 'amount', label: 'Amount', required: true },
    { field: 'category', label: 'Category', required: false },
    { field: 'vendor', label: 'Vendor/Payee', required: false },
    { field: 'payment_method', label: 'Payment Method', required: false },
    { field: 'receipt_number', label: 'Receipt Number', required: false },
  ],
}

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>('contacts')
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] })
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setError(null)

    try {
      const text = await uploadedFile.text()
      const parsed = parseCSV(text)
      setParsedData(parsed)
      
      // Auto-map columns based on header names
      const autoMappings = autoMapColumns(parsed.headers, importType)
      setMappings(autoMappings)
      
      setStep('mapping')
    } catch (err) {
      setError('Failed to parse file. Please ensure it\'s a valid CSV or Excel file.')
    }
  }, [importType])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  })

  const parseCSV = (text: string): ParsedData => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
    
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
      const row: Record<string, string> = {}
      headers.forEach((header, i) => {
        row[header] = values[i] || ''
      })
      return row
    })

    return { headers, rows, totalRows: rows.length }
  }

  // Smart column mapping with support for QuickBooks, Odoo, Wave, Xero, FreshBooks formats
  const COLUMN_ALIASES: Record<string, string[]> = {
    // Contact fields
    name: ['name', 'contact name', 'customer name', 'vendor name', 'company', 'business name', 'full name', 'display name', 'customer', 'vendor', 'client', 'supplier', 'payee', 'payer', 'bill to', 'ship to', 'customer/vendor'],
    email: ['email', 'e-mail', 'email address', 'contact email', 'primary email'],
    phone: ['phone', 'telephone', 'phone number', 'tel', 'work phone', 'mobile', 'cell', 'contact phone', 'primary phone'],
    company: ['company', 'company name', 'business', 'business name', 'organization', 'org'],
    address: ['address', 'street', 'street address', 'address 1', 'address1', 'billing address', 'address line 1', 'line1'],
    city: ['city', 'town', 'billing city', 'ship city'],
    province: ['province', 'state', 'region', 'state/province', 'billing state', 'billing province', 'prov'],
    postal_code: ['postal', 'postal code', 'zip', 'zip code', 'postcode', 'billing postal', 'billing zip'],
    type: ['type', 'contact type', 'customer type', 'category', 'classification'],
    notes: ['notes', 'memo', 'comments', 'description', 'remarks'],
    
    // Product fields  
    sku: ['sku', 'item code', 'product code', 'code', 'item number', 'part number', 'upc', 'item id', 'product id', 'internal id'],
    description: ['description', 'item description', 'product description', 'details', 'long description'],
    price: ['price', 'sell price', 'selling price', 'sales price', 'unit price', 'retail price', 'rate', 'amount'],
    cost: ['cost', 'cost price', 'purchase price', 'buy price', 'unit cost', 'cogs'],
    quantity: ['quantity', 'qty', 'stock', 'stock quantity', 'on hand', 'qty on hand', 'inventory', 'available'],
    category: ['category', 'product category', 'item category', 'type', 'group', 'class', 'department'],
    barcode: ['barcode', 'upc', 'ean', 'gtin', 'isbn'],
    reorder_point: ['reorder point', 'reorder level', 'min stock', 'minimum', 'low stock alert'],
    
    // Invoice fields
    invoice_number: ['invoice', 'invoice number', 'invoice #', 'inv #', 'inv no', 'document number', 'doc number', 'number', 'ref', 'reference'],
    customer_name: ['customer', 'customer name', 'client', 'client name', 'bill to', 'sold to', 'name'],
    date: ['date', 'invoice date', 'issue date', 'created', 'created date', 'trans date', 'transaction date', 'doc date'],
    due_date: ['due date', 'due', 'payment due', 'due by', 'net date'],
    total: ['total', 'amount', 'invoice total', 'grand total', 'total amount', 'balance', 'amount due', 'total due'],
    status: ['status', 'state', 'payment status', 'invoice status'],
    
    // Expense fields
    amount: ['amount', 'total', 'expense amount', 'cost', 'value', 'debit', 'charge'],
    vendor: ['vendor', 'payee', 'merchant', 'supplier', 'paid to', 'store', 'company'],
    payment_method: ['payment method', 'payment type', 'method', 'paid by', 'payment', 'account'],
    receipt_number: ['receipt', 'receipt number', 'receipt #', 'ref', 'reference', 'check number', 'cheque number'],
  }

  const autoMapColumns = (headers: string[], type: ImportType): ColumnMapping[] => {
    const targetFields = TARGET_FIELDS[type]
    const mappings: ColumnMapping[] = []

    headers.forEach(header => {
      const headerClean = header.toLowerCase().replace(/[_\-\s]+/g, ' ').trim()
      
      let bestMatch: { field: string; score: number } = { field: 'skip', score: 0 }
      
      for (const field of targetFields) {
        const aliases = COLUMN_ALIASES[field.field] || [field.field, field.label.toLowerCase()]
        
        for (const alias of aliases) {
          const aliasClean = alias.toLowerCase().replace(/[_\-\s]+/g, ' ').trim()
          
          // Exact match
          if (headerClean === aliasClean) {
            bestMatch = { field: field.field, score: 100 }
            break
          }
          
          // Header contains alias or vice versa
          if (headerClean.includes(aliasClean) || aliasClean.includes(headerClean)) {
            const score = Math.min(headerClean.length, aliasClean.length) / Math.max(headerClean.length, aliasClean.length) * 80
            if (score > bestMatch.score) {
              bestMatch = { field: field.field, score }
            }
          }
          
          // Word overlap
          const headerWords = headerClean.split(' ')
          const aliasWords = aliasClean.split(' ')
          const overlap = headerWords.filter(w => aliasWords.includes(w)).length
          if (overlap > 0) {
            const score = (overlap / Math.max(headerWords.length, aliasWords.length)) * 60
            if (score > bestMatch.score) {
              bestMatch = { field: field.field, score }
            }
          }
        }
        
        if (bestMatch.score === 100) break
      }

      mappings.push({
        sourceColumn: header,
        targetField: bestMatch.score > 30 ? bestMatch.field : 'skip',
      })
    })

    return mappings
  }

  const updateMapping = (sourceColumn: string, targetField: string) => {
    setMappings(prev => 
      prev.map(m => m.sourceColumn === sourceColumn ? { ...m, targetField } : m)
    )
  }

  const validateMappings = (): boolean => {
    const requiredFields = TARGET_FIELDS[importType].filter(f => f.required)
    const mappedFields = mappings.filter(m => m.targetField !== 'skip').map(m => m.targetField)
    
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f.field))
    
    if (missingRequired.length > 0) {
      setError(`Missing required fields: ${missingRequired.map(f => f.label).join(', ')}`)
      return false
    }
    
    setError(null)
    return true
  }

  const proceedToPreview = () => {
    if (validateMappings()) {
      setStep('preview')
    }
  }

  const startImport = async () => {
    if (!parsedData) return
    
    setStep('importing')
    setImportProgress(0)
    
    const results = { success: 0, failed: 0, errors: [] as string[] }
    const batchSize = 10
    const totalBatches = Math.ceil(parsedData.rows.length / batchSize)

    for (let i = 0; i < parsedData.rows.length; i += batchSize) {
      const batch = parsedData.rows.slice(i, i + batchSize)
      
      try {
        const response = await fetch(`/api/import/${importType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            rows: batch, 
            mappings: mappings.filter(m => m.targetField !== 'skip')
          }),
        })
        
        const result = await response.json()
        results.success += result.success || 0
        results.failed += result.failed || 0
        if (result.errors) results.errors.push(...result.errors)
      } catch (err) {
        results.failed += batch.length
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed`)
      }

      setImportProgress(Math.round(((i + batchSize) / parsedData.rows.length) * 100))
    }

    setImportResults(results)
    setStep('complete')
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setParsedData(null)
    setMappings([])
    setImportProgress(0)
    setImportResults({ success: 0, failed: 0, errors: [] })
    setError(null)
  }

  const downloadTemplate = (type: ImportType) => {
    const fields = TARGET_FIELDS[type]
    const headers = fields.map(f => f.label).join(',')
    const sampleRow = fields.map(f => {
      if (f.field === 'name') return 'Sample Name'
      if (f.field === 'email') return 'email@example.com'
      if (f.field === 'phone') return '(416) 555-0100'
      if (f.field === 'price' || f.field === 'amount' || f.field === 'total') return '99.99'
      if (f.field === 'quantity') return '10'
      if (f.field === 'date') return '2024-01-15'
      return ''
    }).join(',')
    
    const csv = `${headers}\n${sampleRow}`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ontyx-${type}-template.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">
          Import your existing data from QuickBooks, Odoo, Excel, or CSV files
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {['upload', 'mapping', 'preview', 'importing', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-primary text-primary-foreground' : 
              ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > i ? 'bg-green-500 text-white' : 
              'bg-muted text-muted-foreground'
            }`}>
              {['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            {i < 4 && <div className={`w-12 h-0.5 ${['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > i ? 'bg-green-500' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>What do you want to import?</CardTitle>
              <CardDescription>Select the type of data you're importing</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {IMPORT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setImportType(type.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    importType === type.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                  }`}
                >
                  <type.icon className={`h-5 w-5 ${importType === type.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Drag and drop or click to upload your file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p>Drop the file here...</p>
                ) : (
                  <>
                    <p className="font-medium">Drop your file here, or click to browse</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports CSV, XLS, XLSX</p>
                  </>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Need a template?</span>
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate(importType)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">✨ Smart Import</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Works with exports from QuickBooks, Odoo, Wave, Xero, FreshBooks, and most other software. 
                    We auto-detect columns. Duplicates are automatically updated, not created twice.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Map Your Columns</CardTitle>
            <CardDescription>
              Match your file columns to Ontyx fields. We've auto-detected what we could.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Found {parsedData.headers.length} columns and {parsedData.totalRows} rows</span>
                <Badge variant="outline">
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  {file?.name}
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Your Column</TableHead>
                    <TableHead>Sample Data</TableHead>
                    <TableHead>Maps To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappings.map(mapping => (
                    <TableRow key={mapping.sourceColumn}>
                      <TableCell className="font-medium">{mapping.sourceColumn}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {parsedData.rows[0]?.[mapping.sourceColumn]?.slice(0, 30) || '—'}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.targetField}
                          onValueChange={(value) => updateMapping(mapping.sourceColumn, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">— Skip this column —</SelectItem>
                            {TARGET_FIELDS[importType].map(field => (
                              <SelectItem key={field.field} value={field.field}>
                                {field.label} {field.required && '*'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between">
                <Button variant="outline" onClick={reset}>Back</Button>
                <Button onClick={proceedToPreview}>
                  Continue to Preview
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Preview */}
      {step === 'preview' && parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <CardDescription>
              Review the first few rows before importing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Ready to import {parsedData.totalRows} {importType}. This may take a few moments.
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg overflow-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {mappings.filter(m => m.targetField !== 'skip').map(m => (
                        <TableHead key={m.targetField}>
                          {TARGET_FIELDS[importType].find(f => f.field === m.targetField)?.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.rows.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {mappings.filter(m => m.targetField !== 'skip').map(m => (
                          <TableCell key={m.targetField}>
                            {row[m.sourceColumn] || '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {parsedData.totalRows > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ...and {parsedData.totalRows - 5} more rows
                </p>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
                <Button onClick={startImport}>
                  Import {parsedData.totalRows} {importType}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importing...</CardTitle>
            <CardDescription>Please wait while we import your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={importProgress} />
            <p className="text-center text-muted-foreground">{importProgress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Step: Complete */}
      {step === 'complete' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Import Complete!</CardTitle>
                <CardDescription>Your data has been imported successfully</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                <div className="text-sm text-green-600">Successfully imported</div>
              </div>
              {importResults.failed > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                  <div className="text-sm text-red-600">Failed to import</div>
                </div>
              )}
            </div>

            {importResults.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {importResults.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button onClick={reset}>Import More Data</Button>
              <Button variant="outline" asChild>
                <a href={`/${importType}`}>View Imported {importType}</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
