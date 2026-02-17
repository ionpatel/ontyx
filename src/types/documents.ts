// Documents Module Types

export interface Document {
  id: string;
  organization_id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  folder_id: string | null;
  tags: string[];
  version: number;
  parent_version_id: string | null;
  visibility: 'private' | 'team' | 'public';
  owner_id: string;
  description: string | null;
  checksum: string | null;
  is_encrypted: boolean;
  encryption_key_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Joined
  owner?: { email: string; full_name?: string };
  folder?: DocumentFolder;
}

export interface DocumentFolder {
  id: string;
  organization_id: string;
  name: string;
  parent_id: string | null;
  color: string;
  created_at: string;
  // Joined
  children?: DocumentFolder[];
  document_count?: number;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  shared_with_user_id: string | null;
  shared_with_email: string | null;
  permission: 'view' | 'edit' | 'admin';
  expires_at: string | null;
  access_token: string | null;
  created_at: string;
}

export interface CreateDocumentInput {
  name: string;
  file: File;
  folder_id?: string;
  tags?: string[];
  description?: string;
  visibility?: 'private' | 'team' | 'public';
  encrypt?: boolean;
}

export interface CreateFolderInput {
  name: string;
  parent_id?: string;
  color?: string;
}
