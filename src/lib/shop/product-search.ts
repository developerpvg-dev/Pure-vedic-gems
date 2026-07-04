type TextSearchQuery = {
  textSearch?(column: string, query: string, options?: { type?: string; config?: string }): TextSearchQuery;
  or(filters: string): TextSearchQuery;
};

/** Sanitize user input for PostgREST filter values. */
export function sanitizeProductSearchQuery(query: string) {
  return query.replace(/[%,]/g, ' ').trim();
}

/** Fallback when search_vector column is not migrated yet. */
export function applyProductIlikeSearch<T extends TextSearchQuery>(query: T, rawQuery: string): T {
  const term = sanitizeProductSearchQuery(rawQuery);
  if (!term) return query;

  const searchTerm = `%${term}%`;
  return query.or(
    `name.ilike.${searchTerm},sku.ilike.${searchTerm},tag_number.ilike.${searchTerm},vedic_name.ilike.${searchTerm},origin.ilike.${searchTerm},planet.ilike.${searchTerm},short_desc.ilike.${searchTerm}`,
  ) as T;
}

/** Apply GIN-indexed full-text search on products.search_vector when available. */
export function applyProductTextSearch<T extends TextSearchQuery>(query: T, rawQuery: string): T {
  const term = sanitizeProductSearchQuery(rawQuery);
  if (!term) return query;

  if (typeof query.textSearch === 'function') {
    return query.textSearch('search_vector', term, { type: 'websearch', config: 'english' }) as T;
  }

  return applyProductIlikeSearch(query, rawQuery);
}

export function isMissingSearchVectorError(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    message.includes('search_vector') ||
    (message.includes('column') && message.includes('does not exist')) ||
    error.code === '42703'
  );
}
