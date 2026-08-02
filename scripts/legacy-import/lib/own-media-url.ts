/**
 * Upload a remote image to Supabase product-images and return the public URL.
 * Used by gap-fill so we never persist purevedicgems.in/.com wp-content URLs.
 */
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const MEDIA_BUCKET = process.env.MEDIA_BUCKET ?? 'product-images';
const FETCH_TIMEOUT_MS = 45_000;

let cached: SupabaseClient | null = null;

function adminClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.LEGACY_IMPORT_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.LEGACY_IMPORT_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase URL / service role for media ingest');
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

/** If url is a WP uploads URL, download → webp → Supabase. Otherwise return as-is. */
export async function ownMediaUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (!/purevedicgems\.(in|com)\/wp-content\/uploads/i.test(url)) return url;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  let bytes: Buffer;
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    bytes = Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
  if (bytes.byteLength < 200) throw new Error(`image too small for ${url}`);

  const sha = createHash('sha256').update(bytes).digest('hex');
  const webp = await sharp(bytes, { failOn: 'none' }).rotate().webp({ quality: 82 }).toBuffer();
  const key = `legacy/${sha.slice(0, 2)}/${sha}.webp`;
  const supabase = adminClient();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(key, webp, { contentType: 'image/webp', upsert: true, cacheControl: '31536000' });
  if (error) throw new Error(error.message);
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(key).data.publicUrl;
}
