import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

function getPublicCredentials() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  };
}

export function hasPublicSupabaseConfig() {
  const { supabaseUrl, anonKey } = getPublicCredentials();
  return Boolean(supabaseUrl && anonKey);
}

export function createPublicClient() {
  const { supabaseUrl, anonKey } = getPublicCredentials();

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase public credentials');
  }

  return createSupabaseClient<Database>(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createOptionalPublicClient() {
  return hasPublicSupabaseConfig() ? createPublicClient() : null;
}