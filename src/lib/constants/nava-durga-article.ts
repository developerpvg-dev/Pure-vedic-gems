/** Content + SEO for the Nava Durga × gemstones × Rudraksha article (legacy WP page 9917). */

export const NAVA_DURGA_SLUG =
  'unveiling-the-mystical-connection-between-gemstones-rudrakshas-and-the-nine-forms-of-goddess-durga';

export const NAVA_DURGA_PATH = `/${NAVA_DURGA_SLUG}`;

// Sanity CDN assets uploaded from legacy WP projector images (2024/04).
const IMG = {
  1: 'https://cdn.sanity.io/images/8vm3y2bf/production/a6161b9b35e08db303b2e24f2c997414146b355b-1280x750.jpg',
  2: 'https://cdn.sanity.io/images/8vm3y2bf/production/17ba78c3f98d44df39fd21360b41bbdac63e1943-1280x750.jpg',
  3: 'https://cdn.sanity.io/images/8vm3y2bf/production/7fa5811d0aaa8087469b3e85424f29c22644991c-1280x750.jpg',
  4: 'https://cdn.sanity.io/images/8vm3y2bf/production/cb494b454438aeadc17932d5462494567a545a7c-1280x750.jpg',
  5: 'https://cdn.sanity.io/images/8vm3y2bf/production/876f1653742aba928d05127d071ac9a63171e5bf-1280x750.jpg',
  6: 'https://cdn.sanity.io/images/8vm3y2bf/production/f0a1b5d91a6f054737cb2a2c248fde03fbb9a1a7-1280x750.jpg',
  7: 'https://cdn.sanity.io/images/8vm3y2bf/production/3ebab8dd9cf4e757fd604b3d67450d29e929335e-1280x750.jpg',
  8: 'https://cdn.sanity.io/images/8vm3y2bf/production/9a58b2661e210d14f7721ba9219ec5e7ceeef080-1280x750.jpg',
  9: 'https://cdn.sanity.io/images/8vm3y2bf/production/fbaaf9fc30689b9cba53fd966cebcc4c698f5edf-1280x750.jpg',
} as const;

export type NavaDurgaForm = {
  day: number;
  id: string;
  name: string;
  worshipTitle: string;
  planet: string;
  gemLabel: string;
  gemHref: string;
  rudrakshaLabel: string;
  rudrakshaHref: string;
  image: string;
  imageAlt: string;
  intro: string;
  gemBody: string;
  remedyBody: string;
  boostBody: string;
};

export const NAVA_DURGA_SEO = {
  title:
    'Unveiling the Mystical Connection Between Gemstones, Rudrakshas, and the Nine Forms of Goddess Durga',
  description:
    'Elevate your Navaratri celebrations with insights into gemstones, Rudrakshas, and their profound connection to the nine forms of Goddess Durga. Explore now!',
  keywords: [
    'gemstones',
    'Rudrakshas',
    'Navaratri',
    'Goddess Durga',
    'manifestations',
    'spiritual',
    'significance',
    'astrology',
    'astrology remedies',
    'divine energy',
    'spirituality',
    'worship',
    'rituals',
    'Hinduism',
    'tradition',
    'beliefs',
    'metaphysical',
    'metaphysical connections',
    'sacred',
    'enlightenment',
    'Nava Durga',
    'Navratnas',
  ],
  publishedAt: '2024-04-08T10:32:59.000Z',
  modifiedAt: '2024-04-08T11:41:28.000Z',
  ogImage: IMG[1],
};

export const NAVA_DURGA_INTRO =
  'Across the nine nights of Navaratri, each form of Goddess Durga aligns with a planetary force — and with it, a Navratna gemstone and a complementary Rudraksha. This guide maps every day: which Maa to worship, which gem strengthens her planet when well placed, and which mukhi softens affliction.';

