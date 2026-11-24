/**
 * Markdown → Sanity Portable Text for BabyLoveGrowth articles.
 *
 * ponytail: Worker-safe (no jsdom). Covers headings, paragraphs, lists,
 * links, bold/italic, code, images, blockquotes, GFM tables. Nested HTML
 * tables / complex embeds → upgrade to a real HTML→PT walk if BLG needs it.
 */

export interface PtSpan {
  _type: 'span';
  _key: string;
  text: string;
  marks: string[];
}

export interface PtMarkDef {
  _type: 'link';
  _key: string;
  href: string;
}

export interface PtBlock {
  _type: 'block';
  _key: string;
  style: string;
  listItem?: 'bullet' | 'number';
  level?: number;
  markDefs: PtMarkDef[];
  children: PtSpan[];
}

export interface PtImageBlock {
  _type: 'imageBlock';
  _key: string;
  _srcUrl: string;
  alt?: string;
}

export interface PtTableRow {
  _key: string;
  cells: string[];
}

/** Matches @sanity/table shape used by PortableText. */
export interface PtTableBlock {
  _type: 'table';
  _key: string;
  rows: PtTableRow[];
}

export type PtNode = PtBlock | PtImageBlock | PtTableBlock;

let keyCounter = 0;
function key(prefix = 'k'): string {
  keyCounter += 1;
  return `${prefix}${keyCounter.toString(36)}`;
}

/** Reset key sequence — tests only. */
export function resetPtKeys() {
  keyCounter = 0;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function parseInline(text: string): { children: PtSpan[]; markDefs: PtMarkDef[] } {
  const markDefs: PtMarkDef[] = [];
  const children: PtSpan[] = [];
  // Links, bold, italic, code — no lookbehind (Workers / older engines).
  const token = /(\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;

  let last = 0;
  let match: RegExpExecArray | null;
  const src = text;
  while ((match = token.exec(src))) {
    if (match.index > last) {
      const plain = decodeEntities(src.slice(last, match.index));
      if (plain) children.push({ _type: 'span', _key: key('s'), text: plain, marks: [] });
    }
    const raw = match[0];
    const linkMatch = raw.match(/^\[([^\]]*)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const href = linkMatch[2].trim();
      if (/^(https?:|mailto:|tel:|\/)/i.test(href)) {
        const def: PtMarkDef = { _type: 'link', _key: key('l'), href };
        markDefs.push(def);
        children.push({
          _type: 'span',
          _key: key('s'),
          text: decodeEntities(linkMatch[1]),
          marks: [def._key],
        });
      } else {
        children.push({
          _type: 'span',
          _key: key('s'),
          text: decodeEntities(linkMatch[1]),
          marks: [],
        });
      }
    } else if (raw.startsWith('**') || raw.startsWith('__')) {
      children.push({
        _type: 'span',
        _key: key('s'),
        text: decodeEntities(raw.slice(2, -2)),
        marks: ['strong'],
      });
    } else if (raw.startsWith('`')) {
      children.push({
        _type: 'span',
        _key: key('s'),
        text: decodeEntities(raw.slice(1, -1)),
        marks: ['code'],
      });
    } else {
      children.push({
        _type: 'span',
        _key: key('s'),
        text: decodeEntities(raw.slice(1, -1)),
        marks: ['em'],
      });
    }
    last = match.index + raw.length;
  }
  if (last < src.length) {
    const plain = decodeEntities(src.slice(last));
    if (plain) children.push({ _type: 'span', _key: key('s'), text: plain, marks: [] });
  }
  if (children.length === 0) {
    children.push({ _type: 'span', _key: key('s'), text: '', marks: [] });
  }
  return { children, markDefs };
}

function textBlock(
  text: string,
  style: string,
  list?: { listItem: 'bullet' | 'number'; level?: number },
): PtBlock | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const { children, markDefs } = parseInline(trimmed);
  if (children.every((c) => !c.text.trim())) return null;
  return {
    _type: 'block',
    _key: key('b'),
    style,
    markDefs,
    children,
    ...(list ? { listItem: list.listItem, level: list.level ?? 1 } : {}),
  };
}

/** GFM table row: `| a | b |` → cells (trim empties from leading/trailing pipes). */
function splitTableRow(line: string): string[] {
  const raw = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return raw.split('|').map((c) => decodeEntities(c.trim()));
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.includes('|') && /^\|?.+\|/.test(t);
}

/** Strip leading H1 that duplicates the post title (page already renders title). */
function stripLeadingTitleHeading(md: string, title?: string): string {
  const lines = md.replace(/^\uFEFF/, '').split(/\r?\n/);
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i += 1;
  const first = lines[i] ?? '';
  const h1 = first.match(/^#\s+(.+)$/);
  if (!h1) return md;
  const heading = h1[1].trim();
  if (!title || heading.toLowerCase() === title.trim().toLowerCase()) {
    lines.splice(i, 1);
    return lines.join('\n');
  }
  return md;
}

/**
 * ponytail: crude HTML→markdown when webhook only sends content_html.
 * Good enough for BLG semantic articles; not a general HTML importer.
 */
export function htmlToApproxMarkdown(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n\n')
      .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n### $1\n\n')
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n\n')
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi, '\n![$2]($1)\n\n')
      .replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '\n![$1]($2)\n\n')
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/gi, '\n![]($1)\n\n')
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
      .replace(/<\/?(strong|b)>/gi, '**')
      .replace(/<\/?(em|i)>/gi, '*')
      .replace(/<\/?code>/gi, '`')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
      .replace(/<\/?(ul|ol|p|div|br|hr)[^>]*>/gi, (tag) =>
        /<\/?(p|div|br|hr|ul|ol)/i.test(tag) ? '\n\n' : '',
      )
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );
}

