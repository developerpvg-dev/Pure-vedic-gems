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

export const NAV_ITEMS = [
  { label: 'Gemstones', href: '/shop/gemstones' },
  { label: 'Rudraksha', href: '/shop/rudraksha' },
  { label: 'Jewelry', href: '/shop/jewelry' },
  { label: 'Knowledge', href: '/knowledge' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const SOCIAL_LINKS = {
  whatsapp: '',
  instagram: '',
  facebook: '',
  youtube: '',
} as const;
