import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/lib/admin/api';
import {
  jewelryDesignCreateSchema,
  jewelryDesignUpdateSchema,
  normalizeDesignPayload,
} from '@/lib/validators/jewelry-design';
import {
  insertJewelryDesign,
  migrationHintForStrippedColumns,
  updateJewelryDesign,
} from '@/lib/admin/jewelry-design-persist';

/**
 * GET /api/admin/designs
 * Admin list with optional filters.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess('products.read');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const settingType = searchParams.get('setting_type');
  const productScope = searchParams.get('product_scope');
  const rudrakshaCategory = searchParams.get('rudraksha_category');
  const includeInactive = searchParams.get('include_inactive') === 'true';

  const supabase = createAdminClient();

  let query = supabase
    .from('jewelry_designs')
    .select('*')
    .order('product_scope')
    .order('setting_type')
    .order('sort_order', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  if (settingType) {
    query = query.eq('setting_type', settingType);
  }

  if (productScope) {
    query = query.eq('product_scope', productScope);
  }

  if (rudrakshaCategory) {
    query = query.eq('rudraksha_category', rudrakshaCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[admin/designs] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }

  return NextResponse.json({ designs: data ?? [] });
}

/**
 * POST /api/admin/designs
 * Create a jewelry design with full metal pricing matrix.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = jewelryDesignCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const payload = normalizeDesignPayload(parsed.data);
    const supabase = createAdminClient();

    const { data, error, strippedColumns } = await insertJewelryDesign(supabase, payload);

    if (error) {
      console.error('[admin/designs] Insert error:', error);
      const hint = migrationHintForStrippedColumns(strippedColumns);
      return NextResponse.json(
        { error: hint ?? 'Failed to create design' },
        { status: 500 }
      );
    }

    const warning = migrationHintForStrippedColumns(strippedColumns);
    return NextResponse.json({ design: data, warning }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * PATCH /api/admin/designs
 * Update an existing jewelry design.
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const parsed = jewelryDesignUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = parsed.data;
    const payload = normalizeDesignPayload(parsed.data);
    const supabase = createAdminClient();

    const { data, error, strippedColumns } = await updateJewelryDesign(supabase, id, payload);

    if (error) {
      console.error('[admin/designs] Update error:', error);
      const hint = migrationHintForStrippedColumns(strippedColumns);
      return NextResponse.json(
        { error: hint ?? 'Failed to update design' },
        { status: 500 }
      );
    }

    const warning = migrationHintForStrippedColumns(strippedColumns);
    return NextResponse.json({ design: data, warning });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * DELETE /api/admin/designs
 * Soft-delete a design (set is_active=false).
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess('products.write');
  if ('error' in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('jewelry_designs')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    console.error('[admin/designs] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
