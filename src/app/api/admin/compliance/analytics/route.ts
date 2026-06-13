import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { buildBreakdown, buildDailyTrend } from '@/lib/admin/analytics-utils';
import { asUntypedSupabase } from '@/lib/supabase/untyped';

type ComplianceRow = Record<string, unknown> & {
  status?: string;
  created_at?: string;
  total?: number;
  amount?: number;
  is_active?: boolean;
  reason_category?: string;
};

export async function GET() {
  const auth = await requireAdminAccess('compliance.manage');
  if ('error' in auth) return auth.error;

  const db = asUntypedSupabase(createAdminClient());
  const [
    { data: privacyRequests },
    { data: returnRequests },
    { data: invoices },
    { data: refundRecords },
    { data: taxRules },
    { data: policyVersions },
  ] = await Promise.all([
    db.from('privacy_requests').select('status, request_type, created_at').limit(5000),
    db.from('return_requests').select('status, reason_category, created_at').limit(5000),
    db.from('invoices').select('status, total, tax_amount, created_at').limit(5000),
    db.from('refund_records').select('status, amount, refund_type, created_at').limit(5000),
    db.from('tax_rules').select('is_active, tax_class, rate_percent, metadata').limit(500),
    db.from('policy_versions').select('policy_key, is_active, effective_date').limit(500),
  ]);

  const privacy = (privacyRequests ?? []) as ComplianceRow[];
  const returns = (returnRequests ?? []) as ComplianceRow[];
  const invoiceRows = (invoices ?? []) as ComplianceRow[];
  const refunds = (refundRecords ?? []) as ComplianceRow[];
  const taxes = (taxRules ?? []) as ComplianceRow[];
  const policies = (policyVersions ?? []) as ComplianceRow[];

  const openPrivacy = privacy.filter((row) => !['completed', 'rejected', 'cancelled'].includes(String(row.status ?? '')));
  const openReturns = returns.filter((row) => !['closed', 'rejected', 'refunded', 'replaced'].includes(String(row.status ?? '')));
  const invoiceTotal = invoiceRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const refundTotal = refunds.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  const combinedTrend = buildDailyTrend(
    [
      ...privacy.filter((row) => row.created_at).map((row) => ({ created_at: row.created_at!, total: 0 })),
      ...returns.filter((row) => row.created_at).map((row) => ({ created_at: row.created_at!, total: 0 })),
      ...invoiceRows.filter((row) => row.created_at).map((row) => ({
        created_at: row.created_at!,
        total: Number(row.total ?? 0),
        payment_status: 'captured' as const,
      })),
    ],
    30
  );

  return NextResponse.json({
    summary: {
      openPrivacyRequests: openPrivacy.length,
      openReturnRequests: openReturns.length,
      totalInvoices: invoiceRows.length,
      pendingInvoices: invoiceRows.filter((row) => ['draft', 'failed'].includes(String(row.status ?? ''))).length,
      invoiceValue: invoiceTotal,
      totalRefunds: refunds.length,
      refundValue: refundTotal,
      activeTaxRules: taxes.filter((row) => row.is_active).length,
      activePolicies: policies.filter((row) => row.is_active).length,
    },
    trend: combinedTrend,
    privacyStatusBreakdown: buildBreakdown(privacy, 'status'),
    returnStatusBreakdown: buildBreakdown(returns, 'status'),
    returnReasonBreakdown: buildBreakdown(returns, 'reason_category'),
    invoiceStatusBreakdown: buildBreakdown(
      invoiceRows.map((row) => ({ ...row, total: Number(row.total ?? 0) })),
      'status'
    ),
    refundStatusBreakdown: buildBreakdown(
      refunds.map((row) => ({ ...row, total: Number(row.amount ?? 0) })),
      'status'
    ),
  });
}
