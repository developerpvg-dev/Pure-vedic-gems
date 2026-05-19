import type { Metadata } from 'next';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { ZoomableAstrologyImage } from '@/components/knowledge/ZoomableAstrologyImage';

export const metadata: Metadata = {
  title: 'About Vedic Astrology | Jyotisha & Navagraha | PureVedicGems',
  description:
    'A comprehensive guide to Vedic Astrology (Jyotisha), karma, the Navagrahas, and the role of planetary gemstones in Vedic remedies.',
};

export const revalidate = false;

const PLANET_GEMS = [
  { planet: 'Sun (Surya)', gem: 'Ruby (Manikya)', color: '#c0392b' },
  { planet: 'Moon (Chandra)', gem: 'Pearl (Moti)', color: '#7f8c8d' },
  { planet: 'Mars (Mangala)', gem: 'Red Coral (Moonga)', color: '#e74c3c' },
  { planet: 'Mercury (Budha)', gem: 'Emerald (Panna)', color: '#27ae60' },
  { planet: 'Jupiter (Guru)', gem: 'Yellow Sapphire (Pukhraj)', color: '#f39c12' },
  { planet: 'Venus (Shukra)', gem: 'Diamond (Heera)', color: '#8e44ad' },
  { planet: 'Saturn (Shani)', gem: 'Blue Sapphire (Neelam)', color: '#2980b9' },
  { planet: 'Rahu (Asc. Node)', gem: 'Hessonite Garnet (Gomed)', color: '#d35400' },
  { planet: 'Ketu (Desc. Node)', gem: "Chrysoberyl Cat's Eye", color: '#16a085' },
] as const;

