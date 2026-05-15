/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react/no-unescaped-entities */
import type { CSSProperties, ReactNode } from 'react';
import { PvgRecommendationForm } from '@/components/home/PvgRecommendationForm';

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
              <img className="about-stack-img" src="/home/whoweare/1Heritage.webp" alt="Four generations of Pure Vedic Gems family heritage" loading="lazy" />
            </div>

            <div className="about-stack-card" data-pos="2">
              <img className="about-stack-img" src="/home/whoweare/2Sourcing.webp" alt="Direct gemstone sourcing from Sri Lanka, Burma and Zambia" loading="lazy" />
            </div>

            <div className="about-stack-card" data-pos="1">
              <img className="about-stack-img" src="/home/whoweare/3Certification.webp" alt="Pure Vedic Gems certification bodies" loading="lazy" />
            </div>

            <div className="about-stack-card" data-pos="0">
              <img className="about-stack-img" src="/home/whoweare/4Energization.webp" alt="Authentic Vedic gemstone energization ritual" loading="lazy" />
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
            <a href="#" className="btn-maroon">Our Full Story</a>
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

        
        <div className="cert-img-wrap">
          <div className="cert-img-stack" id="certStack">

            <div className="cert-stack-card" data-pos="3">
              <div className="cert-card-inner">
                <img className="cert-real-img" src="/home/certificates/1116x1676 pixle GIA (1).webp" alt="GIA gemstone certificate sample" loading="lazy" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="2">
              <div className="cert-card-inner">
                <img className="cert-real-img" src="/home/certificates/1116x1676 pixle IGI (1).webp" alt="IGI gemstone certificate sample" loading="lazy" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="1">
              <div className="cert-card-inner">
                <img className="cert-real-img" src="/home/certificates/1116x1676 pixle GII (1).webp" alt="GII gemstone certificate sample" loading="lazy" />
              </div>
            </div>

            <div className="cert-stack-card" data-pos="0">
              <div className="cert-card-inner">
                <img className="cert-real-img cert-real-img-landscape" src="/home/certificates/1170x826 pixle copy (1).webp" alt="Multiple gemstone certification reports from global labs" loading="lazy" />
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
                <img className="cfg-lin-img" src={`/home/configuratorsteps/step${index + 1}.webp`} alt={label} loading="lazy" />
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
              <img src={item.src} alt={item.alt} loading="lazy" />
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

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service2.webp" alt="Vedic Astrology Consultation" loading="lazy" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Online Live &amp; Telephonic Horoscope Consultation by Genuine Vedic Astrologers</p>
            <a href="/consultation" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service3.webp" alt="Gem & Rudraksha Jewellery Crafting" loading="lazy" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Crafting Gemstones &amp; Rudrakshas into Authentic Astro-Rashi Jewellery</p>
            <a href="/consultation" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service1.webp" alt="Vedic Energisation Prana Pratishtha" loading="lazy" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Vedic Energisation (Prana Pratishtha) According to Your Gotra &amp; Rashi — Live &amp; Recorded</p>
            <a href="/consultation" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service4.webp" alt="Safe Worldwide Shipping" loading="lazy" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">COD in Delhi-NCR &amp; Worldwide Safe, Insured Shipping Available</p>
            <a href="/consultation" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service5.webp" alt="Ancient Vedic Remedies" loading="lazy" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Ancient Vedic Remedies — Mantra, Yagya, Yantra, Rudraksha &amp; Ratna Dharana</p>
            <a href="/consultation" className="svc-click-btn">Click Here</a>
          </div>
        </div>

        
        <div className="svc-card-v2">
          <div className="svc-img-area">
            <img src="/home/ourservicesimg/service6.webp" alt="Online & Offline Gem Retail" loading="lazy" />
          </div>
          <div className="svc-body-v2">
            <p className="svc-title-v2">Online &amp; Offline Retail — Vedic Gems, Rudrakshas, Yagya Research &amp; Energising Centre</p>
            <a href="/consultation" className="svc-click-btn">Click Here</a>
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


  <button className="pvg-scroll-top" id="pvgScrollTop" aria-label="Back to top">
    <svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
  </button>

  <div className="ds-label" role="note" aria-label="Design prototype version">Design System v1</div>

  
  
    </>
  );
}
