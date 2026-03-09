import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Message } from '@/types';

const MessageBubble: React.FC<{ message: Message; isStreaming?: boolean }> = ({
  message,
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4 animate-in slide-in-from-right-2 duration-300">
        <Card className="bg-primary text-primary-foreground border-0 shadow-md max-w-xs lg:max-w-md">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </CardContent>
        </Card>
      </div>
    );
  } else if (message.role === 'assistant') {
    return (
      <div className="flex justify-start mb-4 animate-in slide-in-from-left-2 duration-300">
        <Card
          className={cn(
            'bg-muted/50 border-border/50 shadow-sm max-w-xs lg:max-w-md transition-all',
            message.isStreaming && 'ring-2 ring-primary/20'
          )}
        >
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block ml-1 animate-pulse text-primary">
                  ▋
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return null;
};

export default MessageBubble;
