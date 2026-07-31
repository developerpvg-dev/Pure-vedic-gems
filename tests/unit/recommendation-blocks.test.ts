import { describe, expect, it } from 'vitest';
import { assertGempunditClassicShape, blocksForTemplate, buildGempunditClassicBlocks } from '@/lib/recommendations/blocks';

describe('recommendation blocks', () => {
  it('gempundit-classic has required blocks', () => {
    expect(() => assertGempunditClassicShape(buildGempunditClassicBlocks())).not.toThrow();
  });

  it('blank template is short', () => {
    const blocks = blocksForTemplate('blank');
    expect(blocks.length).toBe(3);
    expect(blocks.map((b) => b.type)).toEqual(['header', 'greeting', 'customerDetails']);
  });
});
