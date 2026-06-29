import { isPaidPaymentStatus } from '@/lib/constants/order-status';
import { isDesignPhaseStatus } from '@/lib/orders/design-workflow';

export const CUSTOMER_JOURNEY_STEPS = [
  { key: 'payment', label: 'Payment', shortLabel: 'Pay' },
  { key: 'confirmed', label: 'Confirmed', shortLabel: 'OK' },
  { key: 'processing', label: 'Processing', shortLabel: 'Prep' },
  { key: 'jewelry_design', label: 'Jewelry Design', shortLabel: 'Design' },
  { key: 'product_video', label: 'Product Video', shortLabel: 'Product' },
  { key: 'puja_video', label: 'Puja Video', shortLabel: 'Puja' },
  { key: 'shipped', label: 'Shipped', shortLabel: 'Ship' },
  { key: 'delivered', label: 'Delivered', shortLabel: 'Done' },
] as const;

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
};

export type JourneyMilestone = {
  key: (typeof CUSTOMER_JOURNEY_STEPS)[number]['key'];
  label: string;
  shortLabel: string;
  done: boolean;
  current: boolean;
  videoUrl?: string | null;
  detail?: string | null;
};

function designPhaseComplete(order: CustomerJourneyInput) {
  return (
    !!order.design_completed_at ||
    order.status === 'design_completed' ||
    !!order.product_video_url ||
    !!order.puja_video_url ||
    !!order.tracking_number ||
    order.status === 'shipped' ||
    order.status === 'delivered'
  );
}

export function getCustomerJourney(order: CustomerJourneyInput) {
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return null;
  }

  const paid =
    isPaidPaymentStatus(order.payment_status) ||
    !['pending_payment', 'payment_review'].includes(order.status);
  const confirmed =
    paid && !['pending_payment', 'payment_review'].includes(order.status);
  const processingDone =
    !!order.assigned_designer_id ||
    isDesignPhaseStatus(order.status) ||
    designPhaseComplete(order);
  const jewelryDesignDone = designPhaseComplete(order);
  const productVideoDone =
    !!order.puja_video_url ||
    !!order.tracking_number ||
    order.status === 'shipped' ||
    order.status === 'delivered';
  const pujaVideoDone =
    !!order.tracking_number ||
    order.status === 'shipped' ||
    order.status === 'delivered';
  const shippedDone = order.status === 'delivered';
  const deliveredDone = order.status === 'delivered';

  const doneFlags = [
    paid,
    confirmed,
    processingDone,
    jewelryDesignDone,
    productVideoDone,
    pujaVideoDone,
    shippedDone,
    deliveredDone,
  ];

  const firstOpen = doneFlags.findIndex((done) => !done);
  const activeIndex = firstOpen === -1 ? CUSTOMER_JOURNEY_STEPS.length - 1 : firstOpen;

  let designDetail: string | null = null;
  if (order.status === 'design_assigned') designDetail = 'With our jewelry designer';
  if (order.status === 'design_in_progress') designDetail = 'Design in progress';
  if (order.status === 'design_completed' || order.design_completed_at) {
    designDetail = 'Design approved';
  }

  const milestones: JourneyMilestone[] = CUSTOMER_JOURNEY_STEPS.map((step, index) => ({
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
    detail: step.key === 'jewelry_design' ? designDetail : null,
  }));

  return {
    milestones,
    activeIndex,
    hasTracking: !!(order.tracking_number || order.tracking_url),
  };
}
