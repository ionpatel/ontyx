'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
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
import { ProductSelector } from '@/components/selectors';
import {
  Factory, Package, Plus, Clock, CheckCircle, AlertCircle,
  Play, Pause, RotateCcw, FileText, Layers, Settings,
  ChevronRight, Trash2, Edit, Copy, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BOMComponent {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
}

interface BillOfMaterials {
  id: string;
  product_id: string;
  product_name: string;
  code: string;
  quantity: number;
  components: BOMComponent[];
  operations: BOMOperation[];
  is_active: boolean;
  created_at: string;
}

interface BOMOperation {
  id: string;
  name: string;
  workcenter_id: string;
  workcenter_name: string;
  duration_minutes: number;
  sequence: number;
}

interface ManufacturingOrder {
  id: string;
  mo_number: string;
  product_id: string;
  product_name: string;
  bom_id: string;
  quantity: number;
  quantity_produced: number;
  status: 'draft' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';
  scheduled_date: string;
  deadline: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

interface Workcenter {
  id: string;
  name: string;
  code: string;
  capacity: number;
  status: 'operational' | 'maintenance' | 'offline';
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

// Demo data
const demoBOMs: BillOfMaterials[] = [
  {
    id: 'bom1',
    product_id: 'p1',
    product_name: 'Assembled Widget A',
    code: 'BOM-001',
    quantity: 1,
    is_active: true,
    created_at: '2026-01-15',
    components: [
      { id: 'c1', product_id: 'p2', product_name: 'Base Plate', quantity: 1, unit: 'pcs' },
      { id: 'c2', product_id: 'p3', product_name: 'Screws M6', quantity: 4, unit: 'pcs' },
      { id: 'c3', product_id: 'p4', product_name: 'Cover Panel', quantity: 1, unit: 'pcs' },
      { id: 'c4', product_id: 'p5', product_name: 'Wiring Harness', quantity: 1, unit: 'pcs' },
    ],
    operations: [
      { id: 'op1', name: 'Assembly', workcenter_id: 'wc1', workcenter_name: 'Assembly Line 1', duration_minutes: 30, sequence: 1 },
      { id: 'op2', name: 'Quality Check', workcenter_id: 'wc2', workcenter_name: 'QC Station', duration_minutes: 10, sequence: 2 },
      { id: 'op3', name: 'Packaging', workcenter_id: 'wc3', workcenter_name: 'Packing Area', duration_minutes: 5, sequence: 3 },
    ],
  },
];

const demoOrders: ManufacturingOrder[] = [
  {
    id: 'mo1',
    mo_number: 'MO-2026-001',
    product_id: 'p1',
    product_name: 'Assembled Widget A',
    bom_id: 'bom1',
    quantity: 100,
    quantity_produced: 45,
    status: 'in_progress',
    scheduled_date: '2026-02-15',
    deadline: '2026-02-20',
    priority: 'high',
    created_at: '2026-02-10',
  },
  {
    id: 'mo2',
    mo_number: 'MO-2026-002',
    product_id: 'p1',
    product_name: 'Assembled Widget A',
    bom_id: 'bom1',
    quantity: 50,
    quantity_produced: 0,
    status: 'confirmed',
    scheduled_date: '2026-02-20',
    deadline: '2026-02-25',
    priority: 'normal',
    created_at: '2026-02-12',
  },
];

const demoWorkcenters: Workcenter[] = [
  { id: 'wc1', name: 'Assembly Line 1', code: 'ASM-1', capacity: 100, status: 'operational' },
  { id: 'wc2', name: 'Assembly Line 2', code: 'ASM-2', capacity: 100, status: 'operational' },
  { id: 'wc3', name: 'QC Station', code: 'QC-1', capacity: 200, status: 'operational' },
  { id: 'wc4', name: 'Packing Area', code: 'PACK-1', capacity: 150, status: 'operational' },
  { id: 'wc5', name: 'CNC Machine', code: 'CNC-1', capacity: 50, status: 'maintenance' },
];

export default function ManufacturingPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<ManufacturingOrder[]>(demoOrders);
  const [boms, setBoms] = useState<BillOfMaterials[]>(demoBOMs);
  const [workcenters, setWorkcenters] = useState<Workcenter[]>(demoWorkcenters);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewBOM, setShowNewBOM] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<BillOfMaterials | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingOrder | null>(null);

  // Stats
  const stats = {
    totalOrders: orders.length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'done').length,
    totalBOMs: boms.length,
    operationalWorkcenters: workcenters.filter(w => w.status === 'operational').length,
  };

  const startOrder = (order: ManufacturingOrder) => {
    setOrders(orders.map(o => 
      o.id === order.id ? { ...o, status: 'in_progress' } : o
    ));
    toast({ title: 'Manufacturing started', description: order.mo_number });
  };

  const completeOrder = (order: ManufacturingOrder) => {
    setOrders(orders.map(o => 
      o.id === order.id ? { ...o, status: 'done', quantity_produced: o.quantity } : o
    ));
    toast({ title: 'Manufacturing completed', description: order.mo_number });
  };

  const updateProgress = (order: ManufacturingOrder, produced: number) => {
    setOrders(orders.map(o => 
      o.id === order.id ? { ...o, quantity_produced: produced } : o
    ));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory className="h-6 w-6" />
            Manufacturing
          </h1>
          <p className="text-muted-foreground">Manage production orders and bills of materials</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewBOM(true)}>
            <Layers className="h-4 w-4 mr-2" /> New BOM
          </Button>
          <Button onClick={() => setShowNewOrder(true)}>
            <Plus className="h-4 w-4 mr-2" /> New MO
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Orders</div>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Play className="h-5 w-5 text-yellow-600" />
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
              <div className="p-2 rounded-lg bg-purple-100">
                <Layers className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">BOMs</div>
                <div className="text-2xl font-bold">{stats.totalBOMs}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Factory className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Workcenters</div>
                <div className="text-2xl font-bold">{stats.operationalWorkcenters}/{workcenters.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="orders">Manufacturing Orders</TabsTrigger>
          <TabsTrigger value="boms">Bills of Materials</TabsTrigger>
          <TabsTrigger value="workcenters">Work Centers</TabsTrigger>
        </TabsList>

        {/* Manufacturing Orders */}
        <TabsContent value="orders">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MO Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">{order.mo_number}</TableCell>
                    <TableCell>{order.product_name}</TableCell>
                    <TableCell>{order.quantity} units</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden w-24">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${(order.quantity_produced / order.quantity) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {order.quantity_produced}/{order.quantity}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[order.priority]}>{order.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>{order.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(order.deadline), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {order.status === 'confirmed' && (
                          <Button size="sm" variant="outline" onClick={() => startOrder(order)}>
                            <Play className="h-4 w-4 mr-1" /> Start
                          </Button>
                        )}
                        {order.status === 'in_progress' && (
                          <Button size="sm" onClick={() => completeOrder(order)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Complete
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Bills of Materials */}
        <TabsContent value="boms">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boms.map(bom => (
              <Card key={bom.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBOM(bom)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{bom.product_name}</CardTitle>
                      <CardDescription>{bom.code}</CardDescription>
                    </div>
                    <Badge variant={bom.is_active ? 'default' : 'secondary'}>
                      {bom.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Components:</span>
                      <span className="ml-2 font-medium">{bom.components.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Operations:</span>
                      <span className="ml-2 font-medium">{bom.operations.length}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {bom.components.slice(0, 3).map(c => (
                      <Badge key={c.id} variant="outline" className="text-xs">
                        {c.product_name} ×{c.quantity}
                      </Badge>
                    ))}
                    {bom.components.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{bom.components.length - 3} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Work Centers */}
        <TabsContent value="workcenters">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workcenters.map(wc => (
              <Card key={wc.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        wc.status === 'operational' ? 'bg-green-100' : 
                        wc.status === 'maintenance' ? 'bg-yellow-100' : 'bg-red-100'
                      )}>
                        <Factory className={cn(
                          'h-5 w-5',
                          wc.status === 'operational' ? 'text-green-600' : 
                          wc.status === 'maintenance' ? 'text-yellow-600' : 'text-red-600'
                        )} />
                      </div>
                      <div>
                        <div className="font-medium">{wc.name}</div>
                        <div className="text-sm text-muted-foreground">{wc.code}</div>
                      </div>
                    </div>
                    <Badge variant={wc.status === 'operational' ? 'default' : 'secondary'}>
                      {wc.status}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="ml-2 font-medium">{wc.capacity} units/day</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* BOM Detail Dialog */}
      <Dialog open={!!selectedBOM} onOpenChange={() => setSelectedBOM(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedBOM?.product_name}</DialogTitle>
          </DialogHeader>
          {selectedBOM && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Components
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBOM.components.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>{c.product_name}</TableCell>
                        <TableCell className="text-right font-mono">{c.quantity}</TableCell>
                        <TableCell>{c.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Operations
                </h4>
                <div className="space-y-2">
                  {selectedBOM.operations.map((op, i) => (
                    <div key={op.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{op.name}</div>
                        <div className="text-sm text-muted-foreground">{op.workcenter_name}</div>
                      </div>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {op.duration_minutes} min
                      </Badge>
                      {i < selectedBOM.operations.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBOM(null)}>Close</Button>
            <Button>
              <Play className="h-4 w-4 mr-2" /> Create MO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
