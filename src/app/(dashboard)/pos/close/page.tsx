'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Receipt,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { usePOSSession, usePOSSessionSummary, usePOSCashMovements } from '@/hooks/use-pos';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

export default function POSClosePage() {
  const router = useRouter();
  const { session, closeSession, isPending } = usePOSSession();
  const { summary, isLoading: summaryLoading } = usePOSSessionSummary(session?.id);
  const { movements } = usePOSCashMovements(session?.id);

  const [closingCash, setClosingCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate expected cash
  const cashMovementsNet = movements.reduce(
    (sum, m) => sum + (m.movement_type === 'in' ? m.amount : -m.amount),
    0
  );
  const expectedCash = (session?.opening_cash || 0) + (summary?.cash_sales || 0) + cashMovementsNet;
  const actualCash = parseFloat(closingCash) || 0;
  const cashDifference = actualCash - expectedCash;

  // Session duration
  const sessionDuration = session
    ? `${differenceInHours(new Date(), new Date(session.opened_at))}h ${differenceInMinutes(new Date(), new Date(session.opened_at)) % 60}m`
    : '--';

  const handleClose = async () => {
    const result = await closeSession({
      closing_cash: actualCash,
      closing_notes: closingNotes || undefined,
    });

    if (result) {
      setShowConfirm(false);
      setShowSuccess(true);
    }
  };

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Active Session</CardTitle>
            <CardDescription>There is no open session to close.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push('/pos')}>
              Go to POS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/pos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Close Session</h1>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {session.session_number}
        </Badge>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
            <CardDescription>
              Started {format(new Date(session.opened_at), 'PPp')} • Duration: {sessionDuration}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : summary ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{summary.total_transactions}</div>
                  <div className="text-sm text-muted-foreground">Transactions</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(summary.net_sales)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net Sales</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{summary.items_sold}</div>
                  <div className="text-sm text-muted-foreground">Items Sold</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {formatCurrency(summary.average_transaction)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Transaction</div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Sales Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Sales by Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span>Cash</span>
                </div>
                <span className="font-mono font-medium">
                  {formatCurrency(summary?.cash_sales || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Card (Debit/Credit/Interac)</span>
                </div>
                <span className="font-mono font-medium">
                  {formatCurrency(summary?.card_sales || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-600" />
                  <span>Other</span>
                </div>
                <span className="font-mono font-medium">
                  {formatCurrency(summary?.other_sales || 0)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-bold">
                <span>Total Sales</span>
                <span className="font-mono">{formatCurrency(summary?.total_sales || 0)}</span>
              </div>
              {(summary?.total_refunds || 0) > 0 && (
                <div className="flex items-center justify-between text-red-600">
                  <span>Refunds</span>
                  <span className="font-mono">-{formatCurrency(summary?.total_refunds || 0)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Cash Drawer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Opening Cash</span>
                <span className="font-mono">{formatCurrency(session.opening_cash)}</span>
              </div>
              <div className="flex items-center justify-between text-green-600">
                <span>+ Cash Sales</span>
                <span className="font-mono">{formatCurrency(summary?.cash_sales || 0)}</span>
              </div>
              {movements.length > 0 && (
                <>
                  {movements
                    .filter((m) => m.movement_type === 'in')
                    .map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-green-600 text-sm">
                        <span>+ {m.reason}</span>
                        <span className="font-mono">{formatCurrency(m.amount)}</span>
                      </div>
                    ))}
                  {movements
                    .filter((m) => m.movement_type === 'out')
                    .map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-red-600 text-sm">
                        <span>- {m.reason}</span>
                        <span className="font-mono">-{formatCurrency(m.amount)}</span>
                      </div>
                    ))}
                </>
              )}
              <Separator />
              <div className="flex items-center justify-between font-bold">
                <span>Expected Cash</span>
                <span className="font-mono">{formatCurrency(expectedCash)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash Count */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Count</CardTitle>
            <CardDescription>Count the cash in your drawer and enter the total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Actual Cash in Drawer</label>
              <div className="mt-2 relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="pl-10 text-2xl h-14 text-center font-mono"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {closingCash && (
              <div
                className={cn(
                  'rounded-lg p-4 flex items-center justify-between',
                  Math.abs(cashDifference) < 0.01
                    ? 'bg-green-50 border border-green-200'
                    : Math.abs(cashDifference) <= 5
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-red-50 border border-red-200'
                )}
              >
                <div className="flex items-center gap-2">
                  {Math.abs(cashDifference) < 0.01 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle
                      className={cn(
                        'h-5 w-5',
                        Math.abs(cashDifference) <= 5 ? 'text-amber-600' : 'text-red-600'
                      )}
                    />
                  )}
                  <span className="font-medium">
                    {Math.abs(cashDifference) < 0.01
                      ? 'Cash matches expected amount'
                      : cashDifference > 0
                      ? 'Over by'
                      : 'Short by'}
                  </span>
                </div>
                {Math.abs(cashDifference) >= 0.01 && (
                  <span
                    className={cn(
                      'font-mono font-bold text-lg',
                      cashDifference > 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {cashDifference > 0 ? '+' : ''}
                    {formatCurrency(cashDifference)}
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-muted-foreground">Closing Notes (Optional)</label>
              <Textarea
                placeholder="Any notes about the session..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            <Button
              className="w-full h-14 text-lg"
              onClick={() => setShowConfirm(true)}
              disabled={!closingCash}
            >
              Close Session
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Close Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              Are you sure you want to close session{' '}
              <span className="font-mono font-medium">{session.session_number}</span>?
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Total Transactions</span>
                <span className="font-bold">{summary?.total_transactions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Net Sales</span>
                <span className="font-bold">{formatCurrency(summary?.net_sales || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Closing Cash</span>
                <span className="font-mono">{formatCurrency(actualCash)}</span>
              </div>
              {Math.abs(cashDifference) >= 0.01 && (
                <div
                  className={cn(
                    'flex justify-between',
                    cashDifference > 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  <span>Difference</span>
                  <span className="font-mono font-bold">
                    {cashDifference > 0 ? '+' : ''}
                    {formatCurrency(cashDifference)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleClose} disabled={isPending}>
              {isPending ? 'Closing...' : 'Confirm Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess}>
        <DialogContent>
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Session Closed</h2>
            <p className="text-muted-foreground">
              Session {session.session_number} has been closed successfully.
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-2 text-left">
              <div className="flex justify-between">
                <span>Duration</span>
                <span>{sessionDuration}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sales</span>
                <span className="font-bold">{formatCurrency(summary?.net_sales || 0)}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
