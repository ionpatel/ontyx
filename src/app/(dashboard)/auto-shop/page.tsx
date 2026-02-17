'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/use-organization';
import { autoShopService, Vehicle, AutoWorkOrder } from '@/services/auto-shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Car,
  Search,
  Plus,
  Wrench,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Play,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { ContactSelector } from '@/components/selectors';

const VEHICLE_MAKES = ['Acura', 'Audi', 'BMW', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Jeep', 'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Nissan', 'Ram', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

export default function AutoShopPage() {
  const { organization } = useOrganization();
  const { toast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<AutoWorkOrder[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialogs
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [workOrderDialog, setWorkOrderDialog] = useState(false);
  const [viewWorkOrderDialog, setViewWorkOrderDialog] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<AutoWorkOrder | null>(null);

  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    customer_id: '',
    vin: '',
    license_plate: '',
    make: '',
    model: '',
    year: CURRENT_YEAR,
    color: '',
    engine: '',
    transmission: '',
    mileage: 0,
    notes: '',
  });

  const [workOrderForm, setWorkOrderForm] = useState({
    vehicle_id: '',
    customer_id: '',
    odometer_in: 0,
    customer_concern: '',
    priority: 'normal' as const,
  });

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const [vehiclesData, workOrdersData, statsData] = await Promise.all([
        autoShopService.getVehicles(organization.id),
        autoShopService.getWorkOrders(organization.id),
        autoShopService.getStats(organization.id),
      ]);
      setVehicles(vehiclesData);
      setWorkOrders(workOrdersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load auto shop data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Vehicle handlers
  const handleSaveVehicle = async () => {
    if (!organization?.id) return;
    try {
      if (editingVehicle) {
        await autoShopService.updateVehicle(editingVehicle.id, vehicleForm as Partial<Vehicle>);
        toast({ title: 'Vehicle updated' });
      } else {
        await autoShopService.createVehicle({
          ...vehicleForm,
          organization_id: organization.id,
          customer_id: vehicleForm.customer_id || undefined,
        } as Omit<Vehicle, 'id' | 'customer'>);
        toast({ title: 'Vehicle added' });
      }
      setVehicleDialog(false);
      setEditingVehicle(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error saving vehicle', variant: 'destructive' });
    }
  };

  const openVehicleDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm({
        customer_id: vehicle.customer_id || '',
        vin: vehicle.vin || '',
        license_plate: vehicle.license_plate || '',
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        engine: vehicle.engine || '',
        transmission: vehicle.transmission || '',
        mileage: vehicle.mileage || 0,
        notes: vehicle.notes || '',
      });
    } else {
      setEditingVehicle(null);
      setVehicleForm({
        customer_id: '',
        vin: '',
        license_plate: '',
        make: '',
        model: '',
        year: CURRENT_YEAR,
        color: '',
        engine: '',
        transmission: '',
        mileage: 0,
        notes: '',
      });
    }
    setVehicleDialog(true);
  };

  const handleDeleteVehicle = async (vehicle: Vehicle) => {
    if (!confirm(`Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}?`)) return;
    try {
      await autoShopService.deleteVehicle(vehicle.id);
      toast({ title: 'Vehicle deleted' });
      loadData();
    } catch (error) {
      toast({ title: 'Error deleting vehicle', variant: 'destructive' });
    }
  };

  // Work Order handlers
  const handleCreateWorkOrder = async () => {
    if (!organization?.id || !workOrderForm.vehicle_id) return;

    const vehicle = vehicles.find(v => v.id === workOrderForm.vehicle_id);

    try {
      await autoShopService.createWorkOrder({
        organization_id: organization.id,
        vehicle_id: workOrderForm.vehicle_id,
        customer_id: vehicle?.customer_id || workOrderForm.customer_id || undefined,
        status: 'estimate',
        priority: workOrderForm.priority,
        odometer_in: workOrderForm.odometer_in,
        customer_concern: workOrderForm.customer_concern,
        labor_total: 0,
        parts_total: 0,
        supplies_total: 0,
        subtotal: 0,
        tax: 0,
        total: 0,
      });
      toast({ title: 'Work order created' });
      setWorkOrderDialog(false);
      loadData();
    } catch (error) {
      toast({ title: 'Error creating work order', variant: 'destructive' });
    }
  };

  const updateWorkOrderStatus = async (id: string, status: AutoWorkOrder['status']) => {
    try {
      await autoShopService.updateWorkOrderStatus(id, status);
      toast({ title: `Work order ${status}` });
      loadData();
    } catch (error) {
      toast({ title: 'Error updating work order', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      estimate: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-cyan-100 text-cyan-700',
      completed: 'bg-green-100 text-green-700',
      invoiced: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700',
    };
    return <Badge className={colors[priority] || 'bg-gray-100'}>{priority}</Badge>;
  };

  const filteredVehicles = vehicles.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.make.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.vin?.toLowerCase().includes(q) || v.license_plate?.toLowerCase().includes(q);
  });

  const filteredWorkOrders = workOrders.filter(wo => {
    if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return wo.wo_number.toLowerCase().includes(q) || wo.vehicle?.make?.toLowerCase().includes(q) || wo.vehicle?.model?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />
            Auto Repair Shop
          </h1>
          <p className="text-gray-600">Vehicle management, work orders, and repair tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openVehicleDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
          <Button onClick={() => setWorkOrderDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Wrench className="w-4 h-4 mr-2" />
            New Work Order
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Wrench className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeOrders}</p>
                  <p className="text-xs text-gray-500">Active Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingEstimates}</p>
                  <p className="text-xs text-gray-500">Pending Estimates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.completedToday}</p>
                  <p className="text-xs text-gray-500">Completed Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Car className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalVehicles}</p>
                  <p className="text-xs text-gray-500">Vehicles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                  <p className="text-xs text-gray-500">Today&apos;s Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="workorders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workorders">Work Orders ({workOrders.length})</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
        </TabsList>

        {/* Work Orders Tab */}
        <TabsContent value="workorders">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search work orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="estimate">Estimate</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>WO #</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-mono font-medium">{wo.wo_number}</TableCell>
                      <TableCell>
                        {wo.vehicle && (
                          <div>
                            <p className="font-medium">{wo.vehicle.year} {wo.vehicle.make} {wo.vehicle.model}</p>
                            <p className="text-xs text-gray-500">{wo.vehicle.license_plate}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {wo.customer ? (
                          <div>
                            <p>{wo.customer.name}</p>
                            {wo.customer.phone && <p className="text-xs text-gray-500">{wo.customer.phone}</p>}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(wo.status)}</TableCell>
                      <TableCell>{getPriorityBadge(wo.priority)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(wo.total)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(wo.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedWorkOrder(wo); setViewWorkOrderDialog(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {wo.status === 'estimate' && (
                            <Button size="sm" variant="outline" onClick={() => updateWorkOrderStatus(wo.id, 'approved')}>
                              Approve
                            </Button>
                          )}
                          {wo.status === 'approved' && (
                            <Button size="sm" variant="outline" onClick={() => updateWorkOrderStatus(wo.id, 'in_progress')}>
                              Start
                            </Button>
                          )}
                          {wo.status === 'in_progress' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateWorkOrderStatus(wo.id, 'completed')}>
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredWorkOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No work orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search by VIN, plate, make, model..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
                <Button onClick={() => openVehicleDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Last Service</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                          {vehicle.color && <p className="text-xs text-gray-500">{vehicle.color}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{vehicle.vin || '—'}</TableCell>
                      <TableCell className="font-mono">{vehicle.license_plate || '—'}</TableCell>
                      <TableCell>
                        {vehicle.customer ? (
                          <div>
                            <p>{vehicle.customer.name}</p>
                            {vehicle.customer.phone && <p className="text-xs text-gray-500">{vehicle.customer.phone}</p>}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{vehicle.mileage?.toLocaleString() || '—'} km</TableCell>
                      <TableCell>{vehicle.last_service_date ? formatDate(vehicle.last_service_date) : '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openVehicleDialog(vehicle)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteVehicle(vehicle)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No vehicles found. Add your first vehicle to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vehicle Dialog */}
      <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Owner</Label>
              <ContactSelector
                value={vehicleForm.customer_id}
                onChange={(id) => setVehicleForm({ ...vehicleForm, customer_id: id || '' })}
                placeholder="Select customer..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Year *</Label>
                <Select value={String(vehicleForm.year)} onValueChange={(v) => setVehicleForm({ ...vehicleForm, year: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Make *</Label>
                <Select value={vehicleForm.make} onValueChange={(v) => setVehicleForm({ ...vehicleForm, make: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Model *</Label>
                <Input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>VIN</Label>
                <Input value={vehicleForm.vin} onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value.toUpperCase() })} maxLength={17} placeholder="17-character VIN" />
              </div>
              <div>
                <Label>License Plate</Label>
                <Input value={vehicleForm.license_plate} onChange={(e) => setVehicleForm({ ...vehicleForm, license_plate: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Color</Label>
                <Input value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} />
              </div>
              <div>
                <Label>Engine</Label>
                <Input value={vehicleForm.engine} onChange={(e) => setVehicleForm({ ...vehicleForm, engine: e.target.value })} placeholder="e.g. 2.0L Turbo" />
              </div>
              <div>
                <Label>Mileage</Label>
                <Input type="number" value={vehicleForm.mileage} onChange={(e) => setVehicleForm({ ...vehicleForm, mileage: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={vehicleForm.notes} onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveVehicle} className="bg-blue-600 hover:bg-blue-700">
              {editingVehicle ? 'Update' : 'Add Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Order Dialog */}
      <Dialog open={workOrderDialog} onOpenChange={setWorkOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Work Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Vehicle *</Label>
              <Select value={workOrderForm.vehicle_id} onValueChange={(v) => setWorkOrderForm({ ...workOrderForm, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} {v.license_plate && `(${v.license_plate})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Odometer In</Label>
                <Input type="number" value={workOrderForm.odometer_in} onChange={(e) => setWorkOrderForm({ ...workOrderForm, odometer_in: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={workOrderForm.priority} onValueChange={(v: any) => setWorkOrderForm({ ...workOrderForm, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Customer Concern</Label>
              <Input value={workOrderForm.customer_concern} onChange={(e) => setWorkOrderForm({ ...workOrderForm, customer_concern: e.target.value })} placeholder="What brought the customer in?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkOrderDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateWorkOrder} className="bg-blue-600 hover:bg-blue-700">
              Create Work Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Work Order Dialog */}
      <Dialog open={viewWorkOrderDialog} onOpenChange={setViewWorkOrderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Work Order {selectedWorkOrder?.wo_number}</DialogTitle>
          </DialogHeader>
          {selectedWorkOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Vehicle</h3>
                  <p>{selectedWorkOrder.vehicle?.year} {selectedWorkOrder.vehicle?.make} {selectedWorkOrder.vehicle?.model}</p>
                  <p className="text-sm text-gray-500">VIN: {selectedWorkOrder.vehicle?.vin || '—'}</p>
                  <p className="text-sm text-gray-500">Plate: {selectedWorkOrder.vehicle?.license_plate || '—'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Customer</h3>
                  <p>{selectedWorkOrder.customer?.name || '—'}</p>
                  <p className="text-sm text-gray-500">{selectedWorkOrder.customer?.phone || '—'}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Customer Concern</h3>
                <p>{selectedWorkOrder.customer_concern || 'No concern noted'}</p>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedWorkOrder.status)}
                {getPriorityBadge(selectedWorkOrder.priority)}
                <span className="text-sm text-gray-500">Odometer: {selectedWorkOrder.odometer_in?.toLocaleString()} km</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Labor:</span>
                  <span>{formatCurrency(selectedWorkOrder.labor_total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Parts:</span>
                  <span>{formatCurrency(selectedWorkOrder.parts_total)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tax (HST 13%):</span>
                  <span>{formatCurrency(selectedWorkOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t mt-2 pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedWorkOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewWorkOrderDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
