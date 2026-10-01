import { FlaskConical, Library, Gauge, Terminal } from 'lucide-react';
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

export const ActivityRail: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { path: '/arena', label: 'Retrieval Arena', icon: FlaskConical },
    { path: '/knowledge', label: 'Knowledge Studio', icon: Library },
    { path: '/ops', label: 'Telemetry & Ops', icon: Gauge },
  ];

  return (
    <aside className="w-14 bg-card border-r border-border flex flex-col items-center py-3 z-30 select-none flex-shrink-0">
      <div className="mb-4">
        <Link
          href="/arena"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Terminal className="w-5 h-5" />
        </Link>
      </div>

      <nav className="flex-1 flex flex-col space-y-2">
        <TooltipProvider delayDuration={200}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath.startsWith(item.path);
            return (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.path}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium text-xs">{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className="pt-2 border-t border-border flex flex-col items-center space-y-2">
        <ThemeToggle />
      </div>
    </aside>
  );
};
