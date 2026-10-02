import {
  FlaskConical,
  Library,
  Gauge,
  FileText,
  FolderGit2,
  MessageSquare,
  Search,
  Compass,
  SlidersHorizontal,
  Users,
  Settings,
  LayoutGrid,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import { ThemeToggle } from '@/components/shared/ThemeToggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RailNavItem {
  path: string;
  label: string;
  category: string;
  icon: React.ElementType;
}

export const ActivityRail: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  // Main Core Tabs
  const mainTabs: RailNavItem[] = [
    {
      path: '/documents',
      label: 'Documents',
      category: 'Workspace',
      icon: FileText,
    },
    {
      path: '/collections',
      label: 'Collections',
      category: 'Workspace',
      icon: FolderGit2,
    },
    {
      path: '/chat',
      label: 'Chat',
      category: 'Workspace',
      icon: MessageSquare,
    },
    {
      path: '/search',
      label: 'Search',
      category: 'Workspace',
      icon: Search,
    },
    {
      path: '/explorer',
      label: 'Explorer',
      category: 'Explore',
      icon: Compass,
    },
    {
      path: '/manage',
      label: 'Manage',
      category: 'Configure',
      icon: SlidersHorizontal,
    },
  ];

  // Advanced Workbench Tools
  const workbenchItems: RailNavItem[] = [
    {
      path: '/arena',
      label: 'Retrieval Arena',
      category: 'Workbench',
      icon: FlaskConical,
    },
    {
      path: '/knowledge',
      label: 'Knowledge Studio',
      category: 'Workbench',
      icon: Library,
    },
    {
      path: '/ops',
      label: 'Telemetry & Ops',
      category: 'Workbench',
      icon: Gauge,
    },
  ];

  // Admin & System Items
  const adminItems: RailNavItem[] = [
    {
      path: '/users',
      label: 'Users',
      category: 'Administration',
      icon: Users,
    },
    {
      path: '/settings',
      label: 'Settings',
      category: 'System',
      icon: Settings,
    },
  ];

  const checkIsActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const renderNavButton = (item: RailNavItem) => {
    const Icon = item.icon;
    const isActive = checkIsActive(item.path);

    return (
      <Tooltip key={item.path}>
        <TooltipTrigger asChild>
          <Link
            href={item.path}
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group ${
              isActive
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.07] border border-transparent'
            }`}
          >
            {isActive && (
              <span className="absolute -left-2 top-2 bottom-2 w-1 rounded-r-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            )}
            <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={10}
          className="glass-panel border-white/10 px-2.5 py-1.5 shadow-xl"
        >
          <div className="flex flex-col">
            <span className="font-semibold text-xs text-white">
              {item.label}
            </span>
            <span className="text-[10px] text-indigo-300/80 uppercase tracking-wider">
              {item.category}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <aside className="w-16 bg-[#070b14]/90 backdrop-blur-2xl border-r border-white/[0.06] flex flex-col items-center py-3 z-40 select-none flex-shrink-0">
      {/* Top Brand / Overview Link */}
      <div className="mb-3">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/documents"
                className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 text-indigo-300 hover:text-white hover:from-indigo-500/30 hover:to-purple-500/20 border border-indigo-500/30 transition-all shadow-sm"
              >
                <LayoutGrid className="w-5 h-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              sideOffset={10}
              className="glass-panel border-white/10 px-2.5 py-1.5 shadow-xl"
            >
              <span className="font-medium text-xs text-white">
                Main Application
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Main navigation list */}
      <nav className="flex-1 flex flex-col space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar py-1">
        <TooltipProvider delayDuration={150}>
          {/* Main workspace tabs */}
          <div className="flex flex-col space-y-1.5 items-center">
            {mainTabs.map(renderNavButton)}
          </div>

          {/* Section Divider */}
          <div className="w-7 h-[1px] bg-white/[0.08] my-2 mx-auto" />

          {/* Advanced Workbench Tools */}
          <div className="flex flex-col space-y-1.5 items-center">
            {workbenchItems.map(renderNavButton)}
          </div>
        </TooltipProvider>
      </nav>

      {/* Footer / System Section */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-col items-center space-y-1.5 w-full">
        <TooltipProvider delayDuration={150}>
          {adminItems.map(renderNavButton)}
        </TooltipProvider>
        <div className="pt-1">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};
