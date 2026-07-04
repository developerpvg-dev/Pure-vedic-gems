const IS_PRODUCTION_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

const DEFAULT_TIMEOUT_MS =
  Number(process.env.SUPABASE_FETCH_TIMEOUT_MS) ||
  (IS_PRODUCTION_BUILD ? 5_000 : process.env.NODE_ENV === 'development' ? 8_000 : 20_000);

const RETRY_DELAY_MS = 400;
const MAX_ATTEMPTS = IS_PRODUCTION_BUILD ? 1 : 2;

function isAbortError(error: unknown) {
  return error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));
}

/**
 * Bounded fetch for Supabase REST calls with one retry when the DB is slow or throttled.
 */
export function createSupabaseFetch(timeoutMs = DEFAULT_TIMEOUT_MS): typeof fetch {
  return async (input, init) => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      if (init?.signal) {
        if (init.signal.aborted) controller.abort(init.signal.reason);
        else init.signal.addEventListener('abort', () => controller.abort(init.signal?.reason), { once: true });
      }

      try {
        return await fetch(input, { ...init, signal: controller.signal });
      } catch (error) {
        if (attempt === 0 && isAbortError(error)) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          continue;
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new Error('Supabase fetch failed after retry');
  };
}

export const supabaseFetch = createSupabaseFetch();
