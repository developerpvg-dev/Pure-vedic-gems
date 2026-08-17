import type { CategoryFaq } from '@/lib/types/shop-category-page';
import { canonicalSubcategoryHref } from '@/lib/categories/canonical-storefront-path';
import {
  BRAND,
  RichGemSections,
  baseGemKeywords,
  h3,
  p,
  table,
  ul,
} from './helpers';

const ASTRO_DISCLAIMER =
  'Gemstone remedies are chart-specific. Always consult a qualified Jyotish astrologer before wearing any stone for planetary purposes.';

const UPRATNA_PLANET_BY_SLUG: Record<string, string> = {
  amethyst: 'Saturn (Shani)',
  'lapis-lazuli': 'Saturn (Shani)',
  moonstone: 'Moon (Chandra)',
  peridot: 'Mercury (Budh)',
  'rose-quartz': 'Venus (Shukra)',
  citrine: 'Jupiter (Guru)',
  garnet: 'Rahu',
  turquoise: 'Jupiter (Guru)',
  aquamarine: 'Mercury (Budh)',
  'tiger-eye': 'Sun (Surya)',
  malachite: 'Venus (Shukra)',
  opal: 'Venus (Shukra)',
  tanzanite: 'Saturn (Shani)',
  'blue-topaz': 'Saturn (Shani)',
  'white-topaz': 'Venus (Shukra)',
  zircon: 'Venus (Shukra)',
  iolite: 'Saturn (Shani)',
  diopside: 'Mercury (Budh)',
  kyanite: 'Saturn (Shani)',
  sunstone: 'Sun (Surya)',
  hakik: 'Rahu',
  'white-coral': 'Moon (Chandra)',
  chrysoberyl: 'Ketu',
};

export function getUpratnaPlanet(slug: string): string | null {
  return UPRATNA_PLANET_BY_SLUG[slug] ?? null;
}

type UpratnaDef = {
  slug: string;
  name: string;
  hindi?: string;
  planet: string | null;
  substitute: string;
  intro: string;
  heroBenefits: string[];
  seoDescription: string;
  extraKeywords?: string[];
  about: string[];
  aboutTable?: Array<[string, string]>;
  howToWear: string[];
  whoShouldWear: string[];
  benefits: string[];
  types: string[];
  qualityPrice: string[];
  qualityTable?: Array<[string, string]>;
  jewellery: string[];
  care: string[];
  beware: string[];
  faqs: CategoryFaq[];
};

function defineUpratna(def: UpratnaDef): RichGemSections {
  const planet = def.planet;
  return {
    intro: def.intro,
    hero_benefits: def.heroBenefits.map((text) => ({ text })),
    seo_description: def.seoDescription,
    meta_keywords: baseGemKeywords(def.slug, def.name, def.hindi ?? null, planet).concat(
      def.extraKeywords ?? [],
    ),
    about_html: [
      p(...def.about),
      def.aboutTable ? h3('Quick Reference') + table(def.aboutTable) : '',
    ].join('\n'),
    how_to_wear_html: p(...def.howToWear),
    who_should_wear_html: p(...def.whoShouldWear),
    benefits_html: [p(...def.benefits)].join('\n'),
    types_html: p(...def.types),
    quality_price_html: [
      p(...def.qualityPrice),
      def.qualityTable ? h3('Quality Factors') + table(def.qualityTable) : '',
    ].join('\n'),
    jewellery_html: p(...def.jewellery),
    cleaning_care_html: p(...def.care),
    buyer_beware_html: p(...def.beware),
    faqs: def.faqs,
  };
}

const AMETHYST = defineUpratna({
  slug: 'amethyst',
  name: 'Amethyst',
  hindi: 'Katela / Jamunia',
  planet: 'Saturn (Shani)',
  substitute: 'Blue Sapphire (Neelam)',
  intro:
    'Natural Amethyst is a widely respected upratna for Shani, offering a budget-conscious alternative to Blue Sapphire with its signature violet hue and quartz durability.',
  heroBenefits: ['Supports disciplined focus', 'Calms restless thoughts', 'Accessible Shani upratna', 'Suitable for daily wear'],
  seoDescription: `Buy certified natural Amethyst (Katela) online at ${BRAND}. A traditional Saturn upratna substitute for Blue Sapphire with lab disclosure, Jyotish guidance, and worldwide delivery.`,
  extraKeywords: ['katela', 'jamunia', 'shani upratna'],
  about: [
    'Amethyst is a purple variety of quartz (silicon dioxide, SiO₂) coloured by trace iron and natural irradiation. With a Mohs hardness of 7, it polishes beautifully and withstands everyday jewellery use better than many softer upratnas.',
    `In Jyotish practice, Amethyst is commonly recommended as an upratna (substitute) for Blue Sapphire when Shani needs strengthening or pacification in the birth chart. ${ASTRO_DISCLAIMER}`,
    `At ${BRAND}, we list Amethyst with clear origin notes, treatment disclosure, and certification where applicable — so you know exactly what you are wearing.`,
  ],
  aboutTable: [
    ['Mineral family', 'Quartz (SiO₂)'],
    ['Typical colour', 'Violet to deep purple'],
    ['Mohs hardness', '7'],
    ['Vedic association', 'Saturn (Shani) — upratna for Neelam'],
  ],
  howToWear: [
    'Traditional guidance places Amethyst on the middle finger of the right hand (or working hand) in silver or Panchdhatu, worn on Saturday during Shani Hora after sunrise. Purify with raw milk or Ganga jal, then chant "Om Sham Shanicharaya Namah" 108 times.',
    'Open-back ring settings allow skin contact, which many Jyotish practitioners prefer for upratnas. Minimum weight is chart-specific — commonly 5–7 ratti for adults, but only your astrologer can confirm the right carat.',
    `${BRAND} offers energization and pran pratishtha at checkout. Do not wear alongside a primary Neelam without explicit astrological approval.`,
  ],
  whoShouldWear: [
    'Amethyst is traditionally explored when Saturn is yogakaraka, weak in dignity, or when a gentler Shani remedy is needed than high-impact Blue Sapphire. Beneficial dasha periods and lagna compatibility must be verified first.',
    'It may suit professionals in research, law, administration, and disciplined crafts who seek focus and patience. It is generally avoided when Shani is severely malefic without proper upaya — chart analysis is essential.',
    `${ASTRO_DISCLAIMER} Our Jyotish team can review your kundli before purchase.`,
  ],
  benefits: [
    'Vedic tradition links Amethyst with Shani qualities: patience, structure, ethical conduct, and resilience through hardship. Wearers often choose it for mental clarity and steadier decision-making.',
    'As a quartz, Amethyst is relatively durable and affordable, making consistent wear practical. Many also value its calming influence for meditation and sleep hygiene when kept near the bedside (unmounted).',
    'Beyond astrology, fine Amethyst from Brazil, Uruguay, and Zambia is collected for colour depth and clean crystal habit — a meaningful gift when certified and untreated.',
  ],
  types: [
    'Siberian-grade deep purple with red flashes commands premium prices. Brazilian material ranges from pale lilac to rich grape tones. Uruguayan geode crystals are prized for saturation and transparency.',
    'Heat treatment is uncommon in Amethyst but always ask for disclosure. Synthetic amethyst exists — demand natural certification for Jyotish use.',
    'Cabochon, faceted oval, and emerald-cut Amethyst are popular for rings; beads and tumbled stones serve mala and bracelet remedies.',
  ],
  qualityPrice: [
    'Price rises with depth of colour, clarity, and size. Pale commercial-grade stones are inexpensive; eye-clean deep purple gems above 8 mm fetch higher per-carat rates.',
    'Untreated natural Amethyst with strong violet saturation offers the best value for astrological buyers. Compare price per carat and insist on lab reports for stones above ₹5,000.',
  ],
  qualityTable: [
    ['Colour', 'Deep, even purple preferred; brownish or greyish tones reduce value'],
    ['Clarity', 'Eye-clean to lightly included acceptable for upratna'],
    ['Cut', 'Symmetric faceting maximizes colour face-up'],
    ['Treatment', 'Natural only for Jyotish — disclose any enhancement'],
  ],
  jewellery: [
    'Amethyst rings in silver are the classic Shani setting. Pendants and adjustable bracelets work well for those who prefer not to wear finger rings daily.',
    `${BRAND}'s configurator supports open-back Vedic mounts in silver, white gold, and Panchdhatu with live pricing and size selection.`,
  ],
  care: [
    'Clean with lukewarm water, mild soap, and a soft brush. Avoid prolonged direct sunlight, which can fade some Amethyst over years.',
    'Store separately from harder gems like sapphire or diamond. Remove before gym, swimming, or harsh chemical exposure.',
  ],
  beware: [
    'Reject glass imitations and dyed quartz sold without disclosure. Synthetic amethyst is lab-grown but not suitable as a Jyotish upratna unless your astrologer explicitly approves.',
    'Beware of "Jamunia" labels on low-quality purple glass. Insist on gemological testing from a reputable lab for significant purchases.',
  ],
  faqs: [
    { question: 'Is Amethyst a real substitute for Blue Sapphire?', answer: `Yes — in many Jyotish traditions Amethyst (Katela/Jamunia) is prescribed as an upratna for Shani when Neelam is not affordable or advisable. Effectiveness depends on your chart; consult an astrologer first.` },
    { question: 'Which finger should I wear Amethyst on?', answer: 'Middle finger of the right hand in silver is the most common recommendation for Shani stones, worn on Saturday. Your astrologer may adjust finger, metal, or day based on your lagna.' },
    { question: 'Can I wear Amethyst with Blue Sapphire?', answer: 'Generally not without expert guidance — doubling Shani remedies can over-amplify Saturn energy. Seek Jyotish advice before combining primary and upratna stones.' },
    { question: 'How do I verify natural Amethyst?', answer: `${BRAND} provides certification and treatment disclosure. Natural quartz shows consistent RI near 1.544–1.553 and characteristic inclusions under magnification.` },
    { question: 'What carat weight is recommended?', answer: 'Common suggestions range from 5–7 ratti for adults, but weight must match your body weight, dasha, and Shani placement. Personalized consultation is recommended.' },
    { question: 'Does Amethyst fade over time?', answer: 'Some stones may lighten with prolonged intense UV exposure. Normal indoor wear is safe; store away from direct windowsill sunlight.' },
  ],
});

const LAPIS_LAZULI = defineUpratna({
  slug: 'lapis-lazuli',
  name: 'Lapis Lazuli',
  hindi: 'Lajward',
  planet: 'Saturn (Shani)',
  substitute: 'Blue Sapphire (Neelam)',
  intro:
    'Lapis Lazuli — Lajward in Hindi — is an ancient Saturn-aligned upratna prized for its celestial blue field and golden pyrite flecks, long used in Vedic and Central Asian spiritual traditions.',
  heroBenefits: ['Traditional Shani upratna', 'Rich royal blue colour', 'Historical spiritual significance', 'Works well in silver settings'],
  seoDescription: `Shop natural Lapis Lazuli (Lajward) at ${BRAND}. A certified Saturn upratna alternative to Blue Sapphire with origin disclosure, expert Jyotish support, and insured worldwide shipping.`,
  about: [
    'Lapis Lazuli is a rock composed primarily of lazurite, calcite, and pyrite — not a single mineral species. Its signature ultramarine blue comes from sulfur-rich lazurite crystals within the matrix.',
    'Classical texts and folk Jyotish often list Lajward among Shani upratnas alongside Amethyst and Iolite. It is chosen when a deep blue Saturn remedy is desired without Neelam\'s intensity. ' + ASTRO_DISCLAIMER,
    `Afghanistan (Badakhshan) remains the historic benchmark origin, though Chile, Russia, and Pakistan also produce notable material. ${BRAND} discloses origin and enhancement status on every listing.`,
  ],
  aboutTable: [
    ['Composition', 'Lazurite + calcite + pyrite (rock)'],
    ['Typical colour', 'Deep blue with gold pyrite flecks'],
    ['Mohs hardness', '5–5.5 (softer — protect in jewellery)'],
    ['Vedic association', 'Saturn (Shani) — upratna for Neelam'],
  ],
  howToWear: [
    'Wear on Saturday after sunrise during Shani Hora, set in silver on the middle finger. Cleanse with Ganga jal or raw milk, offer blue flowers if convenient, and chant "Om Sham Shanicharaya Namah" 108 times.',
    'Because Lapis is softer than quartz, choose protective bezel settings for rings. Pendants on silver chains are popular for those with active lifestyles.',
    'Avoid wearing alongside untreated Blue Sapphire unless your astrologer directs a specific combination.',
  ],
  whoShouldWear: [
    'Considered when Saturn requires support and the native seeks a blue-toned upratna with historical pedigree. Suitable for scholars, judges, researchers, and those in disciplined professions — if the chart supports Shani remedies.',
    'Not recommended blindly during Sade Sati or Shani Mahadasha — severity and house placement matter. Children and pregnant women should consult an astrologer before any Shani stone.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with wisdom, truthful speech, and dignified authority under Shani\'s influence. Many wearers report improved focus for study and contemplative practices.',
    'The stone\'s deep blue has symbolized divine connection across cultures — from ancient Egypt to Tibetan Buddhist art — adding cultural depth beyond astrology.',
    'As an opaque gem, minor surface imperfections are acceptable for Jyotish, making fine Lapis more accessible than transparent Neelam.',
  ],
  types: [
    'Afghan Lapis with minimal white calcite and vivid blue is most valued. Chilean material often shows more calcite veining. Russian and Pakistani sources vary in pyrite content.',
    'Dyed howlite and reconstituted Lapis are common fakes — always test before buying for remedial use.',
    'Cabochons dominate astrological jewellery; carved amulets and mala beads are also traditional.',
  ],
  qualityPrice: [
    'Top Afghan cabochons with even blue and attractive pyrite specks command premium prices. Heavy calcite whitening lowers value significantly.',
    'Price is per piece rather than per carat for opaque stones. Expect wide range from ₹500 for small beads to ₹50,000+ for fine large cabochons.',
  ],
  qualityTable: [
    ['Colour', 'Intense, uniform blue without grey or green cast'],
    ['Pyrite flecks', 'Attractive gold specks valued; excessive pyrite can weaken structure'],
    ['Calcite', 'Minimal white veining preferred'],
    ['Enhancement', 'Natural colour only for Jyotish'],
  ],
  jewellery: [
    'Silver rings with bezel-set Lapis protect the softer stone. Oval and cushion cabochons are classic Shani styles.',
    'Lapis pendants and cufflinks suit professionals who cannot wear rings at work.',
  ],
  care: [
    'Never use ultrasonic or steam cleaners. Wipe with a damp soft cloth only; avoid acids and household chemicals.',
    'Lapis is porous — keep away from perfumes, lotions, and prolonged water immersion.',
  ],
  beware: [
    'Dyed magnesite or howlite sold as "Lajward" is widespread in street markets. Reconstituted Lapis made from powder and resin fails both gemology and Jyotish standards.',
    'Ask for specific origin documentation for Afghan material — many sellers use the label generically.',
  ],
  faqs: [
    { question: 'What is Lajward in astrology?', answer: 'Lajward is the Hindi name for Lapis Lazuli, traditionally linked to Shani as an upratna for Blue Sapphire in North Indian Jyotish practice.' },
    { question: 'Is Afghan Lapis better for Jyotish?', answer: 'Afghan Badakhshan Lapis is historically prized for colour, but any natural, undyed Lapis of strong blue can serve as an upratna if your astrologer approves.' },
    { question: 'Can Lapis Lazuli be worn every day?', answer: 'Yes in protective settings, but its Mohs 5–5.5 hardness means rings need bezels and occasional repolishing. Pendants are safer for daily wear.' },
    { question: 'How is Lapis different from Sodalite?', answer: 'Sodalite is a separate mineral, usually lighter blue with white veining and no pyrite flecks. It is not a traditional Shani upratna — do not substitute without guidance.' },
    { question: 'What metal suits Lapis for Shani?', answer: 'Silver is standard. Some charts prescribe iron-based Panchdhatu or mixed alloys — follow your astrologer\'s metal recommendation.' },
    { question: 'Does Lapis need energization?', answer: `Yes — Vedic practice favors Saturday purification and Shani mantra before first wear. ${BRAND} offers in-house energization services.` },
  ],
});

