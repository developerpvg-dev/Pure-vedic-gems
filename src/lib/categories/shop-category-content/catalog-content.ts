import type { CategoryFaq, HeroBenefit } from '@/lib/types/shop-category-page';
import { certifiedRudrakshaHubTitle, mukhiMeta } from '@/lib/seo/storefront-meta';
import { BRAND, h2, h3, mergeKeywords, p, ul, type RichGemSections } from './helpers';

type MukhiMeta = {
  deity: string;
  planet?: string;
  mantra?: string;
  benefits: string[];
  whoShouldWear: string;
  heroBenefits: [string, string, string, string];
  rarityNote?: string;
};

type SpecialRudrakshaMeta = MukhiMeta & {
  significance: string;
  formDescription: string;
};

type IdolMeta = {
  deity: string;
  placement: string;
  significance: string;
  materials: string[];
  heroBenefits: [string, string, string, string];
  worshipNotes: string;
};

type JewelryMeta = {
  focus: string;
  heroBenefits: [string, string, string, string];
  styles: string[];
  buyerNotes: string;
};

const RUDRAKSHA_DAY = 'Monday';
const RUDRAKSHA_MANTRA = 'Om Namah Shivaya';

const MUKHI_META: Record<number, MukhiMeta> = {
  1: {
    deity: 'Paramashiva (Shiva consciousness)',
    planet: 'Sun (Surya)',
    mantra: 'Om Hreem Namah or Om Namah Shivaya',
    benefits: [
      'Traditionally associated with supreme Shiva consciousness, detachment, and the pursuit of moksha',
      'Supports clarity of purpose, spiritual focus, and leadership when worn with discipline',
      'Helps reduce ego-driven distractions and align the wearer with higher sadhana',
      'Often sought by advanced seekers and those guided toward deep Shiva worship',
    ],
    whoShouldWear:
      'Recommended for sincere Shiva devotees, meditators, and those advised by a guru for moksha-oriented practice. Not a casual everyday bead for beginners without guidance — authenticity and suitability matter greatly for 1 Mukhi.',
    heroBenefits: ['Shiva consciousness', 'Spiritual focus', 'Detachment & clarity', 'Moksha-oriented sadhana'],
    rarityNote:
      'Authentic round 1 Mukhi from Nepal/Java is extremely rare. Indian Sawar and crescent forms are discussed in tradition; always verify mukhi lines and source.',
  },
  2: {
    deity: 'Ardhanarishwara (Shiva–Parvati union)',
    planet: 'Moon (Chandra)',
    mantra: 'Om Namah or Om Shreem Namah',
    benefits: [
      'Symbolizes harmony between masculine and feminine energies within and in relationships',
      'Traditionally supports emotional balance, partnership peace, and mutual understanding',
      'May help calm mood fluctuations and strengthen family bonds when worn with faith',
      'Useful for couples, mediators, and those working on inner union of mind and heart',
    ],
    whoShouldWear:
      'Suitable for married couples, those healing relationship discord, and devotees of Ardhanarishwara. Astrologers sometimes suggest it when Chandra needs stabilizing support.',
    heroBenefits: ['Relationship harmony', 'Emotional balance', 'Shiva–Shakti union', 'Family peace'],
  },
  3: {
    deity: 'Agni (Fire)',
    planet: 'Mars (Mangal)',
    mantra: 'Om Kleem Namah',
    benefits: [
      'Associated with burning past karmic impurities and reigniting inner vitality',
      'Traditionally supports courage, confidence, and freedom from lethargy',
      'May help overcome fear, guilt, and self-doubt through disciplined practice',
      'Useful for those seeking renewed motivation and fiery spiritual discipline',
    ],
    whoShouldWear:
      'Often recommended for Mangal-related remedies, students needing focus, and those recovering from periods of low confidence. Wear after proper energization.',
    heroBenefits: ['Burns negative karma', 'Boosts confidence', 'Mars balancing', 'Renewed vitality'],
  },
  4: {
    deity: 'Lord Brahma',
    planet: 'Mercury (Budh)',
    mantra: 'Om Hreem Namah',
    benefits: [
      'Linked to creativity, learning, communication, and intellectual clarity',
      'Supports students, writers, teachers, and professionals in knowledge fields',
      'Traditionally aids memory, speech, and structured thinking',
      'Encourages disciplined study and creative expression aligned with dharma',
    ],
    whoShouldWear:
      'Ideal for students, academics, artists, and anyone strengthening Budh in the chart. Also worn by seekers of Vedantic knowledge and mantra siddhi.',
    heroBenefits: ['Creativity & learning', 'Mercury support', 'Clear communication', 'Intellectual growth'],
  },
  5: {
    deity: 'Kalagni Rudra (five-faced form of Shiva)',
    planet: 'Jupiter (Guru)',
    mantra: 'Om Hreem Namah',
    benefits: [
      'The most widely worn mukhi — suitable for men, women, and children in tradition',
      'Promotes general wellbeing, peace of mind, and protection in daily life',
      'Supports health, calmness, and auspiciousness without extreme planetary intensity',
      'Ideal first Rudraksha for beginners and daily Shiva remembrance',
    ],
    whoShouldWear:
      'Safe and beneficial for almost everyone — students, professionals, householders, and sadhakas. The standard recommendation for general Shiva bhakti and Jupiter-friendly living.',
    heroBenefits: ['Universal wellbeing', 'Peace of mind', 'Health & protection', 'Beginner-friendly'],
  },
  6: {
    deity: 'Kartikeya (Skanda / Murugan)',
    planet: 'Venus (Shukra)',
    mantra: 'Om Hreem Hum Namah',
    benefits: [
      'Associated with willpower, focus, and victory over inner enemies',
      'Supports grounding, discipline, and steadiness in worldly duties',
      'Traditionally helps balance luxury and restraint — Shukra with warrior clarity',
      'Useful for leaders, athletes, and those building sustained effort toward goals',
    ],
    whoShouldWear:
      'Recommended for those needing stronger will, Venus-related balance, or Kartikeya devotion. Often worn by professionals managing high-responsibility roles.',
    heroBenefits: ['Willpower & focus', 'Grounded discipline', 'Victory over obstacles', 'Venus balancing'],
  },
  7: {
    deity: 'Goddess Mahalakshmi',
    planet: 'Saturn (Shani) — also wealth blessings',
    mantra: 'Om Hum Namah',
    benefits: [
      'Traditionally attracts stability, abundance, and dignified prosperity',
      'Supports patience, long-term wealth building, and protection from misfortune',
      'Associated with Mahalakshmi’s grace in home, business, and spiritual generosity',
      'Helps reduce anxiety around finances when combined with honest effort and seva',
    ],
    whoShouldWear:
      'Suitable for business owners, professionals seeking financial stability, and devotees of Lakshmi. Sometimes suggested during challenging Shani periods with proper guidance.',
    heroBenefits: ['Mahalakshmi blessings', 'Financial stability', 'Patience & dignity', 'Abundance mindset'],
  },
  8: {
    deity: 'Lord Ganesha (Vinayaka)',
    planet: 'Rahu',
    mantra: 'Om Hum Namah or Om Gan Ganapataye Namah',
    benefits: [
      'Removes obstacles and opens paths for new ventures and spiritual practice',
      'Supports wisdom, discretion, and success at the start of important work',
      'Traditionally pacifies Rahu-related confusion, fear, and sudden setbacks',
      'Ideal for entrepreneurs, travelers, and students beginning major projects',
    ],
    whoShouldWear:
      'Recommended for Rahu remedies, new beginnings, and Ganesha upasana. Wear on Monday or Wednesday after energization for best traditional alignment.',
    heroBenefits: ['Obstacle removal', 'Rahu pacification', 'New beginnings', 'Ganesha grace'],
  },
  9: {
    deity: 'Goddess Durga (Nava Durga / Shakti)',
    planet: 'Ketu',
    mantra: 'Om Hreem Hum Namah',
    benefits: [
      'Provides fierce protection and spiritual strength against negative influences',
      'Supports bhakti, fearlessness, and detachment from harmful attachments',
      'Traditionally associated with Ketu’s moksha-oriented, mystical energy',
      'Useful for sadhakas, healers, and those facing unseen obstacles',
    ],
    whoShouldWear:
      'Suitable for Durga devotees, those in Ketu dasha/antardasha, and seekers needing protective Shakti. Women and men both wear it with devotion.',
    heroBenefits: ['Durga protection', 'Ketu support', 'Spiritual strength', 'Fearlessness'],
  },
  10: {
    deity: 'Lord Vishnu (preserver)',
    planet: 'All planets (dashavatara protection)',
    mantra: 'Om Hreem Namah or Om Namo Narayanaya',
    benefits: [
      'Acts as a shield against negative planetary effects and psychic disturbance',
      'Supports dharma, lawful living, and protection during travel or litigation',
      'Traditionally balances energies when multiple grahas feel afflicted',
      'Ideal for householders maintaining righteous family and professional life',
    ],
    whoShouldWear:
      'Worn by Vishnu bhaktas and those seeking broad planetary protection without wearing multiple beads. Popular for general auspiciousness.',
    heroBenefits: ['Planetary shield', 'Vishnu protection', 'Dharmic living', 'Travel safety'],
  },
  11: {
    deity: 'Lord Hanuman (Rudra avatar aspect)',
    planet: 'No single graha — courage & devotion',
    mantra: 'Om Hreem Hum Namah or Om Hanumate Namah',
    benefits: [
      'Instills courage, stamina, and unwavering devotion in difficult times',
      'Supports success in competitive fields, litigation, and bold decision-making',
      'Traditionally protects against accidents, evil eye, and fear of failure',
      'Strengthens prana, discipline, and service-oriented character',
    ],
    whoShouldWear:
      'Ideal for Hanuman devotees, athletes, police/military personnel, and anyone needing fearless perseverance. Often worn during Hanuman Jayanti observances.',
    heroBenefits: ['Courage & stamina', 'Hanuman devotion', 'Accident protection', 'Bold success'],
  },
  12: {
    deity: 'Lord Surya (Sun)',
    planet: 'Sun (Surya)',
    mantra: 'Om Kraum Sraum Raum Namah',
    benefits: [
      'Radiates confidence, leadership, and visibility in career and public life',
      'Supports vitality, digestion, and disciplined morning spiritual practice',
      'Traditionally strengthens Surya when authority, recognition, or health lags',
      'Useful for administrators, politicians, doctors, and performers',
    ],
    whoShouldWear:
      'Recommended for Surya remedies, leaders, and those lacking confidence or father-related blessings. Wear after Surya-friendly energization.',
    heroBenefits: ['Leadership radiance', 'Surya strengthening', 'Vitality & fame', 'Morning discipline'],
  },
  13: {
    deity: 'Kamadeva / Indra (desire & charisma)',
    planet: 'Venus (Shukra) / Kamadeva blessings',
    mantra: 'Om Hreem Namah',
    benefits: [
      'Enhances charm, attraction, and harmonious social presence',
      'Supports artistic talent, romance within dharma, and creative magnetism',
      'Traditionally aids fulfillment of righteous desires and artistic success',
      'Useful for performers, designers, and those healing Shukra-related blocks',
    ],
    whoShouldWear:
      'Suitable for artists, public figures, and those seeking ethical relationship harmony. Not a substitute for character — worn with humility.',
    heroBenefits: ['Charisma & charm', 'Artistic magnetism', 'Venus grace', 'Righteous desires'],
  },
  14: {
    deity: 'Lord Hanuman / Shiva (Maha Shan)',
    planet: 'Saturn (Shani)',
    mantra: 'Om Namah or Om Namah Shivaya',
    benefits: [
      'Among the most powerful protective beads for Shani and sudden misfortune',
      'Activates ajna awareness, intuition, and disciplined spiritual practice',
      'Traditionally worn for business stability, property matters, and karmic endurance',
      'Provides grounding during Sade Sati and intense karma-clearing periods',
    ],
    whoShouldWear:
      'Often recommended for Shani remedies, property owners, and advanced sadhakas. Requires respect — wear only if spiritually prepared or astrologically advised.',
    heroBenefits: ['Shani protection', 'Ajna activation', 'Business stability', 'Karmic endurance'],
  },
  15: {
    deity: 'Pashupatinath / Pauranic Rudra',
    planet: 'Mercury (Budh) — intuitive healing',
    mantra: 'Om Hreem Namah',
    benefits: [
      'Supports intuitive healing, mental clarity, and relief from chronic worries',
      'Associated with Pashupatinath’s grace for health and spiritual discernment',
      'Traditionally helps speech, negotiation, and compassionate leadership',
      'Useful for healers, counselors, and those on long wellness journeys',
    ],
    whoShouldWear:
      'Recommended for health-focused remedies, therapists, and Pashupatinath devotees. Pair with medical care — not a replacement for treatment.',
    heroBenefits: ['Intuitive healing', 'Mental clarity', 'Compassionate leadership', 'Health support'],
  },
  16: {
    deity: 'Lord Rama / Mahamrityunjaya Shiva',
    planet: 'Moon (Chandra) — victory & fearlessness',
    mantra: 'Om Hreem Hum Namah',
    benefits: [
      'Grants victory over enemies, litigation, and paralyzing fear',
      'Supports righteous conduct, family honor, and dharmic decision-making',
      'Traditionally linked to Mahamrityunjaya protection and Rama’s ideals',
      'Useful during legal battles, competitive exams, and moral crossroads',
    ],
    whoShouldWear:
      'Suitable for Rama bhaktas, those facing opposition, and seekers of fearless dharma. Wear with truthfulness — the bead amplifies intent.',
    heroBenefits: ['Victory & courage', 'Rama ideals', 'Fear removal', 'Legal protection'],
  },
  17: {
    deity: 'Vishvakarma / Sita (desire fulfillment)',
    planet: 'Saturn (Shani) — manifested goals',
    mantra: 'Om Hreem Hum Namah',
    benefits: [
      'Supports fulfillment of well-intentioned goals and skilled craftsmanship',
      'Traditionally aids architects, engineers, and creators manifesting visions',
      'Helps align personal desires with dharma and sustained effort',
      'Associated with sudden positive turns after long perseverance',
    ],
    whoShouldWear:
      'Ideal for builders, inventors, and those working toward a major life goal. Often suggested when Shani delay needs conscious transformation.',
    heroBenefits: ['Goal fulfillment', 'Skilled creation', 'Perseverance rewards', 'Dharmic desires'],
  },
  18: {
    deity: 'Bhumi Devi (Earth Mother) / Gayatri',
    planet: 'Mars (Mangal) — grounding',
    mantra: 'Om Hreem Shreem Vasudhaye Swaha',
    benefits: [
      'Grounds the wearer, supports land/property matters, and physical health',
      'Associated with Gayatri’s luminous wisdom and earth-element stability',
      'Traditionally helps manage anger, restlessness, and scattered energy',
      'Useful for farmers, real-estate professionals, and grounding meditators',
    ],
    whoShouldWear:
      'Recommended for Mangal balancing, property buyers, and those feeling ungrounded. Excellent for connecting daily life to earth-conscious living.',
    heroBenefits: ['Grounding & stability', 'Bhumi Devi grace', 'Property support', 'Mars balancing'],
  },
  19: {
    deity: 'Lord Vishnu / Narayana',
    planet: 'Mercury (Budh) — prosperity',
    mantra: 'Om Vam Vishnave Sheershayane Swaha',
    benefits: [
      'Attracts ethical prosperity, business growth, and Vishnu’s preserving grace',
      'Supports clear transactions, honest trade, and family abundance',
      'Traditionally worn for Lakshmi–Narayana harmony in home and work',
      'Useful for merchants, salaried professionals rising in responsibility',
    ],
    whoShouldWear:
      'Suitable for Vishnu devotees seeking material stability within dharma. Often paired with Lakshmi worship in the household altar.',
    heroBenefits: ['Ethical prosperity', 'Narayana grace', 'Business growth', 'Family abundance'],
  },
  20: {
    deity: 'Lord Brahma (creator)',
    planet: 'Jupiter (Guru) — supreme knowledge',
    mantra: 'Om Hreem Hum Namah',
    benefits: [
      'Opens channels for higher knowledge, mantra siddhi, and creative genesis',
      'Supports gurus, researchers, and those transmitting sacred wisdom',
      'Traditionally rare — associated with Brahma’s creative intelligence',
      'Useful for advanced students of Vedanta, Ayurveda, and Jyotish',
    ],
    whoShouldWear:
      'Recommended for teachers, scholars, and serious sadhakas under guru guidance. Rare bead — verify authenticity carefully before purchase.',
    heroBenefits: ['Supreme knowledge', 'Creative genesis', 'Guru wisdom', 'Mantra siddhi'],
  },
  21: {
    deity: 'Lord Kuber / synthesis of Trimurti blessings',
    planet: 'All planets — ultimate rarity',
    mantra: 'Om Yakshaya Kuberaya Vaishravanaya Dhanadhanyadhipataye Dhanadhanyasamriddhim Me Dehi Dapaya Swaha',
    benefits: [
      'Considered among the rarest beads — embodies comprehensive divine blessings',
      'Traditionally associated with Kuber’s wealth, Shiva’s protection, and Vishnu’s preservation',
      'Supports major life transformation, leadership at scale, and dharmic abundance',
      'Worn only by those with guru sanction and capacity to honor its sanctity',
    ],
    whoShouldWear:
      'For advanced collectors and devotees with explicit spiritual guidance. Authenticity is paramount — consult experts before investing.',
    heroBenefits: ['Kuber abundance', 'Trimurti synthesis', 'Rare sacred power', 'Major transformation'],
    rarityNote: 'Genuine 21 Mukhi is exceptionally rare. Demand lab-verified mukhi count, origin disclosure, and expert inspection.',
  },
};

