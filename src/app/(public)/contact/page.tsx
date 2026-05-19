'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Mail, MapPin, Phone, Send } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

type SubmitStatus = 'idle' | 'sending' | 'sent' | 'error';

const COUNTRY_CODES = [
  { id: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { id: 'GB', dial: '+44', flag: '🇬🇧', name: 'United Kingdom' },
  { id: 'US', dial: '+1', flag: '🇺🇸', name: 'United States' },
  { id: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  { id: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { id: 'NZ', dial: '+64', flag: '🇳🇿', name: 'New Zealand' },
  { id: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { id: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { id: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { id: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { id: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { id: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
  { id: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
  { id: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { id: 'HK', dial: '+852', flag: '🇭🇰', name: 'Hong Kong' },
  { id: 'TW', dial: '+886', flag: '🇹🇼', name: 'Taiwan' },
  { id: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
  { id: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea' },
  { id: 'CN', dial: '+86', flag: '🇨🇳', name: 'China' },
  { id: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand' },
  { id: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { id: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines' },
  { id: 'VN', dial: '+84', flag: '🇻🇳', name: 'Vietnam' },
  { id: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { id: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { id: 'LK', dial: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
  { id: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal' },
  { id: 'MV', dial: '+960', flag: '🇲🇻', name: 'Maldives' },
  { id: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { id: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { id: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { id: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy' },
  { id: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain' },
  { id: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { id: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland' },
  { id: 'AT', dial: '+43', flag: '🇦🇹', name: 'Austria' },
  { id: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belgium' },
  { id: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden' },
  { id: 'NO', dial: '+47', flag: '🇳🇴', name: 'Norway' },
  { id: 'DK', dial: '+45', flag: '🇩🇰', name: 'Denmark' },
  { id: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finland' },
  { id: 'PL', dial: '+48', flag: '🇵🇱', name: 'Poland' },
  { id: 'GR', dial: '+30', flag: '🇬🇷', name: 'Greece' },
  { id: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia' },
  { id: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { id: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel' },
  { id: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa' },
  { id: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { id: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { id: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
  { id: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { id: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil' },
  { id: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico' },
  { id: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina' },
  { id: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile' },
  { id: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia' },
] as const;

const initialForm = {
  name: '',
  email: '',
  countryCode: 'IN',
  phone: '',
  message: '',
};

const PRIMARY_ADDRESSES = [
  {
    flag: '/flags/india.svg',
    title: 'Pure Vedic Gems - Delhi',
    lines: [
      'FF-32, MGF Metropolitan Mall',
      'District Centre Saket, New Delhi 110017',
      'Ph: +91 98715 82404',
      'E: info@purevedicgems.in',
    ],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pure%20Vedic%20Gems%20MGF%20Metropolitan%20Mall%20Saket%20New%20Delhi',
  },
  {
    flag: '/flags/india.svg',
    title: 'Research Centre - Noida',
    lines: [
      '6th Floor, East Avenue Grand Building',
      'Sector 49, Noida, U.P. 201301',
      'Ph: +91 77039 34332',
      'E: info@purevedicgems.com',
    ],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Pure%20Vedic%20Science%20and%20Research%20Centre%20Sector%2049%20Noida',
  },
] as const;

const LOCATION_COLUMNS = [
  {
    flag: '/flags/india.svg',
    title: 'Delhi, India',
    lines: ['MGF Metropolitan Mall, Saket', 'New Delhi 110017', 'Ph: +91 98715 82404'],
    mapUrl: PRIMARY_ADDRESSES[0].mapUrl,
  },
  {
    flag: '/flags/india.svg',
    title: 'Noida, India',
    lines: ['East Avenue Grand Building', 'Sector 49, Noida 201301', 'Ph: +91 77039 34332'],
    mapUrl: PRIMARY_ADDRESSES[1].mapUrl,
  },
  {
    flag: '/flags/uk.svg',
    title: 'Hounslow, U.K.',
    lines: ['95 Juniper Court', 'Hanworth Road, Hounslow TW3 3TL', 'Appointment support'],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=95%20Juniper%20Court%20Hanworth%20Road%20Hounslow%20TW3%203TL%20UK',
  },
  {
    flag: '/flags/uk.svg',
    title: 'Milton Keynes, U.K.',
    lines: ['3 Winstanley Ln', 'Shenley Lodge, MK5 7BT', 'Registered address'],
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=3%20Winstanley%20Ln%20Shenley%20Lodge%20Milton%20Keynes%20MK5%207BT%20UK',
  },
] as const;

const CONTACT_DETAILS = {
  phones: ['+44-7831491778', '+91-9871582404', '+91-7703934332', '+91-9810980550'],
  emails: ['info@purevedicgems.in', 'info@purevedicgems.com', 'purevedicgems@gmail.com'],
} as const;

const WORKING_TIMINGS = [
  ['Monday', '11:00 am - 7:00 pm'],
  ['Tuesday', '11:00 am - 7:00 pm'],
  ['Wednesday', 'Closed'],
  ['Thursday', '11:00 am - 7:00 pm'],
  ['Friday', '11:00 am - 7:00 pm'],
  ['Saturday', '11:00 am - 7:00 pm'],
  ['Sunday', '11:00 am - 7:00 pm'],
] as const;

const LOCATION_MAPS = [
  {
    title: 'Delhi Store',
    routeImage: 'https://www.purevedicgems.com/wp-content/themes/purevedicgems/images/location-map.jpg',
    routeAlt: 'Route map to Pure Vedic Gems Delhi outlet in MGF Metropolitan Mall',
    embedUrl: 'https://www.google.com/maps?q=Certified%20Gemstones%20Seller%20MGF%20Metropolitan%20Mall%20Saket%20New%20Delhi&output=embed',
    mapUrl: PRIMARY_ADDRESSES[0].mapUrl,
  },
  {
    title: 'Noida Research Centre',
    routeImage: 'https://www.purevedicgems.com/wp-content/uploads/2020/09/noida-location-map.jpg',
    routeAlt: 'Route map to Pure Vedic Science and Research Centre Noida',
    embedUrl: 'https://www.google.com/maps?q=Pure%20Vedic%20Science%20and%20Research%20Centre%20Sector%2049%20Noida&output=embed',
    mapUrl: PRIMARY_ADDRESSES[1].mapUrl,
  },
] as const;

function cleanPhone(value: string) {
  return value.replace(/[^+\d]/g, '');
}

export default function ContactPage() {
  const [formState, setFormState] = useState(initialForm);
  const [status, setStatus] = useState<SubmitStatus>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formState.name.trim(),
          email: formState.email.trim(),
          phone: formState.phone.trim() || undefined,
          subject: 'Contact enquiry',
          message: formState.message.trim(),
          source: 'contact_form',
        }),
      });

      if (!response.ok) throw new Error('Failed to submit enquiry');

      setStatus('sent');
      setFormState(initialForm);
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="pvg-simple-page pvg-info-page bg-[#fbfaf7] font-body text-[#15110d]">
      <section className="px-4 pb-12 pt-28 sm:px-6 lg:pb-16 lg:pt-36">
        <div className="flex justify-center mb-10">
          <ScrollReveal>
            <h1 className="text-center text-4xl font-black tracking-tight sm:text-5xl">How can we help?</h1>
          </ScrollReveal>
        </div>
        <div className="mx-auto max-w-7xl">

          <div className="grid gap-12 lg:grid-cols-[0.52fr_0.48fr] lg:items-start">
            <ScrollReveal>
              <form onSubmit={handleSubmit} className="grid gap-3">
                  <input
                    required
                    maxLength={200}
                    placeholder="Name"
                    value={formState.name}
                    onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                    className="h-12 w-full border border-[#d9d4cb] bg-transparent px-4 text-sm outline-none transition placeholder:text-[#9e9892] focus:border-[#b86654] focus:bg-white/60"
                  />
                  <input
                    required
                    type="email"
                    maxLength={255}
                    placeholder="Email"
                    value={formState.email}
                    onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                    className="h-12 w-full border border-[#d9d4cb] bg-transparent px-4 text-sm outline-none transition placeholder:text-[#9e9892] focus:border-[#b86654] focus:bg-white/60"
                  />
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <div className="relative">
                      <select
                        value={formState.countryCode}
                        onChange={(event) => setFormState({ ...formState, countryCode: event.target.value })}
                        className="h-12 w-full appearance-none border border-[#d9d4cb] bg-transparent pl-3 pr-8 text-sm text-[#15110d] outline-none focus:border-[#b86654]"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.flag} {c.dial} {c.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9e9892]">▾</span>
                    </div>
                    <input
                      maxLength={20}
                      placeholder="Phone number"
                      value={formState.phone}
                      onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
                      className="h-12 w-full border border-[#d9d4cb] bg-transparent px-4 text-sm outline-none transition placeholder:text-[#9e9892] focus:border-[#b86654] focus:bg-white/60"
                    />
                  </div>
                  <textarea
                    required
                    rows={8}
                    maxLength={5000}
                    placeholder="Comments"
                    value={formState.message}
                    onChange={(event) => setFormState({ ...formState, message: event.target.value })}
                    className="w-full resize-y border border-[#d9d4cb] bg-transparent px-4 py-4 text-sm outline-none transition placeholder:text-[#9e9892] focus:border-[#b86654] focus:bg-white/60"
                  />
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 bg-[#f36b5b] text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#e45d4e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === 'sending' ? 'Sending...' : 'Submit'} <Send className="h-4 w-4" />
                  </button>
                  {status === 'sent' ? <p className="text-center text-sm font-bold text-[#4f7f54]">Message sent. We will get back to you shortly.</p> : null}
                  {status === 'error' ? <p className="text-center text-sm font-bold text-[#b53a2f]">Could not send right now. Please call or email us directly.</p> : null}
                </form>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="space-y-8 text-center">
                {PRIMARY_ADDRESSES.map((address) => (
                  <div key={address.title}>
                    <span className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#f4eadb]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={address.flag} alt="" width={22} height={15} aria-hidden="true" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                    </span>
                    <h2 className="mt-4 text-lg font-black uppercase tracking-[0.05em]">{address.title}</h2>
                    <div className="mt-2 space-y-1 text-base leading-7 text-[#15110d]">
                      {address.lines.map((line) => <p key={line}>{line}</p>)}
                    </div>
                    <a href={address.mapUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-base font-medium text-[#f36b5b] hover:underline">
                      Get Directions <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className="border-y border-[#ece5db] bg-white px-4 py-10 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-y-10 divide-[#ece5db] sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
            {LOCATION_COLUMNS.map((location) => (
              <ScrollReveal key={location.title}>
                <div className="px-5 text-center">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#f4eadb]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={location.flag} alt="" width={22} height={15} aria-hidden="true" style={{ borderRadius: '2px', objectFit: 'cover' }} />
                  </span>
                  <h2 className="mt-4 text-lg font-black uppercase tracking-[0.05em]">{location.title}</h2>
                  <div className="mt-2 space-y-1 text-[15px] leading-7 text-[#15110d]">
                    {location.lines.map((line) => <p key={line}>{line}</p>)}
                  </div>
                  <a href={location.mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-base font-medium text-[#f36b5b] hover:underline">
                    Get Directions <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto max-w-7xl space-y-10">
          <ScrollReveal>
            <div className="border border-[#d8bd75] bg-[#fdf3e7] p-6 sm:p-8 lg:p-10">
              <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#8a6400]"><Phone className="h-4 w-4" /> Phone</p>
                  <div className="space-y-2">
                    {CONTACT_DETAILS.phones.map((phone) => (
                      <a key={phone} href={`tel:${cleanPhone(phone)}`} className="flex items-center gap-2 text-[15px] text-[#261a10] transition hover:text-[#b86654]">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />{phone}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#8a6400]"><Mail className="h-4 w-4" /> Email</p>
                  <div className="space-y-2">
                    {CONTACT_DETAILS.emails.map((email) => (
                      <a key={email} href={`mailto:${email}`} className="flex items-center gap-2 text-[15px] text-[#261a10] transition hover:text-[#b86654]">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-[#c9a84c]" />{email}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a6400]">Working Timing</p>
                  <div className="space-y-2 border border-[#e6d3a6] bg-white/40 p-4">
                    {WORKING_TIMINGS.map(([day, time]) => (
                      <div key={day} className="grid grid-cols-[92px_1fr] gap-3 text-[15px] leading-6 text-[#261a10] sm:grid-cols-[110px_1fr]">
                        <span className="font-semibold">{day}</span>
                        <span>{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {LOCATION_MAPS.map((location) => (
            <ScrollReveal key={location.title}>
              <article>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-2xl font-black"><MapPin className="h-5 w-5 text-[#b86654]" /> {location.title}</h2>
                  <a href={location.mapUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-black uppercase tracking-[0.08em] text-[#f36b5b] hover:underline">
                    Open in Maps <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="grid gap-5 lg:grid-cols-[0.38fr_0.62fr]">
                  <Image
                    src={location.routeImage}
                    alt={location.routeAlt}
                    width={900}
                    height={620}
                    className="w-full border border-[#ece5db] bg-white object-contain"
                  />
                  <iframe
                    title={location.title}
                    src={location.embedUrl}
                    className="h-96 w-full border border-[#ece5db]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </main>
  );
}