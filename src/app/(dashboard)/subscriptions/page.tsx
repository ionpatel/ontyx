'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as subscriptionsService from '@/services/subscriptions';
import type { Subscription, SubscriptionPlan } from '@/types/subscriptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, TrendingUp, Users, DollarSign, RefreshCw, XCircle } from 'lucide-react';
import { ContactSelector } from '@/components/selectors';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  trialing: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
  expired: 'bg-orange-100 text-orange-700',
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

export default function SubscriptionsPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [metrics, setMetrics] = useState({ mrr: 0, arr: 0, active_count: 0, trialing_count: 0, churn_rate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [subs, plansData, metricsData] = await Promise.all([
        subscriptionsService.getSubscriptions(organizationId),
        subscriptionsService.getSubscriptionPlans(organizationId),
        subscriptionsService.getSubscriptionMetrics(organizationId),
      ]);
      setSubscriptions(subs);
      setPlans(plansData);
      setMetrics(metricsData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load subscriptions', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Cancel this subscription?')) return;
    try {
      await subscriptionsService.cancelSubscription(subscriptionId);
      toast({ title: 'Subscription Cancelled' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to cancel', variant: 'destructive' });
    }
  };

  const handleCreateSubscription = async () => {
    if (!organizationId || !selectedPlanId || !selectedContactId) {
      toast({ title: 'Error', description: 'Please select a plan and customer', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await subscriptionsService.createSubscription(organizationId, {
        plan_id: selectedPlanId,
        contact_id: selectedContactId,
        status: 'active',
        start_date: new Date().toISOString(),
      });
      toast({ title: 'Subscription Created' });
      setShowNewDialog(false);
      setSelectedPlanId('');
      setSelectedContactId('');
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create subscription', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage recurring billing and subscriptions</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Subscription
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><DollarSign className="h-5 w-5 text-green-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">MRR</div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">ARR</div>
                <div className="text-2xl font-bold">{formatCurrency(metrics.arr)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100"><Users className="h-5 w-5 text-purple-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold">{metrics.active_count}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100"><RefreshCw className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Trialing</div>
                <div className="text-2xl font-bold">{metrics.trialing_count}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(plan.price)}<span className="text-sm font-normal text-muted-foreground">/{plan.billing_interval}</span></div>
                {plan.trial_days > 0 && <div className="text-sm text-muted-foreground mt-1">{plan.trial_days} day free trial</div>}
                <ul className="mt-4 space-y-2">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <span className="text-green-500">✓</span> {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && (
            <Card className="col-span-3">
              <CardContent className="py-8 text-center text-muted-foreground">
                No plans created yet
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Next Billing</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" /></TableCell></TableRow>
            ) : subscriptions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No subscriptions</TableCell></TableRow>
            ) : (
              subscriptions.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="font-medium">{sub.contact?.name}</div>
                    <div className="text-sm text-muted-foreground">{sub.contact?.email}</div>
                  </TableCell>
                  <TableCell>{sub.plan?.name}</TableCell>
                  <TableCell><Badge className={statusColors[sub.status]}>{sub.status}</Badge></TableCell>
                  <TableCell>{format(new Date(sub.start_date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{sub.next_billing_date ? format(new Date(sub.next_billing_date), 'MMM d, yyyy') : '-'}</TableCell>
                  <TableCell className="text-right">
                    {sub.status === 'active' && (
                      <Button variant="ghost" size="sm" onClick={() => handleCancel(sub.id)}>
                        <XCircle className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* New Subscription Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Plan</label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger><SelectValue placeholder="Choose a plan..." /></SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)}/{plan.billing_interval}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <ContactSelector
                value={selectedContactId}
                onChange={setSelectedContactId}
                type="customer"
                placeholder="Select customer..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSubscription} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
