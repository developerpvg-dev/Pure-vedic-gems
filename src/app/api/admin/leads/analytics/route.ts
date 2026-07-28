import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { isLeadManager } from '@/lib/leads/permissions';

type StaffRow = { id: string; name: string };

type TelecallerAgg = {
  id: string | null;
  converted: number;
  not_converted: number;
  pending: number;
  total: number;
};

type AstrologerAgg = TelecallerAgg & { name?: string | null };

/**
 * Lead conversion metrics — Postgres aggregates only (lead_conversion_metrics).
 * Manager / parcel dispatch / admin. Telecom & astrologer are 403.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;
  if (!isLeadManager(auth.member.normalizedRole)) {
    return NextResponse.json({ error: 'Only leads managers can view conversion metrics' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const assignedTo = searchParams.get('assigned_to');
  const astrologerId = searchParams.get('astrologer_id');
  const enquiryType = searchParams.get('enquiry_type');

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('lead_conversion_metrics', {
    p_date_from: dateFrom ? `${dateFrom}T00:00:00.000Z` : null,
    p_date_to: dateTo ? `${dateTo}T23:59:59.999Z` : null,
    p_assigned_to: assignedTo || null,
    p_astrologer_id: astrologerId || null,
    p_enquiry_type: enquiryType || null,
  });

  if (error) {
    console.error('[leads/analytics] rpc failed', error);
    return NextResponse.json({ error: 'Failed to load metrics', detail: error.message }, { status: 500 });
  }

  const payload = (data ?? {}) as {
    summary?: {
      pending_outcome?: number;
      converted?: number;
      not_converted?: number;
      explained_total?: number;
    };
    by_telecaller?: TelecallerAgg[];
    by_astrologer?: AstrologerAgg[];
    not_converted_reasons?: { code: string; count: number }[];
    trend?: { month: string; converted: number; not_converted: number }[];
  };

  const converted = Number(payload.summary?.converted ?? 0);
  const notConverted = Number(payload.summary?.not_converted ?? 0);
  const decided = converted + notConverted;
  const conversionRate = decided > 0 ? Math.round((converted / decided) * 1000) / 10 : 0;

  const teleIds = (payload.by_telecaller ?? []).map((r) => r.id).filter(Boolean) as string[];
  const { data: staff } = teleIds.length
    ? await admin.from('team_members').select('id, name').in('id', teleIds)
    : { data: [] as StaffRow[] };
  const nameById = new Map((staff ?? []).map((m) => [m.id, m.name]));

  const byTelecaller = (payload.by_telecaller ?? []).map((row) => {
    const totalDecided = row.converted + row.not_converted;
    return {
      id: row.id,
      name: (row.id && nameById.get(row.id)) || 'Unknown telecaller',
      converted: row.converted,
      not_converted: row.not_converted,
      pending: row.pending,
      total: row.total,
      rate: totalDecided > 0 ? Math.round((row.converted / totalDecided) * 1000) / 10 : 0,
    };
  });

  const byAstrologer = (payload.by_astrologer ?? []).map((row) => {
    const totalDecided = row.converted + row.not_converted;
    return {
      id: row.id,
      name: row.name || 'Unknown astrologer',
      converted: row.converted,
      not_converted: row.not_converted,
      pending: row.pending,
      total: row.total,
      rate: totalDecided > 0 ? Math.round((row.converted / totalDecided) * 1000) / 10 : 0,
    };
  });

  return NextResponse.json({
    summary: {
      pending_outcome: Number(payload.summary?.pending_outcome ?? 0),
      converted,
      not_converted: notConverted,
      explained_total: Number(payload.summary?.explained_total ?? 0),
      conversion_rate: conversionRate,
    },
    by_telecaller: byTelecaller,
    by_astrologer: byAstrologer,
    not_converted_reasons: payload.not_converted_reasons ?? [],
    trend: payload.trend ?? [],
    filters: {
      date_from: dateFrom,
      date_to: dateTo,
      assigned_to: assignedTo,
      astrologer_id: astrologerId,
      enquiry_type: enquiryType,
    },
  });
}
