import { describe, expect, it } from 'vitest';
import { computeLeadScore } from '@/lib/agent/lead-scorer';
import { detectLanguage, resolveSessionLocale } from '@/lib/agent/language';
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

describe('recommendGem tool input', () => {
  it('returns gems for DOB', () => {
    const rec = buildGemRecommendation({ birthDate: '1990-08-15' });
    expect(rec.primaryGemNames.length + rec.supportingGemNames.length).toBeGreaterThan(0);
    expect(rec.notes.length).toBeGreaterThan(0);
  });
});
