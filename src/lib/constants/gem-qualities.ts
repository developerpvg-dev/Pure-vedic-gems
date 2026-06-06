export type GemQuality = {
  slug: string;
  name: string;
  hindiName: string;
  planet: string;
  deity: string;
  cosmicRay: string;
  color: string;
  rashis: string[];
  benefits: string[];
  sources: string[];
  identifyingFeatures: string[];
  qualityGrades: { tier: string; badge: string; color: string; description: string }[];
  commonFakes: string[];
  beejMantra: string;
  ringFinger: string;
  day: string;
  weightGuidance: string;
  heroImage: string;
  intro: string;
  longDescription: string;
  metalSuggestion: string;
  accent: string; // hex accent color for cards
};

const COMMON_GRADES = (gemName: string, finestNote: string): GemQuality['qualityGrades'] => [
  {
    tier: 'Premium',
    badge: 'Jyotish Grade',
    color: '#4D0A0A',
    description: `Top-tier ${gemName} of natural origin — eye-clean, unheated and untreated, with vivid colour saturation. Reserved for serious Jyotish remedy and family heirlooms. ${finestNote}`,
  },
  {
    tier: 'Fine',
    badge: 'Lab Certified',
    color: '#7A1515',
    description: `Premium commercial grade ${gemName} with very minor inclusions visible only under magnification. Excellent astrological efficacy when lab-certified as natural.`,
  },
  {
    tier: 'Standard',
    badge: 'Wearable',
    color: '#B8861E',
    description: `Affordable, naturally formed ${gemName} that may carry minor inclusions visible to the unaided eye but retains the planetary signature. Suitable for daily-wear remedial jewellery.`,
  },
];

