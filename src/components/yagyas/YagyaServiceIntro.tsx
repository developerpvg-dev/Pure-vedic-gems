'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const HIGHLIGHTS = [
  {
    title: 'Authentic Vedic Rituals',
    text: 'Performed strictly as per the ancient scriptures with correct samagri, beej mantras and procedures.',
  },
  {
    title: 'As per your Gotra & Rashi',
    text: 'Sankalp taken in your name, gotra and rashi so the punya and benefits reach you directly.',
  },
  {
    title: 'Learned, Experienced Pandits',
    text: 'Conducted by our team of Vedic scholars at our in-house yagyashala with photos / recordings shared.',
  },
];

export function YagyaServiceIntro() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="yagya-service-intro mx-auto max-w-4xl">
      <p className="yagya-service-intro-teaser text-center text-sm leading-7 text-[#5a5043] sm:text-[15px]">
        Authentic Vedic Yagyas and Poojas performed on your behalf — aligned to your birth chart, gotra, and rashi by
        our learned pandits.
      </p>

      <div
        id="yagya-service-intro-details"
        className={`yagya-service-intro-details ${expanded ? 'is-expanded' : ''}`}
        hidden={!expanded}
      >
        <div className="mt-4 space-y-4 text-center text-sm leading-7 text-[#5a5043] sm:text-[15px]">
          <p>
            Every aspect of human life is affected by nine planets in our birth-chart / horoscope. Unfavorable positioning
            of these planets can create unexpected hurdles and difficult periods. One of the most effective Jyotish remedies
            is <strong className="font-semibold text-[#2c0404]">Yagya</strong> for planets — performed with correct samagri,
            beej mantras, and procedures as per your gotra and rashi.
          </p>
          <p>
            Shanti Yagyas help reduce malefic planetary effects and strengthen beneficial ones. Conducted by our Vedic scholars
            at our in-house yagyashala, with photos and recordings shared after the ritual. Pure Vedic Gems has offered authentic
            Astro-Jyotish gemstones, Rudrakshas, and Vedic Yagyas since 1937.
          </p>
        </div>

        <ul className="mt-5 space-y-2 text-left text-sm leading-7 text-[#5a5043] sm:text-[15px]">
          {HIGHLIGHTS.map((h) => (
            <li key={h.title} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-[#7A1515]">—</span>
              <span>
                <strong className="font-semibold text-[#2c0404]">{h.title}:</strong> {h.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="yagya-service-intro-toggle-wrap">
        <button
          type="button"
          className="yagya-service-intro-toggle"
          aria-expanded={expanded}
          aria-controls="yagya-service-intro-details"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Read less' : 'Read more'}
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
