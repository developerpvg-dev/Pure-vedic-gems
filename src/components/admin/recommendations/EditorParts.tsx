'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BENEFIT_ICONS,
  BLOCK_PALETTE,
  STONE_ROLE_LABELS,
  createEmptyBlock,
  emptyProductRef,
  type ProductRef,
  type ReportBlock,
  type ReportBlockType,
  type ReportCustomer,
  type StoneCard,
  type StoneRole,
} from '@/lib/recommendations/blocks';
import { BENEFIT_LUCIDE, type BenefitOption } from '@/lib/recommendations/benefit-icons';

type PickerProduct = ProductRef & { id: string };

export function ProductPickerDrawer({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (product: ProductRef) => void;
}) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<PickerProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/recommendations/products?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setProducts(data.products ?? []);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [open, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button type="button" className="flex-1 cursor-default" aria-label="Close" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-semibold">Pick product</h2>
          <button type="button" onClick={onClose} className="text-sm text-neutral-500 hover:text-neutral-900">
            Close
          </button>
        </div>
        <div className="border-b px-4 py-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gems…"
            className="w-full rounded border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? <p className="text-sm text-neutral-500">Loading…</p> : null}
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-pvg-product', JSON.stringify(p));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => {
                    onPick({
                      productId: p.productId,
                      name: p.name,
                      imageUrl: p.imageUrl,
                      slug: p.slug,
                      priceLabel: p.priceLabel,
                      origin: p.origin,
                      buyUrl: p.buyUrl,
                    });
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded border border-neutral-200 p-2 text-left hover:border-amber-400 hover:bg-amber-50"
                >
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-12 w-12 object-cover" />
                  ) : (
                    <div className="h-12 w-12 bg-neutral-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-neutral-500">{p.priceLabel || p.origin || ''}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="border-t px-4 py-2 text-xs text-neutral-500">Drag onto a product slot, or click to assign.</p>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-neutral-600">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm"
        />
      )}
    </label>
  );
}

