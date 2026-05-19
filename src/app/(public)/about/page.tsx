import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Gem,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { GemstoneWorldMap } from '@/components/ui/gemstone-world-map';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata: Metadata = {
  title: 'About Pure Vedic Gems | Heritage Since 1937 — Four Generations',
  description:
    'Pure Vedic Gems: a trusted four-generation family heritage since 1937 in certified natural gemstones, genuine Rudrakshas, Vedic astrology, custom jewellery, and energization — serving 40+ countries worldwide.',
};

const GENERATIONS = [
  {
    era: '1st Generation',
    year: 'Est. 1937',
    name: 'Late Shri Gandaram Mehra Ji',
    image: '/aboutus/1st%20Generation%20(1).webp',
    location: 'Lahore (now Pakistan)',
    copy: 'In 1937, our founder Late Shri Gandaram Mehra entered the gems and jewellery business in Lahore, laying the foundation of a legacy built on perfection, absolute reliability, and exquisite craftsmanship.',
  },
  {
    era: '2nd Generation',
    year: '1960s',
    name: 'Shri Vimal Mehra Ji',
    image: '/aboutus/2nd%20Generation%20(1).webp',
    location: 'New Delhi, India',
    copy: 'Shri Vimal Mehra strengthened sourcing networks, expanded retail and wholesale operations, and instilled the culture of honest gemstone advice and transparency that became the family hallmark.',
  },
  {
    era: '3rd Generation',
    year: '1990s–Present',
    name: 'Mr. Vikas Mehra',
    image: '/aboutus/3rd%20Generation%20(1).webp',
    location: 'Delhi & Noida, India',
    copy: 'Certified Gemologist and Jewellery Designer (GIA, IIG, EGL), Mr. Vikas Mehra merged modern gem science with ancient Vedic astrology, introducing lab certification, Rudraksha testing, Vedic energization, and digital commerce.',
  },
  {
    era: '4th Generation',
    year: 'Today',
    name: 'Mr. Vrayas Mehra',
    image: '/aboutus/4th%20Generation%20(1).webp',
    location: 'Worldwide',
    copy: 'The fourth generation continues the family legacy, bringing global digital access, consultation-first guidance, gem-to-jewellery configuration, and the same uncompromising standard of purity and authenticity.',
  },
] as const;

const PROMISES = [
  {
    icon: '/whychooseus/since1937.png',
    title: 'Since 1937',
    copy: 'Four generations of trust and excellence in the gemstone industry.',
  },
  {
    icon: '/whychooseus/worldwidedelivery.png',
    title: 'Worldwide Shipping',
    copy: 'Safe, discreet and fully insured worldwide delivery.',
  },
  {
    icon: '/whychooseus/labcertifications.png',
    title: 'Lab Certified',
    copy: 'Certified by Indian Govt. labs & international reputed laboratories.',
  },
  {
    icon: '/whychooseus/Vedic%20poojas.png',
    title: 'Vedic Poojas',
    copy: 'Complete in-house Vedic poojas & energization as per ancient rituals.',
  },
  {
    icon: '/whychooseus/Scientific%20Research.png',
    title: 'Scientific Research',
    copy: 'Research based guidance from Rudrakshas, Yagyas and Vedic Astrology.',
  },
  {
    icon: '/whychooseus/genuine%20vedic%20astrologers.png',
    title: 'Expert Guidance',
    copy: 'Authentic consultation by world renowned Vedic astrologers.',
  },
] as const;

const LABS = [
  { name: 'GIA', logo: '/labslogo/GIA.webp' },
  { name: 'IGI', logo: '/labslogo/IGI.webp' },
  { name: 'GRS', logo: '/labslogo/GRS.webp' },
  { name: 'Gubelin', logo: '/labslogo/GUBELIN.webp' },
  { name: 'GII', logo: '/labslogo/GII.webp' },
  { name: 'IIGJ', logo: '/labslogo/IIGJ.webp' },
  { name: 'SSEF', logo: '/labslogo/SSEF.webp' },
  { name: 'HRD Antwerp', logo: '/labslogo/HRD%20ANTWERP.webp' },
] as const;

