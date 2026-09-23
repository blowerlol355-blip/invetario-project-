import { describe, expect, it } from "vitest";

import { planReceipt, type ReceiptOrderItem } from "@/features/purchase-orders/lib/receipt";
import {
  assertCanPerform,
  buildPurchaseOrderCode,
  canPerform,
} from "@/features/purchase-orders/lib/status";
import { BusinessRuleError } from "@/lib/errors";

describe("transiciones de estado", () => {
  it("solo un borrador se edita, envía o cancela; una enviada se recibe o cancela", () => {
    expect(canPerform("DRAFT", "edit")).toBe(true);
    expect(canPerform("DRAFT", "send")).toBe(true);
    expect(canPerform("DRAFT", "receive")).toBe(false);
    expect(canPerform("SENT", "receive")).toBe(true);
    expect(canPerform("SENT", "cancel")).toBe(true);
    expect(canPerform("SENT", "edit")).toBe(false);
    expect(canPerform("PARTIALLY_RECEIVED", "receive")).toBe(true);
    expect(canPerform("PARTIALLY_RECEIVED", "cancel")).toBe(false);
    expect(canPerform("RECEIVED", "receive")).toBe(false);
    expect(canPerform("CANCELLED", "send")).toBe(false);
  });

  it("assertCanPerform lanza un mensaje legible", () => {
    expect(() => assertCanPerform("RECEIVED", "cancel")).toThrow(
      'No se puede cancelar una orden en estado "Recibida".',
    );
    expect(() => assertCanPerform("DRAFT", "send")).not.toThrow();
  });
});

describe("buildPurchaseOrderCode", () => {
  it("empieza en 0001 cuando no hay órdenes en el año", () => {
    expect(buildPurchaseOrderCode(2026, null)).toBe("OC-2026-0001");
    expect(buildPurchaseOrderCode(2026, "OC-2025-0099")).toBe("OC-2026-0001");
  });

  it("incrementa el último correlativo del año", () => {
    expect(buildPurchaseOrderCode(2026, "OC-2026-0012")).toBe("OC-2026-0013");
    expect(buildPurchaseOrderCode(2026, "OC-2026-9999")).toBe("OC-2026-10000");
  });
});

describe("planReceipt", () => {
  const items: ReceiptOrderItem[] = [
    {
      id: "i1",
      productId: "p1",
      productName: "Taladro",
      quantityOrdered: 10,
      quantityReceived: 0,
      unitCost: 100,
    },
    {
      id: "i2",
      productId: "p2",
      productName: "Brocha",
      quantityOrdered: 5,
      quantityReceived: 3,
      unitCost: 2,
    },
  ];

  it("una recepción total deja la orden RECIBIDA", () => {
    const plan = planReceipt(items, [
      { itemId: "i1", quantity: 10 },
      { itemId: "i2", quantity: 2 },
    ]);
    expect(plan.nextStatus).toBe("RECEIVED");
    expect(plan.totalReceived).toBe(12);
    expect(plan.lines.map((l) => l.newQuantityReceived)).toEqual([10, 5]);
  });

  it("una recepción parcial deja la orden PARCIAL e ignora ítems en cero", () => {
    const plan = planReceipt(items, [
      { itemId: "i1", quantity: 4 },
      { itemId: "i2", quantity: 0 },
    ]);
    expect(plan.nextStatus).toBe("PARTIALLY_RECEIVED");
    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0]).toMatchObject({ itemId: "i1", quantity: 4, unitCost: 100 });
  });

  it("completar el último ítem pendiente deja la orden RECIBIDA aunque no se toquen los demás", () => {
    const partiallyDone: ReceiptOrderItem[] = [{ ...items[0]!, quantityReceived: 10 }, items[1]!];
    expect(planReceipt(partiallyDone, [{ itemId: "i2", quantity: 2 }]).nextStatus).toBe("RECEIVED");
  });

  it("rechaza cantidades mayores que lo pendiente", () => {
    expect(() => planReceipt(items, [{ itemId: "i2", quantity: 3 }])).toThrow(
      "Brocha: se intenta recibir 3 pero solo quedan 2 pendientes.",
    );
  });

  it("rechaza ítems ajenos, cantidades inválidas y recepciones vacías", () => {
    expect(() => planReceipt(items, [{ itemId: "zz", quantity: 1 }])).toThrow(BusinessRuleError);
    expect(() => planReceipt(items, [{ itemId: "i1", quantity: -1 }])).toThrow(/inválida/);
    expect(() => planReceipt(items, [{ itemId: "i1", quantity: 1.5 }])).toThrow(/inválida/);
    expect(() => planReceipt(items, [{ itemId: "i1", quantity: 0 }])).toThrow(
      /al menos una cantidad/,
    );
  });
});
