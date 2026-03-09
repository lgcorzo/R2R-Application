import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'Code has been copied successfully',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: 'Failed to copy',
        description: 'Could not copy code to clipboard',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative group rounded-lg border border-zinc-700 bg-zinc-900/95 my-4">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wide">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Code content */}
      <pre className={`p-4 overflow-x-auto ${className || ''}`}>
        <code className="text-sm text-zinc-200 font-mono leading-relaxed">
          {code}
        </code>
      </pre>
    </div>
  );
};
