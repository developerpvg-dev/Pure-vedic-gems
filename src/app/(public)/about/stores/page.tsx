import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { urlFor } from '@/lib/sanity/client';
import { getStoreLocations } from '@/lib/sanity/queries';
import type { SanityStoreLocation } from '@/lib/types/content';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Stores | PureVedicGems',
  description: 'PureVedicGems store and consultation locations for certified Vedic gemstones and expert guidance.',
};

const FALLBACK_STORES: SanityStoreLocation[] = [
  {
    _id: 'fallback-delhi-saket',
    title: 'Delhi Store - Saket',
    addressLine1: 'FF-32, MGF Metropolitan Mall, Opposite Saket Lawyers Court, District Centre, Saket',
    city: 'New Delhi',
    region: 'Delhi',
    postalCode: '110017',
    country: 'India',
    phone: '+91-9310172512',
    email: 'info@purevedicgems.com',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=PureVedicGems%20MGF%20Metropolitan%20Mall%20Saket',
    hours: [
      { day: 'Thu-Tue', time: '11:00 AM - 8:00 PM' },
      { day: 'Wednesday', time: 'Closed' },
    ],
    isPrimary: true,
  },
  {
    _id: 'fallback-noida-research-centre',
    title: 'Noida Vedic Sciences Research Centre',
    addressLine1: '6th Floor, East Avenue Grand Society, Commercial Complex, Main Dadri-Barola Road, Sector 49',
    city: 'Noida',
    region: 'Uttar Pradesh',
    postalCode: '201301',
    country: 'India',
    phone: '+91-9871582404',
    email: 'info@purevedicgems.com',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Vedic%20Sciences%20Research%20Centre%20Sector%2049%20Noida',
    hours: [
      { day: 'Thu-Tue', time: '10:30 AM - 7:30 PM' },
      { day: 'Wednesday', time: 'Closed' },
    ],
  },
  {
    _id: 'fallback-uk-hounslow',
    title: 'UK Office - Hounslow',
    addressLine1: '95 Juniper Court, Hanworth Road, Hounslow, TW3 3TL',
    city: 'London',
    country: 'United Kingdom',
    phone: '+44 7831 491778',
    email: 'info@purevedicgems.com',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=95%20Juniper%20Court%20Hanworth%20Road%20Hounslow%20TW3%203TL',
    hours: [{ day: 'By appointment', time: 'Remote support available' }],
  },
];

function imageUrl(store: SanityStoreLocation) {
  if (!store.image) return null;
  if (typeof store.image === 'string') return store.image;
  return urlFor(store.image).width(900).height(620).quality(82).auto('format').url();
}

export default async function StoresPage() {
  const sanityStores = (await getStoreLocations()) as SanityStoreLocation[];
  const stores = sanityStores.length ? sanityStores : FALLBACK_STORES;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-20 pt-[130px] md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-[var(--pvg-muted)]">
          <Link href="/" className="hover:text-[var(--pvg-accent)]">Home</Link>
          <span>/</span>
          <Link href="/about" className="hover:text-[var(--pvg-accent)]">About</Link>
          <span>/</span>
          <span className="text-[var(--pvg-primary)]">Stores</span>
        </nav>

        <header className="mb-10 border-b border-[var(--pvg-border)] pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[var(--pvg-accent)]">Visit By Appointment</p>
          <h1 className="font-heading text-[var(--pvg-primary)]" style={{ fontSize: 'clamp(34px, 5vw, 62px)' }}>
            PureVedicGems Stores
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--pvg-muted)] md:text-base">
            Visit or connect with our team for gemstone inspection, consultation scheduling, jewellery configuration, and certificate review.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {stores.map((store) => {
            const src = imageUrl(store);
            const address = [store.addressLine1, store.addressLine2, store.city, store.region, store.postalCode, store.country].filter(Boolean).join(', ');
            return (
              <article key={store._id} className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-brand-surface">
                {src ? (
                  <div className="relative aspect-[4/3] bg-brand-bg">
                    <Image src={src} alt={store.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
                  </div>
                ) : null}
                <div className="p-5">
                  {store.isPrimary ? <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-[var(--pvg-accent)]">Primary Location</p> : null}
                  <h2 className="font-heading text-2xl font-semibold text-[var(--pvg-primary)]">{store.title}</h2>
                  <p className="mt-3 flex gap-2 text-sm leading-7 text-[var(--pvg-muted)]"><MapPin className="mt-1 h-4 w-4 shrink-0 text-[var(--pvg-accent)]" /> {address}</p>
                  {store.phone ? <p className="mt-3 flex items-center gap-2 text-sm text-[var(--pvg-muted)]"><Phone className="h-4 w-4 text-[var(--pvg-accent)]" /> <a href={`tel:${store.phone}`}>{store.phone}</a></p> : null}
                  {store.email ? <p className="mt-2 flex items-center gap-2 text-sm text-[var(--pvg-muted)]"><Mail className="h-4 w-4 text-[var(--pvg-accent)]" /> <a href={`mailto:${store.email}`}>{store.email}</a></p> : null}
                  {store.hours?.length ? (
                    <div className="mt-4 rounded-lg border border-[var(--pvg-border)] bg-brand-bg p-3 text-xs text-[var(--pvg-muted)]">
                      {store.hours.map((hour) => <p key={`${hour.day}-${hour.time}`}><strong>{hour.day}:</strong> {hour.time}</p>)}
                    </div>
                  ) : null}
                  {store.mapUrl ? (
                    <a href={store.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)]">
                      <Navigation className="h-4 w-4" /> Directions
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-6 md:flex md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-2xl text-[var(--pvg-primary)]">Planning a visit?</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--pvg-muted)]">Book an appointment first so the team can prepare the right stones, certificates, and expert support.</p>
          </div>
          <Link href="/consultation" className="mt-5 inline-flex rounded-lg border border-[var(--pvg-primary)] px-5 py-3 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-primary)] md:mt-0">
            Request Appointment
          </Link>
        </div>
      </div>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'PureVedicGems',
            url: siteUrl,
            location: stores.map((store) => ({
              '@type': 'LocalBusiness',
              name: store.title,
              address: [store.addressLine1, store.addressLine2, store.city, store.region, store.postalCode, store.country].filter(Boolean).join(', '),
              telephone: store.phone,
              email: store.email,
              url: `${siteUrl}/about/stores`,
            })),
          }),
        }}
      />
    </main>
  );
}