import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import {
  STONE_ROLE_LABELS,
  type ReportBlock,
  type ReportCustomer,
  type StoneCard,
} from '@/lib/recommendations/blocks';
import {
  DEFAULT_REPORT_LOGO,
  DEFAULT_REPORT_WORDMARK,
  benefitSvgMarkup,
  resolveAssetUrl,
} from '@/lib/recommendations/benefit-icons';

function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fillPlaceholders(text: string, customer: ReportCustomer): string {
  return text.replace(/\{name\}/gi, customer.name || 'Customer');
}

function productImg(url: string | null | undefined, alt: string): string {
  if (!url) {
    return `<div class="pv-placeholder">${esc(alt || 'Product')}</div>`;
  }
  return `<img class="pv-img" src="${esc(url)}" alt="${esc(alt)}" />`;
}

function benefitsRow(benefits: string[]): string {
  if (!benefits.length) return '';
  return `<div class="pv-benefits"><span class="pv-benefits-label">Suggested For:</span><div class="pv-benefit-icons">${benefits
    .map(
      (b) =>
        `<div class="pv-benefit"><span class="pv-benefit-circle">${benefitSvgMarkup(b, 20)}</span><span>${esc(b)}</span></div>`
    )
    .join('')}</div></div>`;
}

/** Read /public file → data URI so Puppeteer PDF needs no network for logos. */
function publicAssetDataUri(publicPath: string): string | null {
  if (!publicPath || /^https?:\/\//i.test(publicPath) || publicPath.startsWith('data:')) return null;
  try {
    const file = join(process.cwd(), 'public', publicPath.replace(/^\//, ''));
    if (!existsSync(file)) return null;
    const ext = extname(file).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.jpg' || ext === '.jpeg'
            ? 'image/jpeg'
            : 'application/octet-stream';
    return `data:${mime};base64,${readFileSync(file).toString('base64')}`;
  } catch {
    return null;
  }
}

function logoSrc(path: string, siteUrl: string, embedLocalAssets: boolean): string {
  if (embedLocalAssets) {
    // ponytail: email PNGs are ~10× smaller than site webp; same brand, fine for A4 PDF
    const embedPath =
      path === DEFAULT_REPORT_LOGO
        ? '/email/pvg-emblem.png'
        : path === DEFAULT_REPORT_WORDMARK
          ? '/email/pvg-wordmark.png'
          : path;
    const data = publicAssetDataUri(embedPath) || publicAssetDataUri(path);
    if (data) return data;
  }
  return resolveAssetUrl(path, siteUrl) || path;
}

function headerLogoHtml(logoUrl: string | null, siteUrl: string, embedLocalAssets: boolean): string {
  const emblemPath = logoUrl || DEFAULT_REPORT_LOGO;
  const emblem = logoSrc(emblemPath, siteUrl, embedLocalAssets);
  const showWordmark = !logoUrl || logoUrl === DEFAULT_REPORT_LOGO;
  const wordmark = logoSrc(DEFAULT_REPORT_WORDMARK, siteUrl, embedLocalAssets);
  return `<div class="pv-logo-row">
    <img class="pv-logo" src="${esc(emblem)}" alt="Pure Vedic Gems" />
    ${showWordmark ? `<img class="pv-wordmark" src="${esc(wordmark)}" alt="Pure Vedic Gems" />` : ''}
  </div>`;
}

function stoneCardHtml(stone: StoneCard, compact = false): string {
  const role = STONE_ROLE_LABELS[stone.role] ?? stone.role;
  const buy = stone.product.buyUrl
    ? `<a class="pv-btn" href="${esc(stone.product.buyUrl)}">BUY NOW</a>`
    : `<span class="pv-btn pv-btn-disabled">BUY NOW</span>`;
  return `<div class="pv-stone ${compact ? 'pv-stone-compact' : ''}">
    <h3 class="pv-stone-title">${esc(role)}: ${esc(stone.gemLabel)}</h3>
    ${stone.weight ? `<p class="pv-weight">WEIGHT: ${esc(stone.weight)}</p>` : ''}
    ${productImg(stone.product.imageUrl, stone.product.name || stone.gemLabel)}
    ${stone.product.name ? `<p class="pv-product-name">${esc(stone.product.name)}</p>` : ''}
    ${buy}
    ${benefitsRow(stone.benefits)}
  </div>`;
}

export function renderReportHtml(opts: {
  title: string;
  customer: ReportCustomer;
  blocks: ReportBlock[];
  chartImageUrl?: string | null;
  siteUrl?: string;
  /** Inline /public logos as data URIs (needed for Puppeteer PDF). */
  embedLocalAssets?: boolean;
}): string {
  const { title, customer, blocks, chartImageUrl, siteUrl = '', embedLocalAssets = false } = opts;
  const parts: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = blocks[i + 1];

    if (block.type === 'natalChart' && next?.type === 'primaryStone') {
      const img = block.imageUrl || chartImageUrl;
      parts.push(`<section class="pv-chart-primary">
        <div class="pv-chart-copy">
          <h2>NATAL BIRTH CHART</h2>
          <p>${esc(block.description)}</p>
          ${img ? `<img class="pv-chart-img" src="${esc(img)}" alt="Natal birth chart" />` : '<div class="pv-placeholder pv-chart-ph">Upload kundli image</div>'}
        </div>
        ${stoneCardHtml(next.stone, false)}
      </section>`);
      i++;
      continue;
    }

    switch (block.type) {
      case 'header': {
        const nav = block.navLinks.length
          ? `<nav class="pv-nav">${block.navLinks.map((l) => `<span>${esc(l)}</span>`).join('<span class="pv-nav-sep">|</span>')}</nav>`
          : '';
        parts.push(`<header class="pv-header">${headerLogoHtml(block.logoUrl, siteUrl, embedLocalAssets)}${nav}</header>`);
        break;
      }
      case 'greeting': {
        const name = customer.name || 'there';
        parts.push(`<section class="pv-greeting">
          <h1>Hi ${esc(name)}!</h1>
          <p class="pv-headline">${esc(fillPlaceholders(block.headline, customer))}</p>
          <p class="pv-sub">${esc(fillPlaceholders(block.subheadline, customer))}</p>
        </section>`);
        break;
      }
      case 'customerDetails': {
        parts.push(`<section class="pv-details">
          <div class="pv-detail"><span>Place of birth</span><strong>${esc(customer.birthPlace || '—')}</strong></div>
          <div class="pv-detail"><span>Purpose</span><strong>${esc(customer.purpose || '—')}</strong></div>
          <div class="pv-detail"><span>Date of birth</span><strong>${esc(customer.dob || '—')}</strong></div>
          <div class="pv-detail"><span>Email</span><strong>${esc(customer.email || '—')}</strong></div>
          <div class="pv-detail"><span>Weight</span><strong>${esc(customer.weightNote || '—')}</strong></div>
          <div class="pv-detail"><span>Phone</span><strong>${esc(customer.phone || '—')}</strong></div>
        </section>`);
        break;
      }
      case 'natalChart': {
        const img = block.imageUrl || chartImageUrl;
        parts.push(`<section class="pv-chart-row">
          <div class="pv-chart-copy">
            <h2>NATAL BIRTH CHART</h2>
            <p>${esc(block.description)}</p>
            ${img ? `<img class="pv-chart-img" src="${esc(img)}" alt="Natal birth chart" />` : '<div class="pv-placeholder pv-chart-ph">Upload kundli image</div>'}
          </div>
        </section>`);
        break;
      }
      case 'primaryStone': {
        parts.push(`<section class="pv-primary">${stoneCardHtml(block.stone, false)}</section>`);
        break;
      }
      case 'additionalStones': {
        parts.push(`<section class="pv-additional">
          <h2>Additionally Helpful Gemstones</h2>
          <div class="pv-additional-grid">${block.stones.map((s) => stoneCardHtml(s, true)).join('')}</div>
        </section>`);
        break;
      }
      case 'tieredProducts': {
        const tiers = block.tiers
          .map(
            (t) => `<div class="pv-tier">
              <h4>${esc(t.label)}</h4>
              ${productImg(t.product.imageUrl, t.product.name)}
              <p class="pv-link">${esc(t.product.name || 'Select product')}</p>
              ${t.product.origin ? `<p class="pv-meta">Origin: ${esc(t.product.origin)}</p>` : ''}
              ${t.product.priceLabel ? `<p class="pv-price">${esc(t.product.priceLabel)}</p>` : ''}
              ${t.product.buyUrl ? `<a class="pv-btn-sm" href="${esc(t.product.buyUrl)}">Buy Now</a>` : ''}
            </div>`
          )
          .join('');
        parts.push(`<section class="pv-tiered">
          <h2>${esc(block.category)}:</h2>
          <p class="pv-link">${esc(block.weight)} + ${esc(block.gemLabel)}</p>
          <p class="pv-endorse">${esc(block.endorsement)}</p>
          <p><strong>Suggested For:</strong></p>
          <ul>${block.suggestedFor.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          ${tiers}
        </section>`);
        break;
      }
      case 'stoneGrid': {
        const cards = block.stones
          .map((s) => {
            const role = STONE_ROLE_LABELS[s.role] ?? s.role;
            return `<div class="pv-grid-card">
              <h3>${esc(role)} :</h3>
              <p class="pv-gem">${esc(s.gemLabel)}</p>
              ${productImg(s.product.imageUrl, s.gemLabel)}
              <div class="pv-attrs">
                <div>Weight in Carat : ${esc(s.weight)}</div>
                ${s.wearDay ? `<div>Wear Day: ${esc(s.wearDay)}</div>` : ''}
                ${s.wearFinger ? `<div>Wear Finger: ${esc(s.wearFinger)}</div>` : ''}
                ${s.metal ? `<div>Metal: ${esc(s.metal)}</div>` : ''}
                ${s.wearDeity ? `<div>Wear Deity: ${esc(s.wearDeity)}</div>` : ''}
              </div>
              ${s.product.buyUrl ? `<a class="pv-btn-sm" href="${esc(s.product.buyUrl)}">BUY NOW</a>` : ''}
            </div>`;
          })
          .join('');
        parts.push(`<section class="pv-stone-grid"><h2>Your Gems Recommendation</h2><div class="pv-grid-3">${cards}</div></section>`);
        break;
      }
      case 'consultationCta': {
        const href = block.href.startsWith('http') ? block.href : `${siteUrl}${block.href}`;
        parts.push(`<section class="pv-cta">
          <div class="pv-cta-inner">
            <div>
              <p class="pv-cta-title">${esc(block.title)}</p>
              <p class="pv-cta-price">${esc(block.priceLabel)}</p>
            </div>
            <a class="pv-btn pv-btn-light" href="${esc(href)}">${esc(block.buttonLabel)}</a>
          </div>
        </section>`);
        break;
      }
      case 'whyUs': {
        parts.push(`<section class="pv-why">
          <h2>${esc(block.title)}</h2>
          <div class="pv-why-grid">${block.items
            .map((i) => `<div class="pv-why-item"><strong>${esc(i.text)}</strong></div>`)
            .join('')}</div>
        </section>`);
        break;
      }
      case 'footer': {
        parts.push(`<footer class="pv-footer">
          <p><strong>Contact</strong> ${esc(block.contact)}</p>
          <p><strong>Address</strong> ${esc(block.address)}</p>
          <p class="pv-note">${esc(block.note)}</p>
        </footer>`);
        break;
      }
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<article class="pv-report">
${parts.join('\n')}
</article>
</body>
</html>`;
}

export const REPORT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; background: #fff; }
  .pv-report { max-width: 860px; margin: 0 auto; padding: 24px 20px 48px; }
  .pv-header { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding-bottom: 12px; border-bottom: 1px solid #e5e5e5; margin-bottom: 16px; }
  .pv-logo-row { display: flex; align-items: center; gap: 12px; }
  .pv-logo { height: 48px; width: 48px; object-fit: contain; }
  .pv-wordmark { height: 32px; width: auto; object-fit: contain; }
  .pv-logo-text { font-size: 22px; font-weight: 700; letter-spacing: 0.02em; color: #b45309; }
  .pv-nav { font-family: Arial, Helvetica, sans-serif; font-size: 11px; letter-spacing: 0.06em; color: #444; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .pv-nav-sep { color: #bbb; }
  .pv-greeting { background: #e8f4fc; padding: 20px 22px; margin-bottom: 16px; }
  .pv-greeting h1 { margin: 0 0 8px; font-size: 28px; }
  .pv-headline { margin: 0 0 6px; font-size: 18px; font-weight: 700; }
  .pv-sub { margin: 0; font-size: 14px; color: #444; }
  .pv-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; padding: 14px 4px 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; }
  .pv-detail span { display: block; color: #777; font-size: 11px; margin-bottom: 2px; }
  .pv-detail strong { font-weight: 600; }
  .pv-chart-row { margin-bottom: 24px; }
  .pv-chart-primary { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; align-items: start; }
  .pv-chart-copy h2 { font-size: 14px; letter-spacing: 0.08em; margin: 0 0 8px; }
  .pv-chart-copy p { font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.5; color: #444; }
  .pv-chart-img { width: 100%; max-width: 320px; border: 1px solid #ddd; margin-top: 12px; }
  .pv-placeholder { background: #f3f3f3; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; min-height: 140px; color: #888; font-family: Arial, Helvetica, sans-serif; font-size: 12px; }
  .pv-chart-ph { max-width: 320px; min-height: 240px; }
  .pv-img { width: 100%; max-width: 280px; height: auto; object-fit: cover; background: #f5f5f5; }
  .pv-primary { margin-bottom: 28px; }
  .pv-stone-title { margin: 0 0 4px; font-size: 16px; }
  .pv-weight { margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; letter-spacing: 0.04em; color: #555; }
  .pv-product-name { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #666; }
  .pv-btn { display: inline-block; margin-top: 10px; background: #e85d04; color: #fff !important; text-decoration: none; padding: 8px 18px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; border: none; }
  .pv-btn-disabled { opacity: 0.5; }
  .pv-btn-sm { display: inline-block; margin-top: 8px; background: #c4a484; color: #fff !important; text-decoration: none; padding: 6px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; }
  .pv-btn-light { background: #fff; color: #e85d04 !important; border: 1px solid #fff; }
  .pv-benefits { margin-top: 14px; }
  .pv-benefits-label { font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; }
  .pv-benefit-icons { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
  .pv-benefit { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 76px; text-align: center; font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #444; }
  .pv-benefit-circle { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(145deg, #fffbeb, #ffedd5); border: 1px solid #fde68a; display: flex; align-items: center; justify-content: center; }
  .pv-additional h2 { font-size: 18px; margin: 0 0 14px; }
  .pv-additional-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .pv-stone-compact .pv-img { max-width: 100%; }
  .pv-tiered { margin: 24px 0; font-family: Arial, Helvetica, sans-serif; }
  .pv-tiered h2 { font-family: Georgia, serif; }
  .pv-link { color: #1d4ed8; text-decoration: underline; }
  .pv-endorse { font-size: 11px; letter-spacing: 0.06em; color: #666; }
  .pv-tier { margin: 16px 0 16px 12px; padding-left: 8px; border-left: 2px solid #eee; }
  .pv-tier h4 { margin: 0 0 8px; }
  .pv-meta, .pv-price { font-size: 12px; margin: 4px 0; }
  .pv-stone-grid { margin: 24px 0; text-align: center; }
  .pv-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; text-align: left; }
  .pv-grid-card { border: 1px solid #ddd; padding: 12px; }
  .pv-grid-card h3 { font-size: 12px; margin: 0 0 4px; }
  .pv-gem { font-weight: 700; margin: 0 0 8px; }
  .pv-attrs { font-family: Arial, Helvetica, sans-serif; font-size: 11px; border-top: 1px dashed #ccc; margin-top: 8px; }
  .pv-attrs div { padding: 6px 0; border-bottom: 1px dashed #ccc; }
  .pv-cta { background: #2563eb; color: #fff; padding: 18px 20px; margin: 28px 0; }
  .pv-cta-inner { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .pv-cta-title { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; }
  .pv-cta-price { margin: 6px 0 0; font-size: 22px; font-weight: 700; }
  .pv-why { text-align: center; margin: 28px 0; }
  .pv-why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; }
  .pv-why-item { padding: 16px; background: #fafafa; }
  .pv-footer { background: #f5f0eb; padding: 18px 16px; margin-top: 28px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; }
  .pv-note { color: #888; font-size: 11px; margin-top: 12px; }
  @media print {
    body { background: #fff; }
    .pv-report { max-width: none; padding: 0; }
    .pv-btn, .pv-btn-sm { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media (max-width: 640px) {
    .pv-details, .pv-additional-grid, .pv-grid-3, .pv-why-grid, .pv-chart-primary { grid-template-columns: 1fr; }
  }
`;
