import { Brain, ChevronDown } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ThinkingBlockProps {
  content: string;
  timestamp?: number;
  isActive?: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  content,
  timestamp,
  isActive = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Alert
      className={`bg-purple-500/10 border-purple-500/30 ${isActive ? 'animate-pulse' : ''}`}
    >
      <Brain className="h-4 w-4 text-purple-400" />
      <AlertTitle className="text-purple-300 font-medium mb-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between">
            <span>Agent Thinking</span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
                <span className="sr-only">Toggle thinking details</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <AlertDescription className="text-purple-200/90 mt-2 text-sm whitespace-pre-wrap">
              {content}
            </AlertDescription>
            {timestamp && (
              <div className="text-xs text-purple-400/70 mt-2">
                {new Date(timestamp).toLocaleTimeString()}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </AlertTitle>
    </Alert>
  );
};
