import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

export const metadata: Metadata = {
  title: 'Gemstone Care and Handling | PureVedicGems',
  description:
    'Legacy Pure Vedic Gems care guide covering cleaning, maintenance, handling precautions, and gemstone-specific care techniques.',
};

const CARE_IMAGE = 'https://www.purevedicgems.com/wp-content/uploads/2015/11/care.jpg';

const CARE_SECTIONS = [
  {
    title: 'Why Care Matters',
    paragraphs: [
      'The atomic composition of different gemstones causes them to vary in hardness, toughness, cleaving or splitting potential, as well as their reaction to heat, light, acids, and more. The challenge of proper care and maintenance of gems confronting a gemstone owner can thus be quite substantial.',
      'Similar to almost all other things, some gemstones are hardy and can absorb nearly any level of abuse or negligence without the slightest loss of beauty. Other gemstones are very sensitive even to the extent of losing their colour if exposed to sunlight for a few hours.',
      'It is not enough to delegate the care of your gems to your gemstone seller. You can, and should, accept the major responsibility of your gemstones. You do not need to be a professional gemmologist to care for them expertly. Despite the fact that gemstone care appears formidable, a few general rules will produce a maximum of beautiful results plus maximum safety.',
    ],
  },
  {
    title: 'Safe Cleaning Basics',
    paragraphs: [
      'So far as cleaning gems is concerned, most gems, not all of them, can be brought to their full brilliance simply by using a mild detergent in warm water and a soft brush. Most commercially prepared jewellery cleaners are safe, but you do need to be a bit careful with some which contain ammonia or chemicals capable of damaging sensitive gems such as pearl or amber.',
      'In absence of a total understanding of gemmology and which cleaning techniques are suitably compatible with which gems, you would be well advised to stick to the combination of a warm water-detergent solution and leave difficult cleaning jobs to a professional. Such a strategy will serve you satisfactorily 99% of the time.',
      'The real key to lifting a transparent faceted gemstone to its best brilliance level is the careful cleaning of the base portion of the gemstone below the stone\'s girdle, called the pavilion. Some gem materials are heat sensitive, some are not. Some materials react violently to chemicals, some do not. Some are weakened by inclusions, some are not.',
      'Warm water, a mild detergent, and a soft brush is the safest cleaning medium for almost all gems with the least danger of inflicting harm on gems with which you are not familiar.',
    ],
  },
  {
    title: 'Practical Cleaning Routine',
    paragraphs: [
      'Unfortunately, the pavilion is where most dirt accumulates and often the setting makes it the most difficult spot to get at. Be especially watchful around prongs. In cutting out the notches on the prongs, most gem setters do not polish the notches and any roughened metal is quick to gather dirt and debris.',
      'As for safe, acceptable cleaning procedure, first let the entire jewellery piece soak for a few moments in the solution, whether it is the warm water-detergent mix or a commercial preparation. Scrub gently with the brush. A very soft brush is quite useful. So, too, is a fine camel hair artist\'s brush; it is narrow and fits better through the setting and in-between prongs. A shaved matchstick or toothpick is quite good at picking out accumulations, but do not be too harsh. Patience pays off.',
      'When you are finished with the scrubbing, dip the jewellery piece back into the solution for one last wetting. Then rinse in warm running water, preferably about the same temperature as your solution. Radical temperature changes are dangerous and should be avoided. A good shake or blowing on the item, a hair drier can be used at home, will remove excess liquid. Then gently polish with a soft lint-free cloth or chamois leather.',
    ],
  },
  {
    title: 'Daily Wearing Precautions',
    paragraphs: [
      'Cleaning gemstone jewellery after it gets dirty is only part of proper care. Pre-use care is also important. Apply your perfumes, colognes, and hairsprays before you put on your gems. Not only will these chemicals reduce gem brilliance, they are highly destructive to pearls which react violently to acid and alcohol.',
      'For much of the same reason, try to wear your perfumes in areas where they will not come in contact with gems. In the case of pearls, try to keep the pearls out of contact with the skin whether you are wearing perfume or not; perspiration is inimical to pearls too. That is impossible in the case of a choker or bracelet, but the pearls should be wiped clean with a damp cloth immediately after wearing.',
      'In day-to-day use, take extra care with emeralds, opals, corals, and pearls, as they are softer than gemstones such as sapphires, rubies, and catseyes and can be chipped, scratched, broken, or abraded more easily.',
    ],
  },
  {
    title: 'Avoid Harsh Cleaning Methods',
    paragraphs: [
      'Do not go for extreme gemstone cleaning procedures such as ultrasonic cleaning, steam cleaning, or boiling gemstone jewellery. These harsh cleaning methods need extreme expertise and experience and should be done by professional jewellery cleaning experts only. Otherwise you might damage your expensive gemstones.',
      'Rapid temperature changes while steam cleaning or boiling, or extreme pressure while ultrasonic cleaning, can create structural havoc in even the strongest gemstones. Often the so-called flaws in a certain gemstone consist of an included crystal of an entirely different mineral. The two could have different heating coefficients, and a rapid jump or drop in the host gem\'s temperature could produce stresses that cause a split.',
      'A liquid inclusion is even more dangerous because it takes only a small heat increase to expand a liquid which produces critical pressures. Following are brief discussions on recommended care for some of the more sensitive gems. As mentioned before, virtually all gemstones will respond nicely to the careful application of warm water, detergent, and a soft brush.',
    ],
  },
] as const;