const SPECIAL_RUDRAKSHA_META: Record<string, SpecialRudrakshaMeta> = {
  'gauri-shankar': {
    deity: 'Shiva–Parvati (Gauri Shankar union)',
    planet: 'Moon & cosmic union',
    mantra: 'Om Gauri Shankaraya Namah',
    formDescription:
      'Two Rudraksha beads naturally fused — symbolizing Ardhanarishwara and the inseparable union of Shiva and Shakti.',
    significance:
      'Among the most sacred composite forms. Traditionally blesses marriage harmony, fertility prayers, and balanced spiritual–material life.',
    benefits: [
      'Deepens harmony between partners and within the wearer’s masculine–feminine energies',
      'Supports fertility prayers, family peace, and auspicious beginnings in grihastha ashram',
      'Enhances meditation on non-duality — Shiva and Shakti as one consciousness',
      'Highly valued for wedding gifts and couple sadhana when authentically fused',
    ],
    whoShouldWear:
      'Ideal for married couples, those preparing for marriage, and devotees of Uma–Maheshwara. Verify natural fusion — not glued beads.',
    heroBenefits: ['Shiva–Shakti union', 'Marital harmony', 'Fertility blessings', 'Non-dual awareness'],
  },
  'ganesh-rudraksha': {
    deity: 'Lord Ganesha',
    planet: 'Rahu / new beginnings',
    mantra: 'Om Gan Ganapataye Namah',
    formDescription:
      'A Rudraksha with a natural trunk-like protrusion resembling Ganesha — a revered rare formation.',
    significance:
      'Invokes Vighnaharta before any sacred or worldly undertaking. Traditionally worn for wisdom, success, and obstacle removal.',
    benefits: [
      'Clears obstacles at the start of business, education, or spiritual disciplines',
      'Supports intellect, memory, and prudent decision-making',
      'Protects journeys, new homes, and important ceremonies',
      'Deepens Ganesha bhakti and humility before success',
    ],
    whoShouldWear:
      'Students, entrepreneurs, and devotees beginning major ventures. Confirm the trunk is natural, not carved.',
    heroBenefits: ['Vighnaharta grace', 'Obstacle removal', 'Wisdom & success', 'Auspicious beginnings'],
  },
  'nir-mukhi': {
    deity: 'Formless Shiva (Nirguna aspect)',
    planet: 'Transcendent — beyond grahas',
    mantra: 'Om Namah Shivaya',
    formDescription:
      'Rudraksha without visible mukhi lines — associated with the formless, attributeless face of Shiva.',
    significance:
      'Honored in certain lineages for meditation on the absolute. Distinct from mukhi-count beads — suitability varies by tradition.',
    benefits: [
      'Supports deep meditation on formless consciousness',
      'Traditionally calms excessive mental labeling and spiritual ego',
      'Useful for advanced sadhakas under guru guidance',
      'Complements mukhi-based practice rather than replacing it for beginners',
    ],
    whoShouldWear:
      'Advanced meditators and Shiva devotees recommended by a guru. Beginners typically start with 5 Mukhi.',
    heroBenefits: ['Formless Shiva', 'Deep meditation', 'Transcendent calm', 'Guru-guided sadhana'],
  },
  'garbh-gauri': {
    deity: 'Goddess Parvati (Garbh Gauri — child in womb form)',
    planet: 'Moon / maternal Shakti',
    mantra: 'Om Gauri Garbhe Namah',
    formDescription:
      'Two beads where a smaller Rudraksha is naturally enclosed within a larger one — symbolizing Parvati carrying divine consciousness.',
    significance:
      'Blesses motherhood, feminine strength, and the nurturing aspect of Shakti. Sought for fertility and maternal wellbeing prayers.',
    benefits: [
      'Supports prayers for conception, safe pregnancy, and maternal peace',
      'Honors feminine divine strength and protective motherhood',
      'Brings emotional nurturing and family-centered stability',
      'Valued as a sacred gift for expectant mothers and Parvati devotees',
    ],
    whoShouldWear:
      'Women seeking motherhood blessings, Parvati upasakas, and couples in fertility sadhana. Authentic natural enclosure is essential.',
    heroBenefits: ['Maternal Shakti', 'Fertility blessings', 'Parvati devotion', 'Family nurturing'],
  },
  'sawar-rudraksha': {
    deity: 'Shiva (often linked to 1 Mukhi energy in Indian tradition)',
    planet: 'Sun / Shiva consciousness',
    mantra: 'Om Namah Shivaya',
    formDescription:
      'One Rudraksha bead partially embedded in another — the “Savar” formation found especially in Indian origin beads.',
    significance:
      'Traditionally discussed as a accessible form of 1 Mukhi energy from India when round Nepali 1 Mukhi is unavailable.',
    benefits: [
      'Supports Shiva consciousness and spiritual ambition within reach of sincere seekers',
      'Traditionally aids leadership, detachment, and focused meditation',
      'Indian-origin alternative discussed for 1 Mukhi seekers with expert verification',
      'Carries composite symbolism of unity within duality',
    ],
    whoShouldWear:
      'Seekers of 1 Mukhi blessings who accept Sawar’s traditional Indian classification. Always verify with X-ray or expert mukhi analysis.',
    heroBenefits: ['Shiva consciousness', 'Indian 1 Mukhi link', 'Leadership focus', 'Composite unity'],
    rarityNote: 'Sawar should show natural embedding. Beware of artificially joined beads.',
  },
};