export const GEM_QUALITIES: GemQuality[] = [
  {
    slug: 'emerald',
    name: 'Emerald',
    hindiName: 'Panna',
    planet: 'Mercury (Budh)',
    deity: 'Lord Vishnu / Budh',
    cosmicRay: 'Green',
    color: 'Lush grass-green to deep velvety green',
    rashis: ['Gemini (Mithun)', 'Virgo (Kanya)'],
    benefits: [
      'Sharpens intellect, memory and analytical reasoning.',
      'Improves communication, writing and public-speaking abilities.',
      'Strengthens the nervous system and balances Vata-related disorders.',
      'Brings success in education, commerce, trade and intellectual pursuits.',
      'Helps with stuttering, speech defects and respiratory weakness.',
    ],
    sources: ['Colombia (Muzo, Chivor)', 'Zambia', 'Brazil', 'Pakistan (Swat Valley)', 'Russia (Ural)', 'Afghanistan', 'Egypt', 'India (Rajasthan)'],
    identifyingFeatures: [
      'Natural inclusions called Jardin — fine garden-like patterns are a hallmark of natural origin.',
      'Slight dichroism — colour shifts subtly between bluish-green and yellowish-green.',
      'Cool to the touch and softer than sapphire (Mohs 7.5–8).',
      'Distinct hexagonal crystal habit when in rough form.',
    ],
    qualityGrades: COMMON_GRADES(
      'Emerald',
      'Old-mine Colombian Muzo material commands the highest premium.'
    ),
    commonFakes: [
      'Green glass and synthetic spinel substitutes with no Jardin.',
      'Beryl filled with cedarwood/Opticon resin to mask cracks.',
      'Doublets — thin emerald layered over green glass or quartz.',
      'Synthetic hydrothermal emeralds sold as natural.',
    ],
    beejMantra: 'Om Bram Brim Broum Sah Budhaya Namah',
    ringFinger: 'Little finger',
    day: 'Wednesday morning',
    weightGuidance: 'Generally 3 to 7 carats; weight should match planetary strength and body-weight ratio as advised by the astrologer.',
    heroImage: '/gems-knowledge/emerald.jpg',
    intro:
      'Emerald — Panna — is the Vedic gem of Mercury. It opens the doors of intellect, eloquence and prosperity for those whose chart aligns with the Budh principle.',
    longDescription:
      'Emerald is one of the most powerful Jyotish gemstones, transmitting the cool green cosmic ray of Mercury. Worn correctly it can transform the wearer’s capacity for clear thought, articulate speech and confident business decisions. Pure Vedic Gems supplies only natural, untreated emeralds with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in gold or panchdhatu for full planetary current.',
    accent: '#1F6F4E',
  },
  {
    slug: 'ruby',
    name: 'Ruby',
    hindiName: 'Manik',
    planet: 'Sun (Surya)',
    deity: 'Lord Surya',
    cosmicRay: 'Red',
    color: 'Pigeon-blood red to deep pomegranate red',
    rashis: ['Leo (Simha)'],
    benefits: [
      'Bestows leadership, authority and political success.',
      'Improves vitality, willpower and ojas (life-force).',
      'Strengthens the father–child bond and paternal blessings.',
      'Supports the heart, eyes, spine and bone marrow.',
      'Removes lethargy, low self-esteem and chronic fatigue.',
    ],
    sources: ['Burma (Mogok)', 'Mozambique', 'Thailand', 'Sri Lanka', 'Madagascar', 'India', 'Tajikistan', 'Africa'],
    identifyingFeatures: [
      'Rich chromium-induced red fluorescence under UV light.',
      'Silk inclusions of fine rutile needles in untreated Burmese stones.',
      'Hardness of 9 on the Mohs scale — corundum family.',
      'Strong dichroism: purplish-red and orangey-red along different crystal axes.',
    ],
    qualityGrades: COMMON_GRADES(
      'Ruby',
      'Unheated Burmese pigeon-blood rubies are the most coveted by Vedic astrologers.'
    ),
    commonFakes: [
      'Glass-filled fissures masking severe inclusions.',
      'Synthetic flame-fusion and flux-grown rubies.',
      'Beryllium-diffused stones with artificially enhanced colour.',
      'Composite rubies (lead-glass-filled corundum).',
    ],
    beejMantra: 'Om Hram Hrim Hroum Sah Suryaya Namah',
    ringFinger: 'Ring finger',
    day: 'Sunday morning',
    weightGuidance: 'Generally 3 to 6 carats — weight should be balanced with the chart’s Sun strength and wearer’s body weight.',
    heroImage: '/gems-knowledge/ruby.jpg',
    intro:
      'Ruby — Manik — is the king of Vedic gems, holding the fierce red cosmic ray of the Sun. It commands respect, leadership and luminous self-confidence.',
    longDescription:
      'Ruby empowers the wearer with the Surya principle of vitality, authority and recognition. Pure Vedic Gems sources only natural, untreated rubies (with optional moderate heating disclosed up front) and supplies them with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in 22-karat yellow gold or panchdhatu.',
    accent: '#9E1C1C',
  },
  {
    slug: 'blue-sapphire',
    name: 'Blue Sapphire',
    hindiName: 'Neelam',
    planet: 'Saturn (Shani)',
    deity: 'Lord Shani / Shiva',
    cosmicRay: 'Violet',
    color: 'Royal cornflower blue to velvety midnight blue',
    rashis: ['Capricorn (Makar)', 'Aquarius (Kumbh)'],
    benefits: [
      'Removes Sade-Sati, Dhaiya and other Saturn afflictions.',
      'Rapidly brings wealth, name and stature when it suits the wearer.',
      'Improves focus, discipline and long-term planning.',
      'Protects from evil eye, jealousy and hidden enemies.',
      'Supports recovery from chronic ailments and respiratory issues.',
    ],
    sources: ['Kashmir', 'Sri Lanka (Ceylon)', 'Burma', 'Madagascar', 'Australia', 'Thailand', 'Africa', 'USA (Montana)'],
    identifyingFeatures: [
      'Sleepy velvety appearance in Kashmir origin material.',
      'Strong pleochroism — appears blue and violet-blue along different directions.',
      'Mohs hardness 9, corundum family — extremely scratch-resistant.',
      'Fine silk and zoning visible under magnification.',
    ],
    qualityGrades: COMMON_GRADES(
      'Blue Sapphire',
      'Kashmir cornflower-blue sapphires are the rarest and most powerful in Vedic prescription.'
    ),
    commonFakes: [
      'Beryllium-diffused sapphires with artificial colour penetration.',
      'Synthetic Verneuil and flux-grown sapphires.',
      'Heated/treated geuda stones marketed as natural.',
      'Glass and synthetic spinel substitutes.',
    ],
    beejMantra: 'Om Pram Prim Proum Sah Shanaye Namah',
    ringFinger: 'Middle finger',
    day: 'Saturday evening',
    weightGuidance: 'Generally 2 to 5 carats — Neelam is highly potent and is prescribed only after a strict trial period of 3 days.',
    heroImage: '/gems-knowledge/blue-sapphire.jpg',
    intro:
      'Blue Sapphire — Neelam — is the fastest-acting Jyotish gem, transmitting the violet cosmic ray of Saturn. Worn correctly it can transform fortune within hours.',
    longDescription:
      'Neelam carries the disciplined, justice-loving energy of Shani. It is prescribed only after astrological confirmation and a trial period. Pure Vedic Gems supplies only natural, untreated Neelams with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in silver, white gold or panchdhatu — never in copper.',
    accent: '#1E3A8A',
  },
  {
    slug: 'yellow-sapphire',
    name: 'Yellow Sapphire',
    hindiName: 'Pukhraj',
    planet: 'Jupiter (Guru / Brihaspati)',
    deity: 'Lord Brihaspati / Vishnu',
    cosmicRay: 'Blue',
    color: 'Lemon yellow to rich golden honey',
    rashis: ['Sagittarius (Dhanu)', 'Pisces (Meen)'],
    benefits: [
      'Brings wisdom, knowledge and spiritual evolution.',
      'Accelerates marriage prospects, especially for women.',
      'Improves wealth, financial stability and prosperity.',
      'Strengthens reputation, fame and academic success.',
      'Supports liver, pancreas and digestive health.',
    ],
    sources: ['Sri Lanka (Ceylon)', 'Burma', 'Thailand', 'Kashmir', 'Brazil', 'Madagascar', 'Africa'],
    identifyingFeatures: [
      'Even yellow saturation with no greenish or brownish tint in fine stones.',
      'High refractive index — strong fire and brilliance.',
      'Mohs 9 hardness — extremely durable.',
      'Natural inclusions like silk, healed feathers and crystals.',
    ],
    qualityGrades: COMMON_GRADES(
      'Yellow Sapphire',
      'Ceylon (Sri Lanka) origin lemon-honey Pukhraj is most prized for Jyotish use.'
    ),
    commonFakes: [
      'Heated geuda stones sold as natural.',
      'Yellow topaz and citrine substituted as Pukhraj.',
      'Synthetic flame-fusion yellow sapphires.',
      'Glass-filled fissures masking native cracks.',
    ],
    beejMantra: 'Om Gram Grim Groum Sah Gurave Namah',
    ringFinger: 'Index finger',
    day: 'Thursday morning',
    weightGuidance: 'Generally 3 to 7 carats — body weight + planetary strength dictate the exact ratti.',
    heroImage: '/gems-knowledge/yellow-sapphire.jpg',
    intro:
      'Yellow Sapphire — Pukhraj — is the gem of Guru Brihaspati and carries the expansive blue cosmic ray of Jupiter. It bestows wisdom, wealth and marital happiness.',
    longDescription:
      'Pukhraj is the most universally benefic Jyotish gemstone, suiting most kundalis when Jupiter is well-placed. Pure Vedic Gems supplies only natural, untreated Pukhraj with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in 22-karat yellow gold or panchdhatu.',
    accent: '#B8861E',
  },
  {
    slug: 'white-sapphire',
    name: 'White Sapphire',
    hindiName: 'Safed Pukhraj',
    planet: 'Venus (Shukra)',
    deity: 'Devi Lakshmi / Shukra',
    cosmicRay: 'Indigo',
    color: 'Colourless to icy white with diamond-like brilliance',
    rashis: ['Taurus (Vrishabh)', 'Libra (Tula)'],
    benefits: [
      'Attracts love, romance and harmonious relationships.',
      'Brings success in creative arts, cinema and luxury businesses.',
      'Improves marital bonding and conjugal happiness.',
      'Powerful diamond substitute for those who cannot afford or wear diamond.',
      'Enhances charm, magnetism and personal aesthetics.',
    ],
    sources: ['Sri Lanka (Ceylon)', 'Madagascar', 'Burma', 'Tanzania', 'Australia'],
    identifyingFeatures: [
      'Colourless transparent corundum with diamond-like fire.',
      'Mohs hardness 9 — second only to diamond.',
      'High refractive index gives lively scintillation.',
      'Faint silk or fingerprint inclusions in natural stones.',
    ],
    qualityGrades: COMMON_GRADES(
      'White Sapphire',
      'Eye-clean Ceylon white sapphires are the preferred substitute for diamond in Jyotish prescription.'
    ),
    commonFakes: [
      'Cubic zirconia and moissanite substitutes.',
      'Synthetic colourless sapphires sold as natural.',
      'White topaz with much lower brilliance and durability.',
      'White spinel substitutes lacking corundum properties.',
    ],
    beejMantra: 'Om Dram Drim Droum Sah Shukraya Namah',
    ringFinger: 'Middle or ring finger',
    day: 'Friday morning',
    weightGuidance: 'Generally 3 to 7 carats — should be matched to planetary strength.',
    heroImage: '/gems-knowledge/white-sapphire.jpg',
    intro:
      'White Sapphire — Safed Pukhraj — channels the bright indigo cosmic ray of Venus. It is the principal Vedic substitute for diamond and brings love, beauty and luxury.',
    longDescription:
      'White Sapphire delivers the full Shukra energy — relationships, sensuality, art and prosperity — at a fraction of the cost of natural diamond. Pure Vedic Gems supplies only natural, untreated white sapphires with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in platinum, white gold or silver.',
    accent: '#7C7C8A',
  },
  {
    slug: 'red-coral',
    name: 'Red Coral',
    hindiName: 'Moonga',
    planet: 'Mars (Mangal)',
    deity: 'Lord Hanuman / Mangal',
    cosmicRay: 'Red',
    color: 'Vivid sindoori red, capsicum red and ox-blood red',
    rashis: ['Aries (Mesh)', 'Scorpio (Vrishchik)'],
    benefits: [
      'Bestows courage, valour and competitive edge.',
      'Removes Manglik dosha and brings marital harmony.',
      'Protects from evil eye, accidents and black magic.',
      'Strengthens blood, immunity and physical stamina.',
      'Helps in surgery, sports, military and real-estate professions.',
    ],
    sources: ['Italy (Sardinia, Sciacca)', 'Japan', 'Taiwan', 'Algeria', 'Tunisia', 'Mediterranean Sea'],
    identifyingFeatures: [
      'Organic gem — branches of the coral skeleton (Corallium rubrum).',
      'Natural striations and growth structures along the branch axis.',
      'Mohs hardness 3–4 — softer than mineral gems, requires careful wear.',
      'No glassy or bubble inclusions — opaque, smooth, waxy lustre.',
    ],
    qualityGrades: COMMON_GRADES(
      'Red Coral',
      'Italian Sardinian sindoori Moonga is the highest grade prescribed by Vedic astrologers.'
    ),
    commonFakes: [
      'Dyed and reconstructed coral powder pieces.',
      'Plastic and resin imitations.',
      'Sponge coral and bamboo coral dyed red.',
      'Stabilised, low-grade African coral sold as Italian.',
    ],
    beejMantra: 'Om Kram Krim Kroum Sah Bhaumaya Namah',
    ringFinger: 'Ring finger',
    day: 'Tuesday morning',
    weightGuidance: 'Generally 6 to 12 ratti — Moonga is worn in slightly higher weights than other gems.',
    heroImage: '/gems-knowledge/red-coral.jpg',
    intro:
      'Red Coral — Moonga — is the fiery gem of Mars, born of the sea yet carrying the red cosmic ray of Mangal. It bestows courage, protection and martial energy.',
    longDescription:
      'Moonga is an organic Jyotish gem — never mined, but harvested from coral colonies in the Mediterranean and Japanese seas. Pure Vedic Gems supplies only natural Italian and Japanese coral with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in copper, panchdhatu or 22-karat gold.',
    accent: '#C0392B',
  },
  {
    slug: 'hessonite',
    name: 'Hessonite',
    hindiName: 'Gomed',
    planet: 'Rahu (North Node)',
    deity: 'Rahu / Goddess Durga',
    cosmicRay: 'Ultra-violet',
    color: 'Honey-cognac to deep cinnamon brown',
    rashis: ['—', 'Recommended only on astrological prescription'],
    benefits: [
      'Removes Rahu-induced confusion, phobias and sudden setbacks.',
      'Brings success in politics, public relations and event management.',
      'Strengthens reputation, social influence and crowd-handling ability.',
      'Helps with skin allergies, mysterious ailments and chronic indigestion.',
      'Aids in legal battles, occult research and overseas dealings.',
    ],
    sources: ['Sri Lanka (Ceylon)', 'India (Orissa, Tamil Nadu)', 'Tanzania', 'Madagascar', 'Brazil'],
    identifyingFeatures: [
      'Belongs to the grossular garnet family.',
      'Characteristic "scotch-in-water" treacly internal swirl pattern under magnification.',
      'Mohs hardness 7 — durable for daily wear.',
      'Bright honey-cinnamon hue with no greenish or yellowish secondary tint in fine stones.',
    ],
    qualityGrades: COMMON_GRADES(
      'Hessonite',
      'Ceylon honey-cinnamon Gomed with high transparency is the preferred Vedic grade.'
    ),
    commonFakes: [
      'Glass and synthetic garnet substitutes.',
      'Heat-treated grossular garnet of inferior origin.',
      'Citrine and smoky quartz sold as Gomed.',
      'Composite garnets with surface treatment.',
    ],
    beejMantra: 'Om Bhram Bhrim Bhroum Sah Rahave Namah',
    ringFinger: 'Middle finger',
    day: 'Saturday evening',
    weightGuidance: 'Generally 6 to 11 ratti — worn after astrological confirmation only.',
    heroImage: '/gems-knowledge/hessonite.jpg',
    intro:
      'Hessonite — Gomed — is the Vedic remedy for Rahu. Its honey-cinnamon glow cuts through confusion and brings sudden, unexpected breakthroughs.',
    longDescription:
      'Gomed channels the unpredictable, boundary-breaking energy of Rahu — perfect for politicians, performers, influencers and those navigating sudden change. Pure Vedic Gems supplies only natural Ceylon Gomed with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in silver or panchdhatu.',
    accent: '#9B5B25',
  },
  {
    slug: 'catseye',
    name: 'Cat’s Eye',
    hindiName: 'Lehsuniya',
    planet: 'Ketu (South Node)',
    deity: 'Ketu / Lord Ganesha',
    cosmicRay: 'Infrared',
    color: 'Honey-yellow to greenish-yellow with a sharp white chatoyant band',
    rashis: ['—', 'Recommended only on astrological prescription'],
    benefits: [
      'Removes Ketu-induced obstacles, accidents and chronic ailments.',
      'Brings sudden wealth, speculative gains and gambling protection.',
      'Strengthens spiritual progress, intuition and occult abilities.',
      'Protects from drowning, fire, evil eye and black magic.',
      'Helps with cancer, paralysis and mysterious incurable conditions.',
    ],
    sources: ['Sri Lanka (Ceylon)', 'Thailand', 'Burma', 'Kashmir', 'Brazil', 'India'],
    identifyingFeatures: [
      'Chrysoberyl variety with a sharp, mobile white "eye" band (chatoyancy).',
      'Eye opens and closes cleanly as the stone is rotated under a single light.',
      'Mohs hardness 8.5 — second only to corundum.',
      '"Milk and honey" effect — one side warm honey, other side milky in fine stones.',
    ],
    qualityGrades: COMMON_GRADES(
      'Cat’s Eye',
      'Ceylon chrysoberyl Lehsuniya with a razor-sharp milk-and-honey effect is the most coveted.'
    ),
    commonFakes: [
      'Quartz cat’s eye sold as chrysoberyl Lehsuniya.',
      'Fibreglass synthetic cat’s eye (very common imitation).',
      'Tiger’s eye and hawk’s eye marketed as Lehsuniya.',
      'Glass-fibre simulants with poor chatoyancy.',
    ],
    beejMantra: 'Om Shram Shrim Shroum Sah Ketave Namah',
    ringFinger: 'Middle finger',
    day: 'Tuesday or Thursday evening',
    weightGuidance: 'Generally 3 to 7 ratti — worn after astrological confirmation.',
    heroImage: '/gems-knowledge/catseye.jpg',
    intro:
      'Cat’s Eye — Lehsuniya — channels the infrared cosmic ray of Ketu. Its luminous eye protects from hidden dangers and sudden reversals.',
    longDescription:
      'Lehsuniya is one of the most protective and spiritually accelerating Jyotish gems. It is prescribed for severe Ketu mahadasha effects, chronic ailments and speculative ventures. Pure Vedic Gems supplies only natural chrysoberyl Cat’s Eye with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in silver, panchdhatu or gold.',
    accent: '#A88A2C',
  },
  {
    slug: 'opal',
    name: 'Opal',
    hindiName: 'Upala / Doodhia Patthar',
    planet: 'Venus (Shukra)',
    deity: 'Devi Lakshmi / Shukra',
    cosmicRay: 'Indigo',
    color: 'Milky white base with rainbow play-of-colour (fire)',
    rashis: ['Taurus (Vrishabh)', 'Libra (Tula)'],
    benefits: [
      'Attracts love, beauty and harmonious relationships.',
      'Boosts creativity, artistic talent and cinematic success.',
      'Improves marital understanding and conjugal joy.',
      'A cost-effective Venus substitute when diamond and white sapphire are not feasible.',
      'Strengthens reproductive health and feminine vitality.',
    ],
    sources: ['Australia (Coober Pedy, Lightning Ridge)', 'Ethiopia', 'Mexico', 'Brazil', 'Peru'],
    identifyingFeatures: [
      'Hydrated silica gem — contains 6–10% water.',
      'Distinctive "play-of-colour" — flashes of rainbow fire moving inside the stone.',
      'Mohs hardness 5.5–6.5 — softer than corundum, requires gentle handling.',
      'Opaque to translucent body with no double refraction.',
    ],
    qualityGrades: COMMON_GRADES(
      'Opal',
      'Australian black and white opal with strong red fire is the most powerful Venus grade.'
    ),
    commonFakes: [
      'Doublets and triplets — thin opal slice glued to backing.',
      'Synthetic Gilson opal with regular geometric play.',
      'Plastic and resin opal imitations.',
      'Coated quartz simulating play-of-colour.',
    ],
    beejMantra: 'Om Dram Drim Droum Sah Shukraya Namah',
    ringFinger: 'Middle or ring finger',
    day: 'Friday morning',
    weightGuidance: 'Generally 5 to 10 ratti — worn after astrological confirmation.',
    heroImage: '/gems-knowledge/opal.jpg',
    intro:
      'Opal — Upala — is a softer, more lyrical channel for Venus. Its rainbow fire awakens beauty, romance and creative joy.',
    longDescription:
      'Opal is a hydrated, organic-feeling Venus gem — uniquely beautiful and increasingly prescribed where diamond or white sapphire is not suitable. Pure Vedic Gems supplies only natural Australian and Ethiopian opal with full lab certification and Vedic energisation.',
    metalSuggestion: 'Set in silver, white gold or platinum — protect from sharp knocks.',
    accent: '#8FA1B5',
  },
  {
    slug: 'pearl',
    name: 'Pearl',
    hindiName: 'Moti (Mukta)',
    planet: 'Moon (Chandra)',
    deity: 'Lord Chandra / Devi Parvati',
    cosmicRay: 'Orange',
    color: 'Lustrous milky white to silvery cream with a soft inner glow',
    rashis: ['Cancer (Kark)'],
    benefits: [
      'Calms the mind, reduces stress, anxiety and emotional turbulence.',
      'Strengthens a weak or afflicted Moon and stabilises moods.',
      'Improves sleep, intuition, memory and clarity of thought.',
      'Brings gentleness, affection and harmony to relationships.',
      'Supports the heart, reproductive and digestive systems.',
    ],
    sources: ['Basra (Persian Gulf)', 'Japan (Akoya)', 'South Sea (Australia, Indonesia, Philippines)', 'Venezuela (Isla de Margarita)', 'Sri Lanka'],
    identifyingFeatures: [
      'Organic gem grown inside a mollusc — never mined.',
      'Soft, deep nacreous lustre with a gentle inner glow (orient).',
      'Minute natural surface imperfections and a cool, dense feel distinguish it from imitations.',
      'Mohs hardness 2.5–4.5 — very soft, requires careful wear away from perfume and acids.',
    ],
    qualityGrades: COMMON_GRADES(
      'Pearl',
      'Natural, non-beaded Basra pearls are the rarest and most coveted for Jyotish use.'
    ),
    commonFakes: [
      'Glass and plastic imitation pearls with a painted coating.',
      'Shell-bead "mabe" or coated pearls sold as natural.',
      'Cultured (beaded) pearls mis-sold as natural Basra pearls.',
      'Dyed freshwater pearls passed off as South Sea or Akoya.',
    ],
    beejMantra: 'Om Shram Shrim Shroum Sah Chandraya Namah',
    ringFinger: 'Little finger',
    day: 'Monday evening (Shukla Paksha / waxing Moon)',
    weightGuidance: 'Generally one-tenth of body weight in ratti; commonly 4 to 7 ratti, adjusted to planetary strength.',
    heroImage: '/gems-knowledge/pearl.jpg',
    intro:
      'Pearl — Moti — is the gem of the Moon (Chandra). Born of the sea, it carries the cool, nurturing orange cosmic ray that brings emotional balance, peace of mind and purity.',
    longDescription:
      'The pearl, often called the Moon’s jewel, is prescribed to strengthen a weak or troubled Moon — the planet of mind, emotion, intuition and the mother. Worn correctly it calms restlessness, deepens emotional steadiness and softens relationships. As an organic gem it is harvested, never mined, and demands gentle care. Pure Vedic Gems supplies only natural, certified pearls, purified and energised through authentic Vedic rituals.',
    metalSuggestion: 'Set in silver for the full lunar current.',
    accent: '#9FB8C9',
  },
];

