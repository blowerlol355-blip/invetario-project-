import { describe, expect, it } from "vitest";

import {
  ALL_NAV_ITEMS,
  buildBreadcrumbs,
  findNavItemForPath,
  getNavGroupsForRole,
  getRequiredPermission,
} from "@/lib/navigation";

describe("navegación", () => {
  it("el menú del OPERATOR no incluye catálogos ni administración", () => {
    const groups = getNavGroupsForRole("OPERATOR");
    const labels = groups.map((g) => g.label);
    expect(labels).not.toContain("Catálogos");
    expect(labels).not.toContain("Administración");
    expect(groups.flatMap((g) => g.items).map((i) => i.href)).toContain("/movements");
  });

  it("el menú del ADMIN incluye todas las secciones", () => {
    const items = getNavGroupsForRole("ADMIN").flatMap((g) => g.items);
    expect(items).toHaveLength(ALL_NAV_ITEMS.length);
  });

  it("un rol desconocido no ve ninguna sección", () => {
    expect(getNavGroupsForRole("INVITADO")).toHaveLength(0);
  });

  it("resuelve la sección por prefijo de ruta", () => {
    expect(findNavItemForPath("/products")?.href).toBe("/products");
    expect(findNavItemForPath("/products/abc/edit")?.href).toBe("/products");
    expect(findNavItemForPath("/productos-x")).toBeUndefined();
  });

  it("devuelve el permiso requerido por ruta", () => {
    expect(getRequiredPermission("/users")).toBe("users:manage");
    expect(getRequiredPermission("/audit/123")).toBe("audit:view");
    expect(getRequiredPermission("/forbidden")).toBeNull();
  });

  it("las rutas de crear y editar productos exigen el permiso de gestión", () => {
    expect(getRequiredPermission("/products")).toBe("products:read");
    expect(getRequiredPermission("/products/3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(
      "products:read",
    );
    expect(getRequiredPermission("/products/new")).toBe("products:manage");
    expect(getRequiredPermission("/movements/new")).toBe("movements:create");
    expect(getRequiredPermission("/purchase-orders/new")).toBe("purchase-orders:manage");
    expect(getRequiredPermission("/purchase-orders/abc/edit")).toBe("purchase-orders:manage");
    expect(getRequiredPermission("/purchase-orders/abc")).toBe("purchase-orders:read");
    expect(getRequiredPermission("/movements")).toBe("movements:read");
    expect(getRequiredPermission("/products/3f2504e0-4f89-41d3-9a0c-0305e82c3301/edit")).toBe(
      "products:manage",
    );
  });

  it("construye breadcrumbs con etiquetas en español", () => {
    expect(buildBreadcrumbs("/purchase-orders/new")).toEqual([
      { label: "Órdenes de compra", href: "/purchase-orders" },
      { label: "Nuevo", href: "/purchase-orders/new" },
    ]);
  });

  it("muestra los identificadores como Detalle", () => {
    const crumbs = buildBreadcrumbs("/products/3f2504e0-4f89-41d3-9a0c-0305e82c3301/edit");
    expect(crumbs.map((c) => c.label)).toEqual(["Productos", "Detalle", "Editar"]);
  });
});
