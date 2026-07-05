import { describe, expect, it } from 'vitest';
import {
  buildRudrakshaBeadSnapshots,
  buildRudrakshaConfigurationSummary,
  formatConfigurationDetailText,
  getConfigurationDetailChips,
  parseRudrakshaBeadsFromSnapshot,
} from '@/lib/utils/rudraksha-order-display';

describe('rudraksha-order-display', () => {
  const primary = {
    id: 'primary-id',
    sku: 'R-1',
    tag_number: 'T-1',
    name: 'Collector 1 Mukhi',
    sub_category: '1-mukhi',
    price: 50000,
  };

  const combo = {
    id: 'combo-id',
    sku: 'R-5',
    tag_number: 'T-5',
    name: 'Nepal 5 Mukhi',
    sub_category: '5-mukhi',
    price: 12000,
  };

  it('builds bead snapshots with roles and mukhi labels', () => {
    const beads = buildRudrakshaBeadSnapshots(primary, [combo]);
    expect(beads).toHaveLength(2);
    expect(beads[0]).toMatchObject({ role: 'primary', mukhi_label: '1 Mukhi' });
    expect(beads[1]).toMatchObject({ role: 'combo', mukhi_label: '5 Mukhi', price: 12000 });
  });

  it('builds multi-bead configuration summary', () => {
    const summary = buildRudrakshaConfigurationSummary({
      beads: buildRudrakshaBeadSnapshots(primary, [combo]),
      designName: 'Classic Cap',
      metal: 'gold_18k',
      chainLength: '18 inch',
    });

    expect(summary).toContain('2 beads');
    expect(summary).toContain('1 Mukhi + 5 Mukhi');
    expect(summary).toContain('Classic Cap');
    expect(summary).toContain('Gold 18k');
    expect(summary).toContain('Chain 18 inch');
  });

  it('parses enriched snapshot beads for display', () => {
    const snapshot = {
      product: { id: primary.id, name: primary.name, category: 'rudraksha' },
      selections: {
        is_rudraksha: true,
        rudraksha_beads: buildRudrakshaBeadSnapshots(primary, [combo]),
        design: { name: 'Classic Cap', rudraksha_category: 'multiple_beads' },
        metal: 'gold_18k',
        chain_length: '18 inch',
      },
      summary: 'test',
    };

    const chips = getConfigurationDetailChips(snapshot);
    expect(chips.some((chip) => chip.includes('2 beads'))).toBe(true);
    expect(chips.some((chip) => chip.startsWith('Primary:'))).toBe(true);
    expect(chips.some((chip) => chip.startsWith('Combo:'))).toBe(true);

    const detail = formatConfigurationDetailText(snapshot);
    expect(detail).toContain('Primary: 1 Mukhi');
    expect(detail).toContain('Combo: 5 Mukhi');
    expect(detail).toContain('Mounting: Classic Cap');
    expect(parseRudrakshaBeadsFromSnapshot(snapshot)).toHaveLength(2);
  });
});
