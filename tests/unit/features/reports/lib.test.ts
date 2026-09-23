import { describe, expect, it } from "vitest";

import { fillDailySeries } from "@/features/dashboard/lib/series";
import { escapeCsvValue, toCsv } from "@/features/reports/lib/csv";
import { buildKardex, type KardexMovement, movementEffect } from "@/features/reports/lib/kardex";

describe("fillDailySeries", () => {
  it("devuelve exactamente N días consecutivos y rellena con ceros", () => {
    const today = new Date(2026, 8, 23);
    const series = fillDailySeries(
      [{ day: "2026-09-22", inbound: 5, outbound: 2, movements: 3 }],
      3,
      today,
    );
    expect(series.map((p) => p.day)).toEqual(["2026-09-21", "2026-09-22", "2026-09-23"]);
    expect(series.map((p) => p.label)).toEqual(["21/09", "22/09", "23/09"]);
    expect(series[1]).toMatchObject({ inbound: 5, outbound: 2, movements: 3 });
    expect(series[0]).toMatchObject({ inbound: 0, outbound: 0, movements: 0 });
  });
});

describe("csv", () => {
  it("escapa comas, comillas y saltos de línea", () => {
    expect(escapeCsvValue("simple")).toBe("simple");
    expect(escapeCsvValue('Taladro 1/2", 650W')).toBe('"Taladro 1/2"", 650W"');
    expect(escapeCsvValue("a\nb")).toBe('"a\nb"');
    expect(escapeCsvValue(null)).toBe("");
    expect(escapeCsvValue(12.5)).toBe("12.5");
  });

  it("genera cabecera, filas CRLF y BOM", () => {
    const csv = toCsv(
      [
        { header: "SKU", value: (r: { sku: string; qty: number }) => r.sku },
        { header: "Cantidad", value: (r: { sku: string; qty: number }) => r.qty },
      ],
      [{ sku: "HER-0001", qty: 3 }],
    );
    expect(csv).toBe("﻿SKU,Cantidad\r\nHER-0001,3\r\n");
  });
});

describe("kardex", () => {
  const movement = (overrides: Partial<KardexMovement>): KardexMovement => ({
    id: "m",
    type: "IN",
    fromWarehouseId: null,
    toWarehouseId: "cen",
    quantity: 1,
    unitCost: null,
    reason: null,
    reference: null,
    userName: "u",
    createdAt: new Date(),
    ...overrides,
  });

  it("una transferencia no altera el saldo global pero sí el de cada almacén", () => {
    const transfer = { fromWarehouseId: "cen", toWarehouseId: "nor", quantity: 4 };
    expect(movementEffect(transfer, null)).toEqual({ inbound: 4, outbound: 4 });
    expect(movementEffect(transfer, "cen")).toEqual({ inbound: 0, outbound: 4 });
    expect(movementEffect(transfer, "nor")).toEqual({ inbound: 4, outbound: 0 });
    expect(movementEffect(transfer, "sur")).toEqual({ inbound: 0, outbound: 0 });
  });

  it("calcula el saldo corrido, totales y saldo final", () => {
    const kardex = buildKardex(10, [
      movement({ id: "1", type: "IN", toWarehouseId: "cen", quantity: 5 }),
      movement({ id: "2", type: "OUT", fromWarehouseId: "cen", toWarehouseId: null, quantity: 3 }),
      movement({
        id: "3",
        type: "TRANSFER",
        fromWarehouseId: "cen",
        toWarehouseId: "nor",
        quantity: 2,
      }),
    ]);
    expect(kardex.lines.map((l) => l.balance)).toEqual([15, 12, 12]);
    expect(kardex.totalInbound).toBe(7);
    expect(kardex.totalOutbound).toBe(5);
    expect(kardex.closingBalance).toBe(12);
  });

  it("filtrado por almacén, la transferencia resta del origen", () => {
    const kardex = buildKardex(
      10,
      [
        movement({
          id: "3",
          type: "TRANSFER",
          fromWarehouseId: "cen",
          toWarehouseId: "nor",
          quantity: 2,
        }),
      ],
      "cen",
    );
    expect(kardex.closingBalance).toBe(8);
  });
});
