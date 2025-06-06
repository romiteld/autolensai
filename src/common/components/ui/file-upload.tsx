'use client';

import { useCallback, useState } from 'react';
import { cn } from '@/common/utils/cn';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  files,
  onFilesChange,
  maxFiles = 10,
  accept = 'image/*',
  className,
  disabled,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = droppedFiles.filter(file => file.type.startsWith('image/'));
      const newFiles = [...files, ...validFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, onFilesChange, maxFiles, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && !disabled) {
        const selectedFiles = Array.from(e.target.files);
        const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
        onFilesChange(newFiles);
        e.target.value = '';
      }
    },
    [files, onFilesChange, maxFiles, disabled]
  );

  const removeFile = useCallback(
    (index: number) => {
      if (disabled) return;
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange, disabled]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400',
          files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && files.length < maxFiles && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled || files.length >= maxFiles}
        />
        
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {dragActive ? 'Drop files here' : 'Upload vehicle images'}
        </p>
        <p className="text-sm text-gray-600">
          Drag and drop or click to select files ({files.length}/{maxFiles})
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Supports: JPG, PNG, WebP (max 10MB each)
        </p>
      </div>

      {/* File Preview */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              {!disabled && (
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              <p className="text-xs text-gray-600 mt-1 truncate">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}