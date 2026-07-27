import { parseConfigurationSnapshot } from '@/lib/utils/configuration-snapshot';
import { isRudrakshaConfigurationSnapshot } from '@/lib/utils/rudraksha-order-display';

export type FulfillmentProfile =
  | 'loose_gemstone'
  | 'configured_jewelry'
  | 'rudraksha_configured'
  | 'rudraksha_loose'
  | 'idol'
  | 'mala'
  | 'ready_jewelry'
  | 'mixed';

export type LineItemForFulfillment = {
  product_id?: string | null;
  category?: string | null;
  configuration_id?: string | null;
  configuration_snapshot?: unknown;
};

export type OrderFulfillmentContext = {
  profile: FulfillmentProfile;
  mixed: boolean;
  itemProfiles: FulfillmentProfile[];
  needsCrafting: boolean;
  needsDesigner: boolean;
  showProductVideo: boolean;
  showPujaVideo: boolean;
  showCertification: boolean;
  showEnergization: boolean;
  hasConfiguration: boolean;
};

const PROFILE_PRIORITY: FulfillmentProfile[] = [
  'configured_jewelry',
  'rudraksha_configured',
  'loose_gemstone',
  'rudraksha_loose',
  'idol',
  'mala',
  'ready_jewelry',
];

export const FULFILLMENT_PROFILE_LABELS: Record<FulfillmentProfile, string> = {
  loose_gemstone: 'Loose Gemstone',
  configured_jewelry: 'Configured Jewelry',
  rudraksha_configured: 'Rudraksha Pendant',
  rudraksha_loose: 'Loose Rudraksha',
  idol: 'Idol',
  mala: 'Mala',
  ready_jewelry: 'Vedic Jewelry',
  mixed: 'Mixed Order',
};

export function resolveLineItemFulfillmentProfile(
  item: LineItemForFulfillment
): FulfillmentProfile {
  const snapshot = parseConfigurationSnapshot(item.configuration_snapshot);
  const settingType = snapshot?.selections?.setting_type ?? null;
  const category = (item.category ?? snapshot?.product?.category ?? '').toLowerCase();
  const hasConfig = Boolean(item.configuration_id || snapshot);

  if (hasConfig) {
    const rudraksha =
      category === 'rudraksha' || isRudrakshaConfigurationSnapshot(snapshot);
    if (rudraksha) {
      return settingType === 'loose' ? 'rudraksha_loose' : 'rudraksha_configured';
    }
    if (settingType === 'loose') return 'loose_gemstone';
    return 'configured_jewelry';
  }

  if (category === 'rudraksha') return 'rudraksha_loose';
  if (category === 'idol') return 'idol';
  if (category === 'mala') return 'mala';
  if (category === 'jewelry') return 'ready_jewelry';
  if (['navaratna', 'upratna', 'gemstone'].includes(category)) return 'loose_gemstone';

  return 'loose_gemstone';
}

export function resolveOrderFulfillmentContext(args: {
  items: LineItemForFulfillment[];
  includeEnergization?: boolean;
  energizationCharges?: number;
  certificationCharges?: number;
}): OrderFulfillmentContext {
  const itemProfiles = args.items.map(resolveLineItemFulfillmentProfile);
  const unique = Array.from(new Set(itemProfiles));
  const mixed = unique.length > 1;

  let profile: FulfillmentProfile = 'loose_gemstone';
  if (mixed) {
    profile = 'mixed';
  } else if (unique[0]) {
    profile = unique[0];
  } else {
    profile = PROFILE_PRIORITY.find((candidate) => unique.includes(candidate)) ?? 'loose_gemstone';
  }

  if (mixed) {
    const dominant =
      PROFILE_PRIORITY.find((candidate) => unique.includes(candidate)) ?? 'configured_jewelry';
    profile = dominant;
  }

  // Paid additional labs only — free lab (extra_charge 0) skips the certification stage.
  const hasCertification = (args.certificationCharges ?? 0) > 0;
  const hasEnergization = Boolean(args.includeEnergization) || (args.energizationCharges ?? 0) > 0;

  const needsCrafting =
    profile === 'configured_jewelry' ||
    profile === 'rudraksha_configured' ||
    (mixed &&
      unique.some((p) => p === 'configured_jewelry' || p === 'rudraksha_configured'));

  const needsDesigner = needsCrafting;

  const showProductVideo = needsCrafting;
  const showPujaVideo =
    hasEnergization &&
    profile !== 'rudraksha_configured' &&
    !(mixed && unique.includes('rudraksha_configured') && !unique.includes('configured_jewelry'));

  const showCertification = hasCertification;
  const showEnergization =
    hasEnergization && profile !== 'rudraksha_configured' && profile !== 'rudraksha_loose';

  const hasConfiguration = args.items.some(
    (item) => item.configuration_id || item.configuration_snapshot
  );

  return {
    profile: mixed ? 'mixed' : profile,
    mixed,
    itemProfiles: unique,
    needsCrafting,
    needsDesigner,
    showProductVideo,
    showPujaVideo,
    showCertification,
    showEnergization,
    hasConfiguration,
  };
}

