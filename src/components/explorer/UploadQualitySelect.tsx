import { Edit, Sparkles, Upload } from 'lucide-react';
import React from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadQuality } from '@/types/explorer';

interface UploadQualitySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const QUALITY_DESCRIPTIONS: Record<UploadQuality, string> = {
  'hi-res': 'Maximum quality ensures best extraction and embedding results',
  fast: 'Faster processing with slightly lower quality',
  custom: 'Custom ingestion configuration',
};

export function UploadQualitySelect({
  value,
  onValueChange,
}: UploadQualitySelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Upload Quality</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hi-res">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span>Maximum Quality (hi-res)</span>
            </div>
          </SelectItem>
          <SelectItem value="fast">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-500" />
              <span>Fast (fast)</span>
            </div>
          </SelectItem>
          <SelectItem value="custom">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-purple-500" />
              <span>Custom (custom)</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {QUALITY_DESCRIPTIONS[value as UploadQuality] ||
          'Select upload quality'}
      </p>
    </div>
  );
}
