'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as maintenanceService from '@/services/maintenance';
import type { Equipment, MaintenanceRequest } from '@/types/maintenance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Wrench, AlertTriangle, CheckCircle, Clock, Settings, Search } from 'lucide-react';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  operational: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  repair: 'bg-red-100 text-red-700',
  retired: 'bg-gray-100 text-gray-700',
};

const requestStatusColors: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function MaintenancePage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [dueSoon, setDueSoon] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equipment');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewEquipment, setShowNewEquipment] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);

  // Equipment form
  const [equipName, setEquipName] = useState('');
  const [equipCode, setEquipCode] = useState('');
  const [equipCategory, setEquipCategory] = useState('');
  const [equipManufacturer, setEquipManufacturer] = useState('');

  // Request form
  const [reqEquipmentId, setReqEquipmentId] = useState('');
  const [reqType, setReqType] = useState<'preventive' | 'corrective' | 'emergency'>('corrective');
  const [reqDescription, setReqDescription] = useState('');
  const [reqPriority, setReqPriority] = useState('medium');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [equipData, reqData, dueData] = await Promise.all([
        maintenanceService.getEquipment(organizationId, { search: searchQuery }),
        maintenanceService.getMaintenanceRequests(organizationId),
        maintenanceService.getEquipmentDueForMaintenance(organizationId),
      ]);
      setEquipment(equipData);
      setRequests(reqData);
      setDueSoon(dueData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, searchQuery, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateEquipment = async () => {
    if (!organizationId || !equipName) return;
    setIsSubmitting(true);
    try {
      await maintenanceService.createEquipment(organizationId, {
        name: equipName,
        code: equipCode || undefined,
        category: equipCategory || undefined,
        manufacturer: equipManufacturer || undefined,
      });
      toast({ title: 'Equipment Added' });
      setShowNewEquipment(false);
      setEquipName(''); setEquipCode(''); setEquipCategory(''); setEquipManufacturer('');
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!organizationId || !reqEquipmentId || !reqDescription) return;
    setIsSubmitting(true);
    try {
      await maintenanceService.createMaintenanceRequest(organizationId, {
        equipment_id: reqEquipmentId,
        maintenance_type: reqType,
        description: reqDescription,
        priority: reqPriority as any,
      });
      toast({ title: 'Request Created' });
      setShowNewRequest(false);
      setReqEquipmentId(''); setReqDescription(''); setReqType('corrective'); setReqPriority('medium');
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (requestId: string) => {
    try {
      await maintenanceService.completeMaintenanceRequest(requestId);
      toast({ title: 'Marked Complete' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">Equipment and maintenance management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewEquipment(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Equipment
          </Button>
          <Button onClick={() => setShowNewRequest(true)}>
            <Wrench className="h-4 w-4 mr-2" /> New Request
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {dueSoon.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">Maintenance Due Soon</div>
                <div className="text-sm text-orange-700">{dueSoon.length} equipment items due for maintenance this week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="equipment">Equipment ({equipment.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment">
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search equipment..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Maintenance</TableHead>
                  <TableHead>Next Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" /></TableCell></TableRow>
                ) : equipment.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />No equipment</TableCell></TableRow>
                ) : (
                  equipment.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.code || '-'}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell><Badge className={statusColors[item.status]}>{item.status}</Badge></TableCell>
                      <TableCell>{item.last_maintenance_date ? format(new Date(item.last_maintenance_date), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>{item.next_maintenance_date ? format(new Date(item.next_maintenance_date), 'MMM d, yyyy') : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No maintenance requests</TableCell></TableRow>
                ) : (
                  requests.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm">{req.request_number}</TableCell>
                      <TableCell>{req.equipment?.name}</TableCell>
                      <TableCell className="capitalize">{req.maintenance_type}</TableCell>
                      <TableCell><Badge className={priorityColors[req.priority]}>{req.priority}</Badge></TableCell>
                      <TableCell><Badge className={requestStatusColors[req.status]}>{req.status}</Badge></TableCell>
                      <TableCell>{req.scheduled_date ? format(new Date(req.scheduled_date), 'MMM d') : '-'}</TableCell>
                      <TableCell>
                        {req.status !== 'completed' && req.status !== 'cancelled' && (
                          <Button size="sm" variant="outline" onClick={() => handleComplete(req.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Equipment Dialog */}
      <Dialog open={showNewEquipment} onOpenChange={setShowNewEquipment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Name *</label><Input value={equipName} onChange={(e) => setEquipName(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Code</label><Input value={equipCode} onChange={(e) => setEquipCode(e.target.value)} placeholder="Asset code" /></div>
            <div><label className="text-sm font-medium">Category</label><Input value={equipCategory} onChange={(e) => setEquipCategory(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Manufacturer</label><Input value={equipManufacturer} onChange={(e) => setEquipManufacturer(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewEquipment(false)}>Cancel</Button>
            <Button onClick={handleCreateEquipment} disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Equipment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Equipment *</label>
              <Select value={reqEquipmentId} onValueChange={setReqEquipmentId}>
                <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                <SelectContent>
                  {equipment.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={reqType} onValueChange={(v: any) => setReqType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select value={reqPriority} onValueChange={setReqPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Description *</label><Textarea value={reqDescription} onChange={(e) => setReqDescription(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
            <Button onClick={handleCreateRequest} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Request'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
