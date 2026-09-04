import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { putPublicMediaObject } from '@/lib/media/r2';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('content.manage');
  if ('error' in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Upload JPG, PNG, WebP, or PDF certificates only' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Certificate file must be 10MB or smaller' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `lab-certificates/${Date.now()}-${safeName}`;
  try {
    const url = await putPublicMediaObject({
      bucket: 'certificates',
      path,
      body: await file.arrayBuffer(),
      contentType: file.type,
    });
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Certificate upload failed' }, { status: 500 });
  }
}
