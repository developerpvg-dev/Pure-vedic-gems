import { NextResponse } from 'next/server';
import { productHref } from '@/lib/categories/storefront';
import { createOptionalPublicClient } from '@/lib/supabase/public';
import { absoluteUrl, getSiteUrl } from '@/lib/utils/seo';

export const revalidate = 3600;

type FeedProduct = {
  id: string;
  sku: string | null;
  slug: string;
  name: string;
  category: string;
  price: number | null;
  currency: string | null;
  short_desc: string | null;
  thumbnail_url: string | null;
  images: unknown;
  in_stock: boolean | null;
  availability_status: string | null;
  updated_at: string | null;
};

function escapeXml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getImage(product: FeedProduct) {
  if (product.thumbnail_url) return product.thumbnail_url;
  if (Array.isArray(product.images)) {
    const first = product.images.find((item) => typeof item === 'string');
    if (typeof first === 'string') return first;
  }
  return null;
}

function renderItem(product: FeedProduct) {
  const href = absoluteUrl(productHref(product));
  const image = getImage(product);
  const availability = product.in_stock && product.availability_status !== 'sold' ? 'in stock' : 'out of stock';
  const price = `${product.price ?? 0} ${product.currency || 'INR'}`;

  return `
    <item>
      <g:id>${escapeXml(product.sku || product.id)}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
      <g:description>${escapeXml(product.short_desc || `${product.name} from PureVedicGems.`)}</g:description>
      <g:link>${escapeXml(href)}</g:link>
      ${image ? `<g:image_link>${escapeXml(absoluteUrl(image))}</g:image_link>` : ''}
      <g:availability>${availability}</g:availability>
      <g:price>${escapeXml(price)}</g:price>
      <g:condition>new</g:condition>
      <g:brand>PureVedicGems</g:brand>
      <g:google_product_category>Apparel &amp; Accessories &gt; Jewelry</g:google_product_category>
    </item>`;
}

export async function GET() {
  const supabase = createOptionalPublicClient();
  let products: FeedProduct[] = [];

  if (supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('id, sku, slug, name, category, price, currency, short_desc, thumbnail_url, images, in_stock, availability_status, updated_at')
      .eq('is_active', true)
      .eq('in_stock', true)
      .neq('availability_status', 'sold')
      .order('updated_at', { ascending: false })
      .limit(5000);

    if (!error) products = (data ?? []) as FeedProduct[];
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>PureVedicGems Product Feed</title>
    <link>${escapeXml(getSiteUrl())}</link>
    <description>Active in-stock products from PureVedicGems.</description>
    ${products.map(renderItem).join('\n')}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}