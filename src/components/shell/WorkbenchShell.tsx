import React, { ReactNode } from 'react';
import { ActivityRail } from './ActivityRail';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { Toaster } from '@/components/ui/toaster';

export const WorkbenchShell: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased select-none font-sans">
      <ActivityRail />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </main>
        <StatusBar />
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
};
