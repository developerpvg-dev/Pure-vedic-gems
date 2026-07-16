import { describe, expect, it } from 'vitest';
import { buildDraftProductFromErpTag, buildErpSyncReport } from '@/lib/erp/sync';
import { buildPrefillFromErpRow, buildProductFormUrl, suggestErpProductKind } from '@/lib/erp/erp-prefill';
import { parseMmiStockExcel } from '@/lib/erp/excel-import';
import { suggestStockCategoryFromFilename } from '@/lib/erp/stock-categories';
import { effectiveProductTag, normalizeTagNumber } from '@/lib/erp/erp-utils';
import * as XLSX from 'xlsx';

describe('normalizeTagNumber', () => {
  it('uppercases and trims', () => {
    expect(normalizeTagNumber(' a306 ')).toBe('A306');
  });

  it('strips trailing dots from legacy SKUs', () => {
    expect(normalizeTagNumber('Q419..')).toBe('Q419');
    expect(effectiveProductTag({ tag_number: null, sku: 'A682...' })).toBe('A682');
  });
});

describe('buildErpSyncReport', () => {
  it('flags ERP-only in-stock tags and website-only tags', () => {
    const report = buildErpSyncReport(
      [
        {
          tgno: 'DK1',
          tsno: 1,
          ino: 10,
          idesc: 'Diamond Bangle',
          erp_stock: 1,
          remarks: null,
          tpre: null,
          cost_damt: 1000,
          cost_samt: 0,
          cost_mamt: 0,
          stock_category: 'jewellery',
        },
      ],
      [
        {
          id: 'p1',
          tag_number: 'dk1',
          name: 'Bangle',
          in_stock: true,
          stock_quantity: 1,
          availability_status: 'in_stock',
          is_active: true,
          sold_individually: true,
        },
        {
          id: 'p2',
          tag_number: 'WEB-ONLY',
          name: 'Website only',
          in_stock: true,
          stock_quantity: 1,
          availability_status: 'in_stock',
          is_active: true,
          sold_individually: true,
        },
      ],
      { syncedAt: null, pendingOutbound: 0 }
    );

    expect(report.matchedInStock).toBe(1);
    expect(report.missingOnWebsite).toHaveLength(0);
    expect(report.orphansOnWebsite).toHaveLength(1);
    expect(report.stockMismatches.some((row) => row.tgno === 'WEB-ONLY')).toBe(false);
  });

  it('matches website products via SKU when tag_number is empty', () => {
    const report = buildErpSyncReport(
      [
        {
          tgno: 'Q419',
          tsno: 1,
          ino: 1,
          idesc: 'Yellow Sapphire',
          erp_stock: 1,
          remarks: null,
          tpre: null,
          cost_damt: 0,
          cost_samt: 0,
          cost_mamt: 0,
          stock_category: 'sapphire',
        },
      ],
      [
        {
          id: 'p1',
          tag_number: null,
          sku: 'Q419..',
          name: 'Yellow Sapphire',
          in_stock: true,
          stock_quantity: 1,
          availability_status: 'in_stock',
          is_active: true,
          sold_individually: true,
          category: 'navaratna',
        },
      ],
      { syncedAt: null, pendingOutbound: 0 }
    );
    expect(report.matchedInStock).toBe(1);
    expect(report.missingOnWebsite).toHaveLength(0);
    expect(report.orphansOnWebsite).toHaveLength(0);
  });

  it('flags sold-offline still live mismatch', () => {
    const report = buildErpSyncReport(
      [
        {
          tgno: 'A1',
          tsno: 1,
          ino: 1,
          idesc: 'Ruby',
          erp_stock: 2,
          remarks: null,
          tpre: null,
          cost_damt: 0,
          cost_samt: 0,
          cost_mamt: 0,
          stock_category: 'ruby',
        },
      ],
      [
        {
          id: 'p1',
          tag_number: 'A1',
          name: 'Ruby',
          in_stock: true,
          stock_quantity: 1,
          availability_status: 'in_stock',
          is_active: true,
          sold_individually: true,
        },
      ],
      { syncedAt: null, pendingOutbound: 0 }
    );
    expect(report.counts?.soldOfflineStillLive).toBe(1);
    expect(report.stockMismatches[0]?.stockCategory).toBe('ruby');
  });
});

