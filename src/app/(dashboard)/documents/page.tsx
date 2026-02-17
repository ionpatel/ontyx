'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import * as documentsService from '@/services/documents';
import type { Document, DocumentFolder } from '@/types/documents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search, Upload, FolderPlus, File, Folder, MoreVertical, Download, Trash2, Share2, Eye, Grid, List, FileText, Image, FileSpreadsheet,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return <File className="h-8 w-8" />;
  if (mimeType.startsWith('image/')) return <Image className="h-8 w-8 text-purple-500" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  if (mimeType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
  return <File className="h-8 w-8 text-blue-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function DocumentsPage() {
  const { organizationId, user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const [docs, fldrs] = await Promise.all([
        documentsService.getDocuments(organizationId, { folderId: currentFolderId || undefined, search: searchQuery }),
        documentsService.getFolders(organizationId),
      ]);
      setDocuments(docs);
      setFolders(fldrs);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load documents', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, currentFolderId, searchQuery, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !organizationId || !user?.id) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await documentsService.uploadDocument(organizationId, user.id, {
          name: file.name,
          file,
          folder_id: currentFolderId || undefined,
        });
      }
      toast({ title: 'Uploaded', description: `${files.length} file(s) uploaded` });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
      setShowUploadDialog(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!organizationId || !newFolderName.trim()) return;
    try {
      await documentsService.createFolder(organizationId, {
        name: newFolderName,
        parent_id: currentFolderId || undefined,
      });
      toast({ title: 'Folder Created' });
      setNewFolderName('');
      setShowFolderDialog(false);
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create folder', variant: 'destructive' });
    }
  };

  const handleDelete = async (doc: Document) => {
    try {
      await documentsService.deleteDocument(doc.id);
      toast({ title: 'Deleted', description: doc.name });
      fetchData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const url = await documentsService.getDocumentUrl(doc.file_path);
      window.open(url, '_blank');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to download', variant: 'destructive' });
    }
  };

  const currentFolders = folders.filter(f => f.parent_id === currentFolderId);
  const breadcrumbs = [];
  let folderId = currentFolderId;
  while (folderId) {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      breadcrumbs.unshift(folder);
      folderId = folder.parent_id;
    } else break;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <button onClick={() => setCurrentFolderId(null)} className="hover:text-foreground">Root</button>
            {breadcrumbs.map(f => (
              <span key={f.id} className="flex items-center gap-2">
                <span>/</span>
                <button onClick={() => setCurrentFolderId(f.id)} className="hover:text-foreground">{f.name}</button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={() => setShowFolderDialog(true)}>
            <FolderPlus className="h-4 w-4 mr-2" /> New Folder
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : 'space-y-2')}>
          {currentFolders.map(folder => (
            <button key={folder.id} onClick={() => setCurrentFolderId(folder.id)}
              className={cn(
                'text-left transition-colors',
                viewMode === 'grid' 
                  ? 'p-4 rounded-lg border hover:bg-muted/50 flex flex-col items-center gap-2'
                  : 'p-3 rounded-lg border hover:bg-muted/50 flex items-center gap-3 w-full'
              )}>
              <Folder className="h-8 w-8 text-yellow-500" />
              <span className="font-medium truncate">{folder.name}</span>
            </button>
          ))}
          {documents.map(doc => (
            <div key={doc.id}
              className={cn(
                'group relative transition-colors',
                viewMode === 'grid'
                  ? 'p-4 rounded-lg border hover:bg-muted/50 flex flex-col items-center gap-2'
                  : 'p-3 rounded-lg border hover:bg-muted/50 flex items-center gap-3'
              )}>
              {getFileIcon(doc.mime_type)}
              <div className={cn(viewMode === 'grid' ? 'text-center w-full' : 'flex-1 min-w-0')}>
                <div className="font-medium truncate">{doc.name}</div>
                <div className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload(doc)}><Download className="h-4 w-4 mr-2" /> Download</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(doc)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          {currentFolders.length === 0 && documents.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents yet</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Files</DialogTitle></DialogHeader>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="mb-4">Drag & drop files or click to browse</p>
            <input type="file" multiple onChange={handleUpload} className="hidden" id="file-upload" />
            <Button asChild disabled={uploading}>
              <label htmlFor="file-upload">{uploading ? 'Uploading...' : 'Select Files'}</label>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
