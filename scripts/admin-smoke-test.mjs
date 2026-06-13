#!/usr/bin/env node
/**
 * Smoke test admin pages and API routes.
 * Expects 401/403 for APIs without auth, or 200/307 for pages.
 * Fails on 500+ or connection errors.
 */

const BASE = process.env.ADMIN_SMOKE_BASE ?? 'http://localhost:3000';

const ADMIN_PAGES = [
  '/admin',
  '/admin/orders',
  '/admin/customers',
  '/admin/rewards',
  '/admin/products',
  '/admin/yagyas',
  '/admin/yagya-bookings',
  '/admin/products/import',
  '/admin/categories',
  '/admin/configurations',
  '/admin/metals',
  '/admin/designs',
  '/admin/certifications',
  '/admin/energizations',
  '/admin/leads',
  '/admin/consultation-plans',
  '/admin/reviews',
  '/admin/category-reviews',
  '/admin/notifications',
  '/admin/finance',
  '/admin/compliance',
  '/admin/settings',
  '/admin/events',
  '/admin/videos',
  '/admin/lab-certificates',
  '/admin/testimonials',
  '/admin/feedback',
];

const ADMIN_APIS = [
  '/api/admin/dashboard',
  '/api/admin/orders',
  '/api/admin/orders/analytics',
  '/api/admin/customers',
  '/api/admin/customers/analytics',
  '/api/admin/products',
  '/api/admin/products/analytics',
  '/api/admin/products/filter-options',
  '/api/admin/leads',
  '/api/admin/leads/analytics',
  '/api/admin/finance',
  '/api/admin/metals',
  '/api/admin/metals/analytics',
  '/api/admin/certifications',
  '/api/admin/certifications/analytics',
  '/api/admin/energizations',
  '/api/admin/energizations/analytics',
  '/api/admin/yagyas',
  '/api/admin/yagyas/analytics',
  '/api/admin/yagya-bookings',
  '/api/admin/yagya-bookings/analytics',
  '/api/admin/events/categories',
  '/api/admin/events/videos',
  '/api/admin/events/analytics',
  '/api/admin/videos',
  '/api/admin/videos/categories',
  '/api/admin/videos/analytics',
  '/api/admin/testimonials',
  '/api/admin/testimonials/analytics',
  '/api/admin/feedback',
  '/api/admin/feedback/analytics',
  '/api/admin/reviews',
  '/api/admin/reviews/analytics',
  '/api/admin/notifications',
  '/api/admin/notifications/analytics',
  '/api/admin/compliance',
  '/api/admin/compliance/analytics',
  '/api/admin/configurations',
  '/api/admin/configurations/analytics',
  '/api/admin/broadcast-notifications',
  '/api/admin/settings',
  '/api/admin/designs',
  '/api/admin/categories',
  '/api/admin/homepage-categories',
  '/api/admin/consultation-plans',
  '/api/admin/rewards',
  '/api/admin/lab-certificates',
  '/api/admin/category-reviews',
];

async function check(path, type) {
  const url = `${BASE}${path}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const status = res.status;
    const okForPage = type === 'page' && (status < 400 || status === 401 || status === 403 || status === 307 || status === 308);
    const okForApi = type === 'api' && (status < 500);
    const ok = type === 'page' ? okForPage : okForApi;
    if (!ok) {
      const body = await res.text().catch(() => '');
      return { path, status, ok: false, detail: body.slice(0, 200) };
    }
    return { path, status, ok: true };
  } catch (err) {
    return { path, status: 0, ok: false, detail: String(err.message ?? err) };
  }
}

async function main() {
  console.log(`Admin smoke test → ${BASE}\n`);
  const results = [];

  for (const path of ADMIN_PAGES) {
    results.push({ ...(await check(path, 'page')), type: 'page' });
  }
  for (const path of ADMIN_APIS) {
    results.push({ ...(await check(path, 'api')), type: 'api' });
  }

  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok);

  for (const r of passed) {
    console.log(`✓ [${r.type}] ${r.path} → ${r.status}`);
  }

  if (failed.length) {
    console.log('\n--- FAILURES ---');
    for (const r of failed) {
      console.log(`✗ [${r.type}] ${r.path} → ${r.status} ${r.detail ? `(${r.detail})` : ''}`);
    }
    process.exit(1);
  }

  console.log(`\nAll ${results.length} routes OK (${passed.length}).`);
}

main();