const MOONSTONE = defineUpratna({
  slug: 'moonstone',
  name: 'Moonstone',
  hindi: 'Chandrakant',
  planet: 'Moon (Chandra)',
  substitute: 'Pearl (Moti)',
  intro:
    'Moonstone — Chandrakant — displays a luminous adularescence reminiscent of moonlight, making it one of the most beloved Chandra upratnas when natural Pearl is unavailable or unsuitable.',
  heroBenefits: ['Gentle Chandra support', 'Signature adularescent glow', 'Emotional balance', 'Popular in silver jewellery'],
  seoDescription: `Buy natural Moonstone (Chandrakant) online at ${BRAND}. A traditional Moon upratna for Pearl with certification, transparent sourcing, and expert Vedic consultation.`,
  about: [
    'Moonstone is orthoclase or albite feldspar exhibiting adularescence — a floating blue-white sheen caused by light scattering between thin lamellae. Composition is potassium aluminium silicate with a Mohs hardness of 6–6.5.',
    'In Jyotish, Moonstone is widely used as an upratna for Moti when the chart calls for Chandra strengthening. It is especially popular for emotional stability and mother-related karma. ' + ASTRO_DISCLAIMER,
    'Sri Lankan (Ceylon) Moonstone set the global standard for blue sheen, while Indian and Madagascan sources offer varied body colours from colourless to peach.',
  ],
  aboutTable: [
    ['Mineral family', 'Feldspar (orthoclase/albite)'],
    ['Key phenomenon', 'Adularescence (schiller)'],
    ['Mohs hardness', '6–6.5'],
    ['Vedic association', 'Moon (Chandra) — upratna for Moti'],
  ],
  howToWear: [
    'Wear on Monday morning during Chandra Hora, typically on the little finger of the right hand in silver. Purify with raw milk or Ganga jal and chant "Om Som Somaya Namah" 108 times.',
    'Choose a cabochon with strong centred adularescence — the sheen should move across the dome when rotated. Open-back settings enhance skin contact.',
    'Do not combine with a primary Pearl without astrological clearance, as doubling Chandra remedies may disturb emotional equilibrium in sensitive charts.',
  ],
  whoShouldWear: [
    'Prescribed when the Moon is weak, afflicted by Rahu/Ketu, or when Pearl is contraindicated (certain allergies or lifestyle constraints). Often considered for anxiety, mood fluctuation, and mother-child relationship karma.',
    'May benefit creatives, healers, and those in caring professions when Chandra is a functional benefic. Avoid self-prescription during severe Chandra afflictions without expert analysis.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Traditionally supports emotional intelligence, intuition, and peaceful sleep rhythms under Chandra\'s governance. Many meditators keep Moonstone for its gentle, receptive energy.',
    'Unlike organic Pearl, Moonstone is mineral and avoids marine sourcing concerns — appealing to ethically minded buyers.',
    'Fine blue-sheen Moonstone also enjoys strong demand in artisan jewellery beyond astrology.',
  ],
  types: [
    'Rainbow Moonstone (white labradorite) is related but mineralogically distinct — clarify species with your seller. Classic Chandra upratna refers to orthoclase Moonstone.',
    'Peach and grey body colours are common; blue-sheen Ceylon stones are premium. Cat\'s-eye Moonstone is a rare collectible variant.',
    'Glass imitations with foil backs exist — certification is essential for significant purchases.',
  ],
  qualityPrice: [
    'Blue adularescence intensity, dome symmetry, and transparency drive price. Fine Ceylon cabochons above 10 ct can be surprisingly costly for an upratna.',
    'Minor inclusions are acceptable if the sheen remains vivid face-up. Compare sheen, not just body colour, when shopping online.',
  ],
  qualityTable: [
    ['Adularescence', 'Bright, centred blue sheen is top grade'],
    ['Body clarity', 'Transparent to translucent with minimal black specks'],
    ['Cut', 'High-domed cabochon maximizes schiller'],
    ['Origin', 'Sri Lanka historically benchmark; India and Madagascar widely available'],
  ],
  jewellery: [
    'Moonstone suits silver rings, delicate pendants, and Chandrama-themed bracelets. Protective bezels help because feldspar cleaves easily.',
    'Earrings showcase adularescence beautifully for non-astrological fashion wear alongside remedial pieces.',
  ],
  care: [
    'Avoid ultrasonic cleaning and hard knocks — Moonstone cleaves along feldspar planes. Clean with lukewarm soapy water and a soft cloth.',
    'Remove before sports and chemical exposure. Store wrapped separately from harder gems.',
  ],
  beware: [
    'Opalite (glass) is often mis-sold as Moonstone. Rainbow Moonstone confusion with labradorite can mislead buyers seeking orthoclase Chandrakant.',
    'Heat-treated or coated stones should be disclosed and are generally avoided for Jyotish.',
  ],
  faqs: [
    { question: 'Is Moonstone as effective as Pearl for Chandra?', answer: 'Jyotish treats it as a recognized upratna, though primary Moti is considered stronger. Suitability depends on chart strength and dasha — consult your astrologer.' },
    { question: 'Which Moonstone is best — blue or peach?', answer: 'Blue-sheen Ceylon Moonstone is traditionally preferred for Chandra remedies, but your astrologer may specify body colour based on nakshatra or lagna.' },
    { question: 'Can men wear Moonstone?', answer: 'Yes — Chandra remedies are gender-neutral. Metal, finger, and weight follow chart analysis, not gender alone.' },
    { question: 'What is the difference between Moonstone and Pearl?', answer: 'Pearl is organic (mollusk secretion) ruled by Chandra as a Navaratna. Moonstone is a feldspar mineral used as a mineralogical upratna when Moti is not ideal.' },
    { question: 'How much should a Chandra upratna weigh?', answer: 'Often 5–10 ratti is suggested for adults, scaled to body weight and Chandra strength. Personalized recommendation is essential.' },
    { question: 'Does Moonstone break easily?', answer: 'With Mohs 6–6.5 and perfect cleavage, it needs protected settings. Pendants and occasional-wear rings last longer than unprotected daily rings.' },
  ],
});

const PERIDOT = defineUpratna({
  slug: 'peridot',
  name: 'Peridot',
  hindi: 'Zabarjad',
  planet: 'Mercury (Budh)',
  substitute: 'Emerald (Panna)',
  intro:
    'Peridot — Zabarjad — is a vibrant green magnesium iron silicate often recommended as a Mercury upratna when Emerald is beyond budget or when a brighter olive-green tone is preferred.',
  heroBenefits: ['Budh-aligned green upratna', 'Vivid natural colour', 'Good durability for rings', 'No oil treatment needed'],
  seoDescription: `Shop natural Peridot (Zabarjad) at ${BRAND}. A certified Mercury upratna substitute for Emerald with origin transparency, Jyotish consultation, and global delivery.`,
  about: [
    'Peridot is gem-quality olivine — (Mg,Fe)₂SiO₄ — coloured by iron. Unlike Emerald, its green is intrinsic to the crystal structure, not chromium or vanadium. Mohs hardness is 6.5–7.',
    'Classical and modern Jyotish often list Zabarjad among Budh upratnas for communication, commerce, and intellectual pursuits when Panna is not prescribed or affordable. ' + ASTRO_DISCLAIMER,
    'Notable sources include Pakistan (Suppatt), Myanmar, Arizona (USA), and China. Some Peridot also occurs in meteorites (pallasites), though jewellery material is terrestrial.',
  ],
  aboutTable: [
    ['Mineral family', 'Olivine (nesosilicate)'],
    ['Typical colour', 'Yellow-green to olive green'],
    ['Mohs hardness', '6.5–7'],
    ['Vedic association', 'Mercury (Budh) — upratna for Panna'],
  ],
  howToWear: [
    'Wear on Wednesday during Budh Hora, commonly on the little finger in gold or emerald-green thread set in Panchdhatu. Purify with tulsi water or Ganga jal and chant "Om Bram Budhaya Namah" 108 times.',
    'Faceted Peridot allows excellent light return — choose eye-clean stones for maximum brilliance. Skin-contact open settings are preferred.',
    'Avoid pairing with a primary Emerald unless directed — dual Budh stones can over-stimulate Mercury in sensitive charts.',
  ],
  whoShouldWear: [
    'Explored when Mercury governs lagna, occupies kendra/trikona, or needs support for education, writing, trading, and analytics. Gemini and Virgo ascendants often discuss Budh stones with their astrologer.',
    'May help natives facing Mercury afflictions from Saturn or Mars when a gentler remedy is appropriate. Not for everyone during Mercury retrograde periods without analysis.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Linked to articulate speech, business acumen, adaptability, and learning agility under Budh. The bright green is thought to refresh mental fatigue.',
    'Peridot requires no fracture filling — a practical advantage over many Emeralds. Natural colour is stable under normal wear.',
    'Collectors appreciate Pakistani and Myanmar crystals for exceptional saturation and size.',
  ],
  types: [
    'Pakistani Peridot from the Suppatt region is famed for large clean crystals. Arizona Peridot (San Carlos) is widely available in smaller sizes.',
    'Changbai Peridot from China offers commercial grades. Burmese material can show exceptional colour in smaller gems.',
    'Glass and synthetic spinel imitations exist — verify with RI ~1.65–1.69 and birefringence.',
  ],
  qualityPrice: [
    'Vivid green with minimal brown undertone commands highest prices. Larger eye-clean stones above 5 ct rise sharply per carat.',
    'Lily-pad inclusions (chromite discs) are diagnostic of natural Peridot and acceptable in moderate amounts.',
  ],
  qualityTable: [
    ['Colour', 'Pure green to slightly yellowish green; brownish tones reduce value'],
    ['Clarity', 'Eye-clean preferred; lily-pad inclusions confirm natural origin'],
    ['Size', 'Gems above 3 ct are relatively rare in fine quality'],
    ['Treatment', 'Typically untreated — disclose any enhancement'],
  ],
  jewellery: [
    'Gold and Panchdhatu rings on the little finger are standard Budh mounts. Peridot earrings and pendants suit professionals wanting weekday Mercury support without a visible ring.',
    'Avoid prong settings that expose fragile facet corners — protected mounts extend life.',
  ],
  care: [
    'Peridot is sensitive to sudden temperature changes and acids. Clean with mild soap and lukewarm water; skip ultrasonic if inclusions are prominent.',
    'Remove before gardening or abrasive work — hardness 6.5–7 is moderate.',
  ],
  beware: [
    'Green glass and synthetic corundum are common substitutes. "Zabarjad" labels on yellow-green glass appear in tourist markets.',
    'Some sellers confuse Peridot with green tourmaline or chrome diopside — get lab confirmation.',
  ],
  faqs: [
    { question: 'Is Peridot the same as Zabarjad?', answer: 'Yes — Zabarjad is the traditional Hindi/Urdu trade name for Peridot used in Indian gem bazaars and Jyotish literature.' },
    { question: 'Peridot vs Emerald for Budh — which is stronger?', answer: 'Emerald (Panna) is the primary Navaratna for Mercury. Peridot is an upratna — effective for many charts but generally considered gentler. Your astrologer decides.' },
    { question: 'Which origin is best for Jyotish Peridot?', answer: 'Origin is secondary to natural, untreated green colour and clarity. Pakistani and Burmese stones are prized, but any certified natural Peridot may suffice per chart.' },
    { question: 'Can Peridot be worn in silver?', answer: 'Gold and Panchdhatu are traditional for Budh, but some practitioners approve silver for upratnas. Follow your astrologer\'s metal prescription.' },
    { question: 'What finger for Peridot ring?', answer: 'Little finger (kanishtha) of the right hand on Wednesday is standard for Mercury gems in North Indian tradition.' },
    { question: 'Is Arizona Peridot good enough for astrology?', answer: 'Yes, if natural and vibrant. Arizona material is often smaller but beautifully coloured — suitable when weight requirements are modest.' },
  ],
});

const ROSE_QUARTZ = defineUpratna({
  slug: 'rose-quartz',
  name: 'Rose Quartz',
  hindi: 'Gulabi Spatik',
  planet: 'Venus (Shukra)',
  substitute: 'Diamond (Heera) / White Sapphire',
  intro:
    'Rose Quartz is a soft pink quartz treasured as a gentle Shukra upratna for harmony, affection, and creative expression when primary Venus stones are not suitable.',
  heroBenefits: ['Gentle Venus support', 'Affordable Shukra upratna', 'Soothing pink hue', 'Ideal for pendants and bracelets'],
  seoDescription: `Buy natural Rose Quartz at ${BRAND}. A Venus-aligned upratna substitute with certified quality, transparent sourcing, and Jyotish guidance for remedial wear.`,
  about: [
    'Rose Quartz is macrocrystalline quartz (SiO₂) coloured by trace titanium, iron, or dumortierite inclusions. It ranks 7 on the Mohs scale and occurs in translucent to semi-transparent masses and faceted gems.',
    'Modern Jyotish and crystal healing traditions associate Rose Quartz with Shukra — beauty, relationships, art, and comfort — as an accessible upratna when Diamond or White Sapphire is not advised. ' + ASTRO_DISCLAIMER,
    'Major sources include Brazil, Madagascar, South Africa, and India (particularly Andhra Pradesh masses). Star Rose Quartz with asterism is a rare collector form.',
  ],
  aboutTable: [
    ['Mineral family', 'Quartz (SiO₂)'],
    ['Typical colour', 'Soft to medium pink'],
    ['Mohs hardness', '7'],
    ['Vedic association', 'Venus (Shukra) — gentle upratna'],
  ],
  howToWear: [
    'If prescribed, wear on Friday during Shukra Hora — often as a pendant near the heart or on the middle/ring finger in silver or white metal. Chant "Om Dram Dreem Droum Sah Shukraya Namah" 108 times after milk purification.',
    'Rose Quartz is frequently recommended as a pendant rather than ring because uniform pink rough is common in cabochon and bead form.',
    'Do not stack with Diamond or White Sapphire without astrological approval.',
  ],
  whoShouldWear: [
    'Considered when Venus needs soft support for marriage harmony, artistic talent, or luxury matters without the intensity of a primary Shukra ratna. Taurus and Libra lagnas may discuss Venus remedies with their astrologer.',
    'Popular among those seeking emotional healing alongside Venus karma — but chart compatibility remains mandatory.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Traditionally linked with compassion, reconciliation, self-esteem, and gracious communication — qualities under Shukra\'s domain.',
    'Affordable rough material makes consistent wear achievable. Many keep Rose Quartz mala beads for Friday meditation.',
    'Beyond Jyotish, interior designers and wellness practitioners value its calming pink for spaces and rituals.',
  ],
  types: [
    'Madagascar and Brazilian Rose Quartz dominate commercial supply. Star Rose Quartz from India shows six-ray asterism on polished domes.',
    'Dyed pink quartz and glass are common — natural colour is usually uneven and soft, not hot pink.',
    'Faceted gems are rarer than cabochons and beads due to cloudy rough.',
  ],
  qualityPrice: [
    'Faceted eye-clean pink gems are premium; bead strands and tumbled stones are economical. Star specimens with sharp rays fetch collector prices.',
    'For Jyotish, even translucent cabochons suffice if natural and untreated.',
  ],
  qualityTable: [
    ['Colour', 'Even medium pink without orange or grey cast'],
    ['Transparency', 'Semi-transparent to translucent typical'],
    ['Asterism', 'Rare star variety highly collectible'],
    ['Treatment', 'Natural colour only for remedial use'],
  ],
  jewellery: [
    'Heart pendants, beaded bracelets, and silver rings are popular Shukra styles. Mala of 108 Rose Quartz beads supports Friday japa.',
    `${BRAND} can mount Rose Quartz in open-back pendants for skin contact during Venus hora practices.`,
  ],
  care: [
    'Rose Quartz is durable but can fade with extreme prolonged sunlight. Clean with mild soap and water; avoid harsh chemicals.',
    'Beaded strands should be re-strung periodically if worn daily.',
  ],
  beware: [
    'Intensely hot-pink "Rose Quartz" is often dyed quartz or glass. Synthetic quartz is growable — insist on natural certification for Jyotish.',
    'Do not confuse with pink tourmaline (rubellite), which is a different planetary mapping.',
  ],
  faqs: [
    { question: 'Is Rose Quartz a Venus gemstone?', answer: 'In contemporary Jyotish and folk practice, yes — as a gentle Shukra upratna. Classical texts emphasize Diamond/White Sapphire; Rose Quartz is a practical alternative when approved by your astrologer.' },
    { question: 'Ring or pendant for Rose Quartz?', answer: 'Pendants near the heart are very common for Shukra upratnas. Rings work if your astrologer specifies finger and metal — often Friday wear in silver.' },
    { question: 'Can Rose Quartz attract love?', answer: 'Tradition associates it with emotional openness and harmony, but gemstone results depend on dasha, Venus placement, and karma — not instant guarantees.' },
    { question: 'How is it different from Pink Tourmaline?', answer: 'Rose Quartz is quartz (SiO₂); tourmaline is a borosilicate with different chemistry, hardness, and Jyotish mapping. Do not substitute without expert advice.' },
    { question: 'What weight is needed?', answer: 'Upratnas often use 5–12 ratti equivalents; beads and pendants may be judged by presence rather than precise carat. Consult your astrologer.' },
    { question: 'Is star Rose Quartz better?', answer: 'Asterism is rare and beautiful but not required for Jyotish. Any natural, untreated pink quartz of pleasing colour may serve as an upratna.' },
  ],
});

const CITRINE = defineUpratna({
  slug: 'citrine',
  name: 'Citrine',
  hindi: 'Sunela',
  planet: 'Jupiter (Guru)',
  substitute: 'Yellow Sapphire (Pukhraj)',
  intro:
    'Citrine — Sunela — is a golden quartz prized as a Jupiter upratna, bringing warmth and optimism when natural Yellow Sapphire is not within reach.',
  heroBenefits: ['Guru-aligned golden tone', 'Durable quartz for daily wear', 'Budget-friendly Pukhraj alternative', 'No fracture filling'],
  seoDescription: `Buy natural Citrine (Sunela) at ${BRAND}. A Jupiter upratna substitute for Yellow Sapphire with certification, treatment disclosure, and expert Vedic guidance.`,
  about: [
    'Citrine is yellow to orange quartz (SiO₂) coloured by trace iron. Natural citrine is relatively rare — much market citrine is heat-treated amethyst. Mohs hardness is 7.',
    'Sunela appears in Indian bazaars as a Guru upratna when Pukhraj is unavailable. Some traditions also note solar undertones in golden citrine, but primary Jyotish mapping is Jupiter. ' + ASTRO_DISCLAIMER,
    'Brazil and Madagascar produce notable natural citrine; Spain (Asturias) and Bolivia also yield fine crystals.',
  ],
  aboutTable: [
    ['Mineral family', 'Quartz (SiO₂)'],
    ['Typical colour', 'Pale yellow to deep orange-brown'],
    ['Mohs hardness', '7'],
    ['Vedic association', 'Jupiter (Guru) — upratna for Pukhraj'],
  ],
  howToWear: [
    'Wear on Thursday during Guru Hora, typically index finger of right hand in gold or Panchdhatu. Purify with turmeric water or Ganga jal and chant "Om Gram Greem Groum Sah Gurave Namah" 108 times.',
    'Insist on disclosed natural citrine or ethically disclosed heat-treated amethyst only if your astrologer accepts it — many Jyotish practitioners prefer naturally yellow material.',
    'Avoid wearing with primary Yellow Sapphire without expert approval.',
  ],
  whoShouldWear: [
    'Suggested when Jupiter is benefic yet underpowered, supporting wisdom, teaching, children, and dharmic growth. Sagittarius and Pisces ascendants frequently discuss Guru stones.',
    'May suit educators, advisors, and spiritual seekers during favorable Jupiter transits — never as a blanket remedy for all Guru afflictions.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with optimism, generosity, learning, and ethical prosperity under Guru\'s influence.',
    'Quartz durability suits daily rings and bracelets — practical for long-term upratna wear.',
    'Natural deep honey citrine is collectible; even pale stones serve budget-conscious remedies.',
  ],
  types: [
    'Madeira citrine shows rich orange-brown; lemon citrine is paler yellow. Heat-treated amethyst often shows reddish undertones and is sold as citrine — disclosure matters.',
    'Brazilian geodes yield large crystals; African material is common in beads.',
    'Synthetic quartz citrine exists — unsuitable for Jyotish unless explicitly approved.',
  ],
  qualityPrice: [
    'Deep natural orange citrine commands premium; pale heat-treated material is inexpensive.',
    'For astrology, vivid golden-yellow face-up colour matters more than origin pedigree.',
  ],
  qualityTable: [
    ['Colour', 'Rich golden yellow to Madeira orange'],
    ['Natural vs heated', 'Natural preferred; disclose heat treatment'],
    ['Clarity', 'Eye-clean faceted stones ideal'],
    ['Cut', 'Oval and cushion maximize colour'],
  ],
  jewellery: [
    'Gold index-finger rings are classic Guru mounts. Citrine pendants and kada bracelets suit those who prefer Thursday-only wear.',
    'Pair with yellow clothing or silk thread on first wear if following folk energization customs.',
  ],
  care: [
    'Citrine can fade with prolonged intense heat or sunlight — normal wear is safe. Clean with soap and water.',
    'Store away from direct dashboard sunlight if kept in a car.',
  ],
  beware: [
    'Most cheap "citrine" is heated amethyst — ask for origin and treatment reports. Glass imitations are common in tourist markets.',
    'Smoky quartz is sometimes mislabeled; verify RI and birefringence.',
  ],
  faqs: [
    { question: 'Is heat-treated amethyst valid as Sunela?', answer: 'Trade practice accepts it as citrine, but conservative Jyotish often prefers naturally yellow quartz. Ask your astrologer before buying treated material.' },
    { question: 'Citrine vs Yellow Sapphire?', answer: 'Pukhraj is the primary Guru ratna. Citrine is an upratna — gentler and more affordable. Chart analysis determines which is appropriate.' },
    { question: 'Which finger for Citrine?', answer: 'Index finger (tarjani) on Thursday in gold is standard for Jupiter gems in many North Indian traditions.' },
    { question: 'Can I wear Citrine daily?', answer: 'Yes — quartz is durable. Many wear Guru upratnas only on Thursdays; your astrologer may specify continuous or periodic wear.' },
    { question: 'What carat for Guru upratna?', answer: 'Often 5–7 ratti minimum for adults, scaled to body weight. Personalized recommendation required.' },
    { question: 'Does Citrine help finances?', answer: 'Jupiter governs wisdom and dharmic wealth — not gambling luck. Expectations should align with Guru\'s philosophical nature.' },
  ],
});

