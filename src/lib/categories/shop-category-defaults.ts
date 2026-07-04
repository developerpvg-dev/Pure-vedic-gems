import { KNOWN_CATALOG_SUBCATEGORIES, KNOWN_GEM_SUBCATEGORIES } from '@/lib/categories/shop';
import { getRichCategoryContent } from '@/lib/categories/shop-category-content';
import { compactHeroBenefits, compactHeroIntro } from '@/lib/categories/shop-category-content/helpers';
import type { CategoryFaq, HeroBenefit, ShopCategoryPageContent } from '@/lib/types/shop-category-page';

const BRAND = 'PureVedicGems';

function defaultBenefits(name: string, planet?: string | null): HeroBenefit[] {
  if (planet) {
    return [
      { text: 'Career & Leadership' },
      { text: 'Health & Vitality' },
      { text: 'Emotional Balance' },
      { text: 'Prosperity & Growth' },
    ];
  }
  return [
    { text: 'Certified Quality' },
    { text: 'Expert Guidance' },
    { text: 'Insured Shipping' },
    { text: 'Authenticity Guaranteed' },
  ];
}

function defaultFaqs(name: string, slug: string): CategoryFaq[] {
  return [
    {
      question: `How do I choose the right ${name}?`,
      answer: `Start with your birth chart and the guidance of a qualified Jyotish astrologer. At ${BRAND}, our experts help you match carat weight, origin disclosure, treatment status, and metal setting to your specific needs before you buy ${name} online.`,
    },
    {
      question: `Are ${name} products at ${BRAND} certified?`,
      answer: `Yes. Every ${name} listing includes transparent certification details where applicable. We disclose origin, treatment, and lab reports so you can buy with confidence from a heritage brand trusted since 1937.`,
    },
    {
      question: `Can I get ${name} set in a ring or pendant?`,
      answer: `Absolutely. Use our configurator to design custom Vedic jewellery with your chosen ${name}, metal, and energization options. Our team also offers consultation for the correct finger, day, and mantra before wearing.`,
    },
    {
      question: `Do you ship ${name} internationally?`,
      answer: `${BRAND} ships certified ${name} across India and to major international destinations including the UK, USA, Canada, Australia, and UAE with secure packaging and insured delivery.`,
    },
    {
      question: `What is the return policy for ${name}?`,
      answer: `Please review our returns policy for gemstone and spiritual product eligibility. Because astrological gemstones are personalized purchases, we encourage a consultation before ordering to ensure the right ${name} for your chart.`,
    },
  ];
}

function wrapParagraphs(...paragraphs: string[]) {
  return paragraphs.map((p) => `<p>${p}</p>`).join('\n');
}

function mergeRichContent(
  base: ShopCategoryPageContent,
  rich: ReturnType<typeof getRichCategoryContent>,
): ShopCategoryPageContent {
  if (!rich) return base;
  return {
    ...base,
    intro_text: rich.intro ? compactHeroIntro(rich.intro) : base.intro_text,
    hero_benefits: rich.hero_benefits?.length
      ? compactHeroBenefits(rich.hero_benefits)
      : base.hero_benefits,
    seo_description: rich.seo_description ?? base.seo_description,
    meta_keywords: rich.meta_keywords ?? base.meta_keywords,
    about_html: rich.about_html ?? base.about_html,
    how_to_wear_html: rich.how_to_wear_html ?? base.how_to_wear_html,
    who_should_wear_html: rich.who_should_wear_html ?? base.who_should_wear_html,
    benefits_html: rich.benefits_html ?? base.benefits_html,
    types_html: rich.types_html ?? base.types_html,
    quality_price_html: rich.quality_price_html ?? base.quality_price_html,
    jewellery_html: rich.jewellery_html ?? base.jewellery_html,
    cleaning_care_html: rich.cleaning_care_html ?? base.cleaning_care_html,
    buyer_beware_html: rich.buyer_beware_html ?? base.buyer_beware_html,
    faqs: rich.faqs ?? base.faqs,
  };
}

