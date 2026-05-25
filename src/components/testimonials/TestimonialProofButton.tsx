'use client';

type TestimonialProofButtonProps = {
  proofUrl: string | null;
  proofAlt: string | null;
  customerName: string;
};

export function TestimonialProofButton({ proofUrl }: TestimonialProofButtonProps) {
  if (!proofUrl) return null;

  return (
    <a
      href={proofUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-full border border-[#8a5b28]/30 bg-[#faf8f4] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#8a5b28] transition-colors hover:border-[#8a5b28] hover:bg-[#f0e8dc]"
    >
      View proof
    </a>
  );
}