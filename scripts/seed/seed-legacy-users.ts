/**
 * scripts/seed/seed-legacy-users.ts
 *
 * Seeds a handful of "legacy WordPress" customer accounts so the team can test
 * the first-login forced-password-reset flow end-to-end:
 *
 *   1. Creates a Supabase Auth user per test customer with a known TEMPORARY
 *      password and email_confirm=true (no email verification needed to log in).
 *   2. Inserts / updates their customer_profiles row with
 *      requires_password_reset = TRUE so the proxy gates them on /account.
 *   3. Inserts 2 sample orders per customer so the dashboard shows order
 *      history, rewards, etc. once they set a real password.
 *
 * Idempotent: re-running updates the existing user's password + profile flag
 * rather than failing on duplicate email.
 *
 * Usage:
 *   npx tsx scripts/seed/seed-legacy-users.ts            (dry-run, prints plan)
 *   npx tsx scripts/seed/seed-legacy-users.ts --write    (apply to the DB in .env.local)
 */

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
loadEnv({ path: resolve(repoRoot, '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const WRITE = process.argv.includes('--write');

// Shared temporary password for every seeded legacy user. After they log in
// with this, the app forces them to choose their own. Meets Supabase's minimum
// (>=8 chars, mixed case + number).
const TEMP_PASSWORD = 'PVG@legacy2026';

type SeedUser = {
  email: string;
  full_name: string;
  phone: string;
  city: string;
  orders: Array<{
    orderNumber: string;
    status: 'delivered' | 'shipped' | 'processing' | 'confirmed';
    paymentStatus: 'captured' | 'pending';
    subtotal: number;
    total: number;
    itemName: string;
    itemPrice: number;
    createdAt: string;
  }>;
};

const USERS: SeedUser[] = [
  {
    email: 'legacy.rajesh@pvgtest.com',
    full_name: 'Rajesh Sharma',
    phone: '+919876543210',
    city: 'New Delhi',
    orders: [
      {
        orderNumber: 'PVG-LEG-1001',
        status: 'delivered',
        paymentStatus: 'captured',
        subtotal: 18500,
        total: 18500,
        itemName: 'Natural Ruby (Manik) — 2.10 ct',
        itemPrice: 18500,
        createdAt: '2026-01-14T10:24:00.000Z',
      },
      {
        orderNumber: 'PVG-LEG-1042',
        status: 'shipped',
        paymentStatus: 'captured',
        subtotal: 9750,
        total: 9750,
        itemName: 'Yellow Sapphire (Pukhraj) — 3.05 ct',
        itemPrice: 9750,
        createdAt: '2026-05-02T16:10:00.000Z',
      },
    ],
  },
  {
    email: 'legacy.anita@pvgtest.com',
    full_name: 'Anita Verma',
    phone: '+919812345678',
    city: 'Mumbai',
    orders: [
      {
        orderNumber: 'PVG-LEG-1007',
        status: 'processing',
        paymentStatus: 'captured',
        subtotal: 14200,
        total: 14200,
        itemName: 'Emerald (Panna) — 2.40 ct',
        itemPrice: 14200,
        createdAt: '2026-02-18T09:00:00.000Z',
      },
      {
        orderNumber: 'PVG-LEG-1051',
        status: 'confirmed',
        paymentStatus: 'pending',
        subtotal: 6300,
        total: 6300,
        itemName: 'Pearl (Moti) Pendant — Silver',
        itemPrice: 6300,
        createdAt: '2026-06-10T13:45:00.000Z',
      },
    ],
  },
  {
    email: 'legacy.vikram@pvgtest.com',
    full_name: 'Vikram Iyer',
    phone: '+919900112233',
    city: 'Bengaluru',
    orders: [
      {
        orderNumber: 'PVG-LEG-1015',
        status: 'delivered',
        paymentStatus: 'captured',
        subtotal: 27800,
        total: 27800,
        itemName: 'Blue Sapphire (Neelam) — 3.60 ct',
        itemPrice: 27800,
        createdAt: '2026-03-05T11:20:00.000Z',
      },
      {
        orderNumber: 'PVG-LEG-1063',
        status: 'shipped',
        paymentStatus: 'captured',
        subtotal: 11900,
        total: 11900,
        itemName: 'Red Coral (Moonga) Ring — Gold',
        itemPrice: 11900,
        createdAt: '2026-06-22T18:30:00.000Z',
      },
    ],
  },
];

function buildShippingAddress(u: SeedUser) {
  return {
    full_name: u.full_name,
    phone: u.phone,
    line1: `12 Legacy Marg`,
    line2: '',
    city: u.city,
    state: u.city === 'Mumbai' ? 'Maharashtra' : u.city === 'Bengaluru' ? 'Karnataka' : 'Delhi',
    pincode: u.city === 'Mumbai' ? '400001' : u.city === 'Bengaluru' ? '560001' : '110001',
    country: 'India',
  };
}

async function main() {
  const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\n=== PureVedicGems — Legacy user seed ===');
  console.log(`Mode: ${WRITE ? 'WRITE (applying)' : 'DRY-RUN (use --write to apply)'}`);
  console.log(`Temp password for all users: ${TEMP_PASSWORD}\n`);

  for (const u of USERS) {
    console.log(`— ${u.full_name} <${u.email}>`);

    let userId: string | null = null;

    if (WRITE) {
      // Create the auth user (idempotent on email).
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, phone: u.phone, legacy_migration: true },
      });

      if (createErr) {
        // If the user already exists, look them up and reset the temp password.
        if (
          createErr.message.toLowerCase().includes('already') ||
          createErr.message.toLowerCase().includes('registered')
        ) {
          const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          if (listErr) {
            console.error(`   ❌ could not list users: ${listErr.message}`);
            continue;
          }
          const existing = list.users.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
          if (!existing) {
            console.error(`   ❌ user exists but could not be located for update`);
            continue;
          }
          userId = existing.id;
          await admin.auth.admin.updateUserById(userId, {
            password: TEMP_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: u.full_name, phone: u.phone, legacy_migration: true },
          });
          console.log(`   ↻ existing auth user updated (${userId})`);
        } else {
          console.error(`   ❌ createUser failed: ${createErr.message}`);
          continue;
        }
      } else {
        userId = created.user.id;
        console.log(`   ✓ auth user created (${userId})`);
      }

      if (!userId) continue;

      // Upsert the customer profile with the legacy reset flag.
      const { error: profileErr } = await admin.from('customer_profiles').upsert(
        {
          id: userId,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          whatsapp: u.phone,
          account_status: 'active',
          requires_password_reset: true,
          password_reset_at: null,
        },
        { onConflict: 'id' }
      );
      if (profileErr) {
        console.error(`   ❌ profile upsert failed: ${profileErr.message}`);
        continue;
      }
      console.log(`   ✓ customer_profiles flagged requires_password_reset=true`);

      // Insert sample orders (skip if the order_number already exists).
      const shippingAddress = buildShippingAddress(u);
      for (const o of u.orders) {
        const { error: orderErr } = await admin.from('orders').upsert(
          {
            order_number: o.orderNumber,
            customer_id: userId,
            items: [
              {
                name: o.itemName,
                quantity: 1,
                unit_price: o.itemPrice,
                line_total: o.itemPrice,
                category: 'Navaratna',
                image_url: null,
              },
            ],
            subtotal: o.subtotal,
            jewelry_charges: 0,
            metal_charges: 0,
            certification_charges: 0,
            energization_charges: 0,
            shipping_cost: 0,
            discount: 0,
            coupon_discount: 0,
            reward_points_redeemed: 0,
            reward_discount: 0,
            reward_points_earned: Math.round(o.subtotal / 100),
            gst_amount: 0,
            total: o.total,
            shipping_address: shippingAddress,
            shipping_method: 'Standard Delivery',
            payment_method: 'razorpay',
            payment_status: o.paymentStatus,
            status: o.status,
            created_at: o.createdAt,
          },
          { onConflict: 'order_number' }
        );
        if (orderErr) {
          console.error(`   ⚠ order ${o.orderNumber} upsert failed: ${orderErr.message}`);
        } else {
          console.log(`   ✓ order ${o.orderNumber} (${o.status})`);
        }
      }
    } else {
      console.log(`   would create auth user + profile flag + ${u.orders.length} orders`);
    }

    console.log('');
  }

  console.log('=== Summary — test credentials ===');
  for (const u of USERS) {
    console.log(`  ${u.email}   /   ${TEMP_PASSWORD}`);
  }
  console.log('\nNext steps:');
  console.log('  1. Open the site and click Sign In.');
  console.log('  2. Use any email above with the temp password.');
  console.log('  3. You will be redirected to /account/set-password — choose a new password.');
  console.log('  4. After resetting, the dashboard + order history will be visible.');
  console.log('');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
