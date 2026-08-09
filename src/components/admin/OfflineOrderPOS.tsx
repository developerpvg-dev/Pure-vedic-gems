'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  Package,
  Palette,
  IndianRupee,
  Truck,
  CreditCard,
  Check,
} from 'lucide-react';
import { AdminPosConfigurator } from '@/components/admin/AdminPosConfigurator';
import { OfflinePosCatalogPicker } from '@/components/admin/OfflinePosCatalogPicker';
import type { ConfiguredOrderResult } from '@/components/configurator/PriceSummary';
import { isGemConfiguratorEnabled } from '@/lib/shop/configurator';
import { buildOrderPriceLines } from '@/lib/orders/price-breakdown-lines';
import type { ProductCard } from '@/lib/types/product';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { getApiErrorMessage } from '@/lib/utils/api-validation';
import {
  isValidGstin,
  isValidIndianPincode,
  isValidOfflinePhone,
  normalizeOfflinePhone,
} from '@/lib/validators/order';

type ProductHit = {
  id: string;
  name: string;
  sku: string | null;
  tag_number: string | null;
  price: number;
  category: string | null;
  sub_category?: string | null;
  slug?: string | null;
  images?: unknown;
  thumbnail_url?: string | null;
  configurator_enabled?: boolean | null;
  carat_weight?: number | null;
  origin?: string | null;
  availability_status?: string | null;
  in_stock?: boolean;
};

type CustomerHit = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  addresses?: Array<Partial<typeof EMPTY_ADDRESS>> | null;
  default_address_index?: number | null;
};

const EMPTY_ADDRESS = {
  line1: '',
  line2: '',
  city: '',
  state: 'Rajasthan',
  pincode: '',
  country: 'India',
  country_code: 'IN',
};

type LineItem = {
  key: string;
  product_id: string | null;
  name: string;
  sku?: string;
  tag_number?: string | null;
  price: number;
  quantity: number;
  image_url?: string;
  category?: string;
  design_id?: string;
  design_name?: string;
  configuration_id?: string;
  configuration_summary?: string;
  configuration_snapshot?: unknown;
  delivery_eta_label?: string;
  manual_design?: {
    description: string;
    item_price: number;
    metal_price: number;
    labour_charge: number;
    other_charge: number;
  };
};

type Commission = {
  source: 'salesperson' | 'astrologer';
  name: string;
  amount: string;
};

type Pricing = {
  subtotal: number;
  jewelry_charges: number;
  metal_charges: number;
  certification_charges: number;
  energization_charges: number;
  shipping_cost: number;
  discount: number;
  coupon_discount: number;
  reward_discount?: number;
  manual_discount: number;
  gst_amount: number;
  total: number;
  tax_breakdown?: {
    jurisdiction?: string;
    destination_state?: string;
    totals?: {
      taxable_amount?: number;
      cgst?: number;
      sgst?: number;
      igst?: number;
      gst_amount?: number;
    };
    components?: Array<{
      label?: string;
      rate_percent?: number;
      taxable_amount?: number;
      cgst?: number;
      sgst?: number;
      igst?: number;
      total_tax?: number;
    }>;
  } | null;
};

type ShippingPlan = { id: string; label: string; cost: number };

const STEPS = ['Customer', 'Items', 'Charges', 'Fulfillment', 'Payment', 'Review'] as const;

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function productImage(p: ProductHit) {
  if (Array.isArray(p.images) && typeof p.images[0] === 'string') return p.images[0];
  return '';
}

