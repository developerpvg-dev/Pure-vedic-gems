import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  addressSchema,
  createAddressId,
  normalizeDefaultIndex,
  parseCustomerAddresses,
  serializeCustomerAddresses,
  type CustomerAddress,
} from '@/lib/customer/address-book';
import type { CustomerProfile } from '@/lib/types/database';

const idSchema = z.object({ id: z.string().min(1) });

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from('customer_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const typedProfile = profile as CustomerProfile | null;
  return { supabase, user, profile: typedProfile };
}

async function saveAddresses(
  context: Exclude<Awaited<ReturnType<typeof getContext>>, { error: NextResponse }>,
  addresses: CustomerAddress[],
  defaultIndex: number
) {
  const normalizedDefaultIndex = normalizeDefaultIndex(addresses, defaultIndex);
  const payload = {
    id: context.user.id,
    email: context.user.email ?? context.profile?.email ?? null,
    addresses: serializeCustomerAddresses(addresses),
    default_address_index: normalizedDefaultIndex,
    updated_at: new Date().toISOString(),
  };

  const { error } = await context.supabase
    .from('customer_profiles')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    return NextResponse.json({ error: 'Failed to save addresses' }, { status: 500 });
  }

  return NextResponse.json({
    addresses: addresses.map((address, index) => ({ ...address, is_default: index === normalizedDefaultIndex })),
    default_address_index: normalizedDefaultIndex,
  });
}

export async function GET() {
  const context = await getContext();
  if ('error' in context) return context.error;
  const addresses = parseCustomerAddresses(context.profile?.addresses ?? [], context.profile?.default_address_index ?? 0);
  return NextResponse.json({ addresses, default_address_index: context.profile?.default_address_index ?? 0 });
}

export async function POST(request: NextRequest) {
  const context = await getContext();
  if ('error' in context) return context.error;

  const parsed = addressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid address details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const addresses = parseCustomerAddresses(context.profile?.addresses ?? [], context.profile?.default_address_index ?? 0);
  const nextAddress: CustomerAddress = { ...parsed.data, id: createAddressId(), is_default: addresses.length === 0 };
  return saveAddresses(context, [...addresses, nextAddress], addresses.length === 0 ? 0 : context.profile?.default_address_index ?? 0);
}

export async function PUT(request: NextRequest) {
  const context = await getContext();
  if ('error' in context) return context.error;

  const parsed = addressSchema.extend({ id: z.string().min(1) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid address details', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const addresses = parseCustomerAddresses(context.profile?.addresses ?? [], context.profile?.default_address_index ?? 0);
  const targetIndex = addresses.findIndex((address) => address.id === parsed.data.id);
  if (targetIndex < 0) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

  const updated = addresses.map((address) => address.id === parsed.data.id ? { ...parsed.data, is_default: address.is_default } : address);
  return saveAddresses(context, updated, context.profile?.default_address_index ?? targetIndex);
}

export async function PATCH(request: NextRequest) {
  const context = await getContext();
  if ('error' in context) return context.error;

  const parsed = idSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Address id is required' }, { status: 400 });

  const addresses = parseCustomerAddresses(context.profile?.addresses ?? [], context.profile?.default_address_index ?? 0);
  const targetIndex = addresses.findIndex((address) => address.id === parsed.data.id);
  if (targetIndex < 0) return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  return saveAddresses(context, addresses, targetIndex);
}

export async function DELETE(request: NextRequest) {
  const context = await getContext();
  if ('error' in context) return context.error;

  const parsed = idSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Address id is required' }, { status: 400 });

  const addresses = parseCustomerAddresses(context.profile?.addresses ?? [], context.profile?.default_address_index ?? 0);
  const targetIndex = addresses.findIndex((address) => address.id === parsed.data.id);
  if (targetIndex < 0) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

  const nextAddresses = addresses.filter((address) => address.id !== parsed.data.id);
  const currentDefault = context.profile?.default_address_index ?? 0;
  const nextDefault = targetIndex < currentDefault ? currentDefault - 1 : targetIndex === currentDefault ? 0 : currentDefault;
  return saveAddresses(context, nextAddresses, nextDefault);
}