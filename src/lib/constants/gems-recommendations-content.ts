/** Combined SEO content from legacy recommendation pages (.com + .in).
 * Sources redirected here:
 * - /gems-recommendations, /gemstone-recommendation
 * - /gemstone-recommendation-by-date-of-birth, /gemstone-recommendation-date-of-birth
 * - /gemstone-recommendations-pure-vedic-science
 * - /online-rudraksha-recommendation
 * - /astrological-gemstone-recommendation-for-success-in-various-areas-of-life
 * - /gemstone-recommendation-old-form, /thank-you-for-gems-recommendation
 */

export const GEMS_REC_PATH = '/gems-recommendations';

export const GEMS_REC_META = {
  title: 'Which Gemstone Should I Wear? | Kundli Recommendation',
  description:
    'Expert Vedic gemstone & Rudraksha recommendation by birth chart (Kundli), lagna, and date of birth — India and worldwide. Lucky stones, stones to avoid, and Yagya remedies from Pure Vedic Gems.',
};

/** Compact on-page FAQs only (must match visible FAQ + FAQ schema). */
export const GEMS_REC_PAGE_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: 'How do I get my remedies recommendation?',
    answer:
      'Share your date, time, and place of birth, pay the booking fee, and a Pure Vedic Gems astrologer reviews your Kundli. You receive personalized gemstone, Rudraksha, and/or Yagya guidance by email — not an automated software report.',
  },
  {
    question: 'Is date of birth alone enough for a gemstone recommendation?',
    answer:
      'No. Exact birth time and place are needed to cast the lagna (ascendant). Western month-based birthstones and Rashi-only pickers are not the same as a full birth-chart review.',
  },
  {
    question: 'Do you serve clients outside India?',
    answer:
      'Yes. Online booking works worldwide — USA, Canada, UK, Europe, UAE and the Gulf, Singapore, Australia, New Zealand, and NRIs globally. Share accurate birth place and local time; the report is emailed and certified gems ship with insured international delivery.',
  },
  {
    question: 'What can happen if I wear the wrong gemstone?',
    answer:
      'Strengthening a malefic or wrongly timed planet can increase obstacles in health, career, or relationships. Never wear a stone because it helped someone else — confirm with chart analysis first.',
  },
  {
    question: 'How is Rudraksha included in the recommendation?',
    answer:
      'When gemstones are unsuitable or complementary beads help, the same Kundli review may suggest suitable Rudraksha mukhi types, with links to certified beads from our collection.',
  },
  {
    question: 'Are software-only gemstone calculators reliable?',
    answer:
      'Free calculators are educational but miss dasha nuance, dignity, and when Yagya is safer than wearing a stone. Our service uses human expert analysis after booking.',
  },
  {
    question: 'How is the recommendation report sent?',
    answer:
      'After payment confirmation, our team emails your personalized remedies recommendation and related product links. Login is optional for booking.',
  },
  {
    question: 'Why choose Pure Vedic Gems?',
    answer:
      'Heritage Vedic gems house since 1937 (Pure Vedic Science and Research Centre) with gemstones, Rudraksha, and Yagyas under one roof — recommended only after deep horoscope study.',
  },
];

/** High-intent queries for meta keywords + WebPage JSON-LD (not rendered as page copy). */
export const GEMS_REC_KEYWORDS = [
  'which gemstone should I wear',
  'lucky gemstone by date of birth',
  'gemstone recommendation by birth chart',
  'vedic gemstone recommendation online',
  'gemstone recommendation by kundli',
  'lagna lord gemstone',
  'life stone astrology',
  'stones to avoid in astrology',
  'online rudraksha recommendation',
  'vedic remedies consultation',
  'gemstone for career astrology',
  'blue sapphire trial astrology',
  'navratna recommendation',
  'NRI gemstone consultation',
  'vedic astrology gemstone USA UK UAE',
  'western birthstone vs vedic gemstone',
];