function buildGemDefaults(
  slug: string,
  label: string,
  category: string,
  desc: string,
  planet?: string,
): ShopCategoryPageContent {
  const shortName = label.split('(')[0].trim();
  const seoTitle = `Buy Natural ${label} Online — Certified ${shortName} | ${BRAND}`;
  const keywords = [
    shortName.toLowerCase(),
    slug,
    label.toLowerCase(),
    'vedic gemstone',
    'buy online',
    'certified',
    planet?.toLowerCase() ?? '',
    'jyotish',
    'astrological gemstone',
    'natural',
    BRAND.toLowerCase(),
  ].filter(Boolean);

  const base: ShopCategoryPageContent = {
    slug,
    name: shortName,
    sanskrit_name: label.match(/\(([^)]+)\)/)?.[1] ?? null,
    product_category: category,
    planet: planet ?? null,
    seo_title: seoTitle,
    seo_description: `${desc} Shop certified natural ${label} with lab reports, expert consultation, and worldwide delivery from ${BRAND}.`,
    meta_keywords: keywords,
    intro_text: desc,
    hero_benefits: defaultBenefits(shortName, planet),
    about_html: wrapParagraphs(
      `${label} is one of the most sought-after Vedic gemstones for astrological and jewellery use. At ${BRAND}, we curate natural, certified ${shortName} with full transparency on origin, treatment, and suitability for Jyotish remedies.`,
      `Whether you are exploring ${shortName} for planetary balance, spiritual growth, or fine jewellery, our team combines four generations of gemstone expertise with modern gemological certification.`,
    ),
    how_to_wear_html: wrapParagraphs(
      `Wear ${shortName} only after confirming suitability with a qualified astrologer. The correct metal (often gold or Panchdhatu), finger, day of the week, and energization ritual are essential for Vedic efficacy.`,
      `Before first wear, cleanse the stone with raw milk or Ganga jal, chant the appropriate Beej mantra, and set an intention aligned with the ruling graha${planet ? ` (${planet})` : ''}. ${BRAND} offers energization and pooja services at checkout.`,
    ),
    who_should_wear_html: wrapParagraphs(
      `${shortName} is traditionally recommended when the ruling planet in your birth chart requires strengthening or pacification. Dosha analysis, dasha period, and lagna lord placement determine whether ${shortName} is beneficial for you.`,
      `Book a consultation with our Jyotish experts before purchasing. We never recommend wearing powerful gemstones without proper chart analysis — especially for high-impact stones.`,
    ),
    benefits_html: wrapParagraphs(
      `Vedic tradition associates ${shortName} with specific planetary energies that may support clarity, confidence, prosperity, health, and spiritual discipline when worn correctly.`,
      `Beyond astrology, natural ${shortName} is prized for its beauty, durability, and heirloom value — making it a meaningful investment when sourced ethically and certified.`,
    ),
    types_html: wrapParagraphs(
      `${shortName} is available in various cuts, clarities, and color intensities. Quality grades range from commercial to collector-grade based on color saturation, transparency, inclusions, and origin.`,
      `At ${BRAND}, we list each ${shortName} with honest quality labels, carat or ratti weight, and certification details — without misleading origin sub-category marketing.`,
    ),
    quality_price_html: wrapParagraphs(
      `${shortName} pricing depends on carat weight, color, clarity, cut, origin, treatment status, and certification. Untreated, vividly colored stones with strong certification command premium prices.`,
      `Compare price per carat across our inventory, filter by budget, and speak with our team for personalized recommendations. We believe in fair pricing with full disclosure — no hidden treatments or synthetic substitutes.`,
    ),
    jewellery_html: wrapParagraphs(
      `${shortName} is set in rings, pendants, bracelets, and custom Vedic designs. Our configurator lets you choose metal purity, design style, and ring size with live pricing.`,
      `For astrological rings, open-back settings that allow the stone to touch skin are often preferred. Our jewellers craft each piece to Jyotish specifications.`,
    ),
    cleaning_care_html: wrapParagraphs(
      `Clean ${shortName} gently with lukewarm water, mild soap, and a soft brush. Avoid harsh chemicals, ultrasonic cleaners (for fracture-filled stones), and prolonged sunlight exposure.`,
      `Store separately from harder gemstones to prevent scratches. Remove before swimming, gym, or household chores. Periodic professional inspection ensures settings remain secure.`,
    ),
    buyer_beware_html: wrapParagraphs(
      `Beware of synthetic, glass-filled, or heavily treated ${shortName} sold as "natural" at suspiciously low prices. Always demand lab certification from a reputable gemological laboratory.`,
      `Avoid origin claims without documentation, pressure sales tactics, and sellers who cannot explain treatment status. ${BRAND} has served discerning buyers since 1937 with a reputation built on transparency.`,
    ),
    faqs: defaultFaqs(shortName, slug),
    geo_primary_city: 'New Delhi',
    geo_primary_country: 'IN',
    geo_service_areas: ['India', 'United Kingdom', 'United States', 'Canada', 'Australia', 'UAE', 'Singapore'],
    is_active: true,
  };

  return mergeRichContent(base, getRichCategoryContent(slug, label, category));
}

const PLANET_BY_SLUG: Record<string, string> = {
  ruby: 'Sun (Surya)',
  pearl: 'Moon (Chandra)',
  'red-coral': 'Mars (Mangal)',
  emerald: 'Mercury (Budh)',
  'yellow-sapphire': 'Jupiter (Guru)',
  diamond: 'Venus (Shukra)',
  'blue-sapphire': 'Saturn (Shani)',
  hessonite: 'Rahu',
  'cats-eye': 'Ketu',
  'white-sapphire': 'Venus (Shukra)',
  pitambari: 'Jupiter & Saturn',
};