const IDOL_META: Record<string, IdolMeta> = {
  'shree-yantra': {
    deity: 'Tripura Sundari / Lalita Devi (Sri Chakra)',
    placement: 'Northeast (Ishanya) of home or office altar, facing East or West on a clean wooden or copper plate',
    significance:
      'The Sri Yantra is the geometric embodiment of cosmic creation — 43 interlocking triangles radiating from the bindu. Worship invites prosperity, wisdom, and Shakti’s orderly abundance.',
    materials: ['Panchdhatu', 'Copper', 'Brass', 'Crystal (Sphatik)', 'Gold-plated'],
    heroBenefits: ['Cosmic prosperity', 'Shakti geometry', 'Meditation focus', 'Vaastu harmony'],
    worshipNotes: 'Install on Friday or during Navratri after Sri Vidya or simple Lakshmi puja. Keep covered when not in active worship.',
  },
  'durga-devi': {
    deity: 'Goddess Durga (Mahishasuramardini)',
    placement: 'East or Northeast altar; never on the floor — minimum raised platform with red cloth',
    significance:
      'Durga embodies protective Shakti who destroys adharma and shields devotees. Her murti inspires courage, discipline, and righteous strength.',
    materials: ['Brass', 'Panchdhatu', 'Marble', 'Resin (for travel altars)', 'Silver'],
    heroBenefits: ['Protective Shakti', 'Fearlessness', 'Navratri worship', 'Righteous strength'],
    worshipNotes: 'Offer red flowers, kumkum, and durva during Navratri. Daily diya and Durga Chalisa deepen bhakti.',
  },
  hanuman: {
    deity: 'Lord Hanuman (Anjaneya / Bajrangbali)',
    placement: 'South-facing altar or entrance protection zone; avoid bedroom if tradition advises vigor',
    significance:
      'Hanuman personifies devotion, service, and fearless strength. His idol guards against negative forces and inspires unwavering Ram bhakti.',
    materials: ['Brass', 'Panchdhatu', 'Marble', 'Red stone (jasper)', 'Copper'],
    heroBenefits: ['Devotion & courage', 'Evil-eye shield', 'Hanuman Chalisa', 'Entrance protection'],
    worshipNotes: 'Offer sindoor, jasmine, and ladoos on Tuesdays and Saturdays. Chant Hanuman Chalisa daily for maximum traditional benefit.',
  },
  'shiv-ji': {
    deity: 'Lord Shiva (Mahadev)',
    placement: 'North or Northeast home temple; Shiva should not face south in main altar setups',
    significance:
      'Shiva is the destroyer of ignorance and source of yogic stillness. A Shiva murti anchors daily meditation, Abhishek, and Monday vrata.',
    materials: ['Brass', 'Panchdhatu', 'Marble', 'Parad (mercury — ritual grade only)', 'Crystal'],
    heroBenefits: ['Yogic stillness', 'Monday worship', 'Abhishek sadhana', 'Ignorance dissolution'],
    worshipNotes: 'Perform jal abhishek on Mondays; offer bilva patra, dhatura, and white flowers. Maintain somber, clean altar space.',
  },
  shivling: {
    deity: 'Shiva Lingam (cosmic pillar of consciousness)',
    placement: 'Northeast altar on yoni base with jaladhari for abhishek; never in bedroom per traditional guidance',
    significance:
      'The Lingam represents formless Shiva — the infinite pillar of light. Abhishek with milk, honey, and water is central to worship.',
    materials: ['Narmada Banalinga', 'Brass', 'Parad', 'Crystal Sphatik', 'Black stone (Narmada river)'],
    heroBenefits: ['Formless Shiva', 'Abhishek merit', 'Narmada sanctity', 'Cosmic pillar'],
    worshipNotes: 'Daily jal abhishek at Brahma muhurta is ideal. Use only ritual-grade materials; Narmada stones carry special pilgrimage merit.',
  },
  ganesha: {
    deity: 'Lord Ganesha (Vighnaharta)',
    placement: 'Entrance, Northeast, or West altar — traditionally first deity invoked before puja',
    significance:
      'Ganesha removes obstacles and blesses beginnings. Every auspicious work in Hindu tradition starts with Ganesh puja.',
    materials: ['Brass', 'Marble', 'Panchdhatu', 'Clay (eco-friendly festivals)', 'Silver'],
    heroBenefits: ['First worship', 'Obstacle removal', 'Auspicious starts', 'Wisdom & humility'],
    worshipNotes: 'Offer modak, durva grass, and red flowers on Wednesdays and Ganesh Chaturthi. Keep trunk direction per family tradition.',
  },
  lakshmi: {
    deity: 'Goddess Lakshmi (Mahalakshmi)',
    placement: 'Northeast or East altar; paired with Vishnu or Ganesha in many households',
    significance:
      'Lakshmi bestows ethical wealth, household harmony, and sattvic abundance. Diwali Lakshmi puja is her primary annual celebration.',
    materials: ['Brass', 'Panchdhatu', 'Marble', 'Silver', 'Gold-plated'],
    heroBenefits: ['Ethical wealth', 'Diwali blessings', 'Household harmony', 'Sattvic abundance'],
    worshipNotes: 'Worship on Fridays with lotus, coins, and kumkum. Maintain cleanliness — Lakshmi is said to reside where there is tidiness and dharma.',
  },
  nandi: {
    deity: 'Nandi (Shiva’s vahana and chief devotee)',
    placement: 'Facing Shiva Lingam or Shiva murti — traditionally south-facing toward the deity',
    significance:
      'Nandi symbolizes eternal listening, loyalty, and readiness to serve Shiva. Placed before Shiva, he receives prayers and transmits them.',
    materials: ['Brass', 'Panchdhatu', 'Stone', 'Bronze', 'Marble'],
    heroBenefits: ['Eternal devotion', 'Shiva darshan', 'Prayer transmission', 'Loyal service'],
    worshipNotes: 'Apply sandalwood and offer grass on Mondays. Nandi should always face Shiva — never placed randomly.',
  },
  saraswati: {
    deity: 'Goddess Saraswati (Vani / Sharada)',
    placement: 'East or Northeast study room altar; ideal near books and instruments',
    significance:
      'Saraswati governs knowledge, music, arts, and eloquent speech. Students and artists worship her for vidya and creative inspiration.',
    materials: ['Brass', 'Marble', 'Panchdhatu', 'White marble', 'Silver'],
    heroBenefits: ['Vidya & arts', 'Student blessings', 'Eloquent speech', 'Creative inspiration'],
    worshipNotes: 'Worship on Vasant Panchami and Thursdays. Offer white flowers, books, and veena or instrument symbolism.',
  },
  vishnu: {
    deity: 'Lord Vishnu (Narayana / preserver)',
    placement: 'East or Northeast altar; often central in Vaishnava home temples',
    significance:
      'Vishnu sustains dharma through his avatars. His murti inspires lawful living, family stability, and Narayana devotion.',
    materials: ['Brass', 'Panchdhatu', 'Marble', 'Copper', 'Gold-plated'],
    heroBenefits: ['Dharma preservation', 'Family stability', 'Vaishnava bhakti', 'Narayana grace'],
    worshipNotes: 'Offer tulsi, yellow flowers, and Panchamrit on Thursdays. Chant Vishnu Sahasranama for traditional merit.',
  },
};

