import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

type RpcClient = SupabaseClient<Database> & {
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
};

export async function callRpc<T>(client: SupabaseClient<Database>, fn: string, args?: Record<string, unknown>) {
  const { data, error } = await (client as RpcClient).rpc(fn, args);
  if (error) {
    throw new Error(error.message ?? `RPC ${fn} failed`);
  }
  return data as T;
}

export async function tryRpc<T>(
  client: SupabaseClient<Database>,
  fn: string,
  args?: Record<string, unknown>,
): Promise<T | null> {
  try {
    return await callRpc<T>(client, fn, args);
  } catch {
    return null;
  }
}
