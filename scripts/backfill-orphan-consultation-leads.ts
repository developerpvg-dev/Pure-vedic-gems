/**
 * One-shot: create CRM leads for captured consultations that have no enquiry.
 * Run: npx tsx scripts/backfill-orphan-consultation-leads.ts
 */
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[m[1]]) process.env[m[1]] = v;
}

async function main() {
  const { createAdminClient } = await import('../src/lib/supabase/admin');
  const { ensureLeadFromConsultation } = await import('../src/lib/leads/from-consultation');
  type Consultation = import('../src/lib/types/database').Consultation;

  const admin = createAdminClient();
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const { data: capturedRows, error } = await admin
    .from('consultations')
    .select('*')
    .eq('payment_status', 'captured')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(80);
  if (error) throw error;

  const captured = (capturedRows ?? []) as Consultation[];
  if (!captured.length) {
    console.log('no captured consultations in window');
    return;
  }

  const { data: linked } = await admin
    .from('enquiries')
    .select('consultation_id')
    .in(
      'consultation_id',
      captured.map((c) => c.id)
    );
  const hasLead = new Set(
    (linked ?? [])
      .map((row) => row.consultation_id as string | null)
      .filter((id): id is string => Boolean(id))
  );

  let created = 0;
  for (const consultation of captured) {
    if (hasLead.has(consultation.id)) continue;
    const enquiryId = await ensureLeadFromConsultation(admin, consultation);
    created += 1;
    console.log('created lead', {
      enquiryId,
      name: consultation.full_name,
      email: consultation.email,
      payment: consultation.razorpay_payment_id,
      consultationId: consultation.id,
    });
  }
  console.log(`done: created ${created} orphan lead(s) from ${captured.length} captured`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
