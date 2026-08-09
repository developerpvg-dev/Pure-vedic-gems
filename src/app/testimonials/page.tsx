import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { Testimonial } from '@/lib/types/database';
import { TestimonialCard } from '@/components/testimonials/TestimonialCard';

export const metadata: Metadata = {
  title: 'Testimonials | Pure Vedic Gems Reviews',
  description: 'Read customer testimonials and proof archives from Pure Vedic Gems clients across India and overseas.',
};

export const revalidate = 1800; // ISR: 30 min - admin revalidatePath still refreshes on save

const TESTIMONIALS_PER_PAGE = 8;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#c99022]" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_unused, index) => (
        <Star key={index} className="h-4 w-4" fill={index < rating ? 'currentColor' : 'none'} color="#c99022" />
      ))}
    </div>
  );
}

function Pagination({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-20 flex items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link href={`?page=${currentPage - 1}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8bd75] text-[#6b3b23] hover:bg-[#b86654] hover:text-white transition-colors" aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {Array.from({ length: totalPages }, (_unused, index) => {
        const pageNumber = index + 1;
        // Optimization for many pages: only show a few around current
        if (totalPages > 7) {
            if (pageNumber !== 1 && pageNumber !== totalPages && Math.abs(pageNumber - currentPage) > 2) {
                if (pageNumber === 2 || pageNumber === totalPages - 1) return <span key={pageNumber} className="px-1 text-[#6b3b23]">...</span>;
                return null;
            }
        }
        return (
          <Link
            key={pageNumber}
            href={`?page=${pageNumber}`}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              pageNumber === currentPage
                ? 'bg-[#a37c44] text-white'
                : 'border border-[#e0d6c8] text-[#a37c44] hover:bg-[#f0eadd]'
            }`}
          >
            {pageNumber}
          </Link>
        );
      })}
      {currentPage < totalPages ? (
        <Link href={`?page=${currentPage + 1}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8bd75] text-[#6b3b23] hover:bg-[#b86654] hover:text-white transition-colors" aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function getInitials(name: string) {
    if (!name) return 'PG';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

export default async function TestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const from = (requestedPage - 1) * TESTIMONIALS_PER_PAGE;
  const to = from + TESTIMONIALS_PER_PAGE - 1;

  const supabase = await createClient();
  const { data, count } = await supabase
    .from('testimonials')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false })
    .range(from, to);

  const testimonials = (data ?? []) as Testimonial[];
  const totalPages = Math.max(1, Math.ceil((count ?? testimonials.length) / TESTIMONIALS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  return (
    <main className="min-h-screen bg-[#faf8f4] pt-28 pb-20 font-body text-[#15110d] overflow-hidden">
      
      {/* Header Section */}
      <section className="px-4 pb-2 pt-10 sm:px-6 lg:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex flex-col items-center justify-center mb-0">
            <h1 className="section-title" id="testimonials-h1">What Our Clients Say</h1>
            <p className="navratna-subtitle !text-[#5a5043]" style={{ margin: 0 }}>
              Real experiences from clients across 40+ countries who chose Jyotish-certified gems.
            </p>
            <div className="section-rule-center" style={{ margin: '15px auto 5px' }}></div>
          </div>
          
          <div className="mt-2 mb-2 flex flex-col sm:flex-row items-center justify-center gap-4">
               <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-[#faf8f4] bg-[#e0d6c8] overflow-hidden shadow-sm flex items-center justify-center">
                         <span className="text-xs text-[#8c7456] block mt-1">??</span>
                      </div>
                  ))}
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-[#333]">4.9/5</span>
                  <Star className="w-5 h-5 text-[#c99022]" fill="currentColor" color="#c99022" />
               </div>
               <div className="w-1 h-1 rounded-full bg-[#ccc]"></div>
               <p className="text-sm font-medium text-[#5a5043]">From 500+ verified reviews</p>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-12 pb-20 relative">
        {testimonials.length === 0 ? (
          <div className="text-center text-sm text-[#5e4a38]">No testimonials are published yet.</div>
        ) : (
          <>
            <div className="grid gap-x-10 gap-y-16 grid-cols-1 md:grid-cols-2 w-full mx-auto">
              {testimonials.map((testimonial, idx) => {
                  const globalIdx = from + idx + 1;
                  const idxStr = globalIdx < 10 ? `0${globalIdx}` : `${globalIdx}`;
                  return (
                    <TestimonialCard key={testimonial.id} testimonial={testimonial} indexString={idxStr} />
                  );
              })}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </>
        )}
      </section>
      
      {/* Bottom CTA Section matches style of image */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 my-10">
        <div className="flex justify-center items-center mt-8">
           <Link href="/book-consultation" className="inline-flex items-center gap-2 px-8 py-3 bg-transparent border border-[#d8bd75] text-[#6b3b23] font-medium text-sm hover:bg-[#d8bd75] hover:text-white transition-colors uppercase tracking-wider">
              Book Your Consultation
           </Link>
        </div>
      </section>
    </main>
  );
}
