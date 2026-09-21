/**
 * Host-agnostic deploy environment (Vercel / Cloudflare Workers / local).
 * Prefer NEXT_PUBLIC_SITE_ENV when set; else infer from platform vars.
 */
export type DeployEnv = 'production' | 'preview' | 'development';

export function getDeployEnv(): DeployEnv {
  const explicit = process.env.NEXT_PUBLIC_SITE_ENV?.trim().toLowerCase();
  if (explicit === 'production' || explicit === 'preview' || explicit === 'development') {
    return explicit;
  }

  if (process.env.VERCEL_ENV === 'production') return 'production';
  if (process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development') {
    return process.env.VERCEL_ENV === 'development' ? 'development' : 'preview';
  }

  const cfEnv = (process.env.CF_ENV || process.env.ENVIRONMENT || '').trim().toLowerCase();
  if (cfEnv === 'production' || cfEnv === 'prod') return 'production';
  if (cfEnv === 'preview' || cfEnv === 'staging') return 'preview';

  if (process.env.NODE_ENV !== 'production') return 'development';
  return 'production';
}

export function isProductionDeploy(): boolean {
  return getDeployEnv() === 'production';
}

export function isPreviewDeploy(): boolean {
  return getDeployEnv() === 'preview';
}

/**
 * Hostname of *this* deployment (for preview callbacks).
 * Prefers platform preview host over NEXT_PUBLIC_SITE_URL (often still www).
 */
export function getDeployHostname(): string | null {
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return vercel.replace(/^https?:\/\//i, '').replace(/\/$/, '');

  const cfPages = process.env.CF_PAGES_URL?.trim();
  if (cfPages) {
    try {
      return new URL(cfPages.includes('://') ? cfPages : `https://${cfPages}`).hostname;
    } catch {
      return cfPages.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    }
  }

  // Workers preview often sets CF_PAGES_URL; fall back to SITE_URL only if not live www.
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      const host = new URL(site.includes('://') ? site : `https://${site}`).hostname;
      if (!/^www\.?purevedicgems\.com$/i.test(host) && !/^purevedicgems\.com$/i.test(host)) {
        return host;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function getDeployCommitSha(): string {
  return (
    process.env.WORKERS_CI_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    'local'
  );
}

/** True when running on Cloudflare Workers (Browser Rendering path, etc.). */
export function isCloudflareRuntime(): boolean {
  return Boolean(process.env.CF_PAGES || process.env.CF_WORKER || process.env.CLOUDFLARE === '1');
}
