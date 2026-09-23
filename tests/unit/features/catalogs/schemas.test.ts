import { describe, expect, it } from "vitest";

import { categorySchema } from "@/features/categories/schemas";
import { supplierSchema } from "@/features/suppliers/schemas";
import { warehouseSchema } from "@/features/warehouses/schemas";

describe("categorySchema", () => {
  it("recorta espacios y exige nombre de 2 a 80 caracteres", () => {
    expect(categorySchema.parse({ name: "  Pinturas ", description: "" }).name).toBe("Pinturas");
    expect(categorySchema.safeParse({ name: "P", description: "" }).success).toBe(false);
    expect(categorySchema.safeParse({ name: "x".repeat(81), description: "" }).success).toBe(false);
  });
});

describe("supplierSchema", () => {
  const base = { name: "Proveedor", contactName: "", email: "", phone: "", address: "", taxId: "" };

  it("acepta correo vacío y valida el formato si se indica", () => {
    expect(supplierSchema.safeParse(base).success).toBe(true);
    expect(supplierSchema.safeParse({ ...base, email: "ventas@acme.com" }).success).toBe(true);
    expect(supplierSchema.safeParse({ ...base, email: "no-es-correo" }).success).toBe(false);
  });

  it("restringe los caracteres de teléfono e identificación fiscal", () => {
    expect(supplierSchema.safeParse({ ...base, phone: "+51 (1) 555-0192" }).success).toBe(true);
    expect(supplierSchema.safeParse({ ...base, phone: "llámame" }).success).toBe(false);
    expect(supplierSchema.safeParse({ ...base, taxId: "30-71234567-9" }).success).toBe(true);
    expect(supplierSchema.safeParse({ ...base, taxId: "30/71" }).success).toBe(false);
  });
});

describe("warehouseSchema", () => {
  it("exige un código alfanumérico de 2 a 10 caracteres", () => {
    expect(warehouseSchema.safeParse({ code: "CEN", name: "Central", address: "" }).success).toBe(
      true,
    );
    expect(warehouseSchema.safeParse({ code: "C", name: "Central", address: "" }).success).toBe(
      false,
    );
    expect(
      warehouseSchema.safeParse({ code: "CEN TRAL", name: "Central", address: "" }).success,
    ).toBe(false);
  });
});
