import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  Gem,
  Globe2,
  Microscope,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

export const metadata: Metadata = {
  title: 'About Pure Vedic Gems | Since 1937',
  description:
    'Learn about Pure Vedic Gems: a four-generation Vedic gemstone, Rudraksha, jewellery, energization, and astrology guidance brand serving clients worldwide since 1937.',
};

type IconType = ComponentType<{ className?: string }>;

const STATS = [
  { value: '1937', label: 'Established', detail: '87+ years of family heritage' },
  { value: '4', label: 'Generations', detail: 'An unbroken gem and remedy tradition' },
  { value: '40+', label: 'Countries', detail: 'Clients served across the world' },
  { value: '6+', label: 'Lab Networks', detail: 'Indian and international certification support' },
] as const;

const GENERATIONS = [
  {
    era: '1st Generation',
    year: '1937',
    image: '/aboutus/1st%20Generation%20(1).png',
    title: 'The family tradition begins in gems and jewellery',
    copy:
      'The foundation was laid in the old Indian tradition of natural gemstones, jewellery making, and trust-led advice. The earliest work was built around recognising genuine stones, dealing honestly, and preserving long-term client relationships.',
  },
  {
    era: '2nd Generation',
    year: '1960s',
    image: '/aboutus/2nd%20Generation%20(1).png',
    title: 'Retail, sourcing, and craftsmanship expand',
    copy:
      'The second generation strengthened sourcing, cutting awareness, jewellery manufacturing, wholesale relationships, and retail service. This is where the habit of explaining quality, origin, and wearing suitability became part of the family culture.',
  },
  {
    era: '3rd Generation',
    year: '1990s',
    image: '/aboutus/3rd%20Generation%20(1).png',
    title: 'Gemology and Vedic remedy science come together',
    copy:
      'Modern gem testing, Vedic astrology, genuine Rudraksha verification, mantra-based preparation, and lab documentation began working side by side. The business moved beyond selling stones into preparing remedies with responsibility.',
  },
  {
    era: '4th Generation',
    year: 'Today',
    image: '/aboutus/4th%20Generation%20(1).png',
    title: 'Digital access with personal guidance',
    copy:
      'Led by Shri Vikas Mehra and the present family team, Pure Vedic Gems now combines online discovery, consultation, gem-to-jewellery configuration, secure delivery, and appointment-based support while keeping the old family standard of disclosure.',
  },
] as const;

const PROMISES: Array<{ icon: IconType; title: string; copy: string }> = [
  {
    icon: ShieldCheck,
    title: 'Credibility since 1937',
    copy: 'A four-generation family business dealing in Pure Astro-Vedic quality Jyotish gemstones, genuine Rudrakshas, authentic Vedic yagyas, and remedial guidance.',
  },
  {
    icon: Microscope,
    title: 'Certification before belief',
    copy: 'Gemstones are supported through Indian government and international reputed labs such as GIA, IGI, GRS, Gubelin, GII, and IIGJ where relevant.',
  },
  {
    icon: Sparkles,
    title: 'In-house Vedic energization',
    copy: 'Gemstones and Rudrakshas can be purified and energized through planetary mantras, Rudra mantras, gotra, rashi, wearing rituals, and recorded puja services.',
  },
  {
    icon: Gem,
    title: 'Pure and natural remedies',
    copy: 'The old website repeatedly warns against treated, low-life, fake, tampered, or manipulated stones and beads. The current platform keeps that caution central.',
  },
  {
    icon: Globe2,
    title: 'Worldwide safe delivery',
    copy: 'Pure Vedic Gems serves clients in India and overseas with secure packing, insured shipping, and support from Delhi, Noida, and UK appointment channels.',
  },
  {
    icon: Users,
    title: 'Astrologer-led guidance',
    copy: 'The brand position is consultation-first: clients are guided on whether they need a gemstone, Rudraksha, mantra, yantra, yagya, jewellery setting, or no purchase.',
  },
] as const;

const SERVICES = [
  'Certified natural Navaratna and Uparatna gemstones for planetary use',
  'Original Rudrakshas from 1 to 21 Mukhi, including rare beads and malas',
  'Gemstone and Rudraksha recommendation by Vedic astrologers',
  'Custom Astro-Rashi jewellery in rings, pendants, bracelets, kadas, gold, and silver',
  'Gemstone and Rudraksha purification, energization, puja, and havan services',
  'Vedic remedies including mantra, yagya, yantra, Rudraksha, and ratna dharana',
  'Online, telephonic, in-person, retail, wholesale, and export support',
  'Worldwide safe and insured delivery with documentation where applicable',
] as const;

const LABS = ['GIA', 'IGI', 'GRS', 'Gubelin', 'GII', 'IIGJ', 'Govt. Labs', 'X-ray Rudraksha Testing'] as const;

