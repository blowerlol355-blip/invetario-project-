import { describe, expect, it } from "vitest";

import { calculateWeightedAverageCost, roundCost } from "@/features/stock/lib/average-cost";

describe("calculateWeightedAverageCost", () => {
  it("usa el costo de la entrada cuando no hay existencia previa", () => {
    expect(calculateWeightedAverageCost(0, 0, 10, 12.5)).toBe(12.5);
  });

  it("ignora un promedio previo si la existencia es cero o negativa", () => {
    expect(calculateWeightedAverageCost(0, 99, 5, 4)).toBe(4);
    expect(calculateWeightedAverageCost(-3, 99, 5, 4)).toBe(4);
  });

  it("pondera por cantidades", () => {
    // (10 × 10 + 10 × 20) / 20 = 15
    expect(calculateWeightedAverageCost(10, 10, 10, 20)).toBe(15);
    // (30 × 8 + 10 × 12) / 40 = 9
    expect(calculateWeightedAverageCost(30, 8, 10, 12)).toBe(9);
  });

  it("redondea a 4 decimales", () => {
    // (1 × 1 + 2 × 2) / 3 = 1.6666...
    expect(calculateWeightedAverageCost(1, 1, 2, 2)).toBe(1.6667);
  });

  it("no cambia el promedio si la entrada tiene el mismo costo", () => {
    expect(calculateWeightedAverageCost(50, 7.25, 25, 7.25)).toBe(7.25);
  });

  it("rechaza cantidades entrantes no positivas", () => {
    expect(() => calculateWeightedAverageCost(10, 5, 0, 5)).toThrow(RangeError);
    expect(() => calculateWeightedAverageCost(10, 5, -1, 5)).toThrow(RangeError);
  });

  it("rechaza costos negativos", () => {
    expect(() => calculateWeightedAverageCost(10, 5, 1, -0.01)).toThrow(RangeError);
  });
});

describe("roundCost", () => {
  it("redondea a 4 decimales por defecto", () => {
    expect(roundCost(1.23456)).toBe(1.2346);
    expect(roundCost(1.00005)).toBe(1.0001);
  });

  it("acepta otra cantidad de decimales", () => {
    expect(roundCost(19.995, 2)).toBe(20);
  });
});
