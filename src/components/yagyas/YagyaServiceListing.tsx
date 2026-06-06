'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Award,
  BadgeCheck,
  CalendarCheck,
  CheckCircle,
  Flame,
  LockKeyhole,
  Star,
  UserRoundCheck,
  X,
} from 'lucide-react';

export interface YagyaListItem {
  id: string;
  slug: string;
  name: string;
  short_desc: string | null;
  description: string | null;
  benefits: string[];
  price: number;
  image_url: string | null;
  planet: string | null;
}

function formatInr(amount: number) {
  if (!amount) return 'Rs 0';
  return `Rs ${Number(amount).toLocaleString('en-IN')}`;
}

export function YagyaServiceListing({ yagyas }: { yagyas: YagyaListItem[] }) {
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const detailsYagya = yagyas.find((y) => y.id === detailsId) ?? null;

  return (
    <div className="bg-[#fbf7ef]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-10 lg:pt-36">
        <div className="text-center">
          <h1 className="text-2xl font-semibold leading-snug text-slate-800 sm:text-3xl">
            Vedic Yagyas &amp; Poojas
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
            Authentic Vedic fire rituals performed on your behalf by learned pandits as per your gotra and
            rashi. Browse the yagyas, read the details, then buy with secure Razorpay payment.
          </p>
        </div>

        {yagyas.length === 0 ? (
          <div className="mx-auto mt-10 max-w-2xl rounded-lg border border-brand-border bg-white px-6 py-12 text-center shadow-[0_18px_54px_rgba(68,35,12,0.06)]">
            <p className="font-semibold text-brand-primary">Our yagya catalogue is being updated.</p>
            <p className="mt-2 text-sm text-brand-muted">
              Please check back shortly or contact the PureVedicGems team.
            </p>
          </div>
        ) : (
          <>
            <section
              className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              aria-label="Yagya catalogue"
            >
              {yagyas.map((yagya) => (
                <article
                  key={yagya.id}
                  className="relative flex flex-col rounded-xl border border-[#7A1515]/15 bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  {/* 1:1 square image */}
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-[#fff7eb]">
                    {yagya.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={yagya.image_url}
                        alt={yagya.name}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Flame className="h-8 w-8 text-[#7A1515]" />
                      </div>
                    )}
                  </div>

                  {/* Planet label */}
                  {yagya.planet && (
                    <div className="mt-2 flex items-center gap-1">
                      <Star className="h-3 w-3 shrink-0 text-[#7A1515]" />
                      <span className="truncate text-[10px] font-medium text-[#7A1515]">{yagya.planet}</span>
                    </div>
                  )}

                  <h2 className="mt-0.5 text-[12px] font-medium leading-4 text-slate-700">{yagya.name}</h2>
                  <p className="mt-1 text-[13px] font-semibold text-[#7A1515]">{formatInr(yagya.price)}</p>

                  <div className="mt-2 flex flex-col gap-1">
                    <Link
                      href={`/vedic-yagyas/${yagya.slug}/buy`}
                      className="w-full rounded-md border border-[#7A1515] bg-[#7A1515] px-2 py-1 text-center text-[11px] font-medium text-white transition hover:bg-[#5f1010]"
                    >
                      Buy Now
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDetailsId(yagya.id)}
                      className="w-full rounded-md border border-[#7A1515]/30 bg-white px-2 py-1 text-[11px] font-medium text-[#7A1515] transition hover:bg-[#fff7eb]"
                    >
                      Read More
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <TrustStrip />
          </>
        )}
      </div>

      {detailsYagya && (
        <YagyaDetailsDialog yagya={detailsYagya} onClose={() => setDetailsId(null)} />
      )}
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: Award, label: 'Authentic Vedic Rituals', tone: 'bg-[#FCE7C8] text-[#9A4A05]' },
    { icon: LockKeyhole, label: 'Sankalp in Your Name & Gotra', tone: 'bg-[#DDEBFF] text-[#1D4ED8]' },
    { icon: CalendarCheck, label: 'Auspicious Muhurat', tone: 'bg-[#DCFCE7] text-[#15803D]' },
    { icon: UserRoundCheck, label: 'Learned Vedic Pandits', tone: 'bg-[#FFE4E6] text-[#BE123C]' },
    { icon: BadgeCheck, label: 'Photos & Recordings Shared', tone: 'bg-[#FEF3C7] text-[#A16207]' },
  ];

  return (
    <div
      className="mt-8 rounded-2xl border border-[#E2D3B6] bg-white p-4 shadow-[0_18px_42px_rgba(61,43,31,0.07)]"
      aria-label="Service assurances"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex min-h-20 items-center gap-3 rounded-xl border border-[#F0DFC0] bg-linear-to-br from-white to-[#fff7e8] p-3 shadow-[0_10px_22px_rgba(61,43,31,0.05)]"
          >
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.tone}`}>
              <item.icon className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <span className="text-[12px] font-black leading-5 text-[#4A3328]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function YagyaDetailsDialog({ yagya, onClose }: { yagya: YagyaListItem; onClose: () => void }) {
  const paragraphs = (yagya.description ?? yagya.short_desc ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7A1515]">Yagya Details</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{yagya.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close yagya details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[220px_minmax(0,1fr)]">
          {/* Image panel */}
          <div className="grid min-h-56 place-items-center rounded-lg bg-[#fff7eb]">
            {yagya.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={yagya.image_url}
                alt={yagya.name}
                className="max-h-52 w-full object-contain p-3"
              />
            ) : (
              <Flame className="h-16 w-16 text-[#7A1515]" />
            )}
          </div>

          {/* Details panel */}
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {yagya.planet && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7eb] px-3 py-1 text-xs font-black text-[#7A1515]">
                  <Star className="h-3.5 w-3.5" />
                  {yagya.planet}
                </span>
              )}
  
            </div>

            <p className="text-3xl font-black text-[#7A1515]">{formatInr(yagya.price)}</p>

            {paragraphs.length > 0 && (
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            )}

            {yagya.benefits.length > 0 && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {yagya.benefits.map((b) => (
                  <p key={b} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1515]" />
                    {b}
                  </p>
                ))}
              </div>
            )}

            <Link
              href={`/vedic-yagyas/${yagya.slug}/buy`}
              className="mt-6 block w-full rounded-lg border border-[#7A1515] bg-[#7A1515] px-5 py-3 text-center text-sm font-black text-white transition hover:bg-[#5f1010]"
            >
              Buy This Yagya
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
