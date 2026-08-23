import type { Json } from '@/lib/types/database';

export const ADMIN_ROLE_OPTIONS = [
  'owner',
  'admin',
  'sales',
  'telecom',
  'astrologer',
  'content',
  'seo_cms',
  'inventory',
  'stock_manager',
  'finance',
  'fulfillment',
  'support',
  'designer',
] as const;

export type CanonicalAdminRole = (typeof ADMIN_ROLE_OPTIONS)[number];

export type AdminRole = CanonicalAdminRole | 'director' | 'manager' | 'accounts';

export type AdminPermission =
  | 'dashboard.read'
  | 'products.read'
  | 'products.write'
  | 'products.delete'
  | 'imports.write'
  | 'orders.read'
  | 'orders.write'
  | 'orders.tracking'
  | 'orders.design'
  | 'leads.read'
  | 'leads.write'
  | 'content.manage'
  | 'finance.read'
  | 'compliance.manage'
  | 'settings.commerce'
  | 'settings.team';

export const ROLE_LABELS: Record<CanonicalAdminRole, string> = {
  owner: 'Super Admin',
  admin: 'Admin',
  sales: 'Sales',
  telecom: 'Telecommunication',
  astrologer: 'Astrologer',
  content: 'Website Maintenance',
  seo_cms: 'SEO & CMS',
  inventory: 'Products Uploading',
  stock_manager: 'Order / Stock Incharge',
  finance: 'Accountant',
  fulfillment: 'Parcel Dispatch',
  support: 'Support',
  designer: 'Jewelry Designer',
};

/** Sanity Studio (/studio) — Super Admin, Admin, SEO & CMS, Website Maintenance. */
export function canAccessStudio(role: string | null | undefined): boolean {
  const normalized = normalizeAdminRole(role);
  return (
    normalized === 'owner' ||
    normalized === 'admin' ||
    normalized === 'seo_cms' ||
    normalized === 'content'
  );
}

const LEGACY_ROLE_MAP: Record<string, CanonicalAdminRole> = {
  director: 'owner',
  manager: 'admin',
  accounts: 'finance',
};

export const ROLE_PERMISSIONS: Record<CanonicalAdminRole, AdminPermission[]> = {
  owner: [
    'dashboard.read',
    'products.read',
    'products.write',
    'products.delete',
    'imports.write',
    'orders.read',
    'orders.write',
    'orders.tracking',
    'leads.read',
    'leads.write',
    'content.manage',
    'finance.read',
    'compliance.manage',
    'settings.commerce',
    'settings.team',
  ],
  // Admin has the same full access as a Super Admin (owner).
  admin: [
    'dashboard.read',
    'products.read',
    'products.write',
    'products.delete',
    'imports.write',
    'orders.read',
    'orders.write',
    'orders.tracking',
    'leads.read',
    'leads.write',
    'content.manage',
    'finance.read',
    'compliance.manage',
    'settings.commerce',
    'settings.team',
  ],
  sales: ['dashboard.read', 'products.read', 'orders.read', 'orders.write', 'leads.read', 'leads.write'],
  telecom: ['dashboard.read', 'leads.read', 'leads.write'],
  astrologer: ['dashboard.read', 'leads.read', 'leads.write'],
  content: [
    'dashboard.read',
    'products.read',
    'products.write',
    'products.delete',
    'imports.write',
    'orders.read',
    'content.manage',
    'settings.commerce',
  ],
  // Products (SEO/copy), category hubs, Sanity Studio.
  seo_cms: ['dashboard.read', 'products.read', 'products.write', 'content.manage'],
  inventory: [
    'dashboard.read',
    'products.read',
    'products.write',
    'products.delete',
    'imports.write',
    'orders.read',
    'content.manage',
    'settings.commerce',
  ],
  stock_manager: [
    'dashboard.read',
    'products.read',
    'products.write',
    'orders.read',
    'orders.write',
    'orders.tracking',
    'leads.read',
    'leads.write',
    'content.manage',
    'settings.commerce',
  ],
  finance: [
    'dashboard.read',
    'orders.read',
    'finance.read',
    'compliance.manage',
    'settings.commerce',
    'products.read',
    'products.write',
  ],
  fulfillment: [
    'dashboard.read',
    'products.read',
    'orders.read',
    'orders.write',
    'orders.tracking',
    'leads.read',
    'leads.write',
    'compliance.manage',
    'settings.commerce',
  ],
  support: ['dashboard.read', 'products.read', 'orders.read', 'orders.tracking', 'leads.read', 'leads.write', 'compliance.manage'],
  designer: ['dashboard.read', 'orders.read', 'orders.design'],
};

