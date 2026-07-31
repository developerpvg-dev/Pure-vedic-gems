import Image from 'next/image';
import { Gem, Package, Settings } from 'lucide-react';
import type { OrderItemRecord } from '@/lib/types/order';
import {
  mergeConfigurationDetails,
  type ConfigurationSnapshot,
} from '@/lib/utils/configuration-snapshot';
import {
  isRudrakshaConfigurationSnapshot,
  parseRudrakshaBeadsFromSnapshot,
} from '@/lib/utils/rudraksha-order-display';
import { formatProductDisplayName } from '@/lib/utils/product-display-name';
import { CustomDesignBriefCard } from '@/components/admin/CustomDesignBriefCard';

const METAL_LABELS: Record<string, string> = {
  gold_22k: '22K Gold',
  gold_18k: '18K Gold',
  gold_14k: '14K Gold',
  silver_925: '925 Sterling Silver',
  panchdhatu: 'Panchdhatu (Without Gold)',
  panchdhatu_with_gold: 'Panchdhatu (With Gold)',
  copper_pital: 'Copper/Pital',
  platinum: 'Platinum',
};

const SETTING_LABELS: Record<string, string> = {
  ring: 'Ring',
  pendant: 'Pendant',
  bracelet: 'Bracelet',
  loose: 'Loose (No Setting)',
};

