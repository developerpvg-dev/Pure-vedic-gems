/**
 * HTML → PDF via Chromium. Serverless uses @sparticuz/chromium; local uses system Chrome.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const PDF_OPTS = {
  format: 'A4' as const,
  printBackground: true,
  margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
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
    await page.setContent(html, { waitUntil: 'load' });
    return Buffer.from(await page.pdf(PDF_OPTS));
  } finally {
    await browser.close();
  }
}
