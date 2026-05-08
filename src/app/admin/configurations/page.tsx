import Link from 'next/link';
import { Clock, ExternalLink, FileText, Palette } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatPrice } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

type ConfigurationRow = {
  id: string;
  product_id: string;
  setting_type: string | null;
  custom_design_url: string | null;
  custom_design_status: string | null;
  metal: string | null;
  ring_size: string | null;
  chain_length: string | null;
  total_price: number | null;
  delivery_eta_label: string | null;
  status: string;
  configuration_snapshot: unknown;
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  tag_number: string | null;
};

function statusClass(status: string | null) {
  switch (status) {
    case 'pending_custom_design_review':
    case 'pending_review':
      return 'bg-amber-100 text-amber-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function snapshotSummary(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const summary = (snapshot as Record<string, unknown>).summary;
  return typeof summary === 'string' ? summary : null;
}

export default async function AdminConfigurationsPage() {
  const admin = createAdminClient();
  const { data: configurations } = await admin
    .from('product_configurations')
    .select('id, product_id, setting_type, custom_design_url, custom_design_status, metal, ring_size, chain_length, total_price, delivery_eta_label, status, configuration_snapshot, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = (configurations ?? []) as ConfigurationRow[];
  const productIds = Array.from(new Set(rows.map((row) => row.product_id)));
  let productMap = new Map<string, ProductRow>();

  if (productIds.length > 0) {
    const { data: products } = await admin
      .from('products')
      .select('id, name, sku, tag_number')
      .in('id', productIds);
    productMap = new Map(((products ?? []) as ProductRow[]).map((product) => [product.id, product]));
  }

  const customQueueCount = rows.filter((row) => row.custom_design_url).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review saved configurations, custom design uploads, verified totals, and delivery ETAs.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          {customQueueCount} custom design{customQueueCount === 1 ? '' : 's'} in queue
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Configuration</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Options</th>
                <th className="px-4 py-3">ETA</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No saved configurations yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const product = productMap.get(row.product_id);
                  return (
                    <tr key={row.id} className="align-top hover:bg-gray-50/70">
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                            {row.custom_design_url ? <Palette className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-mono text-xs text-gray-500">{row.id.slice(0, 8)}</p>
                            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(row.custom_design_status ?? row.status)}`}>
                              {(row.custom_design_status ?? row.status).replace(/_/g, ' ')}
                            </span>
                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(row.created_at).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{product?.name ?? 'Unknown product'}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {product?.sku ? `SKU ${product.sku}` : 'No SKU'}
                          {product?.tag_number ? ` · Tag ${product.tag_number}` : ''}
                        </p>
                        {snapshotSummary(row.configuration_snapshot) && (
                          <p className="mt-2 max-w-xs text-xs leading-relaxed text-gray-500">
                            {snapshotSummary(row.configuration_snapshot)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        <div className="flex flex-wrap gap-1.5">
                          {[row.setting_type, row.metal, row.ring_size, row.chain_length]
                            .filter(Boolean)
                            .map((item) => (
                              <span key={item} className="rounded bg-gray-100 px-2 py-1">
                                {String(item).replace(/_/g, ' ')}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600">
                        {row.delivery_eta_label ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-600" />
                            {row.delivery_eta_label}
                          </span>
                        ) : (
                          'Not calculated'
                        )}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        {formatPrice(row.total_price ?? 0)}
                      </td>
                      <td className="px-4 py-4">
                        {row.custom_design_url ? (
                          <Link
                            href={row.custom_design_url}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                          >
                            Open file
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">Standard design</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}