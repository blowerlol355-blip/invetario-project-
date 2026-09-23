import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthorizationError } from "@/lib/errors";

const authMock = vi.fn();

vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { requirePermission, requireSession } = await import("@/lib/auth-guards");

function session(role: string) {
  return { user: { id: "u1", name: "Test", email: "t@t.dev", role }, expires: "" };
}

describe("guards de autorización", () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it("requireSession lanza 401 sin sesión", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSession()).rejects.toMatchObject({ status: 401 });
  });

  it("requireSession devuelve la sesión cuando existe", async () => {
    authMock.mockResolvedValue(session("OPERATOR"));
    await expect(requireSession()).resolves.toMatchObject({ user: { id: "u1" } });
  });

  it("requirePermission lanza 403 si el rol no tiene el permiso", async () => {
    authMock.mockResolvedValue(session("OPERATOR"));
    const error = await requirePermission("catalogs:manage").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AuthorizationError);
    expect((error as AuthorizationError).status).toBe(403);
  });

  it("requirePermission devuelve la sesión si el rol tiene el permiso", async () => {
    authMock.mockResolvedValue(session("MANAGER"));
    await expect(requirePermission("catalogs:manage")).resolves.toMatchObject({
      user: { role: "MANAGER" },
    });
  });

  it("requirePermission lanza 401 antes que 403 si no hay sesión", async () => {
    authMock.mockResolvedValue(null);
    await expect(requirePermission("users:manage")).rejects.toMatchObject({ status: 401 });
  });
});
