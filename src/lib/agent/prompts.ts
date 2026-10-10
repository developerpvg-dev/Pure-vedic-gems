import type { AgentLocale } from '@/lib/agent/types';
import { RATNA_PROMPT } from '@/lib/agent/ratna-prompt';

export function getRatnaSystemPrompt(locale: AgentLocale) {
  const localeHint =
    locale === 'hi'
      ? 'The session locale is Hindi. Prefer Devanagari Hindi in replies unless the user switches to English.'
      : 'The session locale is English. Prefer English unless the user writes in Hindi.';

  return `${RATNA_PROMPT}\n\n## Session\n${localeHint}`;
}