export function normalizeAdminRole(role: string | null | undefined): CanonicalAdminRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase().trim();
  if ((ADMIN_ROLE_OPTIONS as readonly string[]).includes(normalized)) {
    return normalized as CanonicalAdminRole;
  }
  return LEGACY_ROLE_MAP[normalized] ?? null;
}

function explicitPermissionAllows(permissions: Json | undefined, permission: AdminPermission) {
  if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) return false;
  const map = permissions as Record<string, Json | undefined>;
  const value = map[permission];
  if (value === true) return true;

  const [module, action] = permission.split('.');
  const moduleValue = map[module];
  if (moduleValue === true) return true;
  if (moduleValue && typeof moduleValue === 'object' && !Array.isArray(moduleValue)) {
    return (moduleValue as Record<string, Json | undefined>)[action] === true;
  }
  return false;
}

export function hasAdminPermission(
  role: string | null | undefined,
  permission: AdminPermission,
  explicitPermissions?: Json
) {
  const normalized = normalizeAdminRole(role);
  if (!normalized) return false;
  if (explicitPermissionAllows(explicitPermissions, permission)) return true;
  return ROLE_PERMISSIONS[normalized].includes(permission);
}

export function getAdminRoutePermission(pathname: string): AdminPermission {
  if (pathname.startsWith('/admin/finance')) return 'finance.read';
  if (pathname.startsWith('/admin/compliance')) return 'compliance.manage';
  if (pathname.startsWith('/admin/rewards')) return 'settings.commerce';
  if (pathname.startsWith('/admin/shipping')) return 'settings.commerce';
  // Currency rates live on settings; team APIs still require settings.team
  if (pathname.startsWith('/admin/settings')) return 'settings.commerce';
  if (pathname.startsWith('/admin/products/import')) return 'imports.write';
  if (pathname.startsWith('/admin/products/new')) return 'products.write';
  if (/^\/admin\/products\/[^/]+$/.test(pathname)) return 'products.write';
  if (pathname.startsWith('/admin/products')) return 'products.read';
  if (pathname.startsWith('/admin/erp-sync')) return 'products.read';
  if (pathname.startsWith('/admin/item-status')) return 'products.read';
  if (pathname.startsWith('/admin/stock/completeness')) return 'products.read';
  if (pathname.startsWith('/admin/stock')) return 'dashboard.read';
  if (pathname.startsWith('/admin/designer')) return 'orders.design';
  if (pathname.startsWith('/admin/design-jobs')) return 'orders.read';
  if (pathname.startsWith('/admin/commissions')) return 'orders.read';
  if (pathname.startsWith('/admin/orders')) return 'orders.read';
  if (pathname.startsWith('/admin/customers')) return 'leads.read';
  if (pathname.startsWith('/admin/leads')) return 'leads.read';
  if (pathname.startsWith('/admin/recommendations')) return 'leads.read';
  if (
    pathname.startsWith('/admin/consultation-plans') ||
    pathname.startsWith('/admin/notifications') ||
    pathname.startsWith('/admin/reviews') ||
    pathname.startsWith('/admin/testimonials') ||
    pathname.startsWith('/admin/feedback') ||
    pathname.startsWith('/admin/category-reviews') ||
    pathname.startsWith('/admin/events') ||
    pathname.startsWith('/admin/videos') ||
    pathname.startsWith('/admin/lab-certificates') ||
    pathname.startsWith('/admin/hero') ||
    pathname.startsWith('/admin/shop-category-pages') ||
    pathname.startsWith('/admin/directors-pick') ||
    pathname.startsWith('/admin/catalog-order') ||
    pathname.startsWith('/admin/agent-sessions')
  ) {
    return 'content.manage';
  }
  if (pathname.startsWith('/admin/configurations')) return 'products.read';
  if (pathname.startsWith('/admin/yagyas')) return 'products.read';
  if (pathname.startsWith('/admin/yagya-bookings')) return 'orders.read';
  if (
    pathname.startsWith('/admin/categories') ||
    pathname.startsWith('/admin/certifications') ||
    pathname.startsWith('/admin/designs') ||
    pathname.startsWith('/admin/energizations') ||
    pathname.startsWith('/admin/metals')
  ) {
    return 'products.write';
  }
  return 'dashboard.read';
}