import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Gift, ShoppingBag } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { OrnamentalDivider } from '@/components/ui/ornamental-divider';
import { formatPrice } from '@/lib/utils/format';
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
    <div className="space-y-8">
      <div>
        <Link href="/account" className="mb-4 inline-flex items-center gap-1 text-sm text-brand-muted hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>
        <h1 className="font-heading text-3xl text-brand-primary md:text-4xl">Reward Points</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-brand-muted">View migrated legacy reward points, checkout redemptions, and new points earned from paid orders.</p>
        <OrnamentalDivider className="mt-4 max-w-50" />
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Available', value: available.toLocaleString('en-IN'), detail: formatPrice(available * pointValue) },
          { label: 'Pending Holds', value: pendingRedeemed.toLocaleString('en-IN'), detail: 'Reserved at checkout' },
          { label: 'Lifetime Earned', value: lifetimeEarned.toLocaleString('en-IN'), detail: 'Confirmed points' },
          { label: 'Lifetime Redeemed', value: lifetimeRedeemed.toLocaleString('en-IN'), detail: 'Used on orders' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-brand-border bg-brand-surface p-5">
            <p className="text-xs font-bold uppercase tracking-[2px] text-brand-muted">{item.label}</p>
            <p className="mt-2 font-heading text-3xl text-brand-primary">{item.value}</p>
            <p className="mt-1 text-xs text-brand-muted">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-brand-border bg-brand-surface">
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-brand-accent" />
            <h2 className="font-heading text-xl text-brand-primary">Ledger</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
            <ShoppingBag className="h-4 w-4" /> Shop
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Gift className="mx-auto mb-4 h-12 w-12 text-brand-muted opacity-40" />
            <p className="font-semibold text-brand-primary">No reward activity yet</p>
            <p className="mt-1 text-sm text-brand-muted">Legacy imports and future paid orders will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-semibold text-brand-primary">{transactionLabel(transaction)}</p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {new Date(transaction.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {transaction.status}
                    {transaction.checkpoint ? ` · ${transaction.checkpoint}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-heading text-xl ${transaction.points >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {transaction.points >= 0 ? '+' : ''}{transaction.points.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-brand-muted">{formatPrice(Number(transaction.amount_inr ?? 0))}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}