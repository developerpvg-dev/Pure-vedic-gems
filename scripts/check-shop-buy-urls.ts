import { applyShopBuyUrls } from '../src/lib/recommendations/buy-urls';
import type { ReportBlock } from '../src/lib/recommendations/blocks';

const blocks = [
  {
    id: '1',
    type: 'primaryStone',
    stone: {
      role: 'life',
      gemLabel: 'Test',
      weight: '',
      benefits: [],
      wearDay: '',
      wearFinger: '',
      metal: '',
      wearDeity: '',
      product: {
        productId: 'abc',
        name: '1 Mukhi',
        imageUrl: null,
        slug: '1-mukhi-rudraksha-2-978g-natural-rudraksha',
        priceLabel: null,
        origin: null,
        buyUrl: 'https://pure-vedic-gems.vercel.app/products/1-mukhi-rudraksha-2-978g-natural-rudraksha',
      },
    },
  },
] as ReportBlock[];

const next = applyShopBuyUrls(blocks, 'https://pure-vedic-gems.vercel.app', [
  {
    id: 'abc',
    slug: '1-mukhi-rudraksha-2-978g-natural-rudraksha',
    category: 'rudraksha',
    sub_category: '1-mukhi',
  },
]);

const url = next[0].type === 'primaryStone' ? next[0].stone.product.buyUrl : null;
const expected =
  'https://pure-vedic-gems.vercel.app/shop/1-mukhi/1-mukhi-rudraksha-2-978g-natural-rudraksha';
if (url !== expected) throw new Error(`got ${url}`);
console.log('ok', url);