function cap(s: string | null | undefined) {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export type DesignerConfigRow = {
  id: string;
  setting_type: string | null;
  metal: string | null;
  ring_size: string | null;
  chain_length: string | null;
  custom_design_url: string | null;
  configuration_snapshot: unknown;
  jewelry_designs: {
    name: string;
    setting_type: string;
    image_url: string | null;
    description: string | null;
  } | null;
  certification_labs: {
    name: string;
    full_name: string | null;
  } | null;
  energization_options: {
    name: string;
    description: string | null;
    duration: string | null;
  } | null;
};

function SpecCard({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
      {sub ? <p className="text-[10px] text-gray-500">{sub}</p> : null}
    </div>
  );
}

export function DesignerOrderItemCard({
  item,
  config,
}: {
  item: OrderItemRecord;
  config: DesignerConfigRow | null;
}) {
  const details: ConfigurationSnapshot | null = config || item.configuration_snapshot
    ? mergeConfigurationDetails({
        snapshot: item.configuration_snapshot ?? config?.configuration_snapshot,
        dbConfig: config,
      })
    : null;

  const selections = details?.selections;
  const gemImage = item.image_url ?? details?.product?.image_url ?? null;
  const designImage = config?.jewelry_designs?.image_url ?? null;
  const designName = selections?.design?.name ?? config?.jewelry_designs?.name ?? null;
  const settingType = selections?.setting_type ?? config?.jewelry_designs?.setting_type ?? null;
  const rudrakshaConfig = isRudrakshaConfigurationSnapshot(
    item.configuration_snapshot ?? config?.configuration_snapshot
  );
  const rudrakshaBeads = parseRudrakshaBeadsFromSnapshot(
    item.configuration_snapshot ?? config?.configuration_snapshot
  );

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
        <div className="flex gap-4">
          {gemImage ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
              <Image src={gemImage} alt={formatProductDisplayName(item.name)} fill className="object-cover" sizes="80px" unoptimized />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-indigo-50 text-indigo-400">
              <Gem className="h-8 w-8" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-gray-900">{formatProductDisplayName(item.name)}</h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
              {item.sku ? <span>SKU: <strong className="text-gray-700">{item.sku}</strong></span> : null}
              {item.tag_number ? <span>Tag: <strong className="text-gray-700">{item.tag_number}</strong></span> : null}
              {item.carat_weight ? <span>{item.carat_weight} ct</span> : null}
              {item.origin ? <span>Origin: {item.origin}</span> : null}
              {item.category ? <span>{item.category}</span> : null}
              <span>Qty: {item.quantity ?? 1}</span>
            </div>
            {item.configuration_summary ? (
              <p className="mt-2 text-sm text-gray-600">{formatProductDisplayName(item.configuration_summary)}</p>
            ) : null}
          </div>
        </div>
      </div>

      {details ? (
        <div className="border-b border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/50 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-indigo-700" />
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              {rudrakshaConfig ? 'Rudraksha pendant to design' : 'Jewelry to design'}
            </p>
            {settingType ? (
              <span className="ml-auto rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                {SETTING_LABELS[settingType] ?? cap(settingType)}
              </span>
            ) : null}
          </div>

          {details.summary ? (
            <p className="mb-4 text-sm text-indigo-950/80">{details.summary}</p>
          ) : null}

          {rudrakshaBeads.length > 0 ? (
            <div className="mb-4 rounded-lg border border-indigo-100 bg-white/80 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Rudraksha beads ({rudrakshaBeads.length})
              </p>
              <ul className="space-y-2 text-sm text-gray-800">
                {rudrakshaBeads.map((bead) => (
                  <li key={bead.id}>
                    <span className="font-semibold text-indigo-700">
                      {bead.role === 'primary' ? 'Primary' : 'Combo'} ·{' '}
                    </span>
                    {bead.mukhi_label} — {bead.name}
                    {bead.tag_number ? (
                      <span className="text-xs text-gray-500"> · Tag {bead.tag_number}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-4 sm:flex-row">
            {designImage ? (
              <div className="relative mx-auto h-48 w-48 shrink-0 overflow-hidden rounded-xl border-2 border-indigo-200 bg-white shadow-sm sm:mx-0 sm:h-56 sm:w-56">
                <Image
                  src={designImage}
                  alt={designName ?? 'Jewelry design'}
                  fill
                  className="object-contain p-2"
                  sizes="224px"
                  unoptimized
                />
              </div>
            ) : null}

            <div className="min-w-0 flex-1 space-y-3">
              {designName ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Selected design</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{designName}</p>
                  {config?.jewelry_designs?.description ? (
                    <p className="mt-1 text-sm text-gray-600">{config.jewelry_designs.description}</p>
                  ) : null}
                </div>
              ) : null}

              {selections?.custom_design_url || selections?.custom_design_brief ? (
                <CustomDesignBriefCard
                  brief={selections.custom_design_brief}
                  fileUrl={selections.custom_design_url}
                  ringSize={selections.ring_size}
                  settingType={selections.setting_type}
                  productName={item.name}
                  printId={`designer-custom-brief-${item.configuration_id ?? item.product_id}`}
                />
              ) : null}

              {details.pricing?.design_note ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  <span className="font-semibold">Design note: </span>
                  {details.pricing.design_note}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {selections?.metal ? (
              <SpecCard label="Metal" value={METAL_LABELS[selections.metal] ?? cap(selections.metal) ?? selections.metal} />
            ) : null}
            {selections?.ring_size ? (
              <SpecCard label="Ring size" value={selections.ring_size} />
            ) : null}
            {selections?.chain_length ? (
              <SpecCard label="Chain length" value={selections.chain_length} />
            ) : null}
            {selections?.certification?.name ? (
              <SpecCard
                label="Certification"
                value={selections.certification.name}
                sub={config?.certification_labs?.full_name}
              />
            ) : null}
            {selections?.certification_skipped && !selections?.certification ? (
              <SpecCard label="Certification" value="Skipped" />
            ) : null}
            {selections?.energization?.name ? (
              <SpecCard
                label="Energization"
                value={selections.energization.name}
                sub={config?.energization_options?.duration ? `Duration: ${config.energization_options.duration}` : null}
              />
            ) : null}
            {details.delivery_eta?.label ? (
              <SpecCard label="Delivery ETA" value={details.delivery_eta.label} />
            ) : null}
            {item.delivery_eta_label && !details.delivery_eta?.label ? (
              <SpecCard label="Delivery ETA" value={item.delivery_eta_label} />
            ) : null}
          </div>

          {selections?.energization_form ? (
            <div className="mt-4 rounded-lg border border-indigo-100 bg-white/90 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Vedic birth details</p>
              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-gray-500">Date of birth</p>
                  <p className="font-medium text-gray-900">{selections.energization_form.dob || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Birth time</p>
                  <p className="font-medium text-gray-900">{selections.energization_form.birth_time || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Birth place</p>
                  <p className="font-medium text-gray-900">{selections.energization_form.birth_place || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Gotra</p>
                  <p className="font-medium text-gray-900">{selections.energization_form.gotra || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Rashi</p>
                  <p className="font-medium text-gray-900">{selections.energization_form.rashi || '—'}</p>
                </div>
              </div>
              {selections.energization_form.record_ceremony ? (
                <p className="mt-2 text-xs font-medium text-indigo-700">Ceremony video requested</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="p-5 text-sm text-gray-500">No jewelry configuration on this line item.</div>
      )}
    </article>
  );
}

export function DesignerOrderItemsSection({
  items,
  configMap,
}: {
  items: OrderItemRecord[];
  configMap: Map<string, DesignerConfigRow>;
}) {
  if (!items.length) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        <Package className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        No items in this order.
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
        Order items ({items.length})
      </h2>
      {items.map((item, index) => (
        <DesignerOrderItemCard
          key={`${item.product_id ?? item.name}-${index}`}
          item={item}
          config={item.configuration_id ? configMap.get(item.configuration_id) ?? null : null}
        />
      ))}
    </section>
  );
}
