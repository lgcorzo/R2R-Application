import React from 'react';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RetrievalConfig, RetrievalPreset } from '@/types/workbench';

interface ParameterDrawerProps {
  config: RetrievalConfig;
  onChange: (updated: RetrievalConfig) => void;
}

export const ParameterDrawer: React.FC<ParameterDrawerProps> = ({
  config,
  onChange,
}) => {
  const handlePresetChange = (preset: RetrievalPreset) => {
    switch (preset) {
      case 'dense':
        onChange({
          ...config,
          preset,
          semanticWeight: 1.0,
          fullTextWeight: 0.0,
          useGraph: false,
        });
        break;
      case 'bm25':
        onChange({
          ...config,
          preset,
          semanticWeight: 0.0,
          fullTextWeight: 1.0,
          useGraph: false,
        });
        break;
      case 'hybrid':
        onChange({
          ...config,
          preset,
          semanticWeight: 0.7,
          fullTextWeight: 0.3,
          rrfK: 60,
          useGraph: false,
        });
        break;
      case 'graph_deep':
        onChange({
          ...config,
          preset,
          semanticWeight: 0.6,
          fullTextWeight: 0.4,
          useGraph: true,
        });
        break;
      case 'custom':
        onChange({ ...config, preset });
        break;
    }
  };

  return (
    <div className="p-3 bg-muted/30 border-b border-border space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Preset Profile</Label>
        <Select
          value={config.preset}
          onValueChange={(val) => handlePresetChange(val as RetrievalPreset)}
        >
          <SelectTrigger className="w-[180px] h-7 text-xs">
            <SelectValue placeholder="Select preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hybrid">Balanced Hybrid (RRF)</SelectItem>
            <SelectItem value="dense">Pure Dense (Vector)</SelectItem>
            <SelectItem value="bm25">Exact Match (BM25)</SelectItem>
            <SelectItem value="graph_deep">Deep Knowledge Graph</SelectItem>
            <SelectItem value="custom">Custom Weights</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">
              Dense Weight
            </span>
            <span className="font-mono text-[11px]">
              {(config.semanticWeight * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            value={[config.semanticWeight * 100]}
            max={100}
            step={5}
            onValueChange={([val]) =>
              onChange({
                ...config,
                preset: 'custom',
                semanticWeight: val / 100,
                fullTextWeight: (100 - val) / 100,
              })
            }
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-muted-foreground">
              Top K Chunks
            </span>
            <span className="font-mono text-[11px]">{config.limit}</span>
          </div>
          <Slider
            value={[config.limit]}
            min={1}
            max={50}
            step={1}
            onValueChange={([val]) => onChange({ ...config, limit: val })}
          />
        </div>
      </div>
    </div>
  );
};
