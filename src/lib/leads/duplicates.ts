import type { createAdminClient } from '@/lib/supabase/admin';

type Admin = ReturnType<typeof createAdminClient>;

export type BirthTriplet = {
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
};

export type ContactFields = {
  email?: string | null;
  phone?: string | null;
  additional_emails?: string[] | null;
  additional_phones?: string[] | null;
};

export type LeadIdentity = BirthTriplet & ContactFields;

export type MatchedField = 'dob' | 'time' | 'place' | 'email' | 'phone';

/** @deprecated use MatchedField */
export type MatchedBirthField = MatchedField;

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
  matched_fields: MatchedField[];
};

const CANDIDATE_COLS =
  'id, lead_number, name, email, phone, additional_emails, additional_phones, date_of_birth, birth_time, birth_place, pipeline_stage, assigned_to, created_at';

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

export function normalizeEmail(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  return raw.trim().toLowerCase();
}

/** Digits only; last 10 for IN mobiles with/without country code. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return null;
  // ponytail: last-10, upgrade to E.164 lib if multi-country volume grows
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function uniqueStrings(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v)))];
}

export function contactEmails(row: ContactFields): string[] {
  return uniqueStrings([normalizeEmail(row.email), ...(row.additional_emails ?? []).map(normalizeEmail)]);
}

export function contactPhones(row: ContactFields): string[] {
  return uniqueStrings([normalizePhone(row.phone), ...(row.additional_phones ?? []).map(normalizePhone)]);
}

/** Persist-ready lists: normalized, unique, capped. */
export function sanitizeAdditionalEmails(raw: unknown, max = 10): string[] {
  if (!Array.isArray(raw)) return [];
  return uniqueStrings(raw.map((v) => (typeof v === 'string' ? normalizeEmail(v) : null))).slice(0, max);
}

export function sanitizeAdditionalPhones(raw: unknown, max = 10): string[] {
  if (!Array.isArray(raw)) return [];
  return uniqueStrings(raw.map((v) => (typeof v === 'string' ? normalizePhone(v) : null))).slice(0, max);
}

export function birthFieldCount(row: BirthTriplet): number {
  return [normalizeDob(row.date_of_birth), normalizeTime(row.birth_time), normalizePlace(row.birth_place)].filter(
    Boolean
  ).length;
}

export function hasContactIdentity(row: ContactFields): boolean {
  return contactEmails(row).length > 0 || contactPhones(row).length > 0;
}

