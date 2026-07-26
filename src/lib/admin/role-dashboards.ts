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
    allowPrefixes: [
      '/admin/finance',
      '/admin/compliance',
      '/admin/orders',
      '/admin/commissions',
      '/admin/yagya-bookings',
      '/admin/design-jobs',
      '/admin/customers',
      '/admin/rewards',
      '/admin/metals',
      '/admin/leads',
    ],
    nav: [
      { href: '/admin/finance', label: 'Finance', match: 'prefix' },
      { href: '/admin/compliance', label: 'Compliance & refunds', match: 'prefix' },
      { href: '/admin/orders', label: 'Orders', match: 'prefix' },
      { href: '/admin/commissions', label: 'Commissions', match: 'prefix' },
      { href: '/admin/yagya-bookings', label: 'Yagya bookings', match: 'prefix' },
      { href: '/admin/design-jobs', label: 'Design jobs', match: 'prefix' },
      { href: '/admin/customers', label: 'Customers', match: 'prefix' },
      { href: '/admin/rewards', label: 'Rewards', match: 'prefix' },
      { href: '/admin/metals', label: 'Metals & pricing', match: 'prefix' },
      { href: '/admin/leads', label: 'Leads', match: 'prefix' },
    ],
  },
  // ponytail: Website Maintenance uses full AdminShell with a hidden-href filter (too many content pages for a scoped nav)
  inventory: {
    title: 'Products Uploading',
    subtitle: 'Catalog, categories & imports',
    home: '/admin/products',
    allowPrefixes: [
      '/admin/products',
      '/admin/orders',
      '/admin/catalog-order',
      '/admin/directors-pick',
      '/admin/yagyas',
      '/admin/yagya-bookings',
      '/admin/stock',
      '/admin/erp-sync',
      '/admin/hero',
      '/admin/categories',
      '/admin/shop-category-pages',
      '/admin/configurations',
      '/admin/metals',
      '/admin/designs',
      '/admin/certifications',
      '/admin/energizations',
    ],
    nav: [
      { href: '/admin/products', label: 'Products', match: 'products' },
      { href: '/admin/products?status=inactive', label: 'Drafts', match: 'drafts' },
      { href: '/admin/orders', label: 'Orders', match: 'prefix' },
      { href: '/admin/catalog-order', label: 'Catalog order', match: 'prefix' },
      { href: '/admin/directors-pick', label: "Director's pick", match: 'prefix' },
      { href: '/admin/yagyas', label: 'Vedic yagyas', match: 'prefix' },
      { href: '/admin/yagya-bookings', label: 'Yagya bookings', match: 'prefix' },
      { href: '/admin/products/import', label: 'Bulk import', match: 'prefix' },
      { href: '/admin/stock', label: 'Stock dashboard', match: 'exact' },
      { href: '/admin/stock/completeness', label: 'Content gaps', match: 'prefix' },
      { href: '/admin/erp-sync', label: 'Store ERP sync', match: 'prefix' },
      { href: '/admin/hero', label: 'Hero slideshow', match: 'prefix' },
      { href: '/admin/categories', label: 'Section categories', match: 'prefix' },
      { href: '/admin/shop-category-pages', label: 'Category hub pages', match: 'prefix' },
      { href: '/admin/configurations', label: 'Configurations', match: 'prefix' },
      { href: '/admin/metals', label: 'Metals & pricing', match: 'prefix' },
      { href: '/admin/designs', label: 'Jewelry designs', match: 'prefix' },
      { href: '/admin/certifications', label: 'Certifications', match: 'prefix' },
      { href: '/admin/energizations', label: 'Energization / pooja', match: 'prefix' },
    ],
  },
  fulfillment: {
    title: 'Parcel Dispatch',
    subtitle: 'Shipping, tracking & follow-up',
    home: '/admin/dispatch',
    allowPrefixes: ['/admin/dispatch', '/admin/orders', '/admin/leads', '/admin/compliance', '/admin/shipping'],
    nav: [
      { href: '/admin/dispatch', label: 'Dispatch dashboard', match: 'prefix' },
      { href: '/admin/orders', label: 'Orders', match: 'prefix' },
      { href: '/admin/leads', label: 'Leads', match: 'prefix' },
      { href: '/admin/shipping', label: 'Shipping zones & plans', match: 'prefix' },
      { href: '/admin/compliance', label: 'Returns & RMA', match: 'prefix' },
    ],
  },
  telecom: {
    title: 'Telecommunication',
    subtitle: 'Verify leads & update remarks',
    home: '/admin/leads',
    allowPrefixes: ['/admin/leads'],
    nav: [{ href: '/admin/leads', label: 'My leads', match: 'prefix' }],
  },
  astrologer: {
    title: 'Astrologer',
    subtitle: 'Review verified leads & write remedies',
    home: '/admin/leads',
    allowPrefixes: ['/admin/leads'],
    nav: [{ href: '/admin/leads', label: 'Assigned leads', match: 'prefix' }],
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
  if (!isScopedRolePathAllowed('finance', '/admin/customers')) throw new Error('finance customers');
  if (!isScopedRolePathAllowed('finance', '/admin/rewards')) throw new Error('finance rewards');
  if (!isScopedRolePathAllowed('finance', '/admin/metals')) throw new Error('finance metals');
  if (!isScopedRolePathAllowed('finance', '/admin/leads')) throw new Error('finance leads');
  if (!isScopedRolePathAllowed('finance', '/admin/design-jobs')) throw new Error('finance design-jobs');
  if (!isScopedRolePathAllowed('finance', '/admin/commissions')) throw new Error('finance commissions');
  if (isScopedRolePathAllowed('finance', '/admin/products')) throw new Error('finance must not open products');
  if (getScopedRoleDashboard('content')) throw new Error('content uses full admin shell');
  if (!isScopedRolePathAllowed('inventory', '/admin/products/import')) throw new Error('inventory import');
  if (!isScopedRolePathAllowed('inventory', '/admin/orders')) throw new Error('inventory orders');
  if (isScopedRolePathAllowed('inventory', '/admin/leads')) throw new Error('inventory must not open leads');
  if (!isScopedRolePathAllowed('inventory', '/admin/hero')) throw new Error('inventory hero');
  if (!isScopedRolePathAllowed('inventory', '/admin/erp-sync')) throw new Error('inventory erp');
  if (isScopedRolePathAllowed('inventory', '/admin/finance')) throw new Error('inventory must not open finance');
  if (isScopedRolePathAllowed('inventory', '/admin/commissions')) throw new Error('inventory must not open commissions');
  if (isScopedRolePathAllowed('inventory', '/admin/rewards')) throw new Error('inventory must not open rewards');
  if (!isScopedRolePathAllowed('fulfillment', '/admin/orders/abc')) throw new Error('fulfillment order detail');
  if (!isScopedRolePathAllowed('fulfillment', '/admin/leads')) throw new Error('fulfillment leads');
  if (!isScopedRolePathAllowed('fulfillment', '/admin/dispatch')) throw new Error('fulfillment dispatch');
  if (isScopedRolePathAllowed('fulfillment', '/admin/commissions')) throw new Error('fulfillment must not open commissions');
  if (!isScopedRolePathAllowed('fulfillment', '/admin/shipping')) throw new Error('fulfillment shipping');
  if (SCOPED_ROLE_DASHBOARDS.fulfillment!.home !== '/admin/dispatch') throw new Error('fulfillment home');
  if (finance.home !== '/admin/finance') throw new Error('finance home path');
  if (!isScopedRolePathAllowed('telecom', '/admin/leads')) throw new Error('telecom leads');
  if (isScopedRolePathAllowed('telecom', '/admin/orders')) throw new Error('telecom must not open orders');
  if (!isScopedRolePathAllowed('astrologer', '/admin/leads')) throw new Error('astrologer leads');
  if (isScopedRolePathAllowed('astrologer', '/admin/settings')) throw new Error('astrologer must not open settings');
}