const CARE_ROWS = [
  ['Amethyst', 'Warm water-detergent-soft brush', 'Most amethyst is heat-treated to bring out best color, but it can crack as well as fade if exposed to high temperatures.'],
  ['Aquamarine', 'Warm water-detergent-soft brush', 'This blue beryl is also heat-treated to bring out its blue color. Heat can still cause color fading.'],
  ['Coral', 'Damp cloth & dry', 'Ammonia based cleaner. Warm water-(grease cutting) detergent-soft brush. Mechanical cleaning systems.'],
  ['Diamond', 'Ammonia based cleaner. Warm water-(grease cutting) detergent-soft brush. Mechanical cleaning systems.', 'Diamonds can take heat well, but mechanical systems could pose danger if stone is not examined well beforehand. Removing any grease the key to diamond brilliance.'],
  ['Emerald', 'Warm water-detergent-soft brush', 'Most emeralds are routinely bathed warm oil after fashioning to improve color and sometimes a dye is added. Mechanical systems could boil out the oil. Inclusions in emerald often weaken the stone, and mechanical systems have potential to cause breakage.'],
  ['Lapis', 'Warm water-detergent-soft brush', 'Material is porous, varies greatly, and is often dyed to improve color.'],
  ['Opal', 'Warm water-detergent-soft brush', 'Very sensitive to pressure and thermal shock (hot or cold) which causes crazing (surface cracking). Soft and fragile.'],
  ['Pearl', 'Wipe with damp, soft cloth. Stains should be removed with mild soapy solution on rag. Do not dip it into liquid. Dry thoroughly. Blow out drill holes carefully; moisture there often causes discoloration.', 'Special care is required to keep pearls looking their best.'],
  ['Peridot', 'Warm water-detergent-soft brush', 'One of the softer gem materials, it is attacked by acids (it etches) and heat may cause damage. Use carefully because peridot is soft and surface scratches diminish finish.'],
  ['Ruby', 'Warm water-detergent-soft brush', 'More and more rubies are being oiled and mechanical cleaning could remove this oil. High heat, though, could cause damage because of inclusions and other imbedded crystal materials.'],
  ['Sapphire', 'Warm water-detergent-soft brush', 'It is the same material (corundum) as ruby so the same treatment applies: oil may be added for color, and inclusions may weaken a normally tough structure.'],
  ['Tanzanite', 'Warm water-detergent-soft brush', 'Blue color is created by heat treatment, but tanzanite is fragile, relatively soft, and sensitive to heat and vibrations.'],
  ['Turquoise', 'Wipe with damp cloth; wipe dry immediately.', 'Turquoise is a porous material so avoid soap, detergents, and cleaning solutions. They tend to penetrate the material\'s pores, turning turquoise green and/or an unattractive off-color blue.'],
  ['Topaz', 'Warm water-detergent-soft brush', 'Easy cleavage makes mechanical cleaning relatively dangerous, both for vibrations or heating. The stone may have undue pressure points caused by setting prongs.'],
  ['Catseye', 'Warm water-detergent-soft brush', 'Mostly, specially the Chrysoberyl catseye, are being oiled and mechanical cleaning could remove this oil. High heat, though, could cause damage because of inclusions and other imbedded crystal materials.'],
  ['Hessonite', 'Warm water-detergent-soft brush', 'Easy cleavage makes mechanical cleaning relatively dangerous, both for vibrations or heating. The stone may have undue pressure points caused by setting prongs.'],
  ['Iolite', 'Warm water-detergent-soft brush', 'One of the softer gem materials, it is attacked by acids (it etches) and heat may cause damage. Use carefully because iolite is soft and surface scratches diminish finish.'],
  ['Moon-Stone', 'Warm water-detergent-soft brush', 'One of the softer gem materials, it is attacked by acids (it etches) and heat may cause damage. Use carefully because moonstone is soft and surface scratches diminish finish.'],
  ['Rose Quartz', 'Warm water-detergent-soft brush', 'Easy cleavage makes mechanical cleaning relatively dangerous, both for vibrations or heating. The stone may have undue pressure points caused by setting prongs.'],
] as const;

