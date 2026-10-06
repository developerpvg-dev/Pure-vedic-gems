import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getEmailSiteUrl } from '@/lib/resend/email-config';

// Fixtures that exercise VERCEL_URL parsing / rewriting of legacy stored links.
const ALLOWED = new Set(['src/lib/deploy-env.selfcheck.ts', 'scripts/check-shop-buy-urls.ts']);

function sourceFiles(dir: string): string[] {
  return (readdirSync(join(process.cwd(), dir), { recursive: true }) as string[])
    .filter((f) => /\.(ts|tsx|js|mjs|cjs)$/.test(f))
    .map((f) => `${dir}/${f.replace(/\\/g, '/')}`);
}

describe('site URLs', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('production emails link to the live site even if EMAIL_SITE_URL is stale', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.purevedicgems.com');
    vi.stubEnv('EMAIL_SITE_URL', 'https://pure-vedic-gems.vercel.app');
    vi.stubEnv('NEXT_PUBLIC_SITE_ENV', 'production');
    expect(getEmailSiteUrl()).toBe('https://www.purevedicgems.com');
    vi.stubEnv('NEXT_PUBLIC_SITE_ENV', 'preview');
    expect(getEmailSiteUrl()).toBe('https://pure-vedic-gems.vercel.app');
  });

  it('has no hardcoded *.vercel.app hosts (site runs on Cloudflare; the Vercel project is paused)', () => {
    const files = [...sourceFiles('src'), ...sourceFiles('cloudflare'), ...sourceFiles('scripts'), 'wrangler.jsonc'];
    const hits = files
      .filter((f) => !ALLOWED.has(f))
      .filter((f) => /[\w-]+\.vercel\.app/i.test(readFileSync(join(process.cwd(), f), 'utf8')));
    expect(hits).toEqual([]);
  });
});
