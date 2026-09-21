/**
 * HTML → PDF via Chromium.
 * - Local: system Chrome
 * - Vercel/Lambda: @sparticuz/chromium
 * - Cloudflare Workers: Browser Rendering (@cloudflare/puppeteer + BROWSER binding)
 *
 * ponytail: one shared browser per warm isolate + serialized jobs.
 * Ceiling: serverless cold-starts still hurt; Browser Rendering is the CF path.
 */
const PDF_OPTS = {
  format: 'A4' as const,
  printBackground: true,
  preferCSSPageSize: false,
  displayHeaderFooter: true,
  headerTemplate: `<div style="width:100%;padding:0 14mm;font-size:8px;font-family:Roboto,Helvetica,Arial,sans-serif;color:#7A6250;display:flex;justify-content:space-between;letter-spacing:0.14em;text-transform:uppercase;">
    <span style="color:#8A6400;font-weight:500;">Pure Vedic Gems</span>
    <span>Confidential</span>
  </div>`,
  footerTemplate: `<div style="width:100%;padding:0 14mm;font-size:8px;font-family:Roboto,Helvetica,Arial,sans-serif;color:#7A6250;display:flex;justify-content:space-between;align-items:center;">
    <span style="letter-spacing:0.1em;">Private gem recommendation</span>
    <span style="letter-spacing:0.14em;font-weight:500;"><span class="pageNumber"></span> · <span class="totalPages"></span></span>
  </div>`,
  margin: { top: '18mm', bottom: '18mm', left: '12mm', right: '12mm' },
};

/** Matches installed @sparticuz/chromium major; override with CHROMIUM_REMOTE_EXEC_PATH if needed. */
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_REMOTE_EXEC_PATH ||
  'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar';

type PuppeteerBrowser = Awaited<ReturnType<typeof launchLocal>>;

let sharedBrowser: PuppeteerBrowser | null = null;
let launching: Promise<PuppeteerBrowser> | null = null;
/** Serialize PDF jobs — one page at a time on the shared browser. */
let pdfQueue: Promise<unknown> = Promise.resolve();

function isCloudflareWorkers(): boolean {
  return Boolean(
    process.env.CF_PAGES ||
      process.env.CF_WORKER ||
      process.env.CLOUDFLARE === '1' ||
      process.env.WORKERS_CI,
  );
}

async function launchCloudflare(): Promise<PuppeteerBrowser> {
  const { getCloudflareContext } = await import('@opennextjs/cloudflare');
  const puppeteer = await import('@cloudflare/puppeteer');
  const { env } = await getCloudflareContext({ async: true });
  const browserBinding = (env as { BROWSER?: unknown }).BROWSER;
  if (!browserBinding) {
    throw new Error('BROWSER binding missing — enable Browser Rendering in wrangler.jsonc');
  }
  // @cloudflare/puppeteer.launch expects Fetcher binding
  return puppeteer.default.launch(browserBinding as never) as unknown as Promise<PuppeteerBrowser>;
}

async function launchServerless() {
  const chromium = (await import('@sparticuz/chromium')).default;
  const puppeteer = await import('puppeteer-core');

  // ponytail: graphics off = smaller /tmp extract, no WebGL needed for PDF
  chromium.setGraphicsMode = false;

  // Always remote on serverless — bundling bin/ exceeds Vercel’s 250MB function limit.
  return puppeteer.default.launch({
    args: await puppeteer.default.defaultArgs({ args: chromium.args, headless: 'shell' }),
    defaultViewport: { width: 900, height: 1200 },
    executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
    headless: 'shell',
  });
}

async function launchLocal() {
  const puppeteer = await import('puppeteer-core');
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    (process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome');

  return puppeteer.default.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

async function getBrowser(): Promise<PuppeteerBrowser> {
  if (sharedBrowser?.connected) return sharedBrowser;
  if (!launching) {
    const launcher = isCloudflareWorkers()
      ? launchCloudflare
      : process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
        ? launchServerless
        : launchLocal;
    launching = launcher()
      .then((browser) => {
        sharedBrowser = browser;
        browser.on('disconnected', () => {
          if (sharedBrowser === browser) sharedBrowser = null;
        });
        return browser;
      })
      .finally(() => {
        launching = null;
      });
  }
  return launching;
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const job = pdfQueue.then(async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
      // ponytail: embedLocalAssets HTML is self-contained — skip networkidle0 (was burning CPU waiting)
      await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
      await page.evaluate(() => document.fonts.ready).catch(() => undefined);
      return Buffer.from(await page.pdf(PDF_OPTS));
    } finally {
      await page.close().catch(() => undefined);
    }
  });
  pdfQueue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

/** Prefer an already-stored PDF over launching Chromium again. */
export function shouldReuseStoredPdf(pdfPath: string | null | undefined): pdfPath is string {
  return typeof pdfPath === 'string' && pdfPath.length > 0 && !pdfPath.includes('..');
}