export default function GemsCarePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://purevedicgems.com';

  return (
    <>
      <section className="bg-secondary/30 py-10 md:py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <ScrollReveal>
            <h1 className="font-heading text-4xl font-bold leading-tight text-primary md:text-5xl lg:text-6xl">
              Cleaning, Care and Maintenance of Gemstones
            </h1>
            <OrnamentalDivider className="mx-auto mt-2 max-w-sm" />
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-background py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="space-y-6">
            <ScrollReveal>
              <div className="grid gap-5 rounded-sm border border-[#e8dcc8] bg-[#fffdf8] p-5 shadow-[0_2px_20px_rgba(61,43,31,0.08)] lg:grid-cols-[0.95fr_1.05fr] sm:p-6">
                <div className="overflow-hidden rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] p-3">
                  <div className="relative" style={{ aspectRatio: '4 / 3' }}>
                    <Image
                      src={CARE_IMAGE}
                      alt="Legacy gemstone care guide image"
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#c9a84c]">Legacy Care Guide</p>
                  <h2 className="mt-2 font-heading text-2xl font-black text-[#8b1a1a] sm:text-3xl">Core Handling Principles</h2>
                  <p className="mt-4 text-sm leading-7 text-[#5a4a3a]">
                    The atomic composition of different gemstones causes them to vary in hardness, toughness, cleaving or splitting potential, as well as their reaction to heat, light, acids, and more. Some gemstones are hardy enough to tolerate rougher handling, while others are sensitive enough to lose colour if exposed to sunlight even for a few hours.
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[#5a4a3a]">
                    This legacy Pure Vedic Gems guide keeps the same main message: gemstone owners should take direct responsibility for proper care, because a few sound rules can preserve beauty, brilliance, and safety for years.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {CARE_SECTIONS.map((section) => (
              <ScrollReveal key={section.title}>
                <div className="rounded-sm border border-[#e8dcc8] bg-[#fffdf8] p-5 shadow-[0_2px_20px_rgba(61,43,31,0.08)] sm:p-6">
                  <h2 className="font-heading text-2xl font-black text-[#8b1a1a] sm:text-3xl">{section.title}</h2>
                  <div className="mt-1 h-0.5 w-8 bg-[#8b1a1a]" />
                  <div className="mt-4 space-y-4 text-sm leading-7 text-[#5a4a3a]">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}

            <ScrollReveal>
              <div className="rounded-sm border border-[#e8dcc8] bg-[#fffdf8] p-5 shadow-[0_2px_20px_rgba(61,43,31,0.08)] sm:p-6">
                <h2 className="font-heading text-2xl font-black text-[#8b1a1a] sm:text-3xl">Gemstone-by-Gemstone Care Chart</h2>
                <div className="mt-1 h-0.5 w-8 bg-[#8b1a1a]" />
                <div className="mt-5 overflow-x-auto [&::-webkit-scrollbar]:h-0.75 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c9a84c]/60 [&::-webkit-scrollbar-track]:bg-[#fdf8ef]">
                  <table className="w-full border-collapse text-xs" style={{ minWidth: '980px' }}>
                    <thead>
                      <tr className="border-b border-[#e0d0b0] bg-[#fdf8ef]">
                        {['Gemstone', 'Cleaning Technique', 'Comment'].map((col) => (
                          <th key={col} className="border-r border-[#e0d0b0] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-[#9e8a70] last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CARE_ROWS.map(([gemstone, technique, comment]) => (
                        <tr key={gemstone} className="align-top border-b border-[#f0e7d8] last:border-b-0">
                          <td className="border-r border-[#e0d0b0] px-3 py-3 font-semibold text-[#3d2b1f]">{gemstone}</td>
                          <td className="border-r border-[#e0d0b0] px-3 py-3 leading-relaxed text-[#3d2b1f]">{technique}</td>
                          <td className="px-3 py-3 leading-relaxed text-[#3d2b1f]">{comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm leading-7 text-[#5a4a3a]">
                  NOTE: Done carefully, and with a reasonable amount of attention, your gems should retain their beauty for years.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-[#e8dcc8] bg-[#fdf8ef] px-5 py-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e8a70]">Related Reading</p>
                  <p className="mt-1 max-w-xl text-sm text-[#5a4a3a]">
                    Pair proper handling with treatment disclosure and authenticity checks before buying or resetting any important gemstone.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/knowledge/treatments"
                    className="inline-flex items-center gap-2 bg-[#6b1111] px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-[#8b1a1a]"
                  >
                    View Treatments &rarr;
                  </Link>
                  <Link
                    href="/knowledge/energized-gems"
                    className="inline-flex items-center gap-2 border border-[#e0d0b0] bg-white px-6 py-3 text-[11px] font-black uppercase tracking-widest text-[#8b1a1a] transition hover:border-[#8b1a1a]"
                  >
                    Energized Gems &rarr;
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
            '@type': 'Article',
            headline: 'Cleaning, Care and Maintenance of Gemstones',
            description:
              'Legacy Pure Vedic Gems guidance on gemstone cleaning, handling, and maintenance with gemstone-specific care notes.',
            url: `${siteUrl}/knowledge/gems-care`,
            image: [CARE_IMAGE],
          }),
        }}
      />
    </>
  );
}