export const NAVA_DURGA_FORMS: NavaDurgaForm[] = [
  {
    day: 1,
    id: 'maa-shailputri',
    name: 'Maa Shailputri',
    worshipTitle: 'Worship Maa Shailputri on the 1st day of Navaratri',
    planet: 'Sun (Surya)',
    gemLabel: 'Ruby (Manikya)',
    gemHref: '/gemstones/navaratna/ruby',
    rudrakshaLabel: '1 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/1-mukhi',
    image: IMG[1],
    imageAlt: 'Maa Shailputri — first manifestation of Goddess Durga on Navaratri day 1',
    intro:
      'First Among Nava Durgas — Maa Shailputri is the initial manifestation of Maa Durga. She is known as "Shailputri" because she is the daughter of the King of Mountains, "Parvat Raj Himalaya". This form of the goddess symbolises purity, divinity, and the power of nature.',
    gemBody:
      'Maa Shailputri is associated with the Sun (Surya). The gemstone for the Sun is Ruby (Manikya). Wearing a Ruby can increase the positive effects of the Sun and positively affect career, health, self-esteem, courage, and relationships with father.',
    remedyBody:
      'If you are facing challenges related to career, health, self-esteem, courage, or relationship with father, it could be attributed to the negative influence of the Sun. In such cases, wearing a 1 Mukhi Rudraksha can help mitigate these effects.',
    boostBody:
      'Conversely, if the Sun is well-placed in your horoscope, wearing a Ruby can enhance qualities like success, vitality, and confidence.',
  },
  {
    day: 2,
    id: 'maa-brahmacharini',
    name: 'Maa Brahmacharini',
    worshipTitle: 'Worship Maa Brahmacharini on the 2nd day of Navaratri',
    planet: 'Jupiter (Brihaspati)',
    gemLabel: 'Yellow Sapphire (Pukhraj)',
    gemHref: '/gemstones/navaratna/yellow-sapphire',
    rudrakshaLabel: '5 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/5-mukhi',
    image: IMG[2],
    imageAlt: 'Maa Brahmacharini — second manifestation of Goddess Durga on Navaratri day 2',
    intro:
      'Second Among Nava Durgas — Maa Brahmacharini is the second form of Maa Durga. She is known as "Brahmacharini" because she represents the divine feminine energy engaged in Tapasya or penance. This form symbolises dedication, austerity, and the pursuit of spiritual knowledge.',
    gemBody:
      'Maa Brahmacharini is associated with Jupiter (Brihaspati). The gemstone for Jupiter is Yellow Sapphire (Pukhraj). Wearing a Yellow Sapphire can increase the positive effects of Jupiter and support the immune system, arthritis, joint problems, and matters of education, finance, and career.',
    remedyBody:
      'If you are facing challenges related to a weak immune system, arthritis, joint problems, education, finance, or career, it could be attributed to the negative influence of Jupiter. In such cases, wearing a 5 Mukhi Rudraksha can help mitigate these effects.',
    boostBody:
      'Conversely, if Jupiter is well-placed in your chart, wearing a Yellow Sapphire can enhance qualities like courage, determination, and wisdom.',
  },
  {
    day: 3,
    id: 'maa-chandraghanta',
    name: 'Maa Chandraghanta',
    worshipTitle: 'Worship Maa Chandraghanta on the 3rd day of Navaratri',
    planet: 'Rahu',
    gemLabel: 'Hessonite (Gomed)',
    gemHref: '/gemstones/navaratna/hessonite',
    rudrakshaLabel: '8 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/8-mukhi',
    image: IMG[3],
    imageAlt: 'Maa Chandraghanta — third manifestation of Goddess Durga on Navaratri day 3',
    intro:
      'Third Among Nava Durgas — Maa Chandraghanta is the third form of Maa Durga. She is depicted with a half-moon shaped like a bell (Ghanta) on her forehead, thus earning her the name Chandraghanta. This form represents courage, bravery, and grace.',
    gemBody:
      'Maa Chandraghanta is associated with Rahu. The gemstone for Rahu is Hessonite. Wearing a Hessonite can increase the positive effects of Rahu and bring clarity, intuition, and spiritual growth into one\'s life.',
    remedyBody:
      'If you are facing challenges related to confusion, illusion, or addictions, it could be attributed to the negative influence of Rahu. In such cases, wearing an 8 Mukhi Rudraksha can help mitigate these effects.',
    boostBody:
      'On the other hand, if Rahu is well-placed in your horoscope, wearing a Hessonite Garnet can enhance qualities like intuition, clarity of thought, and spiritual growth.',
  },
  {
    day: 4,
    id: 'maa-kushmanda',
    name: 'Maa Kushmanda',
    worshipTitle: 'Worship Maa Kushmanda on the 4th day of Navaratri',
    planet: 'Venus (Shukra)',
    gemLabel: 'White Sapphire (Safed Pukhraj)',
    gemHref: '/gemstones/navaratna/white-sapphire',
    rudrakshaLabel: '6 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/6-mukhi',
    image: IMG[4],
    imageAlt: 'Maa Kushmanda — fourth manifestation of Goddess Durga on Navaratri day 4',
    intro:
      'Fourth Among Nava Durgas — Maa Kushmanda is the fourth form of Maa Durga. She is believed to have created the universe with her divine smile, thus earning her the name Kushmanda, where "Ku" means "a little", "Ushma" means "warmth" or "energy", and "Anda" means "cosmic egg" or universe.',
    gemBody:
      'Maa Kushmanda is associated with Venus (Shukra). The gemstone for Venus is White Sapphire (Safed Pukhraj). Wearing a White Sapphire can increase the positive effects of Venus and bring positive changes in relationships, career, and luxury of life.',
    remedyBody:
      'If you are facing challenges related to career and relationship with your partner, it could be attributed to the negative influence of Venus. In such cases, wearing a 6 Mukhi Rudraksha can help mitigate these effects.',
    boostBody:
      'Conversely, if Venus is well-placed in your chart, wearing a White Sapphire can enhance qualities like love, creativity, and material prosperity.',
  },
  {
    day: 5,
    id: 'maa-skandamata',
    name: 'Maa Skandamata',
    worshipTitle: 'Worship Maa Skandamata on the 5th day of Navaratri',
    planet: 'Mars (Mangal)',
    gemLabel: 'Red Coral (Moonga)',
    gemHref: '/gemstones/navaratna/red-coral',
    rudrakshaLabel: '3 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/3-mukhi',
    image: IMG[5],
    imageAlt: 'Maa Skandamata — fifth manifestation of Goddess Durga on Navaratri day 5',
    intro:
      'Fifth Among Nava Durgas — Maa Skandamata is the fifth form of Maa Durga. She is depicted with Lord Skanda (Lord Kartikeya) seated on her lap, hence the name Skandamata. This form represents motherly love, nurturing, and protection.',
    gemBody:
      'Maa Skandamata is associated with Mars (Mangal). The gemstone for Mars is Red Coral (Moonga). Wearing a Red Coral can increase the positive effects of Mars and improve characteristics such as stability, courage, and energy.',
    remedyBody:
      'If you are facing challenges related to anger, aggression, accidents, or marital discord, it could be attributed to the negative influence of Mars. In such cases, wearing a 3 Mukhi Rudraksha can help mitigate these effects.',
    boostBody:
      'Conversely, if Mars is well-placed in your chart, wearing a Red Coral can enhance qualities like courage, determination, and vitality.',
  },
  {
    day: 6,
    id: 'maa-katyayani',
    name: 'Maa Katyayani',
    worshipTitle: 'Worship Maa Katyayani on the 6th day of Navaratri',
    planet: 'Mercury (Budh)',
    gemLabel: 'Emerald (Panna)',
    gemHref: '/gemstones/navaratna/emerald',
    rudrakshaLabel: '4 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/4-mukhi',
    image: IMG[6],
    imageAlt: 'Maa Katyayani — sixth manifestation of Goddess Durga on Navaratri day 6',
    intro:
      'Sixth Among Nava Durgas — Maa Katyayani is the sixth form of Maa Durga. She is depicted as a warrior goddess, fierce and valiant, riding a lion and wielding various weapons. This form represents courage, valour, and victory over evil.',
    gemBody:
      'Maa Katyayani is associated with Mercury (Budh). The gemstone for Mercury is Emerald. Wearing an Emerald can increase the positive effects of Mercury and bring improvements in communication skills, intellect, and decision-making abilities.',
    remedyBody:
      'If you are facing challenges related to communication and intellect, it could be attributed to an afflicted Mercury. In such cases, wearing a 4 Mukhi Rudraksha can help mitigate these effects.',
    boostBody:
      'Conversely, if Mercury is well-placed in your birth chart, wearing an Emerald can enhance qualities like sharp intellect, effective communication, and improved decision-making abilities.',
  },
  {
    day: 7,
    id: 'maa-kaalratri',
    name: 'Maa Kaalratri',
    worshipTitle: 'Worship Maa Kaalratri on the 7th day of Navaratri',
    planet: 'Saturn (Shani)',
    gemLabel: 'Blue Sapphire (Neelam)',
    gemHref: '/gemstones/navaratna/blue-sapphire',
    rudrakshaLabel: '7 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/7-mukhi',
    image: IMG[7],
    imageAlt: 'Maa Kaalratri — seventh manifestation of Goddess Durga on Navaratri day 7',
    intro:
      'Seventh Among Nava Durgas — Maa Kaalratri is the seventh form of Maa Durga. She is depicted as a fierce and dark-complexioned goddess, riding a donkey and wielding a sword. This form represents the destroyer of darkness and ignorance, and the protector of righteousness.',
    gemBody:
      'Maa Kaalratri is associated with Shani or Saturn. The gemstone for Saturn is Blue Sapphire (Neelam). Wearing a Blue Sapphire can increase the positive effects of Saturn and bring discipline, wisdom, and spiritual growth.',
    remedyBody:
      'If you are experiencing challenges related to obstacles, delays, or hardships, it might be due to the adverse effects of Saturn in your astrological chart. Wearing a 7 Mukhi Rudraksha can help alleviate these challenges.',
    boostBody:
      'Conversely, if Saturn is favourably positioned in your birth chart, wearing a Blue Sapphire can enhance qualities like discipline, wisdom, and spiritual growth.',
  },
  {
    day: 8,
    id: 'maa-mahagauri',
    name: 'Maa Mahagauri',
    worshipTitle: 'Worship Maa Mahagauri on the 8th day of Navaratri',
    planet: 'Moon (Chandra)',
    gemLabel: 'Pearl (Moti)',
    gemHref: '/gemstones/navaratna/pearl',
    rudrakshaLabel: '2 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/2-mukhi',
    image: IMG[8],
    imageAlt: 'Maa Mahagauri — eighth manifestation of Goddess Durga on Navaratri day 8',
    intro:
      'Eighth Among Nava Durgas — Maa Mahagauri is the eighth form of Maa Durga. She is depicted as serene and calm, adorned in white garments, representing purity and tranquillity. This form symbolises forgiveness, compassion, and inner peace.',
    gemBody:
      'Maa Mahagauri is associated with the Moon. The gemstone for the Moon is Pearl (Moti). Wearing a Pearl can increase the positive effects of the Moon and bring emotional balance, intuition, and nourishment.',
    remedyBody:
      'If you are facing challenges related to confidence and issues with your mother, it could be attributed to the negative influence of the Moon. In such cases, wearing a 2 Mukhi Rudraksha can help mitigate these effects.',
    boostBody:
      'On the other hand, if the Moon is well-placed in your horoscope, wearing a Pearl can enhance qualities like intuition, emotional stability, and nourishment.',
  },
  {
    day: 9,
    id: 'maa-siddhidatri',
    name: 'Maa Siddhidatri',
    worshipTitle: 'Worship Maa Siddhidatri on the 9th day of Navaratri',
    planet: 'Ketu',
    gemLabel: "Cat's Eye (Lehsunia)",
    gemHref: '/gemstones/navaratna/cats-eye',
    rudrakshaLabel: '9 Mukhi Rudraksha',
    rudrakshaHref: '/rudraksha/9-mukhi',
    image: IMG[9],
    imageAlt: 'Maa Siddhidatri — ninth manifestation of Goddess Durga on Navaratri day 9',
    intro:
      'Ninth Among Nava Durgas — Maa Siddhidatri is the ninth and final form of Maa Durga. She is depicted as having four arms and bestowing blessings upon her devotees. This form represents spiritual knowledge, divine wisdom, and the fulfilment of desires.',
    gemBody:
      "Maa Siddhidatri is associated with Ketu. The gemstone for Ketu is Cat's Eye (Lehsunia). Wearing a Cat's Eye can increase the positive effects of Ketu and bring spiritual growth, enlightenment, and protection from evil forces.",
    remedyBody:
      'If you are experiencing challenges related to spiritual growth, digestion, physical weakness, and enlightenment, it might be due to the adverse effects of Ketu in your astrological chart. In such cases, wearing a 9 Mukhi Rudraksha can help alleviate these challenges.',
    boostBody:
      "Conversely, if Ketu is well-placed in your birth chart, wearing a Cat's Eye can enhance qualities like spiritual insight, intuition, and protection from negative energies.",
  },
];

