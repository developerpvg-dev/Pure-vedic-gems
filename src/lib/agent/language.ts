import type { AgentLocale } from '@/lib/agent/types';

const HINDI_CHARS = /[\u0900-\u097F]/;
const HINGLISH_MARKERS = /\b(kya|kaise|mujhe|mera|meri|chahiye|kharidna|rashi|kundli|nahi|haan|kitna)\b/i;

export function detectLanguage(text: string): AgentLocale {
  const trimmed = text.trim();
  if (!trimmed) return 'en';
  if (HINDI_CHARS.test(trimmed)) return 'hi';
  if (HINGLISH_MARKERS.test(trimmed)) return 'hi';
  return 'en';
}

export function resolveSessionLocale(
  current: AgentLocale,
  userText: string,
  userMessageCount: number
): AgentLocale {
  const detected = detectLanguage(userText);
  // Lock locale after 2 user turns unless they clearly switch scripts.
  if (userMessageCount >= 2 && current !== detected) {
    const strongSwitch =
      (current === 'en' && HINDI_CHARS.test(userText)) ||
      (current === 'hi' && !HINDI_CHARS.test(userText) && !HINGLISH_MARKERS.test(userText));
    return strongSwitch ? detected : current;
  }
  return detected;
}
