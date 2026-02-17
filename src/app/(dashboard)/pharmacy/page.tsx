'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/use-organization';
import { pharmacyService, Drug, ExpiryAlert } from '@/services/pharmacy';
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
  Pill,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  Package,
  ShieldAlert,
  FileText,
  BarChart3,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

type DrugCategory = 'otc' | 'prescription' | 'controlled' | 'narcotic';

interface DrugFormData {
  din: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  strength: string;
  form: string;
  category: DrugCategory;
  schedule: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  retail_price: number;
  expiry_date: string;
  lot_number: string;
  location: string;
  barcode: string;
  requires_prescription: boolean;
  is_controlled: boolean;
  notes: string;
}

const defaultFormData: DrugFormData = {
  din: '',
  name: '',
  generic_name: '',
  manufacturer: '',
  strength: '',
  form: '',
  category: 'otc',
  schedule: '',
  quantity_on_hand: 0,
  reorder_level: 10,
  unit_cost: 0,
  retail_price: 0,
  expiry_date: '',
  lot_number: '',
  location: '',
  barcode: '',
  requires_prescription: false,
  is_controlled: false,
  notes: '',
};

const DRUG_FORMS = ['Tablet', 'Capsule', 'Liquid', 'Cream', 'Ointment', 'Injection', 'Patch', 'Inhaler', 'Drops', 'Spray'];
const NAPRA_SCHEDULES = [
  { value: 'U', label: 'Unscheduled (U)' },
  { value: 'II', label: 'Schedule II' },
  { value: 'III', label: 'Schedule III' },
  { value: 'N', label: 'Narcotic (N)' },
  { value: 'C', label: 'Controlled (C)' },
];

