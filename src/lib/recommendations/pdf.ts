/**
 * HTML → PDF via Chromium. Serverless uses @sparticuz/chromium; local uses system Chrome.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

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

async function launchServerless() {
  const chromium = (await import('@sparticuz/chromium')).default;
  const puppeteer = await import('puppeteer-core');

  // ponytail: graphics off = smaller /tmp extract, no WebGL needed for PDF
  chromium.setGraphicsMode = false;

  const binDir = join(process.cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin');
  const input = existsSync(join(binDir, 'chromium.br')) ? binDir : CHROMIUM_PACK_URL;

  return puppeteer.default.launch({
    args: await puppeteer.default.defaultArgs({ args: chromium.args, headless: 'shell' }),
    defaultViewport: { width: 900, height: 1200 },
    executablePath: await chromium.executablePath(input),
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

export async function htmlToPdf(html: string): Promise<Buffer> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const browser = await (isServerless ? launchServerless() : launchLocal());
  try {
    const page = await browser.newPage();
    // networkidle0 so Roboto can load; fall back if fonts stall
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45_000 }).catch(async () => {
      await page.setContent(html, { waitUntil: 'load', timeout: 30_000 });
    });
    await page.evaluate(() => document.fonts.ready).catch(() => undefined);
    return Buffer.from(await page.pdf(PDF_OPTS));
  } finally {
    await browser.close();
  }
}
