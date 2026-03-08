import { Folder, Plus, X } from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  id: string;
  onCreateNew?: (name: string) => Promise<{ id: string; name: string } | null>;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  id,
  onCreateNew,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleValueChange = (clickedValue: string) => {
    const newValue = value.includes(clickedValue)
      ? value.filter((v) => v !== clickedValue)
      : [...value, clickedValue];
    onChange(newValue);
  };

  const handleCreateNew = async () => {
    if (!newCollectionName.trim() || !onCreateNew) return;

    const newCollection = await onCreateNew(newCollectionName.trim());
    if (newCollection) {
      // Add newly created collection to selected values
      onChange([...value, newCollection.id]);
      setNewCollectionName('');
      setIsCreating(false);
    }
  };

  const getDisplayText = () => {
    if (value.length === 0) {
      return 'Select collections';
    }
    if (value.length === 1) {
      const selectedOption = options.find((opt) => opt.value === value[0]);
      return selectedOption ? selectedOption.label : '1 collection selected';
    }
    return `${value.length} collections selected`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" id={id} className="w-full justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {value.length === 0 ? (
              <span className="text-muted-foreground">Select collections</span>
            ) : value.length === 1 ? (
              <span className="flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5" />
                {options.find((opt) => opt.value === value[0])?.label ||
                  '1 collection selected'}
              </span>
            ) : (
              <>
                <Folder className="h-3.5 w-3.5" />
                <Badge variant="secondary" className="mr-1">
                  {value.length}
                </Badge>
                <span>collections selected</span>
              </>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command className="rounded-lg border-0">
          <CommandInput placeholder="Search collections..." />
          <CommandList>
            <CommandEmpty>No collections found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleValueChange(option.value)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleValueChange(option.value)}
                        className="pointer-events-none"
                      />
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{option.label}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {onCreateNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  {!isCreating ? (
                    <CommandItem
                      onSelect={() => setIsCreating(true)}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create new collection
                    </CommandItem>
                  ) : (
                    <div className="p-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Collection name"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newCollectionName.trim()) {
                              e.preventDefault();
                              handleCreateNew();
                            } else if (e.key === 'Escape') {
                              setIsCreating(false);
                              setNewCollectionName('');
                            }
                          }}
                          autoFocus
                          className="flex-1 h-9"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => {
                            setIsCreating(false);
                            setNewCollectionName('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        className="w-full h-9"
                        onClick={handleCreateNew}
                        disabled={!newCollectionName.trim()}
                      >
                        Create
                      </Button>
                    </div>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