describe('suggestErpProductKind', () => {
  it('suggests navratna for ruby items', () => {
    expect(suggestErpProductKind('Natural Ruby Manik')).toBe('navratna');
  });

  it('suggests rudraksha for mukhi items', () => {
    expect(suggestErpProductKind('5 Mukhi Rudraksha')).toBe('rudraksha');
  });

  it('suggests jewellery for bangles', () => {
    expect(suggestErpProductKind('Diamond Bangle')).toBe('jewellery');
  });
});

describe('buildPrefillFromErpRow', () => {
  it('prefers retail rate over cost total', () => {
    const prefill = buildPrefillFromErpRow(
      {
        tgno: 'DK1',
        idesc: 'Diamond Ring',
        remarks: 'IGI-123',
        gwt: 5.2,
        estimatedPrice: 10000,
        retailRate: 25000,
      },
      'jewellery'
    );
    expect(prefill.price).toBe(25000);
    expect(prefill.certificate_number).toBe('IGI-123');
    expect(prefill.metal_weight_grams).toBe(5.2);
  });

  it('builds product form URL with prefill params', () => {
    const url = buildProductFormUrl(
      buildPrefillFromErpRow(
        { tgno: 'S1', idesc: 'Opal', remarks: null, estimatedPrice: 5000 },
        'upratna'
      )
    );
    expect(url).toContain('/admin/products/new/upratna');
    expect(url).toContain('tag_number=S1');
    expect(url).toContain('price=5000');
  });
});

describe('buildDraftProductFromErpTag', () => {
  it('uses selected kind for category', () => {
    const draft = buildDraftProductFromErpTag(
      {
        tgno: 'R1',
        tsno: 1,
        ino: 2,
        idesc: '5 Mukhi Rudraksha',
        erp_stock: 1,
        remarks: 'XRAY-1',
        tpre: null,
        cost_damt: 1000,
        cost_samt: 0,
        cost_mamt: 0,
      },
      'rudraksha'
    );
    expect(draft.category).toBe('rudraksha');
    expect(draft.product_type).toBe('rudraksha');
    expect(draft.tag_number).toBe('R1');
  });
});

describe('excel stock import', () => {
  it('maps filename to stock category', () => {
    expect(suggestStockCategoryFromFilename('RUBY STOCK.xlsx')).toBe('ruby');
    expect(suggestStockCategoryFromFilename('SEMI PRE STN STOCK LIST.xlsx')).toBe('semi_pre');
    expect(suggestStockCategoryFromFilename('RUDRAKSHA STOCK.xlsx')).toBe('rudraksha');
    expect(suggestStockCategoryFromFilename('STONE IDOLS STOCK.xlsx')).toBe('stone_idols');
  });

  it('parses MMI Tag Stock sheet for a category', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Tag Stock'],
      [],
      ['Tag No', 'Item Name', 'Stamp', 'Gr.Wt', 'Design', 'Certif'],
      [],
      ['A306', 'EMERALD.', 'EMERALD', 4.64, '5.25 RATTI', 'IIGJ2003'],
      ['TOTAL', '', '', 4.64, '', ''],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const rows = parseMmiStockExcel(buf, 'EMERALD STOCK LIST.xlsx', 'emerald');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tgno).toBe('A306');
    expect(rows[0]?.stockCategory).toBe('emerald');
    expect(rows[0]?.suggestedKind).toBe('navratna');
    expect(rows[0]?.idesc).toContain('EMERALD');
  });

  it('rejects pure-number junk rows', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Tag Stock'],
      [],
      ['Tag No', 'Item Name', 'Stamp', 'Gr.Wt', 'Design', 'Certif'],
      [],
      ['58', 'JUNK', '0', 0, '0', ''],
      ['A704', 'RUBY', 'RUBY', 5.64, '6.25 RATTI', 'GFCO'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const rows = parseMmiStockExcel(buf, 'RUBY STOCK.xlsx', 'ruby');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tgno).toBe('A704');
  });

});