/** Legacy “areas of life / success” page themes (always chart-verified). */
export const GEMS_REC_LIFE_AREAS = [
  {
    title: 'Government career & authority',
    body: 'Ruby (Sun) is classically linked with authority and favour in government roles — only when the Sun is suitable to strengthen in your Kundli.',
  },
  {
    title: 'Private career & discipline',
    body: 'Blue Sapphire (Saturn) is often discussed for private-sector growth where discipline and responsibility matter — after ruling out Saturn afflictions that argue for Yagya instead.',
  },
  {
    title: 'Business & commerce',
    body: 'Emerald (Mercury) is traditionally associated with trade, communication, and negotiation — recommended only when Mercury is a career benefic in the chart.',
  },
  {
    title: 'Relationships & harmony',
    body: 'White Sapphire / Diamond (Venus) themes support affection and partnership balance when Venus is a friend to the lagna and current dasha.',
  },
  {
    title: 'Health & vitality',
    body: 'Ruby (Sun), Pearl (Moon), and Red Coral (Mars) are common health-related gemstones in Jyotish — chosen only after weighing lagna strength and afflictions.',
  },
  {
    title: 'Wealth, education & progeny',
    body: 'Yellow Sapphire (Jupiter) is classically linked with prosperity, higher learning, and progeny blessings — never prescribed from sun-sign lists alone.',
  },
] as const;

export const GEMS_REC_CONCERNS = [
  {
    slug: 'career',
    title: 'Career Problems',
    titleHi: 'कैरियर की समस्याएँ',
    image: '/home/remediesrec/Career%20Problems.jpg',
    body: 'When Mahadasha, Antardasha, or weak career houses stall growth, the right planetary gemstone or Yagya can support clarity, recognition, and steady progress — only after chart analysis.',
  },
  {
    slug: 'health',
    title: 'Health Problems',
    titleHi: 'स्वास्थ्य की समस्याएँ',
    image: '/home/remediesrec/Health%20Problems.jpg',
    body: 'Health-sensitive planets need careful handling. Our astrologers weigh lagna strength and afflictions before suggesting gemstones, Rudraksha, or pacifying Yagyas — never a one-size map from birth date alone.',
  },
  {
    slug: 'relationship',
    title: 'Relationship Problems',
    titleHi: 'रिश्ते की समस्याएँ',
    image: '/home/remediesrec/Relationship%20Problems.jpg',
    body: 'Harmony in marriage and partnerships often tracks the 7th house, Venus, and dasha sequence. Remedies are recommended only when they strengthen benefic factors without aggravating others.',
  },
] as const;

export const GEMS_REC_SERVICES = [
  {
    slug: 'horoscope',
    title: 'Horoscope / Kundli',
    titleHi: 'कुंडली',
    image: '/home/remediesrec/Horoscope%20%20Kundli.jpg',
    href: '/consultation',
    body: 'Detailed lagna, chalit, moon, and divisional chart study — Mahadasha, Antardasha, and planetary dignity — by experienced Vedic astrologers.',
  },
  {
    slug: 'gemstones',
    title: 'Gemstones',
    titleHi: 'रत्न',
    image: '/home/remediesrec/Gemstones.jpg',
    href: '/shop',
    body: 'Navratna and suitable Upratna recommendations matched to benefics in your chart, with guidance on quality grade, weight, and metal.',
  },
  {
    slug: 'rudraksha',
    title: 'Rudrakshas',
    titleHi: 'रुद्राक्ष',
    image: '/home/remediesrec/Rudrakshas.jpg',
    href: '/rudraksha',
    body: 'Mukhi selection based on your Kundli when gemstones are not suitable, or as complementary remedies for balance and protection.',
  },
] as const;

export const GEMS_REC_PILLARS = [
  {
    title: 'Deep Vedic Knowledge',
    titleHi: 'गहन वैदिक ज्ञान',
    body: 'Years of dedicated study and traditional chart analysis — not software-only pickers.',
  },
  {
    title: 'Sattvic Purity',
    titleHi: 'सात्विक पवित्रता',
    body: 'Remedies chosen with ethical intent, transparent quality grades, and honest guidance.',
  },
  {
    title: 'Cosmic Alignment',
    titleHi: 'ब्रह्मांडीय समन्वय',
    body: 'Gemstones, Rudraksha, and Yagyas selected to seek balance with planetary periods — not quick commercial promises.',
  },
  {
    title: 'Authentic Tradition',
    titleHi: 'प्रामाणिक परंपरा',
    body: 'Family tradition in Vedic gems and remedies since 1937 at Pure Vedic Science and Research Centre, with purification and energization as practiced in our centres.',
  },
] as const;