export default function AboutVedicAstrologyPage() {
  return (
    <>
      <section className="bg-secondary/30 py-12 md:py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <ScrollReveal>
            <h1 className="font-heading text-3xl font-bold text-primary md:text-4xl lg:text-5xl">
              About Vedic Astrology
            </h1>
            <p className="mx-auto mt-4 max-w-5xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Human Destiny is mysterious. Everyone suffers from certain miseries, sometimes in life. A
              very rich man enjoying all the luxuries of life may be unhappy due to marital-discord, lack
              of progeny or any other personal matter. On the other hand a middle class man blessed with
              all the domestic happiness may feel strangulated in material affairs. There are a very few
              who are fully satisfied or blessed in every aspect. And why is it so that for some, to
              achieve certain things in life they have to involve, as compared to others, very less
              efforts where as for some, to achieve certain things they have to really work very hard.
              There is definitely some kind of invisible cosmic force that helps and obstructs us in
              various ways in our day to day lives.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-background pt-4 pb-16 md:pt-6 md:pb-20">
        <div className="mx-auto max-w-screen-2xl px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="space-y-12 md:space-y-14">
            <ScrollReveal>
              <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-primary md:text-2xl">
                    Jyotish Counterparts
                  </h2>
                  <div className="mt-4 space-y-5 text-[15px] leading-8 text-muted-foreground md:text-base">
                    <p>
                      Among the various ancient sacred texts available to mankind from thousands of years
                      "THE VEDAS" are considered to be the oldest and the greatest wealth of information
                      about this cosmic force that controls all living creatures on this Earth. "Vedas"
                      are ancient Indian repositories of knowledge and the inheritance of Great Indian
                      Sages and culture. There are four Vedas namely, Rig Veda, Yajur Veda, Atharva Veda
                      and Sam Veda and of these the former three contain about 250 shlokas or treatise on
                      the great Indian Divine Science dealing with the influences of planets and stars on
                      Human affairs. The VEDAS are considered to be the words of GOD. The ancient Hindu
                      "Rishis", a Sanskrit word meaning "Seers" or high priests of the Vedic knowledge
                      understood the connection between the celestial bodies of our solar system and the
                      human body. The motion of the planets and their positions in relation to each other,
                      acts upon us throughout our lifetime, just as the lunar phases push and pull the
                      oceans and the seas.
                    </p>
                    <p>
                      This system has been made by the ALMIGHTY to control us, just like parents try to
                      keep a control on their kids by punishing and/or rewarding them according to their
                      deeds. In the same way we are also punished or rewarded by these planets according to
                      the Karmas we perform. KARMA is the action of the past and partly action of the
                      present taken by one's free will. GOD has given us power of reasoning and wisdom of
                      understanding and to judge the nature of our Karma. Whatever we commit is completely
                      based on our discretion. We all reap the good and the bad effects of the karmas that
                      are performed by us here on Earth (Bhu Loka) &amp; since the entire creation as we know
                      is bound singly by the law of karma and nothing can, has and ever will supersede this
                      most powerful law made by God.
                    </p>
                    <p>
                      Sri Vishnu, being the preserver of all the life on earth, has himself incarnated as
                      9 grahas (Planets) also known as Nava Grahas, each graham having different energies
                      and effects acting upon different aspects of our lives , solely to bring forward the
                      karmas of man, good or bad in the form of joys and sorrows. Every action performed
                      by each one of us, is recorded instantly and sent into a supreme database, which
                      knows exactly when the fruits of the particular karma must be reaped. The Sacred
                      Vedas also teach us a system to mathematically calculate the movements and
                      combinations of these planets from the date of birth, to know the future ups and
                      downs in a person's life, which is called Vedic Astrology.
                    </p>
                  </div>
                </div>

                <ZoomableAstrologyImage
                  src="/astrology/planets-brain-centers.jpg"
                  alt="Planets and their corresponding brain centres — Vedic Astrology infographic"
                  width={680}
                  height={1020}
                  caption="A visual reference for planetary correspondences and the human system in Vedic thought."
                  sizes="(min-width: 1280px) 430px, (min-width: 768px) 42vw, 100vw"
                  className="xl:w-100 xl:shrink-0"
                  priority
                />
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-primary md:text-2xl">
                    The Karmic Life Map
                  </h2>
                  <div className="mt-4 space-y-5 text-[15px] leading-8 text-muted-foreground md:text-base">
                    <p>
                      The karmic life of an individual starts as soon as he/she takes birth, and destiny
                      or fate or sometimes referred to as karmic life map starts playing its role. All the
                      milestones like good times &amp; bad times, luxury phases and poverty, moments of
                      happiness and despair, supreme strength and weaknesses, periods of power/respect as
                      well as humiliation, focused mind and anxiety, perfect health and diseases,
                      experience of love as well as failure in relationships, etc. during one's lifetime
                      are concluded as karmic life map. This life map is the result of the karmas
                      performed by that soul in its previous birth.
                    </p>
                    <p>
                      Whatever Karma's we had performed in our previous birth Results in the family or
                      health and other circumstances we are born with, in this world. Like we say when a
                      child is born in a wealthy family, he's born with a silver spoon. But with the
                      karmas of our present life we further improve or worsen this karmic life map of
                      our's. Like if we do good karmas we would get a good life partner, good business
                      partners, servants,employer, staff and later on good children etc. And we become
                      wealthier and happier in our lives but the opposite happens if we perform negative
                      Karmas. This proves why a person born in a poor family becomes rich, successful and
                      happier in his later life and why a person born in a wealthy family becomes poor,
                      sick and gets a life full of miseries and ill fate.
                    </p>
                  </div>
                </div>

                <ZoomableAstrologyImage
                  src="/astrology/karma-planetary-evolution.jpg"
                  alt="Cycle of Planetary Evolution in Families — Based on Karma Theory"
                  width={820}
                  height={620}
                  caption="A visual model of karma, lineage, planetary influence, and inherited life patterns."
                  sizes="(min-width: 1280px) 540px, (min-width: 768px) 48vw, 100vw"
                  className="xl:w-130 xl:shrink-0"
                  imageClassName="min-h-[260px] object-contain sm:min-h-[320px]"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary md:text-2xl">
                  Jyotisa: The Eyes of the Veda
                </h2>
                <div className="mt-4 space-y-5 text-[15px] leading-8 text-muted-foreground md:text-base">
                  <p>
                    The divine science that VEDAS teach us to foresee our Karmic life map also teaches us
                    certain remedial measures to combat the negative factors of this karmic life map. This
                    divine science, called Vedic Astrology and also more popularly known as Jyotisa is
                    held in highest esteem amongst the cultural treasures of India and is also regarded as
                    the eyes of the VEDA. Jyotisa is a science with sound rules and parameters based on
                    perfect logic, uses mathematics and astronomy to accurately pinpoint the exact
                    location of the heavenly bodies to be considered at the times of birth. This system
                    was first taught by Lord Shiva to Brahma, the creator who then taught this to 18 other
                    Rishis (celestial Sages) and ever since then, this knowledge has flowed down from
                    generation to generation.
                  </p>
                  <p>
                    Permutations, combinations, different sets of calculations and planetary relationships
                    formed with each other also known as Yogas are the core elements of Vedic Astrology
                    which are different for each person born on Earth, just like thumb fingerprints which
                    are not even the same for twins.
                  </p>
                  <p>
                    Today some other forms of astrology are also practised around the world namely-
                    Western Astrology, Chinese Astrology, Herbrew Astrology, Tajik Astrology and Indian
                    Astrology. Among all these the Indian Astrology is the current version of the ancient
                    Vedic Astrology. This Indian Astrology has influences of the Western and Muslim
                    (Tajik) astrology on it. It has grown in the past 15 years with the availability of
                    Texts in various languages and the use of computers to do the complex mathematical
                    calculations. Indian astrology is a summation of Vedic Astrology in addition to global
                    inputs that have come due to interactions of various cultures.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary md:text-2xl">
                  Remedial Measures According to the Vedas
                </h2>
                <div className="mt-4 space-y-5 text-[15px] leading-8 text-muted-foreground md:text-base">
                  <p>
                    According to the Vedas the several ways to improve our planetary karmic life map
                    include meditation (chanting of Vedic mantras), Yoga (physical postures), Ayurvedic
                    aushadha (natural medication), Colour Therapy, Donation, yagyas (form of Vedic
                    planetary prayers) and Ratnas (wearing of Vedic Planetray Gemstones and talismans). In
                    addition, one should regularly pray to the Almighty. He should be content, humane,
                    helping the poor and needy, kind, generous and benevolent. Avoidance of anger, pride,
                    greed, cheating, envy and deep involvement in sensual pleasures further act as
                    adjuvant. These ways have been tried and tested for thousands of years and found to be
                    very effective.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div>
                <h2 className="font-heading text-xl font-semibold text-primary md:text-2xl">
                  Planetary Gemstones in Vedic Astrology
                </h2>
                <div className="mt-4 space-y-5 text-[15px] leading-8 text-muted-foreground md:text-base">
                  <p>
                    In Vedic Astrology the nine planets that control our lives are SUN, MOON, MARS,
                    MERCURY, JUPITER, VENUS AND SATURN (known as the visible planets) along with two
                    lunar nodes, RAHU (ascending lunar node) and KETU (descending lunar node). These
                    nodes are the two intersecting points of the solar and the lunar planes as seen from
                    the Earth.
                  </p>
                  <p>
                    Ratnas or Gems, nature's colourful gift, absorb the cosmic rays and energies of
                    planets and produce their eternal effect on us. This cosmic effect of Gems has been
                    referred to in the Vedas. From the Vedic era therapeutic application of gems has also
                    been understood. Indian Sages used them in four forms namely churna (powder), Brahma
                    (Calcined), Rasayana (Chemical), Dharna (wearing on body). Here we are only discussing
                    their usage in the modern context and mainly concerned with Dharna of gem stone to
                    ward off or mitigate negative influence of destiny and to potentiate benefic influences
                    of the planets. Associated with the SUN is the RUBY, with the MOON is the PEARL, with
                    MARS is the RED CORAL, with MERCURY the EMERALD, with JUPITER the YELLOW SAPPHIRE,
                    with VENUS is the DIAMOND, with SATURN the BLUE SAPPHIRE, with RAHU the HESSONITE
                    GARNET and with KETU is the CHRYSOBERYL CATS EYE. Associated with the nine planets
                    are also the days of the week, different parts of the human body and different metals.
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {PLANET_GEMS.map(({ planet, gem, color }) => (
                    <div
                      key={planet}
                      className="flex items-center gap-3 rounded-sm border border-border bg-card p-4 shadow-sm"
                      style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
                    >
                      <div>
                        <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {planet}
                        </p>
                        <p className="text-sm font-semibold text-primary">{gem}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-[15px] leading-8 text-muted-foreground md:text-base">
                  A learned Vedic Astrologer can make an accurate horoscope of an individual by his/her
                  date of birth, time &amp; location of birth and can easily identify the benefic planets
                  in an individual's life which are falling in the weak houses. If the Vedic Gems of
                  those benefic weak planets are worn with their proper rituals and timings they can
                  potentiate those planets and can benefit the life of that individual in a great way.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <div className="rounded-sm border border-border bg-secondary/20 p-6 md:flex md:items-center md:justify-between md:gap-6">
                <div className="max-w-3xl">
                  <h2 className="font-heading text-lg font-semibold leading-snug text-primary">
                    Speak with a Vedic Astrologer before choosing a gemstone
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Book a consultation to study your birth chart and identify the most supportive
                    planetary gemstone for your life.
                  </p>
                </div>
                <div className="mt-4 md:mt-0 md:shrink-0">
                  <Link
                    href="/consultation"
                    className="inline-flex rounded-sm bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    Book a Consultation
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}