'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { Progress } from '@/components/ui/progress';
import {
  Mail, Send, Users, BarChart3, Plus, Play, Pause, Clock,
  MousePointer, Eye, TrendingUp, Target, Zap, Edit, Copy,
  Trash2, Calendar, MessageSquare, Share2, Globe, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  subject?: string;
  audience_size: number;
  sent: number;
  opened: number;
  clicked: number;
  scheduled_date?: string;
  created_at: string;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  status: 'active' | 'paused' | 'draft';
  emails_sent: number;
  conversion_rate: number;
}

interface ContactList {
  id: string;
  name: string;
  count: number;
  tags: string[];
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  running: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-purple-100 text-purple-700',
  active: 'bg-green-100 text-green-700',
};

// Demo data
const demoCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'February Newsletter',
    type: 'email',
    status: 'completed',
    subject: 'Your February Update is Here! 📬',
    audience_size: 5420,
    sent: 5420,
    opened: 2847,
    clicked: 892,
    created_at: '2026-02-01',
  },
  {
    id: 'c2',
    name: 'Product Launch Announcement',
    type: 'email',
    status: 'running',
    subject: 'Introducing Our Latest Innovation 🚀',
    audience_size: 3200,
    sent: 1850,
    opened: 945,
    clicked: 312,
    created_at: '2026-02-15',
  },
  {
    id: 'c3',
    name: 'Spring Sale Promo',
    type: 'email',
    status: 'scheduled',
    subject: '🌸 Spring Sale - Up to 50% Off!',
    audience_size: 8500,
    sent: 0,
    opened: 0,
    clicked: 0,
    scheduled_date: '2026-03-01',
    created_at: '2026-02-16',
  },
];

const demoAutomations: Automation[] = [
  { id: 'a1', name: 'Welcome Series', trigger: 'New subscriber', status: 'active', emails_sent: 1234, conversion_rate: 28.5 },
  { id: 'a2', name: 'Abandoned Cart', trigger: 'Cart abandoned > 1 hour', status: 'active', emails_sent: 567, conversion_rate: 15.2 },
  { id: 'a3', name: 'Re-engagement', trigger: 'No activity > 30 days', status: 'paused', emails_sent: 890, conversion_rate: 8.7 },
  { id: 'a4', name: 'Birthday Discount', trigger: 'Birthday', status: 'active', emails_sent: 234, conversion_rate: 42.1 },
];

const demoLists: ContactList[] = [
  { id: 'l1', name: 'All Subscribers', count: 12450, tags: ['all'], created_at: '2025-01-01' },
  { id: 'l2', name: 'Active Customers', count: 5420, tags: ['customer', 'active'], created_at: '2025-06-15' },
  { id: 'l3', name: 'Newsletter Subscribers', count: 8900, tags: ['newsletter'], created_at: '2025-03-10' },
  { id: 'l4', name: 'VIP Customers', count: 342, tags: ['vip', 'high-value'], created_at: '2025-09-01' },
];

export default function MarketingPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>(demoCampaigns);
  const [automations, setAutomations] = useState<Automation[]>(demoAutomations);
  const [lists, setLists] = useState<ContactList[]>(demoLists);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  // Calculate stats
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked, 0);
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
  const avgClickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0';

  const toggleAutomation = (id: string) => {
    setAutomations(automations.map(a =>
      a.id === id
        ? { ...a, status: a.status === 'active' ? 'paused' : 'active' }
        : a
    ));
    toast({ title: 'Automation updated' });
  };

  const duplicateCampaign = (campaign: Campaign) => {
    const newCampaign = {
      ...campaign,
      id: `c${Date.now()}`,
      name: `${campaign.name} (Copy)`,
      status: 'draft' as const,
      sent: 0,
      opened: 0,
      clicked: 0,
      created_at: new Date().toISOString(),
    };
    setCampaigns([newCampaign, ...campaigns]);
    toast({ title: 'Campaign duplicated' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Marketing
          </h1>
          <p className="text-muted-foreground">Email campaigns, automations, and audience management</p>
        </div>
        <Button onClick={() => setShowNewCampaign(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Emails Sent</div>
                <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Open Rate</div>
                <div className="text-2xl font-bold text-green-600">{avgOpenRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <MousePointer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Click Rate</div>
                <div className="text-2xl font-bold text-purple-600">{avgClickRate}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Automations</div>
                <div className="text-2xl font-bold">{automations.filter(a => a.status === 'active').length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Contacts</div>
                <div className="text-2xl font-bold">{lists[0].count.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="lists">Contact Lists</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Campaigns */}
        <TabsContent value="campaigns">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Open Rate</TableHead>
                  <TableHead>Click Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(campaign => {
                  const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : '0';
                  const clickRate = campaign.opened > 0 ? ((campaign.clicked / campaign.opened) * 100).toFixed(1) : '0';
                  
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
                      </TableCell>
                      <TableCell>{campaign.audience_size.toLocaleString()}</TableCell>
                      <TableCell>
                        {campaign.sent > 0 ? (
                          <div className="flex items-center gap-2">
                            <Progress value={(campaign.sent / campaign.audience_size) * 100} className="w-16 h-2" />
                            <span className="text-sm">{campaign.sent.toLocaleString()}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn('font-medium', parseFloat(openRate) > 20 ? 'text-green-600' : '')}>
                          {openRate}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('font-medium', parseFloat(clickRate) > 3 ? 'text-green-600' : '')}>
                          {clickRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => duplicateCampaign(campaign)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Automations */}
        <TabsContent value="automations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map(auto => (
              <Card key={auto.id} className={cn(auto.status === 'paused' && 'opacity-60')}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        auto.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                      )}>
                        <Zap className={cn(
                          'h-5 w-5',
                          auto.status === 'active' ? 'text-green-600' : 'text-gray-600'
                        )} />
                      </div>
                      <div>
                        <div className="font-medium">{auto.name}</div>
                        <div className="text-sm text-muted-foreground">{auto.trigger}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={auto.status === 'active' ? 'outline' : 'default'}
                      onClick={() => toggleAutomation(auto.id)}
                    >
                      {auto.status === 'active' ? (
                        <><Pause className="h-4 w-4 mr-1" /> Pause</>
                      ) : (
                        <><Play className="h-4 w-4 mr-1" /> Activate</>
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Emails Sent:</span>
                      <span className="ml-2 font-medium">{auto.emails_sent.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Conversion:</span>
                      <span className="ml-2 font-medium text-green-600">{auto.conversion_rate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contact Lists */}
        <TabsContent value="lists">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lists.map(list => (
              <Card key={list.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-medium">{list.name}</div>
                      <div className="text-2xl font-bold">{list.count.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {list.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed hover:shadow-md transition-shadow cursor-pointer flex items-center justify-center min-h-[150px]">
              <CardContent className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Create List</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Welcome Email', 'Newsletter', 'Promotional', 'Follow-up', 'Thank You', 'Survey Request'].map((name, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-4 flex items-center justify-center">
                    <Mail className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{name}</div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed hover:shadow-md transition-shadow cursor-pointer flex items-center justify-center">
              <CardContent className="text-center py-12">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Create Template</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Campaign Dialog */}
      <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input placeholder="e.g., March Newsletter" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select defaultValue="email">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Campaign</SelectItem>
                  <SelectItem value="sms">SMS Campaign</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input placeholder="e.g., Your March Update is Here! 📬" />
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact list..." />
                </SelectTrigger>
                <SelectContent>
                  {lists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.count.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCampaign(false)}>Cancel</Button>
            <Button>Create Campaign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
