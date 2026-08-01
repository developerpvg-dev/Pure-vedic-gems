import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
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
  const { data, error } = await asUntypedSupabase(admin).rpc('lead_conversion_metrics', {
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

  const result = {
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
  };

  const format = searchParams.get('format');
  if (format === 'xlsx' || format === 'excel') {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          'In window': result.summary.explained_total,
          Converted: result.summary.converted,
          'Not converted': result.summary.not_converted,
          'Pending outcome': result.summary.pending_outcome,
          'Conversion rate %': result.summary.conversion_rate,
          'Date from': dateFrom || '',
          'Date to': dateTo || '',
          Kind: enquiryType || 'all',
        },
      ]),
      'Summary'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        result.by_telecaller.map((r) => ({
          Telecaller: r.name,
          Converted: r.converted,
          'Not converted': r.not_converted,
          Pending: r.pending,
          Total: r.total,
          'Rate %': r.rate,
        }))
      ),
      'By telecaller'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        result.by_astrologer.map((r) => ({
          Astrologer: r.name,
          Converted: r.converted,
          'Not converted': r.not_converted,
          Pending: r.pending,
          Total: r.total,
          'Rate %': r.rate,
        }))
      ),
      'By astrologer'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        result.not_converted_reasons.map((r) => ({ Reason: r.code, Count: r.count }))
      ),
      'Not converted reasons'
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        result.trend.map((r) => ({
          Month: r.month,
          Converted: r.converted,
          'Not converted': r.not_converted,
        }))
      ),
      'Monthly trend'
    );
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="lead-metrics-${stamp}.xlsx"`,
      },
    });
  }

  return NextResponse.json(result);
}
