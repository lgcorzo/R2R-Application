import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { FC, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchProps } from '@/types';

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export const Search: FC<SearchProps> = ({
  pipeline,
  setQuery,
  placeholder,
  disabled = false,
}) => {
  const [value, setValue] = useState('');
  const router = useRouter();

  if (!placeholder) {
    placeholder = 'Search over your documents…';
  }

  const navigateToSearch = useCallback(
    debounce((searchValue: string) => {
      if (pipeline) {
        router.push(`/chat/?q=${encodeURIComponent(searchValue)}`);
      }
    }, 50),
    [router, pipeline]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim()) {
      navigateToSearch(value.trim());
      setQuery(value.trim());
      setValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center gap-0 rounded-2xl overflow-hidden glass-panel border-white/[0.08] focus-within:border-indigo-500/40 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.12)] transition-all duration-300">
        <Input
          id="search-bar"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValue(e.target.value)
          }
          autoFocus
          placeholder={placeholder}
          className="flex-1 h-13 border-0 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-6 text-sm"
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          className="h-13 w-13 rounded-none border-0 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition-all duration-300"
          disabled={disabled}
        >
          <ArrowRight className="h-5 w-5" />
          <span className="sr-only">Submit search</span>
        </Button>
      </div>
    </form>
  );
};
