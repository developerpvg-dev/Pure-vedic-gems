import { createOptionalPublicClient } from '@/lib/supabase/public';

export interface PublicExpert {
  id: string;
  name: string;
  title: string | null;
  photo_url: string | null;
  specialty: string | null;
  years_experience: number | null;
  bio: string | null;
  personal_quote?: string | null;
  rating: number;
  consultation_count: number;
  credentials: string[] | null;
  languages: string[] | null;
}

export const FALLBACK_EXPERTS: PublicExpert[] = [
  {
    id: 'vikas-mehra',
    name: 'Mr. Vikas Mehra',
    title: 'Master Gemologist & Vedic Scholar',
    photo_url: '/our_expets_img/Mr. Vikash Mehra.webp',
    specialty: 'Planetary Gemology and Vedic Guidance',
    years_experience: 20,
    bio: 'A third-generation jewellery expert who bridges Jyotish guidance with gemstone selection, certification review, and practical buying advice.',
    personal_quote: 'Every stone carries a cosmic fingerprint - our duty is to match its destiny with yours.',
    rating: 5,
    consultation_count: 3200,
    credentials: ['GIA Certified', 'IIG Certified', 'EGL Certified'],
    languages: ['English', 'Hindi'],
  },
  {
    id: 'tanya-mehra',
    name: 'Mrs. Tanya Mehra',
    title: 'Vedic Astrology Research Specialist',
    photo_url: '/our_expets_img/Mrs . Tanya Mehra.webp',
    specialty: 'Birth Chart Analysis and Gemstone Suitability',
    years_experience: 15,
    bio: 'A dedicated Vedic astrology specialist focused on planetary influences, gemstone suitability, and customer guidance before purchase.',
    personal_quote: 'The cosmos speaks through gemstones - our role is to help you listen.',
    rating: 5,
    consultation_count: 2400,
    credentials: ['Jyotish Vidya', 'Planetary Gemology', 'Gem Prescription'],
    languages: ['English', 'Hindi'],
  },
  {
    id: 'vrayas-mehra',
    name: 'Mr. Vrayas Mehra',
    title: 'GIA Certified Gemologist',
    photo_url: '/our_expets_img/Mr. Vrayas Mehra.webp',
    specialty: 'Gemstone Sourcing and Quality Certification',
    years_experience: 8,
    bio: 'A fourth-generation jeweller bringing modern gemological training into the family legacy of certified natural gemstones.',
    personal_quote: 'Craftsmanship passed through generations lives in every gem we offer.',
    rating: 5,
    consultation_count: 1100,
    credentials: ['GIA Certified', 'Gemstone Sourcing', 'Quality Certification'],
    languages: ['English', 'Hindi'],
  },
];

export async function getAvailableExperts(options: { includeFallback?: boolean } = {}): Promise<PublicExpert[]> {
  const includeFallback = options.includeFallback ?? true;
  const supabase = createOptionalPublicClient();

  if (!supabase) return includeFallback ? FALLBACK_EXPERTS : [];

  const { data, error } = await supabase
    .from('experts')
    .select('id, name, title, photo_url, specialty, years_experience, bio, personal_quote, rating, consultation_count, credentials, languages')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) return includeFallback ? FALLBACK_EXPERTS : [];

  return data;
}