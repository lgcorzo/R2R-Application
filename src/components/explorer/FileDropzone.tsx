import { Upload } from 'lucide-react';
import React from 'react';
import { DropzoneOptions, useDropzone } from 'react-dropzone';

export interface FileDropzoneProps {
  /** Callback when files are dropped or selected */
  onDrop: (files: File[]) => void;
  /** Whether the dropzone is disabled */
  disabled?: boolean;
  /** Custom message for the dropzone */
  message?: string;
  /** Custom description for supported file types */
  description?: string;
  /** Additional dropzone options */
  dropzoneOptions?: Omit<DropzoneOptions, 'onDrop'>;
}

/**
 * FileDropzone component for drag-and-drop file upload.
 * Provides visual feedback for drag states and supports click-to-select.
 */
export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onDrop,
  disabled = false,
  message = 'Drag and drop files here, or click to select',
  description = 'Supports PDF, DOCX, TXT, JPG, PNG, and more',
  dropzoneOptions,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    multiple: true,
    ...dropzoneOptions,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center">
        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-sm font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-sm font-medium mb-1">{message}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </div>
    </div>
  );
};
