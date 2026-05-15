'use client';

import { useState, type ComponentType, type FormEvent } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CalendarClock,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

type IconType = ComponentType<{ className?: string }>;
type SubmitStatus = 'idle' | 'sending' | 'sent' | 'error';

const CONTACT_METHODS: Array<{ icon: IconType; title: string; value: string; href: string; note: string }> = [
  { icon: Phone, title: 'India phone', value: '+91 9310172512', href: 'tel:+919310172512', note: 'Fastest for store visits, order support, and urgent guidance' },
  { icon: MessageCircle, title: 'WhatsApp', value: '+91 9310172512', href: 'https://wa.me/919310172512', note: 'Share product links, birth details, or appointment requests' },
  { icon: Phone, title: 'UK phone', value: '+44 7831 491778', href: 'tel:+447831491778', note: 'Appointment-based support for UK clients' },
  { icon: Mail, title: 'Email', value: 'info@purevedicgems.com', href: 'mailto:info@purevedicgems.com', note: 'For detailed enquiries, documents, and follow-ups' },
];

const SUBJECTS = [
  'Gemstone recommendation',
  'Rudraksha guidance',
  'Custom jewellery',
  'Energization or puja',
  'Store appointment',
  'Existing order support',
  'Wholesale or export enquiry',
] as const;

const STORES = [
  {
    name: 'Delhi Retail Outlet',
    type: 'Retail, wholesale and export',
    address: ['FF-32, MGF Metropolitan Mall', 'Opposite Saket Court, District Centre Saket', 'New Delhi - 110017, India'],
    landmark: 'Nearest metro: Malviya Nagar, Yellow Line',
    hours: '11:00 AM to 8:00 PM',
    offDay: 'Wednesday',
    phones: ['+91 9871582404', '+91 9310172512', '+91 9891344074', '+91 7703934332'],
    mapQuery: 'FF-32 MGF Metropolitan Mall Saket New Delhi',
  },
  {
    name: 'Vedic Sciences Research Centre',
    type: 'Noida research and energization centre',
    address: ['6th Floor, East Avenue Grand Society', 'Commercial Complex, Main Dadri - Barola Road', 'Sector 49, Noida, U.P. 201301'],
    landmark: 'Nearest metro: Sector 76, Aqua Line',
    hours: '10:30 AM to 7:30 PM',
    offDay: 'Wednesday',
    phones: ['+91 9871582404', '+91 9310172512', '+91 9891344074', '+91 7703934332'],
    mapQuery: 'East Avenue Grand Society Sector 49 Noida',
  },
  {
    name: 'UK Appointment Support',
    type: 'Appointment only',
    address: ['95 Juniper Court', 'Hanworth Road', 'Hounslow TW3 3TL, United Kingdom'],
    landmark: 'Visits are handled only by prior appointment',
    hours: 'Only on appointment',
    offDay: null,
    phones: ['+44 7831 491778'],
    mapQuery: '95 Juniper Court Hanworth Road Hounslow TW3 3TL',
  },
] as const;

const VISIT_NOTES = [
  'Carry old certificates, gemstone reports, or product photos if you need verification help.',
  'For gemstone or Rudraksha recommendation, keep accurate birth details ready.',
  'For jewellery work, share ring size, preferred metal, budget, and wearing purpose.',
  'For energization, confirm gotra, rashi, wearer name, and required ritual level in advance.',
] as const;

const initialForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

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
          subject: formState.subject || 'Contact enquiry',
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
    <main className="pvg-simple-page font-body bg-white text-[#1f2933]">
      <section className="relative isolate overflow-hidden bg-[#2c0404] px-4 pb-16 pt-32 text-white sm:px-6 lg:pb-24 lg:pt-40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(212,168,67,0.25),transparent_30%),radial-gradient(circle_at_86%_14%,rgba(255,255,255,0.12),transparent_26%),linear-gradient(135deg,#2c0404_0%,#5d0e0e_46%,#130707_100%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <ScrollReveal>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d4a843]">Contact Pure Vedic Gems</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">Talk to the team before you buy</h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/76 md:text-lg">
                Reach Pure Vedic Gems for certified gemstones, original Rudrakshas, custom jewellery, Vedic energization, store appointments, or order help. The enquiry form below submits directly to the site team.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="grid gap-3 sm:grid-cols-2">
              {CONTACT_METHODS.map((method) => (
                <a key={method.title} href={method.href} target={method.href.startsWith('http') ? '_blank' : undefined} rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="group rounded-2xl border border-white/12 bg-white/8 p-5 transition hover:border-[#d4a843] hover:bg-white/12">
                  <method.icon className="h-6 w-6 text-[#d4a843]" aria-hidden="true" />
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-white/58">{method.title}</p>
                  <p className="mt-1 text-lg font-black text-white group-hover:text-[#f0c96a]">{method.value}</p>
                  <p className="mt-2 text-xs leading-5 text-white/62">{method.note}</p>
                </a>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <ScrollReveal>
            <div className="rounded-3xl border border-[#ead7ad] bg-white p-5 shadow-[0_24px_70px_rgba(61,43,31,0.1)] sm:p-7 lg:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ead7ad] pb-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.26em] text-[#b8861e]">Enquiry form</p>
                  <h2 className="mt-3 text-3xl font-black text-[#2c0404] md:text-4xl">Send your question</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b5b4e]">Use this form for recommendations, appointments, jewellery work, energization, order support, or international enquiries.</p>
                </div>
                <BadgeCheck className="h-9 w-9 text-[#7a1515]" aria-hidden="true" />
              </div>

              <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#6b5b4e]">Name *</label>
                    <input
                      id="contact-name"
                      required
                      maxLength={200}
                      value={formState.name}
                      onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                      className="w-full rounded-xl border border-[#d8c49c] bg-[#fffaf0] px-4 py-3 text-sm text-[#2c0404] outline-none transition focus:border-[#7a1515] focus:bg-white focus:ring-4 focus:ring-[#d4a843]/20"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#6b5b4e]">Email *</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      maxLength={255}
                      value={formState.email}
                      onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                      className="w-full rounded-xl border border-[#d8c49c] bg-[#fffaf0] px-4 py-3 text-sm text-[#2c0404] outline-none transition focus:border-[#7a1515] focus:bg-white focus:ring-4 focus:ring-[#d4a843]/20"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="contact-phone" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#6b5b4e]">Phone / WhatsApp</label>
                    <input
                      id="contact-phone"
                      maxLength={20}
                      value={formState.phone}
                      onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
                      className="w-full rounded-xl border border-[#d8c49c] bg-[#fffaf0] px-4 py-3 text-sm text-[#2c0404] outline-none transition focus:border-[#7a1515] focus:bg-white focus:ring-4 focus:ring-[#d4a843]/20"
                      placeholder="+91 9310172512"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#6b5b4e]">Subject</label>
                    <select
                      id="contact-subject"
                      value={formState.subject}
                      onChange={(event) => setFormState({ ...formState, subject: event.target.value })}
                      className="w-full rounded-xl border border-[#d8c49c] bg-[#fffaf0] px-4 py-3 text-sm text-[#2c0404] outline-none transition focus:border-[#7a1515] focus:bg-white focus:ring-4 focus:ring-[#d4a843]/20"
                    >
                      <option value="">Select a topic</option>
                      {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-[#6b5b4e]">Message *</label>
                  <textarea
                    id="contact-message"
                    required
                    rows={7}
                    maxLength={5000}
                    value={formState.message}
                    onChange={(event) => setFormState({ ...formState, message: event.target.value })}
                    className="w-full rounded-xl border border-[#d8c49c] bg-[#fffaf0] px-4 py-3 text-sm text-[#2c0404] outline-none transition focus:border-[#7a1515] focus:bg-white focus:ring-4 focus:ring-[#d4a843]/20"
                    placeholder="Tell us what you need help with. For recommendations, mention birth date, time, place, concern, budget, and whether the wearer has already used gemstones or Rudraksha."
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#7a1515] px-7 text-sm font-black uppercase tracking-[0.12em] text-white shadow-[0_16px_34px_rgba(122,21,21,0.24)] transition hover:bg-[#4d0a0a] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {status === 'sending' ? 'Sending...' : 'Send Enquiry'}
                  </button>
                  {status === 'sent' ? <p className="text-sm font-black text-[#0f8f52]">Message sent. The team will get back to you shortly.</p> : null}
                  {status === 'error' ? <p className="text-sm font-black text-[#a12332]">Could not send right now. Please call or WhatsApp the team directly.</p> : null}
                </div>
              </form>
            </div>
          </ScrollReveal>

          <aside className="space-y-5">
            <ScrollReveal direction="right">
              <div className="rounded-3xl bg-[#2c0404] p-6 text-white shadow-[0_24px_60px_rgba(20,2,2,0.18)] md:p-7">
                <Sparkles className="h-9 w-9 text-[#d4a843]" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black">Faster help</h2>
                <p className="mt-3 text-sm leading-7 text-white/72">For urgent store visits, availability, order status, or a quick product question, WhatsApp and phone are usually faster than email.</p>
                <div className="mt-5 grid gap-3">
                  <a href="tel:+919310172512" className="rounded-2xl border border-white/12 bg-white/8 p-4 text-sm font-bold text-white transition hover:border-[#d4a843]">Call India: +91 9310172512</a>
                  <a href="https://wa.me/919310172512" target="_blank" rel="noopener noreferrer" className="rounded-2xl bg-[#0f8f52] p-4 text-sm font-black text-white transition hover:bg-[#0b7442]">Open WhatsApp Chat</a>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="rounded-3xl border border-[#e2d3b6] bg-white p-6 shadow-[0_18px_42px_rgba(61,43,31,0.08)] md:p-7">
                <Clock className="h-9 w-9 text-[#7a1515]" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black text-[#2c0404]">Visiting hours</h2>
                <div className="mt-4 space-y-3 text-sm leading-6 text-[#6b5b4e]">
                  <p><strong className="text-[#2c0404]">Delhi:</strong> 11:00 AM to 8:00 PM</p>
                  <p><strong className="text-[#2c0404]">Noida:</strong> 10:30 AM to 7:30 PM</p>
                  <p><strong className="text-[#2c0404]">Weekly off:</strong> Wednesday</p>
                  <p><strong className="text-[#2c0404]">UK:</strong> appointment only</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="rounded-3xl border border-[#d4a843]/40 bg-[#fff7e8] p-6 shadow-[0_18px_42px_rgba(61,43,31,0.06)] md:p-7">
                <ShieldCheck className="h-9 w-9 text-[#7a1515]" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black text-[#2c0404]">No franchise warning</h2>
                <p className="mt-3 text-sm leading-7 text-[#6b5b4e]">Pure Vedic Gems states that it has no other branches except the official contact locations and has not granted franchise rights to anyone using its name or similar names.</p>
              </div>
            </ScrollReveal>
          </aside>
        </div>
      </section>

      <section className="bg-[#2c0404] px-4 py-16 text-white sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d4a843]">Official contact points</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Visit, call, or book an appointment</h2>
            <OrnamentalDivider className="mx-auto mt-2 max-w-xs" gem="◆" />
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">Choose the right location for retail purchase, certification guidance, product pickup, appointment support, or in-person Vedic consultation.</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {STORES.map((store) => (
              <article key={store.name} className="flex h-full flex-col rounded-3xl border border-white/12 bg-white/6 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.16)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-[#d4a843] p-3 text-[#2c0404]">
                    <Store className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="rounded-full border border-[#d4a843]/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#f0c96a]">{store.type}</span>
                </div>
                <h3 className="mt-5 text-lg font-black text-white">{store.name}</h3>
                <div className="mt-3 space-y-1 text-sm leading-6 text-white/68">
                  {store.address.map((line) => <p key={line}>{line}</p>)}
                </div>
                <p className="mt-3 flex gap-2 text-xs leading-5 text-[#f0c96a]"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{store.landmark}</p>
                <div className="mt-5 grid gap-2 border-t border-white/10 pt-4 text-sm text-white/72">
                  <p><strong className="text-white">Hours:</strong> {store.hours}</p>
                  {store.offDay ? <p><strong className="text-white">Closed:</strong> {store.offDay}</p> : null}
                  <a href={`tel:${cleanPhone(store.phones[0])}`} className="font-black text-[#f0c96a] hover:text-white">{store.phones[0]}</a>
                </div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.mapQuery)}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#d4a843] transition hover:text-white">
                  <Navigation className="h-4 w-4" aria-hidden="true" /> View on Map
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <ScrollReveal>
            <div className="h-full rounded-3xl border border-[#ead7ad] bg-white p-7 shadow-[0_20px_56px_rgba(61,43,31,0.08)]">
              <CalendarClock className="h-9 w-9 text-[#7a1515]" aria-hidden="true" />
              <h2 className="mt-5 text-3xl font-black text-[#2c0404]">Before you visit</h2>
              <p className="mt-3 text-sm leading-7 text-[#6b5b4e]">A little preparation helps the team give faster, more accurate guidance.</p>
              <div className="mt-6 grid gap-3">
                {VISIT_NOTES.map((note) => (
                  <p key={note} className="flex gap-3 rounded-2xl bg-[#fff7e8] p-4 text-sm font-bold leading-6 text-[#4a3328]"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#7a1515]" aria-hidden="true" />{note}</p>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="flex h-full flex-col justify-between rounded-3xl bg-[#f1deb2] p-7 shadow-[0_20px_56px_rgba(61,43,31,0.08)] md:p-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#7a1515]">Need recommendation first?</p>
                <h2 className="mt-3 text-3xl font-black text-[#2c0404] md:text-4xl">Do not buy blindly if the remedy is for astrology.</h2>
                <p className="mt-4 text-sm leading-7 text-[#5c4936]">The old site repeatedly warns against unsuitable, treated, fake, tampered, or manipulated remedies. Start with a recommendation if you are unsure about the stone, bead, metal, finger, mantra, or ritual.</p>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/consultation" className="inline-flex min-h-12 items-center rounded-xl bg-[#7a1515] px-6 text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#4d0a0a]">Book Consultation</Link>
                <a href="mailto:purevedicgems@gmail.com" className="inline-flex min-h-12 items-center rounded-xl border border-[#7a1515]/20 bg-white/55 px-6 text-sm font-black text-[#2c0404] transition hover:border-[#7a1515]">purevedicgems@gmail.com</a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}