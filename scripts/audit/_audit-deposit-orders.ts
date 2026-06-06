import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { streamWpTable } from '../legacy-import/lib/wp-sql.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const WOO = resolve(repoRoot, '..', 'pugemved_indb', 'pugemved_indb.sql');

const KEYS = new Set([
  '_wc_deposits_order_has_deposit',
  '_wc_deposits_deposit_paid',
  '_wc_deposits_second_payment_paid',
  '_wc_deposits_remaining',
  '_wc_deposits_remaining_paid',
  '_order_total',
  '_order_status',
  '_paid_date',
]);

async function main() {
  // 1) shop_order ids + status
  const orderStatus = new Map<string, string>();
  for await (const r of streamWpTable({ filePath: WOO, tableName: 'wp_posts', filter: (row) => row.post_type === 'shop_order' })) {
    orderStatus.set(String(r.ID), String(r.post_status ?? ''));
  }

  // 2) deposit + total meta for those orders
  const meta = new Map<string, Record<string, string>>();
  for await (const r of streamWpTable({
    filePath: WOO,
    tableName: 'wp_postmeta',
    filter: (row) => orderStatus.has(String(row.post_id)) && KEYS.has(String(row.meta_key ?? '')),
  })) {
    const pid = String(r.post_id);
    const m = meta.get(pid) ?? {};
    m[String(r.meta_key)] = String(r.meta_value ?? '');
    meta.set(pid, m);
  }

  const depositOrders = [...meta.entries()].filter(([, m]) => m['_wc_deposits_order_has_deposit'] === 'yes');
  console.log(`Orders flagged with deposit: ${depositOrders.length}\n`);

  let outstanding = 0;
  let fullyPaid = 0;
  let outstandingValue = 0;
  const rows: string[] = [];
  for (const [pid, m] of depositOrders) {
    const status = orderStatus.get(pid) ?? '';
    const total = Number(m['_order_total'] ?? 0);
    const depPaid = m['_wc_deposits_deposit_paid'] === '1' || m['_wc_deposits_deposit_paid'] === 'yes';
    const secondPaid = m['_wc_deposits_second_payment_paid'] === '1' || m['_wc_deposits_second_payment_paid'] === 'yes';
    const remaining = Number(m['_wc_deposits_remaining'] ?? 0);
    const remainingPaid = m['_wc_deposits_remaining_paid'] === '1' || m['_wc_deposits_remaining_paid'] === 'yes';
    const settled = secondPaid || remainingPaid || status === 'wc-completed';
    if (settled) fullyPaid++;
    else { outstanding++; outstandingValue += remaining || 0; }
    rows.push(
      `#${pid} status=${status.replace('wc-', '').padEnd(10)} total=${String(total).padStart(8)} remaining=${String(remaining).padStart(8)} depositPaid=${depPaid} secondPaid=${secondPaid} remainingPaid=${remainingPaid} -> ${settled ? 'SETTLED' : 'OUTSTANDING'}`,
    );
  }
  rows.sort();
  for (const r of rows) console.log(r);
  console.log(`\nSummary: ${depositOrders.length} deposit orders | settled=${fullyPaid} | outstanding=${outstanding} | outstanding remaining value (INR, approx)=${outstandingValue.toFixed(2)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