export const GEMS_REC_PROCESS = [
  {
    step: '01',
    title: 'Share birth details',
    body: 'Date, time, and place of birth, plus your main area of concern (career, health, relationships, finance, or study).',
  },
  {
    step: '02',
    title: 'Pay ₹101 securely',
    body: 'Book your remedies recommendation with Razorpay. Login is optional — guests receive email confirmation.',
  },
  {
    step: '03',
    title: 'Expert Kundli study',
    body: 'A qualified astrologer reviews lagna, dashas, and planetary strength — not an automatic computerised report.',
  },
  {
    step: '04',
    title: 'Receive your recommendation',
    body: 'Personalized gemstone, Rudraksha, and/or Yagya guidance with links to suitable quality options on our store.',
  },
] as const;

/** Classical method keywords competitors push (we pair them with human review). */
export const GEMS_REC_CLASSICAL = [
  {
    title: 'Life stone (Lagna / Ascendant lord)',
    body: 'The gem of your lagna (ascendant) lord is the classical “life stone” — often safest for long-term vitality and protection when that planet is fit to strengthen. Ascendant changes roughly every two hours, so exact birth time and place matter.',
  },
  {
    title: 'Benefic & fortune stones (5th & 9th lords)',
    body: 'Lords of the 5th (intellect, merit, children) and 9th (bhagya / fortune, dharma) give supportive “benefic” and “fortune” stones in the classical house-lord method used across serious Vedic gemology.',
  },
  {
    title: 'Yogakaraka priority',
    body: 'When one planet rules both a kendra and a trikona (for example Saturn for Taurus/Libra or Mars for Cancer/Leo), its gemstone is often flagged as the strongest single pick — still confirmed against dasha and afflictions.',
  },
  {
    title: 'Stones to avoid',
    body: 'Gemstones amplify a planet. Stones of functional malefics (often 6th/8th/12th lords for your lagna) can increase trouble. Competitor calculators list avoid-stones; our astrologers also check dasha, dignity, and whether Yagya/Rudraksha is safer than wear.',
  },
] as const;

/** Navratna planet map — high-traffic informational SEO table. */
export const GEMS_REC_NAVRATNA = [
  { planet: 'Sun (Surya)', gem: 'Ruby (Manik)', alternate: 'Red Spinel / Garnet (Upratna)' },
  { planet: 'Moon (Chandra)', gem: 'Pearl (Moti)', alternate: 'Moonstone' },
  { planet: 'Mars (Mangal)', gem: 'Red Coral (Moonga)', alternate: 'Carnelian' },
  { planet: 'Mercury (Budh)', gem: 'Emerald (Panna)', alternate: 'Peridot / Green Tourmaline' },
  { planet: 'Jupiter (Guru)', gem: 'Yellow Sapphire (Pukhraj)', alternate: 'Citrine / Topaz' },
  { planet: 'Venus (Shukra)', gem: 'Diamond / White Sapphire', alternate: 'White Zircon / Opal' },
  { planet: 'Saturn (Shani)', gem: 'Blue Sapphire (Neelam)', alternate: 'Amethyst / Iolite' },
  { planet: 'Rahu', gem: 'Hessonite (Gomed)', alternate: 'Orange Zircon' },
  { planet: 'Ketu', gem: "Cat's Eye (Lehsunia)", alternate: 'Tiger’s Eye (context-dependent)' },
] as const;

/** Worldwide / diaspora audiences. */
export const GEMS_REC_INTL = [
  {
    region: 'USA & Canada',
    body: 'Book an online Vedic gemstone consultation from the US or Canada with birth city as cast (New York, Toronto, etc.). Report arrives by email; certified stones ship internationally with insured delivery.',
  },
  {
    region: 'UK & Europe',
    body: 'NRIs and seekers in the UK, EU, and Europe can share GMT/BST birth times — we convert carefully when casting the chart. Remedies guidance is in clear English with wearing notes.',
  },
  {
    region: 'UAE & Middle East / Gulf',
    body: 'Clients in Dubai, Abu Dhabi, Qatar, Saudi Arabia, and across the Gulf use the same online form. Popular requests: career stability, business, marriage harmony, and authentic Navratna sourcing.',
  },
  {
    region: 'Singapore, Australia & New Zealand',
    body: 'Asia–Pacific and ANZ clients get the same expert Kundli review. Time zones and southern-hemisphere birth places are handled in chart casting; product links suit international checkout.',
  },
  {
    region: 'NRIs & global diaspora',
    body: 'Born in India, living abroad — or born overseas to Indian families — we need exact birth place (village/city) and local time. Online booking works worldwide; only natural Vedic-quality gems and Rudraksha are linked after recommendation.',
  },
] as const;

