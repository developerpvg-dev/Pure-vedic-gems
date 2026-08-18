import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Gem, Phone, Share2 } from 'lucide-react';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import {
  NAVA_DURGA_CONTACT,
  NAVA_DURGA_FAQS,
  NAVA_DURGA_FORMS,
  NAVA_DURGA_INTRO,
  NAVA_DURGA_SEO,
  NAVA_DURGA_SLUG,
  NAVA_DURGA_SOCIALS,
} from '@/lib/constants/nava-durga-article';

const ORDINALS = [
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
  'Eighth',
  'Ninth',
] as const;

export function NavaDurgaArticleView() {
  return (
    <main className="nd-page">
      <section className="nd-hero" aria-labelledby="nd-hero-heading">
        <div className="nd-hero-inner">
          <nav className="nd-crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/blog">Blog</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Nava Durga &amp; Gemstones</span>
          </nav>
          <h1 className="section-title" id="nd-hero-heading">
            {NAVA_DURGA_SEO.title}
          </h1>
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
            {NAVA_DURGA_INTRO}
          </p>
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          <div className="nd-hero-actions">
            <Link href="/consultation" className="nd-btn nd-btn-primary">
              Book consultation
            </Link>
            <Link href="/gemstones/navaratna" className="nd-btn nd-btn-outline">
              Shop Navaratna
            </Link>
            <Link href="/rudraksha" className="nd-btn nd-btn-outline">
              Shop Rudraksha
            </Link>
          </div>
          <nav className="nd-day-nav" aria-label="Nine forms of Goddess Durga">
            <div className="nd-day-nav-inner">
              {NAVA_DURGA_FORMS.map((form) => (
                <a key={form.id} href={`#${form.id}`} className="nd-day-chip">
                  Day {form.day}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </section>

      <section className="nd-forms" aria-label="Nine Nava Durga forms">
        <div className="nd-forms-inner">
          {NAVA_DURGA_FORMS.map((form, index) => (
            <ScrollReveal key={form.id} delay={Math.min(index * 40, 200)}>
              <article className="nd-card" id={form.id} aria-labelledby={`${form.id}-heading`}>
                <div className="nd-card-photo">
                  <Image
                    src={form.image}
                    alt={form.imageAlt}
                    width={1280}
                    height={750}
                    sizes="(max-width: 768px) 100vw, 1152px"
                    className="nd-card-img"
                    priority={index === 0}
                  />
                  <span className="nd-card-day" aria-hidden="true">
                    Day {form.day}
                  </span>
                </div>

                <div className="nd-card-body">
                  <p className="nd-card-label">{form.planet}</p>
                  <header className="nd-card-head">
                    <h2 id={`${form.id}-heading`}>
                      {ORDINALS[form.day - 1]} Manifestation — {form.name}
                    </h2>
                    <p>{form.worshipTitle}</p>
                  </header>

                  <div className="nd-card-block">
                    <p className="nd-card-label">About</p>
                    <p>{form.intro}</p>
                  </div>
                  <div className="nd-card-block">
                    <p className="nd-card-label">Gemstone</p>
                    <p>{form.gemBody}</p>
                  </div>
                  <div className="nd-card-block">
                    <p className="nd-card-label">If afflicted</p>
                    <p>{form.remedyBody}</p>
                  </div>
                  <div className="nd-card-block">
                    <p className="nd-card-label">If well placed</p>
                    <p>{form.boostBody}</p>
                  </div>

                  <div className="nd-card-actions">
                    <Link href={form.gemHref} className="nd-btn nd-btn-primary">
                      <Gem className="h-4 w-4" aria-hidden="true" />
                      Shop {form.gemLabel}
                    </Link>
                    <Link href={form.rudrakshaHref} className="nd-btn nd-btn-outline">
                      {form.rudrakshaLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="nd-cta-wrap" aria-label="Sankalpa guidance">
        <div className="nd-cta-card">
          <h2 className="section-title">Get your sankalpa done on this path</h2>
          <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
            As per your problem and healing requirements, contact our team for gemstone, Rudraksha, or
            Durga Saptashati guidance — rooted in authentic Vedic practice since 1937.
          </p>
          <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          <div className="nd-hero-actions">
            <Link href="/consultation" className="nd-btn nd-btn-primary">
              Book consultation
            </Link>
            <Link href="/gems-recommendations" className="nd-btn nd-btn-outline">
              Remedies recommendation
            </Link>
            <a href={`tel:+91${NAVA_DURGA_CONTACT.phones[0]}`} className="nd-btn nd-btn-outline">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call {NAVA_DURGA_CONTACT.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      <section className="nd-faq" aria-labelledby="nd-faq-heading">
        <div className="nd-faq-inner">
          <div className="section-head">
            <h2 className="section-title" id="nd-faq-heading">
              Frequently asked questions
            </h2>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
          <div className="nd-faq-list">
            {NAVA_DURGA_FAQS.map((faq) => (
              <details key={faq.question} className="nd-faq-item">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="nd-connect" aria-labelledby="nd-connect-heading">
        <div className="nd-connect-inner">
          <article className="nd-connect-card">
            <div className="nd-connect-head">
              <div className="nd-connect-icon" aria-hidden="true">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h2 id="nd-connect-heading">Connect with us online</h2>
                <p>Follow Pure Vedic Gems for Navaratri insights and Vedic remedies.</p>
              </div>
            </div>
            <ul className="nd-social-list">
              {NAVA_DURGA_SOCIALS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="nd-share-row">
              <ShareButtons title={NAVA_DURGA_SEO.title} slug={NAVA_DURGA_SLUG} pathPrefix="" />
            </div>
            <div className="nd-more-links">
              <Link href="/blog">
                More articles <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/consultation">
                Book consultation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/vedic-yagyas/durga-saptashati-yagya">
                Durga Saptashati Yagya <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
