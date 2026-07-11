import { tool } from 'ai';
import { z } from 'zod';
import {
  agentCreateEnquiry,
  agentGetProduct,
  agentRecommendGem,
  agentRecordConsent,
  agentRecordUrgency,
  agentSearchKnowledge,
  agentSearchProducts,
  agentTrackProductView,
} from '@/lib/agent/tools-runtime';

export function buildAgentTools(sessionId: string) {
  return {
    recommendGem: tool({
      description: 'Get Vedic gemstone recommendation from birth date, rashi, purpose, and budget. Always use this instead of guessing.',
      inputSchema: z.object({
        birthDate: z.string().optional().describe('ISO date YYYY-MM-DD'),
        rashi: z.string().optional(),
        purpose: z.string().optional(),
        budgetMin: z.number().optional(),
        budgetMax: z.number().optional(),
      }),
      execute: async (input) => agentRecommendGem(sessionId, input),
    }),

    searchProducts: tool({
      description: 'Search live product catalog. Returns up to 5 products with links.',
      inputSchema: z.object({
        query: z.string().min(1),
        planet: z.string().optional(),
      }),
      execute: async ({ query, planet }) => {
        const products = await agentSearchProducts(query, planet, 5);
        await Promise.all(products.map((p) => agentTrackProductView(sessionId, p.id)));
        return { products };
      },
    }),

    getProduct: tool({
      description: 'Get a single product by UUID or slug',
      inputSchema: z.object({
        idOrSlug: z.string().min(1),
      }),
      execute: async ({ idOrSlug }) => {
        const product = await agentGetProduct(idOrSlug);
        if (product) await agentTrackProductView(sessionId, product.id);
        return { product };
      },
    }),

    searchKnowledge: tool({
      description: 'Search gem FAQs and knowledge base',
      inputSchema: z.object({
        query: z.string().min(1),
        language: z.enum(['en', 'hi']).optional(),
      }),
      execute: async ({ query, language }) => agentSearchKnowledge(query, language),
    }),

    recordConsent: tool({
      description: 'Record customer consent for storing personal data (phone, DOB)',
      inputSchema: z.object({}),
      execute: async () => agentRecordConsent(sessionId),
    }),

    createEnquiry: tool({
      description: 'Create sales enquiry when customer wants human follow-up',
      inputSchema: z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        message: z.string().min(1),
        productId: z.string().uuid().optional(),
      }),
      execute: async (input) => agentCreateEnquiry(sessionId, input),
    }),

    recordUrgency: tool({
      description: 'Record urgency signal e.g. wedding, health, gift deadline',
      inputSchema: z.object({
        signal: z.string().min(1),
      }),
      execute: async ({ signal }) => agentRecordUrgency(sessionId, signal),
    }),

    requestHandoff: tool({
      description: 'Request transfer to human sales expert for hot leads',
      inputSchema: z.object({
        reason: z.string().optional(),
      }),
      execute: async ({ reason }) => {
        const { mergeSessionContext } = await import('@/lib/agent/session');
        await mergeSessionContext(sessionId, { handoffRequested: true });
        const { triggerHotLeadHandoff } = await import('@/lib/agent/handoff');
        return triggerHotLeadHandoff(sessionId, reason);
      },
    }),
  };
}
