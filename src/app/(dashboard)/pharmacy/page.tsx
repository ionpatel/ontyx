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
import { Progress } from '@/components/ui/progress';
import {
  Pill, AlertTriangle, Calendar, Package, Search, Plus,
  Clock, ShieldAlert, Barcode, TrendingDown, Bell, Archive,
  CheckCircle, XCircle, FileText, Truck
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Drug {
  id: string;
  din: string;
  name: string;
  generic_name: string;
  manufacturer: string;
  strength: string;
  form: string;
  category: 'otc' | 'prescription' | 'controlled' | 'narcotic';
  schedule: string;
  quantity_on_hand: number;
  reorder_level: number;
  unit_cost: number;
  retail_price: number;
  expiry_date: string;
  lot_number: string;
  location: string;
  supplier_id: string;
  supplier_name: string;
}

interface ExpiryAlert {
  id: string;
  drug_id: string;
  drug_name: string;
  din: string;
  quantity: number;
  expiry_date: string;
  days_until_expiry: number;
  lot_number: string;
  status: 'warning' | 'critical' | 'expired';
}

const categoryColors: Record<string, string> = {
  otc: 'bg-green-100 text-green-700',
  prescription: 'bg-blue-100 text-blue-700',
  controlled: 'bg-orange-100 text-orange-700',
  narcotic: 'bg-red-100 text-red-700',
};

const scheduleLabels: Record<string, string> = {
  'U': 'Unscheduled (OTC)',
  'II': 'Schedule II (Behind Counter)',
  'III': 'Schedule III (Prescription)',
  'N': 'Narcotic',
  'C': 'Controlled',
};

// Demo data
const demoDrugs: Drug[] = [
  { id: 'd1', din: '02248573', name: 'Lipitor', generic_name: 'Atorvastatin', manufacturer: 'Pfizer', strength: '20mg', form: 'Tablet', category: 'prescription', schedule: 'III', quantity_on_hand: 500, reorder_level: 100, unit_cost: 0.85, retail_price: 1.50, expiry_date: '2027-06-15', lot_number: 'LOT2025A', location: 'Shelf A2', supplier_id: 's1', supplier_name: 'McKesson Canada' },
  { id: 'd2', din: '02230523', name: 'Tylenol Extra Strength', generic_name: 'Acetaminophen', manufacturer: 'Johnson & Johnson', strength: '500mg', form: 'Caplet', category: 'otc', schedule: 'U', quantity_on_hand: 1200, reorder_level: 200, unit_cost: 0.05, retail_price: 0.15, expiry_date: '2026-12-01', lot_number: 'TYL2024B', location: 'Shelf C1', supplier_id: 's2', supplier_name: 'Kohl & Frisch' },
  { id: 'd3', din: '02242963', name: 'OxyContin', generic_name: 'Oxycodone', manufacturer: 'Purdue Pharma', strength: '10mg', form: 'Tablet', category: 'narcotic', schedule: 'N', quantity_on_hand: 50, reorder_level: 20, unit_cost: 2.50, retail_price: 5.00, expiry_date: '2026-03-15', lot_number: 'OXY2024C', location: 'Safe', supplier_id: 's1', supplier_name: 'McKesson Canada' },
  { id: 'd4', din: '02231485', name: 'Ventolin HFA', generic_name: 'Salbutamol', manufacturer: 'GSK', strength: '100mcg', form: 'Inhaler', category: 'prescription', schedule: 'III', quantity_on_hand: 45, reorder_level: 50, unit_cost: 8.50, retail_price: 15.00, expiry_date: '2026-02-28', lot_number: 'VEN2024A', location: 'Shelf B3', supplier_id: 's2', supplier_name: 'Kohl & Frisch' },
  { id: 'd5', din: '02247135', name: 'Metformin', generic_name: 'Metformin HCl', manufacturer: 'Apotex', strength: '500mg', form: 'Tablet', category: 'prescription', schedule: 'III', quantity_on_hand: 2000, reorder_level: 500, unit_cost: 0.03, retail_price: 0.10, expiry_date: '2027-09-30', lot_number: 'MET2025A', location: 'Shelf A4', supplier_id: 's1', supplier_name: 'McKesson Canada' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

export default function PharmacyPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inventory');
  const [drugs, setDrugs] = useState<Drug[]>(demoDrugs);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddDrug, setShowAddDrug] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  // Calculate expiry alerts
  const today = new Date();
  const expiryAlerts: ExpiryAlert[] = drugs
    .map(drug => {
      const daysUntil = differenceInDays(new Date(drug.expiry_date), today);
      let status: ExpiryAlert['status'] = 'warning';
      if (daysUntil < 0) status = 'expired';
      else if (daysUntil <= 30) status = 'critical';
      else if (daysUntil <= 90) status = 'warning';
      else return null;
      
      return {
        id: drug.id,
        drug_id: drug.id,
        drug_name: drug.name,
        din: drug.din,
        quantity: drug.quantity_on_hand,
        expiry_date: drug.expiry_date,
        days_until_expiry: daysUntil,
        lot_number: drug.lot_number,
        status,
      };
    })
    .filter(Boolean) as ExpiryAlert[];

  // Stats
  const stats = {
    totalProducts: drugs.length,
    lowStock: drugs.filter(d => d.quantity_on_hand <= d.reorder_level).length,
    expiringSoon: expiryAlerts.filter(a => a.status === 'warning' || a.status === 'critical').length,
    expired: expiryAlerts.filter(a => a.status === 'expired').length,
    narcotics: drugs.filter(d => d.category === 'narcotic').length,
    totalValue: drugs.reduce((sum, d) => sum + d.quantity_on_hand * d.unit_cost, 0),
  };

  // Filter drugs
  const filteredDrugs = drugs.filter(drug => {
    const matchesSearch = drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drug.din.includes(searchTerm) ||
                         drug.generic_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || drug.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-6 w-6" />
            Pharmacy Management
          </h1>
          <p className="text-muted-foreground">Drug inventory, DIN tracking, and expiry management</p>
        </div>
        <Button onClick={() => setShowAddDrug(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Drug
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Products</div>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.lowStock > 0 ? 'border-yellow-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <TrendingDown className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Low Stock</div>
                <div className={cn('text-2xl font-bold', stats.lowStock > 0 && 'text-yellow-600')}>
                  {stats.lowStock}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.expiringSoon > 0 ? 'border-orange-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expiring</div>
                <div className={cn('text-2xl font-bold', stats.expiringSoon > 0 && 'text-orange-600')}>
                  {stats.expiringSoon}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.expired > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expired</div>
                <div className={cn('text-2xl font-bold', stats.expired > 0 && 'text-red-600')}>
                  {stats.expired}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Narcotics</div>
                <div className="text-2xl font-bold">{stats.narcotics}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Value</div>
                <div className="text-xl font-bold">{formatCurrency(stats.totalValue)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inventory">Drug Inventory</TabsTrigger>
          <TabsTrigger value="expiry" className="flex items-center gap-2">
            Expiry Alerts
            {expiryAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1">{expiryAlerts.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="controlled">Controlled Substances</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
        </TabsList>

        {/* Inventory */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, DIN, or generic..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DIN</TableHead>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrugs.map(drug => {
                  const daysUntilExpiry = differenceInDays(new Date(drug.expiry_date), today);
                  const isLowStock = drug.quantity_on_hand <= drug.reorder_level;
                  const isExpiringSoon = daysUntilExpiry <= 90;
                  
                  return (
                    <TableRow key={drug.id} className={cn(isLowStock && 'bg-yellow-50')}>
                      <TableCell className="font-mono">{drug.din}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{drug.name}</div>
                          <div className="text-sm text-muted-foreground">{drug.generic_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{drug.strength} {drug.form}</TableCell>
                      <TableCell>
                        <Badge className={categoryColors[drug.category]}>
                          {drug.category === 'narcotic' && <ShieldAlert className="h-3 w-3 mr-1" />}
                          {drug.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={cn(isLowStock && 'text-yellow-600 font-medium')}>
                          {drug.quantity_on_hand}
                          {isLowStock && <TrendingDown className="inline h-4 w-4 ml-1" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          isExpiringSoon && daysUntilExpiry > 30 && 'text-orange-600',
                          daysUntilExpiry <= 30 && daysUntilExpiry > 0 && 'text-red-600 font-medium',
                          daysUntilExpiry <= 0 && 'text-red-600 font-bold'
                        )}>
                          {format(new Date(drug.expiry_date), 'MMM yyyy')}
                          {daysUntilExpiry <= 0 && <Badge variant="destructive" className="ml-2">EXPIRED</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{drug.location}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedDrug(drug)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Expiry Alerts */}
        <TabsContent value="expiry">
          <div className="space-y-4">
            {expiryAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="font-medium">No expiry alerts</p>
                  <p className="text-sm text-muted-foreground">All products are within acceptable expiry dates</p>
                </CardContent>
              </Card>
            ) : (
              expiryAlerts.map(alert => (
                <Card key={alert.id} className={cn(
                  'border-l-4',
                  alert.status === 'expired' && 'border-l-red-500 bg-red-50',
                  alert.status === 'critical' && 'border-l-orange-500 bg-orange-50',
                  alert.status === 'warning' && 'border-l-yellow-500 bg-yellow-50'
                )}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'p-2 rounded-lg',
                          alert.status === 'expired' && 'bg-red-100',
                          alert.status === 'critical' && 'bg-orange-100',
                          alert.status === 'warning' && 'bg-yellow-100'
                        )}>
                          <AlertTriangle className={cn(
                            'h-5 w-5',
                            alert.status === 'expired' && 'text-red-600',
                            alert.status === 'critical' && 'text-orange-600',
                            alert.status === 'warning' && 'text-yellow-600'
                          )} />
                        </div>
                        <div>
                          <div className="font-medium">{alert.drug_name}</div>
                          <div className="text-sm text-muted-foreground">
                            DIN: {alert.din} • Lot: {alert.lot_number} • Qty: {alert.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          'font-bold',
                          alert.status === 'expired' && 'text-red-600',
                          alert.status === 'critical' && 'text-orange-600',
                          alert.status === 'warning' && 'text-yellow-600'
                        )}>
                          {alert.days_until_expiry < 0 
                            ? `Expired ${Math.abs(alert.days_until_expiry)} days ago`
                            : `${alert.days_until_expiry} days left`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Expires: {format(new Date(alert.expiry_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Archive className="h-4 w-4 mr-1" /> Quarantine
                        </Button>
                        <Button size="sm" variant="outline">
                          <Truck className="h-4 w-4 mr-1" /> Return
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Controlled Substances */}
        <TabsContent value="controlled">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Controlled & Narcotic Substances
              </CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DIN</TableHead>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>On Hand</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drugs.filter(d => d.category === 'controlled' || d.category === 'narcotic').map(drug => (
                  <TableRow key={drug.id}>
                    <TableCell className="font-mono">{drug.din}</TableCell>
                    <TableCell>
                      <div className="font-medium">{drug.name}</div>
                      <div className="text-sm text-muted-foreground">{drug.generic_name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={categoryColors[drug.category]}>
                        {scheduleLabels[drug.schedule] || drug.schedule}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold">{drug.quantity_on_hand}</TableCell>
                    <TableCell>{drug.location}</TableCell>
                    <TableCell>Today</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-1" /> Count Log
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Purchase Orders */}
        <TabsContent value="orders">
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="font-medium">No pending orders</p>
              <p className="text-sm text-muted-foreground mb-4">Create a purchase order for low stock items</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Create PO for Low Stock
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Drug Detail Dialog */}
      <Dialog open={!!selectedDrug} onOpenChange={() => setSelectedDrug(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              {selectedDrug?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedDrug && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">DIN:</span>
                  <div className="font-mono font-bold">{selectedDrug.din}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Generic Name:</span>
                  <div className="font-medium">{selectedDrug.generic_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Manufacturer:</span>
                  <div>{selectedDrug.manufacturer}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Strength/Form:</span>
                  <div>{selectedDrug.strength} {selectedDrug.form}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <div><Badge className={categoryColors[selectedDrug.category]}>{selectedDrug.category}</Badge></div>
                </div>
                <div>
                  <span className="text-muted-foreground">Schedule:</span>
                  <div>{scheduleLabels[selectedDrug.schedule]}</div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Qty On Hand:</span>
                    <div className="text-2xl font-bold">{selectedDrug.quantity_on_hand}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reorder Level:</span>
                    <div className="text-2xl font-bold">{selectedDrug.reorder_level}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unit Cost:</span>
                    <div className="font-medium">{formatCurrency(selectedDrug.unit_cost)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Retail Price:</span>
                    <div className="font-medium">{formatCurrency(selectedDrug.retail_price)}</div>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Expiry Date:</span>
                  <div className="font-medium">{format(new Date(selectedDrug.expiry_date), 'MMMM d, yyyy')}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Lot Number:</span>
                  <div className="font-mono">{selectedDrug.lot_number}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <div>{selectedDrug.location}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Supplier:</span>
                  <div>{selectedDrug.supplier_name}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDrug(null)}>Close</Button>
            <Button>Edit Drug</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
