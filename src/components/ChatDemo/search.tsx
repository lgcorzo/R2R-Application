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
      <div className="relative flex items-center gap-0 rounded-full overflow-hidden border border-input bg-zinc-800/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-all">
        <Input
          id="search-bar"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setValue(e.target.value)
          }
          autoFocus
          placeholder={placeholder}
          className="flex-1 h-12 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none px-6"
          disabled={disabled}
        />
        <Button
          type="submit"
          size="icon"
          className="h-12 w-12 rounded-none border-0"
          disabled={disabled}
        >
          <ArrowRight className="h-5 w-5" />
          <span className="sr-only">Submit search</span>
        </Button>
      </div>
    </form>
  );
};
