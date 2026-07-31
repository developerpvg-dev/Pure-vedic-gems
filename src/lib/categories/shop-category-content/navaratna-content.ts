import type { CategoryFaq } from '@/lib/types/shop-category-page';
import {
  BRAND,
  baseGemKeywords,
  h3,
  mergeKeywords,
  p,
  table,
  ul,
  type RichGemSections,
} from './helpers';

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
    extraKeywords: ['ceylon pukhraj', 'sri lanka yellow sapphire', 'guru ratna', 'sagittarius gemstone', 'pisces gemstone', 'unheated pukhraj'],
    intro:
      'Yellow Sapphire (Pukhraj) radiates the benevolent wisdom of Guru—Jupiter. Among the most auspicious Navaratna gems, a fine natural Pukhraj is sought for prosperity, marriage blessings, and spiritual growth. PureVedicGems selects Ceylon and other origins with heat-treatment disclosure and Jyotish grading.',
    hero_benefits: [
      { text: 'Attracts wealth, wisdom, and righteous expansion of fortune' },
      { text: 'Traditionally worn for marriage, children, and relationship harmony' },
      { text: 'Supports law, teaching, finance, and advisory careers' },
      { text: 'Pacifies afflicted Guru during challenging dasha periods' },
    ],
    seo_description:
      'Buy certified Yellow Sapphire (Pukhraj) online for Guru. Ceylon unheated sapphires, gold settings, Jyotish consultation from PureVedicGems.',
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
    name: 'Blue Sapphire',
    hindi: 'Neelam',
    planet: 'Saturn',
    extraKeywords: ['kashmir neelam', 'ceylon blue sapphire', 'shani ratna', 'capricorn gemstone', 'aquarius gemstone', 'unheated neelam'],
    intro:
      'Blue Sapphire (Neelam) channels the disciplined depth of Shani—Saturn. Revered and respected for its swift results, a fine natural neelam demands careful astrological prescription. PureVedicGems emphasises chart consultation, trial periods, and certified unheated sapphires where available.',
    hero_benefits: [
      { text: 'Strengthens Shani for career discipline, longevity, and karmic endurance' },
      { text: 'Supports land, mining, iron, oil, and structured enterprise' },
      { text: 'Traditionally worn during Sade Sati and Shani mahadasha under guidance' },
      { text: 'Promotes focus, austerity, and protection from chronic obstacles' },
    ],
    seo_description:
      'Buy certified Blue Sapphire (Neelam) online for Shani. Ceylon & Kashmir sapphires, trial guidance & Jyotish consultation from PureVedicGems.',
    about_html: [
      p(
        'Blue sapphire is corundum coloured by iron and titanium. Sanskrit: Neelam or Neelashma. It is the ratna of Shani—Saturn, karmic taskmaster of discipline, delay, and justice.',
        'Fine stones show velvety blue to violetish-blue. Kashmir, Sri Lanka, Madagascar, and Myanmar produce notable blues. Neelam is famed for fast-acting Jyotish results—positive or negative if wrongly prescribed.',
      ),
      h3('Vedic Significance'),
      p('Saturn rules Capricorn and Aquarius, longevity, servants, iron, and chronic illness. Pushya, Anuradha, and Uttara Bhadrapada nakshatras link to neelam. Mandatory astrologer consultation is the industry norm for blue sapphire.'),
      h3('Caution'),
      p('Unlike gentler gems, neelam is tested by wearing tied to the arm for 72 hours or similar trial methods before final setting. Never wear without expert approval.'),
    ].join('\n'),
    how_to_wear_html: table([
      ['Weight', '3–7 carats'],
      ['Metal', 'Gold or Panchdhatu (iron ring traditions exist; gold is widely used)'],
      ['Finger', 'Middle finger of the right hand'],
      ['Day', 'Saturday (Shanivar)'],
      ['Time', 'Evening during Shani hora'],
      ['Mantra', 'Chant "Om Sham Shanicharaya Namah" or "Om Praam Preem Praum Sah Shanaye Namah" 108 times'],
      ['Purification', 'Gangajal, sesame oil rinse, black sesame offering, light mustard oil lamp'],
    ]),
    who_should_wear_html: [
      p('Neelam suits strong or favourably placed Shani lords, Capricorn and Aquarius ascendants in many charts, and those in Shani mahadasha with benefic Saturn. Industrialists, judges, and spiritual ascetics sometimes wear neelam.'),
      h3('When Not to Wear'),
      p('Avoid if Shani is severely afflicted in dusthana without remediation, if trial wear caused immediate adverse effects, or if your astrologer explicitly prohibits it. Not for casual purchase.'),
      h3('Mandatory Consultation'),
      p(`${BRAND} insists on Jyotish review and trial protocol before final neelam setting—this is non-negotiable for Shani gems.`),
    ].join('\n'),
    benefits_html: [
      h3('Career & Discipline'),
      p('Neelam rewards hard work with structural success—ideal for long-term projects, government service, and law.'),
      h3('Wealth Through Labour'),
      p('Shani gives slowly but permanently. Blue sapphire supports sustained wealth from discipline, not speculation.'),
      h3('Health & Longevity'),
      p('Traditionally associated with bones, nerves, and chronic conditions—worn for Shani-related health karmas with medical care.'),
      h3('Protection'),
      p('Neelam is worn as a shield against enemies, litigation, and evil eye in many North Indian traditions.'),
      h3('Spiritual Austerity'),
      p('Saturn guides moksha through detachment. Neelam supports serious spiritual practice and service to the poor.'),
    ].join('\n'),
    types_html: [
      h3('Origins'),
      ul(['Kashmir: Velvety cornflower—legendary collector grade', 'Ceylon: Bright blue, most common fine Jyotish source', 'Madagascar: Deep blues, verify treatment', 'Burma & Australia: Select fine stones available']),
      h3('Colour'),
      p('Medium to medium-dark vivid blue preferred. Too dark blackish or pale washed-out stones are less ideal.'),
      h3('Treatment'),
      p('Unheated strongly preferred. Beryllium diffusion and lattice diffusion disqualify stones for classical ratna use.'),
    ].join('\n'),
    quality_price_html: [
      p('Kashmir neelam reaches auction-level premiums. Fine unheated Ceylon spans mid to premium collector tiers per carat.'),
      h3('Certification'),
      p('GRS, GIA, Gubelin must state heat treatment. Origin reports add value for Kashmir and Burma.'),
      h3('Price Guidance'),
      p('From commercial heated blues to investment-grade unheated Kashmir—budget varies enormously. Never compromise on consultation to afford a larger stone.'),
    ].join('\n'),
    jewellery_html: [
      p('Gold or Panchdhatu ring on middle finger after successful trial. Closed secure setting—neelam is worn daily for Shani.'),
      h3('Trial Setting'),
      p('Many astrologers recommend wrapping stone in metal wire on arm before permanent ring mount.'),
      h3('Tips'),
      ul(['Saturday evening energisation', 'Middle finger only unless prescribed otherwise', 'Avoid pairing with ruby without expert approval']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Routine'),
      p('Warm soapy water—sapphire is durable. Dry thoroughly.'),
      h3('Re-Energisation'),
      p('Saturday Shani mantra, sesame lamp, Gangajal rinse.'),
      h3('Inspection'),
      p('Check setting annually—loss of neelam is considered astrologically significant.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Synthetic flux, hydrothermal, and cobalt-diffused sapphires flood markets. Blue glass and iolite substitutes abound.'),
      h3('Red Flags'),
      ul(['Sold without consultation warning', 'Claimed Kashmir origin at low price', 'No heat treatment disclosure']),
      h3('Trial First'),
      p(`${BRAND} supports trial protocols—responsible neelam selling never skips chart analysis.`),
    ].join('\n'),
    faqs: [
      { question: 'Why is neelam considered dangerous?', answer: 'Shani gives swift results. If Saturn is unfavourable, neelam may amplify challenges. Hence trial wear and expert prescription are essential.' },
      { question: 'What is the neelam trial method?', answer: 'Traditionally, tie the stone to your arm for 48–72 hours and observe dreams, mood, and events before committing to a ring.' },
      { question: 'Can I wear neelam during Sade Sati?', answer: 'Sometimes yes, sometimes no—it depends on Shani\'s house lordship and dignity. Never assume Sade Sati automatically requires neelam.' },
      { question: 'Kashmir or Ceylon?', answer: 'Kashmir is legendary and rare. Fine unheated Ceylon neelam is the practical astrological standard today.' },
      { question: 'Which finger for neelam?', answer: 'Middle finger of the right hand is classical for Shani.' },
      { question: 'Neelam with yellow sapphire?', answer: 'Guru–Shani combinations require expert yoga analysis. Pitambari sapphire exists specifically for dual influence charts.' },
      { question: 'Heated blue sapphire for Jyotish?', answer: 'Unheated is strongly preferred. Some astrologers accept disclosed heat-only if Saturn is well-placed.' },
      { question: 'How fast does neelam work?', answer: 'Anecdotes report changes within days to weeks—another reason prescription matters.' },
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
