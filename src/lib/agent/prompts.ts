import { readFileSync } from 'fs';
import { join } from 'path';
import type { AgentLocale } from '@/lib/agent/types';

let cachedPrompt: string | null = null;

export function getRatnaSystemPrompt(locale: AgentLocale) {
  if (!cachedPrompt) {
    try {
      cachedPrompt = readFileSync(join(process.cwd(), 'prompts', 'ratna-v1.md'), 'utf8');
    } catch {
      cachedPrompt = 'You are Ratna, the AI gem consultant for PureVedicGems. Reply in the customer language (English or Hindi). Use tools for recommendations and products.';
    }
  }

  const localeHint =
    locale === 'hi'
      ? 'The session locale is Hindi. Prefer Devanagari Hindi in replies unless the user switches to English.'
      : 'The session locale is English. Prefer English unless the user writes in Hindi.';

  return `${cachedPrompt}\n\n## Session\n${localeHint}`;
}
