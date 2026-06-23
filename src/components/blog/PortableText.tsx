'use client';

import Image from 'next/image';
import { urlFor } from '@/lib/sanity/client';

/* ─────────────────────────────────────────────────────────────────────────
 *  Lightweight Portable Text renderer for blog body content.
 *  Handles: blocks (p, h1-h4, blockquote), marks (strong, em, underline,
 *  code, link), lists (bullet/number), and images.
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

function renderMarks(span: Span, markDefs: MarkDef[] = []) {
  let node: React.ReactNode = span.text ?? '';
  if (!span.marks?.length) return node;

  for (const mark of span.marks) {
    const def = markDefs.find((d) => d._key === mark);
    if (def?._type === 'link' && def.href) {
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

function renderChildren(children: Span[] = [], markDefs: MarkDef[] = []) {
  return children.map((span, i) => (
    <span key={span._key ?? i}>{renderMarks(span, markDefs)}</span>
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
  const children = renderChildren(block.children, block.markDefs);
  const headingId = slugifyHeading(getPlainText(block.children));
  switch (block.style) {
    case 'h1':
      return <h1 id={headingId}>{children}</h1>;
    case 'h2':
      return <h2 id={headingId}>{children}</h2>;
    case 'h3':
      return <h3 id={headingId}>{children}</h3>;
    case 'h4':
      return <h4 id={headingId}>{children}</h4>;
    case 'blockquote':
      return <blockquote>{children}</blockquote>;
    default:
      return <p>{children}</p>;
  }
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

        // Text block
        if (block._type === 'block') {
          return <div key={block._key ?? i}>{renderBlock(block)}</div>;
        }

        return null;
      })}
    </div>
  );
}