export const NAVA_DURGA_FAQS = [
  {
    question: 'How are the nine forms of Goddess Durga connected to gemstones?',
    answer:
      'Each Nava Durga form is linked to a planetary force. The matching Navratna gemstone — Ruby, Yellow Sapphire, Hessonite, White Sapphire, Red Coral, Emerald, Blue Sapphire, Pearl, or Cat\'s Eye — is worn to strengthen that planet when it is well placed in the birth chart.',
  },
  {
    question: 'When should I wear a Rudraksha instead of a gemstone during Navaratri?',
    answer:
      'When a planet linked to that day\'s form of Durga is afflicted, Pure Vedic Gems guidance traditionally recommends the corresponding mukhi Rudraksha as a gentler remedy. For example, 1 Mukhi for solar affliction with Maa Shailputri, or 7 Mukhi when Saturn (Maa Kaalratri) is hard.',
  },
  {
    question: 'Which form of Durga is worshipped on which day of Navaratri?',
    answer:
      'Day 1 Shailputri, Day 2 Brahmacharini, Day 3 Chandraghanta, Day 4 Kushmanda, Day 5 Skandamata, Day 6 Katyayani, Day 7 Kaalratri, Day 8 Mahagauri, and Day 9 Siddhidatri.',
  },
  {
    question: 'Can I get a personalised gemstone and Rudraksha recommendation for Navaratri?',
    answer:
      'Yes. Share your birth details with Pure Vedic Gems for a horoscope-led recommendation, or book a Vedic consultation. You can also arrange a sankalpa path aligned to your healing needs.',
  },
];

export const NAVA_DURGA_SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/puregems.vm' },
  { label: 'X (Twitter)', href: 'https://twitter.com/PurevedicGems' },
  { label: 'Instagram', href: 'https://www.instagram.com/purevedicgems4' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vikas-mehra-54b3939b/' },
  { label: 'WhatsApp', href: 'https://wa.me/917703934332' },
] as const;

export const NAVA_DURGA_CONTACT = {
  phones: ['7703934332', '9871582404'],
  phoneDisplay: '+91 77039 34332, +91 98715 82404',
};
