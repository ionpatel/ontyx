'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  FileText, Users, Package, DollarSign, ShoppingCart,
  Settings, HelpCircle, BarChart3, CreditCard, Building2,
  Receipt, Calculator, Calendar, Search, Plus, Keyboard,
  Home, UserPlus, Banknote, TrendingUp, Clock, Shield,
  FileUp, Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'

interface CommandAction {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
  keywords?: string[]
  group: 'navigation' | 'actions' | 'recent' | 'search'
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recentItems, setRecentItems] = useState<CommandAction[]>([])
  const [searchResults, setSearchResults] = useState<CommandAction[]>([])
  const [searching, setSearching] = useState(false)
  const router = useRouter()
  const { organizationId } = useAuth()

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open])

  // Navigation commands
  const navigationCommands: CommandAction[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <Home className="h-4 w-4" />,
      shortcut: 'G D',
      action: () => router.push('/dashboard'),
      keywords: ['home', 'overview'],
      group: 'navigation',
    },
    {
      id: 'invoices',
      title: 'Invoices',
      icon: <FileText className="h-4 w-4" />,
      shortcut: 'G I',
      action: () => router.push('/invoices'),
      keywords: ['bills', 'billing'],
      group: 'navigation',
    },
    {
      id: 'contacts',
      title: 'Contacts',
      icon: <Users className="h-4 w-4" />,
      shortcut: 'G C',
      action: () => router.push('/contacts'),
      keywords: ['customers', 'vendors', 'people'],
      group: 'navigation',
    },
    {
      id: 'inventory',
      title: 'Inventory',
      icon: <Package className="h-4 w-4" />,
      shortcut: 'G P',
      action: () => router.push('/inventory'),
      keywords: ['products', 'stock', 'items'],
      group: 'navigation',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      icon: <Receipt className="h-4 w-4" />,
      action: () => router.push('/expenses'),
      keywords: ['spending', 'costs'],
      group: 'navigation',
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <BarChart3 className="h-4 w-4" />,
      shortcut: 'G R',
      action: () => router.push('/reports'),
      keywords: ['analytics', 'stats', 'p&l', 'balance sheet'],
      group: 'navigation',
    },
    {
      id: 'pos',
      title: 'Point of Sale',
      icon: <ShoppingCart className="h-4 w-4" />,
      action: () => router.push('/pos'),
      keywords: ['checkout', 'register', 'sales'],
      group: 'navigation',
    },
    {
      id: 'banking',
      title: 'Banking',
      icon: <CreditCard className="h-4 w-4" />,
      action: () => router.push('/banking'),
      keywords: ['bank', 'transactions', 'accounts'],
      group: 'navigation',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      shortcut: 'G S',
      action: () => router.push('/settings'),
      keywords: ['preferences', 'config', 'profile'],
      group: 'navigation',
    },
  ]

  // Quick actions
  const actionCommands: CommandAction[] = [
    {
      id: 'new-invoice',
      title: 'Create Invoice',
      subtitle: 'Create a new customer invoice',
      icon: <Plus className="h-4 w-4" />,
      shortcut: 'N I',
      action: () => router.push('/invoices/new'),
      keywords: ['add', 'bill'],
      group: 'actions',
    },
    {
      id: 'new-contact',
      title: 'Add Contact',
      subtitle: 'Add a new customer or vendor',
      icon: <UserPlus className="h-4 w-4" />,
      shortcut: 'N C',
      action: () => router.push('/contacts?new=true'),
      keywords: ['customer', 'vendor'],
      group: 'actions',
    },
    {
      id: 'new-product',
      title: 'Add Product',
      subtitle: 'Add a new product or service',
      icon: <Package className="h-4 w-4" />,
      shortcut: 'N P',
      action: () => router.push('/inventory/new'),
      keywords: ['item', 'inventory'],
      group: 'actions',
    },
    {
      id: 'new-expense',
      title: 'Record Expense',
      subtitle: 'Log a business expense',
      icon: <Receipt className="h-4 w-4" />,
      action: () => router.push('/expenses?new=true'),
      keywords: ['cost', 'spending'],
      group: 'actions',
    },
    {
      id: 'import-data',
      title: 'Import Data',
      subtitle: 'Import contacts, products, or invoices',
      icon: <FileUp className="h-4 w-4" />,
      action: () => router.push('/settings/import'),
      keywords: ['csv', 'upload', 'bulk'],
      group: 'actions',
    },
    {
      id: 'quick-search',
      title: 'Search Everything',
      subtitle: 'Search across all data',
      icon: <Search className="h-4 w-4" />,
      action: () => setSearch(''),
      keywords: ['find', 'lookup'],
      group: 'actions',
    },
  ]

  // Global search across database
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !organizationId) {
      setSearchResults([])
      return
    }

    setSearching(true)
    const supabase = createClient()

    try {
      const searchTerm = `%${query}%`

      // Search contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, display_name, email, phone')
        .eq('organization_id', organizationId)
        .or(`display_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(5)

      // Search products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('organization_id', organizationId)
        .or(`name.ilike.${searchTerm},sku.ilike.${searchTerm}`)
        .limit(5)

      // Search invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer:contacts(display_name)')
        .eq('organization_id', organizationId)
        .ilike('invoice_number', searchTerm)
        .limit(5)

      const results: CommandAction[] = []

      // Add contact results
      ;(contacts || []).forEach(contact => {
        results.push({
          id: `contact-${contact.id}`,
          title: contact.display_name,
          subtitle: contact.email || contact.phone || 'Contact',
          icon: <Users className="h-4 w-4 text-blue-500" />,
          action: () => router.push(`/contacts/${contact.id}`),
          group: 'search',
        })
      })

      // Add product results
      ;(products || []).forEach(product => {
        results.push({
          id: `product-${product.id}`,
          title: product.name,
          subtitle: product.sku || 'Product',
          icon: <Package className="h-4 w-4 text-green-500" />,
          action: () => router.push(`/inventory/${product.id}`),
          group: 'search',
        })
      })

      // Add invoice results
      ;(invoices || []).forEach(invoice => {
        results.push({
          id: `invoice-${invoice.id}`,
          title: invoice.invoice_number,
          subtitle: invoice.customer?.display_name || 'Invoice',
          icon: <FileText className="h-4 w-4 text-purple-500" />,
          action: () => router.push(`/invoices/${invoice.id}`),
          group: 'search',
        })
      })

      setSearchResults(results)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }, [organizationId, router])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2) {
        performSearch(search)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, performSearch])

  const handleSelect = (action: CommandAction) => {
    action.action()
    setOpen(false)
    setSearch('')
  }

  // Filter commands based on search
  const filteredNavigation = navigationCommands.filter(cmd => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.includes(q))
    )
  })

  const filteredActions = actionCommands.filter(cmd => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle?.toLowerCase().includes(q) ||
      cmd.keywords?.some(k => k.includes(q))
    )
  })

  return (
    <>
      {/* Trigger Button (optional, can be placed in header) */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-2 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search or type a command..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {searching ? 'Searching...' : 'No results found.'}
          </CommandEmpty>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <CommandGroup heading="Search Results">
              {searchResults.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3"
                >
                  {result.icon}
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <CommandGroup heading="Quick Actions">
              {filteredActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => handleSelect(action)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {action.icon}
                    <div className="flex flex-col">
                      <span>{action.title}</span>
                      {action.subtitle && (
                        <span className="text-xs text-muted-foreground">{action.subtitle}</span>
                      )}
                    </div>
                  </div>
                  {action.shortcut && (
                    <CommandShortcut>{action.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Navigation */}
          {filteredNavigation.length > 0 && (
            <CommandGroup heading="Go to">
              {filteredNavigation.map((nav) => (
                <CommandItem
                  key={nav.id}
                  onSelect={() => handleSelect(nav)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {nav.icon}
                    <span>{nav.title}</span>
                  </div>
                  {nav.shortcut && (
                    <CommandShortcut>{nav.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Keyboard Shortcuts Help */}
          <CommandGroup heading="Tips">
            <CommandItem disabled className="opacity-70">
              <Keyboard className="h-4 w-4 mr-3" />
              <span>Press <kbd className="px-1 border rounded text-xs">⌘K</kbd> anywhere to open this menu</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
