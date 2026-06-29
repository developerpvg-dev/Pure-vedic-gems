export const DESIGN_ORDER_STATUSES = [
  'design_assigned',
  'design_in_progress',
  'design_completed',
] as const;

export type DesignOrderStatus = (typeof DESIGN_ORDER_STATUSES)[number];

export const DESIGNER_STATUS_OPTIONS: Array<{ value: DesignOrderStatus; label: string }> = [
  { value: 'design_assigned', label: 'Assigned — not started' },
  { value: 'design_in_progress', label: 'Design in progress' },
  { value: 'design_completed', label: 'Design completed' },
];

export function isDesignPhaseStatus(status: string) {
  return (DESIGN_ORDER_STATUSES as readonly string[]).includes(status);
}
