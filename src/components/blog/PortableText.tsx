'use client';

import Image from 'next/image';
import { urlFor } from '@/lib/sanity/client';
import { youtubeEmbedFromText } from '@/lib/blog/youtube-embed';
import './portable-text.css';

/* ─────────────────────────────────────────────────────────────────────────
 *  Lightweight Portable Text renderer for blog body content.
 *  Handles: blocks (p, h1-h4, blockquote), marks (strong, em, underline,
 *  code, link), lists (bullet/number), images, and @sanity/table blocks.
 * ────────────────────────────────────────────────────────────────────────*/

interface Block {
  _type: string;
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: Span[];
  markDefs?: MarkDef[];
  asset?: { _ref: string };
  alt?: string;
  caption?: string;
  rows?: TableRow[];
}

interface TableRow {
  _key?: string;
  cells?: string[];
}

interface Span {
  _type: string;
  _key?: string;
  text?: string;
  marks?: string[];
}

interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
}

function renderMarks(span: Span, markDefs: MarkDef[] = [], allowLinks = true) {
  let node: React.ReactNode = span.text ?? '';
  if (!span.marks?.length) return node;

  for (const mark of span.marks) {
    const def = markDefs.find((d) => d._key === mark);
    if (allowLinks && def?._type === 'link' && def.href) {
      node = (
        <a
          href={def.href}
          target={def.href.startsWith('http') ? '_blank' : undefined}
          rel={def.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {node}
        </a>
      );
    } else if (mark === 'strong') {
      node = <strong>{node}</strong>;
    } else if (mark === 'em') {
      node = <em>{node}</em>;
    } else if (mark === 'underline') {
      node = <u>{node}</u>;
    } else if (mark === 'code') {
      node = <code>{node}</code>;
    }
  }
  return node;
}

function renderChildren(children: Span[] = [], markDefs: MarkDef[] = [], allowLinks = true) {
  return children.map((span, i) => (
    <span key={span._key ?? i}>{renderMarks(span, markDefs, allowLinks)}</span>
  ));
}

function getPlainText(children: Span[] = []) {
  return children.map((child) => child.text ?? '').join('');
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function renderBlock(block: Block) {
  const isHeading = block.style?.startsWith('h');
  const children = renderChildren(block.children, block.markDefs, !isHeading);
  const headingId = slugifyHeading(getPlainText(block.children));
  switch (block.style) {
    case 'h1':
      return <h2 id={headingId}>{children}</h2>;
    case 'h2':
      return <h2 id={headingId}>{children}</h2>;
    case 'h3':
      return <h3 id={headingId}>{children}</h3>;
    case 'h4':
      return <h4 id={headingId}>{children}</h4>;
    case 'blockquote':
      return <blockquote>{children}</blockquote>;
    default: {
      const embed = youtubeEmbedFromText(getPlainText(block.children));
      if (embed) {
        return (
          <>
            {embed.rest ? <p>{embed.rest}</p> : null}
            <div className={embed.portrait ? 'prose-pvg-yt prose-pvg-yt--short' : 'prose-pvg-yt'}>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${embed.id}`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </>
        );
      }
      return <p>{children}</p>;
    }
  }
}

/** @sanity/table stores plain strings; first row is the header. */
function renderTableFromRows(rows: string[][], key: string | number) {
  if (!rows.length) return null;
  const [header, ...body] = rows;
  return (
    <div key={key} className="prose-pvg-table-wrap">
      <table>
        {header ? (
          <thead>
            <tr>
              {header.map((cell, i) => (
                <th key={i}>{cell}</th>
              ))}
            </tr>
          </thead>
        ) : null}
        {body.length > 0 ? (
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>
    </div>
  );
}

function renderTable(block: Block, key: string | number) {
  const rows = (block.rows ?? [])
    .filter((row) => Array.isArray(row.cells))
    .map((row) => row.cells ?? []);
  return renderTableFromRows(rows, key);
}

/** Split a GFM table cell row (`| a | b |`) into cells. */
function splitPipeRow(segment: string): string[] {
  return segment
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function isPipeSeparator(segment: string): boolean {
  const cells = splitPipeRow(segment);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

/**
 * Already-published BLG posts joined GFM tables into one paragraph.
 * Recover `| Setting | … | |---|---| | Sterling | … |` into a real table.
 */
function tryRecoverPipeTable(text: string): { before: string; rows: string[][]; after: string } | null {
  if (!text.includes('|') || !/\|[\t ]*-{3,}/.test(text)) return null;

  // Split on pipe-row boundaries: " | | " between rows when joiner was " ".
  const parts = text.split(/\s*\|\s*\|\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  // Find the separator row, then rebuild header + body.
  let sepIdx = -1;
  for (let i = 0; i < parts.length; i += 1) {
    const candidate = parts[i].includes('|') ? parts[i] : `|${parts[i]}|`;
    if (isPipeSeparator(candidate)) {
      sepIdx = i;
      break;
    }
  }
  if (sepIdx < 1) return null;

  const headerRaw = parts[sepIdx - 1];
  // Leading prose may sit before the first pipe on the header segment.
  const firstPipe = headerRaw.indexOf('|');
  const before =
    firstPipe > 0
      ? headerRaw.slice(0, firstPipe).trim()
      : sepIdx >= 2
        ? parts.slice(0, sepIdx - 1).join(' ').trim()
        : '';
  const headerCells = splitPipeRow(firstPipe >= 0 ? headerRaw.slice(firstPipe) : `|${headerRaw}|`);
  if (headerCells.length < 2) return null;

  const rows: string[][] = [headerCells];
  for (let i = sepIdx + 1; i < parts.length; i += 1) {
    const segment = parts[i];
    if (!segment.includes('|') && !/^\S/.test(segment)) continue;
    // Trailing prose after the last table row (no more pipes).
    if (!segment.includes('|') && rows.length > 1) {
      return { before, rows, after: parts.slice(i).join(' ').trim() };
    }
    const cells = splitPipeRow(segment.includes('|') ? segment : `|${segment}|`);
    if (cells.length >= 2 && !isPipeSeparator(segment.includes('|') ? segment : `|${segment}|`)) {
      rows.push(cells);
    }
  }
  if (rows.length < 2) return null;
  return { before, rows, after: '' };
}

/** Group consecutive list items of the same type */
function groupLists(blocks: Block[]): (Block | { _type: 'list'; listItem: string; items: Block[] })[] {
  const result: (Block | { _type: 'list'; listItem: string; items: Block[] })[] = [];
  let currentList: { _type: 'list'; listItem: string; items: Block[] } | null = null;

  for (const block of blocks) {
    if (block.listItem) {
      if (currentList && currentList.listItem === block.listItem) {
        currentList.items.push(block);
      } else {
        currentList = { _type: 'list', listItem: block.listItem, items: [block] };
        result.push(currentList);
      }
    } else {
      currentList = null;
      result.push(block);
    }
  }
  return result;
}

export function PortableText({ value }: { value: unknown[] | undefined | null }) {
  if (!value || !Array.isArray(value)) return null;

  const grouped = groupLists(value as Block[]);

  return (
    <div className="prose-pvg">
      {grouped.map((item, i) => {
        if ('items' in item && item._type === 'list') {
          const Tag = item.listItem === 'number' ? 'ol' : 'ul';
          const listClass = item.listItem === 'number' ? 'list-decimal' : 'list-disc';
          return (
            <Tag key={i} className={listClass}>
              {item.items.map((li, j) => (
                <li key={li._key ?? j}>{renderChildren(li.children, li.markDefs)}</li>
              ))}
            </Tag>
          );
        }

        const block = item as Block;

        // Image block (both inline 'image' and named 'imageBlock' shapes)
        if ((block._type === 'image' || block._type === 'imageBlock') && block.asset) {
          const src = urlFor(block as unknown as Parameters<typeof urlFor>[0])
            .width(800)
            .quality(80)
            .auto('format')
            .url();
          return (
            <figure key={block._key ?? i}>
              <Image
                src={src}
                alt={block.alt || ''}
                width={800}
                height={450}
              />
              {block.caption && <figcaption>{block.caption}</figcaption>}
            </figure>
          );
        }

        if (block._type === 'table') {
          return renderTable(block, block._key ?? i);
        }

        // Text block — recover pipe tables flattened into one paragraph by older BLG ingest.
        if (block._type === 'block') {
          if (!block.listItem && (!block.style || block.style === 'normal')) {
            const plain = getPlainText(block.children);
            const recovered = tryRecoverPipeTable(plain);
            if (recovered) {
              return (
                <div key={block._key ?? i}>
                  {recovered.before ? <p>{recovered.before}</p> : null}
                  {renderTableFromRows(recovered.rows, `${block._key ?? i}-tbl`)}
                  {recovered.after ? <p>{recovered.after}</p> : null}
                </div>
              );
            }
          }
          return <div key={block._key ?? i}>{renderBlock(block)}</div>;
        }

        return null;
      })}
    </div>
  );
}
