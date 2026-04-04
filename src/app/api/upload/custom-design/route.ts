import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit } from '@/lib/utils/rate-limit';

const BUCKET = 'custom-uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.storage.getBucket(BUCKET);

  if (!data) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!rateLimit(`custom-design-upload:${ip}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many uploads. Please wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Please upload a JPG, PNG, or PDF file.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File size must be under 10MB.' },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    await ensureBucket(admin);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'custom-design';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error } = await admin.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Upload failed. Please try again.',
      },
      { status: 500 }
    );
  }
}