/**
 * HTML → PDF via Chromium. Serverless uses @sparticuz/chromium; local uses system Chrome.
 */

export async function htmlToPdf(html: string): Promise<Buffer> {
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const pdfOpts = {
    format: 'A4' as const,
    printBackground: true,
    margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
  };

  if (isServerless) {
    const chromium = await import('@sparticuz/chromium');
    const puppeteer = await import('puppeteer-core');
    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 900, height: 1200 },
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      return Buffer.from(await page.pdf(pdfOpts));
    } finally {
      await browser.close();
    }
  }

  const puppeteer = await import('puppeteer-core');
  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    (process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : '/usr/bin/google-chrome');

  const browser = await puppeteer.default.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return Buffer.from(await page.pdf(pdfOpts));
  } finally {
    await browser.close();
  }
}
