import fs from 'fs';
const code = 'use client';
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
    <div className="relative w-full max-w-6xl mx-auto px-2 md:px-12">
      <div className="overflow-hidden no-scrollbar">
        <div 
           className="flex transition-transform duration-500 ease-in-out" 
           style={{ transform: \	ranslateX(-\%)\ }}
        >
          {testimonials.map((testimonial, i) => (
            <div 
              key={testimonial.id} 
              style={{ width: \\%\, flexShrink: 0, padding: '0 5px' }}
              className="md:px-[10px]"
            >
              <TestimonialCard
                testimonial={testimonial}
                indexString={String(i + 1).padStart(2, '0')}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop side buttons */}
      <button 
        onClick={prev} 
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow border border-gray-200 text-[#6b3b23] hover:bg-gray-50 focus:outline-none"
        aria-label="Previous testimonials"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>

      <button 
        onClick={next} 
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow border border-gray-200 text-[#6b3b23] hover:bg-gray-50 focus:outline-none"
        aria-label="Next testimonials"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* Mobile controls & View All */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-6 md:mt-10 pb-4 md:pb-8">
         <div className="flex md:hidden gap-4">
             <button 
                onClick={prev} 
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow border border-gray-200 text-[#6b3b23] hover:bg-gray-50 focus:outline-none"
                aria-label="Previous testimonials"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             </button>
             <button 
                onClick={next} 
                className="flex items-center justify-center w-10 h-10 bg-white rounded-full shadow border border-gray-200 text-[#6b3b23] hover:bg-gray-50 focus:outline-none"
                aria-label="Next testimonials"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
             </button>
         </div>

         <a href="/testimonials" className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3 bg-transparent border border-[#d8bd75] text-[#6b3b23] font-medium text-xs sm:text-sm hover:bg-[#d8bd75] hover:text-white transition-colors uppercase tracking-wider">
            View All Testimonials
         </a>
      </div>
    </div>
  );
};
fs.writeFileSync('src/components/home/HomeTestimonialSlider.tsx', code);
console.log('Slider fixed.');