const LOCATIONS = [
  {
    title: 'Delhi Retail Outlet',
    city: 'Saket, New Delhi',
    image: '/home/hero/pvgheropc2.webp',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pure%20Vedic%20Gems%20MGF%20Metropolitan%20Mall%20Saket%20New%20Delhi',
    copy: 'FF-32, MGF Metropolitan Mall, Opposite Saket Court, District Centre Saket. Retail, wholesale, and export hub for Pure Vedic Gems Pvt. Ltd.',
  },
  {
    title: 'Vedic Sciences Research Centre',
    city: 'Sector 49, Noida',
    image: '/home/whoweare/4Energization.webp',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pure%20Vedic%20Gems%20Sector%2049%20Noida',
    copy: 'Gems, Rudraksha, yagya, healing therapy, Vedic astrology, research, and energizing centre for deeper remedy work and consultation.',
  },
  {
    title: 'UK Appointment Support',
    city: 'Hounslow, London',
    image: '/home/hero/pvgheropc1.webp',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pure%20Vedic%20Gems%20Hounslow%20London',
    copy: 'Appointment-based support for overseas clients, coordinated through Pure Vedic Gems UK channels and official listed addresses.',
  },
] as const;

export default function AboutPage() {
  return (
    <main className="pvg-simple-page pvg-info-page font-body bg-[#fdf7ee] text-[#261a10]">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[#fdf7ee] px-4 pb-0 pt-32 sm:px-6 lg:pt-40">
        {/* Subtle gold radiating background */}
        <div className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 60% 0%, rgba(201,168,76,0.13) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 5% 20%, rgba(138,100,0,0.07) 0%, transparent 60%)' }} />

        {/* Decorative top border line */}
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-[#c9a84c] to-transparent" />

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-7 lg:grid-cols-[1fr_1.1fr] lg:items-center">

            <ScrollReveal className="lg:col-start-1 lg:row-start-1">
              <div>
                <h1 className="text-6xl font-black leading-[1.06] tracking-tight text-[#261a10] sm:text-7xl lg:text-[6.5rem]">
                  Four Generations<br />
                  <span className="text-[#8a6400]">of Vedic Gem Heritage</span>
                </h1>
                <div className="mt-5">
                  <p className="text-[13px] font-black uppercase tracking-[0.22em] text-[#261a10]">Established 1937</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-px w-20 bg-[#c9a84c]" />
                    <div className="h-1.5 w-1.5 rotate-45 bg-[#c9a84c]" />
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Right: Single composite 4-generations image */}
            <ScrollReveal direction="right" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:ml-auto lg:max-w-[78%]">
                <Image
                  src="/aboutus/image.png"
                  alt="Four Generations of Pure Vedic Gems — Shri Gandaram Mehra Ji, Shri Vimal Mehra Ji, Mr. Vikas Mehra, Mr. Vrayas Mehra"
                  width={800}
                  height={800}
                  priority
                  className="w-full rounded-2xl"
                  sizes="(max-width: 1024px) 90vw, 50vw"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal delay={80} className="lg:col-start-1 lg:row-start-2">
              <div>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#5a4a3a] md:text-[17px]">
                  Pure Vedic Gems Pvt. Ltd. is India&apos;s oldest and most trusted name in genuine gemstones, authentic Rudrakshas, vedic astrology, custom jewellery, and in-house energization &ndash; a four-generation family legacy now serving 40+ countries worldwide.
                </p>
                <p className="mt-4 max-w-2xl text-base leading-8 text-[#5a4a3a] md:text-[17px]">
                  Founded in Lahore in <strong className="text-[#261a10]">1937</strong>{' '}by Late Shri Gandaram Mehra, our journey spans over 87 years of uncompromising quality, certified gemology, and Vedic wisdom. Every gemstone we offer is individually sourced, lab-tested, and energized &ndash; ensuring that what reaches you is nothing short of the finest.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                  <Link href="/consultation"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#3d1a1a] px-2 text-center text-[10px] font-black uppercase tracking-[0.08em] text-white shadow-[0_4px_18px_rgba(61,26,26,0.35)] transition hover:bg-[#5a2a2a] sm:px-7 sm:text-sm sm:tracking-[0.12em]">
                    <CalendarDays className="h-4 w-4 shrink-0" /> Book Consultation
                  </Link>
                  <Link href="/shop"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#c9a84c] px-2 text-center text-[10px] font-black uppercase tracking-[0.08em] text-[#261a10] transition hover:bg-[#fff8e6] sm:px-7 sm:text-sm sm:tracking-[0.12em]">
                    <Gem className="h-4 w-4 shrink-0 text-[#8a6400]" /> Explore Gems
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── OUR STORY / HISTORY ──────────────────────────────────────── */}
      <section className="px-4 pb-8 pt-4 sm:px-6 lg:pb-10 lg:pt-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">

            <ScrollReveal direction="right" className="lg:col-start-2 lg:row-start-1">
              <div>
                <h2 className="text-3xl font-black leading-tight tracking-tight text-[#261a10] sm:text-4xl lg:text-[2.45rem]">
                  Our Heritage Story: <span className="text-[#8a6400]">A Legacy Born in Lahore, 1937</span>
                </h2>
                <div className="mt-4 h-px w-24 bg-[#c9a84c]" />
              </div>
            </ScrollReveal>

            {/* 1st Generation image */}
            <ScrollReveal direction="left" className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <div className="relative mx-auto max-w-md lg:max-w-115">
                <div className="relative overflow-hidden rounded-3xl border-2 border-[#e8d5a3] shadow-[0_24px_70px_rgba(61,43,31,0.16)]" style={{ aspectRatio: '4/5' }}>
                  <Image
                    src="/aboutus/1st%20Generation%20(1).webp"
                    alt="Late Shri Gandaram Mehra — Founder, 1937"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 90vw, 480px"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#1a0c04]/85 to-transparent p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f0c96a]">Founder</p>
                    <p className="mt-1 text-lg font-black text-white">Late Shri Gandaram Mehra</p>
                    <p className="text-sm text-white/75">Lahore, 1937</p>
                  </div>
                </div>
                {/* Decorative gold corner */}
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full border-4 border-[#c9a84c]/30 bg-[#fff8e6]" />
                <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full border-2 border-[#c9a84c]/20 bg-[#f4eadb]" />
              </div>
            </ScrollReveal>

            {/* History text */}
            <ScrollReveal direction="right" className="lg:col-start-2 lg:row-start-2">
              <div>
                <div className="space-y-5 text-[15px] leading-8 text-[#5a4a3a]">
                  <p>
                    Ever since its foundation in Lahore (now Pakistan), <strong className="text-[#261a10]">Shakti Dia Gems&apos;</strong> focus has always been on perfection. In <strong className="text-[#8a6400]">1937</strong>, its founder Late Shri Gandaram Mehra entered the gems and jewellery business, and since then, there has been no looking back.
                  </p>
                  <p>
                    Shakti Dia Gems rapidly established a reputation for absolute reliability and exquisite craftsmanship. Today, through its evolution into <strong className="text-[#261a10]">Pure Vedic Gems</strong>, it is a name that has won the trust of over <strong className="text-[#8a6400]">three generations</strong> of jewellery and gemstone lovers across India and the world.
                  </p>
                  <p>
                    The legacy traces its roots to Late Shri Gandaram Mehra, whose brilliance was matched only by the gems and diamonds he perfected. His son <strong className="text-[#261a10]">Mr. Vimal Mehra</strong> and now grandson <strong className="text-[#261a10]">Mr. Vikas Mehra</strong> — Certified Gemologist and Jewellery Designer — inherited his mastery and integrity, becoming legends in their own right.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-4 rounded-2xl border border-[#e8d5a3] bg-[#fff8e6] p-5">
                  <Gem className="h-8 w-8 shrink-0 text-[#8a6400]" />
                  <p className="text-sm leading-6 text-[#5a4a3a]">
                    <strong className="text-[#261a10]">Shakti Dia Gems Pvt. Ltd.</strong> has been wholesaling and retailing gems, diamonds, and jewellery for more than <strong className="text-[#8a6400]">87 years</strong>.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 4 GENERATIONS TIMELINE ───────────────────────────────────── */}
      <section className="bg-[#f4eadb] px-4 py-8 sm:px-6 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-5xl font-black leading-tight tracking-tight text-[#261a10] md:text-6xl">
                Four Generations, One Unbroken Promise
              </h2>
              <div className="mx-auto mt-4 flex max-w-48 items-center justify-center gap-2">
                <div className="h-px flex-1 bg-[#c9a84c]" />
                <div className="h-1.5 w-1.5 rotate-45 bg-[#c9a84c]" />
                <div className="h-px flex-1 bg-[#c9a84c]" />
              </div>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#5a4a3a]">
                A timeless journey of values, vision, and excellence{' '}
                <span className="font-semibold text-[#8a6400]">since 1937</span>.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-6 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-color:#c9a84c_transparent] [scrollbar-width:thin] sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
          <div className="rounded-3xl border border-[#e8d5a3] bg-[#fdf7ee] p-4 shadow-[0_18px_50px_rgba(61,43,31,0.08)] sm:p-6 lg:p-8">
            <div className="relative">
              <div className="absolute inset-x-16 hidden h-px bg-[#c9a84c]/35 xl:block" style={{ top: '72px' }} />
              <div className="grid auto-cols-[82%] grid-flow-col gap-4 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
              {GENERATIONS.map((item, index) => {
                const ordinals = ['01', '02', '03', '04'];
                const genLabels = ['1ST GENERATION', '2ND GENERATION', '3RD GENERATION', '4TH GENERATION'];
                const yearLabels = ['EST. 1937', '1960s', '1990s–PRESENT', 'TODAY'];
                return (
                  <ScrollReveal key={item.era} delay={index * 80}>
                    <article className="relative z-10 flex h-full flex-col rounded-3xl border border-[#e8d5a3] bg-[#fffdf8] px-5 pb-6 pt-6 text-center shadow-[0_10px_30px_rgba(61,43,31,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#c9a84c] hover:shadow-[0_18px_48px_rgba(61,43,31,0.14)]">
                      <div className="relative mx-auto h-36 w-36">
                        <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-[#c9a84c] bg-[#f4eadb] shadow-[0_8px_24px_rgba(61,43,31,0.18)]">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="scale-125 object-cover object-top"
                            sizes="144px"
                          />
                        </div>
                        <div className="absolute -bottom-3 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-[#fff4cf] shadow-md ring-2 ring-[#c9a84c]/80">
                          <span className="text-xs font-black text-[#6f4d00]">{ordinals[index]}</span>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-1 flex-col">
                        <span className="mx-auto rounded-full border border-[#c9a84c]/70 bg-[#fff4cf] px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-[#6f4d00] shadow-[0_4px_14px_rgba(201,168,76,0.16)]">
                          {genLabels[index]}
                        </span>
                        <h3 className="mt-3 text-lg font-black leading-snug text-[#261a10]">{item.name}</h3>
                        <div className="mt-1.5 flex items-center justify-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#8a6400]" />
                          <p className="text-xs text-[#7a6250]">{item.location}</p>
                        </div>
                        <div className="my-4 h-px bg-[#e8d5a3]" />
                        <div className="flex items-center justify-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0 text-[#8a6400]" />
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#261a10]">{yearLabels[index]}</p>
                        </div>
                        <p className="mt-3 flex-1 text-left text-[13px] leading-7 text-[#5a4a3a]">{item.copy}</p>
                      </div>
                    </article>
                  </ScrollReveal>
                );
              })}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ── DIRECTOR PROFILE ─────────────────────────────────────────── */}
      <section className="bg-white px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <ScrollReveal direction="right" className="lg:col-start-2 lg:row-start-1">
              <div>
                <h2 className="text-3xl font-black leading-tight tracking-tight text-[#261a10] sm:text-4xl lg:text-[2.45rem]">
                  Meet Our Director: <span className="text-[#8a6400]">The Visionary Behind Pure Vedic Gems</span>
                </h2>
                <div className="mt-4 h-px w-24 bg-[#c9a84c]" />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
              <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md">
                <Image
                  src="/aboutus/shrivikasmehraimg.png"
                  alt="Mr. Vikas Mehra — Director, Pure Vedic Gems"
                  width={640}
                  height={800}
                  unoptimized
                  className="h-auto w-full object-contain"
                  sizes="(max-width: 1024px) 90vw, 420px"
                />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" className="lg:col-start-2 lg:row-start-2">
              <div>
                <div className="space-y-4 text-[15px] leading-8 text-[#5a4a3a]">
                  <p>
                    <strong className="text-[#261a10]">Mr. Vikas Mehra</strong>, Director of Pure Vedic Gems, is a stern believer, follower, and researcher of Ancient Vedic Karmic Remedies — Yagya, Mantra, Yantra, Yoga, Daan, Ayurveda, and Ratna Dharana (healing with Vedic Astro-Planetary Gemstones).
                  </p>
                  <p>
                    He has been researching these ancient sciences of Vedic healing practised by our sacred ancestors (Vedic Scholars and Seers) for thousands of years, and is committed to providing everyone these ancient remedies in the most genuine, accurate, effective, and authentic form.
                  </p>
                  <p>
                    He is also blessed with the astrological configuration in his horoscope required to have a keen interest and deep understanding of these ancient alternative healing sciences and occult practices.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ─────────────────────────────────────────────── */}
      <section className="bg-[#fdf7ee] px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mx-auto max-w-fit text-center">
              <h2 className="text-center text-4xl font-black leading-tight tracking-tight text-[#261a10] md:text-5xl">
                Why Choose Us
              </h2>
              <div className="mx-auto mt-4 h-px w-24 bg-[#c9a84c]" />
            </div>
          </ScrollReveal>

          <div className="mt-10 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-color:#c9a84c_transparent] [scrollbar-width:thin] md:mx-0 md:overflow-visible md:px-0 md:pb-0">
          <div className="grid auto-cols-[46%] grid-flow-col gap-4 sm:auto-cols-[31%] md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:gap-5 lg:grid-cols-6">
            {PROMISES.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 55}>
                <div className="flex h-full flex-col items-center rounded-2xl border border-[#d8bd65]/70 bg-[#fff4cf] px-4 py-6 text-center shadow-[0_8px_24px_rgba(61,43,31,0.06)] transition hover:-translate-y-1 hover:border-[#c9a84c] hover:bg-[#fffaf0] hover:shadow-[0_12px_30px_rgba(201,168,76,0.18)]">
                  <div className="relative h-16 w-16">
                    <Image
                      src={item.icon}
                      alt={item.title}
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                  <div className="mt-3 h-px w-8 bg-[#c9a84c]" />
                  <h3 className="mt-3 text-sm font-bold text-[#261a10]">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#5a4a3a]">{item.copy}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── OUR SPECIALIZATION ───────────────────────────────────────── */}
      <section className="bg-white px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-5 lg:items-stretch">
            <ScrollReveal className="lg:col-span-2 lg:h-full">
              <div className="flex h-full flex-col justify-center">
                <h2 className="text-3xl font-black leading-tight tracking-tight text-[#261a10] sm:text-4xl lg:text-[2.45rem]">
                  Our Specialization: <span className="text-[#8a6400]">India&apos;s Oldest Gemstone &amp; Rudraksha Sellers</span>
                </h2>
                <div className="mt-4 h-px w-24 bg-[#c9a84c]" />
                <div className="mt-6 space-y-4 text-[15px] leading-8 text-[#5a4a3a]">
                  <p>
                    Pure Vedic Gems is associated with all kinds of gems, diamonds, and jewellery from generations and is the <strong className="text-[#261a10]">leading company in precious and semi-precious gems, diamonds, and Rudrakshas</strong> at the most genuine prices.
                  </p>
                  <p>
                    We are backed by <strong className="text-[#8a6400]">GIA, EGL, and IIG Graduates</strong>, Certified Jewellery Designers, and experienced Ancient Vedic Astrological Remedial Experts. Our core work includes <strong className="text-[#261a10]">01</strong> certified natural Navaratna &amp; Uparatna Jyotish gemstones, <strong className="text-[#261a10]">02</strong> original Rudrakshas from 1 to 21 Mukhi including rare malas, <strong className="text-[#261a10]">03</strong> Gemstone &amp; Rudraksha recommendation by Vedic astrologers, <strong className="text-[#261a10]">04</strong> custom Astro-Rashi jewellery, and <strong className="text-[#261a10]">05</strong> gemstone purification, energization, puja, and havan services.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" className="lg:col-span-3 lg:h-full">
              <GemstoneWorldMap />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── DIRECT SOURCING ADVANTAGE ────────────────────────────────── */}
      <section className="bg-[#f4eadb] px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <ScrollReveal>
              <div>
                <h2 className="text-3xl font-black leading-tight tracking-tight text-[#261a10] sm:text-4xl lg:text-[2.45rem]">
                  Our Sourcing Advantage: <span className="text-[#8a6400]">Why Our Prices Are Better &amp; Fairer</span>
                </h2>
                <div className="mt-4 h-px w-24 bg-[#c9a84c]" />
                <p className="mt-5 text-base leading-7 text-[#5a4a3a]">
                  Our gems and Rudrakshas are sourced <strong>directly from the mines, gem manufacturers, and Rudraksha farms</strong> — cutting out all middlemen and passing the price benefit directly to our customers.
                </p>
                <div className="mt-6 grid gap-3">
                  {[
                    { icon: TrendingDown, title: 'No Middlemen', copy: 'Direct sourcing eliminates brokers and commission agents.' },
                    { icon: BadgeCheck, title: 'Better Quality', copy: 'Each gem is personally examined before it enters our collection.' },
                    { icon: ShieldCheck, title: 'Guaranteed Authentic', copy: 'Every stone is traceable and verified before it reaches you.' },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3 rounded-2xl border border-[#e8d5a3] bg-white/75 p-4">
                      <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#8a6400]" />
                      <div>
                        <h3 className="text-sm font-black text-[#261a10]">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#5a4a3a]">{item.copy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="overflow-hidden rounded-3xl border-2 border-[#e8d5a3] bg-white p-4 shadow-[0_14px_42px_rgba(61,43,31,0.10)] sm:p-5">
                <Image
                  src="/aboutus/process.png"
                  alt="Our direct sourcing supply chain — mines to customer with no middlemen"
                  width={1200}
                  height={600}
                  unoptimized
                  className="mx-auto w-full rounded-2xl"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CERTIFICATION & QUALITY ───────────────────────────────────── */}
      <section className="bg-white px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <ScrollReveal>
              <div>
                <h2 className="text-3xl font-black leading-tight tracking-tight text-[#261a10] sm:text-4xl lg:text-[2.45rem]">
                  Certification &amp; Quality Promise: <span className="text-[#8a6400]">Every Gem Certified. Every Rudraksha Tested.</span>
                </h2>
                <div className="mt-4 h-px w-24 bg-[#c9a84c]" />
                <div className="mt-6 space-y-4 text-[15px] leading-8 text-[#5a4a3a]">
                  <p>
                    All our gemstones are certified only by <strong className="text-[#261a10]">reputed internationally recognized laboratories</strong> that clearly state the stones are guaranteed natural and untreated.
                  </p>
                  <p>
                    We also provide <strong className="text-[#8a6400]">origin certificates</strong> from labs like GIA, GRS, IGI, GII, and AIGS confirming the geographic origin of premium stones.
                  </p>
                  <p>
                    All Rudrakshas are individually tested by the most authentic Rudraksha Testing Labs using <strong className="text-[#261a10]">X-Ray tests</strong> (internal seed verification), microscopic examination (for artificial Mukhis), and temperature &amp; magnetic tests (energy/aura verification).
                  </p>
                </div>

                {/* Lab badges */}
                <div className="mt-8">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {LABS.map((lab) => (
                      <div key={lab.name} className="flex min-h-20 items-center justify-center p-2">
                        <Image
                          src={lab.logo}
                          alt={`${lab.name} laboratory logo`}
                          width={140}
                          height={64}
                          className="max-h-10 w-auto object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Rudraksha testing & Vedic energization */}
            <ScrollReveal direction="right">
              <div className="space-y-4">
                {[
                  {
                    title: 'Vedic Energization Service',
                    copy: 'All our gemstones and Rudrakshas are purified and energized by Ancient Vedic Planetary and Pauranic Rudra Mantras to potentiate their positive healing powers. Energization includes gotra, rashi, wearing rituals, and recorded puja services.',
                  },
                  {
                    title: 'Rudraksha Authenticity Testing',
                    copy: 'Every Rudraksha undergoes a rigorous 3-stage testing protocol: X-Ray scan to verify internal seeds, microscopic examination to detect artificial mukhi creation, and temperature and magnetic energy tests to verify aura and healing power.',
                  },
                  {
                    title: 'Official Branch Notice',
                    copy: 'Pure Vedic Gems has no other branches except at its official contact locations and has not granted franchise rights to anyone using the Pure Vedic Gems name or similar names. Beware of imitators.',
                  },
                ].map((item) => (
                  <article key={item.title} className="overflow-hidden rounded-3xl border border-[#e8d5a3] bg-[#fdf7ee] p-6">
                    <h3 className="text-2xl font-black text-[#261a10]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#5a4a3a]">{item.copy}</p>
                  </article>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── OUR CORE VALUES ──────────────────────────────────────────── */}
      <section className="bg-[#f4eadb] px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-[#261a10] sm:text-4xl lg:text-[2.45rem]">
              Our Core Values: <span className="text-[#8a6400]">What Drives Everything We Do</span>
            </h2>
            <div className="mt-4 h-px w-24 bg-[#c9a84c]" />
            <div className="mt-6 space-y-5 text-[15px] leading-8 text-[#5a4a3a]">
              <p>Our work is built around disciplined choices: never compromise the stone, never overpromise the remedy, and never let a customer make a spiritual purchase without clarity.</p>
              <p><strong className="text-[#261a10]">Purity Over Profit</strong><br />We understand the value of your investment and the importance of a gemstone in your life. 100% purity always precedes monetary value.</p>
              <p><strong className="text-[#261a10]">Honest Consultations</strong><br />Our certified gemologists give honest, impartial guidance on gem quality, suitability, and effect — no sales pressure, only truth.</p>
              <p><strong className="text-[#261a10]">Complete Transparency</strong><br />Every transaction is backed by lab-certified identification reports. What you see is exactly what you get — no exceptions.</p>
              <p><strong className="text-[#261a10]">Customer Assurance</strong><br />Free gem testing, energization, post-purchase support, and follow-up guidance. Your satisfaction and benefit are our measure of success.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── OUR LOCATIONS ────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-4xl font-black leading-tight tracking-tight text-[#261a10] md:text-5xl">
                Visit Us: <span className="text-[#8a6400]">Our Locations</span>
              </h2>
              <div className="mx-auto mt-4 h-px w-24 bg-[#c9a84c]" />
            </div>
          </ScrollReveal>

          <div className="mt-8 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-color:#c9a84c_transparent] [scrollbar-width:thin] md:mx-0 md:overflow-visible md:px-0 md:pb-0">
          <div className="grid auto-cols-[82%] grid-flow-col gap-5 md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:gap-6">
            {LOCATIONS.map((location, index) => (
              <ScrollReveal key={location.title} delay={index * 70}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-[#e8d5a3] bg-[#fdf7ee] shadow-[0_8px_28px_rgba(61,43,31,0.07)] transition hover:-translate-y-1 hover:border-[#c9a84c] hover:shadow-[0_18px_48px_rgba(61,43,31,0.12)]">
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={location.image}
                      alt={`${location.title} location`}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 90vw, 380px"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#1a0c04]/60 via-transparent to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-black text-[#261a10]">{location.title}</h3>
                    <div className="mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#8a6400]" />
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a6400]">{location.city}</p>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-7 text-[#5a4a3a]">{location.copy}</p>
                    <a
                      href={location.mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-2 border-[#c9a84c] bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-[#261a10] transition hover:bg-[#fff8e6]"
                    >
                      Locate on Map <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-[#fdf7ee] px-4 pb-10 pt-4 sm:px-6 lg:pb-14 lg:pt-6">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl border-2 border-[#e8d5a3] bg-white px-8 py-14 text-center shadow-[0_24px_70px_rgba(61,43,31,0.10)] sm:px-14">
              {/* Decorative gold circle accents */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border-40 border-[#c9a84c]/10" />
              <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full border-32 border-[#c9a84c]/8" />

              <div className="relative">
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-16 bg-[#c9a84c]" />
                  <Sparkles className="h-5 w-5 text-[#8a6400]" />
                  <div className="h-px w-16 bg-[#c9a84c]" />
                </div>
                <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-[#261a10] sm:text-5xl">
                  Not Sure Which Gem or Rudraksha is Right For You?
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#5a4a3a]">
                  Share your birth details or concern with our experts. Our certified gemologists and Vedic astrologers will guide you on whether you need a gemstone, Rudraksha, puja, yagya, yantra, mantra, or jewellery — or perhaps no purchase at all.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Link href="/consultation"
                    className="inline-flex min-h-12 items-center rounded-xl bg-[#8a6400] px-8 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#a07800] shadow-[0_4px_18px_rgba(138,100,0,0.30)]">
                    Book Consultation
                  </Link>
                  <Link href="/contact"
                    className="inline-flex min-h-12 items-center gap-2 rounded-xl border-2 border-[#c9a84c] px-8 text-sm font-black uppercase tracking-[0.12em] text-[#261a10] transition hover:bg-[#fff8e6]">
                    Contact Our Team <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}