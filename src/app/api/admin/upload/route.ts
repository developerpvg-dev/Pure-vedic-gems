import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { hasAdminPermission } from '@/lib/admin/rbac';
import { putPublicMediaObject, deletePublicMediaObject } from '@/lib/media/r2';
import { storageObjectFromPublicUrl } from '@/lib/supabase/storage-public-url';
import type { PublicMediaBucket } from '@/lib/media/public-url';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_BUCKETS = new Set<PublicMediaBucket>(['products', 'jewelry-designs']);

async function requireUploadAccess() {
  const auth = await requireAdminAccess();
  if ('error' in auth) return auth;
  const ok =
    hasAdminPermission(auth.member.role, 'products.write', auth.member.permissions) ||
    hasAdminPermission(auth.member.role, 'orders.write', auth.member.permissions);
  if (!ok) {
    return { error: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }) };
  }
  return auth;
}

export async function POST(request: NextRequest) {
  const auth = await requireUploadAccess();
  if ('error' in auth) return auth.error;

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const requestedFolder = formData.get('folder');
  const requestedBucket = formData.get('bucket');
  const bucketRaw = typeof requestedBucket === 'string' ? requestedBucket.trim() : 'products';
  if (!ALLOWED_BUCKETS.has(bucketRaw as PublicMediaBucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
  }
  const bucket = bucketRaw as PublicMediaBucket;

  const baseFolder =
    typeof requestedFolder === 'string'
      ? requestedFolder
          .toLowerCase()
          .replace(/[^a-z0-9/_-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^\/|\/$/g, '')
      : '';

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  if (files.length > 20) {
    return NextResponse.json({ error: 'Max 20 files per upload' }, { status: 400 });
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: unsupported file type (${file.type})`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: exceeds 50MB limit`);
      continue;
    }

    const folder = ALLOWED_VIDEO_TYPES.includes(file.type) ? 'videos' : 'images';
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    // jewelry-designs historically used flat keys; keep optional folder for products
    const path =
      bucket === 'jewelry-designs' && !baseFolder
        ? `${timestamp}-${safeName}`
        : [baseFolder, folder, `${timestamp}-${safeName}`].filter(Boolean).join('/');

    try {
      const url = await putPublicMediaObject({
        bucket,
        path,
        body: await file.arrayBuffer(),
        contentType: file.type,
      });
      urls.push(url);
    } catch (e) {
      errors.push(`${file.name}: upload failed - ${e instanceof Error ? e.message : 'error'}`);
    }
  }

  return NextResponse.json({ urls, errors }, { status: urls.length > 0 ? 200 : 400 });
}

/**
 * DELETE /api/admin/upload
 * Body: { url } | { urls: string[] }
 * Removes objects from public CDN/R2 or Supabase when URL is ours.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireUploadAccess();
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const raw = Array.isArray(body?.urls)
    ? body.urls
    : typeof body?.url === 'string'
      ? [body.url]
      : [];
  const urls = raw.filter((u: unknown): u is string => typeof u === 'string' && u.trim().length > 0);
  if (!urls.length) {
    return NextResponse.json({ error: 'url or urls required' }, { status: 400 });
  }

  const removed: string[] = [];
  const skipped: string[] = [];

  for (const url of urls) {
    const obj = storageObjectFromPublicUrl(url);
    if (!obj || obj.bucket === 'custom-uploads') {
      skipped.push(url);
      continue;
    }
    try {
      await deletePublicMediaObject(obj.bucket, obj.path);
      removed.push(url);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : 'delete failed', removed, skipped },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ removed, skipped });
}
