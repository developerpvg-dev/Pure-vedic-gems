import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { FormKind } from '@/components/admin/product-form/kinds';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { STOCK_CATEGORIES, type StockCategoryId } from '@/lib/erp/stock-categories';
import {
  ackErpOutboundTask,
  applyErpStockToWebsite,
  buildDraftProductFromErpTag,
  findCachedErpTag,
  getErpSyncReportFromCache,
  markWebsiteSoldByTag,
  resetErpExcelCache,
  syncErpTagStockFromExcel,
} from '@/lib/erp/sync';
import { logAdminAction } from '@/lib/utils/admin-log';
import { revalidateProductSurfaces } from '@/lib/shop/revalidate';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const stockCategoryEnum = z.enum(
  STOCK_CATEGORIES.map((c) => c.id) as [StockCategoryId, ...StockCategoryId[]]
);

const applySchema = z.object({
  action: z.literal('apply_stock'),
  product_ids: z.array(z.string().uuid()).optional(),
  availability: z.enum(['sold', 'reserved']).default('sold'),
});

const createSchema = z.object({
  action: z.literal('create_draft'),
  tgno: z.string().trim().min(1).max(100),
  kind: z.enum(['navratna', 'upratna', 'rudraksha', 'idol', 'jewellery']).default('jewellery'),
});

const ackSchema = z.object({
  action: z.literal('ack_outbound'),
  id: z.string().uuid(),
  ack: z.enum(['sold', 'reserved']),
  note: z.string().trim().max(500).optional(),
});

const markSoldSchema = z.object({
  action: z.literal('mark_sold_by_tag'),
  tgno: z.string().trim().min(1).max(100),
  availability: z.enum(['sold', 'reserved']).default('sold'),
});

const resetSchema = z.object({
  action: z.literal('reset_cache'),
});

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  try {
    const report = await getErpSyncReportFromCache();
    return NextResponse.json({
      report,
      stockCategories: STOCK_CATEGORIES.map((c) => ({ id: c.id, label: c.label, kind: c.kind })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load ERP sync status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    try {
      const form = await request.formData();
      const categoryRaw = String(form.get('stock_category') ?? '').trim();
      const parsedCat = stockCategoryEnum.safeParse(categoryRaw);
      if (!parsedCat.success) {
        return NextResponse.json({
          error: 'Choose a stock category before uploading (e.g. emerald, rudraksha).',
          stockCategories: STOCK_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
        }, { status: 400 });
      }

      const files: Array<{ filename: string; buffer: Buffer }> = [];
      for (const [key, value] of form.entries()) {
        if ((key === 'files' || key === 'file') && value instanceof File) {
          files.push({ filename: value.name, buffer: Buffer.from(await value.arrayBuffer()) });
        }
      }
      if (!files.length) {
        return NextResponse.json({ error: 'No Excel files uploaded. Use field name "files".' }, { status: 400 });
      }

      const result = await syncErpTagStockFromExcel(files, parsedCat.data);
      await logAdminAction({
        userId: auth.user.id,
        action: 'erp_sync_excel',
        resourceType: 'erp_sync',
        resourceId: parsedCat.data,
        details: {
          stockCategory: parsedCat.data,
          files: result.fileStats,
          tagCount: result.tagCount,
          soldOfflineCount: result.soldOfflineCount,
          missing: result.report.missingOnWebsite.length,
          mismatches: result.report.stockMismatches.length,
        },
        ipAddress: getRequestIp(request),
      });

      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Excel sync failed';
      const db = asUntypedSupabase(createAdminClient());
      await db.from('erp_sync_state').upsert({
        id: 'mmi',
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === 'string' ? body.action : '';

  if (action === 'reset_cache') {
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    try {
      const report = await resetErpExcelCache();
      await logAdminAction({
        userId: auth.user.id,
        action: 'erp_reset_excel_cache',
        resourceType: 'erp_sync',
        resourceId: 'mmi',
        details: {},
        ipAddress: getRequestIp(request),
      });
      return NextResponse.json({ success: true, report });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset cache';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === 'ack_outbound') {
    const parsed = ackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    try {
      const report = await ackErpOutboundTask(parsed.data.id, parsed.data.ack, parsed.data.note);
      await logAdminAction({
        userId: auth.user.id,
        action: 'erp_ack_outbound',
        resourceType: 'erp_outbound_queue',
        resourceId: parsed.data.id,
        details: { ack: parsed.data.ack },
        ipAddress: getRequestIp(request),
      });
      return NextResponse.json({ success: true, report });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to acknowledge task';
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  if (action === 'mark_sold_by_tag') {
    const parsed = markSoldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }
    try {
      const result = await markWebsiteSoldByTag(parsed.data.tgno, parsed.data.availability);
      if (!result.updated) {
        return NextResponse.json({ error: `No website product found for tag ${parsed.data.tgno}`, ...result }, { status: 404 });
      }
      await logAdminAction({
        userId: auth.user.id,
        action: 'erp_mark_sold_by_tag',
        resourceType: 'product',
        resourceId: result.product?.id,
        details: { tgno: parsed.data.tgno },
        ipAddress: getRequestIp(request),
      });
      revalidateProductSurfaces({});
      return NextResponse.json({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark sold';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === 'apply_stock') {
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await applyErpStockToWebsite(parsed.data.product_ids, parsed.data.availability);
    await logAdminAction({
      userId: auth.user.id,
      action: 'erp_sync_apply_stock',
      resourceType: 'erp_sync',
      resourceId: 'mmi',
      details: { updated: result.updated },
      ipAddress: getRequestIp(request),
    });
    revalidateProductSurfaces({});
    return NextResponse.json({ success: true, ...result });
  }

  if (action === 'create_draft') {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const db = asUntypedSupabase(createAdminClient());
    const erpRow = await findCachedErpTag(db, parsed.data.tgno);

    if (!erpRow) {
      return NextResponse.json({ error: 'Tag not found in stock cache. Upload the category Excel sheet first.' }, { status: 404 });
    }

    const draft = buildDraftProductFromErpTag(
      erpRow as Parameters<typeof buildDraftProductFromErpTag>[0],
      parsed.data.kind as FormKind
    );
    const { data: product, error: insertError } = await db
      .from<{ id: string; name: string; tag_number: string; slug: string }>('products')
      .insert(draft)
      .select('id, name, tag_number, slug')
      .single();

    if (insertError || !product) {
      return NextResponse.json({ error: insertError?.message ?? 'Failed to create draft product' }, { status: 500 });
    }

    await logAdminAction({
      userId: auth.user.id,
      action: 'erp_create_draft_product',
      resourceType: 'product',
      resourceId: product.id,
      details: { tgno: parsed.data.tgno, kind: parsed.data.kind },
      ipAddress: getRequestIp(request),
    });

    return NextResponse.json({
      success: true,
      product,
      editUrl: `/admin/products/${product.id}`,
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
