/**
 * ponytail: one assert file — slug/href shape for shareable design pages.
 */
import {
  DESIGN_CATALOG_KINDS,
  designCatalogKind,
  designHref,
  designSlug,
  isDesignCatalogKind,
} from './public';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

assert(designSlug('Design-1') === 'design-1', 'Design-1 slug');
assert(designSlug('Rudraksha - One Mukhi') === 'rudraksha-one-mukhi', 'rudraksha slug');
assert(isDesignCatalogKind('ring'), 'ring kind');
assert(!isDesignCatalogKind('loose'), 'loose not catalog');
assert(DESIGN_CATALOG_KINDS.length === 4, 'four kinds');

assert(
  designCatalogKind({ setting_type: 'ring', product_scope: 'gemstone' }) === 'ring',
  'ring kind from row'
);
assert(
  designCatalogKind({ setting_type: 'pendant', product_scope: 'rudraksha' }) === 'rudraksha',
  'rudraksha kind from row'
);
assert(
  designHref({ name: 'Design-14', setting_type: 'ring', product_scope: 'gemstone' }) ===
    '/designs/ring/design-14',
  'ring href'
);
assert(
  designHref({
    name: 'Rudraksha - One Mukhi',
    setting_type: 'pendant',
    product_scope: 'rudraksha',
  }) === '/designs/rudraksha/rudraksha-one-mukhi',
  'rudraksha href'
);

console.log('designs/public.selfcheck: ok');
