import type { CategoryFaq } from '@/lib/types/shop-category-page';
import {
  BRAND,
  baseGemKeywords,
  h2,
  h3,
  mergeKeywords,
  p,
  table,
  ul,
  type RichGemSections,
} from './helpers';
import { canonicalSubcategoryHref } from '@/lib/categories/canonical-storefront-path';

type GemDef = RichGemSections & {
  slug: string;
  name: string;
  hindi: string;
  planet: string;
  extraKeywords?: string[];
};

function defineGem(def: GemDef): RichGemSections {
  const { slug, name, hindi, planet, extraKeywords = [], ...sections } = def;
  return {
    ...sections,
    meta_keywords: mergeKeywords(baseGemKeywords(slug, name, hindi, planet), extraKeywords),
  };
}

export const NAVARATNA_RICH_CONTENT: Record<string, RichGemSections> = {
  ruby: defineGem({
    slug: 'ruby',
    name: 'Ruby',
    hindi: 'Manik',
    planet: 'Sun',
    extraKeywords: [
      'burma ruby',
      'mozambique ruby',
      'surya ratna',
      'leo gemstone',
      'ruby ring gold',
      'natural manik stone',
      'unheated ruby',
    ],
    intro:
      'Ruby (Manik) is the radiant king of Navaratna gems, channeling the vital fire of Surya—the Sun. A natural, well-saturated ruby is prized in Jyotish for awakening confidence, authority, and dharmic purpose. At PureVedicGems, every Manik is disclosed for origin, treatment, and suitability before it is set for astrological wear.',
    hero_benefits: [
      { text: 'Strengthens Surya for leadership, government roles, and public recognition' },
      { text: 'Supports vitality, heart health, and recovery from chronic fatigue' },
      { text: 'Sharpens decision-making and courage during career transitions' },
      { text: 'Traditionally worn to overcome low self-esteem and paternal obstacles' },
    ],
    seo_description:
      'Buy certified natural Ruby (Manik) online for Surya. Unheated Burma & Mozambique rubies with Jyotish guidance, origin disclosure & energisation from PureVedicGems.',
    about_html: [
      p(
        'Ruby is the red variety of corundum, coloured by chromium. In Sanskrit it is called Manik or Manikya, and in classical Jyotish it is the primary ratna of Surya—the Sun, giver of prana, fame, and soul-purpose. A fine ruby displays a vivid red to slightly purplish-red hue with strong fluorescence under daylight.',
        'The Navaratna tradition places ruby at the crown of the nine gems. Kings and rajas wore Manik not merely for ornament but to align the wearer with solar dignity, righteous authority, and clarity of vision. In the Garuda Purana and Agni Purana, ruby is described as a gem that dispels fear and attracts prosperity when worn with proper ritual.',
      ),
      h3('Mineralogy & Origins'),
      p(
        'Natural rubies form in metamorphic marble and basalt environments. Historically, the Mogok Valley of Burma (Myanmar) produced the finest "pigeon blood" rubies with exceptional saturation and silk inclusions that soften the colour. Mozambique, Sri Lanka (Ceylon), Thailand, Madagascar, and Tanzania are also significant sources.',
        'Heat treatment is widespread in the trade; unheated rubies command premium prices. Lead-glass filling and synthetic flux-grown rubies are common imitations—certification from a reputable lab is essential before astrological use.',
      ),
      h3('Vedic Significance'),
      p(
        'Surya governs the soul (atma), father, government, bones, eyes, and the right side of the body. When Surya is weak or afflicted in a birth chart, a natural ruby may be prescribed to strengthen solar qualities. Ruby is especially associated with Leo (Simha) rashi and is considered favourable for Krittika, Uttara Phalguni, and Uttara Ashadha nakshatras.',
        `${BRAND} recommends chart analysis before wearing Manik, as an overly strong Sun in certain houses can also create arrogance or ego clashes. The gem should touch skin and be free of major fractures or windowing that weakens its energetic field.`,
      ),
      h3('Colour & Quality in Jyotish'),
      p(
        'Traditional texts favour a deep, lustrous red—neither too dark nor pinkish. Transparency should be good enough that light passes through the stone; heavily included rubies may be beautiful but are less ideal for ratna therapy. Size matters: classical proportion is roughly one carat per 10–12 kg of body weight, though your astrologer may adjust this.',
      ),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '3–7 carats (≈1 carat per 10–12 kg body weight; confirm with Jyotish)'],
      ['Metal', 'Yellow gold or Panchdhatu (five-metal alloy)'],
      ['Finger', 'Ring finger of the right hand'],
      ['Day', 'Sunday (Ravivar)'],
      ['Time', 'Sunrise during Shukla Paksha (waxing moon), ideally in Surya hora'],
      ['Mantra', 'Chant "Om Suryaya Namah" or "Om Hring Hamsah Suryaye Namah" 108 times'],
      [
        'Purification',
        'Soak in raw milk, honey, and Gangajal for 20–30 minutes; offer red flowers and light a ghee lamp before first wear',
      ],
    ]),
    who_should_wear_html: [
      p(
        'Ruby benefits those with a weak, debilitated, or combust Sun, or when Surya is the lord of favourable houses (especially the 1st, 5th, 9th, or 10th). Leo ascendants and Sun mahadasha periods often respond well. Krittika, Uttara Phalguni, and Uttara Ashadha natives frequently wear Manik under guidance.',
      ),
      h3('When Not to Wear'),
      p(
        'Avoid ruby without consultation if Surya is already exalted and strongly placed, if you are in Sade Sati without Shani approval, or if your astrologer sees Sun–Saturn or Sun–Rahu conflicts that ruby could aggravate. Pregnant women and those with extreme hypertension should seek medical and astrological counsel first.',
      ),
      h3('Consult an Astrologer'),
      p(
        `A qualified Jyotishi examines your lagna, dasha, and transits before prescribing Manik. ${BRAND} offers consultation support so your ruby matches your chart—not a generic recommendation.`,
      ),
    ].join('\n'),
    benefits_html: [
      h3('Career & Authority'),
      p(
        'Ruby is the gemstone of kingship and executive command. It supports promotions, entrepreneurship, politics, medicine, and any field requiring visible leadership. Wearers often report improved recognition from seniors and the confidence to take calculated risks.',
      ),
      h3('Health & Vitality'),
      p(
        'In Ayurvedic–astrological correlation, Surya rules the heart, spine, eyes, and general immunity. Ruby is traditionally worn to address low energy, poor circulation, and chronic lethargy. It is not a substitute for medical care but is believed to reinforce pranic strength.',
      ),
      h3('Relationships & Family'),
      p(
        'A balanced Sun improves relations with the father and paternal figures, and fosters integrity in partnerships. Ruby can help those who struggle with self-worth in marriage or who need to assert healthy boundaries without aggression.',
      ),
      h3('Spiritual Growth'),
      p(
        'Surya is the visible deity of truth and self-knowledge. Meditating on the Sun mantra while wearing Manik is said to burn tamasic tendencies and align the wearer with dharma. Many seekers pair ruby with Surya Namaskar and Sunday fasting.',
      ),
      h3('Financial Prosperity'),
      p(
        'Classical texts associate ruby with gold, landed property, and sustained wealth when earned through righteous means. It is favoured during periods when the 2nd, 9th, or 11th lords connect favourably with Surya.',
      ),
    ].join('\n'),
    types_html: [
      h3('Major Origins'),
      ul([
        'Burma (Mogok): Finest colour, premium collector grade',
        'Mozambique: Excellent saturation, widely available in fine qualities',
        'Sri Lanka (Ceylon): Often lighter pink-red, good transparency',
        'Thailand & Madagascar: Commercial to fine grades; verify treatment',
      ]),
      h3('Colour Varieties'),
      p(
        'Pigeon blood red (Burma), vivid red (Mozambique), pinkish-red (Ceylon), and star ruby (asterism from rutile silk) are the main categories. Star rubies are ornamental; transparent faceted stones are preferred for Jyotish.',
      ),
      h3('Natural vs Treated'),
      p(
        'Unheated natural ruby is the gold standard for astrology. Heat-only treatment is accepted by some astrologers if disclosed; lead-glass filling, diffusion, and synthetics must be avoided. Always request a certificate stating treatment status.',
      ),
    ].join('\n'),
    quality_price_html: [
      p(
        'Ruby pricing depends on colour saturation, clarity, carat weight, origin, and treatment. Unheated Burma rubies sit at collector premiums; fine Mozambique rubies offer strong colour at mid-to-high tiers. Entry-level commercial rubies with visible inclusions cost far less but may lack the lustre Jyotish demands.',
      ),
      h3('Certification'),
      p(
        'Reputable labs (GIA, GRS, Gubelin, SSEF, IGI) should state whether the stone is natural corundum, its origin when determinable, and any treatment. Insist on "no indications of heating" for premium astrological use.',
      ),
      h3('Price Guidance'),
      p(
        'Expect entry-level treated rubies from modest budgets, mid-range fine commercial stones, and premium unheated collector grades reaching significant five- and six-figure investments per carat for top Burma material. Budget proportionally to your chart needs and wear frequency.',
      ),
    ].join('\n'),
    jewellery_html: [
      p(
        'Ruby rings in 18K or 22K gold are the classic Jyotish setting, with the stone in an open-back bezel so it touches skin. Pendants over the heart centre are an alternative when ring wear is impractical.',
      ),
      h3('Setting Tips'),
      ul([
        'Open setting with culet touching skin is essential',
        'Avoid claws that block light entry; prongs should be minimal',
        'Panchdhatu mounts are traditional for Navaratna balance',
        'Pair with Sunday energisation before first wear',
      ]),
      h3('Bracelets & Pendants'),
      p(
        'Ruby bracelets are worn less commonly for primary Surya therapy but suit those who cannot wear rings. Ensure the largest ruby in a Navaratna bracelet sits prominently. Pendants should hang at the anahata (heart) region.',
      ),
    ].join('\n'),
    cleaning_care_html: [
      h3('Routine Cleaning'),
      p('Clean with lukewarm water, mild soap, and a soft brush. Rinse and pat dry. Avoid ultrasonic cleaners if the stone has fractures or lead-glass filling.'),
      h3('Storage'),
      p('Store separately—ruby (9 on Mohs scale) can scratch softer gems. Wrap in a soft cloth away from direct sunlight for prolonged storage.'),
      h3('Re-Energisation'),
      p('Re-charge on Sundays with Surya mantra, Gangajal rinse, and brief sun exposure at sunrise (avoid overheating treated stones).'),
      h3('Inspection'),
      p('Check prongs every 6–12 months. A loose ruby in a ring can chip at the girdle.'),
    ].join('\n'),
    buyer_beware_html: [
      p(
        'The ruby market is flooded with synthetics (Verneuil flame-fusion, flux, hydrothermal) and glass-filled low-grade corundum. Pink sapphires and red spinels are sometimes sold as ruby.',
      ),
      h3('Red Flags'),
      ul([
        'Price too low for claimed Burma origin',
        'No treatment disclosure on certificate',
        'Gas bubbles or curved growth lines under magnification',
        'Seller refuses independent lab verification',
        '"Composite" or "assembled" ruby descriptions',
      ]),
      h3('Trust Your Source'),
      p(
        `${BRAND} discloses origin, treatment, and Jyotish suitability on every Manik listing. Buy only from sellers who welcome third-party lab checks.`,
      ),
    ].join('\n'),
    faqs: [
      {
        question: 'Which finger should I wear a ruby ring on?',
        answer:
          'Traditionally, ruby is worn on the ring finger of the right hand in gold, set so the stone touches the skin. Left-hand wear is sometimes used in specific traditions—confirm with your astrologer.',
      },
      {
        question: 'Can I wear ruby and blue sapphire together?',
        answer:
          'Sun and Saturn are natural adversaries in Jyotish. Wearing ruby and neelam together is generally discouraged unless a qualified astrologer prescribes a specific combination for your chart.',
      },
      {
        question: 'Is heat-treated ruby OK for astrology?',
        answer:
          'Opinions vary. Many Jyotish practitioners prefer unheated natural ruby. Heat-only treatment without fillers may be acceptable if disclosed; glass-filled stones should never be used as Manik.',
      },
      {
        question: 'How many carats of ruby do I need?',
        answer:
          'Classical guidance is about one carat per 10–12 kg of body weight. A 60 kg adult often starts around 5 carats, but your astrologer may recommend 3–7 carats based on dasha and affordability.',
      },
      {
        question: 'What is the best ruby origin for Jyotish?',
        answer:
          'Burma and Mozambique produce the finest reds. Origin matters less than colour, clarity, naturalness, and proper energisation. A vivid unheated Mozambique ruby often outperforms a poor Burma stone.',
      },
      {
        question: 'When should I start wearing ruby?',
        answer:
          'Begin on a Sunday morning during Shukla Paksha after purification and 108 Surya mantras. Avoid starting during eclipse periods or without chart approval.',
      },
      {
        question: 'Does ruby help with government job success?',
        answer:
          'Ruby is traditionally linked to Surya, which governs authority and government. Many wearers in public service report improved recognition, though results depend on the full chart and effort.',
      },
      {
        question: 'How do I know my ruby is real?',
        answer:
          'Request a certificate from GIA, GRS, or similar. Check for natural inclusions, correct refractive index (~1.76–1.77), and absence of glass-filled flash effects. Reputable sellers welcome re-certification.',
      },
    ],
  }),

  pearl: defineGem({
    slug: 'pearl',
    name: 'Pearl',
    hindi: 'Moti',
    planet: 'Moon',
    extraKeywords: [
      'south sea pearl',
      'basra pearl',
      'chandra ratna',
      'cancer gemstone',
      'natural moti',
      'silver pearl ring',
      'freshwater pearl',
    ],
    intro:
      'Pearl (Moti) embodies the cool, nurturing light of Chandra—the Moon. Unlike mined gems, natural pearls are organic treasures formed within oysters, symbolising emotional balance, intuition, and peace of mind. PureVedicGems sources certified natural pearls with clear disclosure on type, lustre, and Jyotish suitability.',
    hero_benefits: [
      { text: 'Calms anxiety, mood swings, and mental restlessness linked to Chandra' },
      { text: 'Strengthens mother–child bonds and domestic harmony' },
      { text: 'Supports fertility, lactation, and hormonal balance in women' },
      { text: 'Enhances creativity, public appeal, and memory retention' },
    ],
    seo_description:
      'Buy certified natural Pearl (Moti) online for Chandra. South Sea, Basra & saltwater pearls with silver settings, Jyotish guidance & energisation from PureVedicGems.',
    about_html: [
      p(
        'Pearl is an organic gem produced when a mollusc deposits layers of nacre around an irritant. In Sanskrit it is Moti or Mukta, and in Jyotish it is the primary ratna of Chandra—the Moon, ruler of mind, emotions, water, and motherhood.',
        'Fine natural pearls display a deep lustre, orient (iridescent sheen), and round or near-round symmetry. Cultured pearls dominate the market; natural wild pearls are rare and highly valued.',
      ),
      h3('Formation & Origins'),
      p(
        'Saltwater pearls come from Pinctada oysters in the South Pacific, Gulf of Mannar, Persian Gulf (historic Basra), and Japanese akoya beds. Freshwater pearls form in mussels, chiefly in China. South Sea and Tahitian pearls are prized for size and satiny lustre.',
        'Keshi pearls are solid-nacre byproducts of culturing. For Jyotish, round white to cream saltwater pearls with strong lustre are traditionally preferred.',
      ),
      h3('Vedic Significance'),
      p(
        'Chandra governs the mind (manas), mother, fluids, breasts, sleep, and public life. When the Moon is weak, afflicted by Rahu/Ketu, or placed in difficult houses, Moti may be prescribed. Cancer (Karka) rashi and Rohini, Hasta, and Shravana nakshatras are closely linked to pearl.',
        'Pearl is considered sattvic—cooling and pacifying. It is one of the gentler Navaratna gems and is often recommended for children, artists, and those in caring professions.',
      ),
      h3('Natural vs Cultured'),
      p(
        'Truly natural wild pearls are exceptionally rare. Most "natural" pearls in commerce are cultured (nucleated by human intervention but still nacre). Beads of shell, plastic, or coated glass are common fakes. Certification should confirm nacreous structure.',
      ),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '2–10 carats (or 5–10 ratti; lighter body weights may use 2–5 carats)'],
      ['Metal', 'Silver (sterling or fine silver); white gold acceptable'],
      ['Finger', 'Little finger of the right hand'],
      ['Day', 'Monday (Somvar)'],
      ['Time', 'Evening or Monday morning during Chandra hora'],
      ['Mantra', 'Chant "Om Som Somaya Namah" or "Om Shram Shreem Shraum Sah Chandramase Namah" 108 times'],
      ['Purification', 'Soak in raw milk, Gangajal, and white sandalwood paste; offer white flowers'],
    ]),
    who_should_wear_html: [
      p(
        'Pearl suits those with weak, debilitated, or heavily afflicted Moon, especially in the 4th house matters. Cancer ascendants, Moon mahadasha, and natives of Rohini, Hasta, and Shravana often benefit. It is widely prescribed for mental peace and maternal blessings.',
      ),
      h3('When Not to Wear'),
      p(
        'If Chandra is already exalted in Taurus in a favourable house, additional pearl may create emotional passivity or water retention tendencies. Those with severe depression should combine gem therapy with professional care. Confirm compatibility if wearing with opal or moonstone simultaneously.',
      ),
      h3('Consult an Astrologer'),
      p(
        `Chart-specific factors like Chandra–Rahu conjunction or Kemadruma yoga influence whether Moti helps. ${BRAND} recommends personalised guidance before purchase.`,
      ),
    ].join('\n'),
    benefits_html: [
      h3('Emotional & Mental Peace'),
      p(
        'Pearl is the foremost gem for calming an overactive or disturbed mind. It is traditionally worn to reduce insomnia, irrational fears, and emotional volatility, fostering reflective thinking and empathy.',
      ),
      h3('Career & Public Life'),
      p(
        'Chandra rules popularity, travel, and liquids. Pearl supports careers in hospitality, nursing, psychology, music, fashion, and diplomacy. It can soften a harsh public image and improve client relationships.',
      ),
      h3('Health & Fertility'),
      p(
        'Ayurvedic correlation links the Moon to blood, lymph, and reproductive fluids. Women often wear Moti for menstrual regularity, fertility blessings, and postpartum recovery—always alongside medical advice.',
      ),
      h3('Relationships'),
      p(
        'Pearl deepens bonds with the mother and nurtures family harmony. It is a traditional wedding gift in many cultures, symbolising purity and emotional fidelity.',
      ),
      h3('Spiritual Sensitivity'),
      p(
        'A balanced Moon heightens intuition and devotion. Meditating on Chandra mantra with pearl is said to open receptivity to divine grace without the heat of solar gems.',
      ),
    ].join('\n'),
    types_html: [
      h3('Major Types'),
      ul([
        'South Sea: Large, satiny, white to golden—premium astrological choice',
        'Akoya (Japanese): Classic white, high lustre, smaller sizes',
        'Tahitian: Dark exotic colours—less traditional for Jyotish',
        'Freshwater: Affordable; select round, high-lustre specimens',
        'Basra (historic Gulf): Rare natural, collector status',
      ]),
      h3('Colour in Jyotish'),
      p(
        'White to cream with rose or silver overtone is classical. Golden South Sea pearls may suit certain charts connected to Jupiter–Moon yogas. Avoid dyed or coated pearls.',
      ),
      h3('Treatments to Avoid'),
      p(
        'Bleaching, dyeing, and lacquer coating are common. Irradiated pearls change colour unnaturally. Insist on untreated nacre for ratna use.',
      ),
    ].join('\n'),
    quality_price_html: [
      p(
        'Lustre is the primary value driver, followed by shape, size, surface cleanliness, and nacre thickness. Round South Sea pearls command top tiers; baroque shapes cost less but are less ideal for formal Jyotish rings.',
      ),
      h3('Certification'),
      p(
        'X-ray and gemological reports confirm nacreous structure versus imitation. For saltwater cultured pearls, disclosure of nucleation is standard and acceptable when lustre is excellent.',
      ),
      h3('Price Guidance'),
      p(
        'Freshwater entry-level strands start modestly; fine South Sea single pearls range from mid to premium collector grades. Historic natural Basra pearls are auction-level investments.',
      ),
    ].join('\n'),
    jewellery_html: [
      p(
        'Pearl rings in silver on the little finger are standard. The pearl must touch skin—drilled-and-glued studs without metal contact are weaker for Jyotish.',
      ),
      h3('Pendants & Necklaces'),
      p(
        'Single-pearl pendants over the throat or heart are popular for women. Necklaces are ornamental; for therapy, a ring or pendant with direct skin contact is preferred.',
      ),
      h3('Setting Tips'),
      ul([
        'Half-bezel or prong setting with base open to skin',
        'Avoid glue-only fashion settings',
        'Silver enhances Chandra; avoid yellow gold unless astrologer advises',
        'Restring necklaces with silk every 1–2 years',
      ]),
    ].join('\n'),
    cleaning_care_html: [
      h3('Gentle Cleaning'),
      p('Wipe with a damp soft cloth after wear. Mild soap and water if needed. Pearls are soft (2.5–4.5 Mohs)—never use harsh chemicals or ultrasonic cleaners.'),
      h3('Last On, First Off'),
      p('Apply perfume and cosmetics before wearing pearls. Acids and alcohol damage nacre permanently.'),
      h3('Storage'),
      p('Store flat in a breathable pouch—not airtight plastic, which dries nacre. Keep away from other jewellery that can scratch.'),
      h3('Re-Energisation'),
      p('Monday evening Chandra mantra with Gangajal rinse and moonlight exposure (brief, not prolonged).'),
    ].join('\n'),
    buyer_beware_html: [
      p(
        'Imitation pearls of glass, plastic, or shell bead are ubiquitous. "Majorica" and coated beads fail the tooth test and magnification.',
      ),
      h3('Red Flags'),
      ul([
        'Perfectly uniform drill holes with no nacre layers visible',
        'Chalky surface without orient',
        'Price inconsistent with claimed South Sea origin',
        'No mention of cultured vs imitation',
      ]),
      h3('Buy Certified'),
      p(`${BRAND} labels pearl type, origin region, and lustre grade so you know exactly what you wear for Chandra.`),
    ].join('\n'),
    faqs: [
      {
        question: 'Is cultured pearl acceptable for Jyotish?',
        answer:
          'Yes—most astrological pearls today are cultured saltwater pearls with natural nacre. Wild natural pearls are rare. Avoid plastic or coated imitations.',
      },
      {
        question: 'Why is pearl worn in silver?',
        answer:
          'Silver is the traditional metal of Chandra, cooling and receptive. It complements the Moon\'s sattvic nature better than yellow gold for most charts.',
      },
      {
        question: 'Can men wear pearl?',
        answer:
          'Absolutely. Jyotish prescribes Moti by chart, not gender. Men wear pearl rings on the little finger of the right hand in silver for mental clarity and emotional steadiness.',
      },
      {
        question: 'Pearl vs moonstone—which is better for the Moon?',
        answer:
          'Pearl is the primary Navaratna for Chandra. Moonstone is an upratna (substitute). Your astrologer may recommend moonstone if pearl is unsuitable or unavailable.',
      },
      {
        question: 'How do I test a real pearl?',
        answer:
          'Real pearls feel slightly gritty on the tooth (nacre plates), show fine surface texture under magnification, and have depth of lustre. Gem lab X-ray confirms structure.',
      },
      {
        question: 'Which rashi should wear pearl?',
        answer:
          'Cancer is most associated, but pearl is prescribed by chart—not rashi alone. Weak Moon in any lagna may benefit after consultation.',
      },
      {
        question: 'Can pearl be worn with ruby?',
        answer:
          'Sun and Moon are friendly planets. Ruby and pearl combinations appear in Navaratna jewellery; for single-gem therapy, follow your astrologer\'s primary prescription.',
      },
      {
        question: 'What size pearl do I need?',
        answer:
          'Typically 5–10 ratti (roughly 4.5–9 carats) for adults. Smaller sizes suit children or lighter body weights under astrological guidance.',
      },
    ],
  }),

  'red-coral': defineGem({
    slug: 'red-coral',
    name: 'Red Coral',
    hindi: 'Moonga',
    planet: 'Mars',
    extraKeywords: [
      'italian coral',
      'japanese coral',
      'mangal ratna',
      'aries gemstone',
      'scorpio gemstone',
      'moonga ring',
      'natural red coral',
    ],
    intro:
      'Red Coral (Moonga) carries the bold, protective energy of Mangal—Mars. Formed from the skeletal remains of marine polyps, this vivid red organic gem has been worn for centuries to build courage, overcome obstacles, and strengthen physical vitality. PureVedicGems offers natural, undyed corals with origin and treatment transparency.',
    hero_benefits: [
      { text: 'Boosts courage, willpower, and decisive action during Mangal dasha' },
      { text: 'Traditionally worn for blood disorders, energy, and surgical recovery' },
      { text: 'Protects against accidents, enemies, and property disputes' },
      { text: 'Supports land, real estate, and military or sports careers' },
    ],
    seo_description:
      'Buy natural Red Coral (Moonga) online for Mars. Italian & Japanese corals, gold settings, Jyotish consultation & Vedic energisation from PureVedicGems.',
    about_html: [
      p(
        'Red coral is calcium carbonate (aragonite) secreted by Corallium rubrum and related species. In Sanskrit it is Pravala or Moonga, the ratna of Mangal—Mars, planet of energy, war, siblings, and property.',
        'Quality coral shows uniform ox-blood or deep red colour, porcelain-like surface, and absence of cracks or resin fill. It is softer than most gems (3.5 Mohs) and must be protected from chemicals.',
      ),
      h3('Origins'),
      p(
        'Mediterranean coral from Italy (Sardinia, Torre del Greco) is historically prized. Japanese and Taiwanese corals also enter the trade. Deep red ox-blood Italian coral commands premium prices.',
      ),
      h3('Vedic Significance'),
      p(
        'Mars rules blood, muscles, courage, brothers, and landed assets. Afflicted Mars may respond to Moonga. Aries and Scorpio rashis, and Mrigashira, Chitra, and Dhanishta nakshatras, are linked to coral.',
      ),
      h3('Astrological Use'),
      p(
        'Unlike transparent gems, coral is opaque; Jyotish values rich colour and polish over clarity. Triangular and oval cabochons are common. Weight is often measured in rattis due to lower specific gravity.',
      ),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '5–9 carats (5–9 ratti)'],
      ['Metal', 'Yellow gold or copper; Panchdhatu also used'],
      ['Finger', 'Ring finger of the right hand'],
      ['Day', 'Tuesday (Mangalvar)'],
      ['Time', 'Morning, first hour after sunrise during Mangal hora'],
      ['Mantra', 'Chant "Om Kraum Kreem Kraum Sah Bhaumaya Namah" 108 times'],
      ['Purification', 'Wash with Gangajal, turmeric water, and offer red flowers to Hanuman'],
    ]),
    who_should_wear_html: [
      p(
        'Moonga benefits those with weak, debilitated, or combust Mars, or during Mangal mahadasha. Aries and Scorpio ascendants frequently wear coral. Athletes, surgeons, and real estate professionals often seek Mangal support.',
      ),
      h3('When Not to Wear'),
      p(
        'Avoid if Mars is already exalted in Capricorn without affliction—excess heat may cause aggression. Pregnant women and those with uncontrolled hypertension should seek medical counsel first.',
      ),
      h3('Consult an Astrologer'),
      p(`Mangal dosha does not automatically require coral. ${BRAND} advises chart review before prescribing Moonga.`),
    ].join('\n'),
    benefits_html: [
      h3('Courage & Career'),
      p('Coral instils fearlessness and rapid execution—valued by entrepreneurs, athletes, and those facing litigation or competitive exams.'),
      h3('Health & Blood'),
      p('Traditional texts associate Moonga with blood vitality and recovery from surgery. It complements medical care for energy and circulation.'),
      h3('Property & Assets'),
      p('Mars governs land and construction. Coral is recommended for property delays and inheritance disputes.'),
      h3('Relationships'),
      p('Balanced Mars improves healthy assertiveness and may form part of Mangal dosha remedial plans.'),
      h3('Spiritual Protection'),
      p('Tuesday Hanuman worship with Moonga is a widespread protective practice across India.'),
    ].join('\n'),
    types_html: [
      h3('Origin Varieties'),
      ul([
        'Italian (Mediterranean): Deep red, finest for Jyotish',
        'Japanese: Bright red to pinkish, good lustre',
        'Taiwanese: Commercial grades; verify dye',
        'Sponge coral: Porous, lower grade',
      ]),
      h3('Shapes'),
      p('Oval cabochon, round, and triangular (tikona) Moonga are popular. Smooth polish without pits is essential.'),
      h3('Treatments'),
      p('Bleaching, dyeing, and epoxy filling are common frauds. Natural colour should be even throughout the piece.'),
    ].join('\n'),
    quality_price_html: [
      p('Colour depth, uniformity, and surface smoothness drive price. Italian ox-blood coral sits at premium tiers.'),
      h3('Certification'),
      p('Reports confirm natural origin versus plastic or dyed limestone. Magnification reveals wood-grain-like structure.'),
      h3('Price Guidance'),
      p('Fine Italian Moonga ranges from mid to premium per ratti. Entry-level Asian coral costs less but must be verified undyed.'),
    ].join('\n'),
    jewellery_html: [
      p('Gold rings on the ring finger are standard. Open-back cabochon setting ensures skin contact.'),
      h3('Durability Notes'),
      ul([
        'Remove during gym, swimming, and household chemicals',
        'Coral scratches easily—separate storage',
        'Repolish worn surfaces periodically',
      ]),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Damp soft cloth only. No ultrasonic, steam, or ammonia.'),
      h3('Chemical Avoidance'),
      p('Perfume and cleaning agents permanently damage coral surface.'),
      h3('Re-Energisation'),
      p('Tuesday morning Hanuman prayer with Gangajal rinse.'),
      h3('Replacement'),
      p('Organic coral gradually abrades—plan for periodic replacement with daily wear.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Plastic, dyed bamboo, and stained limestone are sold as Moonga. Reconstituted coral is not suitable for Jyotish.'),
      h3('Red Flags'),
      ul([
        'Uniform colour with no natural texture',
        'Bubbles in plastic imitations',
        'Price far below market for claimed Italian origin',
      ]),
      h3('Ethical Sourcing'),
      p(`${BRAND} prioritises legally harvested coral with full disclosure.`),
    ].join('\n'),
    faqs: [
      { question: 'Italian vs Japanese coral—which is better?', answer: 'Italian ox-blood coral is traditionally preferred. Fine Japanese coral is also effective if colour is rich and natural.' },
      { question: 'Why wear Moonga on Tuesday?', answer: 'Tuesday is ruled by Mars. First wearing during Mangal hora aligns the gem with the planet\'s frequency.' },
      { question: 'Can red coral remove Mangal dosha?', answer: 'Coral may be part of remedial measures but does not automatically cancel Kuja dosha. Full chart analysis is needed.' },
      { question: 'Is triangular coral more powerful?', answer: 'Tikona Moonga is symbolically linked to Mars. Oval and round shapes are equally valid if quality is superior.' },
      { question: 'How many rattis of Moonga?', answer: '5–9 rattis is common for adults. Your astrologer adjusts based on body weight and dasha.' },
      { question: 'Can I wear coral with emerald?', answer: 'Mars and Mercury are compatible. Navaratna settings often combine them; follow your primary prescription for therapy.' },
      { question: 'Does coral fade?', answer: 'Natural coral can dull from chemicals and abrasion. Sudden fading may indicate dye.' },
      { question: 'Is sponge coral OK?', answer: 'Dense, polished ox-blood coral is preferred over porous sponge coral for Mangal strengthening.' },
    ],
  }),

  emerald: defineGem({
    slug: 'emerald',
    name: 'Emerald',
    hindi: 'Panna',
    planet: 'Mercury',
    extraKeywords: ['colombian emerald', 'zambian emerald', 'budh ratna', 'gemini gemstone', 'virgo gemstone', 'panna ring', 'minor oil emerald'],
    intro:
      'Emerald (Panna) channels the quicksilver intelligence of Budh—Mercury. This verdant beryl sharpens wit, communication, and commercial acumen. PureVedicGems curates natural emeralds with honest treatment disclosure for discerning Jyotish buyers.',
    hero_benefits: [
      { text: 'Enhances speech, writing, negotiation, and analytical thinking' },
      { text: 'Supports education, exams, accounting, and IT careers' },
      { text: 'Traditionally worn for nervous system balance and skin health' },
      { text: 'Improves business partnerships and intellectual confidence' },
    ],
    seo_description:
      'Buy certified natural Emerald (Panna) online for Budh. Colombian & Zambian emeralds with treatment disclosure & Jyotish guidance from PureVedicGems.',
    about_html: [
      p(
        'Emerald is green beryl coloured by chromium and vanadium. In Jyotish it is the ratna of Budh—Mercury, planet of intellect, trade, and speech. Fine emeralds show vivid green; jardin inclusions are natural and accepted when colour is strong.',
        'Colombia, Zambia, Brazil, and Pakistan (Swat) are major sources. Almost all emeralds are oiled—disclosure is essential.',
      ),
      h3('Vedic Significance'),
      p('Mercury rules the nervous system, skin, lungs, and commerce. Gemini and Virgo rashis, and Ashlesha, Jyeshtha, and Revati nakshatras, resonate with Panna.'),
      h3('Treatment Reality'),
      p('Minor cedarwood oil is industry-standard. Resin filling and synthetics must be avoided for ratna use.'),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '3–6 carats'],
      ['Metal', 'Yellow gold or Panchdhatu'],
      ['Finger', 'Little finger of the right hand'],
      ['Day', 'Wednesday (Budhvar)'],
      ['Time', 'Sunrise during Budh hora'],
      ['Mantra', 'Chant "Om Braam Breem Braum Sah Budhaya Namah" 108 times'],
      ['Purification', 'Gangajal with tulsi leaves; offer green moong dal'],
    ]),
    who_should_wear_html: [
      p('Panna suits weak, debilitated, or combust Mercury and Mercury mahadasha. Gemini and Virgo ascendants, teachers, lawyers, and traders commonly wear emerald.'),
      h3('When Not to Wear'),
      p('Avoid if Budh is already exalted and dominant without affliction. Confirm if Mercury rules difficult houses.'),
      h3('Consult an Astrologer'),
      p(`${BRAND} matches Panna quality to your chart and budget after proper analysis.`),
    ].join('\n'),
    benefits_html: [
      h3('Intellect & Education'),
      p('Emerald improves memory, reasoning, and articulate expression for students and researchers.'),
      h3('Business & Finance'),
      p('Budh governs trade and contracts. Panna supports consulting, trading, and startup pitching.'),
      h3('Health'),
      p('Linked traditionally to nerves, respiration, and skin—complementary to medical care.'),
      h3('Communication'),
      p('Clear Mercury improves diplomacy in marriage and public speaking confidence.'),
      h3('Spiritual Discernment'),
      p('Mercury mantras with Panna sharpen scriptural study and viveka (discrimination).'),
    ].join('\n'),
    types_html: [
      h3('Origins'),
      ul(['Colombian: Velvety green, premium', 'Zambian: Bluish-green, often cleaner', 'Brazilian & Swat: Varied fine grades', 'Ethiopian: Verify treatment carefully']),
      h3('Natural vs Treated'),
      p('Accept minor oil if disclosed. Avoid heavy resin, dye, and synthetics.'),
    ].join('\n'),
    quality_price_html: [
      p('Colour drives value more than clarity. Colombian fine gems reach collector tiers; Zambian offers mid-to-high value.'),
      h3('Certification'),
      p('GIA, Gubelin, SSEF reports must describe oil/resin treatment.'),
      h3('Price Guidance'),
      p('Entry-level commercial to premium collector grades per carat depending on origin and enhancement.'),
    ].join('\n'),
    jewellery_html: [
      p('Gold ring on little finger. Protect emerald in bezel setting—brittle despite hardness.'),
      h3('Setting Tips'),
      ul(['Bezel protects girdle', 'Open back for skin contact', 'Wednesday energisation before first wear']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Gentle Care'),
      p('Lukewarm water and soft cloth. No ultrasonic or steam.'),
      h3('Oil Maintenance'),
      p('Jeweller can re-oil traditionally if inclusions whiten.'),
      h3('Re-Energisation'),
      p('Wednesday Budh mantra with tulsi water rinse.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Synthetics, green glass, and dyed beryl are common. Tourmaline substitutes abound.'),
      h3('Red Flags'),
      ul(['Flawless at low price', 'No treatment on certificate', 'Flux inclusions in synthetics']),
      h3('Buy with Disclosure'),
      p(`${BRAND} states origin, oil status, and Jyotish grade on every Panna.`),
    ].join('\n'),
    faqs: [
      { question: 'Is oiled emerald OK for astrology?', answer: 'Minor traditional oil is widely accepted when disclosed. Avoid resin-filled or dyed stones.' },
      { question: 'Colombian or Zambian?', answer: 'Colombian sets colour standard; Zambian offers beauty and durability. Chart suitability matters most.' },
      { question: 'Which finger for Panna?', answer: 'Little finger of right hand in gold is classical Budh placement.' },
      { question: 'Why are emeralds included?', answer: 'Natural jardin is expected. Colour and lustre matter more than flawless clarity for Jyotish.' },
      { question: 'Emerald vs peridot?', answer: 'Emerald is primary Navaratna; peridot is semi-precious substitute.' },
      { question: 'Can students wear Panna?', answer: 'Yes, if Budh is favourable—especially during exams or Mercury dasha after consultation.' },
      { question: 'How fragile is emerald?', answer: '7.5–8 Mohs but brittle. Protective settings extend life.' },
      { question: 'Can emerald help speech?', answer: 'Traditionally supports speech and nerves; medical therapy remains essential.' },
    ],
  }),

  'yellow-sapphire': defineGem({
    slug: 'yellow-sapphire',
    name: 'Yellow Sapphire',
    hindi: 'Pukhraj',
    planet: 'Jupiter',
    extraKeywords: [
      'ceylon pukhraj',
      'sri lanka yellow sapphire',
      'guru ratna',
      'sagittarius gemstone',
      'pisces gemstone',
      'unheated pukhraj',
      'yellow sapphire price',
      'pukhraj price',
      'pukhraj benefits',
    ],
    intro:
      'Yellow Sapphire (Pukhraj) radiates the benevolent wisdom of Guru—Jupiter. Among the most auspicious Navaratna gems, a fine natural Pukhraj is sought for prosperity, marriage blessings, and spiritual growth. PureVedicGems selects Ceylon and other origins with heat-treatment disclosure and Jyotish grading.',
    hero_benefits: [
      { text: 'Attracts wealth, wisdom, and righteous expansion of fortune' },
      { text: 'Traditionally worn for marriage, children, and relationship harmony' },
      { text: 'Supports law, teaching, finance, and advisory careers' },
      { text: 'Pacifies afflicted Guru during challenging dasha periods' },
    ],
    seo_description:
      'Buy certified Yellow Sapphire (Pukhraj) online. Price depends on origin, heat, and carat. Ceylon unheated options with Jyotish guidance from PureVedicGems.',
    about_html: [
      p(
        'Yellow sapphire is corundum coloured by iron traces. Sanskrit: Pukhraj or Pushparaga. It is the ratna of Brihaspati—Jupiter, planet of wisdom, dharma, children, and wealth.',
        'Fine stones show medium to strong yellow without brown or green dominance. Sri Lanka (Ceylon) is the benchmark origin; Thailand, Madagascar, and Australia also produce yellow sapphires.',
      ),
      h3('Vedic Significance'),
      p('Guru rules the 2nd, 5th, 9th, and 11th house matters—wealth, progeny, fortune, and higher knowledge. Sagittarius and Pisces rashis, and Punarvasu, Vishakha, and Purva Bhadrapada nakshatras, align with Pukhraj.'),
      h3('Quality for Jyotish'),
      p('Transparency, even colour, and minimal treatment are prized. Unheated Ceylon yellow sapphires are the astrological ideal when budget allows.'),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '3–7 carats (≈1 carat per 10–12 kg body weight)'],
      ['Metal', 'Yellow gold (22K traditional)'],
      ['Finger', 'Index finger of the right hand'],
      ['Day', 'Thursday (Guruvar)'],
      ['Time', 'Morning during Guru hora, Shukla Paksha preferred'],
      ['Mantra', 'Chant "Om Graam Greem Graum Sah Guruve Namah" or "Om Brim Brihaspataye Namah" 108 times'],
      ['Purification', 'Raw milk, turmeric, Gangajal; offer yellow flowers and chant Guru stotra'],
    ]),
    who_should_wear_html: [
      p('Pukhraj benefits weak, debilitated, or combust Jupiter, and Guru mahadasha. Sagittarius and Pisces ascendants, seekers of marriage and progeny, and educators often wear yellow sapphire.'),
      h3('When Not to Wear'),
      p('If Guru is already exalted in Cancer and strongly benefic, additional Pukhraj may cause weight gain or over-optimism. Avoid if Jupiter rules the 6th, 8th, or 12th without specific prescription.'),
      h3('Consult an Astrologer'),
      p(`${BRAND} strongly recommends chart review—Pukhraj is powerful and should match dasha and transits.`),
    ].join('\n'),
    benefits_html: [
      h3('Wealth & Prosperity'),
      p('Jupiter is the great benefic. Pukhraj is worn to expand lawful income, investments, and family prosperity.'),
      h3('Marriage & Children'),
      p('Guru governs husband in female charts and progeny. Yellow sapphire is the classic remedy for delayed marriage and conception blessings.'),
      h3('Career & Wisdom'),
      p('Law, academia, banking, counselling, and spiritual teaching flourish under balanced Guru energy.'),
      h3('Health'),
      p('Traditionally linked to liver, fat metabolism, and hip region—complementary to medical guidance.'),
      h3('Spiritual Growth'),
      p('Pukhraj supports dharma, pilgrimage, guru devotion, and study of sacred texts.'),
    ].join('\n'),
    types_html: [
      h3('Origins'),
      ul(['Ceylon (Sri Lanka): Classic lemon to golden yellow', 'Madagascar: Fine yellows at varied price points', 'Thailand: Heat-treated commercial grades', 'Australia: Parti colours—verify suitability']),
      h3('Colour Varieties'),
      p('Lemon yellow, golden yellow, and canary yellow. Avoid brownish or overly pale stones for Jyotish.'),
      h3('Treatment'),
      p('Prefer unheated. Beryllium diffusion and lattice diffusion must be avoided for ratna use.'),
    ].join('\n'),
    quality_price_html: [
      p('Colour saturation, clarity, carat, and heating status define price. Unheated Ceylon Pukhraj reaches premium collector tiers.'),
      h3('Certification'),
      p('Insist on natural corundum with treatment statement. GRS "no heat" designation adds value.'),
      h3('Price Guidance'),
      p('From entry-level heated commercial stones to premium unheated Ceylon gems—budget across wide ranges per carat.'),
    ].join('\n'),
    jewellery_html: [
      p('Gold ring on index finger is canonical. Open setting with skin contact is mandatory.'),
      h3('Alternatives'),
      p('Pendants over manipura (solar plexus) are secondary. Navaratna bracelets include Pukhraj among nine stones.'),
      h3('Setting Tips'),
      ul(['22K gold traditional', 'Thursday energisation', 'Avoid white metal unless astrologer advises']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Routine'),
      p('Warm soapy water and soft brush. Sapphire is durable (9 Mohs).'),
      h3('Storage'),
      p('Separate from softer gems. Sapphire can scratch most other stones.'),
      h3('Re-Energisation'),
      p('Thursday Guru mantra, turmeric water rinse, yellow flower offering.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Citrine, yellow topaz, and synthetic corundum are sold as Pukhraj. Yellow glass is common in tourist markets.'),
      h3('Red Flags'),
      ul(['Too bright neon yellow at low cost', 'No lab certificate', 'Seller calls citrine "Pukhraj"']),
      h3('Verify'),
      p(`${BRAND} certifies every yellow sapphire as natural corundum with treatment disclosure.`),
    ].join('\n'),
    faqs: [
      { question: 'What does Yellow Sapphire (Pukhraj) cost?', answer: 'Price follows carat, colour, clarity, origin, and heat treatment. Unheated Ceylon Pukhraj costs more per carat than heated commercial grades. Compare live listings and ask for the lab report before buying.' },
      { question: 'What are the traditional benefits of Pukhraj?', answer: 'In Jyotish, Pukhraj is worn to support Jupiter themes: wisdom, lawful prosperity, marriage, and teachers. Benefits are traditional, not medical, and depend on chart suitability.' },
      { question: 'Who should wear Yellow Sapphire?', answer: 'Typically those with weak or afflicted Jupiter after a full Kundli review. Do not wear Pukhraj only because it is your birthstone. Book a recommendation if unsure.' },
      { question: 'Which finger for Pukhraj?', answer: 'Index finger of the right hand in gold is the classical Guru placement.' },
      { question: 'Can unmarried women wear yellow sapphire?', answer: 'Yes—Pukhraj is traditionally worn for marriage blessings when Guru is favourable in the chart.' },
      { question: 'Pukhraj vs topaz?', answer: 'Yellow sapphire is corundum (Navaratna). Yellow topaz is a different mineral—substitute only when prescribed.' },
      { question: 'Does Pukhraj help pregnancy?', answer: 'Traditionally worn for progeny and Guru blessings. Medical fertility treatment is primary; gem is complementary.' },
      { question: 'Unheated vs heated?', answer: 'Unheated natural is preferred for Jyotish. Disclosed heat-only may be acceptable to some astrologers.' },
      { question: 'Can I wear Pukhraj with neelam?', answer: 'Jupiter and Saturn have a complex relationship. Do not combine without explicit astrological prescription.' },
      { question: 'Best origin?', answer: 'Ceylon (Sri Lanka) is the traditional benchmark. Fine Madagascar stones also perform well.' },
      { question: 'How soon do results show?', answer: 'Jyotish gems work gradually over weeks to months depending on dasha, quality, and ritual correctness.' },
    ],
  }),

  diamond: defineGem({
    slug: 'diamond',
    name: 'Diamond',
    hindi: 'Heera',
    planet: 'Venus',
    extraKeywords: ['natural heera', 'shukra ratna', 'libra gemstone', 'taurus gemstone', 'vs1 diamond', 'vedic diamond ring'],
    intro:
      'Diamond (Heera) captures the refined splendour of Shukra—Venus, planet of beauty, luxury, and creative harmony. A natural, well-cut diamond is among the most coveted Navaratna gems for artistic success, marital bliss, and refined taste. PureVedicGems offers disclosed natural diamonds suited to Jyotish wear.',
    hero_benefits: [
      { text: 'Enhances charm, artistic talent, and luxury industry success' },
      { text: 'Traditionally worn for marital harmony and romantic fulfilment' },
      { text: 'Supports fashion, film, hospitality, and design careers' },
      { text: 'Strengthens Shukra for reproductive and hormonal balance' },
    ],
    seo_description:
      'Buy certified natural Diamond (Heera) online for Shukra. VS clarity diamonds, white gold settings & Jyotish energisation from PureVedicGems.',
    about_html: [
      p(
        'Diamond is crystalline carbon, the hardest natural substance (10 Mohs). Sanskrit: Heera or Vajra. In Jyotish it is the primary ratna of Shukra—Venus, governing love, arts, vehicles, and sensual pleasures.',
        'Fine diamonds show exceptional brilliance, fire, and scintillation. Natural diamonds form deep in the mantle over billions of years.',
      ),
      h3('Vedic Significance'),
      p('Venus rules Taurus and Libra, marriage, semen/ovum, kidneys, and the face. Bharani, Purva Phalguni, and Purva Ashadha nakshatras connect to Heera. Weak or afflicted Shukra may be strengthened with a natural diamond.'),
      h3('Jyotish vs Fashion Diamonds'),
      p('Astrological diamonds need not be D-flawless investment grade. A clean natural stone with good brilliance and proper energisation often suffices. Lab-grown diamonds are not used for classical Jyotish ratna therapy.'),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '0.5–1.5 carats (diamond is dense; smaller weight than other ratnas)'],
      ['Metal', 'Silver, white gold, or platinum'],
      ['Finger', 'Middle finger or little finger of the right hand'],
      ['Day', 'Friday (Shukravar)'],
      ['Time', 'Early morning or evening during Shukra hora'],
      ['Mantra', 'Chant "Om Dram Dreem Draum Sah Shukraya Namah" 108 times'],
      ['Purification', 'Raw milk, rose water, Gangajal, and white sandalwood paste'],
    ]),
    who_should_wear_html: [
      p('Heera suits weak, debilitated, or combust Venus, and Shukra mahadasha. Taurus and Libra ascendants, artists, designers, and those seeking marriage harmony often wear diamond.'),
      h3('When Not to Wear'),
      p('Avoid if Venus is already exalted in Pisces with strong benefic influence without need. Confirm if Venus rules dusthana houses.'),
      h3('Consult an Astrologer'),
      p(`${BRAND} advises whether Heera or white sapphire (Safed Pukhraj) better suits your chart and budget.`),
    ].join('\n'),
    benefits_html: [
      h3('Love & Marriage'),
      p('Diamond is the classic Venus gem for attraction, marital peace, and resolving conjugal friction when Shukra is weak.'),
      h3('Arts & Luxury'),
      p('Film, music, fashion, jewellery, and luxury retail benefit from Shukra strengthening.'),
      h3('Health & Beauty'),
      p('Traditionally linked to reproductive health, complexion, and kidney function—alongside medical care.'),
      h3('Wealth & Comfort'),
      p('Venus governs vehicles, ornaments, and sensual comforts. Heera supports refined prosperity.'),
      h3('Spiritual Devotion'),
      p('Shukra also rules devotion to Lakshmi and artistic seva. Friday Lakshmi puja with Heera is common.'),
    ].join('\n'),
    types_html: [
      h3('Categories'),
      ul(['Natural mined: Only type for classical Jyotish', 'Lab-grown: Not used for traditional ratna therapy', 'Coloured diamonds: Fancy colours are ornamental, not classical Heera']),
      h3('Cut & Clarity'),
      p('Round brilliant maximises fire. VS-SI clarity with good cut is often sufficient for astrology. Avoid heavily included stones.'),
      h3('Certification'),
      p('GIA/IGI should state natural origin. "Laboratory-grown" must be rejected for Jyotish.'),
    ].join('\n'),
    quality_price_html: [
      p('Cut, colour, clarity, and carat (4Cs) define price. Astrological diamonds balance brilliance with affordability—flawless investment gems are optional.'),
      h3('Price Guidance'),
      p('Entry-level natural diamonds to premium investment grades—a wide per-carat range. Smaller high-quality stones often suit Jyotish better than large included ones.'),
    ].join('\n'),
    jewellery_html: [
      p('White gold or silver ring on middle or little finger. Prong setting with open culet touching skin.'),
      h3('Engagement vs Jyotish'),
      p('Engagement rings may differ from astrological settings. Ensure a dedicated Jyotish ring if prescribed separately.'),
      h3('Tips'),
      ul(['Friday energisation', 'White metals preferred', 'Protect from grease—which dulls fire']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm soapy water and soft brush restore fire. Professional steam OK for natural diamonds without fractures.'),
      h3('Handling'),
      p('Diamonds attract grease from skin—regular cleaning maintains brilliance.'),
      h3('Re-Energisation'),
      p('Friday Shukra mantra with rose water rinse.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Moissanite, cubic zirconia, and lab-grown stones are passed off as Heera. HPHT/CVD diamonds require lab detection.'),
      h3('Red Flags'),
      ul(['No natural origin on certificate', 'Price impossibly low for claimed carat', 'No refund for independent lab check']),
      h3('Verify Natural'),
      p(`${BRAND} certifies natural origin and discloses any treatment on every Heera listing.`),
    ].join('\n'),
    faqs: [
      { question: 'Lab-grown diamond for Jyotish?', answer: 'Classical Jyotish prefers natural mined diamonds. Lab-grown lacks the geological formation tradition associates with ratna power.' },
      { question: 'Heera vs white sapphire?', answer: 'Diamond is primary Shukra ratna. White sapphire is the traditional Vedic substitute when budget or chart dictates.' },
      { question: 'Which finger for diamond?', answer: 'Middle or little finger of right hand in white metal—confirm with your astrologer.' },
      { question: 'Minimum carat for astrology?', answer: 'Often 0.5–1 carat due to density and cost. Your astrologer may specify based on body weight formula.' },
      { question: 'Can diamond help marriage?', answer: 'Traditionally worn for Shukra-related marital harmony when Venus is weak—not a universal remedy.' },
      { question: 'Friday wearing rules?', answer: 'Purify on Shukravar during Shukra hora, chant Shukra mantra 108 times, then wear.' },
      { question: 'Is SI clarity OK?', answer: 'Yes, if eye-clean and natural. Astrological use prioritises naturalness and brilliance over flawless grading.' },
      { question: 'Diamond with yellow sapphire?', answer: 'Venus and Jupiter are friends. Often compatible—confirm with chart analysis.' },
    ],
  }),

  'blue-sapphire': defineGem({
    slug: 'blue-sapphire',
    name: 'Natural Blue Sapphire Stone',
    hindi: 'Neelam Stone',
    planet: 'Saturn',
    extraKeywords: [
      'neelam stone',
      'neelam stone price',
      'light blue sapphire',
      'blue star sapphire',
      'royal blue sapphire',
      'natural blue sapphire',
      'natural blue sapphire stone',
      'cornflower blue sapphire',
      'cornflower blue sapphire stone',
      'ceylon cornflower blue sapphire',
      'blue sapphire stone',
      'original blue sapphire stone',
      'kashmir neelam',
      'ceylon blue sapphire',
      'shani ratna',
      'capricorn gemstone',
      'aquarius gemstone',
      'unheated neelam',
      'blue sapphire price',
      'neelam price',
      'neelam benefits',
    ],
    seo_title: 'Buy Neelam Stone | Natural Blue Sapphire | PureVedicGems',
    seo_description:
      'Neelam stone price for natural blue sapphire stone: royal blue sapphire, light blue sapphire, cornflower blue sapphire, blue star sapphire.',
    intro:
      'Natural Blue Sapphire Stone (Neelam Stone) is Saturn’s gem. Fine natural neelam needs a chart reading and a three-day trial before you wear it. PureVedicGems lists certified, treatment-disclosed sapphires and will not skip that check.',
    hero_benefits: [
      { text: 'Strengthens Shani for career' },
      { text: 'Supports land and structure' },
      { text: 'Worn in Sade Sati with guidance' },
      { text: 'Promotes focus and protection' },
    ],
    about_html: [
      p(
        'A natural blue sapphire stone is blue corundum. Iron and titanium give the colour. In Hindi it is a neelam stone (Neelam or Neelashma). Vedic astrology treats this gem as the ratna of Shani — Saturn. Cornflower blue sapphire is a colour grade of that same stone: bright, velvety true-blue, not a different mineral.',
        'Kings once kept a natural blue sapphire for courage and clear sight. Buyers still look for that velvety blue. Kashmir, Sri Lanka, Madagascar, and Myanmar supply the best known material. The rarest hue is cornflower blue sapphire.',
        'Therefore you should treat a natural blue sapphire stone as a prescribed remedy, not a casual fashion buy. Results can arrive fast. They can also feel harsh if Saturn is weak or angry in the chart.',
      ),
      h3('Vedic Significance'),
      p(
        'Saturn rules Capricorn and Aquarius. He also rules time, labour, iron, bones, and long tests. Pushya, Anuradha, and Uttara Bhadrapada link to neelam in many classical lists.',
        'As a result, a neelam stone is often named during Shani mahadasha or Sade Sati. Still, those periods do not always need neelam. First get a Jyotish reading. Then decide.',
      ),
      h3('Caution'),
      p(
        'Unlike gentler gems, you test a neelam stone before a final ring. Tie or tape it to the body for three days. Watch sleep, mood, and events. If the trial feels wrong, stop.',
        `Never wear a neelam stone without expert approval. ${BRAND} treats that rule as non-negotiable.`,
      ),
      h2('Rarity and Legacy of Blue Sapphire'),
      p(
        'Kashmir set the standard for cornflower blue sapphire. A fine Kashmir stone shows a medium to medium-dark blue with a soft, velvety look. Sri Lanka (Ceylon) is now the practical source for most Jyotish-quality gems.',
        'In addition, a few stones hold silk that can form a star when cut as a cabochon. That star sapphire is rare. Most jewellery uses a faceted natural blue sapphire stone. The finest colour in that cut is cornflower blue sapphire.',
        'People in the East also call it Neelamani, Indraneel, and Indraneelam. The names change. The need for a natural, disclosed stone does not.',
        'Kings once kept a natural blue sapphire for courage and clear sight. Today the same hue still signals authority. So rarity is not a slogan here. It is why we disclose origin and heat on every listing.',
      ),
      h2('What customers say about blue sapphire'),
      p(
        'People do not write to us about a “quick miracle”. They write about the process: chart first, trial next, then a ring they can wear every Saturday.',
        'If you want that same path, read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a stone. We would rather lose a sale than set the wrong blue sapphire.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p(
        'Wear a natural blue sapphire stone only after the trial and the chart check. The table below is the PureVedicGems Jyotish pattern. Your astrologer may adjust finger, metal, or weight.',
      ),
      table([
        ['Weight', 'Generally 2–5 carats. Confirm with Jyotish — neelam is potent even at modest size.'],
        ['Colour', 'Bright medium to dark blue. Cornflower blue sapphire is preferred. Royal blue sapphire is acceptable if it is not inky. Avoid a weak light blue sapphire for Jyotish.'],
        ['Metal', 'Silver, white gold, or Panchdhatu. Not copper. Follow your astrologer.'],
        ['Finger', 'Middle finger of the right hand (working hand).'],
        ['Day', 'Saturday (Shanivar)'],
        ['Time', 'Evening during Shani hora'],
        ['Mantra', 'Chant “Om Pram Prim Proum Sah Shanaye Namah” or “Om Sham Shanicharaya Namah” 108 times'],
        ['Purification', 'Gangajal, sesame oil rinse, black sesame offering, and a mustard oil lamp'],
      ]),
      p(
        'First cleanse the stone. Then chant. Then set it so the gem can touch skin. Also keep a record of the wearing date. You will want that note if you later change the setting.',
      ),
    ].join('\n'),
    who_should_wear_html: [
      p(
        'A neelam stone suits many Capricorn (Makar) and Aquarius (Kumbh) charts when Saturn should be strengthened. It can also suit people in Shani mahadasha when Saturn is dignified.',
        'Indian astrology names Neelam for Makar and Kumbh. Other rashis only qualify when the full chart says so. Rashi lists are a start. The horoscope decides.',
      ),
      h3('When a Natural Blue Sapphire Stone May Help'),
      ul([
        'Capricorn or Aquarius lagna with a Saturn that needs support',
        'Shani mahadasha or Sade Sati after an astrologer confirms neelam',
        'Careers in law, mining, research, government, and long industrial work',
        'People who need more patience, structure, and follow-through',
      ]),
      h3('When Not to Wear'),
      p(
        'Avoid a natural blue sapphire stone if Shani is badly placed in a dusthana with no relief. Also stop if the trial brings sudden fear, conflict, or illness. Do not buy neelam because a friend wears one.',
      ),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review and a trial before the final setting. Book a <a href="/consultation">consultation</a> if you are unsure. Then shop the <a href="/knowledge/gem-qualities/blue-sapphire">blue sapphire quality guide</a> so you can read colour, heat, and origin with clear eyes.`,
      ),
      h3('Click here to know if blue sapphire suits you'),
      p(
        'Do not guess. A short chart review tells you whether to trial a neelam stone, wait, or pick another Saturn substitute. <a href="/consultation">Ask an expert</a> before you add a stone to the cart.',
      ),
    ].join('\n'),
    benefits_html: [
      p(
        'People wear a neelam stone for Saturn’s themes: work, time, and endurance. The benefits below are traditional Jyotish uses. They are not medical claims. Results still depend on a real stone and a correct prescription.',
      ),
      h3('Success in business, jobs, and independent projects'),
      p(
        'Saturn pays for finished work. A well-chosen neelam is worn to break career stalls. Then effort starts to show. This helps jobs, firms, and solo projects that need long focus.',
      ),
      h3('Surging Fortunes'),
      p(
        'One hoped-for gift of neelam is a turn in sliding luck. It is said to open slower, more stable wealth — land, salary, and built assets — rather than quick speculation.',
      ),
      h3('Extended Fame & Popularity'),
      p(
        'Hard work needs witnesses. As a result, people wear this gem so talent gets seen in office, art, or public life. Fame here means earned notice, not empty noise.',
      ),
      h3('Reoriented Discipline, Patience, and Detachment'),
      p(
        'Saturn teaches routine. Wearers often seek a calmer work ethic. Neelam is the gem people pick when they want fewer delays caused by their own scattered habits.',
      ),
      h3('Overcome Obstacles'),
      p(
        'For Sade Sati or Dhaiya, a prescribed neelam is used to soften blocks. It does not erase karma. It is worn to meet tests with more backbone.',
      ),
      h3('Stronger Mind, Bones, and Senses'),
      p(
        'Texts link Saturn to bones, nerves, and teeth. Some people therefore wear neelam beside medical care for joint pain or low mood. See a doctor for health. Use the gem only as a traditional support.',
      ),
    ].join('\n'),
    types_html: [
      p(
        'Not every natural blue sapphire stone is equal. Origin, colour, heat, and cut change both price and Jyotish fitness. Use the notes below before you filter the collection.',
      ),
      h3('Origins'),
      ul([
        'Kashmir: velvety cornflower blue — rare, collector grade, and the dearest natural blue sapphire stone',
        'Ceylon (Sri Lanka): bright, lively blue — the usual fine Jyotish source; some stones reach cornflower blue sapphire colour',
        'Myanmar (Burma): strong hue; always check heat and origin reports',
        'Madagascar: deep blues in good size; verify treatment',
        'Thailand and others: often darker; many are heated or diffused',
      ]),
      h3('Colour'),
      p(
        'Aim for true blue — not too violet, not grey, not inky. That look is what the trade calls cornflower blue sapphire. The stone should look vivid in daylight and still alive in indoor light. In Hindi, a deep natural blue sapphire stone is often called Indraneelam.',
      ),
      h2('Cornflower Blue Sapphire Colour'),
      p(
        'Cornflower blue sapphire sits between pale watery blue and inky black-blue. It is bright, medium to medium-dark, and a little velvety. Kashmir made the name famous. Fine Ceylon material can also reach this hue.',
        'Astrologers often prefer cornflower blue sapphire because the colour stays lively without looking inky or washed. Too dark a stone can look sleepy. Too light a stone can look pale. Hold the gem in north daylight and then indoors. A real cornflower blue sapphire keeps its blue in both.',
        'So if a listing says royal blue sapphire it may be darker. If it says cornflower blue sapphire you should still check saturation and heat on the lab paper. The name is a colour grade, not a licence to skip disclosure.',
      ),
      h2('Royal Blue Sapphire'),
      p(
        'Royal blue sapphire is a deeper, more saturated blue than cornflower. It can look velvety in Burma or Madagascar material. It is still a natural blue sapphire stone — not a separate species.',
        'Jyotish buyers may wear a royal blue sapphire when the hue stays lively in daylight and is not black-blue. An inky royal blue sapphire is weaker as a neelam stone. Compare it next to cornflower blue sapphire in north light.',
        'Price follows that depth: a fine royal blue sapphire often costs more than a pale stone and less than rare Kashmir cornflower. Always read heat on the paper.',
      ),
      h2('Light Blue Sapphire'),
      p(
        'Light blue sapphire is pale, often from heated Ceylon geuda. It is still corundum when the lab says so. For Saturn work, a light blue sapphire is usually the weaker pick — low saturation, easy to wash out indoors.',
        'A light blue sapphire can suit a tight budget or a jewellery design that needs a soft blue. Do not treat it as the same remedy as a medium-dark neelam stone. Neelam stone price is lower for light blue sapphire because the colour is less in demand.',
        'If your astrologer accepts a light blue sapphire, keep it unheated if you can, and keep the three-day trial. Colour grade does not cancel chart risk.',
      ),
      h3('Treatment'),
      p(
        'Unheated is strongly preferred for ratna use. Simple heat is common in the trade and must be disclosed. Beryllium diffusion and lattice diffusion disqualify a natural blue sapphire stone for classical Jyotish.',
      ),
      h2('Blue Star Sapphire'),
      p(
        'A blue star sapphire is a cabochon that shows a six-ray star (asterism) from silk. Value follows the sharpness of the star, not facet sparkle. View a blue star sapphire in direct light and tilt the stone.',
        'Sri Lanka, Myanmar, and parts of Africa produce most blue star sapphire. Being opaque, blue star sapphire price depends on lustre and how centred the star sits. A fuzzy star is a weaker blue star sapphire.',
        'For Jyotish, a faceted neelam stone is the usual first choice. Wear a blue star sapphire as the Saturn gem only when an astrologer accepts a cabochon. Otherwise treat blue star sapphire as jewellery with honest disclosure.',
      ),
      h2('Natural Blue Sapphire vs Heated Stone'),
      p(
        'A natural blue sapphire can be unheated or heated. Unheated is the Jyotish first choice. Heat is common and must be named on the lab paper. Beryllium or lattice diffusion can still be earth-grown, but it is not acceptable for classical Jyotish — skip it.',
        'Therefore you should read the treatment line before you compare price. Two stones can look similar. Only one may be an unheated natural blue sapphire with no diffusion.',
      ),
      h3('Shop blue sapphire by origin'),
      p(
        'Filter the collection the same way a gem lab talks about origin. Then compare heat and paper, not just the name on the tag. Ceylon is the first place to look for a wearable natural blue sapphire stone. Fine Ceylon can also show cornflower blue sapphire colour.',
      ),
      ul([
        '<a href="/gemstones/navaratna/blue-sapphire?origin=Kashmir">Kashmir Blue Sapphire</a>',
        '<a href="/gemstones/navaratna/blue-sapphire?origin=Ceylon">Ceylon Blue Sapphire</a>',
        '<a href="/gemstones/navaratna/blue-sapphire?origin=Burma">Burmese Blue Sapphire</a>',
        '<a href="/gemstones/navaratna/blue-sapphire?origin=Madagascar">Madagascar Blue Sapphire</a>',
        '<a href="/gemstones/navaratna/blue-sapphire?treatment=Unheated">Unheated Natural Blue Sapphire</a>',
      ]),
    ].join('\n'),
    quality_price_html: [
      p(
        'Neelam stone price in India is not one number. Jyotish-quality natural blue sapphire stone often runs from about INR 3,000 per carat to INR 3,00,000 per carat. Rare untreated cornflower blue sapphire and Kashmir sit at the top of that range. Compare certified listings, not a single rate.',
      ),
      h2('Neelam Stone Price'),
      p(
        'Neelam stone price moves with origin, colour, clarity, cut, carat, and treatment. A light blue sapphire sits at the low end. A royal blue sapphire in the middle. Fine cornflower blue sapphire and Kashmir set the ceiling.',
        'Therefore you should read neelam stone price per carat on the listing, then check the lab line for heat. Two stones of the same carat can differ tenfold. That gap is normal.',
      ),
      h2('Factors Affecting Blue Sapphire Price'),
      p(
        'Like other coloured gems, a natural blue sapphire is priced by origin, colour, clarity, cut, carat, and treatment together. Knowing that mix helps you buy a stone that fits both the chart and the budget.',
      ),
      h3('Origin'),
      p(
        'Kashmir natural blue sapphire stone, when colour and velvet are real, is rare and priced in the exclusive band — about INR 30,000 to INR 3,00,000 per carat on our quality scale. Fine untreated Ceylon and Burma often sit nearer INR 7,000 to INR 30,000 per carat. Heated commercial blues are lower.',
      ),
      h3('Colour'),
      p(
        'Colour is the first price lever. A cornflower blue sapphire stone costs more than a dark Bangkok-type blue. A royal blue sapphire costs more than a light blue sapphire. If hue, tone, or saturation slips, neelam stone price drops fast.',
      ),
      h3('Clarity'),
      p(
        'Silk, fingerprints, and colour bands are normal. A perfectly clean natural blue sapphire stone is rare and expensive. Buy lab-checked stones so you are not paying gem prices for glass or heavy fill.',
      ),
      h3('Uniqueness'),
      p(
        'A blue star sapphire, rare Kashmir origin, and untreated fine colour all add a premium. Also, a well-cut oval or cushion that faces up bright will outprice a windowed stone of the same carat.',
      ),
      h3('Certification'),
      p(
        `GRS, GIA, and Gübelin reports should state heat. Origin reports matter most for Kashmir and Burma. At checkout, ${BRAND} shows lab, treatment, and origin on every listing so you can match the paper to the natural blue sapphire stone in the tray.`,
      ),
    ].join('\n'),
    jewellery_html: [
      p(
        'After a good trial, most people set a natural blue sapphire stone in a ring. Pendants, bracelets, and brooches are also worn. For Shani, skin contact still matters. Open-back rings are the usual Jyotish choice.',
      ),
      h3('Natural Blue Sapphire Stone Ring'),
      p(
        'A natural blue sapphire stone ring on the middle finger is the classic Saturn setting. Choose a secure open-back mount so the gem can touch skin. Silver, white gold, and Panchdhatu are the metals we recommend. Confirm with your astrologer before the jeweller starts.',
      ),
      h3('Blue Sapphire Pendant'),
      p(
        'A pendant keeps a natural blue sapphire near the heart and works with gold or silver. It is a good second piece. It is not a full substitute for a prescribed ring unless your astrologer says so.',
      ),
      h3('Natural Blue Sapphire Stone Bracelets'),
      p(
        'Natural blue sapphire stone bracelets suit people who already have a primary ring. They add colour for day wear. For first-time Shani remedies, start with the ring after trial.',
      ),
      h3('Blue Sapphire Brooches'),
      p(
        'Brooches pin a natural blue sapphire stone to a coat or scarf. They look royal and stay easy to remove. Use them as jewellery. Do not treat a brooch as the only astrological setting unless prescribed.',
      ),
      h3('Trial Setting'),
      p(
        `Many astrologers wrap or tape the loose natural blue sapphire stone on the arm for a three-day trial before a permanent ring. ${BRAND} can help you plan that trial, then move to an open-back, secure mount.`,
      ),
      ul([
        'Saturday evening energisation',
        'Middle finger unless your chart says otherwise',
        `Avoid pairing with ${shopLink('ruby', 'ruby')} unless an expert approves the yoga`,
      ]),
    ].join('\n'),
    cleaning_care_html: [
      p(
        'Sapphire is a 9 on the Mohs scale, so a natural blue sapphire stone is tough. Settings still fail. Care keeps both the gem and the Saturn remedy in good order.',
      ),
      h3('Gentle Cleaning Techniques'),
      p(
        'Wipe your natural blue sapphire stone with a soft cloth and lukewarm soapy water. Then rinse and dry. Do not use harsh chemicals. Also skip ultrasonic cleaners if the stone has fractures or a delicate mount.',
      ),
      h3('Safe Storage Practices'),
      p(
        'Keep a natural blue sapphire stone in a soft pouch or a lined box. A hard surface can wear the polish. Do not toss it against diamond jewellery in the same dish.',
      ),
      h3('Regular Professional Maintenance'),
      p(
        'Have a jeweller check prongs once a year. Loss of a natural blue sapphire stone is treated as astrologically serious in many families. A tight setting is cheaper than a lost Shani ratna.',
      ),
      h3('Re-Energisation'),
      p(
        'On Saturday, rinse with Gangajal, light a sesame or mustard lamp, and repeat the Shani mantra. Then wear the natural blue sapphire stone again with a clear intention.',
      ),
    ].join('\n'),
    buyer_beware_html: [
      p(
        'Flux-grown, hydrothermal, and beryllium-diffused sapphires flood the market. Blue glass and iolite are sold as neelam. An original natural blue sapphire stone should have a lab paper and a treatment line you can read.',
      ),
      h3('Research Cut, Clarity, and Trusted Sellers'),
      p(
        'Choose a bright cut. Accept some silk. Compare price per carat by origin. Always buy from a seller who will explain heat and will not hide a cheap “Kashmir” story.',
      ),
      h3('Red Flags'),
      ul([
        'Sold with no consultation warning',
        'Claimed Kashmir origin at a low price',
        'No heat or treatment disclosure',
        'A flawless natural blue sapphire stone at a bargain — often glass or synthetic',
      ]),
      h3('Why Buy from PureVedicGems?'),
      p(
        `${BRAND} has sourced Jyotish gems since 1937. We list certified stones, show treatment, and support trial protocols. Buy natural blue sapphire stone online here only after you understand the chart risk. That is how responsible neelam selling works.`,
        'Lab papers come from recognised gem labs. If a listing cannot show heat status, do not treat it as a Shani ratna.',
      ),
      h2('Natural Blue Sapphire vs Synthetic'),
      p(
        'A natural blue sapphire grew in the earth. A synthetic grew in a lab. Glass and iolite are not sapphire at all. Ask for a report that names natural corundum. Then check heat.',
      ),
      h3('Trial First'),
      p(
        `A beautiful natural blue sapphire stone is still the wrong stone if Saturn forbids it. Use the trial. Then set. ${BRAND} will not skip that step to close a sale.`,
      ),
      h3('Buy certified blue sapphire with a real trial'),
      p(
        'Chat with us, call us, or book a callback. Get a Jyotish review and then buy blue sapphire online with the lab paper in hand. That is the honest way to inherit the stone’s beauty.',
      ),
    ].join('\n'),
    faqs: [
      {
        question: '1. What is a cornflower blue sapphire?',
        answer:
          'Cornflower blue sapphire is a colour grade of natural blue sapphire — bright, velvety true-blue corundum, called Neelam in Vedic astrology. It is not a separate gem. Saturn’s ratna is the natural blue sapphire stone; cornflower is the hue astrologers prefer when the chart allows it.',
      },
      {
        question: 'What is a natural blue sapphire?',
        answer:
          'A natural blue sapphire is earth-grown corundum, not lab-grown or glass. For Jyotish, unheated natural blue sapphire stone is preferred. Heat must be disclosed. Beryllium diffusion is not acceptable.',
      },
      {
        question: 'What is a neelam stone?',
        answer:
          'A neelam stone is the Hindi name for a natural blue sapphire stone — Saturn’s gem in Vedic astrology. Cornflower, royal blue sapphire, light blue sapphire, and blue star sapphire are looks of the same corundum, not different minerals.',
      },
      {
        question: 'What is neelam stone price in India?',
        answer:
          'Neelam stone price on our quality scale is about INR 3,000 to INR 3,00,000 per carat. Light blue sapphire is cheaper. Royal blue sapphire sits in the middle. Rare cornflower and Kashmir cost more. Read the listing, not a generic quote.',
      },
      {
        question: 'What is a royal blue sapphire?',
        answer:
          'Royal blue sapphire is a deep, saturated blue — darker than cornflower, not black. It is a colour grade of natural blue sapphire. Wear it for Jyotish only if it stays lively in daylight and the chart allows a neelam stone.',
      },
      {
        question: 'What is a light blue sapphire?',
        answer:
          'Light blue sapphire is pale corundum, often heated Ceylon. It can be genuine, but it is usually a weaker Saturn remedy than a medium-dark neelam stone. Neelam stone price is lower for this colour because saturation is low.',
      },
      {
        question: 'What is a blue star sapphire?',
        answer:
          'A blue star sapphire is a cabochon with a six-ray star from silk. Price follows the star, not facet fire. Use a blue star sapphire for Jyotish only when an astrologer accepts a cabochon; otherwise it is jewellery.',
      },
      {
        question: '2. How much does a Blue Sapphire cost?',
        answer:
          'Neelam stone price for astrological natural blue sapphire stone often runs from about INR 3,000 to INR 3,00,000 per carat. Rare untreated cornflower blue sapphire and Kashmir cost more. Compare certified listings rather than a generic neelam quote.',
      },
      {
        question: 'What are the traditional benefits of Neelam?',
        answer:
          'Neelam is worn for Saturn themes: career structure, endurance, and protection from delays. Results can be swift — for better or worse — so chart review comes first. These are traditional uses, not medical claims.',
      },
      {
        question: '3. Will blue sapphire (Neelam Stone) suit me?',
        answer:
          'Only when an astrologer confirms Saturn should be strengthened. Never wear Neelam because a friend did. Use a trial period and expert prescription.',
      },
      {
        question: '4. How do I identify a natural blue sapphire?',
        answer:
          'Look for natural inclusions and a lab report that names corundum and heat status. Overly clean cheap stones are often synthetic or glass. A natural blue sapphire can still look clean — the paper must say so.',
      },
      {
        question: '5. Which coloured Blue Sapphire is astrologically most effective?',
        answer:
          'A vivid cornflower blue sapphire is preferred. A lively royal blue sapphire can also work. A pale light blue sapphire is weaker for Jyotish. Your horoscope may still refine the pick.',
      },
      {
        question: '6. Can I wear a Blue Sapphire gemstone in less carat weight?',
        answer:
          'Yes, if the stone is high quality and untreated. Many astrologers prefer a smaller genuine neelam over a large heated one.',
      },
      {
        question: '7. Why is there a variation in the price of Blue Sapphires?',
        answer:
          'Origin, colour, clarity, carat, and treatment move the price. Kashmiri stones lead, then Burmese, then Sri Lankan. Untreated vivid stones cost more than heated or dull ones.',
      },
      {
        question: '8. Should I wear Sri Lankan Sapphire, Burmese Sapphire, or Kashmiri Sapphire?',
        answer:
          'Match budget and chart. Kashmir is rare and premium. Burma is strong in hue. Sri Lanka is the practical fine stone for most Jyotish buyers, and some Ceylon gems show cornflower blue sapphire colour. Ask an expert before you lock origin.',
      },
      {
        question: '9. On which finger should I wear a Blue Sapphire?',
        answer:
          'Classical use at PureVedicGems is the middle finger of the right hand. Confirm before the jeweller sets the ring.',
      },
      {
        question: '10. Blue Sapphire stone is worn for which Rashi?',
        answer:
          'A natural blue sapphire stone is mainly prescribed for Capricorn (Makar) and Aquarius (Kumbh) ascendants. Certain yogas still forbid the gem, so take a reading first.',
      },
      {
        question: '11. When will I get the results after wearing a Blue Sapphire?',
        answer:
          'If the stone is unsuitable, harm can show within the three-day trial. If it suits, do not expect a miracle in those days — positive effects often take a few weeks to a few months. Fake or wrongly prescribed stones will not give the result you want.',
      },
      {
        question: '12. Can Blue Sapphire gemstones help to recover from Shani Mahadasha?',
        answer:
          'A genuine, prescribed neelam is used to steady Saturn’s dasha. It is not automatic. The chart and the trial decide.',
      },
      {
        question: 'Why is neelam considered dangerous?',
        answer:
          'Shani gives swift results. If Saturn is unfavourable, neelam may amplify challenges. That is why trial wear and expert prescription are essential.',
      },
      {
        question: 'What is the neelam trial method?',
        answer:
          'Tie or tape the stone to your body for three days. Watch dreams, mood, headaches, and events before you commit to a ring.',
      },
      {
        question: 'Can I wear neelam during Sade Sati?',
        answer:
          'Sometimes yes, sometimes no. It depends on Shani’s house lordship and dignity. Never assume Sade Sati automatically requires neelam.',
      },
      {
        question: 'Kashmir or Ceylon?',
        answer:
          'Kashmir is legendary and rare. Fine unheated Ceylon is the practical astrological standard for neelam today.',
      },
      {
        question: 'Neelam with yellow sapphire?',
        answer:
          'Guru–Shani combinations need expert yoga analysis. Pitambari sapphire exists for dual-influence charts. Do not pair on your own.',
      },
      {
        question: 'Heated blue sapphire for Jyotish?',
        answer:
          'Unheated is strongly preferred. Some astrologers accept disclosed heat-only if Saturn is well placed. Diffusion is not acceptable.',
      },
      {
        question: '13. Why should you buy a cornflower blue sapphire stone?',
        answer:
          'Buy a natural blue sapphire stone for authentic Saturn work — career structure, focus, and long tests — only when it is genuine and prescribed. Shop certified listings and keep the three-day trial. Fine colour is often a cornflower blue sapphire, which is a hue, not a licence to skip the chart.',
      },
    ],
  }),

  hessonite: defineGem({
    slug: 'hessonite',
    name: 'Hessonite',
    hindi: 'Gomed',
    planet: 'Rahu',
    extraKeywords: ['ceylon gomed', 'sri lanka hessonite', 'rahu ratna', 'honey garnet', 'gomedh ring', 'natural hessonite'],
    intro:
      'Hessonite (Gomed) carries the intense, unconventional frequency of Rahu—the north node. This honey-to-reddish grossular garnet is worn to navigate Rahu dasha, foreign ventures, and sudden life shifts. PureVedicGems selects transparent natural gomed with minimal inclusions and clear origin disclosure.',
    hero_benefits: [
      { text: 'Pacifies afflicted Rahu during dasha and transits' },
      { text: 'Supports foreign travel, technology, and unconventional careers' },
      { text: 'Traditionally worn for skin disorders, phobias, and mental confusion' },
      { text: 'Protects against hidden enemies and sudden reputation risks' },
    ],
    seo_description:
      'Buy natural Hessonite (Gomed) online for Rahu. Ceylon gomed rings, silver settings & Jyotish consultation from PureVedicGems.',
    about_html: [
      p(
        'Hessonite is a manganese-rich grossular garnet, not corundum. Sanskrit: Gomed or Gomedak. It is the primary ratna for Rahu—shadow planet of obsession, illusion, foreign lands, and mass influence.',
        'Quality gomed shows honey-yellow to brownish-red colour with oily lustre and visible internal "treacle" streaks (swirl inclusions typical of hessonite).',
      ),
      h3('Vedic Significance'),
      p('Rahu governs foreigners, poisons, sudden events, and worldly ambition. Ardra, Swati, and Shatabhisha nakshatras connect to Rahu gems. Gomed is often prescribed during Rahu mahadasha or when Rahu afflicts the lagna.'),
      h3('Distinction from Other Garnets'),
      p('Do not confuse hessonite with red almandine or pyrope garnet. True gomed is grossular with characteristic Rahu-appropriate appearance and Jyotish tradition.'),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '5–8 carats'],
      ['Metal', 'Silver or Panchdhatu'],
      ['Finger', 'Middle finger of the right hand'],
      ['Day', 'Saturday (Shanivar)'],
      ['Time', 'Evening during Rahu kalam or Shani hora'],
      ['Mantra', 'Chant "Om Raam Rahave Namah" or "Om Bhram Bhreem Bhraum Sah Rahave Namah" 108 times'],
      ['Purification', 'Gangajal, mustard oil rinse, offer blue-black cloth and coconut'],
    ]),
    who_should_wear_html: [
      p('Gomed suits afflicted Rahu, Rahu mahadasha, and those in media, politics, aviation, or tech facing instability. Often recommended when Rahu sits in lagna or with Moon.'),
      h3('When Not to Wear'),
      p('Avoid if Rahu is already yogakaraka and well-placed without affliction. Discontinue if adverse effects appear—Rahu gems demand monitoring.'),
      h3('Consult an Astrologer'),
      p(`${BRAND} reviews Rahu\'s house, nakshatra, and dasha before recommending gomed.`),
    ].join('\n'),
    benefits_html: [
      h3('Career & Ambition'),
      p('Rahu drives unconventional success. Gomed supports IT, film, politics, import-export, and breakthrough ventures.'),
      h3('Foreign & Travel'),
      p('Visa obstacles, foreign settlement, and cross-cultural business often link to Rahu remedies including gomed.'),
      h3('Mental Clarity'),
      p('Traditionally worn to reduce confusion, phobia, and Rahu-induced anxiety or addiction tendencies—with professional help.'),
      h3('Health'),
      p('Associated with skin, digestion, and psychosomatic stress in Jyotish–Ayurvedic texts.'),
      h3('Protection'),
      p('Gomed is believed to deflect hidden enemies and scandal when Rahu afflicts the 7th or 10th.'),
    ].join('\n'),
    types_html: [
      h3('Origins'),
      ul(['Sri Lanka (Ceylon): Benchmark for Jyotish gomed', 'India (Orissa): Select fine material', 'Africa: Commercial grades', 'Brazil: Verify identity as grossular']),
      h3('Appearance'),
      p('Honey yellow, orange-brown, and reddish hessonite. Oily lustre and swirl inclusions confirm identity.'),
      h3('Treatments'),
      p('Hessonite is rarely treated—synthetics and glass imitations are the main concern.'),
    ].join('\n'),
    quality_price_html: [
      p('Transparency, colour, and size define value. Ceylon gomed with good clarity sits at mid to premium tiers.'),
      h3('Certification'),
      p('Lab report should identify grossular garnet. RI ~1.74 and characteristic inclusions help confirm gomed.'),
      h3('Price Guidance'),
      p('Generally more affordable than corundum ratnas—entry-level to premium collector grades per carat.'),
    ].join('\n'),
    jewellery_html: [
      p('Silver ring on middle finger is standard. Panchdhatu also traditional for Rahu–Shani overlap on Saturday.'),
      h3('Tips'),
      ul(['Open back for skin contact', 'Saturday evening energisation', 'Avoid confusing with citrine or topaz']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm soapy water—garnet is 6.5–7.5 Mohs, durable for daily wear.'),
      h3('Storage'),
      p('Protect from harder gems like sapphire and diamond.'),
      h3('Re-Energisation'),
      p('Saturday Rahu mantra with mustard oil wipe and Gangajal rinse.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Citrine, amber, and glass are sold as gomed. Orange sapphire is a different planet\'s gem entirely.'),
      h3('Red Flags'),
      ul(['Perfectly clean with no hessonite swirls', 'Seller cannot explain grossular identity', 'Extremely low price for "Ceylon gomed"']),
      h3('Verify'),
      p(`${BRAND} gemologically confirms grossular hessonite before listing as Gomed.`),
    ].join('\n'),
    faqs: [
      { question: 'Gomed for which dasha?', answer: 'Primarily Rahu mahadasha/antardasha or when Rahu is severely afflicted in the birth chart.' },
      { question: 'Why Saturday for Rahu gem?', answer: 'Rahu is closely worked with Shani traditions; Saturday evening is the common energisation day for gomed.' },
      { question: 'Gomed vs blue sapphire?', answer: 'Gomed is for Rahu; neelam is for Shani. Both may appear in complex charts—never self-prescribe both.' },
      { question: 'Honey or red gomed?', answer: 'Both are valid hessonite colours. Transparency and correct mineral identity matter more than exact hue.' },
      { question: 'Can gomed help foreign settlement?', answer: 'Traditionally worn for Rahu-related foreign karma. Legal immigration process remains primary.' },
      { question: 'Which finger?', answer: 'Middle finger of the right hand in silver is classical.' },
      { question: 'Is gomed safe?', answer: 'Generally gentler than neelam but still requires chart approval. Monitor effects after wearing.' },
      { question: 'Gomed with cat\'s eye?', answer: 'Rahu and Ketu gems together demand expert prescription—often not recommended without yoga analysis.' },
    ],
  }),

  'cats-eye': defineGem({
    slug: 'cats-eye',
    name: "Cat's Eye",
    hindi: 'Lehsunia',
    planet: 'Ketu',
    extraKeywords: ['chrysoberyl cats eye', 'ceylon lehsunia', 'ketu ratna', 'honey cats eye', 'kanak ketu stone', 'natural cats eye'],
    intro:
      "Cat's Eye (Lehsunia) embodies the mystical, detaching force of Ketu—the south node. This chrysoberyl cabochon displays a sharp band of light, symbolising spiritual insight beyond material illusion. PureVedicGems offers natural chrysoberyl cat's eyes with strong chatoyancy and Jyotish suitability.",
    hero_benefits: [
      { text: 'Supports Ketu dasha, moksha inclination, and spiritual detachment' },
      { text: 'Protects against accidents, hidden dangers, and sudden losses' },
      { text: 'Traditionally worn for mysterious ailments and psychic disturbances' },
      { text: 'Enhances intuition, occult study, and research depth' },
    ],
    seo_description:
      "Buy natural Cat's Eye (Lehsunia) online for Ketu. Ceylon chrysoberyl, gold settings & Jyotish guidance from PureVedicGems.",
    about_html: [
      p(
        "Cat's eye is chatoyant chrysoberyl—not quartz 'cat's eye.' Sanskrit: Vaidurya or Lehsunia. It is the ratna of Ketu, planet of liberation, past-life karma, and sudden severance.",
        'A fine stone shows a single sharp silver or honey band that moves across the cabochon surface. Chrysoberyl is hard (8.5 Mohs) and durable.',
      ),
      h3('Vedic Significance'),
      p('Ketu governs moksha, ghosts, flags, and sudden events opposing Rahu\'s material hunger. Ashwini, Magha, and Mula nakshatras resonate with Ketu. Lehsunia is prescribed during Ketu mahadasha or afflicted Ketu in health houses.'),
      h3('Not Quartz'),
      p('Apatite, quartz, and tourmaline cat\'s eyes are substitutes at best. Classical Jyotish prefers chrysoberyl cat\'s eye for Ketu ratna therapy.'),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '3–7 carats'],
      ['Metal', 'Gold or Panchdhatu'],
      ['Finger', 'Middle finger of the right hand'],
      ['Day', 'Tuesday or Saturday (traditions vary; Tuesday for Ketu–Mars link is common)'],
      ['Time', 'Evening during Ketu hora'],
      ['Mantra', 'Chant "Om Kem Ketave Namah" or "Om Stram Streem Straum Sah Ketave Namah" 108 times'],
      ['Purification', 'Gangajal, raw milk, offer blanket or multi-coloured cloth to Ganesha'],
    ]),
    who_should_wear_html: [
      p('Lehsunia suits Ketu mahadasha, spiritual seekers, researchers, and those with Ketu afflicting health or causing unexplained obstacles. Mula and Magha natives often considered.'),
      h3('When Not to Wear'),
      p('Avoid if Ketu is yogakaraka and well-placed. Discontinue if wearing causes disorientation or abrupt negative events—consult astrologer immediately.'),
      h3('Consult an Astrologer'),
      p(`${BRAND} confirms Ketu\'s role in your chart before offering Lehsunia.`),
    ].join('\n'),
    benefits_html: [
      h3('Spiritual Liberation'),
      p('Ketu pulls toward moksha. Cat\'s eye supports meditation, tantra under guidance, and detachment from unhealthy attachments.'),
      h3('Protection'),
      p('Traditional talisman against accidents, snake fear, and unseen negative forces.'),
      h3('Research & Occult'),
      p('Deep investigation, mathematics, and occult sciences benefit from focused Ketu energy when balanced.'),
      h3('Health Mysteries'),
      p('Worn when diagnoses are elusive or ailments have karmic patterns—in addition to medical care.'),
      h3('Sudden Gains & Losses'),
      p('Ketu can grant sudden outcomes; Lehsunia is believed to stabilise Ketu\'s volatile axis with Rahu.'),
    ].join('\n'),
    types_html: [
      h3('Origins'),
      ul(['Sri Lanka (Ceylon): Finest honey and greenish cat\'s eyes', 'India: Kanak cat\'s eye varieties', 'Brazil & Africa: Select chatoyant stones']),
      h3('Colours'),
      p('Honey, greenish-honey, and milk-and-honey bands. Sharp single eye preferred over blurry multiple bands.'),
      h3('Imitations'),
      p('Quartz, apatite, and fibre-optic glass cat\'s eyes are common fakes.'),
    ].join('\n'),
    quality_price_html: [
      p('Chatoyancy sharpness, colour, transparency, and carat define price. Strong Ceylon eyes reach premium tiers.'),
      h3('Certification'),
      p('Must confirm chrysoberyl, not quartz. Microscopy shows hollow tubes creating the eye in natural stones.'),
      h3('Price Guidance'),
      p('Mid to premium collector grades for fine Ceylon; entry-level for weak eye or opaque stones.'),
    ].join('\n'),
    jewellery_html: [
      p('Gold ring, middle finger, cabochon with band parallel to finger axis for maximum eye display.'),
      h3('Tips'),
      ul(['Cabochon only—never faceted', 'Band should move sharply in light', 'Tuesday or Saturday energisation']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm soapy water—chrysoberyl is durable.'),
      h3('Handling'),
      p('Avoid knocking cabochon—girdle can chip despite hardness.'),
      h3('Re-Energisation'),
      p('Ketu mantra on chosen day with Gangajal rinse.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Quartz cat\'s eye is sold as Lehsunia at fraction of price. Glass fibre cat\'s eye is obvious under magnification.'),
      h3('Red Flags'),
      ul(['Eye band does not move with light', 'Price too low for claimed Ceylon chrysoberyl', 'Certificate says quartz or apatite']),
      h3('Verify Chrysoberyl'),
      p(`${BRAND} lists only chrysoberyl cat's eye as Lehsunia—not quartz substitutes.`),
    ].join('\n'),
    faqs: [
      { question: 'Chrysoberyl vs quartz cat\'s eye?', answer: 'Classical Lehsunia is chrysoberyl (hardness 8.5). Quartz cat\'s eye is a cheaper substitute, not primary Navaratna Ketu ratna.' },
      { question: 'Tuesday or Saturday?', answer: 'Both appear in traditions. Tuesday links Ketu with Mars; Saturday with nodal–Shani practices. Follow your astrologer\'s muhurta.' },
      { question: 'Which finger for Lehsunia?', answer: 'Middle finger of the right hand in gold is standard.' },
      { question: 'Can cat\'s eye help spirituality?', answer: 'Traditionally the foremost Ketu gem for moksha inclination, meditation, and detachment when Ketu is favourable.' },
      { question: 'Sharp eye meaning?', answer: 'A single bright band that slides across the stone in direct light. Blurry or multiple bands are lower grade.' },
      { question: 'Lehsunia with gomed?', answer: 'Rahu and Ketu are axis partners. Combined wearing requires expert yoga analysis—do not self-combine.' },
      { question: 'Ketu dasha only?', answer: 'Primarily Ketu dasha or strong Ketu affliction. Not worn casually like pearl or yellow sapphire.' },
      { question: 'Green or honey cat\'s eye?', answer: 'Honey and greenish-honey Ceylon stones are prized. Colour is secondary to sharp chatoyancy and chrysoberyl identity.' },
    ],
  }),

  'white-sapphire': defineGem({
    slug: 'white-sapphire',
    name: 'White Sapphire',
    hindi: 'Safed Pukhraj',
    planet: 'Venus',
    extraKeywords: ['colorless sapphire', 'safed pukhraj', 'shukra substitute', 'ceylon white sapphire', 'venus gemstone', 'diamond alternative vedic'],
    intro:
      'White Sapphire (Safed Pukhraj) offers the Venus-aligned brilliance of Shukra in an accessible corundum form. Traditionally prescribed as the Uparatna substitute for diamond, a clean natural white sapphire carries Shukra\'s grace for marriage, arts, and refined living. PureVedicGems certifies colourless sapphires with full treatment disclosure.',
    hero_benefits: [
      { text: 'Traditional Vedic substitute for Heera when Shukra needs strengthening' },
      { text: 'Supports marriage harmony, beauty, and creative professions' },
      { text: 'More affordable than diamond while remaining natural corundum' },
      { text: 'Durable for daily wear (9 Mohs) in white gold or silver settings' },
    ],
    seo_description:
      'Buy certified White Sapphire (Safed Pukhraj) online for Venus. Ceylon colourless sapphires, Jyotish substitute for diamond from PureVedicGems.',
    about_html: [
      p(
        'White sapphire is colourless corundum—essentially sapphire without trace colour elements. Hindi: Safed Pukhraj. It serves as the classical substitute (upratna) for diamond in Jyotish when Heera is unsuitable or beyond budget.',
        'Fine stones are transparent with minimal cloudiness, showing diamond-like brilliance at lower cost.',
      ),
      h3('Vedic Role'),
      p('Shukra rules love, arts, vehicles, and luxury. When an astrologer prescribes Venus strengthening but diamond is impractical, Safed Pukhraj is the first alternative in most North Indian traditions.'),
      h3('vs Diamond'),
      p('Diamond remains the primary ratna; white sapphire replicates Venus energy through the same corundum family with white (sattvic) colour association.'),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '3–7 carats (larger than diamond equivalent due to lower density pricing)'],
      ['Metal', 'Silver, white gold, or platinum'],
      ['Finger', 'Middle or little finger of the right hand'],
      ['Day', 'Friday (Shukravar)'],
      ['Time', 'Morning or evening during Shukra hora'],
      ['Mantra', 'Chant "Om Dram Dreem Draum Sah Shukraya Namah" 108 times'],
      ['Purification', 'Rose water, raw milk, Gangajal, and white flowers'],
    ]),
    who_should_wear_html: [
      p('Safed Pukhraj suits weak Venus charts where diamond is not prescribed or affordable. Taurus and Libra ascendants, artists, and marriage seekers commonly wear it after consultation.'),
      h3('When Not to Wear'),
      p('If your astrologer specifically demands natural diamond, substituting without approval is incorrect. Avoid if Shukra is already strong and benefic.'),
      h3('Consult an Astrologer'),
      p(`${BRAND} helps choose between Heera and Safed Pukhraj based on chart and budget.`),
    ].join('\n'),
    benefits_html: [
      h3('Marital Harmony'),
      p('Primary Venus benefit—supports attraction, compromise, and peace in relationships.'),
      h3('Creative Arts'),
      p('Music, design, cinema, and beauty industries align with Shukra gems including white sapphire.'),
      h3('Comfort & Luxury'),
      p('Venus governs vehicles, ornaments, and sensory pleasures—white sapphire supports lawful comforts.'),
      h3('Health & Beauty'),
      p('Traditionally linked to reproductive health and complexion—complementary to medical care.'),
      h3('Spiritual Devotion'),
      p('Friday Lakshmi worship with Safed Pukhraj is a gentle Shukra remedy.'),
    ].join('\n'),
    types_html: [
      h3('Origins'),
      ul(['Sri Lanka (Ceylon): Cleanest white sapphires', 'Madagascar: Good transparency', 'Thailand: Verify heat treatment']),
      h3('Quality'),
      p('Eye-clean, colourless, with good cut brilliance. Avoid milky or grey stones.'),
      h3('Treatment'),
      p('Prefer unheated. Diffused or coated stones are not ideal for Jyotish.'),
    ].join('\n'),
    quality_price_html: [
      p('Clarity and cut drive value. White sapphire is generally mid-tier compared to diamond per carat.'),
      h3('Certification'),
      p('Confirm natural corundum. Distinguish from white topaz, zircon, and synthetic spinel.'),
      h3('Price Guidance'),
      p('Entry-level commercial to fine Ceylon grades—a practical Shukra ratna across budgets.'),
    ].join('\n'),
    jewellery_html: [
      p('White gold or silver ring on middle/little finger. Brilliant cut maximises Venus appeal.'),
      h3('vs Diamond Jewellery'),
      p('Can match engagement aesthetics while serving Jyotish—disclose substitute status to astrologer.'),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm soapy water—sapphire is durable for daily Venus wear.'),
      h3('Re-Energisation'),
      p('Friday Shukra mantra with rose water rinse.'),
    ].join('\n'),
    buyer_beware_html: [
      p('White topaz, cubic zirconia, and synthetic corundum sold as Safed Pukhraj.'),
      h3('Red Flags'),
      ul(['Price like topaz but sold as sapphire', 'No corundum on certificate', 'Glass imitations']),
      h3('Verify'),
      p(`${BRAND} certifies natural white sapphire with lab reports.`),
    ].join('\n'),
    faqs: [
      { question: 'White sapphire vs diamond for Jyotish?', answer: 'Diamond is primary; white sapphire is the traditional Vedic substitute when prescribed or when Heera is impractical.' },
      { question: 'Which finger?', answer: 'Middle or little finger of right hand in white metal—same as diamond.' },
      { question: 'How many carats?', answer: 'Typically 3–7 carats—larger than diamond equivalent due to lower cost per carat.' },
      { question: 'Can it replace engagement diamond?', answer: 'Only if astrologer approves Safed Pukhraj for your chart. Not automatic substitute.' },
      { question: 'Friday rules?', answer: 'Same Shukra mantra and purification as diamond.' },
      { question: 'White sapphire vs zircon?', answer: 'White sapphire is corundum (preferred). Zircon is different mineral—occasional substitute only.' },
      { question: 'Heated white sapphire OK?', answer: 'Unheated preferred; disclosed heat-only may be acceptable to some Jyotish practitioners.' },
      { question: 'With yellow sapphire?', answer: 'Venus and Jupiter are friendly—often compatible after chart check.' },
    ],
  }),

  pitambari: defineGem({
    slug: 'pitambari',
    name: 'Pitambari',
    hindi: 'Pitambari Neelam',
    planet: 'Jupiter & Saturn',
    extraKeywords: ['pitambari sapphire', 'dual colour sapphire', 'guru shani gem', 'yellow blue sapphire', 'pitambari neelam', 'bicolour sapphire vedic'],
    intro:
      'Pitambari is a rare dual-toned sapphire blending yellow (Guru) and blue (Shani) in one crystal—worn when Jupiter and Saturn jointly influence the chart. This distinctive Neelam–Pukhraj fusion is prescribed for specific yogas, not general wear. PureVedicGems sources natural Pitambari sapphires with clear dual-colour zoning and certification.',
    hero_benefits: [
      { text: 'Balances Guru and Shani when both planets need simultaneous support' },
      { text: 'Prescribed for rare Jyotish yogas involving Jupiter–Saturn interplay' },
      { text: 'Avoids wearing separate Pukhraj and Neelam that may conflict' },
      { text: 'Single gem solution for complex dasha combinations' },
    ],
    seo_description:
      'Buy natural Pitambari sapphire online for Guru & Shani. Certified dual-tone sapphires with expert Jyotish consultation from PureVedicGems.',
    about_html: [
      p(
        'Pitambari (literally "yellow-clad") is a natural sapphire showing distinct yellow and blue colour zones in one stone—combining the planetary colours of Brihaspati and Shani. It is not a manufactured composite but a rare colour-zoned corundum crystal.',
        'Authentic Pitambari displays visible separation of golden-yellow and blue regions, often in bi-colour or parti-colour patterns. Sri Lanka and Madagascar produce occasional fine examples.',
      ),
      h3('Vedic Significance'),
      p('Prescribed when an astrologer identifies charts needing both Guru and Shani strengthening without wearing separate yellow and blue sapphires—which can antagonise if wrongly combined. Common in specific Neecha Bhanga or corporate yoga contexts.'),
      h3('Not for Everyone'),
      p('Pitambari is among the most specialised Navaratna gems. Casual purchase without yoga identification is strongly discouraged.'),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '4–8 carats'],
      ['Metal', 'Gold or Panchdhatu'],
      ['Finger', 'Index or middle finger of the right hand (astrologer may specify)'],
      ['Day', 'Thursday or Saturday (Guruvar or Shanivar)'],
      ['Time', 'Morning Guru hora or evening Shani hora as prescribed'],
      ['Mantra', 'Chant Guru and Shani mantras: "Om Brim Brihaspataye Namah" and "Om Sham Shanicharaya Namah"'],
      ['Purification', 'Turmeric, sesame oil, Gangajal; offer yellow and blue flowers'],
    ]),
    who_should_wear_html: [
      p('Only those with explicit astrological prescription for dual Guru–Shani remedy. Corporate leaders, judges, and spiritual administrators in specific dasha combinations may be candidates.'),
      h3('When Not to Wear'),
      p('Never wear as fashion or without identifying the yoga. If separate Guru or Shani gems are indicated, Pitambari is wrong. Trial wear recommended as with neelam.'),
      h3('Mandatory Expert Review'),
      p(`${BRAND} sells Pitambari only with consultation—this gem demands expert yoga verification.`),
    ].join('\n'),
    benefits_html: [
      h3('Dual Planet Harmony'),
      p('Integrates expansion (Guru) with discipline (Shani) in one talisman for complex karmic assignments.'),
      h3('Career Authority'),
      p('Supports roles requiring both wisdom and strict accountability—law, governance, large institutions.'),
      h3('Karmic Balance'),
      p('Addresses charts where Jupiter and Saturn both aspect lagna or dasha lords simultaneously.'),
      h3('Wealth & Structure'),
      p('Guru brings growth; Shani consolidates. Pitambari symbolises sustainable prosperity.'),
      h3('Spiritual Discipline'),
      p('Combines dharma expansion with tapasya—rare spiritual–material balance.'),
    ].join('\n'),
    types_html: [
      h3('Appearance'),
      p('Bi-colour yellow-blue, parti-colour, or colour-zoned oval and cushion cuts. Both colours must be natural, not diffusion-treated patches.'),
      h3('Origins'),
      ul(['Sri Lanka: Traditional source for Pitambari Neelam', 'Madagascar: Occasional fine dual-tone sapphires', 'Heat treatment must be disclosed']),
      h3('vs Separate Gems'),
      p('Pitambari is not a replacement for convenience—it is a specific remedial choice when astrology demands unity of Guru–Shani energy.'),
    ].join('\n'),
    quality_price_html: [
      p('Rarity of natural bi-colour zoning makes Pitambari premium. Price spans mid to high collector tiers.'),
      h3('Certification'),
      p('Must confirm natural corundum with natural colour zoning—not assembled doublets or diffusion patches.'),
      h3('Price Guidance'),
      p('Specialist gem—budget from fine commercial dual-tone to rare Ceylon collector grades.'),
    ].join('\n'),
    jewellery_html: [
      p('Gold ring showing both colour zones facing outward. Setting must expose yellow and blue regions.'),
      h3('Tips'),
      ul(['Expert muhurta essential', 'Index or middle finger per prescription', 'Do not reset stone hiding colour zones']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Care'),
      p('Standard sapphire cleaning—warm soapy water.'),
      h3('Re-Energisation'),
      p('Alternate Thursday Guru and Saturday Shani rituals as astrologer directs.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Dyed bi-colour, assembled stones, and parti sapphires sold without yoga context are common mis-sales.'),
      h3('Red Flags'),
      ul(['Sold without consultation as "lucky two-planet stone"', 'Colour patches look diffusion-treated', 'Cannot verify natural zoning under microscope']),
      h3('Expert Only'),
      p(`${BRAND} pairs Pitambari sales with Jyotish verification—never impulse purchases.`),
    ].join('\n'),
    faqs: [
      { question: 'What is Pitambari sapphire?', answer: 'A natural sapphire with yellow (Jupiter) and blue (Saturn) colour zones in one stone, worn for specific Guru–Shani yogas.' },
      { question: 'Can anyone wear Pitambari?', answer: 'No—only with explicit astrological prescription. It is not a general substitute for Pukhraj or Neelam.' },
      { question: 'Pitambari vs wearing both gems?', answer: 'Separate yellow and blue sapphires can conflict. Pitambari unifies both energies when a specific yoga demands it.' },
      { question: 'Which finger?', answer: 'Index (Guru) or middle (Shani) finger—astrologer decides based on which planet leads the yoga.' },
      { question: 'Thursday or Saturday?', answer: 'Either or both depending on muhurta. Some prescribe Guru day for first wear.' },
      { question: 'Is Pitambari rare?', answer: 'Yes—natural bi-colour sapphires with clear yellow and blue zones are uncommon and command premium prices.' },
      { question: 'Trial wear needed?', answer: 'Often recommended similar to neelam, especially when Shani influence is strong in the yoga.' },
      { question: 'Madagascar or Ceylon?', answer: 'Ceylon is traditional. Fine Madagascar parti stones work if natural zoning is verified.' },
    ],
  }),

  'exclusive-gems': defineGem({
    slug: 'exclusive-gems',
    name: 'Exclusive Gems',
    hindi: 'Vishisht Ratna',
    planet: 'Navaratna',
    extraKeywords: [
      'rare gemstones',
      'collector gems',
      'kashmir sapphire',
      'burma ruby',
      'padparadscha',
      'on request gems',
      'museum quality',
    ],
    intro:
      'Exclusive Gems is PureVedicGems\' curated on-request category for rare, museum-grade, and exceptionally fine Navaratna specimens. From Kashmir neelam and Burma pigeon-blood ruby to padparadscha and unheated collector sapphires—these stones are sourced to order for discerning collectors and advanced Jyotish practitioners.',
    hero_benefits: [
      { text: 'Access to rare-origin Navaratna gems not listed in standard inventory' },
      { text: 'Collector-grade unheated rubies, sapphires, and emeralds on request' },
      { text: 'Full provenance, lab certification, and Jyotish suitability review' },
      { text: 'White-glove sourcing for high-investment astrological gemstones' },
    ],
    seo_description:
      'Rare Navaratna gems on request—Kashmir sapphire, Burma ruby, padparadscha & collector stones. Sourced by PureVedicGems with certification.',
    about_html: [
      p(
        'The Exclusive Gems category exists for buyers seeking beyond-catalogue excellence: gems of extraordinary origin, size, clarity, or historical significance within the nine Vedic ratnas and their premium variants.',
        'These are not impulse purchases but deliberate acquisitions—often years in planning—for marriage muhurtas, major dasha beginnings, temple donations, or generational heirlooms.',
      ),
      h3('What Qualifies as Exclusive'),
      p(
        'Kashmir blue sapphire, Burma pigeon-blood ruby, Colombian no-oil emerald, padparadscha sapphire, natural Basra pearl, and large unheated Ceylon Pukhraj exemplify this tier. Custom cuts, matched pairs, and legacy stones also qualify.',
      ),
      h3('Sourcing Process'),
      p(
        `${BRAND} leverages dealer networks in Jaipur, Colombo, Bangkok, and Geneva to locate stones matching your astrological brief and investment parameters. Typical lead time ranges from days to several weeks depending on rarity.`,
      ),
      h3('Vedic Integrity'),
      p(
        'Even at collector level, Jyotish suitability remains paramount. The finest gem fails if wrong for your chart. Consultation is included in the exclusive sourcing workflow.',
      ),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', 'Per astrologer—often at upper range of body-weight formula for milestone purchases'],
      ['Metal', 'Gold, Panchdhatu, or platinum per planet of the specific gem'],
      ['Finger', 'Planet-specific: index (Guru), ring (Surya/Mangal), middle (Shani/Rahu/Ketu), little (Budh/Chandra)'],
      ['Day', 'Planet day of the purchased gem (Sunday for ruby, Saturday for neelam, etc.)'],
      ['Time', 'Prescribed muhurta from Jyotish consultation'],
      ['Mantra', 'Planet-specific bija mantra for the acquired ratna'],
      ['Purification', 'Full Vedic puja and energisation—often performed in-house for exclusive pieces'],
    ]),
    who_should_wear_html: [
      p('Serious practitioners, collectors, families planning generational ratna transfer, and individuals entering major dasha periods who require the highest gem quality their chart demands.'),
      h3('When Exclusive Tier Matters'),
      p('When astrologer specifies top-origin material (e.g., Kashmir neelam trial), or when investment and spirituality converge in one purchase.'),
      h3('Consultation Required'),
      p(`Every exclusive enquiry at ${BRAND} begins with chart review and gem brief—not merely budget.`),
    ].join('\n'),
    benefits_html: [
      h3('Maximum Jyotish Potency'),
      p('Classical texts suggest superior gems yield superior results. Exclusive tier offers the highest natural quality.'),
      h3('Investment Preservation'),
      p('Top-origin unheated gems historically hold value. Documentation protects generational wealth.'),
      h3('Personal Legacy'),
      p('Heirloom ratnas passed with provenance stories and certification bind families to dharma.'),
      h3('Ritual Significance'),
      p('Major life transitions—marriage, upanayana, retirement, diksha—deserve milestone gems.'),
      h3('Spiritual Commitment'),
      p('Acquiring an exclusive ratna represents sankalpa—a vow toward planetary harmony and self-mastery.'),
    ].join('\n'),
    types_html: [
      h3('Available on Request'),
      ul([
        'Kashmir blue sapphire (unheated)',
        'Burma pigeon-blood ruby (unheated)',
        'Colombian emerald (minor oil to no oil)',
        'Padparadscha sapphire',
        'Natural Basra or fine South Sea pearl',
        'Large unheated Ceylon yellow sapphire',
        'Museum-grade cat\'s eye chrysoberyl',
      ]),
      h3('Custom Specifications'),
      p('Matched pairs, carved talismans, and specific carat targets sourced to brief.'),
      h3('Transparency'),
      p('Every exclusive gem ships with reputable lab certification and treatment disclosure.'),
    ].join('\n'),
    quality_price_html: [
      p('Exclusive gems span serious investment to ultra-premium collector pricing. Origin, unheated status, and provenance drive premiums.'),
      h3('Certification Standard'),
      p('Gubelin, SSEF, GRS, and GIA reports expected. Origin opinion for Kashmir, Burma, and Colombia when determinable.'),
      h3('Price Guidance'),
      p('From high five-figure per carat to seven-figure auction-level specimens. Budget discussions occur after gem brief and market search.'),
    ].join('\n'),
    jewellery_html: [
      p('Bespoke settings crafted for exclusive gems—often 22K gold with master craftsmanship to protect investment-grade stones.'),
      h3('Setting Philosophy'),
      ul([
        'Security over fashion for high-value ratnas',
        'Open skin contact preserved',
        'Reversible mounts for future repolishing',
        'Insurance documentation provided',
      ]),
    ].join('\n'),
    cleaning_care_html: [
      h3('Professional Care'),
      p('Exclusive gems benefit from annual jeweller inspection and professional cleaning.'),
      h3('Insurance'),
      p('Insure appraised value; store in certified safe when not worn.'),
      h3('Documentation'),
      p('Retain all certificates, invoices, and energisation records with the stone.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Ultra-premium markets attract sophisticated fraud—false origin reports, treated stones sold as unheated, and synthetic equivalents.'),
      h3('Red Flags'),
      ul([
        'Exclusive pricing without top-lab certificate',
        'Pressure to buy without independent verification',
        'Origin claims unsupported by microscopy',
        'No return policy for re-certification',
      ]),
      h3('Trust Process'),
      p(`${BRAND} welcomes third-party lab re-checks and provides full disclosure before exclusive purchase confirmation.`),
    ].join('\n'),
    faqs: [
      { question: 'How do I enquire about exclusive gems?', answer: 'Contact PureVedicGems with your astrological brief, budget range, and timeline. We search dealer networks and present verified options.' },
      { question: 'What is the lead time?', answer: 'Days to several weeks depending on rarity. Kashmir ruby and padparadscha may require extended search.' },
      { question: 'Are exclusive gems more powerful?', answer: 'Classical Jyotish values quality, but chart suitability matters more than price. Exclusive tier maximises both when prescribed.' },
      { question: 'Can I request Kashmir neelam?', answer: 'Yes—Kashmir blue sapphire is a common exclusive request. Unheated stones with origin opinion are extremely rare and priced accordingly.' },
      { question: 'Investment vs astrology?', answer: 'Top gems serve both when origin and naturalness are verified. We prioritise Jyotish fit over pure investment speculation.' },
      { question: 'Payment and certification?', answer: 'Secure payment, full lab reports, and treatment disclosure before delivery. Re-certification window available.' },
      { question: 'Custom jewellery included?', answer: 'Bespoke setting available. Discuss metal, finger, and muhurta during consultation.' },
      { question: 'Trial wear for exclusive neelam?', answer: 'Strongly recommended for high-stakes Shani purchases—even at collector tier.' },
    ],
  }),
};

