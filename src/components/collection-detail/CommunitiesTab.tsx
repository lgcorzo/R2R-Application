import { Copy, MoreHorizontal, Trash2, Users } from 'lucide-react';
import { CommunityResponse } from 'r2r-js/dist/types';
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

interface CommunitiesTabProps {
  communities: CommunityResponse[];
  onDelete: (id: string) => void;
}

export function CommunitiesTab({ communities, onDelete }: CommunitiesTabProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 9;

  const filteredCommunities = React.useMemo(() => {
    if (!searchQuery.trim()) return communities;
    const query = searchQuery.toLowerCase();
    return communities.filter(
      (c) =>
        c.name?.toLowerCase().includes(query) ||
        c.summary?.toLowerCase().includes(query)
    );
  }, [communities, searchQuery]);

  const paginatedCommunities = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCommunities.slice(start, start + pageSize);
  }, [filteredCommunities, currentPage]);

  const totalPages = Math.ceil(filteredCommunities.length / pageSize);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search communities..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {filteredCommunities.length} communities
        </div>
      </div>

      {/* Card Grid Layout for Communities */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paginatedCommunities.length > 0 ? (
          paginatedCommunities.map((community) => (
            <Card key={community.id?.toString()} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <CardTitle className="text-lg line-clamp-1">
                      {community.name || 'Unnamed Community'}
                    </CardTitle>
                  </div>
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
                          copyToClipboard(community.id?.toString() || '')
                        }
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Community ID
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(community.id?.toString() || '')}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="line-clamp-3">
                  {community.summary || 'No summary available'}
                </CardDescription>
                <div className="mt-4 flex items-center gap-2">
                  {community.rating !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      Rating: {community.rating}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground truncate">
                    ID: {community.id?.toString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-32 text-muted-foreground">
            No communities found.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredCommunities.length)} of{' '}
            {filteredCommunities.length} communities
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
