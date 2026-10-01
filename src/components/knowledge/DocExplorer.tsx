import React, { useEffect, useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { useWorkbenchContext } from '@/context/WorkbenchContext';
import { FileText, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentResponse } from 'r2r-js';

export const DocExplorer: React.FC = () => {
  const { getClient } = useUserContext();
  const { selectedDocId, setSelectedDocId } = useWorkbenchContext();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const client = await getClient();
      if (!client) return;
      const res = await client.documents.list({ limit: 100, offset: 0 });
      const docs = res.results || [];
      setDocuments(docs);
      if (!selectedDocId && docs.length > 0) {
        setSelectedDocId(docs[0].id);
      }
    } catch (e) {
      console.error('Error fetching documents in DocExplorer:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const filtered = documents.filter((d) => {
    const title = (d.title || d.id || '').toLowerCase();
    return title.includes(search.toLowerCase());
  });

  return (
    <div className="h-full flex flex-col bg-card/30 border-r border-border overflow-hidden select-none">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Knowledge Base ({documents.length})
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={fetchDocs}
          disabled={loading}
          title="Refresh Documents"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter documents..."
            className="h-7 pl-8 text-xs bg-background/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-6">
            {loading ? 'Loading...' : 'No documents found'}
          </div>
        ) : (
          filtered.map((doc) => {
            const isSelected = selectedDocId === doc.id;
            const isSuccess = doc.ingestionStatus === 'success';
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`px-2.5 py-2 rounded-md text-xs flex items-center space-x-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                    : 'hover:bg-accent text-foreground/80'
                }`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate flex-1 font-sans">
                  {doc.title || doc.id}
                </span>
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isSuccess ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  title={`Status: ${doc.ingestionStatus}`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
