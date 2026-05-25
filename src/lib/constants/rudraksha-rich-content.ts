// Rich, long-form content for each Mukhi Rudraksha guide.
// Sourced and adapted from the legacy PureVedicGems site (now retired)
// so the new app does not depend on any old-site URLs.

export type MukhiBenefitGroup = {
  title: string;
  points: string[];
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
};

const HERO = (n: number) => `/rudraksha-knowledge/m${n}-hero.png`;
const THUMB = (file: string) => `/home/rudrakhshas images/${file}`;

export const RUDRAKSHA_RICH_GUIDES: MukhiRichGuide[] = [
  {
    mukhi: 1,
    slug: '1-mukhi',
    title: 'One (1) Mukhi Rudraksha',
    shortTitle: '1 Mukhi Rudraksha',
    heroImage: THUMB('1Mukhi-150x150.webp'),
    thumbImage: THUMB('1Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/1-mukhi',
  },
  {
    mukhi: 2,
    slug: '2-mukhi',
    title: 'Two (2) Mukhi Rudraksha',
    shortTitle: '2 Mukhi Rudraksha',
    heroImage: THUMB('2Mukhi-150x150.webp'),
    thumbImage: THUMB('2Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/2-mukhi',
  },
  {
    mukhi: 3,
    slug: '3-mukhi',
    title: 'Three (3) Mukhi Rudraksha',
    shortTitle: '3 Mukhi Rudraksha',
    heroImage: THUMB('3Mukhi-150x150.webp'),
    thumbImage: THUMB('3Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/3-mukhi',
  },
  {
    mukhi: 4,
    slug: '4-mukhi',
    title: 'Four (4) Mukhi Rudraksha',
    shortTitle: '4 Mukhi Rudraksha',
    heroImage: THUMB('4Mukhi-150x150.webp'),
    thumbImage: THUMB('4Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/4-mukhi',
  },
  {
    mukhi: 5,
    slug: '5-mukhi',
    title: 'Five (5) Mukhi Rudraksha',
    shortTitle: '5 Mukhi Rudraksha',
    heroImage: THUMB('5Mukhi-150x150.webp'),
    thumbImage: THUMB('5Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/5-mukhi',
  },
  {
    mukhi: 6,
    slug: '6-mukhi',
    title: 'Six (6) Mukhi Rudraksha',
    shortTitle: '6 Mukhi Rudraksha',
    heroImage: THUMB('6Mukhi-150x150.webp'),
    thumbImage: THUMB('6Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/6-mukhi',
  },
  {
    mukhi: 7,
    slug: '7-mukhi',
    title: 'Seven (7) Mukhi Rudraksha',
    shortTitle: '7 Mukhi Rudraksha',
    heroImage: THUMB('7Mukhi-150x150.webp'),
    thumbImage: THUMB('7Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/7-mukhi',
  },
  {
    mukhi: 8,
    slug: '8-mukhi',
    title: 'Eight (8) Mukhi Rudraksha',
    shortTitle: '8 Mukhi Rudraksha',
    heroImage: THUMB('8Mukhi-150x150.webp'),
    thumbImage: THUMB('8Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/8-mukhi',
  },
  {
    mukhi: 9,
    slug: '9-mukhi',
    title: 'Nine (9) Mukhi Rudraksha',
    shortTitle: '9 Mukhi Rudraksha',
    heroImage: THUMB('9Mukhi-150x150.webp'),
    thumbImage: THUMB('9Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/9-mukhi',
  },
  {
    mukhi: 10,
    slug: '10-mukhi',
    title: 'Ten (10) Mukhi Rudraksha',
    shortTitle: '10 Mukhi Rudraksha',
    heroImage: THUMB('10Mukhi-150x150.webp'),
    thumbImage: THUMB('10Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/10-mukhi',
  },
  {
    mukhi: 11,
    slug: '11-mukhi',
    title: 'Eleven (11) Mukhi Rudraksha',
    shortTitle: '11 Mukhi Rudraksha',
    heroImage: THUMB('11Mukhi-150x150.webp'),
    thumbImage: THUMB('11Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/11-mukhi',
  },
  {
    mukhi: 12,
    slug: '12-mukhi',
    title: 'Twelve (12) Mukhi Rudraksha',
    shortTitle: '12 Mukhi Rudraksha',
    heroImage: THUMB('12Mukhi-150x150.webp'),
    thumbImage: THUMB('12Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/12-mukhi',
  },
  {
    mukhi: 13,
    slug: '13-mukhi',
    title: 'Thirteen (13) Mukhi Rudraksha',
    shortTitle: '13 Mukhi Rudraksha',
    heroImage: THUMB('13Mukhi-150x150.webp'),
    thumbImage: THUMB('13Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/13-mukhi',
  },
  {
    mukhi: 14,
    slug: '14-mukhi',
    title: 'Fourteen (14) Mukhi Rudraksha',
    shortTitle: '14 Mukhi Rudraksha',
    heroImage: THUMB('14Mukhi-150x150.webp'),
    thumbImage: THUMB('14Mukhi-150x150.webp'),
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
    shopHref: '/shop/rudraksha/14-mukhi',
  },
  // --- 15-21 are sourced directly from the old site's long-form content ---
  {
    mukhi: 15,
    slug: '15-mukhi',
    title: 'Fifteen (15) Mukhi Rudraksha',
    shortTitle: '15 Mukhi Rudraksha',
    heroImage: HERO(15),
    thumbImage: THUMB('15Mukhi--150x150.webp'),
    deity: 'Lord Pashupatinath',
    planet: 'Jupiter',
    beejMantra: 'Om Hreem Namah',
    intro:
      'The Lord of Fifteen (15) Mukhi Rudraksha is Lord Pashupatinath, the form of Lord Shiva, and the controlling planet is Jupiter. Blessed by Lord Shiva in his incarnation as Pashupati, the bead carries all the virtues of the 14 Mukhi Rudraksha and additionally offers luck in acquiring wealth. Pashupati — the lord of animals — gives life to all beings and takes it back at His will.',
    benefitGroups: [
      {
        title: 'Beneficial for Success',
        points: [
          'The wearer finds happiness in elevating themselves from worldly attachments and focuses on knowledge, success and spiritual growth.',
          'Awakens the full potential of the sixth sense — the mind — making the wearer a master of perception.',
          'Believed to increase visualisation and decision-making, growing wealth and good prospects.',
          'Helps channel thoughts in the right direction with tremendous clarity of purpose.',
          'Brings great calmness of mind that affects every sphere of life.',
          'Supports abstract and lateral thinking — useful in adverse situations.',
        ],
      },
      {
        title: 'Beneficial for Spirituality',
        points: [
          'Ruled by Pashupatinath Shiva, it detaches the wearer from desires and frees them from misery, pain and fear of loss.',
          'Sublimates animal tendencies in humans, helping them reach higher spiritual realms.',
          'Develops intuitive powers — the wearer often senses outcomes and acts at the right time.',
          'Shows the path towards Super-Consciousness, granting profound wisdom and knowledge.',
          'Aids dhyana / meditation and supports spiritual attainments.',
        ],
      },
      {
        title: 'Beneficial for Health',
        points: [
          'Helps regulate blood pressure and control anger.',
          'Provides a profound sense of calm that reduces stress drastically.',
          'Said to support cardiovascular health, asthma and respiratory illness.',
          'Useful in allergies, fever, mental stability and overall body health.',
        ],
      },
    ],
    howToWear:
      'Wear Fifteen (15) Mukhi Rudraksha around the neck or alternatively keep it in the place of worship. Chant "Om Namah Shivaya" nine (or 108) times before wearing.',
    closing:
      'Pure Vedic Gems has over four generations of experience sourcing authentic, energised Rudrakshas directly from origin. Every bead is supplied with a reputed lab certificate and is purified through traditional Vedic rituals.',
    shopHref: '/shop/rudraksha/15-mukhi',
  },
  {
    mukhi: 16,
    slug: '16-mukhi',
    title: 'Sixteen (16) Mukhi Rudraksha',
    shortTitle: '16 Mukhi Rudraksha',
    heroImage: HERO(16),
    thumbImage: THUMB('16Mukhi rudraksha.webp'),
    deity: 'Lord Ram (also revered as Mahakaal)',
    planet: 'Rahu (and Moon traditions)',
    chakra: 'Swadhisthana',
    beejMantra: 'Om Hreem Hum Namah',
    poojaMantra: 'Om Haum Joom Sah',
    intro:
      'The presiding Deity of the 16 Mukhi Rudraksha is Lord Ram and the controlling planet is Rahu. The bead is also considered a form of Lord Mahakaal — the Lord of Time. The wearer is said to triumph over time, fire, theft and ill fortune; homes blessed with this bead are believed to be safe from house fires, robbery and major calamities.',
    benefitGroups: [
      {
        title: 'Beneficial for Success',
        points: [
          'Known as the Jai Rudraksha — said to grant victory in court cases, legal entanglements and over adversaries.',
          'Brings respect and fame and helps overcome opponents.',
          'Excellent for those in import-export, pharmaceutical, chemical, aviation and travel industries.',
          'Particularly powerful for lawyers, litigants and those settled abroad.',
          'Believed to negate the malefic effects of Rahu.',
        ],
      },
      {
        title: 'Beneficial for Spirituality',
        points: [
          'Strengthens the Swadhisthana (sacral) chakra, the seat of the water element.',
          'Helps face the ups and downs of life with courage, calmness and fortitude.',
          'Supports a balanced life — fulfilling worldly duties while progressing spiritually.',
        ],
      },
      {
        title: 'Beneficial for Health',
        points: [
          'Said to help with kidney, intestine, uterus, ulcer and lower-back issues.',
          'Useful for urogenital diseases and chronic ailments.',
          'Provides relief from stomach, chest and gum problems and from water-borne diseases.',
        ],
      },
      {
        title: 'Power of 16 Mukhi Rudraksha',
        points: [
          'Frees the wearer from the anxiety of theft, injury, fire and accidental death.',
          'Said to bring the blessings even of Lord Yama (Lord of Death).',
          'Brings the benefit of regularly chanting the Maha Mrityunjaya Mantra.',
          'Carries the blessings of Lord Ram and victory in every endeavour.',
          'Spreads positive energy, harmony and prosperity in the home where it is installed.',
        ],
      },
    ],
    whoCanWear: [
      'Those facing long-running legal cases or disputes.',
      'People exposed to high-risk environments — travel, fire, theft.',
      'Anyone seeking to win over fears of loss, illness or death.',
      'Devotees of Lord Ram and seekers wanting victory in every field.',
    ],
    howToWear:
      'Wash the bead in Gangajal. On a Monday morning, bathe, wear clean clothes and sit facing east. Chant "Om Hreem Hoom Namah" or "Om Haum Joom Sah" 108 times with full focus. Wear in wool or silk thread, or capped in silver or gold around the neck or as a bracelet — or keep at the worship altar.',
    closing:
      '16 Mukhi may be worn singly or with other beads, in order to overcome adversaries and fear of death. Always purchase from a reputable, experienced seller — Pure Vedic Gems has been dealing in authentic Rudrakshas since 1937 and provides lab-certified, energised beads.',
    shopHref: '/shop/rudraksha/16-mukhi',
  },
  {
    mukhi: 17,
    slug: '17-mukhi',
    title: 'Seventeen (17) Mukhi Rudraksha',
    shortTitle: '17 Mukhi Rudraksha',
    heroImage: HERO(17),
    thumbImage: THUMB('17Mukhi rudraksha.webp'),
    deity: 'Lord Vishwakarma (and Lord Mahamritunjaya)',
    planet: 'Saturn',
    chakra: 'Ajna (Third Eye)',
    beejMantra: 'Om Kaam Kaam Katyayani Swaha',
    poojaMantra: 'Aum Hreem Hoom Hoom Naham',
    intro:
      'The presiding Deity of the 17 Mukhi Rudraksha is Lord Vishwakarma and Lord Mahamritunjaya, with Saturn as the controlling planet. The bead is also said to be inhabited by Goddess Katyayani — the sixth of the Navadurga — and is considered a boon especially for women, fulfilling wishes in regard to marriage, children, fortune and happiness. It is well known for removing the effects of Sade Sati.',
    benefitGroups: [
      {
        title: 'Beneficial for Success',
        points: [
          'Brings sudden wealth and luxury — useful for new ventures and expansion.',
          'Helps acquire property, vehicles and physical assets.',
          'Brings name and fame in society.',
          'Releases tension, grief, anger and emotional depression.',
          'Destroys past karma and limited beliefs.',
        ],
      },
      {
        title: 'Beneficial for Spirituality',
        points: [
          'Like Lord Vishwakarma the divine architect, the wearer becomes master of their fate.',
          'Said to grant Siddhis — intuition, telepathy, creative intelligence.',
          'Blessings of Lord Maha Mrityunjaya are said to destroy past karmas and free one from fear of death.',
        ],
      },
      {
        title: 'Beneficial for Health',
        points: [
          'Helps with memory lapses and bodily disorders.',
          'Cures respiratory issues, asthma and bronchial concerns.',
          'Provides relief from headaches, sinusitis and ENT related diseases.',
          'Useful for bone-related ailments and prostate health in males.',
        ],
      },
      {
        title: 'Chakra Activation',
        points: [
          'Associated with the Ajna Chakra (Third Eye / Brow centre).',
          'Helps cleanse and awaken the chakra for futuristic insight.',
        ],
      },
    ],
    howToWear:
      'Energise the bead before wearing. On a Saturday morning, bathe and sit facing east. With focused mind chant "Aum Kama Kam Katyayani Swaha" and "Aum Hreem Hoom Hoom Naham" 108 times each. Apply sandalwood paste and kumkum, then wear in wool or silk thread or capped in silver or gold.',
    closing:
      'Genuine 17 Mukhi is rare. Pure Vedic Gems supplies authentic, lab-certified beads with traditional in-house energisation.',
    shopHref: '/shop/rudraksha/17-mukhi',
  },
  {
    mukhi: 18,
    slug: '18-mukhi',
    title: 'Eighteen (18) Mukhi Rudraksha',
    shortTitle: '18 Mukhi Rudraksha',
    heroImage: HERO(18),
    thumbImage: THUMB('18Mukhi rudraksha.webp'),
    deity: 'Bhumi Devi (Mother Earth)',
    planet: 'Mars',
    chakra: 'Mooladhara (Root)',
    beejMantra: 'Om Hreem Shreem Vasudhaaiye Swaha',
    intro:
      'The presiding Deity of 18 Mukhi Rudraksha is Bhumi Devi and the controlling planet is Mars. The wearer is believed to become healthy, strong, intelligent, disease-free and wealthy. Also referred to as the "Bhumi" Rudraksha, it is said to protect against landslides, earthquakes and other earth-related calamities.',
    benefitGroups: [
      {
        title: 'Importance and Benefits',
        points: [
          'Increases connection with Bhumi Devi — granting penance, patience, stamina, balance and tolerance.',
          'Brings stability and grounded thinking, expression and behaviour.',
          'Highly beneficial for those involved in land, property and real estate.',
          'Recommended for civil engineers and builders.',
          'Removes dullness, obesity and laziness.',
          'Pacifies imbalance of the earth element and Kapha dosha.',
          'Considered very beneficial for expecting mothers.',
        ],
      },
      {
        title: 'Beneficial for Success',
        points: [
          'Keeps the wearer wealthy and centred.',
          'Ideal for launching major projects or business expansion.',
          'Brings a tremendous boost in energy and willpower.',
          'Mars, the ruling planet, grants the drive for action and the ability to command.',
        ],
      },
      {
        title: 'Beneficial for Spirituality',
        points: [
          'Opens, cleanses and stabilises the Mooladhara (Root) Chakra.',
          'Helps Yogic practices by keeping the body fit and supple.',
          'Strengthens and balances the Manipura Chakra when combined with Gayatri Mantra chanting.',
        ],
      },
      {
        title: 'Beneficial for Health',
        points: [
          'Said to be a blessing for women who have faced miscarriage and fear recurrence.',
          'Believed to support healthy pregnancy and child-birth.',
          'Reduces symptoms related to obesity, piles, knees, feet and bone pain.',
          'Good for the musculoskeletal system and mental balance.',
        ],
      },
    ],
    howToWear:
      'Buy with your own money. Keep the bead in Gangajal for one day. On a Monday morning, sit facing east and chant "Aum Hreem Shreem Vasudhaya Swaha" 108 times. Wear around the neck or keep at the worship altar.',
    closing:
      'Always energise the bead before first use. Pure Vedic Gems provides lab-certified, naturally formed 18 Mukhi Rudrakshas with full in-house Vedic energisation.',
    shopHref: '/shop/rudraksha/18-mukhi',
  },
  {
    mukhi: 19,
    slug: '19-mukhi',
    title: 'Nineteen (19) Mukhi Rudraksha',
    shortTitle: '19 Mukhi Rudraksha',
    heroImage: HERO(19),
    thumbImage: THUMB('19Mukhi rudraksha.webp'),
    deity: 'Lord Vishnu (Narayana form)',
    planet: 'Sun',
    beejMantra: 'Om Vam Vishnave Ksheershanyaiye Swaha',
    poojaMantra: 'Om Hreem Hoom Namah',
    intro:
      'The presiding Deity of the Nineteen (19) Mukhi Rudraksha is Lord Vishnu in his Narayana form resting on the Ksheer Sagar, with the controlling planet being the Sun. The bead is also called the Janardana Rudraksha — Janardana being a name of Lord Vishnu meaning "He to whom all devotees pray for worldly success and liberation."',
    benefitGroups: [
      {
        title: 'Beneficial for Success',
        points: [
          'Ushers in good luck and fulfils material desires; sharpens business acumen.',
          'Helps execute large tasks — politics, philanthropy, social activity — without stress.',
          'Excellent for diversified businesses, large establishments and law firms.',
          'Brings name, fame, authority and stronger leadership.',
          'Considered ideal for politicians, doctors, lawyers, chartered accountants, administrators and film actors.',
          'Reduces malefic effects of the Sun and amplifies its positive influence.',
        ],
      },
      {
        title: 'Beneficial for Spirituality',
        points: [
          'Cleanses, balances and aligns all the chakras.',
          'Grants the ability to manage multiple tasks gracefully — material and spiritual.',
          'Carries the blessings of Lord Narayana and Goddess Laxmi.',
          'Brings promotions for service holders and profits for businessmen.',
        ],
      },
      {
        title: 'Beneficial for Health',
        points: [
          'Strengthens internal organs and the heart.',
          'Boosts circulation and improves eyesight.',
          'Provides relief from stomach ailments and stress-related issues.',
          'Helps with heart-related conditions like palpitations and high blood pressure.',
        ],
      },
      {
        title: 'Who can wear it',
        points: [
          'Those seeking a compatible married partner.',
          'Couples desiring obedient and well-behaved children.',
          'Entrepreneurs starting a new venture or willing to take risks.',
          'Professionals in the service sector for financial growth and promotion.',
        ],
      },
    ],
    howToWear:
      'Wake up early on a Sunday morning, bathe and clean your puja place. Place Gangajal on the bead and wash it gently. Chant "Om Hreem Hoom Namah" 108 times and wear in white silk or wool thread.',
    closing:
      'Pure Vedic Gems is one of the oldest and most experienced sellers of authentic Rudrakshas — sourcing directly from origin, with lab certification and traditional energisation.',
    shopHref: '/shop/rudraksha/19-mukhi',
  },
  {
    mukhi: 20,
    slug: '20-mukhi',
    title: 'Twenty (20) Mukhi Rudraksha',
    shortTitle: '20 Mukhi Rudraksha',
    heroImage: HERO(20),
    thumbImage: THUMB('20Mukhi rudraksha.webp'),
    deity: 'Lord Brahma (with Vishnu & Mahesh)',
    planet: 'Moon',
    beejMantra:
      'Brahmatve Srujate Vishwam Sthitau Palayate Punah | Rudraroopaay Kalpante Namastubhyam Trimurtaye ||',
    poojaMantra: 'Om Hreem Hreem Hoom Hoom Brahmane Namah',
    intro:
      'The presiding Deity of the 20 Mukhi Rudraksha is Lord Brahma with the controlling planet being the Moon. This is one of the rarest of all Rudrakshas. Its power encompasses the positive aspects of all nine planets — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu — and also the eight Dikpalas (Kubera, Yama, Indra, Varuna, Ishana, Agni, Vayu and Nirrti). The bead is believed to be endowed with the powers of Brahma, Vishnu and Mahesh — the Tridev.',
    benefitGroups: [
      {
        title: 'Beneficial for Success',
        points: [
          'Brings quick decision-making and single-minded focus.',
          'Grants knowledge, powers of visualisation, mental stability and supreme confidence.',
          'Excellent for researchers, scientists, meta-physicists and seekers of profound knowledge.',
          'Excellent for intuitive creativity and lasting stability of wealth across generations.',
        ],
      },
      {
        title: 'Beneficial for Spirituality',
        points: [
          'Aligns the wearer with the power of the Creator.',
          'Expands mind, intellect and consciousness toward Param Brahman.',
          'Brings a tranquil state of mind — essential for sadhana and meditation.',
        ],
      },
      {
        title: 'Beneficial for Health',
        points: [
          'Provides relief from coughs, colds and chest problems.',
          'Said to stabilise emotional states — useful in schizophrenia, bipolar disorder, paranoia, dementia and psychosis.',
          'Believed to help in cases of autism, paralysis, knee pain, arthritis and rheumatism.',
        ],
      },
    ],
    howToWear:
      'Energise the bead before wearing. On a Monday morning, bathe, sit facing east, and chant "Om Hreem Hreem Hoom Hoom Brahmane Namah" 108 times. Apply sandalwood paste and roli and then wear.',
    closing:
      '20 Mukhi is extremely rare. Pure Vedic Gems is the only company with a complete in-house Vedic setup for purification (shudhikaran) and energisation (pranpratishtha) as per the authentic ancient rituals.',
    shopHref: '/shop/rudraksha/20-mukhi',
  },
  {
    mukhi: 21,
    slug: '21-mukhi',
    title: 'Twenty-One (21) Mukhi Rudraksha',
    shortTitle: '21 Mukhi Rudraksha',
    heroImage: HERO(21),
    thumbImage: THUMB('21Mukhi Rudraksha.webp'),
    deity: 'Lord Kubera',
    planet: 'Venus',
    beejMantra:
      'Om Yakshaya Kuberaya Vaishravanaya Dhana-dhanyadhipataye Dhana Dhanya Samriddhim Me Dapaya Dapaya Swaha',
    poojaMantra: 'Om Kuberaye Namah / Om Namah Shivaye',
    intro:
      'The presiding Deity of the Twenty-One (21) Mukhi Rudraksha is Lord Kubera and the controlling planet is Venus. Lord Kubera is the treasurer of the gods and guardian of wealth. The wearer is believed to enjoy abundant wealth and material luxury, while gaining the self-confidence and self-esteem to use that abundance wisely. This bead grants benefits on the spiritual, physical and mental levels.',
    benefitGroups: [
      {
        title: 'Beneficial for Success',
        points: [
          'Known as the Kubera Rudraksha — said to bring enormous wealth that lasts across generations.',
          'Even a poor or penniless person is believed to rise to prosperity through the blessing of Lord Kubera.',
          'Mahalakshmi’s blessings flow only with Kubera’s consent — making this bead an essential supplement to Lakshmi sadhana.',
          'Most powerful bead for charging a person’s charisma and brightening their aura.',
        ],
      },
      {
        title: 'Beneficial for Spirituality',
        points: [
          'Said to host Lord Brahma, Lord Vishnu and Lord Mahesh.',
          'Associated with Lord Dhanvantari — the physician of the gods and patron of Ayurveda.',
          'Believed to protect from black magic and evil tantric kriyas.',
          'Makes the wearer a successful practitioner of Tantric Yoga and attracts Siddhis.',
        ],
      },
      {
        title: 'Beneficial for Health',
        points: [
          'Powerful cure for diseases of the sexual and reproductive organs.',
          'Said to revitalise the prostate gland in males and prevent malignant growth.',
          'The wearer is believed to enjoy the pleasures of youth even in old age.',
        ],
      },
    ],
    howToWear:
      'Wash with Gangajal. Energise either yourself or through a learned pundit. Chant "Om Namah Shivaye" or "Om Kuberaye Namah" 108 times. Wear in white silk or wool thread around the neck, as a bracelet, or keep at the place of worship.',
    closing:
      '21 Mukhi is the rarest, most prestigious bead — typically a once-in-a-lifetime acquisition. Always insist on lab and X-ray verification. Pure Vedic Gems provides full provenance, lab certificates and in-house energisation.',
    shopHref: '/shop/rudraksha/21-mukhi',
  },
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

export const RUDRAKSHA_TYPE_TABLE: RudrakshaTypeRow[] = [
  { mukhi: '1 Mukhi', deity: 'Shiva', planet: 'Sun', mantra: 'Om Hreem Namah', slug: '1-mukhi' },
  { mukhi: '2 Mukhi', deity: 'Ardhanareeshwar', planet: 'Moon', mantra: 'Om Namah', slug: '2-mukhi' },
  { mukhi: '3 Mukhi', deity: 'Agni', planet: 'Mars', mantra: 'Om Kleem Namah', slug: '3-mukhi' },
  { mukhi: '4 Mukhi', deity: 'Brahma', planet: 'Mercury', mantra: 'Om Hreem Namah', slug: '4-mukhi' },
  { mukhi: '5 Mukhi', deity: 'Kalaagni Rudra', planet: 'Jupiter', mantra: 'Om Hreem Namah', slug: '5-mukhi' },
  { mukhi: '6 Mukhi', deity: 'Kartikeya', planet: 'Venus', mantra: 'Om Hreem Hum Namah', slug: '6-mukhi' },
  { mukhi: '7 Mukhi', deity: 'Mahalakshmi', planet: 'Saturn', mantra: 'Om Hum Namah', slug: '7-mukhi' },
  { mukhi: '8 Mukhi', deity: 'Ganesha', planet: 'Rahu', mantra: 'Om Hum Namah', slug: '8-mukhi' },
  { mukhi: '9 Mukhi', deity: 'Durga', planet: 'Ketu', mantra: 'Om Hreem Hum Namah', slug: '9-mukhi' },
  { mukhi: '10 Mukhi', deity: 'Vishnu', planet: '—', mantra: 'Om Hreem Namah', slug: '10-mukhi' },
  { mukhi: '11 Mukhi', deity: 'Hanuman / Ekadash Rudra', planet: '—', mantra: 'Om Hreem Hum Namah', slug: '11-mukhi' },
  { mukhi: '12 Mukhi', deity: 'Sun god', planet: 'Sun', mantra: 'Aum Kraum Sraum Raum Surya Namah', slug: '12-mukhi' },
  { mukhi: '13 Mukhi', deity: 'Indra & Kamadeva', planet: 'Venus', mantra: 'Om Hreem Namah', slug: '13-mukhi' },
  { mukhi: '14 Mukhi', deity: 'Hanuman / Devmani', planet: 'Saturn', mantra: 'Om Namah', slug: '14-mukhi' },
  { mukhi: '15 Mukhi', deity: 'Pashupatinath', planet: 'Jupiter', mantra: 'Om Hreem Namah', slug: '15-mukhi' },
  { mukhi: '16 Mukhi', deity: 'Lord Ram', planet: 'Rahu', mantra: 'Om Hreem Shivaya', slug: '16-mukhi' },
  { mukhi: '17 Mukhi', deity: 'Vishwakarma', planet: 'Saturn', mantra: 'Om Namah Shivaya', slug: '17-mukhi' },
  { mukhi: '18 Mukhi', deity: 'Bhumi Devi', planet: 'Mars', mantra: 'Om Hreem Shreem Vasudhaiye Swaha', slug: '18-mukhi' },
  { mukhi: '19 Mukhi', deity: 'Lord Narayana', planet: 'Sun', mantra: 'Om Namah Shivaya', slug: '19-mukhi' },
  { mukhi: '20 Mukhi', deity: 'Vishwasu Sadhu & Narayan', planet: 'Moon', mantra: 'Om Namah Shivaya', slug: '20-mukhi' },
  { mukhi: '21 Mukhi', deity: 'EkAlakh Niranjan / Omkar & Narayan', planet: 'Venus', mantra: 'Om Namah Shivaya', slug: '21-mukhi' },
  { mukhi: 'Gauri Shankar', deity: 'Shiva & Parvati', planet: '—', mantra: 'Om Namah Shivaya' },
];

export type RudrakshaFaq = { question: string; answer: string };

export const RUDRAKSHA_FAQS: RudrakshaFaq[] = [
  {
    question: 'What is rudraksha?',
    answer:
      'Rudraksha is the seed of a tree known as Elaeocarpus Ganitrus. It has been a significant part of human life since its origin. Rudrakshas are considered the tears of Lord Shiva. Each bead is associated with a planet, and wearing a specific bead as per one’s birth chart — under the guidance of a knowledgeable astrologer — is believed to provide benefits in career, health, relationships and spiritual life.',
  },
  {
    question: 'What is natural rudraksha?',
    answer:
      'Natural rudrakshas are those which are neither chemically treated nor enhanced. They are mostly found in the Himalayan region — Nepal, Indonesia, Malaysia and so on. Nepal-origin rudrakshas are considered the best for healing purposes. Always consult a certified astro-gemologist before buying.',
  },
  {
    question: 'How do I identify authentic quality rudrakshas?',
    answer:
      'Consider origin, colour, shape, size and weight. Recognising originals can be difficult due to fakes in the market — so it is important to consult a qualified astro-gemologist and rely on lab (preferably X-ray) verification.',
  },
  {
    question: 'What are the prices of natural quality rudraksha in India?',
    answer:
      'Prices depend on origin, quality, number of mukhis, colour, shape and size. In India they range from a few hundred rupees for common mukhis to several lakhs for rare beads.',
  },
  {
    question: 'Who can wear rudrakshas?',
    answer:
      'Anyone can wear a rudraksha, whether for healing or jewellery. For optimum healing benefit, consult an astrologer for a chart-based recommendation and a qualified astro-gemologist for an authentic bead. Vedic purification and energisation are also recommended.',
  },
  {
    question: 'Which country produces the best quality natural rudrakshas?',
    answer:
      'Nepal-origin rudrakshas are considered the best in the world. Indonesia, Malaysia and India also produce rudraksha beads.',
  },
  {
    question: 'How many types of rudrakshas are available in the market?',
    answer:
      'Rudraksha beads range from 1 to 21 mukhi, with special types such as Gauri Shankar, Ganesh, Garbh-Gauri and Nir Mukhi. Each bead has unique significance in healing therapy.',
  },
  {
    question: 'Why should I not wear broken rudraksha beads?',
    answer:
      'To experience the healing effects, always wear a non-tampered, intact bead. Incomplete or broken beads are not considered effective as a remedy in Vedic astrology.',
  },
  {
    question: 'Why is rudraksha a popular astrological remedy?',
    answer:
      'Each rudraksha bead is associated with a specific planet, making it a powerful planetary remedy. The beads are also considered protective against negative energies. Analyse your birth chart with a knowledgeable astrologer for the most suitable mukhi.',
  },
  {
    question: 'Does rudraksha have any medicinal use?',
    answer:
      'Rudrakshas have traditionally been considered useful in managing conditions like blood pressure, anxiety, sleep disorders and skin problems — but this should always be done under the guidance of an expert. Today they are mostly used for spiritual and astrological purposes.',
  },
  {
    question: 'How should I wear rudrakshas?',
    answer:
      'Consult a knowledgeable astrologer to choose the most suitable mukhi as per your birth chart. Take help from an astro-gemologist for selecting an authentic bead. Energise and purify under Vedic priests to harness its full potency.',
  },
  {
    question: 'Can I share my rudrakshas with others?',
    answer:
      'Rudrakshas absorb and carry the energy of the wearer, building a personal connection over time. Hence wearing someone else’s used rudraksha is not recommended in Vedic tradition.',
  },
  {
    question: 'Where to buy original rudraksha online?',
    answer:
      'Pure Vedic Gems is one of the oldest rudraksha sellers in the market — a family business since 1937 dealing only in authentic, certified and energised rudrakshas at fair prices.',
  },
];
