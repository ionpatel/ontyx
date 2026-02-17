'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Receipt,
  RotateCcw,
  XCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Banknote,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { usePOSSession, usePOSTransactions } from '@/hooks/use-pos';
import type { POSTransaction } from '@/types/pos';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    case 'voided':
      return <Badge variant="secondary">Voided</Badge>;
    case 'refunded':
      return <Badge className="bg-amber-100 text-amber-700">Refunded</Badge>;
    case 'pending':
      return <Badge className="bg-blue-100 text-blue-700">Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'cash':
      return <Banknote className="h-4 w-4" />;
    case 'debit':
    case 'credit':
    case 'interac':
      return <CreditCard className="h-4 w-4" />;
    default:
      return <Receipt className="h-4 w-4" />;
  }
};

export default function POSHistoryPage() {
  const router = useRouter();
  const { session } = usePOSSession();
  const {
    transactions,
    isLoading,
    voidTransaction,
    refundTransaction,
    isPending,
  } = usePOSTransactions({ sessionId: session?.id, limit: 100 });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<POSTransaction | null>(null);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.transaction_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.items?.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleVoid = async () => {
    if (!selectedTransaction) return;
    const result = await voidTransaction(selectedTransaction.id);
    if (result) {
      setShowVoidConfirm(false);
      setSelectedTransaction(null);
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction) return;
    const result = await refundTransaction(selectedTransaction.id);
    if (result) {
      setShowRefundConfirm(false);
      setSelectedTransaction(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/pos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Transaction History</h1>
        {session && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {session.session_number}
          </Badge>
        )}
      </header>

      <div className="flex-1 overflow-hidden p-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="voided">Voided</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Receipt className="h-12 w-12 mb-4 opacity-50" />
                <p>No transactions found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono">{tx.transaction_number}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tx.created_at), 'h:mm a')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          {tx.items?.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-sm truncate">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                          {(tx.items?.length || 0) > 2 && (
                            <div className="text-sm text-muted-foreground">
                              +{(tx.items?.length || 0) - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {tx.payments?.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-sm">
                              {getPaymentIcon(p.payment_method)}
                              <span className="capitalize">{p.payment_method}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(tx.total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransaction(tx)}
                          >
                            View
                          </Button>
                          {tx.status === 'completed' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-amber-600"
                                onClick={() => {
                                  setSelectedTransaction(tx);
                                  setShowRefundConfirm(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedTransaction(tx);
                                  setShowVoidConfirm(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction && !showVoidConfirm && !showRefundConfirm} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedTransaction?.transaction_number}</span>
              {selectedTransaction && getStatusBadge(selectedTransaction.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {format(new Date(selectedTransaction.created_at), 'PPpp')}
              </div>

              <div className="border rounded-lg p-4 space-y-2">
                {selectedTransaction.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono">{formatCurrency(item.line_total)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCurrency(selectedTransaction.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-mono">{formatCurrency(selectedTransaction.tax_amount)}</span>
                </div>
                {selectedTransaction.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCurrency(selectedTransaction.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="font-mono">{formatCurrency(selectedTransaction.total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Payments</div>
                {selectedTransaction.payments?.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 capitalize">
                      {getPaymentIcon(p.payment_method)}
                      {p.payment_method}
                    </div>
                    <span className="font-mono">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Receipt className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Confirmation */}
      <Dialog open={showVoidConfirm} onOpenChange={setShowVoidConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Transaction?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to void transaction{' '}
            <span className="font-mono font-medium">{selectedTransaction?.transaction_number}</span>?
            This will restore inventory but cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoidConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleVoid} disabled={isPending}>
              {isPending ? 'Voiding...' : 'Void Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation */}
      <Dialog open={showRefundConfirm} onOpenChange={setShowRefundConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Transaction?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to refund transaction{' '}
            <span className="font-mono font-medium">{selectedTransaction?.transaction_number}</span>?
            This will restore inventory and mark the transaction as refunded.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundConfirm(false)}>
              Cancel
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700" onClick={handleRefund} disabled={isPending}>
              {isPending ? 'Processing...' : 'Refund Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