const LOCATIONS = [
  {
    icon: Building2,
    title: 'Delhi Retail Outlet',
    city: 'Saket, New Delhi',
    copy: 'FF-32, MGF Metropolitan Mall, Opposite Saket Court, District Centre Saket, New Delhi. This is the retail, wholesale, and export location associated with Pure Vedic Gems Pvt. Ltd.',
  },
  {
    icon: Microscope,
    title: 'Vedic Sciences Research Centre',
    city: 'Sector 49, Noida',
    copy: 'A gems, Rudraksha, yagya, healing therapy, Vedic astrology, research, and energizing centre for deeper remedy work and consultation-led support.',
  },
  {
    icon: Globe2,
    title: 'UK Appointment Support',
    city: 'Hounslow, London',
    copy: 'Appointment-based support for overseas clients, coordinated around Pure Vedic Gems UK contact channels and official listed addresses.',
  },
] as const;

export default function AboutPage() {
  return (
    <main className="pvg-simple-page font-body bg-white text-[#1f2933]">
      <section className="relative isolate overflow-hidden bg-[#2c0404] px-4 pb-16 pt-32 text-white sm:px-6 lg:pb-24 lg:pt-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_16%,rgba(212,168,67,0.26),transparent_28%),radial-gradient(circle_at_86%_24%,rgba(255,255,255,0.12),transparent_28%),linear-gradient(135deg,#2c0404_0%,#5d0e0e_46%,#120909_100%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-linear-to-t from-[#fbf7ef] to-transparent" />

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)] lg:items-center">
          <ScrollReveal>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d4a843]">Pure Vedic Science &amp; Research Centre</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.98] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Four generations of Vedic remedy expertise
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/76 md:text-lg">
                Pure Vedic Gems Pvt. Ltd. carries a family tradition since 1937, combining certified natural gemstones, genuine Rudrakshas, Vedic astrology, custom jewellery, in-house energization, and global client care.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/consultation" className="inline-flex min-h-12 items-center rounded-xl bg-[#d4a843] px-6 text-sm font-black uppercase tracking-[0.12em] text-[#2c0404] transition hover:bg-[#f0c96a]">
                  Book Consultation
                </Link>
                <Link href="/configure" className="inline-flex min-h-12 items-center rounded-xl border border-white/20 px-6 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-[#d4a843] hover:text-[#f0c96a]">
                  Configure Jewellery
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="grid grid-cols-2 gap-3">
              {GENERATIONS.map((item, index) => (
                <div key={item.era} className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]" style={{ aspectRatio: '4 / 5' }}>
                  <Image src={item.image} alt={item.era} fill priority={index < 2} className="object-cover opacity-85" sizes="(max-width: 768px) 44vw, 240px" />
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#160303] to-transparent p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f0c96a]">{item.era}</p>
                    <p className="text-xs font-bold text-white/80">{item.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="px-4 sm:px-6">
        <div className="mx-auto -mt-10 grid max-w-7xl overflow-hidden rounded-3xl border border-[#ead7ad] bg-white shadow-[0_24px_70px_rgba(61,43,31,0.12)] sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="border-b border-r border-[#ead7ad] p-7 last:border-r-0 sm:p-8 lg:border-b-0">
              <p className="text-4xl font-black text-[#7a1515]">{stat.value}</p>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.14em] text-[#2c0404]">{stat.label}</p>
              <p className="mt-2 text-sm leading-6 text-[#6b5b4e]">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b8861e]">What the brand stands for</p>
              <h2 className="mt-4 text-4xl font-black leading-tight text-[#2c0404] md:text-5xl">To benefit lives through ancient Indian Vedic science.</h2>
              <p className="mt-5 text-base leading-8 text-[#6b5b4e]">
                The old website describes the mission clearly: use Gems and Rudraksha Therapy to harness favourable planets, strengthen weak body chakras, and make cosmic forces work in the client&apos;s favour. This page keeps that promise in a clearer, modern form.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {PROMISES.map((point, index) => (
              <ScrollReveal key={point.title} delay={index * 55}>
                <article className="h-full rounded-3xl border border-[#e2d3b6] bg-white p-7 shadow-[0_18px_46px_rgba(61,43,31,0.07)] transition hover:-translate-y-1 hover:border-[#d4a843]">
                  <div className="inline-flex rounded-2xl bg-[#fff1cf] p-3 text-[#7a1515]">
                    <point.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-[#2c0404]">{point.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#6b5b4e]">{point.copy}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <ScrollReveal>
              <div className="lg:sticky lg:top-28">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#b8861e]">Heritage timeline</p>
                <h2 className="mt-4 text-4xl font-black leading-tight text-[#2c0404] md:text-5xl">An 87-year family route into modern Vedic ecommerce.</h2>
                <p className="mt-5 text-sm leading-7 text-[#6b5b4e]">The business has moved from trusted family dealing to a complete guided journey: consultation, selection, certification, jewellery, energization, and delivery.</p>
              </div>
            </ScrollReveal>

            <div className="space-y-5">
              {GENERATIONS.map((item, index) => (
                <ScrollReveal key={item.era} direction="right" delay={index * 70}>
                  <article className="grid gap-5 rounded-3xl border border-[#e2d3b6] bg-[#fbf7ef] p-5 md:grid-cols-[180px_1fr] md:p-6">
                    <div className="relative min-h-52 overflow-hidden rounded-2xl bg-[#ead7ad] md:min-h-0">
                      <Image src={item.image} alt={item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 180px" />
                    </div>
                    <div className="self-center">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-[#7a1515] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">{item.era}</span>
                        <span className="text-sm font-black text-[#b8861e]">{item.year}</span>
                      </div>
                      <h3 className="mt-4 text-2xl font-black text-[#2c0404]">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-[#6b5b4e]">{item.copy}</p>
                    </div>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#2c0404] px-4 py-16 text-white sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <ScrollReveal>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d4a843]">Products and services</p>
              <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">A complete remedy ecosystem, not just a gemstone shop.</h2>
              <p className="mt-5 text-sm leading-7 text-white/72">Research from the existing folders and the old site shows the same recurring service promise: gems, Rudrakshas, yagyas, astrology, custom jewellery, energization, certification, and safe delivery belong together.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {LABS.map((lab) => <span key={lab} className="rounded-full border border-white/14 px-3 py-1.5 text-xs font-black text-[#f0c96a]">{lab}</span>)}
              </div>
            </div>
          </ScrollReveal>
          <div className="grid gap-3 sm:grid-cols-2">
            {SERVICES.map((service, index) => (
              <ScrollReveal key={service} direction="right" delay={index * 35}>
                <div className="flex min-h-20 gap-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#d4a843]" aria-hidden="true" />
                  <p className="text-sm font-bold leading-6 text-white/82">{service}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <div className="grid gap-8 rounded-3xl border border-[#e2d3b6] bg-white p-6 shadow-[0_24px_70px_rgba(61,43,31,0.08)] md:grid-cols-[0.9fr_1.1fr] md:p-8 lg:p-10">
              <div>
                <div className="inline-flex rounded-2xl bg-[#fff1cf] p-3 text-[#7a1515]"><ShieldCheck className="h-7 w-7" /></div>
                <h2 className="mt-5 text-3xl font-black text-[#2c0404]">Official branch and franchise warning</h2>
                <p className="mt-4 text-sm leading-7 text-[#6b5b4e]">The old site explicitly states that Pure Vedic Gems has no other branches except the official contact locations and has not granted franchise rights to anyone using the Pure Vedic Gems name or similar names.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {LOCATIONS.map((location) => (
                  <div key={location.title} className="rounded-2xl bg-[#fbf7ef] p-5">
                    <location.icon className="h-6 w-6 text-[#7a1515]" aria-hidden="true" />
                    <h3 className="mt-4 text-base font-black text-[#2c0404]">{location.title}</h3>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#b8861e]">{location.city}</p>
                    <p className="mt-3 text-xs leading-6 text-[#6b5b4e]">{location.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {[
            { icon: PackageCheck, title: 'Before buying', copy: 'Ask whether a remedy is suitable for your chart, goal, and wearing conditions.' },
            { icon: BookOpenCheck, title: 'Before wearing', copy: 'Understand mantra, ritual, metal, finger, day, timing, purification, and energization guidance.' },
            { icon: Star, title: 'After delivery', copy: 'Keep certificates, video proof where applicable, care instructions, and follow-up guidance together.' },
          ].map((item) => (
            <ScrollReveal key={item.title}>
              <div className="h-full rounded-3xl border border-[#e2d3b6] bg-[#fbf7ef] p-7">
                <item.icon className="h-8 w-8 text-[#7a1515]" aria-hidden="true" />
                <h3 className="mt-5 text-2xl font-black text-[#2c0404]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6b5b4e]">{item.copy}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="bg-[#2c0404] px-4 py-16 text-white sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-3xl border border-white/10 bg-white/6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d4a843]">Start with guidance</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Not sure which gemstone or Rudraksha is best for you?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">Share your birth details or concern. The team can help you decide between gemstone, Rudraksha, puja, yagya, yantra, mantra, jewellery setting, or no purchase.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/consultation" className="inline-flex min-h-12 items-center rounded-xl bg-[#d4a843] px-6 text-sm font-black uppercase tracking-[0.12em] text-[#2c0404] transition hover:bg-[#f0c96a]">Book Consultation</Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/18 px-6 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:border-[#d4a843] hover:text-[#f0c96a]">Contact Team <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}