'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase, Users, UserPlus, Calendar, Mail, Phone, MapPin,
  Plus, Search, Star, Clock, CheckCircle, XCircle, ArrowRight,
  Building, DollarSign, Eye, MessageSquare, FileText, Filter,
  ChevronRight, GripVertical, Link2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_min?: number;
  salary_max?: number;
  status: 'draft' | 'open' | 'paused' | 'closed';
  applicants_count: number;
  new_applicants: number;
  posted_date?: string;
  closing_date?: string;
  description: string;
  requirements: string[];
  published_to: string[];
}

interface Applicant {
  id: string;
  job_id: string;
  job_title: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  stage: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  rating: number;
  source: string;
  applied_date: string;
  resume_url?: string;
  notes?: string;
  interviews?: { date: string; type: string; interviewer: string }[];
}

const stageColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  screening: 'bg-purple-100 text-purple-700',
  interview: 'bg-yellow-100 text-yellow-700',
  offer: 'bg-green-100 text-green-700',
  hired: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const stageLabels: Record<string, string> = {
  new: 'New',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  open: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-red-100 text-red-700',
};

// Demo data
const demoJobs: JobPosting[] = [
  {
    id: 'j1',
    title: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'Toronto, ON (Hybrid)',
    type: 'full-time',
    salary_min: 120000,
    salary_max: 160000,
    status: 'open',
    applicants_count: 45,
    new_applicants: 8,
    posted_date: '2026-01-15',
    closing_date: '2026-03-15',
    description: 'We are looking for a senior software engineer to join our growing team...',
    requirements: ['5+ years experience', 'React/Node.js', 'Cloud platforms'],
    published_to: ['LinkedIn', 'Indeed', 'Company Website'],
  },
  {
    id: 'j2',
    title: 'Product Manager',
    department: 'Product',
    location: 'Toronto, ON (Remote)',
    type: 'full-time',
    salary_min: 100000,
    salary_max: 130000,
    status: 'open',
    applicants_count: 28,
    new_applicants: 3,
    posted_date: '2026-02-01',
    closing_date: '2026-03-01',
    description: 'Lead product strategy and roadmap for our core platform...',
    requirements: ['3+ years PM experience', 'B2B SaaS', 'Technical background'],
    published_to: ['LinkedIn', 'AngelList'],
  },
  {
    id: 'j3',
    title: 'Marketing Coordinator',
    department: 'Marketing',
    location: 'Toronto, ON (On-site)',
    type: 'full-time',
    salary_min: 55000,
    salary_max: 70000,
    status: 'paused',
    applicants_count: 12,
    new_applicants: 0,
    posted_date: '2026-01-20',
    description: 'Support marketing campaigns and events...',
    requirements: ['1+ years experience', 'Social media', 'Content creation'],
    published_to: ['Indeed'],
  },
];

