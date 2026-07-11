'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { compactHeroIntro } from '@/lib/categories/shop-category-content/helpers';
import type { ShopCategorySectionKey } from '@/lib/types/shop-category-page';

export type CategoryHubSection = {
  id: ShopCategorySectionKey;
  title: string;
  html?: string | null;
};

export type CategoryHubFaq = {
  question: string;
  answer: string;
};

const TAB_LABELS: Record<ShopCategorySectionKey, string> = {
  about: 'About',
  'how-to-wear': 'How To Wear',
  'who-should-wear': 'Who Should Wear',
  benefits: 'Benefits',
  types: 'Types',
  'quality-price': 'Quality & Price',
  jewellery: 'Jewellery',
  'cleaning-care': 'Cleaning & Care',
  'buyer-beware': 'Buyer Beware',
  faqs: 'FAQs',
};

function splitCategoryTitle(label: string) {
  const match = label.match(/^(.+?)\s*(\([^)]+\))\s*$/);
  if (match) {
    return { primary: match[1].trim(), secondary: match[2].trim() };
  }
  return { primary: label, secondary: null };
}

function CategoryHubNav({
  availableSections,
  hasFaqs,
  activeTab,
  onSelectTab,
}: {
  availableSections: CategoryHubSection[];
  hasFaqs: boolean;
  activeTab: ShopCategorySectionKey | null;
  onSelectTab: (id: ShopCategorySectionKey) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ visible: false, thumbWidth: 100, offset: 0 });

  const updateIndicator = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const canScroll = scrollWidth > clientWidth + 4;
    if (!canScroll) {
      setIndicator({ visible: false, thumbWidth: 100, offset: 0 });
      return;
    }

    const thumbWidth = (clientWidth / scrollWidth) * 100;
    const maxScroll = scrollWidth - clientWidth;
    const offset = maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - thumbWidth) : 0;
    setIndicator({ visible: true, thumbWidth, offset });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateIndicator();
    el.addEventListener('scroll', updateIndicator, { passive: true });
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateIndicator);
      observer.disconnect();
    };
  }, [availableSections, hasFaqs, updateIndicator]);

  return (
    <nav className="category-hub-nav" aria-label="Category information sections">
      <div className="category-hub-nav__scroll-wrap">
        <div ref={scrollRef} className="category-hub-nav__inner">
          {availableSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectTab(section.id)}
              aria-expanded={activeTab === section.id}
              aria-controls={`panel-${section.id}`}
              className={`category-hub-nav__link ${activeTab === section.id ? 'category-hub-nav__link--active' : ''}`}
            >
              {section.title || TAB_LABELS[section.id]}
            </button>
          ))}
          {hasFaqs ? (
            <button
              type="button"
              onClick={() => onSelectTab('faqs')}
              aria-expanded={activeTab === 'faqs'}
              aria-controls="panel-faqs"
              className={`category-hub-nav__link ${activeTab === 'faqs' ? 'category-hub-nav__link--active' : ''}`}
            >
              {TAB_LABELS.faqs}
            </button>
          ) : null}
        </div>
        {indicator.visible ? <div className="category-hub-nav__fade" aria-hidden /> : null}
      </div>
      {indicator.visible ? (
        <div className="category-hub-nav__indicator" aria-hidden>
          <span
            className="category-hub-nav__indicator-thumb"
            style={{
              width: `${indicator.thumbWidth}%`,
              marginLeft: `${indicator.offset}%`,
            }}
          />
        </div>
      ) : null}
    </nav>
  );
}

export function CategoryHubHeader({
  label,
  intro,
  imageUrl,
  benefits,
  sections,
  faqs,
}: {
  label: string;
  intro: string;
  imageUrl?: string | null;
  benefits: Array<{ text: string }>;
  sections: CategoryHubSection[];
  faqs: CategoryHubFaq[];
}) {
  const { primary, secondary } = splitCategoryTitle(label);
  const availableSections = sections.filter((section) => section.html);
  const hasFaqs = faqs.length > 0;
  const heroIntro = compactHeroIntro(intro);
  const heroBenefits = benefits.filter((b) => b.text?.trim());
  const [activeTab, setActiveTab] = useState<ShopCategorySectionKey | null>(null);

  const selectTab = (id: ShopCategorySectionKey) => {
    setActiveTab((current) => (current === id ? null : id));
  };

  return (
    <div className="category-hub-block category-hub-block--bleed mb-8">
      <header className="category-hub-header">
        <div className="category-hub-hero">
          <div className="category-hub-hero__content">
            <h1 className="category-hub-hero__title">
              <span className="category-hub-hero__title-primary">{primary}</span>
              {secondary ? <span className="category-hub-hero__title-secondary">{secondary}</span> : null}
            </h1>

            <span className="category-hub-hero__rule" aria-hidden />

            <p className="category-hub-hero__intro">{heroIntro}</p>

            {heroBenefits.length > 0 ? (
              <div className="category-hub-hero__benefits-wrap">
                <ul className="category-hub-hero__benefits">
                  {heroBenefits.map((benefit) => (
                    <li key={benefit.text} className="category-hub-hero__benefit">
                      <span className="category-hub-hero__benefit-icon" aria-hidden>
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span>{benefit.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="category-hub-hero__benefits-fade" aria-hidden />
              </div>
            ) : null}
          </div>

          <div className="category-hub-hero__image-wrap">
            <div className="category-hub-hero__image-shell">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={label} className="category-hub-hero__image" />
              ) : (
                <div className="category-hub-hero__image-placeholder" aria-hidden>
                  <span>💎</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <CategoryHubNav
          availableSections={availableSections}
          hasFaqs={hasFaqs}
          activeTab={activeTab}
          onSelectTab={selectTab}
        />

        <div className="category-hub-panels">
          {availableSections.map((section) => (
            <div
              key={section.id}
              id={`panel-${section.id}`}
              role="region"
              aria-label={section.title || TAB_LABELS[section.id]}
              hidden={activeTab !== section.id}
              className="category-hub-panel"
            >
              <h2 className="category-hub-panel__title">{section.title || TAB_LABELS[section.id]}</h2>
              <div
                className="category-hub-panel__body prose prose-sm max-w-none md:prose-base"
                dangerouslySetInnerHTML={{ __html: section.html ?? '' }}
              />
            </div>
          ))}

          {hasFaqs ? (
            <div id="panel-faqs" role="region" aria-label="FAQs" hidden={activeTab !== 'faqs'} className="category-hub-panel">
              <h2 className="category-hub-panel__title">{TAB_LABELS.faqs}</h2>
              <div className="category-hub-faq-list">
                {faqs.map((faq) => (
                  <details key={faq.question} className="category-hub-faq-item">
                    <summary className="category-hub-faq-question">{faq.question}</summary>
                    <p className="category-hub-faq-answer">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </header>
    </div>
  );
}
