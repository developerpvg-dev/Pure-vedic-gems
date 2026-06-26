import fs from 'node:fs';
import path from 'node:path';
import XLSX from 'xlsx';
import {
  buildCustomDesign,
  cleanCellValue,
  normalizeMetalLabel,
  parseMetalValue,
  type ParsedJewelryDesign,
} from '../jewelry-designs/parse-metal-values';
import {
  generateJewelrySqlSeed,
} from '../jewelry-designs/sql-format';
import { toJewelryDesignRecord } from '../jewelry-designs/build-records';

const RUDRAKSHA_SHEET_NAMES = ['Sheet1', 'Rudraksha Designs', 'Rudraksha'];

type RudrakshaCategory =
  | 'one_mukhi'
  | 'standard_mukhi'
  | 'multiple_beads';

type RudrakshaBlock = {
  startRow: number;
  category: RudrakshaCategory;
  categoryLabel: string;
  metals: ReturnType<typeof parseMetalValue>[];
};

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

function getRudrakshaSheet(wb: XLSX.WorkBook): XLSX.WorkSheet {
  for (const name of RUDRAKSHA_SHEET_NAMES) {
    if (wb.Sheets[name]) return wb.Sheets[name];
  }
  throw new Error(`Rudraksha sheet not found. Expected one of: ${RUDRAKSHA_SHEET_NAMES.join(', ')}`);
}

function classifyCategoryHeader(header: string): { category: RudrakshaCategory; label: string } {
  const normalized = header.trim();
  const upper = normalized.toUpperCase();

  if (/^ONE\s+MUKHI$/i.test(normalized)) {
    return { category: 'one_mukhi', label: 'One Mukhi Rudraksha mounting' };
  }
  if (/2\s+MUKHI/i.test(upper) && /GANESH/i.test(upper)) {
    return {
      category: 'standard_mukhi',
      label: '2 to 17 Mukhi, Ganesh & Gauri Shankar (round & oval shapes)',
    };
  }
  if (/MULTIPLE\s+RUDRAKSHA/i.test(upper)) {
    return {
      category: 'multiple_beads',
      label: 'Multiple Rudraksha combinations (3 or more beads)',
    };
  }

  return { category: 'multiple_beads', label: normalized };
}

function isSectionHeader(rows: string[][], rowIndex: number): string | null {
  const colA = rows[rowIndex][0]?.trim() ?? '';
  const colB = rows[rowIndex][1]?.trim() ?? '';
  if (!colA || colB) return null;
  if (normalizeMetalLabel(colA)) return null;
  if (/^Design-\d+$/i.test(colA)) return null;
  return colA;
}

function parseMetalBlock(rows: string[][], startRow: number) {
  const metals = [];
  for (let j = startRow; j < rows.length && j <= startRow + 6; j++) {
    const metalLabel = rows[j][1]?.trim() ?? '';
    if (!metalLabel) break;
    const mapped = normalizeMetalLabel(metalLabel);
    if (!mapped) break;
    metals.push(parseMetalValue(mapped.slug, rows[j][2] ?? '', rows[j][3]));
  }
  return metals;
}

function designNameFor(category: RudrakshaCategory, styleNum: number): string {
  if (category === 'one_mukhi') return 'Rudraksha - One Mukhi';
  if (category === 'standard_mukhi') {
    return 'Rudraksha - 2 to 17 Mukhi, Ganesh & Gauri Shankar';
  }
  return styleNum === 1
    ? 'Rudraksha - Multiple Beads (3+)'
    : `Rudraksha - Multiple Beads (3+) - Style ${styleNum}`;
}

function slugFor(sortOrder: number): string {
  return `rudraksha-design-${sortOrder}`;
}

export function parseRudrakshaBlocksFromRows(rows: string[][]): RudrakshaBlock[] {
  const blocks: RudrakshaBlock[] = [];
  let currentCategory: RudrakshaCategory = 'multiple_beads';
  let currentCategoryLabel = 'Multiple Rudraksha combinations (3 or more beads)';

  for (let i = 0; i < rows.length; i++) {
    const header = isSectionHeader(rows, i);
    if (header) {
      const classified = classifyCategoryHeader(header);
      currentCategory = classified.category;
      currentCategoryLabel = classified.label;
      continue;
    }

    if ((rows[i][1]?.trim() ?? '').toLowerCase() !== 'silver') continue;

    const metals = parseMetalBlock(rows, i);
    if (metals.length === 0) continue;

    blocks.push({
      startRow: i,
      category: currentCategory,
      categoryLabel: currentCategoryLabel,
      metals,
    });
  }

  return blocks;
}

export function parseRudrakshaDesignsFromWorkbook(wb: XLSX.WorkBook): ParsedJewelryDesign[] {
  const sheet = getRudrakshaSheet(wb);
  const rows = sheetRows(sheet);
  const blocks = parseRudrakshaBlocksFromRows(rows);

  const multipleStyleCounter: Record<RudrakshaCategory, number> = {
    one_mukhi: 0,
    standard_mukhi: 0,
    multiple_beads: 0,
  };

  return blocks.map((block, index) => {
    const sortOrder = index + 1;
    multipleStyleCounter[block.category] += 1;
    const styleNum = multipleStyleCounter[block.category];
    return buildCustomDesign({
      name: designNameFor(block.category, styleNum),
      slug: slugFor(sortOrder),
      sortOrder,
      metals: block.metals,
      notes: [block.categoryLabel],
      productScope: 'rudraksha',
      rudrakshaCategory: block.category,
    });
  });
}

