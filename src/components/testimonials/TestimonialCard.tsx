'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, X } from 'lucide-react';
import { TestimonialProofButton } from './TestimonialProofButton';

const TESTIMONIAL_CARD_BG_WEBP = '/home/testimonial/cardbg.webp';
const TESTIMONIAL_CARD_BG_PNG = '/home/testimonial/cardbg.png';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-[#c99022]" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_unused, index) => (
        <Star key={index} className="h-4 w-4 sm:h-5 sm:w-5" fill={index < rating ? 'currentColor' : 'none'} color="#c99022" />
      ))}
    </div>
  );
}

function getInitials(name: string) {
    if (!name) return 'PG';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

type TestimonialCardProps = {
  testimonial: {
    id: string;
    name: string;
    location: string | null;
    rating?: number;
    message: string;
    proof_image_url?: string | null;
    proof_alt?: string | null;
  };
  indexString?: string;
};

export function TestimonialCard({ testimonial, indexString }: TestimonialCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const charLimit = 220;
  const isTruncated = testimonial.message.length > charLimit;
  const displayMessage = isTruncated 
      ? testimonial.message.substring(0, charLimit).trim() + '...' 
      : testimonial.message;

  const CardContent = ({ isExpanded = false }: { isExpanded?: boolean }) => (
    <div
      className={`pvg-testimonial-card-frame relative mx-auto flex w-full max-w-[800px] items-center justify-center ${
        isExpanded ? 'aspect-[3/2] min-h-[240px]' : 'aspect-[3/2] min-h-[210px] sm:min-h-[240px]'
      }`}
    >
      {/* Background Image — native img for reliable mobile/tablet rendering */}
      <div className="pointer-events-none absolute inset-0 z-0 drop-shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TESTIMONIAL_CARD_BG_WEBP}
          alt=""
          aria-hidden="true"
          className="block h-full w-full object-contain object-center"
          loading={isExpanded ? 'eager' : 'lazy'}
          decoding="async"
          onError={(event) => {
            const image = event.currentTarget;
            if (!image.src.includes('cardbg.png')) {
              image.src = TESTIMONIAL_CARD_BG_PNG;
            }
          }}
        />
      </div>

      {/* Content Area - finely tuned to sit within the bounds of the paper in the image */}
      <div className="relative z-10 flex flex-col h-[76%] w-[82%] mt-[4%] ml-[-3%] sm:ml-[-1%]">
        
        {/* Header: Stars */}
        <div className="flex items-center justify-end w-full mb-2 sm:mb-4 px-2 sm:px-4 shrink-0 mt-2 sm:mt-0 h-4 sm:h-6">
            <div className="mt-1 sm:mt-1.5">
                <Stars rating={testimonial.rating || 5} />
            </div>
        </div>

        {/* Body: Quote and Message */}
        <div className="flex gap-2 sm:gap-4 flex-1 overflow-hidden px-2 sm:px-4">
            <div className="text-[40px] sm:text-[60px] font-serif leading-none h-[30px] sm:h-[40px] mt-0 sm:mt-1 text-[#a56d29] opacity-90 select-none">
                &ldquo;
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pointer-events-auto">
                <p className={`whitespace-pre-wrap text-[#2c2c2c] font-medium z-10 relative ${isExpanded ? 'text-[14px] sm:text-[16px] leading-[1.8]' : 'text-[12px] sm:text-[14px] leading-[1.6]'}`}>
                    {isExpanded ? testimonial.message : displayMessage}
                    {!isExpanded && isTruncated && (
                       <button 
                         onClick={() => setIsModalOpen(true)}
                         className="ml-2 text-[#a56d29] font-bold hover:underline relative z-20"
                       >
                         Read more
                       </button>
                    )}
                </p>
            </div>
        </div>

        {/* Footer: User Details */}
        <div className="mt-2 sm:mt-4 flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4 relative z-10 before:absolute before:top-0 before:left-0 before:w-full before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#dfd3c3] before:to-transparent shrink-0 px-2 sm:px-4 mb-2 sm:mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 overflow-hidden rounded-full bg-[#eee5d5] shadow-sm flex justify-center items-center font-bold text-[#8a5b28] text-sm sm:text-lg select-none">
                {getInitials(testimonial.name)}
            </div>
            <div className="flex flex-col flex-1 min-w-0 justify-center">
            <h2 className="text-[14px] sm:text-[16px] font-medium text-[#111] leading-snug truncate">{testimonial.name}</h2>
            {testimonial.location && (
                <p className="text-[12px] sm:text-[14px] text-[#4a4a4a] mt-0.5 truncate">{testimonial.location}</p>
            )}
            </div>
            {testimonial.proof_image_url && (
            <div className={`ml-auto ${isExpanded ? '' : 'scale-[0.85] sm:scale-100 origin-right'}`}>
                <TestimonialProofButton proofUrl={testimonial.proof_image_url} proofAlt={testimonial.proof_alt || null} customerName={testimonial.name} />
            </div>
            )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative w-full max-w-none mx-auto">
        <CardContent />
      </div>

      {/* Expanded Modal */}
      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] p-4 sm:p-6 bg-black/60 shadow-2xl flex items-center justify-center pointer-events-auto" style={{ backdropFilter: 'blur(5px)' }} onClick={() => setIsModalOpen(false)}>
            <div className="relative w-full max-w-4xl max-h-[95vh] flex items-center justify-center overflow-hidden"
                 onClick={e => e.stopPropagation()}>
                <button onClick={() => setIsModalOpen(false)} className="absolute right-2 top-2 sm:right-10 sm:top-10 z-[120] bg-[#fdfaf6] p-2 rounded-full shadow-lg text-[#8a5b28] hover:bg-[#f0e8dc] transition" style={{ cursor: 'pointer' }}><X className="w-5 h-5 sm:w-6 sm:h-6" /></button>
                <div className="w-full relative animate-in fade-in zoom-in duration-300">
                    <CardContent isExpanded={true} />
                </div>
            </div>
        </div>,
        document.body
      )}
    </>
  );
}