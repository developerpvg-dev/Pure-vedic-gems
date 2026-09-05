import Image from 'next/image';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { WHY_CHOOSE_US_PROMISES } from '@/lib/constants/why-choose-us';
import { toPublicAssetUrl } from '@/lib/site-static';

export function WhyChooseUsSection() {
  return (
    <section className="bg-[#fdf7ee] px-4 py-12 sm:px-6 lg:py-16" aria-labelledby="why-choose-us-heading">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mx-auto max-w-fit text-center">
            <h2
              className="text-center text-4xl font-black leading-tight tracking-tight text-[#261a10] md:text-5xl"
              id="why-choose-us-heading"
            >
              Why Choose Us
            </h2>
            <div className="mx-auto mt-4 h-px w-24 bg-[#c9a84c]" />
          </div>
        </ScrollReveal>

        <div className="mt-10 -mx-4 overflow-x-auto px-4 pb-3 [scrollbar-color:#c9a84c_transparent] [scrollbar-width:thin] md:mx-0 md:overflow-visible md:px-0 md:pb-0">
          <div className="grid auto-cols-[46%] grid-flow-col gap-4 sm:auto-cols-[31%] md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:gap-5 lg:grid-cols-6">
            {WHY_CHOOSE_US_PROMISES.map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 55}>
                <div className="flex h-full flex-col items-center rounded-2xl border border-[#d8bd65]/70 bg-[#fff4cf] px-4 py-6 text-center shadow-[0_8px_24px_rgba(61,43,31,0.06)] transition hover:-translate-y-1 hover:border-[#c9a84c] hover:bg-[#fffaf0] hover:shadow-[0_12px_30px_rgba(201,168,76,0.18)]">
                  <div className="relative h-16 w-16">
                    <Image
                      src={toPublicAssetUrl(item.icon)}
                      alt={item.title}
                      fill
                      className="object-contain"
                      sizes="64px"
                    />
                  </div>
                  <div className="mt-3 h-px w-8 bg-[#c9a84c]" />
                  <h3 className="mt-3 text-sm font-bold text-[#261a10]">{item.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[#5a4a3a]">{item.copy}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