const GARNET = defineUpratna({
  slug: 'garnet',
  name: 'Garnet',
  hindi: 'Tamada',
  planet: 'Rahu',
  substitute: 'Hessonite (Gomed)',
  intro:
    'Garnet encompasses a family of silicates; deep orange Hessonite-type garnet and red varieties are widely discussed as Rahu and Mangal upratnas in Indian astrology.',
  heroBenefits: ['Rahu-aligned orange garnet', 'Wide colour variety', 'Excellent brilliance', 'Strong value in larger sizes'],
  seoDescription: `Shop natural Garnet at ${BRAND}. A Rahu upratna alternative to Hessonite with lab certification, origin notes, and Jyotish consultation support.`,
  about: [
    'Garnets are nesosilicates with formula X₃Y₂(SiO₄)₃ — species include almandine, pyrope, spessartine, grossular, and andradite. Hessonite is grossular garnet; red garnets are often almandine-pyrope blends. Hardness 6.5–7.5.',
    'In Jyotish, orange "cinnamon" grossular garnet functions as the closest upratna to Gomed for Rahu. Red garnet is sometimes linked to Mangal (Mars) in folk practice — chart-specific. ' + ASTRO_DISCLAIMER,
    'Sri Lanka, India, Tanzania, and Madagascar are major sources. Tsavorite (green grossular) and rhodolite are jewellery favourites beyond remedial use.',
  ],
  aboutTable: [
    ['Mineral family', 'Garnet group (nesosilicate)'],
    ['Rahu variety', 'Hessonite-type grossular (orange)'],
    ['Mohs hardness', '6.5–7.5'],
    ['Vedic association', 'Rahu — upratna for Gomed'],
  ],
  howToWear: [
    'For Rahu remedies, wear on Saturday evening or Wednesday (traditions vary) on the middle finger in silver or Panchdhatu. Chant "Om Ram Rahave Namah" 108 times after purification.',
    'Select orange grossular with honey tones and visible "scotch in water" inclusions typical of natural Hessonite-type garnet — excessive clarity may indicate synthetic.',
    'Do not combine with primary Gomed without astrological supervision.',
  ],
  whoShouldWear: [
    'Orange garnet is explored when Rahu requires pacification or structured channeling — often during Rahu dasha/antardasha if benefic placement supports gemstones.',
    'Red garnet for Mars is a separate prescription — never assume all garnets map to the same graha.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Rahu-linked garnet is associated with unconventional success, foreign connections, technology, and breaking stagnation when worn appropriately.',
    'Garnet\'s high refractive index yields exceptional brilliance for the price — attractive in statement rings.',
    'Natural inclusions in Hessonite-type material are diagnostically acceptable and often expected.',
  ],
  types: [
    'Hessonite (Gomed) is grossular; spessartine is mandarin orange; almandine is deep red. Know which species your astrologer prescribes.',
    'Synthetic YAG and glass imitate garnet — RI and spectrum help identification.',
    'Tsavorite and demantoid are rare green garnets for jewellery, not standard Rahu upratnas.',
  ],
  qualityPrice: [
    'Fine Hessonite-type garnet rises with size and clarity balance — too clean may raise suspicion. Red rhodolite is priced on colour and size.',
    'Indian and Sri Lankan Hessonite historically benchmarked for Jyotish.',
  ],
  qualityTable: [
    ['Colour (Rahu)', 'Honey-orange to reddish orange'],
    ['Inclusions', 'Swirl/heavy inclusions common in natural Hessonite-type'],
    ['Brilliance', 'High RI — lively faceting'],
    ['Species', 'Confirm grossular for Gomed substitute'],
  ],
  jewellery: [
    'Silver and Panchdhatu rings dominate Rahu mounts. Garnet also suits bold pendants and men\'s signet styles.',
    'Protect facet corners in daily-wear rings — garnet is not as hard as corundum.',
  ],
  care: [
    'Avoid ultrasonic if heavily included. Warm soapy water and soft brush suffice.',
    'Garnet tolerates normal wear but can abrade over years in high-friction ring settings.',
  ],
  beware: [
    'Glass-filled or dyed garnet simulants appear in low-cost markets. "Gomed" labels on red almandine mislead Rahu buyers.',
    'Synthetic garnets exist — natural diagnosis via inclusions and RI is essential.',
  ],
  faqs: [
    { question: 'Is all Garnet good for Rahu?', answer: 'No — Rahu upratna specifically refers to Hessonite-type orange grossular garnet (Gomed family). Red garnet is a different planetary discussion.' },
    { question: 'Garnet vs Hessonite?', answer: 'Hessonite is a garnet species. Pure Hessonite is the primary Rahu ratna; other orange garnets may serve as upratnas if approved.' },
    { question: 'Why do Hessonite stones look included?', answer: 'Natural swirls and "treacle" inclusions are typical and accepted in Jyotish — unlike other gems where heavy inclusions reduce value sharply.' },
    { question: 'Which day to wear orange Garnet?', answer: 'Saturday is common for Rahu; some lineages use Wednesday. Follow your astrologer\'s muhurta.' },
    { question: 'Can Garnet be worn in gold?', answer: 'Silver and Panchdhatu are traditional for Rahu. Gold may be prescribed in specific charts — confirm first.' },
    { question: 'What weight for Rahu upratna?', answer: 'Often 6–8 ratti for Hessonite-type garnet, but Rahu remedies are potent — weight must be chart-calibrated.' },
  ],
});

const TURQUOISE = defineUpratna({
  slug: 'turquoise',
  name: 'Turquoise',
  hindi: 'Firoza',
  planet: 'Jupiter (Guru)',
  substitute: 'Yellow Sapphire (Pukhraj)',
  intro:
    'Turquoise — Firoza — is an ancient sky-blue gem treasured across Asia as a Jupiter upratna and protective talisman for travelers and scholars.',
  heroBenefits: ['Historic Firoza pedigree', 'Distinctive sky-blue colour', 'Lightweight for large sizes', 'Traditional Guru upratna'],
  seoDescription: `Buy natural Turquoise (Firoza) online at ${BRAND}. A Jupiter-aligned upratna with treatment disclosure, certification, and expert Jyotish consultation.`,
  about: [
    'Turquoise is a hydrated copper aluminium phosphate — CuAl₆(PO₄)₄(OH)₈·4H₂O — ranking 5–6 on Mohs. Its colour ranges from sky blue to blue-green depending on iron and zinc content.',
    'Persian and Indian traditions classify Firoza among Guru upratnas, worn for wisdom, protection, and auspicious journeys. Some regional schools also associate fine blue Firoza with Shukra or general fortune — chart decides. ' + ASTRO_DISCLAIMER,
    'Iran (Nishapur), Arizona (USA), China, and Egypt supply commercial turquoise. Porous stones are often stabilized with resin.',
  ],
  aboutTable: [
    ['Mineral family', 'Phosphate (hydrated copper aluminium)'],
    ['Typical colour', 'Sky blue to blue-green'],
    ['Mohs hardness', '5–6'],
    ['Vedic association', 'Jupiter (Guru) — Firoza upratna'],
  ],
  howToWear: [
    'Wear on Thursday during Guru Hora in silver or gold on the index finger, or as a pendant. Purify with Ganga jal and chant Guru beej mantra 108 times.',
    'Request disclosure on stabilization — many astrologers prefer untreated natural turquoise for Jyotish; others accept conservative stabilization for durability.',
    'Turquoise is porous — remove before bathing, perfumes, or gym.',
  ],
  whoShouldWear: [
    'Chosen when Jupiter needs supportive remedies and a blue talisman is culturally resonant. Historically worn by riders, merchants, and students in Central and South Asia.',
    'May suit those seeking protection during travel and litigation — if Guru is a functional benefic in the chart.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Linked with divine favour, eloquence, safe passage, and optimistic outlook under Guru.',
    'Large cabochons are affordable compared to transparent Jupiter gems — strong visual presence in rings.',
    'Collectors prize Persian "robin\'s egg" blue with minimal matrix.',
  ],
  types: [
    'Sleeping Beauty (Arizona) shows clean blue; Persian material is intensely coloured. Chinese turquoise often has matrix webbing.',
    'Reconstituted turquoise powder with resin is common — not valid for Jyotish.',
    'Dyed howlite and magnesite are ubiquitous fakes.',
  ],
  qualityPrice: [
    'Even, vivid blue with little matrix is most expensive. Spiderweb matrix can be artistic or devaluing depending on taste.',
    'Stabilized turquoise costs less than hard, untreated natural material.',
  ],
  qualityTable: [
    ['Colour', 'Clear sky blue preferred; greenish or greyish tones lower value'],
    ['Matrix', 'Minimal black/brown matrix for top grade'],
    ['Treatment', 'Disclose stabilization, wax, or dye'],
    ['Hardness', 'Untreated high-hardness natural is rare and costly'],
  ],
  jewellery: [
    'Turquoise dominates silver ethnic rings, kada, and pendants. Gold Firoza rings are popular in North India for Guru.',
    'Bezel settings essential — turquoise chips easily in open prongs.',
  ],
  care: [
    'Never ultrasonic or steam. Wipe with dry soft cloth; avoid all chemicals, oils, and prolonged water.',
    'Skin oils and perfume darken porous turquoise over time — wear after cosmetics.',
  ],
  beware: [
    'Howlite dyed blue is the #1 Firoza fake. Reconstituted blocks fail gemological and remedial standards.',
    'Ask for specific treatment reports — "natural turquoise" may still be stabilized.',
  ],
  faqs: [
    { question: 'Is Firoza for Jupiter or Saturn?', answer: 'Primary Indian tradition maps Firoza to Guru (Jupiter). Some folk practices mention other grahas — follow your astrologer, not generic blog charts.' },
    { question: 'Can stabilized Turquoise be worn?', answer: 'Opinions vary. Conservative Jyotish prefers untreated natural stone. If stabilized, disclose and seek astrological approval.' },
    { question: 'Why does Turquoise change colour?', answer: 'Porous structure absorbs oils and chemicals, darkening or greening. Proper care and untreated quality reduce this risk.' },
    { question: 'Persian vs American Turquoise?', answer: 'Both can be excellent. Persian blue is historically prized; Arizona Sleeping Beauty is valued for clean robin\'s-egg colour.' },
    { question: 'Ring finger or index for Firoza?', answer: 'Index finger on Thursday is common for Guru. Your astrologer may differ based on lagna and dasha.' },
    { question: 'How to test real Firoza?', answer: 'Gem labs check refractive index, specific gravity, and structure. Hot needle test damages stones — use professional testing only.' },
  ],
});

const AQUAMARINE = defineUpratna({
  slug: 'aquamarine',
  name: 'Aquamarine',
  hindi: 'Beruj',
  planet: 'Mercury (Budh)',
  substitute: 'Emerald (Panna)',
  intro:
    'Aquamarine — Beruj — is a sea-blue beryl valued as a cooling Mercury upratna and a serene alternative to Emerald when lighter blue-green tones are preferred.',
  heroBenefits: ['Cooling blue beryl', 'Mercury-aligned upratna', 'Excellent clarity typical', 'Durable for jewellery'],
  seoDescription: `Shop natural Aquamarine (Beruj) at ${BRAND}. A Mercury upratna substitute for Emerald with certification, origin transparency, and Vedic expert support.`,
  about: [
    'Aquamarine is blue to blue-green beryl — Be₃Al₂Si₆O₁₈ — coloured by iron. Mohs hardness 7.5–8 makes it excellent for rings. It is the same mineral family as Emerald.',
    'Beruj appears in Indian astrological commerce as a Budh upratna, especially when a cooler, calmer Mercury remedy is desired versus intense green Panna. Some lineages also note lunar cooling properties — primary mapping remains Mercury. ' + ASTRO_DISCLAIMER,
    'Brazil (Minas Gerais), Pakistan, Madagascar, and Nigeria produce notable aquamarine. Santa Maria blue is a prized colour term from Brazil.',
  ],
  aboutTable: [
    ['Mineral family', 'Beryl (cyclosilicate)'],
    ['Typical colour', 'Light to medium blue / blue-green'],
    ['Mohs hardness', '7.5–8'],
    ['Vedic association', 'Mercury (Budh) — upratna for Panna'],
  ],
  howToWear: [
    'Wear on Wednesday during Budh Hora on the little finger in gold or Panchdhatu. Purify and chant "Om Bram Budhaya Namah" 108 times.',
    'Select lively blue stones with good transparency — aquamarine often eye-clean, making fine appearance achievable at moderate weights.',
    'Avoid pairing with primary Emerald without guidance.',
  ],
  whoShouldWear: [
    'Considered for communication, commerce, analytics, and study when Mercury needs support with a gentler aesthetic than Emerald.',
    'May appeal to natives who find dark green Panna visually or energetically too strong — astrologer must confirm suitability.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with clear thinking, articulate expression, and calm negotiation under Budh.',
    'High clarity and durability suit professionals wearing Mercury support daily.',
    'Large clean crystals are more affordable than comparable Emerald — useful for bold rings.',
  ],
  types: [
    'Santa Maria and Espirito Santo blues from Brazil set colour benchmarks. Heat treatment is common and usually accepted in trade — disclose for Jyotish.',
    'Maxixe-type irradiated beryl fades — avoid for remedial use.',
    'Glass and synthetic spinel imitations exist.',
  ],
  qualityPrice: [
    'Deep saturated blue commands premium; pale stones are economical. Size and clarity escalate price quickly above 5 ct.',
    'Heat-treated blue is standard — natural deep colour without treatment is rare and costly.',
  ],
  qualityTable: [
    ['Colour', 'Intense blue preferred; greenish or greyish reduce value'],
    ['Clarity', 'Eye-clean typical; loupe-clean in top grade'],
    ['Cut', 'Emerald and oval cuts popular'],
    ['Treatment', 'Disclose heat; avoid irradiated fading material'],
  ],
  jewellery: [
    'Aquamarine excels in gold Mercury rings, drop earrings, and statement pendants. Open-back mounts showcase clarity.',
    'Pairs beautifully with white metals for contemporary Jyotish jewellery.',
  ],
  care: [
    'Generally safe with warm soapy water. Avoid extreme heat that might affect treated stones.',
    'Beryl can chip on sharp blows — protective settings advised.',
  ],
  beware: [
    'Synthetic aquamarine and blue glass are sold as Beruj. Irradiated stones may fade — test and certify.',
    'Do not confuse with blue topaz, which has different chemistry and Shani mapping.',
  ],
  faqs: [
    { question: 'Aquamarine vs Emerald for Budh?', answer: 'Emerald is the primary Mercury ratna. Aquamarine is a beryl upratna — cooler and often gentler. Your chart determines the right choice.' },
    { question: 'Is heat-treated Aquamarine OK?', answer: 'Trade widely accepts heat. Conservative Jyotish may prefer untreated stones — discuss with your astrologer and disclose treatments.' },
    { question: 'What is Santa Maria colour?', answer: 'A trade term for vivid blue Brazilian aquamarine reminiscent of historic Santa Maria de Itabira material — now applied to similar hues globally.' },
    { question: 'Which metal for Beruj?', answer: 'Gold and Panchdhatu are standard for Budh. Silver may be approved for upratnas in some charts.' },
    { question: 'Can Aquamarine be worn daily?', answer: 'Yes — hardness 7.5–8 supports daily rings with reasonable care.' },
    { question: 'Does Beruj help public speaking?', answer: 'Mercury governs speech and intellect; aquamarine is worn as a Budh support — results depend on chart strength and effort, not magic alone.' },
  ],
});

