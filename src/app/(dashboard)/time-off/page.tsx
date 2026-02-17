'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as leaveService from '@/services/leave';
import type { LeaveRequest, LeaveType, LeaveBalance } from '@/types/leave';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Plus, Clock, CheckCircle, XCircle, CalendarDays, Umbrella, HeartPulse, Briefcase } from 'lucide-react';
import { format, differenceInBusinessDays } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const typeIcons: Record<string, React.ReactNode> = {
  Vacation: <Umbrella className="h-4 w-4" />,
  Sick: <HeartPulse className="h-4 w-4" />,
  Personal: <Briefcase className="h-4 w-4" />,
};

export default function TimeOffPage() {
  const { organizationId, user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('my-requests');

  // Form state
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [reqs, types] = await Promise.all([
        leaveService.getLeaveRequests(organizationId),
        leaveService.getLeaveTypes(organizationId),
      ]);
      setRequests(reqs);
      setLeaveTypes(types);
      // TODO: Get employee ID from user context and fetch balances
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmitRequest = async () => {
    if (!organizationId || !user?.id || !selectedType || !startDate || !endDate) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: Get employee ID from user context
      await leaveService.createLeaveRequest(organizationId, user.id, {
        leave_type_id: selectedType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      toast({ title: 'Request Submitted', description: 'Your time off request has been submitted for approval' });
      setShowRequestDialog(false);
      setSelectedType('');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to submit request', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!user?.id) return;
    try {
      await leaveService.reviewLeaveRequest(requestId, user.id, { status });
      toast({ title: status === 'approved' ? 'Approved' : 'Rejected' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to review request', variant: 'destructive' });
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    return differenceInBusinessDays(new Date(endDate), new Date(startDate)) + 1;
  };

  const myRequests = requests.filter(r => r.employee_id === user?.id);
  const pendingApprovals = requests.filter(r => r.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Off</h1>
          <p className="text-muted-foreground">Manage leave requests and balances</p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Request Time Off
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {leaveTypes.slice(0, 4).map(type => (
          <Card key={type.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">{typeIcons[type.name] || <CalendarDays className="h-4 w-4" />}</div>
                <div>
                  <div className="text-sm text-muted-foreground">{type.name}</div>
                  <div className="text-2xl font-bold">{type.max_days_per_year || '∞'} days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Approvals ({pendingApprovals.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="my-requests" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : myRequests.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground"><Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No time off requests</p></CardContent></Card>
          ) : (
            myRequests.map(req => (
              <Card key={req.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">{typeIcons[req.leave_type?.name || ''] || <CalendarDays className="h-4 w-4" />}</div>
                      <div>
                        <div className="font-medium">{req.leave_type?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d, yyyy')} • {req.days_requested} days
                        </div>
                      </div>
                    </div>
                    <Badge className={statusColors[req.status]}>{req.status}</Badge>
                  </div>
                  {req.reason && <p className="mt-2 text-sm text-muted-foreground">{req.reason}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground"><CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No pending approvals</p></CardContent></Card>
          ) : (
            pendingApprovals.map(req => (
              <Card key={req.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">{typeIcons[req.leave_type?.name || ''] || <CalendarDays className="h-4 w-4" />}</div>
                      <div>
                        <div className="font-medium">{req.employee?.first_name} {req.employee?.last_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {req.leave_type?.name} • {format(new Date(req.start_date), 'MMM d')} - {format(new Date(req.end_date), 'MMM d')} • {req.days_requested} days
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleReview(req.id, 'rejected')}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleReview(req.id, 'approved')}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Calendar view coming soon</p>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Time Off</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Leave Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            {startDate && endDate && (
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-medium">{calculateDays()} business days</span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add a note..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