/** Keyword blocks from date-of-birth / Pure Vedic Science / Rudraksha + competitor gaps. */
export const GEMS_REC_SEO_BLOCKS = [
  {
    title: 'Gemstone recommendation by date of birth',
    body: 'Many people search for gemstone recommendation by date of birth alone. Date of birth starts the process, but responsible Vedic gemology also needs exact birth time and place to cast the lagna and house lords. Pure Vedic Gems treats “by date of birth” as the doorway to full Kundli analysis — not a sun-sign or birthstone-by-month list.',
  },
  {
    title: 'Western birthstone vs Vedic lucky stone',
    body: 'Western “birthstones by month” (January garnet, etc.) are calendar folklore. Vedic Jyotish matches gems to planets ruling your ascendant and key houses. Two people born the same calendar day can need opposite stones if lagna and dasha differ — which is why free Rashi-only calculators often mislead.',
  },
  {
    title: 'Which gemstone should I wear — and which should I avoid?',
    body: 'The right answer names both: strengthen functional benefics (often lagna, 5th, 9th lords or yogakaraka) and avoid amplifying functional malefics. Reactive stones such as Blue Sapphire, Hessonite, and Cat’s Eye are frequently trialled carefully when indicated. Our report explains wear vs avoid for your chart.',
  },
  {
    title: 'Online Rudraksha recommendation from your Kundli',
    body: 'Online Rudraksha recommendation uses your date, time, and place of birth so an astrologer can suggest mukhi beads that support weak or friendly planets. Recommended beads are available from our certified collection, with guidance when Rudraksha is preferred over — or paired with — gemstones and Yagyas.',
  },
  {
    title: 'Pure Vedic Science and Research Centre',
    body: 'Pure Vedic Gems operates as Pure Vedic Science and Research Centre — a heritage house for Astro-Vedic healing through gemstones, Rudrakshas, Yagyas, and Vedic sciences since 1937. Remedies are prepared after detailed horoscope study by learned Vedic astrologers, not a computerised template.',
  },
  {
    title: 'Worldwide online Vedic remedies consultation',
    body: 'Whether you are in India or abroad, the same process applies: secure payment (shown in your storefront currency), birth details, expert review, and an emailed recommendation with shop links. We serve USA, Canada, UK, Europe, UAE/Gulf, Singapore, Australia, New Zealand, and NRI communities globally.',
  },
] as const;

