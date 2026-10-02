import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '@/components/ui/use-toast';

interface CopyableContentProps {
  content: string;
  truncated: string;
}

const CopyableContent: React.FC<CopyableContentProps> = ({
  content,
  truncated,
}) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard
      .writeText(content)
      .then(() => {
        setCopied(true);
        toast({ title: 'Copied to clipboard', description: content });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Could not copy text: ', err));
  };

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-xs text-slate-300 bg-white/[0.04] hover:bg-indigo-500/10 hover:text-indigo-200 hover:border-indigo-500/30 border border-white/[0.06] transition-all group cursor-pointer text-left"
      onClick={handleCopy}
      title={`Click to copy: ${content}`}
    >
      <span className="truncate max-w-[140px]">{truncated}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
      )}
    </button>
  );
};

export default CopyableContent;
