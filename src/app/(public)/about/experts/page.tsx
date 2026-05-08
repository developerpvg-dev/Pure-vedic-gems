import Image from 'next/image';
import Link from 'next/link';
import { Award, CalendarCheck, Languages, Star } from 'lucide-react';
import type { Metadata } from 'next';
import { urlFor } from '@/lib/sanity/client';
import { getSanityExpertProfiles } from '@/lib/sanity/queries';
import { FALLBACK_EXPERTS, getAvailableExperts, type PublicExpert } from '@/lib/queries/experts';
import type { SanityExpertProfile } from '@/lib/types/content';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Experts | PureVedicGems',
  description: 'Meet the PureVedicGems gemstone, Vedic astrology, and jewellery experts guiding product selection and consultations.',
};

type ExpertCard = {
  id: string;
  name: string;
  title?: string | null;
  photo?: string | null;
  specialty?: string | null;
  bio?: string | null;
  quote?: string | null;
  credentials?: string[] | null;
  languages?: string[] | null;
  yearsExperience?: number | null;
  rating?: number;
};

function fromSupabase(expert: PublicExpert): ExpertCard {
  return {
    id: expert.id,
    name: expert.name,
    title: expert.title,
    photo: expert.photo_url,
    specialty: expert.specialty,
    bio: expert.bio,
    quote: expert.personal_quote,
    credentials: expert.credentials,
    languages: expert.languages,
    yearsExperience: expert.years_experience,
    rating: expert.rating,
  };
}

function fromSanity(expert: SanityExpertProfile): ExpertCard {
  return {
    id: expert._id,
    name: expert.name,
    title: expert.title,
    photo: expert.photo ? (typeof expert.photo === 'string' ? expert.photo : urlFor(expert.photo).width(520).height(640).quality(85).auto('format').url()) : null,
    specialty: expert.specialty,
    bio: expert.bio,
    quote: expert.personalQuote,
    credentials: expert.credentials,
    languages: expert.languages,
    yearsExperience: expert.yearsExperience,
  };
}

export default async function ExpertsPage() {
  const sanityExperts = (await getSanityExpertProfiles()) as SanityExpertProfile[];
  const dbExperts = await getAvailableExperts({ includeFallback: false });
  const experts = sanityExperts.length
    ? sanityExperts.map(fromSanity)
    : dbExperts.length
      ? dbExperts.map(fromSupabase)
      : FALLBACK_EXPERTS.map(fromSupabase);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <main className="min-h-screen bg-brand-bg px-4 pb-20 pt-[130px] md:px-8">
      <div className="mx-auto max-w-[1180px]">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-[var(--pvg-muted)]">
          <Link href="/" className="hover:text-[var(--pvg-accent)]">Home</Link>
          <span>/</span>
          <Link href="/about" className="hover:text-[var(--pvg-accent)]">About</Link>
          <span>/</span>
          <span className="text-[var(--pvg-primary)]">Experts</span>
        </nav>

        <header className="mb-10 border-b border-[var(--pvg-border)] pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[var(--pvg-accent)]">Expert-Led Guidance</p>
          <h1 className="font-heading text-[var(--pvg-primary)]" style={{ fontSize: 'clamp(34px, 5vw, 62px)' }}>
            Meet the PureVedicGems Experts
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--pvg-muted)] md:text-base">
            Gemstone recommendations require trust, documentation, and context. Our experts support certification review, product shortlisting, and traditional Vedic guidance before purchase.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {experts.map((expert, index) => (
            <article key={expert.id} className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-brand-surface">
              <div className="relative aspect-[4/5] bg-brand-bg">
                {expert.photo ? (
                  <Image src={expert.photo} alt={expert.name} fill className="object-cover object-top" priority={index === 0} sizes="(max-width: 1024px) 100vw, 33vw" />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl font-bold text-[var(--pvg-muted)]">{expert.name.charAt(0)}</div>
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--pvg-accent)]">{expert.specialty ?? expert.title}</p>
                <h2 className="mt-2 font-heading text-2xl font-semibold text-[var(--pvg-primary)]">{expert.name}</h2>
                {expert.title && <p className="mt-1 text-sm text-[var(--pvg-muted)]">{expert.title}</p>}
                {expert.bio && <p className="mt-4 text-sm leading-7 text-[var(--pvg-muted)]">{expert.bio}</p>}

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--pvg-muted)]">
                  {expert.rating ? <span className="inline-flex items-center gap-1 rounded-full border border-[var(--pvg-border)] px-2.5 py-1"><Star className="h-3 w-3 fill-[var(--pvg-accent)] text-[var(--pvg-accent)]" /> {expert.rating}</span> : null}
                  {expert.yearsExperience ? <span className="inline-flex items-center gap-1 rounded-full border border-[var(--pvg-border)] px-2.5 py-1"><CalendarCheck className="h-3 w-3" /> {expert.yearsExperience} years</span> : null}
                  {expert.languages?.length ? <span className="inline-flex items-center gap-1 rounded-full border border-[var(--pvg-border)] px-2.5 py-1"><Languages className="h-3 w-3" /> {expert.languages.join(', ')}</span> : null}
                </div>

                {expert.credentials?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {expert.credentials.map((credential) => (
                      <span key={credential} className="inline-flex items-center gap-1 rounded-sm bg-brand-gold-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-[1px] text-[var(--pvg-primary)]">
                        <Award className="h-3 w-3" /> {credential}
                      </span>
                    ))}
                  </div>
                ) : null}

                {expert.quote && <p className="mt-5 border-l-2 border-[var(--pvg-accent)] pl-4 text-sm italic leading-7 text-[var(--pvg-muted)]">&ldquo;{expert.quote}&rdquo;</p>}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-[var(--pvg-border)] bg-brand-surface p-6 md:flex md:items-center md:justify-between">
          <div>
            <h2 className="font-heading text-2xl text-[var(--pvg-primary)]">Need personal guidance?</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--pvg-muted)]">Share your birth details, concern, and product shortlist. The team will confirm the right consultation path.</p>
          </div>
          <Link href="/consultation" className="mt-5 inline-flex rounded-lg bg-brand-primary px-5 py-3 text-xs font-bold uppercase tracking-[1.5px] text-[var(--pvg-bg)] md:mt-0">
            Book Consultation
          </Link>
        </div>
      </div>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: experts.map((expert, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: { '@type': 'Person', name: expert.name, jobTitle: expert.title, url: `${siteUrl}/about/experts` },
            })),
          }),
        }}
      />
    </main>
  );
}