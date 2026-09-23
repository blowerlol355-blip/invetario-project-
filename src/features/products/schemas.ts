import { z } from "zod";

import { PRODUCT_UNITS } from "@/lib/domain";

const money = (label: string) =>
  z
    .number({ error: `Ingresa ${label}` })
    .min(0, `${label} no puede ser negativo`)
    .max(9_999_999_999, `${label} es demasiado alto`);

const integer = (label: string) =>
  z
    .number({ error: `Ingresa ${label}` })
    .int(`${label} debe ser un número entero`)
    .min(0, `${label} no puede ser negativo`)
    .max(1_000_000_000, `${label} es demasiado alto`);

export const productSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(3, "El SKU debe tener entre 3 y 40 caracteres")
      .max(40, "El SKU debe tener entre 3 y 40 caracteres")
      .regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones"),
    barcode: z
      .string()
      .trim()
      .max(50, "Máximo 50 caracteres")
      .regex(/^[A-Za-z0-9-]*$/, "Solo letras, números y guiones"),
    name: z
      .string()
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(200, "El nombre no puede superar 200 caracteres"),
    description: z.string().trim().max(1000, "Máximo 1000 caracteres"),
    categoryId: z.string().min(1, "Selecciona una categoría"),
    supplierId: z.string(),
    unit: z.enum(PRODUCT_UNITS, { error: "Selecciona una unidad" }),
    costPrice: money("el costo"),
    salePrice: money("el precio de venta"),
    minStock: integer("el stock mínimo"),
    maxStock: integer("el stock máximo").nullable(),
    imageUrl: z.union([z.literal(""), z.url("Ingresa una URL válida").max(500)]),
  })
  .refine((value) => value.maxStock === null || value.maxStock >= value.minStock, {
    message: "El stock máximo debe ser mayor o igual al mínimo",
    path: ["maxStock"],
  });

export type ProductInput = z.infer<typeof productSchema>;

export const productDefaults: ProductInput = {
  sku: "",
  barcode: "",
  name: "",
  description: "",
  categoryId: "",
  supplierId: "",
  unit: "unidad",
  costPrice: 0,
  salePrice: 0,
  minStock: 0,
  maxStock: null,
  imageUrl: "",
};

/** Filtros propios del listado de productos (además de los genéricos de ListParams). */
export const productFiltersSchema = z.object({
  categoryId: z.uuid().catch(""),
  supplierId: z.uuid().catch(""),
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;
