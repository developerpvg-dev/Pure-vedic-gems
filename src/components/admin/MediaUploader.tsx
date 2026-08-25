'use client';

import { useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Upload, X, Film, Loader2 } from 'lucide-react';

export interface MediaFile {
  url: string;
  name: string;
  type: 'image' | 'video';
  preview?: string;
}

export type MediaUploaderMode = 'all' | 'images' | 'videos';

interface MediaUploaderProps {
  value: MediaFile[];
  onChange: (files: MediaFile[]) => void;
  /** Restrict uploads / URL paste. Default: all. */
  mode?: MediaUploaderMode;
  /** Cap list length. Extra uploads replace when max is 1. */
  maxFiles?: number;
  /** Storage folder prefix forwarded to /api/admin/upload */
  folder?: string;
  /** Also delete our storage object when removing a tile (best-effort). */
  deleteStorageOnRemove?: boolean;
}

function isVideoUrl(url: string) {
  return (
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) ||
    /(youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com)/i.test(url)
  );
}

const ACCEPT: Record<MediaUploaderMode, string> = {
  all: 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime',
  images: 'image/jpeg,image/png,image/webp,image/gif',
  videos: 'video/mp4,video/webm,video/quicktime',
};

const DROP_HINT: Record<MediaUploaderMode, { title: string; sub: string; url: string }> = {
  all: {
    title: 'Drop images or videos here, or click to browse',
    sub: 'JPG, PNG, WebP, MP4, WebM — max 50MB each, up to 20 files',
    url: 'Or paste an image / video / YouTube / Vimeo URL and press Enter...',
  },
  images: {
    title: 'Drop images here, or click to browse',
    sub: 'JPG, PNG, WebP, GIF — max 50MB each',
    url: 'Or paste an image URL and press Enter...',
  },
  videos: {
    title: 'Drop a video here, or click to browse',
    sub: 'MP4, WebM — or paste a YouTube / Vimeo link below',
    url: 'Or paste a YouTube / Vimeo / video URL and press Enter...',
  },
};

