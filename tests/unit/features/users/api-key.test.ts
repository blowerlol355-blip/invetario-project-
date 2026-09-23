import { describe, expect, it } from "vitest";

import { generateApiKey, hashApiKey, isApiKeyFormat } from "@/features/users/lib/api-key";

describe("claves de API", () => {
  it("genera claves con prefijo, 48 hex y hash SHA-256 distinto de la clave", () => {
    const { key, hash } = generateApiKey();
    expect(isApiKeyFormat(key)).toBe(true);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashApiKey(key));
    expect(hash).not.toContain(key.slice(3, 20));
  });

  it("cada clave es distinta", () => {
    const keys = new Set(Array.from({ length: 20 }, () => generateApiKey().key));
    expect(keys.size).toBe(20);
  });

  it("rechaza formatos que no son claves", () => {
    expect(isApiKeyFormat("")).toBe(false);
    expect(isApiKeyFormat("sp_abc")).toBe(false);
    expect(isApiKeyFormat("Bearer sp_" + "a".repeat(48))).toBe(false);
    expect(isApiKeyFormat("sp_" + "A".repeat(48))).toBe(false);
    expect(isApiKeyFormat("sp_" + "a".repeat(48))).toBe(true);
  });
});
