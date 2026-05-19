import type { Metadata } from 'next';
import { PolicyArticlePage } from '@/components/policies/PolicyArticlePage';

export const metadata: Metadata = {
  title: 'Gemstone Care & Wearing Safety',
  description: 'Care, cleaning, wearing, storage, repair, and caution guidance for gemstones, Rudraksha, and jewellery.',
};

export default function GemstoneCarePage() {
  return (
    <PolicyArticlePage
      eyebrow="Care Guide"
      title="Gemstone Care & Wearing Safety"
      description="Practical care rules for preserving gemstones, Rudraksha, certificates, settings, and jewellery condition after delivery."
      updated="16 May 2026"
      sections={[
        {
          title: 'Daily Care',
          content: 'Avoid chemicals, perfume, ultrasonic cleaners, harsh detergents, sudden temperature changes, and impact. Remove gemstone jewellery before heavy work, swimming, gym activity, or chemical exposure.',
        },
        {
          title: 'Cleaning',
          content: 'Most jewellery can be wiped with a soft lint-free cloth. Use only mild soap and lukewarm water when suitable for the gemstone and setting. Pearls, corals, emeralds, treated stones, and Rudraksha require extra care and should not be soaked casually.',
        },
        {
          title: 'Rudraksha and Energized Items',
          content: 'Keep Rudraksha dry, avoid chemical oils unless advised, and store energized items respectfully. Ritual and spiritual guidance is traditional in nature and should be followed according to personal belief and expert advice.',
        },
        {
          title: 'Repairs and Inspection',
          content: 'Customers should inspect prongs, bezels, clasps, thread, and settings periodically. Contact support before sending any item for repair, polishing, replating, restringing, or inspection so the correct RMA/shipping process can be followed.',
        },
      ]}
    />
  );
}