export function markdownToPortableText(markdown: string, title?: string): {
  blocks: PtNode[];
  imageUrls: string[];
} {
  const md = stripLeadingTitleHeading((markdown ?? '').trim(), title);
  if (!md) return { blocks: [], imageUrls: [] };

  const blocks: PtNode[] = [];
  const imageUrls: string[] = [];
  const lines = md.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    const img = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      const src = img[2].trim();
      if (src) {
        imageUrls.push(src);
        blocks.push({ _type: 'imageBlock', _key: key('img'), _srcUrl: src, alt: img[1] || undefined });
      }
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const style = level <= 2 ? 'h2' : 'h3';
      const block = textBlock(heading[2], style);
      if (block) blocks.push(block);
      i += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quote = trimmed.replace(/^>\s?/, '');
      const block = textBlock(quote, 'blockquote');
      if (block) blocks.push(block);
      i += 1;
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      const block = textBlock(bullet[1], 'normal', { listItem: 'bullet', level: 1 });
      if (block) blocks.push(block);
      i += 1;
      continue;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      const block = textBlock(numbered[1], 'normal', { listItem: 'number', level: 1 });
      if (block) blocks.push(block);
      i += 1;
      continue;
    }

    // GFM table: header | sep | rows…
    if (
      isTableRow(trimmed) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1].trim())
    ) {
      const rows: PtTableRow[] = [{ _key: key('tr'), cells: splitTableRow(trimmed) }];
      i += 2; // skip separator
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next || !isTableRow(next) || isTableSeparator(next)) break;
        rows.push({ _key: key('tr'), cells: splitTableRow(next) });
        i += 1;
      }
      blocks.push({ _type: 'table', _key: key('tbl'), rows });
      continue;
    }

    // Paragraph: join continuation lines until blank / block start.
    const para: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (!next) break;
      if (
        /^(#{1,6}\s|[-*+]\s|\d+[.)]\s|>|!\[)/.test(next) ||
        next.startsWith('```') ||
        (isTableRow(next) && i + 1 < lines.length && isTableSeparator(lines[i + 1].trim()))
      ) {
        break;
      }
      para.push(next);
      i += 1;
    }
    const block = textBlock(para.join(' '), 'normal');
    if (block) blocks.push(block);
  }

  return { blocks, imageUrls };
}

export function isImageBlock(node: PtNode): node is PtImageBlock {
  return node._type === 'imageBlock';
}
