'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, FileText, Users, Package, ShoppingCart, Headphones,
  Calendar, Clock, Building2, User, ArrowRight, Command
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'contact' | 'invoice' | 'product' | 'order' | 'ticket' | 'appointment' | 'employee';
  title: string;
  subtitle: string;
  href: string;
}

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  contact: { icon: Users, label: 'Contact', color: 'bg-blue-100 text-blue-700' },
  invoice: { icon: FileText, label: 'Invoice', color: 'bg-green-100 text-green-700' },
  product: { icon: Package, label: 'Product', color: 'bg-purple-100 text-purple-700' },
  order: { icon: ShoppingCart, label: 'Order', color: 'bg-orange-100 text-orange-700' },
  ticket: { icon: Headphones, label: 'Ticket', color: 'bg-red-100 text-red-700' },
  appointment: { icon: Calendar, label: 'Appointment', color: 'bg-yellow-100 text-yellow-700' },
  employee: { icon: User, label: 'Employee', color: 'bg-indigo-100 text-indigo-700' },
};

const quickLinks = [
  { label: 'New Invoice', href: '/invoices/new', icon: FileText },
  { label: 'New Contact', href: '/contacts/new', icon: Users },
  { label: 'New Sale', href: '/sales/new', icon: ShoppingCart },
  { label: 'Open POS', href: '/pos', icon: Building2 },
  { label: 'Dashboard', href: '/dashboard', icon: Clock },
];

export function GlobalSearch() {
  const router = useRouter();
  const { organizationId } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search function
  const search = useCallback(async (q: string) => {
    if (!q.trim() || !organizationId) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchQuery = `%${q}%`;
    const allResults: SearchResult[] = [];

    try {
      // Search contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, name, email, type')
        .eq('organization_id', organizationId)
        .or(`name.ilike.${searchQuery},email.ilike.${searchQuery}`)
        .limit(5);

      contacts?.forEach(c => allResults.push({
        id: c.id,
        type: 'contact',
        title: c.name,
        subtitle: c.email || c.type,
        href: `/contacts/${c.id}`,
      }));

      // Search invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, status, contact:contacts(name)')
        .eq('organization_id', organizationId)
        .ilike('invoice_number', searchQuery)
        .limit(5);

      invoices?.forEach(i => allResults.push({
        id: i.id,
        type: 'invoice',
        title: i.invoice_number,
        subtitle: `${i.status} • ${(i.contact as any)?.name || 'No customer'}`,
        href: `/invoices/${i.id}`,
      }));

      // Search products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('organization_id', organizationId)
        .or(`name.ilike.${searchQuery},sku.ilike.${searchQuery}`)
        .limit(5);

      products?.forEach(p => allResults.push({
        id: p.id,
        type: 'product',
        title: p.name,
        subtitle: p.sku || 'No SKU',
        href: `/inventory/${p.id}`,
      }));

      // Search tickets
      const { data: tickets } = await supabase
        .from('helpdesk_tickets')
        .select('id, ticket_number, subject')
        .eq('organization_id', organizationId)
        .or(`ticket_number.ilike.${searchQuery},subject.ilike.${searchQuery}`)
        .limit(5);

      tickets?.forEach(t => allResults.push({
        id: t.id,
        type: 'ticket',
        title: t.ticket_number,
        subtitle: t.subject,
        href: `/helpdesk/${t.id}`,
      }));

      // Search employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id, first_name, last_name, job_title')
        .eq('organization_id', organizationId)
        .or(`first_name.ilike.${searchQuery},last_name.ilike.${searchQuery}`)
        .limit(5);

      employees?.forEach(e => allResults.push({
        id: e.id,
        type: 'employee',
        title: `${e.first_name} ${e.last_name}`,
        subtitle: e.job_title || 'Employee',
        href: `/employees/${e.id}`,
      }));

      setResults(allResults);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, supabase]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = results.length + quickLinks.length;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % totalItems);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + totalItems) % totalItems);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < results.length) {
        router.push(results[selectedIndex].href);
        setOpen(false);
      } else {
        const linkIndex = selectedIndex - results.length;
        router.push(quickLinks[linkIndex].href);
        setOpen(false);
      }
    }
  };

  const handleSelect = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search...</span>
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Search Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-2xl overflow-hidden">
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search contacts, invoices, products..."
              className="border-0 focus-visible:ring-0 text-lg py-6"
            />
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {/* Search Results */}
            {results.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                  Results
                </div>
                {results.map((result, index) => {
                  const config = typeConfig[result.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        selectedIndex === index ? 'bg-primary/10' : 'hover:bg-muted'
                      )}
                    >
                      <div className={cn('p-2 rounded-lg', config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{result.subtitle}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Links */}
            <div className="p-2 border-t">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                Quick Actions
              </div>
              {quickLinks.map((link, index) => {
                const actualIndex = results.length + index;
                return (
                  <button
                    key={link.href}
                    onClick={() => handleSelect(link.href)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                      selectedIndex === actualIndex ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <link.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{link.label}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </button>
                );
              })}
            </div>

            {/* No Results */}
            {query && !loading && results.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results for "{query}"</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-background border">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-background border">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
