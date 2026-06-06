import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRewardBalance, getRewardSettings } from '@/lib/rewards/service';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const [balance, settings] = await Promise.all([
    getRewardBalance(user.id),
    getRewardSettings(),
  ]);

  return NextResponse.json({
    balance,
    settings: {
      is_active: settings.is_active,
      point_value_inr: settings.point_value_inr,
      min_redeem_points: settings.min_redeem_points,
      max_redeem_points_per_order: settings.max_redeem_points_per_order,
      max_redeem_percent: settings.max_redeem_percent,
      earn_points_per_order: settings.earn_points_per_order,
    },
  });
}