const TIGER_EYE = defineUpratna({
  slug: 'tiger-eye',
  name: 'Tiger Eye',
  hindi: 'Vaidurya / Tiger Eye',
  planet: 'Sun (Surya)',
  substitute: 'Ruby (Manik)',
  intro:
    'Tiger Eye is a golden chatoyant quartzite long worn as a Ketu/Sun talisman in folk practice; many Jyotish advisors also prescribe it as a grounding Surya upratna for confidence and focus.',
  heroBenefits: ['Bold chatoyant bands', 'Affordable solar upratna', 'Durable in bracelets', 'Striking masculine jewellery'],
  seoDescription: `Buy natural Tiger Eye at ${BRAND}. A Sun-aligned upratna substitute for Ruby with certified quality, transparent sourcing, and Jyotish consultation.`,
  about: [
    'Tiger Eye is metamorphic quartz with parallel crocidolite fibres replaced by silica, producing chatoyancy — a moving band of light. Composition is essentially SiO₂ with iron; hardness ~7.',
    'Chatoyant stones appear in classical references to Vaidurya (often confused with cat\'s eye chrysoberyl). Modern Jyotish retailers frequently list Tiger Eye as a Surya or Ketu support stone depending on lineage — solar mapping is common for golden varieties. ' + ASTRO_DISCLAIMER,
    'South Africa and Western Australia are major sources. Blue tiger eye (hawk\'s eye) is crocidolite-rich; red tiger eye is heat-treated.',
  ],
  aboutTable: [
    ['Mineral family', 'Quartz (pseudomorph of crocidolite)'],
    ['Key phenomenon', 'Chatoyancy (moving band)'],
    ['Mohs hardness', '~7'],
    ['Vedic association', 'Sun (Surya) — folk upratna for Manik'],
  ],
  howToWear: [
    'If prescribed for Surya, wear on Sunday during Surya Hora on the ring finger in gold or copper alloy. Chant "Om Hram Hreem Hroum Sah Suryaya Namah" 108 times after purification.',
    'Cabochon with strong centered band is preferred. Bracelets and kada are popular when ring wear is impractical.',
    'Clarify with your astrologer whether golden Tiger Eye is intended for Surya or another graha — nomenclature varies by region.',
  ],
  whoShouldWear: [
    'Explored when Sun needs modest strengthening for confidence, leadership, vitality, and father-related karma without high-impact Ruby.',
    'May suit public figures, managers, and performers when Surya is a functional benefic — avoid during severe solar afflictions without expert guidance.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with courage, willpower, practical focus, and protection from envy when worn as a solar talisman.',
    'Extremely durable and inexpensive in large cabochons — ideal for bracelets and men\'s jewellery.',
    'Chatoyancy provides instant visual authentication versus glass.',
  ],
  types: [
    'Golden tiger eye is standard for Surya discussions. Hawk\'s eye (blue) and bull\'s eye (red, often heated) are variants with different folk attributions.',
    'Glass fiber imitations show too-perfect banding under magnification.',
    'Tiger iron mixes tiger eye with hematite and jasper.',
  ],
  qualityPrice: [
    'Sharp, centered band and glossy polish define quality. Large cabochons remain affordable — price is per piece.',
    'Fine South African material sets the benchmark for band contrast.',
  ],
  qualityTable: [
    ['Chatoyancy', 'Bright, centered band that moves across dome'],
    ['Colour', 'Rich golden brown with contrast'],
    ['Polish', 'High gloss without pitting'],
    ['Treatment', 'Natural golden preferred; disclose heat for red varieties'],
  ],
  jewellery: [
    'Signet rings, kada bracelets, and adjustable tiger eye bracelets dominate. Pendants suit uniform chatoyant slabs.',
    'Popular combined with Rudraksha in men\'s spiritual jewellery.',
  ],
  care: [
    'Very durable — clean with soap and water. Avoid extreme heat on dyed red varieties.',
    'Bracelet elastic should be replaced periodically with heavy daily wear.',
  ],
  beware: [
    'Glass and plastic chatoyant simulants exist. "Vaidurya" labels on tiger eye may confuse buyers seeking chrysoberyl cat\'s eye (Ketu).',
    'Confirm planetary purpose with your astrologer — Tiger Eye is not a classical Navaratna.',
  ],
  faqs: [
    { question: 'Is Tiger Eye for Sun or Ketu?', answer: 'Both attributions exist in folk and commercial Jyotish. Golden tiger eye is commonly discussed for Surya; chrysoberyl cat\'s eye is the primary Ketu ratna. Consult your astrologer.' },
    { question: 'Can Tiger Eye replace Ruby?', answer: 'It is considered a mild upratna or talisman, not a full Manik substitute in strict classical texts. Suitability is chart-specific.' },
    { question: 'Bracelet or ring for Tiger Eye?', answer: 'Bracelets are widely accepted for upratnas when skin contact and practicality matter. Rings follow standard Surya finger rules if prescribed.' },
    { question: 'What is hawk\'s eye?', answer: 'Blue crocidolite-rich tiger eye before full oxidation. Some practitioners map it differently — do not assume equivalence with golden tiger eye.' },
    { question: 'Is red Tiger Eye natural?', answer: 'Often heat-treated from golden material. Disclose treatment; conservative Jyotish may prefer natural golden.' },
    { question: 'How to verify real Tiger Eye?', answer: 'Natural chatoyancy moves with lighting; glass imitations look static. Specific gravity and structure confirm under gem testing.' },
  ],
});

const MALACHITE = defineUpratna({
  slug: 'malachite',
  name: 'Malachite',
  hindi: 'Malachite',
  planet: 'Venus (Shukra)',
  substitute: 'Diamond (Heera) / Emerald (Panna)',
  intro:
    'Malachite is a vivid green copper carbonate worn as a Shukra-aligned talisman for creativity, beauty, and emotional renewal when transparent Venus gems are not preferred.',
  heroBenefits: ['Striking banded green', 'Distinctive Venus talisman', 'Affordable large cabochons', 'Historic ornamental pedigree'],
  seoDescription: `Buy natural Malachite at ${BRAND}. A Venus-associated upratna with origin disclosure, safety guidance for copper gems, and Jyotish consultation.`,
  about: [
    'Malachite is copper carbonate hydroxide — Cu₂CO₃(OH)₂ — with characteristic green banding. Mohs hardness is 3.5–4, making it soft and sensitive to acids.',
    'Not a classical Navaratna, Malachite appears in modern Jyotish and folk practice as a Shukra support stone for artists and healers, and occasionally as a Budh green alternative — chart determines use. ' + ASTRO_DISCLAIMER,
    'Democratic Republic of Congo, Zambia, and Russia (Ural) produce notable specimens. Malachite often occurs with azurite.',
  ],
  aboutTable: [
    ['Mineral family', 'Copper carbonate'],
    ['Typical colour', 'Banded deep green'],
    ['Mohs hardness', '3.5–4 (soft)'],
    ['Vedic association', 'Venus (Shukra) — folk upratna'],
  ],
  howToWear: [
    'If prescribed, wear on Friday during Shukra Hora as a pendant or brooch rather than a daily ring — softness favors protected mounts. Chant Shukra beej mantra after purification.',
    'Never ingest or use malachite gem elixirs — copper content is toxic if misused in water remedies.',
    'Keep away from sweat and water during wear; skin contact through sealed bezel backs is typical.',
  ],
  whoShouldWear: [
    'Considered for creative professionals, designers, and those seeking gentle Venus support when Diamond or White Sapphire is contraindicated.',
    'Not suitable for rough daily ring wear or for children. Chart analysis mandatory — copper gems are not universal remedies.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with transformation, artistic inspiration, and heart-centered expression under Shukra\'s creative domain.',
    'Large patterned cabochons make bold talismanic jewellery at modest cost.',
    'Collectors value concentric "bull\'s eye" banding from Congo material.',
  ],
  types: [
    'Congolese malachite shows tight banding; fibrous malachite is chatoyant. Azurite-malachite mixes are decorative.',
    'Reconstituted malachite powder blocks are common — avoid for Jyotish.',
    'Dyed resin imitations lack specific gravity ~3.6–4.0.',
  ],
  qualityPrice: [
    'Sharp band contrast and polish quality drive price. Large slabs for pendants are affordable; fine cabochons with minimal pits are premium.',
    'For astrology, natural banding and untreated colour matter more than flawless polish.',
  ],
  qualityTable: [
    ['Pattern', 'Even concentric bands preferred'],
    ['Colour', 'Deep green without black streaking excessive'],
    ['Polish', 'Glossy without epoxy fill (verify)'],
    ['Structure', 'Solid natural, not reconstituted'],
  ],
  jewellery: [
    'Pendants, brooches, and cufflinks suit malachite best. If set in rings, choose occasional-wear bezel mounts.',
    'Silver and copper alloys complement green tones in Shukra-themed designs.',
  ],
  care: [
    'Wipe dry only — water and acids damage malachite. Never ultrasonic, steam, or jewelry dip.',
    'Store flat; soft stone scratches easily. Keep away from children and pets.',
  ],
  beware: [
    'Reconstituted and plastic malachite abound. Toxic copper dust during cutting — buy finished stones from reputable sellers.',
    'Do not use for gem water or oral remedies — copper toxicity risk.',
  ],
  faqs: [
    { question: 'Is Malachite safe to wear?', answer: 'Finished jewellery is generally safe with normal wear. Avoid ingestion, gem elixirs, and inhaling dust from raw cutting. Not recommended for unsupervised children.' },
    { question: 'Malachite for Venus or Mercury?', answer: 'Green colour links it to Budh in some folk lists and Shukra in others. Your astrologer must specify — do not self-prescribe by colour alone.' },
    { question: 'Can Malachite be worn daily in a ring?', answer: 'Not ideal — hardness 3.5–4 scratches and pits quickly. Pendants are safer.' },
    { question: 'How to identify real Malachite?', answer: 'Specific gravity near 4, banded structure, and cold touch. Plastic is lighter and too uniform.' },
    { question: 'Does Malachite need energization?', answer: 'Friday purification and Shukra mantra are standard if prescribed. Malachite is porous — avoid water during puja dips; use dry flowers and incense.' },
    { question: 'Malachite vs Emerald?', answer: 'Emerald is precious beryl and primary Budh ratna. Malachite is a soft copper carbonate folk talisman — vastly different in value, durability, and classical status.' },
  ],
});

const OPAL = defineUpratna({
  slug: 'opal',
  name: 'Opal',
  hindi: 'Opal / Doodhiya Patthar',
  planet: 'Venus (Shukra)',
  substitute: 'Diamond (Heera)',
  intro:
    'Opal captivates with play-of-colour and is widely prescribed as a Shukra upratna when Diamond is impractical — offering Venusian grace with an ethereal glow.',
  heroBenefits: ['Play-of-colour fire', 'Recognised Shukra upratna', 'Unique gemstone character', 'Strong demand in pendants'],
  seoDescription: `Shop natural Opal at ${BRAND}. A Venus upratna substitute for Diamond with lab certification, treatment disclosure, and expert Jyotish guidance.`,
  about: [
    'Opal is hydrated amorphous silica — SiO₂·nH₂O — with a Mohs hardness of 5.5–6.5. Precious opal shows play-of-colour from silica sphere diffraction.',
    'Australian, Ethiopian, and Mexican opals dominate markets. Jyotish frequently lists Opal as a Shukra upratna for luxury, marriage, and arts when Heera is not worn. ' + ASTRO_DISCLAIMER,
    'Black opal, white opal, boulder opal, and fire opal serve different aesthetics — astrologers may prefer white or crystal types for Venus.',
  ],
  aboutTable: [
    ['Mineral family', 'Hydrated silica (amorphous)'],
    ['Key phenomenon', 'Play-of-colour (precious opal)'],
    ['Mohs hardness', '5.5–6.5'],
    ['Vedic association', 'Venus (Shukra) — upratna for Heera'],
  ],
  howToWear: [
    'Wear on Friday during Shukra Hora on the middle or ring finger in silver, platinum, or white gold. Chant Shukra mantra 108 times after milk purification.',
    'Choose solid opal with stable play-of-colour — avoid hydrophane opal that absorbs water unless disclosed and approved.',
    'Do not wear with primary Diamond without astrological clearance.',
  ],
  whoShouldWear: [
    'Explored when Venus signifies relationships, vehicles, comforts, and arts needing support. Taurus/Libra natives may discuss during Shukra dasha.',
    'Some traditions caution opal for certain charts — myths about "bad luck" are culturally variable; Jyotish chart fit matters more than superstition.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Linked with charm, relational harmony, creative inspiration, and appreciation of beauty under Shukra.',
    'Play-of-colour offers unique jewellery appeal beyond remedial use.',
    'White and crystal opal provide affordable entry versus Diamond.',
  ],
  types: [
    'Australian black opal from Lightning Ridge is top tier. Ethiopian welo opal can be hydrophane. Mexican fire opal is transparent orange without play-of-colour.',
    'Doublets and triplets use opal layers on backing — disclose for Jyotish; solid opal preferred.',
    'Synthetic opal shows "snakeskin" pattern under magnification.',
  ],
  qualityPrice: [
    'Play-of-colour coverage, brightness, and body tone drive price. Top black opals rival fine diamonds per carat.',
    'Ethiopian material offers value but check stability and treatment.',
  ],
  qualityTable: [
    ['Play-of-colour', 'Broad flashes across face preferred'],
    ['Body tone', 'Black or white base per variety standards'],
    ['Solid vs composite', 'Solid opal for Jyotish'],
    ['Stability', 'Avoid crazing-prone or untreated hydrophane if water exposure expected'],
  ],
  jewellery: [
    'Opal suits pendants and protected bezel rings. Earrings showcase play-of-colour without heavy knocks.',
    'White gold and platinum echo Shukra\'s bright aesthetic.',
  ],
  care: [
    'Opal contains water — avoid ultrasonic, steam, and prolonged dryness. Some wearers store with damp cotton.',
    'Remove before sports and chemicals. Doublets must not soak.',
  ],
  beware: [
    'Synthetic and assembled opal are widespread. "Opal" labels on resin or glass are common online.',
    'Hydrophane opal changes transparency in water — disclose and understand care.',
  ],
  faqs: [
    { question: 'Is Opal unlucky in India?', answer: 'Regional superstitions vary. Jyotish evaluates Venus placement — many Indians wear opal successfully as a Shukra upratna when chart-approved.' },
    { question: 'Opal vs Diamond for Shukra?', answer: 'Diamond (or White Sapphire) is primary. Opal is a recognized upratna — softer and less costly. Astrologer decides based on chart strength.' },
    { question: 'Which Opal type for Jyotish?', answer: 'Solid white or crystal opal with lively fire is commonly suggested. Black opal is fine if budget allows — confirm with your astrologer.' },
    { question: 'Can Opal get wet?', answer: 'Brief contact is usually OK for stable Australian solid opal. Hydrophane Ethiopian opal absorbs water — avoid soaking. Follow seller care notes.' },
    { question: 'Are opal doublets OK?', answer: 'Conservative Jyotish prefers solid opal. Doublets are jewellery-grade composites — seek astrological approval before remedial use.' },
    { question: 'Friday wear rules?', answer: 'Friday morning Shukra Hora, white clothes optional, Shukra mantra, and metal per chart — typically silver or white metals.' },
  ],
});

const TANZANITE = defineUpratna({
  slug: 'tanzanite',
  name: 'Tanzanite',
  hindi: 'Tanzanite',
  planet: 'Saturn (Shani)',
  substitute: 'Blue Sapphire (Neelam)',
  intro:
    'Tanzanite is a rare blue-violet zoisite from Tanzania, increasingly chosen as a modern Shani upratna when fine Blue Sapphire is unavailable.',
  heroBenefits: ['Unique blue-violet hue', 'Modern Saturn upratna', 'Fine transparency', 'Collector appeal'],
  seoDescription: `Buy natural Tanzanite at ${BRAND}. A Saturn-aligned upratna alternative to Blue Sapphire with certification, treatment disclosure, and Jyotish support.`,
  about: [
    'Tanzanite is blue zoisite — Ca₂Al₃(SiO₄)₃(OH) — coloured by vanadium with Mohs hardness 6–7. Trichroism shows blue, violet, and burgundy axes.',
    'Discovered in 1967 near Merelani, Tanzania, it is a single-source gem in commercial quantities. Jyotish retailers often map its blue-violet to Shani as a contemporary Neelam upratna. ' + ASTRO_DISCLAIMER,
    'Virtually all tanzanite is heat-treated from brown zoisite to blue — disclosure is mandatory.',
  ],
  aboutTable: [
    ['Mineral family', 'Zoisite (epidote group)'],
    ['Typical colour', 'Blue to violet-blue'],
    ['Mohs hardness', '6–7'],
    ['Vedic association', 'Saturn (Shani) — modern upratna'],
  ],
  howToWear: [
    'Wear on Saturday during Shani Hora on middle finger in silver or Panchdhatu. Chant Shani mantra after purification.',
    'Select eye-clean stones with strong blue face-up colour. Protective settings essential due to moderate hardness.',
    'Heat treatment is universal — confirm your astrologer accepts heat-treated upratnas.',
  ],
  whoShouldWear: [
    'Considered when Saturn needs a blue-violet remedy and traditional Amethyst or Iolite are not preferred aesthetically.',
    'May suit professionals seeking disciplined focus during Shani periods — only if chart supports Shani gemstones.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with structured thinking, patience, and spiritual depth under Shani\'s contemplative influence.',
    'Vivid colour and rarity create strong jewellery impact at lower cost than Kashmir Neelam.',
    'Trichroic nature fascinates collectors and gem enthusiasts.',
  ],
  types: [
    'AAA tanzanite shows deep saturated blue. Lighter stones are more affordable. Carat sizes above 5 ct are relatively rare.',
    'No synthetic commercial competition yet, but simulants include blue glass and treated iolite.',
    'Rough is heat-treated — natural blue rough is essentially unavailable.',
  ],
  qualityPrice: [
    'Colour saturation and size escalate price rapidly. Eye-clean 3+ ct gems are strong mid-range purchases.',
    'Single-source supply means prices fluctuate with Tanzanian mining policy.',
  ],
  qualityTable: [
    ['Colour', 'Deep violetish blue face-up'],
    ['Clarity', 'Eye-clean preferred'],
    ['Cut', 'Orientation maximizes blue face-up'],
    ['Treatment', 'Heat standard — disclose'],
  ],
  jewellery: [
    'Tanzanite suits protected white-metal rings and pendants. Avoid tension settings and daily hard wear.',
    'Earrings are ideal for showcasing colour with less risk.',
  ],
  care: [
    'Avoid ultrasonic and sudden temperature changes. Clean gently with soap and water.',
    'Tanzanite cleaves — protect from sharp impacts.',
  ],
  beware: [
    'Blue glass and cobalt-coated stones imitate tanzanite. Forgia and coated topaz are common scams.',
    'Assume heat treatment — "unheated tanzanite" claims are almost always false.',
  ],
  faqs: [
    { question: 'Is Tanzanite a real Shani stone?', answer: 'It is a modern commercial upratna mapping, not ancient Sanskrit classical text. Many contemporary Jyotish practitioners accept it for Shani when Neelam is unsuitable — confirm with your astrologer.' },
    { question: 'Is all Tanzanite heat-treated?', answer: 'Yes, essentially all market tanzanite is heated from brown zoisite. Disclose and seek astrological acceptance.' },
    { question: 'Tanzanite vs Iolite for Shani?', answer: 'Both are blue-violet upratnas. Iolite has older folk usage (Neeli); tanzanite is newer. Classical preference varies — astrologer decides.' },
    { question: 'Can Tanzanite be worn daily?', answer: 'Possible in protected rings, but hardness 6–7 and cleavage make earrings and occasional-wear rings safer.' },
    { question: 'Will Tanzanite run out?', answer: 'Tanzanian deposits are finite — long-term supply concerns exist, but current market availability is adequate for buyers.' },
    { question: 'What finger for Tanzanite?', answer: 'Middle finger on Saturday in silver is standard Shani protocol for blue upratnas unless your chart specifies otherwise.' },
  ],
});

