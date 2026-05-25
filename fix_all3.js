const fs = require('fs');
console.log("Working from " + process.cwd());

// 1. Fix TestimonialCard.tsx
const cardCode = `'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, X } from 'lucide-react';
import { TestimonialProofButton } from './TestimonialProofButton';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#c99022]" aria-label={\`\${rating} out of 5 stars\`}>
      {Array.from({ length: 5 }, (_unused, index) => (
        <Star key={index} className="h-4 w-4 sm:h-5 sm:w-5" fill={index < rating ? 'currentColor' : 'none'} color="#c99022" />
      ))}
    </div>
  );
}

function getInitials(name: string) {
    if (!name) return 'PG';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

type TestimonialCardProps = {
  testimonial: {
    id: string;
    name: string;
    location: string | null;
    rating?: number;
    message: string;
    proof_image_url?: string | null;
    proof_alt?: string | null;
  };
  indexString?: string;
};

export function TestimonialCard({ testimonial, indexString }: TestimonialCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const charLimit = 220;
  const isTruncated = testimonial.message.length > charLimit;
  const displayMessage = isTruncated 
      ? testimonial.message.substring(0, charLimit).trim() + '...' 
      : testimonial.message;

  const CardContent = ({ isExpanded = false }: { isExpanded?: boolean }) => (
    <div className="relative w-full aspect-[1.5] max-w-[800px] mx-auto flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 drop-shadow-md">
        <Image 
            src="/testimonial/cardbg.png" 
            alt="Testimonial background" 
            fill 
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain"
            priority={!isExpanded}
            unoptimized={true}
        />
      </div>

      {/* Content Area - finely tuned to sit within the bounds of the paper in the image */}
      <div className="relative z-10 flex flex-col h-[76%] w-[82%] mt-[4%] ml-[-3%] sm:ml-[-1%]">
        
        {/* Header: Stars */}
        <div className="flex items-center justify-end w-full mb-2 sm:mb-4 px-2 sm:px-4 shrink-0 mt-2 sm:mt-0 h-4 sm:h-6">
            <div className="mt-1 sm:mt-1.5">
                <Stars rating={testimonial.rating || 5} />
            </div>
        </div>

        {/* Body: Quote and Message */}
        <div className="flex gap-2 sm:gap-4 flex-1 overflow-hidden px-2 sm:px-4">
            <div className="text-[40px] sm:text-[60px] font-serif leading-none h-[30px] sm:h-[40px] mt-0 sm:mt-1 text-[#a56d29] opacity-90 select-none">
                “
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <p className={\`whitespace-pre-wrap text-[#2c2c2c] font-medium z-10 relative \${isExpanded ? 'text-[14px] sm:text-[16px] leading-[1.8]' : 'text-[12px] sm:text-[14px] leading-[1.6]'}\`}>
                    {isExpanded ? testimonial.message : displayMessage}
                    {!isExpanded && isTruncated && (
                       <button 
                         onClick={() => setIsModalOpen(true)}
                         className="ml-2 text-[#a56d29] font-bold hover:underline"
                       >
                         Read more
                       </button>
                    )}
                </p>
            </div>
        </div>

        {/* Footer: User Details */}
        <div className="mt-2 sm:mt-4 flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 relative z-10 before:absolute before:top-0 before:left-0 before:w-full before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#dfd3c3] before:to-transparent shrink-0 px-2 sm:px-4 mb-2 sm:mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full bg-[#eee5d5] shadow-sm flex justify-center items-center font-bold text-[#8a5b28] text-sm sm:text-lg select-none">
                {getInitials(testimonial.name)}
            </div>
            <div className="flex flex-col flex-1 min-w-0 justify-center">
            <h2 className="text-[14px] sm:text-[16px] font-medium text-[#111] leading-snug truncate">{testimonial.name}</h2>
            {testimonial.location && (
                <p className="text-[12px] sm:text-[14px] text-[#4a4a4a] mt-0.5 truncate">{testimonial.location}</p>
            )}
            </div>
            {testimonial.proof_image_url && (
            <div className={\`ml-auto \${isExpanded ? '' : 'scale-[0.85] sm:scale-100 origin-right'}\`}>
                <TestimonialProofButton proofUrl={testimonial.proof_image_url} proofAlt={testimonial.proof_alt || null} customerName={testimonial.name} />
            </div>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative w-full max-w-lg mx-auto">
        <CardContent />
      </div>

      {/* Expanded Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
             onClick={() => setIsModalOpen(false)}>
            <div className="relative w-full max-w-4xl max-h-[95vh] flex items-center justify-center overflow-hidden"
                 onClick={e => e.stopPropagation()}>
                
                {/* Close Button positioned outside the artwork */}
                <button 
                   onClick={() => setIsModalOpen(false)}
                   className="absolute top-2 right-2 sm:top-10 sm:right-10 z-[120] bg-white p-2 rounded-full shadow-lg text-[#8a5b28] hover:bg-[#f0e8dc] transition"
                >
                   <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="w-full relative animate-in fade-in zoom-in duration-300">
                    <CardContent isExpanded={true} />
                </div>
            </div>
        </div>
      )}
    </>
  );
}`;

fs.writeFileSync('src/components/testimonials/TestimonialCard.tsx', cardCode);
console.log('Restored TestimonialCard.tsx');

