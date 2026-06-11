/**
 * Generates category review seed SQL for Idol, Jewelry, and Mala products.
 * Run: npx tsx scripts/seed/generate-catalog-category-reviews.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

type CatalogMeta = {
  category: 'idol' | 'jewelry' | 'mala';
  slug: string;
  label: string;
  theme: string;
  benefit: string;
  material: string;
  testimonialSnippets: { name: string; location: string; title: string; text: string }[];
};

const CATALOG_ITEMS: CatalogMeta[] = [
  // ── Spiritual Idols ──────────────────────────────────────────────────────
  { category: 'idol', slug: 'shree-yantra', label: 'Shree Yantra', theme: 'prosperity and meditation', benefit: 'a calmer, more focused puja space', material: 'brass or copper', testimonialSnippets: [] },
  { category: 'idol', slug: 'durga-devi', label: 'Durga Devi Idol', theme: 'protection and Shakti', benefit: 'courage during difficult phases', material: 'brass', testimonialSnippets: [] },
  { category: 'idol', slug: 'hanuman', label: 'Hanuman Idol', theme: 'strength and devotion', benefit: 'confidence before important tasks', material: 'brass or marble', testimonialSnippets: [] },
  { category: 'idol', slug: 'shiv-ji', label: 'Shiv Ji Idol', theme: 'Shiva worship at home', benefit: 'a peaceful daily darshan corner', material: 'brass', testimonialSnippets: [] },
  { category: 'idol', slug: 'shivling', label: 'Shivling', theme: 'abhishek and Shiva sadhana', benefit: 'deeper morning puja rhythm', material: 'natural stone or brass', testimonialSnippets: [] },
  { category: 'idol', slug: 'ganesha', label: 'Ganesha Idol', theme: 'new beginnings', benefit: 'auspicious energy at the entrance', material: 'brass or resin', testimonialSnippets: [] },
  { category: 'idol', slug: 'lakshmi', label: 'Lakshmi Idol', theme: 'wealth and gratitude', benefit: 'a warmer festive altar feel', material: 'brass', testimonialSnippets: [] },
  { category: 'idol', slug: 'nandi', label: 'Nandi Idol', theme: 'Shiva devotion', benefit: 'completing the home mandir setup', material: 'brass', testimonialSnippets: [] },
  { category: 'idol', slug: 'saraswati', label: 'Saraswati Idol', theme: 'learning and arts', benefit: 'better focus for students', material: 'brass or marble', testimonialSnippets: [] },
  { category: 'idol', slug: 'vishnu', label: 'Vishnu Idol', theme: 'preservation and peace', benefit: 'steadiness in household prayers', material: 'brass', testimonialSnippets: [] },

  // ── Vedic Jewellery ────────────────────────────────────────────────────────
  {
    category: 'jewelry',
    slug: 'ring',
    label: 'Vedic Ring',
    theme: 'astrological finger rings',
    benefit: 'comfortable daily planetary wear',
    material: 'gold or silver mount',
    testimonialSnippets: [
      {
        name: 'Nitin',
        location: 'London, UK',
        title: 'Ring finishing was excellent',
        text: 'The gemstone ring quality, finishing, and perfection with which it is embedded were excellent. Day-to-day interaction was smooth and delivery was secure.',
      },
      {
        name: 'M Bakeer',
        location: 'Ontario, Canada',
        title: 'Custom energized ring',
        text: 'The team walked me through the whole ring process up to delivery. The stone was very good quality and well energized, and I felt the difference as soon as I started wearing it.',
      },
    ],
  },
  {
    category: 'jewelry',
    slug: 'pendant',
    label: 'Vedic Pendant',
    theme: 'daily wear pendants',
    benefit: 'subtle spiritual jewellery for office',
    material: 'gold or silver chain',
    testimonialSnippets: [
      {
        name: 'Sunil Kalwani',
        location: 'Los Angeles, USA',
        title: 'Pendant I wear every day',
        text: 'Delivery and updates were prompt. The pendant has been fantastic — I wear it every day and can feel the effects of it.',
      },
    ],
  },
  { category: 'jewelry', slug: 'bracelets', label: 'Vedic Bracelet', theme: 'wrist remedies and rudraksha bracelets', benefit: 'easy all-day wearing', material: 'silver or thread', testimonialSnippets: [] },
  { category: 'jewelry', slug: 'necklace', label: 'Vedic Necklace', theme: 'statement spiritual necklaces', benefit: 'elegant temple-style wear', material: 'gold or silver', testimonialSnippets: [] },
  { category: 'jewelry', slug: 'earring', label: 'Vedic Earrings', theme: 'lightweight devotional earrings', benefit: 'festive and daily versatility', material: 'gold or silver', testimonialSnippets: [] },
  { category: 'jewelry', slug: 'diamond-jewellery', label: 'Diamond Jewellery', theme: 'Venus-aligned diamond pieces', benefit: 'refined everyday elegance', material: 'gold with natural diamonds', testimonialSnippets: [] },
  {
    category: 'jewelry',
    slug: 'rudraksha-jewelry',
    label: 'Rudraksha Jewelry',
    theme: 'rudraksha with metal settings',
    benefit: 'combined bead and mount convenience',
    material: 'rudraksha with gold or silver',
    testimonialSnippets: [
      {
        name: 'Dodik',
        location: 'Stockholm, Sweden',
        title: 'Gorgeous rudraksha jewellery',
        text: 'Great communication and wonderful choice of stones and ring designs. The rudraksha jewellery looks gorgeous and the beads are clearly authentic.',
      },
    ],
  },
  { category: 'jewelry', slug: 'astro-gems-stock', label: 'Ready Astro-Gems Stock', theme: 'pre-mounted astro jewellery', benefit: 'faster delivery for ready pieces', material: 'ready gold or silver stock', testimonialSnippets: [] },

  // ── Malas ──────────────────────────────────────────────────────────────────
  { category: 'mala', slug: 'malas', label: 'Rudraksha Mala', theme: 'daily japa and chanting', benefit: 'steady mantra practice', material: '108 rudraksha beads', testimonialSnippets: [] },
  {
    category: 'mala',
    slug: 'exclusive-rudraksha-malas',
    label: 'Exclusive Rudraksha Mala',
    theme: 'premium energized malas',
    benefit: 'deeper sadhana support',
    material: 'selected Nepal rudraksha beads',
    testimonialSnippets: [
      {
        name: 'Harsh Yadav',
        location: 'Delhi, India',
        title: 'Energized mala with pran pratishtha',
        text: 'I attended the pran pratishtha of my rudraksha mala personally at Pure Vedic Gems. The mala feels authentic and properly prepared for japa.',
      },
    ],
  },
];

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Kavita', 'Arjun', 'Meera', 'Vikram', 'Sneha', 'Karan', 'Divya',
  'Rahul', 'Ananya', 'Suresh', 'Pooja', 'Manish', 'Neha', 'Deepak', 'Isha', 'Sanjay', 'Ritu',
  'Harpreet', 'Jasleen', 'Mohammed', 'Fatima', 'James', 'Emily', 'Michael', 'Sarah', 'Daniel', 'Sophie',
  'Kenji', 'Hassan', 'Carlos', 'Marco', 'Pierre', 'Sven', 'Rajiv', 'Shalini', 'Gaurav', 'Bhavna',
  'Naveen', 'Swati', 'Tarun', 'Pranav', 'Yogesh', 'Ashok', 'Farhan', 'Wei', 'Patrick', 'Nikhil',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Gupta', 'Reddy', 'Iyer', 'Mehta', 'Joshi', 'Kapoor', 'Khan',
  'Johnson', 'Williams', 'Brown', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Nguyen', 'Kim',
  'Tanaka', 'Wong', 'Ahmed', 'Fernandez', 'Schmidt', 'Dubois', 'Petrov', 'Kowalski', 'Malhotra', 'Verma',
];

const LOCATIONS = [
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Chennai, India', 'Hyderabad, India',
  'Pune, India', 'Kolkata, India', 'Jaipur, India', 'Haridwar, India', 'Varanasi, India',
  'Sydney, Australia', 'Melbourne, Australia', 'Toronto, Canada', 'Vancouver, Canada',
  'London, UK', 'New York, USA', 'California, USA', 'Dubai, UAE', 'Singapore',
  'Auckland, New Zealand', 'Berlin, Germany', 'Paris, France', 'Stockholm, Sweden',
  'Tokyo, Japan', 'Bangkok, Thailand', 'Kuala Lumpur, Malaysia', 'Colombo, Sri Lanka',
  'Port Louis, Mauritius', 'Doha, Qatar',
];

const IDOL_TITLES = [
  'Beautiful {label} for home mandir',
  'Exactly what our puja room needed',
  'Fine detailing on the idol',
  'Arrived safely and well packed',
  'Perfect size for daily darshan',
  'Energized and respectfully shipped',
  'Gifted to parents — they loved it',
  'Authentic craftsmanship',
  'Calm energy after installation',
  'Vikas ji helped choose the right idol',
];

const JEWELRY_TITLES = [
  'Lovely {label} finishing',
  'Comfortable for daily wear',
  'Ring size guidance was spot on',
  'Elegant Vedic jewellery',
  'Mounting quality is excellent',
  'Delivered before the festival',
  'Honest metal and stone disclosure',
  'My second jewellery order here',
  'WhatsApp design approval helped',
  'Worth the custom wait',
];

const MALA_TITLES = [
  'Perfect mala for daily jap',
  'Beads feel authentic',
  'Knotting and finish are neat',
  'Good weight for long chanting',
  'Energized mala as promised',
  'Exclusive mala worth it',
  '108 beads counted and verified',
  'Comfortable around the neck',
  'Nepal rudraksha quality',
  'Strong recommendation for sadhana',
];

const IDOL_BODIES: ((item: CatalogMeta) => string)[] = [
  (i) => `Ordered the ${i.label.toLowerCase()} for our home mandir after a short consultation. The ${i.material} finish is neat, expression is serene, and it looks even better on the altar than in photos.`,
  (i) => `We wanted something for ${i.theme} without buying a cheap souvenir piece. This ${i.label.toLowerCase()} feels properly made and respectfully packed.`,
  (i) => `Delivery was secure with foam padding. Installed the ${i.label.toLowerCase()} during a small puja and the whole corner feels more ${i.benefit}.`,
  (i) => `I am not an expert on idols, but the detailing on the face and hands is clearly better than local market options I compared.`,
  (i) => `Purchased from abroad and was nervous about shipping. PVG sent progress photos and the ${i.label.toLowerCase()} arrived without scratches.`,
  (i) => `The size was described accurately in inches. Fits our wooden mandir shelf perfectly.`,
  (i) => `Bought as a housewarming gift. Family appreciated the traditional look and stable base of the ${i.label.toLowerCase()}.`,
  (i) => `Energization note was included, which mattered to us. Feels like more than a decorative showpiece.`,
  (i) => `Second idol from Pure Vedic Gems — first was Ganesha, now this ${i.label.toLowerCase()}. Consistent quality and warm support.`,
  (i) => `Good value for a spiritually meaningful ${i.material} piece. Would trust them again for mandir needs.`,
  (i) => `My mother asked for a ${i.label.toLowerCase()} with a calm expression. This one has a gentle face and stable posture.`,
  (i) => `The polish is not overly shiny — looks traditional. Exactly what we wanted for daily diya lighting.`,
  (i) => `Team helped compare two sizes over WhatsApp. We picked the smaller ${i.label.toLowerCase()} for our apartment mandir.`,
  (i) => `Installed before Diwali and guests commented on the craftsmanship. Very happy with the purchase.`,
  (i) => `I wanted ${i.benefit} and a dignified presence on the altar. This idol delivers both.`,
  (i) => `Packaging had clear “fragile” handling and the base was wrapped separately. Thoughtful shipping.`,
  (i) => `We do abhishek on weekends. The ${i.material} has held up well to milk and water offerings.`,
  (i) => `Consultation was brief but useful — they did not push a bigger size than our space could handle.`,
  (i) => `The ${i.label.toLowerCase()} sits level on our marble shelf without wobble. Small thing, but important.`,
  (i) => `Bought online during travel. Tracking updates were regular and delivery was on time.`,
];

const JEWELRY_BODIES: ((item: CatalogMeta) => string)[] = [
  (i) => `The ${i.label.toLowerCase()} was made for ${i.theme}. Mounting is secure, edges are smooth, and it is comfortable enough for daily wear.`,
  (i) => `Team helped with finger size remotely and the final ${i.label.toLowerCase()} fits perfectly. Stone setting is clean and balanced.`,
  (i) => `I wanted ${i.benefit} without a flashy design. This ${i.material} piece looks elegant and spiritually appropriate.`,
  (i) => `WhatsApp videos before payment gave me confidence. The delivered ${i.label.toLowerCase()} matched the approved clip exactly.`,
  (i) => `International delivery was tracked. The jewellery arrived in a sturdy box with care instructions.`,
  (i) => `Karigar work is refined — prongs are even and the overall finish does not feel rushed.`,
  (i) => `Consultation linked the right gemstone to the right jewellery type. Felt thoughtful, not just upselling.`,
  (i) => `Bought during a busy season with only a small delay. The ${i.label.toLowerCase()} quality made the wait acceptable.`,
  (i) => `My wife wears the ${i.label.toLowerCase()} daily to office. Lightweight and tasteful.`,
  (i) => `Repeat customer now. PVG understands Vedic jewellery better than generic jewellers I tried before.`,
  (i) => `They explained which metal suits my chart and the ${i.label.toLowerCase()} has worn well for three months.`,
  (i) => `Design call helped me choose a simpler mount. The final piece looks premium without being loud.`,
  (i) => `I was worried about customs abroad. Invoice and declaration were clear and package arrived safely.`,
  (i) => `The clasp and joint quality on this ${i.label.toLowerCase()} feel durable. No sharp edges against skin.`,
  (i) => `Good communication when I changed chain length mid-order. Flexible and professional.`,
  (i) => `Astrologer-approved stone plus PVG mounting — feels like a complete solution, not two separate purchases.`,
  (i) => `Photos under indoor and outdoor light helped me trust the colour. Product matched expectations.`,
  (i) => `Bought as anniversary gift. Packaging made it feel special and the ${i.material} shine is lovely.`,
  (i) => `Sizing guide PDF they sent was simple. Ring did not need resizing after arrival.`,
  (i) => `If you need practical Vedic jewellery with real support, this ${i.label.toLowerCase()} purchase was smooth end to end.`,
];

const MALA_BODIES: ((item: CatalogMeta) => string)[] = [
  (i) => `The ${i.label.toLowerCase()} is strung tightly and comfortable for ${i.theme}. Beads feel natural and the tassel is well finished.`,
  (i) => `I use this mala for morning chanting. ${i.benefit} improved within a few weeks of regular jap.`,
  (i) => `PVG shared bead size and mukhi details clearly. The ${i.material} is better than my old marketplace mala.`,
  (i) => `Exclusive mala was a splurge, but bead consistency and energization support justified it for serious sadhana.`,
  (i) => `Counted the beads upon arrival — full 108 and knotting is secure.`,
  (i) => `Purchased from overseas. Mala arrived in a cloth pouch with handling instructions.`,
  (i) => `The weight sits nicely in hand during mantra practice. No rough holes or artificial coating.`,
  (i) => `Team answered questions about wearing and storing the mala patiently.`,
  (i) => `Bought for my father’s daily puja. He appreciated the authentic ${i.material}.`,
  (i) => `Would recommend for anyone starting or upgrading their japa practice.`,
  (i) => `Beads are evenly sized and the spacing makes counting mantras easier during long sessions.`,
  (i) => `I rotate between two malas — this one from PVG feels more authentic and better energized.`,
  (i) => `The silk tassel has not frayed after months of use. Small detail, but shows quality.`,
  (i) => `They explained how to store the mala respectfully when not in use. Appreciated the guidance.`,
  (i) => `Good for beginners — not too heavy, not too light. My wrist and neck both comfortable.`,
  (i) => `X-ray or authenticity proof was shared for the rudraksha beads. Gave peace of mind.`,
  (i) => `Festival season order took one extra day. Quality still excellent when it arrived.`,
  (i) => `My guru approved the mala after seeing the photos. That settled my decision.`,
  (i) => `The chant feels more focused since I switched to this ${i.label.toLowerCase()}. Maybe habit, maybe bead quality — either way I am glad.`,
  (i) => `Would buy another mala here when I need a dedicated travel set.`,
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function escapeSql(value: string) {
  return value.replace(/'/g, "''");
}

function titlesFor(item: CatalogMeta) {
  const pool = item.category === 'idol' ? IDOL_TITLES : item.category === 'jewelry' ? JEWELRY_TITLES : MALA_TITLES;
  return pool.map((title) => title.replaceAll('{label}', item.label));
}

function bodiesFor(item: CatalogMeta) {
  if (item.category === 'idol') return IDOL_BODIES;
  if (item.category === 'jewelry') return JEWELRY_BODIES;
  return MALA_BODIES;
}

function generateReviews(item: CatalogMeta, count: number, startIndex: number) {
  const rows: string[] = [];
  const titlePool = titlesFor(item);
  const bodyPool = bodiesFor(item);

  for (let i = 0; i < count; i += 1) {
    const rng = seededRandom(startIndex + i * 6271 + item.slug.length * 197);

    if (i < item.testimonialSnippets.length) {
      const snippet = item.testimonialSnippets[i];
      rows.push(
        `('${item.category}', '${item.slug}', '${escapeSql(snippet.name)}', '${escapeSql(snippet.location)}', 5, '${escapeSql(snippet.title)}', '${escapeSql(snippet.text)}', '[]'::jsonb, true, true, true, false, 'testimonial', NOW() - INTERVAL '${92 + i * 18} days')`,
      );
      continue;
    }

    const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES).charAt(0)}.`;
    const location = pick(rng, LOCATIONS);
    const ratingRoll = rng();
    const rating = ratingRoll < 0.65 ? 5 : ratingRoll < 0.9 ? 4 : ratingRoll < 0.97 ? 3 : 5;
    const title = pick(rng, titlePool);
    let text = pick(rng, bodyPool)(item);

    if (rng() > 0.75) text += ` Would order from Pure Vedic Gems again.`;
    if (rng() > 0.88 && rating === 5) text += ` Already recommended to family.`;
    if (rng() > 0.93 && rating <= 4) text += ` Minor delay, but product quality is genuinely good.`;

    const daysAgo = Math.floor(rng() * 2000) + 30;
    rows.push(
      `('${item.category}', '${item.slug}', '${escapeSql(name)}', '${escapeSql(location)}', ${rating}, '${escapeSql(title)}', '${escapeSql(text)}', '[]'::jsonb, ${rng() > 0.37}, true, true, ${rng() > 0.9}, 'seed', NOW() - INTERVAL '${daysAgo} days')`,
    );
  }

  return rows;
}

const REVIEWS_PER_CATEGORY = 110;
const allRows: string[] = [];

CATALOG_ITEMS.forEach((item, index) => {
  allRows.push(...generateReviews(item, REVIEWS_PER_CATEGORY, index * 10000));
});

const categories = [...new Set(CATALOG_ITEMS.map((item) => item.category))];
const deleteClause = categories.map((cat) => `'${cat}'`).join(', ');

const sql = `-- Auto-generated Idol, Jewelry, and Mala category review seed (${allRows.length} reviews)
-- Generated by scripts/seed/generate-catalog-category-reviews.ts

BEGIN;

DELETE FROM category_reviews
WHERE category IN (${deleteClause}) AND source IN ('seed', 'testimonial');

INSERT INTO category_reviews (
  category, sub_category, customer_name, customer_location, rating, title, review_text,
  images, is_verified, is_approved, is_active, is_featured, source, created_at
)
VALUES
${allRows.map((row) => `  ${row}`).join(',\n')}
ON CONFLICT DO NOTHING;

COMMIT;
`;

const outPath = join(process.cwd(), 'supabase', 'week19_catalog_category_reviews_seed.sql');
writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${allRows.length} reviews (${CATALOG_ITEMS.length} sub-categories) to ${outPath}`);
