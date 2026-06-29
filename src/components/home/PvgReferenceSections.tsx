/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */
import type { CSSProperties, ReactNode } from 'react';
import { PvgRecommendationForm } from '@/components/home/PvgRecommendationForm';
import { HomeTestimonialSlider } from '@/components/home/HomeTestimonialSlider';
import { IntegratedCategoryCta } from '@/components/home/PvgManagedCategorySections';
import type { SanityBlogPost } from '@/lib/types/blog';
import { urlFor, isSanityConfigured } from '@/lib/sanity/client';
import { TrustCardsSection } from '@/components/home/TrustCardsSection';
import { HOME_SERVICES, homeServiceImageSrc } from '@/lib/constants/home-services';

const WHO_WE_ARE_IMG_VERSION = '20260614';

const WHO_WE_ARE_STACK_IMAGES = [
  {
    src: '/home/whoweare/1Heritage.webp',
    alt: 'Four generations of Pure Vedic Gems family heritage since 1937',
    pos: '4',
  },
  {
    src: '/home/whoweare/puja-energization.jpeg',
    alt: '100% natural purified and energized Astro-Rashi gemstones with Vedic puja',
    pos: '3',
  },
  {
    src: '/home/whoweare/genuine-rudraksha-xray-certified.jpeg',
    alt: 'Genuine X-ray certified, purified and energized Rudrakshas with Rudra mantras',
    pos: '2',
  },
  {
    src: '/home/whoweare/most-reasonable-genuine-prices.jpeg',
    alt: 'Most reasonable and genuine prices through direct mine and farm sourcing',
    pos: '1',
  },
  {
    src: '/home/whoweare/powerful-vedic-talisman.jpeg',
    alt: 'Powerful Vedic talismans according to ancient sacred texts',
    pos: '0',
    fetchPriority: 'high' as const,
  },
] as const;
const CONFIGURATOR_STEPS_IMG_VERSION = '20260611b';
const CERT_STACK_IMG_VERSION = '20260611';

function toStyle(value: string): CSSProperties {
  const style: Record<string, string> = {};
  for (const part of value.split(';')) {
    const index = part.indexOf(':');
    if (index < 0) continue;
    const rawKey = part.slice(0, index).trim();
    const rawValue = part.slice(index + 1).trim();
    if (!rawKey || !rawValue) continue;
    const key = rawKey.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
    style[key] = rawValue;
  }
  return style as CSSProperties;
}

type KhubCategory = {
  _id: string;
  title: string;
  slug: { current: string };
  posts: SanityBlogPost[];
};

type PvgReferenceSectionsProps = {
  navaratnaSection: ReactNode;
  rudrakshaSection: ReactNode;
  semipreciousSection: ReactNode;
  exploreSection: ReactNode;
  directorsPickSection: ReactNode;
  testimonials: HomeTestimonial[];
  knowledgeBlogCategories?: KhubCategory[];
};

export type HomeTestimonial = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  title: string | null;
  message: string;
  proof_image_url?: string | null;
  proof_alt?: string | null;
};

const FALLBACK_TESTIMONIALS: HomeTestimonial[] = [
  {
    id: 'fallback-baljit-bains',
    name: 'Baljit Bains',
    location: 'South Australia',
    rating: 5,
    title: 'Yellow Sapphire & Coral',
    message: 'I bought two gemstones from Pure Vedic Gems. Vikas Ji gave me valuable advice and the team answered all my questions patiently. They helped me on every step of this process. I will highly recommend Pure Vedic Gems especially to overseas clients.',
  },
  {
    id: 'fallback-m-bakeer',
    name: 'M. Bakeer',
    location: 'Ontario, Canada',
    rating: 5,
    title: 'Custom Ring',
    message: 'The team walked me through the whole process up to delivery. The stone was very good quality and well energized, and I felt the difference as soon as I started wearing it. The craftsmanship of the ring was great as well.',
  },
  {
    id: 'fallback-anagha',
    name: 'Anagha',
    location: 'Portland, USA',
    rating: 5,
    title: 'Blue Sapphire',
    message: 'As recommended by the astrologer, I purchased the gemstones. After three months of wearing them, they guided me in the right direction and gave me strength in my convictions.',
  },
  {
    id: 'fallback-tran-thi-yen-van',
    name: 'Tran Thi Yen Van',
    location: 'Ho Chi Minh City, Vietnam',
    rating: 5,
    title: 'Ruby - Manik',
    message: 'The staff guided me slowly, clearly, and removed all my doubts. The products are very good and have given me positive results till now. I will highly recommend Pure Vedic Gems.',
  },
];

const KHUB_GRADIENTS = [
  'linear-gradient(145deg, #2A0202, #4A0808)',
  'linear-gradient(145deg, #061022, #0E1E50)',
  'linear-gradient(145deg, #031208, #061E0C)',
  'linear-gradient(145deg, #1A0E02, #2E1804)',
  'linear-gradient(145deg, #1A0800, #3D1A05)',
  'linear-gradient(145deg, #1a0635, #4B0082)',
  'linear-gradient(145deg, #0A0E1A, #101840)',
  'linear-gradient(145deg, #1E0606, #3A0808)',
] as const;

