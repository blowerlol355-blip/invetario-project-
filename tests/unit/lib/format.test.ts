import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatDateTime,
  formatInteger,
  formatShortDate,
  getInitials,
} from "@/lib/format";

describe("formateadores", () => {
  it("usa el formato de fecha sudamericano dd/MM/yyyy", () => {
    expect(formatShortDate(new Date(2026, 2, 5))).toBe("05/03/2026");
    expect(formatDateTime(new Date(2026, 11, 24, 9, 7))).toBe("24/12/2026 09:07");
  });

  it("devuelve cadena vacía para fechas inválidas", () => {
    expect(formatShortDate("no-es-fecha")).toBe("");
  });

  it("formatea moneda en dólares", () => {
    const formatted = formatCurrency(1234.5);
    expect(formatted).toContain("1,234.50");
    expect(formatted).toMatch(/\$/);
  });

  it("acepta decimales de Prisma (objetos con toString)", () => {
    expect(formatCurrency({ toString: () => "99.999" })).toContain("100.00");
  });

  it("formatea enteros con separador de miles", () => {
    expect(formatInteger(1234567)).toBe("1,234,567");
  });

  it("calcula iniciales", () => {
    expect(getInitials("Ana Torres")).toBe("AT");
    expect(getInitials("  luis  ")).toBe("L");
    expect(getInitials("Carla María Rojas")).toBe("CM");
  });
});
