'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as qualityService from '@/services/quality';
import type { QualityCheck } from '@/types/quality';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, CheckCircle, XCircle, AlertCircle, ClipboardCheck, TrendingUp, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  passed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  conditional: 'bg-yellow-100 text-yellow-700',
};

const typeColors: Record<string, string> = {
  incoming: 'bg-purple-100 text-purple-700',
  in_process: 'bg-blue-100 text-blue-700',
  final: 'bg-green-100 text-green-700',
  random: 'bg-gray-100 text-gray-700',
};

export default function QualityPage() {
  const { organizationId, user } = useAuth();
  const { toast } = useToast();
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0, pending: 0, pass_rate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCheck, setEditingCheck] = useState<QualityCheck | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [checkType, setCheckType] = useState<string>('incoming');
  const [status, setStatus] = useState<string>('pending');
  const [itemName, setItemName] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCheckType('incoming');
    setStatus('pending');
    setItemName('');
    setBatchNumber('');
    setNotes('');
    setEditingCheck(null);
  };

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [checksData, statsData] = await Promise.all([
        qualityService.getQualityChecks(organizationId),
        qualityService.getQualityStats(organizationId),
      ]);
      setChecks(checksData);
      setStats(statsData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    if (!organizationId) return;
    setIsSubmitting(true);
    try {
      const data = {
        check_type: checkType as any,
        status: status as any,
        notes,
        inspection_date: new Date().toISOString(),
        inspector_id: user?.id,
      };
      
      if (editingCheck) {
        await qualityService.updateQualityCheck(editingCheck.id, data);
        toast({ title: 'Updated', description: 'Quality check updated' });
      } else {
        await qualityService.createQualityCheck(organizationId, data);
        toast({ title: 'Created', description: 'Quality check created' });
      }
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (check: QualityCheck) => {
    setEditingCheck(check);
    setCheckType(check.check_type);
    setStatus(check.status);
    setNotes(check.notes || '');
    setShowDialog(true);
  };

  const handleDelete = async (check: QualityCheck) => {
    if (!confirm('Delete this quality check?')) return;
    try {
      await qualityService.deleteQualityCheck(check.id);
      toast({ title: 'Deleted' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quality Control</h1>
          <p className="text-muted-foreground">Manage quality checks and inspections</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> New QC Check
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><ClipboardCheck className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Total Checks</div>
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
                <div className="text-sm text-muted-foreground">Passed</div>
                <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100"><XCircle className="h-5 w-5 text-red-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100"><AlertCircle className="h-5 w-5 text-yellow-600" /></div>
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
              <div className="p-2 rounded-lg bg-purple-100"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Pass Rate</div>
                <div className="text-2xl font-bold">{stats.pass_rate.toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Checks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Checks</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Check #</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" /></TableCell></TableRow>
            ) : checks.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No quality checks
              </TableCell></TableRow>
            ) : (
              checks.map(check => (
                <TableRow key={check.id}>
                  <TableCell className="font-mono text-sm">{check.check_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{check.product?.name || check.equipment?.name || '-'}</div>
                    {check.product?.sku && <div className="text-sm text-muted-foreground">{check.product.sku}</div>}
                  </TableCell>
                  <TableCell><Badge className={typeColors[check.check_type]}>{check.check_type.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{check.inspector ? `${check.inspector.first_name} ${check.inspector.last_name}` : '-'}</TableCell>
                  <TableCell>{check.inspection_date ? format(new Date(check.inspection_date), 'MMM d, yyyy') : '-'}</TableCell>
                  <TableCell><Badge className={statusColors[check.status]}>{check.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(check)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(check)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCheck ? 'Edit Quality Check' : 'New Quality Check'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check Type</Label>
                <Select value={checkType} onValueChange={setCheckType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="in_process">In Process</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="conditional">Conditional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Inspection notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingCheck ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
