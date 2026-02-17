'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as posService from '@/services/pos';
import type {
  POSSession,
  POSTransaction,
  POSCashMovement,
  CreatePOSSessionInput,
  ClosePOSSessionInput,
  CreatePOSTransactionInput,
  POSCashMovementInput,
  POSSessionSummary,
  CartItem,
  Cart,
} from '@/types/pos';

// ============ Session Hook ============

export function usePOSSession() {
  const { organizationId, user } = useAuth();
  const { toast } = useToast();
  const [session, setSession] = useState<POSSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const fetchOpenSession = useCallback(async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await posService.getOpenSession(organizationId);
      setSession(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchOpenSession();
  }, [fetchOpenSession]);

  const openSession = useCallback(
    async (input: CreatePOSSessionInput) => {
      if (!organizationId || !user?.id) {
        toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
        return null;
      }

      setIsPending(true);
      try {
        const data = await posService.openSession(organizationId, user.id, input);
        setSession(data);
        toast({ title: 'Session Opened', description: `Session ${data.session_number} started` });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to open session';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [organizationId, user?.id, toast]
  );

  const closeSession = useCallback(
    async (input: ClosePOSSessionInput) => {
      if (!session) {
        toast({ title: 'Error', description: 'No open session', variant: 'destructive' });
        return null;
      }

      setIsPending(true);
      try {
        const data = await posService.closeSession(session.id, input);
        setSession(null);
        toast({ title: 'Session Closed', description: `Session ${data.session_number} ended` });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to close session';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [session, toast]
  );

  return {
    session,
    isLoading,
    error,
    isPending,
    openSession,
    closeSession,
    refetch: fetchOpenSession,
  };
}

// ============ Cart Hook ============

const emptyCart: Cart = {
  items: [],
  customer_id: null,
  customer_name: null,
  subtotal: 0,
  tax_amount: 0,
  discount_amount: 0,
  total: 0,
  notes: null,
};

export function usePOSCart() {
  const [cart, setCart] = useState<Cart>(emptyCart);

  const recalculateTotals = useCallback((items: CartItem[], discountAmount: number = 0) => {
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemDiscount = itemSubtotal * (item.discount_percent / 100);
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = taxableAmount * (item.tax_rate / 100);

      subtotal += taxableAmount;
      taxAmount += itemTax;
    });

    const total = subtotal + taxAmount - discountAmount;

    return { subtotal, taxAmount, total };
  }, []);

  const addItem = useCallback(
    (product: {
      id: string;
      name: string;
      sku?: string;
      barcode?: string;
      price: number;
      tax_rate?: number;
      image_url?: string;
    }) => {
      setCart((prev) => {
        // Check if item already exists
        const existingIndex = prev.items.findIndex((item) => item.product_id === product.id);

        let newItems: CartItem[];
        if (existingIndex >= 0) {
          // Increase quantity
          newItems = prev.items.map((item, idx) =>
            idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
          );
        } else {
          // Add new item
          const newItem: CartItem = {
            id: crypto.randomUUID(),
            product_id: product.id,
            name: product.name,
            sku: product.sku || null,
            barcode: product.barcode || null,
            quantity: 1,
            unit_price: product.price,
            discount_percent: 0,
            tax_rate: product.tax_rate || 13, // Default HST for Ontario
            image_url: product.image_url,
          };
          newItems = [...prev.items, newItem];
        }

        const { subtotal, taxAmount, total } = recalculateTotals(newItems, prev.discount_amount);

        return {
          ...prev,
          items: newItems,
          subtotal,
          tax_amount: taxAmount,
          total,
        };
      });
    },
    [recalculateTotals]
  );

  const updateItemQuantity = useCallback(
    (itemId: string, quantity: number) => {
      setCart((prev) => {
        const newItems =
          quantity <= 0
            ? prev.items.filter((item) => item.id !== itemId)
            : prev.items.map((item) => (item.id === itemId ? { ...item, quantity } : item));

        const { subtotal, taxAmount, total } = recalculateTotals(newItems, prev.discount_amount);

        return {
          ...prev,
          items: newItems,
          subtotal,
          tax_amount: taxAmount,
          total,
        };
      });
    },
    [recalculateTotals]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      updateItemQuantity(itemId, 0);
    },
    [updateItemQuantity]
  );

  const setItemDiscount = useCallback(
    (itemId: string, discountPercent: number) => {
      setCart((prev) => {
        const newItems = prev.items.map((item) =>
          item.id === itemId ? { ...item, discount_percent: discountPercent } : item
        );

        const { subtotal, taxAmount, total } = recalculateTotals(newItems, prev.discount_amount);

        return {
          ...prev,
          items: newItems,
          subtotal,
          tax_amount: taxAmount,
          total,
        };
      });
    },
    [recalculateTotals]
  );

  const setCartDiscount = useCallback(
    (amount: number) => {
      setCart((prev) => {
        const { subtotal, taxAmount, total } = recalculateTotals(prev.items, amount);

        return {
          ...prev,
          discount_amount: amount,
          subtotal,
          tax_amount: taxAmount,
          total,
        };
      });
    },
    [recalculateTotals]
  );

  const setCustomer = useCallback((customerId: string | null, customerName: string | null) => {
    setCart((prev) => ({
      ...prev,
      customer_id: customerId,
      customer_name: customerName,
    }));
  }, []);

  const setNotes = useCallback((notes: string | null) => {
    setCart((prev) => ({
      ...prev,
      notes,
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(emptyCart);
  }, []);

  return {
    cart,
    addItem,
    updateItemQuantity,
    removeItem,
    setItemDiscount,
    setCartDiscount,
    setCustomer,
    setNotes,
    clearCart,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

// ============ Transactions Hook ============

export function usePOSTransactions(options?: { sessionId?: string; limit?: number }) {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<POSTransaction[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    setError(null);
    try {
      const { transactions: data, count: totalCount } = await posService.getTransactions(
        organizationId,
        { sessionId: options?.sessionId, limit: options?.limit || 50 }
      );
      setTransactions(data);
      setCount(totalCount);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, options?.sessionId, options?.limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = useCallback(
    async (input: CreatePOSTransactionInput) => {
      if (!organizationId) return null;

      setIsPending(true);
      try {
        const data = await posService.createTransaction(organizationId, input);
        setTransactions((prev) => [data, ...prev]);
        toast({ title: 'Sale Complete', description: `Transaction ${data.transaction_number}` });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create transaction';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [organizationId, toast]
  );

  const voidTransaction = useCallback(
    async (transactionId: string) => {
      setIsPending(true);
      try {
        const data = await posService.voidTransaction(transactionId);
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === transactionId ? { ...tx, status: 'voided' } : tx))
        );
        toast({ title: 'Transaction Voided', description: `${data.transaction_number} voided` });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to void transaction';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [toast]
  );

  const refundTransaction = useCallback(
    async (transactionId: string) => {
      setIsPending(true);
      try {
        const data = await posService.refundTransaction(transactionId);
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === transactionId ? { ...tx, status: 'refunded' } : tx))
        );
        toast({ title: 'Transaction Refunded', description: `${data.transaction_number} refunded` });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to refund transaction';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [toast]
  );

  return {
    transactions,
    count,
    isLoading,
    error,
    isPending,
    createTransaction,
    voidTransaction,
    refundTransaction,
    refetch: fetchTransactions,
  };
}

// ============ Product Search Hook ============

export function usePOSProductSearch() {
  const { organizationId } = useAuth();
  const [results, setResults] = useState<Awaited<ReturnType<typeof posService.searchProducts>>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (!organizationId || query.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const data = await posService.searchProducts(organizationId, query);
        setResults(data);
      } catch (err) {
        console.error('Product search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [organizationId]
  );

  const searchByBarcode = useCallback(
    async (barcode: string) => {
      if (!organizationId) return null;

      setIsSearching(true);
      try {
        const product = await posService.getProductByBarcode(organizationId, barcode);
        return product;
      } catch (err) {
        console.error('Barcode search error:', err);
        return null;
      } finally {
        setIsSearching(false);
      }
    },
    [organizationId]
  );

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    isSearching,
    search,
    searchByBarcode,
    clearResults,
  };
}

// ============ Session Summary Hook ============

export function usePOSSessionSummary(sessionId: string | undefined) {
  const [summary, setSummary] = useState<POSSessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await posService.getSessionSummary(sessionId);
      setSummary(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isLoading,
    error,
    refetch: fetchSummary,
  };
}

// ============ Cash Movements Hook ============

export function usePOSCashMovements(sessionId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [movements, setMovements] = useState<POSCashMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const fetchMovements = useCallback(async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const data = await posService.getCashMovements(sessionId);
      setMovements(data);
    } catch (err) {
      console.error('Failed to fetch cash movements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const addMovement = useCallback(
    async (input: Omit<POSCashMovementInput, 'session_id'>) => {
      if (!sessionId || !user?.id) return null;

      setIsPending(true);
      try {
        const data = await posService.addCashMovement(user.id, { ...input, session_id: sessionId });
        setMovements((prev) => [data, ...prev]);
        toast({
          title: input.movement_type === 'in' ? 'Cash In' : 'Cash Out',
          description: `$${input.amount.toFixed(2)} - ${input.reason}`,
        });
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to record cash movement';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [sessionId, user?.id, toast]
  );

  return {
    movements,
    isLoading,
    isPending,
    addMovement,
    refetch: fetchMovements,
  };
}