export function parseRudrakshaDesignsFromFile(filePath: string): ParsedJewelryDesign[] {
  const wb = XLSX.readFile(filePath, { sheetStubs: true });
  return parseRudrakshaDesignsFromWorkbook(wb);
}

function resolveMediaDir(xlsxPath: string): string {
  const candidates = [
    path.resolve(path.dirname(xlsxPath), '_pendant_xlsx_extract', 'xl', 'media'),
    path.resolve(path.dirname(xlsxPath), '_xlsx_extract', 'xl', 'media'),
  ];
  const mediaDir = candidates.find((dir) => fs.existsSync(dir));
  if (!mediaDir) {
    throw new Error('Rudraksha media folder not found. Extract the xlsx zip to _pendant_xlsx_extract first.');
  }
  return mediaDir;
}

/** Rudraksha images live on drawing3 (image42.jpeg … image51). Sorted by anchor row → design order. */
function rudrakshaImageFiles(xlsxPath: string): string[] {
  const extractRoot = path.resolve(path.dirname(xlsxPath), '_pendant_xlsx_extract');
  const drawingPath = path.join(extractRoot, 'xl', 'drawings', 'drawing3.xml');
  const relsPath = path.join(extractRoot, 'xl', 'drawings', '_rels', 'drawing3.xml.rels');

  if (!fs.existsSync(drawingPath) || !fs.existsSync(relsPath)) {
    return [];
  }

  const drawingXml = fs.readFileSync(drawingPath, 'utf8');
  const relsXml = fs.readFileSync(relsPath, 'utf8');
  const relMap = new Map<string, string>();
  for (const match of relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="\.\.\/media\/([^"]+)"/g)) {
    relMap.set(match[1], match[2]);
  }

  const anchored: Array<{ row: number; file: string }> = [];
  for (const match of drawingXml.matchAll(/<xdr:row>(\d+)<\/xdr:row>[\s\S]*?r:embed="(rId\d+)"/g)) {
    const file = relMap.get(match[2]);
    if (file) anchored.push({ row: Number(match[1]), file });
  }

  anchored.sort((a, b) => a.row - b.row);
  return anchored.map((entry) => entry.file);
}

export function extractRudrakshaImages(xlsxPath: string, outputDir: string): Map<string, string> {
  const mediaDir = resolveMediaDir(xlsxPath);
  const orderedFiles = rudrakshaImageFiles(xlsxPath);

  fs.mkdirSync(outputDir, { recursive: true });
  const mapping = new Map<string, string>();

  orderedFiles.forEach((fileName, index) => {
    const sortOrder = index + 1;
    const source = path.join(mediaDir, fileName);
    if (!fs.existsSync(source)) return;

    const ext = path.extname(fileName).toLowerCase();
    const targetName = `design-${sortOrder}${ext}`;
    fs.copyFileSync(source, path.join(outputDir, targetName));
    mapping.set(slugFor(sortOrder), `/rudraksha-designs/${targetName}`);
  });

  if (mapping.size === 0) {
    for (let i = 42; i <= 51; i++) {
      const candidates = [`image${i}.jpeg`, `image${i}.jpg`, `image${i}.png`];
      const source = candidates
        .map((name) => path.join(mediaDir, name))
        .find((candidate) => fs.existsSync(candidate));
      if (!source) continue;

      const sortOrder = i - 41;
      const ext = path.extname(source).toLowerCase();
      const targetName = `design-${sortOrder}${ext}`;
      fs.copyFileSync(source, path.join(outputDir, targetName));
      mapping.set(slugFor(sortOrder), `/rudraksha-designs/${targetName}`);
    }
  }

  return mapping;
}

export function buildRudrakshaRecords(
  designs: ParsedJewelryDesign[],
  imageMap: Map<string, string>
) {
  return designs.map((design) =>
    toJewelryDesignRecord(design, {
      setting_type: 'pendant',
      image_url: imageMap.get(design.slug) ?? null,
      product_scope: 'rudraksha',
      rudraksha_category: design.rudrakshaCategory ?? null,
    })
  );
}

export function generateRudrakshaSqlSeed(records: ReturnType<typeof buildRudrakshaRecords>): string {
  return generateJewelrySqlSeed({
    headerLines: [
      '-- Rudraksha jewelry designs migrated from pandant design pvg2026 (3).xlsx → Sheet1',
      '-- Labor: 22K 20%, 14K/18K 25% (applied at pricing time on metal value)',
      '-- setting_type pendant: Rudraksha mountings shown in pendant design picker',
    ],
    records,
    deactivate: { nameLike: 'Rudraksha - %' },
  });
}
