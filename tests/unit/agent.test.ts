import { describe, expect, it } from 'vitest';
import { buildLeadMessage, followUpDateFor } from '@/lib/agent/lead';
import { computeLeadScore } from '@/lib/agent/lead-scorer';
import { detectLanguage, resolveSessionLocale } from '@/lib/agent/language';
import { RATNA_FAQS } from '@/lib/agent/ratna-faqs';
import { buildGemRecommendation } from '@/lib/utils/rashi-calculator';

describe('agent language', () => {
  it('detects Hindi script', () => {
    expect(detectLanguage('मुझे रत्न चाहिए')).toBe('hi');
  });

  it('detects English', () => {
    expect(detectLanguage('I need a ruby')).toBe('en');
  });

  it('locks locale after 2 turns', () => {
    expect(resolveSessionLocale('en', 'hello', 3)).toBe('en');
    expect(resolveSessionLocale('en', 'नमस्ते', 3)).toBe('hi');
  });
});

describe('lead scorer', () => {
  it('scores hot leads', () => {
    const score = computeLeadScore({
      context: {
        phone: '9876543210',
        email: 'a@b.com',
        budgetMax: 100000,
        productViews: 3,
        handoffRequested: true,
      },
      messageCount: 8,
      channel: 'chat',
    });
    expect(score).toBeGreaterThanOrEqual(70);
  });
});

describe('Ratna lead for the sales team', () => {
  // 3 Oct 2026, 23:30 IST = 18:00 UTC: "today" must be the Indian date, not UTC's
  const lateEveningIst = new Date('2026-10-03T18:00:00Z');

  it('sets follow-up by score: hot today, warm tomorrow, cold in 3 days (IST)', () => {
    expect(followUpDateFor(80, lateEveningIst)).toBe('2026-10-03');
    expect(followUpDateFor(50, lateEveningIst)).toBe('2026-10-04');
    expect(followUpDateFor(10, lateEveningIst)).toBe('2026-10-06');
  });

  it('puts facts, the AI note and the conversation in the lead message', () => {
    const msg = buildLeadMessage(
      {
        lead_score: 78,
        channel: 'chat',
        locale: 'hi',
        context: { purpose: 'career', budgetMin: 40000, budgetMax: 60000, urgencySignals: ['Diwali'], birthDate: '1990-03-12' },
      },
      'Wants: Yellow Sapphire',
      [
        { role: 'user', content: 'मुझे पुखराज चाहिए' },
        { role: 'tool', content: '{"internal":true}' },
        { role: 'assistant', content: 'ज़रूर!' },
      ]
    );
    expect(msg).toContain('Score 78 (hot) · Website chat · Hindi');
    expect(msg).toContain('Budget: ₹40,000–₹60,000');
    expect(msg).toContain('Urgency: Diwali');
    expect(msg).toContain('Wants: Yellow Sapphire');
    expect(msg).toContain('Customer: मुझे पुखराज चाहिए\nRatna: ज़रूर!');
    expect(msg).not.toContain('internal');
  });

  it('still gives the team the conversation when the AI note fails', () => {
    const msg = buildLeadMessage({ lead_score: 20, channel: 'phone', locale: 'en', context: {} }, '', [
      { role: 'user', content: 'Call me back' },
    ]);
    expect(msg).toContain('AI summary unavailable');
    expect(msg).toContain('Customer: Call me back');
  });

  it('ships all 40 client FAQs in English and Hindi', () => {
    expect(RATNA_FAQS).toHaveLength(40);
    for (const f of RATNA_FAQS) {
      expect(f.en.length).toBeGreaterThan(50);
      expect(detectLanguage(f.hi)).toBe('hi');
    }
  });
});

describe('recommendGem tool input', () => {
  it('returns gems for DOB', () => {
    const rec = buildGemRecommendation({ birthDate: '1990-08-15' });
    expect(rec.primaryGemNames.length + rec.supportingGemNames.length).toBeGreaterThan(0);
    expect(rec.notes.length).toBeGreaterThan(0);
  });
});
