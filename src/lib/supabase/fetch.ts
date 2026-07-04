const SUPABASE_FETCH_TIMEOUT_MS =
  process.env.NODE_ENV === 'development' ? 5_000 : 8_000;

/**
 * Bounded fetch for Supabase REST calls. Prevents undici from hanging for minutes
 * when the database is paused or unreachable.
 */
export function createSupabaseFetch(timeoutMs = SUPABASE_FETCH_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    if (init?.signal) {
      if (init.signal.aborted) controller.abort(init.signal.reason);
      else init.signal.addEventListener('abort', () => controller.abort(init.signal?.reason), { once: true });
    }

    try {
      return await fetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

export const supabaseFetch = createSupabaseFetch();
