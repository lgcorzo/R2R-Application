import { HelpCircle, Plus, X } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetadataField {
  id: string;
  key: string;
  value: string;
  placeholder: string;
  showPresets: boolean;
}

const METADATA_PRESETS = [
  { key: 'project', label: 'Project', example: 'My Project' },
  { key: 'department', label: 'Department', example: 'Engineering' },
  { key: 'category', label: 'Category', example: 'Documentation' },
  { key: 'version', label: 'Version', example: '1.0.0' },
  { key: 'author', label: 'Author', example: 'John Doe' },
  { key: 'tags', label: 'Tags', example: 'important, draft' },
  { key: 'source', label: 'Source', example: 'Internal' },
];

export interface MetadataEditorProps {
  /** Current metadata key-value pairs */
  metadata: Record<string, string>;
  /** Callback when metadata changes */
  onMetadataChange: (metadata: Record<string, string>) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Custom label for the editor */
  label?: string;
  /** Custom help text */
  helpText?: string;
  /** Whether to show presets dropdown */
  showPresets?: boolean;
}

/**
 * MetadataEditor component for managing document metadata.
 * Supports key-value pairs with preset suggestions and validation.
 */
export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  metadata,
  onMetadataChange,
  disabled = false,
  label = 'Metadata',
  helpText = 'Add custom metadata to help organize and filter your documents. Metadata applies to all selected files and can be used for filtering, searching, and categorization. For example, you can tag files with project names, departments, or any other relevant information.',
  showPresets = true,
}) => {
  const [editableFields, setEditableFields] = useState<MetadataField[]>([]);

  const handleAddField = () => {
    const newFieldId = crypto.randomUUID();
    setEditableFields((prev) => [
      ...prev,
      {
        id: newFieldId,
        key: '',
        value: '',
        placeholder: '',
        showPresets: false,
      },
    ]);
  };

  const handleRemoveField = (fieldId: string) => {
    setEditableFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const handleUpdateField = (
    fieldId: string,
    updates: Partial<MetadataField>
  ) => {
    setEditableFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    );
  };

  const handleSaveField = (field: MetadataField) => {
    const key = field.key.trim();
    const value = (field.value || field.placeholder).trim();

    if (key && value) {
      onMetadataChange({
        ...metadata,
        [key]: value,
      });
      handleRemoveField(field.id);
    }
  };

  const handleRemoveMetadata = (key: string) => {
    const newMetadata = { ...metadata };
    delete newMetadata[key];
    onMetadataChange(newMetadata);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium">{label}</label>
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle
                    className="h-3.5 w-3.5 text-muted-foreground cursor-help"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <p className="text-xs text-muted-foreground ml-2">
            Add key-value pairs to organize and filter documents.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 border-2 border-primary text-primary bg-transparent hover:bg-primary/10 font-semibold"
          onClick={handleAddField}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add metadata
        </Button>
      </div>

      {/* Existing metadata entries */}
      {Object.entries(metadata).length > 0 && (
        <div className="space-y-2">
          {Object.entries(metadata).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-muted-foreground mb-0.5">
                  {key}
                </div>
                <div className="text-sm truncate">{value}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={() => handleRemoveMetadata(key)}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Editable metadata fields */}
      {editableFields.length > 0 && (
        <div className="space-y-2">
          {editableFields.map((field) => (
            <div key={field.id} className="p-2 border rounded-md bg-muted/20">
              <div className="flex items-center gap-2">
                {showPresets ? (
                  <div className="relative flex-1">
                    <Popover
                      open={field.showPresets}
                      onOpenChange={(open) => {
                        handleUpdateField(field.id, { showPresets: open });
                      }}
                    >
                      <PopoverAnchor asChild>
                        <div className="w-full" data-popover-anchor>
                          <Input
                            placeholder="Key (e.g., project, department)"
                            value={field.key}
                            onChange={(e) => {
                              handleUpdateField(field.id, {
                                key: e.target.value,
                                showPresets: false,
                              });
                            }}
                            onFocus={() => {
                              handleUpdateField(field.id, {
                                showPresets: true,
                              });
                            }}
                            className={`flex-1 w-full ${field.showPresets ? 'border-primary' : ''}`}
                            disabled={disabled}
                          />
                        </div>
                      </PopoverAnchor>
                      <PopoverContent
                        className="p-0"
                        align="start"
                        side="bottom"
                        sideOffset={4}
                        style={{
                          width: 'var(--radix-popover-anchor-width, 100%)',
                          minWidth: 'var(--radix-popover-anchor-width)',
                        }}
                      >
                        <Command>
                          <CommandList>
                            <CommandGroup heading="Quick presets">
                              {METADATA_PRESETS.map((preset) => (
                                <CommandItem
                                  key={preset.key}
                                  value={`${preset.label} ${preset.example}`}
                                  onSelect={() => {
                                    handleUpdateField(field.id, {
                                      key: preset.key,
                                      value: '',
                                      placeholder: preset.example,
                                      showPresets: false,
                                    });
                                  }}
                                  className="cursor-pointer"
                                >
                                  <span className="font-medium">
                                    {preset.label}
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    ({preset.example})
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : (
                  <Input
                    placeholder="Key"
                    value={field.key}
                    onChange={(e) => {
                      handleUpdateField(field.id, { key: e.target.value });
                    }}
                    className="flex-1"
                    disabled={disabled}
                  />
                )}

                <Input
                  placeholder={field.placeholder || 'Value'}
                  value={field.value}
                  onChange={(e) => {
                    handleUpdateField(field.id, {
                      value: e.target.value,
                      placeholder: '',
                    });
                  }}
                  onFocus={() => {
                    if (field.placeholder && !field.value) {
                      handleUpdateField(field.id, { placeholder: '' });
                    }
                  }}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && field.key.trim()) {
                      handleSaveField(field);
                    } else if (e.key === 'Escape') {
                      handleRemoveField(field.id);
                    }
                  }}
                  disabled={disabled}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => handleRemoveField(field.id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
