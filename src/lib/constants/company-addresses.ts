/**
 * Official Pure Vedic Gems Pvt. Ltd. addresses — single source of truth.
 * Update here only; consumed by footer, contact, stores, about, SEO, and nav.
 */

export const COMPANY_LEGAL_NAME = 'PURE VEDIC GEMS PVT. LTD.' as const;

export type AddressBlock = {
  label: string;
  lines: readonly string[];
};

export type OfficeLocation = {
  id: string;
  title: string;
  region: string;
  flag: string;
  photo: string;
  mapUrl: string;
  mapEmbedUrl: string;
  addresses: readonly AddressBlock[];
  landmark?: string;
  hours: string;
};

const DELHI_SHOWROOM_MAP_QUERY =
  'FF-32%20MGF%20Metropolitan%20Mall%20Saket%20New%20Delhi%20110017';
const UK_OFFICE_MAP_QUERY = 'Juniper%20Court%20Hanworth%20Road%20Hounslow%20TW3%203TL%20UK';
const SULTANPUR_RESEARCH_MAP_QUERY =
  'Pure%20Vedic%20Science%20and%20Research%20Centre%20CRC%20Design%20Centre%20Road%20Sultanpur%20Delhi%20110030';

export const DELHI_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${DELHI_SHOWROOM_MAP_QUERY}`;
export const UK_OFFICE_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${UK_OFFICE_MAP_QUERY}`;
export const SULTANPUR_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${SULTANPUR_RESEARCH_MAP_QUERY}`;

export const DELHI_MAP_EMBED = `https://maps.google.com/maps?hl=en&q=${DELHI_SHOWROOM_MAP_QUERY}&z=15&output=embed`;
export const UK_OFFICE_MAP_EMBED = `https://maps.google.com/maps?hl=en&q=${UK_OFFICE_MAP_QUERY}&z=14&output=embed`;
export const SULTANPUR_MAP_EMBED = `https://maps.google.com/maps?hl=en&q=${SULTANPUR_RESEARCH_MAP_QUERY}&z=15&output=embed`;

export const DELHI_REGISTERED_ADDRESS: AddressBlock = {
  label: 'Registered Address (Delhi)',
  lines: ['E-1566, JJ Tigri', 'New Delhi-110062, India'],
};

export const DELHI_SHOWROOM_ADDRESS: AddressBlock = {
  label: 'Retail Outlet (Showroom) Address (Delhi)',
  lines: [
    'FF-32, MGF Metropolitan Mall',
    'Opposite Saket (Lawyers) Court',
    'Distt. Centre Saket, New Delhi-110017, India',
  ],
};

export const UK_OFFICE_ADDRESS: AddressBlock = {
  label: 'Office Address (UK)',
  lines: ['Juniper Court, Hanworth Road', 'Hounslow, TW3 3TL, United Kingdom'],
};

export const UK_REGISTERED_ADDRESS: AddressBlock = {
  label: 'Registered Address (UK)',
  lines: ['Winstanley Ln, Shenley Lodge', 'Milton Keynes, MK5 7BT, UK'],
};

export const SULTANPUR_RESEARCH_ADDRESS: AddressBlock = {
  label: 'Vedic Research Centre Address',
  lines: [
    'Khasra No. 382, Balaji Building',
    'Pure Vedic Science and Research Centre, CRC Design Centre Road',
    'Near Shiv Shakti Temple, Nearby Sultanpur Metro Station',
    'Delhi, Bharat — 110030',
  ],
};

export const DELHI_SHOWROOM_LANDMARK = 'Nearest Metro: Malviya Nagar (Yellow Line)';
export const SULTANPUR_RESEARCH_LANDMARK = 'Nearest Metro: Sultanpur (Yellow Line)';

export const OFFICE_LOCATIONS: readonly OfficeLocation[] = [
  {
    id: 'delhi',
    title: 'Delhi',
    region: 'India',
    flag: '/flags/india.svg',
    photo: '/home/hero/pvgheropc2.webp',
    mapUrl: DELHI_MAP_URL,
    mapEmbedUrl: DELHI_MAP_EMBED,
    addresses: [DELHI_REGISTERED_ADDRESS, DELHI_SHOWROOM_ADDRESS],
    landmark: DELHI_SHOWROOM_LANDMARK,
    hours: '11:00 am – 8:00 pm · Weekly off: Wednesday',
  },
  {
    id: 'uk',
    title: 'United Kingdom',
    region: COMPANY_LEGAL_NAME,
    flag: '/flags/uk.svg',
    photo: '/home/hero/pvgheropc1.webp',
    mapUrl: UK_OFFICE_MAP_URL,
    mapEmbedUrl: UK_OFFICE_MAP_EMBED,
    addresses: [UK_OFFICE_ADDRESS, UK_REGISTERED_ADDRESS],
    hours: 'By appointment only',
  },
  {
    id: 'sultanpur',
    title: 'Sultanpur',
    region: 'Delhi, India',
    flag: '/flags/india.svg',
    photo: '/home/ourservicesimg/retail-store.webp',
    mapUrl: SULTANPUR_MAP_URL,
    mapEmbedUrl: SULTANPUR_MAP_EMBED,
    addresses: [SULTANPUR_RESEARCH_ADDRESS],
    landmark: SULTANPUR_RESEARCH_LANDMARK,
    hours: '10:00 am – 7:00 pm · Weekly off: Wednesday',
  },
] as const;

