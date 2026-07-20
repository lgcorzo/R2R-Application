import { Link, Check, ClipboardCheck } from 'lucide-react';
import React, { useState } from 'react';

import {
  PipelineStatus,
  useConnectionStatus,
} from '@/components/ChatDemo/PipelineStatus';
import { formatUptime } from '@/components/ChatDemo/utils/formatUptime';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { brandingConfig } from '@/config/brandingConfig';
import { R2RServerCardProps } from '@/types';

const R2RServerCard: React.FC<R2RServerCardProps> = ({
  pipeline,
  onStatusChange,
}) => {
  const [copied, setCopied] = useState(false);
  const { isConnected, serverStats, localUptime } = useConnectionStatus(
    pipeline?.deploymentUrl,
    onStatusChange
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => console.error('Failed to copy text: ', err)
    );
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            {brandingConfig.deploymentName} Server
          </CardTitle>
          <PipelineStatus onStatusChange={onStatusChange} />
        </div>
        <CardDescription className="text-sm">
          Your {brandingConfig.deploymentName} server deployment.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2.5 rounded-lg glass-surface">
            <p className="font-medium text-indigo-300 text-xs uppercase tracking-wider mb-0.5">
              Uptime
            </p>
            <p className="text-foreground">
              {isConnected ? formatUptime(localUptime) : 'N/A'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg glass-surface">
            <p className="font-medium text-indigo-300 text-xs uppercase tracking-wider mb-0.5">
              CPU Usage
            </p>
            <p className="text-foreground">
              {serverStats ? `${serverStats.cpuUsage.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg glass-surface">
            <p className="font-medium text-indigo-300 text-xs uppercase tracking-wider mb-0.5">
              Start Time
            </p>
            <p className="text-foreground">
              {serverStats
                ? new Date(serverStats.startTime).toLocaleString()
                : 'N/A'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg glass-surface">
            <p className="font-medium text-indigo-300 text-xs uppercase tracking-wider mb-0.5">
              Memory Usage
            </p>
            <p className="text-foreground">
              {serverStats ? `${serverStats.memoryUsage.toFixed(1)}%` : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3 text-sm border-t border-white/[0.06] mt-3">
          <Link width="16" height="16" className="text-indigo-400/60" />
          <span className="text-muted-foreground truncate">
            {pipeline?.deploymentUrl}
          </span>
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <ClipboardCheck
              className="w-4 h-4 cursor-pointer"
              onClick={() => handleCopy(pipeline?.deploymentUrl || '')}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default R2RServerCard;
