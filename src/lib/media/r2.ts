/**
 * Server-only R2 helpers for public media (products, certificates, etc.).
 * Requires CLOUDFLARE_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY on the host
 * when NEXT_PUBLIC_CDN_URL is set (Vercel Production).
 */
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { publicCdnOrigin } from '@/lib/site-static';
import {
  isPublicMediaBucket,
  publicObjectUrl,
  supabaseObjectUrl,
  type PublicMediaBucket,
} from '@/lib/media/public-url';
import { createAdminClient } from '@/lib/supabase/admin';
import { isCloudflareRuntime } from '@/lib/deploy-env';

type R2BucketBinding = {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
};

/** Workers: native R2 binding (wrangler.jsonc PUBLIC_MEDIA) — no S3 SDK or access keys needed. */
async function publicMediaBinding(): Promise<R2BucketBinding | null> {
  if (!isCloudflareRuntime() || !publicCdnOrigin()) return null;
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const { env } = await getCloudflareContext({ async: true });
  return (env as { PUBLIC_MEDIA?: R2BucketBinding }).PUBLIC_MEDIA ?? null;
}

function r2Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY,
  );
}

/** True when new public uploads should go to R2 (CDN live + credentials present). */
export function useR2ForPublicMedia(): boolean {
  return Boolean(publicCdnOrigin()) && r2Configured();
}

let cached: S3Client | null = null;

function r2Client(): S3Client {
  if (cached) return cached;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials missing (CLOUDFLARE_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)');
  }
  cached = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cached;
}

function r2BucketName(): string {
  return process.env.R2_BUCKET || 'pvg-public';
}

export async function putPublicMediaObject(opts: {
  bucket: PublicMediaBucket;
  path: string;
  body: Buffer | ArrayBuffer | Uint8Array;
  contentType: string;
  cacheControl?: string;
}): Promise<string> {
  if (!isPublicMediaBucket(opts.bucket)) {
    throw new Error(`Bucket not allowed for public CDN: ${opts.bucket}`);
  }
  const key = `${opts.bucket}/${opts.path.replace(/^\/+/, '')}`;
  // Buffer.from(ArrayBuffer) is a zero-copy view — a second copy of a big upload risks the
  // Workers 128MB isolate limit. ponytail: whole file still sits in memory; ~40MB practical ceiling.
  const body = Buffer.isBuffer(opts.body) ? opts.body : Buffer.from(opts.body as ArrayBuffer);
  const cacheControl = opts.cacheControl ?? 'public, max-age=31536000, immutable';

  const binding = await publicMediaBinding();
  if (binding) {
    await binding.put(key, body, { httpMetadata: { contentType: opts.contentType, cacheControl } });
    return publicObjectUrl(opts.bucket, opts.path);
  }

  if (useR2ForPublicMedia()) {
    await r2Client().send(
      new PutObjectCommand({
        Bucket: r2BucketName(),
        Key: key,
        Body: body,
        ContentType: opts.contentType,
        CacheControl: cacheControl,
      }),
    );
    return publicObjectUrl(opts.bucket, opts.path);
  }

  // Fallback: Supabase Storage (local/dev without R2 keys)
  const admin = createAdminClient();
  const { error } = await admin.storage.from(opts.bucket).upload(opts.path, body, {
    contentType: opts.contentType,
    upsert: true,
    cacheControl: '31536000',
  });
  if (error) throw new Error(error.message);
  // ponytail: CDN env may be set before R2 keys on Vercel — don't return a CDN URL for a Supabase-only object
  return supabaseObjectUrl(opts.bucket, opts.path);
}

export async function deletePublicMediaObject(bucket: string, path: string): Promise<void> {
  const binding = isPublicMediaBucket(bucket) ? await publicMediaBinding() : null;
  if (binding) {
    await binding.delete(`${bucket}/${path.replace(/^\/+/, '')}`);
    return;
  }
  if (useR2ForPublicMedia() && isPublicMediaBucket(bucket)) {
    await r2Client().send(
      new DeleteObjectCommand({
        Bucket: r2BucketName(),
        Key: `${bucket}/${path.replace(/^\/+/, '')}`,
      }),
    );
    return;
  }
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) throw new Error(error.message);
}
