'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Image from 'next/image';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';

const STORES = [
  {
    name: 'Retail Outlet — Saket, New Delhi',
    type: 'Retail Outlet',
    address: [
      'FF-32, MGF Metropolitan Mall,',
      'Opposite Saket (Lawyers) Court, Distt. Centre Saket,',
      'New Delhi-110017, India',
    ],
    landmark: 'Nearest Metro Station — Malviya Nagar (Yellow Line)',
    hours: '11:00 AM to 8:00 PM',
    offDay: 'Wednesday',
    phones: ['+91-9871582404', '+91-9310172512', '+91-9891344074', '+91-7703934332', '+91-9810980550', '+91-7827095342'],
    mapQuery: 'MGF+Metropolitan+Mall+Saket+New+Delhi',
  },
  {
    name: 'Retail Outlet — Sultanpur, Delhi',
    type: 'Retail Outlet',
    address: [
      'PURE VEDIC GEMS PVT. LTD.',
      'Khasra No - 382, Balaji Building,',
      'CRC Design Centre Road, Shiv Shakti Temple, Sultanpur',
      'Nearby Sultanpur Metro Station, Delhi,',
      'Bharat, Pin - 110030',
    ],
    landmark: 'Nearby Sultanpur Metro Station',
    hours: '11:00 AM to 8:00 PM',
    offDay: 'Wednesday',
    phones: ['+91-9871582404', '+91-9310172512', '+91-9891344074', '+91-7703934332', '+91-9810980550', '+91-7827095342'],
    mapQuery: 'Sultanpur+Metro+Station+Delhi',
  },
  {
    name: 'Registered Address — Delhi',
    type: 'Registered Office',
    address: ['E-1566, JJ Tigri, New Delhi-110062, India'],
    landmark: null,
    hours: null,
    offDay: null,
    phones: [],
    mapQuery: 'JJ+Tigri+New+Delhi',
  },
  {
    name: 'Retail Outlet — Hounslow, United Kingdom',
    type: 'UK Retail',
    address: [
      'PURE VEDIC GEMS PVT. LTD.',
      'Juniper Court,',
      'Hanworth Road,',
      'Hounslow, TW3 3TL, United Kingdom',
    ],
    landmark: null,
    hours: 'By Appointment Only',
    offDay: null,
    phones: ['+44-7831491778'],
    mapQuery: 'Juniper+Court+Hanworth+Road+Hounslow+TW3+3TL',
  },
  {
    name: 'Registered Address — Milton Keynes, UK',
    type: 'UK Registered Office',
    address: [
      'PURE VEDIC GEMS PVT. LTD.',
      'Winstanley Ln,',
      'Shenley Lodge,',
      'Milton Keynes, MK5 7BT, UK',
    ],
    landmark: null,
    hours: null,
    offDay: null,
    phones: [],
    mapQuery: 'Winstanley+Ln+Shenley+Lodge+Milton+Keynes+MK5+7BT',
  },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    // In production, this would POST to /api/enquiry
    // For now, simulate submission
    await new Promise((r) => setTimeout(r, 1000));
    setStatus('sent');
    setFormState({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <>
      {/* Hero with background image */}
      <section className="relative overflow-hidden py-24 md:py-28 lg:py-32">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&h=800&fit=crop&q=80"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <ScrollReveal>
            <span className="font-body text-xs font-semibold uppercase tracking-[5px]" style={{ color: 'var(--accent)' }}>
              We&apos;re Here to Help
            </span>
            <h1 className="mt-3 font-heading text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Contact Us
            </h1>
            <OrnamentalDivider className="mx-auto mt-3 max-w-sm" gem="◆ 📞 ◆" />
            <p className="mx-auto mt-6 max-w-xl text-base text-white/70 md:text-lg">
              Have a question about gemstones, need astrological guidance, or
              want to visit our showroom? Reach out — our team is ready to
              assist you.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact form + Quick info */}
      <section className="bg-background py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Contact form — 3/5 width  */}
            <div className="lg:col-span-3">
              <h2 className="font-heading text-2xl font-bold text-primary md:text-3xl">
                Send Us a Message
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fill out the form below and we&apos;ll get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="h-11 w-full rounded-sm border border-border bg-background px-4 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email Address *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      className="h-11 w-full rounded-sm border border-border bg-background px-4 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Phone / WhatsApp
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={formState.phone}
                      onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                      className="h-11 w-full rounded-sm border border-border bg-background px-4 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="+91-XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Subject *
                    </label>
                    <select
                      id="contact-subject"
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="h-11 w-full rounded-sm border border-border bg-background px-4 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Select a subject</option>
                      <option value="gemstone-enquiry">Gemstone Enquiry</option>
                      <option value="consultation">Vedic Consultation</option>
                      <option value="custom-jewelry">Custom Jewelry</option>
                      <option value="order-issue">Order Issue</option>
                      <option value="return-exchange">Return / Exchange</option>
                      <option value="general">General Question</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="inline-flex h-11 items-center gap-2 rounded-sm bg-accent px-8 text-sm font-semibold uppercase tracking-wider text-accent-foreground shadow-md transition-all hover:bg-accent/90 disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </button>

                {status === 'sent' && (
                  <p className="text-sm font-medium text-green-600">
                    ✓ Your message has been sent. We&apos;ll get back to you shortly!
                  </p>
                )}
                {status === 'error' && (
                  <p className="text-sm font-medium text-destructive">
                    Something went wrong. Please try again or contact us directly.
                  </p>
                )}
              </form>
            </div>

            {/* Quick contact info — 2/5 width  */}
            <div className="lg:col-span-2">
              <h2 className="font-heading text-2xl font-bold text-primary md:text-3xl">
                Quick Contact
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Prefer a direct conversation? Reach us through:
              </p>

              <div className="mt-8 space-y-6">
                {/* Phone & WhatsApp */}
                <div className="rounded-sm border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span>📞</span> Phone & WhatsApp
                  </h3>
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <a href="tel:+919871582404" className="block hover:text-accent">+91-9871582404</a>
                    <a href="tel:+919310172512" className="block hover:text-accent">+91-9310172512</a>
                    <a href="tel:+919891344074" className="block hover:text-accent">+91-9891344074</a>
                    <a href="tel:+447831491778" className="block hover:text-accent">+44-7831491778 (UK)</a>
                  </div>
                </div>

                {/* Email */}
                <div className="rounded-sm border border-border bg-card p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span>✉️</span> Email
                  </h3>
                  <a
                    href="mailto:purevedicgems@gmail.com"
                    className="mt-2 block text-sm text-muted-foreground hover:text-accent"
                  >
                    purevedicgems@gmail.com
                  </a>
                </div>

                {/* WhatsApp CTA */}
                <a
                  href="https://wa.me/919871582404?text=Hello%20PureVedicGems%2C%20I%20have%20a%20query."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-sm bg-[#25D366] py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#20BD5C]"
                >
                  <span>💬</span> Chat on WhatsApp
                </a>

                {/* Working hours */}
                <div className="rounded-sm border border-accent/20 bg-accent/5 p-5">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span>🕐</span> Working Hours
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Monday – Tuesday, Thursday – Sunday
                  </p>
                  <p className="text-sm font-medium text-primary">
                    11:00 AM to 8:00 PM (IST)
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Weekly Off: Wednesday
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Locations */}
      <section className="bg-secondary/30 py-24 md:py-28 lg:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <span className="font-body text-xs font-semibold uppercase tracking-[5px] text-accent">
              Visit Us
            </span>
            <h2 className="mt-3 font-heading text-3xl font-bold text-primary md:text-4xl">
              Our Locations
            </h2>
            <OrnamentalDivider className="mx-auto mt-2 max-w-sm" gem="◆ 📍 ◆" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {STORES.filter((s) => s.hours).map((store) => (
              <div
                key={store.name}
                className="group rounded-sm border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-accent/30 hover:shadow-md"
              >
                {/* Type badge */}
                <span className="inline-block rounded-sm bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                  {store.type}
                </span>

                <h3 className="mt-3 font-heading text-base font-semibold text-primary">
                  {store.name}
                </h3>

                <div className="mt-3 space-y-0.5 text-sm text-muted-foreground">
                  {store.address.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>

                {store.landmark && (
                  <p className="mt-2 text-xs text-accent">📍 {store.landmark}</p>
                )}

                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">Hours:</span>{' '}
                    {store.hours}
                  </p>
                  {store.offDay && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-primary">Closed:</span>{' '}
                      {store.offDay}
                    </p>
                  )}
                </div>

                {store.phones.length > 0 && (
                  <div className="mt-3">
                    <a
                      href={`tel:${store.phones[0].replace(/[^+\d]/g, '')}`}
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      {store.phones[0]}
                    </a>
                  </div>
                )}

                {/* Map link */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${store.mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-accent transition-colors hover:text-primary"
                >
                  View on Map →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
