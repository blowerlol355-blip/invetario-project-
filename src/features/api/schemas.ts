import { z } from "zod";

import { PRODUCT_SORTS } from "@/features/products/queries";
import { productSchema } from "@/features/products/schemas";
import { MOVEMENT_TYPES } from "@/lib/domain";
import { type ListParams, STATUS_FILTERS } from "@/lib/query-params";

/**
 * Esquemas de la API REST pública (/api/v1). A diferencia de los formularios, aquí
 * los parámetros inválidos NO caen a un valor por defecto: se responde 400 con detalle.
 */

export const API_MAX_PAGE_SIZE = 100;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado: AAAA-MM-DD");

export const apiListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(API_MAX_PAGE_SIZE).default(20),
  q: z.string().trim().max(100).default(""),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export type ApiListQuery = z.infer<typeof apiListSchema>;

/** Traduce la query de la API a los ListParams que usan las consultas del dominio. */
export function toListParams(
  query: ApiListQuery & { sort?: string; status?: ListParams["status"] },
): ListParams {
  return {
    page: query.page,
    pageSize: query.pageSize,
    q: query.q,
    sort: query.sort ?? "",
    order: query.order,
    status: query.status ?? "all",
  };
}

export const apiProductQuerySchema = apiListSchema.extend({
  sort: z.enum(PRODUCT_SORTS).default("name"),
  status: z.enum(STATUS_FILTERS).default("active"),
  categoryId: z.uuid().optional(),
  supplierId: z.uuid().optional(),
});

export const apiStockQuerySchema = apiListSchema.extend({
  productId: z.uuid().optional(),
  warehouseId: z.uuid().optional(),
  includeZero: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export const apiMovementQuerySchema = apiListSchema
  .extend({
    order: z.enum(["asc", "desc"]).default("desc"),
    type: z.enum(MOVEMENT_TYPES).optional(),
    productId: z.uuid().optional(),
    warehouseId: z.uuid().optional(),
    userId: z.uuid().optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "La fecha inicial debe ser anterior o igual a la final",
    path: ["from"],
  });

/**
 * Cuerpo de producto: mismo esquema que el formulario; los campos opcionales pueden
 * omitirse (se normalizan a cadena vacía / null antes de validar).
 */
export const apiProductBodySchema = z.preprocess((value) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return value;
  const body = value as Record<string, unknown>;
  return {
    barcode: "",
    description: "",
    supplierId: "",
    imageUrl: "",
    unit: "unidad",
    minStock: 0,
    maxStock: null,
    ...body,
  };
}, productSchema);

const nullableText = (max: number) => z.string().trim().max(max).nullable().default(null);

/** Cuerpo de movimiento: ya en la convención de la base (from resta, to suma). */
export const apiMovementBodySchema = z
  .object({
    type: z.enum(MOVEMENT_TYPES),
    productId: z.uuid(),
    fromWarehouseId: z.uuid().nullable().default(null),
    toWarehouseId: z.uuid().nullable().default(null),
    quantity: z.number().int().positive().max(1_000_000_000),
    unitCost: z.number().min(0).max(9_999_999_999).nullable().default(null),
    reason: nullableText(255),
    reference: nullableText(60).pipe(
      z
        .string()
        .regex(/^[A-Za-z0-9\-/. ]*$/, "Solo letras, números, guiones, barras y puntos")
        .nullable(),
    ),
  })
  .strict();

export type ApiMovementBody = z.infer<typeof apiMovementBodySchema>;
