import { describe, expect, it } from "vitest";

import { USER_ROLES } from "@/lib/domain";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from "@/lib/permissions";

describe("matriz de permisos", () => {
  it("ADMIN tiene todos los permisos", () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission("ADMIN", permission)).toBe(true);
    }
  });

  it("MANAGER gestiona catálogos, productos, compras y reportes pero no usuarios ni auditoría", () => {
    expect(hasPermission("MANAGER", "products:manage")).toBe(true);
    expect(hasPermission("MANAGER", "catalogs:manage")).toBe(true);
    expect(hasPermission("MANAGER", "purchase-orders:manage")).toBe(true);
    expect(hasPermission("MANAGER", "reports:view")).toBe(true);
    expect(hasPermission("MANAGER", "users:manage")).toBe(false);
    expect(hasPermission("MANAGER", "audit:view")).toBe(false);
  });

  it("OPERATOR registra movimientos y consulta, pero no gestiona", () => {
    expect(hasPermission("OPERATOR", "movements:create")).toBe(true);
    expect(hasPermission("OPERATOR", "products:read")).toBe(true);
    expect(hasPermission("OPERATOR", "purchase-orders:receive")).toBe(true);
    expect(hasPermission("OPERATOR", "purchase-orders:manage")).toBe(false);
    expect(hasPermission("OPERATOR", "products:manage")).toBe(false);
    expect(hasPermission("OPERATOR", "catalogs:manage")).toBe(false);
    expect(hasPermission("OPERATOR", "reports:view")).toBe(false);
    expect(hasPermission("OPERATOR", "users:manage")).toBe(false);
  });

  it("todos los roles definidos tienen una entrada en la matriz", () => {
    for (const role of USER_ROLES) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it("un rol desconocido o vacío no tiene permisos", () => {
    expect(hasPermission("SUPERUSER", "dashboard:view")).toBe(false);
    expect(hasPermission(null, "dashboard:view")).toBe(false);
    expect(hasPermission(undefined, "dashboard:view")).toBe(false);
    expect(hasPermission("", "dashboard:view")).toBe(false);
  });

  it("hasAllPermissions y hasAnyPermission combinan correctamente", () => {
    expect(hasAllPermissions("OPERATOR", ["movements:create", "products:read"])).toBe(true);
    expect(hasAllPermissions("OPERATOR", ["movements:create", "users:manage"])).toBe(false);
    expect(hasAnyPermission("OPERATOR", ["users:manage", "movements:create"])).toBe(true);
    expect(hasAnyPermission("OPERATOR", ["users:manage", "audit:view"])).toBe(false);
  });
});
