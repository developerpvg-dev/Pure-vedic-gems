/**
 * Refuses to build/deploy a checkout that is missing commits already on main or cloudflare-workers.
 * Deploying a stale branch silently rolls back live fixes (2026-10-06: a deploy from main undid the
 * request-loop fix and cost a day of 5M requests). Override with SKIP_DEPLOY_GUARD=1.
 */
import { execSync } from 'node:child_process';

if (process.env.SKIP_DEPLOY_GUARD === '1') process.exit(0);

const git = (args) => execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
const ok = (args) => {
  try {
    git(args);
    return true;
  } catch {
    return false;
  }
};

if (!ok('rev-parse --git-dir')) {
  console.warn('deploy-guard: not a git checkout, skipping');
  process.exit(0);
}
if (!ok('fetch --quiet origin main cloudflare-workers')) {
  console.warn('deploy-guard: git fetch failed (offline?), skipping');
  process.exit(0);
}

const missing = ['origin/main', 'origin/cloudflare-workers'].filter(
  (ref) => ok(`rev-parse --verify --quiet ${ref}`) && !ok(`merge-base --is-ancestor ${ref} HEAD`),
);

if (missing.length) {
  console.error(
    `\ndeploy-guard: this checkout is missing commits from ${missing.join(' and ')}.\n` +
      'Deploying it would undo changes that are already live.\n' +
      'Fix: git pull origin main && git pull origin cloudflare-workers (then push), and build again.\n',
  );
  process.exit(1);
}
console.log('deploy-guard: checkout includes main and cloudflare-workers');
