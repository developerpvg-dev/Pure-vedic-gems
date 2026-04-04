/**
 * Configurator types for PureVedicGems 7-Step Gem-to-Jewelry Configurator.
 */

import type { ProductCard } from './product';
import type {
  JewelryDesign,
  CertificationLab,
  EnergizationOption,
} from './database';

// ─── Step Definitions ────────────────────────────────────────────────────────

export const CONFIGURATOR_STEPS = [
  { id: 1, key: 'gem_category', title: 'Select Gemstone', short: 'Gemstone Type' },
  { id: 2, key: 'gem_browse', title: 'Choose Stone', short: 'Your Stone' },
  { id: 3, key: 'setting_type', title: 'Setting Type', short: 'Setting' },
  { id: 4, key: 'design', title: 'Select Design', short: 'Design' },
  { id: 5, key: 'metal_size', title: 'Metal & Size', short: 'Metal & Size' },
  { id: 6, key: 'certification', title: 'Certification Lab', short: 'Certification' },
  { id: 7, key: 'energization', title: 'Energization & Puja', short: 'Energization' },
] as const;

export type StepKey = (typeof CONFIGURATOR_STEPS)[number]['key'];

// ─── Setting Types ──────────────────────────────────────────────────────────

export const SETTING_TYPES = ['ring', 'pendant', 'bracelet', 'loose'] as const;
export type SettingType = (typeof SETTING_TYPES)[number];

export const SETTING_TYPE_META: Record<
  SettingType,
  { label: string; icon: string; description: string }
> = {
  ring: { label: 'Ring', icon: '💍', description: 'Classic gemstone ring in your choice of metal' },
  pendant: { label: 'Pendant', icon: '📿', description: 'Elegant pendant with chain, worn close to the heart' },
  bracelet: { label: 'Bracelet', icon: '⌚', description: 'Beautiful bracelet with secure gem setting' },
  loose: { label: 'Loose Stone', icon: '💎', description: 'Certified loose gem — set it later or keep as-is' },
};

// ─── Metal Types ────────────────────────────────────────────────────────────

/** Fallback metal options — used when admin metals API is unavailable */
export const METAL_OPTIONS = [
  { id: 'silver_925', label: 'Silver 925', priceKey: 'silver' as const },
  { id: 'panchdhatu', label: 'Panchdhatu', priceKey: 'panchdhatu' as const },
  { id: 'gold_18k', label: 'Gold 18K', priceKey: 'gold_18k' as const },
  { id: 'gold_22k', label: 'Gold 22K', priceKey: 'gold_22k' as const },
  { id: 'platinum', label: 'Platinum', priceKey: 'platinum' as const },
] as const;

/** Dynamic — supports any admin-created metal slug */
export type MetalId = string;

/** Shape of a metal option from the API or fallback */
export interface MetalOption {
  id: string;
  label: string;
  purity?: string;
  price_per_gram?: number;
}

// ─── Ring Sizes ─────────────────────────────────────────────────────────────

export const RING_SIZES = Array.from({ length: 24 }, (_, i) => ({
  value: String(i + 5),
  label: `Size ${i + 5}`,
}));

export const CHAIN_LENGTHS = [
  { value: '16', label: '16 inches' },
  { value: '18', label: '18 inches' },
  { value: '20', label: '20 inches' },
  { value: '22', label: '22 inches' },
  { value: '24', label: '24 inches' },
];

// ─── Navaratna Category Data ───────────────────────────────────────────────