const BLUE_TOPAZ = defineUpratna({
  slug: 'blue-topaz',
  name: 'Blue Topaz',
  hindi: 'Neela Topaz',
  planet: 'Saturn (Shani)',
  substitute: 'Blue Sapphire (Neelam)',
  intro:
    'Blue Topaz offers a bright, affordable Shani upratna with excellent clarity — a practical Neelam alternative when deep blue corundum is out of reach.',
  heroBenefits: ['Vivid sky to London blue', 'Eye-clean at low cost', 'Hard and durable', 'Popular Saturn upratna'],
  seoDescription: `Shop natural Blue Topaz at ${BRAND}. A Saturn upratna substitute for Blue Sapphire with treatment disclosure, certification, and Vedic expert guidance.`,
  about: [
    'Topaz is aluminium fluorosilicate — Al₂SiO₄(F,OH)₂ — with Mohs hardness 8. Natural blue topaz is rare; most blue is irradiated and heat-treated from colourless or sherry rough.',
    'Neela Topaz is sold widely in Indian astrological markets as a Shani upratna. Disclosure of irradiation is essential for ethical sale and Jyotish acceptance. ' + ASTRO_DISCLAIMER,
    'Brazil, Sri Lanka, and Nigeria produce topaz rough; cutting hubs in Thailand and India supply finished gems.',
  ],
  aboutTable: [
    ['Mineral family', 'Topaz (nesosilicate)'],
    ['Typical colour', 'Sky blue, Swiss blue, London blue'],
    ['Mohs hardness', '8'],
    ['Vedic association', 'Saturn (Shani) — upratna for Neelam'],
  ],
  howToWear: [
    'Wear on Saturday on the middle finger in silver or iron-rich Panchdhatu. Purify and chant Shani mantra 108 times.',
    'London blue is darkest; sky blue is lightest. Astrologers may prefer deeper tones for Shani symbolism.',
    'Confirm astrological acceptance of irradiated gems before purchase.',
  ],
  whoShouldWear: [
    'Chosen when Saturn remedies are indicated but budget constraints rule out Neelam. Suitable for steady, long-term Shani support in supportive charts.',
    'Not a casual purchase during extreme Shani afflictions without expert supervision — upratnas still carry graha energy.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Supports focus, accountability, and patience associations of Shani at accessible price points.',
    'Hardness 8 suits daily rings better than softer upratnas like Lapis or Turquoise.',
    'Large flawless gems enable impressive rings without five-figure corundum budgets.',
  ],
  types: [
    'Sky, Swiss, and London blue are irradiation colour grades. Natural blue topaz from Texas exists but is pale.',
    'Topaz is not quartz — beware "blue topaz" labels on glass.',
    'Mystic topaz has thin film coating — avoid for Jyotish.',
  ],
  qualityPrice: [
    'London blue costs more than sky blue. Price per carat remains modest versus sapphire.',
    'Demand full treatment disclosure and radiation safety compliance from reputable labs.',
  ],
  qualityTable: [
    ['Colour grade', 'London > Swiss > Sky depth'],
    ['Clarity', 'Eye-clean abundant'],
    ['Treatment', 'Irradiation + heat standard — disclose'],
    ['Coating', 'Uncoated only for remedial use'],
  ],
  jewellery: [
    'Blue topaz excels in silver Shani rings, statement earrings, and cocktail rings.',
    'Prong settings work due to hardness — still inspect prongs yearly.',
  ],
  care: [
    'Avoid steam on irradiated stones if unsure of stability — warm soapy water is safe. Coated mystic topaz scratches easily.',
    'Topaz has perfect cleavage — protect from sharp blows along facet edges.',
  ],
  beware: [
    'Coated and mystic topaz sold without disclosure. Glass and aquamarine passed off as topaz.',
    'Irradiated material must come from licensed treatment facilities — ask for documentation.',
  ],
  faqs: [
    { question: 'Is irradiated Blue Topaz safe?', answer: 'Licensed irradiation followed by cooling periods meets international safety standards. Buy from reputable dealers with treatment disclosure.' },
    { question: 'Blue Topaz vs Blue Sapphire?', answer: 'Sapphire is primary Shani ratna. Blue topaz is an upratna — brighter, lighter, and far less expensive. Astrologer confirms suitability.' },
    { question: 'Which blue shade for Shani?', answer: 'Many prefer London or Swiss blue for deeper Shani symbolism. Your astrologer may specify.' },
    { question: 'Can Blue Topaz fade?', answer: 'Properly treated blue topaz colour is stable. Avoid prolonged extreme heat. Coated stones can scratch and fade.' },
    { question: 'Topaz on ring finger?', answer: 'Middle finger is standard for Shani. Ring finger is solar — do not confuse planetary fingers.' },
    { question: 'Natural blue Topaz exists?', answer: 'Rare pale natural blue from Texas and elsewhere. Nearly all jewellery blue topaz is treated — disclose honestly.' },
  ],
});

const WHITE_TOPAZ = defineUpratna({
  slug: 'white-topaz',
  name: 'White Topaz',
  hindi: 'Safed Topaz',
  planet: 'Venus (Shukra)',
  substitute: 'Diamond (Heera) / White Sapphire',
  intro:
    'White Topaz is a brilliant colourless topaz used as an economical Shukra upratna when Diamond or White Sapphire is not prescribed or affordable.',
  heroBenefits: ['Diamond-like brilliance', 'Affordable Venus upratna', 'Hardness 8', 'Large sizes available'],
  seoDescription: `Buy natural White Topaz at ${BRAND}. A Venus upratna substitute for Diamond with lab reports, treatment transparency, and Jyotish consultation.`,
  about: [
    'White topaz is colourless topaz — Al₂SiO₄(F,OH)₂ — with RI ~1.629–1.637 and hardness 8. It offers high brilliance when well-cut, though dispersion is lower than diamond.',
    'Safed Topaz is marketed in India as a Shukra upratna for marriage, luxury, and arts when Heera is not worn. ' + ASTRO_DISCLAIMER,
    'Brazil and Sri Lanka yield large clean crystals ideal for faceted gems.',
  ],
  aboutTable: [
    ['Mineral family', 'Topaz (nesosilicate)'],
    ['Typical colour', 'Colourless to near-white'],
    ['Mohs hardness', '8'],
    ['Vedic association', 'Venus (Shukra) — upratna for Heera'],
  ],
  howToWear: [
    'Wear on Friday on middle or ring finger in silver, white gold, or platinum. Chant Shukra mantra after milk purification.',
    'Choose well-cut stones with minimal windowing — cut quality determines brilliance more than inclusions.',
    'Do not pair with Diamond without astrological approval.',
  ],
  whoShouldWear: [
    'Explored when Venus needs support for relationships, comfort, and creativity without primary Heera budget.',
    'May suit students and young professionals beginning Shukra remedies under guidance.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Delivers bright white jewellery aesthetics and Shukra symbolism at fraction of diamond cost.',
    'Hard enough for daily rings with reasonable care.',
    'Large carat sizes enable impressive engagement-style mounts as upratna jewellery.',
  ],
  types: [
    'Colourless topaz may receive radiation to remove yellow tint — disclose. Coated "mystic" topaz is not for Jyotish.',
    'Cubic zirconia (CZ) is often confused by consumers — topaz is natural with different properties.',
    'Scissor and round brilliant cuts maximize white flash.',
  ],
  qualityPrice: [
    'Extremely affordable versus diamond or white sapphire. Price rises with size and cut precision.',
    'Loupe-clean large gems are common — prioritize cut over flawless clarity obsession.',
  ],
  qualityTable: [
    ['Cut', 'Excellent symmetry for brilliance'],
    ['Clarity', 'Eye-clean standard'],
    ['Treatment', 'Disclose any irradiation or coating'],
    ['Comparison', 'Not diamond — lower dispersion and density'],
  ],
  jewellery: [
    'White topaz suits solitaire rings, halo pendants, and stud earrings as Shukra jewellery.',
    'Popular starter Venus ring for first-time gemstone wearers under astrological advice.',
  ],
  care: [
    'Clean with soap and water. Avoid coatings and harsh abrasives.',
    'Mind cleavage planes — remove during heavy manual work.',
  ],
  beware: [
    'CZ and glass sold as "white topaz." Mystic and coated stones must be disclosed.',
    'Do not represent white topaz as diamond — RI and SG differ under testing.',
  ],
  faqs: [
    { question: 'White Topaz vs Diamond?', answer: 'Diamond is primary Shukra ratna with superior hardness and dispersion. White topaz is a budget upratna — beautiful but gemologically distinct.' },
    { question: 'White Topaz vs White Sapphire?', answer: 'White sapphire is corundum (hardness 9) and closer classical upratna. Topaz is less costly with good brilliance when well-cut.' },
    { question: 'Which finger on Friday?', answer: 'Middle or ring finger per tradition for Shukra — confirm with your astrologer based on lagna.' },
    { question: 'Does White Topaz cloud over time?', answer: 'Quality stones remain clear. Surface abrasion can dull polish — periodic professional repolish helps.' },
    { question: 'Is White Topaz natural?', answer: 'Yes — colourless natural topaz exists. Some may be lightly treated to improve whiteness; disclose treatments.' },
    { question: 'Good for engagement rings?', answer: 'As fashion jewellery yes; as Jyotish upratna only if Venus remedy is chart-approved. Hardness 8 is workable with care.' },
  ],
});

const ZIRCON = defineUpratna({
  slug: 'zircon',
  name: 'Zircon',
  hindi: 'Jarkan',
  planet: 'Venus (Shukra)',
  substitute: 'Diamond (Heera)',
  intro:
    'Natural Zircon — Jarkan — is a brilliant fire-filled gem historically confused with Diamond, prized today as a high-dispersion Shukra upratna.',
  heroBenefits: ['Exceptional brilliance', 'Strong Venus upratna', 'Natural gem only', 'Closer optical match to Diamond'],
  seoDescription: `Buy natural Zircon (Jarkan) at ${BRAND}. A Venus upratna substitute for Diamond with lab certification, treatment disclosure, and expert Jyotish guidance.`,
  about: [
    'Zircon is zirconium silicate — ZrSiO₄ — with Mohs hardness 6–7.5 and very high dispersion (fire). Not to be confused with cubic zirconia (CZ), which is synthetic.',
    'Jarkan has long served as a Diamond stand-in in Indian jewellery and Jyotish as a Shukra upratna. Colourless and blue zircons are popular; some heat-treated blue exists. ' + ASTRO_DISCLAIMER,
    'Sri Lanka, Cambodia, Myanmar, and Australia supply zircon. Metamict zircon may be lower RI due to radiation damage in the crystal lattice.',
  ],
  aboutTable: [
    ['Mineral family', 'Zircon (nesosilicate)'],
    ['Typical colours', 'Colourless, blue, brown, green'],
    ['Mohs hardness', '6–7.5'],
    ['Vedic association', 'Venus (Shukra) — upratna for Heera'],
  ],
  howToWear: [
    'Wear on Friday during Shukra Hora on middle or ring finger in silver or white gold. Chant Shukra mantra after purification.',
    'Colourless zircon mimics diamond aesthetics; some astrologers prefer it over white topaz for Shukra due to higher brilliance.',
    'Heat-treated blue zircon requires disclosure — confirm Jyotish acceptance.',
  ],
  whoShouldWear: [
    'Considered when Venus remedies are needed with strong visual impact approaching diamond flash without Navaratna budget.',
    'May suit marriage, arts, and luxury karma when Shukra is benefic — chart analysis required.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'High dispersion creates rainbow fire prized in Shukra jewellery.',
    'Natural zircon is geologically distinct from CZ — important for remedial authenticity.',
    'Blue zircon offers an alternative hue for Venus-themed designs.',
  ],
  types: [
    'Colourless and blue are top for Shukra. Brown zircon is often heat-treated to blue or colourless.',
    'Cubic zirconia (CZ) is NOT zircon — verify with RI ~1.81–1.98 for zircon versus ~2.15 for CZ.',
    'Hyacinth is historical name for orange-brown zircon.',
  ],
  qualityPrice: [
    'Clean colourless zircon with strong fire commands premium among upratnas. Blue heat-treated gems are mid-range.',
    'Brittleness near facet edges requires protected settings despite fair hardness.',
  ],
  qualityTable: [
    ['Brilliance', 'Strong fire and luster'],
    ['Clarity', 'Eye-clean preferred'],
    ['Treatment', 'Disclose heat for blue/white'],
    ['Identity', 'Natural zircon, not CZ'],
  ],
  jewellery: [
    'Zircon suits solitaire Shukra rings and pendant halos. Protective prongs or bezels recommended due to brittleness.',
    'Earrings showcase fire with less abrasion risk.',
  ],
  care: [
    'Avoid ultrasonic if fractured. Clean gently; zircon abrades along facet junctions over time.',
    'Store separately — zircon can scratch softer gems and be scratched by sapphire/diamond.',
  ],
  beware: [
    'Cubic zirconia marketed as "zircon" is fraudulent for Jyotish. Always gem-test.',
    'Heavily included zircon may be unstable — buy from certified sellers.',
  ],
  faqs: [
    { question: 'Zircon vs Cubic Zirconia?', answer: 'Completely different materials. Zircon is natural zirconium silicate; CZ is synthetic cubic zirconia. Only natural zircon qualifies as Jyotish upratna.' },
    { question: 'Is blue Zircon natural?', answer: 'Most blue zircon is heat-treated from brown rough — standard in trade. Disclose and confirm astrological acceptance.' },
    { question: 'Zircon vs White Sapphire for Shukra?', answer: 'Both are Venus upratnas. Zircon has higher fire; sapphire has greater hardness and classical corundum pedigree.' },
    { question: 'Why is Zircon brittle?', answer: 'Crystal structure and facet edges can chip despite hardness — choose protected ring settings or pendants.' },
    { question: 'Friday wear protocol?', answer: 'Friday Shukra Hora, mantra, milk purification, white metals — per your astrologer\'s specifics.' },
    { question: 'What is Jarkan?', answer: 'Hindi trade name for natural zircon, historically used in place of diamond in Indian jewellery bazaars.' },
  ],
});

const IOLITE = defineUpratna({
  slug: 'iolite',
  name: 'Iolite',
  hindi: 'Neeli / Kakaneeli',
  planet: 'Saturn (Shani)',
  substitute: 'Blue Sapphire (Neelam)',
  intro:
    'Iolite — Neeli or Kakaneeli — is a violet-blue cordierite with strong pleochroism, among the oldest recognized Shani upratnas in Indian gem lore.',
  heroBenefits: ['Classical Neeli upratna', 'Distinctive violet-blue', 'Lightweight for size', 'Budget Shani alternative'],
  seoDescription: `Shop natural Iolite (Neeli) at ${BRAND}. A traditional Saturn upratna for Blue Sapphire with certification, origin notes, and Jyotish expert support.`,
  about: [
    'Iolite is magnesium iron aluminium cyclosilicate — (Mg,Fe)₂Al₄Si₅O₁₈ — with Mohs hardness 7–7.5. Strong trichroism shows blue, violet, and yellowish axes.',
    'Neeli appears in traditional Jyotish lists alongside Amethyst and Lapis as a Shani upratna when Neelam is contraindicated or unaffordable. ' + ASTRO_DISCLAIMER,
    'India (Bihar, Rajasthan), Sri Lanka, Madagascar, and Tanzania produce iolite. Indian "Neeli" heritage gives it cultural weight in North India.',
  ],
  aboutTable: [
    ['Mineral family', 'Cordierite (cyclosilicate)'],
    ['Typical colour', 'Violet-blue to blue'],
    ['Mohs hardness', '7–7.5'],
    ['Vedic association', 'Saturn (Shani) — Neeli upratna'],
  ],
  howToWear: [
    'Wear on Saturday on middle finger in silver or Panchdhatu during Shani Hora. Chant Shani mantra 108 times.',
    'Cut orientation should maximize blue face-up — pleochroic yellow axis reduces desirability if visible table-up.',
    'Do not combine with Blue Sapphire without expert approval.',
  ],
  whoShouldWear: [
    'Prescribed when Shani remedies are needed with violet-blue tone and traditional Neeli authenticity matters to the practitioner.',
    'May suit disciplined professions and spiritual aspirants during supportive Saturn periods.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Linked with patience, detachment, karmic accountability, and meditative focus under Shani.',
    'Lighter specific gravity allows large-looking gems at lower weight — useful for carat-target remedies.',
    'Indian Neeli carries traditional credibility among older Jyotish lineages.',
  ],
  types: [
    'Indian Neeli from gem gravels is historically referenced. Sri Lankan cordierite is clean and faceting-friendly.',
    'Do not confuse with blue sapphire or tanzanite — different chemistry and RI ~1.542–1.551.',
    'Water sapphire is folk name for iolite — not actual sapphire.',
  ],
  qualityPrice: [
    'Saturated blue-violet with minimal windowing is top grade. Iolite remains very affordable versus Neelam.',
    'Pleochroism management in cutting affects beauty significantly.',
  ],
  qualityTable: [
    ['Face-up colour', 'Violet-blue without brown or yellow table'],
    ['Pleochroism', 'Skilled cut minimizes yellow axis'],
    ['Clarity', 'Eye-clean to lightly included'],
    ['Origin', 'Indian Neeli valued in tradition'],
  ],
  jewellery: [
    'Silver Shani rings and pendants are standard. Iolite suits understated Vedic jewellery aesthetics.',
    'Avoid thin girdles — iolite can chip if poorly cut.',
  ],
  care: [
    'Moderate hardness supports daily wear with care. Clean with warm soapy water.',
    'Avoid hard knocks on exposed facet corners.',
  ],
  beware: [
    '"Water sapphire" marketing on iolite misleads buyers about corundum status.',
    'Tanzanite and blue spinel passed off as Neeli — test RI and spectrum.',
  ],
  faqs: [
    { question: 'What is Neeli in astrology?', answer: 'Neeli (Kakaneeli) is traditional Hindi for Iolite — a classical Shani upratna in many North Indian Jyotish references.' },
    { question: 'Iolite vs Amethyst for Shani?', answer: 'Both are Shani upratnas. Iolite is blue-violet cordierite; amethyst is purple quartz. Your astrologer may prefer one based on chart and lineage.' },
    { question: 'Is Iolite the same as Sapphire?', answer: 'No — "water sapphire" is a misnomer. Sapphire is corundum; iolite is cordierite with different properties and lower price.' },
    { question: 'Why does Iolite look different from angles?', answer: 'Strong pleochroism — trichroic colours vary with viewing direction. Skilled cutting maximizes blue face-up.' },
    { question: 'Saturday wear details?', answer: 'Middle finger, silver, Shani Hora, Shani mantra — standard protocol unless your chart specifies otherwise.' },
    { question: 'Indian Neeli still available?', answer: 'Yes — Indian and Sri Lankan sources supply market. Authenticate natural cordierite via gem testing.' },
  ],
});

