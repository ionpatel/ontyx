'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as automations from '@/services/automations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, FileText, Package, Clock, Headphones,
  Calendar, Users, RefreshCw, TrendingUp, ArrowRight,
  CheckCircle, DollarSign, Bell, Zap
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

interface InsightsData {
  alerts: {
    overdueInvoices: number;
    lowStockProducts: number;
    pendingApprovals: number;
    openTickets: number;
    pendingLeaveRequests: number;
    expiringSubscriptions: number;
  };
  upcoming: {
    appointments: any[];
  };
  metrics: {
    monthlyRevenue: number;
  };
  details: {
    overdueInvoices: any[];
    lowStockProducts: any[];
    expiringSubscriptions: any[];
  };
}

export function BusinessInsights() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!organizationId) return;
      setLoading(true);
      try {
        const data = await automations.getBusinessInsights(organizationId);
        setInsights(data);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!insights) return null;

  const totalAlerts = Object.values(insights.alerts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      {totalAlerts > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-100">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                    {totalAlerts} Items Need Attention
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Review and take action on pending items
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-orange-300">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Link href="/invoices?status=overdue">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${insights.alerts.overdueInvoices > 0 ? 'border-red-200' : ''}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <FileText className={`h-4 w-4 ${insights.alerts.overdueInvoices > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">Overdue</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${insights.alerts.overdueInvoices > 0 ? 'text-red-600' : ''}`}>
                {insights.alerts.overdueInvoices}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/inventory?filter=low-stock">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${insights.alerts.lowStockProducts > 0 ? 'border-yellow-200' : ''}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Package className={`h-4 w-4 ${insights.alerts.lowStockProducts > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">Low Stock</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${insights.alerts.lowStockProducts > 0 ? 'text-yellow-600' : ''}`}>
                {insights.alerts.lowStockProducts}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/approvals?status=pending">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${insights.alerts.pendingApprovals > 0 ? 'border-blue-200' : ''}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${insights.alerts.pendingApprovals > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">Approvals</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${insights.alerts.pendingApprovals > 0 ? 'text-blue-600' : ''}`}>
                {insights.alerts.pendingApprovals}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/helpdesk?status=open">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${insights.alerts.openTickets > 0 ? 'border-purple-200' : ''}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Headphones className={`h-4 w-4 ${insights.alerts.openTickets > 0 ? 'text-purple-500' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">Open Tickets</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${insights.alerts.openTickets > 0 ? 'text-purple-600' : ''}`}>
                {insights.alerts.openTickets}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/time-off?status=pending">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${insights.alerts.pendingLeaveRequests > 0 ? 'border-green-200' : ''}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Users className={`h-4 w-4 ${insights.alerts.pendingLeaveRequests > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">Leave Requests</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${insights.alerts.pendingLeaveRequests > 0 ? 'text-green-600' : ''}`}>
                {insights.alerts.pendingLeaveRequests}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/subscriptions?filter=expiring">
          <Card className={`cursor-pointer transition-all hover:shadow-md ${insights.alerts.expiringSubscriptions > 0 ? 'border-orange-200' : ''}`}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-4 w-4 ${insights.alerts.expiringSubscriptions > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">Expiring</span>
              </div>
              <div className={`text-2xl font-bold mt-1 ${insights.alerts.expiringSubscriptions > 0 ? 'text-orange-600' : ''}`}>
                {insights.alerts.expiringSubscriptions}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overdue Invoices */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Overdue Invoices
              </CardTitle>
              <Link href="/invoices?status=overdue">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {insights.details.overdueInvoices.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                All invoices are up to date!
              </div>
            ) : (
              <div className="space-y-3">
                {insights.details.overdueInvoices.slice(0, 5).map((inv: any) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="block">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-sm">{inv.invoice_number}</div>
                        <div className="text-xs text-muted-foreground">{inv.contact?.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">{formatCurrency(inv.total)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(inv.due_date), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-yellow-500" />
                Low Stock Alerts
              </CardTitle>
              <Link href="/inventory?filter=low-stock">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {insights.details.lowStockProducts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                All products are well stocked!
              </div>
            ) : (
              <div className="space-y-3">
                {insights.details.lowStockProducts.slice(0, 5).map((product: any) => {
                  const stock = product.stock?.reduce((s: number, l: any) => s + (l.quantity || 0), 0) || 0;
                  return (
                    <Link key={product.id} href={`/inventory/${product.id}`} className="block">
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                        <div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-muted-foreground">{product.sku}</div>
                        </div>
                        <div className="text-right">
                          <Badge variant={stock === 0 ? 'destructive' : 'secondary'}>
                            {stock} in stock
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            Reorder at {product.reorder_point}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                This Week
              </CardTitle>
              <Link href="/appointments">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {insights.upcoming.appointments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No upcoming appointments
              </div>
            ) : (
              <div className="space-y-3">
                {insights.upcoming.appointments.map((apt: any) => (
                  <Link key={apt.id} href={`/appointments/${apt.id}`} className="block">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                      <div>
                        <div className="font-medium text-sm">{apt.title}</div>
                        <div className="text-xs text-muted-foreground">{apt.contact?.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">{format(new Date(apt.start_time), 'EEE, MMM d')}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(apt.start_time), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
