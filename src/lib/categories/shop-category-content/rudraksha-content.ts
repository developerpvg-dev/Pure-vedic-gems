import type { CategoryFaq } from '@/lib/types/shop-category-page';
import {
  RUDRAKSHA_FAQS,
  RUDRAKSHA_QUALITY_TIERS,
  RUDRAKSHA_TYPE_TABLE,
} from '@/lib/constants/rudraksha-rich-content';
import { rudrakshaHubMeta } from '@/lib/seo/storefront-meta';
import { BRAND, h3, p, table, ul, type RichGemSections } from './helpers';
import { canonicalSubcategoryHref } from '@/lib/categories/canonical-storefront-path';

function shopLink(slug: string, label: string) {
  return `<a href="${canonicalSubcategoryHref(slug) ?? `/shop/${slug}`}">${label}</a>`;
}

function mukhiTypeTable() {
  const body = RUDRAKSHA_TYPE_TABLE.map((row) => {
    const shopSlug = row.slug ?? 'gauri-shankar';
    const name = row.slug
      ? `<a href="/knowledge/rudraksha/${row.slug}">${row.mukhi}</a>`
      : row.mukhi;
    return `<tr><td>${name}</td><td>${row.deity}</td><td>${row.planet}</td><td>${row.mantra}</td><td>${shopLink(shopSlug, 'Buy')}</td></tr>`;
  }).join('');
  return `<table><thead><tr><th>Rudraksha</th><th>Ruling God</th><th>Planet</th><th>Mantra</th><th>Shop</th></tr></thead><tbody>${body}</tbody></table>`;
}

const HUB_FAQS: CategoryFaq[] = [
  {
    question: 'Where can I buy original 5 Mukhi Rudraksha online in India?',
    answer:
      '5 Mukhi (Kalaagni Rudra, Jupiter) is the most widely worn bead in our tradition and is suitable for men, women, and children after energization. Buy certified 5 Mukhi Rudraksha from the 5 Mukhi collection on this site, or stay on this parent page if you still need a chart-guided mukhi.',
  },
  {
    question: 'Is X-ray certification required for Rudraksha?',
    answer:
      'For common low-value beads it is not always necessary. For rare or premium Rudraksha, our qualities guide and mukhi notes strongly recommend genuine-lab X-ray so mukhi lines and inner compartments are verified — energy depends on the seeds inside, not only the outer face.',
  },
  {
    question: 'Do you sell 108 bead Rudraksha malas?',
    answer:
      'Yes. 108-bead malas are listed under Malas and Exclusive Rudraksha Malas, not as a substitute for a chart-specific single mukhi. Choose a mala after you know whether you need japa beads or a prescribed mukhi.',
  },
  ...RUDRAKSHA_FAQS,
];

/** Parent /shop/rudraksha hub — facts from /knowledge/rudraksha-qualities, the mukhi library, and our published FAQs. */
const RUDRAKSHA_HUB_SEO = rudrakshaHubMeta();

