import { describe, expect, it } from "vitest";

import { diffSnapshots, formatSnapshotValue, parseSnapshot } from "@/features/audit/lib/diff";

describe("diff de auditoría", () => {
  it("parsea JSON de objetos y envuelve valores sueltos o inválidos", () => {
    expect(parseSnapshot(null)).toBeNull();
    expect(parseSnapshot('{"a":1}')).toEqual({ a: 1 });
    expect(parseSnapshot("[1,2]")).toEqual({ value: [1, 2] });
    expect(parseSnapshot("no es json")).toEqual({ value: "no es json" });
  });

  it("devuelve solo los campos que cambian y omite updatedAt", () => {
    const entries = diffSnapshots(
      { name: "A", isActive: true, updatedAt: "2026-01-01T00:00:00.000Z", price: 1 },
      { name: "B", isActive: true, updatedAt: "2026-02-01T00:00:00.000Z", price: 1 },
    );
    expect(entries).toEqual([{ key: "name", before: "A", after: "B" }]);
  });

  it("con before nulo lista todo after (creación) y viceversa", () => {
    expect(diffSnapshots(null, { a: 1, b: null })).toEqual([
      { key: "a", before: undefined, after: 1 },
      { key: "b", before: undefined, after: null },
    ]);
    expect(diffSnapshots({ a: 1 }, null)).toEqual([{ key: "a", before: 1, after: undefined }]);
  });

  it("formatea valores legibles", () => {
    expect(formatSnapshotValue(null)).toBe("—");
    expect(formatSnapshotValue("")).toBe("—");
    expect(formatSnapshotValue(true)).toBe("Sí");
    expect(formatSnapshotValue(false)).toBe("No");
    expect(formatSnapshotValue(12.5)).toBe("12.5");
    expect(formatSnapshotValue("2026-01-15T12:00:00.000Z")).toMatch(/^15\/01\/2026 /);
    expect(formatSnapshotValue({ a: 1 })).toBe('{"a":1}');
  });
});
