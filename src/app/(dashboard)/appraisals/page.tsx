'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as appraisalsService from '@/services/appraisals';
import type { Appraisal } from '@/types/appraisals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Star, Clock, CheckCircle, FileText, TrendingUp, Users } from 'lucide-react';
import { EmployeeSelector } from '@/components/selectors';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  self_review: 'bg-blue-100 text-blue-700',
  manager_review: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  acknowledged: 'bg-purple-100 text-purple-700',
};

export default function AppraisalsPage() {
  const { organizationId, user } = useAuth();
  const { toast } = useToast();
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, avg_rating: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [appraisalsData, statsData] = await Promise.all([
        appraisalsService.getAppraisals(organizationId),
        appraisalsService.getAppraisalStats(organizationId),
      ]);
      setAppraisals(appraisalsData);
      setStats(statsData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load appraisals', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!organizationId || !employeeId || !periodStart || !periodEnd) {
      toast({ title: 'Error', description: 'All fields required', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await appraisalsService.createAppraisal(organizationId, {
        employee_id: employeeId,
        reviewer_id: user?.id,
        review_period_start: periodStart,
        review_period_end: periodEnd,
        status: 'draft',
      });
      toast({ title: 'Appraisal Created' });
      setShowDialog(false);
      setEmployeeId('');
      setPeriodStart('');
      setPeriodEnd('');
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create appraisal', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const myAppraisals = appraisals.filter(a => a.employee_id === user?.id);
  const toReview = appraisals.filter(a => a.reviewer_id === user?.id && a.status === 'manager_review');
  const pendingAck = appraisals.filter(a => a.employee_id === user?.id && a.status === 'completed');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Performance Appraisals</h1>
          <p className="text-muted-foreground">Manage performance reviews</p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Appraisal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Total Reviews</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100"><Star className="h-5 w-5 text-purple-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
                <div className="text-2xl font-bold">{stats.avg_rating.toFixed(1)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {toReview.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-800">Reviews Pending Your Action</div>
                <div className="text-sm text-yellow-700">{toReview.length} appraisal(s) waiting for your review</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pendingAck.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">Reviews Ready to Acknowledge</div>
                <div className="text-sm text-blue-700">{pendingAck.length} completed review(s) waiting for your acknowledgement</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Appraisals</TabsTrigger>
          <TabsTrigger value="my">My Reviews</TabsTrigger>
          <TabsTrigger value="team">Team Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : appraisals.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No appraisals</p></CardContent></Card>
          ) : (
            appraisals.map(appraisal => (
              <Card key={appraisal.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                        {appraisal.employee?.first_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{appraisal.employee?.first_name} {appraisal.employee?.last_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Review period: {format(new Date(appraisal.review_period_start), 'MMM yyyy')} - {format(new Date(appraisal.review_period_end), 'MMM yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reviewer: {appraisal.reviewer?.first_name} {appraisal.reviewer?.last_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {appraisal.overall_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{appraisal.overall_rating.toFixed(1)}</span>
                        </div>
                      )}
                      <Badge className={statusColors[appraisal.status]}>{appraisal.status.replace('_', ' ')}</Badge>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {myAppraisals.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No reviews for you</CardContent></Card>
          ) : (
            myAppraisals.map(appraisal => (
              <Card key={appraisal.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {format(new Date(appraisal.review_period_start), 'MMM yyyy')} - {format(new Date(appraisal.review_period_end), 'MMM yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Reviewed by: {appraisal.reviewer?.first_name} {appraisal.reviewer?.last_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {appraisal.overall_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{appraisal.overall_rating.toFixed(1)}</span>
                        </div>
                      )}
                      <Badge className={statusColors[appraisal.status]}>{appraisal.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="team">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Team view coming soon</CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Create Appraisal Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Performance Appraisal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <EmployeeSelector
                value={employeeId}
                onChange={setEmployeeId}
                placeholder="Select employee to review..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period Start</Label>
                <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Period End</Label>
                <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Appraisal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
