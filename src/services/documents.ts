// Documents Service
import { createClient } from '@/lib/supabase/client';
import type { Document, DocumentFolder, DocumentShare, CreateDocumentInput, CreateFolderInput } from '@/types/documents';

const supabase = createClient();

// Folders
export async function getFolders(organizationId: string): Promise<DocumentFolder[]> {
  const { data, error } = await supabase
    .from('document_folders')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createFolder(organizationId: string, input: CreateFolderInput): Promise<DocumentFolder> {
  const { data, error } = await supabase
    .from('document_folders')
    .insert({ organization_id: organizationId, ...input })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFolder(folderId: string): Promise<void> {
  const { error } = await supabase.from('document_folders').delete().eq('id', folderId);
  if (error) throw error;
}

// Documents
export async function getDocuments(
  organizationId: string,
  options?: { folderId?: string; search?: string }
): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (options?.folderId) {
    query = query.eq('folder_id', options.folderId);
  } else if (options?.folderId === null) {
    query = query.is('folder_id', null);
  }

  if (options?.search) {
    query = query.ilike('name', `%${options.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getDocument(documentId: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function uploadDocument(
  organizationId: string,
  userId: string,
  input: CreateDocumentInput
): Promise<Document> {
  const file = input.file;
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${organizationId}/${fileName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  // Calculate checksum
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Create document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      organization_id: organizationId,
      owner_id: userId,
      name: input.name || file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      folder_id: input.folder_id,
      tags: input.tags || [],
      description: input.description,
      visibility: input.visibility || 'private',
      checksum,
      is_encrypted: input.encrypt || false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  // Soft delete
  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', documentId);
  if (error) throw error;
}

export async function moveDocument(documentId: string, folderId: string | null): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .update({ folder_id: folderId })
    .eq('id', documentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// Sharing
export async function shareDocument(
  documentId: string,
  shareWith: { userId?: string; email?: string },
  permission: 'view' | 'edit' | 'admin' = 'view'
): Promise<DocumentShare> {
  const { data, error } = await supabase
    .from('document_shares')
    .insert({
      document_id: documentId,
      shared_with_user_id: shareWith.userId,
      shared_with_email: shareWith.email,
      permission,
      access_token: shareWith.email ? crypto.randomUUID() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDocumentShares(documentId: string): Promise<DocumentShare[]> {
  const { data, error } = await supabase
    .from('document_shares')
    .select('*')
    .eq('document_id', documentId);
  if (error) throw error;
  return data || [];
}

export async function removeShare(shareId: string): Promise<void> {
  const { error } = await supabase.from('document_shares').delete().eq('id', shareId);
  if (error) throw error;
}
