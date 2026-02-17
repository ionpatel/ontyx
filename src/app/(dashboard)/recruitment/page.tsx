'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as recruitmentService from '@/services/recruitment';
import type { JobPosting, JobApplication } from '@/types/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Briefcase, Users, UserCheck, Clock, MapPin, DollarSign, Star } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const jobStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  open: 'bg-green-100 text-green-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
  filled: 'bg-blue-100 text-blue-700',
};

const stageColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  screening: 'bg-purple-100 text-purple-700',
  interview: 'bg-yellow-100 text-yellow-700',
  assessment: 'bg-orange-100 text-orange-700',
  offer: 'bg-cyan-100 text-cyan-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const formatSalary = (min?: number | null, max?: number | null, type?: string) => {
  if (!min && !max) return 'Not specified';
  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);
  const suffix = type === 'hourly' ? '/hr' : '/yr';
  if (min && max) return `${fmt(min)} - ${fmt(max)}${suffix}`;
  if (min) return `From ${fmt(min)}${suffix}`;
  return `Up to ${fmt(max!)}${suffix}`;
};

export default function RecruitmentPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState({ open_positions: 0, total_applications: 0, by_stage: {} as Record<string, number>, avg_time_to_hire: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('positions');
  const [showNewJob, setShowNewJob] = useState(false);
  const [selectedPosting, setSelectedPosting] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [remoteOption, setRemoteOption] = useState('onsite');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [postingsData, appsData, statsData] = await Promise.all([
        recruitmentService.getJobPostings(organizationId),
        recruitmentService.getJobApplications(organizationId, { jobPostingId: selectedPosting || undefined }),
        recruitmentService.getRecruitmentStats(organizationId),
      ]);
      setPostings(postingsData);
      setApplications(appsData);
      setStats(statsData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedPosting, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateJob = async () => {
    if (!organizationId || !title) return;
    setIsSubmitting(true);
    try {
      await recruitmentService.createJobPosting(organizationId, {
        title,
        description: description || undefined,
        salary_min: salaryMin ? parseFloat(salaryMin) : undefined,
        salary_max: salaryMax ? parseFloat(salaryMax) : undefined,
        employment_type: employmentType as any,
        remote_option: remoteOption as any,
        location: location || undefined,
      });
      toast({ title: 'Job Posted' });
      setShowNewJob(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (postingId: string) => {
    try {
      await recruitmentService.publishJobPosting(postingId);
      toast({ title: 'Job Published' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleMoveStage = async (applicationId: string, stage: JobApplication['stage']) => {
    try {
      await recruitmentService.moveToStage(applicationId, stage);
      toast({ title: 'Stage Updated' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setSalaryMin(''); setSalaryMax(''); setEmploymentType('full_time'); setRemoteOption('onsite'); setLocation('');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recruitment</h1>
          <p className="text-muted-foreground">Manage job postings and applications</p>
        </div>
        <Button onClick={() => setShowNewJob(true)}>
          <Plus className="h-4 w-4 mr-2" /> Post Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><Briefcase className="h-5 w-5 text-green-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Open Positions</div>
                <div className="text-2xl font-bold">{stats.open_positions}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><Users className="h-5 w-5 text-blue-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
                <div className="text-2xl font-bold">{stats.total_applications}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100"><Clock className="h-5 w-5 text-yellow-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">In Interview</div>
                <div className="text-2xl font-bold">{stats.by_stage?.interview || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100"><UserCheck className="h-5 w-5 text-purple-600" /></div>
              <div>
                <div className="text-sm text-muted-foreground">Hired</div>
                <div className="text-2xl font-bold text-green-600">{stats.by_stage?.hired || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="positions">Job Positions</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : postings.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground"><Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No job postings</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {postings.map(job => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription>{job.department?.name}</CardDescription>
                      </div>
                      <Badge className={jobStatusColors[job.status]}>{job.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location || 'Not specified'} • {job.remote_option}</div>
                      <div className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> {formatSalary(job.salary_min, job.salary_max, job.salary_type)}</div>
                      <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {job.applications_count || 0} applications</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      {job.status === 'draft' && (
                        <Button size="sm" onClick={() => handlePublish(job.id)}>Publish</Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => { setSelectedPosting(job.id); setActiveTab('applications'); }}>View Applications</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {selectedPosting && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-muted-foreground">Filtering by:</span>
              <Badge variant="secondary">{postings.find(p => p.id === selectedPosting)?.title}</Badge>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPosting(null)}>Clear</Button>
            </div>
          )}
          {applications.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No applications</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <Card key={app.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold">
                          {app.applicant_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{app.applicant_name}</div>
                          <div className="text-sm text-muted-foreground">{app.applicant_email}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })} for {app.job_posting?.title}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {app.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>{app.rating}</span>
                          </div>
                        )}
                        <Badge className={stageColors[app.stage]}>{app.stage}</Badge>
                        <Select value={app.stage} onValueChange={(v) => handleMoveStage(app.id, v as any)}>
                          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="screening">Screening</SelectItem>
                            <SelectItem value="interview">Interview</SelectItem>
                            <SelectItem value="assessment">Assessment</SelectItem>
                            <SelectItem value="offer">Offer</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Pipeline view coming soon</CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* New Job Dialog */}
      <Dialog open={showNewJob} onOpenChange={setShowNewJob}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Post New Job</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Job Title *</label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><label className="text-sm font-medium">Description</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Min Salary</label><Input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} /></div>
              <div><label className="text-sm font-medium">Max Salary</label><Input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Remote</label>
                <Select value={remoteOption} onValueChange={setRemoteOption}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Location</label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewJob(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreateJob} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Job'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
