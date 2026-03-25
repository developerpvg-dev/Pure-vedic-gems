const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://purevedicgems.com';

export const SEO_DEFAULTS = {
  titleTemplate: '%s | PureVedicGems — Heritage Vedic Gemstones Since 1937',
  defaultTitle: 'PureVedicGems — Heritage Vedic Gemstones Since 1937',
  description:
    'Certified natural Vedic gemstones, Rudraksha, and custom jewelry from a trusted heritage brand established in 1937. Expert astrological guidance with 87+ years of legacy.',
  openGraph: {
    type: 'website' as const,
    locale: 'en_IN',
    siteName: 'PureVedicGems',
    url: BASE_URL,
  },
} as const;
