import { expect, test } from '@playwright/test';

const routeBudgets = [
  { route: '/', domContentLoadedMs: 8_000, loadMs: 12_000, scriptTransferBytes: 3_500_000 },
  { route: '/shop', domContentLoadedMs: 7_000, loadMs: 10_000, scriptTransferBytes: 3_000_000 },
  { route: '/policies/privacy', domContentLoadedMs: 5_000, loadMs: 8_000, scriptTransferBytes: 2_000_000 },
];

test.describe('route performance budgets', () => {
  for (const budget of routeBudgets) {
    test(`${budget.route} stays within launch performance budgets`, async ({ page }) => {
      await page.goto(budget.route, { waitUntil: 'load' });

      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const scripts = resources.filter((entry) => entry.initiatorType === 'script');

        return {
          domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd - navigation.startTime),
          loadMs: Math.round(navigation.loadEventEnd - navigation.startTime),
          scriptTransferBytes: scripts.reduce((sum, entry) => sum + entry.transferSize, 0),
        };
      });

      expect(metrics.domContentLoadedMs).toBeLessThanOrEqual(budget.domContentLoadedMs);
      expect(metrics.loadMs).toBeLessThanOrEqual(budget.loadMs);
      expect(metrics.scriptTransferBytes).toBeLessThanOrEqual(budget.scriptTransferBytes);
    });
  }
});