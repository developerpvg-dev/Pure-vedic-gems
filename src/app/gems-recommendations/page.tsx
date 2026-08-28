import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PvgRecommendationForm } from '@/components/home/PvgRecommendationForm';
import { RecoHeroPriceCopy } from '@/components/home/RecoHeroPriceCopy';
import { Money } from '@/components/currency/Money';
import { JsonLd } from '@/components/seo/JsonLd';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { RS101_AMOUNT_INR } from '@/lib/consultation/rs101-amount';
import { getRs101PaidFromHeaders } from '@/lib/consultation/rs101-eligibility.server';
import {
  GEMS_REC_CONCERNS,
  GEMS_REC_KEYWORDS,
  GEMS_REC_META,
  GEMS_REC_PATH,
  GEMS_REC_PAGE_FAQS,
  GEMS_REC_PILLARS,
  GEMS_REC_PROCESS,
  GEMS_REC_SERVICES,
  gemsRecInternalJsonLd,
} from '@/lib/constants/gems-recommendations-content';
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, faqJsonLd, serviceJsonLd } from '@/lib/utils/seo';
import './gems-recommendations.css';

const baseMeta = buildMetadata({
  title: GEMS_REC_META.title,
  description: GEMS_REC_META.description,
  path: GEMS_REC_PATH,
  image: '/home/gemrecomndation/getgemrec.webp',
});

export const metadata: Metadata = {
  ...baseMeta,
  keywords: GEMS_REC_KEYWORDS,
  openGraph: {
    ...baseMeta.openGraph,
    locale: 'en_IN',
    alternateLocale: ['en_US', 'en_GB', 'en_AE', 'en_SG', 'en_AU', 'en_CA'],
  },
};

function processSteps(rs101Paid: boolean) {
  if (!rs101Paid) return GEMS_REC_PROCESS;
  return GEMS_REC_PROCESS.map((item) =>
    item.step === '02'
      ? {
          ...item,
          title: 'Pay ₹101 securely',
          body: 'Book your remedies recommendation with Razorpay. Login is optional — guests receive email confirmation.',
        }
      : item
  );
}

