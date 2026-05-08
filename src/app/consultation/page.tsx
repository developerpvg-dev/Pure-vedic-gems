import type { Metadata } from 'next';
import { ConsultationBookingForm } from '@/components/consultation/ConsultationBookingForm';
import { createClient } from '@/lib/supabase/server';
import type { ConsultationPlan } from '@/lib/types/database';

export const metadata: Metadata = {
  title: 'Book a Vedic Consultation | PureVedicGems',
  description: 'Book a paid PureVedicGems Vedic consultation with secure Razorpay payment and account dashboard tracking.',
};

export default async function ConsultationPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('consultation_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Consultation] Failed to load plans:', error);
  }

  return <ConsultationBookingForm plans={(data ?? []) as ConsultationPlan[]} />;
}
