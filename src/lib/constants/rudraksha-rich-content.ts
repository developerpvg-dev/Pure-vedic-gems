// Rich, long-form content for each Mukhi Rudraksha guide.
// Sourced and adapted from the legacy PureVedicGems site (now retired)
// so the new app does not depend on any old-site URLs.

import { RUDRAKSHA_LEGACY_GUIDES_15_21 } from './rudraksha-legacy-15-21';
import { rudrakshaMukhiImageByNumber } from './rudraksha-category-images';

export type MukhiBenefitGroup = {
  title: string;
  points?: string[];
  paragraphs?: string[];
};

export type MukhiRichGuide = {
  mukhi: number;
  slug: string; // matches RUDRAKSHA_GUIDES slug pattern: `${n}-mukhi`
  title: string; // e.g. "Fifteen (15) Mukhi Rudraksha"
  shortTitle: string;
  heroImage: string; // local /rudraksha-knowledge/m15-hero.png style image OR fallback to /home/rudrakhshas images/...
  thumbImage: string; // small image for listings
  deity: string;
  planet: string;
  chakra?: string;
  beejMantra: string; // primary bead mantra (Sanskrit transliteration)
  poojaMantra?: string;
  intro: string; // 1-3 paragraphs
  benefitGroups: MukhiBenefitGroup[]; // Success / Spirituality / Health / Power / Properties
  whoCanWear?: string[];
  howToWear: string;
  closing: string; // short closing about authenticity / buying note
  shopHref: string;
  /** Uppercase H1 matching the legacy WordPress page (15–21 Mukhi guides). */
  legacyH1?: string;
  /** Full "where to buy" paragraph from the legacy page. */
  whereToBuy?: string;
  /** Optional conclusion paragraph shown after where-to-buy (e.g. 16 Mukhi). */
  conclusion?: string;
};

const HERO = (n: number) => `/rudraksha-knowledge/m${n}-hero.png`;
const cardImg = (mukhi: number) => rudrakshaMukhiImageByNumber(mukhi)!;