export default function PharmacyPage() {
  const { organization } = useOrganization();
  const { toast } = useToast();

  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([]);
  const [lowStock, setLowStock] = useState<Drug[]>([]);
  const [controlledSubstances, setControlledSubstances] = useState<Drug[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'quantity_on_hand' | 'expiry_date'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [formData, setFormData] = useState<DrugFormData>(defaultFormData);

  // Inventory adjustment dialog
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [adjustmentDrug, setAdjustmentDrug] = useState<Drug | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'received' | 'dispensed' | 'adjusted'>('received');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);

  useEffect(() => {
    if (organization?.id) {
      loadData();
    }
  }, [organization?.id]);

  const loadData = async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const [drugsData, expiry, lowStockData, controlled, statsData] = await Promise.all([
        pharmacyService.getDrugs(organization.id),
        pharmacyService.getExpiryAlerts(organization.id, 90),
        pharmacyService.getLowStockDrugs(organization.id),
        pharmacyService.getControlledSubstances(organization.id),
        pharmacyService.getStats(organization.id),
      ]);
      setDrugs(drugsData);
      setExpiryAlerts(expiry);
      setLowStock(lowStockData);
      setControlledSubstances(controlled);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load pharmacy data:', error);
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!organization?.id) return;

    try {
      if (editingDrug) {
        await pharmacyService.updateDrug(editingDrug.id, formData as Partial<Drug>);
        toast({ title: 'Drug updated successfully' });
      } else {
        await pharmacyService.createDrug({
          ...formData,
          organization_id: organization.id,
        } as Omit<Drug, 'id' | 'created_at' | 'updated_at'>);
        toast({ title: 'Drug added successfully' });
      }
      setIsDialogOpen(false);
      setEditingDrug(null);
      setFormData(defaultFormData);
      loadData();
    } catch (error) {
      console.error('Failed to save drug:', error);
      toast({ title: 'Error saving drug', variant: 'destructive' });
    }
  };

  const handleEdit = (drug: Drug) => {
    setEditingDrug(drug);
    setFormData({
      din: drug.din,
      name: drug.name,
      generic_name: drug.generic_name || '',
      manufacturer: drug.manufacturer || '',
      strength: drug.strength || '',
      form: drug.form || '',
      category: drug.category,
      schedule: drug.schedule || '',
      quantity_on_hand: drug.quantity_on_hand,
      reorder_level: drug.reorder_level,
      unit_cost: drug.unit_cost,
      retail_price: drug.retail_price,
      expiry_date: drug.expiry_date || '',
      lot_number: drug.lot_number || '',
      location: drug.location || '',
      barcode: drug.barcode || '',
      requires_prescription: drug.requires_prescription,
      is_controlled: drug.is_controlled,
      notes: drug.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (drug: Drug) => {
    if (!confirm(`Delete ${drug.name}? This cannot be undone.`)) return;
    try {
      await pharmacyService.deleteDrug(drug.id);
      toast({ title: 'Drug deleted' });
      loadData();
    } catch (error) {
      toast({ title: 'Error deleting drug', variant: 'destructive' });
    }
  };

  const handleAdjustInventory = async () => {
    if (!adjustmentDrug || adjustmentQuantity === 0) return;
    try {
      await pharmacyService.adjustInventory(
        adjustmentDrug.id,
        adjustmentQuantity,
        adjustmentType
      );
      toast({ title: 'Inventory adjusted' });
      setAdjustmentDialog(false);
      setAdjustmentDrug(null);
      loadData();
    } catch (error) {
      toast({ title: 'Error adjusting inventory', variant: 'destructive' });
    }
  };

  const openAdjustmentDialog = (drug: Drug) => {
    setAdjustmentDrug(drug);
    setAdjustmentType('received');
    setAdjustmentQuantity(0);
    setAdjustmentDialog(true);
  };

  // Filter and sort drugs
  const filteredDrugs = drugs
    .filter(d => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.name.toLowerCase().includes(q) && !d.din.includes(q) && !d.generic_name?.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = typeof aVal === 'number' ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const getCategoryBadge = (category: DrugCategory) => {
    const variants: Record<DrugCategory, { color: string; label: string }> = {
      otc: { color: 'bg-green-100 text-green-700', label: 'OTC' },
      prescription: { color: 'bg-blue-100 text-blue-700', label: 'Rx' },
      controlled: { color: 'bg-orange-100 text-orange-700', label: 'Controlled' },
      narcotic: { color: 'bg-red-100 text-red-700', label: 'Narcotic' },
    };
    const v = variants[category];
    return <Badge className={v.color}>{v.label}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-red-600" />
            Pharmacy
          </h1>
          <p className="text-gray-600">Manage drug inventory, DIN tracking, and controlled substances</p>
        </div>
        <Button onClick={() => { setEditingDrug(null); setFormData(defaultFormData); setIsDialogOpen(true); }} className="bg-red-600 hover:bg-red-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Drug
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  <p className="text-xs text-gray-500">Total Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.lowStock}</p>
                  <p className="text-xs text-gray-500">Low Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.expiringSoon}</p>
                  <p className="text-xs text-gray-500">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                  <p className="text-xs text-gray-500">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.narcotics}</p>
                  <p className="text-xs text-gray-500">Narcotics</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.controlled}</p>
                  <p className="text-xs text-gray-500">Controlled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-xs text-gray-500">Inventory Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Drug Inventory</TabsTrigger>
          <TabsTrigger value="expiry">Expiry Alerts ({expiryAlerts.length})</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock ({lowStock.length})</TabsTrigger>
          <TabsTrigger value="controlled">Controlled Substances ({controlledSubstances.length})</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, DIN, or generic name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="otc">OTC</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="controlled">Controlled</SelectItem>
                    <SelectItem value="narcotic">Narcotic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DIN</TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1" onClick={() => { setSortField('name'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                        Name <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1" onClick={() => { setSortField('quantity_on_hand'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                        Qty <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1" onClick={() => { setSortField('expiry_date'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>
                        Expiry <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrugs.map((drug) => (
                    <TableRow key={drug.id}>
                      <TableCell className="font-mono text-sm">{drug.din}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{drug.name}</p>
                          {drug.generic_name && <p className="text-xs text-gray-500">{drug.generic_name}</p>}
                          {drug.strength && <p className="text-xs text-gray-400">{drug.strength} • {drug.form}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(drug.category)}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-medium",
                          drug.quantity_on_hand <= drug.reorder_level && "text-red-600"
                        )}>
                          {drug.quantity_on_hand}
                        </span>
                        <span className="text-xs text-gray-400"> / {drug.reorder_level}</span>
                      </TableCell>
                      <TableCell>
                        {drug.expiry_date ? (
                          <span className={cn(
                            "text-sm",
                            new Date(drug.expiry_date) < new Date() && "text-red-600 font-medium",
                            new Date(drug.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && "text-orange-600"
                          )}>
                            {formatDate(drug.expiry_date)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{formatCurrency(drug.retail_price)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{drug.location || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openAdjustmentDialog(drug)}>
                            <ArrowUpDown className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(drug)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(drug)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDrugs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        No drugs found. Add your first drug to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiry Alerts Tab */}
        <TabsContent value="expiry">
          <Card>
            <CardHeader>
              <CardTitle>Expiry Alerts</CardTitle>
              <CardDescription>Products expiring within 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              {expiryAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No products expiring soon</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {expiryAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border",
                        alert.status === 'expired' && "border-red-200 bg-red-50",
                        alert.status === 'critical' && "border-orange-200 bg-orange-50",
                        alert.status === 'warning' && "border-yellow-200 bg-yellow-50"
                      )}
                    >
                      <div>
                        <p className="font-medium">{alert.drug_name}</p>
                        <p className="text-sm text-gray-500">DIN: {alert.din} • Qty: {alert.quantity}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={cn(
                          alert.status === 'expired' && "bg-red-500",
                          alert.status === 'critical' && "bg-orange-500",
                          alert.status === 'warning' && "bg-yellow-500 text-gray-900"
                        )}>
                          {alert.status === 'expired' ? 'Expired' : 
                           alert.days_until_expiry === 0 ? 'Expires Today' :
                           `${alert.days_until_expiry} days`}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(alert.expiry_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Products below reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>All items are adequately stocked</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Current Qty</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Shortage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStock.map((drug) => (
                      <TableRow key={drug.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{drug.name}</p>
                            <p className="text-xs text-gray-500">DIN: {drug.din}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-red-600">{drug.quantity_on_hand}</TableCell>
                        <TableCell>{drug.reorder_level}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            -{drug.reorder_level - drug.quantity_on_hand}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openAdjustmentDialog(drug)}>
                            Reorder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controlled Substances Tab */}
        <TabsContent value="controlled">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                Controlled Substances
              </CardTitle>
              <CardDescription>Narcotics and controlled substances requiring special tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DIN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Last Count</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {controlledSubstances.map((drug) => (
                    <TableRow key={drug.id}>
                      <TableCell className="font-mono">{drug.din}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{drug.name}</p>
                          <p className="text-xs text-gray-500">{drug.strength} {drug.form}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={drug.category === 'narcotic' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>
                          {drug.schedule || drug.category.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{drug.quantity_on_hand}</TableCell>
                      <TableCell className="text-sm text-gray-500">—</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Record Count
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {controlledSubstances.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No controlled substances in inventory
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Drug Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDrug ? 'Edit Drug' : 'Add New Drug'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>DIN *</Label>
              <Input
                value={formData.din}
                onChange={(e) => setFormData({ ...formData, din: e.target.value })}
                placeholder="12345678"
                maxLength={8}
              />
            </div>
            <div>
              <Label>Barcode</Label>
              <Input
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Scan or enter"
              />
            </div>
            <div className="col-span-2">
              <Label>Drug Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acetaminophen"
              />
            </div>
            <div className="col-span-2">
              <Label>Generic Name</Label>
              <Input
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                placeholder="Paracetamol"
              />
            </div>
            <div>
              <Label>Manufacturer</Label>
              <Input
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
            <div>
              <Label>Strength</Label>
              <Input
                value={formData.strength}
                onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                placeholder="500mg"
              />
            </div>
            <div>
              <Label>Form</Label>
              <Select value={formData.form} onValueChange={(v) => setFormData({ ...formData, form: v })}>
                <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                <SelectContent>
                  {DRUG_FORMS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as DrugCategory, is_controlled: v === 'controlled' || v === 'narcotic', requires_prescription: v !== 'otc' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="otc">OTC</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="controlled">Controlled</SelectItem>
                  <SelectItem value="narcotic">Narcotic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>NAPRA Schedule</Label>
              <Select value={formData.schedule} onValueChange={(v) => setFormData({ ...formData, schedule: v })}>
                <SelectTrigger><SelectValue placeholder="Select schedule" /></SelectTrigger>
                <SelectContent>
                  {NAPRA_SCHEDULES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Aisle 3, Shelf B"
              />
            </div>
            <div>
              <Label>Quantity on Hand</Label>
              <Input
                type="number"
                value={formData.quantity_on_hand}
                onChange={(e) => setFormData({ ...formData, quantity_on_hand: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Reorder Level</Label>
              <Input
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Unit Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Retail Price</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.retail_price}
                onChange={(e) => setFormData({ ...formData, retail_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Lot Number</Label>
              <Input
                value={formData.lot_number}
                onChange={(e) => setFormData({ ...formData, lot_number: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">
              {editingDrug ? 'Update' : 'Add Drug'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inventory Adjustment Dialog */}
      <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory</DialogTitle>
          </DialogHeader>
          {adjustmentDrug && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{adjustmentDrug.name}</p>
                <p className="text-sm text-gray-500">Current Quantity: {adjustmentDrug.quantity_on_hand}</p>
              </div>
              <div>
                <Label>Transaction Type</Label>
                <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="dispensed">Dispensed</SelectItem>
                    <SelectItem value="adjusted">Adjustment</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="expired">Expired/Waste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p>New Quantity: <strong>
                  {adjustmentType === 'received'
                    ? adjustmentDrug.quantity_on_hand + adjustmentQuantity
                    : adjustmentDrug.quantity_on_hand - adjustmentQuantity}
                </strong></p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentDialog(false)}>Cancel</Button>
            <Button onClick={handleAdjustInventory} className="bg-red-600 hover:bg-red-700">
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
