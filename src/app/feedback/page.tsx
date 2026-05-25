import type { Metadata } from 'next';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackThread, type PublicFeedbackItem, type PublicFeedbackReply } from '@/components/feedback/FeedbackThread';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Feedback | Pure Vedic Gems',
  description: 'Share your experience with Pure Vedic Gems products and services.',
};

export const revalidate = 300;

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: feedbackRows } = await supabase
    .from('feedback_submissions')
    .select('id, name, location, rating, subject, message, created_at')
    .eq('status', 'approved')
    .eq('allow_display', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20);

  const feedbackIds = (feedbackRows ?? []).map((item) => item.id);
  const { data: replyRows } = feedbackIds.length > 0
    ? await supabase
      .from('feedback_replies')
      .select('id, feedback_id, name, message, created_at')
      .eq('status', 'approved')
      .in('feedback_id', feedbackIds)
      .order('created_at', { ascending: true })
    : { data: [] as PublicFeedbackReply[] };

  const repliesByFeedback = new Map<string, PublicFeedbackReply[]>();
  for (const reply of (replyRows ?? []) as PublicFeedbackReply[]) {
    repliesByFeedback.set(reply.feedback_id, [...(repliesByFeedback.get(reply.feedback_id) ?? []), reply]);
  }

  const feedback = ((feedbackRows ?? []) as Omit<PublicFeedbackItem, 'replies'>[]).map((item) => ({
    ...item,
    replies: repliesByFeedback.get(item.id) ?? [],
  }));

  return (
    <main className="pvg-simple-page pvg-info-page bg-[#fbfaf7] font-body text-[#15110d]">
      <section className="px-4 pb-16 pt-28 sm:px-6 lg:pt-36">
        <div className="mx-auto max-w-2xl">
          <ScrollReveal>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Feedback</h1>
            <p className="mt-4 text-[15px] leading-7 text-[#5e4a38]">
              Your valuable feedback is of utmost importance for us.<br />
              Kindly give us a few words of how did you like our products and services.
            </p>
            <div className="mt-8">
              <FeedbackForm />
            </div>
          </ScrollReveal>
        </div>
        <ScrollReveal>
          <FeedbackThread items={feedback} />
        </ScrollReveal>
      </section>
    </main>
  );
}