const TOURMALINE = defineUpratna({
  slug: 'tourmaline',
  name: 'Tourmaline',
  hindi: 'Turmali',
  planet: null,
  substitute: 'Varies by colour (Emerald, Ruby, etc.)',
  intro:
    'Tourmaline is a borosilicate mineral supergroup spanning virtually every colour — each hue maps to different grahas in Jyotish, making expert selection essential.',
  heroBenefits: ['Widest colour range', 'Colour-specific graha mapping', 'Excellent durability', 'Collector favourite'],
  seoDescription: `Buy natural Tourmaline at ${BRAND}. Colour-specific Vedic upratna options with certification, graha guidance consultation, and worldwide delivery.`,
  about: [
    'Tourmaline is a complex borosilicate — (Na,Ca)(Li,Mg,Fe,Al)₃Al₆(BO₃)₃Si₆O₁₈(OH,F)₄ — with Mohs hardness 7–7.5. Chrome green, rubellite pink, indicolite blue, and watermelon varieties are gem staples.',
    'Unlike single-colour upratnas, tourmaline\'s graha depends on colour: green for Budh (Emerald substitute), pink/red for Shukra or Surya, blue for Shani discussions. There is no one-planet tourmaline. ' + ASTRO_DISCLAIMER,
    'Brazil, Afghanistan, Mozambique, Nigeria, and Sri Lanka produce exceptional crystals.',
  ],
  aboutTable: [
    ['Mineral family', 'Tourmaline (borosilicate)'],
    ['Colours', 'Green, pink, blue, watermelon, etc.'],
    ['Mohs hardness', '7–7.5'],
    ['Vedic association', 'Colour-dependent — consult astrologer'],
  ],
  howToWear: [
    'Wear day, finger, and metal according to the colour\'s mapped graha — green on Wednesday little finger for Budh, pink on Friday for Shukra, etc.',
    'Specify your intended graha to the seller so the correct tourmaline variety is selected — buying "any tourmaline" is astrologically meaningless.',
    'Purification and mantra match the ruling planet of the chosen colour, not tourmaline generically.',
  ],
  whoShouldWear: [
    'Only after an astrologer identifies which graha and therefore which tourmaline colour you need. Green tourmaline is NOT interchangeable with pink tourmaline remedially.',
    'Collectors may buy bi-colour watermelon tourmaline for jewellery without graha intent — separate from Jyotish prescription.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Colour-matched tourmaline delivers targeted planetary support with excellent brilliance and durability.',
    'Afghan indicolite and Brazilian paraiba (copper-bearing) are world-class — paraiba is collector priced.',
    'Tourmaline is pyroelectric — historically fascinated gemologists; no impact on Jyotish efficacy.',
  ],
  types: [
    'Chrome tourmaline (green) for Budh. Rubellite (pink-red) for Shukra. Indicolite (blue) sometimes for Shani discussions.',
    'Watermelon tourmaline is bi-colour decorative — not a standard single-graha remedy.',
    'Irradiated tourmaline exists — disclose.',
  ],
  qualityPrice: [
    'Paraiba and fine rubellite command highest prices. Afghan green chrome tourmaline is strong for Mercury upratna budgets.',
    'Price varies enormously by species, colour, and origin — specify colour when comparing quotes.',
  ],
  qualityTable: [
    ['Colour match', 'Must align with prescribed graha'],
    ['Saturation', 'Vivid clean hues premium'],
    ['Treatment', 'Disclose irradiation or oil'],
    ['Variety', 'Chrome green ≠ rubellite ≠ indicolite'],
  ],
  jewellery: [
    'Tourmaline suits all jewellery categories — rings, pendants, earrings — with colour-appropriate metal per graha.',
    `${BRAND} can help match tourmaline variety to your astrologer\'s prescription.`,
  ],
  care: [
    'Generally durable — warm soapy water cleaning. Avoid extreme heat on included stones.',
    'Some tourmaline is oil-treated — disclose before ultrasonic cleaning.',
  ],
  beware: [
    'Buying pink tourmaline when green is prescribed (or vice versa) defeats remedial purpose.',
    'Glass and synthetic spinel imitations exist in cheap markets.',
  ],
  faqs: [
    { question: 'Which Tourmaline for which planet?', answer: 'Green chrome tourmaline → Mercury (Budh). Pink rubellite → Venus (Shukra). Blue indicolite → sometimes Saturn. Red may map to Sun/Mars in folk practice. Always confirm with your astrologer.' },
    { question: 'Is Tourmaline one graha stone?', answer: 'No — colour determines graha. There is no universal tourmaline planet mapping.' },
    { question: 'Watermelon Tourmaline for Jyotish?', answer: 'Bi-colour stones are primarily decorative. Single-colour gems matching the prescribed graha are preferred for remedies.' },
    { question: 'Tourmaline vs Emerald?', answer: 'Chrome green tourmaline can serve as a Budh upratna; emerald is primary Panna. Different minerals and price points.' },
    { question: 'What is Paraiba Tourmaline?', answer: 'Copper-bearing neon blue-green tourmaline from Brazil/Mozambique — collector gem, not a classical upratna category.' },
    { question: 'How to order correctly?', answer: 'Share your astrologer\'s colour and graha prescription with the seller. Buy the specific tourmaline variety, not generic mixed parcels.' },
  ],
});

const DIOPSIDE = defineUpratna({
  slug: 'diopside',
  name: 'Diopside',
  hindi: 'Diopside',
  planet: 'Mercury (Budh)',
  substitute: 'Emerald (Panna)',
  intro:
    'Chrome Diopside is an intense green pyroxene increasingly used as a Mercury upratna when Emerald quality at target weight is financially out of reach.',
  heroBenefits: ['Rich chrome green', 'Affordable Budh upratna', 'Natural vivid colour', 'Distinct from tourmaline'],
  seoDescription: `Shop natural Chrome Diopside at ${BRAND}. A Mercury upratna substitute for Emerald with lab certification, origin disclosure, and Jyotish consultation.`,
  about: [
    'Diopside is calcium magnesium silicate — CaMgSi₂O₆ — with chrome-rich varieties showing emerald-like green from chromium. Mohs hardness 5.5–6.5.',
    'Russian chrome diopside from the Ural region popularized the gem in the 1980s. Jyotish retailers list it as a Budh upratna alongside Peridot when Panna is not worn. ' + ASTRO_DISCLAIMER,
    'Also found in Pakistan, Myanmar, and Italy (violane blue variety — different mapping).',
  ],
  aboutTable: [
    ['Mineral family', 'Pyroxene (inosilicate)'],
    ['Key variety', 'Chrome diopside (green)'],
    ['Mohs hardness', '5.5–6.5'],
    ['Vedic association', 'Mercury (Budh) — upratna for Panna'],
  ],
  howToWear: [
    'Wear on Wednesday on little finger in gold or Panchdhatu during Budh Hora. Chant Budh mantra after purification.',
    'Choose saturated chrome green with good transparency. Protective bezel settings recommended due to moderate hardness.',
    'Do not wear with primary Emerald without astrological clearance.',
  ],
  whoShouldWear: [
    'Explored when Mercury needs green gem support at lower cost than emerald. Suitable for students, traders, and communicators if Budh is benefic.',
    'Moderate hardness favors pendants or occasional-wear rings over harsh daily ring wear.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Delivers emerald-like green from natural chromium without emerald\'s fracture-filling concerns.',
    'Affordable in 1–3 ct faceted sizes for practical upratna weights.',
    'Distinct gemological identity — not confused with glass when tested.',
  ],
  types: [
    'Chrome diopside is the Jyotish-relevant green. Star diopside and violane (blue) are other varieties with different uses.',
    'Black star diopside is sometimes sold as spiritual protection — separate from Budh mapping.',
    'Small sizes dominate — large clean chrome diopside is rare.',
  ],
  qualityPrice: [
    'Intense green saturation and clarity drive price. Most gems are under 2 ct; larger stones jump in price.',
    'Russian origin historically benchmarked; Pakistani material increasingly available.',
  ],
  qualityTable: [
    ['Colour', 'Chrome green, minimal yellow or grey'],
    ['Clarity', 'Eye-clean rare above 2 ct'],
    ['Size', 'Over 3 ct very scarce'],
    ['Cut', 'Deep cuts hold colour in small sizes'],
  ],
  jewellery: [
    'Bezel-set gold rings and pendants protect diopside. Earrings offer colour with less risk.',
    'Pair with Peridot only if astrologer approves multiple Budh upratnas.',
  ],
  care: [
    'Avoid ultrasonic and heat. Clean gently — diopside abrades and chips more easily than beryl.',
    'Remove before sports and gardening.',
  ],
  beware: [
    'Glass and garnet imitations possible. "Russian emerald" mislabels on diopside — it is not beryl.',
    'Do not confuse chrome diopside with chrome tourmaline — both green, different minerals and testing.',
  ],
  faqs: [
    { question: 'Diopside vs Emerald?', answer: 'Emerald is beryl and primary Budh ratna. Chrome diopside is pyroxene upratna — greener brilliance at lower cost, less hardness.' },
    { question: 'Why small Diopside gems?', answer: 'Crystal habit yields small clean rough — large chrome diopside is geologically rare.' },
    { question: 'Is Russian Diopside best?', answer: 'Russian material set colour standards, but any vivid natural chrome diopside may work per astrologer.' },
    { question: 'Wednesday wear rules?', answer: 'Little finger, gold, Budh Hora, Budh mantra — standard Mercury protocol.' },
    { question: 'Diopside vs Peridot for Budh?', answer: 'Both are green upratnas. Peridot is olivine (yellow-green); diopside is chromium green (emerald-like). Astrologer chooses.' },
    { question: 'Daily ring safe?', answer: 'Moderate risk — hardness 5.5–6.5. Bezel mounts and occasional wear extend life; pendants are safer.' },
  ],
});

const KYANITE = defineUpratna({
  slug: 'kyanite',
  name: 'Kyanite',
  hindi: 'Kyanite',
  planet: 'Saturn (Shani)',
  substitute: 'Blue Sapphire (Neelam)',
  intro:
    'Kyanite is a blue aluminium silicate with dramatic pleochroism, occasionally prescribed as a Shani upratna for its deep sapphire-like colour in fine specimens.',
  heroBenefits: ['Deep blue colour potential', 'No heat treatment typical', 'Distinctive crystal habit', 'Budget blue upratna'],
  seoDescription: `Buy natural Kyanite at ${BRAND}. A Saturn-aligned upratna alternative with certification, Jyotish consultation, and transparent gemological disclosure.`,
  about: [
    'Kyanite is aluminium silicate — Al₂SiO₅ — with variable hardness 4.5–7 along different crystal axes (unique among gems). Colour ranges blue, green, black, and orange.',
    'Blue kyanite is sold in some Jyotish circles as a Shani upratna when Neelam is not used. It is softer and more fragile than corundum — practical wear considerations matter. ' + ASTRO_DISCLAIMER,
    'Nepal, Brazil, Kenya, Switzerland, and India produce kyanite. Nepal blue blades are famous for colour.',
  ],
  aboutTable: [
    ['Mineral family', 'Kyanite (nesosilicate)'],
    ['Typical colour', 'Blue to blue-green'],
    ['Mohs hardness', '4.5–7 (directional)'],
    ['Vedic association', 'Saturn (Shani) — folk upratna'],
  ],
  howToWear: [
    'If prescribed, wear on Saturday on middle finger in silver as pendant or protected ring. Shani mantra and purification apply.',
    'Pendants strongly preferred — directional hardness makes rings high-maintenance.',
    'Select stones cut across crystal for best durability in jewellery.',
  ],
  whoShouldWear: [
    'Considered when Shani support is needed with blue colour and the native accepts pendant-focused wear.',
    'Not ideal for active lifestyles requiring daily hard-wear rings.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with alignment, truthful communication, and meditative calm in crystal healing traditions overlapping Shani themes.',
    'Natural blue colour without heat treatment appeals to purists.',
    'Affordable large cabochons and blades for talismanic use.',
  ],
  types: [
    'Blue Nepal kyanite blades for collectors. Faceted gems are challenging due to cleavage.',
    'Black kyanite fans are decorative — different from blue Shani discussion.',
    'Andalusite and sillimanite are polymorphs — do not confuse.',
  ],
  qualityPrice: [
    'Transparent faceted blue kyanite is rare and valuable. Cabochons and beads are economical.',
    'Even colour without white streaks improves value.',
  ],
  qualityTable: [
    ['Colour', 'Saturated blue'],
    ['Durability', 'Faceted gems need protected settings'],
    ['Treatment', 'Typically untreated'],
    ['Cut orientation', 'Across crystal axis for strength'],
  ],
  jewellery: [
    'Pendants and earring drops suit kyanite best. Drill beads for mala are common in spiritual shops.',
    'Avoid unprotected daily rings.',
  ],
  care: [
    'Extremely cleavage-prone — no ultrasonic, no impact. Store padded.',
    'Wrap individually — kyanite scratches and chips easily.',
  ],
  beware: [
    'Misrepresented as blue sapphire — RI ~1.71–1.73 differs from corundum.',
    'Fragile for ring wear — sellers should warn about durability.',
  ],
  faqs: [
    { question: 'Is Kyanite good for Shani rings?', answer: 'Pendants are strongly preferred. Directional hardness and cleavage make rings risky for daily wear.' },
    { question: 'Kyanite vs Blue Sapphire?', answer: 'Sapphire is corundum (hardness 9) and primary Neelam. Kyanite is softer aluminium silicate folk upratna.' },
    { question: 'Is Kyanite treated?', answer: 'Usually untreated — a selling point. Still verify with lab report for significant purchases.' },
    { question: 'What is black Kyanite?', answer: 'Decorative bladed crystals — not the standard blue Shani upratna discussion.' },
    { question: 'Nepal Kyanite special?', answer: 'Nepal produces vivid blue blades prized by collectors; faceted gems from any origin work if colour and durability suit jewellery.' },
    { question: 'Saturday protocol?', answer: 'Same Shani guidelines — middle finger or pendant, silver, mantra — if your astrologer prescribes kyanite.' },
  ],
});

const SUNSTONE = defineUpratna({
  slug: 'sunstone',
  name: 'Sunstone',
  hindi: 'Sunstone',
  planet: 'Sun (Surya)',
  substitute: 'Ruby (Manik)',
  intro:
    'Sunstone is a feldspar with aventurescent copper or hematite platelets, worn as a solar upratna for vitality, confidence, and leadership when Ruby is not used.',
  heroBenefits: ['Aventurescent sparkle', 'Surya-aligned upratna', 'Warm orange-red tones', 'Lightweight pendants'],
  seoDescription: `Shop natural Sunstone at ${BRAND}. A Sun upratna substitute for Ruby with certified quality, origin notes, and expert Vedic consultation.`,
  about: [
    'Sunstone is oligoclase or labradorite feldspar with included copper (Oregon) or hematite/goethite platelets creating schiller. Hardness ~6–6.5.',
    'Oregon sunstone with copper schiller is most famous. Jyotish retailers map orange sunstone to Surya as a Manik upratna for confidence and authority. ' + ASTRO_DISCLAIMER,
    'India, Norway, and Tanzania also produce sunstone. Colourless to yellow, orange, red, and green varieties exist.',
  ],
  aboutTable: [
    ['Mineral family', 'Feldspar'],
    ['Key phenomenon', 'Aventurescence (schiller)'],
    ['Mohs hardness', '~6–6.5'],
    ['Vedic association', 'Sun (Surya) — upratna for Manik'],
  ],
  howToWear: [
    'Wear on Sunday during Surya Hora on ring finger in gold or copper-rich metal. Chant Surya mantra 108 times after red flower offering.',
    'Orange-red stones with visible schiller are preferred for solar symbolism.',
    'Do not wear with primary Ruby without astrological approval.',
  ],
  whoShouldWear: [
    'Explored when Sun needs strengthening for leadership, vitality, father karma, and public recognition — if Surya is functional benefic.',
    'Leo ascendants and government professionals may discuss Surya remedies with astrologers.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with warmth, optimism, personal power, and charisma under Surya.',
    'Schiller provides unique visual energy compared to opaque red upratnas.',
    'Oregon copper sunstone is collector-grade with transparent red-green hues.',
  ],
  types: [
    'Oregon copper sunstone is premium. Indian and African material may be paler or opaque.',
    'Goldstone is man-made glass with copper flecks — NOT natural sunstone.',
    'Moonstone and sunstone are both feldspars — different phenomena and grahas.',
  ],
  qualityPrice: [
    'Copper schiller intensity, transparency, and colour drive Oregon prices. Common opaque sunstone is inexpensive.',
    'For Jyotish, vivid orange-red with visible sparkle is ideal.',
  ],
  qualityTable: [
    ['Schiller', 'Visible copper/hematite flash'],
    ['Colour', 'Orange to red-orange'],
    ['Transparency', 'Transparent Oregon premium'],
    ['Authenticity', 'Natural feldspar, not goldstone glass'],
  ],
  jewellery: [
    'Gold ring finger mounts and sun-themed pendants. Beaded bracelets for Sunday-only wear.',
    'Oregon sunstone suits high-end Vedic jewellery when budget allows.',
  ],
  care: [
    'Moderate hardness — avoid knocks. Clean with mild soap and water.',
    'Copper inclusions stable under normal wear.',
  ],
  beware: [
    'Goldstone (aventurine glass) sold as sunstone. Verify natural feldspar with gem testing.',
    'Do not confuse with yellow sapphire (Guru) — colour overlap does not mean same graha.',
  ],
  faqs: [
    { question: 'Sunstone vs Ruby for Surya?', answer: 'Ruby is primary Manik ratna. Sunstone is milder feldspar upratna — chart determines if sufficient.' },
    { question: 'What is Goldstone?', answer: 'Man-made glass — not valid for Jyotish. Always buy certified natural sunstone.' },
    { question: 'Oregon Sunstone worth premium?', answer: 'For jewellery beauty yes. For Jyotish, any natural orange-red sunstone with solar symbolism may suffice per astrologer.' },
    { question: 'Sunday wear details?', answer: 'Ring finger, gold, sunrise Surya Hora, Surya mantra, red flowers — classic protocol.' },
    { question: 'Sunstone vs Citrine?', answer: 'Citrine maps to Jupiter (Guru); sunstone to Sun (Surya). Different grahas — never interchange without astrologer.' },
    { question: 'Can women wear Sunstone?', answer: 'Yes — Surya remedies are not gender-restricted. Metal, finger, and weight follow chart analysis.' },
  ],
});

