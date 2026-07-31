import { describe, expect, it } from 'vitest';

import {
  buildRudrakshaCategoryTiles,
} from '@/lib/utils/rudraksha-category-tiles';
import { rudrakshaMukhiImage } from '@/lib/constants/rudraksha-category-images';

describe('rudraksha-category-tiles', () => {
  it('builds all storefront slugs with local image fallbacks', () => {
    const tiles = buildRudrakshaCategoryTiles();
    expect(tiles.length).toBeGreaterThan(20);
    expect(tiles.find((tile) => tile.id === '1-mukhi')?.image_url).toBe(rudrakshaMukhiImage('1-mukhi'));
    expect(tiles.find((tile) => tile.id === '17-mukhi')?.image_url).toBe(rudrakshaMukhiImage('17-mukhi'));
  });

  it('prefers admin-uploaded category images over local fallbacks', () => {
    const tiles = buildRudrakshaCategoryTiles([
      { id: '5-mukhi', name: '5 Mukhi Rudraksha', image_url: 'https://cdn.example/5-mukhi.webp' },
    ]);
    expect(tiles.find((tile) => tile.id === '5-mukhi')?.image_url).toBe('https://cdn.example/5-mukhi.webp');
  });

  it('uses product sample thumbs when admin image is missing (shop parity)', () => {
    const tiles = buildRudrakshaCategoryTiles(
      [{ id: 'gauri-shankar', name: 'Gauri Shankar Rudraksha' }],
      { 'gauri-shankar': 'https://cdn.example/gauri-sample.webp' },
    );
    expect(tiles.find((tile) => tile.id === 'gauri-shankar')?.image_url).toBe(
      'https://cdn.example/gauri-sample.webp',
    );
  });
});
