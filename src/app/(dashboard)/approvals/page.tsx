'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as approvalsService from '@/services/approvals';
import type { ApprovalRequest } from '@/types/approvals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const entityIcons: Record<string, React.ReactNode> = {
  expense: <FileText className="h-5 w-5" />,
  leave_request: <Clock className="h-5 w-5" />,
  purchase_order: <FileText className="h-5 w-5" />,
};

export default function ApprovalsPage() {
  const { organizationId, user } = useAuth();
  const { toast } = useToast();
  const [allRequests, setAllRequests] = useState<ApprovalRequest[]>([]);
  const [myPending, setMyPending] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organizationId || !user?.id) return;
    setIsLoading(true);
    try {
      const [allData, pendingData] = await Promise.all([
        approvalsService.getApprovalRequests(organizationId),
        approvalsService.getMyPendingApprovals(organizationId, user.id),
      ]);
      setAllRequests(allData);
      setMyPending(pendingData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load approvals', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, user?.id, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (action: 'approved' | 'rejected') => {
    if (!selectedRequest || !user?.id) return;
    setIsSubmitting(true);
    try {
      await approvalsService.submitApproval(selectedRequest.id, user.id, {
        action,
        comments: comment || undefined,
      });
      toast({ title: action === 'approved' ? 'Approved' : 'Rejected' });
      setSelectedRequest(null);
      setComment('');
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const myRequests = allRequests.filter(r => r.requester_id === user?.id);
  const approvedRequests = allRequests.filter(r => r.status === 'approved');
  const rejectedRequests = allRequests.filter(r => r.status === 'rejected');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Approvals</h1>
          <p className="text-muted-foreground">Manage approval workflows</p>
        </div>
      </div>

      {/* Alert for pending */}
      {myPending.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-800">Pending Your Approval</div>
                <div className="text-sm text-yellow-700">{myPending.length} request(s) waiting for your decision</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-yellow-600">{myPending.length}</div>
            <div className="text-sm text-muted-foreground">Pending My Approval</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{myRequests.filter(r => r.status === 'pending').length}</div>
            <div className="text-sm text-muted-foreground">My Pending Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">{approvedRequests.length}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-red-600">{rejectedRequests.length}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending My Approval ({myPending.length})</TabsTrigger>
          <TabsTrigger value="my">My Requests</TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : myPending.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground"><CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No pending approvals</p></CardContent></Card>
          ) : (
            myPending.map(request => (
              <Card key={request.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        {entityIcons[request.entity_type] || <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{request.entity_type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">
                          Step {request.current_step} of {request.workflow?.steps?.length || 1}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[request.status]}>{request.status}</Badge>
                      <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)}>
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {myRequests.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No requests submitted</CardContent></Card>
          ) : (
            myRequests.map(request => (
              <Card key={request.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        {entityIcons[request.entity_type] || <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{request.entity_type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.workflow?.name || 'Direct approval'}
                        </div>
                      </div>
                    </div>
                    <Badge className={statusColors[request.status]}>{request.status}</Badge>
                  </div>
                  {/* Progress */}
                  {request.workflow && (
                    <div className="mt-4 flex items-center gap-2">
                      {request.workflow.steps?.map((step: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            idx + 1 < request.current_step ? 'bg-green-500 text-white' :
                            idx + 1 === request.current_step ? 'bg-yellow-500 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1 < request.current_step ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                          </div>
                          {idx < request.workflow.steps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {allRequests.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No approval requests</CardContent></Card>
          ) : (
            allRequests.slice(0, 20).map(request => (
              <Card key={request.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        {entityIcons[request.entity_type] || <FileText className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{request.entity_type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">{request.workflow?.name}</div>
                      </div>
                    </div>
                    <Badge className={statusColors[request.status]}>{request.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">Review {selectedRequest?.entity_type?.replace('_', ' ')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Request Details</div>
              <pre className="text-sm">{JSON.stringify(selectedRequest?.request_data, null, 2)}</pre>
            </div>
            <div>
              <label className="text-sm font-medium">Comments (optional)</label>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a note..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleAction('rejected')} disabled={isSubmitting}>
              <XCircle className="h-4 w-4 mr-1" /> Reject
            </Button>
            <Button onClick={() => handleAction('approved')} disabled={isSubmitting}>
              <CheckCircle className="h-4 w-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
