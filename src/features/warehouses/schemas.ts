import { z } from "zod";

export const warehouseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "El código debe tener entre 2 y 10 caracteres")
    .max(10, "El código debe tener entre 2 y 10 caracteres")
    .regex(/^[A-Za-z0-9-]+$/, "Solo letras, números y guiones"),
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar 100 caracteres"),
  address: z.string().trim().max(255, "Máximo 255 caracteres"),
});

export type WarehouseInput = z.infer<typeof warehouseSchema>;

export const warehouseDefaults: WarehouseInput = { code: "", name: "", address: "" };
