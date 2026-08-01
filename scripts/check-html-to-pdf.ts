import { buildGempunditClassicBlocks, emptyCustomer } from '../src/lib/recommendations/blocks';
import { renderReportHtml } from '../src/lib/recommendations/render-html';
import { htmlToPdf } from '../src/lib/recommendations/pdf';

async function main() {
  const html = renderReportHtml({
    title: 'Check',
    customer: { ...emptyCustomer(), name: 'Test', email: 't@example.com' },
    blocks: buildGempunditClassicBlocks(),
    siteUrl: 'https://example.com',
    embedLocalAssets: true,
  });

  if (!html.includes('data:image/png;base64,')) {
    throw new Error('expected embedded logo data URIs');
  }
  if (html.includes('PVG%20NEW') || html.includes('/PVG NEW')) {
    throw new Error('logo still using remote/relative path');
  }

  const buf = await htmlToPdf(html);
  const magic = buf.subarray(0, 5).toString('utf8');
  console.log('ok', buf.length, magic, 'logos-embedded');
  if (magic !== '%PDF-') throw new Error('not a pdf: ' + magic);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
