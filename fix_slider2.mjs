import fs from 'fs';
const code = `'use client';
import { useState, useEffect } from 'react';
import { TestimonialCard } from '@/components/testimonials/TestimonialCard';

export function HomeTestimonialSlider({ testimonials }: { testimonials: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleCount = isMobile ? 1 : 2;

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, testimonials.length - visibleCount + 1));
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, testimonials.length - visibleCount + 1)) % Math.max(1, testimonials.length - visibleCount + 1));
  };

  if (!testimonials || testimonials.length === 0) return null;

  return (
    <div className="relative w-full max-w-6xl mx-auto px-0 md:px-0">
      <div className="overflow-hidden no-scrollbar">
        <div 
           className="flex transition-transform duration-500 ease-in-out" 
           style={{ transform: \`translateX(-\${currentIndex * (100 / visibleCount)}%)\` }}
        >
          {testimonials.map((testimonial, i) => (
            <div 
              key={testimonial.id} 
              style={{ width: \`\${100 / visibleCount}%\`, flexShrink: 0, padding: isMobile ? '0 0px' : '0 10px' }}
              className="px-0 sm:px-2 md:px-3"
            >
              <TestimonialCard
                testimonial={testimonial}
                indexString={String(i + 1).padStart(2, '0')}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Controls & View All Button - Universal for all devices */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-2 mb-2 pb-0">
         {/* Navigation Arrows */}
         <div className="flex gap-4">
             <button 
                onClick={prev} 
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-[#faf8f4] border-2 border-[#e0d6c8] text-[#a37c44] hover:bg-[#a37c44] hover:text-white rounded-full transition-colors focus:outline-none"
                aria-label="Previous testimonials"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             </button>
             <button 
                onClick={next} 
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-[#faf8f4] border-2 border-[#e0d6c8] text-[#a37c44] hover:bg-[#a37c44] hover:text-white rounded-full transition-colors focus:outline-none"
                aria-label="Next testimonials"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
             </button>
         </div>

         {/* View All Button */}
         <a href="/testimonials" className="inline-flex items-center gap-2 px-6 py-2 sm:px-8 sm:py-2.5 bg-transparent border border-[#d8bd75] text-[#6b3b23] font-medium text-xs sm:text-sm hover:bg-[#d8bd75] hover:text-white transition-colors uppercase tracking-wider">
            View All Testimonials
         </a>
      </div>
    </div>
  );
}`;
fs.writeFileSync('src/components/home/HomeTestimonialSlider.tsx', code);
console.log('Final Slider UI set');