export const RUDRAKSHA_HUB_CONTENT: RichGemSections = {
  intro:
    'Buy original Nepal Rudraksha online — natural 1–21 Mukhi beads, X-ray certified where the piece warrants it, purified and energized at PureVedicGems since 1937.',
  hero_benefits: [
    { text: 'X-ray certified Nepal beads' },
    { text: '1–21 Mukhi collection' },
    { text: 'Purified & energized' },
    { text: 'Chart-guided mukhi pick' },
  ],
  seo_title: RUDRAKSHA_HUB_SEO.seo_title,
  seo_description: RUDRAKSHA_HUB_SEO.seo_description,
  meta_keywords: [
    'buy original rudraksha online',
    'buy rudraksha online',
    'certified rudraksha',
    'nepal rudraksha',
    'x-ray certified rudraksha',
    'energized rudraksha',
    '5 mukhi rudraksha',
    'natural rudraksha',
    'original rudraksha delhi',
    'mukhi rudraksha',
    'genuine rudraksha',
    'purified rudraksha',
  ],
  about_html: [
    p(
      `Rudraksha is the seed of <em>Elaeocarpus ganitrus</em> — in our <a href="/knowledge/rudraksha">Rudraksha library</a> and qualities guide, the beads are the tears of Lord Shiva. They are worn as jewellery and as a Vedic astrological remedy. Each mukhi is linked to a planet, a ruling deity, and a beej mantra.`,
      `Trees grow from the Gangetic Himalayan foothills through Nepal and Southeast Asia (Indonesia, Malaysia, and India). Nepal-origin beads are the quality we treat as best for healing use. Ripe seeds have a blue outer husk, which is why they are also called blueberry beads.`,
    ),
    h3('What “natural” means on this site'),
    p(
      'Natural Rudraksha is neither treated nor chemically enhanced. Fake, tampered, or extra-mukhi-carved beads are cheaper and, in the Vedas and Puranas as cited on our <a href="/knowledge/rudraksha-qualities">Rudraksha Qualities</a> page, are a failure that can bring harmful effects — do not wear them.',
      `${BRAND} sources genuine, lab-certified beads and offers purification and energization with Vedic mantras (Abhimantrit, including gotra and rashi when you request it). We have sold Vedic gems and Rudraksha since 1937 in Delhi.`,
    ),
    h3('How a bead works in our tradition'),
    ul([
      'It creates a cocoon of your own energy and acts as a shield against negative energies.',
      'It is discussed as acting on the nervous system and calming the mind — traditional, not a medical prescription.',
      'Energy depends on the seeds and compartments inside the bead, which is why X-ray matters on premium pieces.',
      'Pray to Lord Shiva and chant the mukhi mantra from our qualities table for best results.',
    ]),
  ].join('\n'),
  how_to_wear_html: [
    p(
      'Our published FAQs are the wearing rule for this collection: choose the mukhi from a birth-chart reading, confirm a natural bead with an astro-gemologist, then purify and energize with a Vedic priest. There is no one finger-and-weekday table that covers every mukhi the way a Ruby ring has Sunday rules.',
    ),
    table([
      ['Mukhi', 'Astrologer names the bead. 5 Mukhi is the usual general-wear starting point; higher and rare mukhis need guidance.'],
      ['Quality', 'Natural lines, origin, shape, size, weight. Premium beads: genuine-lab X-ray. Magnetic energy and temperature tests are also listed on our qualities page.'],
      ['Purification', `${BRAND} offers jal abhishek / Rudra abhishek and mantra energization. You may also chant Om Namah Shivaya at home before first wear.`],
      ['Mantra', 'Use the beej mantra for that mukhi from the types table below — the same table as our <a href="/knowledge/rudraksha-qualities">Rudraksha Qualities</a> page.'],
      ['Format', `Thread, capped pendant, bracelet, or mala so the bead can touch the body. ${shopLink('rudraksha-jewelry', 'Rudraksha jewellery')} and ${shopLink('malas', 'malas')}.`],
      ['1 Mukhi note', `Our <a href="/knowledge/rudraksha/1-mukhi">1 Mukhi guide</a> specifies Monday at sunrise, facing east, after Gangajal — follow that page when you buy ${shopLink('1-mukhi', '1 Mukhi')}, not as a rule for every bead.`],
    ]),
    h3('Do not'),
    ul([
      'Wear broken, insect-damaged, or incomplete beads — Vedic astrology treats them as ineffective remedies.',
      'Share a worn bead. Beads absorb the wearer’s energy; used Rudraksha is prohibited in our FAQs.',
      'Expect a fixed number of days for “results.” Timing depends on the chart.',
    ]),
  ].join('\n'),
  who_should_wear_html: [
    p(
      'Anyone can wear Rudraksha as jewellery. For healing or planetary remedy, analyse the Kundli first so the mukhi matches the graha — that is the same advice as <a href="/gems-recommendations">Which Gemstone Should I Wear?</a> and <a href="/consultation">consultation</a>.',
    ),
    h3('5 Mukhi versus rare beads'),
    ul([
      `${shopLink('5-mukhi', '5 Mukhi')} (Kalaagni Rudra / Jupiter) is the most universally recommended bead in our shop notes — men, women, and children after basic energization.`,
      'Higher mukhis (especially 14+) and round 1 Mukhi are not casual first beads. Verify origin and X-ray.',
      'Combinations of mukhis are common, but they should be chosen by purpose, comfort, and an expert — not copied from a generic “wear all 21” list.',
    ]),
    h3('When to pause'),
    p(
      'Skip a listing that is unusually cheap, cracked, exactly round in a way our qualities page calls defective, or sold without mukhi verification. Allergy to the metal cap or thread is the harm our FAQs actually name — not the natural seed itself.',
    ),
  ].join('\n'),
  benefits_html: [
    p(
      'Benefits in our library are traditional Jyotish and Shiva-sadhana associations. They are not a substitute for medical care. Our FAQs list blood pressure, anxiety, sleep, and skin among folk uses — always under expert guidance.',
    ),
    h3('Spiritual and protective'),
    p(
      'Rudraksha is a support on a sattvic path: a shield against negative energies, a cocoon of your own field, and a reminder to chant. Each mukhi’s deity and planet are in the types table. Use the <a href="/knowledge/rudraksha">mukhi guides</a> for the bead you were prescribed — do not stack every benefit list on one necklace.',
    ),
    h3('When gemstones are not suitable'),
    p(
      `Our remedies notes recommend Rudraksha when gemstones are not suitable, or as a complementary remedy for balance and protection. ${BRAND} would rather sell the correct mukhi than a large rare bead that does not match the chart.`,
    ),
  ].join('\n'),
  types_html: [
    p(
      'Beads in the market run from 1 to 21 Mukhi, plus special formations. Ruling god, planet, and mantra below are copied from our Rudraksha Qualities page — not a new table.',
    ),
    mukhiTypeTable(),
    h3('Special formations we stock'),
    p(
      `${shopLink('gauri-shankar', 'Gauri Shankar')} (Shiva & Parvati), ${shopLink('ganesh-rudraksha', 'Ganesh Rudraksha')}, ${shopLink('garbh-gauri', 'Garbh Gauri')}, ${shopLink('sawar-rudraksha', 'Sawar')}, and ${shopLink('nir-mukhi', 'Nir Mukhi')}. These are natural structures, not carved lookalikes. 15 and 18 Mukhi are in the 1–21 shop grid even when they are not on the mantra table above.`,
    ),
    h3('Malas'),
    p(
      `A 108-bead mala is a japa tool. Shop ${shopLink('malas', 'Malas')} and ${shopLink('exclusive-rudraksha-malas', 'Exclusive Rudraksha Malas')} — that is the canonical listing for “rudraksha mala 108,” not this parent collection.`,
    ),
  ].join('\n'),
  quality_price_html: [
    p(
      'Price follows origin, mukhi count, colour, shape, size, and quality. Our FAQs state the honest range: from a few rupees to lakhs. Live cards below are the quote — we do not publish a fake MRP.',
    ),
    h3('Quality grades on our qualities page'),
    ul(RUDRAKSHA_QUALITY_TIERS.map((tier) => `<strong>${tier.name}:</strong> ${tier.description}`)),
    h3('What to verify before you pay'),
    ul([
      'Natural mukhi lines from top to bottom — not cut, glued, or extra lines created.',
      'Nepal vs Indonesia/Java vs India origin disclosed.',
      'Inner compartments intact (X-ray on premium beads). Insect damage and broken beads fail.',
      'Certification from a lab with equipment to test treatments and manipulations — our qualities page is explicit: there is no “government certified Rudraksha shop” in Delhi, only sellers whose beads are certified by genuine labs.',
    ]),
  ].join('\n'),
  jewellery_html: [
    p(
      `${BRAND} caps beads in gold, silver, or thread so they can be worn as pendants, bracelets, and malas. Open, astrological-approved pendant designs are at ${shopLink('rudraksha-jewelry', 'Rudraksha jewellery')}; ready stock is also listed. A single-bead pendant on the chest is the usual Jyotish format.`,
    ),
    h3('See beads in Delhi'),
    p(
      `Inspect origin and mukhi in daylight at our <a href="/about/stores">Saket, New Delhi showroom</a>, or buy online with insured shipping. Custom capping is done after the bead is approved.`,
    ),
  ].join('\n'),
  cleaning_care_html: [
    p(
      'Keep Rudraksha dry. Avoid chemical soaps, perfume, and chlorinated water. Wipe with a soft cloth. Store separately in a cloth pouch. Our mukhi care notes also allow a drop of sandalwood or mustard oil occasionally so the seed does not crack — never ultrasonic or steam.',
    ),
    h3('Daily wear'),
    ul([
      'Many devotees wear Rudraksha daily. Follow the care card sent with the bead.',
      'Restring frayed silk or cotton thread; do not force a cracked bead back into wear.',
      'Remove for funeral visits or as your guru advises; family traditions differ on menstruation — we do not invent a single rule.',
    ]),
  ].join('\n'),
  buyer_beware_html: [
    p(
      'Most cheap “original Rudraksha” online is treated, fake, tampered, or given extra mukhis. Those beads are a failure in the texts we cite. Read <a href="/knowledge/rudraksha-qualities">Rudraksha Qualities</a> before you pay.',
    ),
    ul([
      'Carved or glued extra mukhi lines; plastic or wooden replicas.',
      'Beads with improper seeds / empty compartments (X-ray catches this).',
      'Insect-eaten, broken, or “perfectly round” beads our qualities page calls defective.',
      'A shop claiming to be the government-certified Rudraksha store in Delhi — our FAQ says that shop does not exist.',
      'Used beads resold as new. Do not share a worn Rudraksha.',
      'Round 1 Mukhi at a tourist price without lab and X-ray.',
    ]),
  ].join('\n'),
  faqs: HUB_FAQS,
};
