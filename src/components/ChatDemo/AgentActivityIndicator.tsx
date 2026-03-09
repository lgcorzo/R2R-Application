import { Brain, Wrench, BarChart3 } from 'lucide-react';
import React from 'react';

import { ThinkingBlock } from '@/components/ChatDemo/ThinkingBlock';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AgentActivity } from '@/types';

interface AgentActivityIndicatorProps {
  activities: AgentActivity[];
  isActive?: boolean;
}

export const AgentActivityIndicator: React.FC<AgentActivityIndicatorProps> = ({
  activities,
  isActive = false,
}) => {
  if (!activities || activities.length === 0) {
    return null;
  }

  // Get icon and color based on activity type
  const getActivityStyle = (type: AgentActivity['type']) => {
    switch (type) {
      case 'thinking':
        return {
          icon: <Brain className="w-3 h-3" />,
          variant: 'default' as const,
          label: 'Thinking',
          bgColor: 'bg-purple-500/10',
          textColor: 'text-purple-300',
        };
      case 'tool_call':
        return {
          icon: <Wrench className="w-3 h-3" />,
          variant: 'secondary' as const,
          label: 'Tool Call',
          bgColor: 'bg-blue-500/10',
          textColor: 'text-blue-300',
        };
      case 'tool_result':
        return {
          icon: <BarChart3 className="w-3 h-3" />,
          variant: 'outline' as const,
          label: 'Result',
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-300',
        };
      default:
        return {
          icon: null,
          variant: 'default' as const,
          label: 'Activity',
          bgColor: 'bg-zinc-500/10',
          textColor: 'text-zinc-300',
        };
    }
  };

  // Group activities by type for summary
  const activityCounts = activities.reduce(
    (acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="my-2">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="activities" className="border-zinc-700/60">
          <AccordionTrigger className="py-2 text-sm hover:no-underline hover:text-zinc-300">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-400 font-medium">Agent Activity:</span>
              {Object.entries(activityCounts).map(([type, count]) => {
                const style = getActivityStyle(type as AgentActivity['type']);
                return (
                  <Badge
                    key={type}
                    variant={style.variant}
                    className={`flex items-center gap-1 ${isActive && type === 'thinking' ? 'animate-pulse' : ''}`}
                  >
                    {style.icon}
                    <span>
                      {style.label} ({count})
                    </span>
                  </Badge>
                );
              })}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {activities.map((activity, index) => {
                const style = getActivityStyle(activity.type);
                return activity.type === 'thinking' ? (
                  <ThinkingBlock
                    key={`${activity.type}-${index}`}
                    content={activity.content}
                    timestamp={activity.timestamp}
                    isActive={isActive && index === activities.length - 1}
                  />
                ) : (
                  <div
                    key={`${activity.type}-${index}`}
                    className={`p-3 rounded-lg ${style.bgColor}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 ${style.textColor}`}>
                        {style.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-semibold uppercase tracking-wide ${style.textColor}`}
                          >
                            {style.label}
                          </span>
                          <span className="text-xs text-zinc-500/80">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300/90 whitespace-pre-wrap break-words leading-relaxed">
                          {activity.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
