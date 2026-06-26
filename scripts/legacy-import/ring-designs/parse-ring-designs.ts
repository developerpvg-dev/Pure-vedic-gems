import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import {
  buildDesignFromMetals,
  cleanCellValue,
  collectDesignNotes,
  normalizeMetalLabel,
  parseDesignBlockRows,
  parseMetalValue,
  type ParsedJewelryDesign,
} from '../jewelry-designs/parse-metal-values';
import {
  generateJewelrySqlSeed,
  type JewelryDesignRecord,
} from '../jewelry-designs/sql-format';
import { toJewelryDesignRecord } from '../jewelry-designs/build-records';

function sheetRows(sheet: XLSX.WorkSheet): string[][] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rows: string[][] = [];
  for (let r = 0; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = 0; c <= Math.min(range.e.c, 3); c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(cell && cell.v != null ? cleanCellValue(String(cell.v)) : '');
    }
    rows.push(row);
  }
  return rows;
}

export function parseRingDesignsFromWorkbook(wb: XLSX.WorkBook): ParsedJewelryDesign[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = sheetRows(sheet);
  const designs: ParsedJewelryDesign[] = [];

  for (let i = 0; i < rows.length; i++) {
    const designMatch = rows[i][0]?.match(/^Design-(\d+)$/i);
    if (!designMatch) continue;

    const designNum = Number(designMatch[1]);
    const metals = parseDesignBlockRows(rows, i, 1, 2, 3);
    designs.push(buildDesignFromMetals(designNum, metals));
  }

  return designs.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parseRingDesignsFromFile(filePath: string): ParsedJewelryDesign[] {
  const wb = XLSX.readFile(filePath, { sheetStubs: true });
  return parseRingDesignsFromWorkbook(wb);
}

export function extractDesignImages(xlsxPath: string, outputDir: string): Map<string, string> {
  const workspaceExtract = path.resolve(path.dirname(xlsxPath), '_xlsx_extract', 'xl', 'media');
  const mediaDir = fs.existsSync(workspaceExtract)
    ? workspaceExtract
    : path.join(outputDir, '_xlsx_media', 'xl', 'media');

  if (!fs.existsSync(mediaDir)) {
    throw new Error(`Media folder not found. Extract xlsx manually to _xlsx_extract`);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const mapping = new Map<string, string>();

  for (let i = 1; i <= 51; i++) {
    const candidates = [`image${i}.png`, `image${i}.jpeg`, `image${i}.jpg`];
    const source = candidates
      .map((name) => path.join(mediaDir, name))
      .find((candidate) => fs.existsSync(candidate));

    if (!source) continue;

    const ext = path.extname(source).toLowerCase();
    const targetName = `design-${i}${ext}`;
    fs.copyFileSync(source, path.join(outputDir, targetName));
    mapping.set(`design-${i}`, `/ring-designs/${targetName}`);
  }

  return mapping;
}

export function buildDesignRecords(
  designs: ParsedJewelryDesign[],
  imageMap: Map<string, string>
) {
  return designs.map((design) =>
    toJewelryDesignRecord(design, {
      setting_type: 'ring',
      image_url: imageMap.get(design.slug) ?? null,
      product_scope: 'gemstone',
    })
  );
}

export function generateSqlSeed(records: JewelryDesignRecord[]): string {
  return generateJewelrySqlSeed({
    headerLines: [
      '-- Ring designs migrated from PVG Ring Designs with metal 2026 (1).xlsx',
      '-- Labor: 22K/Platinum 20%, 18K/14K 25% (applied at pricing time on metal value)',
      '-- Run migration_jewelry_diamond_charges_2026.sql before this seed if the column is missing.',
    ],
    records,
    deactivate: { settingType: 'ring', namePattern: '^Design-[0-9]+$' },
  });
}

// Re-export for audit tooling
export { collectDesignNotes, normalizeMetalLabel, parseMetalValue };