const JEWELRY_META: Record<string, JewelryMeta> = {
  bracelets: {
    focus: 'Wrist-worn spiritual and astrological jewellery',
    heroBenefits: ['Daily wear comfort', 'Planetary contact', 'Stackable designs', 'Custom sizing'],
    styles: ['Rudraksha wrist malas', 'Gemstone bead bracelets', 'Navaratna bracelets', 'Silver and gold cuffs'],
    buyerNotes: 'Choose thread or metal based on astrologer guidance. Rudraksha bracelets often use 5 Mukhi for general protection.',
  },
  'rudraksha-jewelry': {
    focus: 'Bespoke Rudraksha jewellery designed to your mukhi and metal preference',
    heroBenefits: ['Custom mukhi selection', 'Personalized design', 'Energization included', 'Expert consultation'],
    styles: ['Custom pendants', 'Combination malas', 'Gold-capped beads', 'Designer fusion pieces'],
    buyerNotes: 'Share your spiritual goals and chart details for mukhi matching. Custom pieces are energized before dispatch.',
  },
  'ready-rudraksha-jewelry-stock': {
    focus: 'Ready-to-ship Rudraksha jewellery for immediate wear',
    heroBenefits: ['Instant availability', 'Pre-energized options', 'Verified mukhi', 'Gift-ready packaging'],
    styles: ['Pendant sets', 'Bracelet stock', 'Mala-pendant combos', 'Silver-mounted beads'],
    buyerNotes: 'Ideal when you need authentic Rudraksha jewellery without custom lead time. Check mukhi count on each listing.',
  },
  'rudraksha-pendents': {
    focus: 'Rudraksha pendants for neck wear and constant Shiva remembrance',
    heroBenefits: ['Heart-center proximity', 'Caps in gold/silver', 'Single or combo mukhi', 'Daily sadhana aid'],
    styles: ['Single-bead pendants', 'Gauri Shankar pendants', 'Ganesh Rudraksha pendants', 'Mukhi-specific talismans'],
    buyerNotes: 'Pendants keep the bead near the heart chakra. Select cap metal per Jyotish advice — gold, silver, or Panchdhatu.',
  },
  'diamond-jewellery': {
    focus: 'Natural diamond jewellery with Vedic design sensibility',
    heroBenefits: ['Venus (Shukra) elegance', 'Certified diamonds', 'Heirloom craftsmanship', 'Custom settings'],
    styles: ['Diamond rings', 'Stud earrings', 'Pendant solitaires', 'Eternity bands'],
    buyerNotes: 'Diamonds are linked to Shukra in Jyotish. Confirm certification (GIA/IGI) and suitability before astrological wear.',
  },
  'astro-gems-stock': {
    focus: 'Ready-set astrological gemstone jewellery in stock',
    heroBenefits: ['Pre-set Navaratna', 'Open-back rings', 'Quick Jyotish remedies', 'Lab-certified stones'],
    styles: ['Gem rings', 'Pendant stocks', 'Rashi ratna sets', 'Panchdhatu mounts'],
    buyerNotes: 'Each piece lists stone origin, treatment, and carat. Consult our Jyotish team to confirm finger and metal before wearing.',
  },
  ring: {
    focus: 'Vedic gemstone and spiritual rings for graha remedies',
    heroBenefits: ['Finger-specific remedies', 'Open-back settings', 'Skin contact design', 'Custom ring sizes'],
    styles: ['Navaratna rings', 'Single-stone Jyotish rings', 'Rudraksha rings', 'Signet and band styles'],
    buyerNotes: 'Correct finger (e.g., middle for Saturn, ring for Sun) is essential. Never wear conflicting stones without chart review.',
  },
  pendant: {
    focus: 'Gemstone and sacred pendants for neck-level planetary influence',
    heroBenefits: ['Heart-throat alignment', 'Daily visibility', 'Energized before wear', 'Chain pairing guidance'],
    styles: ['Gem pendants', 'Yantra pendants', 'Rudraksha-gem combos', 'Devotional lockets'],
    buyerNotes: 'Pendants suit those who cannot wear rings professionally. Ensure stone touches skin through open-back design.',
  },
  necklace: {
    focus: 'Necklaces and chains featuring gems, Rudraksha, or sacred motifs',
    heroBenefits: ['Statement devotion', 'Multi-stone harmony', 'Layered spiritual style', 'Ceremonial elegance'],
    styles: ['Navaratna necklaces', 'Rudraksha malas as necklaces', 'Gem chokers', 'Temple jewellery replicas'],
    buyerNotes: 'Multi-gem necklaces require full chart analysis. Single-stone or Rudraksha necklaces are safer for general wear.',
  },
  earring: {
    focus: 'Gemstone and diamond earrings for Shukra grace and everyday elegance',
    heroBenefits: ['Venus enhancement', 'Lightweight daily wear', 'Matching sets available', 'Hypoallergenic options'],
    styles: ['Stud earrings', 'Drop earrings', 'Pearl and coral pairs', 'Diamond hoops'],
    buyerNotes: 'Earrings are primarily ornamental in Jyotish but natural pearls and diamonds support Shukra when worn with intention.',
  },
  'exclusive-rudraksha-malas': {
    focus: 'Premium and rare Rudraksha malas for serious sadhana and collectors',
    heroBenefits: ['Rare mukhi combinations', 'Collector-grade beads', 'Hand-knotted tradition', 'Siddha mala options'],
    styles: ['Indra mala designs', 'Siddha malas', 'Multi-mukhi combinations', 'Gold-spacer malas'],
    buyerNotes: 'Exclusive malas may combine multiple mukhis — wear only with guru or astrologer guidance due to combined energies.',
  },
};

