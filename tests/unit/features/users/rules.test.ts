import { describe, expect, it } from "vitest";

import { assertCanChangeRole, assertCanSetActive } from "@/features/users/lib/rules";
import { BusinessRuleError } from "@/lib/errors";

const admin = { id: "admin", role: "ADMIN" as const, isActive: true };
const manager = { id: "manager", role: "MANAGER" as const, isActive: true };

describe("reglas de usuarios", () => {
  describe("assertCanChangeRole", () => {
    it("permite dejar el mismo rol aunque sea el propio", () => {
      expect(() =>
        assertCanChangeRole({ actorId: "admin", target: admin, activeAdminCount: 1 }, "ADMIN"),
      ).not.toThrow();
    });

    it("impide cambiar el propio rol", () => {
      expect(() =>
        assertCanChangeRole({ actorId: "admin", target: admin, activeAdminCount: 3 }, "MANAGER"),
      ).toThrow(BusinessRuleError);
    });

    it("impide quitar el rol al último administrador activo", () => {
      expect(() =>
        assertCanChangeRole({ actorId: "other", target: admin, activeAdminCount: 1 }, "OPERATOR"),
      ).toThrow(/al menos un administrador/);
    });

    it("permite degradar a un administrador si queda otro activo", () => {
      expect(() =>
        assertCanChangeRole({ actorId: "other", target: admin, activeAdminCount: 2 }, "OPERATOR"),
      ).not.toThrow();
    });

    it("permite ascender a administrador", () => {
      expect(() =>
        assertCanChangeRole({ actorId: "admin", target: manager, activeAdminCount: 1 }, "ADMIN"),
      ).not.toThrow();
    });
  });

  describe("assertCanSetActive", () => {
    it("siempre permite activar", () => {
      const inactive = { ...admin, isActive: false };
      expect(() =>
        assertCanSetActive({ actorId: "admin", target: inactive, activeAdminCount: 0 }, true),
      ).not.toThrow();
    });

    it("impide desactivarse a uno mismo", () => {
      expect(() =>
        assertCanSetActive({ actorId: "admin", target: admin, activeAdminCount: 5 }, false),
      ).toThrow(/tu propia cuenta/);
    });

    it("impide desactivar al último administrador activo", () => {
      expect(() =>
        assertCanSetActive({ actorId: "other", target: admin, activeAdminCount: 1 }, false),
      ).toThrow(/al menos un administrador/);
    });

    it("permite desactivar a un gerente", () => {
      expect(() =>
        assertCanSetActive({ actorId: "admin", target: manager, activeAdminCount: 1 }, false),
      ).not.toThrow();
    });
  });
});
