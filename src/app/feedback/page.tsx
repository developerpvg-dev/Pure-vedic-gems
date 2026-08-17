import type { Metadata } from 'next';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { buildMetadata } from '@/lib/utils/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Share Feedback | PureVedicGems',
  description: 'Share your experience with Pure Vedic Gems products and services.',
  path: '/feedback',
});

export default function FeedbackPage() {
  return (
    <main className="min-h-screen bg-[#faf8f4] pt-28 pb-20 font-body text-[#15110d] overflow-hidden">

      {/* Header Section */}
      <section className="px-4 pb-4 pt-10 sm:px-6 lg:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex flex-col items-center justify-center mb-0">
            <h1 className="section-title" id="feedback-h1">Client Feedback</h1>
            <p className="navratna-subtitle text-[#5a5043]!" style={{ margin: 0 }}>
              Kindly share a few words about your experience — your feedback means a great deal to us.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }}></div>
          </div>
        </div>
      </section>

      {/* Submit Feedback Form */}
      <section className="mx-auto max-w-2xl px-4 sm:px-8 mb-14">
        <div className="border border-[#e0d6c8] bg-white px-6 py-8 sm:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#2c0a04] tracking-tight mb-1">Share Your Experience</h2>
            <p className="text-[14px] text-[#5a5043] italic">Your valuable feedback helps us serve thousands of clients better.</p>
            <div className="mx-auto mt-3 h-0.5 w-14" style={{ background: 'linear-gradient(90deg,transparent,#c9a96e,transparent)' }}></div>
          </div>
          <FeedbackForm />
        </div>
      </section>

    </main>
  );
}
