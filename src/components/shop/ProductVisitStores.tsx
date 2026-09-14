'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Clock, MapPin, Phone } from 'lucide-react';
import { OFFICE_LOCATIONS } from '@/lib/constants/company-addresses';
import { ProductHorizontalScroller } from '@/components/shop/ProductHorizontalScroller';

const STORE_PHONE = '+91-9310172512';
const STORE_PHONE_HREF = 'tel:+919310172512';

const VISIT_STORES = OFFICE_LOCATIONS.filter((s) => s.id === 'delhi' || s.id === 'sultanpur').map(
  (store) => {
    const showroom =
      store.id === 'delhi'
        ? store.addresses.find((a) => a.label.includes('Showroom')) ?? store.addresses[0]
        : store.addresses[0];
    return {
      id: store.id,
      title: store.id === 'delhi' ? 'Saket Showroom' : 'Sultanpur Research Centre',
      subtitle: store.id === 'delhi' ? 'Delhi' : 'Delhi, India',
      photo: store.photo,
      mapUrl: store.mapUrl,
      address: showroom.lines.join(', '),
      hours: store.hours,
      landmark: store.landmark,
    };
  },
);

function StoreCard({
  store,
  className = '',
}: {
  store: (typeof VISIT_STORES)[number];
  className?: string;
}) {
  return (
    <article className={`flex min-w-0 flex-col items-center text-center ${className}`}>
      <Link
        href={store.mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block h-[200px] w-full max-w-[360px] overflow-hidden rounded-xl bg-[#F4EDE3] sm:h-[220px] sm:max-w-none lg:h-[240px]"
      >
        <Image
          src={store.photo}
          alt={store.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 360px, 420px"
        />
      </Link>

      <h3 className="mt-3 text-[15px] font-semibold text-[#1D1715] sm:text-base">{store.title}</h3>
      <p className="mt-0.5 text-[12px] font-medium text-[#7A1515]">{store.subtitle}</p>

      <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[#4A3530]">
        <li className="flex justify-center gap-2 text-left">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7A1515]" strokeWidth={1.75} aria-hidden />
          <span className="max-w-[18rem]">
            {store.address}
            {store.landmark ? (
              <>
                <br />
                <span className="text-[12px] text-[#7A6250]">{store.landmark}</span>
              </>
            ) : null}
          </span>
        </li>
        <li className="flex items-center justify-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0 text-[#7A1515]" strokeWidth={1.75} aria-hidden />
          <a href={STORE_PHONE_HREF} className="font-medium text-[#3D2B1F] hover:text-[#7A1515]">
            {STORE_PHONE}
          </a>
        </li>
        <li className="flex items-center justify-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0 text-[#7A1515]" strokeWidth={1.75} aria-hidden />
          <span>{store.hours}</span>
        </li>
      </ul>

      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[12px] font-semibold">
        <Link
          href={store.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#7A1515] underline-offset-2 hover:underline"
        >
          Get directions
        </Link>
        <Link href="/about/stores" className="text-[#7A6250] underline-offset-2 hover:underline">
          All stores
        </Link>
      </div>
    </article>
  );
}

/** Product-page visit strip — scroll on phone, 2-col grid on PC. */
export function ProductVisitStores() {
  return (
    <section className="mt-10 lg:mt-16" aria-labelledby="visit-stores-heading">
      <div className="mb-5 text-center lg:mb-7">
        <h2
          id="visit-stores-heading"
          className="font-heading text-xl font-medium text-[#3D2B1F] lg:text-2xl"
        >
          Come <span className="text-[#7A1515]">visit us</span> at any of our stores
        </h2>
      </div>

      {/* Phone: horizontal scroll + arrows */}
      <div className="md:hidden">
        <ProductHorizontalScroller ariaLabel="Our stores">
          {VISIT_STORES.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              className="w-[78vw] max-w-[340px] shrink-0"
            />
          ))}
        </ProductHorizontalScroller>
      </div>

      {/* PC: original two-column layout */}
      <div className="mx-auto hidden max-w-3xl gap-5 sm:gap-6 md:grid md:grid-cols-2 lg:max-w-4xl lg:gap-7">
        {VISIT_STORES.map((store) => (
          <StoreCard key={store.id} store={store} className="mx-auto w-full max-w-md" />
        ))}
      </div>
    </section>
  );
}
