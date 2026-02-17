'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Car, Wrench, FileText, DollarSign, Plus, Search, Clock,
  User, Phone, Mail, Calendar, CheckCircle, AlertTriangle,
  Package, Printer, Send, History, Settings, Gauge
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string;
  customer_id: string;
  customer_name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate: string;
  color: string;
  mileage: number;
  last_service?: string;
  notes?: string;
}

interface WorkOrder {
  id: string;
  wo_number: string;
  vehicle_id: string;
  vehicle_info: string;
  customer_name: string;
  customer_phone: string;
  status: 'estimate' | 'approved' | 'in_progress' | 'completed' | 'invoiced' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  services: { name: string; labor_hours: number; labor_rate: number; parts: { name: string; qty: number; price: number }[] }[];
  technician_id?: string;
  technician_name?: string;
  created_at: string;
  promised_date?: string;
  completed_at?: string;
  labor_total: number;
  parts_total: number;
  tax: number;
  total: number;
  notes?: string;
}

interface Part {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  quantity: number;
  cost: number;
  retail_price: number;
  location: string;
  compatible_vehicles?: string[];
}

const statusColors: Record<string, string> = {
  estimate: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  invoiced: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

// Demo data
const demoVehicles: Vehicle[] = [
  { id: 'v1', customer_id: 'c1', customer_name: 'John Smith', make: 'Toyota', model: 'Camry', year: 2021, vin: '4T1BF1FK5CU123456', license_plate: 'ABCD 123', color: 'Silver', mileage: 45230, last_service: '2025-11-15', notes: 'Regular customer' },
  { id: 'v2', customer_id: 'c1', customer_name: 'John Smith', make: 'Honda', model: 'CR-V', year: 2019, vin: '2HKRW2H59KH654321', license_plate: 'EFGH 456', color: 'Black', mileage: 78500, last_service: '2026-01-20' },
  { id: 'v3', customer_id: 'c2', customer_name: 'Sarah Johnson', make: 'Ford', model: 'F-150', year: 2022, vin: '1FTEW1EP0NFA98765', license_plate: 'IJKL 789', color: 'White', mileage: 32100, last_service: '2026-02-01' },
  { id: 'v4', customer_id: 'c3', customer_name: 'Mike Williams', make: 'BMW', model: '330i', year: 2020, vin: 'WBA5R1C54LAP11111', license_plate: 'MNOP 012', color: 'Blue', mileage: 52800 },
];

const demoWorkOrders: WorkOrder[] = [
  {
    id: 'wo1',
    wo_number: 'WO-2026-0142',
    vehicle_id: 'v1',
    vehicle_info: '2021 Toyota Camry (ABCD 123)',
    customer_name: 'John Smith',
    customer_phone: '416-555-0101',
    status: 'in_progress',
    priority: 'normal',
    services: [
      { name: 'Oil Change', labor_hours: 0.5, labor_rate: 95, parts: [{ name: 'Synthetic Oil 5W-30 (5L)', qty: 1, price: 45 }, { name: 'Oil Filter', qty: 1, price: 15 }] },
      { name: 'Tire Rotation', labor_hours: 0.5, labor_rate: 95, parts: [] },
    ],
    technician_id: 't1',
    technician_name: 'Alex Tech',
    created_at: '2026-02-17T09:00:00',
    promised_date: '2026-02-17',
    labor_total: 95,
    parts_total: 60,
    tax: 20.15,
    total: 175.15,
  },
  {
    id: 'wo2',
    wo_number: 'WO-2026-0143',
    vehicle_id: 'v3',
    vehicle_info: '2022 Ford F-150 (IJKL 789)',
    customer_name: 'Sarah Johnson',
    customer_phone: '416-555-0102',
    status: 'estimate',
    priority: 'high',
    services: [
      { name: 'Brake Pad Replacement (Front)', labor_hours: 1.5, labor_rate: 95, parts: [{ name: 'Ceramic Brake Pads (Front)', qty: 1, price: 89 }, { name: 'Brake Rotors (Front Pair)', qty: 1, price: 165 }] },
      { name: 'Brake Fluid Flush', labor_hours: 0.5, labor_rate: 95, parts: [{ name: 'DOT 4 Brake Fluid', qty: 1, price: 25 }] },
    ],
    created_at: '2026-02-17T10:30:00',
    labor_total: 190,
    parts_total: 279,
    tax: 60.97,
    total: 529.97,
    notes: 'Customer reported squeaking noise when braking',
  },
  {
    id: 'wo3',
    wo_number: 'WO-2026-0141',
    vehicle_id: 'v2',
    vehicle_info: '2019 Honda CR-V (EFGH 456)',
    customer_name: 'John Smith',
    customer_phone: '416-555-0101',
    status: 'completed',
    priority: 'normal',
    services: [
      { name: 'A/C Recharge', labor_hours: 1, labor_rate: 95, parts: [{ name: 'R-134a Refrigerant', qty: 2, price: 35 }] },
    ],
    technician_id: 't2',
    technician_name: 'Maria Mechanic',
    created_at: '2026-02-16T14:00:00',
    promised_date: '2026-02-16',
    completed_at: '2026-02-16T16:30:00',
    labor_total: 95,
    parts_total: 70,
    tax: 21.45,
    total: 186.45,
  },
];

const demoParts: Part[] = [
  { id: 'p1', sku: 'OIL-5W30-5L', name: 'Synthetic Oil 5W-30 (5L)', category: 'Fluids', brand: 'Mobil 1', quantity: 24, cost: 28, retail_price: 45, location: 'A1-01' },
  { id: 'p2', sku: 'FLT-OIL-TOY', name: 'Oil Filter - Toyota', category: 'Filters', brand: 'OEM', quantity: 15, cost: 8, retail_price: 15, location: 'B2-03', compatible_vehicles: ['Toyota'] },
  { id: 'p3', sku: 'BRK-PAD-FRD-F', name: 'Ceramic Brake Pads (Front) - Ford', category: 'Brakes', brand: 'Wagner', quantity: 6, cost: 55, retail_price: 89, location: 'C1-02', compatible_vehicles: ['Ford F-150'] },
  { id: 'p4', sku: 'BRK-ROT-FRD-F', name: 'Brake Rotors (Front Pair) - Ford', category: 'Brakes', brand: 'ACDelco', quantity: 4, cost: 95, retail_price: 165, location: 'C1-05', compatible_vehicles: ['Ford F-150'] },
  { id: 'p5', sku: 'FLD-BRK-DOT4', name: 'DOT 4 Brake Fluid', category: 'Fluids', brand: 'Prestone', quantity: 20, cost: 12, retail_price: 25, location: 'A2-01' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

export default function AutoShopPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('work-orders');
  const [vehicles, setVehicles] = useState<Vehicle[]>(demoVehicles);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(demoWorkOrders);
  const [parts, setParts] = useState<Part[]>(demoParts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showNewWorkOrder, setShowNewWorkOrder] = useState(false);

  // Stats
  const stats = {
    activeOrders: workOrders.filter(wo => ['approved', 'in_progress'].includes(wo.status)).length,
    pendingEstimates: workOrders.filter(wo => wo.status === 'estimate').length,
    completedToday: workOrders.filter(wo => wo.status === 'completed' && wo.completed_at?.startsWith('2026-02-17')).length,
    totalVehicles: vehicles.length,
    todayRevenue: workOrders.filter(wo => wo.status === 'completed' || wo.status === 'invoiced').reduce((sum, wo) => sum + wo.total, 0),
  };

  const approveEstimate = (id: string) => {
    setWorkOrders(workOrders.map(wo =>
      wo.id === id ? { ...wo, status: 'approved' } : wo
    ));
    toast({ title: 'Estimate approved', description: 'Work order is ready to start' });
  };

  const startWork = (id: string) => {
    setWorkOrders(workOrders.map(wo =>
      wo.id === id ? { ...wo, status: 'in_progress' } : wo
    ));
    toast({ title: 'Work started' });
  };

  const completeWork = (id: string) => {
    setWorkOrders(workOrders.map(wo =>
      wo.id === id ? { ...wo, status: 'completed', completed_at: new Date().toISOString() } : wo
    ));
    toast({ title: 'Work completed' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6" />
            Auto Shop
          </h1>
          <p className="text-muted-foreground">Work orders, vehicle management, and parts inventory</p>
        </div>
        <Button onClick={() => setShowNewWorkOrder(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Work Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Wrench className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">In Progress</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.activeOrders}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.pendingEstimates > 0 ? 'border-blue-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pending Estimates</div>
                <div className={cn('text-2xl font-bold', stats.pendingEstimates > 0 && 'text-blue-600')}>
                  {stats.pendingEstimates}
                </div>
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
                <div className="text-sm text-muted-foreground">Completed Today</div>
                <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Car className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Vehicles</div>
                <div className="text-2xl font-bold">{stats.totalVehicles}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Today's Revenue</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="parts">Parts Inventory</TabsTrigger>
        </TabsList>

        {/* Work Orders */}
        <TabsContent value="work-orders">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>WO #</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map(wo => (
                  <TableRow key={wo.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedWorkOrder(wo)}>
                    <TableCell className="font-mono font-medium">{wo.wo_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {wo.vehicle_info}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{wo.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{wo.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {wo.services.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[wo.priority]}>{wo.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[wo.status]}>{wo.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(wo.total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {wo.status === 'estimate' && (
                          <Button size="sm" onClick={() => approveEstimate(wo.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        )}
                        {wo.status === 'approved' && (
                          <Button size="sm" variant="outline" onClick={() => startWork(wo.id)}>
                            <Wrench className="h-4 w-4 mr-1" /> Start
                          </Button>
                        )}
                        {wo.status === 'in_progress' && (
                          <Button size="sm" onClick={() => completeWork(wo.id)}>
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

        {/* Vehicles */}
        <TabsContent value="vehicles">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(vehicle => (
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <Car className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                      <div className="text-sm text-muted-foreground">{vehicle.license_plate} • {vehicle.color}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {vehicle.customer_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      {vehicle.mileage.toLocaleString()} km
                    </div>
                  </div>
                  {vehicle.last_service && (
                    <div className="pt-3 border-t text-sm text-muted-foreground flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Last service: {format(new Date(vehicle.last_service), 'MMM d, yyyy')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed flex items-center justify-center min-h-[200px] cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Add Vehicle</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Parts */}
        <TabsContent value="parts">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Retail</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.filter(p => 
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.sku.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(part => (
                  <TableRow key={part.id}>
                    <TableCell className="font-mono">{part.sku}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{part.name}</div>
                        {part.compatible_vehicles && (
                          <div className="text-xs text-muted-foreground">
                            Fits: {part.compatible_vehicles.join(', ')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{part.category}</TableCell>
                    <TableCell>{part.brand}</TableCell>
                    <TableCell className={cn('text-right font-medium', part.quantity <= 5 && 'text-red-600')}>
                      {part.quantity}
                      {part.quantity <= 5 && <AlertTriangle className="inline h-4 w-4 ml-1" />}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(part.cost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(part.retail_price)}</TableCell>
                    <TableCell className="font-mono text-sm">{part.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Work Order Detail Dialog */}
      <Dialog open={!!selectedWorkOrder} onOpenChange={() => setSelectedWorkOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedWorkOrder?.wo_number}
              <Badge className={statusColors[selectedWorkOrder?.status || 'estimate']}>
                {selectedWorkOrder?.status.replace('_', ' ')}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedWorkOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Vehicle</div>
                  <div className="font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" /> {selectedWorkOrder.vehicle_info}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Customer</div>
                  <div className="font-medium">{selectedWorkOrder.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{selectedWorkOrder.customer_phone}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Services & Parts</h4>
                <div className="space-y-3">
                  {selectedWorkOrder.services.map((service, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{service.name}</span>
                        <span className="font-medium">{formatCurrency(service.labor_hours * service.labor_rate)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Labor: {service.labor_hours} hrs @ {formatCurrency(service.labor_rate)}/hr
                      </div>
                      {service.parts.length > 0 && (
                        <div className="space-y-1">
                          {service.parts.map((part, j) => (
                            <div key={j} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                <Package className="h-3 w-3 inline mr-1" />
                                {part.name} × {part.qty}
                              </span>
                              <span>{formatCurrency(part.price * part.qty)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Labor</span>
                    <span>{formatCurrency(selectedWorkOrder.labor_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parts</span>
                    <span>{formatCurrency(selectedWorkOrder.parts_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HST (13%)</span>
                    <span>{formatCurrency(selectedWorkOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>{formatCurrency(selectedWorkOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedWorkOrder.notes && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm">
                  <strong>Notes:</strong> {selectedWorkOrder.notes}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedWorkOrder(null)}>Close</Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            {selectedWorkOrder?.status === 'estimate' && (
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" /> Send to Customer
              </Button>
            )}
            {selectedWorkOrder?.status === 'completed' && (
              <Button>
                <FileText className="h-4 w-4 mr-2" /> Create Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vehicle Detail Dialog */}
      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
            </DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">License Plate:</span>
                  <div className="font-mono font-bold text-lg">{selectedVehicle.license_plate}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Color:</span>
                  <div className="font-medium">{selectedVehicle.color}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">VIN:</span>
                  <div className="font-mono text-xs">{selectedVehicle.vin}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Mileage:</span>
                  <div className="font-medium">{selectedVehicle.mileage.toLocaleString()} km</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="text-sm text-muted-foreground mb-1">Owner</div>
                <div className="font-medium">{selectedVehicle.customer_name}</div>
              </div>
              {selectedVehicle.notes && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <strong>Notes:</strong> {selectedVehicle.notes}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVehicle(null)}>Close</Button>
            <Button variant="outline">
              <History className="h-4 w-4 mr-2" /> Service History
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
