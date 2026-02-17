'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  UtensilsCrossed, Users, Clock, DollarSign, Plus, Minus,
  ChefHat, Bell, CreditCard, Printer, Trash2, MoveRight,
  ArrowLeft, Settings, LayoutGrid, List
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Table {
  id: string;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  floor_id: string;
  position_x: number;
  position_y: number;
  shape: 'square' | 'round' | 'rectangle';
  current_order_id?: string;
  guests?: number;
}

interface Floor {
  id: string;
  name: string;
  tables: Table[];
}

interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  course: 'appetizer' | 'main' | 'dessert' | 'drink';
}

interface TableOrder {
  id: string;
  table_id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'open' | 'paid' | 'cancelled';
  guests: number;
  opened_at: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

const tableStatusColors: Record<string, string> = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-yellow-500',
  cleaning: 'bg-blue-500',
};

const courseColors: Record<string, string> = {
  appetizer: 'bg-orange-100 text-orange-700',
  main: 'bg-blue-100 text-blue-700',
  dessert: 'bg-pink-100 text-pink-700',
  drink: 'bg-purple-100 text-purple-700',
};

// Demo data
const demoFloors: Floor[] = [
  {
    id: '1',
    name: 'Main Floor',
    tables: [
      { id: 't1', number: '1', seats: 2, status: 'available', floor_id: '1', position_x: 50, position_y: 50, shape: 'square' },
      { id: 't2', number: '2', seats: 4, status: 'occupied', floor_id: '1', position_x: 150, position_y: 50, shape: 'square', guests: 3 },
      { id: 't3', number: '3', seats: 4, status: 'available', floor_id: '1', position_x: 250, position_y: 50, shape: 'round' },
      { id: 't4', number: '4', seats: 6, status: 'reserved', floor_id: '1', position_x: 50, position_y: 150, shape: 'rectangle' },
      { id: 't5', number: '5', seats: 2, status: 'cleaning', floor_id: '1', position_x: 150, position_y: 150, shape: 'square' },
      { id: 't6', number: '6', seats: 8, status: 'available', floor_id: '1', position_x: 250, position_y: 150, shape: 'rectangle' },
    ],
  },
  {
    id: '2',
    name: 'Patio',
    tables: [
      { id: 't7', number: 'P1', seats: 4, status: 'available', floor_id: '2', position_x: 50, position_y: 50, shape: 'round' },
      { id: 't8', number: 'P2', seats: 4, status: 'occupied', floor_id: '2', position_x: 150, position_y: 50, shape: 'round', guests: 4 },
    ],
  },
];

const menuCategories = [
  { id: 'appetizers', name: 'Appetizers', course: 'appetizer' },
  { id: 'mains', name: 'Main Courses', course: 'main' },
  { id: 'desserts', name: 'Desserts', course: 'dessert' },
  { id: 'drinks', name: 'Drinks', course: 'drink' },
];

const menuItems = [
  { id: 'm1', name: 'Caesar Salad', price: 12.99, category: 'appetizers', course: 'appetizer' },
  { id: 'm2', name: 'Soup of the Day', price: 8.99, category: 'appetizers', course: 'appetizer' },
  { id: 'm3', name: 'Bruschetta', price: 10.99, category: 'appetizers', course: 'appetizer' },
  { id: 'm4', name: 'Grilled Salmon', price: 28.99, category: 'mains', course: 'main' },
  { id: 'm5', name: 'Ribeye Steak', price: 42.99, category: 'mains', course: 'main' },
  { id: 'm6', name: 'Pasta Primavera', price: 19.99, category: 'mains', course: 'main' },
  { id: 'm7', name: 'Chicken Parmesan', price: 24.99, category: 'mains', course: 'main' },
  { id: 'm8', name: 'Tiramisu', price: 9.99, category: 'desserts', course: 'dessert' },
  { id: 'm9', name: 'Cheesecake', price: 8.99, category: 'desserts', course: 'dessert' },
  { id: 'm10', name: 'Coffee', price: 3.99, category: 'drinks', course: 'drink' },
  { id: 'm11', name: 'Wine Glass', price: 12.99, category: 'drinks', course: 'drink' },
  { id: 'm12', name: 'Beer', price: 7.99, category: 'drinks', course: 'drink' },
];

