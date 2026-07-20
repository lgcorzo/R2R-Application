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
    <div className="relative group rounded-xl border border-white/10 glass-panel shadow-2xl my-4">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 glass-surface border-b border-white/[0.04]">
        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wide">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
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
