/**
 * Minimal RFC-style CSV parser (handles quoted fields, escaped quotes, multiline records).
 */
export function parseCsvLine(line: string): string[] {
  const records = parseCsvContent(line.endsWith('\n') ? line : `${line}\n`);
  return records[0] ?? [];
}

export function parseCsvContent(content: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (inQuotes) {
      if (char === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n' || char === '\r') {
      if (char === '\r' && content[index + 1] === '\n') {
        index += 1;
      }
      row.push(field);
      field = '';
      if (row.some((value) => value.length > 0)) {
        records.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  return records;
}
