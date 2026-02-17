'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as knowledgeService from '@/services/knowledge';
import type { KnowledgeArticle, KnowledgeCategory } from '@/types/knowledge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, BookOpen, Eye, ThumbsUp, Folder, FileText, Edit, Globe, Lock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-red-100 text-red-700',
};

export default function KnowledgePage() {
  const { organizationId, user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewArticle, setShowNewArticle] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<'internal' | 'public'>('internal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [articlesData, categoriesData] = await Promise.all([
        knowledgeService.getKnowledgeArticles(organizationId, {
          categoryId: selectedCategory || undefined,
          search: searchQuery || undefined,
        }),
        knowledgeService.getKnowledgeCategories(organizationId),
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load articles', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, selectedCategory, searchQuery, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!organizationId || !user?.id || !title) return;
    setIsSubmitting(true);
    try {
      await knowledgeService.createKnowledgeArticle(organizationId, user.id, {
        title,
        content: content || undefined,
        category_id: categoryId || undefined,
        visibility,
        status: 'draft',
      });
      toast({ title: 'Article Created' });
      setShowNewArticle(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async (articleId: string) => {
    try {
      await knowledgeService.publishKnowledgeArticle(articleId);
      toast({ title: 'Article Published' });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setTitle(''); setContent(''); setCategoryId(''); setVisibility('internal');
  };

  const flatCategories = (cats: KnowledgeCategory[], depth = 0): { cat: KnowledgeCategory; depth: number }[] => {
    return cats.flatMap(cat => [{ cat, depth }, ...flatCategories(cat.children || [], depth + 1)]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">Documentation and internal wiki</p>
        </div>
        <Button onClick={() => setShowNewArticle(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Article
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}>
          <SelectTrigger className="w-[200px]">
            <Folder className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {flatCategories(categories).map(({ cat, depth }) => (
              <SelectItem key={cat.id} value={cat.id}>
                {'  '.repeat(depth)}{cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No articles found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(article => (
            <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <Badge className={statusColors[article.status]}>{article.status}</Badge>
                  </div>
                  {article.visibility === 'public' ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{article.title}</CardTitle>
                {article.category && (
                  <CardDescription className="flex items-center gap-1">
                    <Folder className="h-3 w-3" /> {article.category.name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.content?.slice(0, 150) || 'No content yet...'}
                </p>
                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.views}</span>
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {article.helpful_count}</span>
                  </div>
                  <span>{formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}</span>
                </div>
                {article.status === 'draft' && (
                  <Button size="sm" className="mt-3 w-full" onClick={(e) => { e.stopPropagation(); handlePublish(article.id); }}>
                    Publish
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Categories Sidebar could go here */}

      {/* New Article Dialog */}
      <Dialog open={showNewArticle} onOpenChange={setShowNewArticle}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Article</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">Title *</label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {flatCategories(categories).map(({ cat, depth }) => (
                      <SelectItem key={cat.id} value={cat.id}>{'  '.repeat(depth)}{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Visibility</label>
                <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Content (Markdown)</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Write your article content here..." className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNewArticle(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Article'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
