import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess, getRequestIp } from '@/lib/admin/api';
import { logAdminAction } from '@/lib/utils/admin-log';
import { asUntypedSupabase, type UntypedSupabase } from '@/lib/supabase/untyped';
import type { Json } from '@/lib/types/database';

export const runtime = 'nodejs';

const TEMPLATE_HEADERS = [
  'sku',
  'name',
  'slug',
  'category',
  'sub_category',
  'price',
  'currency',
  'stock_quantity',
  'tag_number',
  'legacy_woo_id',
  'availability_status',
  'stock_status',
  'is_active',
  'is_directors_pick',
  'display_order',
  'images',
  'image_zip_filename',
  'short_desc',
  'description',
];

const productRowSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).optional(),
  category: z.string().trim().min(1).max(100),
  sub_category: z.string().trim().max(100).optional().nullable(),
  price: z.coerce.number().finite().nonnegative(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).default('INR'),
  stock_quantity: z.coerce.number().int().nonnegative().default(1),
  tag_number: z.string().trim().max(100).optional().nullable(),
  legacy_woo_id: z.preprocess((value) => value === '' || value === null || value === undefined ? null : Number(value), z.number().int().positive().nullable()),
  availability_status: z.enum(['in_stock', 'out_of_stock', 'sold', 'reserved', 'on_demand', 'archived']).default('in_stock'),
  stock_status: z.enum(['in_stock', 'out_of_stock', 'on_backorder']).default('in_stock'),
  is_active: z.coerce.boolean().default(true),
  is_directors_pick: z.coerce.boolean().default(false),
  display_order: z.coerce.number().int().default(0),
  images: z.string().trim().optional().default(''),
  image_zip_filename: z.string().trim().optional().default(''),
  short_desc: z.string().trim().max(500).optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

type ParsedRow = z.infer<typeof productRowSchema>;

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index++;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  if (rows.length === 0) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}

function splitImages(value: string) {
  return value.split(/[|;]/).map((item) => item.trim()).filter(Boolean);
}

async function parseImportFile(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }).map((row) => {
      const normalized: Record<string, string> = {};
      Object.entries(row).forEach(([key, value]) => {
        normalized[normalizeHeader(key)] = String(value ?? '');
      });
      return normalized;
    });
  }

  return parseCsv(await file.text());
}

async function existingValues(db: UntypedSupabase, column: string, values: unknown[]) {
  const filtered = [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ''))];
  if (filtered.length === 0) return new Set<string>();
  const { data } = await db.from<Record<string, unknown>[]>('products').select(column).in(column, filtered);
  return new Set((data ?? []).map((row: Record<string, unknown>) => String(row[column])));
}

