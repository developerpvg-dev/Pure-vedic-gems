/**
 * ponytail: Phase 5 — PDF reuse guard must reject empty / traversal paths.
 * Run: npx tsx src/lib/recommendations/pdf-reuse.selfcheck.ts
 */
import assert from 'node:assert/strict';
import { shouldReuseStoredPdf } from './pdf';

assert.equal(shouldReuseStoredPdf(null), false);
assert.equal(shouldReuseStoredPdf(undefined), false);
assert.equal(shouldReuseStoredPdf(''), false);
assert.equal(shouldReuseStoredPdf('../evil.pdf'), false);
assert.equal(shouldReuseStoredPdf('report-id/123.pdf'), true);

console.log('pdf-reuse.selfcheck: ok');