// 2. Fix home.css
let homeCss = fs.readFileSync('src/app/home.css', 'utf8');
if (!homeCss.includes('#testimonials {')) {
  homeCss += `

/* ============================================================
   TESTIMONIALS SECTION (Homepage) - Layout Overrides
   ============================================================ */

#testimonials {
  padding-top: 80px;
  padding-bottom: 80px;
}

#testimonials .pvg-testi-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  position: relative;
  z-index: 10;
}

@media (min-width: 640px) {
  #testimonials .pvg-testi-inner {
    padding: 0 32px;
  }
}

@media (min-width: 1024px) {
  #testimonials .pvg-testi-inner {
    padding: 0 48px;
  }
}

#testimonials .pvg-testi-header {
  max-width: 56rem;
  margin: 0 auto 64px;
  text-align: center;
}

#testimonials .pvg-testi-eyebrow {
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #a68252;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

#testimonials .pvg-testi-eyebrow-line {
  height: 1px;
  width: 48px;
  background: rgba(166, 130, 82, 0.3);
  display: block;
  flex-shrink: 0;
}

#testimonials .pvg-testi-heading {
  margin-top: 12px;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.1;
  font-weight: 500;
  color: #222;
  letter-spacing: -0.02em;
}

#testimonials .pvg-testi-heading-accent {
  color: #a68252;
  font-style: italic;
}

#testimonials .pvg-testi-subtitle {
  margin: 24px auto 0;
  max-width: 42rem;
  font-size: 15px;
  font-weight: 500;
  color: #5a5043;
  text-align: center;
}

#testimonials .pvg-testi-grid {
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 40px;
  row-gap: 64px;
  padding-bottom: 48px;
}

@media (min-width: 768px) {
  #testimonials .pvg-testi-grid {
    grid-template-columns: 1fr 1fr;
  }
}

#testimonials .pvg-testi-cta-wrap {
  max-width: 64rem;
  margin: 24px auto 0;
}

#testimonials .pvg-testi-cta-box {
  background: #f2efe9;
  border-radius: 16px;
  padding: 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  overflow: hidden;
  position: relative;
  border: 1px solid #e8dfd1;
}

@media (min-width: 640px) {
  #testimonials .pvg-testi-cta-box {
    flex-direction: row;
    padding: 24px 40px;
  }
}

#testimonials .pvg-testi-cta-left {
  display: flex;
  align-items: center;
  gap: 24px;
  z-index: 10;
}

#testimonials .pvg-testi-cta-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

#testimonials .pvg-testi-cta-icon-inner {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 2px solid #a68252;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(45deg);
}

#testimonials .pvg-testi-cta-icon-dot {
  width: 12px;
  height: 12px;
  background: #a68252;
  transform: rotate(-45deg);
}

#testimonials .pvg-testi-cta-text {
  color: #3d3326;
  font-weight: 500;
  font-size: 15px;
  max-width: 360px;
  line-height: 1.6;
}

#testimonials .pvg-testi-cta-btn {
  z-index: 10;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #8a602c;
  padding: 14px 32px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  transition: background 0.2s;
  border-radius: 2px;
  white-space: nowrap;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

#testimonials .pvg-testi-cta-btn:hover {
  background: #6c481d;
}

#testimonials .pvg-testi-cta-btn svg {
  flex-shrink: 0;
}
`;
  fs.writeFileSync('src/app/home.css', homeCss);
  console.log('Restored CSS overrides in home.css');
}

// 3. Fix PvgReferenceSections.tsx
let pvgCode = fs.readFileSync('src/components/home/PvgReferenceSections.tsx', 'utf8');

const oldTestimonialsSectionStart = pvgCode.indexOf('<section className="testimonials-section" id="testimonials"');
if (oldTestimonialsSectionStart !== -1) {
  const oldTestimonialsSectionEnd = pvgCode.indexOf('</section>', oldTestimonialsSectionStart) + '</section>'.length;
  
  const newSection = `<section className="bg-[#faf8f4] relative overflow-hidden" id="testimonials" aria-labelledby="testi-heading">
    <div className="absolute top-0 left-[-20px] text-[420px] font-black leading-none text-[#7a1515] opacity-5 pointer-events-none select-none" aria-hidden="true">&ldquo;</div>

    <div className="pvg-testi-inner">

      <div className="pvg-testi-header">
        <p className="pvg-testi-eyebrow">
          <span className="pvg-testi-eyebrow-line" />
          CLIENT TESTIMONIALS
          <span className="pvg-testi-eyebrow-line" />
        </p>
        <h2 className="pvg-testi-heading" id="testi-heading">
          What Our <span className="pvg-testi-heading-accent">Clients Say</span>
        </h2>
        <p className="pvg-testi-subtitle">
          Real experiences from clients across 40+ countries who chose Jyotish-certified gems.
        </p>
      </div>

      <div className="pvg-testi-grid">
        {featuredTestimonials.slice(0, 2).map((testimonial, i) => (
          <TestimonialCard
            key={testimonial.id}
            testimonial={testimonial as any}
            indexString={String(i + 1).padStart(2, '0')}
          />
        ))}
      </div>

      <div className="pvg-testi-cta-wrap">
        <div className="pvg-testi-cta-box">
          <div className="pvg-testi-cta-left">
            <div className="pvg-testi-cta-icon">
              <div className="pvg-testi-cta-icon-inner">
                <div className="pvg-testi-cta-icon-dot" />
              </div>
            </div>
            <p className="pvg-testi-cta-text">
              Read more stories from our 50,000+ happy customers worldwide who trust us for authentic gemstones.
            </p>
          </div>
          <a href="/testimonials" className="pvg-testi-cta-btn">
            VIEW ALL TESTIMONIALS
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </a>
        </div>
      </div>

    </div>
  </section>`;

  pvgCode = pvgCode.substring(0, oldTestimonialsSectionStart) + newSection + pvgCode.substring(oldTestimonialsSectionEnd);
  fs.writeFileSync('src/components/home/PvgReferenceSections.tsx', pvgCode);
  console.log('Restored PvgReferenceSections.tsx');
} else {
  console.log('testimonials-section not found in PvgReferenceSections.tsx, either already fixed or completely missing');
}