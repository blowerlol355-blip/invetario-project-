import { describe, expect, it } from "vitest";

import { productDefaults, productFiltersSchema, productSchema } from "@/features/products/schemas";

const valid = {
  ...productDefaults,
  sku: "her-0001",
  name: "Taladro",
  categoryId: "cat-1",
  costPrice: 10,
  salePrice: 15,
  minStock: 5,
  maxStock: 20,
};

describe("productSchema", () => {
  it("acepta un producto válido", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("exige SKU alfanumérico de 3 a 40 caracteres", () => {
    expect(productSchema.safeParse({ ...valid, sku: "AB" }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, sku: "HER 0001" }).success).toBe(false);
  });

  it("exige categoría y unidad válidas", () => {
    expect(productSchema.safeParse({ ...valid, categoryId: "" }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, unit: "tonelada" }).success).toBe(false);
  });

  it("rechaza precios negativos y cantidades no enteras", () => {
    expect(productSchema.safeParse({ ...valid, costPrice: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, minStock: 1.5 }).success).toBe(false);
  });

  it("devuelve un mensaje claro cuando falta un número", () => {
    const result = productSchema.safeParse({ ...valid, salePrice: undefined });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Ingresa el precio de venta");
  });

  it("permite stock máximo nulo pero no menor que el mínimo", () => {
    expect(productSchema.safeParse({ ...valid, maxStock: null }).success).toBe(true);
    const result = productSchema.safeParse({ ...valid, minStock: 10, maxStock: 5 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["maxStock"]);
  });

  it("acepta URL de imagen vacía o válida", () => {
    expect(productSchema.safeParse({ ...valid, imageUrl: "" }).success).toBe(true);
    expect(productSchema.safeParse({ ...valid, imageUrl: "https://x.com/a.png" }).success).toBe(
      true,
    );
    expect(productSchema.safeParse({ ...valid, imageUrl: "no-url" }).success).toBe(false);
  });
});

describe("productFiltersSchema", () => {
  it("solo acepta UUID y descarta valores inválidos", () => {
    const uuid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    expect(productFiltersSchema.parse({ categoryId: uuid, supplierId: "x" })).toEqual({
      categoryId: uuid,
      supplierId: "",
    });
  });
});
