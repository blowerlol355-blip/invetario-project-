import { describe, expect, it } from "vitest";

import { movementDefaults, movementFiltersSchema, movementSchema } from "@/features/stock/schemas";

function messages(input: unknown): Record<string, string> {
  const result = movementSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("movementSchema", () => {
  it("una entrada exige destino y costo unitario", () => {
    const errors = messages({ ...movementDefaults("IN", "p1"), unitCost: null });
    expect(errors.toWarehouseId).toBe("Selecciona el almacén de destino");
    expect(errors.unitCost).toBe("Ingresa el costo unitario de la entrada");
    expect(
      movementSchema.safeParse({
        ...movementDefaults("IN", "p1"),
        toWarehouseId: "w1",
        unitCost: 5,
      }).success,
    ).toBe(true);
  });

  it("una salida exige origen", () => {
    expect(messages(movementDefaults("OUT", "p1")).fromWarehouseId).toBe(
      "Selecciona el almacén de origen",
    );
    expect(
      movementSchema.safeParse({ ...movementDefaults("OUT", "p1"), fromWarehouseId: "w1" }).success,
    ).toBe(true);
  });

  it("una transferencia exige origen y destino distintos", () => {
    const errors = messages({
      ...movementDefaults("TRANSFER", "p1"),
      fromWarehouseId: "w1",
      toWarehouseId: "w1",
    });
    expect(errors.toWarehouseId).toBe("El almacén de destino debe ser distinto del de origen");
  });

  it("un ajuste exige almacén y motivo", () => {
    const errors = messages(movementDefaults("ADJUSTMENT", "p1"));
    expect(errors.warehouseId).toBe("Selecciona el almacén a ajustar");
    expect(errors.reason).toBe("Indica el motivo del ajuste");
  });

  it("exige producto y cantidad entera positiva", () => {
    const errors = messages({ ...movementDefaults("OUT", ""), fromWarehouseId: "w1", quantity: 0 });
    expect(errors.productId).toBe("Selecciona un producto");
    expect(errors.quantity).toBe("La cantidad debe ser mayor que cero");
    expect(
      messages({ ...movementDefaults("OUT", "p1"), fromWarehouseId: "w1", quantity: 2.5 }).quantity,
    ).toBe("La cantidad debe ser un número entero");
  });

  it("restringe los caracteres de la referencia", () => {
    expect(
      messages({
        ...movementDefaults("OUT", "p1"),
        fromWarehouseId: "w1",
        reference: "FAC/2026-001",
      }),
    ).toEqual({});
    expect(
      messages({ ...movementDefaults("OUT", "p1"), fromWarehouseId: "w1", reference: "FAC#1" })
        .reference,
    ).toBeDefined();
  });
});

describe("movementFiltersSchema", () => {
  it("normaliza filtros inválidos a vacío", () => {
    expect(
      movementFiltersSchema.parse({ type: "SALE", warehouseId: "x", from: "2026-1-1", to: "" }),
    ).toEqual({
      type: "",
      warehouseId: "",
      productId: "",
      userId: "",
      from: "",
      to: "",
    });
  });

  it("acepta filtros válidos", () => {
    const uuid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    expect(
      movementFiltersSchema.parse({
        type: "OUT",
        warehouseId: uuid,
        from: "2026-09-01",
        to: "2026-09-30",
      }),
    ).toMatchObject({
      type: "OUT",
      warehouseId: uuid,
      from: "2026-09-01",
      to: "2026-09-30",
    });
  });
});
