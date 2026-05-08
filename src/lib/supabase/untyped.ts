export type SupabaseErrorLike = { message?: string; code?: string; details?: string; hint?: string };

export type SupabaseResult<T = unknown> = {
  data: T | null;
  error: SupabaseErrorLike | null;
  count?: number | null;
};

export type UntypedQuery<T = unknown> = PromiseLike<SupabaseResult<T>> & {
  select: (...args: unknown[]) => UntypedQuery<T>;
  insert: (...args: unknown[]) => UntypedQuery<T>;
  update: (...args: unknown[]) => UntypedQuery<T>;
  upsert: (...args: unknown[]) => UntypedQuery<T>;
  delete: (...args: unknown[]) => UntypedQuery<T>;
  eq: (...args: unknown[]) => UntypedQuery<T>;
  neq: (...args: unknown[]) => UntypedQuery<T>;
  or: (...args: unknown[]) => UntypedQuery<T>;
  ilike: (...args: unknown[]) => UntypedQuery<T>;
  in: (...args: unknown[]) => UntypedQuery<T>;
  gte: (...args: unknown[]) => UntypedQuery<T>;
  order: (...args: unknown[]) => UntypedQuery<T>;
  limit: (...args: unknown[]) => UntypedQuery<T>;
  single: () => Promise<SupabaseResult<T>>;
  maybeSingle: () => Promise<SupabaseResult<T>>;
};

export type UntypedSupabase = {
  from: <T = unknown>(table: string) => UntypedQuery<T>;
};

export function asUntypedSupabase(client: unknown): UntypedSupabase {
  return client as UntypedSupabase;
}