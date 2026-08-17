import Image from 'next/image';
import Link from 'next/link';
import { Award, CalendarCheck, Languages, Star } from 'lucide-react';
import { urlFor } from '@/lib/sanity/client';
import { getSanityExpertProfiles } from '@/lib/sanity/queries';
import { FALLBACK_EXPERTS, getAvailableExperts, type PublicExpert } from '@/lib/queries/experts';
import type { SanityExpertProfile } from '@/lib/types/content';
import { buildMetadata } from '@/lib/utils/seo';
import './experts-page.css';

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: 'Gemstone & Jyotish Experts | PureVedicGems',
  description:
    'Meet the PureVedicGems gemstone, Vedic astrology, and jewellery experts who guide product selection and consultations.',
  path: '/about/experts',
});

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
    <main className="pvg-experts-page min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-8 pt-10 sm:px-6 lg:pt-14" aria-labelledby="experts-page-heading">
        <div className="mx-auto max-w-4xl text-center">
          <nav className="pvg-experts-breadcrumb mb-6 flex items-center justify-center gap-1.5 text-[13px] text-[#5a5043]">
            <Link href="/" className="hover:text-[#7a1515]">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/about" className="hover:text-[#7a1515]">About</Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#2c0404]">Experts</span>
          </nav>

          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="experts-page-heading">
              Meet the PureVedicGems Experts
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Gemstone recommendations require trust, documentation, and context. Our experts support certification review, product shortlisting, and traditional Vedic guidance before purchase.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8" aria-label="Expert profiles">
        <div className="grid gap-6 lg:grid-cols-3">
          {experts.map((expert, index) => (
            <article key={expert.id} className="pvg-experts-card overflow-hidden rounded-xl border border-[#ede6d5] bg-white shadow-[0_10px_32px_rgba(44,4,4,0.06)]">
              <div className="relative aspect-[4/5] bg-[#faf8f4]">
                {expert.photo ? (
                  <Image src={expert.photo} alt={expert.name} fill className="object-cover object-top" priority={index === 0} sizes="(max-width: 1024px) 100vw, 33vw" />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl font-bold text-[#6b5b4e]">{expert.name.charAt(0)}</div>
                )}
              </div>
              <div className="p-5">
                <p className="pvg-experts-card-eyebrow">{expert.specialty ?? expert.title}</p>
                <h2 className="pvg-experts-card-name">{expert.name}</h2>
                {expert.title ? <p className="pvg-experts-card-role">{expert.title}</p> : null}
                {expert.bio ? <p className="pvg-experts-card-bio">{expert.bio}</p> : null}

                <div className="mt-4 flex flex-wrap gap-2 text-[13px] text-[#5a5043]">
                  {expert.rating ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#ede6d5] px-2.5 py-1">
                      <Star className="h-3 w-3 fill-[#b8861e] text-[#b8861e]" /> {expert.rating}
                    </span>
                  ) : null}
                  {expert.yearsExperience ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#ede6d5] px-2.5 py-1">
                      <CalendarCheck className="h-3 w-3" /> {expert.yearsExperience} years
                    </span>
                  ) : null}
                  {expert.languages?.length ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#ede6d5] px-2.5 py-1">
                      <Languages className="h-3 w-3" /> {expert.languages.join(', ')}
                    </span>
                  ) : null}
                </div>

                {expert.credentials?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {expert.credentials.map((credential) => (
                      <span key={credential} className="inline-flex items-center gap-1 rounded-sm bg-[#fdf3e7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[1px] text-[#2c0404]">
                        <Award className="h-3 w-3" /> {credential}
                      </span>
                    ))}
                  </div>
                ) : null}

                {expert.quote ? (
                  <p className="pvg-experts-card-quote">&ldquo;{expert.quote}&rdquo;</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="pvg-experts-cta mt-10 rounded-xl border border-[#ede6d5] bg-white p-6 shadow-[0_10px_32px_rgba(44,4,4,0.06)] md:flex md:items-center md:justify-between">
          <div>
            <h2 className="pvg-experts-cta-title">Need personal guidance?</h2>
            <p className="pvg-experts-cta-copy">
              Share your birth details, concern, and product shortlist. The team will confirm the right consultation path.
            </p>
          </div>
          <Link
            href="/consultation"
            className="mt-5 inline-flex rounded-lg bg-[#7a1515] px-5 py-3 text-xs font-bold uppercase tracking-[1.5px] text-white transition hover:bg-[#4d0a0a] md:mt-0"
          >
            Book Consultation
          </Link>
        </div>
      </section>

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
