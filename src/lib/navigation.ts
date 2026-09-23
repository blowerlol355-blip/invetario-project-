import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRightIcon,
  BellRingIcon,
  BoxesIcon,
  ClipboardListIcon,
  FileBarChart2Icon,
  LayoutDashboardIcon,
  PackageIcon,
  ScrollTextIcon,
  TagsIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react";

import { hasPermission, type Permission } from "@/lib/permissions";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Menú principal. Es la única fuente de verdad de rutas protegidas, etiquetas
 * (breadcrumbs) y permisos por sección: middleware, sidebar y breadcrumbs lo consumen.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon,
        permission: "dashboard:view",
      },
      { title: "Alertas", href: "/alerts", icon: BellRingIcon, permission: "alerts:view" },
    ],
  },
  {
    label: "Inventario",
    items: [
      { title: "Productos", href: "/products", icon: PackageIcon, permission: "products:read" },
      {
        title: "Movimientos",
        href: "/movements",
        icon: ArrowLeftRightIcon,
        permission: "movements:read",
      },
      {
        title: "Órdenes de compra",
        href: "/purchase-orders",
        icon: ClipboardListIcon,
        permission: "purchase-orders:read",
      },
      { title: "Reportes", href: "/reports", icon: FileBarChart2Icon, permission: "reports:view" },
    ],
  },
  {
    label: "Catálogos",
    items: [
      { title: "Categorías", href: "/categories", icon: TagsIcon, permission: "catalogs:manage" },
      { title: "Proveedores", href: "/suppliers", icon: TruckIcon, permission: "catalogs:manage" },
      {
        title: "Almacenes",
        href: "/warehouses",
        icon: WarehouseIcon,
        permission: "catalogs:manage",
      },
    ],
  },
  {
    label: "Administración",
    items: [
      { title: "Usuarios", href: "/users", icon: UsersIcon, permission: "users:manage" },
      { title: "Auditoría", href: "/audit", icon: ScrollTextIcon, permission: "audit:view" },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

/** Etiquetas de segmentos de ruta que no son secciones del menú (para breadcrumbs). */
const EXTRA_SEGMENT_LABELS: Record<string, string> = {
  new: "Nuevo",
  edit: "Editar",
  forbidden: "Acceso denegado",
  inventory: "Inventario valorizado",
  kardex: "Kardex",
  movements: "Movimientos",
};

/** Devuelve los grupos del menú con solo los ítems visibles para el rol. */
export function getNavGroupsForRole(role: string | null | undefined): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => hasPermission(role, item.permission)),
  })).filter((group) => group.items.length > 0);
}

/** Busca la sección del menú a la que pertenece una ruta (por prefijo más largo). */
export function findNavItemForPath(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * Rutas que exigen un permiso más estricto que su sección (crear/editar).
 * Se evalúan antes que el permiso de la sección.
 */
export const ROUTE_PERMISSION_RULES: { pattern: RegExp; permission: Permission }[] = [
  { pattern: /^\/products\/new$/, permission: "products:manage" },
  { pattern: /^\/products\/[^/]+\/edit$/, permission: "products:manage" },
  { pattern: /^\/movements\/new$/, permission: "movements:create" },
  { pattern: /^\/purchase-orders\/new$/, permission: "purchase-orders:manage" },
  { pattern: /^\/purchase-orders\/[^/]+\/edit$/, permission: "purchase-orders:manage" },
];

/**
 * Permiso necesario para acceder a una ruta, o null si la ruta no está mapeada
 * (basta con estar autenticado).
 */
export function getRequiredPermission(pathname: string): Permission | null {
  const rule = ROUTE_PERMISSION_RULES.find(({ pattern }) => pattern.test(pathname));
  if (rule) return rule.permission;
  return findNavItemForPath(pathname)?.permission ?? null;
}

export interface Breadcrumb {
  label: string;
  href: string;
}

/** Construye las migas de pan a partir del pathname. Los ids (UUID) se muestran como "Detalle". */
export function buildBreadcrumbs(pathname: string): Breadcrumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Breadcrumb[] = [];
  let href = "";

  for (const segment of segments) {
    href += `/${segment}`;
    const navItem = ALL_NAV_ITEMS.find((item) => item.href === href);
    const label =
      navItem?.title ??
      EXTRA_SEGMENT_LABELS[segment] ??
      (isIdentifier(segment) ? "Detalle" : capitalize(decodeURIComponent(segment)));
    crumbs.push({ label, href });
  }

  return crumbs;
}

function isIdentifier(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}

export const PAGE_ICONS: Record<string, LucideIcon> = { boxes: BoxesIcon };
