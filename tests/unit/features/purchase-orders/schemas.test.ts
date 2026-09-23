import { describe, expect, it } from "vitest";

import {
  purchaseOrderFiltersSchema,
  purchaseOrderSchema,
  receiveItemsSchema,
} from "@/features/purchase-orders/schemas";

const valid = {
  supplierId: "s1",
  warehouseId: "w1",
  expectedDate: "2026-10-01",
  notes: "",
  items: [{ productId: "p1", quantityOrdered: 10, unitCost: 5 }],
};

describe("purchaseOrderSchema", () => {
  it("acepta una orden válida", () => {
    expect(purchaseOrderSchema.safeParse(valid).success).toBe(true);
    expect(purchaseOrderSchema.safeParse({ ...valid, expectedDate: "" }).success).toBe(true);
  });

  it("exige proveedor, almacén y al menos un ítem", () => {
    const result = purchaseOrderSchema.safeParse({
      ...valid,
      supplierId: "",
      warehouseId: "",
      items: [],
    });
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toContain("Selecciona un proveedor");
    expect(messages).toContain("Selecciona el almacén de recepción");
    expect(messages).toContain("Agrega al menos un producto");
  });

  it("rechaza productos repetidos y cantidades inválidas", () => {
    const duplicated = purchaseOrderSchema.safeParse({
      ...valid,
      items: [valid.items[0], { productId: "p1", quantityOrdered: 1, unitCost: 1 }],
    });
    expect(duplicated.error?.issues[0]?.path).toEqual(["items", 1, "productId"]);

    const zero = purchaseOrderSchema.safeParse({
      ...valid,
      items: [{ productId: "p1", quantityOrdered: 0, unitCost: 1 }],
    });
    expect(zero.success).toBe(false);
  });

  it("valida el formato de fecha", () => {
    expect(purchaseOrderSchema.safeParse({ ...valid, expectedDate: "01/10/2026" }).success).toBe(
      false,
    );
  });
});

describe("receiveItemsSchema", () => {
  it("acepta cantidades enteras no negativas", () => {
    expect(receiveItemsSchema.safeParse({ items: [{ itemId: "i1", quantity: 0 }] }).success).toBe(
      true,
    );
    expect(receiveItemsSchema.safeParse({ items: [{ itemId: "i1", quantity: -1 }] }).success).toBe(
      false,
    );
    expect(receiveItemsSchema.safeParse({ items: [{ itemId: "i1", quantity: 1.5 }] }).success).toBe(
      false,
    );
  });
});

describe("purchaseOrderFiltersSchema", () => {
  it("normaliza filtros inválidos", () => {
    expect(purchaseOrderFiltersSchema.parse({ status: "OPEN", supplierId: "x" })).toEqual({
      status: "",
      supplierId: "",
      warehouseId: "",
    });
    expect(purchaseOrderFiltersSchema.parse({ status: "SENT" }).status).toBe("SENT");
  });
});
