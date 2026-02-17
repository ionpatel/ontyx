'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  type: string;
}

interface ContactSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'customer' | 'vendor' | 'all';
  disabled?: boolean;
}

export function ContactSelector({
  value,
  onChange,
  placeholder = 'Select contact...',
  type = 'all',
  disabled = false,
}: ContactSelectorProps) {
  const { organizationId } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      if (!organizationId) return;
      setLoading(true);
      
      const supabase = createClient();
      let query = supabase
        .from('contacts')
        .select('id, name, email, company, type')
        .eq('organization_id', organizationId)
        .order('name');

      if (type !== 'all') {
        query = query.eq('type', type);
      }

      const { data } = await query;
      setContacts(data || []);
      setLoading(false);
    };

    fetchContacts();
  }, [organizationId, type]);

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedContact = contacts.find(c => c.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? 'Loading...' : placeholder}>
          {selectedContact && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{selectedContact.name}</span>
              {selectedContact.company && (
                <span className="text-muted-foreground">({selectedContact.company})</span>
              )}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No contacts found
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <SelectItem key={contact.id} value={contact.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{contact.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {contact.email || contact.company || contact.type}
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </div>
      </SelectContent>
    </Select>
  );
}
