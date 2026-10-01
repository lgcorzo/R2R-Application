import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server } from 'lucide-react';
import { useUserContext } from '@/context/UserContext';

export const EngineConfigCard: React.FC = () => {
  const { getClient } = useUserContext();
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) return;
        const res = await client.system.settings();
        if (isMounted) {
          setConfig(res?.results || res || {});
        }
      } catch (e) {
        console.error('Error fetching engine settings in EngineConfigCard:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchConfig();
    return () => {
      isMounted = false;
    };
  }, [getClient]);

  return (
    <Card className="bg-card/40 border-border">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-xs font-semibold flex items-center space-x-2">
          <Server className="w-4 h-4 text-primary" />
          <span>Active R2R Engine Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
            Loading configuration...
          </div>
        ) : (
          <pre className="p-3 bg-muted/50 rounded font-mono text-[11px] text-foreground/80 max-h-60 overflow-y-auto select-text">
            {JSON.stringify(config, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};
