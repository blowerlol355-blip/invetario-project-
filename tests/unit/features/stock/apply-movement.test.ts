import { describe, expect, it } from "vitest";

import {
  applyStockMovement,
  type StockMovementCommand,
  validateMovementCommand,
} from "@/features/stock/lib/apply-movement";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";

import { createFakeDb } from "./fake-db";

const base = {
  products: [{ id: "p1", name: "Taladro", unit: "unidad", isActive: true, avgCost: 10 }],
  warehouses: [
    { id: "cen", name: "Central", isActive: true },
    { id: "nor", name: "Norte", isActive: true },
    { id: "off", name: "Cerrado", isActive: false },
  ],
  stocks: [{ productId: "p1", warehouseId: "cen", quantity: 20 }],
};

function command(overrides: Partial<StockMovementCommand>): StockMovementCommand {
  return {
    type: "IN",
    productId: "p1",
    fromWarehouseId: null,
    toWarehouseId: null,
    quantity: 1,
    unitCost: null,
    reason: null,
    reference: null,
    userId: "u1",
    ...overrides,
  };
}

describe("validateMovementCommand", () => {
  it("exige cantidad entera positiva", () => {
    expect(() =>
      validateMovementCommand(command({ toWarehouseId: "cen", unitCost: 1, quantity: 0 })),
    ).toThrow(BusinessRuleError);
    expect(() =>
      validateMovementCommand(command({ toWarehouseId: "cen", unitCost: 1, quantity: 1.5 })),
    ).toThrow(BusinessRuleError);
  });

  it("valida la combinación de almacenes por tipo", () => {
    expect(() =>
      validateMovementCommand(command({ type: "IN", fromWarehouseId: "cen", unitCost: 1 })),
    ).toThrow(/entrada/);
    expect(() =>
      validateMovementCommand(command({ type: "IN", toWarehouseId: "cen", unitCost: null })),
    ).toThrow(/costo/);
    expect(() => validateMovementCommand(command({ type: "OUT", toWarehouseId: "cen" }))).toThrow(
      /salida/,
    );
    expect(() =>
      validateMovementCommand(command({ type: "TRANSFER", fromWarehouseId: "cen" })),
    ).toThrow(/transferencia/);
    expect(() =>
      validateMovementCommand(
        command({ type: "TRANSFER", fromWarehouseId: "cen", toWarehouseId: "cen" }),
      ),
    ).toThrow(/distinto/);
    expect(() => validateMovementCommand(command({ type: "ADJUSTMENT" }))).toThrow(/exactamente/);
    expect(() =>
      validateMovementCommand(
        command({ type: "ADJUSTMENT", fromWarehouseId: "cen", toWarehouseId: "nor" }),
      ),
    ).toThrow(/exactamente/);
  });

  it("acepta combinaciones válidas", () => {
    expect(() =>
      validateMovementCommand(command({ type: "IN", toWarehouseId: "cen", unitCost: 0 })),
    ).not.toThrow();
    expect(() =>
      validateMovementCommand(command({ type: "OUT", fromWarehouseId: "cen" })),
    ).not.toThrow();
    expect(() =>
      validateMovementCommand(
        command({ type: "TRANSFER", fromWarehouseId: "cen", toWarehouseId: "nor" }),
      ),
    ).not.toThrow();
    expect(() =>
      validateMovementCommand(command({ type: "ADJUSTMENT", fromWarehouseId: "cen" })),
    ).not.toThrow();
  });
});

