/**
 * yagyas/yagya-content.ts
 *
 * Generates rich, admin-editable seed content (HTML description, benefits,
 * short description) for each Vedic Yagya. The intro paragraph is shared across
 * the Navagraha (nine-planet) yagyas — exactly as on the legacy .com page — and
 * each deity/planet contributes its own significance + benefits block.
 *
 * This content is written into public.products at seed time; afterwards it is
 * fully editable from the admin panel (price / description / image / status).
 */

export type YagyaSeedEntry = {
  name: string;
  subtitle: string;
  planet: string;
  variant: string;
  price: number;
  image: string;
  legacySlug: string;
  buyNow: string;
};

type DeityContent = {
  /** Significance paragraph describing the planet/deity. */
  significance: string;
  /** Bullet benefits delivered by the yagya. */
  benefits: string[];
};

const NAVAGRAHA_PLANETS = new Set(['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']);

const SHARED_INTRO = `According to Vedic astrology, the nine planets (Navagraha) influence every aspect of our lives. When a planet is weak, afflicted or badly placed in a horoscope, it can create obstacles in health, career, relationships and prosperity. A Shanti Yagya is an ancient Vedic fire ritual (havan) performed by learned pandits to pacify the concerned planet and harmonise its energies for the native.`;

const HOW_IT_WORKS = `<h3>How does the Yagya work?</h3>
<p>Once your order is placed, our team collects your name, gotra and birth details. On an auspicious muhurat, qualified Vedic pandits perform the Sankalp, recitation of the prescribed mantras, and the sacred fire offering (havan) on your behalf. After completion you receive the ritual details and the blessed prasad / energised item is dispatched to your address.</p>`;

