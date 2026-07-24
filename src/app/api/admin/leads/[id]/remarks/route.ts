import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { leadRemarkCreateSchema } from '@/lib/validators/enquiry';
import { canViewEnquiry, canAddRemarks } from '@/lib/leads/permissions';
import { appendLeadRemark } from '@/lib/leads/assign';
import type { LeadRemarkCode } from '@/lib/leads/constants';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('leads.read');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { data: enquiry } = await admin.from('enquiries').select('id, assigned_to, astrologer_id').eq('id', id).maybeSingle();
  if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canViewEnquiry(auth.member.normalizedRole, auth.user.id, enquiry)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await admin
    .from('lead_remarks')
    .select('*')
    .eq('enquiry_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Failed to load remarks' }, { status: 500 });
  return NextResponse.json({ remarks: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = leadRemarkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: enquiry } = await admin.from('enquiries').select('*').eq('id', id).maybeSingle();
  if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canViewEnquiry(auth.member.normalizedRole, auth.user.id, enquiry)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!canAddRemarks(auth.member.normalizedRole)) {
    return NextResponse.json({ error: 'Cannot add remarks' }, { status: 403 });
  }

  try {
    const remark = await appendLeadRemark(admin, {
      enquiryId: id,
      code: parsed.data.code as LeadRemarkCode,
      note: parsed.data.note,
      actorId: auth.user.id,
      actorName: auth.member.name,
    });

    const { data: lead } = await admin.from('enquiries').select('*').eq('id', id).single();
    return NextResponse.json({ remark, lead }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to add remark' },
      { status: 500 }
    );
  }
}
