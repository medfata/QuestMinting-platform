'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface UploadedImage {
  cid: string;
  ipfsUrl: string;
  gatewayUrl: string;
  fileName?: string;
}

interface ImageUploaderProps {
  mode: 'single' | 'multiple';
  value?: UploadedImage | UploadedImage[];
  onChange: (value: UploadedImage | UploadedImage[] | null) => void;
  maxFiles?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function ImageUploader({
  mode,
  value,
  onChange,
  maxFiles = 10,
  label = 'Upload Image',
  error,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const images = mode === 'single' 
    ? (value ? [value as UploadedImage] : [])
    : (value as UploadedImage[] || []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFiles = async (files: File[]) => {
    if (disabled) return;
    
    setIsUploading(true);
    setUploadError('');
    
    try {
      if (mode === 'single') {
        setUploadProgress('Uploading image...');
        const formData = new FormData();
        formData.append('action', 'upload-image');
        formData.append('file', files[0]);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const result = await response.json();
        onChange(result);
      } else {
        // Multiple files
        const newImages: UploadedImage[] = [...images];
        
        for (let i = 0; i < files.length; i++) {
          if (newImages.length >= maxFiles) break;
          
          setUploadProgress(`Uploading ${i + 1}/${files.length}...`);
          
          const formData = new FormData();
          formData.append('action', 'upload-image');
          formData.append('file', files[i]);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Failed to upload ${files[i].name}`);
          }

          const result = await response.json();
          newImages.push({ ...result, fileName: files[i].name });
        }
        
        onChange(newImages);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      uploadFiles(mode === 'single' ? [files[0]] : files);
    }
  }, [mode, images, maxFiles, disabled]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(mode === 'single' ? [files[0]] : files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    if (mode === 'single') {
      onChange(null);
    } else {
      const newImages = images.filter((_, i) => i !== index);
      onChange(newImages);
    }
  };

  const canAddMore = mode === 'multiple' ? images.length < maxFiles : images.length === 0;

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Upload Zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all duration-300 cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-foreground/5',
            disabled && 'opacity-50 cursor-not-allowed',
            isUploading && 'pointer-events-none'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={mode === 'multiple'}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">{uploadProgress}</p>
            </div>
          ) : (
            <>
              <svg
                className="mb-2 h-10 w-10 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-foreground">
                {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF, WebP, SVG (max 25MB)
              </p>
              {mode === 'multiple' && (
                <p className="text-xs text-muted-foreground">
                  {images.length}/{maxFiles} images
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Error Display */}
      {(error || uploadError) && (
        <p className="text-sm text-destructive">{error || uploadError}</p>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className={cn(
          'grid gap-3',
          mode === 'single' ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        )}>
          {images.map((img, index) => (
            <div
              key={img.cid}
              className="group relative rounded-lg border border-border bg-foreground/5 overflow-hidden"
            >
              <img
                src={img.gatewayUrl}
                alt={img.fileName || `Image ${index + 1}`}
                className={cn(
                  'w-full object-cover',
                  mode === 'single' ? 'h-48' : 'h-32'
                )}
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                <p className="truncate text-xs text-white" title={img.ipfsUrl}>
                  {img.cid.slice(0, 8)}...{img.cid.slice(-6)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* IPFS Info */}
      {mode === 'single' && images.length > 0 && (
        <div className="rounded-lg border border-border bg-foreground/5 p-3 text-xs">
          <p className="text-muted-foreground mb-1">IPFS URL:</p>
          <code className="block text-foreground break-all">{images[0].ipfsUrl}</code>
        </div>
      )}
    </div>
  );
}