export const RUDRAKSHA_RICH_GUIDES: MukhiRichGuide[] = [
  {
    mukhi: 1,
    slug: '1-mukhi',
    title: 'One (1) Mukhi Rudraksha',
    shortTitle: '1 Mukhi Rudraksha',
    heroImage: cardImg(1),
    thumbImage: cardImg(1),
    deity: 'Lord Shiva',
    planet: 'Sun',
    chakra: 'Sahasrara (Crown Chakra)',
    beejMantra: 'Om Hreem Namah',
    poojaMantra: 'Om Namah Shivaya',
    intro:
      'One Mukhi Rudraksha is the rarest and most revered bead among all the Rudrakshas. It is considered to be a direct symbol of Lord Shiva himself and is associated with the Sun, the king of all planets. The wearer of an authentic One Mukhi Rudraksha is believed to attain single-pointed focus, leadership, abundance and rapid progress on the spiritual path.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Awakens leadership, courage and authority in personal and professional life.',
          'Balances the malefic influence of Sun and supports career, government and administrative roles.',
          'Helps the wearer rise above mediocrity and pursue purpose-driven goals.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Activates the Sahasrara (Crown) chakra and supports deep meditation.',
          'Helps the seeker move from worldly attachments toward Self-realisation.',
          'Considered the supreme bead for renunciants, yogis and devotees of Shiva.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Traditionally said to support the heart, eyes and overall vitality.',
          'Helps regulate blood pressure and bring mental calmness.',
          'Reduces stress, anxiety and emotional turbulence.',
        ],
      },
    ],
    howToWear:
      'After purification with Gangajal, energise the bead on a Monday at sunrise facing east. Chant "Om Namah Shivaya" 108 times, then wear in white or red silk thread or capped in silver or gold around the neck.',
    closing:
      'One Mukhi Rudraksha is extremely rare. Always buy from an experienced, certified seller with lab and X-ray verification. Pure Vedic Gems offers in-house Vedic purification and energisation as per ancient rituals.',
    shopHref: '/rudraksha/1-mukhi',
  },
  {
    mukhi: 2,
    slug: '2-mukhi',
    title: 'Two (2) Mukhi Rudraksha',
    shortTitle: '2 Mukhi Rudraksha',
    heroImage: cardImg(2),
    thumbImage: cardImg(2),
    deity: 'Ardhanarishwar (Shiva-Shakti)',
    planet: 'Moon',
    chakra: 'Anahata (Heart Chakra)',
    beejMantra: 'Om Namah',
    poojaMantra: 'Om Namah Shivaya',
    intro:
      'Two Mukhi Rudraksha represents the union of Shiva and Shakti in the form of Ardhanarishwar. It is governed by the Moon and is highly recommended for harmony in relationships, emotional balance and a peaceful family life.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Strengthens partnerships in marriage, family and business.',
          'Improves communication, empathy and emotional stability.',
          'Brings unity between estranged couples and family members.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Opens the Anahata (heart) chakra and develops devotion.',
          'Pacifies a restless mind and helps the seeker move into stillness.',
          'Considered ideal for those practising bhakti yoga.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to balance hormonal cycles and emotional swings.',
          'Helps with insomnia, anxiety and depression.',
          'Supports kidney, lung and lymphatic health in traditional texts.',
        ],
      },
    ],
    howToWear:
      'Wear on a Monday after washing the bead with Gangajal. Chant "Om Namah" 108 times. Best worn in silver, panchdhatu or white silk thread close to the heart.',
    closing:
      'Confirm clean lines and authentic Nepal or Indonesian origin. Always insist on lab verification for high-grade beads.',
    shopHref: '/rudraksha/2-mukhi',
  },
  {
    mukhi: 3,
    slug: '3-mukhi',
    title: 'Three (3) Mukhi Rudraksha',
    shortTitle: '3 Mukhi Rudraksha',
    heroImage: cardImg(3),
    thumbImage: cardImg(3),
    deity: 'Agni (Fire God)',
    planet: 'Mars',
    chakra: 'Manipura (Solar Plexus)',
    beejMantra: 'Om Kleem Namah',
    intro:
      'Three Mukhi Rudraksha is governed by Agni, the fire god, and is ruled by Mars. It is a powerful bead for releasing past karmas, building self-confidence and giving the wearer the courage to start fresh.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Boosts courage, confidence and decisive action.',
          'Helpful in sports, defence, surgery, leadership and entrepreneurship.',
          'Removes guilt and inferiority complexes that hold the wearer back.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Purifies past karma in the way fire purifies offerings.',
          'Builds inner heat (tapas) needed for sadhana and yoga.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to help digestion, metabolism and recovery from chronic illness.',
          'Useful for those with low energy, weak immunity or blood-related issues.',
          'Traditionally associated with relief from skin and liver disorders.',
        ],
      },
    ],
    howToWear:
      'Wear on a Tuesday after purification with Gangajal. Chant "Om Kleem Namah" 108 times. Use red silk thread, copper or gold capping.',
    closing:
      'Mars beads should be sized and shaped well. Always verify mukhi lines and choose a healthy, dense bead.',
    shopHref: '/rudraksha/3-mukhi',
  },
  {
    mukhi: 4,
    slug: '4-mukhi',
    title: 'Four (4) Mukhi Rudraksha',
    shortTitle: '4 Mukhi Rudraksha',
    heroImage: cardImg(4),
    thumbImage: cardImg(4),
    deity: 'Lord Brahma',
    planet: 'Mercury',
    chakra: 'Vishuddha (Throat)',
    beejMantra: 'Om Hreem Namah',
    intro:
      'Four Mukhi Rudraksha is ruled by Lord Brahma, the creator, and the planet Mercury. It is the bead of learning, communication, creativity and clear thinking — strongly recommended for students, teachers, writers and researchers.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Sharpens intellect, memory and analytical skills.',
          'Highly beneficial for students preparing for examinations.',
          'Supports careers in education, media, law, accounting and research.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Awakens creative intelligence and intuitive clarity.',
          'Strengthens the throat chakra for honest, fearless speech.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Traditionally helps with speech disorders, stammering and respiratory issues.',
          'Supports the nervous system and reduces mental fatigue.',
        ],
      },
    ],
    howToWear:
      'Wear on a Wednesday after purification. Chant "Om Hreem Namah" 108 times. Wear in green silk, silver or gold.',
    closing:
      'Combine with study habits and pranayama for best results. Verify mukhi count and natural lines before purchase.',
    shopHref: '/rudraksha/4-mukhi',
  },
  {
    mukhi: 5,
    slug: '5-mukhi',
    title: 'Five (5) Mukhi Rudraksha',
    shortTitle: '5 Mukhi Rudraksha',
    heroImage: cardImg(5),
    thumbImage: cardImg(5),
    deity: 'Kalagni Rudra (Lord Shiva)',
    planet: 'Jupiter',
    chakra: 'Vishuddha (Throat)',
    beejMantra: 'Om Hreem Namah',
    intro:
      'Five Mukhi Rudraksha is the most commonly available and most powerful bead for daily spiritual practice. Ruled by Jupiter and presided over by Kalagni Rudra, it is the bead of universal harmony, learning and good health.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Brings stability, prosperity and growth in career.',
          'Recommended for anyone seeking peace of mind and clear decision making.',
          'Excellent for daily wear by students, teachers and seekers.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Foundational bead for sadhana — used in malas of 108 beads.',
          'Helps awaken intuition and devotion.',
          'Considered the bead of Shiva himself for daily worship.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to regulate blood pressure and heart rate.',
          'Reduces stress, anxiety and obesity related concerns.',
          'Supports liver, kidney and overall metabolic health.',
        ],
      },
    ],
    howToWear:
      'Wear on a Thursday after Gangajal purification. Chant "Om Hreem Namah" 108 times. Best worn in a mala close to the body or in gold/silver capping.',
    closing:
      'Five Mukhi is the most widely available bead — choose only natural Nepal origin beads with clean mukhi lines and verified authenticity.',
    shopHref: '/rudraksha/5-mukhi',
  },
  {
    mukhi: 6,
    slug: '6-mukhi',
    title: 'Six (6) Mukhi Rudraksha',
    shortTitle: '6 Mukhi Rudraksha',
    heroImage: cardImg(6),
    thumbImage: cardImg(6),
    deity: 'Lord Kartikeya',
    planet: 'Venus',
    chakra: 'Svadhisthana (Sacral)',
    beejMantra: 'Om Hreem Hum Namah',
    intro:
      'Six Mukhi Rudraksha is ruled by Lord Kartikeya, the warrior son of Shiva, and is governed by the planet Venus. It is the bead of discipline, beauty, charisma and refined willpower.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Enhances confidence, attractiveness and personal charisma.',
          'Brings success in artistic, luxurious or creative professions.',
          'Helps in building lasting relationships and marital harmony.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Balances Venus to channel desire into refined, conscious action.',
          'Builds discipline and self-control on the spiritual path.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to support reproductive and urinary systems.',
          'Useful for those with eye, throat and skin concerns.',
        ],
      },
    ],
    howToWear:
      'Wear on a Friday after purification with Gangajal. Chant "Om Hreem Hum Namah" 108 times. Use white silk thread, silver or panchdhatu.',
    closing:
      'Six Mukhi beads should be visually clean and well-rounded. Verify origin and certification.',
    shopHref: '/rudraksha/6-mukhi',
  },
  {
    mukhi: 7,
    slug: '7-mukhi',
    title: 'Seven (7) Mukhi Rudraksha',
    shortTitle: '7 Mukhi Rudraksha',
    heroImage: cardImg(7),
    thumbImage: cardImg(7),
    deity: 'Goddess Mahalakshmi',
    planet: 'Saturn',
    chakra: 'Svadhisthana (Sacral)',
    beejMantra: 'Om Hum Namah',
    intro:
      'Seven Mukhi Rudraksha is blessed by Goddess Mahalakshmi and ruled by Saturn. It is one of the most recommended beads for wealth, financial discipline and overcoming Saturn-related obstacles (Sade Sati, Dhaiya, Kantak Shani).',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Brings sustained wealth, business growth and savings discipline.',
          'Reduces malefic effects of Saturn including delays and obstacles.',
          'Useful for entrepreneurs, traders and those in long-term careers.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Develops patience, responsibility and endurance.',
          'Supports devotion to Mahalakshmi and right effort.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Helps with chronic ailments, joint pain and muscular tension.',
          'Supports recovery from long-standing diseases linked to Saturn.',
        ],
      },
    ],
    howToWear:
      'Wear on a Saturday after Gangajal purification. Chant "Om Hum Namah" 108 times. Use black, blue or purple silk thread, silver or panchdhatu.',
    closing:
      'Authentic 7 Mukhi beads should be evenly textured. Verify with a reputable lab certificate.',
    shopHref: '/rudraksha/7-mukhi',
  },
  {
    mukhi: 8,
    slug: '8-mukhi',
    title: 'Eight (8) Mukhi Rudraksha',
    shortTitle: '8 Mukhi Rudraksha',
    heroImage: cardImg(8),
    thumbImage: cardImg(8),
    deity: 'Lord Ganesha',
    planet: 'Rahu',
    chakra: 'Muladhara (Root)',
    beejMantra: 'Om Hum Namah',
    intro:
      'Eight Mukhi Rudraksha is governed by Lord Ganesha — the remover of obstacles — and the shadow planet Rahu. It is the bead for those facing repeated obstacles, confusion or sudden disruptions in life.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Removes obstacles and grants smooth beginnings to new ventures.',
          'Calms the malefic effects of Rahu — fear, anxiety, confusion.',
          'Highly recommended for writers, artists and creative entrepreneurs.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Strengthens grounding and stability on the spiritual path.',
          'Helps cut through illusions, fears and addictions.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to help with skin disorders, paralysis and nervous-system issues.',
          'Supports recovery from sudden or mysterious illnesses.',
        ],
      },
    ],
    howToWear:
      'Wear on a Saturday after purification. Chant "Om Ganeshaya Namah" or "Om Hum Namah" 108 times. Best worn in panchdhatu or silver.',
    closing:
      'Always source 8 Mukhi from trusted sellers — fake or carved beads are common in this mukhi.',
    shopHref: '/rudraksha/8-mukhi',
  },
  {
    mukhi: 9,
    slug: '9-mukhi',
    title: 'Nine (9) Mukhi Rudraksha',
    shortTitle: '9 Mukhi Rudraksha',
    heroImage: cardImg(9),
    thumbImage: cardImg(9),
    deity: 'Goddess Durga',
    planet: 'Ketu',
    chakra: 'Manipura (Solar Plexus)',
    beejMantra: 'Om Hreem Hum Namah',
    intro:
      'Nine Mukhi Rudraksha is blessed by Goddess Durga and governed by Ketu. It is one of the most powerful protective beads, granting fearlessness, strength and victory over enemies and negative energies.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Builds courage, determination and willpower.',
          'Helps overcome enemies, hidden threats and Ketu-related disturbances.',
          'Recommended for soldiers, leaders and those in high-risk professions.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Develops Shakti — divine feminine power.',
          'Strengthens devotion to the Mother Goddess.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to help with skin issues, abdominal pain and bone health.',
          'Useful for women during menstrual or hormonal imbalance.',
        ],
      },
    ],
    howToWear:
      'Wear on a Tuesday after purification. Chant "Om Hreem Hum Namah" 108 times. Use red silk thread, silver or gold.',
    closing:
      'Choose a healthy bead with clearly defined nine lines. Lab certification is recommended.',
    shopHref: '/rudraksha/9-mukhi',
  },
  {
    mukhi: 10,
    slug: '10-mukhi',
    title: 'Ten (10) Mukhi Rudraksha',
    shortTitle: '10 Mukhi Rudraksha',
    heroImage: cardImg(10),
    thumbImage: cardImg(10),
    deity: 'Lord Vishnu',
    planet: 'No specific planet — pacifies all nine',
    chakra: 'All Chakras',
    beejMantra: 'Om Hreem Namah',
    poojaMantra: 'Om Namo Bhagavate Vasudevaya',
    intro:
      'Ten Mukhi Rudraksha is ruled by Lord Vishnu, the preserver of the universe. It is said to pacify all nine planets and acts as a powerful shield against negative energies, black magic and evil spirits.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Provides 360° protection from negative influences and ill-wishers.',
          'Resolves multi-planet imbalances when specific dosha is unclear.',
          'Helps with court cases, legal matters and disputes.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Connects the wearer to the protective energy of Lord Vishnu.',
          'Stabilises the mind for daily devotion and meditation.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Traditionally said to ward off psychic and energetic disturbances.',
          'Supports overall mental peace and emotional security.',
        ],
      },
    ],
    howToWear:
      'Wear on a Thursday after purification. Chant "Om Hreem Namah" 108 times. Wear in silver or yellow silk thread.',
    closing:
      'Ten Mukhi is a popular protection bead — verify with X-ray and lab certification.',
    shopHref: '/rudraksha/10-mukhi',
  },
  {
    mukhi: 11,
    slug: '11-mukhi',
    title: 'Eleven (11) Mukhi Rudraksha',
    shortTitle: '11 Mukhi Rudraksha',
    heroImage: cardImg(11),
    thumbImage: cardImg(11),
    deity: 'Lord Hanuman / Ekadash Rudra',
    planet: 'Meditative protection',
    chakra: 'Vishuddha (Throat)',
    beejMantra: 'Om Hreem Hum Namah',
    poojaMantra: 'Om Namah Shivaya',
    intro:
      'Eleven Mukhi Rudraksha represents the eleven forms of Rudra and is also associated with Lord Hanuman. It is the bead of courage, devotion and disciplined spiritual practice.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Builds courage, wisdom and a strong sense of righteousness.',
          'Helps in adversity, travel and decision-making.',
          'Brings success to those engaged in yoga, healing and service.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Strengthens devotion (bhakti) and self-discipline.',
          'Supports those undertaking long sadhanas and fasts.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to help with chronic pain, posture and body alignment.',
          'Useful for those recovering from accidents and long illness.',
        ],
      },
    ],
    howToWear:
      'Wear on a Monday or Tuesday after purification. Chant "Om Hreem Hum Namah" or "Om Namah Shivaya" 108 times. Use red silk thread or silver capping.',
    closing:
      'Choose a bead with well-defined mukhi lines and confirm with lab certification.',
    shopHref: '/rudraksha/11-mukhi',
  },
  {
    mukhi: 12,
    slug: '12-mukhi',
    title: 'Twelve (12) Mukhi Rudraksha',
    shortTitle: '12 Mukhi Rudraksha',
    heroImage: cardImg(12),
    thumbImage: cardImg(12),
    deity: 'Surya Dev (Sun God)',
    planet: 'Sun',
    chakra: 'Manipura (Solar Plexus)',
    beejMantra: 'Aum Kraum Sraum Raum Surya Namah',
    intro:
      'Twelve Mukhi Rudraksha is governed by Surya, the Sun God, and represents the twelve Adityas. It bestows radiance, leadership and the courage to lead from the front.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Brings name, fame and authority — ideal for leaders, politicians and CEOs.',
          'Enhances self-belief, charisma and visibility.',
          'Strengthens a weak Sun in the birth chart.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Connects the wearer to the solar consciousness.',
          'Builds discipline of action and the willpower needed for tapas.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Supports the eyes, bones and heart in traditional texts.',
          'Useful for those with low vitality, weak digestion or chronic fatigue.',
        ],
      },
    ],
    howToWear:
      'Wear on a Sunday at sunrise after purification. Chant the Surya beej mantra 108 times. Use red or saffron silk thread or gold capping.',
    closing:
      'Premium 12 Mukhi beads are increasingly rare — always insist on lab and X-ray verification.',
    shopHref: '/rudraksha/12-mukhi',
  },
  {
    mukhi: 13,
    slug: '13-mukhi',
    title: 'Thirteen (13) Mukhi Rudraksha',
    shortTitle: '13 Mukhi Rudraksha',
    heroImage: cardImg(13),
    thumbImage: cardImg(13),
    deity: 'Indra & Kamadeva',
    planet: 'Venus',
    chakra: 'Ajna (Third Eye)',
    beejMantra: 'Om Hreem Namah',
    intro:
      'Thirteen Mukhi Rudraksha is blessed by Lord Indra and Kamadeva. It is a rare and powerful bead said to fulfil refined material and worldly desires through dignified means.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Brings charm, attractiveness and persuasive power.',
          'Useful in sales, diplomacy, art, entertainment and luxury businesses.',
          'Strengthens Venus and helps in marital harmony.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Transmutes desire into refined, conscious creative power.',
          'Develops aesthetic appreciation and sensitivity.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to help with hormonal and reproductive health.',
          'Useful for those struggling with low confidence or appearance issues.',
        ],
      },
    ],
    howToWear:
      'Wear on a Friday after Gangajal purification. Chant "Om Hreem Namah" 108 times. Use white or pink silk thread, silver or gold.',
    closing:
      'Thirteen Mukhi is highly desirable and often imitated — only buy with verified lab certification.',
    shopHref: '/rudraksha/13-mukhi',
  },
  {
    mukhi: 14,
    slug: '14-mukhi',
    title: 'Fourteen (14) Mukhi Rudraksha',
    shortTitle: '14 Mukhi Rudraksha',
    heroImage: cardImg(14),
    thumbImage: cardImg(14),
    deity: 'Lord Hanuman / Devmani',
    planet: 'Saturn & Mars traditions',
    chakra: 'Ajna (Third Eye)',
    beejMantra: 'Om Namah',
    intro:
      'Fourteen Mukhi Rudraksha — also known as Devmani — is considered the rarest and most divine of all single-mukhi varieties. It is said to grant intuitive vision, protection from accidents and supreme decision-making power.',
    benefitGroups: [
      {
        title: 'Benefits for Success',
        points: [
          'Sharpens intuition and the power to see beyond the obvious.',
          'Helps make right decisions in crisis and high-stakes moments.',
          'Highly recommended for surgeons, judges, founders and decision makers.',
        ],
      },
      {
        title: 'Benefits for Spirituality',
        points: [
          'Activates the third eye (Ajna) and inner vision.',
          'Strongest bead for protection during deep sadhana.',
        ],
      },
      {
        title: 'Benefits for Health',
        points: [
          'Said to protect against accidents and sudden harm.',
          'Helps with chronic mental stress and burnout.',
        ],
      },
    ],
    howToWear:
      'Wear on a Monday after purification. Chant "Om Namah" or "Om Namah Shivaya" 108 times. Wear in silver or gold setting around the neck.',
    closing:
      '14 Mukhi (Devmani) is extremely rare and very valuable — only buy with full X-ray and lab verification.',
    shopHref: '/rudraksha/14-mukhi',
  },
  ...RUDRAKSHA_LEGACY_GUIDES_15_21,

];

