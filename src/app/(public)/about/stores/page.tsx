import Image from 'next/image';
import Link from 'next/link';
import { Clock, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { OFFICE_LOCATIONS } from '@/lib/constants/company-addresses';
import './stores-page.css';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Stores | PureVedicGems',
  description:
    'Pure Vedic Gems Pvt. Ltd. store locations — Saket showroom (Delhi), Sultanpur Vedic Research Centre, and UK office in Hounslow.',
};

type AddressBlock = {
  label: string;
  lines: string[];
};

type DisplayStore = {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  addresses: AddressBlock[];
  landmark?: string;
  phones: string[];
  email?: string;
  mapUrl?: string;
  hours: Array<{ day: string; time: string }>;
  isPrimary?: boolean;
};

const INDIA_PHONES = [
  '+91 9871582404',
  '+91 9310172512',
  '+91 9891344074',
  '+91 7703934332',
  '+91 9810980550',
  '+91 7827095342',
];

const UK_PHONE = '+44 7831 491778';

const STORE_LOCATIONS: DisplayStore[] = OFFICE_LOCATIONS.map((location) => ({
  id: location.id,
  title: location.title,
  subtitle: location.region,
  image: location.photo,
  addresses: location.addresses.map((block) => ({
    label: block.label,
    lines: [...block.lines],
  })),
  landmark: location.landmark,
  phones: location.id === 'uk' ? [UK_PHONE] : INDIA_PHONES,
  email: 'purevedicgems@gmail.com',
  mapUrl: location.mapUrl,
  isPrimary: location.id === 'delhi',
  hours:
    location.id === 'uk'
      ? [{ day: 'Visits', time: 'By appointment only' }]
      : [
          { day: 'Mon – Tue, Thu – Sun', time: '11:00 am – 8:00 pm' },
          { day: 'Wednesday', time: 'Closed' },
        ],
}));

export default function StoresPage() {
  const stores = STORE_LOCATIONS;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <main className="pvg-stores-page min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-8 pt-10 sm:px-6 lg:pt-14" aria-labelledby="stores-page-heading">
        <div className="mx-auto max-w-4xl text-center">
          <nav className="pvg-stores-breadcrumb mb-6 flex items-center justify-center gap-1.5 text-[13px] text-[#5a5043]">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/about">About</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#2c0404]">Stores</span>
          </nav>

          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="stores-page-heading">
              PureVedicGems Stores
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Visit or connect with our team for gemstone inspection, consultation scheduling, jewellery configuration, and certificate review.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8" aria-label="Store locations">
        <div className="grid gap-6 lg:grid-cols-3">
          {stores.map((store) => (
            <article
              key={store.id}
              className="overflow-hidden rounded-xl border border-[#ede6d5] bg-white shadow-[0_10px_32px_rgba(44,4,4,0.06)]"
            >
              {store.image ? (
                <div className="relative aspect-[4/3] bg-[#faf8f4]">
                  <Image src={store.image} alt={store.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
                </div>
              ) : null}

              <div className="p-5">
                {store.isPrimary ? <p className="pvg-stores-card-eyebrow">Primary Location</p> : null}
                <h2 className="pvg-stores-card-title">{store.title}</h2>
                <p className="pvg-stores-card-subtitle">{store.subtitle}</p>

                <div className="mt-4">
                  {store.addresses.map((block) => (
                    <div key={block.label} className="pvg-stores-addr-block">
                      <p className="pvg-stores-addr-label">{block.label}</p>
                      <address className="pvg-stores-addr-lines">
                        {block.lines.map((line) => (
                          <span key={line}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </address>
                    </div>
                  ))}
                </div>

                {store.landmark ? (
                  <p className="pvg-stores-landmark">
                    <MapPin className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                    {store.landmark}
                  </p>
                ) : null}

                {store.phones.length ? (
                  <div className="pvg-stores-contact-row">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    <div>
                      {store.phones.map((phone) => (
                        <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`} className="block">
                          {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {store.email ? (
                  <p className="pvg-stores-contact-row">
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <a href={`mailto:${store.email}`}>{store.email}</a>
                  </p>
                ) : null}

                {store.hours.length ? (
                  <div className="pvg-stores-hours">
                    <p className="mb-1 flex items-center gap-1.5 text-[#7a1515]">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em]">Working Hours</span>
                    </p>
                    {store.hours.map((hour) => (
                      <p key={`${hour.day}-${hour.time}`}>
                        <strong>{hour.day}:</strong> {hour.time}
                      </p>
                    ))}
                  </div>
                ) : null}

                {store.mapUrl ? (
                  <a href={store.mapUrl} target="_blank" rel="noopener noreferrer" className="pvg-stores-directions">
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                    Get Directions
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-[#ede6d5] bg-white p-6 shadow-[0_10px_32px_rgba(44,4,4,0.06)] md:flex md:items-center md:justify-between">
          <div>
            <h2 className="pvg-stores-cta-title">Planning a visit?</h2>
            <p className="pvg-stores-cta-copy">
              Book an appointment first so the team can prepare the right stones, certificates, and expert support.
            </p>
          </div>
          <Link href="/consultation" className="pvg-stores-cta-link">
            Request Appointment
          </Link>
        </div>
      </section>

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
              name: `${store.title} — ${store.subtitle}`,
              address: store.addresses.flatMap((block) => block.lines).join(', '),
              telephone: store.phones.join(', '),
              email: store.email,
              url: `${siteUrl}/about/stores`,
            })),
          }),
        }}
      />
    </main>
  );
}
