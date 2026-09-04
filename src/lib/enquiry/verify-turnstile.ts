export const TURNSTILE_ENQUIRY_ACTION = 'enquiry';
export const TURNSTILE_COMMENT_ACTION = 'blog_comment';

type SiteverifyResult = {
  success?: boolean;
  action?: string;
  hostname?: string;
};

function expectedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean)
  );
}

/** Canonical Cloudflare siteverify — returns true when Turnstile is not configured. */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string,
  expectedAction: string = TURNSTILE_ENQUIRY_ACTION
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;

  const hostnames = expectedHostnames();
  if (hostnames.size === 0) return false;

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      ...(remoteip ? { remoteip } : {}),
    });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) return false;

    const result = (await res.json()) as SiteverifyResult;
    return (
      result.success === true &&
      result.action === expectedAction &&
      typeof result.hostname === 'string' &&
      hostnames.has(result.hostname)
    );
  } catch {
    return false;
  }
}

export function turnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}
