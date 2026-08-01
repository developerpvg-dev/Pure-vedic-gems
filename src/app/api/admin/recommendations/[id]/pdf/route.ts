import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import { getSiteUrl } from '@/lib/resend/email-config';
import { withShopBuyUrls } from '@/lib/recommendations/buy-urls';
import { mapReportRow } from '@/lib/recommendations/normalize';
import { renderReportHtml } from '@/lib/recommendations/render-html';
import { htmlToPdf } from '@/lib/recommendations/pdf';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

const BUCKET = 'recommendation-pdfs';

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024,
      allowedMimeTypes: ['application/pdf'],
    });
    if (error) console.error('[recommendations/pdf] bucket', error.message);
  }
}

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
  const siteUrl = getSiteUrl();
  const blocks = await withShopBuyUrls(report.blocks, siteUrl, admin);
  const html = renderReportHtml({
    title: report.title,
    customer: report.customer,
    blocks,
    chartImageUrl: report.chart_image_url,
    siteUrl,
    embedLocalAssets: true,
  });

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await htmlToPdf(html);
  } catch (e) {
    console.error('[recommendations/pdf] render failed', e);
    return NextResponse.json(
      {
        error:
          'PDF generation failed. Install Chrome or set PUPPETEER_EXECUTABLE_PATH. On Vercel, @sparticuz/chromium is used.',
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }

  await ensureBucket(admin);
  const path = `${report.id}/${Date.now()}.pdf`;
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from('recommendation_reports')
    .update({
      pdf_path: path,
      status: report.status === 'sent' ? 'sent' : 'ready',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recommendation-${report.public_token}.pdf"`,
      'X-Report-Id': report.id,
      'X-Pdf-Path': path,
    },
  });
}
