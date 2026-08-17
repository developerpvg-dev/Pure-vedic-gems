/** Hosts where Cloudflare Turnstile is configured and enforced. */
export function isTurnstileProductionHost(host: string): boolean {
  const h = host.split(':')[0].toLowerCase();
  return (
    h === 'purevedicgems.com' ||
    h === 'www.purevedicgems.com' ||
    h === 'localhost' ||
    h === '127.0.0.1'
  );
}
