import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { asUntypedSupabase } from '@/lib/supabase/untyped';
import { isErpConfigured } from '@/lib/erp/mmi-client';
import {
  applyErpStockToWebsite,
  buildDraftProductFromErpTag,
  findCachedErpTag,
  getErpSyncReportFromCache,
  syncErpTagStockFromApi,
} from '@/lib/erp/sync';
import { logAdminAction } from '@/lib/utils/admin-log';
import { revalidateProductSurfaces } from '@/lib/shop/revalidate';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const applySchema = z.object({
  action: z.literal('apply_stock'),
  product_ids: z.array(z.string().uuid()).optional(),
});

const createSchema = z.object({
  action: z.literal('create_draft'),
  tgno: z.string().trim().min(1).max(100),
});

export async function GET() {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  try {
    const report = await getErpSyncReportFromCache();
    return NextResponse.json({
      configured: isErpConfigured(),
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load ERP sync status';
    return NextResponse.json({ error: message, configured: isErpConfigured() }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === 'string' ? body.action : 'sync';

  if (action === 'sync') {
    try {
      const report = await syncErpTagStockFromApi();
      await logAdminAction({
        userId: auth.user.id,
        action: 'erp_sync_pull',
        resourceType: 'erp_sync',
        resourceId: 'mmi',
        details: {
          apiCallsUsed: report.apiCallsUsed,
          missing: report.missingOnWebsite.length,
          mismatches: report.stockMismatches.length,
        },
        ipAddress: getRequestIp(request),
      });
      return NextResponse.json({ success: true, report, tagCount: report.erpTagCount });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'ERP sync failed';
      const db = asUntypedSupabase(createAdminClient());
      await db.from('erp_sync_state').upsert({
        id: 'mmi',
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (action === 'apply_stock') {
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const result = await applyErpStockToWebsite(parsed.data.product_ids);
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
      return NextResponse.json({ error: 'ERP tag not found in cache. Run sync first.' }, { status: 404 });
    }

    const draft = buildDraftProductFromErpTag(erpRow);
    const { data: product, error: insertError } = await db
      .from('products')
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
      resourceId: product.id as string,
      details: { tgno: parsed.data.tgno },
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
