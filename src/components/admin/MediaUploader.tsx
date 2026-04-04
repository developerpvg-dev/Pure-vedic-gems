'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Film, Loader2 } from 'lucide-react';

interface MediaFile {
  url: string;
  name: string;
  type: 'image' | 'video';
  preview?: string;
}

interface MediaUploaderProps {
  value: MediaFile[];
  onChange: (files: MediaFile[]) => void;
}

export function MediaUploader({ value, onChange }: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;

    setError('');
    setUploading(true);

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        setUploading(false);
        return;
      }

      const newFiles: MediaFile[] = data.urls.map((url: string, i: number) => {
        const file = files[i];
        const isVideo = file?.type?.startsWith('video/');
        return {
          url,
          name: file?.name ?? `file-${i}`,
          type: isVideo ? 'video' as const : 'image' as const,
          preview: isVideo ? undefined : url,
        };
      });

      onChange([...value, ...newFiles]);

      if (data.errors?.length) {
        setError(data.errors.join('; '));
      }
    } catch {
      setError('Network error during upload');
    } finally {
      setUploading(false);
    }
  }, [value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  const removeFile = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const moveFile = (from: number, to: number) => {
    const updated = [...value];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? 'border-amber-500 bg-amber-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="text-sm text-gray-600">Uploading...</span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Drop images or videos here, or click to browse
            </span>
            <span className="text-xs text-gray-400">
              JPG, PNG, WebP, MP4, WebM — max 50MB each, up to 20 files
            </span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* URL input for external links */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Or paste an image/video URL and press Enter..."
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const input = e.currentTarget;
              const url = input.value.trim();
              if (url) {
                const isVideo = /\.(mp4|webm|mov)$/i.test(url);
                onChange([...value, {
                  url,
                  name: url.split('/').pop() || 'external',
                  type: isVideo ? 'video' : 'image',
                  preview: isVideo ? undefined : url,
                }]);
                input.value = '';
              }
            }
          }}
        />
      </div>

      {/* Preview grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((file, i) => (
            <div
              key={`${file.url}-${i}`}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              {file.type === 'video' ? (
                <div className="flex aspect-square items-center justify-center bg-gray-100">
                  <Film className="h-8 w-8 text-gray-400" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    VIDEO
                  </span>
                </div>
              ) : (
                <div className="relative aspect-square bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.preview || file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 flex items-start justify-between bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                {i === 0 && (
                  <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    THUMBNAIL
                  </span>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveFile(i, 0)}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-white"
                  >
                    Set as thumbnail
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="truncate px-2 py-1 text-[10px] text-gray-500">{file.name}</div>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <p className="text-xs text-gray-400">
          {value.filter(f => f.type === 'image').length} images, {value.filter(f => f.type === 'video').length} videos — first image is thumbnail. Hover to reorder or remove.
        </p>
      )}
    </div>
  );
}
