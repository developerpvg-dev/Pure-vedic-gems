'use client';

import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Clock, Diamond, Globe, Headphones, Mail, Phone, Send, Shield } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import {
  DELHI_MAP_EMBED,
  DELHI_MAP_URL,
  OFFICE_LOCATIONS,
} from '@/lib/constants/company-addresses';
import './contact-page.css';

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

const INDIA_PHONES = [
  '+91 9871582404',
  '+91 9310172512',
  '+91 9891344074',
  '+91 7703934332',
  '+91 9810980550',
  '+91 7827095342',
] as const;

const UK_PHONE = '+44 7831 491778';

const CONTACT_EMAILS = [
  'info@purevedicgems.in',
  'info@purevedicgems.com',
  'purevedicgems@gmail.com',
] as const;

const WORKING_TIMINGS = [
  ['Monday', '11:00 am – 8:00 pm'],
  ['Tuesday', '11:00 am – 8:00 pm'],
  ['Wednesday', 'Closed'],
  ['Thursday', '11:00 am – 8:00 pm'],
  ['Friday', '11:00 am – 8:00 pm'],
  ['Saturday', '11:00 am – 8:00 pm'],
  ['Sunday', '11:00 am – 8:00 pm'],
] as const;

const TRUST_BADGES = [
  { icon: Shield, title: 'Certified Natural Gems', copy: '100% authentic & lab certified' },
  { icon: Diamond, title: 'Trusted Since 1937', copy: 'Four generations of expertise' },
  { icon: Headphones, title: 'Expert Guidance', copy: 'Personalized gem consultation' },
  { icon: Globe, title: 'Global Presence', copy: 'Serving clients worldwide' },
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
    <main className="pvg-contact-page min-h-screen overflow-hidden bg-[#faf8f4] pb-20 pt-28 font-body text-[#15110d]">

      <section className="px-4 pb-6 pt-10 sm:px-6 lg:pt-14" aria-labelledby="contact-hero-heading">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-0 flex flex-col items-center justify-center">
            <h1 className="section-title" id="contact-hero-heading">
              Contact Us
            </h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Reach out to our team — we respond within 24 hours on business days.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="pvg-contact-main" aria-label="Contact form and reach us">
        <div className="pvg-contact-grid">
          <ScrollReveal>
            <article className="pvg-contact-card pvg-contact-form-card">
              <div className="pvg-contact-form-head">
                <div className="pvg-contact-form-icon" aria-hidden="true">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h2>Send Us a Message</h2>
                  <p>Share your query and we&apos;ll get back to you shortly.</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="pvg-contact-form">
                <input
                  required
                  maxLength={200}
                  placeholder="Name *"
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  className="pvg-contact-field"
                />
                <input
                  required
                  type="email"
                  maxLength={255}
                  placeholder="Email *"
                  value={formState.email}
                  onChange={(event) => setFormState({ ...formState, email: event.target.value })}
                  className="pvg-contact-field"
                />
                <div className="pvg-contact-phone-row">
                  <div className="pvg-contact-select-wrap">
                    <select
                      value={formState.countryCode}
                      onChange={(event) => setFormState({ ...formState, countryCode: event.target.value })}
                      className="pvg-contact-select"
                      aria-label="Country code"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.flag} {c.dial} {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="pvg-contact-select-caret" aria-hidden="true">▾</span>
                  </div>
                  <input
                    maxLength={20}
                    placeholder="Phone number"
                    value={formState.phone}
                    onChange={(event) => setFormState({ ...formState, phone: event.target.value })}
                    className="pvg-contact-field"
                  />
                </div>
                <textarea
                  required
                  rows={6}
                  maxLength={5000}
                  placeholder="Your message *"
                  value={formState.message}
                  onChange={(event) => setFormState({ ...formState, message: event.target.value })}
                  className="pvg-contact-textarea"
                />
                <button type="submit" disabled={status === 'sending'} className="pvg-contact-submit">
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                  <Send className="h-4 w-4" />
                </button>
                {status === 'sent' ? (
                  <p className="pvg-contact-status pvg-contact-status--ok">Message sent. We will get back to you shortly.</p>
                ) : null}
                {status === 'error' ? (
                  <p className="pvg-contact-status pvg-contact-status--err">Could not send right now. Please call or email us directly.</p>
                ) : null}
              </form>
            </article>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <aside className="pvg-contact-card pvg-contact-reach-card" aria-label="Phone, email and hours">
              <h2 className="pvg-contact-reach-title">Reach Us Directly</h2>

              <div className="pvg-contact-reach-block">
                <p className="pvg-contact-reach-label">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  India
                </p>
                <div className="pvg-contact-phone-grid">
                  {INDIA_PHONES.map((phone) => (
                    <a key={phone} href={`tel:${cleanPhone(phone)}`}>
                      {phone}
                    </a>
                  ))}
                </div>
              </div>

              <div className="pvg-contact-reach-block">
                <p className="pvg-contact-reach-label">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  United Kingdom
                </p>
                <a href={`tel:${cleanPhone(UK_PHONE)}`} className="pvg-contact-reach-single">
                  {UK_PHONE}
                </a>
              </div>

              <div className="pvg-contact-reach-block">
                <p className="pvg-contact-reach-label">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Email
                </p>
                <div className="pvg-contact-reach-list">
                  {CONTACT_EMAILS.map((email) => (
                    <a key={email} href={`mailto:${email}`}>
                      {email}
                    </a>
                  ))}
                </div>
              </div>

              <div className="pvg-contact-reach-block">
                <p className="pvg-contact-reach-label">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Working Hours
                </p>
                <div className="pvg-contact-hours-box">
                  {WORKING_TIMINGS.map(([day, time]) => (
                    <div key={day} className="pvg-contact-hours-row">
                      <span>{day}</span>
                      <span>{time}</span>
                    </div>
                  ))}
                </div>
                <p className="pvg-contact-reach-note">UK office visits are by appointment only.</p>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </section>

      <section className="pvg-contact-locations" aria-labelledby="contact-locations-heading">
        <div className="pvg-contact-locations-inner">
          <div className="section-head">
            <h2 className="section-title" id="contact-locations-heading">
              Our Locations
            </h2>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Three offices across India and the United Kingdom
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
          </div>

          <div className="pvg-contact-location-grid">
            {OFFICE_LOCATIONS.map((location, index) => (
              <ScrollReveal key={location.id} delay={index * 60}>
                <article className="pvg-contact-card pvg-contact-location-card">
                  <div className="pvg-contact-location-photo-wrap">
                    <Image
                      src={location.photo}
                      alt=""
                      fill
                      className="pvg-contact-location-photo"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <span className="pvg-contact-location-flag" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={location.flag} alt="" width={22} height={15} style={{ objectFit: 'cover', borderRadius: '2px' }} />
                    </span>
                  </div>

                  <div className="pvg-contact-location-body">
                    <header className="pvg-contact-location-head">
                      <h3>{location.title}</h3>
                      <p>{location.region}</p>
                    </header>

                    {location.addresses.map((block) => (
                      <div key={block.label} className="pvg-contact-addr-block">
                        <p className="pvg-contact-addr-label">{block.label}</p>
                        <address>
                          {block.lines.map((line) => (
                            <span key={line}>
                              {line}
                              <br />
                            </span>
                          ))}
                        </address>
                      </div>
                    ))}

                    {location.landmark ? (
                      <p className="pvg-contact-location-landmark">{location.landmark}</p>
                    ) : null}

                    <p className="pvg-contact-location-hours">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {location.hours}
                    </p>

                    <a href={location.mapUrl} target="_blank" rel="noreferrer" className="pvg-contact-link">
                      Get Directions <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pvg-contact-trust" aria-label="Why customers trust Pure Vedic Gems">
        <div className="pvg-contact-trust-grid">
          {TRUST_BADGES.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <ScrollReveal key={badge.title} delay={index * 50}>
                <div className="pvg-contact-trust-item">
                  <div className="pvg-contact-trust-icon" aria-hidden="true">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <strong>{badge.title}</strong>
                    <span>{badge.copy}</span>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      <section className="pvg-contact-maps" aria-labelledby="contact-map-heading">
        <div className="pvg-contact-maps-inner">
          <ScrollReveal>
            <article className="pvg-contact-map-block">
              <div className="section-head !mb-6">
                <h2 className="section-title" id="contact-map-heading">
                  Saket Showroom — Directions
                </h2>
                <div className="section-rule-center" style={{ margin: '15px auto 5px' }} aria-hidden="true" />
              </div>
              <div className="pvg-contact-map-actions">
                <a href={DELHI_MAP_URL} target="_blank" rel="noreferrer" className="pvg-contact-link">
                  Open in Maps <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="pvg-contact-map-grid">
                <Image
                  src="/legacy/contact/delhi-location-map.jpg"
                  alt="Route map to the Saket retail outlet at MGF Metropolitan Mall"
                  width={900}
                  height={620}
                  className="pvg-contact-map-route"
                />
                <iframe
                  title="Saket showroom map"
                  src={DELHI_MAP_EMBED}
                  className="pvg-contact-map-embed"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </article>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}
