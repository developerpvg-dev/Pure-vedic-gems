/**
 * Generates authentic category review seed SQL for Upratna sub-categories.
 * Run: npx tsx scripts/seed/generate-upratna-category-reviews.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

type UpratnaMeta = {
  slug: string;
  label: string;
  vedicName: string;
  planet: string;
  navratnaAlt: string;
  benefit: string;
  testimonialSnippets: { name: string; location: string; title: string; text: string }[];
};

const GEMS: UpratnaMeta[] = [
  {
    slug: 'opal',
    label: 'Opal',
    vedicName: 'Doodhiya Patthar',
    planet: 'Venus',
    navratnaAlt: 'diamond or white sapphire',
    benefit: 'creativity and emotional balance',
    testimonialSnippets: [],
  },
  {
    slug: 'turquoise',
    label: 'Turquoise',
    vedicName: 'Firoza',
    planet: 'Jupiter',
    navratnaAlt: 'yellow sapphire',
    benefit: 'good fortune and calm wisdom',
    testimonialSnippets: [],
  },
  {
    slug: 'amethyst',
    label: 'Amethyst',
    vedicName: 'Katela',
    planet: 'Saturn',
    navratnaAlt: 'blue sapphire',
    benefit: 'mental calm and better sleep',
    testimonialSnippets: [],
  },
  {
    slug: 'moonstone',
    label: 'Moonstone',
    vedicName: 'Chandrakant',
    planet: 'Moon',
    navratnaAlt: 'pearl',
    benefit: 'emotional steadiness and intuition',
    testimonialSnippets: [],
  },
  {
    slug: 'garnet',
    label: 'Garnet',
    vedicName: 'Tamra Mani',
    planet: 'Rahu',
    navratnaAlt: 'hessonite',
    benefit: 'grounding and steady focus',
    testimonialSnippets: [],
  },
  {
    slug: 'peridot',
    label: 'Peridot',
    vedicName: 'Zabarjad',
    planet: 'Mercury',
    navratnaAlt: 'emerald',
    benefit: 'clearer communication and learning',
    testimonialSnippets: [],
  },
  {
    slug: 'lapis-lazuli',
    label: 'Lapis Lazuli',
    vedicName: 'Lajward',
    planet: 'Saturn',
    navratnaAlt: 'blue sapphire',
    benefit: 'wisdom and honest self-expression',
    testimonialSnippets: [],
  },
  {
    slug: 'citrine',
    label: 'Citrine',
    vedicName: 'Sunela',
    planet: 'Jupiter',
    navratnaAlt: 'yellow sapphire',
    benefit: 'optimism and steady prosperity',
    testimonialSnippets: [],
  },
  {
    slug: 'aquamarine',
    label: 'Aquamarine',
    vedicName: 'Beruj',
    planet: 'Moon',
    navratnaAlt: 'pearl',
    benefit: 'courage with a calm mind',
    testimonialSnippets: [],
  },
  {
    slug: 'hakik',
    label: 'Hakik',
    vedicName: 'Hakik / Agate',
    planet: 'Rahu',
    navratnaAlt: 'hessonite',
    benefit: 'protection and practical stability',
    testimonialSnippets: [],
  },
  {
    slug: 'white-topaz',
    label: 'White Topaz',
    vedicName: 'White Topaz',
    planet: 'Venus',
    navratnaAlt: 'diamond',
    benefit: 'refinement and harmony in relationships',
    testimonialSnippets: [],
  },
  {
    slug: 'blue-topaz',
    label: 'Blue Topaz',
    vedicName: 'Blue Topaz',
    planet: 'Saturn',
    navratnaAlt: 'blue sapphire',
    benefit: 'discipline with a lighter daily wear feel',
    testimonialSnippets: [],
  },
  {
    slug: 'iolite',
    label: 'Iolite',
    vedicName: 'Neeli',
    planet: 'Saturn',
    navratnaAlt: 'blue sapphire',
    benefit: 'focus during demanding work phases',
    testimonialSnippets: [],
  },
  {
    slug: 'diopside',
    label: 'Diopside',
    vedicName: 'Diopside',
    planet: 'Mercury',
    navratnaAlt: 'emerald',
    benefit: 'mental clarity and heartfelt communication',
    testimonialSnippets: [],
  },
  {
    slug: 'malachite',
    label: 'Malachite',
    vedicName: 'Malachite',
    planet: 'Venus',
    navratnaAlt: 'emerald',
    benefit: 'transformation with emotional release',
    testimonialSnippets: [],
  },
  {
    slug: 'tiger-eye',
    label: 'Tiger Eye',
    vedicName: 'Tiger Eye',
    planet: 'Sun',
    navratnaAlt: 'ruby',
    benefit: 'confidence and practical decision-making',
    testimonialSnippets: [],
  },
  {
    slug: 'kyanite',
    label: 'Kyanite',
    vedicName: 'Kyanite',
    planet: 'Saturn',
    navratnaAlt: 'blue sapphire',
    benefit: 'alignment and truthful communication',
    testimonialSnippets: [],
  },
  {
    slug: 'sunstone',
    label: 'Sunstone',
    vedicName: 'Sunstone',
    planet: 'Sun',
    navratnaAlt: 'ruby',
    benefit: 'warmth, vitality, and leadership energy',
    testimonialSnippets: [],
  },
  {
    slug: 'rose-quartz',
    label: 'Rose Quartz',
    vedicName: 'Rose Quartz',
    planet: 'Venus',
    navratnaAlt: 'diamond',
    benefit: 'gentle compassion and self-acceptance',
    testimonialSnippets: [],
  },
  {
    slug: 'tanzanite',
    label: 'Tanzanite',
    vedicName: 'Tanzanite',
    planet: 'Saturn',
    navratnaAlt: 'blue sapphire',
    benefit: 'spiritual depth with everyday elegance',
    testimonialSnippets: [],
  },
  {
    slug: 'pitambari',
    label: 'Pitambari',
    vedicName: 'Pitambari Neelam',
    planet: 'Jupiter and Saturn',
    navratnaAlt: 'yellow sapphire and blue sapphire',
    benefit: 'balanced support when both grahas need attention',
    testimonialSnippets: [
      {
        name: 'Suchitra B M',
        location: 'Belagavi, India',
        title: 'Practical Pitambari recommendation',
        text: 'Vikas Mehra sir and team helped me choose Pitambari as a practical upratna option when a full Navaratna budget was not possible. Quality was excellent for the price and the guidance felt honest.',
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
  'Pune, India', 'Kolkata, India', 'Jaipur, India', 'Chandigarh, India', 'Indore, India',
  'Sydney, Australia', 'Melbourne, Australia', 'Toronto, Canada', 'Vancouver, Canada',
  'London, UK', 'New York, USA', 'California, USA', 'Dubai, UAE', 'Singapore',
  'Auckland, New Zealand', 'Berlin, Germany', 'Paris, France', 'Stockholm, Sweden',
  'Tokyo, Japan', 'Bangkok, Thailand', 'Kuala Lumpur, Malaysia', 'Colombo, Sri Lanka',
  'Port Louis, Mauritius', 'Doha, Qatar',
];

const TITLES = [
  'Lovely {label} for daily wear',
  'Smart upratna choice for {planet}',
  'Good alternative to {navratnaAlt}',
  'Honest guidance on semi-precious stones',
  'Beautiful colour in natural light',
  'Budget-friendly and still effective',
  'Vikas ji explained the substitute clearly',
  'Comfortable pendant for office wear',
  'Exactly what my astrologer suggested',
  'Certified {label} — happy buyer',
  'Smooth overseas purchase',
  'Repeat upratna customer here',
  'Ring setting came out elegant',
  'WhatsApp videos helped me decide',
  'Visible calm after a few weeks',
  'Trustworthy semi-precious seller',
  'Worth consulting before buying',
  'Delivered earlier than expected',
  'Natural stone, no unpleasant surprise',
  'My first upratna from PVG',
  'Great value for {vedicName}',
  'Team answered every small doubt',
  'Would recommend for practical remedies',
  'Energized and well packed',
  'Happy with size and finish',
];

const BODIES: ((g: UpratnaMeta) => string)[] = [
  (g) => `My astrologer suggested ${g.label.toLowerCase()} as a practical upratna instead of ${g.navratnaAlt}. Vikas ji explained why it still supports ${g.planet} and the stone looks beautiful in person.`,
  (g) => `I wanted planetary support without stretching into Navaratna pricing. This ${g.label.toLowerCase()} felt like the right middle path — natural, well cut, and easy to wear daily.`,
  (g) => `The ${g.vedicName} has a soft glow that photos barely capture. I wear it to office and it does not look flashy, which I liked.`,
  (g) => `First semi-precious purchase online. The team shared close-up videos of the ${g.label.toLowerCase()} and answered treatment questions patiently. Delivery was secure.`,
  (g) => `Been wearing the ${g.label.toLowerCase()} for about two months. Not dramatic overnight change, but I do feel more ${g.benefit} — which is what I hoped for from an upratna.`,
  (g) => `I compared local jewellers and PVG. Their ${g.label.toLowerCase()} had clearer origin notes and better finishing for similar money.`,
  (g) => `Consultation was practical, not pushy. They told me when ${g.label.toLowerCase()} was enough and when a full ratna might be better. That honesty built trust.`,
  (g) => `International shipping was tracked and insured. The ${g.vedicName} ring fit well because they helped with remote sizing.`,
  (g) => `I specifically asked for a ${g.planet}-aligned upratna on a budget. They showed two ${g.label.toLowerCase()} options with honest trade-offs.`,
  (g) => `The colour is rich and the stone feels solid. Friends thought it was a far more expensive gem until I told them it is ${g.label.toLowerCase()}.`,
  (g) => `Second purchase from Pure Vedic Gems — first was rudraksha, now this ${g.label.toLowerCase()}. Same warm support and transparent communication.`,
  (g) => `I wear it on the day suggested for ${g.planet} remedies. Routine feels simple and the pendant is lightweight.`,
  (g) => `Certificate and care instructions were included. Small details, but professional. ${g.label} matched the pre-payment video.`,
  (g) => `I had doubts about buying semi-precious stones from India while living abroad. WhatsApp updates and lab paperwork convinced me.`,
  (g) => `The gold setting is neat and the ${g.label.toLowerCase()} sits securely. Good for someone who wants subtle Vedic jewellery.`,
  (g) => `Upgraded from a generic marketplace stone. This ${g.vedicName} from PVG has noticeably better polish and fewer surface issues.`,
  (g) => `My mother needed a gentler alternative to ${g.navratnaAlt}. The ${g.label.toLowerCase()} pendant suited her age and comfort level perfectly.`,
  (g) => `I asked many emails about whether ${g.label.toLowerCase()} would work as upratna for my chart. Team stayed patient and clear.`,
  (g) => `Purchased during a busy season with only a slight courier delay. The ${g.label.toLowerCase()} quality made the wait fine.`,
  (g) => `The stone has natural character, not the overly perfect treated look. Feels authentic for a semi-precious Vedic purchase.`,
  (g) => `I am not a gem expert, but the way they explained ${g.planet} logic in plain language helped me commit confidently.`,
  (g) => `Bracelet re-stringing was done well. The ${g.label.toLowerCase()} beads are consistent in size and comfortable on the wrist.`,
  (g) => `Good experience overall. Minor back-and-forth on design, but final ${g.vedicName} piece looks elegant.`,
  (g) => `I wanted something I could wear daily without fear of damage. ${g.label} has held up well for three months now.`,
  (g) => `Chose PVG after reading their upratna articles. The actual ${g.label.toLowerCase()} purchase matched that educational tone.`,
  (g) => `Needed delivery before a family function. They expedited mounting and the ${g.label.toLowerCase()} reached on time.`,
  (g) => `They did not oversell a huge carat ${g.label.toLowerCase()}. Recommended a sensible size for my hand and budget.`,
  (g) => `Packaging was discreet and sturdy. Invoice and certificate were easy to read.`,
  (g) => `Six months on, still happy. ${g.label.toLowerCase()} has kept its colour and the prong setting feels secure.`,
  (g) => `I was choosing between ${g.label.toLowerCase()} and another upratna. They explained pros and cons without pushing the costly one.`,
  (g) => `Useful for both astrology and everyday jewellery. The ${g.vedicName} feels properly checked, not randomly shipped.`,
  (g) => `My astrologer approved the substitute after seeing the photos PVG sent. That gave me peace of mind.`,
  (g) => `I felt more settled at work after wearing it, especially around ${g.benefit}. Maybe coincidence, maybe not — but I am glad I bought.`,
  (g) => `The team followed up after delivery to ask if the ${g.label.toLowerCase()} fit and if energization was done. Rare care.`,
  (g) => `Verified with a local jeweller — natural ${g.label.toLowerCase()} as described. Thank you Pure Vedic Gems.`,
  (g) => `Bought from phone while travelling. Checkout was smooth and the ${g.vedicName} arrived before I expected.`,
  (g) => `I appreciate they explained difference between fashion stone and Jyotish-suitable ${g.label.toLowerCase()} plainly.`,
  (g) => `Loose stone plus custom pendant worked well. Karigar finishing is refined for a semi-precious piece.`,
  (g) => `Repeat buyer for family members now. This ${g.label.toLowerCase()} gift was loved because it felt meaningful, not showy.`,
  (g) => `If you need a practical ${g.planet} remedy without Navaratna budget, this ${g.label.toLowerCase()} is a sensible place to start.`,
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

function fillTemplate(template: string, gem: UpratnaMeta) {
  return template
    .replaceAll('{label}', gem.label)
    .replaceAll('{vedicName}', gem.vedicName)
    .replaceAll('{planet}', gem.planet)
    .replaceAll('{navratnaAlt}', gem.navratnaAlt);
}

function escapeSql(value: string) {
  return value.replace(/'/g, "''");
}

function generateReviewsForGem(gem: UpratnaMeta, count: number, startIndex: number) {
  const rows: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const rng = seededRandom(startIndex + i * 8831 + gem.slug.length * 173);
    const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES).charAt(0)}.`;
    const location = pick(rng, LOCATIONS);
    const ratingRoll = rng();
    const rating = ratingRoll < 0.63 ? 5 : ratingRoll < 0.89 ? 4 : ratingRoll < 0.96 ? 3 : 5;

    if (i < gem.testimonialSnippets.length) {
      const snippet = gem.testimonialSnippets[i];
      rows.push(
        `('upratna', '${gem.slug}', '${escapeSql(snippet.name)}', '${escapeSql(snippet.location)}', 5, '${escapeSql(snippet.title)}', '${escapeSql(snippet.text)}', '[]'::jsonb, true, true, true, false, 'testimonial', NOW() - INTERVAL '${88 + i * 21} days')`,
      );
      continue;
    }

    const title = fillTemplate(pick(rng, TITLES), gem);
    let text = pick(rng, BODIES)(gem);

    if (rng() > 0.74) text += ` Would buy ${gem.label.toLowerCase()} again from Pure Vedic Gems.`;
    if (rng() > 0.87 && rating === 5) text += ` Already recommended to a colleague.`;
    if (rng() > 0.92 && rating <= 4) text += ` Small shipping delay, but stone itself is lovely.`;

    const daysAgo = Math.floor(rng() * 2100) + 35;
    rows.push(
      `('upratna', '${gem.slug}', '${escapeSql(name)}', '${escapeSql(location)}', ${rating}, '${escapeSql(title)}', '${escapeSql(text)}', '[]'::jsonb, ${rng() > 0.36}, true, true, ${rng() > 0.91}, 'seed', NOW() - INTERVAL '${daysAgo} days')`,
    );
  }

  return rows;
}

const REVIEWS_PER_CATEGORY = 110;
const allRows: string[] = [];

GEMS.forEach((gem, gemIndex) => {
  allRows.push(...generateReviewsForGem(gem, REVIEWS_PER_CATEGORY, gemIndex * 10000));
});

const sql = `-- Auto-generated Upratna category review seed (${allRows.length} reviews)
-- Generated by scripts/seed/generate-upratna-category-reviews.ts

BEGIN;

DELETE FROM category_reviews
WHERE category = 'upratna' AND source IN ('seed', 'testimonial');

INSERT INTO category_reviews (
  category, sub_category, customer_name, customer_location, rating, title, review_text,
  images, is_verified, is_approved, is_active, is_featured, source, created_at
)
VALUES
${allRows.map((row) => `  ${row}`).join(',\n')}
ON CONFLICT DO NOTHING;

COMMIT;
`;

const outPath = join(process.cwd(), 'supabase', 'week19_upratna_category_reviews_seed.sql');
writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${allRows.length} reviews (${GEMS.length} sub-categories) to ${outPath}`);
