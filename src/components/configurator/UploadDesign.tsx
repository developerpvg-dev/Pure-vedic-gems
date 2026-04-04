'use client';

/**
 * UploadDesign — Drag-and-drop custom jewelry design upload.
 * Uploads to Supabase Storage `custom-uploads` bucket.
 * Max 10MB, accepts JPG/PNG/PDF.
 */

import { useState, useRef, useCallback, useEffect, type DragEvent, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, X, FileImage, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.pdf';

interface UploadDesignProps {
  onUploadComplete: (publicUrl: string) => void;
  onCancel: () => void;
}

export default function UploadDesign({ onUploadComplete, onCancel }: UploadDesignProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return 'Please upload a JPG, PNG, or PDF file.';
    }
    if (f.size > MAX_FILE_SIZE) {
      return 'File size must be under 10MB.';
    }
    return null;
  };

  const handleFile = useCallback((f: File) => {
    setError(null);
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }

    setFile(f);

    // Generate preview for images
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/custom-design', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Upload failed. Please try again.');
      }

      const publicUrl = payload.publicUrl as string | undefined;
      if (!publicUrl) {
        throw new Error('Upload failed. Please try again.');
      }

      onUploadComplete(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary font-heading">
          Upload Custom Design
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">
          Cancel
        </Button>
      </div>

      {!file ? (
        /* Drop zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Drop zone — drag and drop or click to browse files"
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
            dragOver
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent'
          )}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-primary">
            Drag & drop or click to browse
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            JPG, PNG, or PDF · Max 10MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      ) : (
        /* File preview */
        <div className="flex items-start gap-3 rounded-xl border border-border p-3">
          {preview ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image src={preview} alt="Design preview" fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileImage className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-primary">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>

            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={uploading}
                className="h-7 gap-1 bg-accent text-accent-foreground hover:bg-accent/90 text-xs"
              >
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
              <Button size="sm" variant="ghost" onClick={clearFile} disabled={uploading} className="h-7 text-xs">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        💡 Our designer will contact you within 24 hours to discuss your custom design.
      </p>
    </div>
  );
}
