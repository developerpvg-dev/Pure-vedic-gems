/**
 * Streaming reader for MySQL/phpMyAdmin dump files (utf8mb4).
 *
 * Targets the format produced by phpMyAdmin 4.x:
 *   INSERT INTO `tbl` (`c1`, `c2`, ...) VALUES
 *   (v1, v2, ...),
 *   (v1, v2, ...);
 *
 * Assumptions verified against pugemved_indb.sql:
 *   - Each value tuple sits on its own physical line (newlines inside strings
 *     are escaped as `\n`, not real LF). One line = one row.
 *   - Strings use single quotes with backslash escapes: \' \\ \" \0 \n \r \t \Z
 *   - NULL is the literal token NULL (case-insensitive).
 *   - Numbers are bare digits/decimals (kept as strings; callers coerce).
 *
 * Any line that fails to parse is reported via `onSkip` and skipped, not
 * thrown — one malformed row must not kill the whole extract.
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

export type SqlValue = string | null;

export interface StreamWpTableOptions {
  filePath: string;
  tableName: string;
  filter?: (row: Record<string, SqlValue>) => boolean;
  onSkip?: (line: string, reason: string) => void;
}

export async function* streamWpTable(
  opts: StreamWpTableOptions,
): AsyncGenerator<Record<string, SqlValue>> {
  const stream = createReadStream(opts.filePath, { encoding: 'utf8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  const startRe = new RegExp(
    `^INSERT INTO \`${escapeRegex(opts.tableName)}\`\\s*\\(([^)]*)\\)\\s*VALUES\\s*$`,
    'i',
  );
  const startNoColsRe = new RegExp(
    `^INSERT INTO \`${escapeRegex(opts.tableName)}\`\\s*VALUES\\s*$`,
    'i',
  );

  let columns: string[] | null = null;
  let inBlock = false;

  for await (const rawLine of rl) {
    if (!inBlock) {
      const m = rawLine.match(startRe);
      if (m) {
        columns = m[1].split(',').map((c) => c.trim().replace(/^`|`$/g, ''));
        inBlock = true;
        continue;
      }
      if (startNoColsRe.test(rawLine)) {
        columns = null;
        inBlock = true;
      }
      continue;
    }

    const line = rawLine.trimEnd();
    if (line.length === 0) continue;

    let endsBlock = false;
    let payload = line;
    if (payload.endsWith(';')) {
      endsBlock = true;
      payload = payload.slice(0, -1).trimEnd();
    }
    if (payload.endsWith(',')) payload = payload.slice(0, -1).trimEnd();

    if (!payload.startsWith('(') || !payload.endsWith(')')) {
      opts.onSkip?.(rawLine, 'tuple did not start with ( and end with )');
      if (endsBlock) { inBlock = false; columns = null; }
      continue;
    }

    const inner = payload.slice(1, -1);
    let values: SqlValue[];
    try {
      values = parseTuple(inner);
    } catch (err) {
      opts.onSkip?.(rawLine, (err as Error).message);
      if (endsBlock) { inBlock = false; columns = null; }
      continue;
    }

    if (columns) {
      if (values.length !== columns.length) {
        opts.onSkip?.(rawLine, `tuple has ${values.length} values, expected ${columns.length}`);
      } else {
        const row: Record<string, SqlValue> = {};
        for (let i = 0; i < columns.length; i++) row[columns[i]] = values[i];
        if (!opts.filter || opts.filter(row)) yield row;
      }
    } else {
      const row: Record<string, SqlValue> = {};
      values.forEach((v, i) => (row[`c${i}`] = v));
      if (!opts.filter || opts.filter(row)) yield row;
    }

    if (endsBlock) { inBlock = false; columns = null; }
  }
}

export function parseTuple(inner: string): SqlValue[] {
  const out: SqlValue[] = [];
  let i = 0;
  const n = inner.length;

  while (i < n) {
    while (i < n && (inner[i] === ' ' || inner[i] === '\t')) i++;
    if (i >= n) break;

    const ch = inner[i];

    if (ch === "'") {
      i++;
      let buf = '';
      while (i < n) {
        const c = inner[i];
        if (c === '\\') {
          const next = inner[i + 1];
          switch (next) {
            case 'n': buf += '\n'; break;
            case 'r': buf += '\r'; break;
            case 't': buf += '\t'; break;
            case '0': buf += '\0'; break;
            case 'Z': buf += '\x1a'; break;
            case '\\': buf += '\\'; break;
            case "'": buf += "'"; break;
            case '"': buf += '"'; break;
            case 'b': buf += '\b'; break;
            default: buf += next ?? '';
          }
          i += 2;
        } else if (c === "'") {
          if (inner[i + 1] === "'") { buf += "'"; i += 2; }
          else { i++; break; }
        } else {
          buf += c;
          i++;
        }
      }
      out.push(buf);
    } else {
      let buf = '';
      while (i < n && inner[i] !== ',') {
        buf += inner[i];
        i++;
      }
      const trimmed = buf.trim();
      out.push(trimmed.toUpperCase() === 'NULL' ? null : trimmed);
    }

    while (i < n && (inner[i] === ' ' || inner[i] === '\t')) i++;
    if (i < n && inner[i] === ',') i++;
  }

  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------- Typed row helpers ----------

export interface WpPost {
  ID: number;
  post_author: number;
  post_date_gmt: string;
  post_modified_gmt: string;
  post_content: string;
  post_title: string;
  post_excerpt: string;
  post_status: string;
  post_name: string;
  post_parent: number;
  post_type: string;
  post_mime_type: string;
  menu_order: number;
  guid: string;
}

export interface WpPostMeta {
  meta_id: number;
  post_id: number;
  meta_key: string;
  meta_value: string | null;
}

export interface WpTerm {
  term_id: number;
  name: string;
  slug: string;
  term_group: number;
}

export interface WpTermTaxonomy {
  term_taxonomy_id: number;
  term_id: number;
  taxonomy: string;
  description: string;
  parent: number;
  count: number;
}

export interface WpTermRelationship {
  object_id: number;
  term_taxonomy_id: number;
  term_order: number;
}

export function toWpPost(row: Record<string, SqlValue>): WpPost {
  return {
    ID: num(row.ID),
    post_author: num(row.post_author),
    post_date_gmt: str(row.post_date_gmt),
    post_modified_gmt: str(row.post_modified_gmt),
    post_content: str(row.post_content),
    post_title: str(row.post_title),
    post_excerpt: str(row.post_excerpt),
    post_status: str(row.post_status),
    post_name: str(row.post_name),
    post_parent: num(row.post_parent),
    post_type: str(row.post_type),
    post_mime_type: str(row.post_mime_type),
    menu_order: num(row.menu_order),
    guid: str(row.guid),
  };
}

export const toWpPostMeta = (row: Record<string, SqlValue>): WpPostMeta => ({
  meta_id: num(row.meta_id),
  post_id: num(row.post_id),
  meta_key: str(row.meta_key),
  meta_value: row.meta_value,
});

export const toWpTerm = (row: Record<string, SqlValue>): WpTerm => ({
  term_id: num(row.term_id),
  name: str(row.name),
  slug: str(row.slug),
  term_group: num(row.term_group),
});

export const toWpTermTaxonomy = (row: Record<string, SqlValue>): WpTermTaxonomy => ({
  term_taxonomy_id: num(row.term_taxonomy_id),
  term_id: num(row.term_id),
  taxonomy: str(row.taxonomy),
  description: str(row.description),
  parent: num(row.parent),
  count: num(row.count),
});

export const toWpTermRelationship = (row: Record<string, SqlValue>): WpTermRelationship => ({
  object_id: num(row.object_id),
  term_taxonomy_id: num(row.term_taxonomy_id),
  term_order: num(row.term_order),
});

function num(v: SqlValue): number {
  if (v === null || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function str(v: SqlValue): string {
  return v ?? '';
}
