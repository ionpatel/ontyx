'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare, Send, Clock, Phone, Mail, Calendar,
  CheckCircle, User, FileText, Edit, Trash2, MoreVertical
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatterProps {
  entityType: string; // 'contact' | 'invoice' | 'ticket' | etc.
  entityId: string;
  entityName?: string;
}

interface Message {
  id: string;
  type: 'note' | 'activity' | 'system';
  content: string;
  activity_type?: string;
  due_date?: string;
  is_done?: boolean;
  created_by: string;
  created_at: string;
  user?: { full_name: string; email: string };
}

const activityTypes = [
  { value: 'call', label: 'Call', icon: Phone, color: 'text-blue-500' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-green-500' },
  { value: 'meeting', label: 'Meeting', icon: Calendar, color: 'text-purple-500' },
  { value: 'todo', label: 'To-Do', icon: CheckCircle, color: 'text-orange-500' },
  { value: 'note', label: 'Note', icon: FileText, color: 'text-gray-500' },
];

export function Chatter({ entityType, entityId, entityName }: ChatterProps) {
  const { user, organizationId } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [activityType, setActivityType] = useState('call');
  const [activityNote, setActivityNote] = useState('');
  const [activityDueDate, setActivityDueDate] = useState('');

  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('chatter_messages')
        .select(`
          *,
          user:users(full_name, email)
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      setMessages(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, supabase]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    try {
      await supabase.from('chatter_messages').insert({
        organization_id: organizationId,
        entity_type: entityType,
        entity_id: entityId,
        type: 'note',
        content: newMessage,
        created_by: user.id,
      });
      setNewMessage('');
      fetchMessages();
      toast({ title: 'Note added' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const scheduleActivity = async () => {
    if (!activityNote.trim() || !user) return;
    setSending(true);
    try {
      await supabase.from('chatter_messages').insert({
        organization_id: organizationId,
        entity_type: entityType,
        entity_id: entityId,
        type: 'activity',
        content: activityNote,
        activity_type: activityType,
        due_date: activityDueDate || null,
        is_done: false,
        created_by: user.id,
      });
      setShowActivityDialog(false);
      setActivityNote('');
      setActivityDueDate('');
      fetchMessages();
      toast({ title: 'Activity scheduled' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to schedule activity', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const markActivityDone = async (messageId: string) => {
    try {
      await supabase
        .from('chatter_messages')
        .update({ is_done: true })
        .eq('id', messageId);
      fetchMessages();
      toast({ title: 'Activity completed' });
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await supabase.from('chatter_messages').delete().eq('id', messageId);
      fetchMessages();
      toast({ title: 'Deleted' });
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return '?';
  };

  const pendingActivities = messages.filter(m => m.type === 'activity' && !m.is_done);

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h3 className="font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chatter
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowActivityDialog(true)}>
          <Clock className="h-4 w-4 mr-1" />
          Schedule Activity
        </Button>
      </div>

      {/* Pending Activities Alert */}
      {pendingActivities.length > 0 && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{pendingActivities.length} pending activit{pendingActivities.length === 1 ? 'y' : 'ies'}</span>
          </div>
        </div>
      )}

      {/* New Message Input */}
      <div className="p-4 border-b">
        <div className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(user?.user_metadata?.full_name, user?.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Leave a note..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                Press ⌘+Enter to send
              </span>
              <Button size="sm" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4 mr-1" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map((message) => {
              const activityConfig = activityTypes.find(a => a.value === message.activity_type);
              const ActivityIcon = activityConfig?.icon || MessageSquare;

              return (
                <div key={message.id} className={cn(
                  'px-4 py-3 hover:bg-muted/30 transition-colors',
                  message.type === 'activity' && !message.is_done && 'bg-yellow-50/50'
                )}>
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(message.user?.full_name, message.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {message.user?.full_name || message.user?.email || 'Unknown'}
                          </span>
                          {message.type === 'activity' && (
                            <Badge variant="outline" className={cn('text-xs', activityConfig?.color)}>
                              <ActivityIcon className="h-3 w-3 mr-1" />
                              {activityConfig?.label}
                            </Badge>
                          )}
                          {message.is_done && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {message.type === 'activity' && !message.is_done && (
                                <DropdownMenuItem onClick={() => markActivityDone(message.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Done
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => deleteMessage(message.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{message.content}</p>
                      {message.due_date && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due: {format(new Date(message.due_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Activity Dialog */}
      <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Activity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className={cn('h-4 w-4', type.color)} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input
                type="date"
                value={activityDueDate}
                onChange={(e) => setActivityDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                placeholder="What needs to be done?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivityDialog(false)}>Cancel</Button>
            <Button onClick={scheduleActivity} disabled={sending || !activityNote.trim()}>
              {sending ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
