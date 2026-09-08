import { buildDynamicPriceRangePresets } from './filters';

const pearlish = buildDynamicPriceRangePresets([8_000, 12_000, 18_000, 22_000]);
if (pearlish.length < 2) throw new Error('cheap category should get multiple buckets');
if (pearlish.some((p) => (p.max ?? 0) >= 500_000 && p.min >= 500_000)) {
  throw new Error('cheap category must not invent ₹5L+ global bucket');
}

const diamondish = buildDynamicPriceRangePresets([200_000, 450_000, 900_000, 1_500_000]);
if (!diamondish.some((p) => p.min >= 100_000)) {
  throw new Error('expensive category buckets should start near catalog min');
}
if (diamondish[0]?.min === 0 && diamondish[0]?.max === 25_000) {
  throw new Error('expensive category must not show Under ₹25k when min is ₹2L');
}

console.log('filters-price self-check ok');