export default function POSRestaurantPage() {
  const router = useRouter();
  const { organizationId } = useAuth();
  const { toast } = useToast();
  
  const [floors, setFloors] = useState<Floor[]>(demoFloors);
  const [activeFloor, setActiveFloor] = useState(floors[0]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [activeCategory, setActiveCategory] = useState('appetizers');
  const [guestCount, setGuestCount] = useState(2);
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [tableToOpen, setTableToOpen] = useState<Table | null>(null);

  const handleTableClick = (table: Table) => {
    if (table.status === 'available') {
      setTableToOpen(table);
      setShowGuestDialog(true);
    } else if (table.status === 'occupied') {
      setSelectedTable(table);
      // Load existing order (demo)
      setCurrentOrder([
        { id: '1', product_id: 'm1', name: 'Caesar Salad', quantity: 2, unit_price: 12.99, status: 'served', course: 'appetizer' },
        { id: '2', product_id: 'm4', name: 'Grilled Salmon', quantity: 1, unit_price: 28.99, status: 'preparing', course: 'main' },
      ]);
    }
  };

  const openTable = () => {
    if (!tableToOpen) return;
    
    const updatedFloors = floors.map(floor => ({
      ...floor,
      tables: floor.tables.map(t => 
        t.id === tableToOpen.id 
          ? { ...t, status: 'occupied' as const, guests: guestCount }
          : t
      ),
    }));
    setFloors(updatedFloors);
    setActiveFloor(updatedFloors.find(f => f.id === activeFloor.id) || updatedFloors[0]);
    
    const openedTable = updatedFloors
      .flatMap(f => f.tables)
      .find(t => t.id === tableToOpen.id);
    
    setSelectedTable(openedTable || null);
    setCurrentOrder([]);
    setShowGuestDialog(false);
    setTableToOpen(null);
    toast({ title: `Table ${tableToOpen.number} opened`, description: `${guestCount} guests` });
  };

  const addItem = (item: typeof menuItems[0]) => {
    const existing = currentOrder.find(o => o.product_id === item.id);
    if (existing) {
      setCurrentOrder(currentOrder.map(o =>
        o.product_id === item.id ? { ...o, quantity: o.quantity + 1 } : o
      ));
    } else {
      setCurrentOrder([
        ...currentOrder,
        {
          id: `order-${Date.now()}`,
          product_id: item.id,
          name: item.name,
          quantity: 1,
          unit_price: item.price,
          status: 'pending',
          course: item.course as OrderItem['course'],
        },
      ]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCurrentOrder(currentOrder.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (itemId: string) => {
    setCurrentOrder(currentOrder.filter(item => item.id !== itemId));
  };

  const sendToKitchen = () => {
    setCurrentOrder(currentOrder.map(item => 
      item.status === 'pending' ? { ...item, status: 'preparing' } : item
    ));
    toast({ title: 'Order sent to kitchen', description: `${currentOrder.filter(i => i.status === 'pending').length} items` });
  };

  const closeTable = () => {
    if (!selectedTable) return;
    
    const updatedFloors = floors.map(floor => ({
      ...floor,
      tables: floor.tables.map(t =>
        t.id === selectedTable.id
          ? { ...t, status: 'cleaning' as const, guests: undefined }
          : t
      ),
    }));
    setFloors(updatedFloors);
    setActiveFloor(updatedFloors.find(f => f.id === activeFloor.id) || updatedFloors[0]);
    setSelectedTable(null);
    setCurrentOrder([]);
    setShowPayment(false);
    toast({ title: 'Table closed', description: 'Payment received' });
  };

  const subtotal = currentOrder.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const tax = subtotal * 0.13; // 13% HST
  const total = subtotal + tax;

  const pendingItems = currentOrder.filter(i => i.status === 'pending');

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Left: Floor Plan */}
      <div className="flex-1 flex flex-col border-r">
        {/* Floor Tabs */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/pos')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Restaurant
            </h1>
          </div>
          <div className="flex gap-2">
            {floors.map(floor => (
              <Button
                key={floor.id}
                variant={activeFloor.id === floor.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFloor(floor)}
              >
                {floor.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Floor Plan Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeFloor.tables.map(table => (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all hover:scale-105',
                  table.shape === 'round' && 'rounded-full',
                  table.status === 'available' && 'border-green-300 bg-green-50 hover:bg-green-100',
                  table.status === 'occupied' && 'border-red-300 bg-red-50 hover:bg-red-100',
                  table.status === 'reserved' && 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100',
                  table.status === 'cleaning' && 'border-blue-300 bg-blue-50 hover:bg-blue-100',
                  selectedTable?.id === table.id && 'ring-2 ring-primary'
                )}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold">{table.number}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    {table.guests || table.seats}
                  </div>
                </div>
                <div className={cn(
                  'absolute -top-1 -right-1 w-3 h-3 rounded-full',
                  tableStatusColors[table.status]
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="p-4 border-t flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Cleaning</span>
          </div>
        </div>
      </div>

      {/* Right: Order Panel */}
      {selectedTable ? (
        <div className="w-[500px] flex flex-col bg-muted/30">
          {/* Table Header */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Table {selectedTable.number}</h2>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {selectedTable.guests || 0} guests
                  <Clock className="h-4 w-4 ml-2" />
                  45 min
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedTable(null)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Menu Categories */}
          <div className="flex gap-2 p-2 overflow-x-auto border-b bg-background">
            {menuCategories.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Menu Items */}
          <ScrollArea className="flex-1">
            <div className="p-2 grid grid-cols-2 gap-2">
              {menuItems
                .filter(item => item.category === activeCategory)
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="p-3 rounded-lg border bg-background hover:bg-muted transition-colors text-left"
                  >
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-primary font-bold">{formatCurrency(item.price)}</div>
                  </button>
                ))}
            </div>
          </ScrollArea>

          {/* Current Order */}
          <div className="border-t bg-background">
            <div className="p-2 max-h-[200px] overflow-y-auto">
              {currentOrder.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No items yet
                </div>
              ) : (
                <div className="space-y-2">
                  {currentOrder.map(item => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <Badge className={courseColors[item.course]} variant="secondary">
                        {item.course[0].toUpperCase()}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.unit_price)} × {item.quantity}
                        </div>
                      </div>
                      {item.status !== 'pending' && (
                        <Badge variant={item.status === 'served' ? 'default' : 'secondary'} className="text-xs">
                          {item.status}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="p-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>HST (13%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={sendToKitchen}
                disabled={pendingItems.length === 0}
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Kitchen ({pendingItems.length})
              </Button>
              <Button
                onClick={() => setShowPayment(true)}
                disabled={currentOrder.length === 0}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-[400px] flex items-center justify-center bg-muted/30">
          <div className="text-center text-muted-foreground">
            <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Select a table</p>
            <p className="text-sm">Click on a table to view or start an order</p>
          </div>
        </div>
      )}

      {/* Guest Count Dialog */}
      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open Table {tableToOpen?.number}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Number of Guests</label>
            <div className="flex items-center gap-4 mt-2">
              <Button variant="outline" size="icon" onClick={() => setGuestCount(Math.max(1, guestCount - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-3xl font-bold w-16 text-center">{guestCount}</span>
              <Button variant="outline" size="icon" onClick={() => setGuestCount(guestCount + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGuestDialog(false)}>Cancel</Button>
            <Button onClick={openTable}>Open Table</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment - Table {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{formatCurrency(total)}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {currentOrder.length} items • {selectedTable?.guests} guests
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-20" onClick={closeTable}>
                <div className="text-center">
                  <DollarSign className="h-6 w-6 mx-auto mb-1" />
                  <span>Cash</span>
                </div>
              </Button>
              <Button variant="outline" className="h-20" onClick={closeTable}>
                <div className="text-center">
                  <CreditCard className="h-6 w-6 mx-auto mb-1" />
                  <span>Card</span>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
