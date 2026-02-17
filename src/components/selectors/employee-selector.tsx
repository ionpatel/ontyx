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
import { Search, UserCircle } from 'lucide-react';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  job_title: string | null;
  department: string | null;
  status: string;
}

interface EmployeeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  activeOnly?: boolean;
  disabled?: boolean;
  excludeIds?: string[];
}

export function EmployeeSelector({
  value,
  onChange,
  placeholder = 'Select employee...',
  activeOnly = true,
  disabled = false,
  excludeIds = [],
}: EmployeeSelectorProps) {
  const { organizationId } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!organizationId) return;
      setLoading(true);
      
      const supabase = createClient();
      let query = supabase
        .from('employees')
        .select('id, first_name, last_name, email, job_title, department, status')
        .eq('organization_id', organizationId)
        .order('last_name');

      if (activeOnly) {
        query = query.eq('status', 'active');
      }

      const { data } = await query;
      setEmployees(data || []);
      setLoading(false);
    };

    fetchEmployees();
  }, [organizationId, activeOnly]);

  const filteredEmployees = employees
    .filter(e => !excludeIds.includes(e.id))
    .filter(e =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
    );

  const selectedEmployee = employees.find(e => e.id === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? 'Loading...' : placeholder}>
          {selectedEmployee && (
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span>{selectedEmployee.first_name} {selectedEmployee.last_name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {filteredEmployees.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No employees found
            </div>
          ) : (
            filteredEmployees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {employee.job_title || employee.department || employee.email}
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
