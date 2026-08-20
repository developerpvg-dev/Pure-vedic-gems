import { expect } from 'vitest';

/** Storefront HTML and JSON-LD must stay first-party. */
export function expectOwnBrandCopy(text: string) {
  const haystack = text.toLowerCase();
  expect(haystack).not.toContain(['gem', 'pundit'].join(''));
  expect(haystack).not.toContain(['brahma', 'gems'].join(''));
  expect(haystack).not.toContain(['shubh', 'gems'].join(' '));
  expect(haystack).not.toContain(['gems', 'mantra'].join(''));
  expect(haystack).not.toContain(['gemstone', 'universe'].join(''));
}
