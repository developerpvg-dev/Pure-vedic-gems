/**
 * ponytail: deploy-env self-check — run: npx tsx src/lib/deploy-env.selfcheck.ts
 */
import assert from 'node:assert/strict';
import { getDeployEnv, getDeployHostname, isPreviewDeploy, isProductionDeploy } from './deploy-env';

const saved = { ...process.env };

function reset() {
  for (const k of Object.keys(process.env)) {
    if (!(k in saved)) delete process.env[k];
  }
  Object.assign(process.env, saved);
  delete process.env.NEXT_PUBLIC_SITE_ENV;
  delete process.env.VERCEL_ENV;
  delete process.env.VERCEL_URL;
  delete process.env.CF_ENV;
  delete process.env.CF_PAGES_URL;
}

reset();
process.env.NEXT_PUBLIC_SITE_ENV = 'preview';
assert.equal(getDeployEnv(), 'preview');
assert.equal(isPreviewDeploy(), true);
assert.equal(isProductionDeploy(), false);

reset();
process.env.VERCEL_ENV = 'preview';
process.env.VERCEL_URL = 'pure-vedic-gems-git-payglocal-uat.vercel.app';
assert.equal(getDeployEnv(), 'preview');
assert.equal(getDeployHostname(), 'pure-vedic-gems-git-payglocal-uat.vercel.app');

reset();
process.env.VERCEL_ENV = 'production';
assert.equal(getDeployEnv(), 'production');

reset();
process.env.CF_ENV = 'preview';
process.env.CF_PAGES_URL = 'https://pure-vedic-gems-preview.workers.dev';
assert.equal(getDeployEnv(), 'preview');
assert.equal(getDeployHostname(), 'pure-vedic-gems-preview.workers.dev');

console.log('deploy-env.selfcheck: ok');
