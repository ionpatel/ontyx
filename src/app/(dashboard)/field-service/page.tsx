'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarView } from '@/components/calendar-view';
import {
  MapPin, Truck, User, Clock, Phone, CheckCircle, AlertCircle,
  Plus, Navigation, Calendar, Wrench, Camera, FileText, DollarSign
} from 'lucide-react';
import { format, addHours, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Technician {
  id: string;
  name: string;
  phone: string;
  skills: string[];
  status: 'available' | 'on_job' | 'break' | 'offline';
  current_location?: { lat: number; lng: number };
  active_jobs: number;
}

interface WorkOrder {
  id: string;
  wo_number: string;
  title: string;
  description: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration: number; // minutes
  technician_id?: string;
  technician_name?: string;
  status: 'unassigned' | 'assigned' | 'en_route' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'emergency';
  type: 'installation' | 'repair' | 'maintenance' | 'inspection';
  parts_used?: { name: string; quantity: number; price: number }[];
  labor_hours?: number;
  total_cost?: number;
  notes?: string;
  photos?: string[];
  signature?: string;
  completed_at?: string;
}

const statusColors: Record<string, string> = {
  unassigned: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  en_route: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const techStatusColors: Record<string, string> = {
  available: 'bg-green-500',
  on_job: 'bg-yellow-500',
  break: 'bg-blue-500',
  offline: 'bg-gray-400',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700',
};

// Demo data
const demoTechnicians: Technician[] = [
  { id: 't1', name: 'John Smith', phone: '416-555-0101', skills: ['HVAC', 'Plumbing'], status: 'available', active_jobs: 0 },
  { id: 't2', name: 'Sarah Johnson', phone: '416-555-0102', skills: ['Electrical', 'Installation'], status: 'on_job', active_jobs: 2 },
  { id: 't3', name: 'Mike Williams', phone: '416-555-0103', skills: ['HVAC', 'Maintenance'], status: 'available', active_jobs: 1 },
  { id: 't4', name: 'Emily Brown', phone: '416-555-0104', skills: ['Plumbing', 'Inspection'], status: 'break', active_jobs: 0 },
];

const demoWorkOrders: WorkOrder[] = [
  {
    id: 'wo1',
    wo_number: 'WO-2026-001',
    title: 'AC Unit Installation',
    description: 'Install new central AC unit in residential property',
    customer_name: 'Robert Chen',
    customer_phone: '416-555-1001',
    address: '123 Maple Street, Toronto, ON M5V 1A1',
    scheduled_date: '2026-02-17',
    scheduled_time: '09:00',
    estimated_duration: 180,
    technician_id: 't2',
    technician_name: 'Sarah Johnson',
    status: 'in_progress',
    priority: 'high',
    type: 'installation',
  },
  {
    id: 'wo2',
    wo_number: 'WO-2026-002',
    title: 'Furnace Repair',
    description: 'Furnace not heating properly, customer reports strange noise',
    customer_name: 'Lisa Park',
    customer_phone: '416-555-1002',
    address: '456 Oak Avenue, Toronto, ON M5V 2B2',
    scheduled_date: '2026-02-17',
    scheduled_time: '14:00',
    estimated_duration: 90,
    status: 'unassigned',
    priority: 'emergency',
    type: 'repair',
  },
  {
    id: 'wo3',
    wo_number: 'WO-2026-003',
    title: 'Annual HVAC Maintenance',
    description: 'Routine maintenance check for commercial HVAC system',
    customer_name: 'ABC Corp',
    customer_phone: '416-555-1003',
    address: '789 Business Park, Toronto, ON M5V 3C3',
    scheduled_date: '2026-02-18',
    scheduled_time: '10:00',
    estimated_duration: 120,
    technician_id: 't1',
    technician_name: 'John Smith',
    status: 'assigned',
    priority: 'normal',
    type: 'maintenance',
  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

export default function FieldServicePage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dispatch');
  const [technicians, setTechnicians] = useState<Technician[]>(demoTechnicians);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(demoWorkOrders);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);

  const stats = {
    todayOrders: workOrders.filter(wo => wo.scheduled_date === '2026-02-17').length,
    unassigned: workOrders.filter(wo => wo.status === 'unassigned').length,
    inProgress: workOrders.filter(wo => wo.status === 'in_progress').length,
    completed: workOrders.filter(wo => wo.status === 'completed').length,
    availableTechs: technicians.filter(t => t.status === 'available').length,
  };

  const assignTechnician = (orderId: string, techId: string) => {
    const tech = technicians.find(t => t.id === techId);
    setWorkOrders(workOrders.map(wo =>
      wo.id === orderId
        ? { ...wo, technician_id: techId, technician_name: tech?.name, status: 'assigned' }
        : wo
    ));
    setShowAssign(false);
    toast({ title: 'Technician assigned', description: `${tech?.name} assigned to work order` });
  };

  const updateOrderStatus = (orderId: string, status: WorkOrder['status']) => {
    setWorkOrders(workOrders.map(wo =>
      wo.id === orderId
        ? { ...wo, status, completed_at: status === 'completed' ? new Date().toISOString() : wo.completed_at }
        : wo
    ));
    toast({ title: 'Status updated' });
  };

  const calendarEvents = workOrders.map(wo => ({
    id: wo.id,
    title: `${wo.wo_number} - ${wo.title}`,
    start: new Date(`${wo.scheduled_date}T${wo.scheduled_time}`),
    type: wo.type,
    color: wo.priority === 'emergency' ? 'bg-red-500' : 
           wo.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500',
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Field Service
          </h1>
          <p className="text-muted-foreground">Dispatch technicians and manage work orders</p>
        </div>
        <Button onClick={() => setShowNewOrder(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Work Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Today</div>
                <div className="text-2xl font-bold">{stats.todayOrders}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.unassigned > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unassigned</div>
                <div className={cn('text-2xl font-bold', stats.unassigned > 0 && 'text-red-600')}>{stats.unassigned}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Wrench className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">In Progress</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
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
                <div className="text-sm text-muted-foreground">Completed</div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available</div>
                <div className="text-2xl font-bold">{stats.availableTechs}/{technicians.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dispatch">Dispatch Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
        </TabsList>

        {/* Dispatch Board */}
        <TabsContent value="dispatch" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Unassigned */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Unassigned
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workOrders.filter(wo => wo.status === 'unassigned').map(wo => (
                  <div key={wo.id} className="p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedOrder(wo); setShowAssign(true); }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{wo.wo_number}</span>
                      <Badge className={priorityColors[wo.priority]}>{wo.priority}</Badge>
                    </div>
                    <div className="font-medium text-sm">{wo.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {wo.address.split(',')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {wo.scheduled_time} • {wo.estimated_duration} min
                    </div>
                  </div>
                ))}
                {workOrders.filter(wo => wo.status === 'unassigned').length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No unassigned orders
                  </div>
                )}
              </CardContent>
            </Card>

            {/* In Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-yellow-500" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workOrders.filter(wo => ['assigned', 'en_route', 'in_progress'].includes(wo.status)).map(wo => (
                  <div key={wo.id} className="p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOrder(wo)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{wo.wo_number}</span>
                      <Badge className={statusColors[wo.status]}>{wo.status.replace('_', ' ')}</Badge>
                    </div>
                    <div className="font-medium text-sm">{wo.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {wo.technician_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {wo.address.split(',')[0]}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Completed Today */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Completed Today
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {workOrders.filter(wo => wo.status === 'completed').map(wo => (
                  <div key={wo.id} className="p-3 rounded-lg border bg-green-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm">{wo.wo_number}</span>
                      <Badge className="bg-green-100 text-green-700">completed</Badge>
                    </div>
                    <div className="font-medium text-sm">{wo.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {wo.technician_name}
                    </div>
                  </div>
                ))}
                {workOrders.filter(wo => wo.status === 'completed').length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No completed orders yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar">
          <CalendarView
            events={calendarEvents}
            onEventClick={(event) => {
              const wo = workOrders.find(w => w.id === event.id);
              if (wo) setSelectedOrder(wo);
            }}
          />
        </TabsContent>

        {/* Technicians */}
        <TabsContent value="technicians">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {technicians.map(tech => (
              <Card key={tech.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{tech.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white',
                        techStatusColors[tech.status]
                      )} />
                    </div>
                    <div>
                      <div className="font-medium">{tech.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {tech.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tech.skills.map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Jobs:</span>
                    <span className="font-medium">{tech.active_jobs}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign Technician Dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="font-medium">{selectedOrder.title}</div>
                <div className="text-sm text-muted-foreground">{selectedOrder.address}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedOrder.scheduled_date} at {selectedOrder.scheduled_time}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select Technician</Label>
                {technicians.filter(t => t.status === 'available').map(tech => (
                  <button
                    key={tech.id}
                    onClick={() => assignTechnician(selectedOrder.id, tech.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <Avatar>
                      <AvatarFallback>{tech.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1">
                      <div className="font-medium">{tech.name}</div>
                      <div className="text-sm text-muted-foreground">{tech.skills.join(', ')}</div>
                    </div>
                    <Badge variant="outline" className="bg-green-50">Available</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Work Order Detail Dialog */}
      <Dialog open={!!selectedOrder && !showAssign} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOrder?.wo_number}
              <Badge className={statusColors[selectedOrder?.status || 'unassigned']}>
                {selectedOrder?.status.replace('_', ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-lg">{selectedOrder.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedOrder.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <div className="font-medium">{selectedOrder.customer_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <div className="font-medium">{selectedOrder.customer_phone}</div>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Address:</span>
                <div className="font-medium">{selectedOrder.address}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Scheduled:</span>
                  <div className="font-medium">{selectedOrder.scheduled_date} {selectedOrder.scheduled_time}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <div className="font-medium">{selectedOrder.estimated_duration} min</div>
                </div>
              </div>
              {selectedOrder.technician_name && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Technician:</span>
                  <div className="font-medium">{selectedOrder.technician_name}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            {selectedOrder?.status === 'assigned' && (
              <Button onClick={() => updateOrderStatus(selectedOrder.id, 'en_route')}>
                <Navigation className="h-4 w-4 mr-2" /> Start Route
              </Button>
            )}
            {selectedOrder?.status === 'en_route' && (
              <Button onClick={() => updateOrderStatus(selectedOrder.id, 'in_progress')}>
                <Wrench className="h-4 w-4 mr-2" /> Start Work
              </Button>
            )}
            {selectedOrder?.status === 'in_progress' && (
              <Button onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}>
                <CheckCircle className="h-4 w-4 mr-2" /> Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