export const GEM_QUALITY_FAQS: { question: string; answer: string }[] = [
  {
    question: 'How do I know whether a gemstone is natural or treated?',
    answer:
      'Always insist on a certificate from an internationally recognised astro-gemology lab (GIA, IGI, GRS, Gübelin or GII) that explicitly states origin, treatment status (heated/unheated, filled/unfilled) and species. Pure Vedic Gems supplies a lab certificate with every stone.',
  },
  {
    question: 'Why are natural, untreated gems so important in Jyotish?',
    answer:
      'In Vedic astrology, the cosmic ray of the planet flows freely only through a naturally formed, untreated crystal lattice. Heating, filling or diffusion compromises the gem’s ability to transmit planetary energy and reduces its remedial value.',
  },
  {
    question: 'What is the role of energisation (Pran-Pratishtha)?',
    answer:
      'Before wearing a Jyotish gem, it is purified (Shudhikaran) and energised with the planet’s beej mantra. This activates the cosmic ray and aligns the stone with the wearer’s kundali. Pure Vedic Gems performs the full Vedic energisation in-house for every gem we ship.',
  },
  {
    question: 'How is the correct weight (ratti) calculated?',
    answer:
      'A senior astrologer reviews your birth chart, the planet’s house and dignity, current dasha and your body weight. A general guideline is one ratti per twelve kilograms of body weight, adjusted upward or downward based on planetary strength.',
  },
  {
    question: 'Which gems require a trial period before permanent wearing?',
    answer:
      'Blue Sapphire (Neelam), Hessonite (Gomed) and Cat’s Eye (Lehsuniya) are powerful, fast-acting gems linked to Saturn, Rahu and Ketu. We always recommend a 3-day trial under the pillow / on the arm before final acceptance.',
  },
  {
    question: 'Can I wear a substitute gemstone (Upratna)?',
    answer:
      'Yes. When a primary Navratna is not feasible, a clear, natural Upratna of the same planetary family (e.g. green tourmaline for emerald, white topaz for diamond) can be prescribed — though the remedial effect is gentler.',
  },
];
