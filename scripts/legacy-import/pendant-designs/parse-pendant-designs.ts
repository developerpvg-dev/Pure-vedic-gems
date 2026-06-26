import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import {
  buildDesignFromMetals,
  cleanCellValue,
  parseDesignBlockRows,
  type ParsedJewelryDesign,
} from '../jewelry-designs/parse-metal-values';
import {
  generateJewelrySqlSeed,
} from '../jewelry-designs/sql-format';
import { toJewelryDesignRecord } from '../jewelry-designs/build-records';

/** Pendant sheet uses 5 side-by-side design blocks (A, E, I, M, Q). */
const PENDANT_BLOCK_COLUMNS = [0, 4, 8, 12, 16];

function sheetRows(sheet: XLSX.WorkSheet): string[][] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rows: string[][] = [];
  for (let r = 0; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = 0; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(cell && cell.v != null ? cleanCellValue(String(cell.v)) : '');
    }
    rows.push(row);
  }
  return rows;
}

export function parsePendantDesignsFromWorkbook(wb: XLSX.WorkBook): ParsedJewelryDesign[] {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = sheetRows(sheet);
  const designs: ParsedJewelryDesign[] = [];

  for (let i = 0; i < rows.length; i++) {
    for (const blockCol of PENDANT_BLOCK_COLUMNS) {
      const designMatch = rows[i][blockCol]?.match(/^Design-(\d+)$/i);
      if (!designMatch) continue;

      const designNum = Number(designMatch[1]);
      const metals = parseDesignBlockRows(rows, i, blockCol + 1, blockCol + 2, blockCol + 3);
      designs.push(buildDesignFromMetals(designNum, metals));
    }
  }

  return designs.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parsePendantDesignsFromFile(filePath: string): ParsedJewelryDesign[] {
  const wb = XLSX.readFile(filePath, { sheetStubs: true });
  return parsePendantDesignsFromWorkbook(wb);
}

export function extractPendantImages(xlsxPath: string, outputDir: string): Map<string, string> {
  const workspaceExtract = path.resolve(path.dirname(xlsxPath), '_pendant_xlsx_extract', 'xl', 'media');
  const mediaDir = fs.existsSync(workspaceExtract)
    ? workspaceExtract
    : path.join(outputDir, '_xlsx_media', 'xl', 'media');

  if (!fs.existsSync(mediaDir)) {
    throw new Error(
      `Pendant media folder not found at ${mediaDir}. Extract the xlsx zip to _pendant_xlsx_extract first.`
    );
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
    const targetPath = path.join(outputDir, targetName);
    fs.copyFileSync(source, targetPath);
    mapping.set(`design-${i}`, `/pendant-designs/${targetName}`);
  }

  return mapping;
}

export function buildPendantRecords(
  designs: ParsedJewelryDesign[],
  imageMap: Map<string, string>
) {
  return designs.map((design) =>
    toJewelryDesignRecord(design, {
      setting_type: 'pendant',
      image_url: imageMap.get(design.slug) ?? null,
      product_scope: 'gemstone',
    })
  );
}

export function generatePendantSqlSeed(records: ReturnType<typeof buildPendantRecords>): string {
  return generateJewelrySqlSeed({
    headerLines: [
      '-- Pendant designs migrated from pandant design pvg2026 (3).xlsx',
      '-- Labor: 22K/Platinum 20%, 18K/14K 25% (applied at pricing time on metal value)',
      '-- Run migration_ring_design_metals_2026.sql first if gold_14k / panchdhatu_with_gold are missing.',
      '-- Run migration_jewelry_diamond_charges_2026.sql before this seed if the column is missing.',
    ],
    records,
    deactivate: { settingType: 'pendant', namePattern: '^Design-[0-9]+$' },
  });
}
