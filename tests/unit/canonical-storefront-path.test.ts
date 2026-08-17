import { describe, expect, it } from 'vitest';
import {
  canonicalGroupHref,
  canonicalSubcategoryHref,
  parentForMigratedSlug,
  toCanonicalStorefrontPath,
  toInternalShopPath,
  NAVARATNA_STOREFRONT_SLUGS,
  UPRATNA_STOREFRONT_SLUGS,
  RUDRAKSHA_STOREFRONT_SLUG_SET,
} from '@/lib/categories/canonical-storefront-path';
import { KNOWN_GEM_SUBCATEGORIES, KNOWN_CATALOG_SUBCATEGORIES } from '@/lib/categories/shop';
import { productHref, storefrontGroupHref, storefrontSubcategoryHref } from '@/lib/categories/storefront';
import { lookupLegacyRedirect } from '@/lib/legacy-redirects';

describe('Phase 5 canonical storefront paths', () => {
  it('keeps /shop as the mixed catalog home', () => {
    expect(toCanonicalStorefrontPath('/shop')).toBe('/shop');
    expect(lookupLegacyRedirect('/shop')).toBeNull();
  });

  it('uses navaratna spelling, never navratana', () => {
    expect(canonicalGroupHref('navaratna')).toBe('/gemstones/navaratna');
    expect(toCanonicalStorefrontPath('/gemstones/navratna')).toBe('/gemstones/navaratna');
    expect(toCanonicalStorefrontPath('/gemstones/navratana/ruby')).toBe('/gemstones/navaratna/ruby');
    expect(toCanonicalStorefrontPath('/shop/navratan/ruby')).toBe('/gemstones/navaratna/ruby');
  });

  it('preserves product slug tails', () => {
    expect(toCanonicalStorefrontPath('/shop/ruby/natural-ruby-2ct')).toBe(
      '/gemstones/navaratna/ruby/natural-ruby-2ct',
    );
    expect(toCanonicalStorefrontPath('/shop/5-mukhi/5-mukhi-bead')).toBe(
      '/rudraksha/5-mukhi/5-mukhi-bead',
    );
    expect(productHref({ sub_category: 'ruby', slug: 'natural-ruby-2ct', category: 'navaratna' })).toBe(
      '/gemstones/navaratna/ruby/natural-ruby-2ct',
    );
  });

  it('does not migrate jewelry, malas, idols, or SEO landings', () => {
    expect(toCanonicalStorefrontPath('/shop/jewelry')).toBe('/shop/jewelry');
    expect(toCanonicalStorefrontPath('/shop/malas')).toBe('/shop/malas');
    expect(toCanonicalStorefrontPath('/shop/idols')).toBe('/shop/idols');
    expect(toCanonicalStorefrontPath('/shop/bracelets/lapis-sku')).toBe('/shop/bracelets/lapis-sku');
    expect(toCanonicalStorefrontPath('/shop/jewelry/catseye-silver-ring')).toBe(
      '/shop/jewelry/catseye-silver-ring',
    );
    expect(toCanonicalStorefrontPath('/shop/gemstones-for-aries')).toBe('/shop/gemstones-for-aries');
    expect(storefrontGroupHref('jewelry')).toBe('/shop/jewelry');
  });

  it('rewrites facade URLs onto existing /shop pages', () => {
    expect(toInternalShopPath('/gemstones/navaratna')).toBe('/shop/navaratna');
    expect(toInternalShopPath('/gemstones/navaratna/ruby')).toBe('/shop/ruby');
    expect(toInternalShopPath('/gemstones/navaratna/ruby/sku')).toBe('/shop/ruby/sku');
    expect(toInternalShopPath('/gemstones/navaratna/catseye')).toBe('/shop/cats-eye');
    expect(toInternalShopPath('/gemstones/navaratna/unknown-sku')).toBe('/shop/navaratna/unknown-sku');
    expect(toInternalShopPath('/rudraksha')).toBe('/shop/rudraksha');
    expect(toInternalShopPath('/rudraksha/5-mukhi')).toBe('/shop/5-mukhi');
    expect(toInternalShopPath('/shop/ruby')).toBeNull();
  });

  it('301s old shop URLs in one hop with no chain', () => {
    const hops: Array<[string, string]> = [
      ['/shop/ruby', '/gemstones/navaratna/ruby'],
      ['/shop/amethyst', '/gemstones/upratna/amethyst'],
      ['/shop/rudraksha', '/rudraksha'],
      ['/shop/5-mukhi', '/rudraksha/5-mukhi'],
      ['/shop/navaratna/ruby', '/gemstones/navaratna/ruby'],
      ['/shop/navratan/catseye', '/gemstones/navaratna/cats-eye'],
      ['/shop/catseye', '/gemstones/navaratna/cats-eye'],
      ['/gemstones/navaratna/catseye', '/gemstones/navaratna/cats-eye'],
      ['/product-category/navratan/ruby', '/gemstones/navaratna/ruby'],
      ['/product-category/navratan/catseye', '/gemstones/navaratna/cats-eye'],
      ['/product-category/navratan/amethyst', '/gemstones/upratna/amethyst'],
      ['/product-category/navratnas/ruby', '/gemstones/navaratna/ruby'],
      ['/tag/catseye', '/gemstones/navaratna/cats-eye'],
      ['/gemstones', '/gemstones/navaratna'],
    ];
    for (const [from, to] of hops) {
      expect(lookupLegacyRedirect(from)).toBe(to);
      expect(lookupLegacyRedirect(to)).toBeNull();
      expect(toCanonicalStorefrontPath(to)).toBe(to);
    }
  });

  it('keeps href helpers on the public tree', () => {
    expect(storefrontSubcategoryHref('navaratna', 'yellow-sapphire')).toBe(
      '/gemstones/navaratna/yellow-sapphire',
    );
    expect(storefrontSubcategoryHref('rudraksha', '1-mukhi')).toBe('/rudraksha/1-mukhi');
    expect(canonicalSubcategoryHref('garnet')).toBe('/gemstones/upratna/garnet');
    expect(canonicalSubcategoryHref('catseye')).toBe('/gemstones/navaratna/cats-eye');
  });

  it('keeps gem slug maps in sync with shop.ts', () => {
    for (const [slug, meta] of Object.entries(KNOWN_GEM_SUBCATEGORIES)) {
      expect(parentForMigratedSlug(slug)).toBe(meta.category);
      if (meta.category === 'navaratna') expect(NAVARATNA_STOREFRONT_SLUGS.has(slug)).toBe(true);
      if (meta.category === 'upratna') expect(UPRATNA_STOREFRONT_SLUGS.has(slug)).toBe(true);
    }
    for (const [slug, meta] of Object.entries(KNOWN_CATALOG_SUBCATEGORIES)) {
      if (meta.category === 'rudraksha') expect(RUDRAKSHA_STOREFRONT_SLUG_SET.has(slug)).toBe(true);
    }
  });
});
