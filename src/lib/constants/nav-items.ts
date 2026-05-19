export const SITE_CONFIG = {
  name: 'PureVedicGems',
  tagline: 'Heritage Vedic Gemstones Since 1937',
  description:
    'Certified natural Vedic gemstones, Rudraksha, and custom jewelry from a trusted heritage brand.',
  founded: 1937,
  phone: '+91-9871582404',
  email: 'info@purevedicgems.com',
  address: {
    street: '',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    pincode: '',
  },
} as const;

export type TopbarItem = {
  label: string;
  kind: 'location' | 'phone' | 'email' | 'shipping';
  flag?: string;      // emoji flag e.g. '🇮🇳', '🇬🇧'
  tag?: string;       // country tag e.g. 'IN', 'GB'
  highlight?: boolean;
};

export const TOPBAR_ITEMS: readonly TopbarItem[] = [
  { label: 'Saket, New Delhi', kind: 'location', flag: '🇮🇳', tag: 'IN' },
  { label: 'Noida, Sector-49', kind: 'location', flag: '🇮🇳', tag: 'IN' },
  { label: 'Hounslow, London UK', kind: 'location', flag: '🇬🇧', tag: 'GB' },
  { label: '+91-9871582404', kind: 'phone' },
  { label: 'info@purevedicgems.com', kind: 'email' },
  { label: 'Insured Worldwide Shipping', kind: 'shipping', highlight: true },
  { label: '+91-9310172512', kind: 'phone' },
] as const;

export const GEMSTONE_NAV_LINKS = [
  { label: 'Ruby', href: '/shop/navaratna/ruby', swatch: '#c9142f', planet: 'Sun' },
  { label: 'Blue Sapphire', href: '/shop/navaratna/blue-sapphire', swatch: '#1e4f9d', planet: 'Saturn' },
  { label: 'Emerald', href: '/shop/navaratna/emerald', swatch: '#2e8b57', planet: 'Mercury' },
  { label: 'Yellow Sapphire', href: '/shop/navaratna/yellow-sapphire', swatch: '#d4a017', planet: 'Jupiter' },
  { label: 'Hessonite', href: '/shop/navaratna/hessonite', swatch: '#b7682c', planet: 'Rahu' },
  { label: 'Amethyst', href: '/shop/upratna/amethyst', swatch: '#6a4fb3', planet: 'Upratna' },
  { label: "Cat's Eye", href: '/shop/navaratna/cats-eye', swatch: '#9c8b68', planet: 'Ketu' },
  { label: 'Diamond', href: '/shop/navaratna/diamond', swatch: '#d8d8d8', planet: 'Venus' },
  { label: 'Red Coral', href: '/shop/navaratna/red-coral', swatch: '#e15b3c', planet: 'Mars' },
] as const;

export const RUDRAKSHA_NAV_LINKS = [
  { label: '1 Mukhi', href: '/shop/rudraksha/1-mukhi' },
  { label: '5 Mukhi', href: '/shop/rudraksha/5-mukhi' },
  { label: '7 Mukhi', href: '/shop/rudraksha/7-mukhi' },
  { label: '14 Mukhi', href: '/shop/rudraksha/14-mukhi' },
  { label: 'Rudraksha Malas', href: '/shop/malas' },
  { label: 'View All Rudraksha', href: '/shop/rudraksha' },
] as const;

export const SERVICE_NAV_LINKS = [
  { label: 'Vedic Consultation', href: '/consultation' },
  { label: 'Gem Energization', href: '/configure' },
  { label: 'Ring & Pendant Making', href: '/configure' },
  { label: 'Gem Lab Testing', href: '/knowledge/buying-guides' },
  { label: 'Custom Jewellery', href: '/configure' },
] as const;

export type HeaderNavItem = {
  label: string;
  href: string;
  dropdown?: 'gemstones' | 'rudraksha' | 'collections' | 'services' | 'knowledge';
};

export const HEADER_NAV_ITEMS: readonly HeaderNavItem[] = [
  { label: 'Gemstones', href: '/shop', dropdown: 'gemstones' },
  { label: 'Rudraksha', href: '/shop/rudraksha', dropdown: 'rudraksha' },
  { label: 'Knowledge', href: '/knowledge', dropdown: 'knowledge' },
  { label: 'Blog', href: '/blog' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const NAV_ITEMS = [
  { label: 'Gemstones', href: '/shop' },
  { label: 'Rudraksha', href: '/shop/rudraksha' },
  { label: 'Knowledge', href: '/knowledge' },
  { label: 'Blog', href: '/blog' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const SOCIAL_LINKS = {
  whatsapp: '',
  instagram: '',
  facebook: '',
  youtube: '',
} as const;