export function getRichRudrakshaGuide(slug: string): MukhiRichGuide | null {
  const normalized = /^\d+$/.test(slug) ? `${slug}-mukhi` : slug;
  return RUDRAKSHA_RICH_GUIDES.find((g) => g.slug === normalized) ?? null;
}

// -----------------------------------------------------------------------------
// Rudraksha Qualities page content (long-form, ported from old site)
// -----------------------------------------------------------------------------

export type QualityTier = {
  name: string;
  badge: string;
  color: string;
  description: string;
};

export const RUDRAKSHA_QUALITY_TIERS: QualityTier[] = [
  {
    name: 'High Quality',
    badge: 'Premium',
    color: '#4D0A0A',
    description:
      'Available in chocolate or brown colour (sometimes dark reddish brown). Perfectly shaped, with prominent, clear and well-defined outer texture and design. Considered superior in quality.',
  },
  {
    name: 'Medium Quality',
    badge: 'Standard',
    color: '#B8861E',
    description:
      'Light brown in colour with good shape and quite well-defined outer texture. Resembles the colour of almonds; sometimes available in dusty shades.',
  },
  {
    name: 'Lower Quality',
    badge: 'Basic',
    color: '#6B5B4E',
    description:
      'Often white and dull in colour with uneven shapes and very vague or unclear outer texture. Occasionally available in light brown shades.',
  },
];

