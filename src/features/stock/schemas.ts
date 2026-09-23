import { z } from "zod";

import { MOVEMENT_TYPES, type MovementType } from "@/lib/domain";

export const ADJUSTMENT_DIRECTIONS = ["increase", "decrease"] as const;
export type AdjustmentDirection = (typeof ADJUSTMENT_DIRECTIONS)[number];

export const ADJUSTMENT_DIRECTION_LABELS: Record<AdjustmentDirection, string> = {
  increase: "Aumentar existencia",
  decrease: "Disminuir existencia",
};

/**
 * Formulario de movimiento. Los tres campos de almacén existen siempre para que el
 * tipo de entrada y salida coincidan (React Hook Form); `superRefine` exige los que
 * correspondan a cada tipo.
 */
export const movementSchema = z
  .object({
    type: z.enum(MOVEMENT_TYPES, { error: "Selecciona el tipo de movimiento" }),
    productId: z.string().min(1, "Selecciona un producto"),
    /** Origen (salidas y transferencias). */
    fromWarehouseId: z.string(),
    /** Destino (entradas y transferencias). */
    toWarehouseId: z.string(),
    /** Almacén afectado por un ajuste. */
    warehouseId: z.string(),
    adjustmentDirection: z.enum(ADJUSTMENT_DIRECTIONS),
    quantity: z
      .number({ error: "Ingresa la cantidad" })
      .int("La cantidad debe ser un número entero")
      .positive("La cantidad debe ser mayor que cero")
      .max(1_000_000_000, "La cantidad es demasiado alta"),
    unitCost: z
      .number({ error: "Ingresa el costo unitario" })
      .min(0, "El costo no puede ser negativo")
      .max(9_999_999_999, "El costo es demasiado alto")
      .nullable(),
    reason: z.string().trim().max(255, "Máximo 255 caracteres"),
    reference: z
      .string()
      .trim()
      .max(60, "Máximo 60 caracteres")
      .regex(/^[A-Za-z0-9\-/. ]*$/, "Solo letras, números, guiones, barras y puntos"),
  })
  .superRefine((value, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    switch (value.type) {
      case "IN":
        if (!value.toWarehouseId) issue("toWarehouseId", "Selecciona el almacén de destino");
        if (value.unitCost === null) issue("unitCost", "Ingresa el costo unitario de la entrada");
        break;
      case "OUT":
        if (!value.fromWarehouseId) issue("fromWarehouseId", "Selecciona el almacén de origen");
        break;
      case "TRANSFER":
        if (!value.fromWarehouseId) issue("fromWarehouseId", "Selecciona el almacén de origen");
        if (!value.toWarehouseId) issue("toWarehouseId", "Selecciona el almacén de destino");
        if (value.fromWarehouseId && value.fromWarehouseId === value.toWarehouseId) {
          issue("toWarehouseId", "El almacén de destino debe ser distinto del de origen");
        }
        break;
      case "ADJUSTMENT":
        if (!value.warehouseId) issue("warehouseId", "Selecciona el almacén a ajustar");
        if (!value.reason) issue("reason", "Indica el motivo del ajuste");
        break;
    }
  });

export type MovementInput = z.infer<typeof movementSchema>;

export function movementDefaults(type: MovementType = "IN", productId = ""): MovementInput {
  return {
    type,
    productId,
    fromWarehouseId: "",
    toWarehouseId: "",
    warehouseId: "",
    adjustmentDirection: "increase",
    quantity: 1,
    unitCost: type === "IN" ? 0 : null,
    reason: "",
    reference: "",
  };
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .catch("");

/** Filtros del historial de movimientos (además de los genéricos de ListParams). */
export const movementFiltersSchema = z.object({
  type: z.union([z.enum(MOVEMENT_TYPES), z.literal("")]).catch(""),
  warehouseId: z.uuid().catch(""),
  productId: z.uuid().catch(""),
  userId: z.uuid().catch(""),
  from: isoDate,
  to: isoDate,
});

export type MovementFilters = z.infer<typeof movementFiltersSchema>;
