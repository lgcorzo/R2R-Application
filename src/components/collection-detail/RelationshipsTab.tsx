import { ArrowRight, Copy, MoreHorizontal, Trash2 } from 'lucide-react';
import { RelationshipResponse } from 'r2r-js/dist/types';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface RelationshipsTabProps {
  relationships: RelationshipResponse[];
  onDelete: (id: string) => void;
}

export function RelationshipsTab({
  relationships,
  onDelete,
}: RelationshipsTabProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 12;

  const filteredRelationships = React.useMemo(() => {
    if (!searchQuery.trim()) return relationships;
    const query = searchQuery.toLowerCase();
    return relationships.filter(
      (rel) =>
        rel.subject?.toLowerCase().includes(query) ||
        rel.predicate?.toLowerCase().includes(query) ||
        rel.object?.toLowerCase().includes(query)
    );
  }, [relationships, searchQuery]);

  const paginatedRelationships = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRelationships.slice(start, start + pageSize);
  }, [filteredRelationships, currentPage]);

  const totalPages = Math.ceil(filteredRelationships.length / pageSize);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search relationships..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {filteredRelationships.length} relationships
        </div>
      </div>

      {/* Card Grid Layout for Relationships */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedRelationships.length > 0 ? (
          paginatedRelationships.map((rel) => (
            <Card key={rel.id?.toString()} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {rel.predicate}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          copyToClipboard(rel.id?.toString() || '')
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Relationship ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(rel.id?.toString() || '')}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <CardTitle className="text-base font-medium truncate max-w-[120px]">
                    {rel.subject}
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <CardTitle className="text-base font-medium truncate max-w-[120px]">
                    {rel.object}
                  </CardTitle>
                </div>
                <CardDescription className="mt-2 text-xs truncate">
                  ID: {rel.id?.toString()}
                </CardDescription>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-32 text-muted-foreground">
            No relationships found.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredRelationships.length)} of{' '}
            {filteredRelationships.length} relationships
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
