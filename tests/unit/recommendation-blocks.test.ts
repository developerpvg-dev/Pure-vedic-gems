import { describe, expect, it } from 'vitest';
import { assertClassicShape, blocksForTemplate, buildClassicBlocks } from '@/lib/recommendations/blocks';

describe('recommendation blocks', () => {
  it('classic template has required blocks', () => {
    expect(() => assertClassicShape(buildClassicBlocks())).not.toThrow();
  });

  it('blank template is short', () => {
    const blocks = blocksForTemplate('blank');
    expect(blocks.length).toBe(3);
    expect(blocks.map((b) => b.type)).toEqual(['header', 'greeting', 'customerDetails']);
  });
});