const MALA_META: JewelryMeta = {
  focus: 'Rudraksha japa malas for mantra repetition and meditation',
  heroBenefits: ['108-bead tradition', 'Japa discipline', 'Meditation focus', 'Multiple mukhi options'],
  styles: ['5 Mukhi japa malas', 'Sphatik combination malas', 'Tulsi-Rudraksha malas', 'Wrist malas (27/54 beads)'],
  buyerNotes: 'Standard japa mala has 108 beads plus meru (guru bead). Use same mukhi throughout unless advised for combination malas.',
};

function toHeroBenefits(texts: [string, string, string, string]): HeroBenefit[] {
  return texts.map((text) => ({ text }));
}

function rudrakshaKeywords(slug: string, label: string, extra: string[] = []): string[] {
  return mergeKeywords(
    [
      slug,
      label.toLowerCase(),
      'rudraksha',
      'buy rudraksha online',
      'certified rudraksha',
      'nepal rudraksha',
      'energized rudraksha',
      'shiva bead',
      'mukhi rudraksha',
      BRAND.toLowerCase(),
      `${label.toLowerCase()} benefits`,
      `how to wear ${label.toLowerCase()}`,
      `${label.toLowerCase()} price`,
    ],
    extra,
  );
}

function idolKeywords(slug: string, label: string, deity: string): string[] {
  return mergeKeywords([
    slug,
    label.toLowerCase(),
    deity.toLowerCase(),
    'brass idol',
    'panchdhatu murti',
    'buy idol online',
    'home temple',
    'puja murti',
    BRAND.toLowerCase(),
    `${label.toLowerCase()} idol`,
    `${label.toLowerCase()} placement`,
  ]);
}

function jewelryKeywords(slug: string, label: string): string[] {
  return mergeKeywords([
    slug,
    label.toLowerCase(),
    'vedic jewellery',
    'spiritual jewellery',
    'buy online',
    'custom jewellery',
    BRAND.toLowerCase(),
    `${label.toLowerCase()} price`,
    'energized jewellery',
  ]);
}

function baseRudrakshaFaqs(label: string, mukhi?: number): CategoryFaq[] {
  const mukhiRef = mukhi ? `${mukhi} Mukhi` : label;
  return [
    {
      question: `How do I verify authentic ${label}?`,
      answer: `Authentic ${label} shows natural mukhi lines, proper bead symmetry, and documented origin. At ${BRAND}, we disclose Nepal/Java/Indian source, offer X-ray verification on premium beads, and never sell carved or glued composite beads as natural formations.`,
    },
    {
      question: `Can anyone wear ${mukhiRef} Rudraksha?`,
      answer: mukhi === 5
        ? `Yes — 5 Mukhi is the most universally recommended Rudraksha in tradition, suitable for men, women, and children after basic energization.`
        : `${mukhiRef} carries specific deity and planetary associations. Consult our experts or your astrologer before wearing, especially for higher mukhis (14+). ${BRAND} offers expert guidance at checkout.`,
    },
    {
      question: `What thread or metal should I use for ${label}?`,
      answer: `Traditionally, red or yellow silk/cotton thread is used for Rudraksha. Gold or silver capping is optional and often recommended for single-bead pendants. Avoid wearing Rudraksha while bathing in chemical soaps or during mourning periods per family tradition.`,
    },
    {
      question: `Does ${BRAND} energize ${label} before shipping?`,
      answer: `Yes. We offer Pran Pratishtha and Rudra abhishek energization services. Beads are cleansed, mantra-infused, and packed in sanctified cloth. You may perform a simple home puja with Om Namah Shivaya before first wear.`,
    },
    {
      question: `How should I care for my ${label}?`,
      answer: `Wipe with a clean dry cloth. Occasionally apply a drop of sandalwood or mustard oil to prevent cracking. Store in a cloth pouch away from perfumes. Remove before sleeping if your tradition advises, or wear continuously if your guru recommends.`,
    },
    {
      question: `Does ${BRAND} ship ${label} internationally?`,
      answer: `We ship certified Rudraksha across India and to the UK, USA, Canada, Australia, UAE, and Singapore with insured packaging and customs documentation where required.`,
    },
  ];
}

