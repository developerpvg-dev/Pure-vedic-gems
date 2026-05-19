import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const accessibilityRoutes = ['/policies/privacy', '/policies/returns', '/policies/shipping', '/checkout'];

test.describe('accessibility smoke checks', () => {
  for (const route of accessibilityRoutes) {
    test(`${route} has no serious axe violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'load' });
      await page.addStyleTag({
        content: `
          *, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }
          [style*="opacity: 0"] { opacity: 1 !important; transform: none !important; }
        `,
      });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const blockingViolations = results.violations
        .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
        .map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          nodes: violation.nodes.map((node) => node.target.join(' ')).slice(0, 5),
        }));

      expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([]);
    });
  }
});