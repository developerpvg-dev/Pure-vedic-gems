import { turnstileConfigured, verifyTurnstileToken } from './verify-turnstile';

type EnquirySpamInput = {
  name: string;
  email?: string;
  message: string;
  phone?: string;
  _hp?: string;
  _startedAt?: number;
  turnstileToken?: string;
};

/** Silent-reject signals — return true to discard without storing. */
export async function isEnquirySpam(
  input: EnquirySpamInput,
  remoteip?: string
): Promise<boolean> {
  if (input._hp?.trim()) return true;

  const startedAt = input._startedAt;
  if (typeof startedAt === 'number' && startedAt > 0) {
    const elapsed = Date.now() - startedAt;
    if (elapsed < 2_500) return true;
  }

  if (looksLikeGibberishName(input.name)) return true;
  if (looksLikeGibberishName(input.message)) return true;

  if (turnstileConfigured()) {
    const token = input.turnstileToken?.trim();
    if (!token) return true;
    if (!(await verifyTurnstileToken(token, remoteip))) return true;
  }

  return false;
}

/** Random bot names: long tokens, mixed case, few spaces. */
export function looksLikeGibberishName(value: string): boolean {
  const n = value.trim();
  if (n.length < 10 || /\s/.test(n)) return false;

  const letters = n.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 10) return false;

  const upper = (letters.match(/[A-Z]/g) ?? []).length;
  const lower = (letters.match(/[a-z]/g) ?? []).length;
  if (upper < 2 || lower < 2) return false;

  const vowels = (letters.match(/[aeiouAEIOU]/g) ?? []).length;
  const vowelRatio = vowels / letters.length;

  let caseTransitions = 0;
  for (let i = 1; i < letters.length; i++) {
    const prevLower = letters[i - 1] === letters[i - 1].toLowerCase();
    const currLower = letters[i] === letters[i].toLowerCase();
    if (prevLower !== currLower) caseTransitions++;
  }
  const transitionRatio = caseTransitions / letters.length;

  // ponytail: heuristic — tune if legit names get blocked
  return vowelRatio < 0.38 && transitionRatio > 0.18;
}
