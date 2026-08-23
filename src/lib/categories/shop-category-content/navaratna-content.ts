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
    name: 'Natural Ruby Gemstone',
    hindi: 'Manik',
    planet: 'Sun',
    extraKeywords: [
      'ruby gemstone',
      'ruby stone',
      'ruby stone price',
      'natural ruby',
      'natural ruby stone',
      'burma ruby',
      'mozambique ruby',
      'surya ratna',
      'unheated ruby',
    ],
    seo_description:
      'Natural ruby stone and ruby gemstone (Manik) for Surya. Ruby stone price for certified Burma and Mozambique stones.',
    intro:
      'Natural Ruby Gemstone (Manik) is Surya’s gem. A natural ruby stone needs a chart reading and honest heat disclosure. PureVedicGems lists certified ruby gemstone lots and will not hide treatment.',
    hero_benefits: [
      { text: 'Leadership and Surya' },
      { text: 'Sunday wear' },
      { text: 'Heat disclosed' },
      { text: 'Certified ruby gemstone' },
    ],
    about_html: [
      p(
        'A natural ruby gemstone is red corundum. Chromium gives the colour. In Hindi it is Manik. Vedic astrology treats this ruby stone as the ratna of Surya — the Sun.',
        'Fine ruby gemstone lots show pigeon-blood to pomegranate red. Burma (Mogok), Mozambique, Sri Lanka, Thailand, Madagascar, and India supply the natural ruby we grade for Jyotish.',
        'Treat a natural ruby stone as a prescribed remedy. Results depend on a matching chart and disclosed heat — not on a pretty photo.',
      ),
      h3('Vedic Significance'),
      p(
        'The Sun rules Leo. He also rules father, government, bones, and vitality. Krittika, Uttara Phalguni, and Uttara Ashadha link to Manik in many lists.',
        'So a ruby gemstone is often named in Surya mahadasha. Those periods do not always need Manik. First get a Jyotish reading.',
      ),
      h2('What is a Ruby Gemstone'),
      p(
        'A ruby gemstone is corundum with chromium. Colour runs from pink-red to deep blood red. Among Navaratna gems, this ruby stone is used for authority and ojas.',
        'A natural ruby needs lab identity. Glass-filled corundum is not a ruby gemstone for Jyotish.',
      ),
      h2('What customers say about ruby'),
      p(
        'People write about clearer leadership and steadier energy — after the chart check, not overnight miracles.',
        'If you want that path, read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a ruby stone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear a natural ruby gemstone only after the chart check. The table is the PureVedicGems Jyotish pattern.'),
      table([
        ['Weight', 'Generally 3–6 carats. Confirm with Jyotish.'],
        ['Colour', 'Pigeon-blood to deep pomegranate red. Avoid dull pink for ratna use.'],
        ['Metal', '22-karat yellow gold or Panchdhatu.'],
        ['Finger', 'Ring finger of the right hand (working hand).'],
        ['Day', 'Sunday morning'],
        ['Time', 'Sunrise during Surya hora'],
        ['Mantra', 'Chant “Om Hram Hrim Hroum Sah Suryaya Namah” 108 times'],
        ['Purification', 'Raw milk, honey, and Gangajal; offer red flowers'],
      ]),
      p('First cleanse the ruby stone. Then chant. Then set it so the ruby gemstone can touch skin.'),
    ].join('\n'),
    who_should_wear_html: [
      p(
        'A natural ruby gemstone suits many Leo charts when the Sun should be strengthened. Leaders, doctors, and public roles often wear this ruby stone after a reading.',
        'Wear Manik when Surya is weak, combust, or in a dasha that needs support.',
      ),
      h3('When a Natural Ruby Stone May Help'),
      ul([
        'Leo lagna with a Sun that needs support',
        'Surya mahadasha after an astrologer confirms Manik',
        'Careers in government, medicine, and visible leadership',
      ]),
      h3('When Not to Wear'),
      p('Avoid a natural ruby gemstone if Surya is already strong with no affliction. Do not buy because a colleague wears one.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review before the final setting. Book a <a href="/consultation">consultation</a> if you are unsure. Then read the <a href="/knowledge/gem-qualities/ruby">ruby quality guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear a natural ruby gemstone for Surya’s themes: authority, vitality, and father. These are traditional Jyotish uses, not medical claims.'),
      h3('Leadership'),
      p('A well-chosen ruby stone is worn for recognition and command. Effort still does the work.'),
      h3('Vitality'),
      p('Texts link the Sun to heart and ojas. Some people wear a ruby gemstone beside medical care for fatigue. See a doctor for health.'),
      h3('Family and dharma'),
      p('A natural ruby stone is worn for paternal blessings and clear purpose. This is traditional support, not a guarantee.'),
    ].join('\n'),
    types_html: [
      p('Not every ruby gemstone is equal. Origin, colour, heat, and cut change both ruby stone price and Jyotish fitness.'),
      h2('Ruby Gemstone Origins'),
      ul([
        '<a href="/gemstones/navaratna/ruby?origin=Burma">Burma Ruby</a>: pigeon-blood standard for a fine ruby stone',
        '<a href="/gemstones/navaratna/ruby?origin=Mozambique">Mozambique Ruby</a>: strong saturation in a natural ruby gemstone',
        '<a href="/gemstones/navaratna/ruby?origin=Ceylon">Ceylon Ruby</a>: often lighter pink-red',
      ]),
      h2('Natural Ruby vs Heated Stone'),
      p(
        'Unheated natural ruby is the Jyotish standard. Heat-only may be accepted if disclosed. Lead-glass filling is not a natural ruby stone for ratna use.',
        'Ask for the treatment line on the report before you pay ruby stone price for a Burma claim.',
      ),
    ].join('\n'),
    quality_price_html: [
      p('Ruby stone price follows colour, clarity, carat, origin, and treatment. A natural ruby gemstone with no heat sits above glass-filled lots.'),
      h2('Ruby Stone Price'),
      p(
        'On our quality scale, a commercial ruby gemstone can start near INR 100–1,500 per carat. Heated mid grades often sit near INR 1,500–7,000. Fine ruby stone lots run about INR 7,000–35,000. Rare unheated Burma and Madagascar ruby gemstone material can reach about INR 35,000–3,50,000 per carat.',
        'India ruby stone price overall spans about INR 100–3,50,000 per carat. Jyotish-grade natural ruby usually starts nearer INR 7,000 when colour and identity are honest.',
      ),
      h3('Certification'),
      p('The report must say natural corundum and name heat or filler. A ruby gemstone without that line is a guess, not a buy.'),
    ].join('\n'),
    jewellery_html: [
      p('A natural ruby gemstone is set in gold so the ruby stone touches skin. Open-back rings on the ring finger are the Jyotish default.'),
      h3('Setting'),
      ul(['Open culet', 'Sunday energisation', 'Panchdhatu allowed when the astrologer names it']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm water and mild soap. Skip ultrasonic if the ruby gemstone is fractured or glass-filled.'),
      h3('Storage'),
      p('A ruby stone is Mohs 9. Keep it off softer gems.'),
      h3('Re-Energisation'),
      p('Sunday Surya mantra and a Gangajal rinse on the ruby gemstone.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Flame-fusion, flux, and glass-filled corundum are sold as a ruby gemstone. Red spinel is sold as a ruby stone.'),
      h2('Natural Ruby vs Synthetic'),
      p('A natural ruby gemstone shows silk and growth, not curved striae. If ruby stone price is far below Burma market, assume filler until a lab says otherwise.'),
      h3('Red Flags'),
      ul(['Burma claim with no report', 'No heat line', 'Composite or assembled ruby gemstone wording']),
      p(`${BRAND} discloses origin and treatment on every natural ruby stone listing.`),
    ].join('\n'),
    faqs: [
      { question: 'What is a ruby gemstone?', answer: 'A ruby gemstone is red corundum (Manik). Chromium makes the red. It is Surya’s Navaratna gem when natural and certified.' },
      { question: 'What is a ruby stone in Jyotish?', answer: 'A ruby stone is the same mineral — Manik for the Sun. Wear it only after a chart reading.' },
      { question: 'What is ruby stone price in India?', answer: 'Ruby stone price on our scale runs about INR 100–3,50,000 per carat. Jyotish-grade natural ruby gemstone lots usually sit higher once heat and origin are honest.' },
      { question: 'What is a natural ruby?', answer: 'A natural ruby is mined corundum, not flame-fusion. Ask for the natural origin line on the report.' },
      { question: 'What is a natural ruby stone?', answer: 'A natural ruby stone is untreated or only heat-disclosed corundum with no glass fill. That is the Manik we list for Jyotish.' },
      { question: 'Which finger for a ruby gemstone?', answer: 'Ring finger of the right hand in gold, so the ruby stone touches skin.' },
      { question: 'Can I wear a ruby gemstone with neelam?', answer: 'Sun and Saturn clash. Do not pair a ruby stone with blue sapphire unless an astrologer writes it.' },
      { question: 'Is heated ruby a natural ruby stone?', answer: 'Heat-only can still be a natural ruby. Glass fill is not. Read the report.' },
      { question: 'How many carats of ruby gemstone?', answer: 'Generally 3–6 carats. Confirm with Jyotish and body weight.' },
      { question: 'Best origin for a ruby stone?', answer: 'Burma and Mozambique lead colour. A vivid natural ruby gemstone beats a weak “Burma” label.' },
    ],
  }),

  pearl: defineGem({
    slug: 'pearl',
    name: 'Natural Pearl Gemstone',
    hindi: 'Moti',
    planet: 'Moon',
    extraKeywords: [
      'pearl gemstone',
      'pearl stone',
      'natural pearl',
      'moti stone',
      'moti stone price',
      'basra pearl',
      'south sea pearl',
    ],
    seo_description:
      'Natural pearl gemstone and pearl stone (Moti) for Chandra. Moti stone price for certified South Sea and Basra lots.',
    intro:
      'Natural Pearl Gemstone (Moti) is Chandra’s gem. A pearl stone is organic nacre, not a mined crystal. PureVedicGems lists certified natural pearl lots with type and lustre on the report.',
    hero_benefits: [
      { text: 'Moon and mind' },
      { text: 'Monday wear' },
      { text: 'Silver setting' },
      { text: 'Certified pearl stone' },
    ],
    about_html: [
      p(
        'A natural pearl gemstone is nacre grown in a mollusc. In Hindi it is Moti. Vedic astrology treats this pearl stone as the ratna of Chandra — the Moon.',
        'Fine pearl gemstone lots show orient and a soft glow. Basra, South Sea, Akoya, and historic Gulf sources supply the natural pearl we grade.',
        'Glass-coated beads are not a pearl stone for Jyotish. Ask for nacre on the report.',
      ),
      h3('Vedic Significance'),
      p(
        'The Moon rules Cancer. He also rules mind, mother, and fluids. Rohini, Hasta, and Shravana link to Moti in many lists.',
        'So a pearl gemstone is often named in Chandra mahadasha. First get a Jyotish reading.',
      ),
      h2('What is a Pearl Gemstone'),
      p(
        'A pearl gemstone is organic. Mohs 2.5–4.5. A moti stone needs gentle wear away from perfume.',
        'A natural pearl may be wild or cultured nacre. Plastic is not Moti.',
      ),
      h2('What customers say about pearl'),
      p(
        'People write about calmer sleep and steadier mood — after the chart check, not overnight miracles.',
        'Read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a pearl stone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear a natural pearl gemstone only after the chart check. The table is the PureVedicGems Jyotish pattern.'),
      table([
        ['Weight', 'Generally 4–7 ratti. Confirm with Jyotish.'],
        ['Colour', 'Milky white to cream with orient. Dull chalky lots are a weaker pearl stone.'],
        ['Metal', 'Silver.'],
        ['Finger', 'Little finger of the right hand.'],
        ['Day', 'Monday evening (Shukla Paksha preferred)'],
        ['Time', 'Chandra hora'],
        ['Mantra', 'Chant “Om Shram Shrim Shroum Sah Chandraya Namah” 108 times'],
        ['Purification', 'Raw milk, Gangajal, white flowers'],
      ]),
      p('Set the pearl gemstone so the moti stone can touch skin.'),
    ].join('\n'),
    who_should_wear_html: [
      p('A natural pearl gemstone suits many Cancer charts when the Moon should be strengthened. Carers and artists often wear this pearl stone after a reading.'),
      h3('When a Pearl Stone May Help'),
      ul(['Weak or afflicted Moon', 'Chandra mahadasha after an astrologer confirms Moti', 'Need for calmer mind and home']),
      h3('When Not to Wear'),
      p('Avoid a pearl gemstone if Chandra is already strong with no affliction. Depression still needs medical care beside a moti stone.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review before the final setting. Book a <a href="/consultation">consultation</a>. Then read the <a href="/knowledge/gem-qualities/pearl">pearl quality guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear a natural pearl gemstone for Chandra’s themes: mind, mother, and rest. These are traditional uses, not medical claims.'),
      h3('Mind'),
      p('A pearl stone is worn for calmer thought. Effort and sleep hygiene still do the work.'),
      h3('Home and mother'),
      p('A pearl gemstone is a traditional support for family peace.'),
      h3('Public ease'),
      p('The Moon rules popularity. A moti stone does not replace skill.'),
    ].join('\n'),
    types_html: [
      p('Not every pearl gemstone is equal. Type and lustre change moti stone price and Jyotish fitness.'),
      h2('Pearl Gemstone Origins'),
      ul([
        'Basra and historic Gulf: the classical natural pearl for Moti',
        'South Sea: large satiny pearl stone lots',
        'Akoya: smaller high-lustre pearl gemstone lots',
      ]),
      h2('Natural Pearl vs Imitation'),
      p('A natural pearl shows nacre layers. Coated glass is a fake pearl stone. Cultured nacre can still be a pearl gemstone if the report says so.'),
    ].join('\n'),
    quality_price_html: [
      p('Moti stone price follows lustre, size, and whether the pearl gemstone is nacre or a bead.'),
      h2('Moti Stone Price'),
      p(
        'A commercial pearl stone can sit far below a rare Basra natural pearl gemstone. Ask for type on the invoice before you pay moti stone price.',
        'Freshwater lots cost less. South Sea and Basra pearl gemstone material sits higher when orient is strong.',
      ),
      h3('Certification'),
      p('The report should confirm nacre. A pearl stone without that line is a guess.'),
    ].join('\n'),
    jewellery_html: [
      p('A natural pearl gemstone is set in silver so the pearl stone touches skin. Open-back rings on the little finger are the Jyotish default.'),
      h3('Setting'),
      ul(['Monday energisation', 'Keep perfume off the moti stone', 'Soft cloth storage']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Damp cloth only. A pearl gemstone is soft. Skip ultrasonic and acids.'),
      h3('Re-Energisation'),
      p('Monday Chandra mantra and a milk rinse on the pearl stone.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Plastic and coated glass are sold as a pearl gemstone. If moti stone price is souvenir-cheap, assume paint.'),
      h2('Natural Pearl vs Fake'),
      p('A natural pearl feels cool and slightly gritty on the tooth test used by dealers. A fake pearl stone is too smooth and light.'),
      h3('Red Flags'),
      ul(['Perfectly identical strands at a low moti stone price', 'No nacre line', 'Seller calls plastic a pearl gemstone']),
      p(`${BRAND} discloses type on every pearl stone listing.`),
    ].join('\n'),
    faqs: [
      { question: 'What is a pearl gemstone?', answer: 'A pearl gemstone is nacre (Moti) for the Moon. It is organic, not mined corundum.' },
      { question: 'What is a pearl stone in Jyotish?', answer: 'A pearl stone is the same gem — Chandra’s ratna. Wear it after a chart reading.' },
      { question: 'What is a natural pearl?', answer: 'A natural pearl is nacre without a plastic coat. Cultured nacre can still be Moti if disclosed.' },
      { question: 'What is moti stone?', answer: 'Moti stone is the Hindi name for a pearl gemstone.' },
      { question: 'What is moti stone price in India?', answer: 'Moti stone price follows lustre, size, and type. Basra natural pearl gemstone lots sit far above freshwater commercial strands.' },
      { question: 'Which finger for a pearl gemstone?', answer: 'Little finger of the right hand in silver, so the pearl stone touches skin.' },
      { question: 'Monday rules for Moti?', answer: 'Monday evening in Shukla Paksha is the usual start. Chant the Chandra mantra 108 times.' },
      { question: 'South Sea or Basra pearl stone?', answer: 'Basra is the classical natural pearl. Fine South Sea pearl gemstone lots also work when lustre is honest.' },
      { question: 'Can children wear a pearl gemstone?', answer: 'Pearl is among the gentler Navaratna gems. Still get a chart check before a moti stone for a child.' },
      { question: 'How do I clean a pearl stone?', answer: 'Wipe a pearl gemstone with a damp cloth. Keep perfume and ultrasonic cleaners off Moti.' },
    ],
  }),

  'red-coral': defineGem({
    slug: 'red-coral',
    name: 'Natural Red Coral Stone',
    hindi: 'Moonga',
    planet: 'Mars',
    extraKeywords: [
      'red coral',
      'red coral stone',
      'red coral gemstone',
      'moonga',
      'moonga stone price',
      'italian coral',
      'natural red coral',
    ],
    seo_description:
      'Natural red coral stone and red coral gemstone (Moonga) for Mangal. Moonga stone price for Italian and Japanese coral.',
    intro:
      'Natural Red Coral Stone (Moonga) is Mangal’s gem. A red coral gemstone is organic calcium carbonate, not plastic. PureVedicGems lists undyed red coral with origin on the report.',
    hero_benefits: [
      { text: 'Mars and courage' },
      { text: 'Tuesday wear' },
      { text: 'Italian coral' },
      { text: 'Undyed red coral' },
    ],
    about_html: [
      p(
        'A natural red coral stone is the skeleton of Corallium. In Hindi it is Moonga. Vedic astrology treats this red coral gemstone as the ratna of Mangal — Mars.',
        'Fine red coral shows ox-blood to sindoori red. Italy, Japan, and Taiwan supply the lots we grade. Dyed sponge is not Moonga.',
      ),
      h3('Vedic Significance'),
      p(
        'Mars rules Aries and Scorpio. He also rules blood, land, and courage. Mrigashira, Chitra, and Dhanishta link to Moonga in many lists.',
        'So a red coral stone is often named in Mangal mahadasha. First get a Jyotish reading.',
      ),
      h2('What is a Red Coral Stone'),
      p(
        'A red coral stone is organic. Mohs 3–4. A red coral gemstone needs care away from chemicals.',
        'Natural red coral has growth lines. Uniform neon red at a low moonga stone price is often dye.',
      ),
      h2('What customers say about red coral'),
      p(
        'People write about steadier nerve and clearer action — after the chart check.',
        'Read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a red coral gemstone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear a natural red coral stone only after the chart check. The table is the PureVedicGems Jyotish pattern.'),
      table([
        ['Weight', 'Generally 6–12 ratti. Confirm with Jyotish.'],
        ['Colour', 'Vivid sindoori to ox-blood. Dull orange is a weaker red coral gemstone.'],
        ['Metal', 'Copper, Panchdhatu, or 22-karat gold.'],
        ['Finger', 'Ring finger of the right hand.'],
        ['Day', 'Tuesday morning'],
        ['Time', 'Mangal hora'],
        ['Mantra', 'Chant “Om Kram Krim Kroum Sah Bhaumaya Namah” 108 times'],
        ['Purification', 'Gangajal; offer red flowers to Hanuman'],
      ]),
      p('Set the red coral stone so the red coral gemstone can touch skin.'),
    ].join('\n'),
    who_should_wear_html: [
      p('A natural red coral stone suits many Aries and Scorpio charts when Mars should be strengthened. Athletes and builders often wear this red coral gemstone after a reading.'),
      h3('When Red Coral May Help'),
      ul(['Weak or afflicted Mars', 'Mangal mahadasha after an astrologer confirms Moonga', 'Land, sport, and surgery recovery beside medical care']),
      h3('When Not to Wear'),
      p('Avoid a red coral stone if Mars is already strong with no affliction. Hypertension still needs a doctor beside a red coral gemstone.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review before the final setting. Book a <a href="/consultation">consultation</a>. Then read the <a href="/knowledge/gem-qualities/red-coral">red coral quality guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear a natural red coral stone for Mangal’s themes: courage, blood, and land. These are traditional uses, not medical claims.'),
      h3('Courage'),
      p('A red coral gemstone is worn for decisive action. Effort still does the work.'),
      h3('Property'),
      p('Mars rules land. A red coral stone is a traditional support, not a legal shortcut.'),
      h3('Vitality'),
      p('See a doctor for health. Moonga is not medicine.'),
    ].join('\n'),
    types_html: [
      p('Not every red coral stone is equal. Origin and dye change moonga stone price and Jyotish fitness.'),
      h2('Red Coral Gemstone Origins'),
      ul([
        'Italy (Sardinia): ox-blood natural red coral — the usual Jyotish benchmark',
        'Japan: bright red coral gemstone lots with good polish',
        'Taiwan: commercial red coral stone — verify dye',
      ]),
      h2('Natural Red Coral vs Dyed'),
      p('Natural red coral keeps colour through the piece. Dyed sponge fades. Plastic is not a red coral gemstone.'),
    ].join('\n'),
    quality_price_html: [
      p('Moonga stone price follows colour, origin, and whether the red coral stone is undyed.'),
      h2('Moonga Stone Price'),
      p(
        'On our quality scale, fake or dull lots can start near INR 100–300 per carat. Wearable red coral gemstone lots often sit near INR 400–1,100. Fine Italian red coral stone runs about INR 1,000–2,000. Top Japanese and Italian material can reach about INR 3,500–5,000 per carat.',
        'Original moonga stone price in India overall spans about INR 400–7,000 per carat when identity is honest.',
      ),
      h3('Certification'),
      p('The report should say natural coral, not plastic. A red coral gemstone without that line is a guess.'),
    ].join('\n'),
    jewellery_html: [
      p('A natural red coral stone is set so the red coral gemstone touches skin. Gold or copper on the ring finger is the Jyotish default.'),
      h3('Setting'),
      ul(['Tuesday energisation', 'Remove for chemicals', 'Repolish worn Moonga']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Damp cloth only. A red coral stone is soft. Skip ultrasonic.'),
      h3('Re-Energisation'),
      p('Tuesday mantra and a Gangajal wipe on the red coral gemstone.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Plastic and dyed bamboo are sold as a red coral stone. If moonga stone price is tourist-cheap, assume dye.'),
      h2('Natural Red Coral vs Fake'),
      p('Natural red coral shows growth texture. Bubbles mean plastic, not a red coral gemstone.'),
      h3('Red Flags'),
      ul(['Italian claim with no report', 'Neon even colour', 'Red coral stone priced like resin']),
      p(`${BRAND} discloses origin and dye status on every red coral gemstone listing.`),
    ].join('\n'),
    faqs: [
      { question: 'What is a red coral stone?', answer: 'A red coral stone is organic Moonga for Mars. It is not plastic or dyed sponge.' },
      { question: 'What is a red coral gemstone in Jyotish?', answer: 'A red coral gemstone is the same mineral — Mangal’s ratna. Wear it after a chart reading.' },
      { question: 'What is moonga stone price in India?', answer: 'Moonga stone price on our scale runs about INR 400–7,000 per carat for original red coral. Fake lots sit lower.' },
      { question: 'Italian or Japanese red coral?', answer: 'Italian ox-blood is the usual benchmark. Fine Japanese red coral gemstone lots also work if undyed.' },
      { question: 'Which finger for a red coral stone?', answer: 'Ring finger of the right hand, so the red coral gemstone touches skin.' },
      { question: 'Can red coral remove Mangal dosha?', answer: 'A red coral stone may be part of a remedy. It does not cancel Kuja dosha by itself.' },
      { question: 'Is triangular Moonga better?', answer: 'Tikona shape is symbolic. Colour and natural red coral identity matter more.' },
      { question: 'Does a red coral gemstone fade?', answer: 'Natural red coral can dull from chemicals. Sudden fading often means dye.' },
      { question: 'How many rattis of red coral stone?', answer: 'Generally 6–12 ratti. Confirm with Jyotish.' },
      { question: 'Can I wear red coral with emerald?', answer: 'Mars and Mercury can sit together in Navaratna sets. Follow the primary prescription for a red coral gemstone.' },
    ],
  }),

  emerald: defineGem({
    slug: 'emerald',
    name: 'Natural Emerald Stone',
    hindi: 'Panna',
    planet: 'Mercury',
    extraKeywords: [
      'emerald stone',
      'emerald gemstone',
      'natural emerald',
      'natural emerald stone',
      'real emerald',
      'emeralds',
      'panna',
      'colombian emerald',
      'zambian emerald',
      'budh ratna',
      'gemini gemstone',
      'virgo gemstone',
      'panna ring',
      'emerald stone price',
    ],
    seo_description:
      'Natural emerald stone and real emerald gemstone (Panna) for Budh. Shop certified Colombian and Zambian emeralds with oil disclosure.',
    intro:
      'Natural Emerald Stone (Panna) is Mercury’s gem. A real emerald gemstone needs a chart reading and honest oil disclosure before you wear it. PureVedicGems lists certified emeralds and will not hide treatment.',
    hero_benefits: [
      { text: 'Speech and study' },
      { text: 'Trade and contracts' },
      { text: 'Worn on Wednesday' },
      { text: 'Oil status disclosed' },
    ],
    about_html: [
      p(
        'A natural emerald stone is green beryl. Chromium and vanadium give the colour. In Hindi it is Panna. Vedic astrology treats this emerald gemstone as the ratna of Budh — Mercury.',
        'Fine emeralds show vivid green. Garden-like jardin is normal. Colombia, Zambia, Brazil, and Pakistan (Swat) supply most of the emeralds we grade for Jyotish.',
        'Treat a natural emerald stone as a prescribed remedy, not a casual buy. Results depend on a real emerald, a matching chart, and disclosed oil — not on a pretty photo.',
      ),
      h3('Vedic Significance'),
      p(
        'Mercury rules Gemini and Virgo. He also rules speech, trade, nerves, and study. Ashlesha, Jyeshtha, and Revati link to Panna in many classical lists.',
        'So an emerald stone is often named in Budh mahadasha. Those periods do not always need Panna. First get a Jyotish reading. Then decide.',
      ),
      h2('What is an Emerald Stone'),
      p(
        'An emerald stone is a member of the beryl family. Iron, chromium, and vanadium form the green in nature. Colour runs from bright green to greenish blue.',
        'Among Navaratna gems, this emerald gemstone is one of the most used for intellect and commerce. Availability is limited. Price follows origin, colour, and treatment.',
      ),
      h2('What customers say about emerald'),
      p(
        'People write about clearer speech, steadier study, and cleaner contracts — after the chart check, not overnight miracles.',
        'If you want that path, read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a stone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p(
        'Wear a natural emerald stone only after the chart check. The table below is the PureVedicGems Jyotish pattern. Your astrologer may adjust finger, metal, or weight.',
      ),
      table([
        ['Weight', 'Generally 3–7 carats. Confirm with Jyotish.'],
        ['Colour', 'Vivid grass-green to bluish-green. Avoid blackish, dull green for ratna use.'],
        ['Metal', 'Yellow gold or Panchdhatu.'],
        ['Finger', 'Little finger of the right hand (working hand).'],
        ['Day', 'Wednesday (Budhvar)'],
        ['Time', 'Sunrise during Budh hora'],
        ['Mantra', 'Chant “Om Bram Brim Broum Sah Budhaya Namah” 108 times'],
        ['Purification', 'Gangajal with tulsi leaves; offer green moong dal'],
      ]),
      p(
        'First cleanse the emerald stone. Then chant. Then set it so the gem can touch skin. Keep a record of the wearing date.',
      ),
    ].join('\n'),
    who_should_wear_html: [
      p(
        'A natural emerald stone suits many Gemini (Mithun) and Virgo (Kanya) charts when Mercury should be strengthened. Teachers, lawyers, traders, and students often wear this emerald gemstone after a reading.',
        'Wear Panna when Budh is weak, combust, or in a dasha that needs support. Rashi lists are a start. The horoscope decides.',
      ),
      h3('When a Natural Emerald Stone May Help'),
      ul([
        'Gemini or Virgo lagna with a Mercury that needs support',
        'Budh mahadasha after an astrologer confirms Panna',
        'Careers in writing, trade, accounting, law, and teaching',
        'People who need clearer speech and cleaner contracts',
      ]),
      h3('When Not to Wear'),
      p(
        'Avoid a natural emerald stone if Budh is already strong with no affliction. Also stop if Mercury rules difficult houses without relief. Do not buy because a classmate wears one.',
      ),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review before the final setting. Book a <a href="/consultation">consultation</a> if you are unsure. Then read the <a href="/knowledge/gem-qualities/emerald">emerald quality guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p(
        'People wear a natural emerald stone for Mercury’s themes: speech, study, and trade. The benefits below are traditional Jyotish uses. They are not medical claims.',
      ),
      h3('Intellect and education'),
      p(
        'A well-chosen emerald gemstone is worn for memory, reasoning, and exams. Students use it when Budh should be strengthened — not as a shortcut for unread books.',
      ),
      h3('Business and contracts'),
      p(
        'Mercury rules trade. An emerald stone is worn to steady negotiation, accounting, and partnership talk. Effort still does the work.',
      ),
      h3('Speech and nerves'),
      p(
        'Texts link Budh to speech and the nervous system. Some people wear a natural emerald stone beside medical care for stammer or low focus. See a doctor for health.',
      ),
      h3('Discernment'),
      p(
        'Mercury mantras with Panna are used for clearer study and viveka. This is a traditional support, not a guarantee.',
      ),
    ].join('\n'),
    types_html: [
      p(
        'Not every emerald stone is equal. Origin, colour, oil, and cut change both price and Jyotish fitness.',
      ),
      h2('Emerald Gemstone Origins'),
      ul([
        'Colombia: grass-green, velvety — the colour standard for a fine emerald stone',
        'Zambia: bluish-green, often cleaner — practical Jyotish emeralds',
        'Brazil and Swat (Pakistan): varied grades; always check oil',
        'Ethiopia and others: verify treatment; many are heavily filled',
      ]),
      h2('Natural Emerald vs Oiled Stone'),
      p(
        'A natural emerald grew in the earth. Almost all emeralds take minor cedarwood oil. That oil is accepted for Jyotish when the paper names it.',
        'Heavy resin, dye, and hydrothermal synthetics are not a real emerald for ratna use. Read the treatment line before you compare two emerald gemstones.',
      ),
      h3('Shop emerald by origin'),
      ul([
        '<a href="/gemstones/navaratna/emerald?origin=Colombia">Colombian Emerald</a>',
        '<a href="/gemstones/navaratna/emerald?origin=Zambia">Zambian Emerald</a>',
        '<a href="/gemstones/navaratna/emerald?origin=Brazil">Brazilian Emerald</a>',
      ]),
    ].join('\n'),
    quality_price_html: [
      p(
        'Emerald stone price in India is not one number. Jyotish-quality natural emerald stone often runs from about INR 1,000 per carat to INR 4,00,000 per carat on our quality scale. Resin-filled commercial greens sit outside that Jyotish band.',
      ),
      h2('Emerald Stone Price'),
      p(
        'Emerald stone price moves with origin, colour, clarity, cut, carat, and oil. A dull, over-oiled stone sits at the low end. Fine Colombian and clean Zambian emeralds set the ceiling.',
        'Read emerald stone price per carat on the listing, then check the lab line for oil or resin. Two stones of the same carat can differ tenfold.',
      ),
      h2('Factors Affecting Emerald Stone Price'),
      p(
        'Colour leads. Then origin, then how much filling hides the jardin. A real emerald with honest minor oil costs more than a filled stone of the same size — and it should.',
      ),
      h3('Certification'),
      p(
        `GIA, Gübelin, and SSEF reports should state oil or resin. At checkout, ${BRAND} shows lab and treatment on every natural emerald stone.`,
      ),
    ].join('\n'),
    jewellery_html: [
      p(
        'After a good reading, most people set a natural emerald stone in a ring. Emeralds are brittle. A bezel protects the girdle. Open-back mounts keep skin contact for Budh.',
      ),
      h3('Natural Emerald Stone Ring'),
      p(
        'A natural emerald stone ring on the little finger is the classic Mercury setting. Gold or Panchdhatu. Confirm with your astrologer before the jeweller starts.',
      ),
      h3('Emerald Pendant'),
      p(
        'A pendant can hold an emerald gemstone near the heart. It is a good second piece. It is not a full substitute for a prescribed ring unless your astrologer says so.',
      ),
    ].join('\n'),
    cleaning_care_html: [
      p(
        'An emerald stone is 7.5–8 on the Mohs scale, but it is brittle. No ultrasonic. No steam. A hard knock can open a filled fracture.',
      ),
      h3('Gentle Cleaning'),
      p(
        'Wipe a natural emerald stone with a soft cloth and lukewarm water. Dry it. Skip harsh chemicals.',
      ),
      h3('Oil and storage'),
      p(
        'If jardin looks white, a jeweller can re-oil in the traditional way. Store the emerald gemstone away from diamond jewellery.',
      ),
      h3('Re-Energisation'),
      p(
        'On Wednesday, rinse with Gangajal and tulsi, then repeat the Budh mantra. Wear the emerald stone again with a clear intention.',
      ),
    ].join('\n'),
    buyer_beware_html: [
      p(
        'Green glass, doublets, hydrothermal synthetics, and dyed beryl are sold as Panna. A real emerald should have jardin or a paper that names natural beryl and the fill.',
      ),
      h2('Real Emerald vs Synthetic'),
      p(
        'A real emerald grew in the earth. A synthetic grew in a lab. Glass is not beryl. Ask for a report. Then check oil versus resin.',
      ),
      h3('Red Flags'),
      ul([
        'A flawless emerald stone at a bargain',
        'Certificate silent on treatment',
        'Called Colombian with no origin opinion at a low price',
      ]),
      h3('Why Buy from PureVedicGems?'),
      p(
        `${BRAND} has sourced Jyotish gems since 1937. We list certified emeralds, show oil status, and support chart review. Buy a natural emerald stone here only after you understand the risk.`,
      ),
    ].join('\n'),
    faqs: [
      {
        question: 'What is an emerald stone?',
        answer:
          'An emerald stone is green beryl, called Panna in Vedic astrology. It is Mercury’s gem. A natural emerald stone shows jardin and a treatment line on the lab paper.',
      },
      {
        question: 'What is an emerald gemstone used for?',
        answer:
          'An emerald gemstone is worn for Budh: speech, study, and trade. Results depend on a real emerald and a matching chart. These are traditional uses, not medical claims.',
      },
      {
        question: 'What is a natural emerald?',
        answer:
          'A natural emerald grew in the earth, not in a lab. Minor oil is common and must be disclosed. Resin-filled or synthetic stones are not a natural emerald for Jyotish.',
      },
      {
        question: 'How do I know a real emerald?',
        answer:
          'A real emerald is natural beryl with honest treatment on the paper. Flawless cheap greens are often glass or synthetic. Compare jardin, origin, and oil — not just the colour in photos.',
      },
      {
        question: 'What is emerald stone price in India?',
        answer:
          'Emerald stone price on our quality scale is about INR 1,000 to INR 4,00,000 per carat. Colour and oil drive the gap. Read the listing, not a generic Panna quote.',
      },
      {
        question: 'Is oiled emerald OK for astrology?',
        answer: 'Minor traditional oil is widely accepted when disclosed. Avoid resin-filled or dyed stones.',
      },
      {
        question: 'Colombian or Zambian emeralds?',
        answer:
          'Colombian emeralds set the grass-green standard. Zambian emeralds are often cleaner and practical for Jyotish. The chart matters more than the mine name.',
      },
      {
        question: 'Which finger for Panna?',
        answer: 'Little finger of the right hand in gold or Panchdhatu is the classical Budh placement. Confirm before setting.',
      },
      {
        question: 'Why do emeralds have inclusions?',
        answer: 'Natural jardin is expected. Colour and lustre matter more than flawless clarity for Jyotish.',
      },
      {
        question: 'Emerald vs peridot?',
        answer: 'Emerald is the primary Navaratna for Mercury. Peridot is a semi-precious substitute.',
      },
      {
        question: 'Can students wear a natural emerald stone?',
        answer: 'Yes, if Budh is favourable — especially during exams or Mercury dasha after consultation.',
      },
      {
        question: 'How fragile is an emerald stone?',
        answer: '7.5–8 Mohs but brittle. Use a protective setting. Skip ultrasonic cleaners.',
      },
      {
        question: 'Can an emerald gemstone help speech?',
        answer: 'Traditionally it supports speech and nerves. Medical care remains essential.',
      },
    ],
  }),

  'yellow-sapphire': defineGem({
    slug: 'yellow-sapphire',
    name: 'Natural Yellow Sapphire',
    hindi: 'Pukhraj',
    planet: 'Jupiter',
    extraKeywords: [
      'yellow sapphire',
      'yellow sapphire stone',
      'yellow sapphire price',
      'natural yellow sapphire',
      'yellow sapphires for sale',
      'ceylon pukhraj',
      'unheated pukhraj',
    ],
    seo_description:
      'Natural yellow sapphire stone (Pukhraj) for Guru. Yellow sapphire price for Ceylon lots. Yellow sapphires for sale with heat disclosure.',
    intro:
      'Natural Yellow Sapphire (Pukhraj) is Guru’s gem. A yellow sapphire stone needs a chart reading and honest heat disclosure. PureVedicGems lists yellow sapphires for sale with the treatment line on the report.',
    hero_benefits: [
      { text: 'Wisdom and Jupiter' },
      { text: 'Thursday wear' },
      { text: 'Heat disclosed' },
      { text: 'Ceylon yellow sapphire' },
    ],
    about_html: [
      p(
        'A natural yellow sapphire is iron-coloured corundum. In Hindi it is Pukhraj. Vedic astrology treats this yellow sapphire stone as the ratna of Brihaspati — Jupiter.',
        'Fine yellow sapphire lots show lemon to honey gold. Sri Lanka (Ceylon), Burma, Thailand, Madagascar, and Brazil supply the stones we grade.',
        'Treat a yellow sapphire stone as a prescribed remedy. Yellow sapphire price follows colour, heat, and origin — not a pretty photo.',
      ),
      h3('Vedic Significance'),
      p(
        'Jupiter rules Sagittarius and Pisces. He also rules wisdom, marriage, and lawful wealth. Punarvasu, Vishakha, and Purva Bhadrapada link to Pukhraj in many lists.',
        'So a yellow sapphire is often named in Guru mahadasha. First get a Jyotish reading. Then decide.',
      ),
      h2('What is a Yellow Sapphire Stone'),
      p(
        'A yellow sapphire stone is corundum, not citrine or topaz. A natural yellow sapphire needs lab identity before you wear it as Pukhraj.',
        'Among Navaratna gems, yellow sapphire is used for dharma and expansion. Yellow sapphires for sale without a heat line are a guess.',
      ),
      h2('What customers say about yellow sapphire'),
      p(
        'People write about steadier study and marriage timing — after the chart check, not overnight miracles.',
        'Read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a yellow sapphire stone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear a natural yellow sapphire only after the chart check. The table is the PureVedicGems Jyotish pattern.'),
      table([
        ['Weight', 'Generally 3–7 carats. Confirm with Jyotish.'],
        ['Colour', 'Lemon to rich golden honey. Avoid brownish yellow sapphire stone lots for ratna use.'],
        ['Metal', '22-karat yellow gold or Panchdhatu.'],
        ['Finger', 'Index finger of the right hand.'],
        ['Day', 'Thursday morning'],
        ['Time', 'Morning during Guru hora'],
        ['Mantra', 'Chant “Om Gram Grim Groum Sah Gurave Namah” 108 times'],
        ['Purification', 'Raw milk, turmeric, Gangajal; offer yellow flowers'],
      ]),
      p('First cleanse the yellow sapphire stone. Then chant. Then set it so the yellow sapphire can touch skin.'),
    ].join('\n'),
    who_should_wear_html: [
      p(
        'A natural yellow sapphire suits many Sagittarius and Pisces charts when Jupiter should be strengthened. Teachers, judges, and marriage seekers often wear this yellow sapphire stone after a reading.',
      ),
      h3('When Natural Yellow Sapphire May Help'),
      ul([
        'Sagittarius or Pisces lagna with a Jupiter that needs support',
        'Guru mahadasha after an astrologer confirms Pukhraj',
        'Careers in law, teaching, and finance',
      ]),
      h3('When Not to Wear'),
      p('Avoid a yellow sapphire if Guru is already strong with no affliction. Do not buy yellow sapphires for sale as fashion Pukhraj.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review before the final setting. Book a <a href="/consultation">consultation</a>. Then read the <a href="/knowledge/gem-qualities/yellow-sapphire">yellow sapphire quality guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear a natural yellow sapphire for Jupiter’s themes: wisdom, wealth, and marriage. These are traditional uses, not medical claims.'),
      h3('Wisdom and teaching'),
      p('A yellow sapphire stone is worn for study and counsel. Effort still does the work.'),
      h3('Marriage and children'),
      p('Guru rules progeny. A yellow sapphire is a traditional support, not a fertility treatment.'),
      h3('Lawful wealth'),
      p('Yellow sapphire price does not buy a shortcut. The chart and honest work still decide.'),
    ].join('\n'),
    types_html: [
      p('Not every yellow sapphire stone is equal. Origin and heat change both yellow sapphire price and Jyotish fitness.'),
      h2('Yellow Sapphire Stone Origins'),
      ul([
        '<a href="/gemstones/navaratna/yellow-sapphire?origin=Ceylon">Ceylon Yellow Sapphire</a>: lemon to golden — the usual Jyotish benchmark',
        '<a href="/gemstones/navaratna/yellow-sapphire?origin=Burma">Burma Yellow Sapphire</a>: fine saturation in a natural yellow sapphire',
        '<a href="/gemstones/navaratna/yellow-sapphire?origin=Madagascar">Madagascar Yellow Sapphire</a>: value lots among yellow sapphires for sale',
      ]),
      h2('Natural Yellow Sapphire vs Heated Stone'),
      p(
        'Unheated natural yellow sapphire is the Jyotish standard. Heat-only may be accepted if disclosed. Beryllium diffusion is not Pukhraj.',
        'Citrine sold as a yellow sapphire stone is a different mineral.',
      ),
    ].join('\n'),
    quality_price_html: [
      p('Yellow sapphire price follows colour, clarity, carat, origin, and heat. A natural yellow sapphire with no heat sits above diffused lots.'),
      h2('Yellow Sapphire Price'),
      p(
        'On our quality scale, weak yellow sapphire lots can start near INR 500–3,000 per carat. Heated mid grades often sit near INR 3,000–7,000. Fine yellow sapphire stone lots run about INR 7,000–25,000. Rare unheated Ceylon yellow sapphire can reach about INR 25,000–80,000 per carat.',
        'India yellow sapphire price overall spans about INR 500–80,000 per carat. Jyotish-grade natural yellow sapphire usually starts nearer INR 3,000 when identity is honest.',
      ),
      h3('Certification'),
      p('The report must say natural corundum. Yellow sapphires for sale without that line are a guess.'),
    ].join('\n'),
    jewellery_html: [
      p('A natural yellow sapphire is set in gold on the index finger so the yellow sapphire stone touches skin.'),
      h3('Setting'),
      ul(['Open culet', 'Thursday energisation', 'Avoid white metal unless the astrologer names it']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm water and mild soap. A yellow sapphire is Mohs 9.'),
      h3('Storage'),
      p('Keep a yellow sapphire stone off softer gems.'),
      h3('Re-Energisation'),
      p('Thursday Guru mantra and a turmeric rinse on the natural yellow sapphire.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Citrine, yellow topaz, and synthetic corundum are sold as yellow sapphire. Neon lots at a low yellow sapphire price are a warning.'),
      h2('Yellow Sapphires for Sale — What to Skip'),
      p('If yellow sapphires for sale claim Ceylon with no report, walk away. A natural yellow sapphire shows silk and growth, not glass.'),
      h3('Red Flags'),
      ul(['Seller calls citrine Pukhraj', 'No heat line', 'Yellow sapphire stone priced like glass']),
      p(`${BRAND} certifies every yellow sapphire as natural corundum with treatment disclosure.`),
    ].join('\n'),
    faqs: [
      { question: 'What are the benefits of yellow sapphire?', answer: 'Traditional Jupiter themes: wisdom, lawful wealth, and marriage support. Not medical claims. A yellow sapphire stone only helps when the chart fits.' },
      { question: 'What is a yellow sapphire stone?', answer: 'A yellow sapphire stone is the same mineral — Pukhraj for Guru. Do not confuse it with topaz.' },
      { question: 'What is yellow sapphire price in India?', answer: 'Yellow sapphire price on our scale runs about INR 500–80,000 per carat. Jyotish-grade natural yellow sapphire usually sits higher once heat is honest.' },
      { question: 'What is a natural yellow sapphire?', answer: 'A natural yellow sapphire is mined corundum, not citrine. Ask for the natural origin line on the report.' },
      { question: 'Are yellow sapphires for sale here heated?', answer: 'Some yellow sapphires for sale are heat-only. Diffusion and glass fill are not listed as Pukhraj. Read the treatment line.' },
      { question: 'Which finger for yellow sapphire?', answer: 'Index finger of the right hand in gold, so the yellow sapphire stone touches skin.' },
      { question: 'Pukhraj vs topaz?', answer: 'Yellow sapphire is corundum. Topaz is a substitute only when prescribed.' },
      { question: 'Can unmarried women wear yellow sapphire?', answer: 'Yes, when Guru is favourable. Chart first, then a yellow sapphire stone.' },
      { question: 'Best origin?', answer: 'Ceylon is the usual benchmark. Fine Madagascar yellow sapphire also works when the report is clean.' },
      { question: 'Unheated vs heated yellow sapphire?', answer: 'Unheated natural yellow sapphire is preferred. Disclosed heat-only may be accepted by some astrologers.' },
    ],
  }),

  diamond: defineGem({
    slug: 'diamond',
    name: 'Natural Diamond Gemstone',
    hindi: 'Heera',
    planet: 'Venus',
    extraKeywords: [
      'diamond gemstone',
      'diamond stone',
      'natural diamond',
      'heera',
      'lab grown diamond',
      'shukra ratna',
    ],
    seo_description:
      'Natural diamond gemstone (Heera) for Shukra. Diamond stone vs lab-grown, with clarity and Jyotish disclosure.',
    intro:
      'Natural Diamond Gemstone (Heera) is Shukra’s primary ratna. A diamond stone for Jyotish is mined carbon, not lab-grown. PureVedicGems lists natural diamond lots with clarity and origin notes.',
    hero_benefits: [
      { text: 'Venus and arts' },
      { text: 'Friday wear' },
      { text: 'Natural diamond' },
      { text: 'White metal' },
    ],
    about_html: [
      p(
        'A natural diamond gemstone is crystalline carbon. In Hindi it is Heera. Vedic astrology treats this diamond stone as the ratna of Shukra — Venus.',
        'Fine diamond gemstone lots show brilliance and fire. Mohs 10. Lab-grown carbon is not classical Heera.',
      ),
      h3('Vedic Significance'),
      p(
        'Venus rules Taurus and Libra. Bharani, Purva Phalguni, and Purva Ashadha link to Heera in many lists.',
        'So a diamond gemstone is often named when Shukra should be strengthened. First get a Jyotish reading.',
      ),
      h2('What is a Diamond Gemstone'),
      p(
        'A diamond gemstone is mined carbon. A diamond stone for fashion can be lab-grown. Jyotish Heera is a natural diamond.',
        'D-flawless is jewellery talk. A clean natural diamond gemstone with honest disclosure is the ratna.',
      ),
      h2('What customers say about diamond'),
      p(
        'People write about easier Venus themes — after the chart check, not overnight miracles.',
        'Read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a diamond stone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear a natural diamond gemstone only after the chart check. The table is the PureVedicGems Jyotish pattern.'),
      table([
        ['Weight', 'Generally 0.5–1.5 carats. Confirm with Jyotish.'],
        ['Colour', 'Near-colourless. Grey or brown diamond stone lots are weaker for ratna use.'],
        ['Metal', 'Silver, white gold, or platinum.'],
        ['Finger', 'Middle or little finger of the right hand.'],
        ['Day', 'Friday morning'],
        ['Time', 'Shukra hora'],
        ['Mantra', 'Chant “Om Dram Drim Droum Sah Shukraya Namah” 108 times'],
        ['Purification', 'Raw milk, rose water, Gangajal, white flowers'],
      ]),
      p('Set the diamond gemstone so the diamond stone can touch skin.'),
    ].join('\n'),
    who_should_wear_html: [
      p('A natural diamond gemstone suits Taurus and Libra charts when Venus should be strengthened. Artists and marriage seekers often wear this diamond stone after a reading.'),
      h3('When a Diamond Gemstone May Help'),
      ul(['Weak or afflicted Venus', 'Shukra mahadasha after an astrologer confirms Heera', 'Need for a primary Venus ratna, not only white sapphire']),
      h3('When Not to Wear'),
      p('Avoid a diamond gemstone if Shukra is already strong. Lab-grown is not a swap for a natural diamond without written approval.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review before the final setting. Book a <a href="/consultation">consultation</a>. Then read the <a href="/knowledge/gemstones/diamond-heera-guide">diamond (Heera) guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear a natural diamond gemstone for Shukra’s themes: love, arts, and comfort. These are traditional uses, not medical claims.'),
      h3('Relationships'),
      p('A diamond stone is worn for harmony. Effort still does the work.'),
      h3('Arts and luxury'),
      p('A diamond gemstone is used in creative trades when Venus should be supported.'),
      h3('Vs white sapphire'),
      p('Heera is primary. A diamond stone is not automatic Safed Pukhraj, and the reverse is also true.'),
    ].join('\n'),
    types_html: [
      p('Not every diamond gemstone is a Jyotish Heera. Growth method changes identity.'),
      h2('Natural Diamond vs Lab-Grown'),
      p(
        'A natural diamond gemstone formed in the mantle. Lab-grown diamond stone lots are still carbon, but classical ratna lists name mined Heera.',
        'White sapphire is the usual substitute when a diamond gemstone is not worn.',
      ),
      h2('Diamond Stone Quality'),
      p('Clarity and cut drive jewellery value. For Jyotish, a natural diamond with honest disclosure beats a cloudy “bargain” diamond stone.'),
    ].join('\n'),
    quality_price_html: [
      p('A diamond gemstone is priced by the four Cs plus whether it is a natural diamond.'),
      h2('Diamond Gemstone Price'),
      p(
        'Diamond stone price spans a wide band. Jyotish Heera does not require museum colour. It does require a natural diamond gemstone, not a CZ invoice.',
        'Compare per-carat diamond stone lots only after the report names natural origin.',
      ),
      h3('Certification'),
      p('The report must say natural diamond. Lab-grown must be named. A diamond gemstone without that line is a guess.'),
    ].join('\n'),
    jewellery_html: [
      p('A natural diamond gemstone is set in white metal so the diamond stone touches skin.'),
      h3('Setting'),
      ul(['Friday energisation', 'Open culet', 'Disclose lab-grown if that is the diamond stone']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm water and mild soap. A diamond gemstone is Mohs 10 and can scratch other gems — store it alone.'),
      h3('Re-Energisation'),
      p('Friday Shukra mantra and a rose-water rinse on the diamond stone.'),
    ].join('\n'),
    buyer_beware_html: [
      p('CZ and moissanite are sold as a diamond gemstone. Lab-grown sold as a natural diamond is a different fraud.'),
      h2('Natural Diamond vs Lookalike'),
      p('A natural diamond gemstone has a lab origin line. If diamond stone price is CZ-cheap, it is not Heera.'),
      h3('Red Flags'),
      ul(['No natural origin line', 'Foggy glass', 'Diamond gemstone with a coating']),
      p(`${BRAND} discloses natural vs lab-grown on every diamond stone listing.`),
    ].join('\n'),
    faqs: [
      { question: 'What is a diamond gemstone in Jyotish?', answer: 'A diamond gemstone is Heera for Venus. Classical lists want a natural diamond, not CZ.' },
      { question: 'What is a diamond stone vs lab-grown?', answer: 'A diamond stone can be mined or grown. Jyotish Heera is a natural diamond gemstone unless the astrologer writes otherwise.' },
      { question: 'What is a natural diamond?', answer: 'A natural diamond formed in the earth. Ask for that line on the report.' },
      { question: 'Which finger for a diamond gemstone?', answer: 'Middle or little finger of the right hand in white metal, so the diamond stone touches skin.' },
      { question: 'How many carats of diamond stone?', answer: 'Generally 0.5–1.5 carats. Confirm with Jyotish. Diamond is dense; smaller weights than ruby are common.' },
      { question: 'Diamond gemstone vs white sapphire?', answer: 'Heera is primary. White sapphire is the usual substitute when a diamond gemstone is not worn.' },
      { question: 'Friday rules for Heera?', answer: 'Friday morning Shukra hora, white metal, Shukra mantra on the diamond stone.' },
      { question: 'Is VS clarity required for a diamond gemstone?', answer: 'No. A clean natural diamond with honest disclosure beats a cloudy investment grade that does not match the chart.' },
      { question: 'Can I wear a diamond stone with ruby?', answer: 'Venus and Sun have a mixed relationship. Do not pair a diamond gemstone with Manik unless written.' },
      { question: 'Does a diamond gemstone need a trial?', answer: 'Less often than neelam. Still start on Friday after purification of the diamond stone.' },
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
      'blue sapphire birthstone',
      'neelam price',
      'neelam benefits',
    ],
    seo_description:
      'Blue sapphire price, neelam stone price: natural blue sapphire stone, royal blue sapphire, light blue sapphire, cornflower blue sapphire, blue star sapphire.',
    intro:
      'Natural Blue Sapphire Stone (Neelam Stone): cornflower blue sapphire birthstone, blue sapphire price. Fine natural neelam needs a chart reading and a three-day trial before you wear it. PureVedicGems lists certified, treatment-disclosed sapphires and will not skip that check.',
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
      h2('Blue Sapphire Birthstone'),
      p(
        'A blue sapphire birthstone is the Western September stone. In Jyotish the same corundum is a neelam stone. Buying a blue sapphire birthstone ring does not skip the chart check.',
        'People shop a blue sapphire birthstone for birthday jewellery. For Saturn work it is still a natural blue sapphire stone: colour, heat, and trial first. A cornflower blue sapphire birthstone looks lively; a pale stone is weaker as a remedy.',
        'So a blue sapphire birthstone and a Shani ratna can be the same gem. Ask for the lab line either way. Then trial before the final set.',
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
        'September-born buyers shopping a blue sapphire birthstone who still need a chart check',
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
        'Blue sapphire price in India is not one number. Jyotish-quality natural blue sapphire stone often runs from about INR 3,000 per carat to INR 3,00,000 per carat. Rare untreated cornflower blue sapphire and Kashmir sit at the top of that range. Compare certified listings, not a single rate.',
      ),
      h2('Blue Sapphire Price'),
      p(
        'Blue sapphire price moves with origin, colour, clarity, cut, carat, and treatment. A light blue sapphire sits at the low end. A royal blue sapphire in the middle. Fine cornflower blue sapphire and Kashmir set the ceiling.',
        'Read blue sapphire price per carat on the listing, then check the lab line for heat. Two stones of the same carat can differ tenfold. That gap is normal. Neelam stone price is the same scale under the Hindi name.',
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
        'A natural blue sapphire stone ring on the middle finger is the classic Saturn setting. A blue sapphire birthstone ring uses the same stone — still open-back, still after trial. Choose a secure open-back mount so the gem can touch skin. Silver, white gold, and Panchdhatu are the metals we recommend. Confirm with your astrologer before the jeweller starts.',
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
        question: 'What is a blue sapphire birthstone?',
        answer:
          'A blue sapphire birthstone is September’s stone in Western lists. In Vedic use it is still a natural blue sapphire stone (neelam). Buy a blue sapphire birthstone only after heat disclosure; trial it if you will wear it for Saturn.',
      },
      {
        question: 'What is blue sapphire price in India?',
        answer:
          'Blue sapphire price on our quality scale is about INR 3,000 to INR 3,00,000 per carat. Light blue sapphire is cheaper. Royal blue sapphire sits in the middle. Rare cornflower blue sapphire and Kashmir cost more. Read blue sapphire price on the listing, not a generic quote.',
      },
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
    name: 'Natural Hessonite Stone',
    hindi: 'Gomed',
    planet: 'Rahu',
    extraKeywords: [
      'hessonite',
      'hessonite stone',
      'hessonite gemstone',
      'gomed',
      'gomed stone',
      'gomed stone price',
      'hessonite garnet',
      'ceylon gomed',
    ],
    seo_description:
      'Natural hessonite stone and hessonite gemstone (Gomed) for Rahu. Gomed stone price for Ceylon hessonite garnet.',
    intro:
      'Natural Hessonite Stone (Gomed) is Rahu’s gem. A hessonite gemstone is grossular garnet, not citrine. PureVedicGems lists Ceylon gomed with the swirl pattern on the report.',
    hero_benefits: [
      { text: 'Rahu support' },
      { text: 'Saturday evening' },
      { text: 'Ceylon gomed' },
      { text: 'Trial advised' },
    ],
    about_html: [
      p(
        'A natural hessonite stone is manganese-rich grossular. In Hindi it is Gomed. Vedic astrology treats this hessonite gemstone as the ratna of Rahu.',
        'Fine hessonite shows honey-cognac colour and a treacle swirl. Sri Lanka, India, Tanzania, Madagascar, and Brazil supply the gomed stone we grade.',
      ),
      h3('Vedic Significance'),
      p(
        'Rahu is the north node. Ardra, Swati, and Shatabhisha link to Gomed in many lists.',
        'So a hessonite stone is often named in Rahu mahadasha. First get a Jyotish reading. Trial like neelam if asked.',
      ),
      h2('What is a Hessonite Stone'),
      p(
        'A hessonite stone is garnet, Mohs 7. A hessonite gemstone is not orange sapphire and not citrine.',
        'Honey hessonite garnet with transparency is the usual Jyotish look.',
      ),
      h2('What customers say about hessonite'),
      p(
        'People write about clearer focus in odd dashas — after the chart check.',
        'Read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a gomed stone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear a natural hessonite stone only after the chart check. The table is the PureVedicGems Jyotish pattern.'),
      table([
        ['Weight', 'Generally 6–11 ratti. Confirm with Jyotish.'],
        ['Colour', 'Honey-cinnamon. Muddy black lots are a weaker hessonite gemstone.'],
        ['Metal', 'Silver or Panchdhatu.'],
        ['Finger', 'Middle finger of the right hand.'],
        ['Day', 'Saturday evening'],
        ['Time', 'Rahu kalam or Shani hora as prescribed'],
        ['Mantra', 'Chant “Om Bhram Bhrim Bhroum Sah Rahave Namah” 108 times'],
        ['Purification', 'Gangajal; offer dark cloth'],
      ]),
      p('Set the hessonite stone so the hessonite gemstone can touch skin.'),
    ].join('\n'),
    who_should_wear_html: [
      p('A natural hessonite stone is for charts that need Rahu support. Foreign work and public roles often wear this hessonite gemstone after a reading.'),
      h3('When Hessonite May Help'),
      ul(['Rahu mahadasha after an astrologer confirms Gomed', 'Sudden delays and confusion named in the chart', 'Need for a gomed stone trial first']),
      h3('When Not to Wear'),
      p('Avoid a hessonite stone if Rahu is already strong. Do not pair a hessonite gemstone with neelam unless written.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review before the final setting. Book a <a href="/consultation">consultation</a>. Then read the <a href="/knowledge/gem-qualities/hessonite">hessonite quality guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear a natural hessonite stone for Rahu’s themes: focus in chaos, foreign karma, and reputation. These are traditional uses, not medical claims.'),
      h3('Clarity'),
      p('A hessonite gemstone is worn to cut confusion. Effort still does the work.'),
      h3('Public work'),
      p('A gomed stone is a traditional support for crowd-facing roles.'),
      h3('Health mysteries'),
      p('See a doctor. A hessonite stone is not medicine.'),
    ].join('\n'),
    types_html: [
      p('Not every hessonite gemstone is Gomed. Mineral identity changes gomed stone price.'),
      h2('Hessonite Stone Origins'),
      ul([
        '<a href="/gemstones/navaratna/hessonite?origin=Ceylon">Ceylon Hessonite</a>: honey hessonite garnet — the usual Jyotish benchmark',
        '<a href="/gemstones/navaratna/hessonite?origin=India">India Hessonite</a>: commercial hessonite stone lots — check transparency',
      ]),
      h2('Hessonite Garnet vs Citrine'),
      p('Hessonite garnet shows treacle swirls. Citrine is quartz sold as a gomed stone. A hessonite gemstone must name grossular.'),
    ].join('\n'),
    quality_price_html: [
      p('Gomed stone price follows colour, transparency, and whether the hessonite stone is real garnet.'),
      h2('Gomed Stone Price'),
      p(
        'On our quality scale, fake or dull lots can start near INR 10–100 per carat. Wearable hessonite gemstone lots often sit near INR 200–600. Fine gomed stone runs about INR 800–2,000. Rare Ceylon hessonite can reach about INR 2,000–6,000 per carat.',
        'Best-quality gomed stone price in India overall sits near INR 800–6,000 per carat when identity is honest.',
      ),
      h3('Certification'),
      p('The report must say hessonite / grossular. A hessonite stone labelled only “garnet” needs a closer look.'),
    ].join('\n'),
    jewellery_html: [
      p('A natural hessonite stone is set in silver so the hessonite gemstone touches skin. Middle finger is the Jyotish default.'),
      h3('Setting'),
      ul(['Saturday evening energisation', 'Open culet', 'Trial the gomed stone if asked']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm water and mild soap. A hessonite gemstone is Mohs 7.'),
      h3('Re-Energisation'),
      p('Saturday mantra and a Gangajal rinse on the hessonite stone.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Glass and citrine are sold as a hessonite stone. If gomed stone price is souvenir-cheap, assume fake.'),
      h2('Hessonite Gemstone vs Fake'),
      p('A hessonite gemstone shows swirl, not bubbles. Perfectly clean orange glass is not Gomed.'),
      h3('Red Flags'),
      ul(['No swirl in a “Ceylon” hessonite stone', 'Seller cannot say grossular', 'Hessonite garnet priced like plastic']),
      p(`${BRAND} confirms grossular before listing a gomed stone.`),
    ].join('\n'),
    faqs: [
      { question: 'What is a hessonite stone?', answer: 'A hessonite stone is grossular garnet (Gomed) for Rahu. It is not citrine.' },
      { question: 'What is a hessonite gemstone in Jyotish?', answer: 'A hessonite gemstone is the same mineral. Wear it after a chart reading, often with a trial.' },
      { question: 'What is gomed stone price in India?', answer: 'Gomed stone price on our scale runs about INR 200–6,000 per carat for wearable hessonite. Fakes sit near INR 10–100.' },
      { question: 'What is hessonite garnet?', answer: 'Hessonite garnet is the mineral name. Jyotish Gomed is that hessonite stone, preferably honey Ceylon.' },
      { question: 'Which finger for a hessonite stone?', answer: 'Middle finger of the right hand in silver, so the hessonite gemstone touches skin.' },
      { question: 'Gomed vs neelam?', answer: 'A hessonite stone is Rahu. Neelam is Saturn. Do not self-combine.' },
      { question: 'Honey or red hessonite gemstone?', answer: 'Both can be Gomed. Transparency and identity beat exact hue.' },
      { question: 'Can a gomed stone help foreign work?', answer: 'Traditionally yes for Rahu karma. Visas and law still do the paperwork.' },
      { question: 'Is hessonite safe?', answer: 'Gentler than neelam for many charts, still needs approval. Watch the first days on the hessonite stone.' },
      { question: 'Hessonite with cat’s eye?', answer: 'Rahu and Ketu together need a written yoga. Do not self-pair a hessonite gemstone with Lehsunia.' },
    ],
  }),

  'cats-eye': defineGem({
    slug: 'cats-eye',
    name: 'Natural Catseye Gemstone',
    hindi: 'Lehsunia',
    planet: 'Ketu',
    extraKeywords: [
      'catseye gemstone',
      'catseye gem',
      "cat's eye chrysoberyl",
      'original cats eye stone',
      'cats eye gemstone price',
      'lehsunia',
      'ketu ratna',
    ],
    seo_description:
      'Original cats eye stone and catseye gem (Lehsunia) for Ketu. Cat\'s eye chrysoberyl with cats eye gemstone price and lab disclosure.',
    intro:
      'Natural Catseye Gemstone (Lehsunia) is Ketu’s gem. An original cats eye stone is chrysoberyl, not quartz. PureVedicGems lists catseye gem lots with a sharp eye and honest identity.',
    hero_benefits: [
      { text: 'Ketu protection' },
      { text: 'Chrysoberyl eye' },
      { text: 'Tuesday or Thursday' },
      { text: 'Certified catseye gem' },
    ],
    about_html: [
      p(
        'A catseye gemstone is chatoyant chrysoberyl. In Hindi it is Lehsunia. Vedic astrology treats this catseye gem as the ratna of Ketu.',
        'Fine catseye gemstone lots show a sharp white band on honey to greenish-yellow. Sri Lanka, India, Burma, Thailand, and Brazil supply original cats eye stone material we grade.',
        'Quartz fibre-optic glass is not a catseye gemstone for Jyotish. Ask for chrysoberyl on the report.',
      ),
      h3('Vedic Significance'),
      p(
        'Ketu is the south node. Ashwini, Magha, and Mula link to Lehsunia in many lists. A catseye gem is often named in Ketu mahadasha. First get a Jyotish reading.',
      ),
      h2('What is a Catseye Gemstone'),
      p(
        'A catseye gemstone is chrysoberyl with a mobile eye. Cat\'s eye chrysoberyl is Mohs 8.5. An original cats eye stone opens and closes under a single light.',
        'Tiger’s eye is quartz. It is not this catseye gem.',
      ),
      h2('What customers say about catseye gemstone'),
      p(
        'People write about fewer sudden shocks — after the chart check, not overnight miracles.',
        'Read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a catseye gemstone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear a catseye gemstone only after the chart check. The table is the PureVedicGems Jyotish pattern.'),
      table([
        ['Weight', 'Generally 3–7 ratti. Confirm with Jyotish.'],
        ['Colour', 'Honey to greenish-yellow with a sharp eye. Weak bands are a weaker catseye gem.'],
        ['Metal', 'Silver, Panchdhatu, or gold.'],
        ['Finger', 'Middle finger of the right hand.'],
        ['Day', 'Tuesday or Thursday evening'],
        ['Time', 'Evening during Ketu hora'],
        ['Mantra', 'Chant “Om Shram Shrim Shroum Sah Ketave Namah” 108 times'],
        ['Purification', 'Gangajal and raw milk; offer to Ganesha'],
      ]),
      p('Set the original cats eye stone so the catseye gemstone can touch skin. Cabochon only.'),
    ].join('\n'),
    who_should_wear_html: [
      p('A catseye gemstone suits Ketu mahadasha and charts that need Ketu support. Researchers and spiritual seekers often wear this catseye gem after a reading.'),
      h3('When a Catseye Gemstone May Help'),
      ul(['Ketu dasha after an astrologer confirms Lehsunia', 'Need for protection and detachment', 'Speculative work only if the chart allows']),
      h3('When Not to Wear'),
      p('Avoid a catseye gemstone if Ketu is already strong. Stop if wearing an original cats eye stone brings disorientation — call the astrologer.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} asks for Jyotish review before the final setting. Book a <a href="/consultation">consultation</a>. Then read the <a href="/knowledge/gem-qualities/catseye">catseye quality guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear a catseye gemstone for Ketu’s themes: protection, moksha, and sudden karma. These are traditional uses, not medical claims.'),
      h3('Protection'),
      p('A catseye gem is worn as a traditional talisman. Effort and care still matter.'),
      h3('Spiritual focus'),
      p('Cat\'s eye chrysoberyl is used for meditation support when Ketu is favourable.'),
      h3('Health mysteries'),
      p('Some wear a catseye gemstone beside medical care. See a doctor for health.'),
    ].join('\n'),
    types_html: [
      p('Not every catseye gemstone is chrysoberyl. Identity changes cats eye gemstone price and Jyotish fitness.'),
      h2('Catseye Gemstone Origins'),
      ul([
        '<a href="/gemstones/navaratna/cats-eye?origin=Ceylon">Ceylon Catseye Gemstone</a>: sharp honey eye — the usual Jyotish benchmark',
        '<a href="/gemstones/navaratna/cats-eye?origin=India">India Catseye Gemstone</a>: original cats eye stone lots with a clear band',
      ]),
      h2("Cat's Eye Chrysoberyl vs Quartz"),
      p(
        'Cat\'s eye chrysoberyl is Lehsunia. Quartz cat’s eye is a cheaper lookalike. An original cats eye stone must name chrysoberyl.',
        'Fibreglass is not a catseye gem.',
      ),
    ].join('\n'),
    quality_price_html: [
      p('Cats eye gemstone price follows eye sharpness, colour, and whether the catseye gemstone is chrysoberyl.'),
      h2('Cats Eye Gemstone Price'),
      p(
        'On our quality scale, weak lots can start near INR 10–100 per carat. Quartz mid grades often sit near INR 200–1,000. Chrysoberyl catseye gem lots run about INR 2,000–5,000 in commercial grades, INR 5,000–20,000 when the eye is fine, and about INR 20,000–1,00,000 for rare original cats eye stone material.',
        'India cats eye gemstone price overall spans about INR 10–1,00,000 per carat. Sri Lanka cats eye gemstone price for chrysoberyl often starts nearer INR 200 when identity is honest.',
      ),
      h3('Certification'),
      p('The report must say chrysoberyl. A catseye gem without that line is not Lehsunia.'),
    ].join('\n'),
    jewellery_html: [
      p('A catseye gemstone is a cabochon in a gold or silver ring on the middle finger. The eye of the original cats eye stone should run along the finger.'),
      h3('Setting'),
      ul(['Cabochon only', 'Skin contact', 'Tuesday or Thursday energisation']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm water and mild soap. A catseye gemstone is durable chrysoberyl.'),
      h3('Handling'),
      p('Do not knock the girdle of the catseye gem.'),
      h3('Re-Energisation'),
      p('Ketu mantra on the chosen evening with a Gangajal rinse on the original cats eye stone.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Quartz and glass are sold as a catseye gemstone. If cats eye gemstone price is tourist-cheap, assume quartz.'),
      h2('Original Cats Eye Stone vs Fake'),
      p('An original cats eye stone moves under one lamp. A painted catseye gem does not. Cat\'s eye chrysoberyl shows milk-and-honey in fine lots.'),
      h3('Red Flags'),
      ul(['Certificate says quartz', 'Eye does not move', 'Catseye gemstone priced like glass']),
      p(`${BRAND} lists only chrysoberyl as a catseye gemstone — not quartz substitutes.`),
    ].join('\n'),
    faqs: [
      { question: 'What is a catseye gemstone?', answer: 'A catseye gemstone is chatoyant chrysoberyl (Lehsunia) for Ketu. Quartz is not the Navaratna gem.' },
      { question: 'What is a catseye gem?', answer: 'A catseye gem is the same stone — a catseye gemstone with a mobile eye. Confirm chrysoberyl on the report.' },
      { question: "What is cat's eye chrysoberyl?", answer: 'Cat\'s eye chrysoberyl is the mineral of Lehsunia. Mohs 8.5, sharp eye, honey to greenish body.' },
      { question: 'What is an original cats eye stone?', answer: 'An original cats eye stone is natural chrysoberyl, not fibre-optic glass. The eye must move.' },
      { question: 'What is cats eye gemstone price in India?', answer: 'Cats eye gemstone price on our scale runs about INR 10–1,00,000 per carat. Chrysoberyl catseye gemstone lots sit well above quartz.' },
      { question: 'Which finger for a catseye gemstone?', answer: 'Middle finger of the right hand, cabochon, so the catseye gem touches skin.' },
      { question: 'Tuesday or Thursday for Lehsunia?', answer: 'Gem-quality notes use Tuesday or Thursday evening. Follow your astrologer’s muhurta.' },
      { question: 'Can I wear a catseye gem with gomed?', answer: 'Rahu and Ketu together need a written yoga. Do not self-combine an original cats eye stone with hessonite.' },
      { question: 'Honey or green catseye gemstone?', answer: 'Honey and greenish-honey Ceylon lots are prized. Sharp chatoyancy beats exact hue.' },
      { question: 'Is quartz a catseye gem?', answer: 'No. Quartz is a lookalike. Jyotish Lehsunia is cat’s eye chrysoberyl.' },
    ],
  }),

  'white-sapphire': defineGem({
    slug: 'white-sapphire',
    name: 'Natural White Sapphire',
    hindi: 'Safed Pukhraj',
    planet: 'Venus',
    extraKeywords: [
      'white sapphire',
      'white sapphire gemstone',
      'natural white sapphire',
      'white sapphire stone',
      'ceylon white sapphire',
      'safed pukhraj',
    ],
    seo_description:
      'Natural white sapphire stone and white sapphire gemstone (Safed Pukhraj). Ceylon white sapphire as the Jyotish diamond substitute.',
    intro:
      'Natural White Sapphire (Safed Pukhraj) is Shukra’s corundum substitute for diamond. A white sapphire stone needs a chart reading and honest heat disclosure.',
    hero_benefits: [
      { text: 'Venus substitute' },
      { text: 'Friday wear' },
      { text: 'Ceylon white sapphire' },
      { text: 'Heat disclosed' },
    ],
    about_html: [
      p(
        'A natural white sapphire is colourless corundum. In Hindi it is Safed Pukhraj. Vedic astrology uses this white sapphire gemstone when Heera is not worn.',
        'Fine white sapphire stone lots are icy and brilliant. Sri Lanka, Madagascar, Burma, Tanzania, and Australia supply the material we grade.',
        'Cubic zirconia is not a white sapphire. Ask for corundum on the report.',
      ),
      h3('Vedic Significance'),
      p(
        'Venus rules Taurus and Libra. A white sapphire is often named when Shukra needs support and diamond is impractical. First get a Jyotish reading.',
      ),
      h2('What is a White Sapphire Stone'),
      p(
        'A white sapphire stone is undyed corundum. A white sapphire gemstone shows diamond-like fire at a lower cost.',
        'Ceylon white sapphire is the usual Jyotish preference when it is eye-clean.',
      ),
      h2('What customers say about white sapphire'),
      p(
        'People write about easier Venus themes — after the chart check, not overnight miracles.',
        'Read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a white sapphire stone.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear a natural white sapphire only after the chart check. The table is the PureVedicGems Jyotish pattern.'),
      table([
        ['Weight', 'Generally 3–7 carats. Confirm with Jyotish.'],
        ['Colour', 'Colourless. Grey or milky white sapphire stone lots are weaker for ratna use.'],
        ['Metal', 'Platinum, white gold, or silver.'],
        ['Finger', 'Middle or ring finger of the right hand.'],
        ['Day', 'Friday morning'],
        ['Time', 'Morning during Shukra hora'],
        ['Mantra', 'Chant “Om Dram Drim Droum Sah Shukraya Namah” 108 times'],
        ['Purification', 'Rose water, raw milk, Gangajal, white flowers'],
      ]),
      p('Set the white sapphire gemstone so it can touch skin.'),
    ].join('\n'),
    who_should_wear_html: [
      p('A natural white sapphire suits Taurus and Libra charts when Venus should be strengthened and diamond is not prescribed. Artists and marriage seekers often wear this white sapphire stone after a reading.'),
      h3('When Natural White Sapphire May Help'),
      ul(['Shukra dasha after an astrologer confirms Safed Pukhraj', 'Diamond substitute with chart approval', 'Creative and luxury work']),
      h3('When Not to Wear'),
      p('If the astrologer names Heera only, a white sapphire gemstone is the wrong swap. Avoid if Venus is already strong.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} helps choose Heera vs a white sapphire. Book a <a href="/consultation">consultation</a>. Then read the <a href="/knowledge/gem-qualities/white-sapphire">white sapphire quality guide</a>.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear a natural white sapphire for Shukra’s themes: love, arts, and comfort. These are traditional uses, not medical claims.'),
      h3('Relationships'),
      p('A white sapphire stone is worn for harmony. Effort still does the work.'),
      h3('Arts'),
      p('A white sapphire gemstone is used in creative trades when Venus should be supported.'),
      h3('Diamond substitute'),
      p('Ceylon white sapphire is the usual first substitute. It is not automatic Heera.'),
    ].join('\n'),
    types_html: [
      p('Not every white sapphire stone is equal. Origin, clarity, and heat change Jyotish fitness.'),
      h2('White Sapphire Stone Origins'),
      ul([
        '<a href="/gemstones/navaratna/white-sapphire?origin=Ceylon">Ceylon White Sapphire</a>: the preferred eye-clean white sapphire gemstone',
        '<a href="/gemstones/navaratna/white-sapphire?origin=Madagascar">Madagascar White Sapphire</a>: good transparency in a natural white sapphire',
      ]),
      h2('Natural White Sapphire vs Lookalikes'),
      p(
        'White topaz, CZ, and moissanite are sold as white sapphire. A natural white sapphire is corundum, Mohs 9.',
        'Prefer unheated white sapphire stone lots. Coatings are not Jyotish grade.',
      ),
    ].join('\n'),
    quality_price_html: [
      p('A white sapphire gemstone is priced below diamond per carat. Clarity and cut drive a natural white sapphire more than origin folklore.'),
      h2('Ceylon White Sapphire Quality'),
      p(
        'Ceylon white sapphire that is eye-clean sits above milky commercial white sapphire stone lots. Heat, if any, must be named.',
        'Budget a white sapphire as a Shukra ratna, not as a fake diamond invoice.',
      ),
      h3('Certification'),
      p('The report must say natural corundum. A white sapphire gemstone without that line may be topaz.'),
    ].join('\n'),
    jewellery_html: [
      p('A natural white sapphire is set in white metal so the white sapphire stone touches skin. Brilliant cuts suit a white sapphire gemstone.'),
      h3('Setting'),
      ul(['Friday energisation', 'Open culet', 'Disclose substitute status if the chart asked for diamond']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm water and mild soap. A white sapphire is Mohs 9.'),
      h3('Re-Energisation'),
      p('Friday Shukra mantra and a rose-water rinse on the white sapphire stone.'),
    ].join('\n'),
    buyer_beware_html: [
      p('CZ and white topaz are sold as a white sapphire gemstone. If the price is topaz-cheap, it is not a natural white sapphire.'),
      h2('Ceylon White Sapphire vs Synthetic'),
      p('A Ceylon white sapphire shows natural inclusions. Flame-fusion white sapphire stone lots are not the same as mined corundum.'),
      h3('Red Flags'),
      ul(['No corundum on the report', 'Grey milky body sold as Ceylon white sapphire', 'White sapphire gemstone with a coating']),
      p(`${BRAND} certifies natural white sapphire with lab reports.`),
    ].join('\n'),
    faqs: [
      { question: 'What is white sapphire?', answer: 'White sapphire is colourless corundum (Safed Pukhraj). It is the usual Jyotish substitute for diamond when Venus needs support.' },
      { question: 'What is a white sapphire gemstone?', answer: 'A white sapphire gemstone is the same mineral. Confirm natural corundum, not CZ.' },
      { question: 'What is a natural white sapphire?', answer: 'A natural white sapphire is mined corundum. Synthetic colourless sapphire is a different buy.' },
      { question: 'What is a white sapphire stone?', answer: 'A white sapphire stone is Safed Pukhraj. Wear it in white metal after a chart reading.' },
      { question: 'What is Ceylon white sapphire?', answer: 'Ceylon white sapphire is Sri Lankan colourless corundum. Eye-clean lots are preferred for Jyotish.' },
      { question: 'White sapphire vs diamond?', answer: 'Diamond is primary. A white sapphire gemstone is the traditional substitute when prescribed.' },
      { question: 'Which finger for white sapphire?', answer: 'Middle or ring finger of the right hand, so the white sapphire stone touches skin.' },
      { question: 'How many carats?', answer: 'Generally 3–7 carats for a natural white sapphire.' },
      { question: 'White sapphire vs zircon?', answer: 'White sapphire is corundum. Zircon is a further substitute only when named.' },
      { question: 'Heated white sapphire OK?', answer: 'Unheated natural white sapphire is preferred. Disclosed heat-only may be accepted by some astrologers.' },
    ],
  }),

  pitambari: defineGem({
    slug: 'pitambari',
    name: 'Natural Pitambari Sapphire',
    hindi: 'Pitambari Neelam',
    planet: 'Jupiter & Saturn',
    extraKeywords: [
      'pitambari',
      'pitambari sapphire',
      'natural pitambari',
      'pitambari neelam',
      'sri lankan pitambari',
      'dual colour sapphire',
    ],
    seo_description:
      'Natural pitambari and pitambari sapphire (Pitambari Neelam) for Guru and Shani. Sri Lankan pitambari with dual yellow-blue zoning.',
    intro:
      'Natural Pitambari Sapphire (Pitambari Neelam) is a dual-tone corundum for Guru and Shani together. A pitambari sapphire is not a glued doublet. PureVedicGems lists natural pitambari with both colours in one crystal.',
    hero_benefits: [
      { text: 'Guru and Shani' },
      { text: 'Dual zoning' },
      { text: 'Sri Lankan pitambari' },
      { text: 'Chart first' },
    ],
    about_html: [
      p(
        'A natural pitambari is yellow-and-blue sapphire in one stone. In Hindi it is Pitambari Neelam. Vedic astrology uses this pitambari sapphire when Jupiter and Saturn must be held together.',
        'Fine pitambari shows natural colour zones. Sri Lanka and Madagascar supply most Sri Lankan pitambari and parti lots we grade.',
        'An assembled yellow-blue pair is not a pitambari sapphire.',
      ),
      h3('Vedic Significance'),
      p(
        'Guru expands. Shani constrains. A pitambari sapphire is named only for specific yogas. First get a Jyotish reading.',
        'Casual wear of natural pitambari is the wrong buy.',
      ),
      h2('What is Pitambari Sapphire'),
      p(
        'Pitambari sapphire is colour-zoned corundum. Pitambari Neelam is the same gem. It is not separate Pukhraj glued to neelam.',
        'Sri Lankan pitambari is the usual source when zoning is natural.',
      ),
      h2('What customers say about pitambari'),
      p(
        'People write about needing the yoga named first — not a fashion dual-tone.',
        'Read our <a href="/testimonials">customer testimonials</a> or <a href="/consultation">book a consultation</a> before you pick a pitambari sapphire.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear natural pitambari only after the yoga is named. The table is the PureVedicGems starting pattern.'),
      table([
        ['Weight', 'Generally 4–8 carats. Confirm with Jyotish.'],
        ['Colour', 'Visible yellow and blue zones on the pitambari sapphire face.'],
        ['Metal', 'Gold or Panchdhatu.'],
        ['Finger', 'Index or middle finger as prescribed.'],
        ['Day', 'Thursday or Saturday as prescribed'],
        ['Time', 'Guru hora or Shani hora as prescribed'],
        ['Mantra', 'Chant “Om Gram Grim Groum Sah Gurave Namah” and “Om Pram Prim Proum Sah Shanaye Namah” 108 times each if told'],
        ['Purification', 'Turmeric, sesame, Gangajal; yellow and blue flowers'],
      ]),
      p('Set the pitambari sapphire so both colours of the natural pitambari show and the gem can touch skin.'),
    ].join('\n'),
    who_should_wear_html: [
      p('Natural pitambari is for charts that need Guru and Shani in one stone. Judges and administrators sometimes wear a pitambari sapphire after a reading.'),
      h3('When Pitambari Sapphire May Help'),
      ul(['Written yoga for dual Guru–Shani', 'Need to avoid separate Pukhraj and neelam', 'Sri Lankan pitambari with honest zoning']),
      h3('When Not to Wear'),
      p('If the astrologer names only Pukhraj or only neelam, a pitambari sapphire is the wrong gem. Do not buy natural pitambari as fashion.'),
      h3('Mandatory Consultation'),
      p(
        `${BRAND} sells pitambari sapphire only with consultation. Book a <a href="/consultation">consultation</a> before the set.`,
      ),
    ].join('\n'),
    benefits_html: [
      p('People wear natural pitambari for dual-planet work: expansion with discipline. These are traditional uses, not medical claims.'),
      h3('Balance'),
      p('A pitambari sapphire is worn so Guru and Shani are not fought as two rings. The yoga still decides.'),
      h3('Career'),
      p('Law and large institutions sometimes use Pitambari Neelam when named.'),
      h3('Not a shortcut'),
      p('Sri Lankan pitambari does not replace chart work.'),
    ].join('\n'),
    types_html: [
      p('Not every dual-tone sapphire is pitambari sapphire. Zoning must be natural.'),
      h2('Pitambari Sapphire Origins'),
      ul([
        'Sri Lankan pitambari: the usual Pitambari Neelam source',
        'Madagascar: occasional natural pitambari parti lots',
      ]),
      h2('Natural Pitambari vs Diffusion'),
      p('Natural pitambari is colour-zoned corundum. Diffusion patches are not a pitambari sapphire for Jyotish. Doublets are not Pitambari Neelam.'),
    ].join('\n'),
    quality_price_html: [
      p('A pitambari sapphire is priced as rare dual-tone corundum, not as two cheap sapphires.'),
      h2('Pitambari Sapphire Price'),
      p(
        'Natural pitambari sits above ordinary yellow or blue lots of the same size. Sri Lankan pitambari with clean zoning reaches collector tiers.',
        'Ask for natural zoning on the report before you pay pitambari sapphire prices.',
      ),
      h3('Certification'),
      p('The report must say natural corundum and natural colour. A pitambari sapphire without that line is a guess.'),
    ].join('\n'),
    jewellery_html: [
      p('Set natural pitambari so both colours of the pitambari sapphire face out. Gold on the named finger.'),
      h3('Setting'),
      ul(['Do not hide a zone', 'Muhurta required', 'Trial like neelam if asked']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Cleaning'),
      p('Warm water and mild soap. A pitambari sapphire is Mohs 9.'),
      h3('Re-Energisation'),
      p('Use the day named for your natural pitambari. Keep both mantras if prescribed.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Glued yellow-and-blue pairs are sold as pitambari sapphire. Diffusion is sold as natural pitambari.'),
      h2('Pitambari Neelam vs Fake'),
      p('Pitambari Neelam is one crystal. If a pitambari sapphire splits at a glue line, walk away. Sri Lankan pitambari still needs a report.'),
      h3('Red Flags'),
      ul(['No zoning photo', 'Two stones in one mount called natural pitambari', 'Pitambari sapphire with no corundum line']),
      p(`${BRAND} lists only natural colour-zoned corundum as pitambari sapphire.`),
    ].join('\n'),
    faqs: [
      { question: 'What is pitambari?', answer: 'Pitambari is yellow-and-blue sapphire in one stone (Pitambari Neelam) for Guru and Shani together.' },
      { question: 'What is pitambari sapphire?', answer: 'Pitambari sapphire is that dual-tone corundum. It is not Pukhraj glued to neelam.' },
      { question: 'What is natural pitambari?', answer: 'Natural pitambari has colour zones grown in the crystal, not diffusion paint.' },
      { question: 'What is Pitambari Neelam?', answer: 'Pitambari Neelam is the Hindi name for a pitambari sapphire.' },
      { question: 'What is Sri Lankan pitambari?', answer: 'Sri Lankan pitambari is Ceylon-origin dual-tone sapphire, the usual source we grade.' },
      { question: 'Who should wear a pitambari sapphire?', answer: 'Only charts with a written Guru–Shani yoga. Do not self-prescribe natural pitambari.' },
      { question: 'Thursday or Saturday for pitambari?', answer: 'The astrologer names the day. Both mantras may be used on a pitambari sapphire.' },
      { question: 'Can I wear pitambari instead of two rings?', answer: 'Only if that is the prescription. Otherwise wear Pukhraj or neelam, not a fashion pitambari sapphire.' },
      { question: 'Does pitambari need a trial?', answer: 'Treat natural pitambari with neelam-level caution when Shani is in the yoga.' },
      { question: 'Madagascar or Sri Lankan pitambari?', answer: 'Sri Lankan pitambari is traditional. Fine Madagascar zoning works if the report says natural.' },
    ],
  }),

  'exclusive-gems': defineGem({
    slug: 'exclusive-gems',
    name: 'Exclusive Gems',
    hindi: 'Vishisht Ratna',
    planet: 'Navaratna',
    extraKeywords: [
      'exclusive gems',
      'rare navaratna',
      'on request gems',
      'kashmir sapphire',
      'burma ruby',
      'collector gemstones',
    ],
    seo_title: 'Buy Exclusive Gems | Navaratna',
    seo_description:
      'Exclusive gems and rare Navaratna on request. Kashmir sapphire, Burma ruby, and collector stones with lab reports.',
    intro:
      'Exclusive gems are on-request Navaratna: rare origin, size, or collector grade. PureVedicGems sources exclusive gems after a chart brief, not from a standard shelf.',
    hero_benefits: [
      { text: 'On-request rare Navaratna' },
      { text: 'Top-lab reports' },
      { text: 'Jyotish brief first' },
      { text: 'Provenance notes' },
    ],
    about_html: [
      p(
        'Exclusive gems are the on-request shelf for rare Navaratna. Kashmir neelam, Burma ruby, no-oil emerald, and padparadscha sit here when they are not in the open catalogue.',
        'Exclusive gems are not impulse SKUs. Lead time and lab paper come before the invoice.',
      ),
      h3('What counts'),
      p('Rare origin, unheated collector colour, matched pairs, and legacy stones. Exclusive gems still need Jyotish fit.'),
      h2('What are Exclusive Gems'),
      p(
        'Exclusive gems are sourced to a brief. Rare Navaratna quality does not skip treatment disclosure.',
        'If the chart wants a standard Ceylon neelam, you do not need exclusive gems.',
      ),
      h2('What customers say about exclusive gems'),
      p(
        'People write about waiting for the right stone — not the fastest listing.',
        'Start with a <a href="/consultation">consultation</a> or an <a href="/contact">enquiry</a> before we search exclusive gems.',
      ),
    ].join('\n'),
    how_to_wear_html: [
      p('Wear exclusive gems on the planet day of the stone you actually receive. The table is a reminder, not a substitute for the brief.'),
      table([
        ['Weight', 'Per astrologer for that rare Navaratna'],
        ['Metal', 'Per planet of the exclusive gems piece'],
        ['Finger', 'Per planet'],
        ['Day', 'Planet weekday of the sourced gem'],
        ['Time', 'Named muhurta'],
        ['Mantra', 'Beej mantra of that graha'],
        ['Purification', 'Full energisation for exclusive gems lots'],
      ]),
    ].join('\n'),
    who_should_wear_html: [
      p('Exclusive gems suit collectors and milestone dashas that need rare Navaratna origin, not a larger commercial stone.'),
      h3('When Exclusive Gems May Help'),
      ul(['Astrologer names Kashmir, Burma, or no-oil material', 'Heirloom exclusive gems with provenance', 'Investment and Jyotish in one rare Navaratna']),
      h3('When not'),
      p('If a listed hub stone matches the chart, skip exclusive gems. Price is not potency by itself.'),
      h3('Consultation'),
      p(`Every exclusive gems search at ${BRAND} starts with a chart brief.`),
    ].join('\n'),
    benefits_html: [
      p('Exclusive gems aim at the highest natural quality the brief allows. Chart fit still outranks carat.'),
      h3('Potency'),
      p('Rare Navaratna origin is a classical preference, not a guarantee.'),
      h3('Legacy'),
      p('Exclusive gems often become family stones. Keep the papers with the gem.'),
      h3('Ritual'),
      p('Major muhurtas sometimes call for exclusive gems. The astrologer names that, not the catalogue.'),
    ].join('\n'),
    types_html: [
      p('Exclusive gems on request include, when found:'),
      h2('Exclusive Gems on Request'),
      ul([
        'Kashmir blue sapphire (unheated)',
        'Burma pigeon-blood ruby (unheated)',
        'Colombian emerald (minor oil to no oil)',
        'Padparadscha and large unheated Pukhraj',
        'Natural Basra pearl among exclusive gems lots',
      ]),
      h2('Rare Navaratna vs Standard Hub'),
      p('Hub pages cover everyday Jyotish grade. Exclusive gems are the search desk for stones that are not sitting in those filters.'),
    ].join('\n'),
    quality_price_html: [
      p('Exclusive gems are quoted per stone. There is no single exclusive gems price list.'),
      h2('Exclusive Gems Price'),
      p(
        'Rare Navaratna quotes follow origin opinion, heat, and size. Kashmir and Burma exclusive gems sit far above commercial hubs.',
        'Pay after the lab paper, not after a WhatsApp photo.',
      ),
      h3('Certification'),
      p('Exclusive gems need a top-lab report. Origin opinion is extra, not a slogan.'),
    ].join('\n'),
    jewellery_html: [
      p('Exclusive gems are set after the stone is accepted. Metal follows the planet of that rare Navaratna.'),
      h3('Setting'),
      ul(['Open culet', 'Muhurta on delivery', 'Insurance for exclusive gems']),
    ].join('\n'),
    cleaning_care_html: [
      h3('Care'),
      p('Follow the mineral: coral and pearl among exclusive gems stay off chemicals; corundum uses soap and water.'),
      h3('Records'),
      p('Keep certificates with exclusive gems. Re-check prongs on heavy rare Navaratna rings.'),
    ].join('\n'),
    buyer_beware_html: [
      p('Fake origin reports cluster around exclusive gems. Kashmir and Burma claims need microscopy, not a story.'),
      h2('Exclusive Gems vs Hype'),
      p('If exclusive gems pricing has no lab, it is not rare Navaratna. We welcome a third-party recheck.'),
      h3('Red Flags'),
      ul(['Pressure close', 'No return for re-cert', 'Exclusive gems with no treatment line']),
      p(`${BRAND} will not confirm exclusive gems until the paper matches the stone.`),
    ].join('\n'),
    faqs: [
      { question: 'What are exclusive gems?', answer: 'Exclusive gems are on-request rare Navaratna — origin, size, or collector grade not on the open shelf.' },
      { question: 'How do I enquire about exclusive gems?', answer: 'Send a chart brief, budget, and timeline. We search and present exclusive gems with lab paper.' },
      { question: 'What is the lead time for exclusive gems?', answer: 'Days to weeks. Kashmir and padparadscha exclusive gems can take longer.' },
      { question: 'Are exclusive gems more powerful?', answer: 'Quality helps. Chart fit matters more. Exclusive gems maximise both when prescribed.' },
      { question: 'Can I request Kashmir neelam as exclusive gems?', answer: 'Yes. Unheated Kashmir among exclusive gems is rare and priced as rare Navaratna.' },
      { question: 'Investment or astrology?', answer: 'Exclusive gems can be both when origin is honest. We rank Jyotish fit first.' },
      { question: 'Payment for exclusive gems?', answer: 'Secure pay after the report. Recertification window where stated.' },
      { question: 'Custom jewellery with exclusive gems?', answer: 'Yes. Metal and finger follow the rare Navaratna you receive.' },
      { question: 'Trial wear for exclusive gems neelam?', answer: 'Yes for high-stakes Shani exclusive gems — even at collector tier.' },
      { question: 'Do I need exclusive gems or a hub stone?', answer: 'If a listed ruby or neelam matches, skip exclusive gems. Ask in consultation.' },
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
