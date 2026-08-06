/**
 * ponytail: catches empty FAQ merge or path typos before SEO ship.
 * Run: npx tsx src/lib/constants/gems-recommendations-content.selfcheck.ts
 */
import {
  GEMS_REC_FAQS,
  GEMS_REC_KEYWORDS,
  GEMS_REC_META,
  GEMS_REC_PAGE_FAQS,
  GEMS_REC_PATH,
  gemsRecInternalJsonLd,
} from './gems-recommendations-content';

if (GEMS_REC_PATH !== '/gems-recommendations') throw new Error('canonical path');

const title = GEMS_REC_META.title.toLowerCase();
const desc = GEMS_REC_META.description.toLowerCase();
for (const kw of ['which gemstone', 'birth chart', 'rudraksha', 'usa'] as const) {
  if (!title.includes(kw) && !desc.includes(kw)) {
    throw new Error(`meta missing keyword: ${kw}`);
  }
}

if (GEMS_REC_KEYWORDS.length < 12) throw new Error('too few meta keywords');
if (GEMS_REC_PAGE_FAQS.length < 6 || GEMS_REC_PAGE_FAQS.length > 10) {
  throw new Error('page FAQs should stay compact (6–10)');
}
if (GEMS_REC_FAQS.length < 25) throw new Error('internal FAQ corpus too small');

const qs = new Set<string>();
for (const faq of GEMS_REC_PAGE_FAQS) {
  if (!faq.question.trim() || faq.answer.trim().length < 40) {
    throw new Error(`thin page FAQ: ${faq.question}`);
  }
  if (qs.has(faq.question)) throw new Error(`duplicate page FAQ: ${faq.question}`);
  qs.add(faq.question);
}

const ld = gemsRecInternalJsonLd((p = '/') => `https://purevedicgems.com${p}`);
if (ld.length < 3) throw new Error('internal JSON-LD missing');
const webpage = ld.find((x) => x['@type'] === 'WebPage') as { abstract?: string } | undefined;
if (!webpage?.abstract || webpage.abstract.length < 400) {
  throw new Error('WebPage abstract too thin for internal SEO');
}

console.log('gems-recommendations-content.selfcheck: ok', {
  pageFaqs: GEMS_REC_PAGE_FAQS.length,
  internalFaqs: GEMS_REC_FAQS.length,
  keywords: GEMS_REC_KEYWORDS.length,
  jsonLd: ld.length,
});
