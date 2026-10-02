import { describe, expect, it } from 'vitest';
import { shopRoutePath } from '../../src/proxy';

const q = (s: string) => new URLSearchParams(s);

describe('shopRoutePath', () => {
  it('keeps plain and tracking-only shop URLs on the cached pages', () => {
    expect(shopRoutePath('/shop/ruby', q(''))).toBe('/shop/ruby');
    expect(shopRoutePath('/shop/ruby/some-gem', q('utm_source=ig&gclid=x&_rsc=abc'))).toBe('/shop/ruby/some-gem');
    expect(shopRoutePath('/shop', q('auth=login'))).toBe('/shop');
  });

  it('sends filtered or paginated listings to the live copy', () => {
    expect(shopRoutePath('/shop/ruby', q('page=2'))).toBe('/shop-live/ruby');
    expect(shopRoutePath('/shop', q('sort_by=price&min_carat=3'))).toBe('/shop-live');
    expect(shopRoutePath('/shop/navaratna/x', q('origin=Burma'))).toBe('/shop-live/navaratna/x');
  });

  it('leaves non-shop paths alone', () => {
    expect(shopRoutePath('/blog', q('page=2'))).toBe('/blog');
    expect(shopRoutePath('/shopping', q('page=2'))).toBe('/shopping');
  });
});