const demoApplicants: Applicant[] = [
  { id: 'a1', job_id: 'j1', job_title: 'Senior Software Engineer', name: 'Alex Chen', email: 'alex.chen@email.com', phone: '416-555-0101', location: 'Toronto, ON', stage: 'interview', rating: 5, source: 'LinkedIn', applied_date: '2026-02-10' },
  { id: 'a2', job_id: 'j1', job_title: 'Senior Software Engineer', name: 'Sarah Kim', email: 'sarah.kim@email.com', phone: '416-555-0102', location: 'Vancouver, BC', stage: 'screening', rating: 4, source: 'Indeed', applied_date: '2026-02-12' },
  { id: 'a3', job_id: 'j1', job_title: 'Senior Software Engineer', name: 'Michael Brown', email: 'm.brown@email.com', phone: '416-555-0103', location: 'Toronto, ON', stage: 'offer', rating: 5, source: 'Referral', applied_date: '2026-02-05' },
  { id: 'a4', job_id: 'j1', job_title: 'Senior Software Engineer', name: 'Emily Davis', email: 'emily.d@email.com', phone: '416-555-0104', location: 'Ottawa, ON', stage: 'new', rating: 3, source: 'Company Website', applied_date: '2026-02-15' },
  { id: 'a5', job_id: 'j2', job_title: 'Product Manager', name: 'James Wilson', email: 'j.wilson@email.com', phone: '416-555-0105', location: 'Toronto, ON', stage: 'interview', rating: 4, source: 'LinkedIn', applied_date: '2026-02-08' },
  { id: 'a6', job_id: 'j1', job_title: 'Senior Software Engineer', name: 'Lisa Park', email: 'lisa.p@email.com', phone: '416-555-0106', location: 'Montreal, QC', stage: 'rejected', rating: 2, source: 'Indeed', applied_date: '2026-02-01' },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(amount);

export default function RecruitmentPage() {
  const { organizationId } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>(demoJobs);
  const [applicants, setApplicants] = useState<Applicant[]>(demoApplicants);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showNewJob, setShowNewJob] = useState(false);
  const [filterJob, setFilterJob] = useState<string>('all');
  const [kanbanView, setKanbanView] = useState(true);

  const stats = {
    openJobs: jobs.filter(j => j.status === 'open').length,
    totalApplicants: applicants.length,
    newApplicants: applicants.filter(a => a.stage === 'new').length,
    inInterview: applicants.filter(a => a.stage === 'interview').length,
    pendingOffers: applicants.filter(a => a.stage === 'offer').length,
  };

  const filteredApplicants = filterJob === 'all' 
    ? applicants 
    : applicants.filter(a => a.job_id === filterJob);

  const stages: Applicant['stage'][] = ['new', 'screening', 'interview', 'offer', 'hired'];
  
  const moveApplicant = (applicantId: string, newStage: Applicant['stage']) => {
    setApplicants(applicants.map(a =>
      a.id === applicantId ? { ...a, stage: newStage } : a
    ));
    toast({ title: `Moved to ${stageLabels[newStage]}` });
  };

  const publishJob = (jobId: string) => {
    setJobs(jobs.map(j =>
      j.id === jobId ? { ...j, status: 'open', posted_date: new Date().toISOString() } : j
    ));
    toast({ title: 'Job published', description: 'Now visible to candidates' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Recruitment
          </h1>
          <p className="text-muted-foreground">Job postings and applicant tracking</p>
        </div>
        <Button onClick={() => setShowNewJob(true)}>
          <Plus className="h-4 w-4 mr-2" /> Post Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Open Jobs</div>
                <div className="text-2xl font-bold text-green-600">{stats.openJobs}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Applicants</div>
                <div className="text-2xl font-bold">{stats.totalApplicants}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.newApplicants > 0 ? 'border-blue-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">New</div>
                <div className={cn('text-2xl font-bold', stats.newApplicants > 0 && 'text-blue-600')}>
                  {stats.newApplicants}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">In Interview</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.inInterview}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.pendingOffers > 0 ? 'border-green-200' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pending Offers</div>
                <div className={cn('text-2xl font-bold', stats.pendingOffers > 0 && 'text-green-600')}>
                  {stats.pendingOffers}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="pipeline">Applicant Pipeline</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        {/* Jobs */}
        <TabsContent value="jobs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map(job => (
              <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedJob(job)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{job.title}</h3>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3" /> {job.department}
                      </div>
                    </div>
                    <Badge className={statusColors[job.status]}>{job.status}</Badge>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {job.location}
                    </div>
                    {job.salary_min && job.salary_max && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(job.salary_min)} - {formatCurrency(job.salary_max)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{job.applicants_count} applicants</span>
                      {job.new_applicants > 0 && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          +{job.new_applicants} new
                        </Badge>
                      )}
                    </div>
                    {job.published_to.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Link2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{job.published_to.length}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="border-dashed hover:shadow-md transition-shadow cursor-pointer flex items-center justify-center min-h-[200px]" onClick={() => setShowNewJob(true)}>
              <CardContent className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <div className="font-medium">Post New Job</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pipeline (Kanban) */}
        <TabsContent value="pipeline">
          <div className="mb-4 flex items-center gap-4">
            <Select value={filterJob} onValueChange={setFilterJob}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by job..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {jobs.map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map(stage => {
              const stageApplicants = filteredApplicants.filter(a => a.stage === stage);
              return (
                <div key={stage} className="flex-shrink-0 w-72">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={stageColors[stage]}>{stageLabels[stage]}</Badge>
                      <span className="text-sm text-muted-foreground">{stageApplicants.length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {stageApplicants.map(applicant => (
                      <Card
                        key={applicant.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedApplicant(applicant)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{applicant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{applicant.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{applicant.job_title}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={cn(
                                    'h-3 w-3',
                                    i < applicant.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-muted-foreground">{applicant.source}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Interviews */}
        <TabsContent value="interviews">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No upcoming interviews</p>
                <p className="text-sm">Schedule interviews from the applicant pipeline</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Applicant Detail Dialog */}
      <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{selectedApplicant?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <div>{selectedApplicant?.name}</div>
                <div className="text-sm font-normal text-muted-foreground">{selectedApplicant?.job_title}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={stageColors[selectedApplicant.stage]}>{stageLabels[selectedApplicant.stage]}</Badge>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < selectedApplicant.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedApplicant.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedApplicant.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedApplicant.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Applied {formatDistanceToNow(new Date(selectedApplicant.applied_date))} ago</span>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Move to stage</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {stages.map(stage => (
                    <Button
                      key={stage}
                      size="sm"
                      variant={selectedApplicant.stage === stage ? 'default' : 'outline'}
                      onClick={() => {
                        moveApplicant(selectedApplicant.id, stage);
                        setSelectedApplicant({ ...selectedApplicant, stage });
                      }}
                    >
                      {stageLabels[stage]}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApplicant(null)}>Close</Button>
            <Button variant="destructive" onClick={() => {
              moveApplicant(selectedApplicant!.id, 'rejected');
              setSelectedApplicant(null);
            }}>
              <XCircle className="h-4 w-4 mr-2" /> Reject
            </Button>
            <Button>
              <Calendar className="h-4 w-4 mr-2" /> Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Job Dialog */}
      <Dialog open={showNewJob} onOpenChange={setShowNewJob}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post New Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input placeholder="e.g., Senior Software Engineer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input placeholder="e.g., Toronto, ON (Hybrid)" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salary Min</Label>
                <Input type="number" placeholder="e.g., 80000" />
              </div>
              <div className="space-y-2">
                <Label>Salary Max</Label>
                <Input type="number" placeholder="e.g., 120000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Job description and responsibilities..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewJob(false)}>Cancel</Button>
            <Button>Create as Draft</Button>
            <Button>Publish Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
