/**
 * Lightweight, deterministic HTML → Portable Text converter for the
 * legacy WordPress blog migration.
 *
 * The legacy content is clean editorial HTML (headings, paragraphs,
 * blockquotes, lists, links, inline formatting and images — no tables,
 * shortcodes or embeds). We hand-roll the conversion with jsdom so the
 * output shape matches the project's `richTextBlocks` schema exactly:
 *
 *   block styles : normal | h2 | h3 | blockquote
 *   list items   : bullet | number
 *   decorators   : strong | em | underline | code
 *   annotations  : link { href }
 *   images       : { _type: 'imageBlock', asset, alt }  (asset attached later)
 *
 * Images are NOT uploaded here. Each <img> becomes a placeholder block of
 * `_type: 'imageBlock'` carrying a temporary `_srcUrl`. The migration script
 * uploads the binary, swaps in the real asset reference, and promotes the
 * first image to `mainImage`.
 */
import { JSDOM } from 'jsdom';

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

export type PtNode = PtBlock | PtImageBlock;

let keyCounter = 0;
function key(prefix = 'k'): string {
  keyCounter += 1;
  return `${prefix}${keyCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const DECORATOR_TAGS: Record<string, string> = {
  strong: 'strong',
  b: 'strong',
  em: 'em',
  i: 'em',
  u: 'underline',
  code: 'code',
};

interface InlineCtx {
  spans: PtSpan[];
  markDefs: PtMarkDef[];
}

function pushText(ctx: InlineCtx, text: string, marks: string[]) {
  if (!text) return;
  // Merge with previous span if identical marks (keeps output tidy).
  const last = ctx.spans[ctx.spans.length - 1];
  if (last && arraysEqual(last.marks, marks)) {
    last.text += text;
    return;
  }
  ctx.spans.push({ _type: 'span', _key: key('s'), text, marks: [...marks] });
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/** Recursively walk inline DOM nodes, accumulating spans + link markDefs. */
function walkInline(node: Node, marks: string[], ctx: InlineCtx) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3 /* TEXT_NODE */) {
      const raw = child.textContent ?? '';
      const text = raw.replace(/\s+/g, ' ');
      if (text.trim().length === 0 && text !== ' ') continue;
      pushText(ctx, text, marks);
      continue;
    }
    if (child.nodeType !== 1 /* ELEMENT_NODE */) continue;

    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === 'br') {
      pushText(ctx, '\n', marks);
      continue;
    }
    if (tag === 'a') {
      const href = el.getAttribute('href')?.trim();
      if (href && /^(https?:|mailto:|tel:|\/)/i.test(href)) {
        const markDef: PtMarkDef = { _type: 'link', _key: key('l'), href };
        ctx.markDefs.push(markDef);
        walkInline(el, [...marks, markDef._key], ctx);
      } else {
        walkInline(el, marks, ctx);
      }
      continue;
    }
    const decorator = DECORATOR_TAGS[tag];
    if (decorator) {
      const next = marks.includes(decorator) ? marks : [...marks, decorator];
      walkInline(el, next, ctx);
      continue;
    }
    // span / font / sup / sub / small / mark / div-inline → flatten, keep marks
    walkInline(el, marks, ctx);
  }
}

function makeTextBlock(el: Element, style: string): PtBlock | null {
  const ctx: InlineCtx = { spans: [], markDefs: [] };
  walkInline(el, [], ctx);
  // Trim leading/trailing whitespace on edge spans.
  trimSpans(ctx.spans);
  if (ctx.spans.length === 0) return null;
  if (ctx.spans.every((s) => s.text.trim().length === 0)) return null;
  return {
    _type: 'block',
    _key: key('b'),
    style,
    markDefs: ctx.markDefs,
    children: ctx.spans,
  };
}

function trimSpans(spans: PtSpan[]) {
  if (spans.length > 0) spans[0].text = spans[0].text.replace(/^\s+/, '');
  if (spans.length > 0) spans[spans.length - 1].text = spans[spans.length - 1].text.replace(/\s+$/, '');
}

function firstImg(el: Element): Element | null {
  if (el.tagName.toLowerCase() === 'img') return el;
  return el.querySelector('img');
}

function makeImageBlock(img: Element): PtImageBlock | null {
  const src = img.getAttribute('src')?.trim();
  if (!src) return null;
  const alt = img.getAttribute('alt')?.trim() || undefined;
  return { _type: 'imageBlock', _key: key('img'), _srcUrl: src, alt };
}

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const FLATTEN_TAGS = new Set(['div', 'section', 'article', 'figure', 'header', 'footer', 'main']);

/** Process a block-level element, pushing zero or more PtNodes. */
function processBlockElement(el: Element, out: PtNode[]) {
  const tag = el.tagName.toLowerCase();

  // Element that is (or wraps) only an image → image block.
  const img = firstImg(el);
  if (img && isImageOnly(el)) {
    const block = makeImageBlock(img);
    if (block) out.push(block);
    return;
  }

  if (HEADING_TAGS.has(tag)) {
    const style = tag === 'h1' || tag === 'h2' ? 'h2' : 'h3';
    const block = makeTextBlock(el, style);
    if (block) out.push(block);
    // Headings might also embed an image alongside text (rare) — handled by isImageOnly above.
    return;
  }

  if (tag === 'blockquote') {
    const block = makeTextBlock(el, 'blockquote');
    if (block) out.push(block);
    return;
  }

  if (tag === 'ul' || tag === 'ol') {
    const listItem = tag === 'ol' ? 'number' : 'bullet';
    for (const li of Array.from(el.children)) {
      if (li.tagName.toLowerCase() !== 'li') continue;
      const block = makeTextBlock(li, 'normal');
      if (block) {
        block.listItem = listItem;
        block.level = 1;
        out.push(block);
      }
    }
    return;
  }

  if (tag === 'p') {
    // A <p> may contain an inline image among text → emit image then text.
    const innerImg = el.querySelector('img');
    if (innerImg && !isImageOnly(el)) {
      const block = makeImageBlock(innerImg);
      if (block) out.push(block);
    }
    const textBlock = makeTextBlock(el, 'normal');
    if (textBlock) out.push(textBlock);
    return;
  }

  if (FLATTEN_TAGS.has(tag)) {
    walkChildren(el, out);
    return;
  }

  if (tag === 'br' || tag === 'hr') return;

  // Fallback: treat as normal paragraph.
  const block = makeTextBlock(el, 'normal');
  if (block) out.push(block);
}

/** True when the element's only meaningful content is a single image. */
function isImageOnly(el: Element): boolean {
  if (!el.querySelector('img')) return false;
  const text = (el.textContent ?? '').replace(/\s+/g, '').trim();
  return text.length === 0;
}

function walkChildren(parent: Node, out: PtNode[]) {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === 3 /* TEXT */) {
      const text = (child.textContent ?? '').replace(/\s+/g, ' ');
      if (text.trim().length === 0) continue;
      out.push({
        _type: 'block',
        _key: key('b'),
        style: 'normal',
        markDefs: [],
        children: [{ _type: 'span', _key: key('s'), text: text.trim(), marks: [] }],
      });
      continue;
    }
    if (child.nodeType !== 1 /* ELEMENT */) continue;
    processBlockElement(child as Element, out);
  }
}

export interface ConvertResult {
  blocks: PtNode[];
  imageUrls: string[];
}

export function htmlToPortableText(html: string): ConvertResult {
  const cleaned = (html ?? '').trim();
  if (!cleaned) return { blocks: [], imageUrls: [] };

  const dom = new JSDOM(`<!DOCTYPE html><body>${cleaned}</body>`);
  const body = dom.window.document.body;

  const out: PtNode[] = [];
  walkChildren(body, out);

  const imageUrls = out
    .filter((b): b is PtImageBlock => b._type === 'imageBlock')
    .map((b) => b._srcUrl);

  return { blocks: out, imageUrls };
}

export function isImageBlock(node: PtNode): node is PtImageBlock {
  return node._type === 'imageBlock';
}
