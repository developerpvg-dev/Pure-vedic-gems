import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/shop',
  '/cart',
  '/checkout',
  '/policies/privacy',
  '/policies/terms',
  '/policies/returns',
  '/policies/shipping',
  '/policies/legal-notice',
];

test.describe('public route smoke checks', () => {
  for (const route of publicRoutes) {
    test(`${route} renders without a server error`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });

      expect(response?.status(), `${route} HTTP status`).toBeLessThan(400);
      await expect(page.locator('body')).toBeVisible();
    });
  }

  test('health endpoint returns the observability contract', async ({ request }) => {
    const response = await request.get('/api/health');

    expect([200, 503]).toContain(response.status());
    const body = await response.json();
    expect(body).toMatchObject({
      service: 'purevedicgems',
      status: expect.any(String),
      checks: expect.any(Object),
    });
  });
});