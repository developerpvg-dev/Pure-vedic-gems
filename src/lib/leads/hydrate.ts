/** Fill structured dossier fields from recommendation_requests or the original message body. */

export type BirthFields = {
  date_of_birth: string | null;
  birth_time: string | null;
  birth_place: string | null;
  area_of_concern: string | null;
  enquiry_type: string | null;
};

function lineValue(message: string, label: RegExp): string | null {
  const m = message.match(label);
  const v = m?.[1]?.trim();
  return v || null;
}

/** Parse homepage / enquiry message blobs that embed birth details as text. */
export function parseBirthFieldsFromMessage(message: string | null | undefined): Partial<BirthFields> {
  if (!message) return {};
  const date_of_birth =
    lineValue(message, /Date of birth:\s*(.+)/i) ||
    lineValue(message, /DOB:\s*(.+)/i);
  const birth_time =
    lineValue(message, /Birth time:\s*(.+)/i) ||
    lineValue(message, /Time of birth:\s*(.+)/i);
  const birth_place =
    lineValue(message, /Birth place:\s*(.+)/i) ||
    lineValue(message, /Place of birth:\s*(.+)/i);
  const area_of_concern =
    lineValue(message, /Purpose\s*\/\s*concern:\s*(.+)/i) ||
    lineValue(message, /Purpose:\s*(.+)/i) ||
    lineValue(message, /Area of [Cc]oncern:\s*(.+)/i) ||
    lineValue(message, /Life [Ss]ituation:\s*(.+)/i);

  // Normalize date to YYYY-MM-DD when possible for <input type="date">
  let dob = date_of_birth;
  if (dob) {
    const iso = dob.match(/^(\d{4}-\d{2}-\d{2})/);
    if (iso) dob = iso[1];
  }

  return {
    date_of_birth: dob,
    birth_time,
    birth_place,
    area_of_concern,
  };
}

export function needsBirthHydration(row: {
  date_of_birth?: string | null;
  birth_time?: string | null;
  birth_place?: string | null;
  area_of_concern?: string | null;
}) {
  // Any missing dossier field is worth a hydrate pass (paid ₹101 often has DOB but empty purpose)
  return !row.date_of_birth || !row.birth_time || !row.birth_place || !row.area_of_concern;
}

/** Merge DB columns ← recommendation_requests ← message parse (first non-empty wins). */
export function mergeBirthFields(
  row: Partial<BirthFields> & { message?: string | null; source?: string | null },
  fromRecommendation?: Partial<{
    birth_date: string | null;
    birth_time: string | null;
    birth_place: string | null;
    purpose: string | null;
  }> | null
): BirthFields {
  const fromMsg = parseBirthFieldsFromMessage(row.message);
  return {
    date_of_birth: row.date_of_birth || fromRecommendation?.birth_date || fromMsg.date_of_birth || null,
    birth_time: row.birth_time || fromRecommendation?.birth_time || fromMsg.birth_time || null,
    birth_place: row.birth_place || fromRecommendation?.birth_place || fromMsg.birth_place || null,
    area_of_concern: row.area_of_concern || fromRecommendation?.purpose || fromMsg.area_of_concern || null,
    enquiry_type:
      row.enquiry_type ||
      (row.source === 'homepage_recommendation' ? 'Remedies Recommendation' : null),
  };
}

// ponytail: self-check
export function assertHydrateParse() {
  const p = parseBirthFieldsFromMessage(
    'Date of birth: 1991-01-15\nBirth time: 09:30\nBirth place: Delhi, India\nPurpose: career growth'
  );
  if (p.date_of_birth !== '1991-01-15') throw new Error('dob');
  if (p.birth_time !== '09:30') throw new Error('time');
  if (p.birth_place !== 'Delhi, India') throw new Error('place');
  if (p.area_of_concern !== 'career growth') throw new Error('purpose');
  const p2 = parseBirthFieldsFromMessage('Purpose / concern: marriage');
  if (p2.area_of_concern !== 'marriage') throw new Error('purpose slash');
}
