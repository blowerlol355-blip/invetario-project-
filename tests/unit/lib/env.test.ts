import { describe, expect, it } from "vitest";

import { envSchema, parseEnv } from "@/lib/env";

const validEnv = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://postgres:secret@localhost:5432/stockpilot",
  AUTH_SECRET: "un-secreto-suficientemente-largo-para-firmar-jwt-123",
  AUTH_URL: "http://localhost:3000",
};

describe("envSchema", () => {
  it("acepta una configuración válida", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it("usa development como NODE_ENV por defecto", () => {
    const { NODE_ENV: _omit, ...withoutNodeEnv } = validEnv;
    const parsed = parseEnv(withoutNodeEnv);
    expect(parsed.NODE_ENV).toBe("development");
  });

  it("rechaza una DATABASE_URL que no sea de PostgreSQL", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      DATABASE_URL: "sqlserver://localhost:1433;database=db",
    });
    expect(result.success).toBe(false);
  });

  it("acepta el alias postgres:// y una DIRECT_URL opcional", () => {
    const result = envSchema.safeParse({
      ...validEnv,
      DATABASE_URL: "postgres://user:pw@host:6543/postgres",
      DIRECT_URL: "postgresql://user:pw@host:5432/postgres",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza un AUTH_SECRET corto", () => {
    const result = envSchema.safeParse({ ...validEnv, AUTH_SECRET: "corto" });
    expect(result.success).toBe(false);
  });
});

describe("parseEnv", () => {
  it("lanza un error legible que enumera las variables inválidas", () => {
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrowError(/DATABASE_URL/);
    expect(() => parseEnv({ NODE_ENV: "test" })).toThrowError(/AUTH_SECRET/);
  });

  it("devuelve los valores tipados cuando todo es válido", () => {
    const parsed = parseEnv(validEnv);
    expect(parsed.AUTH_URL).toBe("http://localhost:3000");
    expect(parsed.NODE_ENV).toBe("test");
  });
});
