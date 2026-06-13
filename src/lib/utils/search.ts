/**
 * Sanitize a free-text search term before it is interpolated into a
 * PostgREST `.or(...)` / `.ilike(...)` filter string.
 *
 * PostgREST parses `.or()` strings using `,` as a condition separator and
 * `(` `)` for grouping, while `%` and `_` are ilike wildcards. Leaving these
 * characters in user input allows a caller to inject additional filter
 * conditions or break the filter grammar. We strip every PostgREST
 * metacharacter and collapse whitespace, leaving a safe literal term.
 */
export function sanitizeSearchTerm(value: string): string {
  return value
    .replace(/[%,()*\\:"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a sanitized `%term%` ilike pattern for use inside PostgREST filters.
 * Returns null when the cleaned term is empty.
 */
export function buildIlikePattern(value: string): string | null {
  const cleaned = sanitizeSearchTerm(value);
  if (!cleaned) return null;
  return `%${cleaned}%`;
}
