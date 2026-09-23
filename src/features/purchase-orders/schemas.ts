import { z } from "zod";

import { PURCHASE_ORDER_STATUSES } from "@/lib/domain";

const isoDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")]);

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  quantityOrdered: z
    .number({ error: "Ingresa la cantidad" })
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor que cero")
    .max(1_000_000_000, "La cantidad es demasiado alta"),
  unitCost: z
    .number({ error: "Ingresa el costo unitario" })
    .min(0, "El costo no puede ser negativo")
    .max(9_999_999_999, "El costo es demasiado alto"),
});

export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;

export const purchaseOrderSchema = z
  .object({
    supplierId: z.string().min(1, "Selecciona un proveedor"),
    warehouseId: z.string().min(1, "Selecciona el almacén de recepción"),
    expectedDate: isoDate,
    notes: z.string().trim().max(1000, "Máximo 1000 caracteres"),
    items: z.array(purchaseOrderItemSchema).min(1, "Agrega al menos un producto"),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (!item.productId) return;
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "productId"],
          message: "Este producto ya está en la orden",
        });
      }
      seen.add(item.productId);
    });
  });

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export const purchaseOrderItemDefaults: PurchaseOrderItemInput = {
  productId: "",
  quantityOrdered: 1,
  unitCost: 0,
};

export const purchaseOrderDefaults: PurchaseOrderInput = {
  supplierId: "",
  warehouseId: "",
  expectedDate: "",
  notes: "",
  items: [purchaseOrderItemDefaults],
};

export const receiveItemsSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z
          .number({ error: "Ingresa una cantidad" })
          .int("Debe ser un número entero")
          .min(0, "No puede ser negativa"),
      }),
    )
    .min(1),
});

export type ReceiveItemsInput = z.infer<typeof receiveItemsSchema>;

/** Filtros del listado (además de los genéricos de ListParams). */
export const purchaseOrderFiltersSchema = z.object({
  status: z.union([z.enum(PURCHASE_ORDER_STATUSES), z.literal("")]).catch(""),
  supplierId: z.uuid().catch(""),
  warehouseId: z.uuid().catch(""),
});

export type PurchaseOrderFilters = z.infer<typeof purchaseOrderFiltersSchema>;
