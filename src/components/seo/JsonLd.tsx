import type { JsonLd as JsonLdType } from '@/lib/utils/seo';

function serializeJsonLd(data: JsonLdType | JsonLdType[]) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function JsonLd({ data }: { data: JsonLdType | JsonLdType[] | null | undefined }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}