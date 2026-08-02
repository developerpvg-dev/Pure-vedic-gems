import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { OrderRecord, OrderItemRecord } from '@/lib/types/order';
import { OrderActions } from '@/components/admin/OrderActions';
import { OrderAssignDesigner } from '@/components/admin/OrderAssignDesigner';
import { OrderMetalWeightEditor } from '@/components/admin/OrderMetalWeightEditor';
import { OrderPaymentLedger } from '@/components/admin/OrderPaymentLedger';
import { BankTransferManagePanel } from '@/components/admin/BankTransferManagePanel';
import { AdminOrderDetailShell } from '@/components/admin/AdminOrderDetailShell';
import { parseBankTransferProof } from '@/lib/orders/bank-transfer-proof';
import { parseRingSizeConfirmation } from '@/lib/orders/ring-size-confirmation';
import { hasAdminPermission, normalizeAdminRole } from '@/lib/admin/rbac';
import type { Json } from '@/lib/types/database';
import {
  energizationFormFromOrderItems,
  mergeConfigurationDetails,
  type ConfigurationSnapshot,
} from '@/lib/utils/configuration-snapshot';
import {
  isRudrakshaConfigurationSnapshot,
  parseRudrakshaBeadsFromSnapshot,
} from '@/lib/utils/rudraksha-order-display';
import { ConfigurationDetailsDisplay } from '@/components/configuration/ConfigurationDetailsDisplay';
import { resolveOrderFulfillmentContext } from '@/lib/orders/fulfillment-profile';
import { buildOrderPriceLines } from '@/lib/orders/price-breakdown-lines';
import { collectOrderProductIds } from '@/lib/inventory/order-availability';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import {
  ArrowLeft, Package, Truck, CreditCard, Zap, MapPin, Phone, Mail,
  User, FileText, ExternalLink, Settings, Printer,
} from 'lucide-react';
import { CustomDesignBriefCard } from '@/components/admin/CustomDesignBriefCard';
import { OrderCustomDesignPriceEditor } from '@/components/admin/OrderCustomDesignPriceEditor';
import {
  isCustomDesignPricingPending,
  orderHasCustomDesignPricingPending,
} from '@/lib/utils/configuration-snapshot';
import { paymentStatusLabelForOrder } from '@/lib/constants/order-status';

const AVAILABILITY_STYLE: Record<string, string> = {
  reserved: 'bg-amber-100 text-amber-900',
  sold: 'bg-emerald-100 text-emerald-900',
  in_stock: 'bg-sky-100 text-sky-900',
  out_of_stock: 'bg-stone-100 text-stone-700',
  archived: 'bg-stone-200 text-stone-600',
};

function resolveOrderCurrency(order: { legacy_data?: unknown }): string {
  const data = order.legacy_data;
  if (data && typeof data === 'object' && 'legacy_currency' in data) {
    const code = String((data as { legacy_currency?: string }).legacy_currency || '').toUpperCase();
    if (/^[A-Z]{3}$/.test(code)) return code;
  }
  return 'INR';
}

