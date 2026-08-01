/** Display helpers for paid consultation plans (shared by UI + create-order). */

export function stripSkype(text: string): string {
  return text
    .replace(/\s*\/\s*Skype\b/gi, '')
    .replace(/\bSkype\s*\/\s*/gi, '')
    .replace(/\bSkype\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\(\s*\/\s*/g, '(')
    .replace(/\s*\/\s*\)/g, ')')
    .replace(/\(\s*\)/g, '')
    .trim();
}

export function consultationModeFromPlan(input: {
  title: string;
  metadata?: unknown;
}): string | null {
  const meta =
    input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
      ? (input.metadata as { mode_label?: string | null })
      : null;
  if (meta?.mode_label?.trim()) return stripSkype(meta.mode_label.trim());

  const title = input.title.toLowerCase();
  if (title.includes('face') || title.includes('personal')) return 'Personal / Face to Face';
  if (title.includes('skype') || title.includes('telephonic') || title.includes('chat')) {
    return 'Telephonic';
  }
  if (title.includes('softcopy') || title.includes('horoscope')) return 'Horoscope Softcopy';
  return null;
}
