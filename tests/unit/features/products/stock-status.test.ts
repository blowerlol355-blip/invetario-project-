import { describe, expect, it } from "vitest";

import {
  getMarginPercent,
  getStockFillPercent,
  getStockStatus,
} from "@/features/products/lib/stock-status";

describe("getStockStatus", () => {
  it("clasifica sin stock, bajo, normal y sobre máximo", () => {
    expect(getStockStatus(0, 5, 20)).toBe("out");
    expect(getStockStatus(5, 5, 20)).toBe("low");
    expect(getStockStatus(3, 5, 20)).toBe("low");
    expect(getStockStatus(10, 5, 20)).toBe("ok");
    expect(getStockStatus(25, 5, 20)).toBe("over");
  });

  it("sin máximo nunca marca sobre máximo", () => {
    expect(getStockStatus(1000, 5, null)).toBe("ok");
  });

  it("con mínimo 0 solo alerta cuando no hay stock", () => {
    expect(getStockStatus(0, 0, null)).toBe("out");
    expect(getStockStatus(1, 0, null)).toBe("ok");
  });
});

describe("getMarginPercent", () => {
  it("calcula el margen sobre el precio de venta con un decimal", () => {
    expect(getMarginPercent(100, 60)).toBe(40);
    expect(getMarginPercent(15, 10)).toBe(33.3);
  });

  it("devuelve null si no hay precio de venta", () => {
    expect(getMarginPercent(0, 10)).toBeNull();
  });

  it("puede ser negativo si se vende bajo costo", () => {
    expect(getMarginPercent(8, 10)).toBe(-25);
  });
});

describe("getStockFillPercent", () => {
  it("usa el máximo como referencia y limita a 0-100", () => {
    expect(getStockFillPercent(10, 5, 20)).toBe(50);
    expect(getStockFillPercent(30, 5, 20)).toBe(100);
    expect(getStockFillPercent(0, 5, 20)).toBe(0);
  });

  it("sin máximo usa el doble del mínimo", () => {
    expect(getStockFillPercent(5, 5, null)).toBe(50);
    expect(getStockFillPercent(1, 0, null)).toBe(100);
  });
});
