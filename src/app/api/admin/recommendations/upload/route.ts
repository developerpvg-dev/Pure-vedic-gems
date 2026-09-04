import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin/api';
import { putPublicMediaObject } from '@/lib/media/r2';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ error: 'Max 10MB' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `recommendation-charts/${Date.now()}-${safeName}`;
  try {
    const url = await putPublicMediaObject({
      bucket: 'products',
      path,
      body: await file.arrayBuffer(),
      contentType: file.type,
    });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
