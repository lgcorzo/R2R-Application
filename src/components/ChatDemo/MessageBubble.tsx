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
        <Card className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 shadow-lg backdrop-blur-md max-w-xs lg:max-w-md rounded-2xl">
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
            'glass-panel border-white/10 text-slate-100 shadow-xl max-w-xs lg:max-w-md rounded-2xl transition-all',
            message.isStreaming && 'ring-2 ring-indigo-500/40'
          )}
        >
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {message.content}
              {message.isStreaming && (
                <span className="inline-block ml-1 animate-pulse text-indigo-400">
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
