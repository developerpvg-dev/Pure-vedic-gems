import type { Json } from '@/lib/types/database';

export const ADMIN_ROLE_OPTIONS = [
  'owner',
  'admin',
  'sales',
  'content',
  'inventory',
  'finance',
  'fulfillment',
  'support',
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
  | 'leads.read'
  | 'leads.write'
  | 'content.manage'
  | 'finance.read'
  | 'settings.commerce'
  | 'settings.team';

export const ROLE_LABELS: Record<CanonicalAdminRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  sales: 'Sales',
  content: 'Content',
  inventory: 'Inventory',
  finance: 'Finance',
  fulfillment: 'Fulfillment',
  support: 'Support',
};

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
    'settings.commerce',
    'settings.team',
  ],
  admin: [
    'dashboard.read',
    'products.read',
    'products.write',
    'imports.write',
    'orders.read',
    'orders.write',
    'orders.tracking',
    'leads.read',
    'leads.write',
    'content.manage',
    'finance.read',
    'settings.commerce',
  ],
  sales: ['dashboard.read', 'products.read', 'orders.read', 'orders.write', 'leads.read', 'leads.write'],
  content: ['dashboard.read', 'products.read', 'products.write', 'imports.write', 'content.manage'],
  inventory: ['dashboard.read', 'products.read', 'products.write', 'imports.write'],
  finance: ['dashboard.read', 'orders.read', 'finance.read'],
  fulfillment: ['dashboard.read', 'products.read', 'orders.read', 'orders.write', 'orders.tracking'],
  support: ['dashboard.read', 'products.read', 'orders.read', 'orders.tracking', 'leads.read', 'leads.write'],
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
  if (pathname.startsWith('/admin/settings')) return 'settings.commerce';
  if (pathname.startsWith('/admin/products/import')) return 'imports.write';
  if (pathname.startsWith('/admin/products/new')) return 'products.write';
  if (/^\/admin\/products\/[^/]+$/.test(pathname)) return 'products.write';
  if (pathname.startsWith('/admin/products')) return 'products.read';
  if (pathname.startsWith('/admin/orders')) return 'orders.read';
  if (pathname.startsWith('/admin/customers')) return 'leads.read';
  if (pathname.startsWith('/admin/consultation-plans')) return 'leads.read';
  if (pathname.startsWith('/admin/leads')) return 'leads.read';
  if (pathname.startsWith('/admin/reviews')) return 'content.manage';
  if (pathname.startsWith('/admin/notifications')) return 'leads.read';
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