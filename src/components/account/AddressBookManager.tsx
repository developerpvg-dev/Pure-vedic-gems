'use client';

import { useState } from 'react';
import { CheckCircle2, Home, Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CustomerAddress } from '@/lib/customer/address-book';

const EMPTY_FORM = {
  label: 'Home',
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  gst_number: '',
  gst_business_name: '',
};

type AddressForm = typeof EMPTY_FORM;

function toForm(address: CustomerAddress): AddressForm {
  return {
    label: address.label,
    full_name: address.full_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? '',
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    gst_number: address.gst_number ?? '',
    gst_business_name: address.gst_business_name ?? '',
  };
}

export function AddressBookManager({ initialAddresses }: { initialAddresses: CustomerAddress[] }) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = editingId !== null;

  const setField = (field: keyof AddressForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function refreshFromResponse(response: Response) {
    const data = await response.json().catch(() => null) as { addresses?: CustomerAddress[]; error?: string } | null;
    if (!response.ok || !data?.addresses) {
      throw new Error(data?.error ?? 'Address update failed');
    }
    setAddresses(data.addresses);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/account/addresses', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: editingId, ...form } : form),
      });
      await refreshFromResponse(response);
      setEditingId(null);
      setForm(EMPTY_FORM);
      toast.success(isEditing ? 'Address updated' : 'Address added');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save address');
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAddress(id: string) {
    setIsSaving(true);
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await refreshFromResponse(response);
      toast.success('Address removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove address');
    } finally {
      setIsSaving(false);
    }
  }

  async function setDefault(id: string) {
    setIsSaving(true);
    try {
      const response = await fetch('/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await refreshFromResponse(response);
      toast.success('Default address updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update default address');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <div className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-10 text-center">
            <Home className="mx-auto mb-4 h-10 w-10 text-[var(--pvg-accent)]" />
            <p className="font-heading text-xl text-[var(--pvg-primary)]">No saved addresses</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--pvg-muted)]">
              Add a shipping address once and reuse it across checkout, orders, and customer support.
            </p>
          </div>
        ) : (
          addresses.map((address) => (
            <article key={address.id} className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading text-lg text-[var(--pvg-primary)]">{address.label}</p>
                    {address.is_default && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--pvg-accent)]">
                        <Star className="h-3 w-3" fill="currentColor" /> Default
                      </span>
                    )}
                    {address.phone_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> Phone verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                        Phone unverified
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--pvg-primary)]">{address.full_name}</p>
                  <p className="text-sm text-[var(--pvg-muted)]">{address.phone}</p>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--pvg-text)]">
                    {[address.line1, address.line2, address.city, address.state, address.pincode, address.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {address.gst_number && (
                    <p className="mt-2 text-xs text-[var(--pvg-muted)]">
                      GST: {address.gst_number}{address.gst_business_name ? ` · ${address.gst_business_name}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => setDefault(address.id)}
                      disabled={isSaving}
                      className="rounded-lg border border-[var(--pvg-border)] px-3 py-2 text-xs font-semibold text-[var(--pvg-primary)] transition hover:border-[var(--pvg-accent)] disabled:opacity-60"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(address.id);
                      setForm(toForm(address));
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--pvg-border)] text-[var(--pvg-muted)] transition hover:text-[var(--pvg-accent)]"
                    aria-label="Edit address"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAddress(address.id)}
                    disabled={isSaving}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-60"
                    aria-label="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--pvg-border)] bg-brand-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[var(--pvg-accent)]" />
          <h2 className="font-heading text-lg text-[var(--pvg-primary)]">{isEditing ? 'Edit Address' : 'Add Address'}</h2>
        </div>
        <div className="space-y-3">
          {([
            ['label', 'Label'],
            ['full_name', 'Full name'],
            ['phone', 'Phone'],
            ['line1', 'Address line 1'],
            ['line2', 'Address line 2'],
            ['city', 'City'],
            ['state', 'State'],
            ['pincode', 'Pincode'],
            ['country', 'Country'],
            ['gst_number', 'GST number'],
            ['gst_business_name', 'GST business name'],
          ] as const).map(([field, label]) => (
            <label key={field} className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pvg-muted)]">{label}</span>
              <input
                value={form[field]}
                onChange={(event) => setField(field, event.target.value)}
                required={!['line2', 'gst_number', 'gst_business_name'].includes(field)}
                className="w-full rounded-lg border border-[var(--pvg-border)] bg-brand-bg px-3 py-2.5 text-sm text-[var(--pvg-text)] outline-none transition focus:border-[var(--pvg-accent)]"
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY_FORM);
              }}
              className="rounded-lg border border-[var(--pvg-border)] px-4 py-2.5 text-sm font-semibold text-[var(--pvg-muted)]"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold uppercase tracking-[0.14em] text-[var(--pvg-bg)] transition hover:bg-brand-accent disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Address' : 'Add Address'}
          </button>
        </div>
      </form>
    </div>
  );
}