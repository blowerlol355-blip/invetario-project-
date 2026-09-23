import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { AuthorizationError, BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";

const authenticateMock = vi.fn();

vi.mock("@/features/api/auth", () => ({ authenticateApiRequest: authenticateMock }));
vi.mock("@/lib/db", () => ({ prisma: {} }));

const { apiJson, apiPaginated, apiRoute, parseBody, parseQuery, toApiError } =
  await import("@/features/api/handler");

const principal = {
  userId: "u1",
  name: "Ana",
  email: "ana@stockpilot.dev",
  role: "OPERATOR" as const,
  via: "api-key" as const,
};

describe("toApiError", () => {
  it("mapea cada tipo de error a su estado y código", () => {
    expect(toApiError(new AuthorizationError("x", 401))).toMatchObject({
      status: 401,
      body: { error: { code: "UNAUTHORIZED" } },
    });
    expect(toApiError(new AuthorizationError("x", 403)).status).toBe(403);
    expect(toApiError(new NotFoundError()).status).toBe(404);
    expect(toApiError(new ConflictError("dup"))).toMatchObject({
      status: 409,
      body: { error: { code: "CONFLICT", message: "dup" } },
    });
    expect(toApiError(new BusinessRuleError("regla")).status).toBe(422);
    expect(toApiError(new Error("interno"))).toMatchObject({
      status: 500,
      body: { error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." } },
    });
  });

  it("devuelve 400 con detalle por campo ante un ZodError", () => {
    const error = z.object({ quantity: z.number().positive() }).safeParse({ quantity: -1 }).error;
    const mapped = toApiError(error);
    expect(mapped.status).toBe(400);
    expect(mapped.body.error.code).toBe("VALIDATION_ERROR");
    expect(mapped.body.error.details?.[0]?.path).toBe("quantity");
  });
});

describe("apiRoute", () => {
  beforeEach(() => {
    authenticateMock.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const request = (url = "http://localhost/api/v1/test") => new Request(url);
  const context = { params: Promise.resolve({}) };

  it("responde 401 en JSON si la autenticación falla", async () => {
    authenticateMock.mockRejectedValue(new AuthorizationError("sin clave", 401));
    const route = apiRoute({}, async () => apiJson({ ok: true }));
    const response = await route(request(), context);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNAUTHORIZED", message: "sin clave" },
    });
  });

  it("responde 403 si el rol no tiene el permiso", async () => {
    authenticateMock.mockResolvedValue(principal);
    const route = apiRoute({ permission: "products:manage" }, async () => apiJson({ ok: true }));
    const response = await route(request(), context);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("ejecuta el handler con la identidad y añade cabeceras de rate limit", async () => {
    authenticateMock.mockResolvedValue(principal);
    const route = apiRoute({ permission: "products:read" }, async ({ principal: who, url }) =>
      apiJson({ who: who.userId, q: url.searchParams.get("q") }),
    );
    const response = await route(request("http://localhost/api/v1/test?q=abc"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("120");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ data: { who: "u1", q: "abc" } });
  });

  it("convierte los errores del handler en respuestas uniformes", async () => {
    authenticateMock.mockResolvedValue(principal);
    const route = apiRoute({}, async () => {
      throw new BusinessRuleError("Stock insuficiente");
    });
    const response = await route(request(), context);
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: { code: "BUSINESS_RULE", message: "Stock insuficiente" },
    });
  });

  it("parseQuery y parseBody validan con Zod y el JSON malformado da 400", async () => {
    const schema = z.object({ n: z.coerce.number() });
    expect(parseQuery(schema, new URL("http://x/?n=2"))).toEqual({ n: 2 });
    expect(() => parseQuery(schema, new URL("http://x/?n=a"))).toThrow(z.ZodError);

    const bad = new Request("http://x", { method: "POST", body: "{" });
    const mapped = toApiError(await parseBody(schema, bad).catch((e: unknown) => e));
    expect(mapped).toMatchObject({ status: 400, body: { error: { code: "BAD_REQUEST" } } });
  });

  it("apiPaginated expone data y meta", async () => {
    const response = apiPaginated({ rows: [1, 2], total: 2, page: 1, pageSize: 20, pageCount: 1 });
    await expect(response.json()).resolves.toEqual({
      data: [1, 2],
      meta: { page: 1, pageSize: 20, total: 2, pageCount: 1 },
    });
  });
});