const HAKIK = defineUpratna({
  slug: 'hakik',
  name: 'Hakik',
  hindi: 'Hakik / Akik',
  planet: 'Rahu',
  substitute: 'Hessonite (Gomed)',
  intro:
    'Hakik — Agate — is a banded chalcedony quartz worn for centuries in India as a Rahu protective talisman, kada, and affordable upratna when Gomed is not prescribed.',
  heroBenefits: ['Traditional Akik pedigree', 'Durable for daily kada', 'Wide colour range', 'Budget Rahu talisman'],
  seoDescription: `Buy natural Hakik (Agate) at ${BRAND}. A Rahu-aligned upratna and spiritual accessory with quality disclosure, energization options, and Jyotish guidance.`,
  about: [
    'Hakik (Akik) is microcrystalline quartz — SiO₂ — with banded chalcedony structure. Mohs hardness 6.5–7. Black, red, brown, and multi-colour varieties exist.',
    'Indian folk and Jyotish practice often prescribes black or brown Hakik for Rahu protection, while red Hakik appears in Mangal contexts. Rahu mapping is most common for black/brown bands. ' + ASTRO_DISCLAIMER,
    'India (Gujarat, Maharashtra), Brazil, and Uruguay produce agate. Carnelian is red chalcedony — related but distinct.',
  ],
  aboutTable: [
    ['Mineral family', 'Chalcedony / Agate (quartz)'],
    ['Typical forms', 'Banded cabochon, beads, kada'],
    ['Mohs hardness', '6.5–7'],
    ['Vedic association', 'Rahu — folk upratna for Gomed'],
  ],
  howToWear: [
    'Black or brown Hakik kada on wrist or middle finger on Saturday/Wednesday per lineage. Chant Rahu mantra 108 times after purification.',
    'Agate accepts polish beautifully — ensure natural, not dyed plastic. Skin contact through open-backed bezels or solid kada is typical.',
    'Clarify colour prescription: black for Rahu differs from red carnelian for Mangal.',
  ],
  whoShouldWear: [
    'Explored when Rahu needs grounding protection during challenging transits or dasha — especially if Hessonite is too strong or costly.',
    'Widely worn as spiritual protection regardless of chart — but remedial use still requires astrological fit.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with psychic protection, stability during chaos, and channeling Rahu\'s unconventional energy constructively.',
    'Extremely affordable in large kada and bead forms — practical for continuous wear.',
    'Historical use in Islamic and Hindu talismanic traditions across South Asia.',
  ],
  types: [
    'Black Hakik, moss agate, dendritic agate, and sardonyx serve different aesthetics. Confirm Rahu suitability for your chosen variety.',
    'Dyed agate is ubiquitous — natural banding should look organic under magnification.',
    'Glass and plastic "Hakik" in street markets fail gem tests.',
  ],
  qualityPrice: [
    'Natural banded agate is inexpensive. Fine Uruguay or Indian carving work adds craftsmanship value.',
    'For Jyotish, natural material and prescribed colour trump ornamental carving.',
  ],
  qualityTable: [
    ['Colour', 'Black/brown for Rahu per tradition'],
    ['Natural bands', 'Organic banding, not uniform dye'],
    ['Polish', 'Glossy without resin coating'],
    ['Form', 'Kada, ring, or tasbih per prescription'],
  ],
  jewellery: [
    'Hakik kada bracelets dominate Indian Rahu remedies. Rings and tasbih (108 beads) support mantra practice.',
    `${BRAND} lists natural Hakik with colour and treatment disclosure.`,
  ],
  care: [
    'Very durable — soap and water cleaning. Dyed stones may fade with harsh chemicals.',
    'Kada elastic or threading should be inspected annually.',
  ],
  beware: [
    'Plastic and glass "Akik" sold at tourist sites. Aggressive dyes on white agate masquerading as black Hakik.',
    'Red carnelian mislabeled for Rahu when Mangal prescription was needed — colour matters.',
  ],
  faqs: [
    { question: 'Hakik for Rahu or Ketu?', answer: 'Black/brown Hakik is commonly linked to Rahu. Ketu often uses cat\'s eye chrysoberyl or multi-colour folk stones — confirm with your astrologer.' },
    { question: 'Is Hakik the same as Agate?', answer: 'Yes — Hakik/Akik is the Hindi/Urdu name for agate (banded chalcedony quartz).' },
    { question: 'Kada or ring for Hakik?', answer: 'Kada is extremely popular for Rahu upratnas in India. Rings follow middle-finger protocol if prescribed.' },
    { question: 'Can Hakik be dyed?', answer: 'Yes — much market Hakik is dyed. Natural banded agate is preferred for Jyotish; test and certify.' },
    { question: 'Hakik vs Hessonite?', answer: 'Hessonite garnet is primary Gomed. Hakik is quartz folk upratna — gentler and far less expensive.' },
    { question: 'When to wear Hakik kada?', answer: 'Saturday evening or Wednesday per Rahu traditions — some wear continuously after energization. Follow your astrologer\'s muhurta.' },
  ],
});

const WHITE_CORAL = defineUpratna({
  slug: 'white-coral',
  name: 'White Coral',
  hindi: 'Safed Moonga',
  planet: 'Moon (Chandra)',
  substitute: 'Pearl (Moti)',
  intro:
    'White Coral — Safed Moonga — is an organic marine gem used as a Chandra upratna when Pearl is unsuitable, offering lunar support with a matte, earthy aesthetic.',
  heroBenefits: ['Organic Chandra upratna', 'Matte white beauty', 'Traditional Safed Moonga', 'Alternative to Pearl'],
  seoDescription: `Buy natural White Coral (Safed Moonga) at ${BRAND}. A Moon upratna substitute for Pearl with origin disclosure, certification, and Jyotish consultation.`,
  about: [
    'White coral is calcium carbonate skeleton of reef-building corals — primarily calcite/aragonite. Mohs hardness ~3–4. Mediterranean and Pacific sources supply gem material.',
    'Red Moonga is Mars (Mangal); white variety maps to Moon (Chandra) as Moti upratna in several Jyotish lineages for emotional balance and mother-related karma. ' + ASTRO_DISCLAIMER,
    'Environmental regulations restrict coral harvesting — buy only from legal, disclosed sources.',
  ],
  aboutTable: [
    ['Composition', 'Calcium carbonate (organic)'],
    ['Typical colour', 'White to pale pink'],
    ['Mohs hardness', '~3–4'],
    ['Vedic association', 'Moon (Chandra) — upratna for Moti'],
  ],
  howToWear: [
    'Wear on Monday on little finger in silver during Chandra Hora. Purify with raw milk and chant Chandra mantra 108 times.',
    'Choose undyed white coral with natural pore texture — wax-coated coral should be disclosed.',
    'Do not wear with primary Pearl without astrological clearance.',
  ],
  whoShouldWear: [
    'Considered when Chandra needs support but Pearl is contraindicated (allergy, vegan preference, or astrological caution against Moti).',
    'May suit natives with emotional volatility or mother-related chart themes when Moon is benefic.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with calmness, nurturing energy, and intuitive clarity under Chandra.',
    'Matte white aesthetic suits traditional silver tribal and Vedic jewellery.',
    'Less costly than fine Pearl at equivalent visual size for opaque remedies.',
  ],
  types: [
    'Angel skin (pale pink-white) and pure white branches are common. Dyed white bamboo coral must be disclosed.',
    'Red and white coral are different planetary prescriptions — never substitute without astrologer.',
    'Pressed coral and reconstituted material is inferior for Jyotish.',
  ],
  qualityPrice: [
    'Even colour, minimal cracks, and legal origin drive value. Branch specimens differ from cut cabochons.',
    'Sustainability concerns affect supply — expect certification of legal harvest.',
  ],
  qualityTable: [
    ['Colour', 'Natural white or pale pink'],
    ['Texture', 'Visible coral pore structure'],
    ['Enhancement', 'Disclose dye, wax, or resin'],
    ['Legality', 'CITES-compliant sourcing required'],
  ],
  jewellery: [
    'Silver rings with cabochon white coral and coral bead malas are classic Chandra styles.',
    'Open-back settings show natural pore texture — authentication feature.',
  ],
  care: [
    'Organic gem — avoid acids, perfumes, and ultrasonic cleaning. Wipe with damp soft cloth.',
    'Coral scratches easily — store padded. Remove before swimming.',
  ],
  beware: [
    'Dyed shell, plastic, and reconstituted coral sold as Safed Moonga.',
    'Illegal coral harms reefs — verify seller compliance and documentation.',
  ],
  faqs: [
    { question: 'White Coral vs Red Coral?', answer: 'Red Moonga is Mars (Mangal). White coral is Chandra upratna for Pearl. Completely different grahas — do not confuse.' },
    { question: 'White Coral vs Pearl?', answer: 'Pearl is primary Chandra ratna (organic). White coral is alternative organic upratna when Moti is not worn.' },
    { question: 'Is coral legal to buy?', answer: 'Regulated under CITES. Reputable sellers disclose legal origin. Avoid undocumented coral.' },
    { question: 'Monday wear protocol?', answer: 'Little finger, silver, Chandra Hora, Chandra mantra — standard lunar gem protocol.' },
    { question: 'How to spot fake coral?', answer: 'Natural coral shows pore texture; glass is bubble-free and too smooth; plastic is lightweight and warm to lip test (not recommended — use lab testing).' },
    { question: 'Can vegan buyers wear White Coral?', answer: 'Coral is animal-derived like Pearl. Some prefer Moonstone upratna instead — discuss ethical and astrological options with your advisor.' },
  ],
});

const SPINEL = defineUpratna({
  slug: 'spinel',
  name: 'Spinel',
  hindi: 'Spinel / Balas Ruby',
  planet: null,
  substitute: 'Varies by colour (Ruby, Sapphire, etc.)',
  intro:
    'Spinel is a magnesium aluminium oxide that occurs in every colour — red for Surya, blue for Shani, and pink for Shukra — making graha-specific selection mandatory.',
  heroBenefits: ['Exceptional hardness (8)', 'Colour-specific graha map', 'Historic "Balas Ruby"', 'Unheated gems available'],
  seoDescription: `Shop natural Spinel at ${BRAND}. Colour-matched Vedic upratna options with lab certification, graha consultation, and transparent origin disclosure.`,
  about: [
    'Spinel is MgAl₂O₄ with Mohs hardness 8 — singly refractive with excellent brilliance. Red spinel was historically confused with Ruby (Balas Ruby).',
    'Jyotish mapping is colour-dependent: red/crimson → Surya (Ruby upratna), blue → Shani (Sapphire upratna), pink → Shukra, orange → Rahu in some lists. No universal spinel graha. ' + ASTRO_DISCLAIMER,
    'Myanmar (Mogok), Sri Lanka, Tanzania, and Vietnam produce fine spinels. Cobalt blue Vietnamese spinel is highly prized.',
  ],
  aboutTable: [
    ['Mineral family', 'Spinel (oxide)'],
    ['Colours', 'Red, blue, pink, purple, etc.'],
    ['Mohs hardness', '8'],
    ['Vedic association', 'Colour-dependent — consult astrologer'],
  ],
  howToWear: [
    'Match wear protocol to the colour\'s graha — red on Sunday ring finger for Surya, blue on Saturday middle finger for Shani, pink on Friday for Shukra.',
    'Tell your seller the prescribed colour and graha before purchase — "spinel" alone is insufficient for remedial buying.',
    'Unheated natural spinel is preferred by conservative Jyotish buyers when available.',
  ],
  whoShouldWear: [
    'After astrologer specifies both graha and therefore spinel colour. Red spinel is NOT substitutable for blue spinel remedially.',
    'Collectors value spinel for beauty and durability beyond astrology — separate purchases from remedial prescriptions.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Hardness 8 suits daily rings better than many upratnas. Vivid colours rival corundum at lower prices historically (rising now).',
    'Red spinel offers Ruby-like colour without corundum treatments. Blue spinel is rare and beautiful for Shani discussions.',
    'No birefringence — singly refractive clarity pleases gemologists.',
  ],
  types: [
    'Jedi red spinel, cobalt blue, lavender, and grey spinel serve different markets. Mahenge pink-red is famous.',
    'Synthetic spinel is common in cheap jewellery — not for Jyotish.',
    'Gahnospinel and pleonaste are rare related minerals.',
  ],
  qualityPrice: [
    'Fine red and cobalt blue spinel prices have risen sharply as market recognizes spinel independently of ruby/sapphire.',
    'Specify colour when budgeting — grey or lavender is far cheaper than vivid red.',
  ],
  qualityTable: [
    ['Colour match', 'Must align with prescribed graha'],
    ['Treatment', 'Unheated preferred; disclose any enhancement'],
    ['Clarity', 'Eye-clean spinel widely available'],
    ['Identity', 'Natural spinel, not synthetic'],
  ],
  jewellery: [
    'Spinel excels in durable Vedic rings once colour and graha are confirmed. Pendants and earrings showcase brilliance.',
    'Open-back gold mounts for Surya red spinel; silver for Shani blue spinel per tradition.',
  ],
  care: [
    'Very durable — warm soapy water safe. Spinel withstands daily wear better than most upratnas.',
    'Avoid abrasive storage with harder diamond only.',
  ],
  beware: [
    'Synthetic red and blue spinel in cheap "ruby/sapphire" jewellery. Buy certified natural with colour specification.',
    'Buying blue spinel when red was prescribed — common error with multi-colour minerals.',
  ],
  faqs: [
    { question: 'Red Spinel vs Ruby?', answer: 'Ruby is corundum Navaratna for Surya. Red spinel is historic Balas Ruby upratna — beautiful but astrologically distinct from primary Manik.' },
    { question: 'Blue Spinel for Shani?', answer: 'Some contemporary Jyotish accepts fine blue spinel as Neelam upratna. Classical texts emphasize blue sapphire — confirm with your astrologer.' },
    { question: 'Is all Spinel the same graha?', answer: 'No — colour determines graha. This is critical for remedial purchases.' },
    { question: 'Spinel vs Garnet?', answer: 'Different minerals. Hessonite garnet is Rahu; red spinel is Surya discussion. Do not confuse based on red colour alone — species matters.' },
    { question: 'Unheated Spinel important?', answer: 'Conservative Jyotish prefers unheated natural gems. Spinel is often untreated — verify with lab report.' },
    { question: 'How to order for Jyotish?', answer: 'Provide astrologer\'s colour and graha note to seller. Buy specified spinel colour with certification.' },
  ],
});

const CHRYSOBERYL = defineUpratna({
  slug: 'chrysoberyl',
  name: 'Chrysoberyl',
  hindi: 'Lasuniya / Chrysoberyl',
  planet: 'Ketu',
  substitute: "Cat's Eye (Lehsunia)",
  intro:
    'Chrysoberyl Cat\'s Eye is the mineralogical species behind Lehsunia — the primary Ketu gem — with honey-yellow chatoyancy prized in Vedic astrology for spiritual detachment and protection.',
  heroBenefits: ['True Lehsunia species', 'Sharp cat\'s eye band', 'Hardness 8.5', 'High-impact Ketu remedy'],
  seoDescription: `Buy natural Chrysoberyl Cat's Eye at ${BRAND}. The authentic Ketu gemstone and Lehsunia species with certification, origin disclosure, and expert Jyotish guidance.`,
  about: [
    'Chrysoberyl is beryllium aluminate — BeAl₂O₄ — with Mohs hardness 8.5. Cat\'s eye variety shows chatoyancy from fine needle inclusions. Alexandrite is colour-change chrysoberyl.',
    'Lehsunia in Jyotish specifically means chrysoberyl cat\'s eye for Ketu — not quartz tiger\'s eye. Honey-yellow to greenish honey with sharp band is ideal. ' + ASTRO_DISCLAIMER,
    'Sri Lanka supplies most fine cat\'s eye chrysoberyl. India, Brazil, and East Africa also produce material.',
  ],
  aboutTable: [
    ['Mineral family', 'Chrysoberyl (oxide)'],
    ['Ketu variety', "Cat's eye chrysoberyl"],
    ['Mohs hardness', '8.5'],
    ['Vedic association', 'Ketu — Lehsunia (primary species)'],
  ],
  howToWear: [
    'Wear on Tuesday or Thursday (traditions vary for Ketu) on middle or ring finger in silver or Panchdhatu. Chant Ketu mantra 108 times after purification with black blanket or sesame offering.',
    'Sharp, centered chatoyant band that moves across the dome is mandatory. Milky or weak band stones are rejected for Jyotish.',
    'Ketu gems are potent — never wear without qualified chart analysis.',
  ],
  whoShouldWear: [
    'Prescribed during Ketu dasha/antardasha or when Ketu requires structured spiritual channeling — rarely for beginners.',
    'May suit mystics, researchers, and those on renunciant paths when Ketu is yogakaraka or otherwise supportive in chart.',
    ASTRO_DISCLAIMER,
  ],
  benefits: [
    'Associated with spiritual insight, detachment from material obsession, psychic protection, and past-life karma resolution under Ketu.',
    'Chrysoberyl durability supports long-term ring wear among the hardest gem minerals.',
    'Sharp cat\'s eye phenomenon provides clear authentication versus simulants.',
  ],
  types: [
    "Honey cat's eye chrysoberyl is standard Lehsunia. Alexandrite is rare colour-change variety — different market.",
    "Quartz tiger's eye is NOT chrysoberyl — verify species before Ketu purchase.",
    'Synthetic cat\'s eye fiber optics exist — show parallel perfect lines unlike natural needles.',
  ],
  qualityPrice: [
    'Sharp band, high transparency, and large size escalate price rapidly. Fine Sri Lankan cat\'s eye rivals corundum in cost per carat.',
    'For Jyotish, band sharpness trumps flawless body clarity.',
  ],
  qualityTable: [
    ['Chatoyancy', 'Sharp single band moving across dome'],
    ['Colour', 'Honey yellow to greenish honey'],
    ['Species', 'Chrysoberyl — not quartz'],
    ['Treatment', 'Natural cat\'s eye only'],
  ],
  jewellery: [
    "Cabochon rings in silver are classic Ketu mounts. High-domed cabochons maximize chatoyancy.",
    'Protective bezels recommended though hardness is high — band visibility matters more than open prongs.',
  ],
  care: [
    'Very durable — soap and water cleaning safe. Excellent for daily wear among Ketu options.',
    'Avoid rough abrasion on dome — chatoyancy depends on surface polish.',
  ],
  beware: [
    "Tiger's eye quartz sold as Lehsunia — species fraud for Ketu remedies.",
    'Fiber-optic synthetic cat\'s eye with too-perfect lines. Apatite and tourmaline cat\'s eyes are different species.',
  ],
  faqs: [
    { question: "Chrysoberyl vs Tiger's Eye for Ketu?", answer: "Ketu Lehsunia is chrysoberyl cat's eye (hardness 8.5). Tiger's eye is quartz — different species and classical status. Verify before buying." },
    { question: 'What makes a good Lehsunia?', answer: 'Honey-coloured chrysoberyl with sharp, mobile chatoyant band centered on cabochon dome. Weak band rejected for Jyotish.' },
    { question: 'Is Alexandrite for Ketu?', answer: 'Alexandrite is colour-change chrysoberyl — collector gem. Ketu remedy specifically means cat\'s eye chrysoberyl, not alexandrite.' },
    { question: 'Ketu gem potency?', answer: 'Ketu stones are considered highly potent like Rahu gems — mandatory astrological consultation before wear.' },
    { question: 'Which day for Cat\'s Eye?', answer: 'Tuesday or Thursday per lineage — during Ketu Hora. Follow your astrologer\'s muhurta exactly.' },
    { question: 'Sri Lankan Cat\'s Eye best?', answer: 'Sri Lanka historically produces finest chrysoberyl cat\'s eye, but any certified natural sharp-band chrysoberyl may qualify per chart.' },
  ],
});

