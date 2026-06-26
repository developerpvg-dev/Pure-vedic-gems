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

const BRACELET_SHEET_NAMES = ['Bracelete Designs', 'Bracelet Designs'];

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

function getBraceletSheet(wb: XLSX.WorkBook): XLSX.WorkSheet {
  for (const name of BRACELET_SHEET_NAMES) {
    if (wb.Sheets[name]) return wb.Sheets[name];
  }
  throw new Error(`Bracelet sheet not found. Expected one of: ${BRACELET_SHEET_NAMES.join(', ')}`);
}

export function parseBraceletDesignsFromWorkbook(wb: XLSX.WorkBook): ParsedJewelryDesign[] {
  const sheet = getBraceletSheet(wb);
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

export function parseBraceletDesignsFromFile(filePath: string): ParsedJewelryDesign[] {
  const wb = XLSX.readFile(filePath, { sheetStubs: true });
  return parseBraceletDesignsFromWorkbook(wb);
}

function resolveMediaDir(xlsxPath: string): string {
  const candidates = [
    path.resolve(path.dirname(xlsxPath), '_pendant_xlsx_extract', 'xl', 'media'),
    path.resolve(path.dirname(xlsxPath), '_xlsx_extract', 'xl', 'media'),
  ];
  const mediaDir = candidates.find((dir) => fs.existsSync(dir));
  if (!mediaDir) {
    throw new Error('Bracelet media folder not found. Extract the xlsx zip to _pendant_xlsx_extract first.');
  }
  return mediaDir;
}

/** Bracelet images live on drawing2 (image30.jpeg …). Map by anchor order → design number. */
function braceletImageFiles(xlsxPath: string): string[] {
  const extractRoot = path.resolve(path.dirname(xlsxPath), '_pendant_xlsx_extract');
  const drawingPath = path.join(extractRoot, 'xl', 'drawings', 'drawing2.xml');
  const relsPath = path.join(extractRoot, 'xl', 'drawings', '_rels', 'drawing2.xml.rels');

  if (!fs.existsSync(drawingPath) || !fs.existsSync(relsPath)) {
    return [];
  }

  const drawingXml = fs.readFileSync(drawingPath, 'utf8');
  const relsXml = fs.readFileSync(relsPath, 'utf8');
  const relMap = new Map<string, string>();
  for (const match of relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="\.\.\/media\/([^"]+)"/g)) {
    relMap.set(match[1], match[2]);
  }

  const files: string[] = [];
  for (const match of drawingXml.matchAll(/r:embed="(rId\d+)"/g)) {
    const file = relMap.get(match[1]);
    if (file) files.push(file);
  }
  return files;
}

export function extractBraceletImages(xlsxPath: string, outputDir: string): Map<string, string> {
  const mediaDir = resolveMediaDir(xlsxPath);
  const orderedFiles = braceletImageFiles(xlsxPath);

  fs.mkdirSync(outputDir, { recursive: true });
  const mapping = new Map<string, string>();

  orderedFiles.forEach((fileName, index) => {
    const designNum = index + 1;
    const source = path.join(mediaDir, fileName);
    if (!fs.existsSync(source)) return;

    const ext = path.extname(fileName).toLowerCase();
    const targetName = `design-${designNum}${ext}`;
    fs.copyFileSync(source, path.join(outputDir, targetName));
    mapping.set(`design-${designNum}`, `/bracelet-designs/${targetName}`);
  });

  // Fallback: image30..image34 if drawing parse fails
  if (mapping.size === 0) {
    for (let i = 30; i <= 41; i++) {
      const candidates = [`image${i}.jpeg`, `image${i}.jpg`, `image${i}.png`];
      const source = candidates
        .map((name) => path.join(mediaDir, name))
        .find((candidate) => fs.existsSync(candidate));
      if (!source) continue;

      const designNum = i - 29;
      const ext = path.extname(source).toLowerCase();
      const targetName = `design-${designNum}${ext}`;
      fs.copyFileSync(source, path.join(outputDir, targetName));
      mapping.set(`design-${designNum}`, `/bracelet-designs/${targetName}`);
    }
  }

  return mapping;
}

export function buildBraceletRecords(
  designs: ParsedJewelryDesign[],
  imageMap: Map<string, string>
) {
  return designs.map((design) =>
    toJewelryDesignRecord(design, {
      setting_type: 'bracelet',
      image_url: imageMap.get(design.slug) ?? null,
      product_scope: 'gemstone',
    })
  );
}

export function generateBraceletSqlSeed(records: ReturnType<typeof buildBraceletRecords>): string {
  return generateJewelrySqlSeed({
    headerLines: [
      '-- Bracelet designs migrated from pandant design pvg2026 (3).xlsx → Bracelete Designs sheet',
      '-- Labor: 22K/Platinum 20%, 18K/14K 25% (applied at pricing time on metal value)',
    ],
    records,
    deactivate: { settingType: 'bracelet', namePattern: '^Design-[0-9]+$' },
  });
}
