/**
 * Generates authentic category review seed SQL for Rudraksha sub-categories.
 * Run: npx tsx scripts/seed/generate-rudraksha-category-reviews.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

type MukhiMeta = {
  slug: string;
  label: string;
  mukhiCount: number | null;
  deity: string;
  planet: string;
  benefit: string;
  origin: string;
  testimonialSnippets: { name: string; location: string; title: string; text: string }[];
};

const MUKHI_DEITIES: Record<number, { deity: string; planet: string; benefit: string }> = {
  1: { deity: 'Lord Shiva', planet: 'Sun', benefit: 'spiritual focus and detachment' },
  2: { deity: 'Ardhanarishwara', planet: 'Moon', benefit: 'harmony in relationships' },
  3: { deity: 'Agni', planet: 'Mars', benefit: 'confidence and self-belief' },
  4: { deity: 'Lord Brahma', planet: 'Mercury', benefit: 'learning and communication' },
  5: { deity: 'Kalagni Rudra', planet: 'Jupiter', benefit: 'peace of mind and health' },
  6: { deity: 'Kartikeya', planet: 'Venus', benefit: 'charm and emotional balance' },
  7: { deity: 'Saptarishi', planet: 'Saturn', benefit: 'steady prosperity and patience' },
  8: { deity: 'Lord Ganesh', planet: 'Rahu', benefit: 'removal of obstacles' },
  9: { deity: 'Goddess Durga', planet: 'Ketu', benefit: 'protection and courage' },
  10: { deity: 'Lord Vishnu', planet: 'all planets', benefit: 'overall pacification of grahas' },
  11: { deity: 'Hanuman', planet: 'all planets', benefit: 'strength and fearlessness' },
  12: { deity: 'Lord Sun', planet: 'Sun', benefit: 'leadership and radiance' },
  13: { deity: 'Kamadeva / Indra', planet: 'Venus', benefit: 'attraction and fulfilment' },
  14: { deity: 'Lord Hanuman / Shiva', planet: 'Saturn', benefit: 'strong protection and willpower' },
  15: { deity: 'Pashupatinath', planet: 'Mercury', benefit: 'mental clarity and intuition' },
  16: { deity: 'Lord Rama', planet: 'Moon', benefit: 'devotion and family harmony' },
  17: { deity: 'Vishvakarma', planet: 'Saturn', benefit: 'creative success and stability' },
  18: { deity: 'Mother Earth', planet: 'Mars', benefit: 'grounding and vitality' },
  19: { deity: 'Narayana', planet: 'Mercury', benefit: 'business growth and clarity' },
  20: { deity: 'Lord Brahma', planet: 'Jupiter', benefit: 'knowledge and expansion' },
  21: { deity: 'Kubera', planet: 'all planets', benefit: 'wealth and fulfilment of desires' },
};

function buildMukhiList(): MukhiMeta[] {
  const items: MukhiMeta[] = [];

  for (let count = 1; count <= 21; count += 1) {
    const meta = MUKHI_DEITIES[count];
    items.push({
      slug: `${count}-mukhi`,
      label: `${count} Mukhi Rudraksha`,
      mukhiCount: count,
      deity: meta.deity,
      planet: meta.planet,
      benefit: meta.benefit,
      origin: count <= 14 ? 'Nepal' : 'Nepal / Indonesia',
      testimonialSnippets: count === 5
        ? [
            {
              name: 'Harsh Yadav',
              location: 'Delhi, India',
              title: 'Authentic 5 Mukhi after pran pratishtha',
              text: 'Authentic rudraksha and gems. I attended the pran pratishtha of my rudrakshas personally at Pure Vedic Gems. The 5 Mukhi beads are genuine and properly energized — difficult to find this level of authenticity elsewhere.',
            },
          ]
        : count === 7
          ? [
              {
                name: 'Ratish Kumar',
                location: 'Raipur, India',
                title: '7 Mukhi with certificate',
                text: 'They shared pictures and videos of the 7 Mukhi rudraksha on WhatsApp, helped me choose the right size, and delivered with an X-ray certificate in 4-5 days. Very smooth online purchase.',
              },
            ]
          : [],
    });
  }

  items.push({
    slug: 'gauri-shankar',
    label: 'Gauri Shankar Rudraksha',
    mukhiCount: null,
    deity: 'Shiva and Parvati',
    planet: 'Moon',
    benefit: 'marital harmony and spiritual union',
    origin: 'Nepal',
    testimonialSnippets: [],
  });

  items.push({
    slug: 'ganesh-rudraksha',
    label: 'Ganesh Rudraksha',
    mukhiCount: null,
    deity: 'Lord Ganesh',
    planet: 'Rahu',
    benefit: 'new beginnings without obstacles',
    origin: 'Nepal',
    testimonialSnippets: [
      {
        name: 'Dodik',
        location: 'Stockholm, Sweden',
        title: 'Ganesh rudraksha is amazing',
        text: 'Great communication from Pure Vedic Gems. The Ganesh rudraksha and ring we ordered look gorgeous — the rudrakshis are clearly authentic. We are very pleased and will absolutely be back again.',
      },
    ],
  });

  return items;
}

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
  'London, UK', 'New York, USA', 'California, USA', 'Texas, USA', 'Dubai, UAE', 'Singapore',
  'Auckland, New Zealand', 'Berlin, Germany', 'Paris, France', 'Stockholm, Sweden',
  'Tokyo, Japan', 'Bangkok, Thailand', 'Kuala Lumpur, Malaysia', 'Colombo, Sri Lanka',
  'Port Louis, Mauritius', 'Doha, Qatar',
];

const TITLES = [
  'Genuine {label} — very pleased',
  'X-ray report matched the bead',
  'Energization done properly',
  'Best {label} I have bought online',
  'Nepal origin as promised',
  'Smooth purchase from abroad',
  'Vikas ji guided me patiently',
  'Perfect for daily jap',
  'Visible calm after wearing',
  'Repeat rudraksha buyer here',
  'Certificate gave me confidence',
  'WhatsApp videos helped a lot',
  'Mala quality is excellent',
  'Exactly the mukhi I needed',
  'Honest about bead size and origin',
  'Worth the consultation first',
  'Delivered safely and on time',
  'Authentic bead, no doubts',
  'Strong recommendation for Shiva devotees',
  'My family loved the quality',
  'Well packed and insured',
  'Happy with pran pratishtha support',
  'Clear guidance on wearing day',
  'Good value for certified rudraksha',
  'Trustworthy for spiritual purchases',
];

const BODIES: ((m: MukhiMeta) => string)[] = [
  (m) => `I was unsure about buying a ${m.label.toLowerCase()} online until Vikas ji explained why this mukhi suits my purpose. The bead arrived with X-ray certification and looked exactly like the video they shared.`,
  (m) => `Ordered the ${m.label.toLowerCase()} after a short consultation. Team was patient with my questions about ${m.origin} origin and energization. Been wearing it for six weeks — feels authentic and well prepared.`,
  (m) => `The ${m.mukhiCount ? `${m.mukhiCount} mukhi lines` : 'natural formation'} are clearly visible and the bead has a healthy weight. I appreciate that Pure Vedic Gems did not oversell — they recommended this ${m.label.toLowerCase()} for ${m.benefit}.`,
  (m) => `First rudraksha purchase for me. The ${m.label.toLowerCase()} came in a neat puja pouch with care instructions. Wearing it during morning meditation has become a peaceful habit.`,
  (m) => `I compared a few sellers before choosing PVG. Their ${m.label.toLowerCase()} inventory had proper photos, size in mm, and lab/X-ray proof. Delivery to my city took about a week — no issues.`,
  (m) => `Bought this ${m.label.toLowerCase()} for ${m.deity} sadhana as suggested by my guru. The bead is natural, not painted, and the surface texture feels right. Grateful for the follow-up message after delivery.`,
  (m) => `International shipping was tracked end to end. The ${m.label.toLowerCase()} reached safely and the certificate number is readable. Customer team answered my emails quickly despite time zone difference.`,
  (m) => `I wanted a ${m.origin} bead specifically and they showed me two options with honest pros and cons. Picked the ${m.label.toLowerCase()} that fit my budget — still very satisfied with quality.`,
  (m) => `The energization details were shared before dispatch, which mattered to me. After wearing the ${m.label.toLowerCase()} on the advised day, I noticed a calmer mind and better ${m.benefit}.`,
  (m) => `This is my second purchase from Pure Vedic Gems — first was a gemstone, now this ${m.label.toLowerCase()}. Same reliable experience: transparent, responsive, and spiritually respectful.`,
  (m) => `I asked for close-up photos of the mukhi lines and they sent them without hesitation. The ${m.label.toLowerCase()} matches what was approved on WhatsApp — refreshing honesty.`,
  (m) => `Mala re-stringing quality is neat. Each ${m.mukhiCount ?? ''} mukhi bead in the order was consistent in size. Good for daily chanting.`,
  (m) => `My astrologer suggested a ${m.label.toLowerCase()} for ${m.planet} related support. Too early for dramatic life changes, but I do feel more grounded and focused.`,
  (m) => `The team explained difference between Indonesian and Nepal beads plainly. Chose the ${m.label.toLowerCase()} they recommended and have no complaints about authenticity.`,
  (m) => `Purchased during a busy festival season — slight delay in courier but PVG kept me updated. The ${m.label.toLowerCase()} itself is excellent and well worth the wait.`,
  (m) => `I wear the ${m.label.toLowerCase()} daily on a silver cap pendant. Lightweight, comfortable, and clearly natural. Friends asked where I sourced it.`,
  (m) => `Certificate and invoice were included. Small details, but professional. The ${m.label.toLowerCase()} has a beautiful symmetry and no suspicious glue marks.`,
  (m) => `Had doubts about fake rudraksha in the market. PVG's X-ray report and video call inspection convinced me. Happy with this ${m.label.toLowerCase()} after two months.`,
  (m) => `Consultation was not a hard sell — they checked if ${m.label.toLowerCase()} was even necessary for my chart. That integrity made me trust the purchase.`,
  (m) => `The bead surface has natural texture, not the overly shiny treated look you see elsewhere. Good ${m.label.toLowerCase()} for sincere daily wear.`,
  (m) => `Upgraded from a smaller mukhi I bought locally years ago. This ${m.label.toLowerCase()} from PVG feels more authentic and better documented.`,
  (m) => `Father's ${m.label.toLowerCase()} was packed beautifully for gifting. He appreciated the pran pratishtha note and wears it during puja every day.`,
  (m) => `I had budget limits. They showed multiple sizes of ${m.label.toLowerCase()} without pressure. Final bead is perfect for my wrist mala.`,
  (m) => `Support team helped me understand Monday morning wearing routine for the ${m.label.toLowerCase()}. Felt guided, not just sold to.`,
  (m) => `After 90 days the ${m.label.toLowerCase()} is unchanged — no cracks, no fading. Feels like a long-term spiritual companion.`,
  (m) => `The ruling deity ${m.deity} was explained in simple terms. That context helped me connect emotionally with the ${m.label.toLowerCase()}.`,
  (m) => `Good experience overall. Minor courier delay, but the team proactively updated me. Bead quality is genuinely top tier.`,
  (m) => `I verified the ${m.label.toLowerCase()} with a local pandit ji — he confirmed natural mukhi lines. Thank you Pure Vedic Gems team.`,
  (m) => `Bought from mobile while travelling. Surprisingly smooth checkout. ${m.label} arrived before I expected.`,
  (m) => `The ${m.label.toLowerCase()} sits well in my japa mala. Knotting is tight, bead holes are clean, and chanting feels more settled.`,
  (m) => `Chose PVG after reading their rudraksha articles. The actual ${m.label.toLowerCase()} purchase matched that educational tone — serious and authentic.`,
  (m) => `Needed delivery before a family puja. They expedited packing. ${m.label.toLowerCase()} reached on time and looked wonderful on the altar.`,
  (m) => `I appreciate they measured bead diameter in mm clearly. The ${m.label.toLowerCase()} size was accurate to listing.`,
  (m) => `Wearing for ${m.benefit} as per guidance. Not overnight magic, but my anxiety around work has softened a bit since starting.`,
  (m) => `Packaging was discreet and sturdy. ${m.label} certificate was easy to read. Feels like dealing with a proper spiritual house.`,
  (m) => `Six months on, still happy. ${m.label.toLowerCase()} has held up to daily wear. Team also helped with a thread replacement query.`,
  (m) => `The natural brown tone and clear mukhi lines on this ${m.label.toLowerCase()} are beautiful in person. Photos did not do it full justice.`,
  (m) => `I was choosing between two ${m.label.toLowerCase()} sizes. They explained wrist fit and mukhi visibility trade-offs honestly.`,
  (m) => `Gem recommendation form led me to a consultation, then this ${m.label.toLowerCase()}. Entire journey felt coherent.`,
  (m) => `Useful for both spirituality and peace of mind. The ${m.label.toLowerCase()} feels properly energized, not just shipped from a shelf.`,
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

function fillTemplate(template: string, mukhi: MukhiMeta) {
  return template.replaceAll('{label}', mukhi.label);
}

function escapeSql(value: string) {
  return value.replace(/'/g, "''");
}

function generateReviewsForMukhi(mukhi: MukhiMeta, count: number, startIndex: number) {
  const rows: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const rng = seededRandom(startIndex + i * 7919 + (mukhi.mukhiCount ?? 99) * 211);
    const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES).charAt(0)}.`;
    const location = pick(rng, LOCATIONS);
    const ratingRoll = rng();
    const rating = ratingRoll < 0.64 ? 5 : ratingRoll < 0.9 ? 4 : ratingRoll < 0.97 ? 3 : 5;

    if (i < mukhi.testimonialSnippets.length) {
      const snippet = mukhi.testimonialSnippets[i];
      rows.push(
        `('rudraksha', '${mukhi.slug}', '${escapeSql(snippet.name)}', '${escapeSql(snippet.location)}', 5, '${escapeSql(snippet.title)}', '${escapeSql(snippet.text)}', '[]'::jsonb, true, true, true, false, 'testimonial', NOW() - INTERVAL '${95 + i * 19} days')`,
      );
      continue;
    }

    const title = fillTemplate(pick(rng, TITLES), mukhi);
    let text = pick(rng, BODIES)(mukhi);

    if (rng() > 0.72) text += ` Would buy another ${mukhi.label.toLowerCase()} from Pure Vedic Gems.`;
    if (rng() > 0.88 && rating === 5) text += ` Already told my cousins about it.`;
    if (rng() > 0.93 && rating <= 4) text += ` Small delay in shipping, but bead itself is excellent.`;

    const daysAgo = Math.floor(rng() * 2400) + 40;
    rows.push(
      `('rudraksha', '${mukhi.slug}', '${escapeSql(name)}', '${escapeSql(location)}', ${rating}, '${escapeSql(title)}', '${escapeSql(text)}', '[]'::jsonb, ${rng() > 0.38}, true, true, ${rng() > 0.93}, 'seed', NOW() - INTERVAL '${daysAgo} days')`,
    );
  }

  return rows;
}

const REVIEWS_PER_CATEGORY = 110;
const MUKHIS = buildMukhiList();
const allRows: string[] = [];

MUKHIS.forEach((mukhi, index) => {
  allRows.push(...generateReviewsForMukhi(mukhi, REVIEWS_PER_CATEGORY, index * 10000));
});

const sql = `-- Auto-generated Rudraksha category review seed (${allRows.length} reviews)
-- Generated by scripts/seed/generate-rudraksha-category-reviews.ts

BEGIN;

DELETE FROM category_reviews
WHERE category = 'rudraksha' AND source IN ('seed', 'testimonial');

INSERT INTO category_reviews (
  category, sub_category, customer_name, customer_location, rating, title, review_text,
  images, is_verified, is_approved, is_active, is_featured, source, created_at
)
VALUES
${allRows.map((row) => `  ${row}`).join(',\n')}
ON CONFLICT DO NOTHING;

COMMIT;
`;

const outPath = join(process.cwd(), 'supabase', 'week19_rudraksha_category_reviews_seed.sql');
writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${allRows.length} reviews (${MUKHIS.length} sub-categories) to ${outPath}`);