function shopLink(slug: string, label: string) {
  return `<a href="${canonicalSubcategoryHref(slug) ?? `/shop/${slug}`}">${label}</a>`;
}

export const NAVARATNA_HUB_CONTENT: RichGemSections = {
  intro:
    'Navaratna (Navratna) are the nine primary Vedic gems — one ratna for each graha. At PureVedicGems, stones are certified, treatment-disclosed, and selected only after Jyotish suitability is considered.',
  hero_benefits: [
    { text: 'Nine planetary gems from our Navratnas guide' },
    { text: 'Natural stones with treatment disclosure' },
    { text: 'Buy one prescribed gem or a jewellery set' },
    { text: 'Chart review before combining inimical stones' },
  ],
  seo_title: 'Buy Navaratna Gems Online in India | Vedic Gemstones',
  seo_description:
    'Buy certified Navratna (Navaratna) stones and nine-gem sets online in India. Natural ruby, pukhraj, neelam, diamond or white sapphire. Delhi since 1937.',
  meta_keywords: [
    'buy navratna stone online',
    'buy navaratna set online',
    'navratna set price',
    'certified navratna ring',
    'original navratna stone',
    'navratna pendant',
    'nine gems set',
    'navgrah ratan',
    'diamond vs zircon navratna',
  ],
  about_html: [
    p(
      `According to our <a href="/knowledge/gemstones">Navratnas knowledge guide</a>, planetary imbalances are traditionally addressed with Vedic gems — the nine main gems called Navratnas. They are ${shopLink('ruby', 'Ruby (Manik)')} for the Sun, ${shopLink('pearl', 'Pearl (Moti)')} for the Moon, ${shopLink('red-coral', 'Red Coral (Moonga)')} for Mars, ${shopLink('emerald', 'Emerald (Panna)')} for Mercury, ${shopLink('yellow-sapphire', 'Yellow Sapphire (Pukhraj)')} for Jupiter, ${shopLink('diamond', 'Diamond (Heera)')} for Venus, ${shopLink('blue-sapphire', 'Blue Sapphire (Neelam)')} for Saturn, ${shopLink('hessonite', 'Hessonite (Gomed)')} for Rahu, and ${shopLink('cats-eye', "Cat's Eye (Lehsuniya)")} for Ketu.`,
      `${shopLink('white-sapphire', 'White Sapphire (Safed Pukhraj)')} is the traditional Jyotish substitute for diamond when Heera is not suitable or not affordable — the same mapping used in our gemstone-recommendation notes. Combinations of these stones can be powerful; they should be decided by an expert for your chart, not copied from a generic “wear all nine” list.`,
    ),
    h3('Vedic significance'),
    p(
      'Ancient Indian Sanskrit texts treat gem therapy as one method to counter planetary imbalance. Each Navratna is linked to one graha. For Jyotish use, natural origin, even colour, lively lustre, appropriate cutting, reliable certification, and transparent treatment disclosure matter more than buying a larger stone at the cheapest price.',
      `A nine-stone jewellery set is a recognised ornament. It is not automatically the correct Jyotish remedy. Our Navratnas guide lists inimical gems that are traditionally not worn together unless a learned astrologer gives a special exception — for example Ruby with Diamond, Hessonite, or Blue Sapphire.`,
    ),
    h3('The nine gems, planets, and inimical stones'),
    `<table><thead><tr><th>Gemstone</th><th>Planet</th><th>Traditionally not worn with</th><th>Shop</th></tr></thead><tbody>
<tr><td>Ruby (Manik)</td><td>Sun (Surya)</td><td>Diamond, Hessonite, Blue Sapphire</td><td>${shopLink('ruby', 'Buy Ruby')}</td></tr>
<tr><td>Pearl (Moti)</td><td>Moon (Chandra)</td><td>Hessonite</td><td>${shopLink('pearl', 'Buy Pearl')}</td></tr>
<tr><td>Red Coral (Moonga)</td><td>Mars (Mangal)</td><td>Diamond, Blue Sapphire, Emerald, Hessonite</td><td>${shopLink('red-coral', 'Buy Red Coral')}</td></tr>
<tr><td>Emerald (Panna)</td><td>Mercury (Budh)</td><td>None commonly listed</td><td>${shopLink('emerald', 'Buy Emerald')}</td></tr>
<tr><td>Yellow Sapphire (Pukhraj)</td><td>Jupiter (Guru)</td><td>Hessonite, Blue Sapphire, Diamond</td><td>${shopLink('yellow-sapphire', 'Buy Pukhraj')}</td></tr>
<tr><td>Diamond (Heera) / White Sapphire</td><td>Venus (Shukra)</td><td>Ruby, Red Coral, Yellow Sapphire</td><td>${shopLink('diamond', 'Buy Diamond')} · ${shopLink('white-sapphire', 'White Sapphire')}</td></tr>
<tr><td>Blue Sapphire (Neelam)</td><td>Saturn (Shani)</td><td>Ruby, Red Coral, Yellow Sapphire, Pearl</td><td>${shopLink('blue-sapphire', 'Buy Neelam')}</td></tr>
<tr><td>Hessonite (Gomed)</td><td>Rahu</td><td>Ruby, Pearl, Coral</td><td>${shopLink('hessonite', 'Buy Gomed')}</td></tr>
<tr><td>Cat’s Eye (Lehsuniya)</td><td>Ketu</td><td>None commonly listed</td><td>${shopLink('cats-eye', "Buy Cat's Eye")}</td></tr>
</tbody></table>`,
    h3('Jewellery set versus the prescribed gem'),
    p(
      'Most Jyotish purchases on this site are a single prescribed stone in a suitable carat weight. A matched millimetre set or Navratna ring is jewellery that places all nine species in one ornament. Because several of those species are listed as inimical to each other, a full set should not be treated as “safer overall protection.” Start with <a href="/consultation">consultation</a> or <a href="/gems-recommendations">Which Gemstone Should I Wear?</a>, then buy the stone that was actually recommended.',
    ),
  ].join('\n'),
  how_to_wear_html: [
    p(
      'Our Navratnas guide is clear: after a horoscope is studied, the benefic gem or gems should be purchased from a reliable source. Metal, finger, day, time, and mantra must be considered together — each of the nine stones has its own wearing table on that page. There is no single Sunday / ring-finger rule that covers a full Navaratna combination.',
    ),
    table([
      ['First step', 'Kundli review by a Vedic astrologer. Do not self-prescribe all nine together.'],
      ['Setting', 'Ring or pendant made so the bottom of the gem is open and can touch the body (ray-transmission principle in our guide).'],
      ['Purification', 'Bathe, wear clean clothes, then purify in unboiled cow milk or holy Ganga water.'],
      ['Mantra', 'Energise by chanting the prescribed Vedic mantra at least 108 times. Each Navratna has its own mantra in our <a href="/knowledge/gemstones">Navratnas guide</a> and <a href="/knowledge/energized-gems">energized gems</a> page.'],
      ['Time', 'Wear at the time recommended for you — usually calculated around sunrise or sunset for your location, not a generic weekday copied from Ruby.'],
      ['Inimical gems', 'Stones listed as inimical to the main gem are not worn with it unless a learned astrologer gives a special exception.'],
    ]),
    h3('If you already own a nine-stone ring'),
    p(
      'Jewellery makers often place a ruby in the centre of a Navratna ring as a design. That is an ornament convention, not a substitute for the finger, metal, and day listed for each gem in our knowledge tables. Ask which Venus stone is actually set — diamond, white sapphire, natural zircon, or cubic zirconia — and confirm the combination against your chart before daily wear.',
    ),
  ].join('\n'),
  who_should_wear_html: [
    p(
      'Wear the Navratna that was recommended for your lagna, dasha, and house lords. “Anyone can wear Navratna” is jewellery marketing. Our recommendation notes say combinations can be powerful and should be determined by an expert. Blue Sapphire, Hessonite, and Cat’s Eye are treated with extra caution in our guides, often with a trial or close observation period.',
    ),
    h3('When a full nine-stone ornament is not the remedy'),
    ul([
      'When an astrologer has named one primary gem — buy that stone, not a set that also contains inimical partners.',
      'When Neelam, Gomed, or Lehsuniya has been flagged as unsuitable or only for trial.',
      'When birth time is unknown: date of birth alone is not enough for a responsible Vedic recommendation; still consult rather than defaulting to all nine.',
    ]),
    h3('Consult an astrologer'),
    p(
      `Use <a href="/gems-recommendations">Which Gemstone Should I Wear?</a> with date, time, and place of birth, then <a href="/consultation">book our experts</a>. ${BRAND} would rather sell one correct certified stone than a nine-gem ring that fights the chart.`,
    ),
  ].join('\n'),
  benefits_html: [
    p(
      'Benefits belong to the planet of the gem that was prescribed. They are traditional Jyotish associations from our Navratnas guide — not medical or financial promises, and not a reason to wear all nine at once.',
    ),
    h3('Sun, Moon, and Mars'),
    p(
      'Ruby is linked with vitality, authority, confidence, and public standing. Pearl with emotional steadiness, calmness, and mental peace. Red Coral with courage, stamina, discipline, and decisive action. These three are also the gems most often discussed for health-related charts — still only after analysis, because the wrong stone can aggravate issues.',
    ),
    h3('Mercury, Jupiter, and Venus'),
    p(
      'Emerald is connected with intelligence, communication, trade, and analysis. Yellow Sapphire with wisdom, prosperity, education, marriage guidance, and dharma. Diamond (or White Sapphire as substitute) with refinement, comfort, relationship themes, and artistic taste.',
    ),
    h3('Saturn, Rahu, and Ketu'),
    p(
      'Blue Sapphire is one of the strongest Navratnas — discipline, endurance, karma, and long-term responsibility — and is usually recommended only after careful chart analysis. Hessonite is linked with Rahu: focus during uncertainty, ambition, and unusual delays. Cat’s Eye with Ketu: intuition, detachment, spiritual insight, and protection practices. Both nodal gems are highly individual.',
    ),
  ].join('\n'),
  types_html: [
    h3('The prescribed single gem'),
    p(
      `This is the Jyotish default. Shop ${shopLink('ruby', 'Ruby')}, ${shopLink('pearl', 'Pearl')}, ${shopLink('red-coral', 'Red Coral')}, ${shopLink('emerald', 'Emerald')}, ${shopLink('yellow-sapphire', 'Pukhraj')}, ${shopLink('diamond', 'Diamond')}, ${shopLink('white-sapphire', 'White Sapphire')}, ${shopLink('blue-sapphire', 'Neelam')}, ${shopLink('hessonite', 'Gomed')}, or ${shopLink('cats-eye', "Cat's Eye")} after the planet has been named.`,
    ),
    h3('Matched millimetre set'),
    p(
      'Nine calibrated stones sold as a lot for a jeweller to set. Ask for the species of the white stone in writing. Natural zircon is a listed Venus substitute in our recommendation table; cubic zirconia is not a Vedic gem.',
    ),
    h3('Navratna ring or pendant'),
    p(
      'A ring or pendant can hold all nine species. For Jyotish, the setting must leave the pavilion open to the skin. A pendant is often more practical if you already wear a primary gemstone ring, or if pearl and coral need gentler handling than a tight shank.',
    ),
  ].join('\n'),
  quality_price_html: [
    p(
      'Price follows quality of each of the nine stones plus metal, not a single “Navratna MRP.” Live cards in the collection below are the quote. A listing that is cheaper than one decent Pukhraj usually has an undisclosed Venus substitute or treated organics.',
    ),
    h3('What to verify (from our Navratnas quality checks)'),
    ul([
      'Natural origin and treatment disclosure on every species — heat on sapphire, oil on emerald, dye on coral, cultured vs natural pearl.',
      'Eye-clean appearance where the gem is meant to be transparent; pearl and coral are judged on surface, colour, and polish instead.',
      'Certificate that names the mineral, not a paper that only says “Navratna set.”',
      'Venus stone named as diamond, white sapphire, natural zircon, or something else — never assumed.',
    ]),
    h3('Diamond, white sapphire, and zircon'),
    p(
      'Shukra’s primary ratna is diamond. White sapphire is the traditional substitute. Natural zircon and opal appear as further Venus alternates in our recommendation notes. Cubic zirconia is a lookalike and has no place in a certified Jyotish set. If the invoice does not name the white stone, do not pay diamond prices.',
    ),
    h3('Why prices differ'),
    p(
      'We grade gems by colour, clarity, and brilliance (Economy through Super Luxury). Higher grades are generally more effective astrologically; lower grades can still help when budget is limited. Size of a matched set, a natural diamond vs white sapphire, gold weight, and treatment status all move the total. Compare the collection rather than an invented price band.',
    ),
  ].join('\n'),
  jewellery_html: [
    p(
      `${BRAND} sets prescribed Navaratna gems in open-back rings and pendants, in gold, silver, or other metals as advised for that planet. Finger size, metal, and whether diamond or white sapphire is required should be confirmed before making. If one stone in an existing set chips — pearl and coral are the usual casualties — we can match millimetre size instead of forcing a new nine-piece lot.`,
    ),
    h3('Open setting'),
    p(
      'The Navratnas wearing guide requires the bottom of the gemstone to be open so it can touch the body. Closed cups hide treatments and block that contact.',
    ),
    h3('See stones in Delhi'),
    p(
      `Inspect colour in daylight at our <a href="/about/stores">Saket, New Delhi showroom</a>, or buy certified stones online with insured shipping. Custom jewellery is made after the gems are approved.`,
    ),
  ].join('\n'),
  cleaning_care_html: [
    p(
      'A Navaratna jewel mixes hard corundum (ruby and sapphires) with soft pearl and coral. Our <a href="/knowledge/gems-care">gemstone care guide</a> is the rule: clean as if the weakest stone governs the piece.',
    ),
    h3('Safe routine'),
    ul([
      'Pearl: wipe with a damp soft cloth after wear; do not soak; perspiration and perfume are harmful.',
      'Coral: damp cloth and dry; avoid ammonia and mechanical cleaning.',
      'Emerald: warm water, mild detergent, soft brush — oiling is common, so skip ultrasonic and steam.',
      'Ruby, sapphire, diamond, hessonite, cat’s eye: warm water, detergent, soft brush; do not use ultrasonic, steam, or boiling at home.',
    ]),
    h3('Daily precautions'),
    p(
      'Apply perfume, cologne, and hairspray before the jewellery goes on. Extra care with emeralds, corals, and pearls — they chip and scratch more easily than sapphires and rubies. Store so diamond or sapphire cannot rub the organic gems.',
    ),
  ].join('\n'),
  buyer_beware_html: [
    p(
      'Cheap “original Navratna” listings usually fail on disclosure, not on a missing ninth colour. Read our <a href="/knowledge/treatments">treatments guide</a> before you pay.',
    ),
    ul([
      'Cubic zirconia or glass sold as diamond.',
      'Dyed or composite coral; cultured pearl sold without saying cultured (most modern pearls are cultured).',
      'Glass-filled ruby; diffused or synthetic sapphire sold as Neelam or Pukhraj.',
      'One certificate for “the set” that does not name each mineral.',
      'Closed settings that hide the pavilion.',
      '“Anyone can wear all nine” with no option to skip Neelam, Gomed, or Lehsuniya.',
    ]),
  ].join('\n'),
  faqs: [
    {
      question: 'What are the 9 Navaratna gems?',
      answer:
        'Ruby (Manik) for the Sun, Pearl (Moti) for the Moon, Red Coral (Moonga) for Mars, Emerald (Panna) for Mercury, Yellow Sapphire (Pukhraj) for Jupiter, Diamond or White Sapphire for Venus, Blue Sapphire (Neelam) for Saturn, Hessonite (Gomed) for Rahu, and Cat’s Eye (Lehsuniya) for Ketu.',
    },
    {
      question: 'What is Navratna set price in India?',
      answer:
        'There is no single MRP. Price follows the quality of each stone, whether Venus is diamond or a disclosed substitute, millimetre size, treatment status, and metal. Use the live collection on this page and ask us to name every species before you pay.',
    },
    {
      question: 'Should everyone wear a full Navaratna set?',
      answer:
        'No. Combinations can be powerful and should be determined by an expert. Several Navratnas are listed as inimical to each other in our knowledge tables. Confirm with a Kundli review before stacking all nine, especially Blue Sapphire, Hessonite, and Cat’s Eye.',
    },
    {
      question: 'Can I buy Navaratna gems individually?',
      answer:
        'Yes. That is the usual Jyotish path: wear the prescribed gem, then add others only if advised. Each of the nine stones has its own shop page on this site.',
    },
    {
      question: 'Is the white stone in Navratna a real diamond?',
      answer:
        'Only if the invoice says diamond (Heera). White sapphire is the traditional Jyotish substitute. Natural zircon is a further Venus alternate in our recommendation notes. Cubic zirconia is not an astrological gem.',
    },
    {
      question: 'How do I wear a Navratna ring?',
      answer:
        'There is no one weekday for all nine gems. After chart review, use an open-back setting, purify in unboiled cow milk or Ganga jal, chant the prescribed mantra 108 times, and wear at the time calculated for your location (typically around sunrise or sunset). Metal and finger follow the astrologer — and the individual tables in our Navratnas knowledge guide.',
    },
    {
      question: 'Who can wear a Navaratna ring?',
      answer:
        'A nine-gem ring can be worn as jewellery. For Jyotish, only after consultation. Skip or trial Neelam, Gomed, and Lehsuniya when they are not indicated.',
    },
    {
      question: 'Navratna ring or pendant — which is better?',
      answer:
        'Both work for skin contact if the back is open. A pendant is often easier if you already wear a primary gemstone ring, or if pearl and coral need gentler wear than a tight shank.',
    },
    {
      question: 'How do I identify original certified Navratna stones?',
      answer:
        'Each gem should match its species, come with treatment disclosure, and name diamond vs white sapphire vs zircon. Natural origin, even colour, lively lustre, and a lab report that identifies the mineral matter more than a cheap “set” label. You can inspect stones in our Delhi showroom.',
    },
    {
      question: 'Can I wear Navratna with other astrological gemstones?',
      answer:
        'Only if the astrologer allows it. Inimical gems are traditionally not worn together. Do not add a Navratna ring that contains Neelam on top of a Neelam ring without advice.',
    },
    {
      question: 'Do you ship Navratna stones across India?',
      answer:
        'Yes. PureVedicGems ships certified Navaratna gems and jewellery across India with insured delivery, and you can view pieces in our Delhi showroom. International shipping is available on request for listed in-stock stones.',
    },
    {
      question: 'What is a Navaratna set?',
      answer:
        'In jewellery, a Navaratna set is the nine planetary gems in one ornament. In Jyotish, the nine Navratnas are the primary Vedic gems for the nine grahas; you usually wear the one (or ones) prescribed for your chart, not all nine by default.',
    },
  ],
};
