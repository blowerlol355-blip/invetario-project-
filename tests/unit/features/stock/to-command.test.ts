import { describe, expect, it } from "vitest";

import { toMovementCommand } from "@/features/stock/lib/to-command";
import { movementDefaults } from "@/features/stock/schemas";

describe("toMovementCommand", () => {
  it("una entrada usa solo destino y conserva el costo", () => {
    const command = toMovementCommand(
      { ...movementDefaults("IN", "p1"), toWarehouseId: "w1", unitCost: 12.5, reference: "fac-1" },
      "u1",
    );
    expect(command).toMatchObject({
      type: "IN",
      fromWarehouseId: null,
      toWarehouseId: "w1",
      unitCost: 12.5,
      reference: "FAC-1",
      userId: "u1",
    });
  });

  it("una salida usa solo origen y descarta el costo", () => {
    const command = toMovementCommand(
      { ...movementDefaults("OUT", "p1"), fromWarehouseId: "w1", unitCost: 9 },
      "u1",
    );
    expect(command).toMatchObject({ fromWarehouseId: "w1", toWarehouseId: null, unitCost: null });
  });

  it("una transferencia usa ambos almacenes", () => {
    const command = toMovementCommand(
      { ...movementDefaults("TRANSFER", "p1"), fromWarehouseId: "w1", toWarehouseId: "w2" },
      "u1",
    );
    expect(command).toMatchObject({ fromWarehouseId: "w1", toWarehouseId: "w2" });
  });

  it("un ajuste elige origen o destino según el sentido", () => {
    const base = { ...movementDefaults("ADJUSTMENT", "p1"), warehouseId: "w1", reason: "Conteo" };
    expect(toMovementCommand({ ...base, adjustmentDirection: "increase" }, "u1")).toMatchObject({
      fromWarehouseId: null,
      toWarehouseId: "w1",
    });
    expect(toMovementCommand({ ...base, adjustmentDirection: "decrease" }, "u1")).toMatchObject({
      fromWarehouseId: "w1",
      toWarehouseId: null,
    });
  });

  it("convierte motivo y referencia vacíos en null", () => {
    const command = toMovementCommand(
      { ...movementDefaults("OUT", "p1"), fromWarehouseId: "w1" },
      "u1",
    );
    expect(command.reason).toBeNull();
    expect(command.reference).toBeNull();
  });
});
