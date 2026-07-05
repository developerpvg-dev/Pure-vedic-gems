import { isPaidPaymentStatus } from '@/lib/constants/order-status';
import { isDesignPhaseStatus } from '@/lib/orders/design-workflow';
import {
  getJourneyStepsForContext,
  resolveOrderFulfillmentContext,
  statusAtLeast,
  type JourneyStepKey,
  type LineItemForFulfillment,
  type OrderFulfillmentContext,
} from '@/lib/orders/fulfillment-profile';

export type CustomerJourneyInput = {
  status: string;
  payment_status?: string | null;
  assigned_designer_id?: string | null;
  design_completed_at?: string | null;
  product_video_url?: string | null;
  puja_video_url?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  carrier?: string | null;
  estimated_delivery?: string | null;
  items?: LineItemForFulfillment[];
  include_energization?: boolean;
  energization_charges?: number;
  certification_charges?: number;
  record_ceremony?: boolean;
};

export type JourneyMilestone = {
  key: JourneyStepKey;
  label: string;
  shortLabel: string;
  done: boolean;
  current: boolean;
  videoUrl?: string | null;
  detail?: string | null;
};

function craftingComplete(order: CustomerJourneyInput) {
  return (
    !!order.design_completed_at ||
    order.status === 'design_completed' ||
    !!order.product_video_url ||
    !!order.puja_video_url ||
    !!order.tracking_number ||
    statusAtLeast(order.status, 'shipped')
  );
}

function isStepDone(
  key: JourneyStepKey,
  order: CustomerJourneyInput,
  context: OrderFulfillmentContext
): boolean {
  const paid =
    isPaidPaymentStatus(order.payment_status) ||
    !['pending_payment', 'payment_review'].includes(order.status);
  const confirmed =
    paid && !['pending_payment', 'payment_review'].includes(order.status);

  switch (key) {
    case 'payment':
      return paid;
    case 'confirmed':
      return confirmed;
    case 'processing':
      if (context.needsCrafting) {
        return (
          !!order.assigned_designer_id ||
          isDesignPhaseStatus(order.status) ||
          craftingComplete(order)
        );
      }
      return statusAtLeast(order.status, 'processing');
    case 'crafting':
      return craftingComplete(order);
    case 'preparation':
      return statusAtLeast(order.status, 'quality_check') || !!order.tracking_number;
    case 'certification':
      return statusAtLeast(order.status, 'energization') || statusAtLeast(order.status, 'quality_check') || !!order.tracking_number;
    case 'energization':
      return (
        !!order.puja_video_url ||
        statusAtLeast(order.status, 'quality_check') ||
        !!order.tracking_number
      );
    case 'product_video':
      return (
        !!order.puja_video_url ||
        !!order.tracking_number ||
        statusAtLeast(order.status, 'shipped')
      );
    case 'puja_video':
      return !!order.tracking_number || statusAtLeast(order.status, 'shipped');
    case 'shipped':
      return order.status === 'delivered';
    case 'delivered':
      return order.status === 'delivered';
    default:
      return false;
  }
}

function stepDetail(
  key: JourneyStepKey,
  order: CustomerJourneyInput
): string | null {
  if (key === 'crafting') {
    if (order.status === 'design_assigned') return 'Being crafted';
    if (order.status === 'design_in_progress') return 'In progress';
  }
  if (key === 'preparation' && order.status === 'processing') return 'In progress';
  return null;
}

export function getCustomerJourney(order: CustomerJourneyInput) {
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return null;
  }

  const context = resolveOrderFulfillmentContext({
    items: order.items ?? [],
    includeEnergization: order.include_energization,
    energizationCharges: order.energization_charges,
    certificationCharges: order.certification_charges,
  });

  const stepTemplates = getJourneyStepsForContext(context);
  const doneFlags = stepTemplates.map((step) => isStepDone(step.key, order, context));
  const firstOpen = doneFlags.findIndex((done) => !done);
  const activeIndex = firstOpen === -1 ? stepTemplates.length - 1 : firstOpen;

  const milestones: JourneyMilestone[] = stepTemplates.map((step, index) => ({
    key: step.key,
    label: step.label,
    shortLabel: step.shortLabel,
    done: doneFlags[index],
    current: index === activeIndex,
    videoUrl:
      step.key === 'product_video'
        ? order.product_video_url
        : step.key === 'puja_video'
          ? order.puja_video_url
          : null,
    detail: stepDetail(step.key, order),
  }));

  return {
    milestones,
    activeIndex,
    hasTracking: !!(order.tracking_number || order.tracking_url),
    fulfillmentContext: context,
  };
}

/** @deprecated Use profile-specific steps via getCustomerJourney */
export const CUSTOMER_JOURNEY_STEPS = [
  { key: 'payment', label: 'Payment', shortLabel: 'Pay' },
  { key: 'confirmed', label: 'Confirmed', shortLabel: 'OK' },
  { key: 'processing', label: 'Processing', shortLabel: 'Prep' },
  { key: 'crafting', label: 'Product Completed', shortLabel: 'Product' },
  { key: 'product_video', label: 'Product Video', shortLabel: 'Video' },
  { key: 'puja_video', label: 'Puja Video', shortLabel: 'Puja' },
  { key: 'shipped', label: 'Shipped', shortLabel: 'Ship' },
  { key: 'delivered', label: 'Delivered', shortLabel: 'Done' },
] as const;
