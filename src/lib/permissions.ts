import type { UserRole } from "@/lib/domain";

/**
 * Permisos granulares del sistema. Cada rol recibe un conjunto fijo de permisos;
 * las rutas, los menús y las Server Actions consultan esta matriz (nunca solo el rol
 * en el cliente).
 */
export const PERMISSIONS = [
  "dashboard:view",
  "products:read",
  "products:manage",
  "catalogs:manage",
  "movements:read",
  "movements:create",
  "purchase-orders:read",
  "purchase-orders:receive",
  "purchase-orders:manage",
  "alerts:view",
  "reports:view",
  "users:manage",
  "audit:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const OPERATOR_PERMISSIONS: readonly Permission[] = [
  "dashboard:view",
  "products:read",
  "movements:read",
  "movements:create",
  "purchase-orders:read",
  "purchase-orders:receive",
  "alerts:view",
];

const MANAGER_PERMISSIONS: readonly Permission[] = [
  ...OPERATOR_PERMISSIONS,
  "products:manage",
  "catalogs:manage",
  "purchase-orders:manage",
  "reports:view",
];

const ADMIN_PERMISSIONS: readonly Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: ADMIN_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  OPERATOR: OPERATOR_PERMISSIONS,
};

/** Indica si un rol posee un permiso. Un rol desconocido nunca tiene permisos. */
export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) return false;
  return ROLE_PERMISSIONS[role as UserRole].includes(permission);
}

/** Indica si un rol posee todos los permisos indicados. */
export function hasAllPermissions(
  role: string | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/** Indica si un rol posee al menos uno de los permisos indicados. */
export function hasAnyPermission(
  role: string | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}
