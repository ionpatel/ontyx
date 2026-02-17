'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Zap, Mail, Bell, FileText, Package, Clock, 
  Users, CheckCircle, AlertTriangle, Settings, Play, Pause, Trash2, Edit
} from 'lucide-react';

// Pre-built automation templates
const automationTemplates = [
  {
    id: 'invoice-reminder',
    name: 'Invoice Payment Reminder',
    description: 'Send email reminder when invoice is overdue',
    trigger: 'invoice_overdue',
    actions: [{ type: 'send_email', template: 'invoice_reminder' }],
    icon: Mail,
    category: 'finance',
  },
  {
    id: 'low-stock-alert',
    name: 'Low Stock Alert',
    description: 'Notify when product stock falls below reorder point',
    trigger: 'stock_low',
    actions: [{ type: 'send_notification', message: 'Low stock alert' }],
    icon: Package,
    category: 'inventory',
  },
  {
    id: 'sales-to-invoice',
    name: 'Auto-Create Invoice from Sale',
    description: 'Automatically generate invoice when sales order is confirmed',
    trigger: 'sales_order_confirmed',
    actions: [{ type: 'create_invoice' }],
    icon: FileText,
    category: 'sales',
  },
  {
    id: 'welcome-customer',
    name: 'Welcome New Customer',
    description: 'Send welcome email when new customer is created',
    trigger: 'contact_created',
    actions: [{ type: 'send_email', template: 'welcome_customer' }],
    icon: Users,
    category: 'crm',
  },
  {
    id: 'ticket-notify',
    name: 'New Ticket Notification',
    description: 'Notify team when support ticket is created',
    trigger: 'ticket_created',
    actions: [{ type: 'send_notification', message: 'New support ticket' }],
    icon: Bell,
    category: 'helpdesk',
  },
  {
    id: 'leave-approval',
    name: 'Leave Request Submitted',
    description: 'Notify manager when leave request needs approval',
    trigger: 'leave_requested',
    actions: [{ type: 'send_notification', message: 'Leave request pending' }],
    icon: Clock,
    category: 'hr',
  },
  {
    id: 'quality-fail-alert',
    name: 'Quality Check Failed',
    description: 'Alert when quality inspection fails',
    trigger: 'quality_check_failed',
    actions: [{ type: 'send_notification' }, { type: 'create_task' }],
    icon: AlertTriangle,
    category: 'operations',
  },
  {
    id: 'subscription-expiring',
    name: 'Subscription Expiring Soon',
    description: 'Remind customer before subscription expires',
    trigger: 'subscription_expiring',
    actions: [{ type: 'send_email', template: 'subscription_renewal' }],
    icon: Clock,
    category: 'subscriptions',
  },
];

const triggerOptions = [
  { value: 'invoice_created', label: 'Invoice Created', category: 'Finance' },
  { value: 'invoice_overdue', label: 'Invoice Overdue', category: 'Finance' },
  { value: 'invoice_paid', label: 'Invoice Paid', category: 'Finance' },
  { value: 'sales_order_confirmed', label: 'Sales Order Confirmed', category: 'Sales' },
  { value: 'sales_order_shipped', label: 'Sales Order Shipped', category: 'Sales' },
  { value: 'stock_low', label: 'Stock Low', category: 'Inventory' },
  { value: 'stock_out', label: 'Stock Out', category: 'Inventory' },
  { value: 'contact_created', label: 'Contact Created', category: 'CRM' },
  { value: 'ticket_created', label: 'Ticket Created', category: 'Helpdesk' },
  { value: 'ticket_resolved', label: 'Ticket Resolved', category: 'Helpdesk' },
  { value: 'leave_requested', label: 'Leave Requested', category: 'HR' },
  { value: 'leave_approved', label: 'Leave Approved', category: 'HR' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled', category: 'Services' },
  { value: 'subscription_expiring', label: 'Subscription Expiring', category: 'Subscriptions' },
  { value: 'quality_check_failed', label: 'Quality Check Failed', category: 'Operations' },
  { value: 'approval_needed', label: 'Approval Needed', category: 'Workflow' },
];

const actionOptions = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'create_invoice', label: 'Create Invoice' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_record', label: 'Update Record' },
  { value: 'webhook', label: 'Call Webhook' },
];

