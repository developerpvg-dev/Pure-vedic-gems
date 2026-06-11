export const CATEGORY_REVIEW_POOL_SLUGS = new Set([
  'navaratna', 'navratna',
  'upratna', 'uparatna',
  'rudraksha', 'rudrakhas',
  'idol', 'idols',
  'jewelry', 'jewellery',
  'mala', 'malas',
]);

export function normalizeReviewCategory(category: string) {
  const lower = category.toLowerCase();
  if (lower === 'navratna') return 'navaratna';
  if (lower === 'uparatna') return 'upratna';
  if (lower === 'rudrakhas') return 'rudraksha';
  if (lower === 'idols') return 'idol';
  if (lower === 'jewellery') return 'jewelry';
  if (lower === 'malas') return 'mala';
  return lower;
}

export function usesCategoryReviewPool(category: string | null | undefined, subCategory: string | null | undefined) {
  if (!category || !subCategory) return false;
  return CATEGORY_REVIEW_POOL_SLUGS.has(category.toLowerCase());
}

export const NAVARATNA_SUBCATEGORIES = [
  { slug: 'ruby', label: 'Ruby (Manik)' },
  { slug: 'pearl', label: 'Pearl (Moti)' },
  { slug: 'red-coral', label: 'Red Coral (Moonga)' },
  { slug: 'emerald', label: 'Emerald (Panna)' },
  { slug: 'yellow-sapphire', label: 'Yellow Sapphire (Pukhraj)' },
  { slug: 'diamond', label: 'Diamond (Heera)' },
  { slug: 'blue-sapphire', label: 'Blue Sapphire (Neelam)' },
  { slug: 'hessonite', label: 'Hessonite (Gomed)' },
  { slug: 'cats-eye', label: "Cat's Eye (Lehsunia)" },
] as const;

export const RUDRAKSHA_SUBCATEGORIES = [
  { slug: '1-mukhi', label: '1 Mukhi Rudraksha' },
  { slug: '2-mukhi', label: '2 Mukhi Rudraksha' },
  { slug: '3-mukhi', label: '3 Mukhi Rudraksha' },
  { slug: '4-mukhi', label: '4 Mukhi Rudraksha' },
  { slug: '5-mukhi', label: '5 Mukhi Rudraksha' },
  { slug: '6-mukhi', label: '6 Mukhi Rudraksha' },
  { slug: '7-mukhi', label: '7 Mukhi Rudraksha' },
  { slug: '8-mukhi', label: '8 Mukhi Rudraksha' },
  { slug: '9-mukhi', label: '9 Mukhi Rudraksha' },
  { slug: '10-mukhi', label: '10 Mukhi Rudraksha' },
  { slug: '11-mukhi', label: '11 Mukhi Rudraksha' },
  { slug: '12-mukhi', label: '12 Mukhi Rudraksha' },
  { slug: '13-mukhi', label: '13 Mukhi Rudraksha' },
  { slug: '14-mukhi', label: '14 Mukhi Rudraksha' },
  { slug: '15-mukhi', label: '15 Mukhi Rudraksha' },
  { slug: '16-mukhi', label: '16 Mukhi Rudraksha' },
  { slug: '17-mukhi', label: '17 Mukhi Rudraksha' },
  { slug: '18-mukhi', label: '18 Mukhi Rudraksha' },
  { slug: '19-mukhi', label: '19 Mukhi Rudraksha' },
  { slug: '20-mukhi', label: '20 Mukhi Rudraksha' },
  { slug: '21-mukhi', label: '21 Mukhi Rudraksha' },
  { slug: 'gauri-shankar', label: 'Gauri Shankar Rudraksha' },
  { slug: 'ganesh-rudraksha', label: 'Ganesh Rudraksha' },
] as const;

export const UPRATNA_SUBCATEGORIES = [
  { slug: 'opal', label: 'Opal' },
  { slug: 'turquoise', label: 'Turquoise (Firoza)' },
  { slug: 'amethyst', label: 'Amethyst (Katela)' },
  { slug: 'moonstone', label: 'Moonstone' },
  { slug: 'garnet', label: 'Garnet' },
  { slug: 'peridot', label: 'Peridot' },
  { slug: 'lapis-lazuli', label: 'Lapis Lazuli' },
  { slug: 'citrine', label: 'Citrine (Sunela)' },
  { slug: 'aquamarine', label: 'Aquamarine' },
  { slug: 'hakik', label: 'Hakik (Agate)' },
  { slug: 'white-topaz', label: 'White Topaz' },
  { slug: 'blue-topaz', label: 'Blue Topaz' },
  { slug: 'iolite', label: 'Iolite' },
  { slug: 'diopside', label: 'Diopside' },
  { slug: 'malachite', label: 'Malachite' },
  { slug: 'tiger-eye', label: 'Tiger Eye' },
  { slug: 'kyanite', label: 'Kyanite' },
  { slug: 'sunstone', label: 'Sunstone' },
  { slug: 'rose-quartz', label: 'Rose Quartz' },
  { slug: 'tanzanite', label: 'Tanzanite' },
  { slug: 'pitambari', label: 'Pitambari' },
] as const;

export const IDOL_SUBCATEGORIES = [
  { slug: 'shree-yantra', label: 'Shree Yantra' },
  { slug: 'durga-devi', label: 'Durga Devi' },
  { slug: 'hanuman', label: 'Hanuman' },
  { slug: 'shiv-ji', label: 'Shiv Ji' },
  { slug: 'shivling', label: 'Shivling' },
  { slug: 'ganesha', label: 'Ganesha' },
  { slug: 'lakshmi', label: 'Lakshmi' },
  { slug: 'nandi', label: 'Nandi' },
  { slug: 'saraswati', label: 'Saraswati' },
  { slug: 'vishnu', label: 'Vishnu' },
] as const;

export const JEWELRY_SUBCATEGORIES = [
  { slug: 'ring', label: 'Rings' },
  { slug: 'pendant', label: 'Pendants' },
  { slug: 'bracelets', label: 'Bracelets' },
  { slug: 'necklace', label: 'Necklaces' },
  { slug: 'earring', label: 'Earrings' },
  { slug: 'diamond-jewellery', label: 'Diamond Jewellery' },
  { slug: 'rudraksha-jewelry', label: 'Rudraksha Jewelry' },
  { slug: 'astro-gems-stock', label: 'Ready Astro-Gems Stock' },
] as const;

export const MALA_SUBCATEGORIES = [
  { slug: 'malas', label: 'Rudraksha Malas' },
  { slug: 'exclusive-rudraksha-malas', label: 'Exclusive Rudraksha Malas' },
] as const;

export function subcategoriesForReviewCategory(category: string) {
  const normalized = normalizeReviewCategory(category);
  if (normalized === 'rudraksha') return RUDRAKSHA_SUBCATEGORIES;
  if (normalized === 'upratna') return UPRATNA_SUBCATEGORIES;
  if (normalized === 'idol') return IDOL_SUBCATEGORIES;
  if (normalized === 'jewelry') return JEWELRY_SUBCATEGORIES;
  if (normalized === 'mala') return MALA_SUBCATEGORIES;
  return NAVARATNA_SUBCATEGORIES;
}
