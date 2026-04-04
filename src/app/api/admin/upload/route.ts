import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('team_members')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  const m = member as { role: string; is_active: boolean } | null;
  if (!m?.is_active) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, role: m.role };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth && auth.error) return auth.error;

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

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

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const folder = ALLOWED_VIDEO_TYPES.includes(file.type) ? 'videos' : 'images';
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${timestamp}-${safeName}`;

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