function ProductSlot({
  label,
  product,
  onAssign,
  onClear,
  onOpenPicker,
}: {
  label: string;
  product: ProductRef;
  onAssign: (p: ProductRef) => void;
  onClear: () => void;
  onOpenPicker: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-pvg-product')) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const raw = e.dataTransfer.getData('application/x-pvg-product');
        if (!raw) return;
        try {
          const p = JSON.parse(raw) as PickerProduct;
          onAssign({
            productId: p.productId,
            name: p.name,
            imageUrl: p.imageUrl,
            slug: p.slug,
            priceLabel: p.priceLabel,
            origin: p.origin,
            buyUrl: p.buyUrl,
          });
        } catch {
          /* ignore */
        }
      }}
      className={`rounded border border-dashed p-2 ${over ? 'border-amber-500 bg-amber-50' : 'border-neutral-300'}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-neutral-600">{label}</span>
        <div className="flex gap-2">
          <button type="button" onClick={onOpenPicker} className="text-[11px] text-amber-700 hover:underline">
            Pick
          </button>
          {product.productId ? (
            <button type="button" onClick={onClear} className="text-[11px] text-neutral-500 hover:underline">
              Clear
            </button>
          ) : null}
        </div>
      </div>
      {product.name ? (
        <div className="flex items-center gap-2">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-10 w-10 object-cover" />
          ) : null}
          <div className="min-w-0">
            <p className="truncate text-sm">{product.name}</p>
            <p className="text-[11px] text-neutral-500">{product.priceLabel}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-400">Drop product here</p>
      )}
    </div>
  );
}

function StoneInspector({
  stone,
  onChange,
  onOpenPicker,
}: {
  stone: StoneCard;
  onChange: (s: StoneCard) => void;
  onOpenPicker: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-neutral-600">Role</span>
        <select
          value={stone.role}
          onChange={(e) => onChange({ ...stone, role: e.target.value as StoneRole })}
          className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm"
        >
          {(Object.keys(STONE_ROLE_LABELS) as StoneRole[]).map((r) => (
            <option key={r} value={r}>
              {STONE_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </label>
      <Field label="Gem label" value={stone.gemLabel} onChange={(gemLabel) => onChange({ ...stone, gemLabel })} />
      <Field label="Weight" value={stone.weight} onChange={(weight) => onChange({ ...stone, weight })} />
      <Field label="Wear day" value={stone.wearDay ?? ''} onChange={(wearDay) => onChange({ ...stone, wearDay })} />
      <Field label="Wear finger" value={stone.wearFinger ?? ''} onChange={(wearFinger) => onChange({ ...stone, wearFinger })} />
      <Field label="Metal" value={stone.metal ?? ''} onChange={(metal) => onChange({ ...stone, metal })} />
      <Field label="Deity" value={stone.wearDeity ?? ''} onChange={(wearDeity) => onChange({ ...stone, wearDeity })} />
      <ProductSlot
        label="Product"
        product={stone.product}
        onAssign={(product) => onChange({ ...stone, product, gemLabel: stone.gemLabel || product.name })}
        onClear={() => onChange({ ...stone, product: emptyProductRef() })}
        onOpenPicker={onOpenPicker}
      />
      <div>
        <p className="mb-1 text-xs font-medium text-neutral-600">Suggested For</p>
        <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
          {BENEFIT_ICONS.map((b) => {
            const on = stone.benefits.includes(b);
            const Icon = BENEFIT_LUCIDE[b as BenefitOption];
            return (
              <button
                key={b}
                type="button"
                onClick={() =>
                  onChange({
                    ...stone,
                    benefits: on ? stone.benefits.filter((x) => x !== b) : [...stone.benefits, b].slice(0, 8),
                  })
                }
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] ${
                  on ? 'bg-amber-600 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                {b}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function BlockInspector({
  block,
  onChange,
  onOpenPicker,
  onUploadChart,
}: {
  block: ReportBlock;
  onChange: (b: ReportBlock) => void;
  onOpenPicker: (assign: (p: ProductRef) => void) => void;
  onUploadChart?: (file: File) => Promise<string | null>;
}) {
  switch (block.type) {
    case 'header':
      return (
        <div className="space-y-2">
          <Field
            label="Logo URL (leave default for Pure Vedic Gems logo)"
            value={block.logoUrl ?? ''}
            onChange={(logoUrl) => onChange({ ...block, logoUrl: logoUrl || null })}
          />
          <Field
            label="Nav links (comma separated)"
            value={block.navLinks.join(', ')}
            onChange={(v) =>
              onChange({
                ...block,
                navLinks: v
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      );
    case 'greeting':
      return (
        <div className="space-y-2">
          <Field label="Headline" value={block.headline} onChange={(headline) => onChange({ ...block, headline })} multiline />
          <Field
            label="Subheadline"
            value={block.subheadline}
            onChange={(subheadline) => onChange({ ...block, subheadline })}
            multiline
          />
        </div>
      );
    case 'customerDetails':
      return <p className="text-xs text-neutral-500">Uses customer fields from the panel above.</p>;
    case 'natalChart':
      return (
        <div className="space-y-2">
          <Field
            label="Description"
            value={block.description}
            onChange={(description) => onChange({ ...block, description })}
            multiline
          />
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-neutral-600">Kundli image</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !onUploadChart) return;
                const url = await onUploadChart(file);
                if (url) onChange({ ...block, imageUrl: url });
              }}
              className="w-full text-xs"
            />
          </label>
          {block.imageUrl ? <p className="truncate text-[11px] text-neutral-500">{block.imageUrl}</p> : null}
        </div>
      );
    case 'primaryStone':
      return (
        <StoneInspector
          stone={block.stone}
          onChange={(stone) => onChange({ ...block, stone })}
          onOpenPicker={() =>
            onOpenPicker((product) =>
              onChange({
                ...block,
                stone: { ...block.stone, product, gemLabel: block.stone.gemLabel || product.name },
              })
            )
          }
        />
      );
    case 'additionalStones':
    case 'stoneGrid':
      return (
        <div className="space-y-4">
          {block.stones.map((stone, i) => (
            <div key={i} className="rounded border border-neutral-200 p-2">
              <p className="mb-2 text-xs font-semibold">Stone {i + 1}</p>
              <StoneInspector
                stone={stone}
                onChange={(s) => {
                  const stones = [...block.stones];
                  stones[i] = s;
                  onChange({ ...block, stones });
                }}
                onOpenPicker={() =>
                  onOpenPicker((product) => {
                    const stones = [...block.stones];
                    stones[i] = { ...stones[i], product, gemLabel: stones[i].gemLabel || product.name };
                    onChange({ ...block, stones });
                  })
                }
              />
            </div>
          ))}
        </div>
      );
    case 'tieredProducts':
      return (
        <div className="space-y-2">
          <Field label="Category" value={block.category} onChange={(category) => onChange({ ...block, category })} />
          <Field label="Gem label" value={block.gemLabel} onChange={(gemLabel) => onChange({ ...block, gemLabel })} />
          <Field label="Weight" value={block.weight} onChange={(weight) => onChange({ ...block, weight })} />
          <Field
            label="Endorsement"
            value={block.endorsement}
            onChange={(endorsement) => onChange({ ...block, endorsement })}
          />
          <Field
            label="Suggested for (one per line)"
            value={block.suggestedFor.join('\n')}
            onChange={(v) =>
              onChange({
                ...block,
                suggestedFor: v
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            multiline
          />
          {block.tiers.map((tier, i) => (
            <ProductSlot
              key={tier.label}
              label={tier.label}
              product={tier.product}
              onAssign={(product) => {
                const tiers = [...block.tiers];
                tiers[i] = { ...tiers[i], product };
                onChange({ ...block, tiers });
              }}
              onClear={() => {
                const tiers = [...block.tiers];
                tiers[i] = { ...tiers[i], product: emptyProductRef() };
                onChange({ ...block, tiers });
              }}
              onOpenPicker={() =>
                onOpenPicker((product) => {
                  const tiers = [...block.tiers];
                  tiers[i] = { ...tiers[i], product };
                  onChange({ ...block, tiers });
                })
              }
            />
          ))}
        </div>
      );
    case 'consultationCta':
      return (
        <div className="space-y-2">
          <Field label="Title" value={block.title} onChange={(title) => onChange({ ...block, title })} />
          <Field label="Price" value={block.priceLabel} onChange={(priceLabel) => onChange({ ...block, priceLabel })} />
          <Field
            label="Button label"
            value={block.buttonLabel}
            onChange={(buttonLabel) => onChange({ ...block, buttonLabel })}
          />
          <Field label="Link" value={block.href} onChange={(href) => onChange({ ...block, href })} />
        </div>
      );
    case 'whyUs':
      return (
        <div className="space-y-2">
          <Field label="Title" value={block.title} onChange={(title) => onChange({ ...block, title })} />
          <Field
            label="Items (one per line)"
            value={block.items.map((i) => i.text).join('\n')}
            onChange={(v) =>
              onChange({
                ...block,
                items: v
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((text) => ({ icon: 'gem', text })),
              })
            }
            multiline
          />
        </div>
      );
    case 'footer':
      return (
        <div className="space-y-2">
          <Field label="Contact" value={block.contact} onChange={(contact) => onChange({ ...block, contact })} />
          <Field label="Address" value={block.address} onChange={(address) => onChange({ ...block, address })} />
          <Field label="Note" value={block.note} onChange={(note) => onChange({ ...block, note })} />
        </div>
      );
    default:
      return null;
  }
}

export function CustomerInspector({
  customer,
  onChange,
}: {
  customer: ReportCustomer;
  onChange: (c: ReportCustomer) => void;
}) {
  const set = useCallback(
    (key: keyof ReportCustomer, value: string) => onChange({ ...customer, [key]: value }),
    [customer, onChange]
  );
  return (
    <div className="space-y-2">
      <Field label="Name" value={customer.name} onChange={(v) => set('name', v)} />
      <Field label="Email" value={customer.email} onChange={(v) => set('email', v)} />
      <Field label="Phone" value={customer.phone} onChange={(v) => set('phone', v)} />
      <Field label="Date of birth" value={customer.dob} onChange={(v) => set('dob', v)} />
      <Field label="Birth place" value={customer.birthPlace} onChange={(v) => set('birthPlace', v)} />
      <Field label="Purpose" value={customer.purpose} onChange={(v) => set('purpose', v)} />
      <Field label="Weight note" value={customer.weightNote} onChange={(v) => set('weightNote', v)} />
    </div>
  );
}

export function BlockPalette({ onAdd }: { onAdd: (type: ReportBlockType) => void }) {
  return (
    <div className="space-y-1">
      {BLOCK_PALETTE.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => onAdd(item.type)}
          className="w-full rounded border border-neutral-200 px-2 py-2 text-left hover:border-amber-400 hover:bg-amber-50"
        >
          <p className="text-sm font-medium">{item.label}</p>
          <p className="text-[11px] text-neutral-500">{item.description}</p>
        </button>
      ))}
    </div>
  );
}

export function BlockList({
  blocks,
  selectedId,
  onSelect,
  onReorder,
  onRemove,
}: {
  blocks: ReportBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const labels = useMemo(() => Object.fromEntries(BLOCK_PALETTE.map((b) => [b.type, b.label])), []);

  return (
    <ul className="space-y-1">
      {blocks.map((block, index) => (
        <li
          key={block.id}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index);
            setDragIndex(null);
          }}
          className={`flex items-center gap-1 rounded border px-2 py-1.5 text-sm ${
            selectedId === block.id ? 'border-amber-500 bg-amber-50' : 'border-neutral-200 bg-white'
          } ${dragIndex === index ? 'opacity-50' : ''}`}
        >
          <button type="button" className="flex-1 truncate text-left" onClick={() => onSelect(block.id)}>
            <span className="cursor-grab text-neutral-400">⋮⋮ </span>
            {labels[block.type] || block.type}
          </button>
          <button
            type="button"
            onClick={() => onRemove(block.id)}
            className="text-xs text-neutral-400 hover:text-red-600"
            aria-label="Remove block"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

export { createEmptyBlock };
