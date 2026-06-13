import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend } from '@/lib/admin/analytics-utils';

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const admin = createAdminClient();
  const [{ data: enquiries }, { data: consultations }] = await Promise.all([
    admin.from('enquiries').select('id, status, source, created_at').limit(5000),
    admin.from('consultations').select('id, status, payment_status, amount_inr, created_at').limit(5000),
  ]);

  const enquiryRows = (enquiries ?? []).map((row) => ({ ...row, total: 0 }));
  const consultationRows = (consultations ?? []).map((row) => ({
    ...row,
    total: Number(row.amount_inr ?? 0),
    payment_status: row.payment_status === 'captured' ? 'captured' : undefined,
  }));

  const combinedTrend = buildDailyTrend(
    [...enquiryRows, ...consultationRows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    30
  );

  const capturedConsultations = (consultations ?? []).filter((c) => c.payment_status === 'captured');
  const consultationRevenue = capturedConsultations.reduce((sum, c) => sum + Number(c.amount_inr ?? 0), 0);

  return NextResponse.json({
    summary: {
      totalEnquiries: enquiries?.length ?? 0,
      totalConsultations: consultations?.length ?? 0,
      newEnquiries: (enquiries ?? []).filter((e) => e.status === 'new').length,
      pendingConsultations: (consultations ?? []).filter((c) => ['pending', 'pending_payment'].includes(c.status ?? '')).length,
      completedConsultations: (consultations ?? []).filter((c) => c.status === 'completed').length,
      consultationRevenue,
    },
    trend: combinedTrend,
    enquiryStatusBreakdown: buildBreakdown(enquiryRows, 'status'),
    consultationStatusBreakdown: buildBreakdown(consultationRows, 'status'),
    consultationPaymentBreakdown: buildBreakdown(consultationRows, 'payment_status'),
    enquirySourceBreakdown: buildBreakdown(enquiryRows, 'source'),
  });
}
