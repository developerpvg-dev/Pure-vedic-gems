/**
 * Thin cron Worker: hits the Next app's purge route with CRON_SECRET.
 * Deploy: npx wrangler deploy -c cloudflare/cron-purge/wrangler.jsonc
 *
 * Secrets (wrangler secret put … -c cloudflare/cron-purge/wrangler.jsonc):
 *   CRON_SECRET, PURGE_URL (e.g. https://www.purevedicgems.com/api/cron/purge-product-trash)
 */
export interface Env {
  CRON_SECRET: string;
  PURGE_URL: string;
}

type ScheduledControllerLike = { scheduledTime: number; cron: string };
type ExecutionContextLike = { waitUntil(promise: Promise<unknown>): void };

export default {
  async scheduled(_controller: ScheduledControllerLike, env: Env, ctx: ExecutionContextLike) {
    ctx.waitUntil(runPurge(env));
  },
};

async function runPurge(env: Env) {
  if (!env.CRON_SECRET || !env.PURGE_URL) {
    console.error('[pvg-cron-purge] missing CRON_SECRET or PURGE_URL');
    return;
  }
  const res = await fetch(env.PURGE_URL, {
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
  });
  if (!res.ok) {
    console.error('[pvg-cron-purge] failed', res.status, await res.text().catch(() => ''));
  }
}
