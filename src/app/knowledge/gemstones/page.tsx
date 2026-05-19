import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import {
  getHomeManagedCategories,
  type HomeManagedCategory,
} from '@/components/home/PvgManagedCategorySections';

export const metadata: Metadata = {
  title: 'The Nine Vedic Gems - Navratnas | PureVedicGems',
  description:
    'A complete guide to the nine Vedic gems or Navratnas: Ruby, Pearl, Red Coral, Emerald, Yellow Sapphire, Diamond, Blue Sapphire, Hessonite, and Cat Eye.',
};

export const revalidate = 3600;

type NavratnaGuide = {
  slug: string;
  name: string;
  sanskrit: string;
  planet: string;
  sign: string;
  metal: string;
  finger: string;
  dayTime: string;
  mantra: string;
  substitutes: string;
  inimical: string;
  colors: string;
  ray: string;
  shopHref: string;
  fallbackImage: string;
  overview: string;
  traditionalUse: string[];
  qualityChecks: string[];
  sources: string;
};

const NAVRATNAS: NavratnaGuide[] = [
  {
    slug: 'ruby',
    name: 'Ruby',
    sanskrit: 'Manik',
    planet: 'Sun (Surya)',
    sign: 'Leo (Simha)',
    metal: 'Gold or copper',
    finger: 'Ring finger',
    dayTime: 'Sunday within 1 hour after sunrise',
    mantra: 'Om Hring Hamsah Suryaye Namah Om',
    substitutes: 'Red Spinel, Red Garnet, Red Tourmaline, Star Ruby, Rhodolite',
    inimical: 'Diamond, Hessonite, Blue Sapphire',
    colors: 'Orange, saffron, light red, yellow',
    ray: 'Red cosmic rays',
    shopHref: '/shop/navaratna/ruby',
    fallbackImage: '/home/navratnaimg/stone1.webp',
    overview:
      'Ruby, known as Manik in India, is traditionally connected with the Sun. Classical Vedic gem therapy associates it with vitality, authority, self-confidence, name, reputation, warmth, and leadership presence.',
    traditionalUse: [
      'Considered when a qualified astrologer recommends strengthening Surya-related themes such as confidence, fatherly support, recognition, public standing, or executive command.',
      'In traditional color-ray language, Ruby is linked with heat and fire, so it is treated as a powerful gem that should not be self-prescribed casually.',
      'Historically valued as a gemstone of love, passion, courage, and royal dignity.',
    ],
    qualityChecks: [
      'Look for a lively red to pinkish-red body color with good transparency.',
      'Confirm natural origin, treatment disclosure, certificate details, and whether the stone is heated or unheated.',
      'Avoid dull, glass-filled, highly fractured, or unusually cheap stones sold without proper documentation.',
    ],
    sources: 'Important historical sources include Burma, Thailand, Sri Lanka, Afghanistan, Tanzania, and South India.',
  },
  {
    slug: 'pearl',
    name: 'Pearl',
    sanskrit: 'Moti',
    planet: 'Moon (Chandra)',
    sign: 'Cancer (Karka)',
    metal: 'Silver',
    finger: 'Ring or little finger',
    dayTime: 'Monday within 1 hour after sunset',
    mantra: 'Om Som Samay Namah Om',
    substitutes: 'Moonstone, White Coral',
    inimical: 'Hessonite',
    colors: 'Silver, white, orange, yellow',
    ray: 'Orange cosmic rays',
    shopHref: '/shop/navaratna/pearl',
    fallbackImage: '/home/navratnaimg/stone2.webp',
    overview:
      'Pearl, called Moti, is associated with the Moon. Vedic tradition connects it with emotional steadiness, calmness, motherly support, sleep rhythm, sensitivity, and mental peace.',
    traditionalUse: [
      'Recommended in tradition for Chandra-related balance when the chart supports Moon strengthening.',
      'Often selected for people who need cooling, gentler, emotionally stabilizing gemstone support.',
      'Pearls may be natural or cultured; most modern pearls available in the market are cultured pearls.',
    ],
    qualityChecks: [
      'Check surface smoothness, luster, nacre quality, shape, matching, origin, and whether color is natural or treated.',
      'Be careful with dark gray, intense bronze, bluish, violet, or nearly black Akoya pearls unless dye disclosure is clear.',
      'For astrological use, discuss whether a natural pearl, cultured pearl, or substitute is appropriate for your budget and chart.',
    ],
    sources: 'Traditional pearl sources include the Gulf of Mannar, Persian Gulf, Bay of Bengal, South Indian fisheries, Venezuela, Mexico, and Australia.',
  },
  {
    slug: 'red-coral',
    name: 'Red Coral',
    sanskrit: 'Moonga',
    planet: 'Mars (Mangal)',
    sign: 'Aries (Mesha) and Scorpio (Vrischika)',
    metal: 'Gold or copper',
    finger: 'Ring finger',
    dayTime: 'Tuesday within 1 hour after sunrise',
    mantra: 'Om Bhaum Bhaumaye Namah Om',
    substitutes: 'Bloodstone, Carnelian, Red Onyx, Red Agate, Red Jasper',
    inimical: 'Diamond, Blue Sapphire, Emerald, Hessonite',
    colors: 'Red shades, copper, yellow',
    ray: 'Yellow cosmic rays',
    shopHref: '/shop/navaratna/red-coral',
    fallbackImage: '/home/navratnaimg/stone7.webp',
    overview:
      'Red Coral, known as Moonga, is the Navratna for Mars. It is traditionally associated with courage, stamina, discipline, decisiveness, ambition, and physical drive.',
    traditionalUse: [
      'Used when Mangal support is recommended for confidence, initiative, stamina, protection, and decisive action.',
      'Because Mars is considered forceful, coral selection is usually handled carefully after chart review.',
      'Coral is an organic gem material, so durability, polish, and treatment disclosure matter strongly.',
    ],
    qualityChecks: [
      'Prefer even red to reddish-orange color, smooth surface, strong polish, and natural coral disclosure.',
      'Avoid dyed, cracked, porous, or composite coral sold as natural premium material.',
      'Ask whether the coral is Japanese, Italian, or another origin, and whether the color is natural.',
    ],
    sources: 'Corals are known from the Mediterranean, Red Sea, Persian Gulf, Japan, India, Australia, and parts of the Indian Ocean.',
  },
  {
    slug: 'emerald',
    name: 'Emerald',
    sanskrit: 'Panna',
    planet: 'Mercury (Budh)',
    sign: 'Gemini (Mithuna) and Virgo (Kanya)',
    metal: 'Gold or silver',
    finger: 'Little finger',
    dayTime: 'Wednesday within 2 hours after sunrise',
    mantra: 'Om Bhum Bhudhaye Namah Om',
    substitutes: 'Green Tourmaline, Peridot, Jade, Onyx',
    inimical: 'None commonly listed',
    colors: 'Green shades, yellow',
    ray: 'Green cosmic rays',
    shopHref: '/shop/navaratna/emerald',
    fallbackImage: '/home/navratnaimg/stone4.webp',
    overview:
      'Emerald, called Panna, is the gemstone of Mercury. It is traditionally connected with intelligence, memory, communication, speech, learning, trade, analysis, humor, and diplomacy.',
    traditionalUse: [
      'Chosen when Budh support is advised for communication, business, writing, studies, calculation, or nervous clarity.',
      'Emeralds naturally carry inclusions; a completely clean emerald is either very expensive or should be checked carefully.',
      'Oiling is common in emeralds, so transparent disclosure is more important than unrealistic promises of perfection.',
    ],
    qualityChecks: [
      'Look for rich green color, pleasing transparency, acceptable natural inclusions, and clear oil/treatment disclosure.',
      'Avoid heavily filled stones, surface-reaching fractures hidden with colored oil, or stones without a reliable certificate.',
      'Check origin claims such as Colombia, Zambia, Brazil, Afghanistan, Pakistan, or India with proper documentation when price depends on origin.',
    ],
    sources: 'Important emerald sources include Colombia, Zambia, Brazil, Afghanistan, Pakistan, India, Egypt, and parts of Africa.',
  },
  {
    slug: 'yellow-sapphire',
    name: 'Yellow Sapphire',
    sanskrit: 'Pukhraj',
    planet: 'Jupiter (Guru)',
    sign: 'Sagittarius (Dhanu) and Pisces (Meena)',
    metal: 'Gold',
    finger: 'Index finger',
    dayTime: 'Thursday within 1 hour after sunrise and before sunset',
    mantra: 'Om Graang Greeng Groung Sah Gurvae Namah',
    substitutes: 'Yellow Topaz, Yellow Citrine, Yellow Zircon',
    inimical: 'Hessonite, Blue Sapphire, Diamond',
    colors: 'Yellow shades, golden, red, orange, light blue',
    ray: 'Blue cosmic rays',
    shopHref: '/shop/navaratna/yellow-sapphire',
    fallbackImage: '/home/navratnaimg/stone5.webp',
    overview:
      'Yellow Sapphire, known as Pukhraj, is connected with Jupiter. Vedic tradition associates it with wisdom, prosperity, dharma, education, marriage guidance, counsel, faith, and protection from adversity.',
    traditionalUse: [
      'Commonly considered when Guru support is recommended for wealth stability, education, marriage, reputation, and spiritual direction.',
      'It is among the most popular Jyotish gemstones, so certification and treatment disclosure are especially important.',
      'The best choice is not simply the largest yellow stone; suitability, naturalness, brightness, and clarity must align.',
    ],
    qualityChecks: [
      'Seek bright yellow color, good transparency, lively brilliance, and a reputable lab report.',
      'Check heat treatment, beryllium diffusion risk, origin claims, and whether the stone is natural corundum.',
      'Avoid glass-filled, diffused, synthetic, or over-dark stones marketed as premium Pukhraj.',
    ],
    sources: 'Yellow sapphires are found in Sri Lanka, Burma, Thailand, Australia, Brazil, Zimbabwe, and parts of India.',
  },
  {
    slug: 'diamond',
    name: 'Diamond',
    sanskrit: 'Heera',
    planet: 'Venus (Shukra)',
    sign: 'Taurus (Vrisha) and Libra (Tula)',
    metal: 'Gold, silver, or platinum',
    finger: 'Middle or ring finger',
    dayTime: 'Friday within 1 hour after sunrise',
    mantra: 'Om Shum Shukrae Namah Om',
    substitutes: 'White Sapphire, White Topaz, Natural Zircon, Australian Fiery Opal',
    inimical: 'Ruby, Red Coral, Yellow Sapphire',
    colors: 'Indigo, cream, blue, black',
    ray: 'Indigo cosmic rays',
    shopHref: '/shop/navaratna/diamond',
    fallbackImage: '/home/navratnaimg/stone6.webp',
    overview:
      'Diamond, called Heera, is associated with Venus. Classical traditions connect it with refinement, beauty, comfort, luxury, relationship themes, artistic taste, and material grace.',
    traditionalUse: [
      'Selected only when Shukra support is suitable in the horoscope and the wearer can maintain a clean, durable setting.',
      'For jewellery, diamond quality is judged through cut, color, clarity, carat, fluorescence, and certification.',
      'For Jyotish use, natural origin and suitability matter more than fashion value alone.',
    ],
    qualityChecks: [
      'Ask for reliable certification and clear disclosure of natural, lab-grown, treated, HPHT, or laser-drilled status.',
      'Review the 4Cs, fluorescence, inclusion position, and whether the stone is eye-clean.',
      'Avoid diamonds with undisclosed treatment or pricing that ignores clarity grade after lasering or filling.',
    ],
    sources: 'Major diamond sources and trade centers include India, Brazil, Africa, Russia, and Australia.',
  },
  {
    slug: 'blue-sapphire',
    name: 'Blue Sapphire',
    sanskrit: 'Neelam',
    planet: 'Saturn (Shani)',
    sign: 'Capricorn (Makar) and Aquarius (Kumbha)',
    metal: 'Gold, silver, or iron',
    finger: 'Middle finger',
    dayTime: 'Saturday within 1 hour after sunrise or 2.5 hours before sunset',
    mantra: 'Om Sham Shanaishcharaye Namah Om',
    substitutes: 'Amethyst, Iolite, Kyanite, Blue Spinel, Blue Topaz',
    inimical: 'Ruby, Red Coral, Yellow Sapphire, Pearl',
    colors: 'Violet, black, navy blue, turquoise, grey',
    ray: 'Violet cosmic rays',
    shopHref: '/shop/navaratna/blue-sapphire',
    fallbackImage: '/home/navratnaimg/stone3.webp',
    overview:
      'Blue Sapphire, known as Neelam, is the gemstone of Saturn. It is considered one of the strongest Navratnas and is traditionally linked with discipline, endurance, karma, career stability, and long-term responsibility.',
    traditionalUse: [
      'Usually recommended only after careful chart analysis because Saturn remedies are traditionally treated with caution.',
      'Many practitioners advise a trial or close observation period before committing to continuous wearing.',
      'If suitable, tradition describes Neelam as a fast-acting support for stability, discipline, and material progress.',
    ],
    qualityChecks: [
      'Look for velvety blue color, transparency, strong brilliance, and no serious surface-reaching damage.',
      'Confirm whether the sapphire is heated, unheated, diffused, fracture-filled, or synthetic.',
      'Premium origin claims such as Kashmir, Burma, or Ceylon require strong lab documentation.',
    ],
    sources: 'Blue sapphires are found in Kashmir, Sri Lanka, Burma, Thailand, Cambodia, Australia, the USA, and Africa.',
  },
  {
    slug: 'hessonite',
    name: 'Hessonite',
    sanskrit: 'Gomed',
    planet: 'Rahu',
    sign: 'No single zodiac ownership',
    metal: 'Silver or gold',
    finger: 'Middle or little finger',
    dayTime: 'Saturday afternoon or midnight as advised',
    mantra: 'Om Ram Rahuve Namah',
    substitutes: 'Orange Zircon, Orange Garnet',
    inimical: 'Ruby, Pearl, Coral',
    colors: 'Black, dark brown, dark green',
    ray: 'Ultraviolet cosmic rays',
    shopHref: '/shop/navaratna/hessonite',
    fallbackImage: '/home/navratnaimg/stone8.webp',
    overview:
      'Hessonite, called Gomed, is associated with Rahu, the north lunar node. Vedic tradition links it with focus during uncertainty, ambition, public life, sudden rise, obsessive patterns, and unusual delays.',
    traditionalUse: [
      'Considered when Rahu-related patterns need structured remedial attention after consultation.',
      'Because Rahu is a shadow planet, suitability is highly individual and should not be copied from generic lists.',
      'Traditionally valued for helping channel restless or scattered energy into clearer direction when suitable.',
    ],
    qualityChecks: [
      'Look for honey, cinnamon, or reddish-brown color with life and transparency.',
      'Verify that it is natural hessonite garnet, not glass or a look-alike.',
      'Avoid overly dark, lifeless, cracked, or heavily included stones when buying for astrological use.',
    ],
    sources: 'Hessonite is known from India, Sri Lanka, Burma, and parts of Africa.',
  },
  {
    slug: 'cats-eye',
    name: "Cat's Eye",
    sanskrit: 'Lehsuniya',
    planet: 'Ketu',
    sign: 'No single zodiac ownership',
    metal: 'Silver or gold',
    finger: 'Middle or ring finger',
    dayTime: 'Saturday noon, midnight, or Tuesday evening as advised',
    mantra: 'Om Kem Ketuve Namah Om',
    substitutes: "Tiger's Eye, Apatite",
    inimical: 'None commonly listed',
    colors: 'Multi-colored, black, smoky grey',
    ray: 'Infrared cosmic rays',
    shopHref: '/shop/navaratna/cats-eye',
    fallbackImage: '/home/navratnaimg/stone9.webp',
    overview:
      "Cat's Eye, known as Lehsuniya, is associated with Ketu, the south lunar node. It is traditionally connected with intuition, detachment, spiritual insight, sudden shifts, hidden obstacles, and protection practices.",
    traditionalUse: [
      'Chosen only after consultation because Ketu remedies can feel intense and highly personal.',
      'Many traditional practitioners advise a short observation period before final wearing.',
      'The stone is valued for its chatoyant band, which should appear sharp and centered like a moving eye of light.',
    ],
    qualityChecks: [
      'Look for a strong, centered, continuous eye, good polish, and balanced body color.',
      'Check whether the gem is chrysoberyl cat eye or a weaker substitute sold under a similar name.',
      'Avoid stones with broken bands, weak chatoyancy, deep cracks, or unclear identity reports.',
    ],
    sources: "Cat's Eye is found in India, Sri Lanka, Burma, Brazil, Madagascar, China, America, and Rhodesia.",
  },
];

