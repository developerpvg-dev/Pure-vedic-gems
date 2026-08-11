import { describe, expect, it } from 'vitest';
import {
  CART_UNIQUE_PIECE_MESSAGE,
  clampCartQuantity,
  collectCartItemProductIds,
  dedupeCartByProductId,
  getMaxAvailableQuantity,
  getUniquePieceAddConflict,
  isProductOccupiedInCart,
  stripOverlappingCartLines,
} from '@/lib/cart/client';
import type { CartItem } from '@/lib/types/cart';

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    key: 'p1',
    product_id: '00000000-0000-4000-8000-000000000001',
    sku: 'TEST-SKU',
    name: 'Test Ruby',
    category: 'ruby',
    image_url: '',
    price: 1000,
    quantity: 1,
    in_stock: true,
    stock_quantity: 5,
    stock_status: 'in_stock',
    availability_status: 'in_stock',
    sold_individually: false,
    carat_weight: null,
    origin: null,
    ...overrides,
  };
}

const primaryId = '00000000-0000-4000-8000-0000000000a1';
const comboId = '00000000-0000-4000-8000-0000000000b2';

function multiBeadConfig(overrides: Partial<CartItem> = {}): CartItem {
  return item({
    key: `${primaryId}:cfg:cfg-1`,
    product_id: primaryId,
    price: 175597,
    configuration_id: 'cfg-1',
    configuration_snapshot: {
      selections: {
        is_rudraksha: true,
        rudraksha_beads: [
          { role: 'primary', id: primaryId, price: 50000 },
          { role: 'combo', id: comboId, price: 45000 },
        ],
        rudraksha_combo_product_ids: [comboId],
      },
      pricing: { gem_price: 95000, total: 175597 },
    },
    ...overrides,
  });
}

describe('unique piece cart quantity', () => {
  it('never allows more than 1 even when stock_quantity is higher', () => {
    expect(getMaxAvailableQuantity(item({ stock_quantity: 99 }))).toBe(1);
    expect(clampCartQuantity(item({ stock_quantity: 99 }), 5)).toBe(1);
  });

  it('returns 0 when out of stock', () => {
    expect(getMaxAvailableQuantity(item({ stock_quantity: 0 }))).toBe(0);
    expect(getMaxAvailableQuantity(item({ availability_status: 'sold' }))).toBe(0);
    expect(clampCartQuantity(item({ stock_quantity: 0 }), 1)).toBe(0);
  });
});

describe('dedupeCartByProductId', () => {
  const productId = '00000000-0000-4000-8000-000000000001';

  it('keeps configured line and drops loose when same product appears twice', () => {
    const loose = item({ key: productId, product_id: productId, price: 18430 });
    const configured = item({
      key: `${productId}:cfg:cfg-1`,
      product_id: productId,
      price: 50243,
      configuration_id: 'cfg-1',
    });
    const result = dedupeCartByProductId([loose, configured]);
    expect(result).toHaveLength(1);
    expect(result[0].configuration_id).toBe('cfg-1');
    expect(result[0].price).toBe(50243);
  });

  it('does not collapse different products', () => {
    const a = item({ key: 'a', product_id: 'a' });
    const b = item({ key: 'b', product_id: 'b' });
    expect(dedupeCartByProductId([a, b])).toHaveLength(2);
  });

  it('drops standalone combo bead when already inside a configured jewellery line', () => {
    const configured = multiBeadConfig();
    const looseCombo = item({
      key: comboId,
      product_id: comboId,
      price: 45000,
      name: '2 Mukhi duplicate',
    });
    const result = dedupeCartByProductId([configured, looseCombo]);
    expect(result).toHaveLength(1);
    expect(result[0].configuration_id).toBe('cfg-1');
    expect(collectCartItemProductIds(result[0]!)).toEqual([primaryId, comboId]);
  });
});

describe('unique rudraksha combo occupancy', () => {
  it('blocks adding a loose bead already used in jewellery', () => {
    const configured = multiBeadConfig();
    const looseCombo = item({ key: comboId, product_id: comboId, price: 45000 });
    expect(getUniquePieceAddConflict([configured], looseCombo)).toBe(CART_UNIQUE_PIECE_MESSAGE);
    expect(isProductOccupiedInCart([configured], comboId)).toBe(true);
  });

  it('absorbs orphan loose beads when adding jewellery that includes them', () => {
    const looseCombo = item({ key: comboId, product_id: comboId, price: 45000 });
    const configured = multiBeadConfig();
    expect(getUniquePieceAddConflict([looseCombo], configured)).toBeNull();
    expect(stripOverlappingCartLines([looseCombo], configured)).toEqual([]);
  });

  it('allows replacing an edited jewellery configuration (new config id / line key)', () => {
    const oldLine = multiBeadConfig();
    const updated = multiBeadConfig({
      key: `${primaryId}:cfg:cfg-2`,
      configuration_id: 'cfg-2',
      price: 190000,
    });
    expect(getUniquePieceAddConflict([oldLine], updated)).toBeNull();
    expect(stripOverlappingCartLines([oldLine], updated)).toEqual([]);
  });
});
