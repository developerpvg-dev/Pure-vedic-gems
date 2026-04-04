import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { HeroSection } from '@/components/home/HeroSection';
import { CertMarquee } from '@/components/layout/CertMarquee';
import { NavaratnaGrid } from '@/components/home/NavaratnaGrid';
import { UpratnaGrid } from '@/components/home/UpratnaGrid';
import { FeaturedGems } from '@/components/home/FeaturedGems';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { DirectorsPick } from '@/components/home/DirectorsPick';
import { ConfiguratorCTA } from '@/components/home/ConfiguratorCTA';
import { KnowledgeHighlights } from '@/components/home/KnowledgeHighlights';
import { ExpertTeam } from '@/components/home/ExpertTeam';
import { HeritageTimeline } from '@/components/home/HeritageTimeline';
import { Testimonials } from '@/components/home/Testimonials';
import { RecommendationCTA } from '@/components/home/RecommendationCTA';
import { WhatsAppFloat } from '@/components/home/WhatsAppFloat';
import { PromoBanners } from '@/components/home/PromoBanners';

export const revalidate = 300; // ISR: 5 minutes

/* Lotus ornamental divider used between major sections */
function LotusDivider() {
  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <span className="h-px w-16 bg-[var(--pvg-border)] md:w-24" />
      <span className="text-sm text-[var(--pvg-accent)]">✦</span>
      <span className="h-px w-16 bg-[var(--pvg-border)] md:w-24" />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Lab Certification Marquee */}
      <CertMarquee />

      {/* Promo Banners */}
      <ScrollReveal>
        <PromoBanners />
      </ScrollReveal>

      {/* 3. Navaratna Grid — 9 Sacred Gems */}
      <ScrollReveal>
        <NavaratnaGrid />
      </ScrollReveal>

      {/* 3b. Upratna Grid — Semi-Precious Gems */}
      <ScrollReveal>
        <UpratnaGrid />
      </ScrollReveal>

      <LotusDivider />

      {/* 5. Featured Gems — Scroll Carousel */}
      <FeaturedGems />

      {/* 5b. Category Showcase — Rudraksha, Idols, Jewellery */}
      <ScrollReveal>
        <CategoryShowcase />
      </ScrollReveal>

      {/* 6. Director's Pick */}
      <ScrollReveal>
        <DirectorsPick />
      </ScrollReveal>

      <LotusDivider />

      {/* 7. Gem-to-Jewellery Configurator */}
      <ScrollReveal>
        <ConfiguratorCTA />
      </ScrollReveal>

      {/* 8. Knowledge Hub */}
      <ScrollReveal>
        <KnowledgeHighlights />
      </ScrollReveal>

      {/* 9. Expert Team */}
      <ScrollReveal>
        <ExpertTeam />
      </ScrollReveal>

      {/* 10. Heritage Timeline */}
      <ScrollReveal>
        <HeritageTimeline />
      </ScrollReveal>

      <LotusDivider />

      {/* 11. Testimonials */}
      <ScrollReveal>
        <Testimonials />
      </ScrollReveal>

      {/* 12. Recommendation CTA */}
      <ScrollReveal>
        <RecommendationCTA />
      </ScrollReveal>

      {/* WhatsApp Float */}
      <WhatsAppFloat />
    </>
  );
}
