import type { AgentSessionContext } from '@/lib/agent/types';

export type LeadScoreInput = {
  context: AgentSessionContext;
  messageCount: number;
  channel: string;
};

const WEIGHTS = {
  hasPhone: 20,
  hasEmail: 15,
  hasBudget: 15,
  budgetHigh: 10,
  productViews: 15,
  urgency: 15,
  handoffRequested: 20,
  consent: 5,
  deepConversation: 10,
};

export function computeLeadScore(input: LeadScoreInput): number {
  const { context, messageCount } = input;
  let score = 0;

  if (context.phone) score += WEIGHTS.hasPhone;
  if (context.email) score += WEIGHTS.hasEmail;
  if (context.budgetMin != null || context.budgetMax != null) score += WEIGHTS.hasBudget;
  if ((context.budgetMax ?? context.budgetMin ?? 0) >= 50000) score += WEIGHTS.budgetHigh;
  if ((context.productViews ?? 0) >= 2) score += WEIGHTS.productViews;
  if ((context.urgencySignals?.length ?? 0) > 0) score += WEIGHTS.urgency;
  if (context.handoffRequested) score += WEIGHTS.handoffRequested;
  if (messageCount >= 6) score += WEIGHTS.deepConversation;

  return Math.min(100, score);
}

export function leadScoreLabel(score: number) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}
