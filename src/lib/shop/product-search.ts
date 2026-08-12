type TextSearchQuery = {
  textSearch?(column: string, query: string, options?: { type?: string; config?: string }): TextSearchQuery;
  or(filters: string): TextSearchQuery;
};

export type ProductWeightSearch = {
  value: number;
  min: number;
  max: number;
  unit: 'carat' | 'ratti' | 'any';
  token: string;
};

/** Sanitize user input for PostgREST filter values. */
export function sanitizeProductSearchQuery(query: string) {
  return query.replace(/[%,]/g, ' ').trim();
}

/**
 * Parse ct / ratti / bare-decimal weights from a search string.
 * Integer-only queries like "7" stay text so "7 mukhi" is not treated as 7ct.
 */
export function parseProductWeightSearch(raw: string): ProductWeightSearch | null {
  const term = sanitizeProductSearchQuery(raw);
  if (!term) return null;

  const unitMatch = term.match(/(\d+(?:\.\d+)?)\s*(ct|carats?|ratti)\b/i);
  if (unitMatch?.[1] && unitMatch[2]) {
    const value = Number(unitMatch[1]);
    if (!Number.isFinite(value) || value <= 0) return null;
    const exact = unitMatch[1].includes('.');
    return {
      value,
      min: value,
      max: exact ? value : Number((value + 0.99).toFixed(2)),
      unit: /ratti/i.test(unitMatch[2]) ? 'ratti' : 'carat',
      token: unitMatch[0],
    };
  }

  if (/^\d+\.\d+$/.test(term)) {
    const value = Number(term);
    if (!Number.isFinite(value) || value <= 0) return null;
    return { value, min: value, max: value, unit: 'any', token: term };
  }

  return null;
}

function textSearchClauses(term: string) {
  const searchTerm = `%${term}%`;
  return [
    `name.ilike.${searchTerm}`,
    `sku.ilike.${searchTerm}`,
    `tag_number.ilike.${searchTerm}`,
    `vedic_name.ilike.${searchTerm}`,
    `origin.ilike.${searchTerm}`,
    `planet.ilike.${searchTerm}`,
    `short_desc.ilike.${searchTerm}`,
  ];
}

function weightSearchClauses(weight: ProductWeightSearch) {
  const carat = `and(carat_weight.gte.${weight.min},carat_weight.lte.${weight.max})`;
  const ratti = `and(ratti_weight.gte.${weight.min},ratti_weight.lte.${weight.max})`;
  const nameCt = `name.ilike.%${weight.value}ct%`;
  const nameCtSpace = `name.ilike.%${weight.value} ct%`;
  const nameRatti = `name.ilike.%${weight.value} ratti%`;

  if (weight.unit === 'ratti') return [ratti, nameRatti];
  if (weight.unit === 'carat') return [carat, nameCt, nameCtSpace];
  return [carat, ratti, nameCt, nameCtSpace];
}

/** Fallback when search_vector column is not migrated yet. Also matches carat/ratti weight. */
export function applyProductIlikeSearch<T extends TextSearchQuery>(query: T, rawQuery: string): T {
  const term = sanitizeProductSearchQuery(rawQuery);
  if (!term) return query;

  const weight = parseProductWeightSearch(term);
  const textTerm = weight ? term.replace(weight.token, ' ').replace(/\s+/g, ' ').trim() : term;

  if (textTerm) {
    query = query.or(textSearchClauses(textTerm).join(',')) as T;
  }
  if (weight) {
    query = query.or(weightSearchClauses(weight).join(',')) as T;
  }
  return query;
}

/** Apply GIN-indexed full-text search on products.search_vector when available. */
export function applyProductTextSearch<T extends TextSearchQuery>(query: T, rawQuery: string): T {
  const term = sanitizeProductSearchQuery(rawQuery);
  if (!term) return query;

  if (typeof query.textSearch === 'function' && !parseProductWeightSearch(term)) {
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
