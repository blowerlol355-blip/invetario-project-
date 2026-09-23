import { describe, expect, it } from "vitest";

import { serializeSnapshot } from "@/lib/audit";

describe("serializeSnapshot", () => {
  it("devuelve null sin valor", () => {
    expect(serializeSnapshot(null)).toBeNull();
    expect(serializeSnapshot(undefined)).toBeNull();
  });

  it("serializa fechas en ISO y omite campos sensibles", () => {
    const json = serializeSnapshot({
      name: "Ana",
      passwordHash: "$2a$10$secret",
      createdAt: new Date(Date.UTC(2026, 0, 15, 12, 0, 0)),
    });
    expect(json).toBe('{"name":"Ana","createdAt":"2026-01-15T12:00:00.000Z"}');
  });

  it("convierte decimales de Prisma (objetos con toFixed) en números", () => {
    const decimalLike = { toFixed: () => "12.50", toString: () => "12.5" };
    expect(serializeSnapshot({ price: decimalLike })).toBe('{"price":12.5}');
  });
});
