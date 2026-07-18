import assert from 'node:assert/strict';
import { planAppliesToSubtotal } from '@/lib/shipping/plans';

// Gem-only subtotal under min → reject
assert.equal(
  planAppliesToSubtotal({ min_order_amount: 25000, max_order_amount: null }, 20000),
  false,
);

// Full merchandise (gem + jewellery) above min → accept
assert.equal(
  planAppliesToSubtotal({ min_order_amount: 25000, max_order_amount: null }, 74173),
  true,
);

// Max band still works
assert.equal(
  planAppliesToSubtotal({ min_order_amount: 0, max_order_amount: 24999 }, 74173),
  false,
);

console.log('shipping planAppliesToSubtotal self-check ok');