function KhubBlogCard({ post, gradient }: { post: SanityBlogPost; gradient: string }) {
  const imgUrl =
    post.mainImage && isSanityConfigured
      ? (() => {
          try {
            return urlFor(post.mainImage).width(480).height(240).quality(80).auto('format').url();
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <article className="khub-article">
      <div className="khub-article-img" style={imgUrl ? { backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: gradient }}>
        {!imgUrl && <div className="khub-article-cat">{post.category?.title ?? 'Article'}</div>}
        {imgUrl && <div className="khub-article-cat">{post.category?.title ?? 'Article'}</div>}
      </div>
      <div className="khub-article-body">
        <div className="khub-article-title">{post.title}</div>
        {post.excerpt && <div className="khub-article-excerpt">{post.excerpt}</div>}
        <a href={`/blog/${post.slug.current}`} className="khub-article-link">
          Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg>
        </a>
      </div>
    </article>
  );
}

export function PvgReferenceSections({
  navaratnaSection,
  rudrakshaSection,
  semipreciousSection,
  exploreSection,
  directorsPickSection,
  testimonials,
  knowledgeBlogCategories,
}: PvgReferenceSectionsProps) {
  const renderLegacyFallback = false;
  const featuredTestimonials = testimonials.length > 0 ? testimonials : FALLBACK_TESTIMONIALS;

  return (
    <>


  
  <TrustCardsSection />

  <section className="pvg-welcome-section" aria-label="Welcome to Pure Vedic Science and Research Centre">
    <div className="container">
      <div className="pvg-welcome-panel">
        <div className="pvg-welcome-copy">
          <p>
            PureVedicGems brings the wisdom of <strong>ancient Indian Vedic healing sciences</strong> in the most authentic way, having its own <strong>Vedic Research Centre</strong> to provide purest and most effective knowledge of complete Vedic healing through <strong>planetary gemstones</strong>, finest quality <strong>Rudrakshas</strong>, Authentic Vedic path (Sacred chanting) and <strong>Yagyas</strong> (Ancient Fire ritual), Mantra, Meditation, Yoga, Chakra and Ayurvedic healing sciences. Designing the customized unique talismans as per <strong>sacred geometry</strong> (using the recommended Gems, Rudrakshas, Crystals and Yantras) and then purifying, energizing and wearing them as per the genuine ancient Vedic rituals. We focus on <strong>pure, untreated, correctly identified gem pieces</strong> at fair global prices, supported by generations of family experience in gems, jewellery, sourcing, and spiritual remedy preparation, while helping clients avoid <strong>fake, tampered, treated, or low-quality remedies and fraudster healers</strong> because in Vedic tradition <strong>purity, authenticity, sacred yogic and saatvik mindset, accurate recommendation, and proper energization</strong> is most important.
          </p>
        </div>
      </div>
    </div>
  </section>

  
  <section className="who-section" id="about" aria-labelledby="who-heading">
    <div className="container">
      <div className="about-grid">

        
        <div className="about-img-wrap">
          <div className="about-img-stack" id="aboutStack" aria-label="Heritage photographs">
            {WHO_WE_ARE_STACK_IMAGES.map((item) => (
              <div key={item.src} className="about-stack-card" data-pos={item.pos}>
                <img
                  className="about-stack-img"
                  src={`${item.src}?v=${WHO_WE_ARE_IMG_VERSION}`}
                  alt={item.alt}
                  loading={item.pos === '0' ? 'eager' : 'lazy'}
                  decoding="async"
                  {...('fetchPriority' in item ? { fetchPriority: item.fetchPriority } : {})}
                />
              </div>
            ))}
          </div>
          <div className="about-exp-badge" aria-hidden="true">
            <img className="about-exp-img" src={`/home/whoweare/87yeara.webp?v=${WHO_WE_ARE_IMG_VERSION}`} alt="" loading="lazy" />
          </div>
        </div>

        
        <div className="about-copy-wrap">
          <div className="about-copy-intro">
            <div className="s-eyebrow">
              <div className="s-eyebrow-line"></div>
            </div>

            <h2 className="s-heading" id="who-heading">
              Four Generations<br />
              <em>One Sacred Mission</em>
            </h2>

            <div className="s-rule"></div>

            <p className="who-body">
              Since 1937, Pure Vedic Gems has been the custodian of India's most authentic Vedic gemstone tradition — where ancient Jyotish science meets world-class modern gemology. Founded by the Mehra family and carried forward across four generations, our purpose has never wavered: to deliver genuine cosmic healing through the precise science of planetary gems.
            </p>
          </div>

          <div className="about-copy-extra">
            <blockquote className="who-quote">
              "We do not merely sell gemstones. We deliver precise cosmic remedies — authenticated by scientific research, consecrated by Vedic tradition, and aligned to the cosmic forces of the universe."
            </blockquote>

            <div className="about-stats" aria-label="Key achievements">
              <div className="about-stat">
                <div className="about-stat-num">87+</div>
                <div className="about-stat-label">Yrs Legacy</div>
              </div>
              <div className="about-stat">
                <div className="about-stat-num">40+</div>
                <div className="about-stat-label">Countries</div>
              </div>
              <div className="about-stat">
                <div className="about-stat-num">1.5 L</div>
                <div className="about-stat-label">Lives Changed</div>
              </div>
              <div className="about-stat">
                <div className="about-stat-num">6</div>
                <div className="about-stat-label">Cert. Bodies</div>
              </div>
            </div>

            <div className="about-cta-row">
              <a href="#" className="btn-maroon">Our Full Story</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  
  {navaratnaSection}

  
  {rudrakshaSection}

  
  <section className="cert-section" id="certifications" aria-labelledby="cert-heading">
    <div className="container">
      <div className="cert-grid">

        
        <div>
          <h2 className="section-title" id="cert-heading" style={toStyle("margin-bottom: 0;")}>Certificates of<br /><em>Immutable Trust</em></h2>
          <div className="section-rule-left" style={toStyle("width:60px;height:2px;background:linear-gradient(90deg,var(--gold),transparent);margin:14px 0 0;")}></div>
          <p className="who-body" style={toStyle("margin-top: 18px; color: var(--muted);")}>Every gemstone we deliver is accompanied by a certificate from the world's most respected independent gem laboratories. These documents are your permanent proof of origin, treatment status, and quality — issued without bias.</p>

          <div className="cert-logos-wrap">
            <div className="cert-logos-grid">
              <div className="cert-logo-item"><img src="/labslogo/GIA.webp" alt="GIA — Gemological Institute of America" /></div>
              <div className="cert-logo-item"><img src="/labslogo/IGI.webp" alt="IGI — International Gemological Institute" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GRS.webp" alt="GRS — Gem Research Swisslab" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GUBELIN.webp" alt="Gübelin Gem Lab" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GII.webp" alt="GII" /></div>
              <div className="cert-logo-item"><img src="/labslogo/IIGJ.webp" alt="IIGJ" /></div>
              <div className="cert-logo-item"><img src="/labslogo/HRD ANTWERP.webp" alt="HRD Antwerp" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GJEPC.webp" alt="GJEPC" /></div>
              <div className="cert-logo-item"><img src="/labslogo/SSEF.webp" alt="SSEF" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GFCO.webp" alt="GFCO" /></div>
            </div>
          </div>
        </div>

        
        <div className="about-img-wrap">
          <div className="about-img-stack" id="certStack" aria-label="Certificate samples">

            <div className="cert-stack-card" data-pos="3">
              <div className="cert-stack-frame">
                <img className="cert-stack-img" src={`/home/certificates/certi1.png?v=${CERT_STACK_IMG_VERSION}`} alt="GIA gemstone certificate sample" loading="lazy" decoding="async" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="2">
              <div className="cert-stack-frame">
                <img className="cert-stack-img" src={`/home/certificates/certi2.png?v=${CERT_STACK_IMG_VERSION}`} alt="IGI gemstone certificate sample" loading="lazy" decoding="async" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="1">
              <div className="cert-stack-frame">
                <img className="cert-stack-img" src={`/home/certificates/certi3.png?v=${CERT_STACK_IMG_VERSION}`} alt="GII gemstone certificate sample" loading="lazy" decoding="async" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="0">
              <div className="cert-stack-frame">
                <img className="cert-stack-img" src={`/home/certificates/certi4.png?v=${CERT_STACK_IMG_VERSION}`} alt="Multiple gemstone certification reports from global labs" loading="eager" decoding="async" fetchPriority="high" />
              </div>
            </div>

          </div>
          <div className="about-exp-badge" aria-hidden="true">
            <img className="about-exp-img" src="/home/certificates/6globallabs.png?v=20260528c" alt="6+ Global Labs" loading="lazy" />
          </div>
        </div>

      </div>
    </div>
  </section>

  
  {semipreciousSection}

  {exploreSection}

  {directorsPickSection}

  {renderLegacyFallback && (
    <>

  
  <section className="explore-section" id="explore-category" aria-label="Explore by category">
    <div className="container">

      <div className="section-head">

        <h2 className="section-title">Explore by Category</h2>
        <p className="navratna-subtitle">Discover our curated sacred collections</p>
        <div className="section-rule-center"></div>
      </div>

      <div className="explore-tabs" role="tablist">
        <button className="explore-tab is-active" data-tab="spiritual" role="tab" aria-selected="true">Spiritual Idols</button>
        <button className="explore-tab" data-tab="jewellery" role="tab" aria-selected="false">Vedic Jewellery</button>
      </div>

      
      <div className="explore-panel is-active" id="panel-spiritual">
        <div className="explore-scroll" id="exploreScroll1">
          <div className="explore-row">

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #D4AC2C, #8B5E10 55%, #3A2200 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Ganesh Idol</div>
              <div className="explore-card-sub">Brass · Hand-crafted</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #C0C8D0, #707880 55%, #282C30 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Shiva Linga</div>
              <div className="explore-card-sub">Crystal · Natural</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #E8BC50, #B8861E 55%, #5A3800 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Lakshmi Idol</div>
              <div className="explore-card-sub">Gold Plated · Panchdhatu</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #E06020, #A03C00 55%, #4A1800 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Hanuman Idol</div>
              <div className="explore-card-sub">Brass · Energized</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #E8E0C8, #A09060 55%, #4A3818 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Saraswati Idol</div>
              <div className="explore-card-sub">White Metal · Panchdhatu</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #C04020, #801400 55%, #380400 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Durga Idol</div>
              <div className="explore-card-sub">Brass · Hand-crafted</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #60B080, #1A6040 55%, #062010 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Vishnu Idol</div>
              <div className="explore-card-sub">Panchdhatu · Energized</div>
            </div>

          </div>
        </div>
        <div className="explore-cta">
          <a href="#" className="btn-outline-maroon">View All Spiritual Idols <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>

      
      <div className="explore-panel" id="panel-jewellery">
        <div className="explore-scroll" id="exploreScroll2">
          <div className="explore-row">

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #E8C060, #C08C1A 55%, #6A4400 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Gold Ring Setting</div>
              <div className="explore-card-sub">22K Gold · Gem-ready</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #D0D8E0, #909898 55%, #303840 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Silver Pendant</div>
              <div className="explore-card-sub">925 Silver · Hallmarked</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-sale">SALE!</div>
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #D4A843, #9B6E10 55%, #4A2800 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Gold Bracelet</div>
              <div className="explore-card-sub">18K Gold · Adjustable</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #C060A0, #6B1A60 55%, #2A0030 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Navratna Pendant</div>
              <div className="explore-card-sub">9 Gems · Gold Setting</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #8B5E3C, #5A2C14 55%, #2A0C04 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Rudraksha Mala</div>
              <div className="explore-card-sub">108 Beads · Energized</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #8898CC, #3A4270 55%, #0E1430 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Crystal Bracelet</div>
              <div className="explore-card-sub">Clear Quartz · Healing</div>
            </div>

            <div className="explore-card">
              <div className="explore-card-img-wrap">
                <div className="explore-card-sale">SALE!</div>
                <div className="explore-card-art" style={toStyle("background: radial-gradient(circle at 35% 30%, #E0B860, #A07830 55%, #4A3000 100%);")}></div>
                <div className="explore-card-wish"><svg viewBox="0 0 24 24" width="14" height="14" stroke="#888" strokeWidth="2" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg></div>
              </div>
              <div className="explore-card-name">Gold Kada</div>
              <div className="explore-card-sub">22K Gold · Traditional</div>
            </div>

          </div>
        </div>
        <div className="explore-cta">
          <a href="#" className="btn-outline-maroon">View All Vedic Jewellery <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>
        </div>
      </div>

    </div>
  </section>

  
  <section className="directors-section" id="directors-pick" aria-label="Director's curated selection">
    <div className="container">

      <div className="dp-header-bar">
        <div>
          <div className="dp-header-bar-name">Personally by Shri Vikas Mehra &mdash; GIA Certified Astro-Gemologist</div>
        </div>
        <a href="#" className="btn-outline-maroon" style={toStyle("border-color: rgba(212,168,67,0.45); color: rgba(212,168,67,0.9); flex-shrink: 0; font-size: 10px; white-space: nowrap;")}>View All Picks</a>
      </div>

      <div className="dp-scroll-wrap" id="dpScrollWrap">
        <div className="dp-card-row">

          <div className="dp-gem-card">
            <div className="dp-gem-card-img" style={toStyle("background: linear-gradient(145deg, #2A0202, #4A0808);")}>
              <div className="dp-gem-art-shape" style={toStyle("background: linear-gradient(135deg, #6B0000, #C0392B, #E07070); color: rgba(192,57,43,0.6);")}></div>
              <div className="dp-gem-ribbon">Director's Pick</div>
              <div className="dp-gem-cert">GIA Cert.</div>
            </div>
            <div className="dp-gem-body">
              <div className="dp-gem-name">Burma Ruby &mdash; Manik</div>
              <div className="dp-gem-meta">3.02 ct &middot; Oval Cut &middot; Eye Clean &middot; No Heat</div>
              <div className="dp-gem-price">&#8377;2,14,200</div>
              <a href="#" className="dp-gem-btn">View &amp; Buy</a>
            </div>
          </div>

          <div className="dp-gem-card">
            <div className="dp-gem-card-img" style={toStyle("background: linear-gradient(145deg, #061022, #0E1E50);")}>
              <div className="dp-gem-art-shape" style={toStyle("background: linear-gradient(135deg, #06104A, #152380, #2E52CC); color: rgba(46,82,204,0.6);")}></div>
              <div className="dp-gem-ribbon">Director's Pick</div>
              <div className="dp-gem-cert">GRS Cert.</div>
            </div>
            <div className="dp-gem-body">
              <div className="dp-gem-name">Kashmir Blue Sapphire &mdash; Neelam</div>
              <div className="dp-gem-meta">4.74 ct &middot; Cushion &middot; No Heat</div>
              <div className="dp-gem-price">&#8377;9,48,000</div>
              <a href="#" className="dp-gem-btn">View &amp; Buy</a>
            </div>
          </div>

          <div className="dp-gem-card">
            <div className="dp-gem-card-img" style={toStyle("background: linear-gradient(145deg, #031208, #061E0C);")}>
              <div className="dp-gem-art-shape" style={toStyle("background: linear-gradient(135deg, #04300E, #1A6B30, #3DAF5C); color: rgba(61,175,92,0.5);")}></div>
              <div className="dp-gem-ribbon">Director's Pick</div>
              <div className="dp-gem-cert">Gubelin</div>
            </div>
            <div className="dp-gem-body">
              <div className="dp-gem-name">Colombian Emerald &mdash; Panna</div>
              <div className="dp-gem-meta">3.58 ct &middot; Oval Cut &middot; Minor Oil Only</div>
              <div className="dp-gem-price">&#8377;5,72,800</div>
              <a href="#" className="dp-gem-btn">View &amp; Buy</a>
            </div>
          </div>

          <div className="dp-gem-card">
            <div className="dp-gem-card-img" style={toStyle("background: linear-gradient(145deg, #1A1004, #2E1C04);")}>
              <div className="dp-gem-art-shape" style={toStyle("background: linear-gradient(135deg, #4A3000, #8B6914, #D4AC2C); color: rgba(212,172,44,0.5);")}></div>
              <div className="dp-gem-ribbon">Director's Pick</div>
              <div className="dp-gem-cert">IGI Cert.</div>
            </div>
            <div className="dp-gem-body">
              <div className="dp-gem-name">Ceylon Yellow Sapphire &mdash; Pukhraj</div>
              <div className="dp-gem-meta">5.12 ct &middot; Oval Cut &middot; No Heat</div>
              <div className="dp-gem-price">&#8377;3,58,400</div>
              <a href="#" className="dp-gem-btn">View &amp; Buy</a>
            </div>
          </div>

          <div className="dp-gem-card">
            <div className="dp-gem-card-img" style={toStyle("background: linear-gradient(145deg, #200A02, #4A1800);")}>
              <div className="dp-gem-art-shape" style={toStyle("background: linear-gradient(135deg, #3A0A00, #8B3010, #CC6030); color: rgba(204,96,48,0.5);")}></div>
              <div className="dp-gem-ribbon">Director's Pick</div>
              <div className="dp-gem-cert">GII Cert.</div>
            </div>
            <div className="dp-gem-body">
              <div className="dp-gem-name">Mediterranean Coral &mdash; Moonga</div>
              <div className="dp-gem-meta">6.40 ct &middot; Natural Oval &middot; Untreated</div>
              <div className="dp-gem-price">&#8377;1,28,000</div>
              <a href="#" className="dp-gem-btn">View &amp; Buy</a>
            </div>
          </div>

          <div className="dp-gem-card">
            <div className="dp-gem-card-img" style={toStyle("background: linear-gradient(145deg, #060814, #0C1028);")}>
              <div className="dp-gem-art-shape" style={toStyle("background: linear-gradient(135deg, #0C0840, #3020A0, #6A50D8); color: rgba(106,80,216,0.6);")}></div>
              <div className="dp-gem-ribbon">Director's Pick</div>
              <div className="dp-gem-cert">GRS Cert.</div>
            </div>
            <div className="dp-gem-body">
              <div className="dp-gem-name">Natural Pearl &mdash; Moti</div>
              <div className="dp-gem-meta">7.85 ct &middot; Gulf of Mannar &middot; Untreated</div>
              <div className="dp-gem-price">&#8377;86,350</div>
              <a href="#" className="dp-gem-btn">View &amp; Buy</a>
            </div>
          </div>

        </div>
      </div>

      <div className="scroll-hint">Swipe to explore <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>

    </div>
  </section>

    </>
  )}

  
  <section className="gem-cfg-section" id="configurator" aria-labelledby="config-heading">
    <div className="container">

      {/* Heading */}
      <div className="cfg-lin-head">
        <h2 className="cfg-lin-title" id="config-heading">From Gem to Jewellery</h2>
        <p className="cfg-lin-sub">A story of transformation. From nature&apos;s rarest wonders to timeless treasures.</p>
        <div className="cfg-lin-rule"></div>
      </div>

      {/* 6-step horizontal flow */}
      <div className="cfg-lin-steps" role="list">
        {([
          ['Select Gemstone',    "Handpicked from nature's finest for its rarity and energy."],
          ['Setting Type',       'Choose the setting that complements your style.'],
          ['Metal & Size',       'Select your preferred metal and the perfect size.'],
          ['Select Design',      'Bring your vision to life with a design that reflects you.'],
          ['Certification Lab',  'Tested and certified for authenticity and quality.'],
          ['Energization & Puja','Blessed with Vedic rituals for positive energy and protection.'],
        ] as [string, string][]).map(([label, desc], index) => (
          <div key={label} className="cfg-lin-step" role="listitem">
            <div className="cfg-lin-circle-wrap">
              <div className="cfg-lin-circle">
                <img
                  className="cfg-lin-img"
                  src={`/home/configuratorsteps/step${index + 1}.webp?v=${CONFIGURATOR_STEPS_IMG_VERSION}`}
                  alt={label}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span className="cfg-lin-badge" aria-hidden="true">{index + 1}</span>
            </div>
            <div className="cfg-lin-label">{label}</div>
            <p className="cfg-lin-desc">{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="cfg-lin-cta">
        <a href="/configure" className="cfg-lin-btn">Start Configuring</a>
      </div>

      {/* Trust strip */}
      <div className="cfg-lin-trust" role="list">

        <div className="cfg-lin-trust-item" role="listitem">
          <svg className="cfg-lin-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="cfg-lin-trust-text"><strong>100% Authentic</strong><span>Certified Gemstones</span></span>
        </div>

        <div className="cfg-lin-trust-item" role="listitem">
          <svg className="cfg-lin-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 6c0 3.3-2.7 6-6 6" strokeLinecap="round"/>
            <path d="M12 6c0 3.3 2.7 6 6 6" strokeLinecap="round"/>
            <path d="M12 18c0-3.3 2.7-6 6-6" strokeLinecap="round"/>
            <path d="M12 18c0-3.3-2.7-6-6-6" strokeLinecap="round"/>
          </svg>
          <span className="cfg-lin-trust-text"><strong>Vedic Blessings</strong><span>Energized &amp; Protected</span></span>
        </div>

        <div className="cfg-lin-trust-item" role="listitem">
          <svg className="cfg-lin-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="cfg-lin-trust-text"><strong>Expert</strong><span>Craftsmanship</span></span>
        </div>

        <div className="cfg-lin-trust-item" role="listitem">
          <svg className="cfg-lin-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <span className="cfg-lin-trust-text"><strong>Trusted By</strong><span>50,000+ Customers</span></span>
        </div>

        <div className="cfg-lin-trust-item" role="listitem">
          <svg className="cfg-lin-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
          </svg>
          <span className="cfg-lin-trust-text"><strong>Secure &amp; Insured</strong><span>Worldwide Delivery</span></span>
        </div>

        <div className="cfg-lin-trust-item" role="listitem">
          <svg className="cfg-lin-trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
            <line x1="12" y1="22" x2="12" y2="7"/>
            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
          </svg>
          <span className="cfg-lin-trust-text"><strong>Exquisite Packaging</strong><span>Perfect for Gifting</span></span>
        </div>

      </div>
    </div>
  </section>

  
  <section className="khub-section" id="knowledge-hub" aria-labelledby="khub-heading">
    <div className="container">
      <div className="section-head">
        <h2 className="section-title" id="khub-heading">Knowledge Hub</h2>
        <p className="navratna-subtitle">Ancient wisdom, modern understanding. Explore our comprehensive guides.</p>
        <div className="section-rule-center"></div>
      </div>

      {knowledgeBlogCategories && knowledgeBlogCategories.length > 0 ? (
        <>
          {/* Dynamic tabs from Sanity categories */}
          <div className="khub-tabs" role="tablist">
            {knowledgeBlogCategories.map((cat, i) => (
              <button
                key={cat._id}
                className={`khub-tab${i === 0 ? ' is-active' : ''}`}
                data-khub={cat.slug.current}
                role="tab"
                aria-selected={i === 0 ? 'true' : 'false'}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Dynamic panels — one per category */}
          {knowledgeBlogCategories.map((cat, i) => (
            <div
              key={cat._id}
              className={`khub-panel${i === 0 ? ' is-active' : ''}`}
              id={`khub-panel-${cat.slug.current}`}
              role="tabpanel"
            >
              {cat.posts.map((post, j) => (
                <KhubBlogCard
                  key={post._id}
                  post={post}
                  gradient={KHUB_GRADIENTS[j % KHUB_GRADIENTS.length]}
                />
              ))}
            </div>
          ))}
        </>
      ) : (
        /* Static fallback when Sanity has no published posts */
        <>
          <div className="khub-tabs" role="tablist">
            <button className="khub-tab is-active" data-khub="gemstones" role="tab" aria-selected="true">Gemstones</button>
            <button className="khub-tab" data-khub="astrology" role="tab" aria-selected="false">Astrology</button>
            <button className="khub-tab" data-khub="rudraksha" role="tab" aria-selected="false">Rudraksha</button>
          </div>
          <div className="khub-panel is-active" id="khub-panel-gemstones" role="tabpanel">
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #2A0202, #4A0808);")}><div className="khub-article-cat">Gemstone Guides</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">How to Choose the Right Ruby: Jyotish vs Market Quality</div>
                <div className="khub-article-excerpt">Not all rubies are equal — learn the 7 quality parameters that Vedic astrologers use to select a truly effective Manik.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #061022, #0E1E50);")}><div className="khub-article-cat">Gemstone Guides</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">Blue Sapphire: The Most Powerful &mdash; and Most Dangerous &mdash; Gem</div>
                <div className="khub-article-excerpt">Neelam is known to give instant results — good and bad. Here is how to test it safely before wearing.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #031208, #061E0C);")}><div className="khub-article-cat">Gemstone Guides</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">Colombian vs Zambian Emerald: Which is Better for Vedic Use?</div>
                <div className="khub-article-excerpt">Origin, color, clarity and treatments — our gemologists break down the differences for Jyotish purposes.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
          </div>
          <div className="khub-panel" id="khub-panel-astrology" role="tabpanel">
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #1A0E02, #2E1804);")}><div className="khub-article-cat">Vedic Astrology</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">What is Your Lagna Lord and Why it Determines Your Gemstone</div>
                <div className="khub-article-excerpt">The Ascendant lord is the single most important factor in gemstone prescription — more than Sun sign or Moon sign.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #0A100A, #101810);")}><div className="khub-article-cat">Vedic Astrology</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">Dasha &amp; Antardasha: When Wearing a Gem is Most Effective</div>
                <div className="khub-article-excerpt">Timing matters in Jyotish gemstone therapy. Wearing a gem during a planet's Mahadasha amplifies its effect dramatically.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #1E0606, #3A0808);")}><div className="khub-article-cat">Vedic Astrology</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">Navamsa Chart: Why Your D9 Chart Changes Everything</div>
                <div className="khub-article-excerpt">Experienced Vedic astro-gemologists always examine the Navamsa (D9) chart before confirming a gem recommendation.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
          </div>
          <div className="khub-panel" id="khub-panel-rudraksha" role="tabpanel">
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #1A0800, #3D1A05);")}><div className="khub-article-cat">Rudraksha Science</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">The Science of Rudraksha: Mukhi Variations &amp; Their Spiritual Properties</div>
                <div className="khub-article-excerpt">Understanding mukhi variations and their spiritual properties — and how to choose the right Rudraksha for your birth chart.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #1a0635, #4B0082);")}><div className="khub-article-cat">Rudraksha Science</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">Authenticating Genuine Beads: How to Identify Real Rudraksha</div>
                <div className="khub-article-excerpt">How to identify real Rudraksha through X-ray and testing — spotting the differences between Nepal and Java origin beads.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
            <article className="khub-article">
              <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #0A0E1A, #101840);")}><div className="khub-article-cat">Rudraksha Science</div></div>
              <div className="khub-article-body">
                <div className="khub-article-title">Wearing Rudraksha Correctly: Vedic Rituals &amp; Guidelines</div>
                <div className="khub-article-excerpt">Vedic rituals and guidelines for maximum spiritual benefit — including energization mantras and metal capping rules.</div>
                <a href="/blog" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
              </div>
            </article>
          </div>
        </>
      )}

      <div className="scroll-hint">Swipe to read more <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>

      <div className="khub-footer">
        <a href="/blog" className="btn-maroon">Explore All Articles</a>
      </div>
    </div>
  </section>

  
  <section className="experts-section" id="our-experts" aria-labelledby="experts-heading">
    <div className="container">
      <div className="section-head">

        <h2 className="section-title" id="experts-heading">Meet Our Experts</h2>
        <p className="navratna-subtitle">India's most trusted Vedic Astro-Gemologists — GIA certified, scripturally trained, 4-generation family legacy</p>
        <div className="section-rule-center"></div>
      </div>

      <div className="experts-grid">

        <div className="expert-card-v1">
          <div className="expert-av-wrap">
            <div className="expert-av">
              <img src="/our_expets_img/Mr. Vikash Mehra.webp" alt="Mr. Vikas Mehra" loading="lazy" />
            </div>
            <div className="expert-av-badge"><svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5"/></svg></div>
          </div>
          <div className="expert-name-v1">Mr. Vikas Mehra</div>
          <div className="expert-cred-v1">GIA · IIG · EGL Certified</div>
          <div className="expert-spec-v1">Master Gemologist &amp; Vedic Scholar. Vedic Astrology Research Specialist. 3rd Generation Jeweller with 25+ years in Jyotish gemstone therapy.</div>
          <div className="expert-stars-v1">
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
          </div>
          <div className="expert-count-v1">1,200+ Consultations</div>
          <a href="#" className="expert-book-btn">Book Consultation</a>
        </div>

        <div className="expert-card-v1">
          <div className="expert-av-wrap">
            <div className="expert-av">
              <img src="/our_expets_img/Mrs . Tanya Mehra.webp" alt="Mrs. Tanya Mehra" loading="lazy" />
            </div>
            <div className="expert-av-badge"><svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5"/></svg></div>
          </div>
          <div className="expert-name-v1">Mrs. Tanya Mehra</div>
          <div className="expert-cred-v1">Vedic Astrology Research Specialist</div>
          <div className="expert-spec-v1">Jyotish Vidya · Planetary Gemology · Birth Chart Analysis · Gem Prescription. Specialist in astrological prescription and gemstone recommendations.</div>
          <div className="expert-stars-v1">
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
          </div>
          <div className="expert-count-v1">850+ Consultations</div>
          <a href="#" className="expert-book-btn">Book Consultation</a>
        </div>

        <div className="expert-card-v1">
          <div className="expert-av-wrap">
            <div className="expert-av">
              <img src="/our_expets_img/Mr. Vrayas Mehra.webp" alt="Mr. Vrayas Mehra" loading="lazy" />
            </div>
            <div className="expert-av-badge"><svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5"/></svg></div>
          </div>
          <div className="expert-name-v1">Mr. Vrayas Mehra</div>
          <div className="expert-cred-v1">GIA Certified Gemologist</div>
          <div className="expert-spec-v1">Gemstone Sourcing · Quality Certification · Heritage Craft. 4th Generation Jeweller specializing in authentic Vedic gem curation.</div>
          <div className="expert-stars-v1">
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
            <svg className="expert-star" viewBox="0 0 14 14"><path d="M7 1l1.8 3.6L13 5.4l-3 2.9.7 4.1L7 10.4l-3.7 2 .7-4.1L1 5.4l4.2-.8z"/></svg>
          </div>
          <div className="expert-count-v1">600+ Consultations</div>
          <a href="#" className="expert-book-btn">Book Consultation</a>
        </div>

      </div>
    </div>
  </section>

  <IntegratedCategoryCta
    variant="rudraksha"
    title="Need a Vedic Yagya guided by trusted experts?"
    copy="Book a personalized Vedic Yagya service aligned to your birth chart, life goals, and current planetary periods with guidance from our in-house experts."
    primary={{ label: 'Explore Vedic Yagyas Service', href: '/vedic-yagyas-service' }}
    secondary={{ label: 'View All Vedic Yagyas', href: '/vedic-yagyas' }}
    image="/home/ctas/cta4.webp?v=1"
    imageAlt="Vedic yagyas guidance from Pure Vedic Gems experts"
    imageSide="left"
  />

  <section className="remedy-section" id="our-legacy" aria-labelledby="remedy-heading">
    <div className="container">
      <div className="remedy-shell">
        <div className="remedy-showcase" aria-live="polite">
          {[
            { src: '/home/whoweare/1Heritage.webp', alt: 'Pure Vedic Gems heritage milestone' },
            { src: '/home/whoweare/puja-energization.jpeg', alt: 'Vedic puja energization milestone' },
            { src: '/home/whoweare/genuine-rudraksha-xray-certified.jpeg', alt: 'X-ray certified Rudraksha milestone' },
            { src: '/home/whoweare/most-reasonable-genuine-prices.jpeg', alt: 'Direct sourcing and fair pricing milestone' },
            { src: '/home/whoweare/powerful-vedic-talisman.jpeg', alt: 'Vedic talisman milestone' },
            { src: '/stones_img/stone1.webp', alt: 'Global clientele milestone' },
            { src: '/home/hero/pvgherobg3.webp', alt: 'Next generation platform milestone' },
          ].map((item, index) => (
            <div key={item.src} className={`remedy-image${index === 0 ? ' is-active' : ''}`} data-legacy-image={index}>
              <img src={item.src} alt={item.alt} loading={index === 0 ? 'eager' : 'lazy'} />
            </div>
          ))}
          <div className="remedy-showcase-copy">
            <span className="remedy-eyebrow">Our Legacy</span>
            <h2 id="remedy-heading">87 Years of<br />Vedic Remedies</h2>
            <p>Four generations of expertise in sourcing, certifying, and energizing Vedic remedies for a global clientele.</p>
            <div className="remedy-badges">
              <span className="remedy-badge">Est. 1937</span>
              <span className="remedy-badge">4 Generations</span>
            </div>
          </div>
        </div>

        <div className="remedy-timeline" role="tablist" aria-label="Pure Vedic Gems legacy milestones">
          {[
            ['1937', "Founded in Old Delhi's Gem Quarter"],
            ['1960', '2nd Generation Expands Nationwide'],
            ['1985', '3rd Gen - Pan-India Presence'],
            ['2005', 'Digital & International Presence'],
            ['2015', 'E-Commerce & Global Clientele'],
            ['2026', '50K+ Customers - Next-Gen Platform'],
          ].map(([year, title], index) => (
            <button key={year} className={`remedy-step${index === 0 ? ' is-active' : ''}`} type="button" role="tab" aria-selected={index === 0 ? 'true' : 'false'} data-legacy-step={index}>
              <span className="remedy-index">{String(index + 1).padStart(2, '0')}</span>
              <span>
                <span className="remedy-year">{year}</span>
                <strong>{title}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  </section>



  
  
  <section className="bg-[#faf8f4] relative overflow-hidden" id="testimonials" aria-labelledby="testi-heading">
    <div className="absolute top-0 left-[-20px] text-[420px] font-black leading-none text-[#7a1515] opacity-5 pointer-events-none select-none" aria-hidden="true">&ldquo;</div>

    <div className="max-w-[1200px] mx-auto px-1 md:px-4">
      <div className="section-head mb-2 md:mb-6 -mt-4 md:mt-0">
        <h2 className="section-title" id="testi-heading">What Our Clients Say</h2>
        <p className="navratna-subtitle !text-[#5a5043]">Real experiences from clients across 40+ countries who chose Jyotish-certified gems.</p>
        <div className="section-rule-center"></div>
      </div>

      <HomeTestimonialSlider testimonials={featuredTestimonials} />
    </div>
  </section>

  
  <section className="reco-section" id="gem-recommendation" aria-labelledby="reco-heading">
    <div className="reco-split">

      <div className="reco-copy-panel">
        <div className="reco-copy-surface">
          <h2 className="reco-img-heading" id="reco-heading">Get Your Gemstone<br />Recommendation</h2>
          <p className="reco-img-sub">Share your birth details and our Vedic experts will recommend the perfect gemstone aligned with your planetary chart.</p>
          <div className="reco-img-trust">
            <span className="reco-img-trust-pill">50K+ Clients Served</span>
            <span className="reco-img-trust-pill">Expert Review</span>
          </div>
        </div>
      </div>

      <PvgRecommendationForm />

    </div>
  </section>

  
  <section className="services-section" id="our-services" aria-labelledby="svc-heading">
    <div className="container">
      <div className="section-head">

        <h2 className="section-title" id="svc-heading">Our Services</h2>
        <p className="navratna-subtitle">Comprehensive Vedic gemstone services — from expert consultation to certified jewellery.</p>
        <div className="section-rule-center"></div>
      </div>

      <div className="services-grid-v2">
        {HOME_SERVICES.map((service) => (
          <div className="svc-card-v2" key={service.slug}>
            <div className="svc-img-area">
              <img
                src={homeServiceImageSrc(service.slug)}
                alt={service.imageAlt}
                width={640}
                height={443}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="svc-body-v2">
              <p className="svc-title-v2">{service.title}</p>
              <a href={service.href} className="svc-click-btn">
                Click Here
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="svc-show-all-wrap">
        <button className="svc-show-all-btn" id="svcShowAllBtn" aria-expanded="false">
          Show All Services <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>

    </div>
  </section>


  <button className="pvg-scroll-top" id="pvgScrollTop" aria-label="Back to top">
    <svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
  </button>

  <div className="ds-label" role="note" aria-label="Design prototype version">Design System v1</div>

  
  
    </>
  );
}
