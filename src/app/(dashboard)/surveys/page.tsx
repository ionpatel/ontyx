'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as surveysService from '@/services/surveys';
import type { Survey } from '@/types/surveys';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ClipboardList, Users, BarChart3, Play, Square, Eye, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

export default function SurveysPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewSurvey, setShowNewSurvey] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const surveysData = await surveysService.getSurveys(organizationId);
      setSurveys(surveysData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load surveys', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!organizationId || !title) return;
    setIsSubmitting(true);
    try {
      await surveysService.createSurvey(organizationId, {
        title,
        description: description || undefined,
        questions: [],
        is_anonymous: isAnonymous,
      });
      toast({ title: 'Survey Created', description: 'Add questions to complete your survey' });
      setShowNewSurvey(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (surveyId: string) => {
    try {
      await surveysService.publishSurvey(surveyId);
      toast({ title: 'Survey Published' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleClose = async (surveyId: string) => {
    try {
      await surveysService.closeSurvey(surveyId);
      toast({ title: 'Survey Closed' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setIsAnonymous(false);
  };

  const draftSurveys = surveys.filter(s => s.status === 'draft');
  const activeSurveys = surveys.filter(s => s.status === 'active');
  const closedSurveys = surveys.filter(s => s.status === 'closed');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Surveys</h1>
          <p className="text-muted-foreground">Create and manage surveys</p>
        </div>
        <Button onClick={() => setShowNewSurvey(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Survey
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><ClipboardList className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Total Surveys</div>
                <div className="text-2xl font-bold">{surveys.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><Play className="h-5 w-5 text-green-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold text-green-600">{activeSurveys.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100"><Users className="h-5 w-5 text-purple-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Total Responses</div>
                <div className="text-2xl font-bold">{surveys.reduce((sum, s) => sum + (s.response_count || 0), 0)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Surveys List */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : surveys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No surveys yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeSurveys.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Active Surveys</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSurveys.map(survey => (
                  <Card key={survey.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{survey.title}</CardTitle>
                          <CardDescription>{survey.description}</CardDescription>
                        </div>
                        <Badge className={statusColors[survey.status]}>{survey.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>{survey.questions.length} questions</span>
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {survey.response_count || 0} responses</span>
                        {survey.is_anonymous && <Badge variant="outline">Anonymous</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" /> Results</Button>
                        <Button size="sm" variant="outline" onClick={() => handleClose(survey.id)}><Square className="h-4 w-4 mr-1" /> Close</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {draftSurveys.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Drafts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draftSurveys.map(survey => (
                  <Card key={survey.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{survey.title}</CardTitle>
                        <Badge className={statusColors[survey.status]}>{survey.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">{survey.questions.length} questions</div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handlePublish(survey.id)}><Play className="h-4 w-4 mr-1" /> Publish</Button>
                        <Button size="sm" variant="outline">Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {closedSurveys.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Closed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closedSurveys.map(survey => (
                  <Card key={survey.id} className="opacity-75">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{survey.title}</CardTitle>
                        <Badge className={statusColors[survey.status]}>{survey.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{survey.response_count || 0} responses</span>
                      </div>
                      <Button size="sm" variant="outline" className="mt-3"><BarChart3 className="h-4 w-4 mr-1" /> View Results</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Survey Dialog */}
      <Dialog open={showNewSurvey} onOpenChange={setShowNewSurvey}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Survey</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Title *</label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Description</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="anonymous" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
              <label htmlFor="anonymous" className="text-sm">Anonymous responses</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewSurvey(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Survey'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
