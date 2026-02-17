// Knowledge Base Service
import { createClient } from '@/lib/supabase/client';
import type { KnowledgeCategory, KnowledgeArticle, CreateKnowledgeArticleInput, CreateKnowledgeCategoryInput } from '@/types/knowledge';

const supabase = createClient();

// Categories
export async function getKnowledgeCategories(organizationId: string): Promise<KnowledgeCategory[]> {
  const { data, error } = await supabase
    .from('knowledge_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sort_order');
  if (error) throw error;

  // Build tree structure
  const categories = data || [];
  const rootCategories = categories.filter(c => !c.parent_id);
  
  const buildTree = (parent: KnowledgeCategory): KnowledgeCategory => ({
    ...parent,
    children: categories.filter(c => c.parent_id === parent.id).map(buildTree)
  });

  return rootCategories.map(buildTree);
}

export async function createKnowledgeCategory(
  organizationId: string,
  input: CreateKnowledgeCategoryInput
): Promise<KnowledgeCategory> {
  const { data, error } = await supabase
    .from('knowledge_categories')
    .insert({ organization_id: organizationId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateKnowledgeCategory(
  categoryId: string,
  updates: Partial<KnowledgeCategory>
): Promise<KnowledgeCategory> {
  const { data, error } = await supabase
    .from('knowledge_categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteKnowledgeCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from('knowledge_categories').delete().eq('id', categoryId);
  if (error) throw error;
}

// Articles
export async function getKnowledgeArticles(
  organizationId: string,
  options?: { categoryId?: string; status?: string; search?: string; visibility?: string }
): Promise<KnowledgeArticle[]> {
  let query = supabase
    .from('knowledge_articles')
    .select(`
      *,
      category:knowledge_categories(id, name)
    `)
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false });

  if (options?.categoryId) query = query.eq('category_id', options.categoryId);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.visibility) query = query.eq('visibility', options.visibility);
  if (options?.search) {
    query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getKnowledgeArticle(articleId: string): Promise<KnowledgeArticle | null> {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select(`
      *,
      category:knowledge_categories(id, name)
    `)
    .eq('id', articleId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getKnowledgeArticleBySlug(
  organizationId: string,
  slug: string
): Promise<KnowledgeArticle | null> {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select(`
      *,
      category:knowledge_categories(id, name)
    `)
    .eq('organization_id', organizationId)
    .eq('slug', slug)
    .single();
  if (error && error.code !== 'PGRST116') throw error;

  // Increment view count
  if (data) {
    await supabase
      .from('knowledge_articles')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id);
  }

  return data;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createKnowledgeArticle(
  organizationId: string,
  authorId: string,
  input: CreateKnowledgeArticleInput
): Promise<KnowledgeArticle> {
  const slug = generateSlug(input.title);

  const { data, error } = await supabase
    .from('knowledge_articles')
    .insert({
      organization_id: organizationId,
      author_id: authorId,
      title: input.title,
      slug,
      content: input.content,
      category_id: input.category_id,
      status: input.status || 'draft',
      visibility: input.visibility || 'internal',
      meta_description: input.meta_description,
      published_at: input.status === 'published' ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateKnowledgeArticle(
  articleId: string,
  updates: Partial<KnowledgeArticle>
): Promise<KnowledgeArticle> {
  const updateData: any = { ...updates, updated_at: new Date().toISOString() };

  // Update slug if title changes
  if (updates.title) {
    updateData.slug = generateSlug(updates.title);
  }

  // Set published_at if publishing
  if (updates.status === 'published') {
    const article = await getKnowledgeArticle(articleId);
    if (article && !article.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('knowledge_articles')
    .update(updateData)
    .eq('id', articleId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function publishKnowledgeArticle(articleId: string): Promise<KnowledgeArticle> {
  return updateKnowledgeArticle(articleId, { status: 'published' });
}

export async function archiveKnowledgeArticle(articleId: string): Promise<KnowledgeArticle> {
  return updateKnowledgeArticle(articleId, { status: 'archived' });
}

export async function deleteKnowledgeArticle(articleId: string): Promise<void> {
  const { error } = await supabase.from('knowledge_articles').delete().eq('id', articleId);
  if (error) throw error;
}

export async function markArticleHelpful(articleId: string): Promise<void> {
  const article = await getKnowledgeArticle(articleId);
  if (article) {
    await supabase
      .from('knowledge_articles')
      .update({ helpful_count: (article.helpful_count || 0) + 1 })
      .eq('id', articleId);
  }
}

// Search
export async function searchKnowledge(
  organizationId: string,
  query: string,
  options?: { visibility?: 'internal' | 'public' }
): Promise<KnowledgeArticle[]> {
  let searchQuery = supabase
    .from('knowledge_articles')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('views', { ascending: false })
    .limit(20);

  if (options?.visibility) {
    searchQuery = searchQuery.eq('visibility', options.visibility);
  }

  const { data, error } = await searchQuery;
  if (error) throw error;
  return data || [];
}