export type JourneyStepKey =
  | 'payment'
  | 'confirmed'
  | 'processing'
  | 'crafting'
  | 'preparation'
  | 'certification'
  | 'energization'
  | 'product_video'
  | 'puja_video'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'feedback';

export type JourneyStepTemplate = {
  key: JourneyStepKey;
  label: string;
  shortLabel: string;
};

export function getJourneyStepsForContext(context: OrderFulfillmentContext): JourneyStepTemplate[] {
  const profile = context.mixed
    ? context.itemProfiles.find((p) =>
        ['configured_jewelry', 'rudraksha_configured'].includes(p)
      ) ??
      context.itemProfiles[0] ??
      'loose_gemstone'
    : context.profile;

  const steps: JourneyStepTemplate[] = [
    { key: 'payment', label: 'Payment', shortLabel: 'Pay' },
    { key: 'confirmed', label: 'Confirmed', shortLabel: 'OK' },
  ];

  const needsEarlyCert =
    context.showCertification &&
    (profile === 'configured_jewelry' || profile === 'rudraksha_configured');

  if (profile === 'configured_jewelry') {
    steps.push({ key: 'processing', label: 'Design Routing', shortLabel: 'Route' });
    if (needsEarlyCert) {
      steps.push({ key: 'certification', label: 'Certification', shortLabel: 'Cert' });
    }
    steps.push({ key: 'crafting', label: 'Jewelry Crafting', shortLabel: 'Craft' });
  } else if (profile === 'rudraksha_configured') {
    steps.push({ key: 'processing', label: 'Beads Verified', shortLabel: 'Verify' });
    if (needsEarlyCert) {
      steps.push({ key: 'certification', label: 'Certification', shortLabel: 'Cert' });
    }
    steps.push({ key: 'crafting', label: 'Pendant Mounting', shortLabel: 'Mount' });
  } else if (profile === 'rudraksha_loose') {
    steps.push({ key: 'processing', label: 'Bead Preparation', shortLabel: 'Prep' });
  } else if (profile === 'loose_gemstone') {
    steps.push({ key: 'processing', label: 'Gem Preparation', shortLabel: 'Prep' });
  } else if (profile === 'idol') {
    steps.push({ key: 'preparation', label: 'Idol Preparation', shortLabel: 'Prep' });
  } else if (profile === 'mala') {
    steps.push({ key: 'preparation', label: 'Mala Preparation', shortLabel: 'Prep' });
  } else if (profile === 'ready_jewelry') {
    steps.push({ key: 'preparation', label: 'Jewelry Preparation', shortLabel: 'Prep' });
  } else {
    steps.push({ key: 'processing', label: 'Processing', shortLabel: 'Prep' });
  }

  // Loose / non-crafted: certification after prep. Crafted jewelry already inserted it early.
  if (context.showCertification && !needsEarlyCert) {
    steps.push({ key: 'certification', label: 'Certification', shortLabel: 'Cert' });
  }

  if (context.showEnergization) {
    steps.push({ key: 'energization', label: 'Energization', shortLabel: 'Energy' });
  }

  if (context.showProductVideo) {
    steps.push({ key: 'product_video', label: 'Product Video', shortLabel: 'Video' });
  }

  if (context.showPujaVideo) {
    steps.push({ key: 'puja_video', label: 'Puja Video', shortLabel: 'Puja' });
  }

  steps.push(
    { key: 'shipped', label: 'Shipped', shortLabel: 'Ship' },
    { key: 'out_for_delivery', label: 'Out for Delivery', shortLabel: 'OFD' },
    { key: 'delivered', label: 'Delivered', shortLabel: 'Done' },
    { key: 'feedback', label: 'Feedback', shortLabel: 'FB' },
  );

  return steps;
}

export const ADMIN_STATUS_PIPELINE = [
  'pending_payment',
  'placed',
  'confirmed',
  'processing',
  'certification',
  'design_assigned',
  'design_in_progress',
  'design_completed',
  'jewelry_making',
  'energization',
  'quality_check',
  'shipped',
  'out_for_delivery',
  'delivered',
  'feedback',
] as const;