export function MediaUploader({
  value,
  onChange,
  mode = 'all',
  maxFiles,
  folder,
  deleteStorageOnRemove = false,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hints = DROP_HINT[mode];

  const mergeFiles = useCallback(
    (incoming: MediaFile[]) => {
      if (!incoming.length) return;
      let next = [...value, ...incoming];
      if (typeof maxFiles === 'number' && next.length > maxFiles) {
        next = maxFiles === 1 ? incoming.slice(-1) : next.slice(0, maxFiles);
      }
      onChange(next);
    },
    [value, onChange, maxFiles],
  );

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      let files = Array.from(fileList);
      if (!files.length) return;

      if (mode === 'images') files = files.filter((f) => f.type.startsWith('image/'));
      if (mode === 'videos') files = files.filter((f) => f.type.startsWith('video/'));
      if (!files.length) {
        setError(mode === 'videos' ? 'Only video files are allowed here' : 'Only image files are allowed here');
        return;
      }

      if (typeof maxFiles === 'number' && maxFiles > 0 && mode !== 'all') {
        const room = maxFiles === 1 ? maxFiles : Math.max(0, maxFiles - value.length);
        if (room <= 0 && maxFiles !== 1) {
          setError(`Maximum ${maxFiles} file(s)`);
          return;
        }
        files = files.slice(0, maxFiles === 1 ? 1 : room);
      }

      setError('');
      setUploading(true);

      const formData = new FormData();
      for (const file of files) {
        formData.append('files', file);
      }
      if (folder) formData.append('folder', folder);

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
          const isVideo = file?.type?.startsWith('video/') || (mode === 'videos');
          return {
            url,
            name: file?.name ?? `file-${i}`,
            type: isVideo ? ('video' as const) : ('image' as const),
            preview: isVideo ? undefined : url,
          };
        });

        mergeFiles(newFiles);

        if (data.errors?.length) {
          setError(data.errors.join('; '));
        }
      } catch {
        setError('Network error during upload');
      } finally {
        setUploading(false);
      }
    },
    [mode, maxFiles, value.length, mergeFiles, folder],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles],
  );

  const removeFile = async (index: number) => {
    const target = value[index];
    if (deleteStorageOnRemove && target?.url) {
      // ponytail: best-effort storage delete; list update always proceeds
      await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target.url }),
      }).catch(() => null);
    }
    onChange(value.filter((_, i) => i !== index));
  };

  const moveFile = (from: number, to: number) => {
    const updated = [...value];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    onChange(updated);
  };

  const addUrl = (raw: string) => {
    const url = raw.trim();
    if (!url) return false;
    const video = isVideoUrl(url);
    if (mode === 'images' && video) {
      setError('Only image URLs are allowed here');
      return false;
    }
    if (mode === 'videos' && !video) {
      setError('Paste a YouTube, Vimeo, or direct video URL');
      return false;
    }
    setError('');
    // flushSync: paste then click Save must see videoFiles before buildBody runs
    flushSync(() => {
      mergeFiles([
        {
          url,
          name: url.split('/').pop() || 'external',
          type: video || mode === 'videos' ? 'video' : 'image',
          preview: video || mode === 'videos' ? undefined : url,
        },
      ]);
    });
    return true;
  };

  const commitUrlDraft = () => {
    if (!urlDraft.trim()) return;
    if (addUrl(urlDraft)) setUrlDraft('');
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
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
            <span className="text-sm font-medium text-gray-600">{hints.title}</span>
            <span className="text-xs text-gray-400">{hints.sub}</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles !== 1}
        accept={ACCEPT[mode]}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) uploadFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <input
          type="url"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          onBlur={commitUrlDraft}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text')?.trim();
            if (!pasted) return;
            // Commit immediately on paste so Save right after works without Enter
            e.preventDefault();
            if (addUrl(pasted)) setUrlDraft('');
            else setUrlDraft(pasted);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commitUrlDraft();
            }
          }}
          placeholder={hints.url}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="button"
          onClick={commitUrlDraft}
          className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Add
        </button>
      </div>
      {mode === 'videos' && value.length === 0 && (
        <p className="text-xs text-amber-700">
          Paste the YouTube link, then click Add (or press Enter) before saving — a VIDEO tile should appear above.
        </p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((file, i) => (
            <div
              key={`${file.url}-${i}`}
              className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              {file.type === 'video' ? (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open video"
                  className="relative flex aspect-square items-center justify-center bg-gray-100"
                >
                  <Film className="h-8 w-8 text-gray-400" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    VIDEO
                  </span>
                </a>
              ) : (
                <a
                  href={file.preview || file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open full size"
                  className="relative block aspect-square bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.preview || file.url}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                </a>
              )}

              {/* ponytail: pointer-events-none so click falls through to open-full-size link; buttons re-enable */}
              <div className="pointer-events-none absolute inset-0 flex items-start justify-between bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                {mode !== 'videos' && i === 0 && (
                  <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    THUMBNAIL
                  </span>
                )}
                {mode !== 'videos' && i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveFile(i, 0)}
                    className="pointer-events-auto rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-white"
                  >
                    Set as thumbnail
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void removeFile(i)}
                  className="pointer-events-auto rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="truncate px-2 py-1 text-[10px] text-gray-500">{file.name}</div>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && mode === 'all' && (
        <p className="text-xs text-gray-400">
          {value.filter((f) => f.type === 'image').length} images,{' '}
          {value.filter((f) => f.type === 'video').length} videos — first image is thumbnail. Click to
          view full size. Hover to reorder or remove.
        </p>
      )}
      {value.length > 0 && mode === 'images' && (
        <p className="text-xs text-gray-400">
          {value.length} image{value.length === 1 ? '' : 's'} — first image is the thumbnail. Click to
          view full size. Hover to reorder or remove.
        </p>
      )}
    </div>
  );
}