function buildCatalogDefaults(slug: string, label: string, category: string): ShopCategoryPageContent {
  const shortName = label;
  const base: ShopCategoryPageContent = {
    slug,
    name: shortName,
    product_category: category,
    seo_title: `Buy ${label} Online — Authentic ${shortName} | ${BRAND}`,
    seo_description: `Explore authentic ${label} at ${BRAND}. Certified quality, expert guidance, energization services, and worldwide delivery.`,
    meta_keywords: [slug, shortName.toLowerCase(), category, 'buy online', BRAND.toLowerCase()],
    intro_text: `Explore our curated collection of ${label}. Each piece is selected for quality, authenticity, and spiritual significance.`,
    hero_benefits: defaultBenefits(shortName),
    about_html: wrapParagraphs(
      `${BRAND} offers a carefully curated range of ${label} for devotees, collectors, and spiritual practitioners. Our heritage in Vedic gemstones and sacred items dates back to 1937.`,
    ),
    how_to_wear_html: wrapParagraphs(
      category === 'rudraksha'
        ? `Wear Rudraksha after proper energization. Consult our experts for the correct mukhi, thread material, and wearing rules based on your spiritual goals.`
        : `Follow traditional placement and care guidelines for ${shortName}. Our team provides guidance on placement, worship, and daily care.`,
    ),
    who_should_wear_html: wrapParagraphs(
      `Anyone seeking authentic ${shortName} for spiritual practice, gifting, or home worship can explore our collection. Consult our team for personalized recommendations.`,
    ),
    benefits_html: wrapParagraphs(
      `${shortName} supports devotion, mindfulness, and sacred living. ${BRAND} sources items with attention to craftsmanship and authenticity.`,
    ),
    types_html: wrapParagraphs(
      `Browse various sizes, materials, and grades of ${shortName} in our online collection. Each listing includes detailed specifications and images.`,
    ),
    quality_price_html: wrapParagraphs(
      `Pricing reflects size, rarity, material, and craftsmanship. Filter by budget and compare options transparently across our catalog.`,
    ),
    jewellery_html: wrapParagraphs(
      `Many ${shortName} items can be incorporated into custom jewellery designs. Contact our team or use the configurator where available.`,
    ),
    cleaning_care_html: wrapParagraphs(
      `Gently clean with a soft dry cloth. Avoid water on certain materials. Store in a clean, dedicated space.`,
    ),
    buyer_beware_html: wrapParagraphs(
      `Purchase from trusted sellers with clear product photos and specifications. ${BRAND} guarantees authenticity on every listed item.`,
    ),
    faqs: defaultFaqs(shortName, slug),
    is_active: true,
  };

  return mergeRichContent(base, getRichCategoryContent(slug, label, category));
}

/**
 * Generates a full starting draft for a brand-new category created entirely
 * through the admin panel (not one of the pre-registered gem/catalog slugs).
 * Produces the same structure and section coverage as every existing
 * category page, so the admin can immediately review and refine instead of
 * starting from a blank form.
 */
export function buildGenericShopCategoryDraft(input: {
  slug: string;
  name: string;
  product_category: string;
  sanskrit_name?: string | null;
  planet?: string | null;
}): ShopCategoryPageContent {
  const { slug, name, product_category, sanskrit_name, planet } = input;
  const label = sanskrit_name ? `${name} (${sanskrit_name})` : name;
  const isGemLike = ['navaratna', 'upratna', 'gemstone'].includes(product_category);

  if (isGemLike) {
    const desc = `Natural ${name} gemstones${planet ? ` for ${planet}` : ''}, with certified options and expert Jyotish guidance.`;
    return buildGemDefaults(slug, label, product_category, desc, planet ?? undefined);
  }

  return buildCatalogDefaults(slug, label, product_category);
}

export function getDefaultShopCategoryPage(slug: string): ShopCategoryPageContent | null {
  const gem = KNOWN_GEM_SUBCATEGORIES[slug];
  if (gem) {
    return buildGemDefaults(slug, gem.label, gem.category, gem.desc, PLANET_BY_SLUG[slug]);
  }

  const catalog = KNOWN_CATALOG_SUBCATEGORIES[slug];
  if (catalog) {
    return buildCatalogDefaults(slug, catalog.label, catalog.category);
  }

  return null;
}

export function getAllDefaultCategorySlugs(): string[] {
  return [
    ...Object.keys(KNOWN_GEM_SUBCATEGORIES),
    ...Object.keys(KNOWN_CATALOG_SUBCATEGORIES),
  ];
}