/** Fallback Navaratna categories — used when API is unavailable */
export const NAVARATNA_CATEGORIES = [
  { id: 'ruby', name: 'Ruby', sanskrit: 'Manik', planet: 'Sun', emoji: '🔴', color: '#DC2626' },
  { id: 'pearl', name: 'Pearl', sanskrit: 'Moti', planet: 'Moon', emoji: '⚪', color: '#F5F5F4' },
  { id: 'red-coral', name: 'Red Coral', sanskrit: 'Moonga', planet: 'Mars', emoji: '🟠', color: '#EA580C' },
  { id: 'emerald', name: 'Emerald', sanskrit: 'Panna', planet: 'Mercury', emoji: '🟢', color: '#16A34A' },
  { id: 'yellow-sapphire', name: 'Yellow Sapphire', sanskrit: 'Pukhraj', planet: 'Jupiter', emoji: '🟡', color: '#CA8A04' },
  { id: 'diamond', name: 'Diamond', sanskrit: 'Heera', planet: 'Venus', emoji: '💎', color: '#A8A29E' },
  { id: 'blue-sapphire', name: 'Blue Sapphire', sanskrit: 'Neelam', planet: 'Saturn', emoji: '🔵', color: '#2563EB' },
  { id: 'hessonite', name: 'Hessonite', sanskrit: 'Gomed', planet: 'Rahu', emoji: '🟤', color: '#92400E' },
  { id: 'cats-eye', name: "Cat's Eye", sanskrit: 'Lehsunia', planet: 'Ketu', emoji: '🐱', color: '#65A30D' },
  { id: 'other', name: 'Other Gems', sanskrit: '', planet: '', emoji: '✨', color: '#C9A84C' },
] as const;

/** Dynamic — supports any admin-created gem category slug */
export type GemCategory = string;

/** Shape of a gem category from the API or fallback */
export interface GemCategoryOption {
  id: string;
  name: string;
  sanskrit?: string;
  planet?: string;
  emoji?: string;
  color?: string;
}

// ─── Pricing Breakdown ─────────────────────────────────────────────────────

export interface ConfigPricingBreakdown {
  gem_price: number;
  making_charge: number;
  metal_price: number;
  metal_weight_grams: number;
  gold_rate_per_gram: number;
  certification_fee: number;
  energization_fee: number;
  total: number;
}

// ─── Gold Rate ──────────────────────────────────────────────────────────────

export interface GoldRateData {
  gold_22k_per_gram: number;
  gold_18k_per_gram: number;
  silver_per_gram: number;
  panchdhatu_per_gram: number;
  platinum_per_gram: number;
  fetched_at: string;
}

// ─── Energization Form Data ────────────────────────────────────────────────

export interface EnergizationFormData {
  dob: string;
  gotra: string;
  rashi: string;
  record_ceremony: boolean;
}

// ─── Configurator State ─────────────────────────────────────────────────────

export interface ConfiguratorState {
  current_step: number;
  /** Step 1: Selected gem category (e.g. 'yellow-sapphire') */
  gem_category: GemCategory | null;
  /** Step 2: Product selected from the browsing grid */
  selected_product: ProductCard | null;
  /** Step 3: Type of jewelry setting */
  setting_type: SettingType | null;
  /** Step 4: Selected jewelry design from DB */
  selected_design: JewelryDesign | null;
  /** Step 4b: Custom uploaded design file URL */
  custom_design_url: string | null;
  /** Step 5: Metal selection */
  metal: MetalId | null;
  /** Step 5: Ring size (for rings) */
  ring_size: string | null;
  /** Step 5: Chain length (for pendants) */
  chain_length: string | null;
  /** Step 6: Selected certification lab */
  selected_lab: CertificationLab | null;
  /** Step 6: User explicitly chose no certification */
  certification_skipped: boolean;
  /** Step 7: Selected energization option */
  selected_energization: EnergizationOption | null;
  /** Step 7: Vedic birth details for energization */
  energization_form: EnergizationFormData | null;
  /** Computed pricing breakdown (recalculated on every selection change) */
  pricing: ConfigPricingBreakdown;
}

// ─── Actions ────────────────────────────────────────────────────────────────

export type ConfiguratorAction =
  | { type: 'SET_CATEGORY'; payload: GemCategory }
  | { type: 'SET_PRODUCT'; payload: ProductCard }
  | { type: 'SET_SETTING_TYPE'; payload: SettingType }
  | { type: 'SET_DESIGN'; payload: JewelryDesign }
  | { type: 'SET_CUSTOM_DESIGN_URL'; payload: string }
  | { type: 'SET_METAL'; payload: MetalId }
  | { type: 'SET_RING_SIZE'; payload: string | null }
  | { type: 'SET_CHAIN_LENGTH'; payload: string }
  | { type: 'SET_LAB'; payload: CertificationLab }
  | { type: 'SKIP_CERTIFICATION' }
  | { type: 'SET_ENERGIZATION'; payload: EnergizationOption | null }
  | { type: 'SET_ENERGIZATION_FORM'; payload: EnergizationFormData }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; payload: ConfiguratorState };
