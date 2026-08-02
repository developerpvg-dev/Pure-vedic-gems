import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import {
  REPORT_TRUST_MARKS,
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

export { REPORT_TRUST_MARKS };

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

function formatReportDate(d = new Date()): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function sectionHead(num: string, label: string, title?: string): string {
  return `<div class="pv-sec-head">
    <span class="pv-sec-num">${esc(num)}</span>
    <div>
      <p class="pv-sec-label">${esc(label)}</p>
      ${title ? `<h2 class="pv-sec-title">${esc(title)}</h2>` : ''}
    </div>
  </div>`;
}

function productImg(url: string | null | undefined, alt: string): string {
  if (!url) return `<div class="pv-placeholder">${esc(alt || 'Product')}</div>`;
  return `<div class="pv-img-frame"><img class="pv-img" src="${esc(url)}" alt="${esc(alt)}" /></div>`;
}

function wearMeta(stone: StoneCard): string {
  const rows: [string, string | undefined][] = [
    ['Wear day', stone.wearDay],
    ['Finger', stone.wearFinger],
    ['Metal', stone.metal],
    ['Deity', stone.wearDeity],
  ];
  const filled = rows.filter(([, v]) => v?.trim());
  if (!filled.length) return '';
  return `<table class="pv-meta-table">${filled
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('')}</table>`;
}

function benefitsRow(benefits: string[]): string {
  if (!benefits.length) return '';
  return `<div class="pv-benefits">
    <p class="pv-sec-label">Suggested for</p>
    <div class="pv-benefit-icons">${benefits
      .map(
        (b) =>
          `<div class="pv-benefit"><span class="pv-benefit-circle">${benefitSvgMarkup(b, 16)}</span><span>${esc(b)}</span></div>`
      )
      .join('')}</div>
  </div>`;
}

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
    ? `<a class="pv-btn" href="${esc(stone.product.buyUrl)}">View &amp; Buy</a>`
    : `<span class="pv-btn pv-btn-disabled">View &amp; Buy</span>`;
  return `<div class="pv-stone ${compact ? 'pv-stone-compact' : ''}">
    <p class="pv-role">${esc(role)}</p>
    <h3 class="pv-stone-title">${esc(stone.gemLabel)}</h3>
    ${stone.weight ? `<p class="pv-weight">Weight · ${esc(stone.weight)}</p>` : ''}
    ${productImg(stone.product.imageUrl, stone.product.name || stone.gemLabel)}
    ${stone.product.name ? `<p class="pv-product-name">${esc(stone.product.name)}</p>` : ''}
    ${stone.product.priceLabel ? `<p class="pv-price-tag">${esc(stone.product.priceLabel)}</p>` : ''}
    ${wearMeta(stone)}
    ${buy}
    ${benefitsRow(stone.benefits)}
  </div>`;
}

function trustStripHtml(): string {
  return `<section class="pv-trust">
    ${REPORT_TRUST_MARKS.map(
      (m) => `<div class="pv-trust-item">
        <strong>${esc(m.title)}</strong>
        <span>${esc(m.detail)}</span>
      </div>`
    ).join('')}
  </section>`;
}

