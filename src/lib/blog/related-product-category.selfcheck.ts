import assert from 'node:assert/strict';
import { inferRelatedProductCategory } from './related-product-category';

const cases: Array<[Parameters<typeof inferRelatedProductCategory>[0], string]> = [
  [{ slug: 'how-to-buy-certified-white-sapphire-gemstone-online-safed-pukhraj-guide' }, '/shop/white-sapphire'],
  [{ slug: 'august-birthstone-peridot-meaning-benefits-history-astrology-interesting-facts' }, '/shop/peridot'],
  [{ title: 'Natural Untreated Pukhraj Gemstone Buying Guide' }, '/shop/yellow-sapphire'],
  [{ slug: '5-mukhi-rudraksha-benefits' }, '/shop/rudraksha'],
  [{ categorySlug: 'navratnas' }, '/shop/navaratna'],
];

for (const [input, expected] of cases) {
  assert.equal(inferRelatedProductCategory(input)?.relatedProductCategoryHref, expected, JSON.stringify(input));
}

console.log('related-product-category self-check ok');
