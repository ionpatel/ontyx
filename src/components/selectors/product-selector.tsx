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
import { Search, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  sell_price: number;
  category: string | null;
}

interface ProductSelectorProps {
  value: string;
  onChange: (value: string, product?: Product) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProductSelector({
  value,
  onChange,
  placeholder = 'Select product...',
  disabled = false,
}: ProductSelectorProps) {
  const { organizationId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      if (!organizationId) return;
      setLoading(true);
      
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, sell_price, category')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      setProducts(data || []);
      setLoading(false);
    };

    fetchProducts();
  }, [organizationId]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === value);

  const handleChange = (id: string) => {
    const product = products.find(p => p.id === id);
    onChange(id, product);
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(price);

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? 'Loading...' : placeholder}>
          {selectedProduct && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>{selectedProduct.name}</span>
              {selectedProduct.sku && (
                <span className="text-muted-foreground">({selectedProduct.sku})</span>
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
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-[200px] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.sku || product.category}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {formatPrice(product.sell_price)}
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
