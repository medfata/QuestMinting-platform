'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export interface NFTUploadResult {
  imageCid: string;
  imageIpfsUrl: string;
  imageGatewayUrl: string;
  metadataCid: string;
  metadataIpfsUrl: string;
  metadataGatewayUrl: string;
}

export interface MultiNFTUploadResult {
  images: Array<{
    cid: string;
    ipfsUrl: string;
    gatewayUrl: string;
    fileName: string;
    metadataCid?: string;
    metadataIpfsUrl?: string;
  }>;
}

interface NFTImageUploaderProps {
  mode: 'single' | 'multiple';
  // For single mode
  value?: NFTUploadResult | null;
  onChange?: (value: NFTUploadResult | null) => void;
  // For multiple mode
  multiValue?: MultiNFTUploadResult | null;
  onMultiChange?: (value: MultiNFTUploadResult | null) => void;
  // Metadata fields (for auto-generating metadata)
  nftName?: string;
  nftDescription?: string;
  // Config
  maxFiles?: number;
  autoGenerateMetadata?: boolean;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function NFTImageUploader({
  mode,
  value,
  onChange,
  multiValue,
  onMultiChange,
  nftName = '',
  nftDescription = '',
  maxFiles = 100,
  autoGenerateMetadata = true,
  label,
  error,
  disabled = false,
}: NFTImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadSingleNFT = async (file: File) => {
    setIsUploading(true);
    setUploadError('');
    setUploadProgress('Uploading to IPFS...');

    try {
      if (autoGenerateMetadata && nftName) {
        // Upload image + generate metadata
        const formData = new FormData();
        formData.append('action', 'upload-nft');
        formData.append('file', file);
        formData.append('name', nftName);
        formData.append('description', nftDescription);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const result = await response.json();
        onChange?.({
          imageCid: result.image.cid,
          imageIpfsUrl: result.image.ipfsUrl,
          imageGatewayUrl: result.image.gatewayUrl,
          metadataCid: result.metadata.cid,
          metadataIpfsUrl: result.metadata.ipfsUrl,
          metadataGatewayUrl: result.metadata.gatewayUrl,
        });
      } else {
        // Just upload image
        const formData = new FormData();
        formData.append('action', 'upload-image');
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const result = await response.json();
        onChange?.({
          imageCid: result.cid,
          imageIpfsUrl: result.ipfsUrl,
          imageGatewayUrl: result.gatewayUrl,
          metadataCid: '',
          metadataIpfsUrl: '',
          metadataGatewayUrl: '',
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const uploadMultipleImages = async (files: File[]) => {
    setIsUploading(true);
    setUploadError('');

    try {
      const existingImages = multiValue?.images || [];
      const newImages = [...existingImages];
      const filesToUpload = files.slice(0, maxFiles - existingImages.length);

      for (let i = 0; i < filesToUpload.length; i++) {
        setUploadProgress(`Uploading ${i + 1}/${filesToUpload.length}...`);
        
        const formData = new FormData();
        formData.append('action', 'upload-image');
        formData.append('file', filesToUpload[i]);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to upload ${filesToUpload[i].name}`);
        }

        const result = await response.json();
        newImages.push({
          cid: result.cid,
          ipfsUrl: result.ipfsUrl,
          gatewayUrl: result.gatewayUrl,
          fileName: filesToUpload[i].name,
        });
      }

      onMultiChange?.({ images: newImages });
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
      if (mode === 'single') {
        uploadSingleNFT(files[0]);
      } else {
        uploadMultipleImages(files);
      }
    }
  }, [mode, multiValue, maxFiles, disabled, nftName, nftDescription, autoGenerateMetadata]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (mode === 'single') {
        uploadSingleNFT(files[0]);
      } else {
        uploadMultipleImages(files);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index?: number) => {
    if (mode === 'single') {
      onChange?.(null);
    } else if (index !== undefined) {
      const newImages = (multiValue?.images || []).filter((_, i) => i !== index);
      onMultiChange?.(newImages.length > 0 ? { images: newImages } : null);
    }
  };

  const generateMetadataForAll = async () => {
    if (!multiValue?.images || !nftName) return;
    
    setIsUploading(true);
    setUploadError('');

    try {
      const updatedImages = [...multiValue.images];
      
      for (let i = 0; i < updatedImages.length; i++) {
        if (updatedImages[i].metadataCid) continue; // Skip if already has metadata
        
        setUploadProgress(`Generating metadata ${i + 1}/${updatedImages.length}...`);
        
        const formData = new FormData();
        formData.append('action', 'upload-metadata');
        formData.append('name', `${nftName} #${i + 1}`);
        formData.append('description', nftDescription);
        formData.append('imageCid', updatedImages[i].cid);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate metadata');
        }

        const result = await response.json();
        updatedImages[i] = {
          ...updatedImages[i],
          metadataCid: result.cid,
          metadataIpfsUrl: result.ipfsUrl,
        };
      }

      onMultiChange?.({ images: updatedImages });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to generate metadata');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const hasImages = mode === 'single' ? !!value : (multiValue?.images?.length || 0) > 0;
  const canAddMore = mode === 'single' ? !value : (multiValue?.images?.length || 0) < maxFiles;
  const imageCount = mode === 'single' ? (value ? 1 : 0) : (multiValue?.images?.length || 0);

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-foreground">{label}</label>
          {mode === 'multiple' && (
            <span className="text-xs text-muted-foreground">{imageCount}/{maxFiles} images</span>
          )}
        </div>
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
              <svg className="mb-2 h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-foreground">
                {isDragging ? 'Drop image here' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF, WebP (max 25MB)
              </p>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {(error || uploadError) && (
        <p className="text-sm text-destructive">{error || uploadError}</p>
      )}

      {/* Single Image Preview */}
      {mode === 'single' && value && (
        <div className="space-y-3">
          <div className="group relative rounded-lg border border-border overflow-hidden">
            <img
              src={value.imageGatewayUrl}
              alt="NFT Preview"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage()}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="rounded-lg border border-border bg-foreground/5 p-3 text-xs space-y-2">
            <div>
              <p className="text-muted-foreground">Image IPFS:</p>
              <code className="text-foreground break-all">{value.imageIpfsUrl}</code>
            </div>
            {value.metadataIpfsUrl && (
              <div>
                <p className="text-muted-foreground">Metadata IPFS (tokenURI):</p>
                <code className="text-primary break-all">{value.metadataIpfsUrl}</code>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multiple Images Preview */}
      {mode === 'multiple' && multiValue?.images && multiValue.images.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {multiValue.images.map((img, index) => (
              <div key={img.cid} className="group relative rounded-lg border border-border overflow-hidden">
                <img
                  src={img.gatewayUrl}
                  alt={img.fileName}
                  className="w-full h-24 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
                  <p className="truncate text-[10px] text-white">#{index + 1}</p>
                </div>
                {img.metadataCid && (
                  <div className="absolute top-1 left-1">
                    <span className="rounded bg-green-500/80 px-1 py-0.5 text-[10px] text-white">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Generate Metadata Button */}
          {nftName && multiValue.images.some(img => !img.metadataCid) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateMetadataForAll}
              disabled={isUploading || !nftName}
            >
              Generate Metadata for All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
