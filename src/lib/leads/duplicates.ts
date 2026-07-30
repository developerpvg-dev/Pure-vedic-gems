import type { createAdminClient } from '@/lib/supabase/admin';

type Admin = ReturnType<typeof createAdminClient>;

export type BirthTriplet = {
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
};

export type MatchedBirthField = 'dob' | 'time' | 'place';

export type DuplicateMatch = {
  id: string;
  lead_number: number | null;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  pipeline_stage: string;
  assigned_to: string | null;
  telecaller_name: string | null;
  created_at: string;
  status: 'duplicate' | 'potential';
  matched_fields: MatchedBirthField[];
};

const CANDIDATE_COLS =
  'id, lead_number, name, email, phone, date_of_birth, birth_time, birth_place, pipeline_stage, assigned_to, created_at';

export function normalizeDob(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const iso = raw.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : raw.trim();
}

/** Collapse common time strings to HH:MM (24h). */
export function normalizeTime(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim().toLowerCase().replace(/\./g, ':');
  const m = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?/);
  if (!m) return s.replace(/\s+/g, ' ');
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = m[3]?.replace(/\./g, '') ?? '';
  if (ap.startsWith('p') && h < 12) h += 12;
  if (ap.startsWith('a') && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${min}`;
}

export function normalizePlace(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,/-]/gu, '')
    .replace(/\s+/g, ' ');
}

export function birthFieldCount(row: BirthTriplet): number {
  return [normalizeDob(row.date_of_birth), normalizeTime(row.birth_time), normalizePlace(row.birth_place)].filter(
    Boolean
  ).length;
}

export function scoreBirthMatch(
  a: BirthTriplet,
  b: BirthTriplet
): { score: number; matched: MatchedBirthField[] } {
  const matched: MatchedBirthField[] = [];
  const dobA = normalizeDob(a.date_of_birth);
  const dobB = normalizeDob(b.date_of_birth);
  if (dobA && dobB && dobA === dobB) matched.push('dob');
  const timeA = normalizeTime(a.birth_time);
  const timeB = normalizeTime(b.birth_time);
  if (timeA && timeB && timeA === timeB) matched.push('time');
  const placeA = normalizePlace(a.birth_place);
  const placeB = normalizePlace(b.birth_place);
  if (placeA && placeB && placeA === placeB) matched.push('place');
  return { score: matched.length, matched };
}

export function classifyMatch(score: number): 'duplicate' | 'potential' | null {
  if (score >= 3) return 'duplicate';
  if (score >= 2) return 'potential';
  return null;
}

function isPriorLead(
  candidate: { id: string; created_at: string; lead_number?: number | null },
  lead: { id: string; created_at?: string | null; lead_number?: number | null }
) {
  if (candidate.id === lead.id) return false;
  if (!lead.created_at) return true;
  if (candidate.created_at < lead.created_at) return true;
  if (candidate.created_at > lead.created_at) return false;
  return (candidate.lead_number ?? 0) < (lead.lead_number ?? Number.MAX_SAFE_INTEGER);
}

function uniqueStrings(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

type CandidateRow = {
  id: string;
  lead_number: number | null;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  pipeline_stage: string;
  assigned_to: string | null;
  created_at: string;
};

async function loadCandidatePool(admin: Admin, leads: BirthTriplet[]): Promise<CandidateRow[]> {
  const eligible = leads.filter((l) => birthFieldCount(l) >= 2);
  if (!eligible.length) return [];

  const byId = new Map<string, CandidateRow>();
  const dobs = uniqueStrings(eligible.map((l) => normalizeDob(l.date_of_birth)));
  if (dobs.length) {
    const { data } = await admin.from('enquiries').select(CANDIDATE_COLS).in('date_of_birth', dobs).limit(500);
    for (const row of (data ?? []) as CandidateRow[]) byId.set(row.id, row);
  }

  // ponytail: also pull same place for time+place potentials when DOB differs. Ceiling: one .or() of page places.
  const rawPlaces = uniqueStrings(
    eligible
      .filter((l) => normalizeTime(l.birth_time) && normalizePlace(l.birth_place))
      .map((l) => l.birth_place?.trim())
  );
  if (rawPlaces.length) {
    const orFilter = rawPlaces
      .map((p) => {
        const safe = p.replace(/[%_"]/g, '').trim();
        return safe.includes(' ') || safe.includes(',')
          ? `birth_place.ilike."${safe}"`
          : `birth_place.ilike.${safe}`;
      })
      .filter((clause) => !clause.endsWith('.') && !clause.endsWith('."'))
      .join(',');
    if (orFilter) {
      const { data } = await admin
        .from('enquiries')
        .select(CANDIDATE_COLS)
        .or(orFilter)
        .not('birth_time', 'is', null)
        .limit(500);
      for (const row of (data ?? []) as CandidateRow[]) byId.set(row.id, row);
    }
  }

  return [...byId.values()];
}

async function telecallerNames(admin: Admin, assigneeIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const ids = uniqueStrings(assigneeIds);
  if (!ids.length) return map;
  const { data } = await admin.from('team_members').select('id, name').in('id', ids);
  for (const m of data ?? []) map.set(m.id as string, m.name as string);
  return map;
}

function matchesForLead(
  lead: BirthTriplet & { id: string; created_at?: string | null; lead_number?: number | null },
  pool: CandidateRow[],
  names: Map<string, string>
): DuplicateMatch[] {
  if (birthFieldCount(lead) < 2) return [];
  const out: DuplicateMatch[] = [];
  for (const c of pool) {
    if (!isPriorLead(c, lead)) continue;
    const { score, matched } = scoreBirthMatch(lead, c);
    const status = classifyMatch(score);
    if (!status) continue;
    out.push({
      id: c.id,
      lead_number: c.lead_number,
      name: c.name,
      email: c.email,
      phone: c.phone,
      date_of_birth: c.date_of_birth,
      birth_time: c.birth_time,
      birth_place: c.birth_place,
      pipeline_stage: c.pipeline_stage,
      assigned_to: c.assigned_to,
      telecaller_name: c.assigned_to ? names.get(c.assigned_to) ?? null : null,
      created_at: c.created_at,
      status,
      matched_fields: matched,
    });
  }
  out.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'duplicate' ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });
  return out;
}

/** Attach duplicate_status + duplicate_matches for a page of enquiry rows (batched). */
export async function attachDuplicateHints(
  admin: Admin,
  leads: (BirthTriplet & {
    id: string;
    created_at?: string | null;
    lead_number?: number | null;
  } & Record<string, unknown>)[]
) {
  const pool = await loadCandidatePool(admin, leads);
  const names = await telecallerNames(
    admin,
    pool.map((c) => c.assigned_to)
  );
  return leads.map((lead) => {
    const duplicate_matches = matchesForLead(lead, pool, names);
    return {
      ...lead,
      duplicate_status: (duplicate_matches[0]?.status ?? null) as 'duplicate' | 'potential' | null,
      duplicate_matches,
    };
  });
}

export async function findPriorDuplicateMatches(
  admin: Admin,
  lead: BirthTriplet & { id: string; created_at?: string | null; lead_number?: number | null }
): Promise<DuplicateMatch[]> {
  const [enriched] = await attachDuplicateHints(admin, [lead]);
  return (enriched.duplicate_matches ?? []) as DuplicateMatch[];
}

export function duplicateNotifySuffix(matches: DuplicateMatch[]): string {
  const best = matches[0];
  if (!best) return '';
  const kind = best.status === 'duplicate' ? 'Duplicate' : 'Potential duplicate';
  const tele = best.telecaller_name
    ? ` · previously with ${best.telecaller_name}`
    : ' · prior lead had no telecaller';
  return `${kind} of SR #${best.lead_number ?? '—'}${tele}`;
}

export function assertDuplicateScoring() {
  const a = { date_of_birth: '1990-01-15', birth_time: '10:30 AM', birth_place: 'New Delhi' };
  const exact = scoreBirthMatch(a, {
    date_of_birth: '1990-01-15',
    birth_time: '10:30:00',
    birth_place: 'new delhi',
  });
  if (exact.score !== 3 || classifyMatch(exact.score) !== 'duplicate') {
    throw new Error('exact birth triplet must be duplicate');
  }
  const potential = scoreBirthMatch(a, {
    date_of_birth: '1990-01-15',
    birth_time: '10:30 pm',
    birth_place: 'New Delhi',
  });
  if (potential.score !== 2 || classifyMatch(potential.score) !== 'potential') {
    throw new Error('two matching birth fields must be potential');
  }
  const none = scoreBirthMatch(a, {
    date_of_birth: '1991-01-15',
    birth_time: '11:00',
    birth_place: 'Mumbai',
  });
  if (classifyMatch(none.score) !== null) throw new Error('unrelated birth data must not match');
  if (normalizeTime('10:30 PM') !== '22:30') throw new Error('normalizeTime pm');
  if (normalizePlace('  New   Delhi ') !== 'new delhi') throw new Error('normalizePlace');
}