export const UPRATNA_RICH_CONTENT: Record<string, RichGemSections> = {
  amethyst: AMETHYST,
  'lapis-lazuli': LAPIS_LAZULI,
  moonstone: MOONSTONE,
  peridot: PERIDOT,
  'rose-quartz': ROSE_QUARTZ,
  citrine: CITRINE,
  garnet: GARNET,
  turquoise: TURQUOISE,
  aquamarine: AQUAMARINE,
  'tiger-eye': TIGER_EYE,
  malachite: MALACHITE,
  opal: OPAL,
  tanzanite: TANZANITE,
  'blue-topaz': BLUE_TOPAZ,
  'white-topaz': WHITE_TOPAZ,
  zircon: ZIRCON,
  iolite: IOLITE,
  tourmaline: TOURMALINE,
  diopside: DIOPSIDE,
  kyanite: KYANITE,
  sunstone: SUNSTONE,
  hakik: HAKIK,
  'white-coral': WHITE_CORAL,
  spinel: SPINEL,
  chrysoberyl: CHRYSOBERYL,
};

function shopLink(slug: string, label: string) {
  return `<a href="${canonicalSubcategoryHref(slug) ?? `/shop/${slug}`}">${label}</a>`;
}

/** Parent /gemstones/upratna hub — substitutes from our recommendation table and per-stone Upratna pages. */
export const UPRATNA_HUB_CONTENT: RichGemSections = {
  intro:
    'Upratna are traditional Vedic substitutes for Navaratna gems — the same graha, a gentler stone, chosen after chart review.',
  hero_benefits: [
    { text: 'Certified natural substitutes' },
    { text: 'Same planet, gentler stone' },
    { text: 'Treatment disclosure listed' },
    { text: 'Chart review before wearing' },
  ],
  seo_title: 'Buy Upratna Gems Online in India | Vedic Gemstones',
  seo_description:
    'Buy certified Upratna gems online in India. Natural amethyst, citrine, moonstone, zircon as planetary substitutes. Lab reports. Delhi since 1937.',
  meta_keywords: [
    'buy upratna stone online',
    'upratna gemstones',
    'semi precious vedic gems',
    'substitute gemstone jyotish',
    'amethyst for blue sapphire',
    'citrine for pukhraj',
    'certified upratna',
    'natural zircon',
    'moonstone pearl substitute',
    BRAND.toLowerCase(),
  ],
  about_html: [
    p(
      `Upratna (उप रत्न) are the secondary Vedic gems used when a Navaratna is too strong, too costly, or not indicated. Our <a href="/gems-recommendations">recommendation notes</a> and gem-qualities FAQ treat them as planetary substitutes — not as a cheaper way to skip Kundli review. ${ASTRO_DISCLAIMER}`,
      `At ${BRAND}, each Upratna listing names the mineral, treatment status, and the Navaratna it traditionally stands in for. Buy the substitute that was prescribed, not a colour-matched lookalike.`,
    ),
    h3('Planet, Navaratna, and the Upratna we stock'),
    `<table><thead><tr><th>Planet</th><th>Navaratna</th><th>Upratna on this site</th></tr></thead><tbody>
<tr><td>Sun (Surya)</td><td>${shopLink('ruby', 'Ruby (Manik)')}</td><td>${shopLink('garnet', 'Garnet')}, ${shopLink('sunstone', 'Sunstone')}, ${shopLink('tiger-eye', "Tiger's Eye")}, ${shopLink('spinel', 'Red Spinel')}</td></tr>
<tr><td>Moon (Chandra)</td><td>${shopLink('pearl', 'Pearl (Moti)')}</td><td>${shopLink('moonstone', 'Moonstone')}, ${shopLink('white-coral', 'White Coral')}</td></tr>
<tr><td>Mars (Mangal)</td><td>${shopLink('red-coral', 'Red Coral (Moonga)')}</td><td>Carnelian in our recommendation table — ask at <a href="/consultation">consultation</a> if a Mars upratna is required</td></tr>
<tr><td>Mercury (Budh)</td><td>${shopLink('emerald', 'Emerald (Panna)')}</td><td>${shopLink('peridot', 'Peridot')}, ${shopLink('aquamarine', 'Aquamarine')}, ${shopLink('diopside', 'Diopside')}, ${shopLink('tourmaline', 'Green Tourmaline')}</td></tr>
<tr><td>Jupiter (Guru)</td><td>${shopLink('yellow-sapphire', 'Yellow Sapphire (Pukhraj)')}</td><td>${shopLink('citrine', 'Citrine')}, ${shopLink('turquoise', 'Turquoise')}</td></tr>
<tr><td>Venus (Shukra)</td><td>${shopLink('diamond', 'Diamond')} / ${shopLink('white-sapphire', 'White Sapphire')}</td><td>${shopLink('zircon', 'Zircon')}, ${shopLink('opal', 'Opal')}, ${shopLink('white-topaz', 'White Topaz')}, ${shopLink('rose-quartz', 'Rose Quartz')}</td></tr>
<tr><td>Saturn (Shani)</td><td>${shopLink('blue-sapphire', 'Blue Sapphire (Neelam)')}</td><td>${shopLink('amethyst', 'Amethyst')}, ${shopLink('iolite', 'Iolite')}, ${shopLink('lapis-lazuli', 'Lapis Lazuli')}, ${shopLink('tanzanite', 'Tanzanite')}, ${shopLink('blue-topaz', 'Blue Topaz')}</td></tr>
<tr><td>Rahu</td><td>${shopLink('hessonite', 'Hessonite (Gomed)')}</td><td>${shopLink('garnet', 'Garnet')}, ${shopLink('hakik', 'Hakik')}</td></tr>
<tr><td>Ketu</td><td>${shopLink('cats-eye', "Cat's Eye (Lehsuniya)")}</td><td>${shopLink('chrysoberyl', 'Chrysoberyl')}, ${shopLink('tiger-eye', "Tiger's Eye")} (context-dependent)</td></tr>
</tbody></table>`,
    h3('Substitute, not a duplicate Navaratna'),
    p(
      'An Upratna is traditionally gentler than the primary ratna of the same graha. That is why Amethyst is used when Neelam is not affordable or not advisable — not because the two stones are interchangeable in every chart. Do not wear an Upratna and its Navaratna together unless an astrologer allows it.',
    ),
  ].join('\n'),
  how_to_wear_html: [
    p(
      'There is no one Sunday / ring-finger rule for every Upratna. Metal, finger, day, and mantra follow the planet of the substitute — the same mapping as the Navaratna it stands for — and the wearing notes on that stone’s shop page.',
    ),
    table([
      ['First step', 'Kundli review. Do not self-prescribe an Upratna because it is cheaper than the Navaratna.'],
      ['Setting', 'Open-back ring or pendant so the stone can touch the skin, as on our Navaratna wearing notes.'],
      ['Purification', 'Bathe, wear clean clothes, then purify in unboiled cow milk or Ganga jal.'],
      ['Mantra', 'Use the beej mantra of the ruling graha — listed on each Upratna page — at least 108 times.'],
      ['Time', 'Wear on the weekday of that planet at the time calculated for you, not a generic hour copied from Ruby.'],
      ['Do not stack', 'Do not add the primary Navaratna (for example Neelam on top of Amethyst) without explicit approval.'],
    ]),
    h3('If you already own a Navaratna ring'),
    p(
      'An Upratna pendant is often the practical add-on when a primary gem already occupies the prescribed finger. Confirm the combination against inimical gems in our <a href="/knowledge/gemstones">Navratnas guide</a> before daily wear.',
    ),
  ].join('\n'),
  who_should_wear_html: [
    p(
      `Wear the Upratna that was named for your lagna, dasha, and house lords. “Anyone can wear semi-precious gems” is jewellery marketing. ${ASTRO_DISCLAIMER}`,
    ),
    h3('When an Upratna is the better first stone'),
    ul([
      'When the astrologer has advised a gentler remedy than high-impact Neelam, Gomed, or Lehsuniya.',
      'When budget cannot yet support a certified Navaratna of usable size — still buy natural, disclosed quality, not glass.',
      'When a trial period is safer than committing to the primary ratna.',
    ]),
    h3('Consult an astrologer'),
    p(
      `Use <a href="/gems-recommendations">Which Gemstone Should I Wear?</a>, then <a href="/consultation">book our experts</a>. ${BRAND} would rather sell one correct certified Upratna than a tray of colourful stones that fight the chart.`,
    ),
  ].join('\n'),
  benefits_html: [
    p(
      'Benefits belong to the planet of the substitute that was prescribed. They are traditional Jyotish associations from our stone pages — not medical or financial promises, and not a reason to wear every Upratna at once.',
    ),
    h3('Sun, Moon, and Mars'),
    p(
      `${shopLink('garnet', 'Garnet')}, ${shopLink('sunstone', 'Sunstone')}, and ${shopLink('tiger-eye', "Tiger's Eye")} are the Surya-side stones we list. ${shopLink('moonstone', 'Moonstone')} and ${shopLink('white-coral', 'White Coral')} stand with Chandra. Mars upratna is chart-specific — Carnelian appears in our recommendation table; confirm before you buy a lookalike.`,
    ),
    h3('Mercury, Jupiter, and Venus'),
    p(
      `${shopLink('peridot', 'Peridot')} and ${shopLink('aquamarine', 'Aquamarine')} are the usual Budh substitutes for Emerald. ${shopLink('citrine', 'Citrine')} is the common Guru stand-in for Pukhraj. For Shukra, ${shopLink('zircon', 'Zircon')} and ${shopLink('opal', 'Opal')} are the Venus alternates named in our recommendation notes — cubic zirconia is not.`,
    ),
    h3('Saturn, Rahu, and Ketu'),
    p(
      `${shopLink('amethyst', 'Amethyst')} and ${shopLink('iolite', 'Iolite')} are the Shani substitutes listed for Neelam. ${shopLink('garnet', 'Garnet')} and ${shopLink('hakik', 'Hakik')} are used for Rahu when Gomed is not indicated. ${shopLink('chrysoberyl', 'Chrysoberyl')} and, in some charts, ${shopLink('tiger-eye', "Tiger's Eye")} are Ketu-side options — both are individual, not casual first stones.`,
    ),
  ].join('\n'),
  types_html: [
    h3('Shani substitutes'),
    p(
      `${shopLink('amethyst', 'Amethyst (Katela)')}, ${shopLink('iolite', 'Iolite (Neeli)')}, ${shopLink('lapis-lazuli', 'Lapis Lazuli')}, ${shopLink('tanzanite', 'Tanzanite')}, ${shopLink('blue-topaz', 'Blue Topaz')}, and ${shopLink('kyanite', 'Kyanite')}. Amethyst is the usual first Upratna when Neelam is paused.`,
    ),
    h3('Shukra substitutes'),
    p(
      `${shopLink('zircon', 'Zircon (Jarkan)')}, ${shopLink('opal', 'Opal')}, ${shopLink('white-topaz', 'White Topaz')}, ${shopLink('rose-quartz', 'Rose Quartz')}, and ${shopLink('malachite', 'Malachite')}. Natural zircon is a listed Venus alternate; cubic zirconia is a lookalike with no Jyotish place.`,
    ),
    h3('Other grahas'),
    p(
      `${shopLink('citrine', 'Citrine')} and ${shopLink('turquoise', 'Turquoise')} for Guru. ${shopLink('peridot', 'Peridot')}, ${shopLink('aquamarine', 'Aquamarine')}, ${shopLink('diopside', 'Diopside')}, and ${shopLink('tourmaline', 'Tourmaline')} for Budh. ${shopLink('moonstone', 'Moonstone')} for Chandra. ${shopLink('garnet', 'Garnet')} for Surya or Rahu depending on the notes. ${shopLink('spinel', 'Spinel')} is colour-mapped — red is not automatically a Ruby substitute.`,
    ),
  ].join('\n'),
  quality_price_html: [
    p(
      'Price follows the mineral, colour, clarity, size, and treatment status of that Upratna — not a single “semi-precious MRP.” Live cards in the collection below are the quote.',
    ),
    h3('What to verify'),
    ul([
      'Natural origin and treatment disclosure — heat on topaz and tanzanite, dye on turquoise, assembled opal, glass-filled anything.',
      'The Navaratna it is substituting, named on the invoice — “blue stone for Shani” is not enough.',
      'A lab report that identifies the mineral, not a paper that only says “Upratna.”',
      'Cubic zirconia, glass, or dyed quartz sold as zircon, amethyst, or citrine.',
    ]),
    h3('Why an Upratna can still cost real money'),
    p(
      'Fine amethyst, zircon, and tanzanite are priced by quality like any gem. A suspiciously cheap “Neelam substitute” is usually glass. Compare the collection rather than an invented price band.',
    ),
  ].join('\n'),
  jewellery_html: [
    p(
      `${BRAND} sets prescribed Upratna gems in open-back rings and pendants, in silver, gold, or Panchdhatu as advised for that planet. Finger, metal, and whether you already wear a Navaratna should be confirmed before making.`,
    ),
    h3('Open setting'),
    p(
      'The same ray-transmission rule as Navaratna: the pavilion should be open to the skin. Closed cups hide treatments and block contact.',
    ),
    h3('See stones in Delhi'),
    p(
      `Inspect colour in daylight at our <a href="/about/stores">Saket, New Delhi showroom</a>, or buy certified stones online with insured shipping. Custom jewellery is made after the gems are approved.`,
    ),
  ].join('\n'),
  cleaning_care_html: [
    p(
      'Upratna jewellery mixes hard quartz and spinel with soft opal, turquoise, and moonstone. Our <a href="/knowledge/gems-care">gemstone care guide</a> is the rule: clean as if the weakest stone governs the piece.',
    ),
    h3('Safe routine'),
    ul([
      'Opal and turquoise: damp cloth only; no soak, ultrasonic, or steam.',
      'Moonstone and pearl-family organics: wipe after wear; perspiration and perfume are harmful.',
      'Amethyst, citrine, quartz: lukewarm water, mild soap, soft brush; avoid long sun on amethyst.',
      'Zircon and topaz: warm water and a soft brush; skip ultrasonic at home.',
    ]),
    h3('Daily precautions'),
    p(
      'Apply perfume and hairspray before the jewellery goes on. Store so harder gems cannot rub opal, turquoise, or moonstone.',
    ),
  ].join('\n'),
  buyer_beware_html: [
    p(
      'Cheap “original Upratna” listings usually fail on disclosure. Read our <a href="/knowledge/treatments">treatments guide</a> before you pay.',
    ),
    ul([
      'Cubic zirconia or glass sold as zircon, diamond substitute, or white sapphire.',
      'Dyed quartz sold as amethyst, citrine, or “Jamunia.”',
      'Assembled doublet opal or plastic imitation.',
      'Heat, dye, or impregnation not named on turquoise, topaz, or tanzanite.',
      'Closed settings that hide the pavilion.',
      '“Wear any semi-precious stone” with no chart option to skip Shani or Rahu substitutes.',
    ]),
  ].join('\n'),
  faqs: [
    {
      question: 'What are Upratna gemstones?',
      answer:
        'Upratna are secondary Vedic gems used as planetary substitutes for the nine Navaratna — for example Amethyst for Blue Sapphire, Citrine for Yellow Sapphire, or natural Zircon for Diamond. They still require chart analysis.',
    },
    {
      question: 'Is Upratna the same as Navaratna?',
      answer:
        'No. Navaratna are the nine primary ratnas. Upratna are traditionally gentler substitutes of the same graha, used when the primary stone is unsuitable, too strong, or not affordable. They are not interchangeable in every chart.',
    },
    {
      question: 'What is Upratna stone price in India?',
      answer:
        'There is no single MRP. Price follows the mineral, quality, size, and treatment status. Use the live collection on this page. A listing cheaper than decent quartz is usually glass or dye.',
    },
    {
      question: 'Can I wear Upratna instead of Navaratna?',
      answer:
        'Only if an astrologer has named that substitute for your chart. Amethyst for Neelam is a common example when Blue Sapphire is paused. Do not swap colours on your own.',
    },
    {
      question: 'Can I wear Upratna with a Navaratna ring?',
      answer:
        'Generally not with the primary stone of the same planet, and not with inimical gems, unless a learned astrologer allows it. Confirm before stacking Amethyst with Neelam or Zircon with Diamond.',
    },
    {
      question: 'How do I wear an Upratna ring?',
      answer:
        'After chart review, use an open-back setting, purify in unboiled cow milk or Ganga jal, chant the graha mantra 108 times, and wear on the weekday of that planet at the time calculated for you. Metal and finger follow the stone’s page and the astrologer.',
    },
    {
      question: 'Which Upratna is used for Blue Sapphire?',
      answer:
        'Amethyst (Katela / Jamunia) is the usual Shani substitute on this site. Iolite, Lapis Lazuli, Tanzanite, and Blue Topaz are also listed as Saturn-side Upratna — suitability is chart-specific.',
    },
    {
      question: 'Is zircon a real diamond substitute?',
      answer:
        'Natural zircon is a listed Venus alternate in our recommendation notes. White sapphire is the traditional Jyotish substitute for diamond. Cubic zirconia is not an astrological gem.',
    },
    {
      question: 'Are Upratna gems at PureVedicGems certified?',
      answer:
        'Listings include transparent certification and treatment disclosure where applicable. Ask for the mineral name on the report, not a paper that only says Upratna.',
    },
    {
      question: 'Do you ship Upratna stones across India?',
      answer:
        'Yes. PureVedicGems ships certified Upratna gems and jewellery across India with insured delivery, and you can view pieces in our Delhi showroom. International shipping is available on request for listed in-stock stones.',
    },
  ],
};





