import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { getSiteUrl } from '@/lib/resend/email-config';
import { withShopBuyUrls } from '@/lib/recommendations/buy-urls';
import { mapReportRow } from '@/lib/recommendations/normalize';
import { renderReportHtml } from '@/lib/recommendations/render-html';
import { htmlToPdf } from '@/lib/recommendations/pdf';
import { sendRecommendationReportEmail } from '@/lib/resend/send-recommendation-report';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const BUCKET = 'recommendation-pdfs';

export async function POST(_request: NextRequest, ctx: Ctx) {
  const auth = await requireAdminAccess('leads.write');
  if ('error' in auth) return auth.error;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin.from('recommendation_reports').select('*').eq('id', id).single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 });
  }

  const report = mapReportRow(data as Record<string, unknown>);
  if (!report.customer.email?.trim()) {
    return NextResponse.json({ error: 'Customer email is required to send' }, { status: 400 });
  }

  const siteUrl = getSiteUrl();
  const blocks = await withShopBuyUrls(report.blocks, siteUrl, admin);

  let pdfBuffer: Buffer | null = null;
  try {
    // Always rebuild so BUY links are /shop/... not legacy /products/...
    const html = renderReportHtml({
      title: report.title,
      customer: report.customer,
      blocks,
      chartImageUrl: report.chart_image_url,
      siteUrl,
      embedLocalAssets: true,
    });
    pdfBuffer = await htmlToPdf(html);
    const path = `${report.id}/${Date.now()}.pdf`;
    await admin.storage.from(BUCKET).upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });
    await admin.from('recommendation_reports').update({ pdf_path: path }).eq('id', id);
  } catch (e) {
    console.warn('[recommendations/send] PDF skipped', e);
    pdfBuffer = null;
  }

  const messageId = await sendRecommendationReportEmail({
    to: report.customer.email.trim(),
    customerName: report.customer.name,
    reportTitle: report.title,
    publicToken: report.public_token,
    pdfBuffer,
  });

  if (!messageId) {
    return NextResponse.json({ error: 'Failed to send email (check Resend config)' }, { status: 502 });
  }

  const { data: updated, error: updateError } = await admin
    .from('recommendation_reports')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (report.enquiry_id) {
    await admin.from('lead_remarks').insert({
      enquiry_id: report.enquiry_id,
      remark_code: 'email_sent',
      remark_label: 'Recommendation emailed',
      note: `Report: ${report.title}. Link: /r/${report.public_token}`,
      created_by: auth.user.id,
      created_by_name: auth.member.name,
    });
  }

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || 'Sent but failed to update status' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    messageId,
    report: mapReportRow(updated as Record<string, unknown>),
    pdfAttached: Boolean(pdfBuffer),
  });
}