function PosPriceBreakdown({ pricing, couponCode }: { pricing: Pricing; couponCode?: string }) {
  const lines = buildOrderPriceLines({
    subtotal: pricing.subtotal,
    jewelry_charges: pricing.jewelry_charges,
    metal_charges: pricing.metal_charges,
    certification_charges: pricing.certification_charges,
    energization_charges: pricing.energization_charges,
    shipping_cost: pricing.shipping_cost,
    discount: pricing.discount,
    coupon_discount: pricing.coupon_discount,
    coupon_code: couponCode || null,
    reward_discount: pricing.reward_discount ?? 0,
    gst_amount: pricing.gst_amount,
    tax_breakdown: pricing.tax_breakdown,
    total: pricing.total,
  });

  // Manual discount is inside pricing.discount but not always split — show if present and not covered by coupon/reward
  const couponReward =
    (Number(pricing.coupon_discount) || 0) + (Number(pricing.reward_discount) || 0);
  const manualOnly = Math.max(0, (Number(pricing.manual_discount) || 0));
  const showManual =
    manualOnly > 0.009 &&
    !lines.some((l) => l.key === 'discount') &&
    couponReward + 0.009 < (Number(pricing.discount) || 0);

  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Price breakdown</p>
      <dl className="space-y-1.5">
        {lines.map((line) => (
          <div key={line.key} className="flex justify-between gap-4">
            <dt className={line.sign < 0 ? 'text-emerald-800' : 'text-stone-600'}>{line.label}</dt>
            <dd
              className={`tabular-nums ${line.sign < 0 ? 'text-emerald-800' : 'text-stone-900'}`}
            >
              {line.sign < 0 ? '-' : ''}
              {fmt(line.amount)}
            </dd>
          </div>
        ))}
        {showManual ? (
          <div className="flex justify-between gap-4">
            <dt className="text-emerald-800">Manual discount</dt>
            <dd className="tabular-nums text-emerald-800">-{fmt(manualOnly)}</dd>
          </div>
        ) : null}
        {/* ponytail: match online — jewellery GST baked into lines via buildOrderPriceLines; no CGST/SGST UI */}
        <div className="flex justify-between gap-4 border-t border-stone-300 pt-2 text-base font-bold text-stone-900">
          <dt>Order total</dt>
          <dd className="tabular-nums">{fmt(pricing.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function OfflineOrderPOS() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Customer
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerHits, setCustomerHits] = useState<CustomerHit[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');

  // Items
  const [productQuery, setProductQuery] = useState('');
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [configuringProduct, setConfiguringProduct] = useState<ProductCard | null>(null);
  const [configuringComboIds, setConfiguringComboIds] = useState<string[]>([]);
  const [loadingConfigure, setLoadingConfigure] = useState(false);
  const [showManualDesign, setShowManualDesign] = useState(false);
  const [manualDesign, setManualDesign] = useState({
    name: '',
    description: '',
    item_price: '',
    metal_price: '',
    labour_charge: '',
    other_charge: '',
  });

  // Charges
  const [manualDiscount, setManualDiscount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [pricingError, setPricingError] = useState('');
  const [quoting, setQuoting] = useState(false);

  // Fulfillment
  const [fulfillmentType, setFulfillmentType] = useState<'in_store' | 'pickup' | 'delivery'>('in_store');
  const [shippingMethod, setShippingMethod] = useState('');
  const [shippingPlans, setShippingPlans] = useState<ShippingPlan[]>([]);
  const [addr, setAddr] = useState(EMPTY_ADDRESS);
  const [notes, setNotes] = useState('');

  // Payment
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'upi' | 'card' | 'bank_transfer'>('cash');
  const [payRef, setPayRef] = useState('');

  const searchCustomers = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setCustomerHits([]);
      return;
    }
    const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(q.trim())}&per_page=8`);
    const data = await res.json().catch(() => ({}));
    const list = (data.customers ?? data.items ?? []) as CustomerHit[];
    setCustomerHits(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void searchCustomers(customerQuery), 300);
    return () => clearTimeout(t);
  }, [customerQuery, searchCustomers]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (productQuery.trim().length < 2) {
        setProductHits([]);
        return;
      }
      setSearchingProducts(true);
      const res = await fetch(
        `/api/admin/products?search=${encodeURIComponent(productQuery.trim())}&per_page=12&availability_status=in_stock&status=active`,
      );
      const data = await res.json().catch(() => ({}));
      setProductHits((data.products ?? []) as ProductHit[]);
      setSearchingProducts(false);
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery]);

  useEffect(() => {
    if (fulfillmentType !== 'delivery') return;
    void (async () => {
      const res = await fetch(`/api/shipping?country=IN&subtotal=${pricing?.subtotal ?? 0}`);
      const data = await res.json().catch(() => ({}));
      const plans = (data.plans ?? []) as ShippingPlan[];
      setShippingPlans(plans);
      if (plans[0] && !shippingMethod) setShippingMethod(plans[0].id);
    })();
  }, [fulfillmentType, pricing?.subtotal, shippingMethod]);

  function addSimpleProduct(p: ProductHit) {
    if (items.some((i) => i.product_id === p.id)) {
      setError('This product is already on the order (unique pieces only).');
      return;
    }
    setError('');
    setItems((prev) => [
      ...prev,
      {
        key: `${p.id}-${Date.now()}`,
        product_id: p.id,
        name: formatProductDisplayName(p.name),
        sku: p.sku ?? undefined,
        tag_number: p.tag_number,
        price: Number(p.price) || 0,
        quantity: 1,
        image_url: productImage(p),
        category: p.category ?? undefined,
      },
    ]);
    setProductQuery('');
    setProductHits([]);
  }

  function addManualDesign() {
    const itemPrice = Number(manualDesign.item_price) || 0;
    const metalPrice = Number(manualDesign.metal_price) || 0;
    const labourCharge = Number(manualDesign.labour_charge) || 0;
    const otherCharge = Number(manualDesign.other_charge) || 0;
    if (manualDesign.name.trim().length < 2) {
      setError('Enter a name for the manual design.');
      return;
    }
    if (itemPrice + metalPrice + labourCharge + otherCharge <= 0) {
      setError('Enter at least one price for the manual design.');
      return;
    }
    const key = `manual-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        key,
        product_id: null,
        name: manualDesign.name.trim(),
        price: itemPrice + metalPrice + labourCharge + otherCharge,
        quantity: 1,
        category: 'manual_design',
        configuration_summary: manualDesign.description.trim()
          ? `Manual design: ${manualDesign.description.trim()}`
          : 'Customer-provided manual design',
        manual_design: {
          description: manualDesign.description.trim(),
          item_price: itemPrice,
          metal_price: metalPrice,
          labour_charge: labourCharge,
          other_charge: otherCharge,
        },
      },
    ]);
    setManualDesign({
      name: '',
      description: '',
      item_price: '',
      metal_price: '',
      labour_charge: '',
      other_charge: '',
    });
    setShowManualDesign(false);
    setError('');
  }

  async function addProduct(p: ProductHit) {
    if (items.some((i) => i.product_id === p.id)) {
      setError('This product is already on the order (unique pieces only).');
      return;
    }
    setError('');

    if (!isGemConfiguratorEnabled(p.category, p.configurator_enabled)) {
      addSimpleProduct(p);
      return;
    }

    setLoadingConfigure(true);
    try {
      const res = await fetch(`/api/products/${p.id}`);
      const data = await res.json().catch(() => ({}));
      const card = (data.product ?? null) as ProductCard | null;
      if (!res.ok || !card) {
        // Fallback: build a minimal ProductCard from search hit
        setConfiguringComboIds([]);
        setConfiguringProduct({
          id: p.id,
          sku: p.sku ?? p.id,
          slug: p.slug ?? p.id,
          name: formatProductDisplayName(p.name),
          category: p.category ?? 'other',
          sub_category: p.sub_category ?? null,
          price: Number(p.price) || 0,
          price_per_carat: null,
          compare_price: null,
          carat_weight: p.carat_weight ?? null,
          ratti_weight: null,
          origin: p.origin ?? null,
          shape: null,
          certification: null,
          images: Array.isArray(p.images) ? p.images : [],
          thumbnail_url: p.thumbnail_url ?? (productImage(p) || null),
          in_stock: true,
          stock_quantity: 1,
          stock_status: 'in_stock',
          sold_individually: true,
          featured: false,
          is_directors_pick: false,
          treatment: null as unknown as string,
          planet: null as unknown as string,
          created_at: new Date().toISOString(),
          configurator_enabled: Boolean(p.configurator_enabled),
          tag_number: p.tag_number,
        } as ProductCard);
      } else {
        setConfiguringComboIds([]);
        setConfiguringProduct({ ...card, name: formatProductDisplayName(card.name) });
      }
      setProductQuery('');
      setProductHits([]);
    } finally {
      setLoadingConfigure(false);
    }
  }

  function openConfigurator(product: ProductCard, comboProductIds: string[] = []) {
    if (items.some((i) => i.product_id === product.id)) {
      setError('This product is already on the order (unique pieces only).');
      return;
    }
    setError('');
    setConfiguringComboIds(comboProductIds);
    setConfiguringProduct({ ...product, name: formatProductDisplayName(product.name) });
  }

  function handleConfigured(result: ConfiguredOrderResult) {
    const p = result.product;
    setItems((prev) => [
      ...prev.filter((i) => i.product_id !== p.id),
      {
        key: `${p.id}-${Date.now()}`,
        product_id: p.id,
        name: formatProductDisplayName(p.name),
        sku: p.sku ?? undefined,
        tag_number: p.tag_number ?? null,
        price: Number(result.verified_total) || Number(p.price) || 0,
        quantity: 1,
        image_url: p.thumbnail_url ?? (Array.isArray(p.images) ? String(p.images[0] ?? '') : ''),
        category: p.category ?? undefined,
        design_id: result.design_id ?? undefined,
        design_name: result.design_name ?? undefined,
        configuration_id: result.configuration_id,
        configuration_summary: result.configuration_summary
          ? formatProductDisplayName(result.configuration_summary)
          : undefined,
        configuration_snapshot: result.configuration_snapshot,
        delivery_eta_label: result.delivery_eta?.label,
      },
    ]);
    setConfiguringProduct(null);
    setConfiguringComboIds([]);
  }

  const quotePayload = useMemo(
    () => ({
      items: items.map((i) => ({
        line_id: i.key,
        product_id: i.product_id,
        quantity: i.quantity,
        name: i.name,
        sku: i.sku,
        tag_number: i.tag_number,
        price: i.price,
        image_url: i.image_url,
        category: i.category,
        design_id: i.design_id,
        design_name: i.design_name,
        configuration_id: i.configuration_id,
        configuration_summary: i.configuration_summary,
        configuration_snapshot: i.configuration_snapshot,
        delivery_eta_label: i.delivery_eta_label,
        manual_design: i.manual_design,
      })),
      fulfillment_type: fulfillmentType,
      shipping_method: fulfillmentType === 'delivery' ? shippingMethod || undefined : undefined,
      shipping_address: addr,
      coupon_code: couponCode.trim() || undefined,
      manual_discount: Number(manualDiscount) || 0,
      customer_id: customerId,
    }),
    [items, fulfillmentType, shippingMethod, addr, couponCode, manualDiscount, customerId],
  );

  const refreshQuote = useCallback(async () => {
    if (items.length === 0) {
      setPricing(null);
      return;
    }
    if (fulfillmentType === 'delivery' && (!shippingMethod || !addr.line1 || !addr.city || !addr.pincode)) {
      setPricingError('Complete delivery address and shipping method to quote.');
      return;
    }
    setQuoting(true);
    setPricingError('');
    const res = await fetch('/api/admin/orders/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotePayload),
    });
    const data = await res.json().catch(() => ({}));
    setQuoting(false);
    if (!res.ok) {
      setPricing(null);
      setPricingError(getApiErrorMessage(data, data.error || 'Quote failed'));
      return;
    }
    setPricing(data.pricing as Pricing);
    const nextTotal = Number(data.pricing?.total);
    if (Number.isFinite(nextTotal)) {
      setPayAmount((prev) => {
        const prevN = Number(prev);
        // Empty, invalid, or over the new total → default to full payment of current total
        if (!prev.trim() || !Number.isFinite(prevN) || prevN <= 0 || prevN > nextTotal + 0.009) {
          return String(nextTotal);
        }
        return prev;
      });
    }
  }, [items.length, fulfillmentType, shippingMethod, addr, quotePayload]);

  useEffect(() => {
    if (step < 2 || items.length === 0) return;
    const t = setTimeout(() => void refreshQuote(), 400);
    return () => clearTimeout(t);
  }, [step, refreshQuote, items.length]);

  // Entering payment: clamp amount if quote changed while on earlier steps
  useEffect(() => {
    if (step !== 4 || !pricing) return;
    setPayAmount((prev) => {
      const prevN = Number(prev);
      if (!prev.trim() || !Number.isFinite(prevN) || prevN <= 0 || prevN > pricing.total + 0.009) {
        return String(pricing.total);
      }
      return prev;
    });
  }, [step, pricing]);

  function stepBlockedReason(): string {
    if (step === 0) {
      if (fullName.trim().length < 2) return 'Enter the customer full name (at least 2 characters).';
      if (!isValidOfflinePhone(phone)) {
        return 'Enter a valid phone number (10 digits; spaces/dashes ok). Optional +country code.';
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Enter a valid email address, or leave email blank.';
      }
      if (!isValidGstin(gstin)) return 'Enter a valid GSTIN, or leave GSTIN blank.';
      if (addr.line1.trim().length < 5) return 'Billing address must be at least 5 characters.';
      if (addr.city.trim().length < 2) return 'Enter city.';
      if (addr.state.trim().length < 2) return 'Enter state.';
      if (addr.country_code === 'IN' && !isValidIndianPincode(addr.pincode)) {
        return 'Enter a valid 6-digit Indian pincode.';
      }
      if (addr.pincode.trim().length < 2) return 'Enter postal / pin code.';
      return '';
    }
    if (step === 1) {
      if (items.length === 0) return 'Add at least one product or manual design.';
      return '';
    }
    if (step === 2) {
      if (pricingError) return pricingError;
      if (!pricing) return 'Wait for the price quote to finish, or fix quote errors above.';
      return '';
    }
    if (step === 3) {
      if (fulfillmentType === 'delivery') {
        if (!shippingMethod) return 'Select a shipping method for delivery.';
        if (!addr.line1.trim() || !addr.city.trim() || !addr.state.trim()) {
          return 'Complete the delivery address.';
        }
        if (addr.country_code === 'IN' && !isValidIndianPincode(addr.pincode)) {
          return 'Enter a valid 6-digit Indian pincode for delivery.';
        }
      }
      return '';
    }
    if (step === 4) {
      if (!pricing) return 'Order total is missing — go back to Charges and refresh the quote.';
      const amt = Number(payAmount);
      if (!Number.isFinite(amt) || amt <= 0) return 'Enter a payment amount greater than zero.';
      if (amt > pricing.total + 0.009) return `Payment cannot exceed order total (${fmt(pricing.total)}).`;
      if (!payMethod) return 'Select a payment method.';
      return '';
    }
    return '';
  }

  async function submit() {
    const blocked = stepBlockedReason();
    if (blocked) {
      setError(blocked);
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: customerId,
        contact: {
          full_name: fullName.trim(),
          phone: normalizeOfflinePhone(phone.trim()),
          email: email.trim(),
          billing_gstin: gstin.trim(),
        },
        customer_address: addr,
        items: quotePayload.items,
        fulfillment_type: fulfillmentType,
        shipping_method: fulfillmentType === 'delivery' ? shippingMethod : undefined,
        shipping_address: fulfillmentType === 'delivery' ? addr : undefined,
        special_instructions: notes.trim() || undefined,
        coupon_code: couponCode.trim() || undefined,
        manual_discount: Number(manualDiscount) || 0,
        commissions: commissions
          .filter((entry) => entry.name.trim() && entry.amount !== '')
          .map((entry) => ({
            source: entry.source,
            name: entry.name.trim(),
            amount: Number(entry.amount),
          })),
        payment: {
          amount: Number(payAmount),
          method: payMethod,
          reference: payRef.trim() || undefined,
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(getApiErrorMessage(data, data.error || 'Failed to create order'));
      return;
    }
    router.push(`/admin/orders/${data.order_id}`);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/admin/orders"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" /> Orders
          </Link>
          <h1 className="font-heading text-2xl font-bold text-[var(--pvg-primary)] sm:text-3xl">
            New offline order
          </h1>
          <p className="mt-1 text-sm text-[var(--pvg-muted)]">
            Walk-in / counter sale with advance or full payment. Items are reserved on create; mark sold later from the order page.
          </p>
        </div>
      </div>

      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => i <= step && setStep(i)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                i === step
                  ? 'bg-amber-100 text-amber-900'
                  : i < step
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <User className="h-4 w-4" /> Customer
            </div>
            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Search existing customers by name, phone, email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500"
            />
            {customerHits.length > 0 && (
              <ul className="divide-y rounded-lg border border-gray-100">
                {customerHits.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-amber-50"
                      onClick={() => {
                        setCustomerId(c.id);
                        setFullName(c.full_name || '');
                        setPhone(c.phone || '');
                        setEmail(c.email || '');
                        const savedAddress =
                          c.addresses?.[c.default_address_index ?? 0] ?? c.addresses?.[0];
                        if (savedAddress) {
                          setAddr((current) => ({ ...current, ...savedAddress }));
                        }
                        setCustomerHits([]);
                        setCustomerQuery(c.full_name || c.phone || '');
                      }}
                    >
                      <span className="font-medium">{c.full_name || 'Customer'}</span>
                      <span className="text-xs text-gray-500">
                        {[c.phone, c.email].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Full name *</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-amber-500"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Phone *</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210 or +91 98765 43210"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-amber-500"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-amber-500"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">GSTIN (optional)</span>
                <input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-amber-500"
                />
              </label>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="mb-3 text-sm font-semibold text-gray-900">Customer address *</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-gray-600">Address line 1 *</span>
                  <input
                    value={addr.line1}
                    onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-gray-600">Address line 2</span>
                  <input
                    value={addr.line2}
                    onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                {(['city', 'state', 'pincode'] as const).map((fieldName) => (
                  <label key={fieldName} className="text-sm">
                    <span className="mb-1 block capitalize text-gray-600">
                      {fieldName === 'pincode' ? 'Pincode (6 digits) *' : `${fieldName} *`}
                    </span>
                    <input
                      value={addr[fieldName]}
                      onChange={(e) => setAddr((a) => ({ ...a, [fieldName]: e.target.value }))}
                      placeholder={fieldName === 'pincode' ? '302001' : undefined}
                      inputMode={fieldName === 'pincode' ? 'numeric' : undefined}
                      maxLength={fieldName === 'pincode' ? 6 : undefined}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Package className="h-4 w-4" /> Products & designs
            </div>
            <p className="text-xs text-gray-500">
              Same flow as the website: pick Navaratna / Uparatna / Rudraksha, filter and browse with images,
              then configure setting, design, metal, certification, and energization.
            </p>

            <OfflinePosCatalogPicker onConfigure={openConfigurator} />

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-stone-700">
                Add any catalog product by tag number, SKU, or name
              </p>
              <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Search products by name, SKU, tag…"
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-amber-500"
                    />
                  </div>
                  {searchingProducts ? (
                    <p className="text-sm text-gray-500">Searching…</p>
                  ) : productHits.length > 0 ? (
                    <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border">
                      {productHits.map((p) => {
                        const configurable = isGemConfiguratorEnabled(p.category, p.configurator_enabled);
                        const img = productImage(p);
                        return (
                          <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <div className="flex min-w-0 items-center gap-2">
                              {img ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={img} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                              ) : (
                                <div className="h-10 w-10 shrink-0 rounded bg-stone-100" />
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-medium">{formatProductDisplayName(p.name)}</p>
                                <p className="text-xs text-gray-500">
                                  {[p.sku, p.tag_number, fmt(Number(p.price) || 0)].filter(Boolean).join(' · ')}
                                  {configurable ? ' · Configurable' : ''}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => void addProduct(p)}
                              disabled={loadingConfigure}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-semibold text-amber-900 disabled:opacity-50"
                            >
                              {configurable ? (
                                <>
                                  <Palette className="h-3.5 w-3.5" /> Configure
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5" /> Add
                                </>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {loadingConfigure ? (
                    <p className="inline-flex items-center gap-2 text-sm text-amber-800">
                      <Loader2 className="h-4 w-4 animate-spin" /> Opening configurator…
                    </p>
                  ) : null}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowManualDesign((value) => !value)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900"
              >
                <Plus className="h-3.5 w-3.5" />
                {showManualDesign ? 'Close manual design' : 'Add customer-provided manual design'}
              </button>
              {showManualDesign ? (
                <div className="mt-3 grid gap-3 rounded-lg border border-amber-100 bg-amber-50/50 p-3 sm:grid-cols-2">
                  <label className="text-sm sm:col-span-2">
                    <span className="mb-1 block text-gray-600">Design name *</span>
                    <input
                      value={manualDesign.name}
                      onChange={(e) => setManualDesign((value) => ({ ...value, name: e.target.value }))}
                      placeholder="e.g. Customer sketch ring"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    <span className="mb-1 block text-gray-600">Design details</span>
                    <textarea
                      rows={2}
                      value={manualDesign.description}
                      onChange={(e) => setManualDesign((value) => ({ ...value, description: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2"
                    />
                  </label>
                  {(
                    [
                      ['item_price', 'Stone / item price (₹)'],
                      ['metal_price', 'Metal price (₹)'],
                      ['labour_charge', 'Labour charge (₹)'],
                      ['other_charge', 'Other charge (₹)'],
                    ] as const
                  ).map(([fieldName, label]) => (
                    <label key={fieldName} className="text-sm">
                      <span className="mb-1 block text-gray-600">{label}</span>
                      <input
                        type="number"
                        min={0}
                        value={manualDesign[fieldName]}
                        onChange={(e) =>
                          setManualDesign((value) => ({ ...value, [fieldName]: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2"
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={addManualDesign}
                    className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-950 sm:col-span-2"
                  >
                    Add manual design
                  </button>
                </div>
              ) : null}
            </div>

            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No items yet. Browse a category and configure a stone.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.key} className="rounded-lg border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-3">
                        {item.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image_url}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded bg-stone-100" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {[item.sku, item.tag_number, fmt(item.price)].filter(Boolean).join(' · ')}
                          </p>
                          {item.configuration_summary ? (
                            <p className="mt-1 text-xs text-indigo-800">{item.configuration_summary}</p>
                          ) : item.design_name ? (
                            <p className="mt-1 text-xs text-gray-600">Design: {item.design_name}</p>
                          ) : null}
                          {item.configuration_id ? (
                            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                              Configured
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                        className="text-red-600 hover:text-red-800"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <IndianRupee className="h-4 w-4" /> Charges & commission
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Manual discount (₹)</span>
                <input
                  type="number"
                  min={0}
                  value={manualDiscount}
                  onChange={(e) => setManualDiscount(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Coupon code</span>
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>
            </div>
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">Commission recipients</p>
                <button
                  type="button"
                  onClick={() =>
                    setCommissions((entries) => [
                      ...entries,
                      { source: 'salesperson', name: '', amount: '' },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900"
                >
                  <Plus className="h-3.5 w-3.5" /> Add recipient
                </button>
              </div>
              {commissions.length === 0 ? (
                <p className="text-xs text-gray-500">No commission recipients.</p>
              ) : (
                commissions.map((entry, index) => (
                  <div key={index} className="grid gap-2 rounded-lg border border-gray-100 p-3 sm:grid-cols-[1fr_1.5fr_1fr_auto]">
                    <select
                      aria-label={`Commission source ${index + 1}`}
                      value={entry.source}
                      onChange={(e) =>
                        setCommissions((entries) =>
                          entries.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, source: e.target.value as Commission['source'] }
                              : item,
                          ),
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="salesperson">Salesperson</option>
                      <option value="astrologer">Astrologer</option>
                    </select>
                    <input
                      aria-label={`Commission name ${index + 1}`}
                      value={entry.name}
                      onChange={(e) =>
                        setCommissions((entries) =>
                          entries.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, name: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Person’s name"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <input
                      aria-label={`Commission amount ${index + 1}`}
                      type="number"
                      min={0}
                      value={entry.amount}
                      onChange={(e) =>
                        setCommissions((entries) =>
                          entries.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, amount: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder="Amount ₹"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCommissions((entries) => entries.filter((_, itemIndex) => itemIndex !== index))
                      }
                      aria-label={`Remove commission recipient ${index + 1}`}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => void refreshQuote()}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              {quoting ? 'Calculating…' : 'Recalculate totals'}
            </button>
            {pricingError ? <p className="text-sm text-red-600">{pricingError}</p> : null}
            {pricing ? <PosPriceBreakdown pricing={pricing} couponCode={couponCode.trim()} /> : null}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Truck className="h-4 w-4" /> Fulfillment
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['in_store', 'In-store'],
                  ['pickup', 'Pickup'],
                  ['delivery', 'Delivery'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFulfillmentType(value)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                    fulfillmentType === value
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {fulfillmentType === 'delivery' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-gray-600">Address line 1</span>
                  <input
                    value={addr.line1}
                    onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-gray-600">Address line 2</span>
                  <input
                    value={addr.line2}
                    onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-600">City</span>
                  <input
                    value={addr.city}
                    onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-600">State</span>
                  <input
                    value={addr.state}
                    onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-600">Pincode</span>
                  <input
                    value={addr.pincode}
                    onChange={(e) => setAddr((a) => ({ ...a, pincode: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block text-gray-600">Shipping method</span>
                  <select
                    value={shippingMethod}
                    onChange={(e) => setShippingMethod(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <option value="">Select…</option>
                    {shippingPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} — {fmt(Number(p.cost) || 0)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No shipping charge for {fulfillmentType.replace('_', ' ')}.</p>
            )}
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600">Special instructions</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <CreditCard className="h-4 w-4" /> Payment
            </div>
            {pricing ? <PosPriceBreakdown pricing={pricing} couponCode={couponCode.trim()} /> : null}
            {pricing ? (
              <p className="text-sm text-gray-600">
                Enter advance or full amount (max <strong>{fmt(pricing.total)}</strong>).
              </p>
            ) : (
              <p className="text-sm text-amber-800">Totals not ready — go back to Charges and recalculate.</p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Amount paid now (₹) *</span>
                <input
                  type="number"
                  min={1}
                  max={pricing?.total}
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
                {pricing ? (
                  <button
                    type="button"
                    onClick={() => setPayAmount(String(pricing.total))}
                    className="mt-1 text-xs font-semibold text-amber-800 hover:underline"
                  >
                    Pay full {fmt(pricing.total)}
                  </button>
                ) : null}
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Method *</span>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-gray-600">Reference (UPI ref / txn id)</span>
                <input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2"
                />
              </label>
            </div>
            {pricing && Number(payAmount) > pricing.total + 0.009 ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                Amount cannot exceed order total ({fmt(pricing.total)}). It was likely left from an older quote —
                use <strong>Pay full</strong> or enter an advance up to the total.
              </p>
            ) : null}
            {pricing && Number(payAmount) > 0 && Number(payAmount) < pricing.total - 0.009 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Advance {fmt(Number(payAmount))}. Balance due later:{' '}
                <strong>{fmt(pricing.total - Number(payAmount))}</strong>
              </p>
            ) : null}
            {pricing && Math.abs(Number(payAmount) - pricing.total) <= 0.009 ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Full payment — order will be marked paid.
              </p>
            ) : null}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Check className="h-4 w-4" /> Review
            </div>
            <p>
              <span className="text-gray-500">Customer:</span> {fullName} · {phone}
              {email ? ` · ${email}` : ''}
            </p>
            <p>
              <span className="text-gray-500">Items:</span> {items.map((i) => i.name).join(', ')}
            </p>
            <ul className="space-y-1 text-xs text-gray-600">
              {items.map((item) => (
                <li key={item.key}>
                  {item.name}
                  {item.configuration_summary ? ` — ${item.configuration_summary}` : ''}
                  {' · '}
                  {fmt(item.price)}
                </li>
              ))}
            </ul>
            <p>
              <span className="text-gray-500">Fulfillment:</span> {fulfillmentType.replace('_', ' ')}
            </p>
            {pricing ? <PosPriceBreakdown pricing={pricing} couponCode={couponCode.trim()} /> : null}
            {pricing ? (
              <p>
                <span className="text-gray-500">Paying now:</span> {fmt(Number(payAmount) || 0)} via{' '}
                {payMethod}
                {pricing.total - Number(payAmount) > 0.009
                  ? ` · Due ${fmt(pricing.total - Number(payAmount))}`
                  : ' · Fully paid'}
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          disabled={step === 0 || busy}
          onClick={() => {
            setError('');
            setStep((s) => Math.max(0, s - 1));
          }}
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              const blocked = stepBlockedReason();
              if (blocked) {
                setError(blocked);
                return;
              }
              setError('');
              if (step === 1 || step === 2 || step === 3) void refreshQuote();
              setStep((s) => s + 1);
            }}
            className="rounded-lg bg-[var(--pvg-primary)] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void submit()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create offline order
          </button>
        )}
      </div>

      {configuringProduct ? (
        <AdminPosConfigurator
          product={configuringProduct}
          comboProductIds={configuringComboIds}
          onConfigured={handleConfigured}
          onClose={() => {
            setConfiguringProduct(null);
            setConfiguringComboIds([]);
          }}
        />
      ) : null}
    </div>
  );
}