interface Automation {
  id: string;
  name: string;
  trigger: string;
  actions: any[];
  enabled: boolean;
  created_at: string;
}

export default function AutomationsPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  
  // Form state
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('');
  const [actionType, setActionType] = useState('');
  const [actionConfig, setActionConfig] = useState('');
  const [editing, setEditing] = useState<Automation | null>(null);

  const supabase = createClient();

  const fetchAutomations = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      setAutomations(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetchAutomations(); }, [fetchAutomations]);

  const handleSave = async () => {
    if (!organizationId || !name || !trigger || !actionType) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      const data = {
        organization_id: organizationId,
        name,
        trigger,
        actions: [{ type: actionType, config: actionConfig ? JSON.parse(actionConfig) : {} }],
        enabled: true,
      };

      if (editing) {
        await supabase.from('automation_rules').update(data).eq('id', editing.id);
        toast({ title: 'Automation Updated' });
      } else {
        await supabase.from('automation_rules').insert(data);
        toast({ title: 'Automation Created' });
      }

      setShowDialog(false);
      resetForm();
      fetchAutomations();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save automation', variant: 'destructive' });
    }
  };

  const handleToggle = async (automation: Automation) => {
    try {
      await supabase
        .from('automation_rules')
        .update({ enabled: !automation.enabled })
        .eq('id', automation.id);
      fetchAutomations();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to toggle automation', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this automation?')) return;
    try {
      await supabase.from('automation_rules').delete().eq('id', id);
      toast({ title: 'Automation Deleted' });
      fetchAutomations();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleUseTemplate = (template: typeof automationTemplates[0]) => {
    setName(template.name);
    setTrigger(template.trigger);
    setActionType(template.actions[0].type);
    setShowDialog(true);
  };

  const resetForm = () => {
    setName('');
    setTrigger('');
    setActionType('');
    setActionConfig('');
    setEditing(null);
  };

  const activeAutomations = automations.filter(a => a.enabled);
  const inactiveAutomations = automations.filter(a => !a.enabled);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Automations
          </h1>
          <p className="text-muted-foreground">
            Automate repetitive tasks and connect your business processes
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Create Automation
        </Button>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Templates</CardTitle>
          <CardDescription>Pre-built automations to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {automationTemplates.slice(0, 4).map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleUseTemplate(template)}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <template.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Automations */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeAutomations.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({inactiveAutomations.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            All Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeAutomations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active automations</p>
                <p className="text-sm">Create one or use a template above</p>
              </CardContent>
            </Card>
          ) : (
            activeAutomations.map(automation => (
              <Card key={automation.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Play className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{automation.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{automation.trigger.replace('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          {automation.actions.map((action: any, i: number) => (
                            <Badge key={i} variant="secondary">{action.type.replace('_', ' ')}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={automation.enabled} onCheckedChange={() => handleToggle(automation)} />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(automation.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          {inactiveAutomations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No inactive automations</p>
              </CardContent>
            </Card>
          ) : (
            inactiveAutomations.map(automation => (
              <Card key={automation.id} className="opacity-60">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Pause className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{automation.name}</h4>
                        <Badge variant="outline">{automation.trigger.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={automation.enabled} onCheckedChange={() => handleToggle(automation)} />
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(automation.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automationTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <template.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{template.trigger.replace('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">→</span>
                          {template.actions.map((action: any, i: number) => (
                            <Badge key={i} variant="secondary">{action.type.replace('_', ' ')}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleUseTemplate(template)}>
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Automation' : 'Create Automation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g., Send invoice reminder" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>When this happens (Trigger)</Label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                <SelectContent>
                  {triggerOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{opt.label}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{opt.category}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Do this (Action)</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger><SelectValue placeholder="Select action..." /></SelectTrigger>
                <SelectContent>
                  {actionOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {actionType && (
              <div className="space-y-2">
                <Label>Configuration (JSON)</Label>
                <Textarea 
                  value={actionConfig} 
                  onChange={(e) => setActionConfig(e.target.value)}
                  placeholder='{"template": "invoice_reminder"}'
                  className="font-mono text-sm"
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editing ? 'Update' : 'Create'} Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
