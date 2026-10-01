import React, { useEffect, useState } from 'react';
import { Activity, Bug, ShieldCheck } from 'lucide-react';
import { useUserContext } from '@/context/UserContext';
import { useWorkbenchContext } from '@/context/WorkbenchContext';

export const StatusBar: React.FC = () => {
  const { authState, getClient } = useUserContext();
  const { isDebugMode, setIsDebugMode } = useWorkbenchContext();
  const [latency, setLatency] = useState<number | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkPing = async () => {
      try {
        const client = await getClient();
        if (!client) return;
        const start = performance.now();
        await client.system.health();
        if (isMounted) {
          setLatency(Math.round(performance.now() - start));
          setIsHealthy(true);
        }
      } catch (e) {
        if (isMounted) setIsHealthy(false);
      }
    };
    checkPing();
    const interval = setInterval(checkPing, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [getClient]);

  return (
    <footer className="h-7 bg-card border-t border-border px-3 flex items-center justify-between text-[11px] text-muted-foreground select-none z-30">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
            }`}
          />
          <span>{isHealthy ? 'R2R Engine Online' : 'Engine Disconnected'}</span>
        </div>
        {latency !== null && (
          <div className="flex items-center space-x-1">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span>{latency}ms</span>
          </div>
        )}
        <div className="flex items-center space-x-1">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span>Role: {authState.userRole || 'User'}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsDebugMode(!isDebugMode)}
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors ${
            isDebugMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'hover:bg-accent text-muted-foreground'
          }`}
          title="Toggle Raw Vector & JSON Debug View"
        >
          <Bug className="w-3 h-3" />
          <span>Debug Mode: {isDebugMode ? 'ON' : 'OFF'}</span>
        </button>
        <span>
          Press <kbd className="bg-muted px-1 rounded text-[10px]">⌘K</kbd> for
          commands
        </span>
      </div>
    </footer>
  );
};