export type AdminOrderStatus = (typeof ADMIN_STATUS_PIPELINE)[number];

export function getAdminStatusPipeline(context: OrderFulfillmentContext): AdminOrderStatus[] {
  const profile = context.mixed
    ? context.itemProfiles.find((p) =>
        ['configured_jewelry', 'rudraksha_configured'].includes(p)
      ) ?? context.itemProfiles[0]
    : context.profile;

  const tail: AdminOrderStatus[] = ['shipped', 'out_for_delivery', 'delivered', 'feedback'];

  if (profile === 'configured_jewelry' || profile === 'rudraksha_configured') {
    // Paid cert first: stone goes to lab before design is assigned.
    const mid: AdminOrderStatus[] = ['confirmed', 'processing'];
    if (context.showCertification) mid.push('certification');
    mid.push(
      'design_assigned',
      'design_in_progress',
      'design_completed',
      'jewelry_making',
    );
    if (context.showEnergization && profile === 'configured_jewelry') mid.push('energization');
    mid.push('quality_check');
    return ['pending_payment', 'placed', ...mid, ...tail];
  }

  if (profile === 'loose_gemstone' || profile === 'rudraksha_loose') {
    const mid: AdminOrderStatus[] = ['confirmed', 'processing'];
    if (context.showCertification) mid.push('certification');
    if (context.showEnergization && profile === 'loose_gemstone') mid.push('energization');
    mid.push('quality_check');
    return ['pending_payment', 'placed', ...mid, ...tail];
  }

  if (profile === 'idol' || profile === 'mala' || profile === 'ready_jewelry') {
    const mid: AdminOrderStatus[] = ['confirmed', 'processing', 'quality_check'];
    if (context.showEnergization) mid.push('energization');
    return ['pending_payment', 'placed', ...mid, ...tail];
  }

  return [...ADMIN_STATUS_PIPELINE];
}

export function getAdminStatusLabels(context: OrderFulfillmentContext): Record<string, string> {
  const profile = context.profile;
  const base: Record<string, string> = {
    pending_payment: 'Pending Payment',
    placed: 'Placed',
    confirmed: 'Confirmed',
    processing: 'Processing',
    design_assigned: 'Crafting Started',
    design_in_progress: 'Crafting In Progress',
    design_completed: 'Crafting Completed',
    jewelry_making: 'Final Assembly',
    certification: 'Certification',
    energization: 'Energization',
    quality_check: 'Quality Check',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    feedback: 'Feedback',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    payment_review: 'Payment Review',
  };

  if (profile === 'rudraksha_configured' || context.itemProfiles.includes('rudraksha_configured')) {
    base.design_assigned = 'Mounting Started';
    base.design_in_progress = 'Pendant In Progress';
    base.design_completed = 'Pendant Completed';
    base.jewelry_making = 'Chain & Finishing';
    base.processing = 'Beads Verified';
  } else if (profile === 'loose_gemstone') {
    base.processing = 'Gem Preparation';
    base.design_assigned = 'Preparation Started';
    base.design_in_progress = 'Preparation In Progress';
    base.design_completed = 'Gem Ready';
  } else if (profile === 'idol') {
    base.processing = 'Idol Preparation';
    base.quality_check = 'Packing & QC';
  } else if (profile === 'mala') {
    base.processing = 'Mala Preparation';
  } else if (profile === 'ready_jewelry') {
    base.processing = 'Jewelry Preparation';
  } else if (profile === 'configured_jewelry') {
    base.design_assigned = 'Design Assigned';
    base.design_in_progress = 'Jewelry In Progress';
    base.design_completed = 'Jewelry Completed';
  }

  return base;
}

export const STATUS_RANK: Record<string, number> = {
  pending_payment: 0,
  payment_review: 0,
  placed: 10,
  confirmed: 20,
  processing: 30,
  // Paid cert sits between prep and design (stone → lab → then craft).
  certification: 35,
  design_assigned: 40,
  design_in_progress: 50,
  design_completed: 60,
  jewelry_making: 70,
  energization: 90,
  quality_check: 100,
  shipped: 110,
  out_for_delivery: 115,
  delivered: 120,
  feedback: 130,
  cancelled: -1,
  refunded: -1,
};

export function statusAtLeast(status: string, threshold: string): boolean {
  const current = STATUS_RANK[status] ?? -999;
  const target = STATUS_RANK[threshold] ?? 999;
  return current >= target;
}