describe("applyStockMovement", () => {
  it("una entrada suma stock, recalcula el costo promedio y registra el movimiento", async () => {
    const { state, tx } = createFakeDb(base);
    const result = await applyStockMovement(
      tx,
      command({ type: "IN", toWarehouseId: "cen", quantity: 20, unitCost: 20, reference: "FAC-1" }),
    );
    // (20 × 10 + 20 × 20) / 40 = 15
    expect(result.newAverageCost).toBe(15);
    expect(state.products[0]?.avgCost).toBe(15);
    expect(state.stocks).toEqual([{ productId: "p1", warehouseId: "cen", quantity: 40 }]);
    expect(result.balances).toEqual([{ warehouseId: "cen", quantity: 40 }]);
    expect(state.movements).toHaveLength(1);
    expect(state.movements[0]).toMatchObject({
      type: "IN",
      quantity: 20,
      unitCost: 20,
      reference: "FAC-1",
    });
  });

  it("una entrada en un almacén sin registro de stock lo crea", async () => {
    const { state, tx } = createFakeDb(base);
    await applyStockMovement(
      tx,
      command({ type: "IN", toWarehouseId: "nor", quantity: 5, unitCost: 10 }),
    );
    expect(state.stocks).toContainEqual({ productId: "p1", warehouseId: "nor", quantity: 5 });
  });

  it("una salida resta stock y no toca el costo promedio", async () => {
    const { state, tx } = createFakeDb(base);
    const result = await applyStockMovement(
      tx,
      command({ type: "OUT", fromWarehouseId: "cen", quantity: 8 }),
    );
    expect(result.newAverageCost).toBeNull();
    expect(state.products[0]?.avgCost).toBe(10);
    expect(state.stocks[0]?.quantity).toBe(12);
    expect(state.movements[0]).toMatchObject({ type: "OUT", unitCost: null });
  });

  it("rechaza una salida mayor que la existencia con un mensaje claro", async () => {
    const { state, tx } = createFakeDb(base);
    await expect(
      applyStockMovement(tx, command({ type: "OUT", fromWarehouseId: "cen", quantity: 21 })),
    ).rejects.toThrow("Stock insuficiente en Central: hay 20 unidad y se intenta retirar 21.");
    expect(state.stocks[0]?.quantity).toBe(20);
    expect(state.movements).toHaveLength(0);
  });

  it("rechaza una salida de un almacén sin existencia registrada", async () => {
    const { tx } = createFakeDb(base);
    await expect(
      applyStockMovement(tx, command({ type: "OUT", fromWarehouseId: "nor", quantity: 1 })),
    ).rejects.toThrow(/Stock insuficiente en Norte: hay 0/);
  });

  it("una transferencia resta en origen y suma en destino", async () => {
    const { state, tx } = createFakeDb(base);
    const result = await applyStockMovement(
      tx,
      command({ type: "TRANSFER", fromWarehouseId: "cen", toWarehouseId: "nor", quantity: 7 }),
    );
    expect(state.stocks).toEqual([
      { productId: "p1", warehouseId: "cen", quantity: 13 },
      { productId: "p1", warehouseId: "nor", quantity: 7 },
    ]);
    expect(result.balances).toEqual([
      { warehouseId: "cen", quantity: 13 },
      { warehouseId: "nor", quantity: 7 },
    ]);
  });

  it("una transferencia sin stock suficiente no modifica ningún almacén", async () => {
    const { state, tx } = createFakeDb(base);
    await expect(
      applyStockMovement(
        tx,
        command({ type: "TRANSFER", fromWarehouseId: "cen", toWarehouseId: "nor", quantity: 50 }),
      ),
    ).rejects.toThrow(BusinessRuleError);
    expect(state.stocks).toEqual([{ productId: "p1", warehouseId: "cen", quantity: 20 }]);
  });

  it("un ajuste negativo respeta la regla de stock no negativo", async () => {
    const { state, tx } = createFakeDb(base);
    await applyStockMovement(
      tx,
      command({ type: "ADJUSTMENT", fromWarehouseId: "cen", quantity: 3, reason: "Merma" }),
    );
    expect(state.stocks[0]?.quantity).toBe(17);
    await expect(
      applyStockMovement(
        tx,
        command({ type: "ADJUSTMENT", fromWarehouseId: "cen", quantity: 18, reason: "Merma" }),
      ),
    ).rejects.toThrow(/Stock insuficiente/);
  });

  it("un ajuste positivo suma sin cambiar el costo promedio", async () => {
    const { state, tx } = createFakeDb(base);
    await applyStockMovement(
      tx,
      command({ type: "ADJUSTMENT", toWarehouseId: "cen", quantity: 2, reason: "Conteo" }),
    );
    expect(state.stocks[0]?.quantity).toBe(22);
    expect(state.products[0]?.avgCost).toBe(10);
  });

  it("rechaza productos inexistentes o inactivos", async () => {
    const { tx } = createFakeDb({
      ...base,
      products: [{ ...base.products[0]!, isActive: false }],
    });
    await expect(
      applyStockMovement(tx, command({ type: "IN", toWarehouseId: "cen", unitCost: 1 })),
    ).rejects.toThrow(/inactivo/);
    await expect(
      applyStockMovement(
        tx,
        command({ type: "IN", productId: "nope", toWarehouseId: "cen", unitCost: 1 }),
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("rechaza almacenes inexistentes o inactivos", async () => {
    const { tx } = createFakeDb(base);
    await expect(
      applyStockMovement(tx, command({ type: "IN", toWarehouseId: "off", unitCost: 1 })),
    ).rejects.toThrow(/"Cerrado" está inactivo/);
    await expect(
      applyStockMovement(tx, command({ type: "IN", toWarehouseId: "ghost", unitCost: 1 })),
    ).rejects.toThrow(NotFoundError);
  });

  it("si otra transacción consumió el stock, la actualización condicional rechaza el movimiento", async () => {
    const { state, tx } = createFakeDb(base);
    const original = tx.product.findUnique;
    // Simula una lectura desactualizada: la lectura ve 20 pero el stock real cayó a 5.
    tx.product.findUnique = (async (args: unknown) => {
      const product = await original(args as never);
      state.stocks[0]!.quantity = 5;
      return product;
    }) as typeof tx.product.findUnique;

    await expect(
      applyStockMovement(tx, command({ type: "OUT", fromWarehouseId: "cen", quantity: 10 })),
    ).rejects.toThrow(/cambió mientras se registraba/);
    expect(state.stocks[0]?.quantity).toBe(5);
  });
});