/** FAQs merged from .com + .in recommendation / Rudraksha / success pages (+ JSON-LD). */
export const GEMS_REC_FAQS: Array<{ question: string; answer: string }> = [
  {
    question: 'How do I know what gemstone recommendation is right for me?',
    answer:
      'The recommendation is based on your date, time, and place of birth. After analyzing your horoscope through an authentic pundit/astrologer, suitable gemstones (and when needed Rudraksha or Yagya) are suggested. Results are strongest when the stone is authentic Vedic quality — natural, well-colored, and properly set.',
  },
  {
    question: 'How are gemstones recommended at Pure Vedic Gems?',
    answer:
      'Senior astrologers study the Kundli in depth using date, time, and place of birth. They analyze Mahadasha, Antardasha, ascendant, moon sign, and planetary positions (including lagna, chalit, moon, and divisional charts) before recommending the most suitable gemstone and any necessary supporting remedies.',
  },
  {
    question: 'Is gemstone recommendation by date of birth enough?',
    answer:
      'Date of birth alone is not enough for a responsible Vedic recommendation. Exact birth time and place are needed to cast the lagna and house lords. Sun-sign or “birthstone by month” lists are not the same as Kundli-based gemology.',
  },
  {
    question: 'Which recommended gemstone can improve luck in career?',
    answer:
      'Career remedies depend on the houses and planets ruling profession in your chart — not a fixed stone for everyone. Benefic career planets may be strengthened with their gemstones; afflicted planets are often handled with Yagya/Shanti rather than wearing their stone.',
  },
  {
    question: 'What gemstone should I wear for success in a government job?',
    answer:
      'Ruby is classically associated with the Sun, authority, and favour in government roles. It is only suitable when the Sun is beneficial to strengthen in your chart. Always confirm with full Kundli analysis before wearing Ruby for career.',
  },
  {
    question: 'Which gemstone is suitable for improving private job prospects?',
    answer:
      'Blue Sapphire (Saturn) is often discussed for private-sector discipline and steady growth. Saturn must be carefully judged — if malefic for the chart, pacifying Yagya may be safer than wearing Blue Sapphire.',
  },
  {
    question: 'What gemstone can help boost my business?',
    answer:
      'Emerald (Mercury) is traditionally linked with trade, intellect, and negotiation. It supports business only when Mercury is a career benefic. Your remedies recommendation may instead favour another stone, Rudraksha, or Yagya depending on the dasha.',
  },
  {
    question: 'Is there a gemstone that can enhance personal relationships?',
    answer:
      'White Sapphire / Diamond themes (Venus) are associated with love and harmony. They help only when Venus is favourable for partnership in your Kundli and current periods — never because they worked for someone else.',
  },
  {
    question: 'Which gemstone is beneficial for health improvement?',
    answer:
      'Ruby (Sun), Pearl (Moon), and Red Coral (Mars) are common health-related stones in Vedic astrology. Health-sensitive charts need careful analysis: the wrong stone can aggravate issues, so always get an expert recommendation first.',
  },
  {
    question: 'How can I improve financial stability using gemstones?',
    answer:
      'Yellow Sapphire (Jupiter) is classically linked with prosperity and abundance. Emerald may also support commerce-related finance. The correct choice depends on your 2nd/11th house factors, dasha, and whether Jupiter or Mercury should be strengthened.',
  },
  {
    question: 'What gemstone should I consider for progeny-related issues?',
    answer:
      'Yellow Sapphire (Jupiter) is traditionally associated with fertility, expansion, and progeny. It should only be worn after chart confirmation; Yagya remedies are often recommended alongside or instead of stones for sensitive matters.',
  },
  {
    question: 'Which gemstone is best for higher education?',
    answer:
      'Yellow Sapphire stands out for academic wisdom under Jupiter. Emerald may support learning through Mercury. Before wearing either, confirm the planet is suitable in your horoscope — never buy for education from a generic list.',
  },
  {
    question: 'What are the Navratnas?',
    answer:
      'Navratnas are the nine primary Vedic gems — Ruby, Pearl, Red Coral, Emerald, Yellow Sapphire, Diamond/White Sapphire, Blue Sapphire, Hessonite, and Cat’s Eye — each corresponding to a planet. Combinations can be powerful but should be determined by an expert for your chart.',
  },
  {
    question: 'What are the characteristics of astrological gemstones to be worn?',
    answer:
      'Astrological gemstones should show good color, decent luster, a symmetrical cut, and preferably transparent stones without harmful negative inclusions. Red Coral, Pearl, and Opal are opaque exceptions and are judged on color, surface, and overall quality rather than transparency.',
  },
  {
    question: 'Why do recommended gemstone prices differ?',
    answer:
      'We grade gems into Economy, Premium, Super Premium, Luxury, and Super Luxury based on color, clarity, and brilliance. Higher grades are generally more effective astrologically and act faster; lower grades can still help when budget is limited, but results may be slower. Your report links quality bands suitable for your recommendation.',
  },
  {
    question: 'How much weight of gemstone is recommended?',
    answer:
      'A common working rule is about 10% of body weight in kilograms as carats for medium (Super Premium) quality — e.g. ~7 ct for a 70 kg wearer. Luxury/Super Luxury can often be ~6–8% of body weight; Economy/Premium may need ~12–14%. Final weight also depends on finger size, budget, and the stone available.',
  },
  {
    question: 'What are substitute gemstones (Upratnas)?',
    answer:
      'Substitute (Upratna) stones — such as Amethyst for Blue Sapphire or White Zircon for Diamond — are more affordable alternatives traditionally linked to the same planet. They still require expert analysis; a wrong substitute can weaken results or disturb balance.',
  },
  {
    question: 'What is the difference between natural, treated, and synthetic gemstones?',
    answer:
      'Natural untreated stones are preferred for Vedic use. Treated stones may look better but can lose potency for astrology. Synthetic stones lack planetary alignment value and are not recommended as remedial gems.',
  },
  {
    question: 'How can I tell if my gemstone is real and certified?',
    answer:
      'Ask for a gemological certificate from a recognised lab, verify the report number where possible, and prefer transparent sourcing with photos and clear grading. Pure Vedic Gems supplies certified natural options matched to your recommendation.',
  },
  {
    question: 'Does purification or energizing a gemstone matter?',
    answer:
      'Yes. Traditional purification and mantra energization are used to prepare a gem for wear. At Pure Vedic Gems centres, recommended stones can be purified and energized according to Vedic practice when you choose that service.',
  },
  {
    question: 'When should I update a gemstone recommendation?',
    answer:
      'Review after a major dasha/bhukti change, significant transit, or life event when prior remedies no longer match the chart. An astrologer can confirm whether to continue, replace, or pause a stone.',
  },
  {
    question: 'What about Rudraksha recommendation based on Kundli?',
    answer:
      'Online Rudraksha recommendation uses birth details so an astrologer can suggest mukhi beads that support weak or friendly planets — especially when gemstones are unsuitable or as complementary remedies. Recommended beads are available from our certified Rudraksha collection.',
  },
  {
    question: 'How does online Rudraksha recommendation work?',
    answer:
      'You share date of birth (ideally with time and place) and your main goal. An astrologer reviews planetary needs and suggests suitable Rudraksha types. You can then purchase certified beads online and speak with our team if you need help selecting a specific bead.',
  },
  {
    question: 'Are there Rudraksha beads linked to career professions?',
    answer:
      'Examples discussed in Jyotish practice include 5 Mukhi for skills and teaching roles, 4 Mukhi for creativity and communication, 6 Mukhi for strategic work, and 7/8/10 Mukhi themes for leadership, obstacle clearing, and protection — always selected after chart review, not by job title alone.',
  },
  {
    question: 'How effective is Yagya as a remedy compared to gemstones?',
    answer:
      'Yagya is among the strongest Vedic remedies for reducing malefic effects and strengthening beneficial planets through mantra and fire ritual. Gemstones continuously wear planetary support on the body; Yagyas are often preferred when a planet should be pacified rather than amplified. Many charts receive a combination of both.',
  },
  {
    question: 'Are online or software-only gemstone suggestions reliable?',
    answer:
      'Automatic software pickers ignore nuances of dasha, house ownership, and contraindications. Pure Vedic Gems recommendations are prepared after human expert analysis — not a computerised template — which is why birth details and a nominal ₹101 booking are required.',
  },
  {
    question: 'What can happen if I wear the wrong gemstone?',
    answer:
      'Strengthening a malefic or wrongly timed planet can increase obstacles in health, career, or relationships. Never wear a gemstone because someone else benefited from it. Always confirm with chart analysis first.',
  },
  {
    question: 'How is the recommendation report sent?',
    answer:
      'After booking and payment confirmation, our team emails your personalized remedies recommendation and links related to the suggested gemstones, Rudraksha, or Yagyas. Login is not required to book; authenticated users can also track the booking in their account.',
  },
  {
    question: 'Why choose Pure Vedic Gems for gemstone recommendation?',
    answer:
      'We are a heritage Vedic gems house (family tradition since 1937 at Pure Vedic Science and Research Centre) offering gemstones, Rudraksha, and Yagyas under one roof. Astrologers recommend only after deep horoscope study. Certified natural stones can be purified and energized according to Vedic practice at our centres. We serve clients in India and worldwide.',
  },
  {
    question: 'What is a life stone, benefic stone, and fortune stone in Vedic astrology?',
    answer:
      'In the classical house-lord method, the life stone is the gem of your lagna (ascendant) lord; the benefic stone relates to the 5th lord; and the fortune (bhagya) stone relates to the 9th lord. Yogakaraka planets can override as the single strongest pick. Calculators list these labels quickly; Pure Vedic Gems confirms them with dasha, dignity, and whether wear or Yagya is safer.',
  },
  {
    question: 'Is my Western Zodiac birthstone the same as a Vedic gemstone recommendation?',
    answer:
      'No. Month-based Western birthstones are not Jyotish remedies. Vedic recommendation uses your sidereal birth chart — especially lagna, house lords, and current dasha — so two people with the same calendar birthday can need very different stones.',
  },
  {
    question: 'Which gemstones should I avoid according to my birth chart?',
    answer:
      'Avoid stones of functional malefic planets for your lagna (often linked to the 6th, 8th, or 12th houses), and be cautious with highly reactive stones such as Blue Sapphire, Hessonite, and Cat’s Eye unless your chart and dasha clearly support them. Your recommendation report explains wear vs avoid for your Kundli.',
  },
  {
    question: 'Do you provide gemstone recommendation for clients in the USA, UK, UAE, and other countries?',
    answer:
      'Yes. Online booking is open worldwide — USA, Canada, UK, Europe, UAE and the Gulf, Singapore, Australia, New Zealand, and global NRI communities. Share exact birth place and local birth time; we email your remedies recommendation and ship certified gems and Rudraksha internationally with insured delivery.',
  },
  {
    question: 'I am an NRI — what birth details do you need?',
    answer:
      'Provide date of birth, accurate birth time (note timezone or whether it was IST), and the precise birth city/town — even if you now live abroad. If you were born overseas, use that city’s name. Incomplete time forces weaker Moon-sign fallbacks; exact data lets us cast the lagna correctly.',
  },
  {
    question: 'Can I pay in USD, GBP, AED, or other currencies?',
    answer:
      'The recommendation fee is a nominal booking amount shown in your selected storefront currency (converted from INR). International cards and UPI/cards via Razorpay are commonly used depending on your location. After payment, the report is emailed regardless of country.',
  },
  {
    question: 'Should Blue Sapphire (Neelam) always be tested before long-term wear?',
    answer:
      'Many Vedic practitioners advise a short trial for Blue Sapphire and other reactive stones when indicated, watching health, sleep, and circumstances. Never start Neelam from a free online picker alone — confirm lagna fitness, dasha, and afflictions with an astrologer first.',
  },
  {
    question: 'What is better if birth time is unknown — Rashi stone or no gemstone?',
    answer:
      'Without birth time, lagna cannot be cast reliably. Tradition sometimes falls back to the Moon-sign (Janma Rashi) lord’s stone as a weaker proxy. We usually prefer safer pacifying remedies (mantra, Rudraksha, Yagya) or ask for a rectified time estimate rather than risk amplifying the wrong planet.',
  },
  {
    question: 'Do free gemstone calculator tools replace an astrologer?',
    answer:
      'Free calculators (life/fortune stones, avoid lists) are useful education, not a purchase green light. They miss nuance: planetary strength, combust status, dasha priority, health contraindications, and when Yagya beats wearing a stone. Pure Vedic Gems uses human expert review after your ₹101 booking.',
  },
];

