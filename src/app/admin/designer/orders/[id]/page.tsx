import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderItemRecord, OrderRecord } from '@/lib/types/order';
import { ORDER_STATUS_LABELS } from '@/lib/constants/order-status';
import { enrichManyOrderItemLists, parseOrderItems } from '@/lib/customer/orders';
import {
  DesignerOrderItemsSection,
  type DesignerConfigRow,
} from '@/components/admin/designer/DesignerOrderItemCard';
import { DesignerOrderStatusForm } from '@/components/admin/designer/DesignerOrderStatusForm';
import { energizationFormFromOrderItems } from '@/lib/utils/configuration-snapshot';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DesignerOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/?auth=login');

  const admin = createAdminClient();
  const { data: raw } = await admin
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('assigned_designer_id', user.id)
    .maybeSingle();

  if (!raw) notFound();

  const order = raw as unknown as OrderRecord & {
    design_notes?: string | null;
    design_routed_at?: string | null;
    design_completed_at?: string | null;
  };

  const parsedItems = parseOrderItems(order.items as never);
  const [enrichedItems] = await enrichManyOrderItemLists([parsedItems], admin);
  const items = (enrichedItems ?? parsedItems) as OrderItemRecord[];
  const ceremonyForm = energizationFormFromOrderItems(items);

  const configIds = items
    .map((item) => item.configuration_id)
    .filter((cid): cid is string => Boolean(cid));

  const configMap = new Map<string, DesignerConfigRow>();
  if (configIds.length > 0) {
    const { data: configs } = await admin
      .from('product_configurations')
      .select(`
        id,
        setting_type,
        metal,
        ring_size,
        chain_length,
        custom_design_url,
        configuration_snapshot,
        jewelry_designs ( name, setting_type, image_url, description ),
        certification_labs ( name, full_name ),
        energization_options ( name, description, duration )
      `)
      .in('id', configIds);

    if (configs) {
      for (const config of configs as unknown as DesignerConfigRow[]) {
        configMap.set(config.id, config);
      }
    }
  }

  const designIds = new Set<string>();
  for (const item of items) {
    const snapshot = item.configuration_snapshot as { selections?: { design?: { id?: string } } } | undefined;
    const designId = snapshot?.selections?.design?.id;
    if (designId) designIds.add(designId);
  }

  const designImageById = new Map<string, { name: string; image_url: string | null; description: string | null; setting_type: string }>();
  if (designIds.size > 0) {
    const { data: designs } = await admin
      .from('jewelry_designs')
      .select('id, name, image_url, description, setting_type')
      .in('id', [...designIds]);

    for (const design of designs ?? []) {
      designImageById.set(design.id as string, {
        name: design.name as string,
        image_url: (design.image_url as string | null) ?? null,
        description: (design.description as string | null) ?? null,
        setting_type: (design.setting_type as string) ?? 'ring',
      });
    }
  }

  for (const item of items) {
    if (!item.configuration_id) continue;
    const config = configMap.get(item.configuration_id);
    if (!config) continue;
    const snapshot = item.configuration_snapshot as { selections?: { design?: { id?: string } } } | undefined;
    const designId = snapshot?.selections?.design?.id;
    if (!designId || config.jewelry_designs?.image_url) continue;
    const design = designImageById.get(designId);
    if (design) {
      configMap.set(item.configuration_id, {
        ...config,
        jewelry_designs: design,
      });
    }
  }

  const statusLabel =
    ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS] || order.status;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/designer"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assignments
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order {order.order_number}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {statusLabel}
          {order.design_routed_at
            ? ` · Routed ${new Date(order.design_routed_at).toLocaleString('en-IN')}`
            : ''}
        </p>
      </div>

      <DesignerOrderItemsSection items={items} configMap={configMap} />

      {order.special_instructions ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-bold text-amber-900">Customer instructions</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">{order.special_instructions}</p>
        </section>
      ) : null}

      {order.include_energization || order.energization_type ? (
        <section className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-950">
          <h2 className="font-bold text-violet-900">Energization requested</h2>
          {order.energization_type ? <p className="mt-1">Type: {order.energization_type}</p> : null}
          {(order.ceremony_gotra || ceremonyForm?.gotra) ? (
            <p>Gotra: {order.ceremony_gotra || ceremonyForm?.gotra}</p>
          ) : null}
          {(order.ceremony_dob || ceremonyForm?.dob) ? (
            <p>DOB: {order.ceremony_dob || ceremonyForm?.dob}</p>
          ) : null}
          {ceremonyForm?.birth_time ? <p>Birth time: {ceremonyForm.birth_time}</p> : null}
          {ceremonyForm?.birth_place ? <p>Birth place: {ceremonyForm.birth_place}</p> : null}
          {(order.ceremony_rashi || ceremonyForm?.rashi) ? (
            <p>Rashi: {order.ceremony_rashi || ceremonyForm?.rashi}</p>
          ) : null}
        </section>
      ) : null}

      <DesignerOrderStatusForm
        orderId={order.id}
        initialStatus={order.status}
        initialDesignNotes={order.design_notes ?? null}
      />
    </div>
  );
}
