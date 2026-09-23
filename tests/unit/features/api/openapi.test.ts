import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";
import { parse } from "yaml";

/**
 * Comprueba que openapi.yaml y las rutas reales de src/app/api/v1 no se desincronicen:
 * cada path documentado existe como route.ts y exporta los métodos que declara, y viceversa.
 */

interface OpenApiDocument {
  openapi: string;
  paths: Record<string, Record<string, unknown>>;
  components: { securitySchemes: Record<string, unknown>; schemas: Record<string, unknown> };
}

const root = process.cwd();
const spec = parse(readFileSync(join(root, "public", "openapi.yaml"), "utf8")) as OpenApiDocument;
const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

function routeFile(path: string): string {
  const segments = path
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/^\{(.+)\}$/, "[$1]"));
  return join(root, "src", "app", "api", "v1", ...segments, "route.ts");
}

describe("openapi.yaml", () => {
  it("es OpenAPI 3.1 con esquemas de seguridad y de error", () => {
    expect(spec.openapi).toMatch(/^3\.1\./);
    expect(Object.keys(spec.components.securitySchemes)).toEqual(["ApiKeyAuth", "SessionCookie"]);
    expect(spec.components.schemas.Error).toBeDefined();
    expect(spec.components.schemas.PaginationMeta).toBeDefined();
  });

  it("cada path documentado existe como route.ts y exporta los métodos declarados", () => {
    for (const [path, item] of Object.entries(spec.paths)) {
      const file = routeFile(path);
      expect(existsSync(file), `falta ${file} para ${path}`).toBe(true);
      const source = readFileSync(file, "utf8");
      for (const method of HTTP_METHODS) {
        const documented = method in item;
        const exported = new RegExp(`export const ${method.toUpperCase()}\\b`).test(source);
        expect(exported, `${method.toUpperCase()} ${path}: documentado=${documented}`).toBe(
          documented,
        );
      }
    }
  });

  it("toda operación declara respuestas 401 y (salvo /me) 403 o 404", () => {
    for (const [path, item] of Object.entries(spec.paths)) {
      for (const method of HTTP_METHODS) {
        const operation = item[method] as { responses?: Record<string, unknown> } | undefined;
        if (!operation) continue;
        expect(operation.responses?.["401"], `${method} ${path} sin 401`).toBeDefined();
        expect(operation.responses?.["429"], `${method} ${path} sin 429`).toBeDefined();
      }
    }
  });
});