function formatOrderMoney(amount: number, currency: string) {
  const code = /^[A-Z]{3}$/.test(currency) ? currency : 'INR';
  return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function makeMoneyFmt(currency: string) {
  return (amount: number | null | undefined) => formatOrderMoney(Number(amount ?? 0), currency);
}

function cap(s: string | null | undefined) {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

const METAL_LABELS: Record<string, string> = {
  gold_22k: '22K Gold',
  gold_18k: '18K Gold',
  gold_14k: '14K Gold',
  silver_925: '925 Sterling Silver',
  panchdhatu: 'Panchdhatu (Without Gold)',
  panchdhatu_with_gold: 'Panchdhatu (With Gold)',
  copper_pital: 'Copper/Pital',
  platinum: 'Platinum',
};

const SETTING_LABELS: Record<string, string> = {
  ring: 'Ring',
  pendant: 'Pendant',
  bracelet: 'Bracelet',
  loose: 'Loose (No Setting)',
};

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending_payment: 'bg-stone-100 text-stone-700',
  placed: 'bg-sky-50 text-sky-800',
  confirmed: 'bg-indigo-50 text-indigo-800',
  processing: 'bg-amber-50 text-amber-900',
  design_assigned: 'bg-violet-50 text-violet-800',
  design_in_progress: 'bg-violet-50 text-violet-800',
  design_completed: 'bg-violet-50 text-violet-800',
  jewelry_making: 'bg-amber-50 text-amber-900',
  certification: 'bg-cyan-50 text-cyan-800',
  energization: 'bg-violet-50 text-violet-800',
  quality_check: 'bg-orange-50 text-orange-800',
  shipped: 'bg-purple-50 text-purple-800',
  out_for_delivery: 'bg-indigo-50 text-indigo-800',
  delivered: 'bg-emerald-50 text-emerald-800',
  feedback: 'bg-teal-50 text-teal-800',
  cancelled: 'bg-red-50 text-red-800',
  refunded: 'bg-rose-50 text-rose-800',
  payment_review: 'bg-red-50 text-red-800',
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-900',
  completed: 'bg-emerald-50 text-emerald-800',
  captured: 'bg-emerald-50 text-emerald-800',
  partial: 'bg-amber-50 text-amber-900',
  authorized: 'bg-sky-50 text-sky-800',
  failed: 'bg-red-50 text-red-800',
  refunded: 'bg-rose-50 text-rose-800',
  amount_mismatch: 'bg-red-50 text-red-800',
  cancelled: 'bg-red-50 text-red-800',
};

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
  custom_design_url: string | null;
  gem_price: number | null;
  making_charge: number | null;
  metal_price: number | null;
  metal_weight_grams: number | null;
  gold_rate_per_gram: number | null;
  certification_fee: number | null;
  energization_fee: number | null;
  total_price: number | null;
  configuration_snapshot: unknown;
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-stone-800">{children}</dd>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${className}`}>
      <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-3">
        <Icon className="h-3.5 w-3.5 text-stone-400" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Spec({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-stone-800">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-stone-500">{sub}</p> : null}
    </div>
  );
}

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const { data: viewer } = user
    ? await supabase
        .from('team_members')
        .select('role, permissions')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null };
  const canWriteOrders = hasAdminPermission(
    viewer?.role,
    'orders.write',
    (viewer?.permissions ?? null) as Json,
  );
  // Parcel Dispatch ships parcels — design work slip is out of scope for them
  const canManageDesign =
    canWriteOrders && normalizeAdminRole(viewer?.role) !== 'fulfillment';

  const { data: raw } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (!raw) notFound();

  const { data: trackingEventRows } = await supabase
    .from('order_tracking_events')
    .select('status, event_time, note, carrier, tracking_number')
    .eq('order_id', id)
    .order('event_time', { ascending: true })
    .limit(80);

  const trackingEvents = (trackingEventRows ?? []).map((row) => ({
    status: String((row as { status?: string }).status ?? ''),
    event_time: String((row as { event_time?: string }).event_time ?? ''),
    note: (row as { note?: string | null }).note ?? null,
    carrier: (row as { carrier?: string | null }).carrier ?? null,
    tracking_number: (row as { tracking_number?: string | null }).tracking_number ?? null,
  }));

  const o = raw as unknown as OrderRecord;
  const orderCurrency = resolveOrderCurrency(raw as { legacy_data?: unknown });
  const fmt = makeMoneyFmt(orderCurrency);

  let profile: CustomerProfile | null = null;
  if (o.customer_id && (!o.guest_name || !o.guest_email)) {
    const { data } = await supabase
      .from('customer_profiles')
      .select('full_name, phone, email')
      .eq('id', o.customer_id)
      .single();
    profile = data as CustomerProfile | null;
  }

  const displayName = o.guest_name || profile?.full_name || null;
  const displayEmail = o.guest_email || profile?.email || null;
  const displayPhone = o.guest_phone || profile?.phone || null;

  const orderExtras = o as OrderRecord & {
    assigned_designer_id?: string | null;
    design_routed_at?: string | null;
    designer_name?: string | null;
    design_price?: number | null;
    design_due_at?: string | null;
    design_slip_notes?: string | null;
    design_metal_estimate?: string | null;
    carrier?: string | null;
    delivery_status?: string | null;
    shipped_at?: string | null;
    product_video_url?: string | null;
    puja_video_url?: string | null;
    design_completed_at?: string | null;
    products_marked_sold_at?: string | null;
    return_status?: string | null;
    payment_failure_reason?: string | null;
    balance_due_notified_at?: string | null;
    compliance_flags?: unknown;
    internal_notes?: string | null;
    admin_notes?: string | null;
    commission_source?: string | null;
    commission_name?: string | null;
    commission_amount?: number | null;
    commissions?: Array<{
      source: 'salesperson' | 'astrologer';
      name: string;
      amount: number;
    }>;
  };

  let assignedDesignerName: string | null = orderExtras.designer_name ?? null;
  if (!assignedDesignerName && orderExtras.assigned_designer_id) {
    const { data: designer } = await supabase
      .from('team_members')
      .select('name')
      .eq('id', orderExtras.assigned_designer_id)
      .maybeSingle();
    assignedDesignerName = designer?.name ?? null;
  }

  const addr = (o.shipping_address ?? {}) as {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  const items: OrderItemRecord[] = (Array.isArray(o.items) ? o.items : []).map((item) => ({
    ...item,
    name: formatProductDisplayName(item.name),
    configuration_summary: item.configuration_summary
      ? formatProductDisplayName(item.configuration_summary)
      : item.configuration_summary,
  }));
  const productIds = collectOrderProductIds({
    id: o.id,
    order_number: o.order_number,
    items,
  });
  const availabilityByProductId = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: stockRows } = await supabase
      .from('products')
      .select('id, availability_status')
      .in('id', productIds);
    for (const row of stockRows ?? []) {
      availabilityByProductId.set(
        row.id,
        String((row as { availability_status?: string | null }).availability_status ?? ''),
      );
    }
  }
  const ceremonyForm = energizationFormFromOrderItems(items);
  const ceremonyDob = o.ceremony_dob || ceremonyForm?.dob || null;
  const fulfillmentContext = resolveOrderFulfillmentContext({
    items: items.map((item) => ({
      product_id: item.product_id,
      category: item.category,
      configuration_id: item.configuration_id,
      configuration_snapshot: item.configuration_snapshot,
    })),
    includeEnergization: o.include_energization ?? false,
    certificationCharges: o.certification_charges ?? 0,
    energizationCharges: o.energization_charges ?? 0,
  });
  const rewardDiscount = Number(o.reward_discount ?? 0);
  const couponDiscount = Number(
    o.coupon_discount ?? Math.max(0, Number(o.discount ?? 0) - rewardDiscount),
  );

  const configIds = items
    .map((i) => i.configuration_id)
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
        custom_design_url,
        gem_price,
        making_charge,
        metal_price,
        metal_weight_grams,
        gold_rate_per_gram,
        certification_fee,
        energization_fee,
        total_price,
        configuration_snapshot,
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

  const pricingLines: Array<{ label: string; value: number; sign: number }> = buildOrderPriceLines({
    subtotal: o.subtotal,
    jewelry_charges: o.jewelry_charges,
    metal_charges: o.metal_charges,
    certification_charges: o.certification_charges,
    energization_charges: o.energization_charges,
    shipping_cost: o.shipping_cost,
    discount: o.discount,
    coupon_discount: couponDiscount,
    coupon_code: o.coupon_code,
    reward_discount: rewardDiscount,
    reward_points_redeemed: o.reward_points_redeemed,
    gst_amount: o.gst_amount,
  }).map((line) => ({ label: line.label, value: line.amount, sign: line.sign }));

  const slipItems = items.map((item) => {
    const cfg = item.configuration_id ? configMap.get(item.configuration_id) : null;
    const details = mergeConfigurationDetails({
      snapshot: item.configuration_snapshot ?? cfg?.configuration_snapshot,
      dbConfig: cfg,
    });
    const selections = details.selections;
    const metalKey = selections?.metal || cfg?.metal || null;
    const settingKey = selections?.setting_type || cfg?.setting_type || null;
    return {
      name: item.name,
      setting: settingKey
        ? SETTING_LABELS[settingKey] || settingKey.replace(/_/g, ' ')
        : null,
      metal: metalKey ? METAL_LABELS[metalKey] || metalKey.replace(/_/g, ' ') : null,
      ring_size: selections?.ring_size || cfg?.ring_size || null,
      chain_length: selections?.chain_length || cfg?.chain_length || null,
      design_name: selections?.design?.name || cfg?.jewelry_designs?.name || null,
      design_image_url:
        cfg?.jewelry_designs?.image_url ||
        selections?.custom_design_url ||
        null,
      summary: item.configuration_summary || details.summary || null,
      carat: item.carat_weight != null ? `${item.carat_weight} ct` : null,
    };
  });

  const returnStatus = orderExtras.return_status;
  const bankProof = parseBankTransferProof(orderExtras.compliance_flags);
  const ringSizeConfirmation = parseRingSizeConfirmation(orderExtras.compliance_flags);
  const needsPaymentReview =
    o.status === 'payment_review' ||
    o.payment_status === 'amount_mismatch' ||
    (o.payment_method === 'bank_transfer' &&
      o.payment_status !== 'captured' &&
      bankProof?.status !== 'verified');
  const defaultTab = needsPaymentReview
    ? 'payment'
    : fulfillmentContext.needsDesigner && !orderExtras.assigned_designer_id
      ? 'manage'
      : 'overview';
  const placedOn = new Date(o.created_at).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 print:px-0">
      {/* Header */}
      <header className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href="/admin/orders"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 text-stone-500 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800"
              aria-label="Back to orders"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                Order detail
              </p>
              <h1 className="mt-0.5 truncate font-heading text-2xl font-bold tracking-tight text-stone-900 sm:text-[1.75rem]">
                #{o.order_number}
              </h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500">
                <span>{placedOn}</span>
                {displayName ? (
                  <>
                    <span className="text-stone-300">Â·</span>
                    <span className="font-medium text-stone-700">{displayName}</span>
                  </>
                ) : null}
                {displayPhone ? (
                  <>
                    <span className="text-stone-300">Â·</span>
                    <span>{displayPhone}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                o.order_source === 'offline'
                  ? 'bg-stone-800 text-white'
                  : 'bg-sky-100 text-sky-800'
              }`}
            >
              {o.order_source === 'offline' ? 'Offline' : 'Online'}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ORDER_STATUS_STYLE[o.status] ?? 'bg-stone-100 text-stone-700'}`}
            >
              {cap(o.status) ?? o.status}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                orderHasCustomDesignPricingPending(items)
                  ? 'bg-amber-100 text-amber-900'
                  : PAYMENT_STATUS_STYLE[o.payment_status] ?? 'bg-stone-100 text-stone-700'
              }`}
            >
              {paymentStatusLabelForOrder({
                payment_status: o.payment_status,
                amount_due: o.amount_due,
                items,
              })}
            </span>
            {returnStatus && returnStatus !== 'none' ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                Return: {cap(returnStatus)}
              </span>
            ) : null}
            <Link
              href={`/admin/orders/${o.id}/receipt`}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <Printer className="h-3 w-3" />
              Print all details
            </Link>
            {o.invoice_url ? (
              <a
                href={o.invoice_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                <FileText className="h-3 w-3" />
                Invoice
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 sm:grid-cols-4">
          <Field label="Total">
            {fmt(o.total)}
            {orderCurrency !== 'INR' ? (
              <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-stone-400">
                Charged in {orderCurrency}
              </span>
            ) : null}
          </Field>
          <Field label="Paid / Due">
            {fmt(
              o.payment_status === 'captured' && Number(o.amount_paid ?? 0) < 0.01
                ? o.total
                : (o.amount_paid ?? 0),
            )}
            {' / '}
            {fmt(
              o.payment_status === 'captured' && Number(o.amount_paid ?? 0) < 0.01
                ? 0
                : (o.amount_due ??
                    Math.max(0, Number(o.total ?? 0) - Number(o.amount_paid ?? 0))),
            )}
          </Field>
          <Field label="Payment">{cap(o.payment_method) ?? 'â€”'}</Field>
          <Field label="Fulfillment">
            {cap(o.fulfillment_type) ?? cap(o.shipping_method) ?? 'Standard'}
          </Field>
        </div>
      </header>

      {o.status === 'cancelled' ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
          <p className="font-semibold">This order is cancelled</p>
          <p className="mt-1 text-red-800/90">
            {orderExtras.payment_failure_reason
              ? `Reason: ${orderExtras.payment_failure_reason}. `
              : ''}
            Use Manual Refund under Manage if payment was captured.
          </p>
        </div>
      ) : null}

      <AdminOrderDetailShell
        defaultTab={defaultTab}
        badges={{
          items: String(items.length),
          payment: needsPaymentReview ? 'Review' : null,
          manage: fulfillmentContext.needsDesigner && !orderExtras.assigned_designer_id ? 'Assign' : null,
        }}
        overview={
          <div className="space-y-5">
            {ringSizeConfirmation ? (
              <div
                className={`rounded-2xl border px-5 py-4 ${
                  ringSizeConfirmation.status === 'submitted'
                    ? 'border-emerald-200 bg-emerald-50/80'
                    : 'border-amber-200 bg-amber-50/80'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Ring size confirmation
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  {ringSizeConfirmation.status === 'submitted'
                    ? 'Customer uploaded internal-diameter photo'
                    : 'Awaiting customer diameter photo (requested in confirmation email)'}
                </p>
                {ringSizeConfirmation.image_url ? (
                  <a
                    href={ringSizeConfirmation.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block overflow-hidden rounded-xl border border-stone-200 bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ringSizeConfirmation.image_url}
                      alt="Customer ring diameter measurement"
                      className="max-h-64 max-w-full object-contain sm:max-w-md"
                    />
                  </a>
                ) : null}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Panel title="Customer" icon={User}>
                <dl className="space-y-3 px-5 py-4">
                  <Field label="Name">{displayName ?? 'Not provided'}</Field>
                  <Field label="Email">
                    <span className="flex items-start gap-1.5 break-all">
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                      {displayEmail ?? 'Not provided'}
                    </span>
                  </Field>
                  <Field label="Phone">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                      {displayPhone ?? 'Not provided'}
                    </span>
                  </Field>
                  {o.customer_id ? (
                    <span className="inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                      Registered account
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600">
                      Guest checkout
                    </span>
                  )}
                </dl>
              </Panel>

              <Panel title="Shipping" icon={MapPin}>
                <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-stone-700">
                  {displayName ? <p className="font-semibold text-stone-900">{displayName}</p> : null}
                  {addr.line1 ? <p>{addr.line1}</p> : null}
                  {addr.line2 ? <p>{addr.line2}</p> : null}
                  {addr.city || addr.state || addr.pincode ? (
                    <p>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                  ) : null}
                  {addr.country ? <p>{addr.country}</p> : null}
                  {!addr.line1 && !addr.city ? (
                    <p className="italic text-stone-400">No address recorded</p>
                  ) : null}
                  {o.special_instructions ? (
                    <div className="rounded-lg bg-stone-50 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">
                        Special instructions
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-700">
                        {o.special_instructions}
                      </p>
                    </div>
                  ) : null}
                </div>
              </Panel>

              <Panel title="Delivery" icon={Truck}>
                <dl className="space-y-3 px-5 py-4">
                  <Field label="Method">{cap(o.shipping_method) ?? 'Standard'}</Field>
                  {orderExtras.carrier ? (
                    <Field label="Carrier">{orderExtras.carrier}</Field>
                  ) : null}
                  {o.tracking_number ? (
                    <Field label="Tracking">
                      <span className="flex flex-wrap items-center gap-2">
                        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[11px]">
                          {o.tracking_number}
                        </code>
                        {o.tracking_url ? (
                          <a
                            href={o.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 underline-offset-2 hover:underline"
                          >
                            Track <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </span>
                    </Field>
                  ) : null}
                  {orderExtras.delivery_status ? (
                    <Field label="Status">{cap(orderExtras.delivery_status)}</Field>
                  ) : null}
                  {o.estimated_delivery ? (
                    <Field label="Est. delivery">
                      {new Date(o.estimated_delivery).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Field>
                  ) : null}
                  {!o.tracking_number && !o.estimated_delivery && !orderExtras.carrier ? (
                    <p className="text-xs italic text-stone-400">No tracking yet â€” update in Manage</p>
                  ) : null}
                </dl>
              </Panel>

              {o.include_energization ? (
                <Panel title="Ceremony" icon={Zap}>
                  <dl className="grid gap-3 px-5 py-4 sm:grid-cols-2">
                    <Field label="Type">{cap(o.energization_type) ?? 'Not specified'}</Field>
                    {o.ceremony_gotra || ceremonyForm?.gotra ? (
                      <Field label="Gotra">{o.ceremony_gotra || ceremonyForm?.gotra}</Field>
                    ) : null}
                    {ceremonyDob ? (
                      <Field label="Date of birth">
                        {new Date(ceremonyDob).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Field>
                    ) : null}
                    {ceremonyForm?.birth_time ? (
                      <Field label="Birth time">{ceremonyForm.birth_time}</Field>
                    ) : null}
                    {ceremonyForm?.birth_place ? (
                      <Field label="Birth place">{ceremonyForm.birth_place}</Field>
                    ) : null}
                    {o.ceremony_rashi || ceremonyForm?.rashi ? (
                      <Field label="Rashi">{o.ceremony_rashi || ceremonyForm?.rashi}</Field>
                    ) : null}
                    {o.record_ceremony || ceremonyForm?.record_ceremony ? (
                      <p className="sm:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                        Ceremony video recording requested
                      </p>
                    ) : null}
                  </dl>
                </Panel>
              ) : null}
            </div>
          </div>
        }
        items={
          <Panel title={`Items (${items.length})`} icon={Package}>
            {items.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-stone-400">No items on this order</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {items.map((item, idx) => {
                  const cfg = item.configuration_id ? configMap.get(item.configuration_id) : null;
                  const details: ConfigurationSnapshot | null =
                    cfg || item.configuration_snapshot
                      ? mergeConfigurationDetails({
                          snapshot: item.configuration_snapshot ?? cfg?.configuration_snapshot,
                          dbConfig: cfg,
                        })
                      : null;
                  const selections = details?.selections;
                  const pricing = details?.pricing;
                  const designImage =
                    cfg?.jewelry_designs?.image_url ?? details?.product?.image_url ?? null;
                  const designName =
                    selections?.design?.name ?? cfg?.jewelry_designs?.name ?? null;
                  const rudrakshaConfig = isRudrakshaConfigurationSnapshot(
                    item.configuration_snapshot ?? cfg?.configuration_snapshot,
                  );
                  const rudrakshaBeads = parseRudrakshaBeadsFromSnapshot(
                    item.configuration_snapshot ?? cfg?.configuration_snapshot,
                  );

                  return (
                    <li key={idx} className="p-5">
                      <div className="flex gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-stone-300">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900">{item.name}</p>
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-500">
                                {item.sku ? <span>SKU {item.sku}</span> : null}
                                {item.tag_number ? (
                                  <span className="font-medium text-amber-800">Tag {item.tag_number}</span>
                                ) : null}
                                {item.category ? <span>{item.category}</span> : null}
                                {item.carat_weight ? <span>{item.carat_weight} ct</span> : null}
                                {item.origin ? <span>{item.origin}</span> : null}
                                {item.product_id && availabilityByProductId.get(item.product_id) ? (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                      AVAILABILITY_STYLE[availabilityByProductId.get(item.product_id)!] ??
                                      'bg-stone-100 text-stone-700'
                                    }`}
                                  >
                                    {cap(availabilityByProductId.get(item.product_id)) ??
                                      availabilityByProductId.get(item.product_id)}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-semibold tabular-nums text-stone-900">
                                {fmt(item.line_total)}
                              </p>
                              <p className="text-xs text-stone-400">
                                {fmt(item.unit_price)} Ã— {item.quantity}
                              </p>
                            </div>
                          </div>

                          {details ? (
                            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/60 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <Settings className="h-3.5 w-3.5 text-stone-400" />
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                                  {rudrakshaConfig
                                    ? 'Rudraksha configuration'
                                    : 'Jewelry configuration'}
                                </p>
                                {selections?.setting_type ? (
                                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-600 ring-1 ring-stone-200">
                                    {SETTING_LABELS[selections.setting_type] ??
                                      cap(selections.setting_type)}
                                  </span>
                                ) : null}
                              </div>

                              {details.summary ? (
                                <p className="mb-3 text-xs leading-relaxed text-stone-600">
                                  {details.summary}
                                </p>
                              ) : null}

                              {rudrakshaBeads.length > 0 ? (
                                <ul className="mb-3 divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
                                  {rudrakshaBeads.map((bead) => (
                                    <li
                                      key={bead.id}
                                      className="flex flex-wrap items-start justify-between gap-2 px-3 py-2 text-xs"
                                    >
                                      <div>
                                        <p className="font-semibold text-stone-800">
                                          <span className="text-stone-400">
                                            {bead.role === 'primary' ? 'Primary' : 'Combo'} Â·{' '}
                                          </span>
                                          {bead.mukhi_label} â€” {bead.name}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-stone-400">
                                          {[
                                            bead.sku ? `SKU ${bead.sku}` : null,
                                            bead.tag_number ? `Tag ${bead.tag_number}` : null,
                                          ]
                                            .filter(Boolean)
                                            .join(' Â· ')}
                                        </p>
                                      </div>
                                      {bead.price > 0 ? (
                                        <span className="font-semibold tabular-nums">
                                          {fmt(bead.price)}
                                        </span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}

                              {(designName || selections?.custom_design_url || selections?.custom_design_brief) && (
                                <div className="mb-3 flex items-start gap-3">
                                  {designImage ? (
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-white">
                                      <Image
                                        src={designImage}
                                        alt={designName ?? 'Design'}
                                        fill
                                        className="object-cover"
                                        sizes="48px"
                                      />
                                    </div>
                                  ) : null}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">
                                      Design
                                    </p>
                                    {designName ? (
                                      <p className="font-semibold text-stone-800">{designName}</p>
                                    ) : selections?.custom_design_url || selections?.custom_design_brief ? (
                                      <p className="font-semibold text-stone-800">Custom design</p>
                                    ) : null}
                                    {selections?.custom_design_brief || selections?.custom_design_url ? (
                                      <CustomDesignBriefCard
                                        className="mt-2"
                                        brief={selections.custom_design_brief}
                                        fileUrl={selections.custom_design_url}
                                        ringSize={selections.ring_size}
                                        settingType={selections.setting_type}
                                        productName={item.name}
                                        printId={`custom-design-brief-${idx}`}
                                      />
                                    ) : null}
                                    {selections?.custom_design_url ? (
                                      <OrderCustomDesignPriceEditor
                                        orderId={o.id}
                                        itemIndex={idx}
                                        preferredMetal={
                                          selections.custom_design_brief?.preferred_metal ??
                                          selections.metal
                                        }
                                        pending={isCustomDesignPricingPending(
                                          item.configuration_snapshot ?? cfg?.configuration_snapshot,
                                        )}
                                        itemName={item.name}
                                      />
                                    ) : null}
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {selections?.metal ? (
                                  <Spec
                                    label="Metal"
                                    value={METAL_LABELS[selections.metal] ?? cap(selections.metal) ?? ''}
                                  />
                                ) : null}
                                {(pricing?.metal_weight_grams ?? 0) > 0 ? (
                                  <Spec
                                    label="Metal weight"
                                    value={`${pricing?.metal_weight_grams} g`}
                                    sub={
                                      pricing?.quoted_metal_weight_grams != null &&
                                      pricing.quoted_metal_weight_grams !== pricing.metal_weight_grams
                                        ? `Quoted ${pricing.quoted_metal_weight_grams} g`
                                        : pricing?.gold_rate_per_gram
                                          ? `₹${Number(pricing.gold_rate_per_gram).toLocaleString('en-IN')}/g`
                                          : undefined
                                    }
                                  />
                                ) : null}
                                {selections?.ring_size ? (
                                  <Spec label="Ring size" value={selections.ring_size} />
                                ) : null}
                                {selections?.chain_length ? (
                                  <Spec label="Chain" value={selections.chain_length} />
                                ) : null}
                                {selections?.certification ? (
                                  <Spec
                                    label="Certification"
                                    value={selections.certification.name ?? ''}
                                    sub={cfg?.certification_labs?.full_name}
                                  />
                                ) : null}
                                {selections?.certification_skipped && !selections?.certification ? (
                                  <Spec label="Certification" value="Skipped" />
                                ) : null}
                                {selections?.energization ? (
                                  <Spec
                                    label="Energization"
                                    value={selections.energization.name ?? ''}
                                    sub={cfg?.energization_options?.duration}
                                  />
                                ) : null}
                                {details.delivery_eta?.label || item.delivery_eta_label ? (
                                  <Spec
                                    label="Delivery ETA"
                                    value={
                                      details.delivery_eta?.label || item.delivery_eta_label || ''
                                    }
                                  />
                                ) : null}
                              </div>

                              {selections?.energization_form ? (
                                <div className="mt-3 grid gap-2 rounded-lg border border-stone-200 bg-white px-3 py-3 text-xs sm:grid-cols-3">
                                  <div>
                                    <p className="text-stone-400">DOB</p>
                                    <p className="font-medium text-stone-800">
                                      {selections.energization_form.dob || 'â€”'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-stone-400">Birth time</p>
                                    <p className="font-medium text-stone-800">
                                      {selections.energization_form.birth_time || 'â€”'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-stone-400">Birth place</p>
                                    <p className="font-medium text-stone-800">
                                      {selections.energization_form.birth_place || 'â€”'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-stone-400">Gotra</p>
                                    <p className="font-medium text-stone-800">
                                      {selections.energization_form.gotra || 'â€”'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-stone-400">Rashi</p>
                                    <p className="font-medium text-stone-800">
                                      {selections.energization_form.rashi || 'â€”'}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-stone-400">Record ceremony</p>
                                    <p className="font-medium text-stone-800">
                                      {selections.energization_form.record_ceremony ? 'Yes' : 'No'}
                                    </p>
                                  </div>
                                  {selections.energization?.name ? (
                                    <div className="sm:col-span-3">
                                      <p className="text-stone-400">Ceremony</p>
                                      <p className="font-medium text-stone-800">
                                        {selections.energization.name}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}

                              <div className="mt-3 overflow-hidden rounded-lg border border-stone-200 bg-white text-xs">
                                <p className="border-b border-stone-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-400">
                                  Config price
                                </p>
                                <div className="divide-y divide-stone-50">
                                  {[
                                    {
                                      label: rudrakshaConfig ? 'Bead price' : 'Gem price',
                                      value: pricing?.gem_price,
                                    },
                                    { label: 'Making', value: pricing?.making_charge },
                                    {
                                      label: pricing?.stone_addon_label
                                        ? `${pricing.stone_addon_label} add-on`
                                        : 'Diamond add-on',
                                      value: pricing?.diamond_charge,
                                    },
                                    { label: 'Metal', value: pricing?.metal_price },
                                    { label: 'Certification', value: pricing?.certification_fee },
                                    { label: 'Energization', value: pricing?.energization_fee },
                                    { label: 'Custom design', value: pricing?.custom_design_fee },
                                  ]
                                    .filter((l) => (l.value ?? 0) > 0)
                                    .map((l) => (
                                      <div
                                        key={l.label}
                                        className="flex justify-between px-3 py-1.5 text-stone-700"
                                      >
                                        <span className="text-stone-500">{l.label}</span>
                                        <span className="font-medium tabular-nums">
                                          {fmt(l.value)}
                                        </span>
                                      </div>
                                    ))}
                                  <div className="flex justify-between bg-stone-50 px-3 py-2 font-semibold text-stone-900">
                                    <span>Config total</span>
                                    <span className="tabular-nums">
                                      {fmt(pricing?.total ?? cfg?.total_price)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {!rudrakshaConfig &&
                              (Number(pricing?.metal_weight_grams ?? 0) > 0 ||
                                pricing?.jewelry_pricing_mode === 'weight') &&
                              Number(pricing?.gold_rate_per_gram ?? 0) > 0 ? (
                                <OrderMetalWeightEditor
                                  orderId={o.id}
                                  itemIndex={idx}
                                  currentWeightGrams={Number(pricing?.metal_weight_grams ?? 0)}
                                  quotedWeightGrams={
                                    pricing?.quoted_metal_weight_grams ??
                                    pricing?.metal_weight_grams ??
                                    null
                                  }
                                  goldRatePerGram={Number(pricing?.gold_rate_per_gram ?? 0)}
                                  metalPrice={Number(pricing?.metal_price ?? 0)}
                                  itemName={designName ?? item.name}
                                />
                              ) : null}
                            </div>
                          ) : item.configuration_summary || item.configuration_snapshot ? (
                            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2.5 text-xs">
                              <ConfigurationDetailsDisplay
                                snapshot={item.configuration_snapshot}
                                summary={item.configuration_summary}
                                deliveryEtaLabel={item.delivery_eta_label}
                                variant="full"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        }
        payment={
          <div className="space-y-5">
            <BankTransferManagePanel
              orderId={o.id}
              paymentMethod={o.payment_method ?? null}
              paymentStatus={o.payment_status ?? null}
              complianceFlags={orderExtras.compliance_flags ?? null}
              paymentReviewReason={
                (orderExtras as { payment_review_reason?: string | null }).payment_review_reason ?? null
              }
            />

            <OrderPaymentLedger
              orderId={o.id}
              total={Number(o.total) || 0}
              amountPaid={Number(o.amount_paid ?? 0) || 0}
              amountDue={
                Number(
                  o.amount_due ??
                    Math.max(0, Number(o.total ?? 0) - Number(o.amount_paid ?? 0)),
                ) || 0
              }
              paymentStatus={o.payment_status}
              hasCustomerAccount={Boolean(o.customer_id)}
              balanceRequestedAt={orderExtras.balance_due_notified_at ?? null}
            />

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Price breakdown" icon={CreditCard}>
                <div className="space-y-2 px-5 py-4 text-sm">
                  {pricingLines.map((line) => (
                    <div key={line.label} className="flex items-center justify-between text-stone-700">
                      <span className={line.sign < 0 ? 'text-emerald-700' : 'text-stone-500'}>
                        {line.label}
                      </span>
                      <span
                        className={`font-medium tabular-nums ${line.sign < 0 ? 'text-emerald-700' : ''}`}
                      >
                        {line.sign < 0 ? 'âˆ’' : ''}
                        {fmt(line.value)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                    <span className="text-sm font-semibold text-stone-900">Grand total</span>
                    <span className="text-lg font-bold tabular-nums text-stone-900">{fmt(o.total)}</span>
                  </div>
                </div>
              </Panel>

              <Panel title="Payment references" icon={CreditCard}>
                <dl className="space-y-3 px-5 py-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Method">{cap(o.payment_method) ?? 'â€”'}</Field>
                    <Field label="Status">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_STYLE[o.payment_status] ?? 'bg-stone-100 text-stone-700'}`}
                      >
                        {cap(o.payment_status) ?? o.payment_status}
                      </span>
                    </Field>
                  </div>
                  {o.razorpay_order_id ? (
                    <Field label="Razorpay order">
                      <code className="block break-all font-mono text-[11px] text-stone-600">
                        {o.razorpay_order_id}
                      </code>
                    </Field>
                  ) : null}
                  {o.razorpay_payment_id ? (
                    <Field label="Payment ID">
                      <code className="block break-all font-mono text-[11px] text-stone-600">
                        {o.razorpay_payment_id}
                      </code>
                    </Field>
                  ) : null}
                  {o.invoice_number ? (
                    <Field label="Invoice #">{o.invoice_number}</Field>
                  ) : null}
                  {o.invoice_url ? (
                    <a
                      href={o.invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View invoice
                      <ExternalLink className="ml-auto h-3 w-3" />
                    </a>
                  ) : null}
                </dl>
              </Panel>
            </div>
          </div>
        }
        manage={
          canWriteOrders ? (
          <div className={`grid gap-5 ${canManageDesign ? 'lg:grid-cols-2' : ''}`}>
            {canManageDesign ? (
            <OrderAssignDesigner
              orderId={o.id}
              orderNumber={o.order_number}
              currentDesignerId={orderExtras.assigned_designer_id ?? null}
              currentDesignerName={assignedDesignerName}
              orderStatus={o.status}
              needsDesigner={fulfillmentContext.needsDesigner}
              currentDesignPrice={orderExtras.design_price ?? null}
              currentDesignDueAt={orderExtras.design_due_at ?? null}
              currentDesignSlipNotes={orderExtras.design_slip_notes ?? null}
              currentDesignMetalEstimate={orderExtras.design_metal_estimate ?? null}
              slipItems={slipItems}
            />
            ) : null}

            <OrderActions
              orderId={o.id}
              currentStatus={o.status}
              currentNotes={orderExtras.internal_notes ?? orderExtras.admin_notes ?? null}
              currentTracking={o.tracking_number}
              currentTrackingUrl={o.tracking_url}
              currentEstDelivery={o.estimated_delivery}
              currentCarrier={orderExtras.carrier ?? null}
              currentShippedAt={orderExtras.shipped_at ?? null}
              currentDeliveryStatus={orderExtras.delivery_status ?? null}
              currentProductVideoUrl={orderExtras.product_video_url ?? null}
              currentPujaVideoUrl={orderExtras.puja_video_url ?? null}
              currentDesignCompletedAt={orderExtras.design_completed_at ?? null}
              productsMarkedSoldAt={orderExtras.products_marked_sold_at ?? null}
              orderSource={o.order_source ?? null}
              orderTotal={o.total}
              customerPhone={displayPhone}
              customerName={displayName}
              orderNumber={o.order_number}
              orderItems={items.map((item) => ({
                product_id: item.product_id,
                category: item.category,
                configuration_id: item.configuration_id,
                configuration_snapshot: item.configuration_snapshot,
              }))}
              includeEnergization={o.include_energization ?? false}
              certificationCharges={o.certification_charges ?? 0}
              energizationCharges={o.energization_charges ?? 0}
              currentReturnStatus={orderExtras.return_status ?? 'none'}
              cancelReason={orderExtras.payment_failure_reason ?? null}
              complianceFlags={orderExtras.compliance_flags ?? null}
              currentCommissionSource={orderExtras.commission_source ?? null}
              currentCommissionName={orderExtras.commission_name ?? null}
              currentCommissionAmount={orderExtras.commission_amount ?? null}
              currentCommissions={orderExtras.commissions ?? []}
              paymentStatus={o.payment_status ?? null}
              amountPaid={o.amount_paid ?? null}
              amountDue={o.amount_due ?? null}
              createdAt={o.created_at}
              trackingEvents={trackingEvents}
            />
          </div>
          ) : (
            <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              Orders are view-only for your role.
            </p>
          )
        }
      />
    </div>
  );
}
