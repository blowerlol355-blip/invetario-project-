import { describe, expect, it } from "vitest";

import {
  apiMovementBodySchema,
  apiMovementQuerySchema,
  apiProductBodySchema,
  apiProductQuerySchema,
  apiStockQuerySchema,
  toListParams,
} from "@/features/api/schemas";

const uuid = "11111111-1111-4111-8111-111111111111";
const uuid2 = "22222222-2222-4222-8222-222222222222";

describe("esquemas de la API", () => {
  it("aplica valores por defecto y límites de paginación", () => {
    expect(apiProductQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
      q: "",
      order: "asc",
      sort: "name",
      status: "active",
    });
    expect(apiProductQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
    expect(apiProductQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(apiProductQuerySchema.safeParse({ sort: "hack" }).success).toBe(false);
    expect(apiProductQuerySchema.safeParse({ categoryId: "no-uuid" }).success).toBe(false);
  });

  it("traduce la query a ListParams", () => {
    const query = apiProductQuerySchema.parse({ page: "3", pageSize: "50", q: " taladro " });
    expect(toListParams(query)).toEqual({
      page: 3,
      pageSize: 50,
      q: "taladro",
      sort: "name",
      order: "asc",
      status: "active",
    });
  });

  it("convierte includeZero a booleano", () => {
    expect(apiStockQuerySchema.parse({}).includeZero).toBe(false);
    expect(apiStockQuerySchema.parse({ includeZero: "true" }).includeZero).toBe(true);
    expect(apiStockQuerySchema.safeParse({ includeZero: "yes" }).success).toBe(false);
  });

  it("valida el rango de fechas de movimientos", () => {
    expect(apiMovementQuerySchema.parse({}).order).toBe("desc");
    expect(apiMovementQuerySchema.safeParse({ from: "2026-02-01", to: "2026-01-01" }).success).toBe(
      false,
    );
    expect(apiMovementQuerySchema.safeParse({ from: "01/02/2026" }).success).toBe(false);
    expect(apiMovementQuerySchema.safeParse({ type: "IN", productId: uuid }).success).toBe(true);
  });

  it("rellena los opcionales del producto y conserva las reglas del formulario", () => {
    const result = apiProductBodySchema.safeParse({
      sku: "abc-1",
      name: "Producto",
      categoryId: uuid,
      costPrice: 1,
      salePrice: 2,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        barcode: "",
        unit: "unidad",
        minStock: 0,
        maxStock: null,
      });
    }
    expect(
      apiProductBodySchema.safeParse({
        sku: "abc-1",
        name: "Producto",
        categoryId: uuid,
        costPrice: 1,
        salePrice: 2,
        minStock: 10,
        maxStock: 5,
      }).success,
    ).toBe(false);
    expect(apiProductBodySchema.safeParse("texto").success).toBe(false);
  });

  it("valida el cuerpo de movimiento y rechaza claves desconocidas", () => {
    const parsed = apiMovementBodySchema.parse({
      type: "TRANSFER",
      productId: uuid,
      fromWarehouseId: uuid,
      toWarehouseId: uuid2,
      quantity: 3,
    });
    expect(parsed).toMatchObject({ unitCost: null, reason: null, reference: null });

    expect(
      apiMovementBodySchema.safeParse({ type: "IN", productId: uuid, quantity: 0 }).success,
    ).toBe(false);
    expect(
      apiMovementBodySchema.safeParse({ type: "IN", productId: uuid, quantity: 1, extra: 1 })
        .success,
    ).toBe(false);
    expect(
      apiMovementBodySchema.safeParse({
        type: "IN",
        productId: uuid,
        quantity: 1,
        reference: "FAC#1",
      }).success,
    ).toBe(false);
  });
});
