import { originFilterClauses, resolveOrigin } from '@/lib/utils/origin';
import assert from 'node:assert/strict';

assert.equal(resolveOrigin(null, 'African Ruby 7.58ct (Premium)'), 'Africa');
assert.equal(resolveOrigin('Mozambique', 'African Ruby'), 'Mozambique');
assert.equal(resolveOrigin(null, 'Burma Ruby'), 'Burma');
assert.ok(originFilterClauses('Africa').some((c) => c.includes('african')));

console.log('origin.selfcheck ok');