function getManagedImage(categories: HomeManagedCategory[], guide: NavratnaGuide) {
  const category = categories.find((item) => item.slug === guide.slug);
  return category?.image_url ?? guide.fallbackImage;
}

export default async function NavratnasKnowledgePage() {
  const managedCategories = await getHomeManagedCategories();
  const navratnaCategories = managedCategories.navaratna;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <>
      {/* ── Hero + Intro ── */}
      <section className="bg-secondary/30 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h1 className="font-heading text-4xl font-bold leading-tight text-primary md:text-5xl lg:text-6xl">
              Navratnas
            </h1>
            <OrnamentalDivider className="mx-auto mt-2 max-w-sm" />
            <p className="mt-6 text-left text-sm leading-7 text-[#5a4a3a]">
              Planetary imbalances impact us on all the levels of our lives. Afflicted planets can lead to poor health, bad relationships, failed careers and various other obstacles in life. A trained Vedic Astrologer can often pinpoint these imbalances with an uncanny accuracy or at least unfold for us their main factors and trends of development so that we can be forewarned and prepared in advance to deal with them. Such imbalances are the product of disharmonies between the cosmic rays that come to us from the planets. When a planet in the birth chart is afflicted its ray is improperly received or distorted. Just as a plant suffers from lack of proper sunlight, so the human body and mind suffer from lack of appropriate cosmic rays through the planets. Each planet has its influences that can be helpful or harmful to our various concerns in life. According to Ancient Indian Sacred Sanskrit Vedic texts (like the &ldquo;Garuda Purana&rdquo;, the &ldquo;Graha-Gochara Jyautisha&rdquo;, the &ldquo;Ratnapariksa&rdquo;, the &ldquo;Brhat Samhita&rdquo;, the &ldquo;Agni Purana&rdquo; and &ldquo;Mani-Mala&rdquo;) one of the main methods to effectively counter planetary imbalances is the use of Vedic gems. Certain gems &mdash; the nine main Vedic gems or Navratnas &mdash; have been prescribed for each planet along with their manner and timing of wearing. The gems are connected to the cosmic ray transmitted by the planet and aid us in its proper reception through our Aura and astral field to restore the integrity and vitality of our energy flow.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="bg-background py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="space-y-8">

            {/* ── Each Gem ── */}
            {NAVRATNAS.map((guide) => (
              <ScrollReveal key={guide.slug}>
                <article
                  id={guide.slug}
                  className="scroll-mt-32 overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fffdf8] shadow-[0_2px_20px_rgba(61,43,31,0.08)]"
                >
                  <div className="p-6 sm:p-8">
                    {/* Planet + Name + Image */}
                    <div className="grid gap-6 sm:grid-cols-[1fr_200px] sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h2 className="font-heading text-3xl font-black leading-tight text-[#8b1a1a] sm:text-5xl">
                            {guide.name}
                          </h2>
                          <span className="text-lg font-normal text-[#5a4a3a] sm:text-2xl">({guide.sanskrit})</span>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-[#5a4a3a]">{guide.overview}</p>
                      </div>
                      <div className="order-first sm:order-last">
                        <div className="relative overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef]" style={{ aspectRatio: '1 / 1' }}>
                          <Image
                            src={getManagedImage(navratnaCategories, guide)}
                            alt={guide.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 90vw, 200px"
                          />
                        </div>
                      </div>
                    </div>

                    {/* At a glance table */}
                    <div className="mt-7 overflow-hidden rounded-sm border border-[#e0d0b0]">
                      <div className="overflow-x-auto [&::-webkit-scrollbar]:h-0.75 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c9a84c]/60 [&::-webkit-scrollbar-track]:bg-[#fdf8ef]">
                        <table className="w-full min-w-180 border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#e0d0b0] bg-[#fdf8ef]">
                              {['Planet', 'Sign', 'Metal', 'Finger', 'Day / Time', 'Inimical Gems', 'Vedic Mantra', 'Substitute Gems', 'Favorable Colors'].map((col) => (
                                <th key={col} className="border-r border-[#e0d0b0] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-[#9e8a70] last:border-r-0">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="align-top">
                              {[guide.planet, guide.sign, guide.metal, guide.finger, guide.dayTime, guide.inimical, guide.mantra, guide.substitutes, guide.colors].map((val, i) => (
                                <td key={i} className="border-r border-[#e0d0b0] px-3 py-3 leading-relaxed text-[#3d2b1f] last:border-r-0">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Traditional use + quality checks */}
                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <div>
                        <h3 className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#8b1a1a]">Traditional Use</h3>
                        <div className="h-0.5 w-8 bg-[#8b1a1a]" />
                        <ul className="mt-4 space-y-3">
                          {guide.traditionalUse.map((point) => (
                            <li key={point} className="flex items-start gap-2.5 text-sm leading-7 text-[#5a4a3a]">
                              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b1a1a]" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#c9a84c]">Quality Checks</h3>
                        <div className="h-0.5 w-8 bg-[#c9a84c]" />
                        <ul className="mt-4 space-y-3">
                          {guide.qualityChecks.map((point) => (
                            <li key={point} className="flex items-start gap-3 text-sm leading-7 text-[#5a4a3a]">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#c9a84c] text-[10px] font-black text-[#c9a84c]">
                                ✓
                              </span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Bottom bar: sources + CTA */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e8dcc8] bg-[#fdf8ef] px-6 py-4 sm:px-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e8a70]">Known Sources</p>
                      <p className="mt-0.5 max-w-xl text-sm text-[#5a4a3a]">{guide.sources}</p>
                    </div>
                    <Link
                      href={guide.shopHref}
                      className="inline-flex shrink-0 items-center gap-2 bg-[#6b1111] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-[#8b1a1a]"
                    >
                      View {guide.name} Collection &rarr;
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}

            {/* How to wear */}
            <ScrollReveal>
              <div className="rounded-sm border border-border bg-card p-6 shadow-sm">
                <h2 className="font-heading text-xl font-semibold text-primary">
                  How Navratnas Are Worn
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    After a horoscope is studied by an experienced Vedic astrologer, the benefic gem or gems should be purchased only from a genuine and reliable source. The appropriate metal, finger, day, time, and mantra must be considered together. The ring or pendant should be made so the bottom of the gemstone is open and can touch the body, allowing the traditional ray-transmission principle to be followed.
                  </p>
                  <p>
                    Traditional practice asks the wearer to bathe, wear clean clothes, purify the ring or pendant in unboiled cow milk or holy Ganga water, and then energize the gemstone by chanting the appropriate Vedic mantra at least 108 times. The gem is then worn at the recommended time, usually calculated around sunrise or sunset for the wearer&apos;s location.
                  </p>
                  <p>
                    Inimical gemstones are stones traditionally advised not to be worn together with the main gem unless a learned astrologer gives a special exception. For Jyotish use, natural origin, eye-clean appearance, appropriate cutting, even color tone, lively luster, reliable certification, and transparent treatment disclosure are more important than buying a larger stone at the cheapest price.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* CTA */}
            <ScrollReveal>
              <div className="rounded-sm border-l-4 border-accent bg-secondary/30 p-6">
                <h2 className="font-heading text-lg font-semibold text-primary">
                  Need Help Choosing a Navratna?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Share your birth details, concern, budget, and preferred setting with our team. Our experts can help you review suitability, shortlist certified stones, and avoid unsuitable or treated gemstones for Jyotish use.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/consultation"
                    className="rounded-sm bg-accent px-5 py-3 text-xs font-bold uppercase tracking-[2px] text-accent-foreground"
                  >
                    Book Consultation
                  </Link>
                  <Link
                    href="/knowledge/treatments"
                    className="rounded-sm border border-border bg-card px-5 py-3 text-xs font-bold uppercase tracking-[2px] text-primary"
                  >
                    Read Treatment Guide
                  </Link>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'The Nine Vedic Gems - Navratnas',
            description: 'A complete guide to Navratna gemstones and their Vedic planetary associations.',
            url: `${siteUrl}/knowledge/gemstones`,
            hasPart: NAVRATNAS.map((guide) => ({
              '@type': 'Article',
              headline: `${guide.name} (${guide.sanskrit})`,
              about: guide.planet,
              url: `${siteUrl}/knowledge/gemstones#${guide.slug}`,
            })),
          }),
        }}
      />
    </>
  );
}