/** Compact footer / nav location summaries */
export const FOOTER_LOCATIONS = [
  {
    tag: 'IN',
    city: 'Delhi – Saket (Showroom)',
    address: DELHI_SHOWROOM_ADDRESS.lines.join(', '),
  },
  {
    tag: 'IN',
    city: 'Delhi – Sultanpur (Research Centre)',
    address: SULTANPUR_RESEARCH_ADDRESS.lines.join(', '),
  },
  {
    tag: 'UK',
    city: 'London – Hounslow (Office)',
    address: UK_OFFICE_ADDRESS.lines.join(', '),
  },
] as const;

/** About page location cards */
export const ABOUT_LOCATION_CARDS = [
  {
    title: 'Delhi Retail Outlet (Showroom)',
    city: 'Saket, New Delhi',
    image: '/home/hero/pvgheropc2.webp',
    mapUrl: DELHI_MAP_URL,
    embedUrl: DELHI_MAP_EMBED,
    copy: `${DELHI_SHOWROOM_ADDRESS.lines.join(', ')}. ${DELHI_SHOWROOM_LANDMARK}. Retail, wholesale, and export hub for ${COMPANY_LEGAL_NAME}`,
  },
  {
    title: 'Pure Vedic Science and Research Centre',
    city: 'Sultanpur, Delhi',
    image: '/home/whoweare/puja-energization.jpeg',
    mapUrl: SULTANPUR_MAP_URL,
    embedUrl: SULTANPUR_MAP_EMBED,
    copy: `${SULTANPUR_RESEARCH_ADDRESS.lines.slice(1).join(', ')}. ${SULTANPUR_RESEARCH_LANDMARK}. Gems, Rudraksha, yagya, healing therapy, Vedic astrology, research, and energizing centre.`,
  },
  {
    title: 'UK Office',
    city: 'Hounslow, London',
    image: '/home/hero/pvgheropc1.webp',
    mapUrl: UK_OFFICE_MAP_URL,
    embedUrl: UK_OFFICE_MAP_EMBED,
    copy: `${UK_OFFICE_ADDRESS.lines.join(', ')}. Appointment-based support for overseas clients through official Pure Vedic Gems UK channels.`,
  },
] as const;

/** Schema.org PostalAddress payloads */
export function postalAddressJsonLd(input: {
  streetAddress: string;
  addressLocality: string;
  addressRegion?: string;
  postalCode: string;
  addressCountry: string;
}) {
  return {
    '@type': 'PostalAddress' as const,
    streetAddress: input.streetAddress,
    addressLocality: input.addressLocality,
    ...(input.addressRegion ? { addressRegion: input.addressRegion } : {}),
    postalCode: input.postalCode,
    addressCountry: input.addressCountry,
  };
}

export const ORGANIZATION_ADDRESSES = [
  postalAddressJsonLd({
    streetAddress: 'E-1566, JJ Tigri',
    addressLocality: 'New Delhi',
    addressRegion: 'Delhi',
    postalCode: '110062',
    addressCountry: 'IN',
  }),
  postalAddressJsonLd({
    streetAddress: 'FF-32, MGF Metropolitan Mall, Distt. Centre Saket',
    addressLocality: 'New Delhi',
    addressRegion: 'Delhi',
    postalCode: '110017',
    addressCountry: 'IN',
  }),
  postalAddressJsonLd({
    streetAddress:
      'Khasra No. 382, Balaji Building, CRC Design Centre Road, Near Shiv Shakti Temple',
    addressLocality: 'Sultanpur, Delhi',
    addressRegion: 'Delhi',
    postalCode: '110030',
    addressCountry: 'IN',
  }),
  postalAddressJsonLd({
    streetAddress: 'Juniper Court, Hanworth Road',
    addressLocality: 'Hounslow',
    addressRegion: 'London',
    postalCode: 'TW3 3TL',
    addressCountry: 'GB',
  }),
  postalAddressJsonLd({
    streetAddress: 'Winstanley Ln, Shenley Lodge',
    addressLocality: 'Milton Keynes',
    postalCode: 'MK5 7BT',
    addressCountry: 'GB',
  }),
] as const;
