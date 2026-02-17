'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarView } from '@/components/calendar-view';
import {
  Wrench, AlertTriangle, Clock, CheckCircle, Plus, Calendar,
  Activity, Package, Settings, History, Play, Pause, Timer,
  RotateCcw, ArrowRight, Gauge
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Equipment {
  id: string;
  name: string;
  code: string;
  category: string;
  location: string;
  status: 'operational' | 'maintenance' | 'broken' | 'decommissioned';
  last_maintenance: string;
  next_maintenance: string;
  mtbf_hours?: number; // Mean Time Between Failures
  total_runtime_hours: number;
}

interface MaintenanceRequest {
  id: string;
  request_number: string;
  equipment_id: string;
  equipment_name: string;
  type: 'preventive' | 'corrective' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  assigned_to?: string;
  scheduled_date: string;
  completed_date?: string;
  downtime_hours?: number;
  parts_used?: { name: string; quantity: number; cost: number }[];
  labor_hours?: number;
  total_cost?: number;
  created_at: string;
}

interface MaintenanceSchedule {
  id: string;
  name: string;
  equipment_id: string;
  equipment_name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  last_run: string;
  next_run: string;
  tasks: string[];
  is_active: boolean;
}

const statusColors: Record<string, string> = {
  operational: 'bg-green-100 text-green-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  broken: 'bg-red-100 text-red-700',
  decommissioned: 'bg-gray-100 text-gray-700',
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700 animate-pulse',
};

const typeColors: Record<string, string> = {
  preventive: 'bg-green-100 text-green-700',
  corrective: 'bg-yellow-100 text-yellow-700',
  emergency: 'bg-red-100 text-red-700',
};

// Demo data
const demoEquipment: Equipment[] = [
  { id: 'e1', name: 'CNC Machine A1', code: 'CNC-001', category: 'Machining', location: 'Floor 1', status: 'operational', last_maintenance: '2026-01-15', next_maintenance: '2026-02-15', mtbf_hours: 2000, total_runtime_hours: 15420 },
  { id: 'e2', name: 'Conveyor Belt B1', code: 'CONV-001', category: 'Material Handling', location: 'Floor 1', status: 'operational', last_maintenance: '2026-02-01', next_maintenance: '2026-03-01', total_runtime_hours: 8760 },
  { id: 'e3', name: 'HVAC Unit C1', code: 'HVAC-001', category: 'Climate Control', location: 'Building A', status: 'maintenance', last_maintenance: '2025-12-01', next_maintenance: '2026-02-17', total_runtime_hours: 43800 },
  { id: 'e4', name: 'Compressor D1', code: 'COMP-001', category: 'Utilities', location: 'Utility Room', status: 'operational', last_maintenance: '2026-01-20', next_maintenance: '2026-04-20', mtbf_hours: 5000, total_runtime_hours: 21900 },
  { id: 'e5', name: 'Forklift F1', code: 'FORK-001', category: 'Material Handling', location: 'Warehouse', status: 'broken', last_maintenance: '2026-01-01', next_maintenance: '2026-02-01', total_runtime_hours: 3500 },
];

const demoRequests: MaintenanceRequest[] = [
  {
    id: 'r1',
    request_number: 'MR-2026-001',
    equipment_id: 'e3',
    equipment_name: 'HVAC Unit C1',
    type: 'preventive',
    priority: 'normal',
    status: 'in_progress',
    description: 'Quarterly filter replacement and system check',
    assigned_to: 'John Tech',
    scheduled_date: '2026-02-17',
    created_at: '2026-02-10',
  },
  {
    id: 'r2',
    request_number: 'MR-2026-002',
    equipment_id: 'e5',
    equipment_name: 'Forklift F1',
    type: 'corrective',
    priority: 'high',
    status: 'pending',
    description: 'Hydraulic system failure - leaking fluid',
    scheduled_date: '2026-02-17',
    created_at: '2026-02-16',
  },
  {
    id: 'r3',
    request_number: 'MR-2026-003',
    equipment_id: 'e1',
    equipment_name: 'CNC Machine A1',
    type: 'preventive',
    priority: 'normal',
    status: 'completed',
    description: 'Monthly calibration and lubrication',
    assigned_to: 'Sarah Tech',
    scheduled_date: '2026-02-15',
    completed_date: '2026-02-15',
    downtime_hours: 2,
    labor_hours: 2,
    total_cost: 250,
    created_at: '2026-02-01',
  },
];

const demoSchedules: MaintenanceSchedule[] = [
  { id: 's1', name: 'CNC Daily Check', equipment_id: 'e1', equipment_name: 'CNC Machine A1', frequency: 'daily', last_run: '2026-02-16', next_run: '2026-02-17', tasks: ['Check oil levels', 'Clean work area', 'Inspect belts'], is_active: true },
  { id: 's2', name: 'HVAC Quarterly Service', equipment_id: 'e3', equipment_name: 'HVAC Unit C1', frequency: 'quarterly', last_run: '2025-11-17', next_run: '2026-02-17', tasks: ['Replace filters', 'Check refrigerant', 'Clean coils', 'Test controls'], is_active: true },
  { id: 's3', name: 'Conveyor Weekly Inspection', equipment_id: 'e2', equipment_name: 'Conveyor Belt B1', frequency: 'weekly', last_run: '2026-02-10', next_run: '2026-02-17', tasks: ['Check belt tension', 'Inspect rollers', 'Lubricate bearings'], is_active: true },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

export default function MaintenancePage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('requests');
  const [equipment, setEquipment] = useState<Equipment[]>(demoEquipment);
  const [requests, setRequests] = useState<MaintenanceRequest[]>(demoRequests);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>(demoSchedules);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const stats = {
    totalEquipment: equipment.length,
    operational: equipment.filter(e => e.status === 'operational').length,
    needsMaintenance: equipment.filter(e => differenceInDays(new Date(e.next_maintenance), new Date()) <= 7).length,
    openRequests: requests.filter(r => ['pending', 'in_progress'].includes(r.status)).length,
    criticalRequests: requests.filter(r => r.priority === 'critical' && r.status !== 'completed').length,
  };

  const startRequest = (id: string) => {
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'in_progress' } : r
    ));
    toast({ title: 'Maintenance started' });
  };

  const completeRequest = (id: string) => {
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'completed', completed_date: new Date().toISOString() } : r
    ));
    toast({ title: 'Maintenance completed' });
  };

  const calendarEvents = [
    ...requests.filter(r => r.status !== 'completed').map(r => ({
      id: r.id,
      title: `${r.request_number} - ${r.equipment_name}`,
      start: new Date(r.scheduled_date),
      color: r.priority === 'critical' ? 'bg-red-500' : 
             r.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500',
    })),
    ...schedules.filter(s => s.is_active).map(s => ({
      id: s.id,
      title: `📅 ${s.name}`,
      start: new Date(s.next_run),
      color: 'bg-green-500',
    })),
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Maintenance
          </h1>
          <p className="text-muted-foreground">Equipment management and maintenance scheduling</p>
        </div>
        <Button onClick={() => setShowNewRequest(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Equipment</div>
                <div className="text-2xl font-bold">{stats.totalEquipment}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Operational</div>
                <div className="text-2xl font-bold text-green-600">{stats.operational}/{stats.totalEquipment}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.needsMaintenance > 0 ? 'border-yellow-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Due Soon</div>
                <div className={cn('text-2xl font-bold', stats.needsMaintenance > 0 && 'text-yellow-600')}>
                  {stats.needsMaintenance}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Open Requests</div>
                <div className="text-2xl font-bold">{stats.openRequests}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.criticalRequests > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Critical</div>
                <div className={cn('text-2xl font-bold', stats.criticalRequests > 0 && 'text-red-600')}>
                  {stats.criticalRequests}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="requests">Maintenance Requests</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="schedules">Preventive Schedules</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        {/* Requests */}
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono">{req.request_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{req.equipment_name}</div>
                        <div className="text-sm text-muted-foreground">{req.description.slice(0, 50)}...</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[req.type]}>{req.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[req.priority]}>{req.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[req.status]}>{req.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(req.scheduled_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {req.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => startRequest(req.id)}>
                            <Play className="h-4 w-4 mr-1" /> Start
                          </Button>
                        )}
                        {req.status === 'in_progress' && (
                          <Button size="sm" onClick={() => completeRequest(req.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Equipment */}
        <TabsContent value="equipment">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipment.map(eq => {
              const daysUntilMaint = differenceInDays(new Date(eq.next_maintenance), new Date());
              const maintUrgent = daysUntilMaint <= 7 && daysUntilMaint >= 0;
              const maintOverdue = daysUntilMaint < 0;
              
              return (
                <Card key={eq.id} className={cn(
                  'hover:shadow-md transition-shadow cursor-pointer',
                  maintOverdue && 'border-red-300',
                  maintUrgent && !maintOverdue && 'border-yellow-300'
                )} onClick={() => setSelectedEquipment(eq)}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          eq.status === 'operational' ? 'bg-green-100' :
                          eq.status === 'maintenance' ? 'bg-yellow-100' :
                          eq.status === 'broken' ? 'bg-red-100' : 'bg-gray-100'
                        )}>
                          <Settings className={cn(
                            'h-5 w-5',
                            eq.status === 'operational' ? 'text-green-600' :
                            eq.status === 'maintenance' ? 'text-yellow-600' :
                            eq.status === 'broken' ? 'text-red-600' : 'text-gray-600'
                          )} />
                        </div>
                        <div>
                          <div className="font-medium">{eq.name}</div>
                          <div className="text-sm text-muted-foreground">{eq.code}</div>
                        </div>
                      </div>
                      <Badge className={statusColors[eq.status]}>{eq.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <div className="font-medium">{eq.category}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <div className="font-medium">{eq.location}</div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Next Maintenance:</span>
                        <span className={cn(
                          'font-medium',
                          maintOverdue && 'text-red-600',
                          maintUrgent && !maintOverdue && 'text-yellow-600'
                        )}>
                          {maintOverdue ? `${Math.abs(daysUntilMaint)} days overdue` :
                           maintUrgent ? `${daysUntilMaint} days` :
                           format(new Date(eq.next_maintenance), 'MMM d')}
                        </span>
                      </div>
                      {eq.total_runtime_hours && (
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Gauge className="h-3 w-3" /> Runtime:
                          </span>
                          <span className="font-medium">{eq.total_runtime_hours.toLocaleString()} hrs</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Preventive Schedules */}
        <TabsContent value="schedules">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule Name</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(sched => (
                  <TableRow key={sched.id}>
                    <TableCell className="font-medium">{sched.name}</TableCell>
                    <TableCell>{sched.equipment_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{sched.frequency}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(sched.last_run), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <span className={cn(
                        differenceInDays(new Date(sched.next_run), new Date()) <= 1 && 'text-yellow-600 font-medium'
                      )}>
                        {format(new Date(sched.next_run), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {sched.tasks.slice(0, 2).map((task, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{task}</Badge>
                        ))}
                        {sched.tasks.length > 2 && (
                          <Badge variant="outline" className="text-xs">+{sched.tasks.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={sched.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {sched.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar">
          <CalendarView events={calendarEvents} />
        </TabsContent>
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Equipment</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment..." />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.name} ({eq.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select defaultValue="corrective">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select defaultValue="normal">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the maintenance issue or task..." />
            </div>
            <div className="space-y-2">
              <Label>Scheduled Date</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
            <Button>Create Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
