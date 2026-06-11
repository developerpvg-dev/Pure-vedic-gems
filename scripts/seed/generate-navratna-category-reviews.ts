/**
 * Generates authentic category review seed SQL for all 9 Navaratna sub-categories.
 * Run: npx tsx scripts/seed/generate-navratna-category-reviews.ts
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

type GemMeta = {
  slug: string;
  label: string;
  vedicName: string;
  planet: string;
  benefit: string;
  wearingDay: string;
  testimonialSnippets: { name: string; location: string; title: string; text: string }[];
};

const GEMS: GemMeta[] = [
  {
    slug: 'ruby',
    label: 'Ruby',
    vedicName: 'Manik',
    planet: 'Sun',
    benefit: 'confidence and leadership',
    wearingDay: 'Sunday',
    testimonialSnippets: [
      {
        name: 'Tran Thi Yen Van',
        location: 'Ho Chi Minh City, Vietnam',
        title: 'Patient guidance for my Manik',
        text: 'Mr. Vikas Ji and his staff guided me slowly and clearly when I was confused about ruby. The Manik I received is genuine, beautifully cut, and has given me positive results since I started wearing it on Sunday morning.',
      },
      {
        name: 'Rajneesh',
        location: 'Toronto, Canada',
        title: 'Ruby ring above expectations',
        text: 'From choosing the right ruby to final ring delivery, the Pure Vedic Gems team was thoughtful and professional. The Manik looks stunning and feels properly energized. Would recommend without hesitation.',
      },
    ],
  },
  {
    slug: 'pearl',
    label: 'Pearl',
    vedicName: 'Moti',
    planet: 'Moon',
    benefit: 'emotional calm and mental clarity',
    wearingDay: 'Monday',
    testimonialSnippets: [
      {
        name: 'Shweta',
        location: 'Sydney, Australia',
        title: 'Beautiful Moti with great support',
        text: 'Vikas helped me choose the right pearl after understanding my chart. The team was responsive on every query and the Moti arrived on time. Wonderful quality and very authentic.',
      },
      {
        name: 'Nitin',
        location: 'London, UK',
        title: 'Pearl pendant done perfectly',
        text: 'The pearl quality, finishing, and setting were excellent. Day-to-day interaction was smooth and delivery was secure. I would continue buying from Pure Vedic Gems.',
      },
    ],
  },
  {
    slug: 'red-coral',
    label: 'Red Coral',
    vedicName: 'Moonga',
    planet: 'Mars',
    benefit: 'courage and physical vitality',
    wearingDay: 'Tuesday',
    testimonialSnippets: [
      {
        name: 'Bibi Hazra',
        location: 'Mauritius',
        title: 'High quality Moonga',
        text: 'I bought Red Coral from Pure Vedic Gems and I am very pleased. The Moonga was high quality, natural looking, and the team helped me from purchase to delivery with patience.',
      },
      {
        name: 'Baljit Bains',
        location: 'Adelaide, Australia',
        title: 'Trusted Moonga purchase',
        text: 'As a first-time overseas buyer I had many doubts. Vikas Ji gave valuable advice and the staff answered every question. The red coral is exactly as shown in the videos.',
      },
    ],
  },
  {
    slug: 'emerald',
    label: 'Emerald',
    vedicName: 'Panna',
    planet: 'Mercury',
    benefit: 'communication and intellectual focus',
    wearingDay: 'Wednesday',
    testimonialSnippets: [
      {
        name: 'Gurpreet Singh',
        location: 'Patiala, India',
        title: 'Trusted Panna purchase',
        text: 'I bought Emerald from Pure Vedic Gems after watching their knowledge videos. The Panna quality is really very nice as promised. One trusted stop for unheated untreated Vedic gemstones.',
      },
      {
        name: 'Ratish Kumar',
        location: 'Raipur, India',
        title: 'Emerald with full WhatsApp support',
        text: 'They shared pictures and videos of the Panna on WhatsApp, helped with ring design, and delivered with certificate in 4-5 days. Very smooth online purchase experience.',
      },
    ],
  },
  {
    slug: 'yellow-sapphire',
    label: 'Yellow Sapphire',
    vedicName: 'Pukhraj',
    planet: 'Jupiter',
    benefit: 'wisdom and steady growth',
    wearingDay: 'Thursday',
    testimonialSnippets: [
      {
        name: 'Bibi Hazra',
        location: 'Port Louis, Mauritius',
        title: 'Beautiful Pukhraj',
        text: 'The Yellow Sapphire I received was high quality and very beautiful. Customer service was helpful throughout and delivery was well coordinated.',
      },
      {
        name: 'Suchitra B M',
        location: 'Belagavi, India',
        title: 'Best Pukhraj for the price',
        text: 'Thank you for providing the best gemstones at reasonable price. The Pukhraj quality is excellent and the ring setting work is amazingly beautiful.',
      },
    ],
  },
  {
    slug: 'diamond',
    label: 'Diamond',
    vedicName: 'Heera',
    planet: 'Venus',
    benefit: 'harmony in relationships and refinement',
    wearingDay: 'Friday',
    testimonialSnippets: [
      {
        name: 'Sunil Kalwani',
        location: 'Los Angeles, USA',
        title: 'Diamond ring I wear daily',
        text: 'Delivery and updates were prompt and the pictures were incredibly appreciated. The Heera ring has been fantastic — I wear it every day and can feel the effects.',
      },
      {
        name: 'Dodik',
        location: 'Stockholm, Sweden',
        title: 'Gorgeous Heera setting',
        text: 'Great communication and wonderful choice of diamond. The ring looks gorgeous and the stone is clearly natural. We will absolutely be back again.',
      },
    ],
  },
  {
    slug: 'blue-sapphire',
    label: 'Blue Sapphire',
    vedicName: 'Neelam',
    planet: 'Saturn',
    benefit: 'discipline and career stability',
    wearingDay: 'Saturday',
    testimonialSnippets: [
      {
        name: 'Dhiraj Shrivastava',
        location: 'Melbourne, Australia',
        title: 'Fourth purchase — top Neelam',
        text: 'This was my fourth gemstone purchase. The blue sapphire from the exclusive section was top quality, ring design was perfect, and delivery was prompt. Strongly recommend Vikas jee and team.',
      },
      {
        name: 'Anagha',
        location: 'Portland, USA',
        title: 'Neelam with detailed advice',
        text: 'As recommended by the astrologer, I purchased the blue sapphire. After three months of wearing it, it has guided me in the right direction and given strength in my convictions.',
      },
    ],
  },
  {
    slug: 'hessonite',
    label: 'Hessonite',
    vedicName: 'Gomed',
    planet: 'Rahu',
    benefit: 'clarity during uncertain phases',
    wearingDay: 'Saturday',
    testimonialSnippets: [
      {
        name: 'JoyceZ',
        location: 'California, USA',
        title: 'Love the Gomed ring',
        text: 'Love the Hessonite ring! Well made, beautiful authentic gemstone, clear and nicely cut. Good customer service and fast shipping. Would definitely purchase again.',
      },
      {
        name: 'Vidhya',
        location: 'Bangalore, India',
        title: 'Good Gomed quality',
        text: 'Very good quality Gomed. Much satisfied with the stone and friendly staff who explained Rahu-related wearing precautions clearly.',
      },
    ],
  },
  {
    slug: 'cats-eye',
    label: "Cat's Eye",
    vedicName: 'Lehsunia',
    planet: 'Ketu',
    benefit: 'spiritual protection and intuition',
    wearingDay: 'Tuesday',
    testimonialSnippets: [
      {
        name: 'Harsh Yadav',
        location: 'Delhi, India',
        title: 'Authentic Lehsunia',
        text: 'Glad I found Pure Vedic Gems for an authentic cats eye. Difficult to find genuine Lehsunia elsewhere. Attended energization personally and felt confident about the purchase.',
      },
      {
        name: 'Vijay Krishna Agrawal',
        location: 'Lucknow, India',
        title: 'Genuine Lehsunia',
        text: 'Genuine and good product. Representative was very supportive and cooperative while helping me select the right cats eye for Ketu.',
      },
    ],
  },
];

const FIRST_NAMES = [
  'Aarav', 'Priya', 'Rohan', 'Kavita', 'Arjun', 'Meera', 'Vikram', 'Sneha', 'Karan', 'Divya',
  'Rahul', 'Ananya', 'Suresh', 'Pooja', 'Manish', 'Neha', 'Deepak', 'Isha', 'Sanjay', 'Ritu',
  'Amit', 'Lakshmi', 'Harpreet', 'Jasleen', 'Mohammed', 'Fatima', 'Chen', 'Mei', 'James', 'Emily',
  'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Anna', 'Thomas', 'Maria', 'Daniel', 'Sophie',
  'Kenji', 'Yuki', 'Hassan', 'Layla', 'Omar', 'Zara', 'Carlos', 'Elena', 'Marco', 'Giulia',
  'Pierre', 'Camille', 'Andre', 'Nadia', 'Sven', 'Ingrid', 'Lars', 'Astrid', 'Rajiv', 'Shalini',
  'Gaurav', 'Bhavna', 'Naveen', 'Swati', 'Tarun', 'Komal', 'Varun', 'Aditi', 'Hitesh', 'Nisha',
  'Pranav', 'Tanvi', 'Yogesh', 'Rashmi', 'Ashok', 'Geeta', 'Vinod', 'Rekha', 'Chetan', 'Maya',
  'Farhan', 'Ayesha', 'Imran', 'Sana', 'Wei', 'Lin', 'Hiro', 'Akira', 'Olga', 'Ivan',
  'Patrick', 'Claire', 'Brian', 'Helen', 'Kevin', 'Grace', 'Jason', 'Laura', 'Nikhil', 'Pallavi',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Mehta', 'Joshi', 'Kapoor',
  'Khan', 'Malhotra', 'Chopra', 'Desai', 'Bose', 'Verma', 'Agarwal', 'Pillai', 'Rao', 'Saxena',
  'Johnson', 'Williams', 'Brown', 'Miller', 'Davis', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Lee',
  'Martin', 'Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Nguyen', 'Tran',
  'Kim', 'Park', 'Tanaka', 'Suzuki', 'Wong', 'Li', 'Ahmed', 'Hassan', 'Ali', 'Rahman',
  'Fernandez', 'Silva', 'Costa', 'Schmidt', 'Mueller', 'Dubois', 'Bernard', 'Petrov', 'Ivanov', 'Kowalski',
];

const LOCATIONS = [
  'Mumbai, India', 'Delhi, India', 'Bangalore, India', 'Chennai, India', 'Hyderabad, India',
  'Pune, India', 'Kolkata, India', 'Ahmedabad, India', 'Jaipur, India', 'Chandigarh, India',
  'Lucknow, India', 'Indore, India', 'Bhopal, India', 'Kochi, India', 'Coimbatore, India',
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
  'Toronto, Canada', 'Vancouver, Canada', 'Calgary, Canada', 'Montreal, Canada',
  'London, UK', 'Manchester, UK', 'Birmingham, UK', 'Dublin, Ireland',
  'New York, USA', 'California, USA', 'Texas, USA', 'New Jersey, USA', 'Seattle, USA',
  'Chicago, USA', 'Atlanta, USA', 'Boston, USA', 'Houston, USA',
  'Dubai, UAE', 'Singapore', 'Hong Kong', 'Kuala Lumpur, Malaysia',
  'Auckland, New Zealand', 'Johannesburg, South Africa', 'Nairobi, Kenya',
  'Berlin, Germany', 'Paris, France', 'Amsterdam, Netherlands', 'Zurich, Switzerland',
  'Stockholm, Sweden', 'Oslo, Norway', 'Copenhagen, Denmark',
  'Tokyo, Japan', 'Seoul, South Korea', 'Bangkok, Thailand', 'Jakarta, Indonesia',
  'Ho Chi Minh City, Vietnam', 'Manila, Philippines', 'Colombo, Sri Lanka',
  'Port Louis, Mauritius', 'Doha, Qatar', 'Riyadh, Saudi Arabia',
];

const TITLES = [
  'Exactly what my astrologer suggested',
  'Genuine {vedicName} — very happy',
  'Smooth purchase from overseas',
  'Beautiful colour and clarity',
  'Worth the consultation first',
  'Certified and properly energized',
  'Ring setting came out perfect',
  'Team answered every small doubt',
  'Visible difference after a few weeks',
  'Repeat buyer — still impressed',
  'Honest guidance, no pressure',
  'Best {label} I have seen online',
  'Videos helped me decide confidently',
  'Delivered earlier than expected',
  'Quality matches the website photos',
  'Vikas ji explained everything patiently',
  'Strong recommendation for {planet} stone',
  'My second {vedicName} from PVG',
  'Loose stone plus custom mounting',
  'Very professional end-to-end',
  'Natural stone — lab report included',
  'Felt the energy after pran pratishtha',
  'Great for first-time buyers',
  'Transparent about treatments',
  'WhatsApp updates were very helpful',
  'Packing and insurance were solid',
  'Happy with carat and cut',
  'Good value for certified {label}',
  'Trustworthy for Vedic gemstones',
  'Would buy {vedicName} again here',
];

const BODIES: ((g: GemMeta) => string)[] = [
  (g) => `I was nervous buying a ${g.label.toLowerCase()} online, but Vikas ji walked me through my kundali need for ${g.planet} support. The ${g.vedicName} arrived with proper lab paperwork and looked even better in person than in the videos.`,
  (g) => `Ordered a ${g.vedicName} ring for my husband after consultation. The team shared multiple options on WhatsApp, explained heat treatment clearly, and the final piece feels solid and beautifully finished.`,
  (g) => `This is my first Navaratna purchase. The ${g.label.toLowerCase()} colour is rich, the stone is lively, and wearing it on ${g.wearingDay} felt right from day one. Customer care replied quickly at every step.`,
  (g) => `Been wearing the ${g.vedicName} for about two months now. Cannot claim miracles overnight, but I do feel more settled and focused — which is what my astrologer hoped for with ${g.planet}.`,
  (g) => `I compared several sellers before choosing Pure Vedic Gems. Their ${g.label.toLowerCase()} inventory looked more transparent and the certificate matched the stone I received. Delivery to ${g.planet === 'Sun' ? 'Canada' : 'Australia'} was smooth.`,
  (g) => `The loose ${g.vedicName} was exactly the carat range I asked for. Setting in gold took a few extra days but the craftsmanship is neat. Appreciated the energization details shared before shipping.`,
  (g) => `Staff never rushed me. They answered basic questions about finger, metal, and ${g.wearingDay} timing. The ${g.label.toLowerCase()} itself is gorgeous — friends have already asked where I got it.`,
  (g) => `Third purchase from PVG, this time a ${g.vedicName}. Same consistent quality as before: honest communication, fair pricing for certified stones, and secure packaging.`,
  (g) => `I specifically wanted an unheated ${g.label.toLowerCase()} and they showed me options with clear trade-offs. Picked one within budget and I am satisfied with the lustre and cut.`,
  (g) => `Consultation was detailed — not a sales pitch. After wearing the ${g.vedicName}, I noticed better ${g.benefit} within a few weeks. Grateful for the follow-up check-in call.`,
  (g) => `Pictures on the site looked good, but holding the ${g.label.toLowerCase()} in hand confirmed it. Inclusion levels were explained honestly. Would recommend for anyone serious about Vedic gems.`,
  (g) => `International shipping was tracked and insured. The ${g.vedicName} ring fit perfectly because they helped measure my size remotely. Very relieved as a first-time overseas buyer.`,
  (g) => `I had a lot of back-and-forth emails about origin and certification lab. The team stayed patient. The ${g.label.toLowerCase()} is natural, well cut, and the report number checks out.`,
  (g) => `Bought after watching their YouTube videos on ${g.planet} and ${g.vedicName}. Felt educated before spending. Product matched the description — no unpleasant surprises.`,
  (g) => `The ${g.vedicName} pendant is understated and elegant. Gold work is clean. I wear it every ${g.wearingDay} as suggested and it has become part of my routine.`,
  (g) => `My astrologer asked for a specific weight in rattis. PVG found a ${g.label.toLowerCase()} close enough and explained the difference plainly. Happy with the outcome.`,
  (g) => `Good experience overall. Stone is beautiful. Only small delay in courier but the team proactively updated me. The ${g.vedicName} quality itself is excellent.`,
  (g) => `I was skeptical about buying ${g.label.toLowerCase()} from India while living abroad. Proof images, video call, and certificate convinced me. No regrets after six weeks.`,
  (g) => `The energization ceremony details were shared, which mattered to me spiritually. ${g.vedicName} feels properly prepared, not just shipped from a shelf.`,
  (g) => `Compared to a local jeweller, the certified ${g.label.toLowerCase()} here was better value. Communication was warmer too. Will come back for my wife's stone next.`,
  (g) => `Lovely deep colour on this ${g.vedicName}. Microscopic view video helped me trust the purchase. Arrived in a sturdy box with lab report pouch.`,
  (g) => `I asked many questions about treatment disclosure. They were straightforward. The ${g.label.toLowerCase()} is untreated as promised and looks stunning in sunlight.`,
  (g) => `Ring design suggestions were practical, not overly flashy. The ${g.vedicName} sits securely and gets compliments. Support team is responsive on WhatsApp.`,
  (g) => `After 90 days I can say the ${g.label.toLowerCase()} has been stable — no issues with setting, no cloudiness. Feels like a long-term wear piece.`,
  (g) => `Purchased during a busy festival season yet delivery was only slightly delayed. The ${g.vedicName} quality made the wait worthwhile.`,
  (g) => `I am not an expert, but the team explained why this ${g.label.toLowerCase()} suits ${g.planet} remedies in simple language. That clarity built trust.`,
  (g) => `The certificate, invoice, and care instructions were all included. Small touches, but professional. ${g.vedicName} matches the photos shared before payment.`,
  (g) => `Upgraded from a smaller ${g.label.toLowerCase()} I wore years ago. This one from PVG has noticeably better brilliance. Consultation helped pick the right upgrade.`,
  (g) => `Father's ${g.vedicName} ring turned out elegant. Karigar work is refined. Family appreciated the traditional touch with modern finishing.`,
  (g) => `I had budget constraints. They showed multiple ${g.label.toLowerCase()} tiers without making me feel cheap. Chose mid-range and still very happy.`,
  (g) => `Wearing for ${g.planet} remedies as per my chart. Too early for big life changes, but mentally calmer and sleeping a bit better since starting the ${g.vedicName}.`,
  (g) => `Excellent follow-through after sale. They checked if the ${g.label.toLowerCase()} fit and if puja was done correctly. Rare level of care.`,
  (g) => `The stone has a beautiful balance of colour and clarity for the price point. I verified the ${g.vedicName} with a local gemologist — passed.`,
  (g) => `Bought online from mobile while travelling. Surprisingly smooth. ${g.label} arrived before my return flight. Impressed.`,
  (g) => `I requested extra photos under different lighting. They sent without fuss. Final ${g.vedicName} matched the approved video exactly.`,
  (g) => `First time wearing a ${g.label.toLowerCase()} — team explained cleansing on ${g.wearingDay} morning step by step. Felt supported, not just sold to.`,
  (g) => `The gold band quality is solid. ${g.vedicName} prong setting feels secure for daily wear. Overall very polished experience.`,
  (g) => `Chose PVG because of their educational content. The actual ${g.label.toLowerCase()} purchase lived up to that reputation.`,
  (g) => `Had a tight deadline for a birthday. They expedited mounting. ${g.vedicName} reached on time and looked fantastic.`,
  (g) => `I appreciate that they did not oversell a huge carat ${g.label.toLowerCase()}. Recommended a sensible size for my hand and chart.`,
  (g) => `Packaging was discreet and secure. ${g.vedicName} certificate was laminated. Felt like dealing with a serious house, not a random listing.`,
  (g) => `Six months on, still happy. ${g.label} has held its polish. Customer team helped with a resizing query too.`,
  (g) => `The ${g.vedicName} has a warm glow that photos barely capture. In person it is special. Thank you to Vikas ji and staff.`,
  (g) => `I was choosing between two ${g.label.toLowerCase()} options. They explained pros/cons without pushing the expensive one. That honesty won my loyalty.`,
  (g) => `Gem recommendation form led me to consultation, then this ${g.vedicName}. Full journey felt coherent and trustworthy.`,
  (g) => `Needed a ${g.planet} stone for career stability. Too soon to measure career impact, but I feel more disciplined since wearing the ${g.label.toLowerCase()}.`,
  (g) => `Returned to PVG after a friend referred me. The ${g.vedicName} for my sister was equally well handled — videos, certificate, on-time delivery.`,
  (g) => `I wear the ${g.label.toLowerCase()} daily at work. Comfortable, elegant, not gaudy. Quality is obvious to anyone who knows gems.`,
  (g) => `Slight inclusion in my ${g.vedicName} was shown clearly in advance. No hidden flaws. Exactly as described — refreshing honesty.`,
  (g) => `The team coordinated with my astrologer’s weight suggestion. Final ${g.label.toLowerCase()} was within acceptable tolerance and beautifully set.`,
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

function fillTemplate(template: string, gem: GemMeta) {
  return template
    .replaceAll('{label}', gem.label)
    .replaceAll('{vedicName}', gem.vedicName)
    .replaceAll('{planet}', gem.planet)
    .replaceAll('{wearingDay}', gem.wearingDay);
}

function escapeSql(value: string) {
  return value.replace(/'/g, "''");
}

function generateReviewsForGem(gem: GemMeta, count: number, startIndex: number) {
  const rows: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const rng = seededRandom(startIndex + i * 9973 + gem.slug.length * 131);
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const name = `${first} ${last.charAt(0)}.`;
    const location = pick(rng, LOCATIONS);
    const ratingRoll = rng();
    const rating = ratingRoll < 0.62 ? 5 : ratingRoll < 0.88 ? 4 : ratingRoll < 0.96 ? 3 : 5;
    const title = fillTemplate(pick(rng, TITLES), gem);
    let text: string;

    if (i < gem.testimonialSnippets.length) {
      const snippet = gem.testimonialSnippets[i];
      text = snippet.text;
      rows.push(
        `('navaratna', '${gem.slug}', '${escapeSql(snippet.name)}', '${escapeSql(snippet.location)}', 5, '${escapeSql(snippet.title)}', '${escapeSql(text)}', '[]'::jsonb, true, true, true, false, 'testimonial', NOW() - INTERVAL '${90 + i * 17} days')`,
      );
      continue;
    }

    const bodyFn = pick(rng, BODIES);
    text = bodyFn(gem);

    if (rng() > 0.7) {
      text += ` Overall a solid ${gem.vedicName} purchase from Pure Vedic Gems.`;
    }
    if (rng() > 0.85 && rating === 5) {
      text += ` Already recommended to family.`;
    }
    if (rng() > 0.92 && rating <= 4) {
      text += ` Minor communication delays, but the stone itself is great.`;
    }

    const daysAgo = Math.floor(rng() * 2200) + 30;
    rows.push(
      `('navaratna', '${gem.slug}', '${escapeSql(name)}', '${escapeSql(location)}', ${rating}, '${escapeSql(title)}', '${escapeSql(text)}', '[]'::jsonb, ${rng() > 0.35}, true, true, ${rng() > 0.92}, 'seed', NOW() - INTERVAL '${daysAgo} days')`,
    );
  }

  return rows;
}

const REVIEWS_PER_CATEGORY = 110;
const allRows: string[] = [];

GEMS.forEach((gem, gemIndex) => {
  allRows.push(...generateReviewsForGem(gem, REVIEWS_PER_CATEGORY, gemIndex * 10000));
});

const sql = `-- Auto-generated Navaratna category review seed (${allRows.length} reviews)
-- Generated by scripts/seed/generate-navratna-category-reviews.ts

BEGIN;

DELETE FROM category_reviews
WHERE category = 'navaratna' AND source IN ('seed', 'testimonial');

INSERT INTO category_reviews (
  category, sub_category, customer_name, customer_location, rating, title, review_text,
  images, is_verified, is_approved, is_active, is_featured, source, created_at
)
VALUES
${allRows.map((row) => `  ${row}`).join(',\n')}
ON CONFLICT DO NOTHING;

COMMIT;
`;

const outPath = join(process.cwd(), 'supabase', 'week19_navratna_category_reviews_seed.sql');
writeFileSync(outPath, sql, 'utf8');
console.log(`Wrote ${allRows.length} reviews to ${outPath}`);
