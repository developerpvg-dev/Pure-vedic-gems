import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderRecord, OrderItemRecord } from '@/lib/types/order';
import {
  ArrowLeft, Package, Truck, CreditCard, Zap, MapPin, Phone, Mail,
  User, FileText, Hash, Calendar, Tag, ExternalLink,
  Settings,
} from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────────────────

function fmt(amount: number | null | undefined) {
  const n = amount ?? 0;
  return '\u20B9' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function cap(s: string | null | undefined) {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

const METAL_LABELS: Record<string, string> = {
  gold_22k:   '22K Gold',
  gold_18k:   '18K Gold',
  silver_925: '925 Sterling Silver',
  panchdhatu: 'Panchdhatu',
  platinum:   'Platinum',
};

const SETTING_LABELS: Record<string, string> = {
  ring:     'Ring',
  pendant:  'Pendant',
  bracelet: 'Bracelet',
  loose:    'Loose (No Setting)',
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending_payment: 'bg-gray-100 text-gray-700',
  placed:          'bg-blue-100 text-blue-800',
  confirmed:       'bg-indigo-100 text-indigo-800',
  processing:      'bg-yellow-100 text-yellow-800',
  quality_check:   'bg-orange-100 text-orange-800',
  shipped:         'bg-purple-100 text-purple-800',
  delivered:       'bg-green-100 text-green-800',
  cancelled:       'bg-red-100 text-red-800',
  refunded:        'bg-pink-100 text-pink-800',
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  pending:    'bg-orange-100 text-orange-800',
  completed:  'bg-green-100 text-green-800',
  captured:   'bg-green-100 text-green-800',
  authorized: 'bg-blue-100 text-blue-800',
  failed:     'bg-red-100 text-red-800',
  refunded:   'bg-pink-100 text-pink-800',
};

// ── types ──────────────────────────────────────────────────────────────────

interface CustomerProfile {
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

interface FullConfig {
  id: string;
  setting_type: string | null;
  metal: string | null;
  ring_size: string | null;
  chain_length: string | null;
  gem_price: number | null;
  making_charge: number | null;
  metal_price: number | null;
  metal_weight_grams: number | null;
  gold_rate_per_gram: number | null;
  certification_fee: number | null;
  energization_fee: number | null;
  total_price: number | null;
  jewelry_designs: {
    name: string;
    setting_type: string;
    image_url: string | null;
    description: string | null;
  } | null;
  certification_labs: {
    name: string;
    full_name: string | null;
  } | null;
  energization_options: {
    name: string;
    description: string | null;
    duration: string | null;
  } | null;
}

// ── page ──────────────────────────────────────────────────────────────────

export const revalidate = 60;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: raw } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!raw) notFound();

  const o = raw as unknown as OrderRecord;

  // Registered users have null guest_* — fetch profile
  let profile: CustomerProfile | null = null;
  if (o.customer_id && (!o.guest_name || !o.guest_email)) {
    const { data } = await supabase
      .from('customer_profiles')
      .select('full_name, phone, email')
      .eq('id', o.customer_id)
      .single();
    profile = data as CustomerProfile | null;
  }

  const displayName  = o.guest_name  || profile?.full_name  || null;
  const displayEmail = o.guest_email || profile?.email      || null;
  const displayPhone = o.guest_phone || profile?.phone      || null;

  const addr  = o.shipping_address ?? {};
  const items: OrderItemRecord[] = Array.isArray(o.items) ? o.items : [];

  // Fetch full configurations for all items that have a configuration_id
  const configIds = items
    .map(i => i.configuration_id)
    .filter((cid): cid is string => !!cid);

  const configMap = new Map<string, FullConfig>();
  if (configIds.length > 0) {
    const { data: configs } = await supabase
      .from('product_configurations')
      .select(`
        id,
        setting_type,
        metal,
        ring_size,
        chain_length,
        gem_price,
        making_charge,
        metal_price,
        metal_weight_grams,
        gold_rate_per_gram,
        certification_fee,
        energization_fee,
        total_price,
        jewelry_designs ( name, setting_type, image_url, description ),
        certification_labs ( name, full_name ),
        energization_options ( name, description, duration )
      `)
      .in('id', configIds);

    if (configs) {
      for (const c of configs as unknown as FullConfig[]) {
        configMap.set(c.id, c);
      }
    }
  }

  const pricingLines: Array<{ label: string; value: number; sign: number }> = [
    { label: 'Subtotal',              value: o.subtotal,              sign: 1  },
    { label: 'Jewelry Charges',       value: o.jewelry_charges,       sign: 1  },
    { label: 'Metal Charges',         value: o.metal_charges,         sign: 1  },
    { label: 'Certification Charges', value: o.certification_charges, sign: 1  },
    { label: 'Energization Charges',  value: o.energization_charges,  sign: 1  },
    { label: 'Shipping',              value: o.shipping_cost,         sign: 1  },
    { label: 'GST (3%)',              value: o.gst_amount,            sign: 1  },
    {
      label: o.coupon_code ? `Discount (${o.coupon_code})` : 'Discount',
      value: o.discount,
      sign: -1,
    },
  ].filter(l => (l.value ?? 0) !== 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--pvg-border)] bg-white text-[var(--pvg-muted)] transition hover:bg-[var(--pvg-surface)] hover:text-[var(--pvg-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-[var(--pvg-primary)] sm:text-3xl">
              Order #{o.order_number}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--pvg-muted)]">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(o.created_at).toLocaleString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_STYLE[o.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {cap(o.status) ?? o.status}
          </span>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${PAYMENT_STATUS_STYLE[o.payment_status] ?? 'bg-gray-100 text-gray-700'}`}>
            Payment: {cap(o.payment_status) ?? o.payment_status}
          </span>
          {o.invoice_url && (
            <a
              href={o.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--pvg-border)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--pvg-primary)] transition hover:bg-[var(--pvg-gold-light)]"
            >
              <FileText className="h-3.5 w-3.5" />
              Invoice
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Grand Total',     value: fmt(o.total),             icon: CreditCard },
          { label: 'Items Ordered',   value: `${items.length} item${items.length !== 1 ? 's' : ''}`, icon: Package },
          { label: 'Payment Method',  value: cap(o.payment_method) ?? 'N/A', icon: Hash },
          { label: 'Shipping Method', value: cap(o.shipping_method) ?? 'Standard', icon: Truck },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)] p-4">
            <div className="flex items-center gap-2 text-[var(--pvg-muted)]">
              <s.icon className="h-4 w-4" />
              <p className="text-xs font-medium uppercase tracking-wide">{s.label}</p>
            </div>
            <p className="mt-2 text-xl font-bold text-[var(--pvg-primary)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main 2-column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Order Items */}
          <section className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)] px-5 py-3.5">
              <Package className="h-4 w-4 text-[var(--pvg-primary)]" />
              <h2 className="font-semibold text-[var(--pvg-primary)]">Order Items ({items.length})</h2>
            </div>

            {items.length === 0 ? (
              <p className="p-6 text-center text-sm text-[var(--pvg-muted)]">No items found</p>
            ) : (
              <div className="divide-y divide-[var(--pvg-border)]">
                {items.map((item: OrderItemRecord, idx: number) => {
                  const cfg = item.configuration_id ? configMap.get(item.configuration_id) : null;

                  return (
                    <div key={idx} className="p-4 sm:p-5">
                      {/* Top row: image + name + price */}
                      <div className="flex gap-4">
                        {item.image_url && (
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)]">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        )}
                        <div className="flex flex-1 flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--pvg-text)]">{item.name}</p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--pvg-muted)]">
                              {item.sku          && <span>SKU: <span className="font-medium">{item.sku}</span></span>}
                              {item.category     && <span>Category: <span className="font-medium">{item.category}</span></span>}
                              {item.carat_weight && <span>Weight: <span className="font-medium">{item.carat_weight} ct</span></span>}
                              {item.origin       && <span>Origin: <span className="font-medium">{item.origin}</span></span>}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="font-bold text-[var(--pvg-text)]">{fmt(item.line_total)}</p>
                            <p className="text-xs text-[var(--pvg-muted)]">
                              {fmt(item.unit_price)} x {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Full Configurator Details */}
                      {cfg ? (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
                          {/* Config header */}
                          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-100/60 px-4 py-2.5">
                            <Settings className="h-3.5 w-3.5 text-amber-700" />
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                              Jewelry Configuration
                            </p>
                            {cfg.setting_type && (
                              <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                {SETTING_LABELS[cfg.setting_type] ?? cap(cfg.setting_type)}
                              </span>
                            )}
                          </div>

                          <div className="p-4 space-y-4">
                            {/* Design info */}
                            {cfg.jewelry_designs && (
                              <div className="flex items-start gap-3">
                                {cfg.jewelry_designs.image_url && (
                                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-amber-200 bg-white">
                                    <Image
                                      src={cfg.jewelry_designs.image_url}
                                      alt={cfg.jewelry_designs.name}
                                      fill
                                      className="object-cover"
                                      sizes="56px"
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Design</p>
                                  <p className="mt-0.5 font-semibold text-[var(--pvg-text)]">{cfg.jewelry_designs.name}</p>
                                  <p className="text-xs text-[var(--pvg-muted)]">
                                    {SETTING_LABELS[cfg.jewelry_designs.setting_type] ?? cap(cfg.jewelry_designs.setting_type)}
                                  </p>
                                  {cfg.jewelry_designs.description && (
                                    <p className="mt-0.5 text-xs text-[var(--pvg-muted)] line-clamp-2">{cfg.jewelry_designs.description}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Key specs grid */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {cfg.metal && (
                                <div className="rounded-lg bg-white/70 px-3 py-2.5 border border-amber-100">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Metal</p>
                                  <p className="mt-0.5 text-sm font-semibold text-[var(--pvg-text)]">
                                    {METAL_LABELS[cfg.metal] ?? cap(cfg.metal)}
                                  </p>
                                </div>
                              )}
                              {cfg.ring_size && (
                                <div className="rounded-lg bg-white/70 px-3 py-2.5 border border-amber-100">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Ring Size</p>
                                  <p className="mt-0.5 text-sm font-semibold text-[var(--pvg-text)]">{cfg.ring_size}</p>
                                </div>
                              )}
                              {cfg.chain_length && (
                                <div className="rounded-lg bg-white/70 px-3 py-2.5 border border-amber-100">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Chain Length</p>
                                  <p className="mt-0.5 text-sm font-semibold text-[var(--pvg-text)]">{cfg.chain_length}</p>
                                </div>
                              )}
                              {cfg.certification_labs && (
                                <div className="rounded-lg bg-white/70 px-3 py-2.5 border border-amber-100">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Certification</p>
                                  <p className="mt-0.5 text-sm font-semibold text-[var(--pvg-text)]">
                                    {cfg.certification_labs.name}
                                  </p>
                                  {cfg.certification_labs.full_name && (
                                    <p className="text-[10px] text-[var(--pvg-muted)]">{cfg.certification_labs.full_name}</p>
                                  )}
                                </div>
                              )}
                              {cfg.energization_options && (
                                <div className="rounded-lg bg-white/70 px-3 py-2.5 border border-amber-100 sm:col-span-2">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">Energization / Pooja</p>
                                  <p className="mt-0.5 text-sm font-semibold text-[var(--pvg-text)]">
                                    {cfg.energization_options.name}
                                  </p>
                                  {cfg.energization_options.duration && (
                                    <p className="text-[10px] text-[var(--pvg-muted)]">Duration: {cfg.energization_options.duration}</p>
                                  )}
                                  {cfg.energization_options.description && (
                                    <p className="text-[10px] text-[var(--pvg-muted)] line-clamp-2">{cfg.energization_options.description}</p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Pricing breakdown for this configuration */}
                            <div className="rounded-lg bg-white/80 border border-amber-100 overflow-hidden">
                              <p className="border-b border-amber-100 bg-amber-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                Configuration Price Breakdown
                              </p>
                              <div className="divide-y divide-amber-50 text-xs">
                                {[
                                  { label: 'Gem Price',          value: cfg.gem_price },
                                  { label: 'Making Charge',      value: cfg.making_charge },
                                  { label: 'Metal Price',        value: cfg.metal_price },
                                  { label: 'Certification Fee',  value: cfg.certification_fee },
                                  { label: 'Energization Fee',   value: cfg.energization_fee },
                                ].filter(l => (l.value ?? 0) > 0).map(l => (
                                  <div key={l.label} className="flex justify-between px-3 py-1.5 text-[var(--pvg-text)]">
                                    <span className="text-[var(--pvg-muted)]">{l.label}</span>
                                    <span className="font-medium">{fmt(l.value)}</span>
                                  </div>
                                ))}
                                {cfg.metal_weight_grams && cfg.gold_rate_per_gram ? (
                                  <div className="flex justify-between px-3 py-1.5 text-[10px] text-[var(--pvg-muted)] italic">
                                    <span>Metal: {cfg.metal_weight_grams}g at {fmt(cfg.gold_rate_per_gram)}/g</span>
                                    <span>{fmt(cfg.metal_price)}</span>
                                  </div>
                                ) : null}
                                <div className="flex justify-between bg-amber-50 px-3 py-2 font-bold text-amber-800">
                                  <span>Configuration Total</span>
                                  <span>{fmt(cfg.total_price)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Summary fallback if no structured data matches */}
                            {item.configuration_summary && !cfg.jewelry_designs && !cfg.metal && (
                              <p className="text-xs text-[var(--pvg-muted)] italic">{item.configuration_summary}</p>
                            )}
                          </div>
                        </div>
                      ) : item.configuration_summary ? (
                        /* Fallback: no config row in DB, show summary string */
                        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-xs border border-amber-200">
                          <p className="mb-1 flex items-center gap-1 font-semibold text-amber-700">
                            <Tag className="h-3 w-3" />
                            Configuration Summary
                          </p>
                          <p className="leading-relaxed text-amber-800">{item.configuration_summary}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Pricing Breakdown */}
          <section className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)] px-5 py-3.5">
              <CreditCard className="h-4 w-4 text-[var(--pvg-primary)]" />
              <h2 className="font-semibold text-[var(--pvg-primary)]">Order Price Breakdown</h2>
            </div>
            <div className="p-5">
              <div className="space-y-2.5 text-sm">
                {pricingLines.map(line => (
                  <div key={line.label} className="flex items-center justify-between text-[var(--pvg-text)]">
                    <span className={line.sign < 0 ? 'font-medium text-green-700' : ''}>{line.label}</span>
                    <span className={`font-medium ${line.sign < 0 ? 'text-green-700' : ''}`}>
                      {line.sign < 0 ? '- ' : '+ '}{fmt(line.value)}
                    </span>
                  </div>
                ))}
                <div className="border-t-2 border-[var(--pvg-primary)] pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[var(--pvg-primary)]">Grand Total</span>
                    <span className="text-xl font-bold text-[var(--pvg-primary)]">{fmt(o.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>


        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-5">

          {/* Customer Details */}
          <section className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)] px-5 py-3.5">
              <User className="h-4 w-4 text-[var(--pvg-primary)]" />
              <h2 className="font-semibold text-[var(--pvg-primary)]">Customer Details</h2>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Name</p>
                <p className="mt-0.5 font-semibold text-[var(--pvg-text)]">{displayName ?? 'Not provided'}</p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--pvg-muted)]" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Email</p>
                  <p className="mt-0.5 break-all font-medium text-[var(--pvg-text)]">{displayEmail ?? 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--pvg-muted)]" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Phone</p>
                  <p className="mt-0.5 font-medium text-[var(--pvg-text)]">{displayPhone ?? 'Not provided'}</p>
                </div>
              </div>
              {o.customer_id && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Account</p>
                  <p className="mt-0.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    Registered User
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Shipping Address */}
          <section className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)] px-5 py-3.5">
              <MapPin className="h-4 w-4 text-[var(--pvg-primary)]" />
              <h2 className="font-semibold text-[var(--pvg-primary)]">Shipping Address</h2>
            </div>
            <div className="p-4 text-sm leading-relaxed text-[var(--pvg-text)]">
              {displayName && <p className="font-semibold">{displayName}</p>}
              {addr.line1   && <p>{addr.line1}</p>}
              {addr.line2   && <p>{addr.line2}</p>}
              {(addr.city || addr.state || addr.pincode) && (
                <p>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
              )}
              {addr.country && <p>{addr.country}</p>}
              {!addr.line1 && !addr.city && (
                <p className="italic text-[var(--pvg-muted)]">No address recorded</p>
              )}
              {o.special_instructions && (
                <div className="mt-3 rounded-lg bg-[var(--pvg-bg)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pvg-muted)]">Special Instructions</p>
                  <p className="mt-1 text-xs leading-relaxed">{o.special_instructions}</p>
                </div>
              )}
            </div>
          </section>

          {/* Delivery / Tracking */}
          <section className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)] px-5 py-3.5">
              <Truck className="h-4 w-4 text-[var(--pvg-primary)]" />
              <h2 className="font-semibold text-[var(--pvg-primary)]">Delivery</h2>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Method</p>
                <p className="mt-0.5 font-medium text-[var(--pvg-text)]">{cap(o.shipping_method) ?? 'Standard'}</p>
              </div>
              {o.tracking_number && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Tracking Number</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <code className="rounded bg-[var(--pvg-bg)] px-2 py-1 font-mono text-xs">{o.tracking_number}</code>
                    {o.tracking_url && (
                      <a
                        href={o.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[var(--pvg-primary)] underline"
                      >
                        Track <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
              {o.estimated_delivery && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Est. Delivery</p>
                  <p className="mt-0.5 font-medium text-[var(--pvg-text)]">
                    {new Date(o.estimated_delivery).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {!o.tracking_number && !o.estimated_delivery && (
                <p className="text-xs italic text-[var(--pvg-muted)]">No tracking info yet</p>
              )}
            </div>
          </section>

          {/* Energization (order-level) */}
          {o.include_energization && (
            <section className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)]">
              <div className="flex items-center gap-2 border-b border-[var(--pvg-border)] bg-amber-50 px-5 py-3.5">
                <Zap className="h-4 w-4 text-amber-600" />
                <h2 className="font-semibold text-amber-700">Ceremony Details</h2>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Energization Type</p>
                  <p className="mt-0.5 font-semibold text-[var(--pvg-text)]">
                    {cap(o.energization_type) ?? 'Not specified'}
                  </p>
                </div>
                {o.ceremony_gotra && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Gotra</p>
                    <p className="mt-0.5 font-medium text-[var(--pvg-text)]">{o.ceremony_gotra}</p>
                  </div>
                )}
                {o.ceremony_dob && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Date of Birth</p>
                    <p className="mt-0.5 font-medium text-[var(--pvg-text)]">
                      {new Date(o.ceremony_dob).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                {o.ceremony_rashi && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Rashi</p>
                    <p className="mt-0.5 font-medium text-[var(--pvg-text)]">{o.ceremony_rashi}</p>
                  </div>
                )}
                {o.record_ceremony && (
                  <div className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                    Video recording of ceremony requested
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Payment Details */}
          <section className="overflow-hidden rounded-xl border border-[var(--pvg-border)] bg-[var(--pvg-surface)]">
            <div className="flex items-center gap-2 border-b border-[var(--pvg-border)] bg-[var(--pvg-bg-alt)] px-5 py-3.5">
              <CreditCard className="h-4 w-4 text-[var(--pvg-primary)]" />
              <h2 className="font-semibold text-[var(--pvg-primary)]">Payment Details</h2>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Method</p>
                  <p className="mt-0.5 font-medium text-[var(--pvg-text)]">{cap(o.payment_method) ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Status</p>
                  <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLE[o.payment_status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {cap(o.payment_status) ?? o.payment_status}
                  </span>
                </div>
              </div>
              {o.razorpay_order_id && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Razorpay Order ID</p>
                  <code className="mt-0.5 block break-all rounded bg-[var(--pvg-bg)] px-2 py-1 font-mono text-[11px] text-[var(--pvg-text)]">
                    {o.razorpay_order_id}
                  </code>
                </div>
              )}
              {o.razorpay_payment_id && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Payment ID</p>
                  <code className="mt-0.5 block break-all rounded bg-[var(--pvg-bg)] px-2 py-1 font-mono text-[11px] text-[var(--pvg-text)]">
                    {o.razorpay_payment_id}
                  </code>
                </div>
              )}
              {o.razorpay_signature && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Signature</p>
                  <code className="mt-0.5 block break-all rounded bg-[var(--pvg-bg)] px-2 py-1 font-mono text-[11px] text-[var(--pvg-text)]">
                    {o.razorpay_signature.slice(0, 32)}...
                  </code>
                </div>
              )}
              {o.invoice_number && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--pvg-muted)]">Invoice Number</p>
                  <p className="mt-0.5 font-medium text-[var(--pvg-text)]">{o.invoice_number}</p>
                </div>
              )}
              {o.invoice_url && (
                <a
                  href={o.invoice_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-[var(--pvg-border)] px-3 py-2 text-xs font-semibold text-[var(--pvg-primary)] transition hover:bg-[var(--pvg-gold-light)]"
                >
                  <FileText className="h-3.5 w-3.5" />
                  View Invoice
                  <ExternalLink className="ml-auto h-3 w-3" />
                </a>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
