import { Copy, MoreHorizontal, Trash2 } from 'lucide-react';
import { EntityResponse } from 'r2r-js/dist/types';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EntitiesTabProps {
  entities: EntityResponse[];
  onDelete: (id: string) => void;
}

export function EntitiesTab({ entities, onDelete }: EntitiesTabProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const pageSize = 10;

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    entities.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats).sort();
  }, [entities]);

  const filteredEntities = React.useMemo(() => {
    let filtered = entities;

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name?.toLowerCase().includes(query) ||
          e.category?.toLowerCase().includes(query) ||
          e.id?.toString().toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [entities, searchQuery, categoryFilter]);

  const paginatedEntities = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntities.slice(start, start + pageSize);
  }, [filteredEntities, currentPage]);

  const totalPages = Math.ceil(filteredEntities.length / pageSize);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Get variant color for category badge
  const getCategoryVariant = (category: string) => {
    const hash = category.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    const variants = ['default', 'secondary', 'outline'] as const;
    return variants[Math.abs(hash) % variants.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search entities..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEntities.length > 0 ? (
              paginatedEntities.map((entity) => (
                <TableRow key={entity.id?.toString()}>
                  <TableCell className="font-medium">{entity.name}</TableCell>
                  <TableCell>
                    <Badge variant={getCategoryVariant(entity.category || '')}>
                      {entity.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate font-mono text-sm text-muted-foreground">
                      {entity.id?.toString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
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
                            copyToClipboard(entity.id?.toString() || '')
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Entity ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(entity.id?.toString() || '')}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No entities found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredEntities.length)} of{' '}
            {filteredEntities.length} entities
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
