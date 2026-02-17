// Knowledge Base Types

export interface KnowledgeCategory {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  // Joined
  children?: KnowledgeCategory[];
  articles_count?: number;
}

export interface KnowledgeArticle {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  content: string | null; // Markdown
  category_id: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  visibility: 'internal' | 'public';
  views: number;
  helpful_count: number;
  meta_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: KnowledgeCategory;
  author?: { email: string; full_name?: string };
}

export interface CreateKnowledgeArticleInput {
  title: string;
  content?: string;
  category_id?: string;
  status?: 'draft' | 'published';
  visibility?: 'internal' | 'public';
  meta_description?: string;
}

export interface CreateKnowledgeCategoryInput {
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string;
}
