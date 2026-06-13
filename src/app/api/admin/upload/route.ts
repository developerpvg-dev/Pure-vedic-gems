import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const BUCKET = 'products';

/** Ensure the storage bucket exists; create it if missing. */
async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
    if (error) console.error('[upload] Failed to create bucket:', error.message);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];
  const requestedFolder = formData.get('folder');
  const baseFolder = typeof requestedFolder === 'string'
    ? requestedFolder.toLowerCase().replace(/[^a-z0-9/_-]/g, '-').replace(/-+/g, '-').replace(/^\/|\/$/g, '')
    : '';

  if (!files.length) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  if (files.length > 20) {
    return NextResponse.json({ error: 'Max 20 files per upload' }, { status: 400 });
  }

  const admin = createAdminClient();
  await ensureBucket(admin);

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
    const path = [baseFolder, folder, `${timestamp}-${safeName}`].filter(Boolean).join('/');

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      errors.push(`${file.name}: upload failed - ${error.message}`);
      continue;
    }

    const { data: urlData } = admin.storage
      .from(BUCKET)
      .getPublicUrl(path);

    urls.push(urlData.publicUrl);
  }

  return NextResponse.json({ urls, errors }, { status: urls.length > 0 ? 200 : 400 });
}
