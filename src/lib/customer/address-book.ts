import { z } from 'zod';
import type { Json } from '@/lib/types/database';

export const addressSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().trim().min(1).max(40).default('Home'),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  line1: z.string().trim().min(5).max(180),
  line2: z.string().trim().max(180).optional().nullable(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  pincode: z.string().trim().min(4).max(12),
  country: z.string().trim().min(2).max(80).default('India'),
  gst_number: z.string().trim().max(20).optional().nullable(),
  gst_business_name: z.string().trim().max(160).optional().nullable(),
  phone_verified: z.boolean().default(false),
});

export type CustomerAddress = z.infer<typeof addressSchema> & { id: string; is_default?: boolean };

export function createAddressId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function parseCustomerAddresses(value: Json, defaultIndex = 0): CustomerAddress[] {
  if (!Array.isArray(value)) return [];

  const addresses: CustomerAddress[] = [];
  value.forEach((entry, index) => {
    const parsed = addressSchema.safeParse(entry);
    if (!parsed.success) return;
    addresses.push({
      ...parsed.data,
      id: parsed.data.id ?? createAddressId(),
      is_default: index === defaultIndex,
    });
  });
  return addresses;
}

export function serializeCustomerAddresses(addresses: CustomerAddress[]): Json {
  return addresses.map((address) => ({
    id: address.id,
    label: address.label,
    full_name: address.full_name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 || null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    gst_number: address.gst_number || null,
    gst_business_name: address.gst_business_name || null,
    phone_verified: address.phone_verified,
  })) as Json;
}

export function normalizeDefaultIndex(addresses: CustomerAddress[], requestedIndex = 0) {
  if (addresses.length === 0) return 0;
  return Math.min(Math.max(requestedIndex, 0), addresses.length - 1);
}