const DEITY_CONTENT: Record<string, DeityContent> = {
  Sun: {
    significance:
      'The Sun (Surya) governs the soul, vitality, authority, confidence and the father. A strong Sun bestows leadership, good health and recognition from government and authority figures.',
    benefits: [
      'Strengthens vitality, confidence and overall health',
      'Improves prospects of authority, status and government favour',
      'Supports eyesight, bones and heart health',
      'Harmonises the relationship with the father and elders',
    ],
  },
  Moon: {
    significance:
      'The Moon (Chandra) rules the mind, emotions, peace and the mother. A balanced Moon grants emotional stability, mental calm and nurturing relationships.',
    benefits: [
      'Brings mental peace and emotional stability',
      'Reduces anxiety, mood swings and restlessness',
      'Improves the wellbeing of and bond with the mother',
      'Supports harmony in close relationships',
    ],
  },
  Mars: {
    significance:
      'Mars (Mangal) governs courage, energy, land, property and siblings. A well-placed Mars grants drive, determination and protection from accidents and conflicts.',
    benefits: [
      'Builds courage, stamina and decisiveness',
      'Helps pacify Mangal / Manglik dosha for marriage',
      'Supports gains from land and property matters',
      'Relief from disputes, debts and aggression',
    ],
  },
  Mercury: {
    significance:
      'Mercury (Budh) rules intellect, communication, commerce and education. A strong Mercury sharpens the mind, speech and business acumen.',
    benefits: [
      'Enhances intellect, memory and communication',
      'Supports success in business, trade and education',
      'Improves analytical and decision-making ability',
      'Helps with nervous-system and skin-related concerns',
    ],
  },
  Jupiter: {
    significance:
      'Jupiter (Guru) is the planet of wisdom, wealth, marriage, children and spirituality. A benefic Jupiter bestows knowledge, fortune and righteous growth.',
    benefits: [
      'Attracts wisdom, prosperity and good fortune',
      'Supports timely marriage and progeny',
      'Encourages spiritual growth and ethical conduct',
      'Aids success in education and higher learning',
    ],
  },
  Venus: {
    significance:
      'Venus (Shukra) governs love, marriage, luxury, beauty and the arts. A strong Venus brings comfort, harmony in relationships and material refinement.',
    benefits: [
      'Promotes harmony, love and marital happiness',
      'Attracts comforts, luxury and vehicles',
      'Supports talent in arts, music and creativity',
      'Enhances charm, beauty and personal magnetism',
    ],
  },
  Saturn: {
    significance:
      'Saturn (Shani) rules discipline, career, longevity and karma. Pacifying Saturn brings relief during Sade Sati and Dhaiya and stabilises long-term effort.',
    benefits: [
      'Relief during Sade Sati and Shani Dhaiya',
      'Brings stability and steady progress in career',
      'Removes chronic obstacles and delays',
      'Supports discipline, patience and longevity',
    ],
  },
  Rahu: {
    significance:
      'Rahu is a shadow planet associated with ambition, sudden events, foreign connections and hidden matters. Pacifying Rahu reduces confusion and unexpected setbacks.',
    benefits: [
      'Reduces confusion, fear and sudden setbacks',
      'Protects from hidden enemies and deception',
      'Supports opportunities in foreign lands and unconventional fields',
      'Brings clarity of thought and mental steadiness',
    ],
  },
  Ketu: {
    significance:
      'Ketu is a shadow planet linked to detachment, spirituality and liberation (moksha). Pacifying Ketu eases unexplained difficulties and supports inner growth.',
    benefits: [
      'Eases unexplained fears and obstacles',
      'Supports spiritual progress and liberation',
      'Protects health and removes negative influences',
      'Brings intuition, focus and inner clarity',
    ],
  },
  Shiva: {
    significance:
      'Lord Shiva is the supreme deity of transformation, health and inner peace. Rituals devoted to Shiva remove negativity, grant good health and bestow protection and prosperity.',
    benefits: [
      'Promotes good health, longevity and recovery from illness',
      'Removes negativity and spiritual obstacles',
      'Bestows peace of mind and protection',
      'Invites prosperity and divine blessings',
    ],
  },
  Durga: {
    significance:
      'Maa Durga is the divine mother and protector who grants victory over adversity. The Durga Saptashati Yagya invokes her grace for strength, protection and removal of obstacles.',
    benefits: [
      'Provides divine protection from negative forces',
      'Grants victory over enemies and adversity',
      'Removes obstacles and fulfils sincere wishes',
      'Bestows courage, strength and prosperity',
    ],
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function variantNote(entry: YagyaSeedEntry): string {
  switch (entry.variant) {
    case 'beej-mantra':
      return 'This is the <strong>Beej Mantra</strong> variant, performed with the concentrated seed (beej) mantra of the planet for an intensified effect.';
    case '11000-jaap':
      return 'This package includes <strong>11,000 Jaap</strong> (mantra recitations) of the MahaMrityunjay mantra followed by the havan.';
    case '31000-jaap':
      return 'This package includes <strong>31,000 Jaap</strong> (mantra recitations) of the MahaMrityunjay mantra followed by the havan.';
    case '51000-jaap':
      return 'This package includes <strong>51,000 Jaap</strong> (mantra recitations) of the MahaMrityunjay mantra followed by the havan.';
    case '125000-jaap':
      return 'This package includes <strong>1,25,000 Jaap</strong> (mantra recitations) of the MahaMrityunjay mantra followed by the havan.';
    default:
      return 'This is the classical <strong>Vedic Mantra</strong> variant, performed with the prescribed Vedic mantras and fire offering.';
  }
}

const MAHAMRITYUNJAY: DeityContent = {
  significance:
    'The MahaMrityunjay Mantra is one of the most powerful Vedic mantras dedicated to Lord Shiva. The MahaMrityunjay Yagya is performed for good health, longevity, recovery from serious illness and protection from untimely misfortune.',
  benefits: [
    'Supports recovery from illness and chronic ailments',
    'Promotes longevity and protection from untimely danger',
    'Brings mental peace, courage and positivity',
    'Removes fear and negative influences',
  ],
};

function resolveContent(entry: YagyaSeedEntry): DeityContent {
  if (entry.name.toLowerCase().includes('mahamrityunjay')) return MAHAMRITYUNJAY;
  return DEITY_CONTENT[entry.planet] ?? DEITY_CONTENT.Shiva;
}

export function buildShortDesc(entry: YagyaSeedEntry): string {
  return entry.subtitle;
}

export function buildBenefits(entry: YagyaSeedEntry): string[] {
  return resolveContent(entry).benefits;
}

export function buildDescriptionHtml(entry: YagyaSeedEntry): string {
  const content = resolveContent(entry);
  const blocks: string[] = [];
  blocks.push(`<p><strong>${escapeHtml(entry.name)}</strong> — ${escapeHtml(entry.subtitle)}.</p>`);
  if (NAVAGRAHA_PLANETS.has(entry.planet)) {
    blocks.push(`<p>${SHARED_INTRO}</p>`);
  }
  blocks.push(`<p>${content.significance}</p>`);
  blocks.push(`<p>${variantNote(entry)}</p>`);
  blocks.push('<h3>Benefits</h3>');
  blocks.push(`<ul>${content.benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`);
  blocks.push(HOW_IT_WORKS);
  return blocks.join('\n');
}
