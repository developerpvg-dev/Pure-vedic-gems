import { rudrakshaSubcategoryLabel } from '@/lib/constants/rudraksha-subcategories';
import {
  RUDRAKSHA_DESIGN_CATEGORIES,
  type RudrakshaDesignCategory,
} from '@/lib/utils/rudraksha-design-rules';
import {
  parseConfigurationSnapshot,
  type ConfigurationSnapshot,
  type RudrakshaBeadSnapshot,
} from '@/lib/utils/configuration-snapshot';

export type { RudrakshaBeadSnapshot };

type BeadProduct = {
  id: string;
  sku: string | null;
  tag_number: string | null;
  slug?: string;
  name: string;
  sub_category: string | null;
  price: number;
  origin?: string | null;
  carat_weight?: number | null;
};

function titleCaseSlug(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatRudrakshaMukhiLabel(subCategory: string | null | undefined): string {
  if (!subCategory) return 'Rudraksha';
  const match = subCategory.match(/^(\d+)-mukhi$/);
  if (match) return `${match[1]} Mukhi`;
  return rudrakshaSubcategoryLabel(subCategory).replace(/\s+Rudraksha(s)?$/i, '');
}

export function formatRudrakshaDesignCategory(
  category: string | null | undefined
): string | null {
  if (!category) return null;
  const key = category as RudrakshaDesignCategory;
  return RUDRAKSHA_DESIGN_CATEGORIES[key]?.label ?? category.replace(/_/g, ' ');
}

export function buildRudrakshaBeadSnapshots(
  primary: BeadProduct,
  combos: BeadProduct[] = []
): RudrakshaBeadSnapshot[] {
  const beads: RudrakshaBeadSnapshot[] = [
    {
      role: 'primary',
      id: primary.id,
      name: primary.name,
      sku: primary.sku,
      tag_number: primary.tag_number,
      slug: primary.slug,
      sub_category: primary.sub_category,
      mukhi_label: formatRudrakshaMukhiLabel(primary.sub_category),
      price: Number(primary.price) || 0,
      origin: primary.origin ?? null,
      carat_weight: primary.carat_weight ?? null,
    },
  ];

  for (const combo of combos) {
    if (combo.id === primary.id) continue;
    beads.push({
      role: 'combo',
      id: combo.id,
      name: combo.name,
      sku: combo.sku,
      tag_number: combo.tag_number,
      slug: combo.slug,
      sub_category: combo.sub_category,
      mukhi_label: formatRudrakshaMukhiLabel(combo.sub_category),
      price: Number(combo.price) || 0,
      origin: combo.origin ?? null,
      carat_weight: combo.carat_weight ?? null,
    });
  }

  return beads;
}

export function parseRudrakshaBeadsFromSnapshot(
  snapshot: unknown
): RudrakshaBeadSnapshot[] {
  const parsed = parseConfigurationSnapshot(snapshot);
  if (!parsed) return [];

  if (parsed.selections?.rudraksha_beads?.length) {
    return parsed.selections.rudraksha_beads;
  }

  const beads: RudrakshaBeadSnapshot[] = [];
  const product = parsed.product;
  if (product?.id && product.name) {
    beads.push({
      role: 'primary',
      id: product.id,
      name: product.name,
      sku: product.sku ?? null,
      tag_number: product.tag_number ?? null,
      sub_category: product.sub_category ?? null,
      mukhi_label: formatRudrakshaMukhiLabel(product.sub_category),
      price: parsed.pricing?.gem_price ?? 0,
      origin: product.origin ?? null,
      carat_weight: product.carat_weight ?? null,
    });
  }

  const comboIds = parsed.selections?.rudraksha_combo_product_ids ?? [];
  for (const id of comboIds) {
    if (id === product?.id) continue;
    beads.push({
      role: 'combo',
      id,
      name: 'Combo bead',
      sku: null,
      tag_number: null,
      sub_category: null,
      mukhi_label: 'Rudraksha',
      price: 0,
    });
  }

  return beads;
}

export function isRudrakshaConfigurationSnapshot(snapshot: unknown): boolean {
  const parsed = parseConfigurationSnapshot(snapshot);
  if (!parsed) return false;
  if (parsed.product?.category === 'rudraksha') return true;
  if (parsed.selections?.is_rudraksha) return true;
  if ((parsed.selections?.rudraksha_beads?.length ?? 0) > 0) return true;
  return (parsed.selections?.rudraksha_combo_product_ids?.length ?? 0) > 0;
}

export function buildRudrakshaConfigurationSummary(args: {
  beads: RudrakshaBeadSnapshot[];
  settingType?: string | null;
  designName?: string | null;
  metal?: string | null;
  chainLength?: string | null;
  certificationName?: string | null;
  hasCustomDesign?: boolean;
}): string {
  const parts: string[] = [];

  if (args.beads.length <= 1) {
    const bead = args.beads[0];
    parts.push(bead ? `${bead.mukhi_label} — ${bead.name}` : 'Rudraksha');
  } else {
    parts.push(
      `${args.beads.length} beads (${args.beads.map((b) => b.mukhi_label).join(' + ')})`
    );
  }

  parts.push('Pendant');
  if (args.designName) parts.push(args.designName);
  if (args.hasCustomDesign) parts.push('Custom Design');
  if (args.metal) parts.push(titleCaseSlug(args.metal));
  if (args.chainLength) parts.push(`Chain ${args.chainLength}`);
  if (args.certificationName) parts.push(args.certificationName);

  return parts.join(' · ');
}

export function getRudrakshaProductIdsFromSnapshot(snapshot: unknown): string[] {
  const beads = parseRudrakshaBeadsFromSnapshot(snapshot);
  return Array.from(new Set(beads.map((bead) => bead.id).filter(Boolean)));
}

export function getConfigurationDisplaySections(snapshot: unknown): {
  isRudraksha: boolean;
  beads: RudrakshaBeadSnapshot[];
  designName: string | null;
  designCategory: string | null;
  metal: string | null;
  chainLength: string | null;
  ringSize: string | null;
  certification: string | null;
  certificationSkipped: boolean;
  energization: string | null;
  customDesignUrl: string | null;
  deliveryEta: string | null;
  summary: string | null;
  pricing: ConfigurationSnapshot['pricing'] | undefined;
} {
  const parsed = parseConfigurationSnapshot(snapshot);
  const selections = parsed?.selections;

  return {
    isRudraksha: isRudrakshaConfigurationSnapshot(parsed),
    beads: parseRudrakshaBeadsFromSnapshot(parsed),
    designName: selections?.design?.name ?? null,
    designCategory: formatRudrakshaDesignCategory(selections?.design?.rudraksha_category),
    metal: selections?.metal ?? null,
    chainLength: selections?.chain_length ?? null,
    ringSize: selections?.ring_size ?? null,
    certification: selections?.certification?.name ?? null,
    certificationSkipped: Boolean(selections?.certification_skipped && !selections?.certification),
    energization: selections?.energization?.name ?? null,
    customDesignUrl: selections?.custom_design_url ?? null,
    deliveryEta: parsed?.delivery_eta?.label ?? null,
    summary: parsed?.summary ?? null,
    pricing: parsed?.pricing,
  };
}

export function getConfigurationDetailChips(
  snapshot: unknown,
  summary?: string | null
): string[] {
  const parsed = parseConfigurationSnapshot(snapshot);
  if (!parsed && summary) {
    return summary.split(' · ').filter(Boolean);
  }
  if (!parsed) return [];

  const chips: string[] = [];
  const selections = parsed.selections;

  if (isRudrakshaConfigurationSnapshot(parsed)) {
    const beads = parseRudrakshaBeadsFromSnapshot(parsed);
    if (beads.length <= 1) {
      const bead = beads[0];
      if (bead) chips.push(`${bead.mukhi_label} — ${bead.name}`);
    } else {
      chips.push(`${beads.length} beads`);
      for (const bead of beads) {
        chips.push(`${bead.role === 'primary' ? 'Primary' : 'Combo'}: ${bead.mukhi_label}`);
      }
    }
  } else if (parsed.product?.name) {
    chips.push(parsed.product.name);
  }

  if (selections?.setting_type && selections.setting_type !== 'loose') {
    chips.push(titleCaseSlug(selections.setting_type));
  }
  if (selections?.design?.name) chips.push(selections.design.name);
  if (selections?.design?.rudraksha_category) {
    const label = formatRudrakshaDesignCategory(selections.design.rudraksha_category);
    if (label) chips.push(label);
  }
  if (selections?.metal) chips.push(titleCaseSlug(selections.metal));
  if (selections?.chain_length) chips.push(`Chain ${selections.chain_length}`);
  if (selections?.ring_size) chips.push(`Size ${selections.ring_size}`);
  if (selections?.certification?.name) chips.push(selections.certification.name);
  if (selections?.certification_skipped) chips.push('No certification');
  if (selections?.energization?.name) chips.push(selections.energization.name);

  return chips.length > 0 ? chips : summary ? summary.split(' · ').filter(Boolean) : [];
}

export function formatConfigurationDetailText(
  snapshot: unknown,
  summary?: string | null
): string | null {
  const sections = getConfigurationDisplaySections(snapshot);
  const lines: string[] = [];

  if (sections.beads.length > 0) {
    for (const bead of sections.beads) {
      const tag = bead.tag_number ? ` · Tag ${bead.tag_number}` : bead.sku ? ` · SKU ${bead.sku}` : '';
      lines.push(
        `${bead.role === 'primary' ? 'Primary' : 'Combo'}: ${bead.mukhi_label} — ${bead.name}${tag}`
      );
    }
  }

  if (sections.designName) {
    lines.push(
      `Mounting: ${sections.designName}${sections.designCategory ? ` (${sections.designCategory})` : ''}`
    );
  }
  if (sections.metal) lines.push(`Metal: ${titleCaseSlug(sections.metal)}`);
  if (sections.chainLength) lines.push(`Chain: ${sections.chainLength}`);
  if (sections.certification) lines.push(`Certification: ${sections.certification}`);
  if (sections.certificationSkipped) lines.push('Certification: Skipped');
  if (sections.energization) lines.push(`Energization: ${sections.energization}`);
  if (sections.deliveryEta) lines.push(`Delivery: ${sections.deliveryEta}`);

  if (lines.length > 0) return lines.join(' · ');
  return summary ?? sections.summary ?? null;
}
