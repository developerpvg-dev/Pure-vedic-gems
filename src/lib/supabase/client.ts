'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

function getBrowserCredentials() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  };
}

export function hasBrowserSupabaseConfig() {
  const { supabaseUrl, anonKey } = getBrowserCredentials();
  return Boolean(supabaseUrl && anonKey);
}

export function createClient() {
  const { supabaseUrl, anonKey } = getBrowserCredentials();

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase public credentials');
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    anonKey
  );
}

export function createOptionalClient() {
  return hasBrowserSupabaseConfig() ? createClient() : null;
}
