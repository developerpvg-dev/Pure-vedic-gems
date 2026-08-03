import { describe, expect, it } from 'vitest';
import { buildConfiguratorStateFromCartItem } from '@/lib/configurator/seed-from-cart';
import type { CartItem } from '@/lib/types/cart';
import type { ProductCard } from '@/lib/types/product';

const product = {
  id: '00000000-0000-4000-8000-000000000001',
  sku: 'RUBY-1',
  slug: 'african-ruby',
  name: 'African Ruby 5.76ct. (Premium)',
  category: 'ruby',
  sub_category: null,
  price: 18430,
} as ProductCard;

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    key: `${product.id}:cfg:cfg-1`,
    product_id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    image_url: '',
    price: 50243,
    quantity: 1,
    carat_weight: 5.76,
    origin: null,
    configuration_id: 'cfg-1',
    configuration_edit_url: `/configure/${product.id}`,
    configuration_snapshot: {
      selections: {
        setting_type: 'ring',
        design: { id: 'design-1', name: 'Design-2' },
        metal: 'gold_14k',
        ring_size: 'indian:7',
        certification: { id: 'lab-1', name: 'Free Lab' },
        energization: { id: 'en-1', name: 'Prana Pratishtha Pooja' },
        energization_form: {
          dob: '1990-01-01',
          birth_time: '10:00',
          birth_place: 'Delhi',
          gotra: 'Kashyap',
        },
      },
      pricing: { certification_fee: 0, energization_fee: 2100 },
    },
    ...overrides,
  };
}

describe('buildConfiguratorStateFromCartItem', () => {
  it('returns null for loose cart lines', () => {
    expect(
      buildConfiguratorStateFromCartItem(product, cartItem({ configuration_id: undefined }))
    ).toBeNull();
  });

  it('restores setting, metal, and design from the cart snapshot', () => {
    const state = buildConfiguratorStateFromCartItem(product, cartItem());
    expect(state).not.toBeNull();
    expect(state!.setting_type).toBe('ring');
    expect(state!.metal).toBe('gold_14k');
    expect(state!.ring_size).toBe('indian:7');
    expect(state!.selected_design?.id).toBe('design-1');
    expect(state!.selected_lab?.id).toBe('lab-1');
    expect(state!.selected_energization?.id).toBe('en-1');
    expect(state!.selected_product?.id).toBe(product.id);
  });
});