function buildMukhiContent(slug: string, label: string, mukhi: number): RichGemSections {
  const meta = MUKHI_META[mukhi];
  const shortLabel = `${mukhi} Mukhi Rudraksha`;
  const seo = mukhiMeta(mukhi);

  return {
    intro: `Original ${shortLabel} for ${meta.deity}${meta.planet ? `, linked to ${meta.planet}` : ''}. ${BRAND} lists certified ${shortLabel} with origin and mukhi count on the report.`,
    hero_benefits: toHeroBenefits(meta.heroBenefits),
    seo_title: seo.seo_title,
    seo_description: seo.seo_description,
    meta_keywords: rudrakshaKeywords(slug, label, [
      `${mukhi} mukhi rudraksha`,
      `original ${mukhi} mukhi rudraksha`,
      `${mukhi} mukhi rudraksha price`,
      'certified rudraksha',
      'nepal rudraksha',
      meta.deity.toLowerCase(),
      meta.planet?.toLowerCase() ?? '',
    ]),
    about_html: [
      p(
        `${shortLabel} has ${mukhi} natural mukhi lines. In Shiva Purana and Rudraksha Jabala Upanishad lists, this original ${shortLabel} is sacred to ${meta.deity}.`,
        meta.rarityNote ??
          `A certified ${shortLabel} is listed with mm size, origin, and mukhi count. ${BRAND} does not sell carved lines as natural ${shortLabel}.`,
      ),
      h2(`What is ${shortLabel}`),
      p(
        `${shortLabel} is an Elaeocarpus ganitrus bead with ${mukhi} faces. Original ${shortLabel} is not plastic and not a glued extra line.`,
        `Nepal ${shortLabel} is the grade we prefer for sadhana. Java beads are smaller and suit malas.`,
      ),
    ].join('\n'),
    benefits_html:
      h3('Traditional Benefits') +
      ul(meta.benefits) +
      p(
        `These uses of ${shortLabel} are traditional. Wear, mantra, and dharma still do the work. The bead is not medical care.`,
      ),
    who_should_wear_html: p(
      meta.whoShouldWear,
      `Book a <a href="/consultation">consultation</a> if you are unsure which original ${shortLabel} fits. Chart first for rare mukhis.`,
    ),
    how_to_wear_html:
      h3(`How to wear ${shortLabel}`) +
      ul([
        `Energize original ${shortLabel} with jal abhishek, bilva or flowers, and ${meta.mantra ?? RUDRAKSHA_MANTRA} — ideally on ${RUDRAKSHA_DAY}.`,
        `Wear ${shortLabel} on a neck thread or capped pendant so the bead can rest near the heart.`,
        'Women may pause or continue wear during menstruation per family lineage.',
        'Remove during funeral visits if your guru asks strict observance.',
        `${BRAND} offers energization at checkout with every certified ${shortLabel}.`,
      ]),
    types_html:
      h3(`${shortLabel} origins`) +
      ul([
        `Nepal original ${shortLabel} — larger bead, deep mukhi lines`,
        `Java ${shortLabel} — smaller, smoother, common in malas`,
        'Indian lots include Sawar and rare formations',
        mukhi === 1
          ? 'Round 1 Mukhi Rudraksha is rare; crescent and Sawar are discussed in Indian tradition'
          : `Gauri Shankar and Ganesh forms are not substitutes for ${shortLabel} unless tradition names them`,
      ]),
    quality_price_html: [
      h2(`${shortLabel} Price`),
      p(
        `${shortLabel} price follows mm size, origin, line clarity, and whether the bead is collector-grade. Higher mukhis (14–21) sit far above a 5 Mukhi Rudraksha of the same size.`,
        `Compare original ${shortLabel} by X-ray on premium lots, not by a pretty photo. ${BRAND} publishes origin on the listing.`,
      ),
      meta.rarityNote ? p(meta.rarityNote) : '',
    ].join('\n'),
    jewellery_html: p(
      `${shortLabel} is capped in gold, silver, or Panchdhatu. A single original ${shortLabel} pendant is the usual Jyotish wear. Uniform ${shortLabel} malas are for japa.`,
    ),
    cleaning_care_html:
      h3(`Care for ${shortLabel}`) +
      ul([
        `Wipe original ${shortLabel} with a soft cloth; a drop of sandalwood oil monthly`,
        'Skip chemical soap, perfume, and chlorine on the bead',
        'No ultrasonic — Rudraksha is seed, not gem corundum',
        `Store certified ${shortLabel} in a cotton pouch on the altar`,
      ]),
    buyer_beware_html: [
      h2(`Original ${shortLabel} vs Fake`),
      p(
        `Carved lines and plastic are sold as original ${shortLabel}. If ${shortLabel} price is souvenir-cheap, assume a fake.`,
        `Demand X-ray on premium ${shortLabel}. ${BRAND} will not list glued mukhis as certified ${shortLabel}.`,
      ),
    ].join('\n'),
    faqs: [
      {
        question: `What is ${shortLabel}?`,
        answer: `${shortLabel} is a natural Rudraksha bead with ${mukhi} faces, sacred to ${meta.deity}. Original ${shortLabel} shows natural lines, not carved grooves.`,
      },
      {
        question: `What is ${shortLabel} price in India?`,
        answer: `${shortLabel} price follows size, Nepal vs Java origin, and X-ray grade. Rare mukhis cost more than a common 5 Mukhi Rudraksha.`,
      },
      {
        question: `What is original ${shortLabel}?`,
        answer: `Original ${shortLabel} is an untreated Elaeocarpus seed with ${mukhi} natural mukhis. Plastic and extra-cut lines are not original ${shortLabel}.`,
      },
      {
        question: `Is ${shortLabel} certified?`,
        answer: `Certified ${shortLabel} at ${BRAND} is listed with origin and, on premium beads, X-ray so inner compartments match the face count.`,
      },
      {
        question: `Where to buy ${shortLabel} online?`,
        answer: `Buy original ${shortLabel} on this collection after a mukhi check. ${BRAND} ships certified ${shortLabel} in India and abroad.`,
      },
      ...baseRudrakshaFaqs(label, mukhi),
    ],
  };
}

const SPECIAL_RUDRAKSHA_SEO: Record<string, { phrase: string }> = {
  'gauri-shankar': { phrase: 'Gauri Shankar Rudraksha' },
  'ganesh-rudraksha': { phrase: 'Ganesh Rudraksha' },
  'nir-mukhi': { phrase: 'Nir Mukhi Rudraksha' },
  'garbh-gauri': { phrase: 'Garbh Gauri Rudraksha' },
  'sawar-rudraksha': { phrase: 'Sawar Rudraksha' },
};

function buildSpecialRudrakshaContent(slug: string, label: string): RichGemSections | null {
  const meta = SPECIAL_RUDRAKSHA_META[slug];
  if (!meta) return null;
  const seo = SPECIAL_RUDRAKSHA_SEO[slug];
  const phrase = seo?.phrase ?? label;
  const low = phrase.toLowerCase();

  return {
    intro: `Original ${phrase} — ${meta.formDescription} ${BRAND} lists certified ${phrase} with natural-formation checks, never glued fakes.`,
    hero_benefits: toHeroBenefits(meta.heroBenefits),
    seo_title: certifiedRudrakshaHubTitle(phrase),
    seo_description: `Certified ${low} and original ${low}. ${low} price with natural-formation checks and energization.`,
    meta_keywords: rudrakshaKeywords(slug, label, [low, `original ${low}`, `${low} price`, 'certified rudraksha']),
    about_html: [
      p(meta.formDescription, meta.significance, meta.rarityNote ?? `${BRAND} inspects each original ${phrase} before listing.`),
      h2(`What is ${phrase}`),
      p(
        `${phrase} is a natural Rudraksha formation, not a factory glue job. Original ${phrase} keeps the seed structure intact.`,
      ),
    ].join('\n'),
    benefits_html: h3(`Benefits of ${phrase}`) + ul(meta.benefits),
    who_should_wear_html: p(
      meta.whoShouldWear,
      `Confirm original ${phrase} in consultation if the formation is rare.`,
    ),
    how_to_wear_html:
      h3(`How to wear ${phrase}`) +
      ul([
        `Energize original ${phrase} on Monday with jal abhishek and ${meta.mantra ?? RUDRAKSHA_MANTRA}.`,
        `Wear ${phrase} as a pendant near the heart, or as your guru names.`,
        'Gauri Shankar pairs are often worn by couples — still verify natural fusion.',
        `${BRAND} sends wearing notes with certified ${phrase}.`,
      ]),
    types_html: p(
      `Authentic ${phrase} is identified by natural structure. Photos, mm size, and origin sit on every original ${phrase} listing.`,
    ),
    quality_price_html: [
      h2(`${phrase} Price`),
      p(
        `${phrase} price sits above a standard mukhi of the same mm because the formation is rarer. Compare original ${phrase} by fusion or trunk quality, not by a cheap lookalike.`,
      ),
      meta.rarityNote ? p(meta.rarityNote) : '',
    ].join('\n'),
    jewellery_html: p(
      `${phrase} is usually gold- or silver-capped. Do not drill through the sacred join of original ${phrase} if a cap will hold it.`,
    ),
    cleaning_care_html: p(
      `Wipe original ${phrase} dry. Occasional sandalwood oil. Keep certified ${phrase} off chemical soap.`,
    ),
    buyer_beware_html: [
      h2(`Original ${phrase} vs Fake`),
      p(
        `Glued twins and carved trunks are sold as original ${phrase}. If ${phrase} price is souvenir-cheap, walk away.`,
        `${BRAND} will not list a glued bead as certified ${phrase}.`,
      ),
    ].join('\n'),
    faqs: [
      {
        question: `What is ${phrase}?`,
        answer: `${phrase} is a natural Rudraksha formation. ${meta.significance} Original ${phrase} is not glued or carved.`,
      },
      {
        question: `What is ${phrase} price in India?`,
        answer: `${phrase} price follows size, origin, and how clean the natural formation is. Fakes sit far below original ${phrase}.`,
      },
      {
        question: `What is original ${phrase}?`,
        answer: `Original ${phrase} grew as one seed structure. Glue lines and carved trunks are not original ${phrase}.`,
      },
      {
        question: `Is ${phrase} certified?`,
        answer: `Certified ${phrase} at ${BRAND} is checked for natural formation. Ask for photos of the join or trunk before you buy.`,
      },
      {
        question: `Where to buy ${phrase} online?`,
        answer: `Buy original ${phrase} on this collection. ${BRAND} ships certified ${phrase} with energization on request.`,
      },
      ...baseRudrakshaFaqs(label),
    ],
  };
}

