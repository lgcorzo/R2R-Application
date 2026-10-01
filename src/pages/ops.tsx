import Head from 'next/head';
import React from 'react';

import { EngineConfigCard } from '@/components/ops/EngineConfigCard';
import { LatencyWaterfall } from '@/components/ops/LatencyWaterfall';

export default function OpsPage() {
  return (
    <>
      <Head>
        <title>Telemetry & Ops | R2R Workbench</title>
      </Head>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full select-none">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Telemetry & Engine Operations
          </h2>
          <p className="text-xs text-muted-foreground">
            Monitor cluster health, pipeline latency percentiles, and active
            runtime configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LatencyWaterfall />
          <EngineConfigCard />
        </div>
      </div>
    </>
  );
}
