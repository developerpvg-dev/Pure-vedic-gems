/** Product journey funnel — category → PDP → cart → checkout → WA/call. */

export const PRODUCT_FUNNEL_EVENTS = [
  'category_view',
  'product_click',
  'product_view',
  'add_to_cart',
  'begin_checkout',
  'checkout_step',
  'checkout_abandon',
  'purchase',
  'whatsapp_click',
  'call_click',
] as const;

export type ProductFunnelEvent = (typeof PRODUCT_FUNNEL_EVENTS)[number];

export function isProductFunnelEvent(value: string): value is ProductFunnelEvent {
  return (PRODUCT_FUNNEL_EVENTS as readonly string[]).includes(value);
}

export type WhatsAppContext =
  | 'product'
  | 'category'
  | 'home'
  | 'checkout'
  | 'cart'
  | 'general';

export type WhatsAppProductBits = {
  name: string;
  sku?: string | null;
  url?: string | null;
};

/** Context-aware WhatsApp prefills for storefront CTAs. */
export function whatsappPrefill(
  context: WhatsAppContext,
  bits?: { product?: WhatsAppProductBits; category?: string | null }
): string {
  if (context === 'product' && bits?.product?.name) {
    const sku = bits.product.sku ? ` (SKU: ${bits.product.sku})` : '';
    const url = bits.product.url ? ` Link: ${bits.product.url}` : '';
    return `Hi, I'm interested in: ${bits.product.name}${sku}.${url} Please share more details.`;
  }
  if (context === 'category' && bits?.category) {
    return `Hi, I'm browsing ${bits.category} on Pure Vedic Gems and would like guidance choosing the right piece.`;
  }
  if (context === 'home') {
    return `Hi, I visited the Pure Vedic Gems homepage and would like help choosing a certified gemstone.`;
  }
  if (context === 'checkout') {
    return `Hi, I need help completing my checkout on Pure Vedic Gems.`;
  }
  if (context === 'cart') {
    return `Hi, I have items in my cart on Pure Vedic Gems and would like assistance before checkout.`;
  }
  return `Hi, I'd like to speak with Pure Vedic Gems about gemstones / Rudraksha.`;
}

/** Infer WA context from a storefront pathname. */
export function whatsappContextFromPath(pathname: string): {
  context: WhatsAppContext;
  category?: string;
} {
  const path = pathname.split('?')[0] || '/';
  if (path === '/' || path === '') return { context: 'home' };
  if (path.startsWith('/checkout')) return { context: 'checkout' };
  if (path.startsWith('/cart')) return { context: 'cart' };
  // PDP: /gemstones/.../slug or /shop/.../slug (2+ segments after base)
  const shopMatch = path.match(/^\/(?:gemstones|shop|rudraksha)\/([^/]+)(?:\/([^/]+))?/);
  if (shopMatch) {
    if (shopMatch[2]) return { context: 'product', category: decodeURIComponent(shopMatch[1]) };
    return { context: 'category', category: decodeURIComponent(shopMatch[1]).replace(/-/g, ' ') };
  }
  if (path.startsWith('/navaratna') || path.startsWith('/upratna') || path.startsWith('/rudraksha')) {
    const slug = path.split('/').filter(Boolean)[0] ?? '';
    if (path.split('/').filter(Boolean).length >= 2) {
      return { context: 'product', category: slug };
    }
    return { context: 'category', category: slug.replace(/-/g, ' ') };
  }
  return { context: 'general' };
}

export function assertProductFunnelHelpers() {
  if (!isProductFunnelEvent('product_view') || isProductFunnelEvent('click')) {
    throw new Error('event guard');
  }
  const p = whatsappPrefill('product', { product: { name: 'Neelam', sku: 'N-1' } });
  if (!p.includes('Neelam') || !p.includes('N-1')) throw new Error('product prefill');
  const h = whatsappPrefill('home');
  if (!h.toLowerCase().includes('homepage')) throw new Error('home prefill');
  const g = whatsappPrefill('general');
  if (g === h) throw new Error('general must differ from home');
  if (whatsappContextFromPath('/').context !== 'home') throw new Error('path home');
  if (whatsappContextFromPath('/checkout').context !== 'checkout') throw new Error('path checkout');
  if (whatsappContextFromPath('/gemstones/neelam').context !== 'category') throw new Error('path category');
}