export type RudrakshaTypeRow = {
  mukhi: string;
  deity: string;
  planet: string;
  mantra: string;
  slug?: string; // links to /knowledge/rudraksha/<slug>
};

/** Mukhi reference table — matches legacy rudraksha-qualities page exactly. */
export const RUDRAKSHA_TYPE_TABLE: RudrakshaTypeRow[] = [
  { mukhi: '#1 Mukhi', deity: 'Shiva', planet: 'Sun', mantra: 'Om Hreem Namah', slug: '1-mukhi' },
  { mukhi: '#2 Mukhi', deity: 'Ardhnareeshwar', planet: 'Moon', mantra: 'Om Namah', slug: '2-mukhi' },
  { mukhi: '#3 Mukhi', deity: 'Agni', planet: 'Mars', mantra: 'Om Kleem Namah', slug: '3-mukhi' },
  { mukhi: '#4 Mukhi', deity: 'Brahma', planet: 'Mercury', mantra: 'Om Hreem Namah', slug: '4-mukhi' },
  { mukhi: '#5 Mukhi', deity: 'Kalaagni Rudra', planet: 'Jupiter', mantra: 'Om Hreem Namah', slug: '5-mukhi' },
  { mukhi: '#6 Mukhi', deity: 'Kartikeya', planet: 'Venus', mantra: 'Om Hreem Hum Namah', slug: '6-mukhi' },
  { mukhi: '#7 Mukhi', deity: 'Mahalaxmi', planet: 'Saturn', mantra: 'Om Hum Namah', slug: '7-mukhi' },
  { mukhi: '#8 Mukhi', deity: 'Ganesh', planet: 'Rahu', mantra: 'Om Hum Namah', slug: '8-mukhi' },
  { mukhi: '#9 Mukhi', deity: 'Durga', planet: 'Ketu', mantra: 'Om Hreem Hum Namah', slug: '9-mukhi' },
  { mukhi: '#10 Mukhi', deity: 'Vishnu', planet: 'None', mantra: 'Om Hreem Namah', slug: '10-mukhi' },
  { mukhi: '#11 Mukhi', deity: 'Hanuman', planet: 'None', mantra: 'Om Hreem Hum Namah', slug: '11-mukhi' },
  { mukhi: '#12 Mukhi', deity: 'Sun god', planet: 'Sun', mantra: 'Aum Kraum Sraum Raum Surya Namah', slug: '12-mukhi' },
  { mukhi: '#13 Mukhi', deity: 'Indra', planet: 'Venus', mantra: 'Om Hreem Namah', slug: '13-mukhi' },
  { mukhi: '#14 Mukhi', deity: 'Hanuman', planet: 'Saturn', mantra: 'Om Namah', slug: '14-mukhi' },
  { mukhi: '#16 Mukhi', deity: 'Lord Ram', planet: 'None', mantra: 'Om Hreem Shivaya', slug: '16-mukhi' },
  { mukhi: '#17 Mukhi', deity: 'Vishvakarma', planet: 'None', mantra: 'Om Namah Shivaya', slug: '17-mukhi' },
  { mukhi: '#19 Mukhi', deity: 'Lord Narayana', planet: 'None', mantra: 'Om Namah Shivaya', slug: '19-mukhi' },
  { mukhi: '#20 Mukhi', deity: 'Vishwasu Sadhu & Narayan', planet: 'None', mantra: 'Om Namah Shivaya', slug: '20-mukhi' },
  { mukhi: '#21 Mukhi', deity: 'EkAlakh Niranjan that is Omkar & Narayan', planet: 'None', mantra: 'Om Namah Shivaya', slug: '21-mukhi' },
  { mukhi: '#Gauri Shankar', deity: 'Shiva & Parvati', planet: 'None', mantra: 'Om Namah Shivaya' },
];