export function scoreBirthMatch(
  a: BirthTriplet,
  b: BirthTriplet
): { score: number; matched: MatchedField[] } {
  const matched: MatchedField[] = [];
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

function setsOverlap(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false;
  const setB = new Set(b);
  return a.some((v) => setB.has(v));
}

export function scoreContactMatch(
  a: ContactFields,
  b: ContactFields
): { email: boolean; phone: boolean; matched: MatchedField[] } {
  const matched: MatchedField[] = [];
  const email = setsOverlap(contactEmails(a), contactEmails(b));
  if (email) matched.push('email');
  const phone = setsOverlap(contactPhones(a), contactPhones(b));
  if (phone) matched.push('phone');
  return { email, phone, matched };
}

/**
 * Contact: email+phone → duplicate; either alone → potential.
 * Birth: 3 fields → duplicate; 2 fields → potential.
 */
export function classifyMatch(
  birthScore: number,
  contact?: { email: boolean; phone: boolean }
): 'duplicate' | 'potential' | null {
  if ((contact?.email && contact?.phone) || birthScore >= 3) return 'duplicate';
  if (contact?.email || contact?.phone || birthScore >= 2) return 'potential';
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

type CandidateRow = {
  id: string;
  lead_number: number | null;
  name: string;
  email: string;
  phone: string | null;
  additional_emails?: string[] | null;
  additional_phones?: string[] | null;
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  pipeline_stage: string;
  assigned_to: string | null;
  created_at: string;
};

async function loadCandidatePool(admin: Admin, leads: LeadIdentity[]): Promise<CandidateRow[]> {
  const eligible = leads.filter((l) => birthFieldCount(l) >= 2 || hasContactIdentity(l));
  if (!eligible.length) return [];

  const byId = new Map<string, CandidateRow>();
  const merge = (rows: CandidateRow[] | null | undefined) => {
    for (const row of rows ?? []) byId.set(row.id, row);
  };

  const emails = uniqueStrings(eligible.flatMap((l) => contactEmails(l)));
  if (emails.length) {
    const orFilter = emails
      .map((e) => `email.ilike."${e.replace(/"/g, '')}"`)
      .join(',');
    const { data } = await admin.from('enquiries').select(CANDIDATE_COLS).or(orFilter).limit(500);
    merge(data as CandidateRow[]);
    // also match prior leads that stored this email as additional
    for (const e of emails.slice(0, 20)) {
      const { data: extra } = await admin
        .from('enquiries')
        .select(CANDIDATE_COLS)
        .contains('additional_emails', [e])
        .limit(100);
      merge(extra as CandidateRow[]);
    }
  }

  // ponytail: exact phone string match first; normalized last-10 covers formatting in scoreContactMatch
  const phonesRaw = uniqueStrings(eligible.map((l) => l.phone?.trim()));
  if (phonesRaw.length) {
    const { data } = await admin.from('enquiries').select(CANDIDATE_COLS).in('phone', phonesRaw).limit(500);
    merge(data as CandidateRow[]);
  }

  const phoneTails = uniqueStrings(eligible.flatMap((l) => contactPhones(l)).filter((p) => p.length >= 7));
  if (phoneTails.length) {
    const orFilter = phoneTails.map((p) => `phone.ilike.%${p}`).join(',');
    const { data } = await admin.from('enquiries').select(CANDIDATE_COLS).or(orFilter).limit(500);
    merge(data as CandidateRow[]);
    for (const p of phoneTails.slice(0, 20)) {
      const { data: extra } = await admin
        .from('enquiries')
        .select(CANDIDATE_COLS)
        .contains('additional_phones', [p])
        .limit(100);
      merge(extra as CandidateRow[]);
    }
  }

  const birthEligible = eligible.filter((l) => birthFieldCount(l) >= 2);
  const dobs = uniqueStrings(birthEligible.map((l) => normalizeDob(l.date_of_birth)));
  if (dobs.length) {
    const { data } = await admin.from('enquiries').select(CANDIDATE_COLS).in('date_of_birth', dobs).limit(500);
    merge(data as CandidateRow[]);
  }

  // ponytail: also pull same place for time+place potentials when DOB differs. Ceiling: one .or() of page places.
  const rawPlaces = uniqueStrings(
    birthEligible
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
      merge(data as CandidateRow[]);
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
  lead: LeadIdentity & { id: string; created_at?: string | null; lead_number?: number | null },
  pool: CandidateRow[],
  names: Map<string, string>
): DuplicateMatch[] {
  if (birthFieldCount(lead) < 2 && !hasContactIdentity(lead)) return [];
  const out: DuplicateMatch[] = [];
  for (const c of pool) {
    if (!isPriorLead(c, lead)) continue;
    const birth = scoreBirthMatch(lead, c);
    const contact = scoreContactMatch(lead, c);
    const status = classifyMatch(birth.score, contact);
    if (!status) continue;
    const matched = [...contact.matched, ...birth.matched];
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
  leads: Array<{
    id: string;
    created_at?: string | null;
    lead_number?: number | null;
    email?: string | null;
    phone?: string | null;
    additional_emails?: string[] | null;
    additional_phones?: string[] | null;
    date_of_birth?: string | null;
    birth_time?: string | null;
    birth_place?: string | null;
    [key: string]: unknown;
  }>
) {
  const pool = await loadCandidatePool(admin, leads);
  const names = await telecallerNames(
    admin,
    pool.map((c) => c.assigned_to).filter((id): id is string => Boolean(id))
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
  lead: LeadIdentity & { id: string; created_at?: string | null; lead_number?: number | null }
): Promise<DuplicateMatch[]> {
  const [enriched] = await attachDuplicateHints(admin, [
    {
      id: lead.id,
      created_at: lead.created_at,
      lead_number: lead.lead_number,
      email: lead.email,
      phone: lead.phone,
      additional_emails: lead.additional_emails,
      additional_phones: lead.additional_phones,
      date_of_birth: lead.date_of_birth,
      birth_time: lead.birth_time,
      birth_place: lead.birth_place,
    },
  ]);
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

  const emailOnly = scoreContactMatch(
    { email: 'A@X.com', phone: '9999999999' },
    { email: 'a@x.com', phone: '8888888888' }
  );
  if (!emailOnly.email || emailOnly.phone || classifyMatch(0, emailOnly) !== 'potential') {
    throw new Error('email-only must be potential');
  }
  const phoneOnly = scoreContactMatch(
    { email: 'a@x.com', phone: '+91 98765-43210' },
    { email: 'b@y.com', phone: '9876543210' }
  );
  if (phoneOnly.email || !phoneOnly.phone || classifyMatch(0, phoneOnly) !== 'potential') {
    throw new Error('phone-only must be potential');
  }
  const both = scoreContactMatch(
    { email: 'a@x.com', phone: '9876543210' },
    { email: 'A@X.com', phone: '919876543210' }
  );
  if (!both.email || !both.phone || classifyMatch(0, both) !== 'duplicate') {
    throw new Error('email+phone must be duplicate');
  }
  if (normalizeEmail('  Foo@Bar.COM ') !== 'foo@bar.com') throw new Error('normalizeEmail');
  if (normalizePhone('+91 98765 43210') !== '9876543210') throw new Error('normalizePhone');

  // additional contacts: new primary matches prior additional
  const viaAltPhone = scoreContactMatch(
    { email: 'new@x.com', phone: '1111111111' },
    { email: 'old@x.com', phone: '2222222222', additional_phones: ['911111111111'] }
  );
  if (!viaAltPhone.phone || classifyMatch(0, viaAltPhone) !== 'potential') {
    throw new Error('additional phone must match as potential');
  }
  const viaAltEmail = scoreContactMatch(
    { email: 'alt@x.com', phone: '3333333333' },
    { email: 'old@y.com', phone: '4444444444', additional_emails: ['ALT@X.com'] }
  );
  if (!viaAltEmail.email || classifyMatch(0, viaAltEmail) !== 'potential') {
    throw new Error('additional email must match as potential');
  }
  const viaAltBoth = scoreContactMatch(
    { email: 'alt@x.com', phone: '5555555555' },
    {
      email: 'old@z.com',
      phone: '6666666666',
      additional_emails: ['alt@x.com'],
      additional_phones: ['5555555555'],
    }
  );
  if (!viaAltBoth.email || !viaAltBoth.phone || classifyMatch(0, viaAltBoth) !== 'duplicate') {
    throw new Error('additional email+phone must be duplicate');
  }
}
