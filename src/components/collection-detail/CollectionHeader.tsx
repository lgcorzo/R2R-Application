import {
  FileText,
  GitBranch,
  LayoutGrid,
  Network,
  Settings,
  Users,
} from 'lucide-react';
import { CollectionResponse } from 'r2r-js/dist/types';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { CollectionStats } from './types';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  loading?: boolean;
}

function StatCard({ title, value, icon, description, loading }: StatCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-muted-foreground hover:text-foreground transition-colors cursor-help">
                {icon}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold tabular-nums">
            {value.toLocaleString()}
          </div>
        )}
        {description && !loading && (
          <CardDescription className="text-xs mt-1">
            {description}
          </CardDescription>
        )}
        {loading && <Skeleton className="h-3 w-32 mt-2" />}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32 mt-2" />
      </CardContent>
    </Card>
  );
}

interface CollectionHeaderProps {
  collection: CollectionResponse | null;
  stats: CollectionStats;
  loading?: boolean;
  onManageClick?: () => void;
}

export function CollectionHeader({
  collection,
  stats,
  loading = false,
  onManageClick,
}: CollectionHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Title and Actions */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                {collection?.name || 'Collection Details'}
              </h1>
              {collection?.description && (
                <p className="text-muted-foreground">
                  {collection.description}
                </p>
              )}
            </>
          )}
        </div>
        <Button variant="default" onClick={onManageClick} disabled={loading}>
          <Settings className="mr-2 h-4 w-4" />
          Manage
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Documents"
              value={stats.documents}
              icon={<FileText className="h-4 w-4" />}
              description="Total documents in collection"
            />
            <StatCard
              title="Users"
              value={stats.users}
              icon={<Users className="h-4 w-4" />}
              description="Users with access"
            />
            <StatCard
              title="Entities"
              value={stats.entities}
              icon={<LayoutGrid className="h-4 w-4" />}
              description="Extracted entities"
            />
            <StatCard
              title="Relationships"
              value={stats.relationships}
              icon={<GitBranch className="h-4 w-4" />}
              description="Entity connections"
            />
            <StatCard
              title="Communities"
              value={stats.communities}
              icon={<Network className="h-4 w-4" />}
              description="Detected communities"
            />
          </>
        )}
      </div>
    </div>
  );
}