async function buildPreview(records: Record<string, unknown>[]) {
  const parsedRows = records.map((record, index) => {
    const parsed = productRowSchema.safeParse({ ...record, slug: record.slug || slugify(String(record.name ?? '')) });
    if (!parsed.success) {
      return {
        row: index + 2,
        valid: false,
        data: record,
        warnings: [] as string[],
        errors: Object.entries(parsed.error.flatten().fieldErrors).flatMap(([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`)),
      };
    }
    return { row: index + 2, valid: true, data: parsed.data, warnings: [] as string[], errors: [] as string[] };
  });

  const validData = parsedRows.filter((row): row is typeof row & { data: ParsedRow } => row.valid);
  const duplicateSku = new Set<string>();
  const duplicateSlug = new Set<string>();
  const seenSkus = new Set<string>();
  const seenSlugs = new Set<string>();

  for (const row of validData) {
    if (seenSkus.has(row.data.sku)) duplicateSku.add(row.data.sku);
    seenSkus.add(row.data.sku);
    if (seenSlugs.has(row.data.slug ?? '')) duplicateSlug.add(row.data.slug ?? '');
    seenSlugs.add(row.data.slug ?? '');
  }

  const db = asUntypedSupabase(createAdminClient());
  const [existingSkus, existingSlugs, existingTags, existingLegacyIds] = await Promise.all([
    existingValues(db, 'sku', validData.map((row) => row.data.sku)),
    existingValues(db, 'slug', validData.map((row) => row.data.slug)),
    existingValues(db, 'tag_number', validData.map((row) => row.data.tag_number)),
    existingValues(db, 'legacy_woo_id', validData.map((row) => row.data.legacy_woo_id)),
  ]);

  for (const row of parsedRows) {
    if (!row.valid) continue;
    const data = row.data as ParsedRow;
    if (duplicateSku.has(data.sku)) row.errors.push('Duplicate SKU inside import file');
    if (duplicateSlug.has(data.slug ?? '')) row.errors.push('Duplicate slug inside import file');
    if (existingSkus.has(data.sku)) row.errors.push('SKU already exists');
    if (data.slug && existingSlugs.has(data.slug)) row.errors.push('Slug already exists');
    if (data.tag_number && existingTags.has(data.tag_number)) row.errors.push('Tag number already exists');
    if (data.legacy_woo_id && existingLegacyIds.has(String(data.legacy_woo_id))) row.errors.push('Legacy WooCommerce ID already exists');
    if (data.image_zip_filename) row.warnings.push('ZIP image filename recorded; upload images before publishing if URL is not present');
    row.valid = row.errors.length === 0;
  }

  return {
    rows: parsedRows,
    summary: {
      total: parsedRows.length,
      valid: parsedRows.filter((row) => row.valid).length,
      invalid: parsedRows.filter((row) => !row.valid).length,
      warnings: parsedRows.reduce((sum, row) => sum + row.warnings.length, 0),
    },
  };
}

function toProductPayload(row: ParsedRow, batchId: string) {
  const warnings = row.image_zip_filename ? [`Image ZIP mapping: ${row.image_zip_filename}`] : [];
  return {
    sku: row.sku,
    name: row.name,
    slug: row.slug ?? slugify(row.name),
    category: row.category,
    sub_category: row.sub_category || null,
    price: row.price,
    currency: row.currency,
    stock_quantity: row.stock_quantity,
    stock_status: row.stock_status,
    availability_status: row.availability_status,
    in_stock: row.stock_status !== 'out_of_stock' && row.availability_status === 'in_stock',
    is_active: row.is_active,
    is_directors_pick: row.is_directors_pick,
    display_order: row.display_order,
    tag_number: row.tag_number || null,
    legacy_woo_id: row.legacy_woo_id,
    images: splitImages(row.images) as Json,
    short_desc: row.short_desc || null,
    description: row.description || null,
    import_warnings: warnings as Json,
    last_import_batch_id: batchId,
    legacy_data: { image_zip_filename: row.image_zip_filename || null } as Json,
  };
}

export async function GET() {
  const auth = await requireAdminAccess('imports.write');
  if ('error' in auth) return auth.error;

  const csv = `${TEMPLATE_HEADERS.join(',')}\nPVG-RUBY-001,Certified Ruby,pvg-ruby-001,navaratna,Ruby,51000,INR,1,TAG-001,12345,in_stock,in_stock,true,false,10,https://example.com/ruby.jpg,,Certified natural ruby,Short product description\n`;
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="purevedicgems-product-import-template.csv"',
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess('imports.write');
  if ('error' in auth) return auth.error;

  const form = await request.formData();
  const file = form.get('file');
  const commit = form.get('commit') === 'true';
  if (!(file instanceof File)) return NextResponse.json({ error: 'Import file is required' }, { status: 400 });

  const records = await parseImportFile(file);
  const preview = await buildPreview(records);
  if (!commit) return NextResponse.json({ ...preview, mode: 'preview' });
  if (preview.summary.invalid > 0) return NextResponse.json({ error: 'Fix row errors before import', ...preview }, { status: 400 });

  const db = asUntypedSupabase(createAdminClient());
  const batchId = crypto.randomUUID();
  const now = new Date().toISOString();
  const { error: batchError } = await db.from('product_import_batches').insert({
    id: batchId,
    filename: file.name,
    status: 'committing',
    total_rows: preview.summary.total,
    valid_rows: preview.summary.valid,
    invalid_rows: 0,
    warning_rows: preview.summary.warnings,
    created_by: auth.user.id,
  });
  if (batchError) return NextResponse.json({ error: 'Failed to create import batch' }, { status: 500 });

  const products = preview.rows.map((row) => toProductPayload(row.data as ParsedRow, batchId));
  const { data: inserted, error } = await db.from<{ id: string; sku: string; name: string }[]>('products').insert(products).select('id, sku, name');
  if (error) {
    await db.from('product_import_batches').update({ status: 'failed', completed_at: now, error_summary: { message: error.message } }).eq('id', batchId);
    return NextResponse.json({ error: 'Import insert failed', details: error.message }, { status: 500 });
  }

  await db.from('product_import_rows').insert(preview.rows.map((row, index) => ({
    batch_id: batchId,
    row_number: row.row,
    status: 'inserted',
    sku: (row.data as ParsedRow).sku,
    product_id: inserted?.[index]?.id ?? null,
    raw_data: records[index] as Json,
    normalized_data: row.data as Json,
    warnings: row.warnings as Json,
    errors: [] as Json,
  })));

  await db.from('product_import_batches').update({ status: 'committed', completed_at: now }).eq('id', batchId);
  await logAdminAction({
    userId: auth.user.id,
    action: 'product_bulk_import',
    resourceType: 'product_import_batch',
    resourceId: batchId,
    details: { filename: file.name, inserted: inserted?.length ?? 0 },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true, batchId, inserted: inserted ?? [], summary: preview.summary });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAccess('imports.write');
  if ('error' in auth) return auth.error;

  const batchId = request.nextUrl.searchParams.get('batch_id');
  if (!batchId) return NextResponse.json({ error: 'batch_id is required' }, { status: 400 });

  const db = asUntypedSupabase(createAdminClient());
  const { data, error } = await db.from<{ id: string }[]>('products')
    .update({ is_active: false, availability_status: 'archived', stock_status: 'out_of_stock', updated_at: new Date().toISOString() })
    .eq('last_import_batch_id', batchId)
    .select('id');

  if (error) return NextResponse.json({ error: 'Rollback failed' }, { status: 500 });
  await db.from('product_import_batches').update({ status: 'rolled_back', rolled_back_at: new Date().toISOString(), rolled_back_by: auth.user.id }).eq('id', batchId);
  await logAdminAction({
    userId: auth.user.id,
    action: 'product_import_rollback',
    resourceType: 'product_import_batch',
    resourceId: batchId,
    details: { archivedProducts: data?.length ?? 0 },
    ipAddress: getRequestIp(request),
  });

  return NextResponse.json({ success: true, archivedProducts: data?.length ?? 0 });
}