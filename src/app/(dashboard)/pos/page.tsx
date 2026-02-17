'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  X,
  User,
  Clock,
  Calculator,
  History,
  Settings,
  LogOut,
  ChevronRight,
  Package,
  Percent,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  usePOSSession,
  usePOSCart,
  usePOSTransactions,
  usePOSProductSearch,
  usePOSSessionSummary,
} from '@/hooks/use-pos';
import type { PaymentMethod, CartItem } from '@/types/pos';

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

// ============ Open Session Dialog ============
function OpenSessionDialog({
  open,
  onOpenSession,
  isPending,
}: {
  open: boolean;
  onOpenSession: (openingCash: number) => void;
  isPending: boolean;
}) {
  const [openingCash, setOpeningCash] = useState('');

  const handleSubmit = () => {
    const amount = parseFloat(openingCash) || 0;
    onOpenSession(amount);
  };

  const quickAmounts = [100, 200, 300, 500];

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Start New Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Opening Cash</label>
            <div className="mt-2 relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="pl-10 text-2xl h-14 text-center font-mono"
                step="0.01"
                min="0"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                size="lg"
                onClick={() => setOpeningCash(amount.toString())}
                className="h-12"
              >
                ${amount}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending} size="lg" className="w-full h-14 text-lg">
            {isPending ? 'Starting...' : 'Start Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Payment Dialog ============
function PaymentDialog({
  open,
  onClose,
  total,
  onComplete,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  total: number;
  onComplete: (payments: { method: PaymentMethod; amount: number }[]) => void;
  isPending: boolean;
}) {
  const [payments, setPayments] = useState<{ method: PaymentMethod; amount: number }[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [inputAmount, setInputAmount] = useState('');

  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - amountPaid;
  const change = amountPaid > total ? amountPaid - total : 0;

  const paymentMethods: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { method: 'cash', label: 'Cash', icon: <Banknote className="h-6 w-6" /> },
    { method: 'debit', label: 'Debit', icon: <CreditCard className="h-6 w-6" /> },
    { method: 'credit', label: 'Credit', icon: <CreditCard className="h-6 w-6" /> },
    { method: 'interac', label: 'Interac', icon: <Smartphone className="h-6 w-6" /> },
  ];

  const handleAddPayment = () => {
    if (!selectedMethod || !inputAmount) return;
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPayments((prev) => [...prev, { method: selectedMethod, amount }]);
    setInputAmount('');
    setSelectedMethod(null);
  };

  const handleQuickPay = (method: PaymentMethod) => {
    if (remaining <= 0) return;
    setPayments((prev) => [...prev, { method, amount: remaining }]);
  };

  const handleComplete = () => {
    if (remaining > 0.01) return; // Allow for small rounding
    onComplete(payments);
  };

  const handleClose = () => {
    setPayments([]);
    setSelectedMethod(null);
    setInputAmount('');
    onClose();
  };

  const numpadButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const handleNumpad = (key: string) => {
    if (key === '⌫') {
      setInputAmount((prev) => prev.slice(0, -1));
    } else if (key === '.' && inputAmount.includes('.')) {
      return;
    } else {
      setInputAmount((prev) => prev + key);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>Payment</span>
            <span className="text-3xl font-bold">{formatCurrency(total)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Left: Payment methods */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map(({ method, label, icon }) => (
                <Button
                  key={method}
                  variant={selectedMethod === method ? 'default' : 'outline'}
                  className="h-20 flex flex-col gap-2"
                  onClick={() => {
                    setSelectedMethod(method);
                    setInputAmount(remaining > 0 ? remaining.toFixed(2) : '');
                  }}
                >
                  {icon}
                  <span>{label}</span>
                </Button>
              ))}
            </div>

            <Separator />

            <div className="text-sm font-medium text-muted-foreground">Quick Pay Full Amount</div>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(({ method, label }) => (
                <Button
                  key={`quick-${method}`}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickPay(method)}
                  disabled={remaining <= 0}
                >
                  {label} {formatCurrency(remaining)}
                </Button>
              ))}
            </div>

            {/* Payment list */}
            {payments.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-sm font-medium">Payments Received</div>
                {payments.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <span className="capitalize">{p.method}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatCurrency(p.amount)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setPayments((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Numpad */}
          <div className="space-y-4">
            {selectedMethod && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground capitalize">{selectedMethod} Amount</label>
                  <Input
                    type="text"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    className="text-3xl h-16 text-center font-mono mt-1"
                    placeholder="0.00"
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {numpadButtons.map((btn) => (
                    <Button
                      key={btn}
                      variant="outline"
                      className="h-14 text-xl font-semibold"
                      onClick={() => handleNumpad(btn)}
                    >
                      {btn}
                    </Button>
                  ))}
                </div>

                <Button onClick={handleAddPayment} className="w-full h-12" disabled={!inputAmount}>
                  Add Payment
                </Button>
              </>
            )}

            {!selectedMethod && (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a payment method
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-lg">
            <span>Total Due</span>
            <span className="font-bold">{formatCurrency(total)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Amount Paid</span>
            <span className="font-mono">{formatCurrency(amountPaid)}</span>
          </div>
          {remaining > 0 && (
            <div className="flex justify-between text-lg text-red-600">
              <span>Remaining</span>
              <span className="font-mono">{formatCurrency(remaining)}</span>
            </div>
          )}
          {change > 0 && (
            <div className="flex justify-between text-lg text-green-600 font-bold">
              <span>Change Due</span>
              <span className="font-mono">{formatCurrency(change)}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} size="lg">
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={remaining > 0.01 || isPending}
            size="lg"
            className="min-w-[200px]"
          >
            {isPending ? 'Processing...' : 'Complete Sale'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Receipt Dialog ============
function ReceiptDialog({
  open,
  onClose,
  transaction,
}: {
  open: boolean;
  onClose: () => void;
  transaction: {
    transaction_number: string;
    items: CartItem[];
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total: number;
    payments: { method: PaymentMethod; amount: number }[];
    change: number;
  } | null;
}) {
  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <div className="text-center space-y-4 py-4">
          <div className="text-2xl font-bold text-green-600">✓ Sale Complete</div>
          <div className="text-lg text-muted-foreground">{transaction.transaction_number}</div>

          <div className="border rounded-lg p-4 text-left space-y-2">
            {transaction.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-mono">{formatCurrency(item.quantity * item.unit_price)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(transaction.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span className="font-mono">{formatCurrency(transaction.tax_amount)}</span>
            </div>
            {transaction.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(transaction.discount_amount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(transaction.total)}</span>
            </div>
            <Separator />
            {transaction.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="capitalize">{p.method}</span>
                <span className="font-mono">{formatCurrency(p.amount)}</span>
              </div>
            ))}
            {transaction.change > 0 && (
              <div className="flex justify-between font-bold text-green-600">
                <span>Change</span>
                <span className="font-mono">{formatCurrency(transaction.change)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.print()}>
              <Receipt className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button className="flex-1" onClick={onClose}>
              New Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ Main POS Page ============
export default function POSPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { session, isLoading: sessionLoading, openSession, closeSession, isPending: sessionPending } = usePOSSession();
  const { cart, addItem, updateItemQuantity, removeItem, setCartDiscount, clearCart, itemCount } = usePOSCart();
  const { createTransaction, isPending: transactionPending } = usePOSTransactions({ sessionId: session?.id });
  const { results: searchResults, search, searchByBarcode, clearResults, isSearching } = usePOSProductSearch();
  const { summary } = usePOSSessionSummary(session?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        search(searchQuery);
      } else {
        clearResults();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search, clearResults]);

  // Barcode scanner detection (quick typing)
  const barcodeBuffer = useRef('');
  const barcodeTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleKeyPress = async (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      clearTimeout(barcodeTimeout.current);

      if (e.key === 'Enter' && barcodeBuffer.current.length > 5) {
        // Likely a barcode scan
        const barcode = barcodeBuffer.current;
        barcodeBuffer.current = '';
        const product = await searchByBarcode(barcode);
        if (product) {
          addItem({
            id: product.id,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode || undefined,
            price: product.price,
            tax_rate: product.tax_rate,
            image_url: product.image_url || undefined,
          });
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        barcodeTimeout.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [addItem, searchByBarcode]);

  const handleOpenSession = async (openingCash: number) => {
    await openSession({ opening_cash: openingCash });
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    setShowPayment(true);
  };

  const handleCompletePayment = async (payments: { method: PaymentMethod; amount: number }[]) => {
    if (!session) return;

    const result = await createTransaction({
      session_id: session.id,
      customer_id: cart.customer_id || undefined,
      items: cart.items.map((item) => ({
        product_id: item.product_id || undefined,
        name: item.name,
        sku: item.sku || undefined,
        barcode: item.barcode || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        tax_rate: item.tax_rate,
      })),
      payments: payments.map((p) => ({
        payment_method: p.method,
        amount: p.amount,
      })),
      discount_amount: cart.discount_amount,
      notes: cart.notes || undefined,
    });

    if (result) {
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      setLastTransaction({
        transaction_number: result.transaction_number,
        items: cart.items,
        subtotal: cart.subtotal,
        tax_amount: cart.tax_amount,
        discount_amount: cart.discount_amount,
        total: cart.total,
        payments,
        change: Math.max(0, totalPaid - cart.total),
      });
      clearCart();
      setShowPayment(false);
      setShowReceipt(true);
    }
  };

  const handleProductSelect = (product: (typeof searchResults)[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || undefined,
      price: product.price,
      tax_rate: product.tax_rate,
      image_url: product.image_url || undefined,
    });
    setSearchQuery('');
    clearResults();
    searchInputRef.current?.focus();
  };

  // Loading state
  if (sessionLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    );
  }

  // No session - show open dialog
  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Point of Sale</CardTitle>
            <p className="text-muted-foreground">Start a session to begin selling</p>
          </CardHeader>
          <CardContent>
            <OpenSessionDialog open={true} onOpenSession={handleOpenSession} isPending={sessionPending} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">POS Terminal</h1>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {session.session_number}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {summary && (
            <div className="text-sm text-muted-foreground mr-4">
              <span className="font-medium text-foreground">{summary.total_transactions}</span> sales •{' '}
              <span className="font-medium text-foreground">{formatCurrency(summary.net_sales)}</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => router.push('/pos/history')}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/pos/close')}>
            <LogOut className="h-4 w-4 mr-2" />
            End Session
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col p-4">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search products or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-4 border rounded-lg bg-background shadow-lg max-h-80 overflow-y-auto">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-muted/50 border-b last:border-b-0 text-left"
                >
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {product.sku} • Stock: {product.stock_quantity}
                    </div>
                  </div>
                  <div className="text-lg font-bold">{formatCurrency(product.price)}</div>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {searchResults.length === 0 && searchQuery.length < 2 && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Search className="h-12 w-12 mx-auto opacity-50" />
                <p>Search for products or scan a barcode</p>
              </div>
            </div>
          )}

          {/* No results */}
          {searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
                <p>No products found for &quot;{searchQuery}&quot;</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Cart */}
        <div className="w-[400px] bg-background border-l flex flex-col">
          {/* Cart header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="font-semibold">Cart</span>
                {itemCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {itemCount}
                  </Badge>
                )}
              </div>
              {cart.items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <ShoppingCart className="h-12 w-12 mx-auto opacity-50" />
                  <p>Cart is empty</p>
                </div>
              </div>
            ) : (
              cart.items.map((item) => (
                <div key={item.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(item.unit_price)} each
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-bold">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart totals */}
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (HST 13%)</span>
              <span>{formatCurrency(cart.tax_amount)}</span>
            </div>
            {cart.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(cart.discount_amount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>{formatCurrency(cart.total)}</span>
            </div>

            <Button
              className="w-full h-14 text-lg"
              onClick={handleCheckout}
              disabled={cart.items.length === 0}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Pay {formatCurrency(cart.total)}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={cart.total}
        onComplete={handleCompletePayment}
        isPending={transactionPending}
      />

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        transaction={lastTransaction}
      />
    </div>
  );
}