export default async function GemsRecommendationsPage() {
  const rs101Paid = await getRs101PaidFromHeaders();
  const steps = processSteps(rs101Paid);
  const faqSchema = faqJsonLd(GEMS_REC_PAGE_FAQS);

  return (
    <main className="pvg-remedy-page min-h-screen overflow-hidden bg-[#f7f1e8] pb-0 pt-28 font-body text-[#15110d]">
      <section className="px-4 pb-5 pt-10 sm:px-6 lg:pt-14" aria-labelledby="remedy-hero-heading">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="section-title" id="remedy-hero-heading">
            Which Gemstone Should I Wear?
          </h1>
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
            Expert gemstone, Rudraksha &amp; Yagya guidance from your Kundli — not an automated tool.
            {rs101Paid ? (
              <>
                {' '}
                Book online from <Money amount={RS101_AMOUNT_INR} />.
              </>
            ) : (
              <> Book online — complimentary for international clients.</>
            )}
          </p>
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
        </div>
      </section>

      <div className="pvg-react-home-root pvg-remedy-form-bleed">
        <section className="reco-section scroll-mt-28" id="gem-recommendation" aria-labelledby="reco-heading">
          <div className="reco-split">
            <div className="reco-copy-panel">
              <div className="reco-copy-surface">
                <h2 className="reco-img-heading" id="reco-heading">
                  Get Your remedies
                  <br />
                  Recommendation
                </h2>
                <RecoHeroPriceCopy rs101Paid={rs101Paid} />
              </div>
            </div>
            <PvgRecommendationForm analyticsSource="gems-recommendations" rs101Paid={rs101Paid} />
          </div>
        </section>
      </div>

      <section className="pvg-remedy-section" aria-labelledby="how-heading">
        <div className="pvg-remedy-inner">
          <header className="pvg-remedy-head">
            <h2 className="section-title" id="how-heading">
              How Your Recommendation Unfolds
            </h2>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              From birth details to expert remedies — one booking, full chart review
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </header>

          <ol className="pvg-remedy-path">
            {steps.map((item, index) => (
              <ScrollReveal key={item.step} delay={index * 70}>
                <li className="pvg-remedy-path-item">
                  <div className="pvg-remedy-path-rail" aria-hidden="true">
                    <span className="pvg-remedy-path-orb">{item.step}</span>
                  </div>
                  <article className="pvg-remedy-path-card">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </article>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="pvg-remedy-section pvg-remedy-section--soft" aria-labelledby="concerns-heading">
        <div className="pvg-remedy-inner">
          <header className="pvg-remedy-head">
            <h2 className="section-title" id="concerns-heading">
              Where Remedies Meet Real Life
            </h2>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Career, health, relationships — chart-led remedies, never a fixed birthstone list
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </header>

          <div className="pvg-remedy-bands">
            {GEMS_REC_CONCERNS.map((item, index) => (
              <ScrollReveal key={item.slug} delay={index * 80}>
                <article className={`pvg-remedy-band ${index % 2 === 1 ? 'pvg-remedy-band--flip' : ''}`}>
                  <div className="pvg-remedy-band-media">
                    <Image
                      src={item.image}
                      alt={`${item.title} — Vedic remedies recommendation`}
                      fill
                      sizes="(max-width: 900px) 100vw, 48vw"
                      className="object-contain object-center"
                    />
                  </div>
                  <div className="pvg-remedy-band-copy">
                    <span className="pvg-remedy-band-index">0{index + 1}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <a href="#gem-recommendation" className="pvg-remedy-inline-cta">
                      Book remedies review
                    </a>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pvg-remedy-section" aria-labelledby="services-heading">
        <div className="pvg-remedy-inner">
          <header className="pvg-remedy-head">
            <h2 className="section-title" id="services-heading">
              A Complete Remedies Spectrum
            </h2>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Gemstones, Rudraksha, and Kundli insight woven from the same chart reading
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </header>

          <div className="pvg-remedy-triptych">
            {GEMS_REC_SERVICES.map((item, index) => (
              <ScrollReveal key={item.slug} delay={index * 90}>
                <Link href={item.href} className="pvg-remedy-shrine">
                  <div className="pvg-remedy-shrine-media">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 900px) 100vw, 33vw"
                      className="object-contain object-center"
                    />
                  </div>
                  <div className="pvg-remedy-shrine-body">
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pvg-remedy-section pvg-remedy-section--constellation" aria-labelledby="why-heading">
        <div className="pvg-remedy-inner">
          <header className="pvg-remedy-head">
            <h2 className="section-title" id="why-heading">
              Why Pure Vedic Gems
            </h2>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Sattvic intent, classical Jyotish, and a family tradition since 1937
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </header>

          <div className="pvg-remedy-constellation">
            {GEMS_REC_PILLARS.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 60}>
                <article className="pvg-remedy-star">
                  <span className="pvg-remedy-star-mark" aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p className="pvg-remedy-star-hi" lang="hi">
                    {item.titleHi}
                  </p>
                  <p>{item.body}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pvg-remedy-section pvg-remedy-section--soft" aria-labelledby="faq-heading">
        <div className="pvg-remedy-inner">
          <header className="pvg-remedy-head">
            <h2 className="section-title" id="faq-heading">
              Frequently Asked Questions
            </h2>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </header>

          <div className="pvg-remedy-faq">
            {GEMS_REC_PAGE_FAQS.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="pvg-remedy-finale" aria-label="Book recommendation">
        <div className="pvg-remedy-finale-inner">
          <h2>Ready for your remedies recommendation?</h2>
          <p>
            {rs101Paid ? (
              <>
                Pay <Money amount={RS101_AMOUNT_INR} />, share birth details, and receive expert guidance by email.
              </>
            ) : (
              <>Share your birth details and receive expert guidance by email.</>
            )}
          </p>
          <a href="#gem-recommendation">Book recommendation</a>
        </div>
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', href: '/' },
            { name: 'Remedies Recommendation', href: GEMS_REC_PATH },
          ]),
          {
            ...serviceJsonLd({
              name: 'Online Vedic Remedies Recommendation (Gemstone, Rudraksha & Yagya)',
              description: GEMS_REC_META.description,
              path: GEMS_REC_PATH,
            }),
            areaServed: [
              'India',
              'United States',
              'Canada',
              'United Kingdom',
              'United Arab Emirates',
              'Singapore',
              'Australia',
              'New Zealand',
              'Worldwide',
            ],
            availableChannel: {
              '@type': 'ServiceChannel',
              serviceType: 'Online consultation',
              availableLanguage: ['English', 'Hindi'],
            },
          },
          ...gemsRecInternalJsonLd(absoluteUrl),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
    </main>
  );
}
