import { FlaskConical, Library, Gauge, Sun, Moon, LogOut } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useUserContext } from '@/context/UserContext';

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { logout } = useUserContext();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or jump to workspace..." />
      <CommandList>
        <CommandEmpty>No matching actions found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/arena'))}
            className="cursor-pointer"
          >
            <FlaskConical className="mr-2 h-4 w-4" />
            <span>Open Retrieval Arena (A/B Testing)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/knowledge'))}
            className="cursor-pointer"
          >
            <Library className="mr-2 h-4 w-4" />
            <span>Open Knowledge Studio (Documents & Chunks)</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/ops'))}
            className="cursor-pointer"
          >
            <Gauge className="mr-2 h-4 w-4" />
            <span>Open Telemetry & Ops Hub</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Preferences & Session">
          <CommandItem
            onSelect={() =>
              runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))
            }
            className="cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle Theme</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(logout)}
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4 text-destructive" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