export type RudrakshaFaq = { question: string; answer: string };

export const RUDRAKSHA_FAQS: RudrakshaFaq[] = [
  {
    question: 'What is rudraksha?',
    answer:
      'Rudraksha is a popular seed of a tree known as Elaeocarpus Ganitrus. It has been a significant part of human life since its origin. Rudrakshas are considered as tears of God Shiva. These beads are not only used as jewellery but also as a sacred astrological remedy. As per Vedic astrology, each rudraksha bead is associated with a planet, and wearing a specific bead as per their birth chart analysis under the guidance of a knowledgeable astrologer provides various benefits such as better career opportunities, health, healthy relationships, and so on.',
  },
  {
    question: 'What is natural rudraksha?',
    answer:
      'Natural rudrakshas are those rudrakshas which are neither treated nor chemically enhanced. These are mostly found in the Himalayan region, such as Nepal, Indonesia, Malaysia, and so on. Nepal origin rudrakshas are considered best for healing purposes. Before buying rudrakshas, one should contact a certified astro gemologist to choose natural quality rudrakshas.',
  },
  {
    question: 'How do I identify authentic quality rudrakshas?',
    answer:
      'In order to identify natural quality rudrakshas, one should consider their origin, colour, shape, size, weight, and so on. Nowadays, recognising an original rudraksha is a challenging task because of the availability of manufactured and fake ones in the market. That is why it is important to consult a qualified astro gemologist to choose the best quality of rudraksha beads.',
  },
  {
    question: 'What are the prices of natural quality rudraksha in India?',
    answer:
      'The prices of natural quality rudraksha depend on their origin, quality, number of Mukhis, colour, shape, size, and so on. The prices of rudrakshas in India range from some rupees to lakhs, depending on their quality.',
  },
  {
    question: 'Who can wear rudrakshas?',
    answer:
      'Anyone can wear rudraksha, whether you are looking for healing purposes or want to wear it as jewellery. However, to get an optimum healing result, one should consult an astrologer to analyse their birth chart to choose the most suitable Mukhi. Besides, you should also take help of astrogemologst to recognise the natural quality of the rudrakshas. In addition to this, you can also get the support of learned pandits to conduct Vedic rituals before wearing a rudraksha to get optimum benefits. We at Pure Vedic Gems always ensure to provide the best quality rudrakshas at a reasonable price.',
  },
  {
    question: 'Which country produces the best quality natural rudrakshas?',
    answer:
      'Nepal origin rudrakshas are considered the best quality in the world. Indonesia, Malaysia, and India are also the countries where Rudraksha beads are found.',
  },
  {
    question: 'How many types of rudrakshas available in the market?',
    answer:
      'Rudraksha beads range from 1 to 21 Mukhi. Each bead has its own significance in healing therapy. However, if you want optimum healing power from these sacred beads, you should conduct purification and energisation rituals under the guidance of a Vedic priest (pandit). We at Pure Vedic Gems can help you in conducting authentic Vedic rituals before wearing a rudraksha.',
  },
  {
    question: 'Why should I not wear broken rudraksha beads?',
    answer:
      'In order to get the healing effects of rudraksha beads, one should always wear a non-tempered bead. As per Vedic astrology, incomplete beads are not effective as a healing remedy.',
  },
  {
    question: 'Why is rudraksha a popular astrological remedy?',
    answer:
      'According to Vedic astrology, each rudraksha bead is associated with a specific planet, which is one of the significant factors to become a popular choice in astrology. These are considered as powerful protective remedies against negative energies. In order to get optimum astrological benefit from this remedy, one must analyse their birth chart with a knowledgeable astrologer to know the best suitable Mukhi and consult with an astro gemologist to choose a natural quality rudraksha.',
  },
  {
    question: 'Does rudraksha have any medicinal use?',
    answer:
      'Rudrakshas are considered as an effective treatment for diseases like blood pressure, anxiety, sleep disorders, skin problems, and many others. However, it is crucial to take it under the guidance of an expert to get its benefits. Nowadays, rudrakshas are mostly used for spiritual and astrological purposes.',
  },
  {
    question: 'Does rudraksha cause any harmful effects?',
    answer:
      'As per Vedic astrology, natural rudrakshas are a kind of Ayurvedic herb which does not harm. However, someone who has an allergy to metal or the thread in which it is built should consider it under the guidance of experts.',
  },
  {
    question: 'How should I wear rudrakshas?',
    answer:
      'In order to get optimum benefits from this remedy, you should consult a knowledgeable astrologer to choose the most suitable Mukhi as per your birth chart. You should get help from an astro gemologist to choose a natural quality rudraksh. Besides, one should also energise and purify rudrakshas under the guidance of Vedic priests (pandit) to harness its full potency.',
  },
  {
    question: 'How much time does it take to provide the results of wearing rudraksha?',
    answer:
      'It depends on individual to individual because each person has a specific planetary position in their birth chart. It is always recommended to consult a Vedic astrologer while wearing rudraksha for maximum healing benefits.',
  },
  {
    question: 'Can I share my rudrakshas with others?',
    answer:
      'As per Vedic astrology, rudrakshas absorb and carry the energies of the wearer because these beads tend to build personal connections with the wearer over time. Hence, wearing used rudraksha is prohibited in astrology.',
  },
  {
    question: 'How do I choose the best online store for rudraksha ?',
    answer:
      'While choosing the best online store for rudraksha, you should consider previous customer reviews and testimonials, images of rudraksha beads, refund and return policy, payment options, secured delivery, and so on.',
  },
  {
    question: 'How can I find a government certified rudraksha shop in delhi?',
    answer:
      'There is no government certified rudraksha shop in Delhi. However, you can find many companies which offer natural rudrakshas certified from government organisations. You should always prefer one of the oldest rudraksha sellers to ensure the quality. We at Pure Vedic Gems always ensure high quality natural rudrakshas at reasonable prices. You can shop natural quality rudrakshas at our Delhi outlet.',
  },
  {
    question: 'Where to buy original rudraksha online?',
    answer:
      'Pure Vedic Gems is one of the oldest rudraksha sellers in the market. We are a premium organisation, dedicated to delivery quality products. You can get the best quality Nepali rudrakshas from our online store at reasonable prices.',
  },
];
