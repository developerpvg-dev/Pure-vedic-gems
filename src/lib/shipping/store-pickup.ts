/** India checkout plan: customer collects the order in Delhi. Cost stays 0. */
export const STORE_PICKUP_METHOD_ID = 'collect_at_store';

export const STORE_PICKUP_LOCATIONS = [
  {
    title: 'Registered Address (Delhi)',
    lines: ['E-1566, JJ Tigri', 'New Delhi 110062, India'],
  },
  {
    title: 'Retail Outlet (Showroom)',
    lines: [
      'FF-32, MGF Metropolitan Mall',
      'Opposite Saket (Lawyers) Court',
      'Distt. Centre Saket, New Delhi 110017, India',
      'Nearest Metro: Malviya Nagar (Yellow Line)',
    ],
  },
] as const;
