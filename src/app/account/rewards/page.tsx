import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Gift, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { AccountPageHeader } from '@/components/account/AccountPageHeader';
import { Money } from '@/components/currency/Money';
import type { RewardPointTransaction, RewardSettings } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reward Points | PureVedicGems',
};

function transactionLabel(transaction: RewardPointTransaction) {
  if (transaction.description) return transaction.description;
  if (transaction.type === 'earned') return 'Points earned';
  if (transaction.type === 'redeemed') return 'Points redeemed';
  if (transaction.type === 'migration') return 'Legacy points migrated';
  return transaction.type.replace(/_/g, ' ');
}

export default async function RewardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/shop?auth=login&next=/account/rewards');

  const [transactionsResult, settingsResult] = await Promise.all([
    supabase
      .from('reward_point_transactions')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('reward_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle(),
  ]);

  const transactions = (transactionsResult.data ?? []) as RewardPointTransaction[];
  const settings = settingsResult.data as RewardSettings | null;
  const confirmedBalance = transactions
    .filter((transaction) => transaction.status === 'confirmed')
    .reduce((sum, transaction) => sum + Number(transaction.points ?? 0), 0);
  const pendingRedeemed = transactions
    .filter((transaction) => transaction.status === 'pending' && transaction.points < 0)
    .reduce((sum, transaction) => sum + Math.abs(Number(transaction.points ?? 0)), 0);
  const available = Math.max(0, confirmedBalance - pendingRedeemed);
  const lifetimeEarned = transactions
    .filter((transaction) => transaction.status === 'confirmed' && transaction.points > 0)
    .reduce((sum, transaction) => sum + transaction.points, 0);
  const lifetimeRedeemed = transactions
    .filter((transaction) => transaction.status === 'confirmed' && transaction.points < 0)
    .reduce((sum, transaction) => sum + Math.abs(transaction.points), 0);
  const pointValue = Number(settings?.point_value_inr ?? 1);

  return (
    <div className="pvg-account-stack">
      <AccountPageHeader
        title="Reward Points"
        subtitle="View migrated legacy reward points, checkout redemptions, and new points earned from paid orders."
      />

      <section className="pvg-account-stat-grid">
        {[
          { label: 'Available', value: available.toLocaleString('en-IN'), detail: <Money amount={available * pointValue} /> },
          { label: 'Pending Holds', value: pendingRedeemed.toLocaleString('en-IN'), detail: 'Reserved at checkout' },
          { label: 'Lifetime Earned', value: lifetimeEarned.toLocaleString('en-IN'), detail: 'Confirmed points' },
          { label: 'Lifetime Redeemed', value: lifetimeRedeemed.toLocaleString('en-IN'), detail: 'Used on orders' },
        ].map((item) => (
          <div key={item.label} className="pvg-account-stat">
            <p className="pvg-account-stat-label">{item.label}</p>
            <p className="pvg-account-stat-value">{item.value}</p>
            <p className="pvg-account-stat-detail">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="pvg-account-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ede6d5] px-5 py-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#b8861e]" aria-hidden="true" />
            <h2 className="pvg-account-card-title">Ledger</h2>
          </div>
          <Link href="/shop" className="pvg-account-btn">
            <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Shop
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="pvg-account-empty">
            <Gift className="pvg-account-empty-icon h-12 w-12" aria-hidden="true" />
            <p className="pvg-account-empty-title">No reward activity yet</p>
            <p className="pvg-account-empty-copy">Legacy imports and future paid orders will appear here.</p>
          </div>
        ) : (
          <div className="pvg-account-divider px-5">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="pvg-account-row">
                <div>
                  <p className="pvg-account-row-title">{transactionLabel(transaction)}</p>
                  <p className="pvg-account-row-meta">
                    {new Date(transaction.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {transaction.status}
                    {transaction.checkpoint ? ` · ${transaction.checkpoint}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${transaction.points >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {transaction.points >= 0 ? '+' : ''}{transaction.points.toLocaleString('en-IN')}
                  </p>
                  <p className="pvg-account-row-meta">
                    <Money amount={Number(transaction.amount_inr ?? 0)} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}