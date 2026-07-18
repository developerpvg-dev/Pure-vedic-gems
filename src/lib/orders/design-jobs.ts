/**
 * Design slip field helpers + overdue check.
 * // ponytail: runnable — npx tsx -e "import { __designJobsSelfCheck } from './src/lib/orders/design-jobs.ts'; __designJobsSelfCheck()"
 */

export function isDesignJobOverdue(input: {
  status: string;
  design_due_at: string | null;
  design_completed_at: string | null;
  now?: number;
}) {
  if (input.design_completed_at || input.status === 'design_completed') return false;
  if (!input.design_due_at) return false;
  const due = new Date(input.design_due_at).getTime();
  if (Number.isNaN(due)) return false;
  return due < (input.now ?? Date.now());
}

export function __designJobsSelfCheck() {
  const now = Date.parse('2026-07-17T12:00:00.000Z');
  console.assert(
    isDesignJobOverdue({
      status: 'design_assigned',
      design_due_at: '2026-07-10T18:00:00.000Z',
      design_completed_at: null,
      now,
    }) === true,
    'past due is overdue',
  );
  console.assert(
    isDesignJobOverdue({
      status: 'design_completed',
      design_due_at: '2026-07-10T18:00:00.000Z',
      design_completed_at: '2026-07-11T10:00:00.000Z',
      now,
    }) === false,
    'completed not overdue',
  );
  console.assert(
    isDesignJobOverdue({
      status: 'design_in_progress',
      design_due_at: '2026-07-20T18:00:00.000Z',
      design_completed_at: null,
      now,
    }) === false,
    'future due not overdue',
  );
  console.log('design-jobs self-check ok');
}
