import { describe, expect, it } from 'vitest';
import { normalizeTagStockResult } from '@/lib/erp/mmi-client';
import { buildErpSyncReport } from '@/lib/erp/sync';

describe('normalizeTagStockResult', () => {
  it('parses flat tag rows with TGNO', () => {
    const tags = normalizeTagStockResult([
      { tsno: 1326, TGNO: 'DK1', INO: 1568, IDESC: 'DIAMOND BANGLE', COSTMAMT: 1000 },
    ]);
    expect(tags).toHaveLength(1);
    expect(tags[0]?.TGNO).toBe('DK1');
  });

  it('skips grouped inos rows without TGNO', () => {
    const tags = normalizeTagStockResult([
      { tsno: '4', inos: [{ ino: '2', item_name: 'STONES' }] },
    ]);
    expect(tags).toHaveLength(0);
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
      { syncedAt: null, apiCallsUsed: 1, pendingOutbound: 0 }
    );

    expect(report.matchedInStock).toBe(1);

    expect(report.missingOnWebsite).toHaveLength(0);
    expect(report.orphansOnWebsite).toHaveLength(1);
    expect(report.stockMismatches.some((row) => row.tgno === 'WEB-ONLY' && !row.erpInStock)).toBe(true);
  });
});