/** Structured data only — not rendered as page copy (avoids keyword walls / cloaking FAQ spam). */
export function gemsRecInternalJsonLd(absoluteUrl: (path?: string) => string) {
  const url = absoluteUrl(GEMS_REC_PATH);
  const abstract = [
    ...GEMS_REC_SEO_BLOCKS.map((b) => `${b.title}. ${b.body}`),
    ...GEMS_REC_CLASSICAL.map((b) => `${b.title}. ${b.body}`),
    ...GEMS_REC_INTL.map((b) => `${b.region}. ${b.body}`),
  ].join(' ');

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: GEMS_REC_META.title,
      description: GEMS_REC_META.description,
      keywords: GEMS_REC_KEYWORDS.join(', '),
      inLanguage: ['en', 'hi'],
      isPartOf: { '@type': 'WebSite', name: 'Pure Vedic Gems', url: absoluteUrl('/') },
      about: [
        { '@type': 'Thing', name: 'Vedic gemstone recommendation' },
        { '@type': 'Thing', name: 'Kundli / birth chart remedies' },
        { '@type': 'Thing', name: 'Online Rudraksha recommendation' },
        { '@type': 'Thing', name: 'Yagya remedies' },
      ],
      audience: {
        '@type': 'Audience',
        audienceType:
          'India and international clients including USA, Canada, UK, Europe, UAE, Singapore, Australia, New Zealand, and NRIs',
      },
      abstract,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to get a Vedic remedies recommendation',
      description: 'Book an expert Kundli-based gemstone, Rudraksha, and Yagya recommendation online.',
      totalTime: 'P3D',
      step: GEMS_REC_PROCESS.map((item, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: item.title,
        text: item.body,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Navratna gemstones and planets',
      itemListElement: GEMS_REC_NAVRATNA.map((row, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${row.planet}: ${row.gem}`,
        description: `Primary: ${row.gem}. Common substitute: ${row.alternate}.`,
      })),
    },
  ];
}