function buildIdolContent(slug: string, label: string): RichGemSections | null {
  const meta = IDOL_META[slug];
  if (!meta) return null;

  return {
    intro: `Bring ${meta.deity}’s presence into your home with an authentic ${label} from ${BRAND}. Each murti is selected for craftsmanship, proportional accuracy, and suitability for daily puja or festival worship.`,
    hero_benefits: toHeroBenefits(meta.heroBenefits),
    seo_description: `Buy ${label} online at ${BRAND}. Authentic ${meta.materials.slice(0, 2).join(' & ')} murti, traditional placement guidance, puja significance, and worldwide delivery for your home temple.`,
    meta_keywords: idolKeywords(slug, label, meta.deity),
    about_html:
      p(
        `${meta.deity} — ${meta.significance}`,
        `${BRAND} offers ${label} in premium materials for home mandirs, office altars, and gifting. Our heritage in sacred items dates to 1937.`,
        `Anyone establishing a home temple, upgrading an altar, or seeking a meaningful spiritual gift will benefit from ${label}. No astrological restriction — devotion and cleanliness matter most.`,
      ),
    benefits_html:
      h3('Worship Significance') +
      ul([
        'Anchors daily puja discipline and family spiritual rhythm',
        'Invites divine qualities associated with the deity into the household',
        'Supports festival observances and life-cycle samskaras',
        'Creates a sanctified space for meditation and children’s cultural education',
      ]),
    how_to_wear_html:
      h3('Placement & Installation') +
      ul([
        `Ideal placement: ${meta.placement}`,
        'Install on Pratishtha day or during auspicious muhurta when possible',
        'Perform simple pran pratishtha with mantra, diya, and offerings',
        meta.worshipNotes,
      ]) +
      h3('Care & Cleaning') +
      ul([
        'Brass/Panchdhatu: tamarind or lemon-salt paste, rinse, dry immediately',
        'Marble: dry cloth only; avoid acidic cleaners',
        'Apply sandalwood or kumkum tilak after cleaning — never leave wet on metal',
        'Keep altar dust-free; incense residue wipes with soft dry cloth',
      ]),
    types_html:
      h3('Materials Available') +
      ul(meta.materials.map((m) => `${m} — durable, traditional finish suitable for abhishek or dry worship`)) +
      p(
        `Smaller ${label} idols suit car dashboards and travel altars. Larger murtis anchor main home temples. Pair with matching puja thali, diya, and bell from our collection.`,
      ),
    quality_price_html: p(
      `Price depends on material, weight, detailing, and finish (hand-polished vs machine). Panchdhatu and silver command premium; brass offers excellent daily puja value.`,
      `${BRAND} lists dimensions and weight for informed comparison.`,
    ),
    buyer_beware_html: p(
      'Avoid idols with sharp unfinished edges, incorrect iconography, or hollow thin casting that dents easily.',
      `${BRAND} inspects every murti for proportional accuracy and stable base before dispatch.`,
    ),
    faqs: [
      {
        question: `Where should I place ${label} at home?`,
        answer: meta.placement,
      },
      {
        question: `What material is best for ${label}?`,
        answer: `Brass and Panchdhatu are most popular for daily puja. Marble suits dry worship. ${BRAND} lists material, weight, and care notes on every idol page.`,
      },
      {
        question: `Do I need pran pratishtha for ${label}?`,
        answer: `Traditional practice invites the deity’s presence through pran pratishtha. ${BRAND} offers energization services; you may also perform simple home sthapana with mantra and diya.`,
      },
      {
        question: `How do I clean ${label} without damage?`,
        answer: `Use material-appropriate cleaning — brass with tamarind/lemon, marble dry-only. Avoid steel scrubbers. ${BRAND} includes a care card with each idol.`,
      },
      {
        question: `Can ${BRAND} ship ${label} internationally?`,
        answer: `Yes — we ship idols with secure foam packaging to India, UK, USA, Canada, Australia, and UAE. Customs duties may apply per destination law.`,
      },
      {
        question: `Is ${label} suitable as a gift?`,
        answer: `Absolutely. Devotional idols are cherished housewarming, wedding, and festival gifts. ${BRAND} offers gift wrapping and auspicious dispatch timing on request.`,
      },
    ],
  };
}

function buildJewelryContent(slug: string, label: string): RichGemSections {
  const meta = JEWELRY_META[slug] ?? {
    focus: `${label} for spiritual and astrological wear`,
    heroBenefits: ['Certified quality', 'Custom designs', 'Energized dispatch', 'Expert Jyotish guidance'] as [
      string,
      string,
      string,
      string,
    ],
    styles: ['Rings', 'Pendants', 'Bracelets', 'Custom settings'],
    buyerNotes: `Explore ${label} at ${BRAND} with transparent pricing and consultation.`,
  };

  return {
    intro: `Explore ${label} at ${BRAND} — ${meta.focus}. Our fourth-generation craftsmen blend Vedic tradition with certified gemstones, Rudraksha, and precious metals.`,
    hero_benefits: toHeroBenefits(meta.heroBenefits),
    seo_description: `Shop ${label} online at ${BRAND}. ${meta.focus}. Custom sizing, lab-certified stones, energization, and worldwide insured delivery.`,
    meta_keywords: jewelryKeywords(slug, label),
    about_html: p(
      `${BRAND} designs and curates ${label} for devotees, astrological remedies, and heirloom gifting. Every piece balances sacred intention with wearable craftsmanship.`,
      meta.buyerNotes,
    ),
    benefits_html:
      h3('Why Choose Our Jewellery') +
      ul([
        'Lab-certified gemstones with treatment disclosure',
        'Open-back settings for skin contact in Jyotish rings',
        'Energization and puja before dispatch on request',
        'Custom configurator for metal, size, and stone selection',
      ]),
    who_should_wear_html: p(
      `Anyone wearing ${label} for devotion, astrological remedy, or fine jewellery should confirm suitability with our Jyotish team — especially for multi-stone designs.`,
    ),
    how_to_wear_html:
      h3('Wearing Guidance') +
      ul([
        'Confirm correct finger, day, and metal with chart analysis before first wear',
        'Perform cleansing puja with raw milk, Ganga jal, and appropriate Beej mantra',
        'Wear on the advised weekday morning after sunrise for traditional activation',
        `${BRAND} sends a wearing guide tailored to your purchased piece`,
      ]),
    types_html:
      h3('Styles in This Collection') +
      ul(meta.styles) +
      p(
        `Use our online configurator to design ${label} with your chosen stones, metal (gold, silver, Panchdhatu), and engraving. Ready-stock items ship faster for urgent remedies.`,
      ),
    quality_price_html: p(
      `Pricing reflects metal purity, stone carat, craftsmanship, and certification level. ${BRAND} shows live pricing in our configurator — no hidden treatments or glass-filled stones.`,
    ),
    cleaning_care_html: p(
      'Clean gemstones with lukewarm water and mild soap; dry thoroughly. Store separately to prevent scratches. Remove before gym, swimming, and harsh chemical exposure.',
    ),
    buyer_beware_html: p(
      'Avoid uncertified diamonds, fracture-filled emeralds, and synthetic stones sold as natural. Demand lab reports for every astrological purchase.',
      `${BRAND} has built trust since 1937 through full disclosure on every piece.`,
    ),
    faqs: [
      {
        question: `Can I customize ${label} at ${BRAND}?`,
        answer: `Yes. Use our configurator or contact our team for bespoke ${label} with your preferred stones, metal purity, and design references.`,
      },
      {
        question: `Are stones in ${label} certified?`,
        answer: `Every astrological piece includes certification details where applicable. We disclose origin, treatment, and carat weight transparently.`,
      },
      {
        question: `Do you energize ${label} before shipping?`,
        answer: `Energization and puja services are available at checkout. Pieces are cleansed and packed in sanctified packaging.`,
      },
      {
        question: `What is the delivery time for ${label}?`,
        answer: `Ready-stock ships within 2–5 business days. Custom ${label} typically requires 10–21 days depending on design complexity.`,
      },
      {
        question: `Does ${BRAND} ship ${label} internationally?`,
        answer: `We ship to India, UK, USA, Canada, Australia, UAE, and Singapore with insured delivery and customs documentation.`,
      },
      {
        question: `How do I know which ${label} suits my chart?`,
        answer: `Book a Jyotish consultation with ${BRAND}. We review your birth chart, dasha, and goals before recommending stones, metal, and finger.`,
      },
    ],
  };
}

