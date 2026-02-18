'use client'

import { useState } from 'react'
import { 
  Database, Loader2, CheckCircle, Package, 
  Users, FileText, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/auth-provider'

interface SampleDataItem {
  name: string
  icon: React.ElementType
  count: number
}

const SAMPLE_DATA_ITEMS: SampleDataItem[] = [
  { name: 'Customers', icon: Users, count: 5 },
  { name: 'Products', icon: Package, count: 10 },
  { name: 'Invoices', icon: FileText, count: 3 },
]

// Sample customers for Canadian small business
const SAMPLE_CUSTOMERS = [
  { name: 'Maple Leaf Bakery', email: 'orders@mapleleafbakery.ca', phone: '416-555-0101', type: 'customer', company: 'Maple Leaf Bakery Inc.', city: 'Toronto', province: 'ON', postalCode: 'M5V 2T6' },
  { name: 'Northern Lights Cafe', email: 'contact@nlcafe.ca', phone: '604-555-0202', type: 'customer', company: 'Northern Lights Cafe Ltd.', city: 'Vancouver', province: 'BC', postalCode: 'V6B 1A1' },
  { name: 'Prairie Sun Farms', email: 'info@prairiesun.ca', phone: '306-555-0303', type: 'customer', company: 'Prairie Sun Farms Corp.', city: 'Regina', province: 'SK', postalCode: 'S4P 3Y2' },
  { name: 'Atlantic Fresh Seafood', email: 'sales@atlanticfresh.ca', phone: '902-555-0404', type: 'customer', company: 'Atlantic Fresh Seafood Inc.', city: 'Halifax', province: 'NS', postalCode: 'B3J 2T5' },
  { name: 'Mountain Peak Adventures', email: 'bookings@mountainpeak.ca', phone: '403-555-0505', type: 'customer', company: 'Mountain Peak Adventures Ltd.', city: 'Calgary', province: 'AB', postalCode: 'T2P 1J9' },
]

// Sample products
const SAMPLE_PRODUCTS = [
  { name: 'Consulting Hour', sku: 'SVC-001', type: 'service', price: 150, description: 'Professional consulting services', taxable: true },
  { name: 'Project Management', sku: 'SVC-002', type: 'service', price: 125, description: 'Project coordination and management', taxable: true },
  { name: 'Training Session', sku: 'SVC-003', type: 'service', price: 500, description: 'Half-day training workshop', taxable: true },
  { name: 'Website Maintenance', sku: 'SVC-004', type: 'service', price: 200, description: 'Monthly website maintenance package', taxable: true },
  { name: 'Graphic Design Package', sku: 'SVC-005', type: 'service', price: 350, description: 'Logo and brand identity design', taxable: true },
  { name: 'Office Supplies Bundle', sku: 'PRD-001', type: 'product', price: 45, description: 'Pens, paper, and basic supplies', taxable: true, quantity: 100 },
  { name: 'Premium Coffee Beans (1kg)', sku: 'PRD-002', type: 'product', price: 28, description: 'Fair trade organic coffee', taxable: true, quantity: 50 },
  { name: 'Laptop Stand - Ergonomic', sku: 'PRD-003', type: 'product', price: 89, description: 'Adjustable aluminum laptop stand', taxable: true, quantity: 25 },
  { name: 'Wireless Mouse', sku: 'PRD-004', type: 'product', price: 35, description: 'Ergonomic wireless mouse', taxable: true, quantity: 40 },
  { name: 'Desk Organizer Set', sku: 'PRD-005', type: 'product', price: 55, description: '5-piece bamboo desk organizer', taxable: true, quantity: 30 },
]

interface SampleDataLoaderProps {
  onComplete?: () => void
  trigger?: React.ReactNode
}

export function SampleDataLoader({ onComplete, trigger }: SampleDataLoaderProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSampleData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    setProgress(0)

    const supabase = createClient()
    const orgId = user.user_metadata?.organization_id

    if (!orgId) {
      setError('No organization found. Please complete onboarding first.')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create customers (0-40%)
      setCurrentStep('Creating sample customers...')
      const customerIds: string[] = []
      
      for (let i = 0; i < SAMPLE_CUSTOMERS.length; i++) {
        const customer = SAMPLE_CUSTOMERS[i]
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            organization_id: orgId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            type: customer.type,
            company: customer.company,
            city: customer.city,
            province: customer.province,
            postal_code: customer.postalCode,
            country: 'CA',
          })
          .select('id')
          .single()

        if (error) throw error
        if (data) customerIds.push(data.id)
        setProgress(Math.round((i + 1) / SAMPLE_CUSTOMERS.length * 40))
      }

      // Step 2: Create products (40-80%)
      setCurrentStep('Creating sample products...')
      const productIds: string[] = []
      
      for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
        const product = SAMPLE_PRODUCTS[i]
        const { data, error } = await supabase
          .from('products')
          .insert({
            organization_id: orgId,
            name: product.name,
            sku: product.sku,
            type: product.type,
            price: product.price,
            description: product.description,
            taxable: product.taxable,
            quantity: product.quantity || null,
            status: 'active',
          })
          .select('id')
          .single()

        if (error) throw error
        if (data) productIds.push(data.id)
        setProgress(40 + Math.round((i + 1) / SAMPLE_PRODUCTS.length * 40))
      }

      // Step 3: Create sample invoices (80-100%)
      setCurrentStep('Creating sample invoices...')
      
      // Invoice 1: Paid
      const inv1Number = `INV-${new Date().getFullYear()}-0001`
      const { data: inv1, error: inv1Error } = await supabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          customer_id: customerIds[0],
          invoice_number: inv1Number,
          status: 'paid',
          invoice_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          subtotal: 650,
          tax_total: 84.50,
          total: 734.50,
          amount_paid: 734.50,
          currency: 'CAD',
        })
        .select('id')
        .single()

      if (inv1Error) throw inv1Error
      setProgress(90)

      // Invoice 2: Sent (pending)
      const inv2Number = `INV-${new Date().getFullYear()}-0002`
      const { error: inv2Error } = await supabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          customer_id: customerIds[1],
          invoice_number: inv2Number,
          status: 'sent',
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subtotal: 1250,
          tax_total: 162.50,
          total: 1412.50,
          amount_paid: 0,
          currency: 'CAD',
        })

      if (inv2Error) throw inv2Error
      setProgress(95)

      // Invoice 3: Draft
      const inv3Number = `INV-${new Date().getFullYear()}-0003`
      const { error: inv3Error } = await supabase
        .from('invoices')
        .insert({
          organization_id: orgId,
          customer_id: customerIds[2],
          invoice_number: inv3Number,
          status: 'draft',
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          subtotal: 500,
          tax_total: 65,
          total: 565,
          amount_paid: 0,
          currency: 'CAD',
        })

      if (inv3Error) throw inv3Error
      setProgress(100)

      setCurrentStep('Done!')
      setComplete(true)
      onComplete?.()

    } catch (err) {
      console.error('Failed to load sample data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load sample data')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setOpen(false)
      // Reset state after close animation
      setTimeout(() => {
        setProgress(0)
        setCurrentStep('')
        setComplete(false)
        setError(null)
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Database className="h-4 w-4" />
            Load Sample Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {complete ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Sample Data Loaded!</h3>
            <p className="text-muted-foreground mt-2">
              You now have 5 customers, 10 products, and 3 invoices to explore.
            </p>
            <Button onClick={handleClose} className="mt-4">
              Get Started
            </Button>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-red-600">Error</h3>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button variant="outline" onClick={handleClose} className="mt-4">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Load Sample Data
              </DialogTitle>
              <DialogDescription>
                Populate your account with realistic sample data to explore Ontyx features.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* What will be created */}
              <div className="space-y-2">
                <p className="text-sm font-medium">This will create:</p>
                {SAMPLE_DATA_ITEMS.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <item.icon className="h-4 w-4" />
                    <span>{item.count} {item.name}</span>
                  </div>
                ))}
              </div>

              {/* Progress */}
              {loading && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {currentStep}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={loadSampleData} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Load Data
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
