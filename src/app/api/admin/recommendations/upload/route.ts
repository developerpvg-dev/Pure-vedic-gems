import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX = 10 * 1024 * 1024;
const BUCKET = 'products';

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

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `recommendation-charts/${Date.now()}-${safeName}`;
  const { error } = await admin.storage.from(BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