export function renderReportHtml(opts: {
  title: string;
  customer: ReportCustomer;
  blocks: ReportBlock[];
  chartImageUrl?: string | null;
  siteUrl?: string;
  embedLocalAssets?: boolean;
  reportDate?: string;
}): string {
  const {
    title,
    customer,
    blocks,
    chartImageUrl,
    siteUrl = '',
    embedLocalAssets = false,
    reportDate = formatReportDate(),
  } = opts;
  const parts: string[] = [];
  let section = 0;
  const nextNum = () => String(++section).padStart(2, '0');

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = blocks[i + 1];

    if (block.type === 'natalChart' && next?.type === 'primaryStone') {
      const img = block.imageUrl || chartImageUrl;
      const n = nextNum();
      parts.push(`<section class="pv-section pv-chart-primary">
        <div class="pv-chart-copy">
          ${sectionHead(n, 'Astrological basis', 'Natal birth chart')}
          <p class="pv-body">${esc(block.description)}</p>
          ${img ? `<div class="pv-chart-frame"><img class="pv-chart-img" src="${esc(img)}" alt="Natal birth chart" /></div>` : '<div class="pv-placeholder pv-chart-ph">Upload kundli image</div>'}
        </div>
        <div>
          <p class="pv-sec-label">Primary recommendation</p>
          ${stoneCardHtml(next.stone, false)}
        </div>
      </section>`);
      i++;
      continue;
    }

    switch (block.type) {
      case 'header': {
        const nav = block.navLinks.length
          ? `<nav class="pv-nav">${block.navLinks.map((l) => `<span>${esc(l)}</span>`).join('')}</nav>`
          : '';
        parts.push(`<header class="pv-header">
          <div class="pv-masthead">
            <span class="pv-doc-label">Gem recommendation report</span>
            <span>${esc(reportDate)}</span>
          </div>
          <div class="pv-header-row">
            ${headerLogoHtml(block.logoUrl, siteUrl, embedLocalAssets)}
            ${nav}
          </div>
        </header>`);
        break;
      }
      case 'greeting': {
        const name = customer.name || 'there';
        parts.push(`<section class="pv-greeting">
          <p class="pv-sec-label">Prepared for</p>
          <h1>${esc(name)}</h1>
          <p class="pv-headline">${esc(fillPlaceholders(block.headline, customer))}</p>
          <p class="pv-sub">${esc(fillPlaceholders(block.subheadline, customer))}</p>
        </section>`);
        break;
      }
      case 'customerDetails': {
        const n = nextNum();
        const rows: [string, string][] = [
          ['Place of birth', customer.birthPlace || '—'],
          ['Date of birth', customer.dob || '—'],
          ['Purpose', customer.purpose || '—'],
          ['Email', customer.email || '—'],
          ['Phone', customer.phone || '—'],
          ['Weight note', customer.weightNote || '—'],
        ];
        parts.push(`<section class="pv-section">
          ${sectionHead(n, 'Client information')}
          <table class="pv-info-table">
            ${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}
          </table>
        </section>`);
        break;
      }
      case 'natalChart': {
        const img = block.imageUrl || chartImageUrl;
        const n = nextNum();
        parts.push(`<section class="pv-section">
          ${sectionHead(n, 'Astrological basis', 'Natal birth chart')}
          <p class="pv-body">${esc(block.description)}</p>
          ${img ? `<div class="pv-chart-frame"><img class="pv-chart-img" src="${esc(img)}" alt="Natal birth chart" /></div>` : '<div class="pv-placeholder pv-chart-ph">Upload kundli image</div>'}
        </section>`);
        break;
      }
      case 'primaryStone': {
        const n = nextNum();
        parts.push(`<section class="pv-section">
          ${sectionHead(n, 'Primary recommendation')}
          ${stoneCardHtml(block.stone, false)}
        </section>`);
        break;
      }
      case 'additionalStones': {
        const n = nextNum();
        parts.push(`<section class="pv-section">
          ${sectionHead(n, 'Supporting remedies', 'Additionally helpful gemstones')}
          <div class="pv-additional-grid">${block.stones.map((s) => stoneCardHtml(s, true)).join('')}</div>
        </section>`);
        break;
      }
      case 'tieredProducts': {
        const n = nextNum();
        const tiers = block.tiers
          .map(
            (t, idx) => `<div class="pv-tier ${idx === 1 ? 'pv-tier-featured' : ''}">
              ${idx === 1 ? '<span class="pv-tier-ribbon">Recommended</span>' : ''}
              <h4>${esc(t.label)}</h4>
              ${productImg(t.product.imageUrl, t.product.name)}
              <p class="pv-tier-name">${esc(t.product.name || 'Select product')}</p>
              ${t.product.origin ? `<p class="pv-meta">Origin · ${esc(t.product.origin)}</p>` : ''}
              ${t.product.priceLabel ? `<p class="pv-price">${esc(t.product.priceLabel)}</p>` : ''}
              ${t.product.buyUrl ? `<a class="pv-btn-sm" href="${esc(t.product.buyUrl)}">Buy Now</a>` : ''}
            </div>`
          )
          .join('');
        parts.push(`<section class="pv-section">
          ${sectionHead(n, esc(block.category) || 'Product options', block.gemLabel)}
          <p class="pv-weight">${esc(block.weight)}</p>
          ${block.endorsement ? `<p class="pv-endorse">${esc(block.endorsement)}</p>` : ''}
          ${
            block.suggestedFor.length
              ? `<div class="pv-tag-row">${block.suggestedFor.map((s) => `<span>${esc(s)}</span>`).join('')}</div>`
              : ''
          }
          <div class="pv-tier-grid">${tiers}</div>
        </section>`);
        break;
      }
      case 'stoneGrid': {
        const n = nextNum();
        const cards = block.stones
          .map((s) => {
            const role = STONE_ROLE_LABELS[s.role] ?? s.role;
            return `<div class="pv-grid-card">
              <p class="pv-role">${esc(role)}</p>
              <p class="pv-gem">${esc(s.gemLabel)}</p>
              ${productImg(s.product.imageUrl, s.gemLabel)}
              <table class="pv-meta-table">
                <tr><th>Weight</th><td>${esc(s.weight)} ct</td></tr>
                ${s.wearDay ? `<tr><th>Wear day</th><td>${esc(s.wearDay)}</td></tr>` : ''}
                ${s.wearFinger ? `<tr><th>Finger</th><td>${esc(s.wearFinger)}</td></tr>` : ''}
                ${s.metal ? `<tr><th>Metal</th><td>${esc(s.metal)}</td></tr>` : ''}
                ${s.wearDeity ? `<tr><th>Deity</th><td>${esc(s.wearDeity)}</td></tr>` : ''}
              </table>
              ${s.product.buyUrl ? `<a class="pv-btn-sm" href="${esc(s.product.buyUrl)}">Buy Now</a>` : ''}
            </div>`;
          })
          .join('');
        parts.push(`<section class="pv-section">
          ${sectionHead(n, 'Wear guidance', 'Your gems recommendation')}
          <div class="pv-grid-3">${cards}</div>
        </section>`);
        break;
      }
      case 'consultationCta': {
        const href = block.href.startsWith('http') ? block.href : `${siteUrl}${block.href}`;
        parts.push(`<section class="pv-cta">
          <div class="pv-cta-inner">
            <div>
              <p class="pv-sec-label pv-sec-label-light">Personal guidance</p>
              <p class="pv-cta-title">${esc(block.title)}</p>
              <p class="pv-cta-price">${esc(block.priceLabel)}</p>
            </div>
            <a class="pv-btn pv-btn-light" href="${esc(href)}">${esc(block.buttonLabel)}</a>
          </div>
        </section>`);
        break;
      }
      case 'whyUs': {
        const n = nextNum();
        parts.push(`<section class="pv-section">
          ${sectionHead(n, 'Why Pure Vedic Gems', block.title)}
          <div class="pv-why-grid">${block.items
            .map(
              (item, idx) =>
                `<div class="pv-why-item"><span class="pv-why-num">${String(idx + 1).padStart(2, '0')}</span><p>${esc(item.text)}</p></div>`
            )
            .join('')}</div>
        </section>`);
        break;
      }
      case 'footer': {
        // Always show brand trust marks immediately above contact footer
        parts.push(trustStripHtml());
        parts.push(`<footer class="pv-footer">
          <div class="pv-footer-grid">
            <div>
              <p class="pv-sec-label">Contact</p>
              <p class="pv-footer-value">${esc(block.contact)}</p>
            </div>
            <div>
              <p class="pv-sec-label">Address</p>
              <p class="pv-footer-value">${esc(block.address)}</p>
            </div>
          </div>
          <p class="pv-note">${esc(block.note)}</p>
        </footer>`);
        break;
      }
    }
  }

  // If report has no footer block, still append trust marks
  if (!blocks.some((b) => b.type === 'footer')) {
    parts.push(trustStripHtml());
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
<style>${REPORT_CSS}</style>
</head>
<body>
<article class="pv-report">
${parts.join('\n')}
</article>
</body>
</html>`;
}

/** Premium structured report — Roboto only, heritage gold. */
export const REPORT_CSS = `
  * { box-sizing: border-box; }
  :root {
    --ink: #261A10;
    --ink-soft: #3D2B1F;
    --muted: #7A6250;
    --gold: #8A6400;
    --gold-bright: #C9A84C;
    --gold-wash: rgba(201, 168, 76, 0.14);
    --paper: #FDFBF7;
    --paper-deep: #F6EFE3;
    --line: rgba(61, 43, 31, 0.11);
    --surface: #FFFFFF;
    --dark: #2C1A0E;
    --font: 'Roboto', Helvetica, Arial, sans-serif;
  }
  body {
    margin: 0;
    color: var(--ink);
    background: #f3efe8;
    font-family: var(--font);
    font-size: 12.5px;
    font-weight: 400;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pv-report {
    position: relative;
    max-width: 800px;
    margin: 0 auto;
    padding: 28px 30px 44px;
    background:
      linear-gradient(180deg, #FFFEFB 0%, var(--paper) 100%);
    box-shadow: 0 0 0 1px rgba(201, 168, 76, 0.28), 0 18px 40px rgba(38, 26, 16, 0.06);
  }
  .pv-report::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--dark), var(--gold) 40%, var(--gold-bright) 70%, var(--gold));
  }

  .pv-sec-head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
  }
  .pv-sec-num {
    font-size: 18px;
    font-weight: 700;
    color: var(--gold);
    line-height: 1.15;
    min-width: 26px;
    letter-spacing: -0.02em;
  }
  .pv-sec-label {
    margin: 0;
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .pv-sec-label-light { color: var(--gold-bright); }
  .pv-sec-title {
    margin: 3px 0 0;
    font-size: 17px;
    font-weight: 700;
    color: var(--ink-soft);
    line-height: 1.25;
    letter-spacing: -0.01em;
  }
  .pv-body {
    margin: 0 0 14px;
    font-size: 12.5px;
    font-weight: 300;
    line-height: 1.7;
    color: var(--muted);
  }
  .pv-section { margin-bottom: 28px; }

  .pv-header {
    margin-bottom: 22px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--line);
  }
  .pv-masthead {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .pv-doc-label { color: var(--gold); font-weight: 700; }
  .pv-header-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .pv-logo-row { display: flex; align-items: center; gap: 12px; }
  .pv-logo { height: 46px; width: 46px; object-fit: contain; }
  .pv-wordmark { height: 28px; width: auto; object-fit: contain; }
  .pv-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .pv-greeting {
    position: relative;
    margin-bottom: 26px;
    padding: 22px 24px;
    background: linear-gradient(135deg, #FFFDF9, #F8F1E6);
    border: 1px solid rgba(201, 168, 76, 0.35);
  }
  .pv-greeting::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, var(--gold-bright), var(--gold));
  }
  .pv-greeting h1 {
    margin: 6px 0 10px;
    font-size: 28px;
    font-weight: 700;
    color: var(--ink-soft);
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .pv-headline {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 500;
    color: var(--ink);
    line-height: 1.4;
  }
  .pv-sub { margin: 0; font-size: 12.5px; font-weight: 300; color: var(--muted); }

  .pv-info-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    border: 1px solid var(--line);
  }
  .pv-info-table th, .pv-info-table td {
    padding: 11px 16px;
    text-align: left;
    border-bottom: 1px solid var(--line);
    vertical-align: top;
  }
  .pv-info-table tr:last-child th, .pv-info-table tr:last-child td { border-bottom: none; }
  .pv-info-table th {
    width: 34%;
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    background: var(--paper-deep);
  }
  .pv-info-table td {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-soft);
  }

  .pv-chart-primary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 26px;
    align-items: start;
    margin-bottom: 28px;
  }
  .pv-chart-frame {
    margin-top: 10px;
    padding: 8px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: inset 0 0 0 1px rgba(201, 168, 76, 0.2);
  }
  .pv-chart-img { display: block; width: 100%; max-width: 320px; }
  .pv-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    background: var(--paper-deep);
    border: 1px dashed rgba(138, 100, 0, 0.28);
    color: var(--muted);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .pv-chart-ph { max-width: 320px; min-height: 220px; }

  .pv-img-frame {
    display: inline-block;
    max-width: 100%;
    padding: 5px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: 0 6px 18px rgba(38, 26, 16, 0.05);
  }
  .pv-img {
    display: block;
    width: 100%;
    max-width: 240px;
    height: auto;
    object-fit: cover;
    background: var(--paper-deep);
  }

  .pv-role {
    margin: 0 0 8px;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .pv-stone-title {
    margin: 0 0 4px;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--ink-soft);
  }
  .pv-weight {
    margin: 0 0 12px;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--muted);
  }
  .pv-product-name { margin: 10px 0 2px; font-size: 12px; font-weight: 400; color: var(--muted); }
  .pv-price-tag {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 700;
    color: var(--ink-soft);
  }

  .pv-meta-table {
    width: 100%;
    margin: 12px 0;
    border-collapse: collapse;
  }
  .pv-meta-table th, .pv-meta-table td {
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
    font-size: 11px;
    text-align: left;
  }
  .pv-meta-table th {
    width: 40%;
    font-weight: 400;
    color: var(--muted);
    letter-spacing: 0.04em;
  }
  .pv-meta-table td {
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-soft);
  }

  .pv-btn, .pv-btn-sm {
    display: inline-block;
    margin-top: 12px;
    text-decoration: none;
    font-family: var(--font);
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border: none;
  }
  .pv-btn {
    padding: 10px 20px;
    background: linear-gradient(180deg, #9a7408, var(--gold) 55%, #6f5200);
    color: #fff !important;
    font-size: 10px;
    box-shadow: 0 1px 0 #4a3600;
  }
  .pv-btn-disabled { opacity: 0.4; }
  .pv-btn-sm {
    padding: 7px 13px;
    background: var(--ink-soft);
    color: #FDF7EE !important;
    font-size: 9px;
  }
  .pv-btn-light {
    background: #fff !important;
    color: var(--ink-soft) !important;
    border: 1px solid rgba(201, 168, 76, 0.55);
    box-shadow: none;
  }

  .pv-benefits { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--line); }
  .pv-benefit-icons { display: flex; flex-wrap: wrap; gap: 8px 12px; margin-top: 10px; }
  .pv-benefit {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    width: 68px;
    text-align: center;
    font-size: 9px;
    font-weight: 400;
    line-height: 1.25;
    color: var(--muted);
  }
  .pv-benefit-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 25%, #fff, var(--gold-wash));
    border: 1px solid rgba(201, 168, 76, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gold);
  }

  .pv-additional-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .pv-stone-compact {
    padding: 16px;
    background: var(--surface);
    border: 1px solid var(--line);
    box-shadow: 0 4px 14px rgba(38, 26, 16, 0.03);
  }
  .pv-stone-compact .pv-img { max-width: 100%; }

  .pv-endorse {
    display: inline-block;
    margin: 0 0 12px;
    padding: 4px 10px;
    background: var(--gold-wash);
    border: 1px solid rgba(138, 100, 0, 0.28);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .pv-tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 16px; }
  .pv-tag-row span {
    padding: 5px 9px;
    background: var(--paper-deep);
    border: 1px solid var(--line);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .pv-tier-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .pv-tier {
    position: relative;
    padding: 16px 12px;
    background: var(--surface);
    border: 1px solid var(--line);
    text-align: center;
  }
  .pv-tier-featured {
    border-color: rgba(138, 100, 0, 0.45);
    background: linear-gradient(180deg, #FFFEFB, var(--gold-wash));
    box-shadow: 0 8px 22px rgba(138, 100, 0, 0.1);
  }
  .pv-tier-ribbon {
    display: inline-block;
    margin-bottom: 8px;
    padding: 3px 8px;
    background: var(--gold);
    color: #fff;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .pv-tier h4 {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .pv-tier .pv-img { max-width: 100%; margin: 0 auto; }
  .pv-tier-name { margin: 10px 0 2px; font-size: 11px; font-weight: 500; }
  .pv-meta, .pv-price { font-size: 11px; margin: 3px 0; color: var(--muted); }
  .pv-price { font-size: 14px; font-weight: 700; color: var(--ink); }

  .pv-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .pv-grid-card {
    padding: 14px;
    background: var(--surface);
    border: 1px solid var(--line);
  }
  .pv-gem {
    margin: 0 0 10px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .pv-cta {
    position: relative;
    margin: 28px 0;
    padding: 22px 24px;
    background: linear-gradient(135deg, var(--dark) 0%, #3D2B1F 100%);
    color: #FDF7EE;
    overflow: hidden;
  }
  .pv-cta::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, rgba(201,168,76,0.16), transparent 45%);
    pointer-events: none;
  }
  .pv-cta-inner {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .pv-cta-title {
    margin: 4px 0 0;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }
  .pv-cta-price {
    margin: 8px 0 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--gold-bright);
  }

  .pv-why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pv-why-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    background: var(--surface);
    border: 1px solid var(--line);
  }
  .pv-why-num {
    font-size: 13px;
    font-weight: 700;
    color: var(--gold);
    line-height: 1.3;
  }
  .pv-why-item p { margin: 0; font-size: 12px; font-weight: 400; color: var(--ink-soft); line-height: 1.45; }

  .pv-trust {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 0;
    margin: 32px 0 0;
    border: 1px solid rgba(201, 168, 76, 0.35);
    background: linear-gradient(180deg, #FFFEFB, var(--gold-wash));
  }
  .pv-trust-item {
    padding: 16px 12px;
    text-align: center;
    border-right: 1px solid rgba(201, 168, 76, 0.28);
  }
  .pv-trust-item:last-child { border-right: none; }
  .pv-trust-item strong {
    display: block;
    font-size: 12.5px;
    font-weight: 700;
    color: var(--ink-soft);
    margin-bottom: 4px;
    letter-spacing: 0.02em;
  }
  .pv-trust-item span {
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--muted);
    line-height: 1.35;
  }

  .pv-footer { margin-top: 0; padding: 18px 0 0; }
  .pv-footer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }
  .pv-footer-value {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 500;
  }
  .pv-note {
    margin-top: 16px;
    font-size: 9px;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--muted);
  }

  @media print {
    body { background: #fff; }
    .pv-report { max-width: none; padding: 0; box-shadow: none; }
    .pv-btn, .pv-btn-sm, .pv-cta, .pv-trust, .pv-greeting { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media (max-width: 640px) {
    .pv-chart-primary, .pv-additional-grid, .pv-grid-3, .pv-why-grid, .pv-tier-grid, .pv-trust, .pv-footer-grid {
      grid-template-columns: 1fr;
    }
    .pv-trust-item { border-right: none; border-bottom: 1px solid rgba(201, 168, 76, 0.28); }
  }
`;