function buildMalaContent(slug: string, label: string): RichGemSections {
  const meta = MALA_META;

  return {
    intro: `${label} from ${BRAND} support japa, meditation, and Shiva remembrance. ${meta.focus} — hand-selected beads with uniform mukhi and traditional knotting.`,
    hero_benefits: toHeroBenefits(meta.heroBenefits),
    seo_title: 'Buy Rudraksha Mala Online | 108 Japa Malas',
    seo_description: `Buy certified Rudraksha malas online at ${BRAND}. Authentic 108-bead japa malas, mukhi options, energization, and worldwide delivery.`,
    meta_keywords: mergeKeywords(jewelryKeywords(slug, label), [
      'japa mala',
      '108 mala',
      'rudraksha mala',
      'meditation mala',
      'buy rudraksha mala',
    ]),
    about_html: p(
      'The Rudraksha mala is the quintessential tool for mantra japa — 108 repetitions circling back to the meru (guru) bead without crossing it.',
      meta.buyerNotes,
      `${BRAND} malas are strung with traditional knots between beads to prevent friction and energy loss.`,
    ),
    benefits_html:
      h3('Benefits of Japa Mala') +
      ul([
        'Structures daily mantra discipline and counts repetitions accurately',
        '5 Mukhi malas are universal for Om Namah Shivaya and general sadhana',
        'Combination malas for advanced practices require guru guidance',
        'Wrist malas (27/54 beads) suit workplace remembrance',
      ]),
    who_should_wear_html: p(
      'Any Shiva devotee, meditator, or mantra practitioner benefits from a Rudraksha mala. Beginners should start with 5 Mukhi; advanced seekers may explore Siddha or Indra mala designs with expert advice.',
    ),
    how_to_wear_html:
      h3('How to Use Your Mala') +
      ul([
        'Hold in right hand (left for left-handed practitioners per guru parampara)',
        'Start after first bead adjacent to meru; never cross the meru bead',
        'Chant mentally or aloud with each bead roll between middle finger and thumb',
        'Wear around neck folded double or coiled on wrist when not in active japa',
      ]),
    types_html: h3('Mala Types') + ul(meta.styles),
    quality_price_html: p(
      'Mala price depends on mukhi count, bead size, origin, knotting quality, and spacers (silver/gold). Larger Nepal beads in rare mukhis create collector-grade malas.',
    ),
    cleaning_care_html: p(
      `Wipe beads after japa; oil monthly. Restring if thread weakens — ${BRAND} offers restringing guidance. Keep mala off the floor and away from footwear.`,
    ),
    buyer_beware_html: p(
      'Avoid malas with mis-counted beads, dyed wood passed as Rudraksha, or mixed mukhis without disclosure.',
      `${BRAND} counts every mala before dispatch and verifies mukhi uniformity.`,
    ),
    faqs: [
      {
        question: 'What does a Rudraksha mala cost?',
        answer: 'Price depends on mukhi count, bead size, origin (Nepal vs Java), knotting, and spacers. A standard 5 Mukhi 108-bead japa mala is the most accessible; rare mukhi or gold-spacer malas cost more.',
      },
      {
        question: 'Who should wear a Rudraksha mala?',
        answer: 'Beginners usually start with a 5 Mukhi 108-bead mala for daily japa. Combination or high-mukhi malas need guru or astrologer guidance. Malas support sadhana; they are not a substitute for medical care.',
      },
      {
        question: 'Why 108 beads on a japa mala?',
        answer: '108 is sacred in Vedic cosmology — sun diameter, moon distance ratios, and mantra numerology. The meru (guru) bead marks the 109th point and is not crossed during japa.',
      },
      {
        question: `Which mukhi is best for ${label}?`,
        answer: '5 Mukhi is the standard for universal Shiva japa. Higher mukhis are used in specific Siddha mala traditions — consult our team before purchasing combination malas.',
      },
      {
        question: 'Can I wear my mala all day?',
        answer: 'Yes, many devotees wear 5 Mukhi malas continuously. Remove during bathing with chemicals or per orthodox restrictions your guru advises.',
      },
      {
        question: `Does ${BRAND} energize malas?`,
        answer: 'Yes — optional Rudra abhishek energization is available. Malas are packed in sanctified cloth with a usage guide.',
      },
      {
        question: 'How do I restring my mala?',
        answer: `Use pure silk or cotton thread. ${BRAND} provides restringing instructions and can service premium malas on request.`,
      },
      {
        question: `Does ${BRAND} ship ${label} internationally?`,
        answer: 'We ship malas worldwide with insured packaging to all major destinations.',
      },
    ],
  };
}

const MUKHI_SLUGS = new Set(
  Array.from({ length: 21 }, (_, i) => `${i + 1}-mukhi`),
);

const SPECIAL_RUDRAKSHA_SLUGS = new Set(Object.keys(SPECIAL_RUDRAKSHA_META));
const IDOL_SLUGS = new Set(Object.keys(IDOL_META));
const JEWELRY_SLUGS = new Set(Object.keys(JEWELRY_META));
const MALA_SLUGS = new Set(['malas']);

const KNOWN_CATALOG_SLUGS = new Set([
  ...MUKHI_SLUGS,
  ...SPECIAL_RUDRAKSHA_SLUGS,
  ...IDOL_SLUGS,
  ...JEWELRY_SLUGS,
  ...MALA_SLUGS,
]);

function parseMukhiSlug(slug: string): number | null {
  const match = slug.match(/^(\d+)-mukhi$/);
  if (!match) return null;
  const n = Number(match[1]);
  return n >= 1 && n <= 21 ? n : null;
}

export function getCatalogRichContent(
  slug: string,
  label: string,
  category: 'rudraksha' | 'idol' | 'jewelry' | 'mala',
): RichGemSections | null {
  if (!KNOWN_CATALOG_SLUGS.has(slug)) return null;

  if (category === 'rudraksha') {
    const mukhi = parseMukhiSlug(slug);
    if (mukhi) return buildMukhiContent(slug, label, mukhi);
    return buildSpecialRudrakshaContent(slug, label);
  }

  if (category === 'idol') {
    return buildIdolContent(slug, label);
  }

  if (category === 'jewelry') {
    return buildJewelryContent(slug, label);
  }

  if (category === 'mala') {
    return buildMalaContent(slug, label);
  }

  return null;
}
