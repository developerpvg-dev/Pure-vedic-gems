/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */
import type { CSSProperties, ReactNode } from 'react';

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

type PvgReferenceSectionsProps = {
  navaratnaSection: ReactNode;
  rudrakshaSection: ReactNode;
  semipreciousSection: ReactNode;
  exploreSection: ReactNode;
  directorsPickSection: ReactNode;
};

export function PvgReferenceSections({
  navaratnaSection,
  rudrakshaSection,
  semipreciousSection,
  exploreSection,
  directorsPickSection,
}: PvgReferenceSectionsProps) {
  const renderLegacyFallback = false;

  return (
    <>


  
  <section className="trust-section" aria-label="Trust credentials">
    <div className="trust-inner">
      <div className="trust-cards">

        
        <div className="trust-card">
          
          <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1"/>
            <circle cx="36" cy="36" r="26" stroke="#D4A843" strokeWidth="0.7"/>
            <circle cx="36" cy="36" r="10" stroke="#D4A843" strokeWidth="0.7"/>
            <circle cx="36" cy="36" r="5" fill="#D4A843" opacity="0.3"/>
            <line x1="36" y1="2" x2="36" y2="70" stroke="#D4A843" strokeWidth="0.8"/>
            <line x1="2" y1="36" x2="70" y2="36" stroke="#D4A843" strokeWidth="0.8"/>
            <line x1="11.5" y1="11.5" x2="60.5" y2="60.5" stroke="#D4A843" strokeWidth="0.8"/>
            <line x1="60.5" y1="11.5" x2="11.5" y2="60.5" stroke="#D4A843" strokeWidth="0.8"/>
            
            <polygon points="36,8 39,28 36,32 33,28" fill="#B8861E" opacity="0.5"/>
            <polygon points="64,36 44,39 40,36 44,33" fill="#B8861E" opacity="0.5"/>
            <polygon points="36,64 33,44 36,40 39,44" fill="#B8861E" opacity="0.5"/>
            <polygon points="8,36 28,33 32,36 28,39" fill="#B8861E" opacity="0.5"/>
            <polygon points="55.5,16.5 41,32 37,30 43,20" fill="#B8861E" opacity="0.35"/>
            <polygon points="55.5,55.5 40,41 42,37 52,43" fill="#B8861E" opacity="0.35"/>
            <polygon points="16.5,55.5 31,40 35,42 29,52" fill="#B8861E" opacity="0.35"/>
            <polygon points="16.5,16.5 31,32 29,36 19,30" fill="#B8861E" opacity="0.35"/>
          </svg>
          <div className="trust-card-value">1937</div>
          <div className="trust-card-label">Established Since</div>
          <div className="trust-card-sub">4th Generation Family</div>
        </div>

        
        <div className="trust-card">
          
          <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1"/>
            <circle cx="36" cy="36" r="7" fill="#D4A843" opacity="0.25"/>
            <circle cx="36" cy="36" r="3" fill="#D4A843" opacity="0.5"/>
            
            <ellipse cx="36" cy="14" rx="5" ry="11" fill="#D4A843" opacity="0.22"/>
            <ellipse cx="36" cy="58" rx="5" ry="11" fill="#D4A843" opacity="0.22"/>
            <ellipse cx="14" cy="36" rx="11" ry="5" fill="#D4A843" opacity="0.22"/>
            <ellipse cx="58" cy="36" rx="11" ry="5" fill="#D4A843" opacity="0.22"/>
            <ellipse cx="16.5" cy="16.5" rx="8" ry="5" transform="rotate(-45 16.5 16.5)" fill="#D4A843" opacity="0.18"/>
            <ellipse cx="55.5" cy="55.5" rx="8" ry="5" transform="rotate(-45 55.5 55.5)" fill="#D4A843" opacity="0.18"/>
            <ellipse cx="55.5" cy="16.5" rx="8" ry="5" transform="rotate(45 55.5 16.5)" fill="#D4A843" opacity="0.18"/>
            <ellipse cx="16.5" cy="55.5" rx="8" ry="5" transform="rotate(45 16.5 55.5)" fill="#D4A843" opacity="0.18"/>
            <circle cx="36" cy="36" r="20" stroke="#B8861E" strokeWidth="0.5" strokeDasharray="3 3"/>
          </svg>
          <div className="trust-card-value">87+</div>
          <div className="trust-card-label">Years of Legacy</div>
          <div className="trust-card-sub">Unbroken Heritage</div>
        </div>

        
        <div className="trust-card">
          
          <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1"/>
            <ellipse cx="36" cy="36" rx="22" ry="34" stroke="#D4A843" strokeWidth="0.7"/>
            <ellipse cx="36" cy="36" rx="10" ry="34" stroke="#D4A843" strokeWidth="0.5"/>
            <line x1="2" y1="36" x2="70" y2="36" stroke="#D4A843" strokeWidth="0.6"/>
            <ellipse cx="36" cy="36" rx="34" ry="12" stroke="#D4A843" strokeWidth="0.5"/>
            <ellipse cx="36" cy="36" rx="34" ry="22" stroke="#D4A843" strokeWidth="0.4"/>
            <circle cx="36" cy="36" r="4" fill="#B8861E" opacity="0.5"/>
          </svg>
          <div className="trust-card-value">40+</div>
          <div className="trust-card-label">Countries Served</div>
          <div className="trust-card-sub">Global Clientele</div>
        </div>

        
        <div className="trust-card">
          
          <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1"/>
            <path d="M36 10 L52 18 L52 36 C52 48 36 60 36 60 C36 60 20 48 20 36 L20 18 Z" stroke="#D4A843" strokeWidth="1.2" fill="#D4A843" fillOpacity="0.08"/>
            <path d="M36 20 L44 24 L44 36 C44 43 36 50 36 50 C36 50 28 43 28 36 L28 24 Z" fill="#D4A843" fillOpacity="0.12"/>
            <path d="M29 35 L34 40 L43 28" stroke="#B8861E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="trust-card-value">6</div>
          <div className="trust-card-label">Lab Certifications</div>
          <div className="trust-card-sub">GIA · IGI · GRS · IIGJ</div>
        </div>

        
        <div className="trust-card">
          
          <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1"/>
            
            <polygon points="36,14 56,52 16,52" stroke="#D4A843" strokeWidth="1" fill="#D4A843" fillOpacity="0.07"/>
            
            <polygon points="36,58 56,20 16,20" stroke="#D4A843" strokeWidth="1" fill="#D4A843" fillOpacity="0.07"/>
            <circle cx="36" cy="36" r="6" fill="#D4A843" opacity="0.3"/>
            <circle cx="36" cy="36" r="2.5" fill="#B8861E" opacity="0.7"/>
            
            <circle cx="36" cy="8" r="1.8" fill="#D4A843" opacity="0.5"/>
            <circle cx="64" cy="36" r="1.8" fill="#D4A843" opacity="0.5"/>
            <circle cx="36" cy="64" r="1.8" fill="#D4A843" opacity="0.5"/>
            <circle cx="8" cy="36" r="1.8" fill="#D4A843" opacity="0.5"/>
          </svg>
          <div className="trust-card-value">Vedic</div>
          <div className="trust-card-label">Energized</div>
          <div className="trust-card-sub">Authentic Puja · Video Proof</div>
        </div>

        
        <div className="trust-card">
          
          <svg className="chakra-icon" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="36" cy="36" r="34" stroke="#D4A843" strokeWidth="1"/>
            {/* Group of people icon */}
            <circle cx="24" cy="26" r="7" stroke="#D4A843" strokeWidth="1.2" fill="#D4A843" fillOpacity="0.12"/>
            <circle cx="48" cy="26" r="7" stroke="#D4A843" strokeWidth="1.2" fill="#D4A843" fillOpacity="0.12"/>
            <circle cx="36" cy="22" r="8" stroke="#B8861E" strokeWidth="1.5" fill="#D4A843" fillOpacity="0.18"/>
            <path d="M12 52 C12 42 20 36 28 36 L44 36 C52 36 60 42 60 52" stroke="#D4A843" strokeWidth="1.2" fill="#D4A843" fillOpacity="0.1"/>
            <path d="M20 52 C20 45 26 40 32 40 L40 40 C46 40 52 45 52 52" stroke="#B8861E" strokeWidth="1.5" fill="#D4A843" fillOpacity="0.15"/>
            {/* Checkmark badge */}
            <circle cx="54" cy="20" r="8" fill="#138808" fillOpacity="0.85"/>
            <path d="M50 20 L53 23 L58 17" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <div className="trust-card-value">1.5 L+</div>
          <div className="trust-card-label">Certified Customers</div>
          <div className="trust-card-sub">Trusted · Verified · Happy</div>
        </div>

      </div>
    </div>
  </section>

  <section className="pvg-welcome-section" aria-label="Welcome to Pure Vedic Science and Research Centre">
    <div className="container">
      <div className="pvg-welcome-panel">
        <div className="pvg-welcome-copy">
          <p>
            PureVedicGems brings together <strong>ancient Indian Vedic science</strong>, <strong>natural certified gemstones</strong>, <strong>genuine Rudrakshas</strong>, <strong>purification rituals</strong>, and <strong>mantra-based energization</strong> so every remedy is chosen, prepared, and worn with the right purpose. We focus on <strong>pure, untreated, correctly identified pieces</strong> at fair global prices, supported by generations of family experience in gems, jewellery, sourcing, and spiritual remedy preparation, while helping clients avoid <strong>fake, tampered, treated, or low-quality remedies</strong> because in Vedic tradition <strong>purity, authenticity, accurate recommendation, and proper energization</strong> matter just as much as the gemstone, Rudraksha, or talisman itself.
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

            <div className="about-stack-card" data-pos="3">
              <img className="about-stack-img" src="/home/whoweare/1Heritage.webp" alt="Four generations of Pure Vedic Gems family heritage" loading="lazy" decoding="async" />
            </div>

            <div className="about-stack-card" data-pos="2">
              <img className="about-stack-img" src="/home/whoweare/2Sourcing.webp" alt="Direct gemstone sourcing from Sri Lanka, Burma and Zambia" loading="lazy" decoding="async" />
            </div>

            <div className="about-stack-card" data-pos="1">
              <img className="about-stack-img" src="/home/whoweare/3Certification.webp" alt="Pure Vedic Gems certification bodies" loading="lazy" decoding="async" />
            </div>

            <div className="about-stack-card" data-pos="0">
              <img className="about-stack-img" src="/home/whoweare/4Energization.webp" alt="Authentic Vedic gemstone energization ritual" loading="lazy" decoding="async" />
            </div>

          </div>
          <div className="about-exp-badge" aria-hidden="true">
            <div className="about-exp-num">87+</div>
            <div className="about-exp-label">Years<br />Legacy</div>
          </div>
        </div>

        
        <div className="about-copy-wrap">
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

          <blockquote className="who-quote">
            "We do not merely sell gemstones. We deliver precise cosmic remedies — authenticated by science, consecrated by Vedic tradition, and aligned to the cosmic forces of the universe."
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
              <div className="about-stat-num">1L+</div>
              <div className="about-stat-label">Lives Changed</div>
            </div>
            <div className="about-stat">
              <div className="about-stat-num">6</div>
              <div className="about-stat-label">Cert. Bodies</div>
            </div>
          </div>

          <div className="about-cta-row">
            <a href="/about" className="btn-maroon">Our Full Story</a>
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
              <div className="cert-logo-item"><img src="/labslogo/GIA.webp" alt="GIA — Gemological Institute of America" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/IGI.webp" alt="IGI — International Gemological Institute" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GRS.webp" alt="GRS — Gem Research Swisslab" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GUBELIN.webp" alt="Gübelin Gem Lab" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GII.webp" alt="GII" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/IIGJ.webp" alt="IIGJ" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/HRD ANTWERP.webp" alt="HRD Antwerp" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GJEPC.webp" alt="GJEPC" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/SSEF.webp" alt="SSEF" loading="lazy" decoding="async" /></div>
              <div className="cert-logo-item"><img src="/labslogo/GFCO.webp" alt="GFCO" loading="lazy" decoding="async" /></div>
            </div>
          </div>
        </div>

        
        <div className="cert-img-wrap">
          <div className="cert-img-stack" id="certStack">

            <div className="cert-stack-card" data-pos="3">
              <div className="cert-card-inner">
                <img className="cert-real-img" src="/home/certificates/1116x1676 pixle GIA (1).webp" alt="GIA gemstone certificate sample" loading="lazy" decoding="async" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="2">
              <div className="cert-card-inner">
                <img className="cert-real-img" src="/home/certificates/1116x1676 pixle IGI (1).webp" alt="IGI gemstone certificate sample" loading="lazy" decoding="async" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="1">
              <div className="cert-card-inner">
                <img className="cert-real-img" src="/home/certificates/1116x1676 pixle GII (1).webp" alt="GII gemstone certificate sample" loading="lazy" decoding="async" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="0">
              <div className="cert-card-inner">
                <img className="cert-real-img cert-real-img-landscape" src="/home/certificates/1170x826 pixle copy (1).webp" alt="Multiple gemstone certification reports from global labs" loading="lazy" decoding="async" />
              </div>
            </div>

          </div>
          <div className="about-exp-badge" style={toStyle("background: var(--gold); border-color: var(--white); bottom: 0; right: -14px;")} aria-hidden="true">
            <div className="about-exp-num" style={toStyle("font-size: 13px; color: var(--maroon-deepest);")}>6+</div>
            <div className="about-exp-label" style={toStyle("color: rgba(0,0,0,0.55);")}>Global<br />Labs</div>
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

  
  <section className="journey-section" id="configurator" aria-labelledby="journey-heading">
    <div className="container">

      {/* Header */}
      <div className="journey-header">
        <h2 id="journey-heading" className="journey-title">From Gem to Jewellery</h2>
        <div className="journey-title-rule" aria-hidden="true" />
        <p className="journey-subtitle">A story of transformation. From nature&apos;s rarest wonders to timeless treasures.</p>
      </div>

      {/* 6-Step Grid */}
      <div className="journey-steps-grid">
        {([
          {
            title: 'Select Gemstone',
            desc: "Handpicked from nature\u2019s finest for its rarity and energy.",
          },
          {
            title: 'Setting Type',
            desc: 'Choose the setting that complements your style.',
          },
          {
            title: 'Metal & Size',
            desc: 'Select your preferred metal and the perfect size.',
          },
          {
            title: 'Select Design',
            desc: 'Bring your vision to life with a design that reflects you.',
          },
          {
            title: 'Certification Lab',
            desc: 'Tested and certified for authenticity and quality.',
          },
          {
            title: 'Energization & Puja',
            desc: 'Blessed with Vedic rituals for positive energy and protection.',
          },
        ] as Array<{ title: string; desc: string }>).map((step, i) => (
          <div className="journey-step" key={i}>
            <div className="journey-step-img-wrap">
              <img src={`/home/configuratorsteps/step${i + 1}.webp`} alt={step.title} loading="lazy" decoding="async" className="journey-step-img" />
            </div>
            <div className="journey-step-num" aria-hidden="true">{i + 1}</div>
            <div className="journey-step-title">{step.title.toUpperCase()}</div>
            <p className="journey-step-desc">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="journey-cta-wrap">
        <a href="/configure" className="journey-cta-btn">Start Configuring</a>
      </div>

      {/* Trust Bar */}
      <div className="journey-trust-bar">
        {([
          {
            title: '100% Authentic',
            sub: 'Certified Gemstones',
            icon: (
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 2L4 8v9c0 7 5 11 12 13 7-2 12-6 12-13V8L16 2z"/><path d="M10 16l4 4 8-8"/>
              </svg>
            ),
          },
          {
            title: 'Vedic Blessings',
            sub: 'Energized & Protected',
            icon: (
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 28s-8-5-8-13c0-4 3.6-7 8-7s8 3 8 7c0 8-8 13-8 13z"/><path d="M16 8c-2-3-7-6-7-6s2 4 4 8"/><path d="M16 8c2-3 7-6 7-6s-2 4-4 8"/>
              </svg>
            ),
          },
          {
            title: 'Expert',
            sub: 'Craftsmanship',
            icon: (
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 4L4 13l12 15 12-15L16 4z"/><path d="M4 13h24"/>
              </svg>
            ),
          },
          {
            title: 'Trusted By',
            sub: '50,000+ Customers',
            icon: (
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="9" r="4"/><circle cx="22" cy="9" r="3"/><path d="M4 28v-3c0-3 4-5 8-5s8 2 8 5v3"/><path d="M22 12c3 0 6 1.5 6 4v3"/>
              </svg>
            ),
          },
          {
            title: 'Secure & Insured',
            sub: 'Worldwide Delivery',
            icon: (
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 2L4 8v9c0 7 5 11 12 13 7-2 12-6 12-13V8L16 2z"/><rect x="11" y="16" width="10" height="7" rx="1"/><path d="M13 16v-3a3 3 0 016 0v3"/>
              </svg>
            ),
          },
          {
            title: 'Exquisite Packaging',
            sub: 'Perfect for Gifting',
            icon: (
              <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="12" width="24" height="4" rx="1"/><rect x="6" y="16" width="20" height="12" rx="1"/><path d="M16 12v16"/><path d="M16 12c0-2-2-6-4-6s-2 4 4 6"/><path d="M16 12c0-2 2-6 4-6s2 4-4 6"/>
              </svg>
            ),
          },
        ] as Array<{ title: string; sub: string; icon: ReactNode }>).map((badge, i) => (
          <div className="journey-trust-item" key={i}>
            <div className="journey-trust-icon">{badge.icon}</div>
            <div>
              <div className="journey-trust-label">{badge.title.toUpperCase()}</div>
              <div className="journey-trust-sub">{badge.sub}</div>
            </div>
          </div>
        ))}
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

      <div className="khub-tabs" role="tablist">
        <button className="khub-tab is-active" data-khub="gemstones" role="tab" aria-selected="true">Gemstones</button>
        <button className="khub-tab" data-khub="astrology" role="tab" aria-selected="false">Astrology</button>
        <button className="khub-tab" data-khub="rudraksha" role="tab" aria-selected="false">Rudraksha</button>
      </div>

      
      <div className="khub-panel is-active" id="khub-panel-gemstones" role="tabpanel">
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #2A0202, #4A0808);")}>
            <div className="khub-article-cat">Gemstone Guides</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">How to Choose the Right Ruby: Jyotish vs Market Quality</div>
            <div className="khub-article-excerpt">Not all rubies are equal — learn the 7 quality parameters that Vedic astrologers use to select a truly effective Manik.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #061022, #0E1E50);")}>
            <div className="khub-article-cat">Gemstone Guides</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">Blue Sapphire: The Most Powerful &mdash; and Most Dangerous &mdash; Gem</div>
            <div className="khub-article-excerpt">Neelam is known to give instant results — good and bad. Here is how to test it safely before wearing.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #031208, #061E0C);")}>
            <div className="khub-article-cat">Gemstone Guides</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">Colombian vs Zambian Emerald: Which is Better for Vedic Use?</div>
            <div className="khub-article-excerpt">Origin, color, clarity and treatments — our gemologists break down the differences for Jyotish purposes.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
      </div>

      
      <div className="khub-panel" id="khub-panel-astrology" role="tabpanel">
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #1A0E02, #2E1804);")}>
            <div className="khub-article-cat">Vedic Astrology</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">What is Your Lagna Lord and Why it Determines Your Gemstone</div>
            <div className="khub-article-excerpt">The Ascendant lord is the single most important factor in gemstone prescription — more than Sun sign or Moon sign.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #0A100A, #101810);")}>
            <div className="khub-article-cat">Vedic Astrology</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">Dasha &amp; Antardasha: When Wearing a Gem is Most Effective</div>
            <div className="khub-article-excerpt">Timing matters in Jyotish gemstone therapy. Wearing a gem during a planet's Mahadasha amplifies its effect dramatically.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #1E0606, #3A0808);")}>
            <div className="khub-article-cat">Vedic Astrology</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">Navamsa Chart: Why Your D9 Chart Changes Everything</div>
            <div className="khub-article-excerpt">Experienced Vedic astro-gemologists always examine the Navamsa (D9) chart before confirming a gem recommendation.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
      </div>

      
      <div className="khub-panel" id="khub-panel-rudraksha" role="tabpanel">
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #1A0800, #3D1A05);")}>
            <div className="khub-article-cat">Rudraksha Science</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">The Science of Rudraksha: Mukhi Variations &amp; Their Spiritual Properties</div>
            <div className="khub-article-excerpt">Understanding mukhi variations and their spiritual properties — and how to choose the right Rudraksha for your birth chart.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #1a0635, #4B0082);")}>
            <div className="khub-article-cat">Rudraksha Science</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">Authenticating Genuine Beads: How to Identify Real Rudraksha</div>
            <div className="khub-article-excerpt">How to identify real Rudraksha through X-ray and testing — spotting the differences between Nepal and Java origin beads.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
        <article className="khub-article">
          <div className="khub-article-img" style={toStyle("background: linear-gradient(145deg, #0A0E1A, #101840);")}>
            <div className="khub-article-cat">Rudraksha Science</div>
          </div>
          <div className="khub-article-body">
            <div className="khub-article-title">Wearing Rudraksha Correctly: Vedic Rituals &amp; Guidelines</div>
            <div className="khub-article-excerpt">Vedic rituals and guidelines for maximum spiritual benefit — including energization mantras and metal capping rules.</div>
            <a href="#" className="khub-article-link">Read More <svg viewBox="0 0 12 12"><path d="M2 6h8M6 2l4 4-4 4"/></svg></a>
          </div>
        </article>
      </div>

      <div className="scroll-hint">Swipe to read more <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>

      <div className="khub-scroll-controls" aria-label="Knowledge Hub carousel controls">
        <button className="khub-scroll-btn" type="button" data-khub-direction="prev" aria-label="Previous Knowledge Hub articles">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button className="khub-scroll-btn" type="button" data-khub-direction="next" aria-label="Next Knowledge Hub articles">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      <div className="khub-footer">
        <a href="#" className="btn-maroon">Explore All Articles</a>
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
              <img src="/our_expets_img/Mr.%20Vikash%20Mehra.webp" alt="Mr. Vikas Mehra" loading="lazy" decoding="async" />
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
              <img src="/our_expets_img/Mrs%20.%20Tanya%20Mehra.webp" alt="Mrs. Tanya Mehra" loading="lazy" decoding="async" />
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
              <img src="/our_expets_img/Mr.%20Vrayas%20Mehra.webp" alt="Mr. Vrayas Mehra" loading="lazy" decoding="async" />
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

  
  <section className="remedy-section" id="our-legacy" aria-labelledby="remedy-heading">
    <div className="container">
      <div className="remedy-shell">
        <div className="remedy-showcase" aria-live="polite">
          {[
            { src: '/home/whoweare/1Heritage.webp', alt: 'Pure Vedic Gems heritage milestone' },
            { src: '/home/whoweare/2Sourcing.webp', alt: 'Gemstone sourcing milestone' },
            { src: '/home/whoweare/3Certification.webp', alt: 'Certification milestone' },
            { src: '/home/whoweare/4Energization.webp', alt: 'Energization milestone' },
            { src: '/stones_img/stone1.webp', alt: 'Global clientele milestone' },
            { src: '/home/hero/pvgherobg3.webp', alt: 'Next generation platform milestone' },
          ].map((item, index) => (
            <div key={item.src} className={`remedy-image${index === 0 ? ' is-active' : ''}`} data-legacy-image={index}>
              <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
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





  
  <section className="testimonials-section" id="testimonials" aria-labelledby="testi-heading">
    <div className="container">
      <div className="section-head">

        <h2 className="section-title" id="testi-heading">What Our Clients Say</h2>
        <p className="navratna-subtitle">Real experiences from clients across 40+ countries who chose Jyotish-certified gems.</p>
        <div className="section-rule-center"></div>
      </div>

      <div className="testi-wrap-v2">
        <div className="testi-track-v2" id="testiTrackV2">

          <div className="testi-card-v2">
            <div className="testi-stars-v2" aria-label="5 out of 5 stars">
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
            </div>
            <p className="testi-quote-v2">"After wearing the Yellow Sapphire and Coral recommended by Pure Vedic Gems, I noticed significant positive changes within weeks. The gems were beautifully set and arrived with full GIA documentation."</p>
            <div className="testi-meta-v2">
              <div>
                <div className="testi-name-v2">Baljit Bains</div>
                <div className="testi-loc-v2">South Australia, Australia</div>
              </div>
              <span className="testi-badge-v2">Yellow Sapphire &amp; Coral</span>
            </div>
          </div>

          <div className="testi-card-v2">
            <div className="testi-stars-v2" aria-label="5 out of 5 stars">
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
            </div>
            <p className="testi-quote-v2">"The custom ring crafted with my chosen gem exceeded all expectations. The craftsmanship is superb and the Vedic energisation ceremony was a truly sacred experience. Highly recommend!"</p>
            <div className="testi-meta-v2">
              <div>
                <div className="testi-name-v2">M. Bakeer</div>
                <div className="testi-loc-v2">Ontario, Canada</div>
              </div>
              <span className="testi-badge-v2">Custom Ring</span>
            </div>
          </div>

          <div className="testi-card-v2">
            <div className="testi-stars-v2" aria-label="5 out of 5 stars">
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
            </div>
            <p className="testi-quote-v2">"Consulted about Blue Sapphire for career growth. The expert gave me detailed guidance based on my birth chart and the gem has truly brought clarity and focus to my professional life."</p>
            <div className="testi-meta-v2">
              <div>
                <div className="testi-name-v2">Anagha</div>
                <div className="testi-loc-v2">Portland, USA</div>
              </div>
              <span className="testi-badge-v2">Blue Sapphire</span>
            </div>
          </div>

          <div className="testi-card-v2">
            <div className="testi-stars-v2" aria-label="5 out of 5 stars">
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
            </div>
            <p className="testi-quote-v2">"I ordered an Emerald for my daughter and the quality was exceptional. The live energisation ritual was performed as per our Gotra and we received the video recording. Truly authentic!"</p>
            <div className="testi-meta-v2">
              <div>
                <div className="testi-name-v2">Bibi Hazra</div>
                <div className="testi-loc-v2">Mauritius</div>
              </div>
              <span className="testi-badge-v2">Emerald — Panna</span>
            </div>
          </div>

          <div className="testi-card-v2">
            <div className="testi-stars-v2" aria-label="5 out of 5 stars">
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
            </div>
            <p className="testi-quote-v2">"Purchased a Yellow Sapphire set in gold. The stone was exactly as described — natural, no heat treatment, with GRS certificate. The setting quality and delivery to UK was perfect."</p>
            <div className="testi-meta-v2">
              <div>
                <div className="testi-name-v2">Nitin</div>
                <div className="testi-loc-v2">United Kingdom</div>
              </div>
              <span className="testi-badge-v2">Yellow Sapphire</span>
            </div>
          </div>

          <div className="testi-card-v2">
            <div className="testi-stars-v2" aria-label="5 out of 5 stars">
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
              <svg className="testi-star-v2" viewBox="0 0 20 20"><path d="M10 1l2.4 7.4H20l-6.2 4.5 2.4 7.4L10 16l-6.2 4.3 2.4-7.4L0 8.4h7.6z"/></svg>
            </div>
            <p className="testi-quote-v2">"I consulted from Vietnam and received a Ruby stone for my husband. The gem quality is outstanding and the personalised Vedic recommendation was so precise. Will order again!"</p>
            <div className="testi-meta-v2">
              <div>
                <div className="testi-name-v2">Tran Thi Yen Van</div>
                <div className="testi-loc-v2">Ho Chi Minh City, Vietnam</div>
              </div>
              <span className="testi-badge-v2">Ruby — Manik</span>
            </div>
          </div>

        </div>
      </div>

      <div className="testi-nav-v2">
        <button className="testi-arr-v2" id="testiPrevV2" aria-label="Previous testimonials">
          <svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button className="testi-arr-v2" id="testiNextV2" aria-label="Next testimonials">
          <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

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
            <span className="reco-img-trust-pill">Free Consultation</span>
          </div>
        </div>
      </div>

      <div className="reco-form-panel">
        <div className="reco-form-grid">
          <div className="reco-form-group">
            <label className="reco-form-label" htmlFor="recoDob">Date of Birth</label>
            <input className="reco-form-input" id="recoDob" type="date" name="dob" required />
          </div>
          <div className="reco-form-group">
            <label className="reco-form-label" htmlFor="recoTob">Birth Time</label>
            <input className="reco-form-input" id="recoTob" type="time" name="tob" />
          </div>
          <div className="reco-form-group">
            <label className="reco-form-label" htmlFor="recoBirthPlace">Birth Place</label>
            <input className="reco-form-input" id="recoBirthPlace" type="text" name="birthplace" placeholder="City" />
          </div>
          <div className="reco-form-group">
            <label className="reco-form-label" htmlFor="recoName">Your Name</label>
            <input className="reco-form-input" id="recoName" type="text" name="name" placeholder="Full Name" />
          </div>
          <div className="reco-form-group">
            <label className="reco-form-label" htmlFor="recoPhone">Phone</label>
            <input className="reco-form-input" id="recoPhone" type="tel" name="phone" placeholder="+91 XXXXX XXXXX" />
          </div>
          <div className="reco-form-group">
            <label className="reco-form-label" htmlFor="recoPurpose">Purpose</label>
            <select className="reco-form-input reco-form-select" id="recoPurpose" name="purpose" defaultValue="">
              <option value="" disabled>Select Purpose</option>
              <option>Career &amp; Finance</option>
              <option>Health &amp; Wellbeing</option>
              <option>Marriage &amp; Relationships</option>
              <option>Spiritual Growth</option>
              <option>General Wellbeing</option>
            </select>
          </div>
        </div>
        <button type="submit" className="reco-form-cta">Get Free Recommendation</button>
      </div>

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

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service2.webp" alt="Vedic Astrology Consultation" loading="lazy" decoding="async" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Online Live &amp; Telephonic Horoscope Consultation by Genuine Vedic Astrologers</p>
            <a href="/consultation" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service3.webp" alt="Gem & Rudraksha Jewellery Crafting" loading="lazy" decoding="async" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Crafting Gemstones &amp; Rudrakshas into Authentic Astro-Rashi Jewellery</p>
            <a href="/configure" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service1.webp" alt="Vedic Energisation Prana Pratishtha" loading="lazy" decoding="async" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Vedic Energisation (Prana Pratishtha) According to Your Gotra &amp; Rashi — Live &amp; Recorded</p>
            <a href="/configure" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service4.webp" alt="Safe Worldwide Shipping" loading="lazy" decoding="async" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">COD in Delhi-NCR &amp; Worldwide Safe, Insured Shipping Available</p>
            <a href="/contact" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service5.webp" alt="Ancient Vedic Remedies" loading="lazy" decoding="async" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Ancient Vedic Remedies — Mantra, Yagya, Yantra, Rudraksha &amp; Ratna Dharana</p>
            <a href="/consultation" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service6.webp" alt="Online & Offline Gem Retail" loading="lazy" decoding="async" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Online &amp; Offline Retail — Vedic Gems, Rudrakshas, Yagya Research &amp; Energising Centre</p>
            <a href="/shop" className="svc-click-btn">Click Here</a>
          </div>
        </div>

      </div>

      <div className="svc-show-all-wrap">
        <button className="svc-show-all-btn" id="svcShowAllBtn" aria-expanded="false">
          Show All Services <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>

    </div>
  </section>

  
  <footer className="pvg-footer" id="footer" role="contentinfo">
    <div className="pvg-footer-main">
      <div className="container">
        <div className="pvg-footer-brand-strip">
          <div>
            <div className="pvg-footer-brand-row">
              <img
                src="/PVG NEW LOGO DESIGN.webp"
                alt="Pure Vedic Gems emblem"
                className="pvg-footer-logo-img" />
              <div style={toStyle("display:flex;flex-direction:column;align-items:flex-start;margin-left:10px;")}>
                <img
                  src="/Algerian.webp"
                  alt="Pure Vedic Gems"
                  className="pvg-footer-logo-wordmark" />
                <span style={toStyle("display:none;font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--gold-light);letter-spacing:0.05em;")}>PURE VEDIC GEMS®</span>
                <span className="pvg-footer-logo-since">Since 1937</span>
              </div>
            </div>
            <p className="pvg-footer-about">For over 87 years and four generations, we have been the most trusted source of authentic, lab-certified Jyotish gemstones and sacred Rudrakshas — serving seekers across 40+ countries.</p>
          </div>
          <div className="pvg-footer-socials" aria-label="Social media links">
            <a href="#" className="pvg-social-icon" aria-label="Facebook">
              <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" className="pvg-social-icon" aria-label="Instagram">
              <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" className="pvg-social-icon" aria-label="YouTube">
              <svg viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75,15.02 15.5,12 9.75,8.98 9.75,15.02"/></svg>
            </a>
            <a href="#" className="pvg-social-icon" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
          </div>
        </div>

        <div className="pvg-footer-directory">
          {([
            {
              title: 'Company',
              links: [
                ['Home', '/'],
                ['About Us', '/about'],
                ['Our Experts', '/about/experts'],
                ['Our Stores', '/about/stores'],
                ['Contact Us', '/contact'],
                ['Track Order', '/track-order'],
              ],
            },
            {
              title: 'Shop',
              links: [
                ['All Gemstones', '/shop'],
                ['Navaratna Gemstones', '/shop/navaratna'],
                ['Rudraksha Beads', '/shop/rudraksha'],
                ['Semi-Precious Gemstones', '/shop?category=upratna'],
                ['Director\'s Pick', '/shop?directors_pick=true'],
                ['Cart', '/cart'],
              ],
            },
            {
              title: 'Navaratna Gems',
              links: [
                ['Ruby', '/shop/ruby'],
                ['Pearl', '/shop/pearl'],
                ['Red Coral', '/shop/red-coral'],
                ['Emerald', '/shop/emerald'],
                ['Yellow Sapphire', '/shop/yellow-sapphire'],
                ['Blue Sapphire', '/shop/blue-sapphire'],
                ['Hessonite', '/shop/hessonite'],
                ['Cat\'s Eye', '/shop/cats-eye'],
                ['Diamond', '/shop/diamond'],
              ],
            },
            {
              title: 'Services',
              links: [
                ['Consultation', '/consultation'],
                ['Gem-to-Jewellery Configurator', '/configure'],
                ['Gem Recommendation Tool', '/tools/recommendation'],
                ['Carat to Ratti Converter', '/tools/carat-to-ratti'],
                ['Ring Size Guide', '/tools/ring-size-guide'],
                ['Buying Guides', '/knowledge/buying-guides'],
              ],
            },
            {
              title: 'Knowledge',
              links: [
                ['Knowledge Hub', '/knowledge'],
                ['Gemstone Guides', '/knowledge/gemstones'],
                ['Rudraksha Guides', '/knowledge/rudraksha'],
                ['Astrology', '/knowledge/astrology'],
                ['Blog', '/blog'],
                ['Account', '/account'],
              ],
            },
            {
              title: 'Policies',
              links: [
                ['Privacy Policy', '/policies/privacy'],
                ['Terms of Service', '/policies/terms'],
                ['Shipping Policy', '/policies/shipping'],
                ['Returns Policy', '/policies/returns'],
                ['My Orders', '/account/orders'],
                ['Saved Items', '/account/saved'],
              ],
            },
          ] as Array<{ title: string; links: Array<[string, string]> }>).map((group) => (
            <div className="pvg-footer-link-group" key={group.title}>
              <div className="pvg-footer-col-title">{group.title}</div>
              {group.links.map(([label, href]) => (
                <a key={`${group.title}-${href}-${label}`} href={href} className="pvg-footer-link">{label}</a>
              ))}
            </div>
          ))}
        </div>

        <div className="pvg-footer-service-strip">
          <div>
            <div className="pvg-footer-col-title">Our Locations</div>
            <div className="pvg-footer-loc-list">
              <div className="pvg-footer-loc">
                <div className="pvg-footer-loc-flag">IN</div>
                <div>
                  <span className="pvg-footer-loc-city">Delhi - Saket</span>
                  <span className="pvg-footer-loc-addr">M-24, GF, Select Citywalk Mall, Saket, New Delhi - 110017</span>
                </div>
              </div>

              <div className="pvg-footer-loc">
                <div className="pvg-footer-loc-flag">IN</div>
                <div>
                  <span className="pvg-footer-loc-city">Noida - Sector 49</span>
                  <span className="pvg-footer-loc-addr">H 65, Sector 49, Noida - 201301, Uttar Pradesh</span>
                </div>
              </div>

              <div className="pvg-footer-loc">
                <div className="pvg-footer-loc-flag">UK</div>
                <div>
                  <span className="pvg-footer-loc-city">London - Hounslow</span>
                  <span className="pvg-footer-loc-addr">219 Staines Rd, Hounslow, London TW3 3JQ, United Kingdom</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="pvg-footer-col-title">Contact &amp; Hours</div>
            <a className="pvg-footer-contact-item" href="tel:+919310172512">
              <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z"/></svg>
              +91-9310172512 (India)
            </a>
            <a className="pvg-footer-contact-item" href="tel:+919871582404">
              <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z"/></svg>
              +91-9871582404 (India)
            </a>
            <a className="pvg-footer-contact-item" href="tel:+447831491778">
              <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.9.7 2.81a2 2 0 0 1-.45 2.11L10.91 17a16 16 0 0 0 6.09 6.09l.32-.32a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 21.92z"/></svg>
              +44 7831 491778 (UK)
            </a>

            <p className="pvg-footer-hours">Open Mon, Tue, Thu - Sun: 11am - 8pm<br />Closed on Wednesdays</p>

            <a href="https://wa.me/919310172512" target="_blank" rel="noopener noreferrer" className="pvg-footer-wa">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>
    </div>

    <div className="pvg-footer-bottom">
      <div className="container pvg-footer-bottom-inner">
        <div className="pvg-footer-copy">&copy; 2026 Pure Vedic Gems Pvt. Ltd. All rights reserved. Registered Trademark.</div>
        <div className="pvg-footer-cert-badges">
          <span className="pvg-footer-cert-badge">GIA</span>
          <span className="pvg-footer-cert-badge">IGI</span>
          <span className="pvg-footer-cert-badge">GRS</span>
          <span className="pvg-footer-cert-badge">Gubelin</span>
          <span className="pvg-footer-cert-badge">GII</span>
          <span className="pvg-footer-cert-badge">IIGJ</span>
        </div>
      </div>
    </div>
  </footer>

  
  <button className="pvg-scroll-top" id="pvgScrollTop" aria-label="Back to top">
    <svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
  </button>

  <div className="ds-label" role="note" aria-label="Design prototype version">Design System v1</div>

  
  
    </>
  );
}
