import { Edit, Sparkles, Upload } from 'lucide-react';
import { CollectionResponse } from 'r2r-js';
import React from 'react';

import { MetadataEditor } from '@/components/explorer/MetadataEditor';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadQuality } from '@/types/explorer';

export interface UploadConfigFormProps {
  /** Available collections for selection */
  collections: CollectionResponse[];
  /** Selected collection IDs */
  selectedCollectionIds: string[];
  /** Current upload quality */
  uploadQuality: string;
  /** Current metadata */
  metadata: Record<string, string>;
  /** Callback when collections change */
  onCollectionsChange: (collectionIds: string[]) => void;
  /** Callback when quality changes */
  onQualityChange: (quality: string) => void;
  /** Callback when metadata changes */
  onMetadataChange: (metadata: Record<string, string>) => void;
  /** Callback to create new collection */
  onCreateCollection: (
    name: string
  ) => Promise<{ id: string; name: string } | null>;
  /** Whether the form is disabled */
  disabled?: boolean;
}

/**
 * UploadConfigForm component for configuring upload settings.
 * Provides collection selection, quality settings, and metadata editing.
 * Reusable across File Upload and URL Upload tabs.
 */
export const UploadConfigForm: React.FC<UploadConfigFormProps> = ({
  collections,
  selectedCollectionIds,
  uploadQuality,
  metadata,
  onCollectionsChange,
  onQualityChange,
  onMetadataChange,
  onCreateCollection,
  disabled = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Collection Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Collections</label>
        <MultiSelect
          id="upload-collections"
          options={collections.map((collection) => ({
            value: collection.id,
            label: collection.name || collection.id,
          }))}
          value={selectedCollectionIds}
          onChange={onCollectionsChange}
          onCreateNew={onCreateCollection}
        />
        {selectedCollectionIds.length === 0 && (
          <p className="text-xs text-muted-foreground">
            If no collection is selected, documents will be added to "All
            Documents"
          </p>
        )}
      </div>

      {/* Quality Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Upload Quality</label>
        <Select
          value={uploadQuality}
          onValueChange={onQualityChange}
          disabled={disabled}
        >
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
          {uploadQuality === 'hi-res' &&
            'Maximum quality ensures best extraction and embedding results'}
          {uploadQuality === 'fast' &&
            'Faster processing with slightly lower quality'}
          {uploadQuality === 'custom' && 'Custom ingestion configuration'}
        </p>
      </div>

      {/* Metadata Editor */}
      <MetadataEditor
        metadata={metadata}
        onMetadataChange={onMetadataChange}
        disabled={disabled}
        helpText="Add custom metadata to help organize and filter your documents. Metadata applies to all files and can be used for filtering, searching, and categorization."
      />
    </div>
  );
};
