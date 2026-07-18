import type { CanonicalAdminRole } from '@/lib/admin/rbac';

export type RoleNavMatch = 'exact' | 'prefix' | 'products' | 'drafts';

export type RoleNavLink = {
  href: string;
  label: string;
  match: RoleNavMatch;
};

export type RoleDashboardConfig = {
  title: string;
  subtitle: string;
  home: string;
  /** Path prefixes this role may open (plus /admin/join). */
  allowPrefixes: string[];
  nav: RoleNavLink[];
};

/** Roles that get a dedicated sidebar + path allowlist (stock_manager / designer keep their own layouts). */
export const SCOPED_ROLE_DASHBOARDS: Partial<Record<CanonicalAdminRole, RoleDashboardConfig>> = {
  finance: {
    title: 'Accountant',
    subtitle: 'Finance & compliance',
    home: '/admin/finance',
    allowPrefixes: ['/admin/finance', '/admin/compliance', '/admin/orders', '/admin/yagya-bookings'],
    nav: [
      { href: '/admin/finance', label: 'Finance', match: 'prefix' },
      { href: '/admin/compliance', label: 'Compliance & refunds', match: 'prefix' },
      { href: '/admin/orders', label: 'Orders', match: 'prefix' },
      { href: '/admin/yagya-bookings', label: 'Yagya bookings', match: 'prefix' },
    ],
  },
  content: {
    title: 'Website Maintenance',
    subtitle: 'Content, plans & pages',
    home: '/admin/hero',
    allowPrefixes: [
      '/admin/hero',
      '/admin/categories',
      '/admin/shop-category-pages',
      '/admin/directors-pick',
      '/admin/catalog-order',
      '/admin/consultation-plans',
      '/admin/reviews',
      '/admin/category-reviews',
      '/admin/notifications',
      '/admin/events',
      '/admin/videos',
      '/admin/lab-certificates',
      '/admin/testimonials',
      '/admin/feedback',
      '/admin/agent-sessions',
    ],
    nav: [
      { href: '/admin/hero', label: 'Hero slideshow', match: 'prefix' },
      { href: '/admin/categories', label: 'Section categories', match: 'prefix' },
      { href: '/admin/shop-category-pages', label: 'Category hub pages', match: 'prefix' },
      { href: '/admin/directors-pick', label: "Director's pick", match: 'prefix' },
      { href: '/admin/catalog-order', label: 'Catalog order', match: 'prefix' },
      { href: '/admin/consultation-plans', label: 'Consultation plans', match: 'prefix' },
      { href: '/admin/notifications', label: 'Notifications', match: 'prefix' },
      { href: '/admin/reviews', label: 'Product reviews', match: 'prefix' },
      { href: '/admin/category-reviews', label: 'Category reviews', match: 'prefix' },
      { href: '/admin/events', label: 'Events & videos', match: 'prefix' },
      { href: '/admin/videos', label: 'Video library', match: 'prefix' },
      { href: '/admin/lab-certificates', label: 'Lab certificates', match: 'prefix' },
      { href: '/admin/testimonials', label: 'Testimonials', match: 'prefix' },
      { href: '/admin/feedback', label: 'Feedback', match: 'prefix' },
      { href: '/admin/agent-sessions', label: 'Ratna AI sessions', match: 'prefix' },
    ],
  },
  inventory: {
    title: 'Products Uploading',
    subtitle: 'Catalog, categories & imports',
    home: '/admin/products',
    allowPrefixes: [
      '/admin/products',
      '/admin/stock/completeness',
      '/admin/categories',
      '/admin/configurations',
      '/admin/metals',
      '/admin/designs',
      '/admin/certifications',
      '/admin/energizations',
      '/admin/yagyas',
    ],
    nav: [
      { href: '/admin/products', label: 'Products', match: 'products' },
      { href: '/admin/products?status=inactive', label: 'Drafts', match: 'drafts' },
      { href: '/admin/products/import', label: 'Bulk import', match: 'prefix' },
      { href: '/admin/stock/completeness', label: 'Content gaps', match: 'prefix' },
      { href: '/admin/categories', label: 'Categories', match: 'prefix' },
      { href: '/admin/configurations', label: 'Configurations', match: 'prefix' },
      { href: '/admin/metals', label: 'Metals & pricing', match: 'prefix' },
      { href: '/admin/designs', label: 'Jewelry designs', match: 'prefix' },
      { href: '/admin/certifications', label: 'Certifications', match: 'prefix' },
      { href: '/admin/energizations', label: 'Energization / pooja', match: 'prefix' },
      { href: '/admin/yagyas', label: 'Vedic yagyas', match: 'prefix' },
    ],
  },
  fulfillment: {
    title: 'Parcel Dispatch',
    subtitle: 'Shipping, tracking & follow-up',
    home: '/admin/orders',
    allowPrefixes: ['/admin/orders', '/admin/design-jobs', '/admin/compliance'],
    nav: [
      { href: '/admin/orders', label: 'Orders & dispatch', match: 'prefix' },
      { href: '/admin/design-jobs', label: 'Design jobs', match: 'prefix' },
      { href: '/admin/compliance', label: 'Returns & RMA', match: 'prefix' },
    ],
  },
};

export function getScopedRoleDashboard(role: string | null | undefined): RoleDashboardConfig | null {
  if (!role) return null;
  return SCOPED_ROLE_DASHBOARDS[role as CanonicalAdminRole] ?? null;
}

export function isScopedRolePathAllowed(role: string | null | undefined, pathname: string): boolean {
  const dash = getScopedRoleDashboard(role);
  if (!dash) return true;
  if (pathname.startsWith('/admin/join')) return true;
  return dash.allowPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// ponytail: self-check, run via `npx tsx src/lib/admin/role-dashboards.selfcheck.ts` if added
export function assertRoleDashboardAllowlists() {
  const finance = SCOPED_ROLE_DASHBOARDS.finance!;
  if (!isScopedRolePathAllowed('finance', '/admin/finance')) throw new Error('finance home');
  if (isScopedRolePathAllowed('finance', '/admin/products')) throw new Error('finance must not open products');
  if (!isScopedRolePathAllowed('content', '/admin/hero')) throw new Error('content hero');
  if (isScopedRolePathAllowed('content', '/admin/products')) throw new Error('content must not open products');
  if (!isScopedRolePathAllowed('inventory', '/admin/products/import')) throw new Error('inventory import');
  if (!isScopedRolePathAllowed('fulfillment', '/admin/orders/abc')) throw new Error('fulfillment order detail');
  if (finance.home !== '/admin/finance') throw new Error('finance home path');
}
